// Three.js helpers for the client-flow screens: build a furnished room, render stills (with a baked-in watermark for
// previews, like a server would), and an interactive viewer for the unlocked result.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { buildScene } from '../viewer/scene.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildPieces, PALETTES, OPTIONS } from './simple3d.js'
import { layoutOptions } from '../layout/variants.js'
import { productKey } from '../layout/products.js'
import { buildSpace, isOutdoor } from '../layout/space.js'
import { edgesOf, ray } from '../layout/geom.js'
import { faceSide, sidesAt } from '../layout/wallpaint.js'

export { OPTIONS, PALETTES }
const centroid = (poly) => [poly.reduce((s, q) => s + q[0], 0) / poly.length, poly.reduce((s, q) => s + q[1], 0) / poly.length]

// the furnished layout of a plan for one option (computed once, kept). Products from links (plan._overrides, plan._extras) are part of the key: another product, another layout
const layouts = new Map()
// all three arrangements are made together: every room gets three that really differ (layout/variants.js), so none of them repeats another in a room
export function layoutFor(plan, optionId) {
  if (optionId === 'custom') optionId = 'A'
  const opt = OPTIONS.find((o) => o.id === optionId) || OPTIONS[0], base = (plan.id || 'plan') + ':', key = base + opt.rank + ':' + productKey(plan)
  if (!layouts.has(key)) {
    const { items } = layoutOptions(plan, { count: OPTIONS.length })
    for (const o of OPTIONS) layouts.set(base + o.rank + ':' + productKey(plan), items[o.rank])
  }
  return layouts.get(key)
}
// forget the furnished layouts of a plan (its windows changed, so the furniture is fitted again on the next use)
export function resetLayouts(plan) { for (const k of [...layouts.keys()]) if (k.startsWith((plan.id || 'plan') + ':')) layouts.delete(k); spaces.delete(plan); plan._eff = null }
// the measured space of a plan is kept for the door views; forget it when doors, windows, rooms or the scale changed
export function resetSpace(plan) { spaces.delete(plan) }

export function buildRoom(plan, optionId, { wallHeight, labels = false, look = null, items = null, tags = false, interior = false } = {}) {
  const g = new THREE.Group()
  g.add(buildScene(plan, { wallHeight: wallHeight ?? plan.ceilingHeight, labels, look, interior }))
  const opt = OPTIONS.find((o) => o.id === optionId) || OPTIONS[0]
  g.add(buildPieces(items || layoutFor(plan, optionId), opt.palette, look, { labels: tags, space: spaceOf(plan) }))
  return g
}

// renderer set-up shared by stills and the interactive viewer: filmic tone mapping, soft shadows, a neutral room for reflections
const envCache = new WeakMap()
function envFor(renderer) {
  if (!envCache.has(renderer)) { const pm = new THREE.PMREMGenerator(renderer); envCache.set(renderer, pm.fromScene(new RoomEnvironment(), 0.04).texture); pm.dispose() }
  return envCache.get(renderer)
}
function configure(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
}
function tuneMaterials(root) { root.traverse((o) => { const m = o.material; if (m && m.isMeshStandardMaterial) m.envMapIntensity = 0.55 }) }

// the 3D scene has no ground and no surroundings: the model floats on one flat grey
export const BACKDROP = 0xc6c9ce
function lighting(scene, plan, renderer) {
  scene.environment = envFor(renderer)
  const w = plan.bounds.width, d = plan.bounds.depth, r = Math.max(w, d)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5f70, 0.5))
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.5)
  sun.position.set(w / 2 + r * 0.9, r * 1.5, d / 2 + r * 0.5); sun.target.position.set(w / 2, 0, d / 2)
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02
  const c = sun.shadow.camera; c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.far = r * 6; c.updateProjectionMatrix()
  scene.add(sun, sun.target)
}

