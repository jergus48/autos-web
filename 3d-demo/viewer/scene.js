// Builds a Three.js scene from a metric plan (lib/build.js output): floors, walls with door and window openings, labels.
import * as THREE from 'three'
import { buildWallBoxes } from '../lib/wallsolid.js'
import { splitsOf } from '../layout/windows.js'
import { isGlazedDoor, isDouble } from '../layout/planedit.js'
import { splitBox, faceColour } from '../layout/wallpaint.js'
import { floorSpec, usualKind } from '../layout/floorspec.js'
import { floorTexture, floorPhotoTexture } from './floortex.js'

// floor colour per kind of room (multiplied with a neutral plank or tile texture: viewer/floortex.js, layout/floorspec.js)
const FLOOR = { living: 0xd2b88f, kitchen: 0xd2b88f, bedroom: 0xcdb08a, bathroom: 0xc9d0d3, hall: 0xcdb08a, storage: 0xcdb08a, office: 0xcdb08a, balcony: 0x9d8f7c, other: 0xd0d0d0 }
function label(text, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160
  const g = c.getContext('2d')
  g.font = '600 52px Segoe UI, Arial'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 8
  g.fillText(text, 256, 70)
  g.font = '400 38px Segoe UI, Arial'; g.fillStyle = '#d9f7a3'; g.fillText(sub, 256, 120)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  spr.scale.set(2.6, 0.8125, 1); spr.renderOrder = 10
  return spr
}

