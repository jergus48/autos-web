// Changing the structure of a plan: delete a room, or take away the wall between two rooms (which joins them). The walls are worked out again from the rooms that are left, the same way the
// plan reader works them out (lib/build.js wallsOfRooms), and the doors and windows stay where their wall still is: one that stood in a wall that is gone is dropped.
// Every change is made on the plan object itself; the caller keeps a snapshot from before (snapshot / restoreSnapshot) so that it can be undone.
import { wallsOfRooms, polyArea } from '../lib/build.js'
import { TYPE_OF_KIND, KIND_OPTIONS } from './space.js'

const r2 = (v) => Math.round(v * 100) / 100
const clone = (o) => JSON.parse(JSON.stringify(o))

// ---- snapshots: what a structure change touches (rooms, walls, openings, furniture drawn in the plan, bounds, scale)
export const snapshot = (plan) => clone({ rooms: plan.rooms, walls: plan.walls, openings: plan.openings, furniture: plan.furniture || null, bounds: plan.bounds, scale: plan.scale, baseScale: plan._baseScale || 1 })
export function restoreSnapshot(plan, s) {
  const c = clone(s)
  plan.rooms = c.rooms; plan.walls = c.walls; plan.openings = c.openings; plan.bounds = c.bounds; plan.scale = c.scale; plan._baseScale = c.baseScale
  if (c.furniture) plan.furniture = c.furniture; else delete plan.furniture
  return plan
}

// ---- the walls again, after the rooms changed
const inPoly = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
export function rewalls(plan, remap = null) {
  const old = plan.walls || []
  const spots = plan.openings.map((o) => {          // where each opening stood, in metres, and along which direction
    const w = old.find((q) => q.id === o.wall); if (!w) return null
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1
    return { x: w.a[0] + (dx / L) * o.offset, z: w.a[1] + (dz / L) * o.offset, ux: dx / L, uz: dz / L }
  })
  plan.walls = wallsOfRooms(plan.rooms)
  const kept = []
  plan.openings.forEach((o, i) => {
    const sp = remap && spots[i] ? remap(spots[i], o) || spots[i] : spots[i]; if (!sp) return
    let best = null
    for (const w of plan.walls) {
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz); if (L < 0.2) continue
      const ux = dx / L, uz = dz / L; if (Math.abs(sp.ux * uz - sp.uz * ux) > 0.25) continue          // a wall that runs the same way
      const t = Math.max(0, Math.min(L, (sp.x - w.a[0]) * ux + (sp.z - w.a[1]) * uz)), d = Math.hypot(sp.x - (w.a[0] + ux * t), sp.z - (w.a[1] + uz * t))
      if (!best || d < best.d) best = { w, d, t, L }
    }
    if (!best || best.d > 0.5) return          // its wall is gone: so is the opening
    const width = Math.min(o.width, Math.max(0.3, best.L - 0.1))
    kept.push({ ...o, wall: best.w.id, width: r2(width), offset: r2(Math.max(width / 2, Math.min(best.L - width / 2, best.t))) })
  })
  plan.openings = kept
  const xs = plan.rooms.flatMap((r) => r.polygon.map((p) => p[0])), zs = plan.rooms.flatMap((r) => r.polygon.map((p) => p[1]))
  plan.bounds = { width: r2(Math.max(...xs)), depth: r2(Math.max(...zs)) }
  if (plan.furniture) plan.furniture = plan.furniture.filter((f) => plan.rooms.some((r) => inPoly(f.x, f.z, r.polygon)))
  return plan
}

// ---- delete a room
export function deleteRoom(plan, id) {
  const i = plan.rooms.findIndex((r) => r.id === id)
  if (i < 0) return { ok: false, error: 'That room is not on the plan.' }
  if (plan.rooms.length < 2) return { ok: false, error: 'A plan needs at least one room.' }
  const room = plan.rooms[i], dropped = plan.openings.length
  plan.rooms.splice(i, 1); rewalls(plan)
  return { ok: true, removed: [room.id], mapped: {}, name: room.name, openingsDropped: dropped - plan.openings.length }
}

