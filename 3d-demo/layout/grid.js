// Walkability: rasterise the free floor of a room (minus furniture), measure how wide every spot is (distance transform),
// and find the narrowest point on the best walking route from the doors to any spot ("bottleneck width", in metres).
import { pip, overlaps, obb } from './geom.js'

export function freeGrid(room, bodies, step = 0.05) {
  const { x0, z0, x1, z1 } = room.bb
  const nx = Math.ceil((x1 - x0) / step) + 2, nz = Math.ceil((z1 - z0) / step) + 2, ox = x0 - step, oz = z0 - step
  // the floor of the room without any furniture (inside the polygon, clear of the wall solids) is the same every time: made once per room and step
  const cache = (room._grids ||= new Map()); let base = cache.get(step)
  if (!base) {
    base = new Uint8Array(nx * nz)
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (pip(ox + (i + 0.5) * step, oz + (j + 0.5) * step, room.poly)) base[j * nx + i] = 1
    for (const b of room.blockers) {
      const r = Math.max(b.w, b.d) / 2, i0 = Math.max(0, Math.floor((b.x - r - ox) / step)), i1 = Math.min(nx - 1, Math.ceil((b.x + r - ox) / step)), j0 = Math.max(0, Math.floor((b.z - r - oz) / step)), j1 = Math.min(nz - 1, Math.ceil((b.z + r - oz) / step))
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = ox + (i + 0.5) * step, z = oz + (j + 0.5) * step; if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) base[j * nx + i] = 0 }
    }
    cache.set(step, base)
  }
  const free = base.slice()
  // blocked cells are marked from the boxes outwards (only the cells under each box are looked at), not by testing every cell against every box
  const cells = (o, r, fn) => {
    const i0 = Math.max(0, Math.floor((o.x - r - ox) / step)), i1 = Math.min(nx - 1, Math.ceil((o.x + r - ox) / step)), j0 = Math.max(0, Math.floor((o.z - r - oz) / step)), j1 = Math.min(nz - 1, Math.ceil((o.z + r - oz) / step))
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(i, j, ox + (i + 0.5) * step, oz + (j + 0.5) * step)
  }
  for (const o of bodies) {
    const c = Math.cos(o.rot), s = Math.sin(o.rot)
    cells(o, Math.hypot(o.w, o.d) / 2, (i, j, x, z) => { const dx = x - o.x, dz = z - o.z, lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < o.w / 2 && Math.abs(lz) < o.d / 2) free[j * nx + i] = 0 })
  }
  return { nx, nz, ox, oz, step, free }
}

// exact Euclidean distance transform (Felzenszwalb and Huttenlocher), distance in cells to the nearest blocked cell
export function edt({ nx, nz, free }) {
  const INF = 1e12, N = Math.max(nx, nz), v = new Int32Array(N), z = new Float64Array(N + 1), f = new Float64Array(N), d = new Float64Array(N)
  const g = new Float64Array(nx * nz)
  for (let i = 0; i < nx * nz; i++) g[i] = free[i] ? INF : 0
  const line = (n) => {            // squared distance transform of f[0..n-1] into d
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF
    for (let q = 1; q < n; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
      while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]) }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF
    }
    k = 0
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]] }
  }
  for (let i = 0; i < nx; i++) { for (let j = 0; j < nz; j++) f[j] = g[j * nx + i]; line(nz); for (let j = 0; j < nz; j++) g[j * nx + i] = d[j] }
  for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) f[i] = g[j * nx + i]; line(nx); for (let i = 0; i < nx; i++) g[j * nx + i] = d[i] }
  const out = new Float32Array(nx * nz)
  for (let i = 0; i < nx * nz; i++) out[i] = free[i] ? Math.sqrt(g[i]) : 0
  return out
}

// width of the passage at a cell in metres (distance to the nearest obstacle edge, both sides)
export const widthOf = (d, step) => (d > 0 ? 2 * (d - 0.5) * step : 0)

