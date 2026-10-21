// Editing the windows of a plan: slide a window along its wall, stretch it, change its height and sill, divide it into panes, add one, remove one.
// Windows are entries of plan.openings: { id, kind: 'window', wall, offset (centre, from the wall's start), width, height, sill, panes }.
// After any change call rebuild(plan): the wall solids are cut again, so the holes in the walls follow the windows.
import { buildWallBoxes } from '../lib/wallsolid.js'

export const LIMITS = { width: [0.4, 6], height: [0.4, 2.4], sill: [0, 1.6], endGap: 0.25, neighbourGap: 0.1, partitionGap: 0.1, minPane: 0.35, maxPanes: 8 }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const r3 = (v) => Math.round(v * 1000) / 1000

export const wallOf = (plan, op) => plan.walls.find((w) => w.id === op.wall)
export const wallLength = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])
// how many panes a window shows: one more than its bars when the bars were placed by hand, otherwise what the user chose, otherwise two for a window wider than a metre
export const panesOf = (op) => (op.splits ? op.splits.length + 1 : Math.max(1, Math.min(LIMITS.maxPanes, op.panes ?? (op.width > 1.0 ? 2 : 1))))
// where the bars between the panes stand, as fractions (0..1) of the window's width from its left end; equal panes unless the bars were moved
export const splitsOf = (op) => { const n = panesOf(op); return op.splits ? [...op.splits] : Array.from({ length: n - 1 }, (_, k) => (k + 1) / n) }
const r4 = (v) => Math.round(v * 100000) / 100000        // bar positions: fractions of the width, fine enough for a 6 m window to be exact to 0.05 mm
const SLACK = 0.002                                            // a pane may be this much (metres) under the minimum before it counts as too thin: rounding, not a real violation
export const windows = (plan) => plan.openings.filter((o) => o.kind === 'window')

// centre, direction along the wall and the two ends of a window in plan metres
export function placement(plan, op) {
  const w = wallOf(plan, op), L = wallLength(w), u = [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L]
  const c = [w.a[0] + u[0] * op.offset, w.a[1] + u[1] * op.offset], h = op.width / 2
  return { wall: w, length: L, u, c, a: [c[0] - u[0] * h, c[1] - u[1] * h], b: [c[0] + u[0] * h, c[1] + u[1] * h] }
}

// the stretch of this wall that belongs to the room(s) the window looks into: from one partition face to the next. A window never crosses a partition,
// because the wall cut would take the end off the partition. null when no room edge lies along the wall at the window.
export function roomRun(plan, op) {
  const w = wallOf(plan, op), L = wallLength(w), u = [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L], half = Math.max(w.thickness || 0.12, 0.12) / 2 + 0.25
  let lo = -Infinity, hi = Infinity, found = false
  for (const r of plan.rooms) {
    const pts = r.polygon, runs = []
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ex = b[0] - a[0], ez = b[1] - a[1], len = Math.hypot(ex, ez)
      if (len < 0.05 || Math.abs((ex * u[0] + ez * u[1]) / len) < 0.98) continue
      const rx = a[0] - w.a[0], rz = a[1] - w.a[1]; if (Math.abs(rx * -u[1] + rz * u[0]) > half) continue
      const s0 = rx * u[0] + rz * u[1], s1 = s0 + ex * u[0] + ez * u[1]; runs.push([Math.min(s0, s1), Math.max(s0, s1)])
    }
    runs.sort((p, q) => p[0] - q[0])
    const merged = []; for (const run of runs) { const last = merged[merged.length - 1]; if (last && run[0] <= last[1] + 0.05) last[1] = Math.max(last[1], run[1]); else merged.push([...run]) }       // straight edges split by extra corner points are one run
    const mine = merged.find(([a, z]) => op.offset >= a - 0.05 && op.offset <= z + 0.05); if (!mine) continue
    lo = Math.max(lo, mine[0]); hi = Math.min(hi, mine[1]); found = true
  }
  return found ? [lo, hi] : null
}

