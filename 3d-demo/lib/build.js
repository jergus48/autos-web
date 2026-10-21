// Turns the model's image-space answer into a metric plan the 3D viewer can build:
// snap shared wall coordinates, solve the scale, derive walls from room edges, place openings on walls.
import { buildWallBoxes } from './wallsolid.js'
const TOL_FRAC = 0.014 // coordinates closer than 1.4 % of the image width are the same wall line
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN }
const r2 = (v) => Math.round(v * 100) / 100
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9À-ɏ]+/g, ' ').trim()

export function polyArea(p) {
  let a = 0
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1 }
  return Math.abs(a) / 2
}

export function pointInPoly(x, y, p) {
  let c = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

function cluster1d(values, TOL) {
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])
  const out = new Array(values.length)
  let group = []
  const flush = () => { if (!group.length) return; const m = group.reduce((s, g) => s + g[0], 0) / group.length; group.forEach((g) => (out[g[1]] = m)); group = [] }
  for (const it of idx) { if (group.length && it[0] - group[group.length - 1][0] > TOL) flush(); group.push(it) }
  flush()
  return out
}

// 1. snap every room vertex x and y to shared lines
export function snapRooms(rooms, TOL) {
  const pts = rooms.flatMap((r, ri) => r.polygon.map((p, pi) => ({ ri, pi, x: p.x, y: p.y })))
  const sx = cluster1d(pts.map((p) => p.x), TOL), sy = cluster1d(pts.map((p) => p.y), TOL)
  const snapped = rooms.map((r) => ({ ...r, polygon: [] }))
  pts.forEach((p, k) => snapped[p.ri].polygon.push([Math.round(sx[k] * 100) / 100, Math.round(sy[k] * 100) / 100]))
  for (const r of snapped) {
    r.polygon = r.polygon.filter((p, i, a) => { const q = a[(i + a.length - 1) % a.length]; return !(p[0] === q[0] && p[1] === q[1]) })
    // drop collinear middle points
    r.polygon = r.polygon.filter((p, i, a) => {
      const q = a[(i + a.length - 1) % a.length], n = a[(i + 1) % a.length]
      return !((q[0] === p[0] && p[0] === n[0]) || (q[1] === p[1] && p[1] === n[1]))
    })
  }
  return snapped.filter((r) => r.polygon.length >= 3)
}

// 2. scale: metres per image unit
export function solveScale(ex, rooms, openings) {
  const cands = []
  const toM = (v, unit) => (unit === 'cm' ? v / 100 : unit === 'mm' ? v / 1000 : v)
  const xs = rooms.flatMap((r) => r.polygon.map((p) => p[0])), ys = rooms.flatMap((r) => r.polygon.map((p) => p[1]))
  const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys)
  for (const d of ex.dimensions || []) {
    if (!(d.value > 0)) continue
    if (d.role === 'room_area' && d.unit === 'm2') {
      let room = rooms.find((r) => norm(r.name) === norm(d.room))
      if (!room && Number.isFinite(d.x)) room = rooms.find((r) => pointInPoly(d.x, d.y, r.polygon))
      if (room) cands.push({ source: 'area:' + room.name, s: Math.sqrt(d.value / polyArea(room.polygon)) })
    } else if (d.role === 'overall_width' && d.unit !== 'm2') cands.push({ source: 'overall_width', s: toM(d.value, d.unit) / bw })
    else if (d.role === 'overall_depth' && d.unit !== 'm2') cands.push({ source: 'overall_depth', s: toM(d.value, d.unit) / bh })
  }
  if (cands.length) {
    const s = med(cands.map((c) => c.s))
    const spread = Math.max(...cands.map((c) => Math.abs(c.s - s) / s))
    return { mPerUnit: s, source: 'printed_dimensions', candidates: cands.length, spreadPct: r2(spread * 100) }
  }
  // no printed sizes: things of known size. Each cue the reader gave (its length in the picture and its real length, 0.2 to 6 m) and each door leaf (0.9 m) is one estimate; the median of them is the scale
  const cueS = (ex.cues || []).filter((c) => c.len > 4 && c.meters >= 0.2 && c.meters <= 6).map((c) => c.meters / c.len)
  const doors = openings.filter((o) => o.kind === 'door' && !o.sliding && !o.style && o.width > 0).map((o) => o.width)
  if (cueS.length >= 1 && cueS.length + doors.length >= 3) {
    const all = [...cueS, ...doors.map((w) => 0.9 / w)], s = med(all), spread = Math.max(...all.map((v) => Math.abs(v - s) / s))
    return { mPerUnit: s, source: 'cues_and_doors', candidates: all.length, spreadPct: r2(spread * 100) }
  }
  if (doors.length) return { mPerUnit: 0.9 / med(doors), source: 'door_width_assumed_0.9m', candidates: doors.length, spreadPct: null }
  return { mPerUnit: 8 / bw, source: 'assumed_8m_wide', candidates: 0, spreadPct: null }
}