// widest-path search from the door landings: for every cell the largest "narrowest width" over all routes.
// Cells inside `exempt` zones (the floor in front of doors and the clear zones of furniture) do not count as narrow, they are
// free by construction; the route is only judged on the floor between them.
export function bottleneck(grid, dist, sources, exempt = []) {
  const { nx, nz, ox, oz, step } = grid, best = new Float32Array(nx * nz), hw = [], hc = []          // the heap: weights and cells in two plain arrays
  const push = (c, w) => { let i = hw.length; hw.push(w); hc.push(c); while (i > 0) { const p = (i - 1) >> 1; if (hw[p] >= w) break; hw[i] = hw[p]; hc[i] = hc[p]; i = p } hw[i] = w; hc[i] = c }
  const pop = () => {
    const w0 = hw[0], c0 = hc[0], lw = hw.pop(), lc = hc.pop(), n = hw.length
    if (n) { let i = 0; for (;;) { const l = 2 * i + 1; if (l >= n) break; const r = l + 1, m = r < n && hw[r] > hw[l] ? r : l; if (hw[m] <= lw) break; hw[i] = hw[m]; hc[i] = hc[m]; i = m } hw[i] = lw; hc[i] = lc }
    return [w0, c0]
  }
  const inZone = (o, x, z) => { const dx = x - o.x, dz = z - o.z, cs = Math.cos(o.rot), sn = Math.sin(o.rot), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; return Math.abs(lx) <= o.w / 2 && Math.abs(lz) <= o.d / 2 }
  const d2 = Float32Array.from(dist)
  // the zones are marked from the zones outwards: only the cells under each zone are looked at
  const mark = (zones, fn) => {
    for (const o of zones) {
      const r = Math.hypot(o.w, o.d) / 2, cs = Math.cos(o.rot), sn = Math.sin(o.rot)
      const i0 = Math.max(0, Math.floor((o.x - r - ox) / step)), i1 = Math.min(nx - 1, Math.ceil((o.x + r - ox) / step)), j0 = Math.max(0, Math.floor((o.z - r - oz) / step)), j1 = Math.min(nz - 1, Math.ceil((o.z + r - oz) / step))
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const c = j * nx + i; if (!dist[c]) continue
        const dx = ox + (i + 0.5) * step - o.x, dz = oz + (j + 0.5) * step - o.z, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs
        if (Math.abs(lx) <= o.w / 2 && Math.abs(lz) <= o.d / 2) fn(c)
      }
    }
  }
  mark(exempt, (c) => { d2[c] = 1e9 })
  mark(sources, (c) => { if (best[c] < 1e9) { best[c] = 1e9; push(c, 1e9) } })
  while (hw.length) {
    const [w, c] = pop(); if (w < best[c]) continue
    const i = c % nx, j = (c / nx) | 0
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue
      const n = jj * nx + ii; if (!dist[n]) continue
      const nw = Math.min(w, d2[n]); if (nw > best[n]) { best[n] = nw; push(n, nw) }
    }
  }
  const widthAt = (c) => (best[c] >= 1e8 ? 9 : Math.min(9, widthOf(best[c], step)))
  return {
    best,
    // widest route width to the spot nearest a point
    at: (p) => { const c = nearestFree(grid, dist, p); return c < 0 ? 0 : widthAt(c) },
    // widest route width to any free cell of a zone (the zone is reachable if somebody can get into it)
    inZoneMax: (o) => {
      let m = 0; const r = Math.hypot(o.w, o.d) / 2
      const i0 = Math.max(0, Math.floor((o.x - r - ox) / step)), i1 = Math.min(nx - 1, Math.ceil((o.x + r - ox) / step)), j0 = Math.max(0, Math.floor((o.z - r - oz) / step)), j1 = Math.min(nz - 1, Math.ceil((o.z + r - oz) / step))
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const c = j * nx + i; if (dist[c] && inZone(o, ox + (i + 0.5) * step, oz + (j + 0.5) * step)) m = Math.max(m, widthAt(c)) }
      return m
    },
  }
}

// the free cell nearest to a point (searching a few centimetres around it)
export function nearestFree({ nx, nz, ox, oz, step }, dist, [x, z], radius = 0.35) {
  const ci = Math.floor((x - ox) / step), cj = Math.floor((z - oz) / step), R = Math.ceil(radius / step)
  let bestC = -1, bd = Infinity
  for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
    const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= nx || j >= nz) continue
    const c = j * nx + i; if (!dist[c]) continue
    const d = di * di + dj * dj; if (d < bd) { bd = d; bestC = c }
  }
  return bestC
}
void overlaps; void obb