// camera views for one room, named like the reference: from each neighbour through its door, from the far corner, and from above
export function roomViews(plan, i) {
  const space = spaceOf(plan), room = space.rooms[i], [cx, cz] = centroid(plan.rooms[i].polygon), out = [], segs = edgesOf(room.poly)
  const sight = (pos, tgt) => { const dx = tgt[0] - pos[0], dz = tgt[2] - pos[2], L = Math.hypot(dx, dz) || 1; return ray(pos[0], pos[2], dx / L, dz / L, segs, 30) }
  room.doors.forEach((d, k) => {
    const pos = [d.at[0] + d.n[0] * 0.45, 1.55, d.at[1] + d.n[1] * 0.45]
    const nb = space.rooms.find((r) => r !== room && r.doors.some((x) => x.id === d.id))
    // look into the room: towards its middle if the walls leave a clear line, otherwise straight in from the door
    const mid = [cx, 0.9, cz], straight = [pos[0] + d.n[0] * 4, 0.9, pos[2] + d.n[1] * 4]
    const target = sight(pos, mid) >= Math.hypot(cx - pos[0], cz - pos[2]) - 0.1 || sight(pos, mid) >= sight(pos, straight) ? mid : straight
    out.push({ id: 'door' + k, name: nb ? 'From ' + nb.name.toLowerCase() : 'From the entrance', pos, target, fov: 68, mode: 'inside', sight: sight(pos, target) })
  })
  const corner = { ...eyeView(plan.rooms[i], 'corner', 'From the corner'), fov: 68, mode: 'inside' }; corner.sight = sight(corner.pos, corner.target); out.push(corner)
  out.sort((a, b) => b.sight - a.sight)
  const xs = plan.rooms[i].polygon.map((p) => p[0]), zs = plan.rooms[i].polygon.map((p) => p[1]), ext = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs))
  out.push({ id: 'top', name: 'Top', pos: [(Math.min(...xs) + Math.max(...xs)) / 2, ext * 1.75 + 1.2, (Math.min(...zs) + Math.max(...zs)) / 2 + 0.001], target: [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2], fov: 40, mode: 'top' })
  return out
}
const spaces = new WeakMap()
const spaceOf = (plan) => { if (!spaces.has(plan)) spaces.set(plan, buildSpace(plan)); return spaces.get(plan) }

// camera standing in the far corner of a room, looking at its middle
function eyeView(room, id, name) {
  const [cx, cz] = centroid(room.polygon)
  let far = room.polygon[0], bd = 0
  for (const q of room.polygon) { const d = Math.hypot(q[0] - cx, q[1] - cz); if (d > bd) { bd = d; far = q } }
  const k = Math.min(0.5, bd * 0.3) / bd
  return { id, name, pos: [far[0] + (cx - far[0]) * k, 1.55, far[1] + (cz - far[1]) * k], target: [cx, 0.8, cz], fov: 68 }
}
export function views(plan) {
  const w = plan.bounds.width, d = plan.bounds.depth, r = Math.max(w, d)
  const aerial = { id: 'aerial', name: "Bird's eye", pos: [w / 2 + r * 0.55, r * 0.95, d / 2 + r * 1.05], target: [w / 2, 0.3, d / 2], fov: 40 }
  const biggest = (type) => plan.rooms.filter((x) => x.type === type).sort((a, b) => b.areaM2 - a.areaM2)[0]
  const living = biggest('living'), bedroom = biggest('bedroom')
  return [aerial, ...(living ? [eyeView(living, 'living', 'Living room')] : []), ...(bedroom ? [eyeView(bedroom, 'bedroom', 'Bedroom')] : [])]
}

let shared
function offscreen(w, h) {
  if (!shared) { shared = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); configure(shared); shared.setPixelRatio(1) }
  shared.setSize(w, h, false)
  return shared
}

// Interior pictures the way an architectural photographer takes them: the camera looks level and the picture is shifted (a shift lens), so walls, window frames and
// cupboards stay vertical and every corner reads as a right angle. A camera that is simply tilted down (what lookAt does) makes verticals lean, the more so the wider the lens.
// Tilt beyond SHIFT_MAX is kept as real tilt (looking steeply down at the floor); straight down needs no correction.
const SHIFT_MAX = (38 * Math.PI) / 180
export function levelCamera(camera, target) {
  const p = camera.position, dx = target.x - p.x, dy = target.y - p.y, dz = target.z - p.z, h = Math.hypot(dx, dz)
  camera.updateProjectionMatrix()
  if (h < 0.05) { camera.lookAt(target); return }
  const phi = Math.atan2(dy, h), shift = Math.max(-SHIFT_MAX, Math.min(SHIFT_MAX, phi))
  camera.lookAt(p.x + dx, p.y + Math.tan(phi - shift) * h, p.z + dz)
  camera.projectionMatrix.elements[9] = Math.tan(shift) * camera.projectionMatrix.elements[5]
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
}

