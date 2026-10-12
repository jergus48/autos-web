// Fallback for the sample room when WebGL or three.js is unavailable: a floor plan that turns into a CSS 3D interior.
// Plain CSS 3D: every piece of furniture is a box built from five faces. Drag in 3D mode to rotate.
(function () {
  'use strict'
  var viz = document.getElementById('viz')
  if (!viz) return
  var scene = viz.querySelector('.viz-scene')
  var buttons = document.querySelectorAll('.seg button')
  var W = 440, D = 310                       // room footprint in px
  var RX = 58, RZ0 = -32                     // 3D camera tilt and turn
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var state = 'plan', rz = RZ0, sc = 1, touched = false

  // x, y: top-left corner on the floor; w, d: size on the floor; h: height; z: lift above the floor; c: colour
  var BOXES = [
    { k: 'wall', x: 0, y: 0, w: 440, d: 10, h: 96, c: '#e6e1d7' },                 // back wall
    { k: 'wall', x: 0, y: 10, w: 10, d: 300, h: 96, c: '#e6e1d7' },                // left wall
    { k: 'wall', x: 10, y: 300, w: 430, d: 10, h: 4, c: '#e6e1d7' },               // front wall (cut away)
    { k: 'wall', x: 430, y: 10, w: 10, d: 290, h: 4, c: '#e6e1d7' },               // right wall (cut away)
    { k: 'rug', x: 92, y: 96, w: 200, d: 140, h: 1.5, c: '#cdb99a' },
    { x: 22, y: 86, w: 56, d: 150, h: 30, c: '#5c6b8a' },                           // sofa seat
    { k: 'sub', x: 12, y: 86, w: 12, d: 150, h: 62, c: '#52617f' },                           // sofa back
    { k: 'sub', x: 22, y: 86, w: 56, d: 12, h: 48, c: '#52617f' },                            // sofa arm
    { k: 'sub', x: 22, y: 224, w: 56, d: 12, h: 48, c: '#52617f' },                           // sofa arm
    { x: 132, y: 136, w: 72, d: 72, h: 20, c: '#8b6b4a' },                          // coffee table
    { x: 236, y: 196, w: 56, d: 56, h: 30, c: '#c2674a' },                          // armchair seat
    { k: 'sub', x: 236, y: 196, w: 56, d: 12, h: 58, c: '#b45c40' },                          // armchair back
    { x: 130, y: 12, w: 150, d: 36, h: 44, c: '#a38767' },                          // sideboard
    { x: 292, y: 18, w: 26, d: 26, h: 70, c: '#5b8f4a' },                           // plant
    { x: 344, y: 12, w: 80, d: 22, h: 90, c: '#9c7b57' },                           // bookshelf
    { x: 336, y: 150, w: 84, d: 96, h: 36, c: '#d8c7a7' }                           // dining table
  ]

  function make(cls, w, h, tf) {
    var f = document.createElement('div')
    f.className = 'f ' + cls
    f.style.width = w + 'px'
    f.style.height = h + 'px'
    f.style.transform = tf
    return f
  }

  function box(b) {
    var w = b.w, d = b.d, h = b.h
    var el = document.createElement('div')
    el.className = 'bx' + (b.k ? ' ' + b.k : '')
    el.style.left = (b.x + w / 2) + 'px'
    el.style.top = (b.y + d / 2) + 'px'
    el.style.transform = 'translateZ(' + ((b.z || 0) + h / 2) + 'px)'
    el.style.setProperty('--c', b.c)
    var centre = ' translate(-50%,-50%)'
    el.appendChild(make('top', w, d, 'translateZ(' + h / 2 + 'px)' + centre))
    el.appendChild(make('side fr', w, h, 'translateY(' + d / 2 + 'px) rotateX(90deg)' + centre))
    el.appendChild(make('side bk', w, h, 'translateY(' + (-d / 2) + 'px) rotateX(90deg)' + centre))
    el.appendChild(make('side rt', d, h, 'translateX(' + w / 2 + 'px) rotateZ(90deg) rotateX(90deg)' + centre))
    el.appendChild(make('side lf', d, h, 'translateX(' + (-w / 2) + 'px) rotateZ(90deg) rotateX(90deg)' + centre))
    return el
  }

  var floor = document.createElement('div')
  floor.className = 'floor'
  scene.appendChild(floor)
  BOXES.forEach(function (b) { scene.appendChild(box(b)) })

  function fit() {
    sc = Math.max(0.42, Math.min(1.3, (viz.clientWidth - 8) / 560))
    viz.style.height = Math.round(345 * sc + 40) + 'px'
    apply()
  }

  function apply() {
    var is3d = state === '3d'
    scene.style.transform = 'rotateX(' + (is3d ? RX : 0) + 'deg) rotateZ(' + (is3d ? rz : 0) + 'deg) scale(' + sc + ')'
    viz.setAttribute('data-state', state)
    Array.prototype.forEach.call(buttons, function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state))
    })
  }

  function set(mode) {
    state = mode
    if (mode === '3d') rz = RZ0
    apply()
  }

  Array.prototype.forEach.call(buttons, function (b) {
    b.addEventListener('click', function () { touched = true; set(b.getAttribute('data-mode')) })
  })

  // drag to rotate in 3D
  var drag = null
  viz.addEventListener('pointerdown', function (e) {
    if (state !== '3d') return
    touched = true
    drag = { x: e.clientX, rz: rz }
    viz.classList.add('drag')
    try { viz.setPointerCapture(e.pointerId) } catch (err) {}
  })
  viz.addEventListener('pointermove', function (e) {
    if (!drag) return
    rz = Math.max(-82, Math.min(22, drag.rz + (e.clientX - drag.x) * 0.35))
    apply()
  })
  function end() { drag = null; viz.classList.remove('drag') }
  viz.addEventListener('pointerup', end)
  viz.addEventListener('pointercancel', end)

  window.addEventListener('resize', fit)
  fit()

  // the first time the room scrolls into view, the plan turns into the 3D interior by itself
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return
        io.disconnect()
        setTimeout(function () { if (!touched && state === 'plan') set('3d') }, 1100)
      })
    }, { threshold: 0.55 })
    io.observe(viz)
  }
})()
