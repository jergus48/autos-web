// The sample room on the interior visualisation page: a floor plan that turns into a lit, furnished 3D interior.
// Real-time WebGL (three.js r128): soft shadows, sun through the window, procedural wood, fabric and art.
// Drag in 3D mode to rotate. If WebGL or three.js is unavailable, interior-fallback.js (CSS 3D) takes over.
(function () {
  'use strict'
  var viz = document.getElementById('viz')
  if (!viz) return
  var BASE = '/interior-visualisation/'
  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'

  function loadScript(src, ok, fail) {
    var s = document.createElement('script')
    s.src = src
    s.onload = ok
    s.onerror = fail
    document.head.appendChild(s)
  }
  function fallback() { loadScript(BASE + 'interior-fallback.js', function () {}, function () {}) }
  function hasWebGL() {
    try {
      var c = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
    } catch (e) { return false }
  }

  if (!hasWebGL()) return fallback()
  loadScript(THREE_URL, function () {
    try { start(window.THREE) } catch (e) { if (window.console) console.error(e); cleanup(); fallback() }
  }, fallback)

  var canvasEl = null
  function cleanup() { if (canvasEl && canvasEl.parentNode) canvasEl.parentNode.removeChild(canvasEl); viz.classList.remove('gl') }

  function start(T) {
    var buttons = document.querySelectorAll('.seg button')
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    var RW = 5.0, RD = 3.6, WH = 2.6          // room width (x), depth (z), wall height (y), metres
    var WIN = { x0: 2.9, x1: 4.5, y0: 0.9, y1: 2.1 }
    var DOOR = { z0: 0.6, z1: 1.5 }             // doorway in the right wall (shown on the plan)

    // ---------- renderer ----------
    var canvas = document.createElement('canvas')
    canvasEl = canvas
    canvas.setAttribute('aria-hidden', 'true')
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputEncoding = T.sRGBEncoding
    renderer.toneMapping = T.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = T.PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false
    var aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    viz.classList.add('gl')
    viz.insertBefore(canvas, viz.firstChild)

    var scene = new T.Scene()
    var camera = new T.PerspectiveCamera(30, 1, 0.1, 60)
    var world = new T.Group()                  // everything that flattens into the plan
    scene.add(world)

    // ---------- helpers ----------
    var seed = 11
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    function srgb(c) { return new T.Color(c).convertSRGBToLinear() }
    function lerp(a, b, k) { return a + (b - a) * k }
    function ease(x) { return x * x * (3 - 2 * x) }

    var reg = []                               // every lit material, so the plan can recolour it
    function mat(hex, o, kind) {
      var m = new T.MeshStandardMaterial(Object.assign({ color: srgb(hex), roughness: 0.8, metalness: 0 }, o || {}))
      reg.push({ m: m, base: m.color.clone(), em: m.emissive.clone(), kind: kind || 'fill' })
      return m
    }
    function canvasTex(w, h, draw, repeat) {
      var c = document.createElement('canvas')
      c.width = w; c.height = h
      draw(c.getContext('2d'), w, h)
      var t = new T.CanvasTexture(c)
      t.encoding = T.sRGBEncoding
      t.anisotropy = aniso
      if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping
      return t
    }

    // ---------- textures ----------
    var floorTex = canvasTex(1024, 1024, function (g, w, h) {
      var pw = h / 13, rows = 13
      for (var r = 0; r < rows; r++) {
        var x = -rnd() * w * 0.6
        while (x < w) {
          var len = w * (0.45 + rnd() * 0.5), v = 150 + Math.round(rnd() * 22)
          g.fillStyle = 'rgb(' + (v + 24) + ',' + (v + 8) + ',' + (v - 16) + ')'
          g.fillRect(x, r * pw, len, pw)
          for (var q = 0; q < 26; q++) {
            g.globalAlpha = 0.05 + rnd() * 0.07
            g.fillStyle = rnd() > 0.5 ? '#3a2410' : '#fff4dc'
            g.fillRect(x + rnd() * len, r * pw + rnd() * pw, 20 + rnd() * 160, 1 + rnd() * 1.4)
          }
          g.globalAlpha = 0.5
          g.fillStyle = '#4a3018'
          g.fillRect(x, r * pw, 2, pw)
          g.globalAlpha = 1
          x += len
        }
        g.globalAlpha = 0.55
        g.fillStyle = '#4a3018'
        g.fillRect(0, r * pw, w, 2)
        g.globalAlpha = 1
      }
    }, true)
    floorTex.repeat.set(RW / 2, RD / 2)

    // ---------- materials ----------
    var M = {
      wall: mat('#f1f0ec', { roughness: 0.95 }, 'wall'),
      base: mat('#f6f4ef', { roughness: 0.6 }, 'wall'),
      slab: mat('#6f6a62', { roughness: 0.9 }, 'bg'),
      floor: mat('#ffffff', { map: floorTex, roughness: 0.55 }, 'floor'),
      rug: mat('#d8d4cb', { roughness: 1 }, 'rug'),
      sofa: mat('#8e9297', { roughness: 1 }, 'sofa'),
      sofaDk: mat('#82868b', { roughness: 1 }, 'sofa'),
      pillow: mat('#c4c7ca', { roughness: 1 }, 'sofa'),
      charcoal: mat('#3b3c3e', { roughness: 0.6 }, 'chair'),
      oak: mat('#c9a573', { roughness: 0.55 }, 'wood'),
      white: mat('#f3f2ee', { roughness: 0.55 }, 'white'),
      black: mat('#26282c', { roughness: 0.45, metalness: 0.2 }, 'frame'),
      ceramic: mat('#efe9dd', { roughness: 0.35 }, 'white')
    }
    var skyMat = new T.MeshBasicMaterial({ color: srgb('#e3eaee'), toneMapped: false })

    // ---------- geometry helpers ----------
    var edgeMat = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false })
    var edgeMeshes = []
    function addMesh(parent, geo, m, x, y, z, o) {
      o = o || {}
      var mesh = new T.Mesh(geo, m)
      mesh.position.set(x, y, z)
      if (o.ry) mesh.rotation.y = o.ry
      if (o.rx) mesh.rotation.x = o.rx
      if (o.rz) mesh.rotation.z = o.rz
      mesh.castShadow = o.cast !== false
      mesh.receiveShadow = o.recv !== false
      if (o.edge !== false) {
        var e = new T.LineSegments(new T.EdgesGeometry(geo, 25), edgeMat)
        mesh.add(e)
        edgeMeshes.push(e)
      }
      parent.add(mesh)
      return mesh
    }
    // box: centred on x,z; bottom at y
    function bx(p, w, h, d, m, x, y, z, o) { return addMesh(p, new T.BoxGeometry(w, h, d), m, x, y + h / 2, z, o) }
    function cyl(p, rt, rb, h, m, x, y, z, o) {
      o = Object.assign({ edge: false }, o || {})
      return addMesh(p, new T.CylinderGeometry(rt, rb, h, 24), m, x, y + h / 2, z, o)
    }
    // soft-edged box (bevelled extrusion): w x h x d, corner radius r, centred on x,z; bottom at y
    function rbx(p, w, h, d, r, m, x, y, z, o) {
      var b = Math.min(r * 0.45, h * 0.45, w * 0.45, d * 0.45)
      var iw = w - 2 * b, id = d - 2 * b, ir = Math.max(r - b, 0.002), s = new T.Shape()
      s.moveTo(-iw / 2 + ir, -id / 2)
      s.lineTo(iw / 2 - ir, -id / 2); s.quadraticCurveTo(iw / 2, -id / 2, iw / 2, -id / 2 + ir)
      s.lineTo(iw / 2, id / 2 - ir); s.quadraticCurveTo(iw / 2, id / 2, iw / 2 - ir, id / 2)
      s.lineTo(-iw / 2 + ir, id / 2); s.quadraticCurveTo(-iw / 2, id / 2, -iw / 2, id / 2 - ir)
      s.lineTo(-iw / 2, -id / 2 + ir); s.quadraticCurveTo(-iw / 2, -id / 2, -iw / 2 + ir, -id / 2)
      var g = new T.ExtrudeGeometry(s, { depth: Math.max(h - 2 * b, 0.001), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 5 })
      g.rotateX(-Math.PI / 2)
      g.computeBoundingBox()
      var bb = g.boundingBox
      g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2)
      return addMesh(p, g, m, x, y, z, Object.assign({ edge: false }, o || {}))
    }

    // ---------- shell: floor, walls, window ----------
    var shell = new T.Group()
    world.add(shell)
    addMesh(shell, new T.PlaneGeometry(RW, RD), M.floor, RW / 2, 0, RD / 2, { cast: false, edge: false }).rotation.x = -Math.PI / 2
    bx(shell, RW + 0.4, 0.1, RD + 0.4, M.slab, RW / 2, -0.13, RD / 2, { cast: false, recv: false, edge: false })
    var T0 = 0.15
    bx(shell, RW + T0, WIN.y0, T0, M.wall, (RW - T0) / 2, 0, -T0 / 2)                               // back wall, below the window
    bx(shell, RW + T0, WH - WIN.y1, T0, M.wall, (RW - T0) / 2, WIN.y1, -T0 / 2)                      // above
    bx(shell, WIN.x0 + T0, WIN.y1 - WIN.y0, T0, M.wall, (WIN.x0 - T0) / 2, WIN.y0, -T0 / 2)          // left of the window
    bx(shell, RW - WIN.x1, WIN.y1 - WIN.y0, T0, M.wall, (WIN.x1 + RW) / 2, WIN.y0, -T0 / 2)          // right of the window
    bx(shell, T0, WH, RD, M.wall, -T0 / 2, 0, RD / 2)                                                // left wall
    bx(shell, RW + T0, 0.07, T0, M.wall, (RW - T0) / 2, 0, RD + T0 / 2, { edge: false })            // cut-away front and right walls
    bx(shell, T0, 0.07, DOOR.z0 + T0, M.wall, RW + T0 / 2, 0, (DOOR.z0 - T0) / 2, { edge: false })   // right wall, either side of the doorway
    bx(shell, T0, 0.07, RD + T0 - DOOR.z1, M.wall, RW + T0 / 2, 0, (DOOR.z1 + RD + T0) / 2, { edge: false })
    bx(shell, WIN.x0 - 0.05, 0.1, 0.018, M.base, (WIN.x0 - 0.05) / 2, 0, 0.009, { edge: false })      // skirting
    bx(shell, RW - WIN.x1 - 0.05, 0.1, 0.018, M.base, (WIN.x1 + RW + 0.05) / 2, 0, 0.009, { edge: false })
    bx(shell, WIN.x1 - WIN.x0, 0.1, 0.018, M.base, (WIN.x0 + WIN.x1) / 2, 0, 0.009, { edge: false })
    bx(shell, 0.018, 0.1, RD, M.base, 0.009, 0, RD / 2, { edge: false })
    // window frame, mullions, sill
    var wx = (WIN.x0 + WIN.x1) / 2, ww = WIN.x1 - WIN.x0, wh = WIN.y1 - WIN.y0, fz = -0.05
    bx(shell, ww, 0.05, 0.07, M.black, wx, WIN.y0, fz, { edge: false })
    bx(shell, ww, 0.05, 0.07, M.black, wx, WIN.y1 - 0.05, fz, { edge: false })
    bx(shell, 0.05, wh, 0.07, M.black, WIN.x0 + 0.025, WIN.y0, fz, { edge: false })
    bx(shell, 0.05, wh, 0.07, M.black, WIN.x1 - 0.025, WIN.y0, fz, { edge: false })
    bx(shell, 0.04, wh, 0.05, M.black, wx, WIN.y0, fz, { edge: false })
    bx(shell, ww, 0.04, 0.05, M.black, wx, WIN.y0 + wh * 0.62, fz, { edge: false })
    bx(shell, ww + 0.2, 0.04, 0.24, M.base, wx, WIN.y0 - 0.04, 0.06)
    var sky = new T.Mesh(new T.PlaneGeometry(ww + 0.2, wh + 0.2), skyMat)
    sky.position.set(wx, (WIN.y0 + WIN.y1) / 2, -0.14)
    world.add(sky)

    // ---------- furniture: a restrained architect's model, neutral colours ----------
    var furn = new T.Group()
    world.add(furn)

    bx(furn, 2.6, 0.012, 1.9, M.rug, 2.0, 0, 2.0, { cast: false, edge: true })

    // sofa: built facing +z, then turned to face the room along the left wall
    ;(function () {
      var g = new T.Group()
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.02, 0.014, 0.13, M.black, s[0] * 1.02, 0, s[1] * 0.4) })
      rbx(g, 2.2, 0.2, 0.95, 0.05, M.sofaDk, 0, 0.12, 0, { edge: true })
      rbx(g, 2.2, 0.5, 0.22, 0.06, M.sofa, 0, 0.3, -0.365, { edge: true })
      rbx(g, 0.2, 0.32, 0.95, 0.06, M.sofa, -1.0, 0.3, 0, { edge: true })
      rbx(g, 0.2, 0.32, 0.95, 0.06, M.sofa, 1.0, 0.3, 0, { edge: true })
      ;[-0.6, 0, 0.6].forEach(function (cx) {
        rbx(g, 0.6, 0.14, 0.66, 0.04, M.sofa, cx, 0.32, 0.1, { edge: false })
        rbx(g, 0.58, 0.36, 0.14, 0.04, M.sofa, cx, 0.46, -0.2, { rx: -0.2, edge: false })
      })
      rbx(g, 0.42, 0.42, 0.12, 0.05, M.pillow, -0.72, 0.5, 0.0, { rx: -0.35, ry: 0.25, edge: false })
      g.position.set(0.62, 0, 1.9)
      g.rotation.y = Math.PI / 2
      furn.add(g)
    })()

    // armchair
    ;(function () {
      var g = new T.Group()
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.018, 0.012, 0.16, M.black, s[0] * 0.3, 0, s[1] * 0.3) })
      rbx(g, 0.8, 0.2, 0.8, 0.05, M.charcoal, 0, 0.16, 0, { edge: true })
      rbx(g, 0.8, 0.5, 0.2, 0.06, M.charcoal, 0, 0.3, -0.3, { rx: -0.12, edge: true })
      rbx(g, 0.14, 0.26, 0.7, 0.04, M.charcoal, -0.33, 0.3, 0.05, { edge: false })
      rbx(g, 0.14, 0.26, 0.7, 0.04, M.charcoal, 0.33, 0.3, 0.05, { edge: false })
      rbx(g, 0.54, 0.12, 0.54, 0.04, M.charcoal, 0, 0.36, 0.06, { edge: false })
      g.position.set(2.7, 0, 3.0)
      g.rotation.y = -2.55
      furn.add(g)
    })()

    // round coffee table
    ;(function () {
      var x = 1.95, z = 1.95
      cyl(furn, 0.5, 0.5, 0.04, M.oak, x, 0.34, z, { edge: true })
      ;[0, 2.09, 4.19].forEach(function (a) { cyl(furn, 0.02, 0.015, 0.34, M.black, x + Math.cos(a) * 0.3, 0, z + Math.sin(a) * 0.3) })
    })()

    // low sideboard along the back wall
    ;(function () {
      var x = 1.6, z = 0.22
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(furn, 0.018, 0.012, 0.16, M.black, x + s[0] * 0.72, 0, z + s[1] * 0.14) })
      bx(furn, 1.6, 0.52, 0.4, M.white, x, 0.16, z)
      bx(furn, 1.62, 0.03, 0.42, M.oak, x, 0.68, z, { edge: false })
      ;[-0.53, 0, 0.53].forEach(function (dx) { bx(furn, 0.012, 0.3, 0.012, M.black, x + dx + 0.2, 0.28, z + 0.206, { edge: false }) })
    })()

    // dining table and four chairs
    ;(function () {
      var x = 4.15, z = 2.6
      bx(furn, 1.4, 0.04, 0.85, M.oak, x, 0.72, z)
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { bx(furn, 0.05, 0.72, 0.05, M.oak, x + s[0] * 0.62, 0, z + s[1] * 0.35, { edge: false }) })
      function chair(cx, cz, ry) {
        var c = new T.Group()
        ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { bx(c, 0.03, 0.45, 0.03, M.charcoal, s[0] * 0.19, 0, s[1] * 0.19, { edge: false }) })
        rbx(c, 0.44, 0.04, 0.44, 0.02, M.charcoal, 0, 0.43, 0, { edge: false })
        rbx(c, 0.42, 0.34, 0.035, 0.015, M.charcoal, 0, 0.5, -0.2, { edge: false })
        c.position.set(cx, 0, cz)
        c.rotation.y = ry
        furn.add(c)
      }
      chair(x - 0.32, z - 0.62, 0.0)
      chair(x + 0.32, z - 0.62, 0.0)
      chair(x - 0.32, z + 0.62, Math.PI)
      chair(x + 0.32, z + 0.62, Math.PI)
    })()

    // ---------- lights ----------
    var hemi = new T.HemisphereLight(0xdfe9ff, 0xcdb89a, 0.62)
    scene.add(hemi)
    var sun = new T.DirectionalLight(0xfff6ea, 1.6)
    sun.position.set(3.9, 3.4, -4.5)
    sun.target.position.set(2.4, 0, 2.3)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    var sc = sun.shadow.camera
    sc.left = -4.5; sc.right = 4.5; sc.top = 4.5; sc.bottom = -4.5; sc.near = 0.5; sc.far = 16
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.02
    scene.add(sun, sun.target)
    var fill = new T.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-2, 3, 6)
    scene.add(fill)
    // ---------- the plan overlay: grid, dimensions and labels, drawn on a plane over the floor ----------
    var OX = -1.1, OZ = -0.9, OW = 6.6, OH = 5.1, PPM = 300
    var overlayMat = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
    var overlay = new T.Mesh(new T.PlaneGeometry(OW, OH), overlayMat)
    overlay.rotation.x = -Math.PI / 2
    overlay.position.set(OX + OW / 2, 0.045, OZ + OH / 2)
    overlay.renderOrder = 5
    scene.add(overlay)
    var LABELS = [['SOFA', 0.62, 1.9, -1], ['COFFEE TABLE', 1.95, 2.3], ['ARMCHAIR', 2.75, 3.12], ['SIDEBOARD', 1.6, 0.22], ['DINING TABLE', 4.15, 2.6]]
    var MONO = '"IBM Plex Mono", ui-monospace, Consolas, "Courier New", monospace'
    function drawOverlay(P) {
      var c = overlayMat.map ? overlayMat.map.image : document.createElement('canvas')
      c.width = OW * PPM; c.height = OH * PPM
      var g = c.getContext('2d')
      g.clearRect(0, 0, c.width, c.height)
      g.scale(PPM / 200, PPM / 200)               // drawn at 200 px per metre, rendered sharper
      function X(x) { return (x - OX) * 200 }
      function Z(z) { return (z - OZ) * 200 }
      function mm(v) { var n = Math.round(v * 1000).toString(); return n.length > 3 ? n.slice(0, -3) + ' ' + n.slice(-3) : n }
      function text(str, x, y, size, color, rot, weight) {
        g.save(); g.translate(x, y); if (rot) g.rotate(rot)
        g.font = (weight || 500) + ' ' + size + 'px ' + MONO
        g.textAlign = 'center'; g.textBaseline = 'middle'
        g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = P.halo; g.strokeText(str, 0, 0)
        g.fillStyle = color; g.fillText(str, 0, 0); g.restore()
      }
      // dimension chain on a horizontal (h) or vertical line, architect-style slash ticks;
      // `from` is where the extension lines start (the building edge)
      function dim(h, at, pts, from) {
        var p = h ? Z(at) : X(at), q0 = h ? X(pts[0]) : Z(pts[0]), q1 = h ? X(pts[pts.length - 1]) : Z(pts[pts.length - 1])
        g.strokeStyle = P.dim; g.lineWidth = 2
        g.beginPath()
        if (h) { g.moveTo(q0 - 14, p); g.lineTo(q1 + 14, p) } else { g.moveTo(p, q0 - 14); g.lineTo(p, q1 + 14) }
        pts.forEach(function (v) {
          var q = h ? X(v) : Z(v)
          if (h) { g.moveTo(q - 7, p + 7); g.lineTo(q + 7, p - 7) } else { g.moveTo(p - 7, q + 7); g.lineTo(p + 7, q - 7) }
        })
        g.stroke()
        g.lineWidth = 1; g.globalAlpha = 0.55; g.beginPath()
        pts.forEach(function (v) {
          var q = h ? X(v) : Z(v), f = h ? Z(from) : X(from), end = p + (p < f ? -12 : 12)
          if (h) { g.moveTo(q, f); g.lineTo(q, end) } else { g.moveTo(f, q); g.lineTo(end, q) }
        })
        g.stroke(); g.globalAlpha = 1
        for (var i = 0; i < pts.length - 1; i++) {
          var mid = (pts[i] + pts[i + 1]) / 2, len = pts[i + 1] - pts[i]
          if (h) text(mm(len), X(mid), p - 15, 20, P.dim)
          else text(mm(len), p - 17, Z(mid), 20, P.dim, -Math.PI / 2)
        }
      }
      dim(true, -0.62, [0, WIN.x0, WIN.x1, RW], -0.15)
      dim(true, RD + 0.55, [0, RW], RD)
      dim(false, -0.52, [0, 0.8, 3.0, RD], -0.15)
      dim(false, -0.88, [0, RD], -0.15)
      // window glazing lines in the wall thickness
      g.strokeStyle = P.line; g.lineWidth = 2
      g.beginPath()
      g.moveTo(X(WIN.x0), Z(-0.15)); g.lineTo(X(WIN.x0), Z(0)); g.moveTo(X(WIN.x1), Z(-0.15)); g.lineTo(X(WIN.x1), Z(0))
      g.moveTo(X(WIN.x0), Z(-0.05)); g.lineTo(X(WIN.x1), Z(-0.05)); g.moveTo(X(WIN.x0), Z(-0.1)); g.lineTo(X(WIN.x1), Z(-0.1)); g.stroke()
      // door: open leaf and swing arc
      var hx = X(RW), hz = Z(DOOR.z1), r = (DOOR.z1 - DOOR.z0) * 200
      g.lineWidth = 2; g.beginPath(); g.moveTo(hx, hz); g.lineTo(hx - r, hz); g.stroke()
      g.setLineDash([9, 7]); g.lineWidth = 1.5; g.beginPath(); g.arc(hx, hz, r, -Math.PI / 2, Math.PI, true); g.stroke(); g.setLineDash([])
      text('LIVING ROOM', X(2.35), Z(0.86), 30, P.mute, 0, 600)
      text('18.0 m\u00b2', X(2.35), Z(1.08), 20, P.mute)
      text('WINDOW', X(wx), Z(-0.28), 16, P.mute)
      text('DOOR', X(RW + 0.42), Z((DOOR.z0 + DOOR.z1) / 2), 16, P.mute, Math.PI / 2)
      LABELS.forEach(function (l) { text(l[0], X(l[1]), Z(l[2]), 16, P.lab, l[3] === -1 ? -Math.PI / 2 : 0, 500) })
      if (!overlayMat.map) {
        overlayMat.map = new T.CanvasTexture(c)
        overlayMat.map.encoding = T.sRGBEncoding
        overlayMat.map.anisotropy = aniso
      } else overlayMat.map.needsUpdate = true
      overlayMat.needsUpdate = true
    }

    // ---------- plan colours follow the page theme ----------
    var PAL = {
      dark: { wall: '#e5e9e6', frame: '#e5e9e6', floor: '#2b2722', rug: '#352f29', sofa: '#a9adb2', wood: '#c49b6c', chair: '#16191b', white: '#f4f3ef', line: '#e3e9e6', dim: '#7db4cf', lab: '#f4f6f3', mute: '#98a5a6', halo: 'rgba(12,12,12,.7)' },
      light: { wall: '#1f2a2e', frame: '#1f2a2e', floor: '#e6ded1', rug: '#ddd4c5', sofa: '#b4b8bc', wood: '#c49b6c', chair: '#3a3f43', white: '#f8f9f6', line: '#1f2a2e', dim: '#2c6a8a', lab: '#1f2a2e', mute: '#5b686a', halo: 'rgba(246,242,234,.85)' }
    }
    var plan = {}
    function readTheme() {
      var light = document.documentElement.getAttribute('data-theme') === 'light'
      var P = Object.assign({}, light ? PAL.light : PAL.dark)
      P.bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || (light ? '#f8f9fa' : '#0b0d10')
      ;['wall', 'frame', 'floor', 'rug', 'sofa', 'wood', 'chair', 'white', 'bg'].forEach(function (k) {
        plan[k] = new T.Color(P[k]).convertSRGBToLinear()
      })
      // furniture outlines contrast with the furniture fill; walls get no visible outline
      edgeMat.color.set(light ? '#1f2a2e' : '#e3e9e6').convertSRGBToLinear()
      drawOverlay(P)
      dirty = true
      paintedT = -1
    }

    // ---------- state, camera rig ----------
    var wasFlat = false, state = 'plan', t = 0, touched = false, dirty = true, paintedT = -1
    var azUser = 0.5, polUser = 1.0, time = 0
    var tmp = new T.Color()
    var cx0 = 2.4, cz0 = 1.75
    function fitDist(fov, hw, hh, aspect) {
      var tn = Math.tan(fov * Math.PI / 360)
      return Math.max(hh / tn, hw / (tn * aspect))
    }

    function paint(tt) {
      reg.forEach(function (r) {
        var m = r.m
        m.color.copy(r.base).multiplyScalar(tt)
        m.emissive.copy(plan[r.kind] || plan.sofa).multiplyScalar(1 - tt)
        tmp.copy(r.em).multiplyScalar(tt)
        m.emissive.add(tmp)
      })
    }

    function frameScene() {
      var tt = ease(t)
      if (tt !== paintedT) {
        paintedT = tt
        paint(tt)
        var flat = tt < 0.02          // flat plan colours skip tone mapping so they match the drawing
        if (flat !== wasFlat) { wasFlat = flat; reg.forEach(function (r) { r.m.toneMapped = !flat; r.m.needsUpdate = true }) }
        world.scale.y = lerp(0.012, 1, tt)
        overlayMat.opacity = Math.max(0, 1 - tt * 1.6)
        overlay.visible = overlayMat.opacity > 0.01
        edgeMat.opacity = Math.max(0, 1 - tt * 1.25) * 0.95
        edgeMeshes.forEach(function (e) { e.visible = edgeMat.opacity > 0.01 })
        hemi.intensity = 0.62 * tt
        sun.intensity = 1.7 * tt
        fill.intensity = 0.28 * tt
        renderer.shadowMap.needsUpdate = true
      }
      var w = viz.clientWidth, h = viz.clientHeight
      var aspect = w / h
      var fov = lerp(12, 30, tt)
      var dPlan = fitDist(12, 3.55, 2.72, aspect)
      var d3 = fitDist(30, 3.55, 2.45, aspect) * 1.2
      var dist = lerp(dPlan, d3, tt)
      var az = azUser * tt + (touched || reduce ? 0 : Math.sin(time * 0.35) * 0.07 * tt)
      var pol = lerp(0.0015, polUser, tt)
      var ty = 0.75 * tt
      camera.fov = fov
      camera.near = dist * 0.3                // keeps depth precision when the plan is viewed from far away
      camera.far = dist * 3
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      camera.position.set(
        cx0 + dist * Math.sin(pol) * Math.sin(az),
        ty + dist * Math.cos(pol),
        cz0 + dist * Math.sin(pol) * Math.cos(az)
      )
      camera.lookAt(cx0, ty, cz0 + 0.1 * (1 - tt) * 0)
      renderer.render(scene, camera)
    }

    function resize() {
      var w = viz.clientWidth, h = viz.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      dirty = true
    }

    function setButtons() {
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state))
      })
      viz.setAttribute('data-state', state)
    }
    function set(mode) {
      state = mode
      if (mode === '3d') { azUser = 0.5; polUser = 1.0 }
      if (reduce) t = mode === '3d' ? 1 : 0
      setButtons()
      dirty = true
    }
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () { touched = true; set(b.getAttribute('data-mode')) })
    })

    // drag to rotate in 3D (a mouse also tilts; touch keeps vertical scrolling for the page)
    var drag = null
    viz.addEventListener('pointerdown', function (e) {
      if (state !== '3d') return
      touched = true
      drag = { x: e.clientX, y: e.clientY, az: azUser, pol: polUser, touch: e.pointerType === 'touch' }
      viz.classList.add('drag')
      try { viz.setPointerCapture(e.pointerId) } catch (err) {}
    })
    viz.addEventListener('pointermove', function (e) {
      if (!drag) return
      azUser = Math.max(-0.2, Math.min(1.15, drag.az + (e.clientX - drag.x) * 0.0065))
      if (!drag.touch) polUser = Math.max(0.55, Math.min(1.3, drag.pol - (e.clientY - drag.y) * 0.004))
      dirty = true
    })
    function end() { drag = null; viz.classList.remove('drag') }
    viz.addEventListener('pointerup', end)
    viz.addEventListener('pointercancel', end)

    // ---------- loop: runs only while the room is on screen ----------
    var visible = true, last = 0, raf = 0
    function tick(now) {
      raf = 0
      if (!visible) return
      var dt = Math.min(0.25, (now - last) / 1000 || 0)
      last = now
      time += dt
      var goal = state === '3d' ? 1 : 0
      if (t !== goal) {
        t = reduce ? goal : (goal > t ? Math.min(goal, t + dt / 1.5) : Math.max(goal, t - dt / 1.5))
        dirty = true
      }
      var sway = state === '3d' && !touched && !reduce
      if (dirty || sway) { frameScene(); dirty = false }
      raf = requestAnimationFrame(tick)
    }
    function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(tick) } }

    readTheme()
    try {
      new MutationObserver(function () { readTheme() }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    } catch (e) {}
    try { new ResizeObserver(resize).observe(viz) } catch (e) { window.addEventListener('resize', resize) }
    resize()
    setButtons()
    if ('IntersectionObserver' in window) {
      var vis = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting
        if (visible) { dirty = true; kick() }
      }, { threshold: 0.01 })
      vis.observe(viz)
      // the first time the room scrolls well into view, the plan turns into the 3D interior by itself
      if (!reduce) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return
            io.disconnect()
            setTimeout(function () { if (!touched && state === 'plan') set('3d') }, 1100)
          })
        }, { threshold: 0.55 })
        io.observe(viz)
      }
    }
    kick()
  }
})()
