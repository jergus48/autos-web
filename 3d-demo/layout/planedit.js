// Correcting what the plan reader got wrong, by hand: doors (add, slide, stretch, flip the hinge, open the other way, remove), the kind and name of a room,
// and the scale of the whole plan. Windows have their own functions in windows.js; these follow the same rules (an opening stays inside its room's wall,
// away from its neighbours). After any change call rebuild(plan) from windows.js so the wall solids are cut again.
import { roomRun, freeSpan, wallOf, wallLength, moveWindow, normSplits, LIMITS } from './windows.js'
import { TYPE_OF_KIND, doorStyle } from './space.js'

export const DOOR = { width: [0.6, 3.0], height: [1.9, 2.4], defaultWidth: 0.9, defaultHeight: 2.1 }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const r3 = (v) => Math.round(v * 1000) / 1000
export const isDoorLike = (o) => o.kind === 'door' || o.kind === 'opening'
// a wide door is a sliding door (glass, no swing); the plan reader often mistakes the glazing of a terrace for windows, so a window can be turned into a door and back
export const isSliding = (o) => o.kind === 'door' && doorStyle(o) === 'sliding'
export const isDouble = (o) => o.kind === 'door' && doorStyle(o) === 'double'
// glass doors (sliding and double) are drawn as glass in a frame in the 3D view
export const isGlazedDoor = (o) => isSliding(o) || isDouble(o)
// how wide a door may be: one leaf up to 1.2 m, a double door 1.2 to 2 m, a sliding door 1.2 to 3 m, a plain opening up to 4 m
export const widthRange = (o) => (o.kind !== 'door' ? [0.6, 4.0] : { hinged: [0.6, 1.2], double: [1.2, 2.0], sliding: [1.2, 3.0] }[doorStyle(o)])
export { doorStyle }
export function windowToDoor(plan, id) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  op.kind = 'door'; op.style = 'sliding'; op.sill = 0; op.height = Math.max(op.height, 2.1); delete op.panes; delete op.splits; delete op.sliding
  return op
}
export function doorToWindow(plan, id) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'door'); if (!op) return null
  op.kind = 'window'; op.sill = 0.9; op.height = 1.3; op.panes = op.width > 1.0 ? 2 : 1; delete op.hinge; delete op.into; delete op.sliding; delete op.style
  return op
}
export const doorsOf = (plan) => plan.openings.filter(isDoorLike)
const find = (plan, id) => plan.openings.find((o) => o.id === id && isDoorLike(o))
const nextId = (plan) => 'd' + (Math.max(0, ...plan.openings.map((o) => Number(String(o.id).replace(/\D/g, '')) || 0)) + 1)

// ---- doors
export const moveDoor = (plan, id, offset) => (find(plan, id) ? moveWindow(plan, id, offset) : null)

