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
          var len = w * (0.45 + rnd() * 0.5), v = 168 + Math.round(rnd() * 26)
          g.fillStyle = 'rgb(' + (v + 26) + ',' + (v + 2) + ',' + (v - 46) + ')'
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

    var rugTex = canvasTex(512, 384, function (g, w, h) {
      g.fillStyle = '#e9dfcd'; g.fillRect(0, 0, w, h)
      g.strokeStyle = '#c2674a'; g.lineWidth = 10; g.strokeRect(22, 22, w - 44, h - 44)
      g.strokeStyle = '#b9a98b'; g.lineWidth = 3; g.strokeRect(40, 40, w - 80, h - 80)
      for (var i = 0; i < 6; i++) {
        var cx = 90 + i * 66, cy = h / 2
        g.fillStyle = i % 2 ? '#c2674a' : '#7f8f77'
        g.beginPath(); g.moveTo(cx, cy - 70); g.lineTo(cx + 30, cy); g.lineTo(cx, cy + 70); g.lineTo(cx - 30, cy); g.closePath(); g.fill()
        g.fillStyle = '#e9dfcd'
        g.beginPath(); g.moveTo(cx, cy - 22); g.lineTo(cx + 10, cy); g.lineTo(cx, cy + 22); g.lineTo(cx - 10, cy); g.closePath(); g.fill()
      }
      for (var k = 0; k < 2600; k++) {
        g.globalAlpha = 0.07
        g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'
        g.fillRect(rnd() * w, rnd() * h, 2, 2)
      }
      g.globalAlpha = 1
    })

    function artTex(kind) {
      return canvasTex(256, 320, function (g, w, h) {
        g.fillStyle = kind ? '#e8dccb' : '#f1ece2'; g.fillRect(0, 0, w, h)
        if (kind) {
          g.fillStyle = '#c2674a'; g.beginPath(); g.arc(w / 2, h * 0.62, 78, Math.PI, 0); g.lineTo(w / 2 + 78, h * 0.62 + 80); g.lineTo(w / 2 - 78, h * 0.62 + 80); g.fill()
          g.fillStyle = '#7f8f77'; g.beginPath(); g.arc(w / 2, h * 0.62, 46, Math.PI, 0); g.lineTo(w / 2 + 46, h * 0.62 + 80); g.lineTo(w / 2 - 46, h * 0.62 + 80); g.fill()
          g.fillStyle = '#d9a441'; g.beginPath(); g.arc(w * 0.72, h * 0.2, 24, 0, 7); g.fill()
        } else {
          g.fillStyle = '#5c6b8a'; g.beginPath(); g.arc(w * 0.38, h * 0.4, 70, 0, 7); g.fill()
          g.fillStyle = '#d9a441'; g.beginPath(); g.arc(w * 0.62, h * 0.58, 52, 0, 7); g.fill()
          g.fillStyle = '#2b2d31'; g.fillRect(34, h * 0.8, w - 68, 5)
        }
      })
    }

    var skyTex = canvasTex(8, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#6fa8e6'); gr.addColorStop(0.7, '#cfe4f8'); gr.addColorStop(1, '#f5efe0')
      g.fillStyle = gr; g.fillRect(0, 0, w, h)
    })

    // ---------- materials ----------
    var M = {
      wall: mat('#ece6dc', { roughness: 0.95 }, 'wall'),
      base: mat('#f6f2ea', { roughness: 0.6 }, 'wall'),
      slab: mat('#6f6a62', { roughness: 0.9 }, 'wall'),
      floor: mat('#ffffff', { map: floorTex, roughness: 0.5 }, 'floor'),
      rug: mat('#ffffff', { map: rugTex, roughness: 1 }),
      sofa: mat('#5f7088', { roughness: 1 }),
      sofaDk: mat('#56657c', { roughness: 1 }),
      terra: mat('#c2674a', { roughness: 0.95 }),
      mustard: mat('#d9a441', { roughness: 0.95 }),
      linen: mat('#e8e1d3', { roughness: 1 }),
      walnut: mat('#7a5438', { roughness: 0.55 }),
      oak: mat('#c9a06c', { roughness: 0.5 }),
      black: mat('#26282c', { roughness: 0.5, metalness: 0.2 }),
      brass: mat('#c1a062', { roughness: 0.35, metalness: 0.45 }),
      ceramic: mat('#efe9dd', { roughness: 0.35 }),
      leaf: mat('#4f7d46', { roughness: 0.7, side: T.DoubleSide }),
      leaf2: mat('#3f6a3b', { roughness: 0.7, side: T.DoubleSide }),
      pot: mat('#d6cbb8', { roughness: 0.8 }),
      soil: mat('#2a2018', { roughness: 1 }),
      shade: mat('#f3e6c8', { roughness: 0.9, side: T.DoubleSide, emissive: srgb('#ffb866').multiplyScalar(0.55) }),
      art1: mat('#ffffff', { map: artTex(1), roughness: 0.9 }),
      art2: mat('#ffffff', { map: artTex(0), roughness: 0.9 }),
      book1: mat('#8b3a2e'), book2: mat('#34495e'), book3: mat('#d9a441'), book4: mat('#6b7f5a'), book5: mat('#e8e1d3')
    }
    var skyMat = new T.MeshBasicMaterial({ map: skyTex, toneMapped: false })

    // ---------- geometry helpers ----------
    var edgeMat = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
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
    bx(shell, RW + 0.14, 0.1, RD + 0.14, M.slab, RW / 2, -0.13, RD / 2, { cast: false, recv: false })
    var T0 = 0.12
    bx(shell, RW + T0, WIN.y0, T0, M.wall, (RW - T0) / 2, 0, -T0 / 2)                               // back wall, below the window
    bx(shell, RW + T0, WH - WIN.y1, T0, M.wall, (RW - T0) / 2, WIN.y1, -T0 / 2)                      // above
    bx(shell, WIN.x0 + T0, WIN.y1 - WIN.y0, T0, M.wall, (WIN.x0 - T0) / 2, WIN.y0, -T0 / 2)          // left of the window
    bx(shell, RW - WIN.x1, WIN.y1 - WIN.y0, T0, M.wall, (WIN.x1 + RW) / 2, WIN.y0, -T0 / 2)          // right of the window
    bx(shell, T0, WH, RD, M.wall, -T0 / 2, 0, RD / 2)                                                // left wall
    bx(shell, RW + T0, 0.07, 0.06, M.wall, (RW - T0) / 2, 0, RD + 0.03, { edge: false })             // cut-away front and right edges
    bx(shell, 0.06, 0.07, RD, M.wall, RW + 0.03, 0, RD / 2, { edge: false })
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

    // curtains: a pleated box per side, plus a rod
    function curtain(x) {
      var geo = new T.BoxGeometry(0.52, 2.0, 0.05, 28, 1, 1), pos = geo.attributes.position
      for (var i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + Math.sin(pos.getX(i) * 36) * 0.028)
      geo.computeVertexNormals()
      addMesh(shell, geo, M.linen, x, 0.22 + 1.0, 0.12, { edge: false })
    }
    curtain(WIN.x0 - 0.12)
    curtain(WIN.x1 + 0.12)
    addMesh(shell, new T.CylinderGeometry(0.014, 0.014, ww + 1.0, 10), M.brass, wx, 2.27, 0.12, { rz: Math.PI / 2, edge: false })

    // ---------- furniture ----------
    var furn = new T.Group()
    world.add(furn)

    // rug
    bx(furn, 2.6, 0.012, 1.9, M.rug, 2.0, 0, 2.0, { cast: false, edge: true })

    // sofa: built facing +z, then turned to face the room along the left wall
    function sofa(x, z) {
      var g = new T.Group()
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.022, 0.016, 0.13, M.walnut, s[0] * 1.02, 0, s[1] * 0.4) })
      rbx(g, 2.2, 0.2, 0.95, 0.07, M.sofaDk, 0, 0.12, 0, { edge: true })
      rbx(g, 2.2, 0.5, 0.22, 0.09, M.sofa, 0, 0.3, -0.365, { edge: true })
      rbx(g, 0.2, 0.32, 0.95, 0.08, M.sofa, -1.0, 0.3, 0, { edge: true })
      rbx(g, 0.2, 0.32, 0.95, 0.08, M.sofa, 1.0, 0.3, 0, { edge: true })
      ;[-0.6, 0, 0.6].forEach(function (cx) {
        rbx(g, 0.6, 0.14, 0.66, 0.06, M.sofa, cx, 0.32, 0.1, { edge: false })
        rbx(g, 0.58, 0.36, 0.14, 0.06, M.sofa, cx, 0.46, -0.2, { rx: -0.2, edge: false })
      })
      rbx(g, 0.42, 0.42, 0.12, 0.07, M.terra, -0.72, 0.5, 0.0, { rx: -0.35, ry: 0.25, edge: false })
      rbx(g, 0.4, 0.4, 0.11, 0.07, M.mustard, 0.62, 0.5, 0.0, { rx: -0.35, ry: -0.3, edge: false })
      g.position.set(x, 0, z)
      g.rotation.y = Math.PI / 2
      furn.add(g)
    }
    sofa(0.62, 1.9)

    // armchair
    function armchair(x, z, ry) {
      var g = new T.Group()
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.02, 0.014, 0.16, M.walnut, s[0] * 0.3, 0, s[1] * 0.3) })
      rbx(g, 0.8, 0.2, 0.8, 0.08, M.terra, 0, 0.16, 0, { edge: true })
      rbx(g, 0.8, 0.5, 0.2, 0.09, M.terra, 0, 0.3, -0.3, { rx: -0.12, edge: true })
      rbx(g, 0.14, 0.26, 0.7, 0.06, M.terra, -0.33, 0.3, 0.05, { edge: false })
      rbx(g, 0.14, 0.26, 0.7, 0.06, M.terra, 0.33, 0.3, 0.05, { edge: false })
      rbx(g, 0.54, 0.12, 0.54, 0.06, M.terra, 0, 0.36, 0.06, { edge: false })
      g.position.set(x, 0, z)
      g.rotation.y = ry
      furn.add(g)
    }
    armchair(2.7, 3.0, -2.55)

    // coffee table with things on it
    ;(function () {
      var g = new T.Group(), x = 1.95, z = 1.95
      cyl(g, 0.5, 0.5, 0.04, M.oak, x, 0.34, z, { edge: true })
      ;[0, 2.09, 4.19].forEach(function (a) { cyl(g, 0.022, 0.016, 0.34, M.black, x + Math.cos(a) * 0.3, 0, z + Math.sin(a) * 0.3) })
      bx(g, 0.28, 0.035, 0.2, M.book2, x - 0.12, 0.38, z + 0.05, { ry: 0.3, edge: false })
      bx(g, 0.24, 0.03, 0.17, M.book1, x - 0.12, 0.415, z + 0.05, { ry: 0.5, edge: false })
      cyl(g, 0.11, 0.07, 0.07, M.ceramic, x + 0.17, 0.38, z - 0.1)
      cyl(g, 0.05, 0.05, 0.05, M.black, x + 0.17, 0.45, z - 0.1)
      furn.add(g)
    })()

    // plant: pot, soil, stems with leaf blades
    function plant(x, z, s, n) {
      var g = new T.Group()
      cyl(g, 0.2 * s, 0.14 * s, 0.34 * s, M.pot, x, 0, z)
      cyl(g, 0.185 * s, 0.185 * s, 0.01, M.soil, x, 0.335 * s, z)
      var leafGeo = new T.SphereGeometry(1, 10, 8)
      for (var i = 0; i < n; i++) {
        var a = rnd() * 6.283, rad = 0.05 + rnd() * 0.17 * s, h = (0.5 + rnd() * 0.95) * s
        var sx = 0.1 * s + rnd() * 0.05 * s
        var leaf = addMesh(g, leafGeo, i % 3 ? M.leaf : M.leaf2, x + Math.cos(a) * rad, 0.35 * s + h, z + Math.sin(a) * rad, { edge: false })
        leaf.scale.set(sx * 1.5, sx * 0.14, sx * 1.1)
        leaf.rotation.set((rnd() - 0.5) * 0.9, a, 0.5 + rnd() * 0.5)
        var st = cyl(g, 0.006, 0.006, h, M.leaf2, x + Math.cos(a) * rad * 0.5, 0.35 * s, z + Math.sin(a) * rad * 0.5, { cast: false })
        st.rotation.z = -Math.cos(a) * 0.12
        st.rotation.x = Math.sin(a) * 0.12
      }
      furn.add(g)
    }
    plant(0.4, 0.4, 1.35, 22)

    // floor lamp beside the sofa
    ;(function () {
      var g = new T.Group(), x = 0.4, z = 3.25
      cyl(g, 0.15, 0.15, 0.02, M.black, x, 0, z)
      cyl(g, 0.01, 0.01, 1.48, M.black, x, 0.02, z)
      var sh = addMesh(g, new T.CylinderGeometry(0.17, 0.22, 0.28, 28, 1, true), M.shade, x, 1.62, z, { cast: false, recv: false, edge: false })
      sh.scale.set(1, 1, 1)
      furn.add(g)
    })()

    // sideboard with a lamp, vase and books; art above it
    ;(function () {
      var g = new T.Group(), x = 1.6, z = 0.22
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { cyl(g, 0.02, 0.012, 0.16, M.black, x + s[0] * 0.72, 0, z + s[1] * 0.14) })
      bx(g, 1.6, 0.52, 0.4, M.walnut, x, 0.16, z)
      ;[-0.53, 0, 0.53].forEach(function (dx) {
        bx(g, 0.5, 0.44, 0.012, M.oak, x + dx, 0.2, z + 0.205, { edge: false })
        bx(g, 0.1, 0.012, 0.012, M.brass, x + dx + (dx > 0 ? -0.18 : 0.18), 0.4, z + 0.216, { edge: false })
      })
      // table lamp
      cyl(g, 0.06, 0.07, 0.2, M.ceramic, x - 0.55, 0.68, z)
      addMesh(g, new T.CylinderGeometry(0.1, 0.15, 0.2, 24, 1, true), M.shade, x - 0.55, 0.98, z, { cast: false, edge: false })
      // vase with dried stems
      cyl(g, 0.045, 0.07, 0.22, M.terra, x + 0.45, 0.68, z)
      for (var i = 0; i < 5; i++) {
        var st = cyl(g, 0.004, 0.004, 0.45, M.walnut, x + 0.45 + (i - 2) * 0.012, 0.85, z, { cast: false })
        st.rotation.z = (i - 2) * 0.16
      }
      bx(g, 0.26, 0.04, 0.18, M.book3, x + 0.05, 0.68, z, { edge: false })
      bx(g, 0.22, 0.04, 0.16, M.book5, x + 0.05, 0.72, z, { ry: 0.2, edge: false })
      furn.add(g)
      // framed art on the back wall
      frame(furn, 0.74, 0.96, M.art1, 1.2, 1.2, 0.045)
      frame(furn, 0.46, 0.6, M.art2, 2.0, 1.12, 0.045)
    })()
    function frame(p, w, h, art, x, y, z) {
      bx(p, w, h, 0.03, M.black, x, y, z, { edge: false })
      var pl = new T.Mesh(new T.PlaneGeometry(w - 0.06, h - 0.06), art)
      pl.position.set(x, y + h / 2, z + 0.017)
      pl.receiveShadow = true
      p.add(pl)
    }

    // two floating shelves and a frame above the sofa
    ;(function () {
      var g = new T.Group()
      ;[1.15, 1.6].forEach(function (y, i) {
        bx(g, 0.22, 0.035, 1.2, M.oak, 0.11, y, 1.9)
        var z0 = 1.45
        ;[M.book1, M.book2, M.book3, M.book4, M.book5].forEach(function (m, k) {
          var bh = 0.22 + (k % 3) * 0.04
          bx(g, 0.15, bh, 0.04, m, 0.12, y + 0.035, z0 + k * 0.045 + i * 0.5, { edge: false })
        })
        if (i === 0) { cyl(g, 0.05, 0.07, 0.14, M.ceramic, 0.12, y + 0.035, 2.2); plantSmall(g, 0.12, y + 0.18, 2.2) }
        else { cyl(g, 0.08, 0.07, 0.04, M.black, 0.12, y + 0.035, 2.2) }
      })
      furn.add(g)
    })()
    function plantSmall(p, x, y, z) {
      var leafGeo = new T.SphereGeometry(1, 8, 6)
      for (var i = 0; i < 6; i++) {
        var a = i * 1.05, l = addMesh(p, leafGeo, i % 2 ? M.leaf : M.leaf2, x + Math.cos(a) * 0.03, y + 0.1 + (i % 3) * 0.04, z + Math.sin(a) * 0.03, { edge: false })
        l.scale.set(0.045, 0.012, 0.03)
        l.rotation.set(0.3, a, 0.9)
      }
    }
    // large frame on the left wall
    ;(function () {
      var w = 0.7, h = 0.9
      bx(furn, 0.03, h, w, M.black, 0.017, 0.82, 1.9 - 0.0, { edge: false })
    })()

    // dining table and four chairs
    ;(function () {
      var g = new T.Group(), x = 4.15, z = 2.6
      bx(g, 1.4, 0.04, 0.85, M.walnut, x, 0.72, z)
      ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { bx(g, 0.05, 0.72, 0.05, M.walnut, x + s[0] * 0.62, 0, z + s[1] * 0.35, { edge: false }) })
      cyl(g, 0.07, 0.05, 0.2, M.ceramic, x, 0.76, z)
      for (var i = 0; i < 3; i++) {
        var l = addMesh(g, new T.SphereGeometry(1, 8, 6), M.leaf, x + (i - 1) * 0.03, 1.0 + i * 0.03, z, { edge: false })
        l.scale.set(0.05, 0.12, 0.02); l.rotation.z = (i - 1) * 0.4
      }
      cyl(g, 0.09, 0.09, 0.018, M.ceramic, x - 0.4, 0.76, z + 0.18)
      cyl(g, 0.09, 0.09, 0.018, M.ceramic, x + 0.4, 0.76, z - 0.18)
      furn.add(g)
      function chair(cx, cz, ry) {
        var c = new T.Group()
        ;[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { bx(c, 0.03, 0.45, 0.03, M.black, s[0] * 0.19, 0, s[1] * 0.19, { edge: false }) })
        rbx(c, 0.44, 0.05, 0.44, 0.03, M.linen, 0, 0.43, 0, { edge: false })
        bx(c, 0.03, 0.4, 0.03, M.black, -0.19, 0.45, -0.19, { edge: false })
        bx(c, 0.03, 0.4, 0.03, M.black, 0.19, 0.45, -0.19, { edge: false })
        rbx(c, 0.42, 0.22, 0.04, 0.02, M.oak, 0, 0.62, -0.2, { edge: false })
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
    var sun = new T.DirectionalLight(0xfff0d6, 1.7)
    sun.position.set(3.9, 3.4, -4.5)
    sun.target.position.set(2.4, 0, 2.3)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    var sc = sun.shadow.camera
    sc.left = -4.5; sc.right = 4.5; sc.top = 4.5; sc.bottom = -4.5; sc.near = 0.5; sc.far = 16
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.02
    scene.add(sun, sun.target)
    var fill = new T.DirectionalLight(0xffe6c8, 0.28)
    fill.position.set(-2, 3, 6)
    scene.add(fill)
    var lamp = new T.PointLight(0xffb866, 0.9, 4.2, 2)
    lamp.position.set(0.45, 1.5, 3.2)
    scene.add(lamp)
    var tableLamp = new T.PointLight(0xffb866, 0.35, 2.6, 2)
    tableLamp.position.set(1.05, 1.0, 0.45)
    scene.add(tableLamp)

    // ---------- the plan overlay: grid, dimensions and labels, drawn on a plane over the floor ----------
    var OX = -0.6, OZ = -0.5, OW = 6.0, OH = 4.7, PPM = 200
    var overlayMat = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
    var overlay = new T.Mesh(new T.PlaneGeometry(OW, OH), overlayMat)
    overlay.rotation.x = -Math.PI / 2
    overlay.position.set(OX + OW / 2, 0.045, OZ + OH / 2)
    overlay.renderOrder = 5
    scene.add(overlay)
    var LABELS = [['SOFA', 0.62, 1.9, -1], ['COFFEE TABLE', 1.95, 2.3], ['ARMCHAIR', 2.75, 3.12], ['SIDEBOARD', 1.6, 0.22], ['DINING TABLE', 4.15, 2.6], ['WINDOW', 3.7, 0.0, 1]]
    function drawOverlay(acc) {
      var c = overlayMat.map ? overlayMat.map.image : document.createElement('canvas')
      c.width = OW * PPM; c.height = OH * PPM
      var g = c.getContext('2d')
      g.clearRect(0, 0, c.width, c.height)
      function X(x) { return (x - OX) * PPM }
      function Z(z) { return (z - OZ) * PPM }
      g.lineWidth = 1
      g.strokeStyle = acc
      for (var x = 0; x <= RW + 0.001; x += 0.5) { g.globalAlpha = x % 1 ? 0.12 : 0.28; g.beginPath(); g.moveTo(X(x), Z(0)); g.lineTo(X(x), Z(RD)); g.stroke() }
      for (var z = 0; z <= RD + 0.001; z += 0.5) { g.globalAlpha = z % 1 ? 0.12 : 0.28; g.beginPath(); g.moveTo(X(0), Z(z)); g.lineTo(X(RW), Z(z)); g.stroke() }
      g.globalAlpha = 1
      g.lineWidth = 2
      // dimension lines
      var by = Z(RD + 0.3), lx = X(-0.34)
      g.beginPath(); g.moveTo(X(0), by); g.lineTo(X(RW), by); g.moveTo(X(0), by - 8); g.lineTo(X(0), by + 8); g.moveTo(X(RW), by - 8); g.lineTo(X(RW), by + 8)
      g.moveTo(lx, Z(0)); g.lineTo(lx, Z(RD)); g.moveTo(lx - 8, Z(0)); g.lineTo(lx + 8, Z(0)); g.moveTo(lx - 8, Z(RD)); g.lineTo(lx + 8, Z(RD)); g.stroke()
      g.fillStyle = acc
      g.font = '500 24px "Instrument Sans", system-ui, sans-serif'
      g.textAlign = 'center'; g.textBaseline = 'bottom'
      g.fillText('5.00 m', X(RW / 2), by - 8)
      g.save(); g.translate(lx - 10, Z(RD / 2)); g.rotate(-Math.PI / 2); g.fillText('3.60 m', 0, 0); g.restore()
      g.font = '600 17px "Instrument Sans", system-ui, sans-serif'
      g.textBaseline = 'middle'
      g.globalAlpha = 0.95
      LABELS.forEach(function (l) {
        g.save(); g.translate(X(l[1]), Z(l[2]))
        if (l[3] === -1) g.rotate(-Math.PI / 2)
        if (l[3] === 1) g.translate(0, -26)
        g.fillText(l[0], 0, 0); g.restore()
      })
      g.globalAlpha = 1
      if (!overlayMat.map) {
        overlayMat.map = new T.CanvasTexture(c)
        overlayMat.map.encoding = T.sRGBEncoding
        overlayMat.map.anisotropy = aniso
      } else overlayMat.map.needsUpdate = true
      overlayMat.needsUpdate = true
    }

    // ---------- plan colours follow the page theme ----------
    var plan = { wall: new T.Color(), fill: new T.Color(), floor: new T.Color() }
    function readTheme() {
      var cs = getComputedStyle(document.documentElement)
      var acc = cs.getPropertyValue('--accent').trim() || '#b0e562'
      var bg = cs.getPropertyValue('--bg').trim() || '#0a0a0c'
      var A, B
      try { A = new T.Color(acc); B = new T.Color(bg) } catch (e) { A = new T.Color('#b0e562'); B = new T.Color('#0a0a0c') }
      plan.wall.copy(A).convertSRGBToLinear()
      plan.fill.copy(B).lerp(A, 0.3).convertSRGBToLinear()
      plan.floor.copy(B).lerp(A, 0.05).convertSRGBToLinear()
      edgeMat.color.copy(A).convertSRGBToLinear()
      drawOverlay(acc)
      dirty = true
      paintedT = -1
    }

    // ---------- state, camera rig ----------
    var state = 'plan', t = 0, touched = false, dirty = true, paintedT = -1
    var azUser = 0.5, polUser = 1.0, time = 0
    var tmp = new T.Color()
    var cx0 = 2.4, cz0 = 1.85
    function fitDist(fov, hw, hh, aspect) {
      var tn = Math.tan(fov * Math.PI / 360)
      return Math.max(hh / tn, hw / (tn * aspect))
    }

    function paint(tt) {
      reg.forEach(function (r) {
        var m = r.m
        m.color.copy(r.base).multiplyScalar(tt)
        m.emissive.copy(plan[r.kind] || plan.fill).multiplyScalar(1 - tt)
        tmp.copy(r.em).multiplyScalar(tt)
        m.emissive.add(tmp)
      })
    }

    function frameScene() {
      var tt = ease(t)
      if (tt !== paintedT) {
        paintedT = tt
        paint(tt)
        world.scale.y = lerp(0.012, 1, tt)
        overlayMat.opacity = Math.max(0, 1 - tt * 1.6)
        overlay.visible = overlayMat.opacity > 0.01
        edgeMat.opacity = Math.max(0, 1 - tt * 1.25) * 0.95
        edgeMeshes.forEach(function (e) { e.visible = edgeMat.opacity > 0.01 })
        hemi.intensity = 0.62 * tt
        sun.intensity = 1.7 * tt
        fill.intensity = 0.28 * tt
        lamp.intensity = 0.9 * tt
        tableLamp.intensity = 0.35 * tt
        renderer.shadowMap.needsUpdate = true
      }
      var w = viz.clientWidth, h = viz.clientHeight
      var aspect = w / h
      var fov = lerp(12, 30, tt)
      var dPlan = fitDist(12, 3.12, 2.42, aspect)
      var d3 = fitDist(30, 3.55, 2.45, aspect) * 1.2
      var dist = lerp(dPlan, d3, tt)
      var az = azUser * tt + (touched || reduce ? 0 : Math.sin(time * 0.35) * 0.07 * tt)
      var pol = lerp(0.0015, polUser, tt)
      var ty = 0.75 * tt
      camera.fov = fov
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
