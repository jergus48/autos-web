// The measured space of a plan: for every room its true free floor (room polygon minus the wall solids), its edges,
// and the doors and windows that sit on each edge (with the floor in front of them that must stay free).
import { obb, aabb, pip, rotOf, polyArea, bboxOf, rectInPoly, overlaps } from './geom.js'
import { RULES } from './catalog.js'

// the kinds a person can give a room in the editor (value, label); `userKind` on a room wins over what its name says
export const KIND_OPTIONS = [['living', 'Living room'], ['living_dining', 'Living and dining'], ['living_kitchen', 'Kitchen and living (open plan)'], ['kitchen', 'Kitchen'], ['kitchen_dining', 'Kitchen and dining'], ['bedroom', 'Bedroom'], ['office', 'Office (desks)'], ['meeting', 'Meeting room'],
  ['bathroom', 'Bathroom'], ['bath', 'Bathroom (bath, no toilet)'], ['wc', 'WC'], ['hall', 'Hall'], ['storage', 'Storage or dressing room'], ['terrace', 'Terrace (outdoor)'], ['balcony', 'Balcony (outdoor)'], ['none', 'Not furnished']]
const USER_KIND = { living: { kind: 'living', dining: false }, living_dining: { kind: 'living', dining: true }, living_kitchen: { kind: 'living', dining: true, kitchen: true }, kitchen: { kind: 'kitchen', dining: false }, kitchen_dining: { kind: 'kitchen', dining: true },
  bedroom: { kind: 'bedroom', dining: false }, office: { kind: 'office', dining: false }, meeting: { kind: 'meeting', dining: false }, bathroom: { kind: 'bathroom', dining: false }, bath: { kind: 'bathroom', dining: false, noToilet: true }, wc: { kind: 'wc', dining: false }, hall: { kind: 'hall', dining: false }, storage: { kind: 'storage', dining: false }, terrace: { kind: 'terrace', dining: false }, balcony: { kind: 'balcony', dining: false }, none: { kind: 'none', dining: false } }
// the schema type (what the plan reader returns) that goes with each editor kind: it picks the floor of the 3D view
export const TYPE_OF_KIND = { living: 'living', living_dining: 'living', living_kitchen: 'living', kitchen: 'kitchen', kitchen_dining: 'kitchen', bedroom: 'bedroom', office: 'office', meeting: 'office', bathroom: 'bathroom', bath: 'bathroom', wc: 'bathroom', hall: 'hall', storage: 'storage', terrace: 'balcony', balcony: 'balcony', none: 'other' }
// outdoor areas are not rooms: no ceiling, a railing instead of walls, outdoor furniture
export const OUTDOOR = new Set(['terrace', 'balcony'])
// the style of a door: 'hinged' (one leaf), 'double' (two leaves, a French door) or 'sliding' (glass that slides). A door nobody gave a style is sliding when it is wider than 1.3 m
export const DOOR_STYLES = [['hinged', 'Hinged'], ['double', 'Double'], ['sliding', 'Sliding']]
export const doorStyle = (o) => o.style || (o.sliding ? 'sliding' : o.width > 1.3 ? 'sliding' : 'hinged')
export const isOutdoor = (room) => OUTDOOR.has(kindOf(room).kind)

// what a room is used for, from its name (English and Lithuanian) first, then its type
export function kindOf(room) {
  if (room.userKind && USER_KIND[room.userKind]) return { ...USER_KIND[room.userKind] }
  const n = (room.name || '').toLowerCase(), t = room.type
  if (/sauna|pirtis/.test(n)) return { kind: 'none', dining: false }
  const dining = /dining|valgom/.test(n)
  if (/\bwc\b|toilet|tualet/.test(n)) return { kind: 'wc', dining: false }
  if (/bath|vonia|vonios|shower|du[sš]/.test(n)) return { kind: 'bathroom', dining: false }
  const isK = /kitchen|virtuv/.test(n), isL = /living|lounge|svetain|salon/.test(n)
  if (isK && isL) return { kind: 'living', dining: true, kitchen: true }            // an open-plan living kitchen gets both
  if (isK) return { kind: 'kitchen', dining }
  if (isL) return { kind: 'living', dining }
  if (dining) return { kind: 'living', dining: true }
  if (/meeting|conference|boardroom|besprech|susitik/.test(n)) return { kind: 'meeting', dining: false }
  if (/office|workspace|open space|biur|kabinet|b[uü]ro|arbeitsz|darbo/.test(n)) return { kind: 'office', dining: false }
  if (/bed|miegam|kambarys/.test(n)) return { kind: 'bedroom', dining: false }
  if (/hall|holas|korid|prie[sš]kamb|entr/.test(n)) return { kind: 'hall', dining: false }
  if (/dressing|wardrobe|drab|storage|sand[eė]l/.test(n)) return { kind: 'storage', dining: false }
  if (/terra|patio|veranda|\bdeck\b|lod[zž]/.test(n)) return { kind: 'terrace', dining: false }
  if (/balcon|balkon/.test(n)) return { kind: 'balcony', dining: false }
  const k = { living: 'living', kitchen: 'kitchen', bedroom: 'bedroom', bathroom: 'bathroom', hall: 'hall', storage: 'storage', balcony: 'balcony', office: 'office', dining: 'living' }[t]
  return { kind: k || 'none', dining: t === 'dining' }
}

