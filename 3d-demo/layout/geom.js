// 2D geometry for the layout engine. Plan coordinates are metres (x, z). A piece has its centre (x, z), size w (local x) by d (local z)
// and yaw rot; its FRONT faces (sin rot, cos rot), its local +x points along (cos rot, -sin rot). rot = 0 faces +z.
export const front = (rot) => [Math.sin(rot), Math.cos(rot)]
export const side = (rot) => [Math.cos(rot), -Math.sin(rot)]
export const rotOf = (nx, nz) => Math.atan2(nx, nz)           // the yaw whose front is (nx, nz)
export const norm = (rot) => { const t = Math.PI * 2; return ((rot % t) + t) % t }

// oriented rectangle with its four corners
export function obb(x, z, w, d, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot), hw = w / 2, hd = d / 2
  const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c])
  return { x, z, w, d, rot, pts }
}
export const aabb = (x0, z0, x1, z1) => obb((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0)
export const edgesOf = (pts) => pts.map((p, i) => [p, pts[(i + 1) % pts.length]])

// the band next to one side of a rectangle: depth away from the body, `extend` more on both ends along the side
export function zone(o, sideName, depth, extend = 0) {
  const f = front(o.rot), r = side(o.rot)
  if (sideName === 'front') return obb(o.x + f[0] * (o.d / 2 + depth / 2), o.z + f[1] * (o.d / 2 + depth / 2), o.w + 2 * extend, depth, o.rot)
  if (sideName === 'back') return obb(o.x - f[0] * (o.d / 2 + depth / 2), o.z - f[1] * (o.d / 2 + depth / 2), o.w + 2 * extend, depth, o.rot)
  if (sideName === 'right') return obb(o.x + r[0] * (o.w / 2 + depth / 2), o.z + r[1] * (o.w / 2 + depth / 2), depth, o.d + 2 * extend, o.rot)
  return obb(o.x - r[0] * (o.w / 2 + depth / 2), o.z - r[1] * (o.w / 2 + depth / 2), depth, o.d + 2 * extend, o.rot)
}

// separating-axis test: do the interiors overlap by more than tol (metres)?
export function overlaps(a, b, tol = 0.002) {
  for (const o of [a, b]) {
    const c = Math.cos(o.rot), s = Math.sin(o.rot)
    for (const [ax, az] of [[c, -s], [s, c]]) {
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
      for (const [px, pz] of a.pts) { const v = px * ax + pz * az; if (v < a0) a0 = v; if (v > a1) a1 = v }
      for (const [px, pz] of b.pts) { const v = px * ax + pz * az; if (v < b0) b0 = v; if (v > b1) b1 = v }
      if (Math.min(a1, b1) - Math.max(a0, b0) <= tol) return false
    }
  }
  return true
}

export function pip(x, z, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}
const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
export function properCross(p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1), d2 = orient(p3, p4, p2), d3 = orient(p1, p2, p3), d4 = orient(p1, p2, p4)
  return d1 * d2 < -1e-12 && d3 * d4 < -1e-12
}
export function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz
  const t = L2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / L2)) : 0
  return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz))
}
const segSegDist = (a, b, c, d) => (properCross(a, b, c, d) ? 0 : Math.min(segDist(a[0], a[1], c, d), segDist(b[0], b[1], c, d), segDist(c[0], c[1], a, b), segDist(d[0], d[1], a, b)))

// smallest distance between two rectangles (0 when they overlap or touch)
export function gap(a, b) {
  if (overlaps(a, b, -1e-9)) return 0
  let best = Infinity
  for (const [p, q] of edgesOf(a.pts)) for (const [r, s] of edgesOf(b.pts)) best = Math.min(best, segSegDist(p, q, r, s))
  return best
}

// is the rectangle (shrunk by tol so it may touch a wall) completely inside the polygon?
export function rectInPoly(o, poly, tol = 0.004) {
  const s = obb(o.x, o.z, o.w - 2 * tol, o.d - 2 * tol, o.rot)
  for (const [x, z] of s.pts) if (!pip(x, z, poly)) return false
  for (const [p, q] of edgesOf(s.pts)) for (let i = 0; i < poly.length; i++) if (properCross(p, q, poly[i], poly[(i + 1) % poly.length])) return false
  const c = Math.cos(s.rot), sn = Math.sin(s.rot)
  for (const [x, z] of poly) {                                   // a polygon corner poking into the rectangle (concave rooms)
    const dx = x - s.x, dz = z - s.z, lx = dx * c - dz * sn, lz = dx * sn + dz * c
    if (Math.abs(lx) < s.w / 2 - 1e-6 && Math.abs(lz) < s.d / 2 - 1e-6) return false
  }
  return true
}

// first hit of a ray (origin o, unit direction dir) with a list of segments; Infinity when nothing is hit
export function ray(ox, oz, dx, dz, segs, maxT = 50) {
  let best = maxT
  for (const [[ax, az], [bx, bz]] of segs) {
    const ex = bx - ax, ez = bz - az, den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-12) continue
    const t = ((ax - ox) * ez - (az - oz) * ex) / den, u = ((ax - ox) * dz - (az - oz) * dx) / den
    if (t > 1e-7 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t
  }
  return best
}
export const polyArea = (poly) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0)) / 2
export const bboxOf = (poly) => { const xs = poly.map((q) => q[0]), zs = poly.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs); return { x0, z0, x1, z1, w: x1 - x0, d: z1 - z0 } }
