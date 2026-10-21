// Walls as ONE solid instead of one slab per wall segment, so corners and T-junctions come out right.
//   1. rasterise the rooms (inner faces) on a fine grid,
//   2. close gaps up to 0.95 m between rooms: that mass is the thick wall between them,
//   3. add a thin band where two rooms touch, and a ring around the whole building (exterior wall),
//   4. cut the openings, then turn the cells into a handful of boxes.
// Output boxes are in plan metres: { x0, z0, x1, z1, y0, y1, cls: 'int' | 'ext' | 'rail', back: boolean }.
// Terraces and balconies are outdoor areas: where they border the open air they get a 10 cm railing (cls 'rail', 1.05 m) instead of a 30 cm exterior wall.
// "back" = exterior walls on the north and west side, which stay full height in the dollhouse view.
// An angled wall is drawn straight: its step boxes carry diag: true (plan and collision only), and one prism per stretch carries slant: [4 corners] (see below).
import { pointInPoly } from './build.js'
import { isOutdoor } from '../layout/space.js'

const integral = (m, nx, nz) => {
  const I = new Int32Array((nx + 1) * (nz + 1))
  for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) I[(z + 1) * (nx + 1) + x + 1] = m[z * nx + x] + I[z * (nx + 1) + x + 1] + I[(z + 1) * (nx + 1) + x] - I[z * (nx + 1) + x]
  return I
}
const win = (I, nx, nz, x0, z0, x1, z1) => {
  x0 = Math.max(0, x0); z0 = Math.max(0, z0); x1 = Math.min(nx - 1, x1); z1 = Math.min(nz - 1, z1)
  if (x1 < x0 || z1 < z0) return 0
  return I[(z1 + 1) * (nx + 1) + x1 + 1] - I[z0 * (nx + 1) + x1 + 1] - I[(z1 + 1) * (nx + 1) + x0] + I[z0 * (nx + 1) + x0]
}
const dilate = (m, nx, nz, r) => { const I = integral(m, nx, nz), o = new Uint8Array(m.length); for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) o[z * nx + x] = win(I, nx, nz, x - r, z - r, x + r, z + r) > 0 ? 1 : 0; return o }
const invert = (m) => { const o = new Uint8Array(m.length); for (let i = 0; i < m.length; i++) o[i] = m[i] ? 0 : 1; return o }
const closing = (m, nx, nz, r) => invert(dilate(invert(dilate(m, nx, nz, r)), nx, nz, r))