export function buildScene(plan, { wallHeight = plan.ceilingHeight, labels = true, look = null, interior = false } = {}) {
  const group = new THREE.Group()
  const H = wallHeight
  const wallMat = new THREE.MeshStandardMaterial({ color: look?.wall ?? 0xf1ece2, roughness: 0.92 })
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9cc7e8, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1 })

  for (const [ri, r] of plan.rooms.entries()) {
    const shape = new THREE.Shape(r.polygon.map(([x, y]) => new THREE.Vector2(x, y)))
    const geo = new THREE.ShapeGeometry(shape); geo.rotateX(Math.PI / 2)
    // the floor: a photo of the real floor that the person added, else what the photos showed (look.floorSpecs: kind, board size, layout, shade, grain, gloss, joints), else the usual floor of this kind of room
    const photo = look?.floorImages?.[ri] ? floorPhotoTexture(look.floorImages[ri]) : null, usual = usualKind(r.type), spec = look?.floorSpecs?.[ri] || (usual ? floorSpec({ kind: usual }) : null)
    const tex = photo || (spec ? floorTexture(spec) : null), rough = photo ? 0.6 : spec?.kind === 'carpet' ? 0.95 : spec ? 0.8 - 0.5 * spec.gloss : 0.62
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: photo ? 0xffffff : look?.floors?.[ri] ?? (FLOOR[r.type] || FLOOR.other), map: tex, roughness: rough, side: THREE.DoubleSide }))
    mesh.position.y = 0.001; mesh.receiveShadow = true; group.add(mesh)
    if (labels) {
      const xs = r.polygon.map((p) => p[0]), ys = r.polygon.map((p) => p[1])
      // centre of the largest bounding rectangle is fine for rectangles; for L-shapes use the polygon centroid-ish point inside
      let cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
      if (!inside(cx, cy, r.polygon)) { const c = r.polygon.reduce((a, p) => [a[0] + p[0] / r.polygon.length, a[1] + p[1] / r.polygon.length], [0, 0]); cx = c[0]; cy = c[1] }
      const s = label(r.name, r.areaM2 + ' m²'); s.position.set(cx, 0.5, cy); group.add(s)
    }
  }

  if (plan.wallBoxes) {
    // walls as one solid (lib/wallsolid.js): interior white, exterior front dark, back walls white; cut-away lowers everything
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x8d9097, roughness: 0.8 })          // the outside of the front walls: a soft grey on the grey backdrop, not a black base
    const ceil = plan.ceilingHeight, lowTop = 1.1
    // walls the person painted (plan.wallColors, layout/wallpaint.js): every face gets its own colour (vertex colours); without paint the walls are drawn exactly as before
    const painted = Object.keys(plan.wallColors || {}).length > 0, paintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9 })
    const usual = (b) => (b.cls === 'ext' && !b.back && !interior ? 0x8d9097 : look?.wall ?? 0xf1ece2)
    const tint = (geo, faces, base) => { const col = new Float32Array(geo.attributes.position.count * 3), c = new THREE.Color(); faces.forEach((hex, f) => { c.setHex(hex ?? base); for (let v = 0; v < 4; v++) col.set([c.r, c.g, c.b], (f * 4 + v) * 3) }); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)) }
    // views from inside the room use full-height walls with every window cut; the dollhouse views use the cut-away version
    const boxes = interior ? (plan.wallBoxesInterior ||= buildWallBoxes(plan.rooms, plan.openings, plan.walls, { low: plan.ceilingHeight, full: plan.ceilingHeight, allWindows: true })) : plan.wallBoxes
    const railGlass = new THREE.MeshStandardMaterial({ color: 0xbfd9e8, transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1 }), railCap = new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.4, metalness: 0.5 })
    for (const b of boxes) {
      if (b.diag) continue          // the steps of an angled wall: its straight prisms (slant) are drawn instead
      let y0 = b.y0, y1 = b.y1
      if (b.cls === 'rail') {          // a glass balustrade with a slim steel rail on top
        const top = Math.min(y1, H); if (top < 0.1) continue
        const g = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, top - 0.04, b.z1 - b.z0), railGlass); g.position.set((b.x0 + b.x1) / 2, (top - 0.04) / 2, (b.z0 + b.z1) / 2); group.add(g)
        const c = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0 + 0.02, 0.04, b.z1 - b.z0 + 0.02), railCap); c.position.set((b.x0 + b.x1) / 2, top - 0.02, (b.z0 + b.z1) / 2); c.castShadow = true; group.add(c)
        continue
      }
      if (H < ceil) { if (y0 >= H) continue; y1 = Math.min(y1, H) } else if (Math.abs(y1 - lowTop) < 1e-6 && y0 === 0) y1 = ceil
      if (y1 - y0 < 0.01) continue
      if (b.slant) {          // an angled wall: its outline extruded upwards
        const shape = new THREE.Shape(b.slant.map(([x, z]) => new THREE.Vector2(x, z))); for (const h of b.holes || []) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, z))))
        const geo = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false }); geo.rotateX(Math.PI / 2)
        let sg = geo
        if (painted) {          // an angled wall: one colour for each triangle, by the way it faces
          sg = geo.index ? geo.toNonIndexed() : geo; const pos = sg.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), a = new THREE.Vector3(), q = new THREE.Vector3(), r = new THREE.Vector3(), n = new THREE.Vector3()
          for (let t = 0; t < pos.count; t += 3) {
            a.fromBufferAttribute(pos, t); q.fromBufferAttribute(pos, t + 1); r.fromBufferAttribute(pos, t + 2); n.crossVectors(q.clone().sub(a), r.clone().sub(a)).normalize()
            const mx = (a.x + q.x + r.x) / 3, mz = (a.z + q.z + r.z) / 3, hit = Math.abs(n.y) < 0.5 ? faceColour(plan, mx, mz, n.x, n.z) : null
            c.setHex(hit ?? usual(b)); for (let v = 0; v < 3; v++) col.set([c.r, c.g, c.b], (t + v) * 3)
          }
          sg.setAttribute('color', new THREE.BufferAttribute(col, 3))
        }
        const sm = new THREE.Mesh(sg, painted ? paintMat : b.cls === 'ext' && !b.back && !interior ? darkMat : wallMat); sm.position.y = y1; sm.castShadow = true; sm.receiveShadow = true; sm.userData.wall = true; group.add(sm); continue
      }
      if (painted) {          // split where the paint changes along the wall; each piece has the colour of each of its sides
        for (const q of splitBox(plan, b)) {
          const g = new THREE.BoxGeometry(q.x1 - q.x0, y1 - y0, q.z1 - q.z0); tint(g, [q.c.px, q.c.nx, null, null, q.c.pz, q.c.nz], usual(b))          // (the order of the faces of a box: +x, -x, top, bottom, +z, -z)
          const m = new THREE.Mesh(g, paintMat); m.position.set((q.x0 + q.x1) / 2, (y0 + y1) / 2, (q.z0 + q.z1) / 2); m.castShadow = true; m.receiveShadow = true; m.userData.wall = true; group.add(m)
        }
        continue
      }
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, y1 - y0, b.z1 - b.z0), b.cls === 'ext' && !b.back && !interior ? darkMat : wallMat)
      m.position.set((b.x0 + b.x1) / 2, (y0 + y1) / 2, (b.z0 + b.z1) / 2); m.castShadow = true; m.receiveShadow = true; m.userData.wall = true; group.add(m)
    }
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.5, metalness: 0.2 })
    for (const o of plan.openings) {          // windows: glass, a frame, and bars that divide it into panes; a sliding door is a window that reaches the floor
      if (o.kind !== 'window' && !isGlazedDoor(o)) continue
      const w = plan.walls.find((q) => q.id === o.wall); if (!w || o.sill >= H - 0.05) continue
      const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy), h = Math.min(o.height, H - o.sill), bar = 0.05, g = new THREE.Group()
      const part = (mat, bw, bh, bd, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); m.position.set(x, y, 0); m.castShadow = mat !== glassMat; g.add(m) }
      part(glassMat, o.width, h, 0.03, 0, 0)
      // the frame overlaps the opening by a few millimetres, so its faces are never flush with the cut faces of the wall (flush faces flicker as a jagged line)
      const ov = 0.006
      part(frameMat, o.width + 2 * bar, bar, 0.12, 0, h / 2 + bar / 2 - ov); part(frameMat, o.width + 2 * bar, bar, 0.12, 0, -h / 2 - bar / 2 + ov)
      part(frameMat, bar, h + 2 * bar, 0.12, -o.width / 2 - bar / 2 + ov, 0); part(frameMat, bar, h + 2 * bar, 0.12, o.width / 2 + bar / 2 - ov, 0)
      for (const f of (o.kind === 'door' ? (isDouble(o) ? [0.5] : Array.from({ length: Math.max(1, Math.round(o.width / 1.2) - 1) }, (_, k) => (k + 1) / Math.max(2, Math.round(o.width / 1.2)))) : splitsOf(o))) part(frameMat, 0.04, h, 0.08, -o.width / 2 + o.width * f, 0)
      g.position.set(w.a[0] + (dx / L) * o.offset, o.sill + h / 2, w.a[1] + (dy / L) * o.offset); g.rotation.y = -Math.atan2(dy, dx); group.add(g)
    }
    return group
  }

  const byWall = new Map()
  for (const o of plan.openings) (byWall.get(o.wall) || byWall.set(o.wall, []).get(o.wall)).push(o)
  plan.walls.forEach((w, wi) => {
    const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy)
    if (L < 0.05) return
    const t = (w.thickness ?? (w.exterior ? 0.25 : 0.12)) + wi * 0.0004
    const ang = -Math.atan2(dy, dx)
    const piece = (s0, s1, y0, y1, mat = wallMat) => {
      if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return
      const geo = new THREE.BoxGeometry(s1 - s0, y1 - y0, mat === glassMat ? 0.03 : t)
      const m = new THREE.Mesh(geo, mat)
      const mid = (s0 + s1) / 2
      m.position.set(w.a[0] + (dx / L) * mid, (y0 + y1) / 2, w.a[1] + (dy / L) * mid)
      m.rotation.y = ang; m.castShadow = mat !== glassMat; m.receiveShadow = true; group.add(m)
    }
    const ops = (byWall.get(w.id) || []).slice().sort((p, q) => p.offset - q.offset)
    let cur = -t / 2
    for (const o of ops) {
      const s0 = o.offset - o.width / 2, s1 = o.offset + o.width / 2
      piece(cur, s0, 0, H)
      if (o.sill > 0) piece(s0, s1, 0, Math.min(o.sill, H))
      piece(s0, s1, Math.min(o.sill + o.height, H), H)
      if (o.kind === 'window') piece(s0, s1, o.sill, Math.min(o.sill + o.height, H), glassMat)
      cur = s1
    }
    piece(cur, L + t / 2, 0, H)
  })
  return group
}

function inside(x, y, p) {
  let c = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
