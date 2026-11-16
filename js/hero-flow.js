/* Home hero: work items swirl in from the left, pass through the glass agent, leave as ordered lanes. */
(function () {
  var root = document.querySelector('.hf');
  if (!root) return;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  var mono = root.querySelector('.hf-mono'), cnt = mono.querySelector('.hf-cnt span');
  var dests = [].slice.call(root.querySelectorAll('.hf-dest')), tip = root.querySelector('.hf-tip');
  var pairA = root.querySelector('.hf-pair .hf-a'), pairB = root.querySelector('.hf-pair .hf-b'), chaos = root.querySelector('.hf-chaos');
  var LANES = [10.5, 3.5, -3.5, -10.5], END = 26;
  var GLYPHS = ['@', 'PDF', '€', '?', '.xlsx', '#', '!!', 'RE:', 'FW:', '.doc', '%', '24h'];
  var PAIRS = [['Emails', 'Orders entered'], ['Invoices', 'Booked and matched'], ['Questions', 'Answered at 23:14'], ['Spreadsheets', 'Reports sent at 08:00'], ['Paper protocols', 'Signed by the whole shift'], ['Scanned papers', 'Checked and archived']];

  // jittery letters for "Chaos in."
  var txt = chaos.textContent; chaos.textContent = '';
  txt.split('').forEach(function (ch) {
    var s = document.createElement('span'); s.className = 'hf-ch'; s.setAttribute('aria-hidden', 'true');
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.setProperty('--jx', rand(-5, 5).toFixed(1) + 'px'); s.style.setProperty('--jy', rand(-7, 7).toFixed(1) + 'px');
    s.style.setProperty('--jr', rand(-9, 9).toFixed(1) + 'deg'); s.style.setProperty('--t', rand(.18, .5).toFixed(2) + 's');
    s.style.setProperty('--dl', rand(-1, 0).toFixed(2) + 's'); chaos.appendChild(s);
  });

  var W, H, F, CX, CY, raf = 0, visible = false, t0 = 0, last = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  var speed = 1, speedT = 1, count = 12408, P = [], yaw = 0, pitch = 0, dist = 90, mobile = false;

  function spawn(p, init) {
    p.x = init ? rand(-78, END) : rand(-90, -76); p.a = rand(0, 6.28); p.rad = rand(5, 19); p.w = (Math.random() < .5 ? -1 : 1) * rand(.5, 1.4);
    p.lane = Math.floor(Math.random() * 4); p.sp = rand(.75, 1.35); p.g = Math.random() < .2 ? pick(GLYPHS) : null;
    p.rot = rand(0, 6.28); p.vr = rand(-2, 2); p.y0 = null; p.z0 = 0; p.sz = rand(.5, 1.1); p.jx = rand(-1, 1); p.cy = 0; p.cz = 0; return p;
  }
  function size() {
    var b = root.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    W = b.width; H = b.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    mobile = W < 1100; F = Math.min(W, H * 1.25) * 1.05;
    var phone = W < 600;
    CX = phone ? W * .3 : mobile ? W * .4 : W * .58; CY = phone ? H - 150 : mobile ? H - 215 : H * .52;
    var n = W < 700 ? 220 : 460; while (P.length < n) P.push(spawn({}, true)); P.length = n;
  }
  function proj(x, y, z) {
    var c = Math.cos(yaw), s = Math.sin(yaw), x1 = x * c - z * s, z1 = x * s + z * c;
    var cp = Math.cos(pitch), sp = Math.sin(pitch), y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, zc = z2 + dist;
    if (zc < 2) return null; var k = F / zc; return [CX + x1 * k, CY - y1 * k, k];
  }
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function scramble(el, to) {
    var from = el.textContent, len = Math.max(from.length, to.length), chars = 'ABCDEFGHJKLMNOPRSTUVZ0123456789#@€%', f = 0;
    (function step() {
      f++; var out = '';
      for (var i = 0; i < len; i++) { var p = f - i * .8; out += p >= 8 ? (to[i] || '') : (p > 0 ? chars[Math.floor(Math.random() * chars.length)] : (from[i] || '')); }
      el.textContent = out; if (f < 8 + len * .8 + 1) later(step, 28); else el.textContent = to;
    })();
  }
  var pi = 0;
  function nextPair() {
    if (!visible) { later(nextPair, 1000); return; }
    pi = (pi + 1) % PAIRS.length; scramble(pairA, PAIRS[pi][0]);
    later(function () { scramble(pairB, PAIRS[pi][1]); }, 260); later(nextPair, 2800);
  }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function line(a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function frame(now) {
    raf = 0; if (!visible) return;
    var dt = Math.min(40, now - (last || now)); last = now;
    var e = easeIO(RM ? 1 : clamp((now - t0) / 2800, 0, 1));
    cmx += (mx - cmx) * .05; cmy += (my - cmy) * .05;
    dist = lerp(16, W < 600 ? 74 : mobile ? 100 : 96, e); yaw = lerp(0, .3, e) + cmx * .22; pitch = lerp(.02, .2, e) + cmy * .12;
    speed += (speedT - speed) * .05;
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(197,240,122,.05)';
    var gx, gz, a, b;
    for (gx = -80; gx <= 50; gx += 10) { a = proj(gx, -22, -30); b = proj(gx, -22, 30); if (a && b) line(a, b); }
    for (gz = -30; gz <= 30; gz += 10) { a = proj(-80, -22, gz); b = proj(50, -22, gz); if (a && b) line(a, b); }
    LANES.forEach(function (ly) {
      var a = proj(4, ly, 0), b = proj(END, ly, 0); if (!a || !b) return;
      var g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(197,240,122,0)'); g.addColorStop(1, 'rgba(197,240,122,.22)');
      ctx.strokeStyle = g; line(a, b);
    });
    var mv = dt * .0125 * speed * (RM ? .3 : 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < P.length; i++) {
      var p = P[i], prevX = p.x, y, z; p.x += mv * p.sp * (p.x < 0 ? 1 : 1.25);
      if (p.x < 0) {
        var f = clamp(-p.x / 78, 0, 1), rad = p.rad * Math.pow(f, .75) + .4;
        p.a += p.w * dt * .0016 * (1 + (1 - f) * 2.5) * speed; p.rot += p.vr * dt * .001;
        y = Math.cos(p.a) * rad * .85 + Math.sin(now * .004 + p.jx * 9) * f * 1.2; z = Math.sin(p.a) * rad; p.cy = y; p.cz = z;
      } else {
        if (prevX < 0) count++;
        if (p.y0 === null) { p.y0 = p.cy; p.z0 = p.cz; }
        var k = easeOut(clamp(p.x / 16, 0, 1)); y = lerp(p.y0, LANES[p.lane], k); z = lerp(p.z0, 0, k);
      }
      if (p.x > END) { var d = dests[p.lane]; d.classList.remove('hf-hit'); void d.offsetWidth; d.classList.add('hf-hit'); spawn(p, false); continue; }
      var q = proj(p.x, y, z); if (!q) continue;
      var fade = clamp((p.x + 90) / 14, 0, 1) * clamp((END - p.x) / 5, 0, 1);
      if (p.x < 0) {
        var s = q[2] * p.sz * 1.2, al = .22 + .4 * clamp(q[2] / 14, 0, 1);
        ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(p.rot); ctx.globalAlpha = al * fade;
        if (p.g && s > 4) { ctx.fillStyle = '#b9bcb4'; ctx.font = '500 ' + Math.max(8, s * 1.25).toFixed(1) + 'px "JetBrains Mono",monospace'; ctx.fillText(p.g, 0, 0); }
        else { ctx.strokeStyle = '#9da098'; ctx.lineWidth = 1; ctx.strokeRect(-s * .7, -s * .5, s * 1.4, s); if (s > 6) { ctx.fillStyle = 'rgba(157,160,152,.5)'; ctx.fillRect(-s * .45, -s * .2, s * .9, 1); ctx.fillRect(-s * .45, s * .05, s * .6, 1); } }
        ctx.restore();
      } else {
        var tl = proj(p.x - 2.2 * speed, y, z); if (!tl) continue;
        var lw = clamp(q[2] * .13, 1, 3.2); ctx.lineCap = 'round';
        ctx.globalAlpha = .13 * fade; ctx.strokeStyle = '#c5f07a'; ctx.lineWidth = lw * 3.5; line(tl, q);
        ctx.globalAlpha = .95 * fade; ctx.lineWidth = lw; ctx.strokeStyle = '#e2fbb0'; line(tl, q);
      }
    }
    ctx.globalAlpha = 1;
    var o = proj(0, 0, 0), top = proj(0, 17, 0), bot = proj(0, -17, 0), lf = proj(-3.6, 0, 0), rt = proj(3.6, 0, 0);
    if (o && top && bot && lf && rt) {
      var h = Math.abs(bot[1] - top[1]), w = Math.max(60, Math.abs(rt[0] - lf[0]) * 1.55);
      mono.style.width = w + 'px'; mono.style.height = h + 'px'; mono.style.opacity = 1;
      mono.style.transform = 'translate(' + (o[0] - w / 2) + 'px,' + ((top[1] + bot[1]) / 2 - h / 2) + 'px) perspective(1100px) rotateY(' + (-yaw * 57.3 * .55).toFixed(2) + 'deg) rotateX(' + (pitch * 57.3 * .25).toFixed(2) + 'deg)';
      mono.style.borderRadius = Math.min(40, w * .22) + 'px';
    }
    cnt.textContent = fmtN(count);
    dests.forEach(function (d, i) { var q = proj(END + 1.5, LANES[i], 0); if (q) { var s = clamp(q[2] / 12, .7, 1.05); d.style.transform = 'translate(' + (q[0] + 6) + 'px,' + (q[1] - 17 * s) + 'px) scale(' + s.toFixed(3) + ')'; d.style.opacity = e; } });
    var tq = proj(0, -21, 0); if (tq) { tip.style.transform = 'translate(' + tq[0] + 'px,' + (tq[1] + 6) + 'px) translateX(-50%)'; tip.style.opacity = e * .9; }
    raf = requestAnimationFrame(frame);
  }
  function setVisible(v) {
    visible = v;
    if (v && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  root.addEventListener('pointermove', function (e) { var b = root.getBoundingClientRect(); mx = ((e.clientX - b.left) / b.width - .5) * 2; my = ((e.clientY - b.top) / b.height - .5) * 2; });
  mono.addEventListener('pointerenter', function () { speedT = 3; root.classList.add('hf-turbo'); });
  mono.addEventListener('pointerleave', function () { speedT = 1; root.classList.remove('hf-turbo'); });
  root.addEventListener('click', function (e) {
    if (e.target.closest('a,button')) return;
    for (var i = 0; i < 70; i++) { var p = P[Math.floor(Math.random() * P.length)]; spawn(p, false); p.x = rand(-80, -60); }
  });
  window.addEventListener('resize', size);
  size(); t0 = performance.now();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { setVisible(en[0].isIntersecting); }).observe(root);
  else setVisible(true);
  later(nextPair, 2600);
  requestAnimationFrame(function () { root.classList.add('hf-on'); });
})();