// allWindows: cut the windows of every wall, not only the full-height back walls (for views from inside the room)
export function buildWallBoxes(rooms, openings, walls, { cell = 0.03, tExt = 0.3, maxGap = 0.95, low = 1.1, full = 2.6, allWindows = false, railing = 1.05 } = {}) {
  const pts = rooms.flatMap((r) => r.polygon)
  const pad = tExt + 0.6
  const ox = Math.min(...pts.map((p) => p[0])) - pad, oz = Math.min(...pts.map((p) => p[1])) - pad
  const nx = Math.ceil((Math.max(...pts.map((p) => p[0])) + pad - ox) / cell), nz = Math.ceil((Math.max(...pts.map((p) => p[1])) + pad - oz) / cell)
  const id = new Int16Array(nx * nz).fill(-1)
  rooms.forEach((r, ri) => {
    const xs = r.polygon.map((p) => p[0]), zs = r.polygon.map((p) => p[1])
    const x0 = Math.max(0, Math.floor((Math.min(...xs) - ox) / cell)), x1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) - ox) / cell))
    const z0 = Math.max(0, Math.floor((Math.min(...zs) - oz) / cell)), z1 = Math.min(nz - 1, Math.ceil((Math.max(...zs) - oz) / cell))
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (id[z * nx + x] < 0 && pointInPoly(ox + (x + 0.5) * cell, oz + (z + 0.5) * cell, r.polygon)) id[z * nx + x] = ri
  })
  const room = new Uint8Array(nx * nz); for (let i = 0; i < room.length; i++) room[i] = id[i] >= 0 ? 1 : 0
  const outdoor = rooms.map((r) => isOutdoor(r)), outMask = new Uint8Array(nx * nz), inMask = new Uint8Array(nx * nz)
  for (let i = 0; i < room.length; i++) if (id[i] >= 0) { if (outdoor[id[i]]) outMask[i] = 1; else inMask[i] = 1 }
  const anyOutdoor = outdoor.some(Boolean)
  const closed = closing(room, nx, nz, Math.round(maxGap / 2 / cell))          // rooms plus the thick walls between them
  // thin wall where two rooms touch
  // the contact lines between rooms, side by side (bandV: walls running up and down, bandH: walls running left and right) so that corners can be squared off below
  const bandV = new Uint8Array(nx * nz), bandH = new Uint8Array(nx * nz)
  for (let z = 0; z < nz - 1; z++) for (let x = 0; x < nx - 1; x++) {
    const a = id[z * nx + x]; if (a < 0) continue
    const r = id[z * nx + x + 1], d = id[(z + 1) * nx + x]
    if (r >= 0 && r !== a && outdoor[r] === outdoor[a]) { bandV[z * nx + x] = 1; bandV[z * nx + x + 1] = 1 }          // (the wall between a room and an outdoor area is the outside wall of the house: see facade below)
    if (d >= 0 && d !== a && outdoor[d] === outdoor[a]) { bandH[z * nx + x] = 1; bandH[(z + 1) * nx + x] = 1 }
  }
  const bandVd = dilate(bandV, nx, nz, 1), bandHd = dilate(bandH, nx, nz, 1), band2 = new Uint8Array(nx * nz)
  for (let i = 0; i < band2.length; i++) band2[i] = bandVd[i] | bandHd[i]
  // where a wall running left-right meets one running up-down, each stops a cell short of the other's outer face and leaves a one-cell notch (3 cm) in the outer corner:
  // a cell that lies on the line of the horizontal wall (a horizontal neighbour belongs to it) and on the line of the vertical wall (a vertical neighbour belongs to it) is that corner
  for (let z = 1; z < nz - 1; z++) for (let x = 1; x < nx - 1; x++) {
    const i = z * nx + x; if (band2[i]) continue
    if ((bandHd[i - 1] || bandHd[i + 1]) && (bandVd[i - nx] || bandVd[i + nx]) && !(bandVd[i - 1] || bandVd[i + 1] || bandHd[i - nx] || bandHd[i + nx])) band2[i] = 2
  }
  for (let i = 0; i < band2.length; i++) if (band2[i] === 2) band2[i] = 1
  // A wall at an angle between two rooms: the contact band above is built from neighbouring cells and comes out as chunky steps (9 to 12 cm) on a slope, too big for the outline straightening below.
  // It is replaced by the exact thin wall: 12 cm thick, centred on the line where the rooms touch, a little longer at both ends so it runs into the walls it meets.
  const roomAt = (x, z) => { const gx = Math.floor((x - ox) / cell), gz = Math.floor((z - oz) / cell); return gx >= 0 && gz >= 0 && gx < nx && gz < nz ? id[gz * nx + gx] : -1 }
  const between = (w) => {          // a wall with a different room on each side (and not an outside wall: that is built from the ring below)
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, mx = w.a[0] + dx / 2, mz = w.a[1] + dz / 2
    const ra = roomAt(mx - uz * 0.1, mz + ux * 0.1), rb = roomAt(mx + uz * 0.1, mz - ux * 0.1)
    return ra >= 0 && rb >= 0 && ra !== rb && outdoor[ra] === outdoor[rb]
  }
  const thin = [], seen = new Set()          // the thin walls, once each (two rooms that share a wall give it twice)
  for (const w of walls) { const k = [w.a, w.b].map((q) => q.map((v) => Math.round(v * 100)).join(',')).sort().join('|'); if (!seen.has(k) && between(w)) { seen.add(k); thin.push(w) } }
  for (const w of thin) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz)
    if (L < 0.5 || Math.min(Math.abs(dx), Math.abs(dz)) < 0.03) continue
    const ux = dx / L, uz = dz / L
    const half = 0.06, REACH = 0.3, ext = 0.06
    const gx0 = Math.max(0, Math.floor((Math.min(w.a[0], w.b[0]) - REACH - ext - ox) / cell)), gx1 = Math.min(nx - 1, Math.ceil((Math.max(w.a[0], w.b[0]) + REACH + ext - ox) / cell))
    const gz0 = Math.max(0, Math.floor((Math.min(w.a[1], w.b[1]) - REACH - ext - oz) / cell)), gz1 = Math.min(nz - 1, Math.ceil((Math.max(w.a[1], w.b[1]) + REACH + ext - oz) / cell))
    for (let z = gz0; z <= gz1; z++) for (let x = gx0; x <= gx1; x++) {
      const i = z * nx + x, px = ox + (x + 0.5) * cell - w.a[0], pz = oz + (z + 0.5) * cell - w.a[1], s = px * ux + pz * uz, d = -px * uz + pz * ux
      if (s < -ext || s > L + ext) continue
      if (Math.abs(d) <= half) { if (closed[i]) band2[i] = 1 }          // the exact thin wall (inside the building only: its end must not push into the outside wall)
      else if (Math.abs(d) <= REACH && s >= 0.02 && s <= L - 0.02) band2[i] = 0          // the chunky band beside it
    }
  }
  // Where an angled thin wall bends into another thin wall, the two square wall ends leave a wedge open on the outside of the turn (a bevel of 5 to 8 cm). It is filled with the mitre:
  // the kite P, P + h n1, M, P + h n2 (n1, n2: the sides of the two walls away from each other, M: where those two faces meet).
  for (const t of thin) {
    const tdx = t.b[0] - t.a[0], tdz = t.b[1] - t.a[1]; if (Math.min(Math.abs(tdx), Math.abs(tdz)) < 0.03 || Math.hypot(tdx, tdz) < 0.5) continue
    for (const [P, Q] of [[t.a, t.b], [t.b, t.a]]) for (const v of thin) {
      if (v === t) continue
      const R = Math.hypot(v.a[0] - P[0], v.a[1] - P[1]) < 0.02 ? v.b : Math.hypot(v.b[0] - P[0], v.b[1] - P[1]) < 0.02 ? v.a : null; if (!R) continue
      const lt = Math.hypot(Q[0] - P[0], Q[1] - P[1]), lv = Math.hypot(R[0] - P[0], R[1] - P[1]); if (lt < 0.1 || lv < 0.1) continue
      const dt = [(Q[0] - P[0]) / lt, (Q[1] - P[1]) / lt], dv = [(R[0] - P[0]) / lv, (R[1] - P[1]) / lv]
      if (Math.abs(dt[0] * dv[1] - dt[1] * dv[0]) < 0.05) continue          // in line (or folded back): no turn
      const half = 0.06, away = (d, other) => { const n = [-d[1], d[0]]; return n[0] * other[0] + n[1] * other[1] > 0 ? [-n[0], -n[1]] : n }
      const n1 = away(dt, dv), n2 = away(dv, dt), den = 1 + n1[0] * n2[0] + n1[1] * n2[1]; if (den < 0.05) continue          // (a very sharp turn: the mitre would run far out)
      const M = [P[0] + (half * (n1[0] + n2[0])) / den, P[1] + (half * (n1[1] + n2[1])) / den]; if (Math.hypot(M[0] - P[0], M[1] - P[1]) > 0.3) continue
      const kite = [P, [P[0] + half * n1[0], P[1] + half * n1[1]], M, [P[0] + half * n2[0], P[1] + half * n2[1]]]
      const kx = kite.map((q) => q[0]), kz = kite.map((q) => q[1])
      for (let z = Math.max(0, Math.floor((Math.min(...kz) - oz) / cell)); z <= Math.min(nz - 1, Math.ceil((Math.max(...kz) - oz) / cell)); z++) for (let x = Math.max(0, Math.floor((Math.min(...kx) - ox) / cell)); x <= Math.min(nx - 1, Math.ceil((Math.max(...kx) - ox) / cell)); x++)
        if (closed[z * nx + x] && pointInPoly(ox + (x + 0.5) * cell, oz + (z + 0.5) * cell, kite)) band2[z * nx + x] = 1
    }
  }
  const te = Math.round(tExt / cell)
  const ring = dilate(closed, nx, nz, te), I = integral(closed, nx, nz), Iin = integral(inMask, nx, nz)
  const nearOut = anyOutdoor ? dilate(outMask, nx, nz, te) : null, nearIn = anyOutdoor ? dilate(inMask, nx, nz, te) : null, railBand = anyOutdoor ? dilate(outMask, nx, nz, Math.max(1, Math.round(0.1 / cell))) : null
  // A thin wall between two rooms is centred on the line where the rooms touch, so its faces stand two cells (6 cm) inside each room. The thick mass between rooms (a wardrobe, a closet
  // wall) used to start at the room's own edge: where the two met, the face of the wall had a step of 6 cm. Rooms give up the same two cells along the mass, so every face lines up.
  const massMask = new Uint8Array(nx * nz); for (let i = 0; i < massMask.length; i++) massMask[i] = closed[i] && !room[i] ? 1 : 0
  const trim = dilate(massMask, nx, nz, 2)
  const label = new Uint8Array(nx * nz)   // 1 interior, 2 exterior (front), 3 exterior (back), 4 railing
  for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
    const i = z * nx + x
    if (closed[i] && !room[i]) label[i] = 1
    else if (band2[i]) label[i] = 1
    else if (room[i] && !outMask[i] && trim[i]) label[i] = 1          // the face of a thick wall mass lines up with the face of the thin walls (see trim)
    else if (anyOutdoor && outMask[i] && nearIn[i]) {          // the house wall between a room and its balcony or terrace: as thick as the rest of the outside wall, from the room's inner face outwards, in line with it
      const north = win(Iin, nx, nz, x, z + 1, x, z + te) > 0, west = win(Iin, nx, nz, x + 1, z, x + te, z) > 0
      label[i] = north || west ? 3 : 2
    }
    else if (ring[i] && !closed[i]) {
      if (anyOutdoor && nearOut[i] && !nearIn[i]) { label[i] = railBand[i] ? 4 : 0; continue }          // open air on the other side of an outdoor area: a railing, no wall
      const north = win(I, nx, nz, x, z + 1, x, z + te) > 0, west = win(I, nx, nz, x + 1, z, x + te, z) > 0
      label[i] = north || west ? 3 : 2
    }
  }
  // openings cut through whatever wall is under them
  const cut = new Uint8Array(nx * nz)
  openings.forEach((o, k) => {
    const w = walls.find((q) => q.id === o.wall); if (!w) return
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L
    const cx = w.a[0] + ux * o.offset, cz = w.a[1] + uz * o.offset, half = o.width / 2, reach = Math.min(0.65, Math.max(0.3, (w.thickness || 0.3) / 2 + 0.2))          // across the wall: its own thickness and a little more, not 0.65 m (a closet or shaft under 0.65 m wide has its other wall that close, and the door used to cut a hole in it)
    const r = Math.ceil((half + reach) / cell)
    const gx = Math.round((cx - ox) / cell), gz = Math.round((cz - oz) / cell)
    for (let z = Math.max(0, gz - r); z <= Math.min(nz - 1, gz + r); z++) for (let x = Math.max(0, gx - r); x <= Math.min(nx - 1, gx + r); x++) {
      const i = z * nx + x; if (!label[i]) continue
      if (label[i] === 4 && o.kind === 'window') continue          // a window never cuts a railing
      const px = ox + (x + 0.5) * cell - cx, pz = oz + (z + 0.5) * cell - cz
      if (Math.abs(px * ux + pz * uz) <= half && Math.abs(-px * uz + pz * ux) <= reach) cut[i] = k + 1
    }
  })
  // Angled walls: a grid can only make steps of them. The wall cells in a rectangle around an angled wall are flagged (their step boxes stay: the plan and the furniture rules use them) and the wall is drawn from the
  // OUTLINE of those cells instead: traced, its steps straightened (Douglas-Peucker, 4.5 cm: a raster staircase of a slope wobbles by up to 4.2 cm), and extruded, one polygon per stretch of the same kind, cut at its windows and doors like the boxes are:
  // { slant: [outline corners in plan metres], holes?: [...], x0..z1: its box, y0, y1, cls, back }. Where the wall meets walls along the axes the outline is just as exact as the boxes were.
  const diagCell = new Uint8Array(nx * nz), slants = []
  for (const w of walls) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz)
    if (L < 0.5 || Math.min(Math.abs(dx), Math.abs(dz)) < 0.03) continue          // along an axis: the grid is exact
    const AROUND = 0.5          // the rectangle around the wall, and half a metre more: its edges lie along the grid, so what is drawn from the outline and what stays boxes meet exactly (a slanted edge would leave cracks)
    const bx0 = Math.min(w.a[0], w.b[0]) - AROUND, bx1 = Math.max(w.a[0], w.b[0]) + AROUND, bz0 = Math.min(w.a[1], w.b[1]) - AROUND, bz1 = Math.max(w.a[1], w.b[1]) + AROUND
    for (let z = Math.max(0, Math.floor((bz0 - oz) / cell)); z <= Math.min(nz - 1, Math.ceil((bz1 - oz) / cell)); z++) for (let x = Math.max(0, Math.floor((bx0 - ox) / cell)); x <= Math.min(nx - 1, Math.ceil((bx1 - ox) / cell)); x++) {
      const i = z * nx + x; if (!label[i] || label[i] === 4) continue
      const cx = ox + (x + 0.5) * cell, cz = oz + (z + 0.5) * cell
      if (cx >= bx0 && cx <= bx1 && cz >= bz0 && cz <= bz1) diagCell[i] = 1
    }
  }
  if (diagCell.some(Boolean)) {
    const groups = new Map()          // one outline per kind of wall cell (label and opening)
    for (let i = 0; i < label.length; i++) if (diagCell[i]) { const k = label[i] * 100000 + cut[i]; (groups.get(k) || groups.set(k, []).get(k)).push(i) }
    const mask = new Uint8Array(nx * nz), vk = (x, z) => z * (nx + 1) + x
    // a closed loop of grid points: the steps of a slope become one straight edge, but a long edge along an axis stays exactly as it is (its two ends are anchors the straightening does not move)
    const simplify = (pts, eps) => {
      const keep = pts.filter((p, i) => { const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length]; return (b[0] - p[0]) * (p[1] - a[1]) - (b[1] - p[1]) * (p[0] - a[0]) !== 0 })          // exact collinear points first
      const n = keep.length; if (n < 4) return keep
      const anchor = new Set(), LONG = Math.round(0.4 / cell)
      for (let i = 0; i < n; i++) { const p = keep[i], q = keep[(i + 1) % n]; if ((p[0] === q[0] || p[1] === q[1]) && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) >= LONG) { anchor.add(i); anchor.add((i + 1) % n) } }
      const dp = (a, b) => {          // the points strictly between indices a and b (a < b, in loop order) that stay
        let far = -1, fi = -1; const p = keep[a % n], q = keep[b % n], len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1e-9
        for (let k = a + 1; k < b; k++) { const r = keep[k % n], dd = Math.abs((q[0] - p[0]) * (p[1] - r[1]) - (p[0] - r[0]) * (q[1] - p[1])) / len; if (dd > far) { far = dd; fi = k } }
        return far > eps ? [...dp(a, fi), keep[fi % n], ...dp(fi, b)] : []
      }
      let marks = [...anchor].sort((x, y) => x - y)
      if (marks.length < 2) {          // no long straight edge: anchor on the two points farthest apart
        let i0 = 0, i1 = 0, best = -1; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dd = (keep[i][0] - keep[j][0]) ** 2 + (keep[i][1] - keep[j][1]) ** 2; if (dd > best) { best = dd; i0 = i; i1 = j } }
        marks = [i0, i1]
      }
      const out = []
      for (let m = 0; m < marks.length; m++) { const a = marks[m], b = m + 1 < marks.length ? marks[m + 1] : marks[0] + n; out.push(keep[a % n], ...dp(a, b)) }
      return out
    }
    const area = (p) => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + (q[0] * r[1] - r[0] * q[1]) / 2 }, 0)
    for (const [k, cells] of groups) {
      const lab = Math.floor(k / 100000), cutNo = k % 100000
      for (const i of cells) mask[i] = 1
      const out = new Map()          // directed edges around every cell side that has no neighbour of the same kind: the region is on the right of the way we go
      const add = (x0, z0, x1, z1) => { const a = vk(x0, z0); (out.get(a) || out.set(a, []).get(a)).push([x1, z1, false]) }
      for (const i of cells) {
        const x = i % nx, z = (i - x) / nx
        if (!(z > 0 && mask[i - nx])) add(x, z, x + 1, z)
        if (!(x < nx - 1 && mask[i + 1])) add(x + 1, z, x + 1, z + 1)
        if (!(z < nz - 1 && mask[i + nx])) add(x + 1, z + 1, x, z + 1)
        if (!(x > 0 && mask[i - 1])) add(x, z + 1, x, z)
      }
      const loops = []
      for (const [a, list] of out) for (const e of list) {
        if (e[2]) continue
        const x0 = a % (nx + 1), z0 = (a - x0) / (nx + 1), pts = [[x0, z0]]; let cx = x0, cz = z0, edge = e
        for (let guard = 0; guard < 200000; guard++) {
          edge[2] = true; cx = edge[0]; cz = edge[1]
          if (cx === x0 && cz === z0) break
          pts.push([cx, cz]); const next = (out.get(vk(cx, cz)) || []).find((q) => !q[2]); if (!next) break; edge = next
        }
        loops.push(pts)
      }
      for (const i of cells) mask[i] = 0
      const metric = loops.map((l) => simplify(l, 1.5).map(([gx, gz]) => [Math.round((ox + gx * cell) * 1000) / 1000, Math.round((oz + gz * cell) * 1000) / 1000]))
      const outers = metric.filter((l) => l.length >= 3 && area(l) > 0.0004), holes = metric.filter((l) => l.length >= 3 && area(l) < -0.0004)
      const top = lab === 3 ? full : low, op = cutNo ? openings[cutNo - 1] : null, ys = []
      if (!op) ys.push([0, top])
      else if (op.kind === 'window') { if (lab === 3 || allWindows) { ys.push([0, op.sill]); if (op.sill + op.height < top) ys.push([op.sill + op.height, top]) } else ys.push([0, top]) }
      else if ((lab === 3 || allWindows) && op.height < top) ys.push([op.height, top])
      const inside = (p, poly) => { let c = false; for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) if ((poly[a][1] > p[1]) !== (poly[b][1] > p[1]) && p[0] < ((poly[b][0] - poly[a][0]) * (p[1] - poly[a][1])) / (poly[b][1] - poly[a][1]) + poly[a][0]) c = !c; return c }
      for (const ol of outers) {
        const hs = holes.filter((h) => inside(h[0], ol))
        for (const [y0, y1] of ys) if (y1 - y0 > 0.005) slants.push({ x0: Math.min(...ol.map((q) => q[0])), z0: Math.min(...ol.map((q) => q[1])), x1: Math.max(...ol.map((q) => q[0])), z1: Math.max(...ol.map((q) => q[1])), y0, y1, cls: lab === 1 ? 'int' : 'ext', back: lab === 3, slant: ol, ...(hs.length ? { holes: hs } : {}) })
      }
    }
  }
  // cells -> rectangles (same label, same opening and same flag merge)
  const rects = []; let open = new Map()
  for (let z = 0; z < nz; z++) {
    const next = new Map()
    let x = 0
    while (x < nx) {
      const i = z * nx + x, lab = label[i]
      if (!lab) { x++; continue }
      const key = lab * 1000000 + diagCell[i] * 100000 + cut[i]; let x1 = x
      while (x1 + 1 < nx && label[z * nx + x1 + 1] * 1000000 + diagCell[z * nx + x1 + 1] * 100000 + cut[z * nx + x1 + 1] === key) x1++
      const rk = key + '|' + x + '|' + x1, prev = open.get(rk)
      if (prev) { prev.z1 = z; next.set(rk, prev) } else { const rc = { lab, cut: cut[i], diag: diagCell[i], x0: x, x1, z0: z, z1: z }; rects.push(rc); next.set(rk, rc) }
      x = x1 + 1
    }
    open = next
  }
  const boxes = [], R = (v) => Math.round(v * 1000) / 1000
  for (const rc of rects) {
    const b = { x0: R(ox + rc.x0 * cell), z0: R(oz + rc.z0 * cell), x1: R(ox + (rc.x1 + 1) * cell), z1: R(oz + (rc.z1 + 1) * cell), cls: rc.lab === 1 ? 'int' : rc.lab === 4 ? 'rail' : 'ext', back: rc.lab === 3, ...(rc.diag ? { diag: true } : {}) }
    const top = rc.lab === 3 ? full : rc.lab === 4 ? railing : low
    if (rc.lab === 4) { if (!rc.cut) boxes.push({ ...b, y0: 0, y1: top }); continue }          // a door or an opening in a railing is a gap (steps, a gate)
    if (!rc.cut) boxes.push({ ...b, y0: 0, y1: top })
    else {
      const o = openings[rc.cut - 1]
      if (o.kind === 'window') {
        if (rc.lab === 3 || allWindows) { boxes.push({ ...b, y0: 0, y1: o.sill }); if (o.sill + o.height < top) boxes.push({ ...b, y0: o.sill + o.height, y1: top }) }
        else boxes.push({ ...b, y0: 0, y1: top })     // windows in the low cut-away walls stay solid
      } else if ((rc.lab === 3 || allWindows) && o.height < top) boxes.push({ ...b, y0: o.height, y1: top })
    }
  }
  boxes.push(...slants)          // (after the boxes: the steps of an angled wall are flagged diag, its straight prisms carry slant)
  return boxes
}