// stretch a door by its edges (metres along the wall), or move it by giving both; height from the floor up
export function fitDoor(plan, id, e) {
  const op = find(plan, id); if (!op) return null
  const [lo, hi] = freeSpan(plan, op)
  let l = op.offset - op.width / 2, r = op.offset + op.width / 2
  const [wMin, wMax] = widthRange(op)
  if (e.left !== undefined && e.right !== undefined) { const w = clamp(e.right - e.left, wMin, Math.min(wMax, hi - lo)); l = clamp(e.left, lo, hi - w); r = l + w }
  else if (e.left !== undefined) l = clamp(e.left, Math.max(lo, r - wMax), r - wMin)
  else if (e.right !== undefined) r = clamp(e.right, l + wMin, Math.min(hi, l + wMax))
  op.offset = r3((l + r) / 2); op.width = r3(r - l)
  if (e.height !== undefined) op.height = r3(clamp(e.height, DOOR.height[0], DOOR.height[1]))
  return op
}
export function setDoor(plan, id, patch) {
  const op = find(plan, id); if (!op) return null
  if (patch.width !== undefined) { const [lo, hi] = freeSpan(plan, op), [wMin, wMax] = widthRange(op), maxW = Math.min(wMax, 2 * Math.min(op.offset - lo, hi - op.offset)); op.width = r3(clamp(patch.width, wMin, Math.max(wMin, maxW))) }
  if (patch.height !== undefined) op.height = r3(clamp(patch.height, DOOR.height[0], DOOR.height[1]))
  return op
}
// hinged, double or sliding: the width goes to what that style needs (a sliding door at least 1.8 m where the wall has room, a double door 1.6 m, a hinged door at most 1.2 m), within the room's wall.
// When a glass door gets narrower, the rest of its glazing stays as a window beside it (the door moves to the end of the run nearer the middle of the room); choosing a glass door again gives that glass back.
export function setDoorStyle(plan, id, style) {
  const op = find(plan, id); if (!op || op.kind !== 'door' || !['hinged', 'double', 'sliding'].includes(style)) return null
  const glass0 = isGlazedDoor(op)
  // the run of glass that is there now: the door, and the windows an earlier switch left beside it when the new style is a glass door
  let l = op.offset - op.width / 2, r = op.offset + op.width / 2
  const mine = plan.openings.filter((o) => o.kind === 'window' && o.leftoverOf === id && o.wall === op.wall)
  if (style !== 'hinged') for (const w of mine) { l = Math.min(l, w.offset - w.width / 2); r = Math.max(r, w.offset + w.width / 2); plan.openings.splice(plan.openings.indexOf(w), 1) }
  op.offset = (l + r) / 2; op.width = r - l
  const run = op.width
  op.style = style; delete op.sliding
  const [lo, hi] = freeSpan(plan, op), room = hi - lo, [wMin, wMax] = widthRange(op)
  const want = style === 'hinged' ? clamp(run, wMin, wMax) : style === 'double' ? clamp(run <= 1.2 ? 1.6 : run, wMin, wMax) : clamp(run < 1.8 ? 1.8 : run, wMin, wMax)
  const w = Math.max(Math.min(want, room), Math.min(wMin, room)), leftover = run - w
  if (leftover >= 0.45 && (glass0 || (style !== 'hinged' && mine.length > 0))) {
    const rr = roomRun(plan, op), mid = rr ? (rr[0] + rr[1]) / 2 : l, left = Math.abs(l + w / 2 - mid) <= Math.abs(r - w / 2 - mid), gap = 0.05
    const doorC = left ? l + w / 2 : r - w / 2, ws = left ? l + w + gap : l, we = left ? r : r - w - gap, ww = we - ws
    op.width = r3(w); op.offset = r3(doorC)
    if (ww >= 0.4) plan.openings.push({ id: 'w' + (Math.max(0, ...plan.openings.map((o) => Number(String(o.id).replace(/\D/g, '')) || 0)) + 1), kind: 'window', wall: op.wall, offset: r3((ws + we) / 2), width: r3(ww), height: Math.min(op.height, 2.4), sill: 0, panes: ww > 1.0 ? 2 : 1, leftoverOf: id })
  } else { op.width = r3(w); op.offset = r3(clamp((l + r) / 2, lo + w / 2, hi - w / 2)) }
  if (style !== 'hinged') delete op.hinge
  if (style === 'sliding') delete op.into
  return op
}
// the hinge on the other side of the door
export function flipHinge(plan, id) { const op = find(plan, id); if (!op) return null; op.hinge = op.hinge === 'end' ? 'start' : 'end'; return op }
// the rooms a door joins, in plan order, from the measured space; a door with one room opens onto the outside
// (the indoor room comes first: a door to a terrace opens into the house unless the person flips it)
export const roomsOfDoor = (space, id) => space.rooms.filter((r) => r.doors.some((d) => d.id === id)).sort((a, b) => (a.outdoor ? 1 : 0) - (b.outdoor ? 1 : 0))
// swing into the other room (or, for a door with a single room, out of it)
export function flipSide(plan, space, id) {
  const op = find(plan, id); if (!op) return null
  const rooms = roomsOfDoor(space, id), ids = rooms.map((r) => plan.rooms[r.i].id)
  const cur = op.into && (ids.includes(op.into) || op.into === '__out') ? op.into : ids[0] ?? '__out'
  if (rooms.length >= 2) op.into = cur === ids[0] ? ids[1] : ids[0]
  else op.into = cur === '__out' ? ids[0] : '__out'
  return op
}
// which room's side the door leaf swings into: the room id, '__out' for outside, or null for the default (the first room)
export const swingRoom = (op) => op.into || null
// a door and a plain opening (no leaf) are the same hole in the wall
export function toggleKind(plan, id) { const op = find(plan, id); if (!op) return null; op.kind = op.kind === 'door' ? 'opening' : 'door'; return op }
export function removeOpening(plan, id) { const i = plan.openings.findIndex((o) => o.id === id && isDoorLike(o)); if (i < 0) return false; plan.openings.splice(i, 1); return true }

// the wall nearest to a point (metres), with the distance along it; null when no wall is within reach
export function wallAt(plan, x, z, reach = 0.35) {
  let best = null
  for (const w of plan.walls) {
    const L = wallLength(w); if (L < 0.05) continue
    const ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L, s = (x - w.a[0]) * ux + (z - w.a[1]) * uz
    if (s < -0.05 || s > L + 0.05) continue
    const d = Math.abs((x - w.a[0]) * -uz + (z - w.a[1]) * ux)
    if (d <= Math.max(w.thickness || 0.12, 0.12) / 2 + reach && (!best || d < best.d)) best = { wall: w, s: clamp(s, 0, L), d }
  }
  return best
}

// is the point on this wall inside a door or window (or its air gap)? a new opening is never put on top of another one
const onOpening = (plan, wallId, s) => plan.openings.some((o) => o.wall === wallId && Math.abs(s - o.offset) <= o.width / 2 + LIMITS.neighbourGap)