// the stretch of the wall a window may occupy: inside its room's wall, between its neighbours (or the wall ends) with a little air
export function freeSpan(plan, op, { strict = false, neighbours = true } = {}) {
  const w = wallOf(plan, op), L = wallLength(w)
  let lo = LIMITS.endGap, hi = L - LIMITS.endGap
  const run = roomRun(plan, op)
  if (run) { lo = Math.max(lo, run[0] + LIMITS.partitionGap); hi = Math.min(hi, run[1] - LIMITS.partitionGap) }
  for (const o of plan.openings) {
    if (!neighbours || o === op || o.wall !== op.wall) continue
    if (o.offset < op.offset) lo = Math.max(lo, o.offset + o.width / 2 + LIMITS.neighbourGap)
    else hi = Math.min(hi, o.offset - o.width / 2 - LIMITS.neighbourGap)
  }
  if (!strict) { lo = Math.min(lo, op.offset - op.width / 2); hi = Math.max(hi, op.offset + op.width / 2) }      // a window that already reaches further (an old plan) is not squeezed while it is edited
  return [lo, hi]
}

export function moveWindow(plan, id, offset) {
  const op = plan.openings.find((o) => o.id === id); if (!op) return null
  const [lo, hi] = freeSpan(plan, op)
  op.offset = r3(clamp(offset, lo + op.width / 2, hi - op.width / 2))
  return op
}

// bars placed by hand must keep every pane at least minPane wide; when a narrower window can no longer hold them, the panes are made equal (and fewer if needed)
export function normSplits(op) {
  if (!op.splits) return op
  const minF = LIMITS.minPane / op.width, maxBars = Math.max(0, Math.min(LIMITS.maxPanes - 1, Math.floor(op.width / LIMITS.minPane) - 1))
  let s = op.splits.filter((v) => v > 0 && v < 1).sort((a, b) => a - b).slice(0, maxBars)
  const pts = [0, ...s, 1], ok = pts.every((v, i) => i === 0 || v - pts[i - 1] >= minF - SLACK / op.width)
  if (!ok) s = Array.from({ length: s.length }, (_, k) => r4((k + 1) / (s.length + 1)))
  if (s.length) { op.splits = s.map(r4); op.panes = s.length + 1 } else { delete op.splits; op.panes = 1 }
  return op
}

export function setWindow(plan, id, patch) {
  const op = plan.openings.find((o) => o.id === id); if (!op) return null
  const [lo, hi] = freeSpan(plan, op)
  if (patch.width !== undefined) {
    const maxW = Math.min(LIMITS.width[1], 2 * Math.min(op.offset - lo, hi - op.offset))        // stretches from the centre
    op.width = r3(clamp(patch.width, LIMITS.width[0], Math.max(LIMITS.width[0], maxW)))
  }
  if (patch.height !== undefined) op.height = r3(clamp(patch.height, LIMITS.height[0], LIMITS.height[1]))
  if (patch.sill !== undefined) op.sill = r3(clamp(patch.sill, LIMITS.sill[0], LIMITS.sill[1]))
  op.height = r3(Math.min(op.height, 2.5 - op.sill))                                              // never through the ceiling
  if (patch.panes !== undefined) { op.panes = Math.round(clamp(patch.panes, 1, LIMITS.maxPanes)); delete op.splits }      // a pane count means equal panes
  if (op.splits) normSplits(op)
  else op.panes = Math.max(1, Math.min(op.panes ?? panesOf(op), Math.floor(op.width / LIMITS.minPane) || 1, LIMITS.maxPanes))
  return op
}