// 3. walls from room edges (axis-aligned edges are merged; others kept as they are)
function wallsFromRooms(rooms) {
  const E = 0.001
  const lines = new Map() // key "h|y" or "v|x" -> list of {a,b,room}
  const diag = []
  rooms.forEach((r, ri) => {
    const p = r.polygon
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]
      if (Math.abs(a[1] - b[1]) < E) { const k = 'h|' + r2(a[1]); (lines.get(k) || lines.set(k, []).get(k)).push({ a: Math.min(a[0], b[0]), b: Math.max(a[0], b[0]), room: ri }) }
      else if (Math.abs(a[0] - b[0]) < E) { const k = 'v|' + r2(a[0]); (lines.get(k) || lines.set(k, []).get(k)).push({ a: Math.min(a[1], b[1]), b: Math.max(a[1], b[1]), room: ri }) }
      else diag.push({ a, b, exterior: true })
    }
  })
  const walls = []
  for (const [key, segs] of lines) {
    const [dir, c] = [key[0], Number(key.slice(2))]
    const cuts = [...new Set(segs.flatMap((s) => [r2(s.a), r2(s.b)]))].sort((x, y) => x - y)
    const atoms = []
    for (let i = 0; i + 1 < cuts.length; i++) {
      const mid = (cuts[i] + cuts[i + 1]) / 2
      const cover = new Set(segs.filter((s) => s.a <= mid && mid <= s.b).map((s) => s.room))
      if (cover.size) atoms.push({ a: cuts[i], b: cuts[i + 1], exterior: cover.size === 1 })
    }
    for (const at of atoms) {
      const last = walls[walls.length - 1]
      const [pa, pb] = dir === 'h' ? [[at.a, c], [at.b, c]] : [[c, at.a], [c, at.b]]
      if (last && last._key === key && last.exterior === at.exterior && Math.abs((dir === 'h' ? last.b[0] : last.b[1]) - at.a) < E) { last.b = pb; continue }
      walls.push({ _key: key, a: pa, b: pb, exterior: at.exterior })
    }
  }
  for (const d of diag) walls.push({ _key: 'd', a: d.a, b: d.b, exterior: true })
  return walls.map((w, i) => ({ id: 'w' + (i + 1), a: w.a, b: w.b, exterior: w.exterior }))
}

// Real plans draw thick walls: two rooms' edges face each other across a solid band. Merge such a pair into ONE wall
// as thick as the gap, and move exterior walls outwards so they no longer eat into the rooms.
const T_EXT = 0.3, T_INT = 0.12
function withThickness(walls, rooms) {
  const E = 0.001
  const inAnyRoom = (x, y) => rooms.some((r) => pointInPoly(x, y, r.polygon))
  const mk = (dir, c, a, b, exterior, t) => ({ dir, c, a, b, exterior, t })
  let list = walls.map((w) => {
    const h = Math.abs(w.a[1] - w.b[1]) < E, v = Math.abs(w.a[0] - w.b[0]) < E
    if (!h && !v) return { dir: 'd', w, exterior: true, t: T_EXT }
    return mk(h ? 'h' : 'v', h ? w.a[1] : w.a[0], h ? Math.min(w.a[0], w.b[0]) : Math.min(w.a[1], w.b[1]), h ? Math.max(w.a[0], w.b[0]) : Math.max(w.a[1], w.b[1]), w.exterior, null)
  })
  let changed = true, guard = 0
  while (changed && guard++ < 400) {
    changed = false
    outer: for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const A = list[i], B = list[j]
      if (A.dir === 'd' || A.dir !== B.dir || A.t || B.t) continue
      const g = Math.abs(A.c - B.c); if (g < 0.1 || g > 0.95) continue
      const lo = Math.max(A.a, B.a), hi = Math.min(A.b, B.b); if (hi - lo < 0.3) continue
      const mc = (A.c + B.c) / 2, mid = (lo + hi) / 2
      if (A.dir === 'h' ? inAnyRoom(mid, mc) : inAnyRoom(mc, mid)) continue // the band must be solid, not a room
      const next = list.filter((_, k) => k !== i && k !== j)
      next.push(mk(A.dir, mc, lo, hi, false, g))
      for (const W of [A, B]) {
        if (lo - W.a > 0.05) next.push(mk(W.dir, W.c, W.a, lo, W.exterior, null))
        if (W.b - hi > 0.05) next.push(mk(W.dir, W.c, hi, W.b, W.exterior, null))
      }
      list = next; changed = true; break outer
    }
  }
  return list.map((W, i) => {
    if (W.dir === 'd') return { id: 'w' + (i + 1), a: W.w.a, b: W.w.b, exterior: true, thickness: T_EXT }
    let c = W.c, t = W.t
    if (!t) {
      t = W.exterior ? T_EXT : T_INT
      if (W.exterior) { // shift outwards: the inside is the side where a room is
        const mid = (W.a + W.b) / 2, d = 0.06
        const insidePos = W.dir === 'h' ? inAnyRoom(mid, c + d) : inAnyRoom(c + d, mid)
        c += insidePos ? -t / 2 : t / 2
      }
    }
    const r2 = (v) => Math.round(v * 100) / 100
    return { id: 'w' + (i + 1), a: W.dir === 'h' ? [r2(W.a), r2(c)] : [r2(c), r2(W.a)], b: W.dir === 'h' ? [r2(W.b), r2(c)] : [r2(c), r2(W.b)], exterior: W.exterior, thickness: r2(t) }
  })
}

