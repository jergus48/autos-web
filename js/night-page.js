/* Homepage below the hero: starry sky, time rail, reveals, counters, scroll scenes. */
(function () {
  var root = document.getElementById('nx');
  if (!root) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function $$(s, el) { return [].slice.call((el || root).querySelectorAll(s)); }
  var hero = document.querySelector('.hn');
  var nav = document.querySelector('.vex-nav');

  /* ---- split headings into words ---- */
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'nx-w';
            var s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
            w.appendChild(s); f.appendChild(w);
          });
          n.parentNode.replaceChild(f, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  });

  /* ---- scroll-scrubbed statement ---- */
  var scrub = root.querySelector('[data-scrub]'), scrubWords = [];
  if (scrub) {
    var hl = (scrub.getAttribute('data-hl') || '').split(',');
    var words = scrub.textContent.trim().split(/\s+/); scrub.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'sw' + (hl.indexOf(w) > -1 ? ' hl' : ''); s.textContent = w;
      scrub.appendChild(s); if (i < words.length - 1) scrub.appendChild(document.createTextNode(' ')); scrubWords.push(s);
    });
  }

  /* ---- week bars ---- */
  var weekCells = [];
  $$('.nx-hours').forEach(function (row) {
    var m = row.getAttribute('data-m').split(',').map(Number);
    for (var h = 0; h < 8; h++) { var c = document.createElement('i'); if (m.indexOf(h) > -1) { c.className = 'm'; weekCells.push(c); } row.appendChild(c); }
  });
  var weekDone = false;
  function runWeek() {
    if (weekDone) return; weekDone = true;
    var saved = root.querySelector('.nx-saved'), n = 0;
    weekCells.forEach(function (c, i) {
      setTimeout(function () { c.className = 'a'; n += 1; saved.textContent = n; }, RM ? 0 : 600 + i * 170);
    });
  }

  /* ---- counters ---- */
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    var to = +el.getAttribute('data-count'), t0 = performance.now(), dur = RM ? 1 : 1600;
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---- reveal on view ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; el.classList.add('is-in');
      $$('[data-count]', el).forEach(count);
      if (el.classList.contains('nx-week')) runWeek();
      io.unobserve(el);
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-rv]').forEach(function (el) { io.observe(el); });
  $$('.nx-report').forEach(function (el) { io.observe(el); });

  /* ---- mini demos play only while visible ---- */
  var playIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { en.target.classList.toggle('is-play', en.isIntersecting); });
  }, { threshold: .3 });
  $$('.nx-agent').forEach(function (el) { playIO.observe(el); });

  /* ---- tilt + spotlight ---- */
  if (!RM && matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', (x * 100) + '%'); el.style.setProperty('--my', (y * 100) + '%');
        el.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---- FAQ accordion ---- */
  $$('.nx-q').forEach(function (q) {
    var btn = q.querySelector('button'), a = q.querySelector('.nx-a');
    btn.addEventListener('click', function () {
      var open = !q.classList.contains('open');
      if (open) { a.style.height = a.scrollHeight + 'px'; q.classList.add('open'); }
      else { a.style.height = a.scrollHeight + 'px'; void a.offsetHeight; a.style.height = '0px'; q.classList.remove('open'); }
      btn.setAttribute('aria-expanded', open);
    });
    a.addEventListener('transitionend', function () { if (q.classList.contains('open')) a.style.height = 'auto'; });
  });

  /* ---- stars ---- */
  var cv = root.querySelector('.nx-stars'), ctx = cv.getContext('2d'), stars = [], W = 0, H = 0;
  function sizeStars() {
    var d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    stars = [];
    var n = Math.round(W * H / 6500);
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 3, r: Math.random() * 1.3 + .2, a: Math.random() * .7 + .15, z: Math.random() * .6 + .2, t: Math.random() * 6.28, g: Math.random() < .08 });
  }

  /* ---- scroll scenes ---- */
  var rail = root.querySelector('.nx-rail'), railFill = rail.querySelector('.nx-rail-fill'), railDot = rail.querySelector('.nx-rail-dot'), railTime = rail.querySelector('.nx-rail-time');
  (function () { for (var i = 0; i <= 14; i += 2) { var t = document.createElement('i'); t.className = 'nx-rail-tick'; t.style.top = (i / 14 * 100) + '%'; rail.appendChild(t); } })();
  var dawn = root.querySelector('.nx-dawn');
  var steps = $$('.nx-step'), stepsWrap = root.querySelector('.nx-steps'), stepsFill = root.querySelector('.nx-steps-line i'), stepsDot = root.querySelector('.nx-steps-line b');
  var cases = root.querySelector('.nx-cases'), casesPin = root.querySelector('.nx-cases-pin'), casesTrack = root.querySelector('.nx-cases-track'), casesBar = root.querySelector('.nx-cases-bar i');
  var final = root.querySelector('.nx-final'), sun = root.querySelector('.nx-sun');
  var horiz = false, travel = 0, anchors = [];
  function buildAnchors() {
    var vh = innerHeight, sy = scrollY;
    anchors = [{ y: root.getBoundingClientRect().top + sy - vh, t: 90 }];
    $$('.nx-sec').forEach(function (sec) {
      var b = sec.querySelector('.nx-eye b'); if (!b) return;
      var hm = b.textContent.split(':'), m = (+hm[0]) * 60 + (+hm[1]) - 18 * 60; if (m < 0) m += 1440;
      anchors.push({ y: sec.getBoundingClientRect().top + sy - vh * .35, t: m });
    });
    anchors.sort(function (a, b) { return a.y - b.y; });
  }
  function timeAt(y) {
    if (!anchors.length) return 0;
    if (y <= anchors[0].y) return anchors[0].t;
    for (var i = 1; i < anchors.length; i++) if (y < anchors[i].y) { var a = anchors[i - 1], b = anchors[i]; return a.t + (b.t - a.t) * (y - a.y) / (b.y - a.y); }
    return anchors[anchors.length - 1].t;
  }

  function layoutCases() {
    horiz = innerWidth >= 900 && !RM;
    if (!horiz) { cases.style.height = ''; casesTrack.style.transform = ''; return; }
    travel = Math.max(0, casesTrack.scrollWidth - innerWidth);
    cases.style.height = (innerHeight + travel) + 'px';
  }
  function fmt(min) { var m = (18 * 60 + Math.floor(min)) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }

  var ticking = false;
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  function update() {
    ticking = false;
    var y = scrollY, vh = innerHeight;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    var r = root.getBoundingClientRect();
    var total = r.height - vh, p = clamp(-r.top / Math.max(1, total), 0, 1);
    // time rail
    var heroOut = hero ? hero.getBoundingClientRect().bottom < vh * .5 : true;
    rail.classList.toggle('is-on', heroOut && p < .995);
    var tm = timeAt(y), tp = tm / 840;
    railFill.style.height = (tp * 100) + '%'; railDot.style.top = (tp * 100) + '%';
    railTime.textContent = fmt(tm);
    dawn.style.opacity = clamp((p - .72) / .28, 0, 1);
    // scrubbed words
    if (scrubWords.length) {
      var sr = scrub.getBoundingClientRect(), sp = clamp((vh * .85 - sr.top) / (sr.height + vh * .45), 0, 1);
      var on = Math.round(sp * scrubWords.length * 1.1);
      for (var i = 0; i < scrubWords.length; i++) scrubWords[i].classList.toggle('on', RM || i < on);
    }
    // process line
    if (stepsWrap) {
      var wr = stepsWrap.getBoundingClientRect(), pp = clamp((vh * .55 - wr.top) / wr.height, 0, 1);
      stepsFill.style.height = (pp * 100) + '%'; stepsDot.style.top = (pp * 100) + '%';
      steps.forEach(function (s) { var b = s.getBoundingClientRect(); s.classList.toggle('on', RM || b.top < vh * .62); });
    }
    // horizontal cases
    if (horiz) {
      var cr = cases.getBoundingClientRect(), cp = clamp(-cr.top / Math.max(1, cr.height - vh), 0, 1);
      casesTrack.style.transform = 'translate3d(' + (-cp * travel) + 'px,0,0)';
      casesBar.style.width = (cp * 100) + '%';
    }
    // sun rise
    if (final) {
      var fr = final.getBoundingClientRect(), fp = clamp((vh - fr.top) / (fr.height + vh * .2), 0, 1);
      sun.style.transform = 'translate3d(0,' + ((1 - fp) * 260) + 'px,0) scale(' + (.8 + fp * .3) + ')';
    }
  }

  var last = 0;
  function drawStars(now) {
    requestAnimationFrame(drawStars);
    if (document.hidden || now - last < 33) return; last = now;
    ctx.clearRect(0, 0, W, H);
    var sy = scrollY;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], y = ((s.y - sy * s.z * .25) % (H * 3) + H * 3) % (H * 3);
      if (y > H) continue;
      ctx.globalAlpha = s.a * (RM ? 1 : .65 + .35 * Math.sin(now * .0012 + s.t));
      ctx.fillStyle = s.g ? '#c5f07a' : '#fff';
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function onResize() { sizeStars(); layoutCases(); buildAnchors(); update(); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('load', function () { layoutCases(); buildAnchors(); update(); });
  sizeStars(); layoutCases(); buildAnchors(); update();
  requestAnimationFrame(drawStars);
})();