// ---- join two rooms: the union of their outlines, with the wall between them gone
const K = (p) => Math.round(p[0] * 1000) + ',' + Math.round(p[1] * 1000)
const signed = (p) => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + (q[0] * r[1] - r[0] * q[1]) / 2 }, 0)
const onSegment = (q, a, b, tol = 0.006) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 1e-9) return false
  const t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / (L * L), d = Math.abs((q[0] - a[0]) * dz - (q[1] - a[1]) * dx) / L
  return d <= tol && t > 1e-6 && t < 1 - 1e-6
}
// the outline with an extra point wherever a point of the other outline lies on one of its edges
function split(poly, other) {
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]; out.push(a)
    const on = other.filter((q) => onSegment(q, a, b)).sort((p, q) => Math.hypot(p[0] - a[0], p[1] - a[1]) - Math.hypot(q[0] - a[0], q[1] - a[1]))
    for (const q of on) if (K(q) !== K(out[out.length - 1])) out.push(q)
  }
  return out
}
const edges = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]])
function simplify(poly) {
  let p = poly.filter((q, i) => K(q) !== K(poly[(i + poly.length - 1) % poly.length]))
  for (let again = true; again && p.length > 3;) {
    again = false
    p = p.filter((q, i, a) => { const o = a[(i + a.length - 1) % a.length], n = a[(i + 1) % a.length]; const cross = (q[0] - o[0]) * (n[1] - q[1]) - (q[1] - o[1]) * (n[0] - q[0]); if (Math.abs(cross) < 1e-6) { again = true; return false } return true })
  }
  return p
}

// the edges of two outlines, with the pairs that lie on each other (one running the way the other comes back) taken out: what is left is the outline of the union
function union(A, B) {
  const a = signed(A) >= 0 ? A : [...A].reverse(), b = signed(B) >= 0 ? B : [...B].reverse()          // both the same way round
  const sa = split(a, b), sb = split(b, a), ea = edges(sa), eb = edges(sb)
  const keyOf = (e) => K(e[0]) + '>' + K(e[1]), setA = new Set(ea.map(keyOf)), setB = new Set(eb.map(keyOf))
  let shared = 0; const rest = []
  for (const e of ea) { const back = K(e[1]) + '>' + K(e[0]); if (setB.has(back)) shared += Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]); else rest.push(e) }
  for (const e of eb) { const back = K(e[1]) + '>' + K(e[0]); if (!setA.has(back)) rest.push(e) }
  return { shared, rest }
}

// how long the wall is that two rooms share, in metres (0: they do not touch)
export function sharedLength(plan, idA, idB) {
  const A = plan.rooms.find((r) => r.id === idA), B = plan.rooms.find((r) => r.id === idB)
  return A && B ? r2(union(A.polygon, B.polygon).shared) : 0
}

export function mergeRooms(plan, idA, idB) {
  const A = plan.rooms.find((r) => r.id === idA), B = plan.rooms.find((r) => r.id === idB)
  if (!A || !B || A === B) return { ok: false, error: 'Pick two different rooms of this plan.' }
  const { shared, rest } = union(A.polygon, B.polygon)
  if (shared < 0.05) return { ok: false, error: `${A.name} and ${B.name} do not share a wall on the plan, so they cannot be joined.` }
  const next = new Map(); for (const e of rest) (next.get(K(e[0])) || next.set(K(e[0]), []).get(K(e[0]))).push(e)
  const used = new Set(), loops = []
  for (const e0 of rest) {
    if (used.has(e0)) continue
    const pts = []; let e = e0, guard = 0
    while (e && !used.has(e) && guard++ < 500) { used.add(e); pts.push(e[0]); e = (next.get(K(e[1])) || []).find((x) => !used.has(x)) }
    if (pts.length >= 3) loops.push(simplify(pts))
  }
  const outer = loops.filter((l) => l.length >= 3).sort((p, q) => Math.abs(signed(q)) - Math.abs(signed(p)))
  if (!outer.length || (outer.length > 1 && Math.abs(signed(outer[1])) > 0.05)) return { ok: false, error: `${A.name} and ${B.name} cannot be joined into one clean room (the result would have a hole).` }
  const big = polyArea(A.polygon) >= polyArea(B.polygon) ? A : B, small = big === A ? B : A, poly = outer[0].map((p) => [r2(p[0]), r2(p[1])])
  const ia = plan.rooms.indexOf(A), dropped = plan.openings.length
  const merged = { ...big, polygon: poly, areaM2: r2(polyArea(poly)) }
  plan.rooms = plan.rooms.filter((r) => r !== A && r !== B); plan.rooms.splice(Math.min(ia, plan.rooms.length), 0, merged)
  rewalls(plan)
  return { ok: true, removed: [small.id], mapped: { [small.id]: big.id }, name: big.name, joined: [A.name, B.name], openingsDropped: dropped - plan.openings.length }
}