function nearestWall(walls, x, y) {
  let best = null
  for (const w of walls) {
    const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L2 = dx * dx + dy * dy
    if (!L2) continue
    const t = Math.max(0, Math.min(1, ((x - w.a[0]) * dx + (y - w.a[1]) * dy) / L2))
    const px = w.a[0] + t * dx, py = w.a[1] + t * dy
    const d = Math.hypot(x - px, y - py)
    if (!best || d < best.d) best = { wall: w, d, t, L: Math.sqrt(L2) }
  }
  return best
}

// the walls of a set of metric rooms (room edges, shared walls merged, thick walls as thick as the gap): used by buildPlan and again when rooms are deleted or joined (layout/planops.js)
export const wallsOfRooms = (metricRooms) => withThickness(wallsFromRooms(metricRooms), metricRooms)

const DEFAULTS = { door: { w: [0.7, 1.2], h: 2.1, sill: 0 }, window: { w: [0.5, 3.0], h: 1.3, sill: 0.9 }, opening: { w: [0.8, 4.0], h: 2.1, sill: 0 } }

// coordSpace: 'norm' = the model answered in 0..1000 per axis (Gemini), 'px' = in image pixels (Claude)
export function buildPlan(ex, { imageSize, ceilingHeight = 2.6, coordSpace = 'norm' } = {}) {
  if (!imageSize) throw new Error('buildPlan needs imageSize [width, height] in pixels')
  const [IW, IH] = imageSize
  const nx = IW / 1000, ny = IH / 1000 // 0..1000 per axis -> pixels
  const kx = coordSpace === 'px' ? 1 : nx, ky = coordSpace === 'px' ? 1 : ny // work in pixels so x and y share one scale
  const warnings = []
  const rawRooms = (ex.rooms || []).filter((r) => Array.isArray(r.polygon) && r.polygon.length >= 3)
    .map((r) => ({ ...r, polygon: r.polygon.map((p) => ({ x: p.x * kx, y: p.y * ky })) }))
  if (!rawRooms.length) throw new Error('model returned no rooms')
  const rooms = snapRooms(rawRooms, TOL_FRAC * IW)
  const openingsU = (ex.openings || []).filter((o) => [o.x1, o.y1, o.x2, o.y2].every(Number.isFinite))
    .map((o) => ({ kind: o.kind, ...(o.sliding || o.style ? { style: o.style || 'sliding' } : {}), x: ((o.x1 + o.x2) / 2) * kx, y: ((o.y1 + o.y2) / 2) * ky, width: Math.hypot((o.x2 - o.x1) * kx, (o.y2 - o.y1) * ky), ...(Number.isFinite(o.support) ? { support: o.support } : {}) }))
  const dims = (ex.dimensions || []).map((d) => ({ ...d, x: Number.isFinite(d.x) ? d.x * kx : d.x, y: Number.isFinite(d.y) ? d.y * ky : d.y }))
  const cues = (ex.cues || []).filter((c) => [c.x1, c.y1, c.x2, c.y2, c.meters].every(Number.isFinite)).map((c) => ({ what: c.what, meters: c.meters, len: Math.hypot((c.x2 - c.x1) * kx, (c.y2 - c.y1) * ky) }))
  ex = { ...ex, dimensions: dims, cues }
  const scale = solveScale(ex, rooms, openingsU)
  const s = scale.mPerUnit
  const minX = Math.min(...rooms.flatMap((r) => r.polygon.map((p) => p[0]))), minY = Math.min(...rooms.flatMap((r) => r.polygon.map((p) => p[1])))
  const toM = (p) => [r2((p[0] - minX) * s), r2((p[1] - minY) * s)]
  const metricRooms = rooms.map((r, i) => {
    const polygon = r.polygon.map(toM)
    return { id: 'r' + (i + 1), name: r.name, type: r.type, polygon, areaM2: r2(polyArea(polygon)), ...(r.userKind ? { userKind: r.userKind } : {}), ...(Number.isFinite(r.support) ? { support: r.support } : {}) }          // support: how far the other readings back this room up (lib/consensus.js review)
  })
  const walls = wallsOfRooms(metricRooms)
  const openings = []
  openingsU.forEach((o) => {
    const [mx, my] = toM([o.x, o.y])
    const near = nearestWall(walls, mx, my)
    if (!near || near.d > 0.6) { warnings.push(`${o.kind} at ${mx},${my} is not on a wall (${near ? near.d.toFixed(2) + ' m away' : 'no walls'}), dropped`); return }
    const d = DEFAULTS[o.kind] || DEFAULTS.door
    let width = Number.isFinite(o.width) && o.width > 0 ? o.width * s : (d.w[0] + d.w[1]) / 2
    width = Math.max(d.w[0], Math.min(o.style === 'sliding' ? 3.0 : o.style === 'double' ? 2.0 : d.w[1], width))          // a sliding glass door can be as wide as a window (3 m), a double door 2 m
    const offset = Math.max(width / 2, Math.min(near.L - width / 2, near.t * near.L))
    openings.push({ id: 'o' + (openings.length + 1), kind: o.kind, wall: near.wall.id, offset: r2(offset), width: r2(width), height: d.h, sill: d.sill, ...(o.style ? { style: o.style } : {}), ...(Number.isFinite(o.support) ? { support: o.support } : {}) })
  })
  // furniture drawn in the plan (image coordinates and pixel sizes) -> metres, kept as the room's own layout
  const furniture = (ex.furniture || []).map((f) => {
    const [x, z] = toM([f.x * kx, f.y * ky]); const it = { type: f.type, x, z, rot: f.rot || 0 }
    if (f.w) it.w = r2(f.w * kx * s)
    if (f.d) it.d = r2(f.d * ky * s)
    if (f.upper !== undefined) it.upper = f.upper
    if (f.h) it.h = f.h                                  // metres
    if (f.fixed) it.fixed = true                         // built in: a bathtub, a sink counter, a shower cabin drawn in the plan stand where they are in every arrangement
    return it
  })
  const W = Math.max(...metricRooms.flatMap((r) => r.polygon.map((p) => p[0]))), H = Math.max(...metricRooms.flatMap((r) => r.polygon.map((p) => p[1])))
  return {
    plan: {
      version: 1, units: 'm', ceilingHeight,
      scale: { source: scale.source, mPerUnit: Number(s.toFixed(5)), candidates: scale.candidates, spreadPct: scale.spreadPct },
      bounds: { width: r2(W), depth: r2(H) },
      // where the plan sits in the picture that was read (in the pixels of that picture): metres x, z <-> pixels  minX + x / mPerUnit, minY + z / mPerUnit (app/editor.js shows the original next to the plan)
      source: { imageSize: [IW, IH], origin: [r2(minX), r2(minY)] },
      rooms: metricRooms, walls, openings, ...(furniture.length ? { furniture } : {}), wallBoxes: buildWallBoxes(metricRooms, openings, walls, { low: 1.1, full: ceilingHeight }), warnings, notes: ex.notes || '',
    },
    // image-space copies after snapping (back in 0..1000 units per axis), kept for scoring
    units: {
      rooms: rooms.map((r) => ({ name: r.name, type: r.type, polygon: r.polygon.map((p) => [p[0] / nx, p[1] / ny]) })),
      openings: openingsU.map((o) => ({ kind: o.kind, x: o.x / nx, y: o.y / ny, width: o.width })),
    },
  }
}