// set the edges of a window directly, in metres: left/right along the wall (from the wall's start), bottom/top above the floor. Whatever is not given stays.
// Giving both edges of a pair moves the window with its size kept. Neighbours, wall ends, size limits and the ceiling are respected.
export function fitWindow(plan, id, e) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  const [lo, hi] = freeSpan(plan, op), top = 2.5
  let l = op.offset - op.width / 2, r = op.offset + op.width / 2, b = op.sill, t = op.sill + op.height
  if (e.left !== undefined && e.right !== undefined) { const w = clamp(e.right - e.left, LIMITS.width[0], Math.min(LIMITS.width[1], hi - lo)); l = clamp(e.left, lo, hi - w); r = l + w }
  else if (e.left !== undefined) { l = clamp(e.left, Math.max(lo, r - LIMITS.width[1]), r - LIMITS.width[0]) }
  else if (e.right !== undefined) { r = clamp(e.right, l + LIMITS.width[0], Math.min(hi, l + LIMITS.width[1])) }
  if (e.bottom !== undefined && e.top !== undefined) { const h = clamp(e.top - e.bottom, LIMITS.height[0], LIMITS.height[1]); b = clamp(e.bottom, LIMITS.sill[0], Math.min(LIMITS.sill[1], top - h)); t = b + h }
  else if (e.bottom !== undefined) { b = clamp(e.bottom, LIMITS.sill[0], Math.min(LIMITS.sill[1], t - LIMITS.height[0])); if (t - b > LIMITS.height[1]) t = b + LIMITS.height[1] }
  else if (e.top !== undefined) { t = clamp(e.top, b + LIMITS.height[0], Math.min(b + LIMITS.height[1], top)) }
  op.offset = r3((l + r) / 2); op.width = r3(r - l); op.sill = r3(b); op.height = r3(t - b)
  if (op.splits) normSplits(op); else op.panes = Math.max(1, Math.min(op.panes ?? panesOf(op), Math.floor(op.width / LIMITS.minPane) || 1, LIMITS.maxPanes))
  return op
}

// the bars between the panes: move one (to a fraction of the width), add one in the widest pane, remove one, or make the panes equal again
export function setSplit(plan, id, k, frac) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  const s = splitsOf(op); if (k < 0 || k >= s.length) return null
  // work in metres from the left end: snap to 5 cm, keep both neighbouring panes at least minPane wide (the limits are rounded inwards onto the 5 cm grid)
  const W = op.width, lo = (s[k - 1] ?? 0) * W + LIMITS.minPane, hi = (s[k + 1] ?? 1) * W - LIMITS.minPane
  const a = Math.ceil((lo - 1e-9) / 0.05) * 0.05, z = Math.floor((hi + 1e-9) / 0.05) * 0.05
  const pos = a <= z ? clamp(Math.round(frac * W / 0.05) * 0.05, a, z) : (lo + hi) / 2
  s[k] = pos / W; op.splits = s.map(r4); op.panes = s.length + 1; return op
}
export function addBar(plan, id) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  const s = splitsOf(op), pts = [0, ...s, 1]
  if (s.length + 1 >= LIMITS.maxPanes) return null
  let best = 0; for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > pts[best + 1] - pts[best]) best = i - 1
  if ((pts[best + 1] - pts[best]) * op.width < 2 * LIMITS.minPane) return null          // no pane is wide enough to be divided
  s.push((pts[best] + pts[best + 1]) / 2); s.sort((a, b) => a - b); op.splits = s.map(r4); op.panes = s.length + 1; return op
}
export function removeBar(plan, id, k) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  const s = splitsOf(op); if (k < 0 || k >= s.length) return null
  s.splice(k, 1); if (s.length) { op.splits = s.map(r4); op.panes = s.length + 1 } else { delete op.splits; op.panes = 1 }
  return op
}
export function equalPanes(plan, id) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op) return null
  op.panes = panesOf(op); delete op.splits; return op
}

export function removeWindow(plan, id) {
  const i = plan.openings.findIndex((o) => o.id === id && o.kind === 'window'); if (i < 0) return false
  plan.openings.splice(i, 1); return true
}

