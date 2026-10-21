// Draws a model in four views (three-quarter, front, side from the right, top) in the light of the app's 3D view on a plain light background: for the developer preview (model-preview.html) and for the
// check of an automatic model, where the picture of the draft goes back to the vision model together with the product pictures.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { buildPiece, PALETTES } from './simple3d.js'
import { registerModel } from '../layout/models.js'

// returns a data URL of the picture when mime is given ('image/jpeg'), else null; the canvas keeps the picture when dispose is false
export function drawModelViews(canvas, model, { width = 1400, height = 900, mime = null, quality = 0.85, dispose = true, only = null } = {}) {
  canvas.width = width; canvas.height = height
  registerModel(model)
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(width, height, false); r.setScissorTest(true)
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdfe2e5)
  { const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose() }
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a5f70, 0.5))
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.5); sun.position.set(3.2, 4.5, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 4; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, far: 30 }); sun.shadow.camera.updateProjectionMatrix(); scene.add(sun)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b0, 0.55))
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0xc4c8cc, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const { w, d, h } = model.dims, it = { type: 'product', w, d, h, x: 0, z: 0, rot: 0, id: 'm', product: { modelKey: model.key } }
  const g = buildPiece(it, PALETTES.A); g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.isMeshStandardMaterial) o.material.envMapIntensity = 0.55 } }); scene.add(g)
  const big = Math.max(w, d, h), cy = h * 0.45, dist = Math.max((w + d * 0.5) * 1.3, h * 2.1, d * 2, 1.2)          // far enough that the whole piece is in every view, as large as possible
  const views = [['three-quarter', [dist * 0.95, cy + big * 0.7, dist * 1.0]], ['front', [0, cy, dist * 1.25]], ['side', [dist * 1.25, cy, 0]], ['top', [0, dist * 1.75, 0]]]
  const one = only ? views.find(([n]) => n === only) : null          // only: a single view across the whole picture (a card thumbnail)
  const cw = one ? width : width / 2, ch = one ? height : height / 2
  ;(one ? [one] : views).forEach(([name, pos], i) => {
    const x = (i % 2) * cw, y = Math.floor(i / 2) * ch, cam = new THREE.PerspectiveCamera(28, cw / ch, 0.1, 100)
    if (name === 'top') cam.up.set(0, 0, -1)          // seen from above the front is at the bottom of the picture
    cam.position.set(...pos); cam.lookAt(0, name === 'top' ? 0 : cy, 0)
    r.setViewport(x, height - y - ch, cw, ch); r.setScissor(x, height - y - ch, cw, ch); r.render(scene, cam)
  })
  const url = mime ? canvas.toDataURL(mime, quality) : null
  if (dispose) { scene.traverse((o) => o.geometry?.dispose?.()); r.dispose(); r.forceContextLoss() }
  return url
}