export function buildSpace(plan) {
  const walls = new Map(plan.walls.map((w) => [w.id, w]))
  const boxes = (plan.wallBoxes || []).filter((b) => b.y0 < 0.05 && b.y1 - b.y0 > 0.2 && !b.slant).map((b) => ({ ...b, o: aabb(b.x0, b.z0, b.x1, b.z1) }))
  const rooms = plan.rooms.map((r, i) => {
    const poly = r.polygon, k = kindOf(r), bb = bboxOf(poly)
    const edges = poly.map((a, j) => {
      const b = poly[(j + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1e-9
      const t = [dx / len, dz / len]; let n = [-t[1], t[0]]
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2
      if (!pip(mx + n[0] * 0.05, mz + n[1] * 0.05, poly)) n = [-n[0], -n[1]]
      return { i: j, a, b, len, t, n, openings: [] }
    })
    const room = { i, id: r.id, name: r.name, type: r.type, ...k, outdoor: OUTDOOR.has(k.kind), poly, area: polyArea(poly), bb, edges, doors: [], windows: [], blockers: [] }
    const bo = aabb(bb.x0 - 0.1, bb.z0 - 0.1, bb.x1 + 0.1, bb.z1 + 0.1)
    room.blockers = boxes.filter((b) => overlaps(b.o, bo, 0)).map((b) => b.o)
    return room
  })
  // an edge of an outdoor area is either the house wall or a railing: look at what the wall solids are just outside the edge
  const rails = (plan.wallBoxes || []).filter((b) => b.cls === 'rail')
  for (const room of rooms) for (const e of room.edges) {
    if (!rails.length || e.len < 0.2) { e.rail = false; continue }
    let hit = 0; const probes = [0.2, 0.35, 0.5, 0.65, 0.8]
    for (const k of probes) { const px = e.a[0] + e.t[0] * e.len * k - e.n[0] * 0.05, pz = e.a[1] + e.t[1] * e.len * k - e.n[1] * 0.05; if (rails.some((b) => px >= b.x0 - 0.02 && px <= b.x1 + 0.02 && pz >= b.z0 - 0.02 && pz <= b.z1 + 0.02)) hit++ }
    e.rail = hit >= 3
  }
  // doors and windows of each wall go to every room edge that lies along that wall
  for (const op of plan.openings) {
    const w = walls.get(op.wall); if (!w) continue
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz), u = [dx / L, dz / L], c = [w.a[0] + u[0] * op.offset, w.a[1] + u[1] * op.offset]
    const half = Math.max(w.thickness || 0.12, 0.12) / 2 + 0.25
    for (const room of rooms) for (const e of room.edges) {
      if (e.len < 0.2 || Math.abs(u[0] * e.t[0] + u[1] * e.t[1]) < 0.98) continue
      const rx = c[0] - e.a[0], rz = c[1] - e.a[1], s = rx * e.t[0] + rz * e.t[1], d = rx * e.n[0] + rz * e.n[1]
      if (Math.abs(d) > half || s < -0.1 || s > e.len + 0.1) continue
      const at = [e.a[0] + e.t[0] * s, e.a[1] + e.t[1] * s], rot = rotOf(e.n[0], e.n[1])
      const item = { id: op.id, kind: op.kind, width: op.width, height: op.height, sill: op.sill, s, s0: s - op.width / 2, s1: s + op.width / 2, edge: e.i, at, n: e.n }
      e.openings.push(item)
      if (op.kind === 'window') {
        item.zone = obb(at[0] + e.n[0] * RULES.windowDepth / 2, at[1] + e.n[1] * RULES.windowDepth / 2, op.width + 0.2, RULES.windowDepth, rot)
        room.windows.push(item)
      } else {
        const style = op.kind === 'door' ? doorStyle(op) : null, sliding = style === 'sliding'
        const depth = sliding ? RULES.slidingLanding : style === 'double' ? Math.max(RULES.doorLanding, op.width / 2) : Math.max(op.kind === 'door' ? RULES.doorLanding : 0.6, op.kind === 'door' ? op.width : 0)          // a double door swings as far as one leaf is wide
        item.zone = obb(at[0] + e.n[0] * depth / 2, at[1] + e.n[1] * depth / 2, op.width + 0.1, depth, rot)
        if (sliding) item.soft = true          // a sliding glass door only needs a way through (90 cm of the glass free), furniture may stand in front of the rest
        item.entry = [at[0] + e.n[0] * 0.4, at[1] + e.n[1] * 0.4]
        room.doors.push(item)
      }
    }
  }
  // every door and window knows the room on its other side (null for the outside), so a recipe can put the dining set at the kitchen door and the lounge at the living room
  for (const room of rooms) for (const d of [...room.doors, ...room.windows]) { const other = rooms.find((r) => r !== room && [...r.doors, ...r.windows].some((x) => x.id === d.id)); d.other = other ? other.i : null; d.otherKind = other ? other.kind : null }
  return { rooms, boxes: boxes.map((b) => b.o) }
}

// how much of a sliding glass door stays free: the longest run (metres) along the glass where no piece stands in the strip in front of it
export function freeRun(door, bodies) {
  const z = door.zone, sx = Math.cos(z.rot), sz = -Math.sin(z.rot), half = z.w / 2, blocked = []
  for (const o of bodies) {
    if (!overlaps(z, o, 0.005)) continue
    const xs = o.pts.map((p) => (p[0] - z.x) * sx + (p[1] - z.z) * sz)          // the stretch of the glass the piece covers (its shadow on the door's line)
    blocked.push([Math.min(...xs), Math.max(...xs)])
  }
  blocked.sort((a, b) => a[0] - b[0])
  let best = 0, at = -half
  for (const [a, b] of blocked) { if (a > at) best = Math.max(best, Math.min(a, half) - at); at = Math.max(at, b); if (at >= half) break }
  return Math.max(best, half - at)
}

// does a rectangle fit in the room's free floor (inside the polygon, clear of wall solids)?
export function fitsRoom(room, o) {
  if (!rectInPoly(o, room.poly)) return false
  for (const b of room.blockers) if (overlaps(o, b, 0.004)) return false
  return true
}