// a new door where the point is: on the nearest wall, inside the run of the rooms it joins, clear of the other openings. { op } or { error }
export function addDoorAt(plan, x, z, kind = 'door') {
  const hit = wallAt(plan, x, z); if (!hit) return { error: 'Click on a wall to place the door.' }
  if (onOpening(plan, hit.wall.id, hit.s)) return { error: 'There is already a door or window here. Click a free stretch of wall.' }
  const op = { id: nextId(plan), kind, wall: hit.wall.id, offset: r3(hit.s), width: DOOR.defaultWidth, height: DOOR.defaultHeight, sill: 0 }
  if (!roomRun(plan, op)) return { error: 'That wall does not belong to a room. Click a wall between two rooms, or an outside wall of a room.' }
  plan.openings.push(op)
  const [lo, hi] = freeSpan(plan, op, { strict: true })
  if (hi - lo < DOOR.width[0]) { plan.openings.pop(); return { error: 'There is no free stretch of wall wide enough for a door here.' } }
  op.width = r3(Math.min(DOOR.defaultWidth, hi - lo)); op.offset = r3(clamp(hit.s, lo + op.width / 2, hi - op.width / 2))
  return { op }
}

// a new window where the point is: on the nearest wall, inside the run of the room it looks into, clear of the other openings and the partitions. { op, inner } or { error }
// inner: the wall is a wall between two rooms (not an outside wall), so the window looks into the next room, like an inner window in a glass partition
export function addWindowAt(plan, x, z, tpl = null) {
  const hit = wallAt(plan, x, z); if (!hit) return { error: 'Click on a wall to place the window.' }
  if (onOpening(plan, hit.wall.id, hit.s)) return { error: 'There is already a door or window here. Click a free stretch of wall.' }
  const sill = r3(clamp(tpl?.sill ?? 0.9, LIMITS.sill[0], LIMITS.sill[1]))
  const id = 'w' + (Math.max(0, ...plan.openings.map((o) => Number(String(o.id).replace(/\D/g, '')) || 0)) + 1)
  const op = { id, kind: 'window', wall: hit.wall.id, offset: r3(hit.s), width: tpl?.width ?? 1.4, height: r3(Math.min(tpl?.height ?? 1.3, 2.5 - sill)), sill, panes: 1 }
  if (!roomRun(plan, op)) return { error: 'That wall does not belong to a room. Click a wall between two rooms, or an outside wall of a room.' }
  plan.openings.push(op)
  const [lo, hi] = freeSpan(plan, op, { strict: true })
  if (hi - lo < 0.6) { plan.openings.pop(); return { error: 'There is no free stretch of wall wide enough for a window here. Click a stretch without a door or window.' } }
  op.width = r3(Math.min(tpl?.width ?? 1.4, hi - lo)); op.offset = r3(clamp(hit.s, lo + op.width / 2, hi - op.width / 2))
  op.panes = tpl ? tpl.panes : op.width > 1.0 ? 2 : 1
  if (tpl?.splits) op.splits = [...tpl.splits]
  normSplits(op)
  return { op, inner: !hit.wall.exterior }
}

// ---- rooms: a new kind and name (the kind decides which furniture the engine places)
export function setRoomKind(plan, i, { name, userKind } = {}) {
  const r = plan.rooms[i]; if (!r) return null
  if (name !== undefined && String(name).trim()) r.name = String(name).trim().slice(0, 40)
  if (userKind !== undefined) {
    if (userKind) { if (!('origType' in r)) r.origType = r.type; r.userKind = userKind; if (TYPE_OF_KIND[userKind]) r.type = TYPE_OF_KIND[userKind] }
    else { delete r.userKind; if ('origType' in r) { r.type = r.origType; delete r.origType } }          // no override: the name and the type the plan reader gave decide again
  }
  return r
}

// ---- the scale of the plan: every length is multiplied by f (a wall that measured 4.2 m on the plan but is really 4.6 m gives f = 1.0952)
export function scalePlan(plan, f) {
  const sc = (v) => r3(v * f)
  for (const r of plan.rooms) { r.polygon = r.polygon.map(([x, z]) => [sc(x), sc(z)]); if (r.areaM2) r.areaM2 = +(r.areaM2 * f * f).toFixed(2) }
  for (const w of plan.walls) { w.a = [sc(w.a[0]), sc(w.a[1])]; w.b = [sc(w.b[0]), sc(w.b[1])] }
  for (const o of plan.openings) { o.offset = sc(o.offset); o.width = sc(o.width) }
  for (const it of plan.furniture || []) { it.x = sc(it.x); it.z = sc(it.z); if (it.w) it.w = sc(it.w); if (it.d) it.d = sc(it.d) }
  if (plan.bounds) { plan.bounds.width = sc(plan.bounds.width); plan.bounds.depth = sc(plan.bounds.depth) }
  if (plan.scale) { if (plan.scale.mPerUnit) plan.scale.mPerUnit = +(plan.scale.mPerUnit * f).toFixed(6); plan.scale.source = 'set by hand'; delete plan.scale.spreadPct }
  plan._baseScale = +((plan._baseScale || 1) * f).toFixed(6)
  for (const o of plan.openings) if (o.kind === 'window') o.width = clamp(o.width, 0.4, 6)
  return plan
}
// the same scale factor applied to the items of a layout (furniture keeps its real size, only the positions move)
export const scaleItems = (items, f) => items.map((it) => ({ ...it, x: r3(it.x * f), z: r3(it.z * f) }))

export { wallOf }