// ---- add a room: the person draws its outline (a corridor the plan reader missed, a room it left out)
const segCross = (a, b, c, d) => {          // do the segments a-b and c-d cross (touching at an end does not count)
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
  const d1 = o(a, b, c), d2 = o(a, b, d), d3 = o(c, d, a), d4 = o(c, d, b)
  return d1 * d2 < -1e-9 && d3 * d4 < -1e-9
}
const selfCrosses = (poly) => { const n = poly.length; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (j === i + 1 || (i === 0 && j === n - 1)) continue; if (segCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return true } return false }
// how much of room B lies inside the outline A, in square metres (counted on a 2 cm grid, coarser for very big rooms, which is exact enough to tell a sloppy edge from a real overlap)
export function overlapArea(A, B, step = 0.02) {
  const x0 = Math.max(Math.min(...A.map((p) => p[0])), Math.min(...B.map((p) => p[0]))), x1 = Math.min(Math.max(...A.map((p) => p[0])), Math.max(...B.map((p) => p[0])))
  const z0 = Math.max(Math.min(...A.map((p) => p[1])), Math.min(...B.map((p) => p[1]))), z1 = Math.min(Math.max(...A.map((p) => p[1])), Math.max(...B.map((p) => p[1])))
  if (x1 <= x0 || z1 <= z0) return 0
  step = Math.max(step, Math.sqrt(((x1 - x0) * (z1 - z0)) / 40000))          // never more than about 40,000 samples
  let n = 0; for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) if (inPoly(x, z, A) && inPoly(x, z, B)) n++
  return n * step * step
}
export const NEW_ROOM_MIN_AREA = 0.5
export function addRoom(plan, points, { name, kind = 'hall' } = {}) {
  if (!Array.isArray(points)) return { ok: false, error: 'Draw the outline of the room first.' }
  let poly = simplify(points.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])).map((p) => [r2(p[0]), r2(p[1])]))
  if (poly.length < 3) return { ok: false, error: 'A room needs at least three corners that are not in a line.' }
  if (poly.some((p, i) => Math.hypot(p[0] - poly[(i + 1) % poly.length][0], p[1] - poly[(i + 1) % poly.length][1]) < 0.2)) return { ok: false, error: 'Two corners are less than 20 cm apart. Draw the corners of the room only.' }
  if (selfCrosses(poly)) return { ok: false, error: 'The outline crosses itself. Click the corners in order around the room.' }
  if (Math.abs(signed(poly)) < 1e-6) return { ok: false, error: 'A room needs at least three corners that are not in a line.' }
  if (poly.some((p) => p[0] < -0.001 || p[1] < -0.001)) return { ok: false, error: 'The room reaches over the top or left edge of the plan. Draw it inside the plan or on its right or lower side.' }
  const area = polyArea(poly); if (area < NEW_ROOM_MIN_AREA) return { ok: false, error: `That is only ${area.toFixed(1)} m². Draw the whole room.` }
  // a strip of a few centimetres along a neighbour is a sloppy click, not an overlap
  for (const r of plan.rooms) {
    const ov = overlapArea(poly, r.polygon); if (ov > Math.max(0.2, 0.08 * area)) return { ok: false, error: `The new room overlaps ${r.name} by ${ov.toFixed(1)} m². Draw it in the free space between rooms: the corners stick to the corners and walls of the rooms.` }
  }
  if (signed(poly) < 0) poly = [...poly].reverse()          // the same way round as the rooms the plan reader makes
  const k = KIND_OPTIONS.some(([v]) => v === kind) ? kind : 'hall', label = (KIND_OPTIONS.find(([v]) => v === k) || [])[1] || 'Room'
  const n = plan.rooms.reduce((m, r) => Math.max(m, Number(String(r.id).replace(/\D/g, '')) || 0), 0) + 1, dropped = plan.openings.length
  const room = { id: 'r' + n, name: String(name || '').trim().slice(0, 40) || label, type: TYPE_OF_KIND[k] || 'other', userKind: k, userMade: true, polygon: poly, areaM2: r2(area) }
  plan.rooms.push(room); rewalls(plan)
  return { ok: true, added: room.id, removed: [], mapped: {}, name: room.name, openingsDropped: dropped - plan.openings.length }
}

