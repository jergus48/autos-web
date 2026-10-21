// Painting walls. A wall is one room's face of one edge of its outline: the key is "<room id>|<edge number>", and "<room id>|*" is the whole room.
// plan.wallColors = { key: '#rrggbb' } (the app keeps it per room of the person, see app/app.js lookOf). A face of the wall solids (lib/wallsolid.js) belongs to the room in front of it,
// and to the edge of that room's outline that lies nearest to the face, so the two sides of a wall between two rooms, and the walls of different rooms that run along one line, are painted apart.
import { pip, segDist } from './geom.js'

export const WHOLE = '*'
const HEX = /^#[0-9a-f]{6}$/i
const num = (h) => (typeof h === 'string' && HEX.test(h) ? parseInt(h.slice(1), 16) : null)

export const roomAt = (plan, x, z) => plan.rooms.findIndex((r) => pip(x, z, r.polygon))

// the edge of a room's outline nearest to a point; with a face normal only edges that run along the face count (a corner face does not pick the wall that ends there)
function nearestEdge(poly, x, z, nx = null, nz = null) {
  let best = { i: -1, d: Infinity, t: 0 }
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    if (nx !== null && Math.abs(((b[0] - a[0]) * nx + (b[1] - a[1]) * nz) / L) > 0.5) continue
    const d = segDist(x, z, a, b)
    if (d < best.d) best = { i, d, t: ((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / (L * L) }
  }
  return best
}

// which way a wall of a room lies, in words: the plan has north at the top
export function sideLabel(room, edge) {
  const p = room.polygon, a = p[edge], b = p[(edge + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  let nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L          // the way into the room
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
  if (!pip(mx + nx * 0.05, mz + nz * 0.05, p)) { nx = -nx; nz = -nz }
  const name = Math.abs(nz) > 0.9 ? (nz > 0 ? 'north' : 'south') : Math.abs(nx) > 0.9 ? (nx > 0 ? 'west' : 'east') : 'angled'
  return `${room.name}, ${name} wall`
}

const side = (plan, ri, edge) => ({ room: plan.rooms[ri], ri, edge, key: plan.rooms[ri].id + '|' + edge, label: sideLabel(plan.rooms[ri], edge) })

// the wall a face of the solids belongs to: the room in front of the face (a little way out from its centre) and that room's nearest edge, or null (outside the house, inside a wall)
export function faceSide(plan, x, z, nx, nz, probe = 0.1) {
  const ri = roomAt(plan, x + nx * probe, z + nz * probe); if (ri < 0) return null
  const e = nearestEdge(plan.rooms[ri].polygon, x, z, nx, nz)
  return e.i < 0 ? null : side(plan, ri, e.i)
}

// the walls at a point of the plan or of the top of a wall: one for each room whose outline runs beside it (a wall between two rooms has two sides), nearest first
export function sidesAt(plan, x, z, reach = 0.4) {
  const out = []
  plan.rooms.forEach((r, ri) => {
    const e = nearestEdge(r.polygon, x, z)
    if (e.i >= 0 && e.d <= reach && e.t > -0.05 && e.t < 1.05) out.push({ ...side(plan, ri, e.i), d: e.d })
  })
  return out.sort((p, q) => p.d - q.d)
}

// is a point on (or within tol of) the wall solids at floor level
export function nearWall(plan, x, z, tol = 0.08) {
  for (const b of plan.wallBoxes || []) {
    if (b.y0 >= 0.05 || b.cls === 'rail') continue
    if (b.slant) {
      if (pip(x, z, b.slant)) return true
      for (let i = 0; i < b.slant.length; i++) if (segDist(x, z, b.slant[i], b.slant[(i + 1) % b.slant.length]) <= tol) return true
    } else if (x >= b.x0 - tol && x <= b.x1 + tol && z >= b.z0 - tol && z <= b.z1 + tol) return true
  }
  return false
}

export const colours = (plan) => plan?.wallColors || {}
// the colour of a wall: its own, else the one of the whole room, else none (the walls keep their usual colour)
export const colourOf = (map, key) => num(map?.[key]) !== null ? map[key] : num(map?.[key.split('|')[0] + '|' + WHOLE]) !== null ? map[key.split('|')[0] + '|' + WHOLE] : null
export function faceColour(plan, x, z, nx, nz) {
  const map = plan.wallColors; if (!map || !Object.keys(map).length) return null
  const s = faceSide(plan, x, z, nx, nz); if (!s) return null
  const c = colourOf(map, s.key); return c === null ? null : num(c)
}

// paint the given walls (or, with whole, every wall of their rooms); no colour takes the paint off again
export function paint(map, sides, hex, whole = false) {
  if (hex !== null && !HEX.test(hex)) return map
  for (const s of sides) {
    if (whole) { for (const k of Object.keys(map)) if (k.startsWith(s.room.id + '|')) delete map[k]; if (hex) map[s.room.id + '|' + WHOLE] = hex.toLowerCase() }
    else if (hex) map[s.key] = hex.toLowerCase()
    else delete map[s.key]
  }
  return map
}

// A box of the wall solids split where its faces change colour (a long wall box can run along the walls of two rooms), each piece with the colour of its four sides (null: the usual colour).
// pz is the face looking towards +z and so on. Without any paint the box stays one piece with no colours.
export function splitBox(plan, b, step = 0.03) {
  const none = { px: null, nx: null, pz: null, nz: null }
  if (!plan.wallColors || !Object.keys(plan.wallColors).length) return [{ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, c: none }]
  const col = (x, z, nx, nz) => faceColour(plan, x, z, nx, nz)
  const cuts = (lo, hi, at) => {
    const n = Math.max(1, Math.ceil((hi - lo) / step)), out = []; let prev = at(lo + (hi - lo) / (2 * n))
    for (let i = 1; i < n; i++) { const cur = at(lo + ((hi - lo) * (i + 0.5)) / n); if (cur !== prev) { out.push(lo + ((hi - lo) * i) / n); prev = cur } }
    return out
  }
  const xs = [b.x0, ...cuts(b.x0, b.x1, (x) => col(x, b.z1, 0, 1) + '/' + col(x, b.z0, 0, -1)), b.x1], zs = [b.z0, ...cuts(b.z0, b.z1, (z) => col(b.x1, z, 1, 0) + '/' + col(b.x0, z, -1, 0)), b.z1]
  const out = []
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const xa = xs[i], xb = xs[i + 1], za = zs[j], zb = zs[j + 1], mx = (xa + xb) / 2, mz = (za + zb) / 2
    out.push({ x0: xa, x1: xb, z0: za, z1: zb, c: { px: i + 2 === xs.length ? col(b.x1, mz, 1, 0) : null, nx: i === 0 ? col(b.x0, mz, -1, 0) : null, pz: j + 2 === zs.length ? col(mx, b.z1, 0, 1) : null, nz: j === 0 ? col(mx, b.z0, 0, -1) : null } })
  }
  return out
}