// a new window on an exterior wall of the room, in the longest free stretch; null when no wall of the room has one
export function addWindow(plan, space, roomIndex, tpl = null) {
  const room0 = space.rooms[roomIndex]; if (!room0) return null
  let best = null
  for (const w of plan.walls) {
    if (!w.exterior) continue
    const L = wallLength(w), u = [(w.b[0] - w.a[0]) / L, (w.b[1] - w.a[1]) / L]
    for (const e of room0.edges) {
      if (e.len < 0.9 || Math.abs(u[0] * e.t[0] + u[1] * e.t[1]) < 0.98) continue
      const rx = e.a[0] - w.a[0], rz = e.a[1] - w.a[1], d = Math.abs(rx * -u[1] + rz * u[0])
      if (d > Math.max(w.thickness || 0.3, 0.3) / 2 + 0.25) continue
      const s0 = rx * u[0] + rz * u[1], s1 = s0 + (e.t[0] * u[0] + e.t[1] * u[1]) * e.len, lo = Math.min(s0, s1), hi = Math.max(s0, s1)
      // free intervals of this stretch of the wall
      const blocks = plan.openings.filter((o) => o.wall === w.id).map((o) => [o.offset - o.width / 2 - LIMITS.neighbourGap, o.offset + o.width / 2 + LIMITS.neighbourGap]).sort((a, b) => a[0] - b[0])
      let cur = Math.max(lo, LIMITS.endGap) + 0.1
      const end = Math.min(hi, L - LIMITS.endGap) - 0.1, gaps = []
      for (const [b0, b1] of blocks) { if (b0 > cur) gaps.push([cur, Math.min(b0, end)]); cur = Math.max(cur, b1) }
      if (cur < end) gaps.push([cur, end])
      for (const [g0, g1] of gaps) if (g1 - g0 >= 0.8 && (!best || g1 - g0 > best.len)) best = { wall: w, a: g0, b: g1, len: g1 - g0 }
    }
  }
  if (!best) return null
  const width = r3(Math.min(tpl?.width ?? 1.4, best.len)), id = 'w' + (Math.max(0, ...plan.openings.map((o) => Number(String(o.id).replace(/\D/g, '')) || 0)) + 1)
  const sill = r3(clamp(tpl?.sill ?? 0.9, LIMITS.sill[0], LIMITS.sill[1])), height = r3(Math.min(tpl?.height ?? 1.3, 2.5 - sill))
  const op = { id, kind: 'window', wall: best.wall.id, offset: r3((best.a + best.b) / 2), width, height, sill, panes: tpl ? tpl.panes : width > 1.0 ? 2 : 1 }
  if (tpl?.splits) op.splits = [...tpl.splits]
  normSplits(op)
  plan.openings.push(op); return op
}

// a window's size, height, sill and pane layout, kept under a name so it can be used on other windows and in other rooms
export function templateOf(op, name = '') {
  const n = panesOf(op), w = Math.round(op.width * 100), h = Math.round(op.height * 100)
  return { id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: (String(name).trim() || `${w} × ${h} cm, ${n} pane${n > 1 ? 's' : ''}`).slice(0, 40), width: r3(op.width), height: r3(op.height), sill: r3(op.sill), panes: n, splits: op.splits ? [...op.splits] : null }
}
// give an existing window the template's size (from its centre, within the limits of its wall), height, sill and panes
export function applyTemplate(plan, id, tpl) {
  const op = plan.openings.find((o) => o.id === id && o.kind === 'window'); if (!op || !tpl) return null
  setWindow(plan, id, { width: tpl.width, height: tpl.height, sill: tpl.sill, ...(tpl.splits ? {} : { panes: tpl.panes }) })
  if (tpl.splits) { op.splits = [...tpl.splits]; normSplits(op) }
  return op
}

// windows saved before the limits existed (or from a hand-edited file) can reach across a partition: bring every window back inside its room's wall
export function refitWindows(plan) {
  let changed = 0
  for (const op of windows(plan)) {
    const [lo, hi] = freeSpan(plan, op, { strict: true, neighbours: false }), l = op.offset - op.width / 2, r = op.offset + op.width / 2
    if (hi - lo < LIMITS.width[0] || (l >= lo - 1e-6 && r <= hi + 1e-6)) continue
    const nl = Math.max(l, lo), nr = Math.min(r, hi); op.offset = r3((nl + nr) / 2); op.width = r3(nr - nl); changed++
    if (op.splits) normSplits(op); else op.panes = Math.max(1, Math.min(op.panes ?? panesOf(op), Math.floor(op.width / LIMITS.minPane) || 1, LIMITS.maxPanes))
  }
  return changed
}

// cut the wall solids again after the openings changed
export function rebuild(plan) {
  plan.wallBoxes = buildWallBoxes(plan.rooms, plan.openings, plan.walls, { low: 1.1, full: plan.ceilingHeight })
  plan.wallBoxesInterior = null          // the full-height version for inside views is made again when it is next needed
  plan._wallsRev = 7                     // the wall solids follow the current rules (railings around outdoor areas; a door cuts only its own wall); plans saved before are cut again once when they are opened
  return plan
}