// ---- reshape rooms: drag a corner, drag a wall (the walls of the rooms beside it move with it), add or take away a corner
// All of these work out the new outlines first (cornerChanges, wallChanges, insertChanges, removeChanges: a list of { id, polygon }, so that the editor can show them while the pointer is down)
// and reshapeRooms then checks and applies them in one step.
const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [dx / L, dz / L, L] }
const lineHit = (p, u, q, v) => {          // where the line p + t u meets the line q + s v (null when they run side by side)
  const det = u[0] * v[1] - u[1] * v[0]; if (Math.abs(det) < 1e-6) return null
  const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / det; return [p[0] + u[0] * t, p[1] + u[1] * t]
}
const r3p = (p) => [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]
// the outline with wall i moved by d metres along its normal (to the right of the way it runs: (uz, -ux)); the walls on either side keep their direction and get longer or shorter
export function offsetEdge(poly, i, d) {
  const n = poly.length, a = poly[i], b = poly[(i + 1) % n], prev = poly[(i + n - 1) % n], next = poly[(i + 2) % n]
  const [ux, uz] = unit(a, b), pa = [a[0] + uz * d, a[1] - ux * d], pb = [b[0] + uz * d, b[1] - ux * d]
  const [px, pz] = unit(prev, a), [qx, qz] = unit(b, next)
  const far = (h, f) => (h && Math.hypot(h[0] - f[0], h[1] - f[1]) < 20 ? h : f)          // two walls that almost run side by side would throw the corner far away: keep it moved with the wall
  const A = far(lineHit(pa, [ux, uz], prev, [px, pz]), pa), B = far(lineHit(pa, [ux, uz], b, [qx, qz]), pb)
  const out = poly.map((p) => [...p]); out[i] = r3p(A); out[(i + 1) % n] = r3p(B); return out
}
const roomOf = (plan, id) => plan.rooms.find((r) => r.id === id)
// a corner moved to `to`; a corner of another room that lies on the same spot (the same corner of the building) goes with it
export function cornerChanges(plan, id, vi, to) {
  const room = roomOf(plan, id); if (!room || !room.polygon[vi]) return []
  const from = room.polygon[vi], out = [{ id, polygon: room.polygon.map((p, k) => (k === vi ? r3p(to) : [...p])) }]
  for (const o of plan.rooms) {
    if (o.id === id) continue
    const hit = o.polygon.findIndex((p) => Math.hypot(p[0] - from[0], p[1] - from[1]) < 0.03)
    if (hit >= 0) out.push({ id: o.id, polygon: o.polygon.map((p, k) => (k === hit ? r3p(to) : [...p])) })
  }
  return out
}
// wall `ei` of the room moved by d metres; a wall of another room that lies on it and faces it (the wall between two rooms) moves with it
export function wallChanges(plan, id, ei, d) {
  const room = roomOf(plan, id); if (!room || !room.polygon[ei]) return []
  const n = room.polygon.length, a = room.polygon[ei], b = room.polygon[(ei + 1) % n], [ux, uz, L] = unit(a, b)
  const cur = new Map([[id, offsetEdge(room.polygon, ei, d)]])
  const away = (p) => Math.abs((p[0] - a[0]) * uz - (p[1] - a[1]) * ux)
  for (const o of plan.rooms) {
    if (o.id === id) continue
    o.polygon.forEach((c, j) => {
      const e = o.polygon[(j + 1) % o.polygon.length], [vx, vz] = unit(c, e)
      if (vx * ux + vz * uz > -0.95 || away(c) > 0.04 || away(e) > 0.04) return          // not running the opposite way along the same line
      const s1 = (c[0] - a[0]) * ux + (c[1] - a[1]) * uz, s2 = (e[0] - a[0]) * ux + (e[1] - a[1]) * uz
      if (Math.min(L, Math.max(s1, s2)) - Math.max(0, Math.min(s1, s2)) < 0.1) return          // they only touch at a corner
      cur.set(o.id, offsetEdge(cur.get(o.id) || o.polygon, j, -d))
    })
  }
  return [...cur].map(([rid, polygon]) => ({ id: rid, polygon }))
}
export function insertChanges(plan, id, ei, point) {
  const room = roomOf(plan, id); if (!room || !room.polygon[ei]) return []
  const p = room.polygon.map((q) => [...q]); p.splice(ei + 1, 0, r3p(point)); return [{ id, polygon: p }]
}
export function removeChanges(plan, id, vi) {
  const room = roomOf(plan, id); if (!room || !room.polygon[vi]) return []
  return [{ id, polygon: room.polygon.filter((_, k) => k !== vi).map((q) => [...q]) }]
}
// the colours painted on the walls of a room are kept per wall (`<room>|<number of the wall>`): when a corner is added or taken away the walls after it get new numbers
export function remapWallColors(map, id, edit) {
  if (!map || !edit) return map
  const out = {}, keep = (k, v) => { out[k] = v }
  for (const [k, v] of Object.entries(map)) {
    const m = /^(.*)\|(\d+)$/.exec(k); if (!m || m[1] !== id) { keep(k, v); continue }
    const j = Number(m[2])
    if (edit.type === 'insert') { keep(`${id}|${j > edit.edge ? j + 1 : j}`, v); if (j === edit.edge) keep(`${id}|${j + 1}`, v) }
    else if (edit.type === 'remove') {
      const n = edit.n, vv = edit.vertex
      if (vv === 0) { if (j === 0) continue; keep(`${id}|${j === n - 1 ? n - 2 : j - 1}`, v) }
      else if (j === vv) continue
      else keep(`${id}|${j > vv ? j - 1 : j}`, v)
    } else keep(k, v)
  }
  return out
}
export function reshapeRooms(plan, changes, edit = null) {
  if (!Array.isArray(changes) || !changes.length) return { ok: false, error: 'Nothing to change.' }
  const olds = new Map(), news = new Map()
  for (const c of changes) {
    const room = roomOf(plan, c.id); if (!room) return { ok: false, error: 'That room is not on the plan.' }
    olds.set(c.id, room.polygon); news.set(c.id, c.polygon.map(r3p).filter((p, i, a) => Math.hypot(p[0] - a[(i + a.length - 1) % a.length][0], p[1] - a[(i + a.length - 1) % a.length][1]) > 1e-6))
  }
  for (const [id, poly] of news) {
    const name = roomOf(plan, id).name
    if (poly.length < 3) return { ok: false, error: `${name} needs at least three corners.` }
    if (poly.some((p, i) => Math.hypot(p[0] - poly[(i + 1) % poly.length][0], p[1] - poly[(i + 1) % poly.length][1]) < 0.2)) return { ok: false, error: `Two corners of ${name} would be less than 20 cm apart.` }
    if (selfCrosses(poly)) return { ok: false, error: `${name} would cross itself. Move the corner back, or move the walls instead.` }
    if (poly.some((p) => p[0] < -0.001 || p[1] < -0.001)) return { ok: false, error: `${name} would reach over the top or left edge of the plan.` }
    const area = polyArea(poly); if (area < NEW_ROOM_MIN_AREA) return { ok: false, error: `${name} would be only ${area.toFixed(1)} m\u00b2.` }
  }
  const polyNow = (r) => news.get(r.id) || r.polygon, polyWas = (r) => olds.get(r.id) || r.polygon
  const rooms = plan.rooms
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    if (!news.has(rooms[i].id) && !news.has(rooms[j].id)) continue
    const A = rooms[i], B = rooms[j], now = overlapArea(polyNow(A), polyNow(B))
    if (now > Math.max(0.2, 0.08 * Math.min(polyArea(polyNow(A)), polyArea(polyNow(B)))) && now > overlapArea(polyWas(A), polyWas(B)) + 0.1) return { ok: false, error: `${A.name} would overlap ${B.name} by ${now.toFixed(1)} m\u00b2. Move the corner or wall less far.` }
  }
  // a door or window that stands in a wall that moves goes with it (same place along the wall); the other openings stay where they are
  const remap = (sp) => {
    let best = null
    for (const [id, poly] of news) {
      const old = olds.get(id); if (old.length !== poly.length) continue
      old.forEach((a, k) => {
        const b = old[(k + 1) % old.length], [ux, uz, L] = unit(a, b), s = (sp.x - a[0]) * ux + (sp.z - a[1]) * uz, d = Math.abs((sp.x - a[0]) * uz - (sp.z - a[1]) * ux)
        if (d > 0.35 || s < -0.05 || s > L + 0.05 || Math.abs(sp.ux * uz - sp.uz * ux) > 0.25) return
        if (!best || d < best.d) { const a2 = poly[k], b2 = poly[(k + 1) % poly.length], t = Math.max(0, Math.min(1, s / L)), [vx, vz] = unit(a2, b2); best = { d, x: a2[0] + (b2[0] - a2[0]) * t, z: a2[1] + (b2[1] - a2[1]) * t, ux: vx, uz: vz } }
      })
    }
    return best ? { x: best.x, z: best.z, ux: best.ux, uz: best.uz } : null
  }
  const dropped = plan.openings.length
  for (const [id, poly] of news) { const r = roomOf(plan, id); r.polygon = poly; r.areaM2 = r2(polyArea(poly)) }
  rewalls(plan, remap)
  return { ok: true, removed: [], mapped: {}, reshaped: [...news.keys()], openingsDropped: dropped - plan.openings.length, name: roomOf(plan, changes[0].id).name, edit }
}

