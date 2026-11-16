/* Home hero: an AI agent works through the night, 18:00 to 08:00, then reports in the morning. */
(function () {
  var root = document.querySelector('.hn');
  if (!root) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function $(s) { return root.querySelector(s); }

  // split the headline into masked words
  (function split(el) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'hn-w';
            var s = document.createElement('span'); s.textContent = tok; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  })($('.hn-h'));

  var cam = $('.hn-cam'), stage = $('.hn-stage'), timeEl = $('.hn-time'), inbox = $('.hn-inbox'), subj = $('.hn-subj'),
      fields = $('.hn-fields'), status = $('.hn-status'), beam = $('.hn-beam'), rows = $('.hn-rows'), toast = $('.hn-toast'),
      packet = $('.hn-packet'), morning = $('.hn-morning'), conf = $('.hn-conf i'), dusk = $('.hn-sky-dusk'), dawn = $('.hn-sky-dawn'),
      starsCv = $('.hn-stars'), dial = $('.hn-dial');
  var tallyEls = {};
  [].forEach.call(root.querySelectorAll('.hn-tally b'), function (b) { tallyEls[b.getAttribute('data-k')] = b; });
  var panels = [].map.call(root.querySelectorAll('.hn-panel'), function (p) {
    var v = p.getAttribute('data-pos').split(',').map(Number);
    p.style.transform = 'translate(-50%,-50%) translate3d(' + v[0] + 'px,' + v[1] + 'px,' + v[2] + 'px)';
    return { x: v[0], y: v[1], z: v[2] };
  });
  var JOBS = [
    { k: 'order', from: 'Baltic Timber UAB', ini: 'BT', s: 'Order PO-2291: 40 pallets', f: [['Customer', 'Baltic Timber'], ['Product', 'Pine 45×95'], ['Quantity', '40 pallets'], ['Delivery', 'Thu 07:00']], tag: ['hn-t-order', 'ORDER'], ref: 'PO-2291', who: 'Baltic Timber', val: '€ 6 480', toast: 'Order entered in ERP', c: 96 },
    { k: 'reply', from: 'Rūta Kazlauskienė', ini: 'RK', s: 'Where is my order #8812?', f: [['Intent', 'Order status'], ['Order', '#8812'], ['Status', 'Shipped, DPD'], ['Language', 'Lithuanian']], tag: ['hn-t-reply', 'REPLY'], ref: '#8812', who: 'Rūta K.', val: 'sent', toast: 'Answer sent in Lithuanian', c: 93 },
    { k: 'invoice', from: 'Statybų prekės UAB', ini: 'SP', s: 'Invoice INV-7781.pdf', f: [['Supplier', 'Statybų prekės'], ['Amount', '€ 1 214,60'], ['Due', '28 Nov'], ['Matched to', 'PO-2240']], tag: ['hn-t-invoice', 'INVOICE'], ref: 'INV-7781', who: 'Statybų prekės', val: '€ 1 214,60', toast: 'Invoice booked and matched', c: 98 },
    { k: 'order', from: 'Nordic Steel AB', ini: 'NS', s: 'Re: rebar for Friday, 12 t', f: [['Customer', 'Nordic Steel'], ['Product', 'Rebar Ø12'], ['Quantity', '12 t'], ['Delivery', 'Fri 06:30']], tag: ['hn-t-order', 'ORDER'], ref: 'PO-2292', who: 'Nordic Steel', val: '€ 9 960', toast: 'Order entered in ERP', c: 91 },
    { k: 'handed', from: 'unknown@gmail.com', ini: '?', s: 'Re: re: the thing we discussed', f: [['Intent', 'Unclear'], ['Customer', 'Not found'], ['Confidence', '41%'], ['Action', 'Ask a person']], tag: ['hn-t-hand', 'HANDOVER'], ref: 'n/a', who: 'For Rasa, 08:00', val: 'note', toast: 'Not sure, so it waits for Rasa', c: 41 },
    { k: 'reply', from: 'Jonas Petraitis', ini: 'JP', s: 'Can I change the delivery address?', f: [['Intent', 'Change address'], ['Order', '#8790'], ['New address', 'Kaunas, Savanorių 12'], ['Updated', 'Yes']], tag: ['hn-t-reply', 'REPLY'], ref: '#8790', who: 'Jonas P.', val: 'sent', toast: 'Address changed, customer told', c: 94 },
    { k: 'invoice', from: 'Krovinių linija UAB', ini: 'KL', s: 'October freight invoice', f: [['Supplier', 'Krovinių linija'], ['Amount', '€ 3 412,80'], ['Due', '30 Nov'], ['Matched to', '212 shipments']], tag: ['hn-t-invoice', 'INVOICE'], ref: 'INV-10/24', who: 'Krovinių linija', val: '€ 3 412,80', toast: 'Invoice checked line by line', c: 97 }
  ];
  function fmt(min) { var m = (18 * 60 + Math.floor(min)) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  var raf = 0, timers = [], sim = 0, last = 0, t0 = 0, ji = 0, paused = false, tally, mx = 0, my = 0, cx = 0, cy = 0, scale = 1, visible = false, jobsOn = false;
  function T(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

  function drawStars() {
    var r = root.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    starsCv.width = r.width * d; starsCv.height = r.height * d; var c = starsCv.getContext('2d'); c.scale(d, d);
    for (var i = 0; i < 180; i++) { c.globalAlpha = Math.random() * .7 + .15; c.fillStyle = Math.random() < .1 ? '#c5f07a' : '#fff'; c.beginPath(); c.arc(Math.random() * r.width, Math.random() * r.height * .7, Math.random() * 1.3 + .2, 0, 7); c.fill(); }
  }
  var dialPath, dialProg, dialDots, dialLen = 0;
  function buildDial() {
    var w = root.clientWidth, h = 110, s = '';
    dial.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var d = 'M 24 ' + (h - 36) + ' Q ' + (w / 2) + ' -30 ' + (w - 24) + ' ' + (h - 36);
    s += '<defs><linearGradient id="hn-dg" x1="0" x2="1"><stop offset="0" stop-color="#c5f07a" stop-opacity=".1"/><stop offset="1" stop-color="#c5f07a"/></linearGradient><radialGradient id="hn-moon"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#e9ffc4"/><stop offset="1" stop-color="#c5f07a" stop-opacity="0"/></radialGradient></defs>';
    s += '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/><path class="hn-dp" d="' + d + '" fill="none" stroke="url(#hn-dg)" stroke-width="1.5"/>';
    dial.innerHTML = s; dialPath = dial.querySelector('path'); dialLen = dialPath.getTotalLength(); dialProg = dial.querySelector('.hn-dp');
    dialProg.style.strokeDasharray = dialLen;
    var ticks = '';
    for (var i = 0; i <= 14; i++) {
      var p = dialPath.getPointAtLength(dialLen * i / 14), hr = (18 + i) % 24;
      ticks += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (i % 2 ? 1.2 : 2) + '" fill="rgba(255,255,255,' + (i % 2 ? .25 : .5) + ')"/>';
      if (i % 2 === 0 && (w > 600 || i % 4 === 0)) ticks += '<text x="' + p.x + '" y="' + (p.y + 17) + '" text-anchor="middle">' + ('0' + hr).slice(-2) + ':00</text>';
    }
    dial.insertAdjacentHTML('beforeend', ticks + '<circle class="hn-dd" r="14" fill="url(#hn-moon)"/><circle class="hn-dd" r="3.5" fill="#fff"/>');
    dialDots = dial.querySelectorAll('.hn-dd');
  }
  function setTally(k, v) { var el = tallyEls[k]; if (+el.textContent !== v) { el.textContent = v; el.classList.remove('hn-bump'); void el.offsetWidth; el.classList.add('hn-bump'); } }
  function mailRow(j, time, isNew) {
    var d = document.createElement('div'); d.className = 'hn-mail' + (isNew ? ' hn-new' : '');
    d.innerHTML = '<span class="hn-av"></span><div><b></b><em></em></div><time></time>';
    d.querySelector('.hn-av').textContent = j.ini; d.querySelector('b').textContent = j.from; d.querySelector('em').textContent = j.s; d.querySelector('time').textContent = time; return d;
  }
  function erpRow(j, isNew) {
    var d = document.createElement('div'); d.className = 'hn-row' + (isNew ? ' hn-new' : '');
    d.innerHTML = '<span class="hn-tag ' + j.tag[0] + '">' + j.tag[1] + '</span><span class="hn-ref"></span><span class="hn-who"></span><span class="hn-num"></span>';
    d.querySelector('.hn-ref').textContent = j.ref; d.querySelector('.hn-who').textContent = j.who; d.querySelector('.hn-num').textContent = j.val; return d;
  }
  function showFields(j, typed) {
    fields.innerHTML = '';
    j.f.forEach(function (lv, i) {
      var f = document.createElement('div'); f.className = 'hn-f'; f.innerHTML = '<small></small><span></span>';
      f.querySelector('small').textContent = lv[0]; var sp = f.querySelector('span'), v = lv[1]; fields.appendChild(f);
      if (!typed) { sp.textContent = v; return; }
      T(function () {
        sp.classList.add('hn-caret'); var n = 0;
        (function step() { sp.textContent = v.slice(0, ++n); if (n < v.length) T(step, 24); else T(function () { sp.classList.remove('hn-caret'); }, 120); })();
      }, i * 230);
    });
  }
  function fly(a, b, ms) {
    if (RM || !packet.animate) return;
    packet.animate([
      { transform: 'translate3d(' + a.x + 'px,' + a.y + 'px,' + (a.z + 20) + 'px) scale(.4)', opacity: 0 },
      { transform: 'translate3d(' + a.x + 'px,' + a.y + 'px,' + (a.z + 20) + 'px) scale(1)', opacity: 1, offset: .15 },
      { transform: 'translate3d(' + b.x + 'px,' + b.y + 'px,' + (b.z + 20) + 'px) scale(1)', opacity: 1, offset: .85 },
      { transform: 'translate3d(' + b.x + 'px,' + b.y + 'px,' + (b.z + 20) + 'px) scale(1.8)', opacity: 0 }
    ], { duration: ms, easing: 'cubic-bezier(.5,0,.3,1)' });
  }
  function seed() {
    inbox.innerHTML = ''; rows.innerHTML = '';
    [[JOBS[2], '17:52'], [JOBS[1], '17:40'], [JOBS[0], '17:31']].forEach(function (x) { inbox.appendChild(mailRow(x[0], x[1])); });
    [{ tag: ['hn-t-order', 'ORDER'], ref: 'PO-2290', who: 'Baltic Timber', val: '€ 3 890' }, { tag: ['hn-t-reply', 'REPLY'], ref: '#8807', who: 'Agnė M.', val: 'sent' }, { tag: ['hn-t-invoice', 'INVOICE'], ref: 'INV-7779', who: 'Elektros tinklai', val: '€ 742,10' }].forEach(function (j) { rows.appendChild(erpRow(j)); });
    subj.textContent = 'Order PO-2290: 24 pallets';
    showFields({ f: [['Customer', 'Baltic Timber'], ['Product', 'Pine 45×95'], ['Quantity', '24 pallets'], ['Delivery', 'Wed 07:00']] }, false);
    conf.style.width = '95%'; conf.classList.remove('hn-low'); status.textContent = 'DONE'; status.classList.remove('hn-warn');
    tally = { orders: 0, replies: 0, invoices: 0, handed: 0 }; Object.keys(tally).forEach(function (k) { tallyEls[k].textContent = 0; });
  }
  function job() {
    if (!visible || paused) { jobsOn = false; return; }
    jobsOn = true;
    var j = JOBS[ji++ % JOBS.length], P = panels;
    var mr = mailRow(j, fmt(sim), true); inbox.insertBefore(mr, inbox.firstChild);
    while (inbox.children.length > 4) inbox.removeChild(inbox.lastChild);
    [].forEach.call(inbox.children, function (m) { m.classList.toggle('hn-active', m === mr); });
    T(function () { fly(P[0], P[1], 700); }, 250);
    T(function () {
      subj.textContent = j.s; status.textContent = 'READING'; status.classList.remove('hn-warn');
      conf.style.width = '0'; conf.classList.toggle('hn-low', j.c < 60);
      beam.classList.remove('hn-go'); void beam.offsetWidth; beam.classList.add('hn-go');
      showFields(j, true);
    }, 850);
    T(function () { conf.style.width = j.c + '%'; status.textContent = j.k === 'handed' ? 'ASKING A PERSON' : (j.k === 'reply' ? 'REPLYING' : 'ENTERING'); status.classList.toggle('hn-warn', j.k === 'handed'); }, 2000);
    T(function () { fly(P[1], P[2], 700); }, 2300);
    T(function () {
      rows.insertBefore(erpRow(j, true), rows.firstChild); while (rows.children.length > 4) rows.removeChild(rows.lastChild);
      toast.querySelector('span').textContent = j.toast; toast.classList.add('hn-show'); T(function () { toast.classList.remove('hn-show'); }, 1500);
      if (j.k === 'order') tally.orders += 1 + Math.floor(Math.random() * 3);
      if (j.k === 'reply') tally.replies += 2 + Math.floor(Math.random() * 5);
      if (j.k === 'invoice') tally.invoices += 1 + Math.floor(Math.random() * 2);
      if (j.k === 'handed') tally.handed += 1;
      Object.keys(tally).forEach(function (k) { setTally(k, tally[k]); });
    }, 2950);
    T(job, 3500);
  }
  function showMorning() {
    paused = true;
    [].forEach.call(root.querySelectorAll('[data-m]'), function (b) { b.textContent = tally[b.getAttribute('data-m')]; });
    morning.classList.add('hn-show');
    T(restart, 9000);
  }
  function restart() {
    timers.forEach(clearTimeout); timers = []; jobsOn = false;
    morning.classList.remove('hn-show'); paused = false; sim = 0; seed(); T(job, 600);
  }
  function frame(now) {
    raf = 0; if (!visible) return;
    var dt = Math.min(250, now - (last || now)); last = now;
    var e = easeIO(RM ? 1 : clamp((now - t0) / 2300, 0, 1));
    cx += (mx - cx) * .06; cy += (my - cy) * .06;
    var mob = stage.clientWidth < 600;
    var rx = lerp(64, mob ? 18 : 9, e) - cy * 7, ry = lerp(0, mob ? -6 : -21, e) + cx * (mob ? 4 : 12), rz = lerp(-26, 0, e), tz = lerp(-380, mob ? -60 : 0, e);
    cam.style.transform = 'scale(' + scale + ') translateZ(' + tz + 'px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) rotateZ(' + rz + 'deg)';
    if (!paused) { sim += dt * (RM ? .006 : .0165); if (sim >= 840) { sim = 840; showMorning(); } }
    timeEl.textContent = fmt(sim);
    dusk.style.opacity = clamp(1 - sim / 160, 0, 1);
    dawn.style.opacity = clamp((sim - 690) / 150, 0, 1);
    starsCv.style.opacity = clamp(Math.min(sim / 120, (840 - sim) / 140), 0, 1) * .9;
    if (dialLen) {
      var fr = sim / 840, p = dialPath.getPointAtLength(dialLen * fr);
      dialProg.style.strokeDashoffset = dialLen * (1 - fr);
      [].forEach.call(dialDots, function (c) { c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); });
    }
    raf = requestAnimationFrame(frame);
  }
  function fit() { scale = clamp(stage.clientWidth / 720, .36, 1.08) * (stage.clientWidth < 600 ? .86 : 1); drawStars(); buildDial(); }
  function setVisible(v) {
    visible = v;
    if (v) { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } if (!jobsOn && !paused) T(job, 400); }
  }
  root.addEventListener('pointermove', function (e) { var r = root.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2; });
  [].forEach.call(root.querySelectorAll('.hn-replay'), function (b) { b.addEventListener('click', restart); });
  window.addEventListener('resize', fit);
  fit(); seed(); t0 = performance.now();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { setVisible(en[0].isIntersecting); }).observe(root);
  else setVisible(true);
  requestAnimationFrame(function () { root.classList.add('hn-on'); });
})();