// Render one still. Returns a 2D canvas (so it can be watermarked and exported).
export function renderStill(plan, { option = 'A', view, width = 960, height = 540, look = null, items = null }) {
  const r = offscreen(width, height)
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BACKDROP)
  lighting(scene, plan, r)
  scene.add(buildRoom(plan, option, { look, items, wallHeight: view.id === 'aerial' ? 1.05 : plan.ceilingHeight }))
  tuneMaterials(scene)
  const cam = new THREE.PerspectiveCamera(view.fov, width / height, 0.05, 200)
  cam.position.set(...view.pos)
  if (view.id === 'aerial' || view.mode === 'top') cam.lookAt(...view.target); else levelCamera(cam, new THREE.Vector3(...view.target))          // eye-level pictures keep their verticals vertical
  r.render(scene, cam)
  const out = document.createElement('canvas'); out.width = width; out.height = height
  out.getContext('2d').drawImage(r.domElement, 0, 0)
  scene.traverse((o) => { o.geometry?.dispose?.() })
  return out
}

// A flat, tiled, diagonal watermark baked into the pixels (what a server-side render would deliver as the free preview)
export function watermark(src, text = 'SWIFTRIX PREVIEW') {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height
  const g = c.getContext('2d'); g.drawImage(src, 0, 0)
  g.save(); g.translate(c.width / 2, c.height / 2); g.rotate(-Math.PI / 7)
  const fs = Math.round(c.width / 20); g.font = `800 ${fs}px "Segoe UI", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'
  const stepX = fs * 11, stepY = fs * 3.2
  for (let y = -c.height; y < c.height; y += stepY) for (let x = -c.width * 1.2; x < c.width * 1.2; x += stepX) {
    g.fillStyle = 'rgba(255,255,255,.30)'; g.fillText(text, x + ((Math.round(y / stepY) % 2) * stepX) / 2, y)
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = Math.max(1, fs / 22); g.strokeText(text, x + ((Math.round(y / stepY) % 2) * stepX) / 2, y)
  }
  g.restore()
  return c
}

// Interactive viewer (unlocked result)
export function mountViewer(container, plan, { option = 'A', look = null, items = null, onWall = null } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  configure(renderer)
  container.appendChild(renderer.domElement)
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BACKDROP)
  lighting(scene, plan, renderer)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 300)
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49
  const state = { baseFov: 42, hfov: 1.7, option, look, items, tags: false, cut: true, ceiling: false, ceil: null, room: null, focus: null, mode: 'orbit', lights: null } // starts cut-away so the furniture is visible
  function rebuild() {
    if (state.room) { scene.remove(state.room); state.room.traverse((o) => o.geometry?.dispose?.()) }
    if (state.lights) { scene.remove(state.lights); state.lights = null }
    state.ceil = null
    const inside = state.mode === 'inside' && state.focus !== null
    const flat = Boolean(globalThis.SWX_SHOWCASE) && state.focus === null          // the showcase shows the whole flat in the style of its rooms: full-height walls seen from above, the same light
    const outdoorFocus = state.focus !== null && isOutdoor(plan.rooms[state.focus])          // a terrace or balcony: open sky, no ceiling, daylight
    let items = state.items || layoutFor(plan, state.option)
    if (state.focus !== null) items = items.filter((i) => i.room === state.focus)
    state.room = buildRoom(plan, state.option, { look: state.look, items, tags: state.tags, interior: inside || flat, wallHeight: inside || flat ? plan.ceilingHeight : state.cut ? 0.9 : plan.ceilingHeight, labels: state.focus === null && !globalThis.SWX_SHOWCASE })
    if (inside) {          // a soft light inside; the ceiling only when asked for, so the room can be seen from above (it also hides itself while the camera is above it)
      const poly = plan.rooms[state.focus].polygon
      if (state.ceiling && !outdoorFocus) {
        const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y))), geo = new THREE.ShapeGeometry(shape); geo.rotateX(Math.PI / 2)
        const ceil = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf7f3ec, roughness: 1, side: THREE.DoubleSide })); ceil.position.y = plan.ceilingHeight; ceil.receiveShadow = true; state.room.add(ceil); state.ceil = ceil
      }
      const [cx, cz] = centroid(poly), l = new THREE.Group()
      if (outdoorFocus) l.add(new THREE.HemisphereLight(0xdfeeff, 0xb9a98c, 0.9))
      else { const p = new THREE.PointLight(0xfff1dc, 0.9, 18, 1.2); p.position.set(cx, plan.ceilingHeight - 0.35, cz); l.add(p, new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 0.55)) }
      scene.add(l); state.lights = l
    }
    if (flat) { const l = new THREE.Group(); l.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 0.55)); scene.add(l); state.lights = l }
    scene.add(state.room); tuneMaterials(state.room)
  }
  let touched = false; controls.addEventListener('start', () => { touched = true })
  function setView(kind) {
    touched = false
    const w = plan.bounds.width, d = plan.bounds.depth, r = Math.max(w, d)          // read now: the plan can be rescaled while the viewer is open
    controls.target.set(w / 2, 0, d / 2); state.baseFov = 42; fitFov()
    const k = Math.max(1, 1.1 / camera.aspect) // back off on narrow (portrait) screens so the whole room fits
    if (kind === 'top') camera.position.set(w / 2, r * 1.7 * k, d / 2 + 0.001)
    else if (globalThis.SWX_SHOWCASE) {          // the showcase fills the viewer with the whole flat, however tall or wide the viewer is
      const R = Math.hypot(w, d) / 2 * 0.95, vf = (camera.fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect), dist = R / Math.sin(Math.min(vf, hf) / 2), n = Math.hypot(0.4, 1.25, 0.9)
      camera.position.set(w / 2 + dist * 0.4 / n, dist * 1.25 / n, d / 2 + dist * 0.9 / n)
    } else camera.position.set(w / 2 + r * 0.55 * k, r * 0.95 * k, d / 2 + r * 1.05 * k)
    controls.update()
  }
  // an eye-level picture keeps the width of view it was made for (a 68 degree lens on a 16:9 picture), whatever the shape of the viewer, but never more than 80 degrees up and down
  function fitFov() { camera.fov = state.mode === 'inside' ? Math.min(80, (2 * Math.atan(Math.tan(state.hfov / 2) / camera.aspect) * 180) / Math.PI) : state.baseFov; camera.updateProjectionMatrix() }
  function size() { const b = container.getBoundingClientRect(); if (!b.width) return; renderer.setSize(b.width, b.height, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); const was = camera.aspect; camera.aspect = b.width / b.height; fitFov(); if (globalThis.SWX_SHOWCASE && !touched && state.focus === null && Math.abs(was - camera.aspect) > 0.01) setView(state.mode === 'top' ? 'top' : 'orbit') }          // the showcase frames the flat again when the viewer gets its real shape (it starts hidden)
  const ro = new ResizeObserver(size); ro.observe(container); size()
  // a double click on a wall: which wall (a face of the room in front of it, or both sides when the top of the wall was hit) goes to onWall, which opens the colour choice
  const ray3 = new THREE.Raycaster()
  renderer.domElement.addEventListener('dblclick', (e) => {
    if (!onWall || !state.room) return
    const b = renderer.domElement.getBoundingClientRect(); ray3.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), camera)
    const walls = []; state.room.traverse((o) => { if (o.userData.wall) walls.push(o) })
    const hit = ray3.intersectObjects(walls, false)[0]; if (!hit) return
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld), p = hit.point
    const all = sidesAt(plan, p.x, p.z), one = Math.abs(n.y) < 0.5 ? faceSide(plan, p.x, p.z, n.x, n.z) : null          // the side that was clicked comes first
    const sides = one ? [one, ...all.filter((s) => s.key !== one.key)] : all
    if (sides.length) onWall({ sides, selected: one ? [one] : sides.slice(0, 1), clientX: e.clientX, clientY: e.clientY })
  })
  rebuild(); setView('orbit')
  renderer.setAnimationLoop(() => { controls.update(); if (state.mode === 'inside') levelCamera(camera, controls.target); if (state.ceil) state.ceil.visible = camera.position.y < plan.ceilingHeight - 0.05; renderer.render(scene, camera) })
  return {
    setOption(o) { state.option = o; rebuild() },
    setLook(l) { state.look = l; rebuild() },
    setItems(it) { state.items = it; rebuild() },
    setBoth(o, it) { state.option = o; state.items = it; rebuild() },
    setTags(on) { state.tags = on; rebuild() },
    setCamera(v) { const mode = v.mode || 'orbit'; const changed = mode !== state.mode; state.mode = mode; state.baseFov = v.fov; state.hfov = 2 * Math.atan(Math.tan((v.fov * Math.PI) / 360) * (16 / 9)); fitFov(); camera.position.set(...v.pos); controls.target.set(...v.target); controls.update(); if (changed || state.focus !== null) rebuild() },
    setFocus(i) { state.focus = i; if (i === null) state.mode = 'orbit'; rebuild() },
    setCut(c) { state.cut = c; rebuild() },
    setCeiling(on) { state.ceiling = on; rebuild() },
    refresh() { rebuild() },
    setView: (k) => { state.mode = k === 'top' ? 'top' : 'orbit'; setView(k); rebuild() },
    dispose() { renderer.setAnimationLoop(null); ro.disconnect(); renderer.dispose(); renderer.domElement.remove() },
  }
}
