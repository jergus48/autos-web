/* Night-shift theme for the standalone pages: starry sky, headline word reveal,
   scroll reveals and the card glow/tilt. Purely visual; page scripts are untouched. */
(function () {
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, el) { return [].slice.call((el || document).querySelectorAll(s)); }

  /* sky */
  var sky = document.createElement('div'); sky.className = 'nt-sky'; sky.setAttribute('aria-hidden', 'true');
  var cv = document.createElement('canvas'); sky.appendChild(cv);
  document.body.insertBefore(sky, document.body.firstChild);
  var ctx = cv.getContext('2d'), stars = [], W = 0, H = 0;
  function size() {
    var d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); stars = [];
    for (var i = 0, n = Math.round(W * H / 6500); i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 3, r: Math.random() * 1.3 + .2, a: Math.random() * .7 + .15, z: Math.random() * .6 + .2, t: Math.random() * 6.28, g: Math.random() < .08 });
  }
  var last = 0;
  function draw(now) {
    requestAnimationFrame(draw);
    if (document.hidden || now - last < 33) return; last = now;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], y = ((s.y - scrollY * s.z * .25) % (H * 3) + H * 3) % (H * 3);
      if (y > H) continue;
      ctx.globalAlpha = s.a * (RM ? 1 : .65 + .35 * Math.sin(now * .0012 + s.t));
      ctx.fillStyle = s.g ? '#c5f07a' : '#fff'; ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.283); ctx.fill();
    }
  }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);

  /* headline: words rise in */
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'nt-w';
            var s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
            w.appendChild(s); f.appendChild(w);
          });
          n.parentNode.replaceChild(f, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h1);
    requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add('nt-on'); }); });
  }

  /* scroll reveals */
  var sel = '.hero .eyebrow, .hero > p, .app > .panel, .flow > .panel, main > .panel, .block .sec-badge, .block h2, .block .lead, .cards > .card, .cta';
  var pending = $$(sel);
  pending.forEach(function (el) {
    el.classList.add('nt-rv');
    var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
    if (el.matches('.cards > .card, .app > .panel')) el.style.setProperty('--d', sib * 110);
  });
  function check() {
    var vh = innerHeight;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if ((r.top < vh * .92 && r.bottom > 0) || (r.width === 0 && r.height === 0)) { el.classList.add('nt-in'); return false; }
      return true;
    });
  }
  var ticking = false;
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); } }, { passive: true });
  addEventListener('resize', check); addEventListener('load', check);
  check(); setTimeout(check, 400);

  /* card glow + tilt */
  if (!RM && matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card'); if (!c) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
      c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 8).toFixed(2) + 'deg) translateY(-4px)';
      if (!c._nt) { c._nt = 1; c.addEventListener('pointerleave', function () { c.style.transform = ''; }); }
    });
  }
})();
