// The demo is an iframe (/3d-demo/app/showcase.html); it tells this page how tall it is, so the page scrolls as one and the demo has no scroll bar of its own.
(function () {
  'use strict'
  var frame = document.getElementById('demoFrame')
  if (!frame) return
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return
    var h = e.data && Number(e.data.swx3dHeight)
    if (h > 0) frame.style.height = Math.max(640, Math.ceil(h) + 4) + 'px'
  })
})()