// ---- square up: every wall that is nearly horizontal or vertical becomes exactly horizontal or vertical, and the walls of different rooms that are nearly on one line are put on one line
// A wall more than `angle` degrees off both axes is taken for a slanted wall on purpose and is left alone: 25 degrees for 'square up all rooms', 40 for 'square up this room' (only the near-diagonal walls stay). Corners are not moved along a wall that is slanted on purpose.
// How: the two ends of a nearly vertical wall share one x, the two ends of a nearly horizontal wall share one z (so a corner between two such walls gets its x from one and its z from the other);
// the shared value is the mean of what the ends had, weighted by the length of the walls. Then values of different rooms that are within `align` metres of each other are put on one value; when only
// some rooms are squared (`ids`), they are put on the lines of the other rooms, which stay where they are.
export const SQUARE_ANGLE = 25, SQUARE_ANGLE_STRONG = 40
const diagonals = (rooms) => rooms.reduce((n, r) => n + r.polygon.filter((a, i) => { const b = r.polygon[(i + 1) % r.polygon.length]; return Math.abs(a[0] - b[0]) > 1e-3 && Math.abs(a[1] - b[1]) > 1e-3 }).length, 0)
export function squareChanges(plan, { ids = null, angle = SQUARE_ANGLE, align = 0.05 } = {}) {
  const scope = plan.rooms.filter((r) => !ids || ids.includes(r.id)), fixed = plan.rooms.filter((r) => ids && !ids.includes(r.id))
  const polys = new Map(scope.map((r) => [r.id, r.polygon.map((p) => [...p])]))
  const parent = new Map(), val = new Map(), wt = new Map()          // a variable is "<room>|<vertex>|<0 for x, 1 for z>"; parent: union-find
  const find = (k) => { while (parent.get(k) !== k) { parent.set(k, parent.get(parent.get(k))); k = parent.get(k) } return k }
  const touch = (k, v) => { if (!parent.has(k)) { parent.set(k, k); val.set(k, v); wt.set(k, 0) } }
  const tol = Math.tan((angle * Math.PI) / 180)
  for (const r of scope) {
    const P = polys.get(r.id), n = P.length
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (L < 1e-6) continue
      const axis = Math.abs(dx) <= tol * Math.abs(dz) ? 0 : Math.abs(dz) <= tol * Math.abs(dx) ? 1 : -1          // 0: vertical (x is shared), 1: horizontal (z is shared), -1: slanted on purpose
      if (axis < 0) continue
      const ka = `${r.id}|${i}|${axis}`, kb = `${r.id}|${(i + 1) % n}|${axis}`
      touch(ka, a[axis]); touch(kb, b[axis]); wt.set(ka, wt.get(ka) + L); wt.set(kb, wt.get(kb) + L)
      const ra = find(ka), rb = find(kb); if (ra !== rb) parent.set(ra, rb)
    }
  }
  const comps = new Map()          // root -> { axis, sum, w, keys }
  for (const k of parent.keys()) { const root = find(k), c = comps.get(root) || { axis: Number(k.split('|')[2]), sum: 0, w: 0, keys: [] }; c.sum += val.get(k) * wt.get(k); c.w += wt.get(k); c.keys.push(k); comps.set(root, c) }
  const list = [...comps.values()].map((c) => ({ ...c, v: c.sum / c.w }))
  for (const axis of [0, 1]) {
    const mine = list.filter((c) => c.axis === axis).sort((p, q) => p.v - q.v)
    const lines = []          // the wall lines of the rooms that stay (their vertical walls for x, horizontal walls for z)
    for (const r of fixed) r.polygon.forEach((a, i) => { const b = r.polygon[(i + 1) % r.polygon.length], dx = b[0] - a[0], dz = b[1] - a[1]; if ((axis === 0 && Math.abs(dx) < 1e-3 && Math.abs(dz) > 0.05) || (axis === 1 && Math.abs(dz) < 1e-3 && Math.abs(dx) > 0.05)) lines.push(a[axis]) })
    const rest = []
    for (const c of mine) { let best = null; for (const l of lines) if (Math.abs(l - c.v) <= align && (!best || Math.abs(l - c.v) < Math.abs(best - c.v))) best = l; if (best !== null) c.v = best; else rest.push(c) }
    let group = []
    const flush = () => { if (group.length > 1) { const w = group.reduce((s, c) => s + c.w, 0), m = group.reduce((s, c) => s + c.v * c.w, 0) / w; for (const c of group) c.v = m } group = [] }
    for (const c of rest) { if (group.length && c.v - group[0].v > 2 * align) flush(); if (group.length && c.v - group[group.length - 1].v > align) flush(); group.push(c) }
    flush()
  }
  const changes = [], skipped = []
  for (const r of scope) {
    const P = polys.get(r.id).map((p) => [...p])
    for (const c of list) for (const k of c.keys) { const [id, vi, axis] = k.split('|'); if (id === r.id) P[Number(vi)][Number(axis)] = Math.round(c.v * 1000) / 1000 }
    const same = P.every((p, i) => Math.abs(p[0] - r.polygon[i][0]) < 0.0005 && Math.abs(p[1] - r.polygon[i][1]) < 0.0005); if (same) continue
    const n = P.length
    if (P.some((p, i) => Math.hypot(p[0] - P[(i + 1) % n][0], p[1] - P[(i + 1) % n][1]) < 0.05) || polyArea(P) < NEW_ROOM_MIN_AREA) { skipped.push(r.name); continue }          // squaring would fold this room: it stays as it is
    changes.push({ id: r.id, polygon: P })
  }
  return { changes, skipped }
}
// apply a list of changes; when the whole list is refused because of one room, that room is left out and the rest go ahead (up to a few times)
export function reshapeBest(plan, changes, edit = null) {
  let list = [...changes]; const left = []
  for (let tries = 0; tries < 6 && list.length; tries++) {
    const r = reshapeRooms(plan, list, edit); if (r.ok) return { ...r, skipped: left }
    const bad = list.find((c) => r.error && r.error.includes(roomOf(plan, c.id).name))
    if (!bad) return { ...r, skipped: left }
    left.push(roomOf(plan, bad.id).name); list = list.filter((c) => c !== bad)
  }
  return { ok: false, error: 'The walls could not be squared up without making rooms overlap or fold.', skipped: left }
}
export function squareUp(plan, ids = null, opts = {}) {
  const angle = opts.angle || SQUARE_ANGLE, scope = plan.rooms.filter((r) => !ids || ids.includes(r.id))
  const { changes, skipped } = squareChanges(plan, { ...opts, ids, angle })
  const hint = (n) => `${n} wall${n === 1 ? ' is' : 's are'} diagonal (more than ${angle} degrees off): ${angle < SQUARE_ANGLE_STRONG ? 'open Reshape on that room and press Square up this room to straighten those too' : 'it looks meant that way'}.`
  if (!changes.length) {
    const d = diagonals(scope)
    return { ok: false, error: skipped.length ? `${skipped.join(', ')} could not be squared up without folding.` : d ? `The straight walls are straight. ${hint(d)}` : 'The walls are already straight.' }
  }
  const r = reshapeBest(plan, changes)
  if (!r.ok) return r
  const d = diagonals(scope)
  return { ...r, skipped: [...skipped, ...r.skipped], squared: r.reshaped.length, diagonals: d, hint: d ? hint(d) : '' }
}
