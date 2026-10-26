// The demo is an iframe (/3d-demo/app/showcase.html); it tells this page how tall it is, so the page scrolls as one and the demo has no scroll bar of its own.
(function () {
  'use strict'
  var frame = document.getElementById('demoFrame')
  if (!frame) return
  // A link like /3d-demo#what is scrolled to before the demo has its real height; when the demo grows, everything below it moves down and the page ends up inside the demo.
  // So the target is scrolled to again after each size change, until the visitor scrolls themselves (or 8 seconds have passed).
  var id = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : '', target = id ? document.getElementById(id) : null
  var mine = false, done = false, stop = function () { if (!mine) done = true }
  ;['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) { window.addEventListener(t, stop, { passive: true }) })
  setTimeout(function () { done = true }, 8000)
  var again = function () {
    if (!target || done) return
    mine = true; target.scrollIntoView(); setTimeout(function () { mine = false }, 60)
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return
    var h = e.data && Number(e.data.swx3dHeight)
    if (h > 0) { frame.style.height = Math.max(640, Math.ceil(h) + 4) + 'px'; again() }
  })
})()
