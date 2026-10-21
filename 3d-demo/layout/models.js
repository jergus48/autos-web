// Models of real products, made by hand from the pictures of the product page at the real size (Claude Code looks at the pictures and writes the parts; no AI service is called).
// A model: { key, name, link, dims: { w, d, h } (metres), parts: [...] }, in the same frame as the catalogue pieces: x = width, z = depth with the FRONT at +z, y = up,
// origin at the centre of the footprint on the floor. A part: { shape: 'box' | 'rbox' | 'cyl', x, z, y (bottom), w, d, h, color: '#rrggbb', r (rounding of an rbox),
// rx, ry, rz (turn in radians around the part's centre), rough, metal, opacity (0.1 to 1, glass), texture: { kind: 'plaid' | 'weave' | 'grain', base, bands, thin, dark, light, size } for fabric and wood grain }. A cylinder is w across (d is the same), h high.
export const MODELS = new Map()          // key -> model, filled by the app from app/data/models

export const registerModel = (m) => { MODELS.set(m.key, m); return m }

// the key a product link goes by: IKEA pages of every country share the article number, any other page is its host and path
export function modelKeyOf(link) {
  let u; try { u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(String(link).trim()) ? String(link).trim() : 'https://' + String(link).trim()) } catch { return '' }
  const host = u.hostname.replace(/^www\./, '').toLowerCase(), path = u.pathname.replace(/\/+$/, '').toLowerCase()
  const ikea = /(^|\.)ikea\.[a-z.]+$/.test(host) && /-(s?\d{6,9})$/.exec(path)
  return ikea ? 'ikea:' + ikea[1] : host + path
}

// the parts of a model for a piece of the size it was given (a person may have changed the sizes: the parts are stretched with them)
export function modelParts(m, item) {
  const sx = item.w / m.dims.w, sz = item.d / m.dims.d, sy = item.h / m.dims.h, sr = Math.min(sx, sy, sz)
  const same = Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6 && Math.abs(sz - 1) < 1e-6
  return same ? m.parts : m.parts.map((p) => ({ ...p, x: p.x * sx, z: p.z * sz, y: p.y * sy, w: p.w * sx, d: p.d * sz, h: p.h * sy, ...(p.r ? { r: p.r * sr } : {}) }))
}

// is this a model the app can draw? Returns the problems (an empty list when it is fine)
export function modelProblems(m) {
  const out = [], num = (v) => Number.isFinite(v)
  if (!m || typeof m !== 'object') return ['not a model']
  if (!m.key || typeof m.key !== 'string') out.push('no key')
  if (!m.dims || !['w', 'd', 'h'].every((k) => num(m.dims[k]) && m.dims[k] > 0.05 && m.dims[k] < 6)) out.push('dims must be w, d, h in metres')
  if (!Array.isArray(m.parts) || !m.parts.length) return [...out, 'no parts']
  if (m.parts.length > 600) out.push('more than 600 parts')
  m.parts.forEach((p, i) => {
    if (!['box', 'rbox', 'cyl'].includes(p.shape)) out.push(`part ${i}: shape ${p.shape}`)
    for (const k of ['x', 'z', 'y', 'w', 'd', 'h']) if (!num(p[k])) out.push(`part ${i}: ${k} is not a number`)
    if (!/^#[0-9a-f]{6}$/i.test(p.color || '')) out.push(`part ${i}: color ${p.color}`)
    if (p.texture && !['plaid', 'weave', 'grain'].includes(p.texture.kind)) out.push(`part ${i}: texture ${p.texture.kind}`)
    if (num(p.w) && num(p.d) && num(p.h) && (p.w <= 0 || p.d <= 0 || p.h <= 0)) out.push(`part ${i}: no size`)
  })
  if (out.length) return out
  // the model stays inside the box of its size (a turned part is measured by its turned corners; 3 cm of air for rounding and feet)
  const lim = { x: m.dims.w / 2 + 0.03, z: m.dims.d / 2 + 0.03, y: m.dims.h + 0.03 }
  m.parts.forEach((p, i) => {
    const cx = p.x, cz = p.z, cy = p.y + p.h / 2, hs = [p.w / 2, p.h / 2, p.d / 2], rx = p.rx || 0, ry = p.ry || 0, rz = p.rz || 0
    let maxX = 0, maxY = 0, maxZ = 0, minY = Infinity
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      let [x, y, z] = [sx * hs[0], sy * hs[1], sz * hs[2]]
      let t = y * Math.cos(rx) - z * Math.sin(rx); z = y * Math.sin(rx) + z * Math.cos(rx); y = t          // three.js turns x, then y, then z
      t = x * Math.cos(ry) + z * Math.sin(ry); z = -x * Math.sin(ry) + z * Math.cos(ry); x = t
      t = x * Math.cos(rz) - y * Math.sin(rz); y = x * Math.sin(rz) + y * Math.cos(rz); x = t
      maxX = Math.max(maxX, Math.abs(x)); maxZ = Math.max(maxZ, Math.abs(z)); maxY = Math.max(maxY, y); minY = Math.min(minY, y)
    }
    if (Math.abs(cx) + maxX > lim.x) out.push(`part ${i} sticks out sideways`)
    if (Math.abs(cz) + maxZ > lim.z) out.push(`part ${i} sticks out in depth`)
    if (cy + maxY > lim.y) out.push(`part ${i} is taller than the piece`)
    if (cy + minY < -0.03) out.push(`part ${i} is below the floor`)
  })
  return out
}

// the box a part takes up in the model's frame (a turned part by its turned corners), and the box of a list of parts
export function partBox(p) {
  const hs = [p.w / 2, p.h / 2, p.d / 2], rx = p.rx || 0, ry = p.ry || 0, rz = p.rz || 0
  let ex = 0, ey = 0, ez = 0
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    let [x, y, z] = [sx * hs[0], sy * hs[1], sz * hs[2]]
    let t = y * Math.cos(rx) - z * Math.sin(rx); z = y * Math.sin(rx) + z * Math.cos(rx); y = t
    t = x * Math.cos(ry) + z * Math.sin(ry); z = -x * Math.sin(ry) + z * Math.cos(ry); x = t
    t = x * Math.cos(rz) - y * Math.sin(rz); y = x * Math.sin(rz) + y * Math.cos(rz); x = t
    ex = Math.max(ex, Math.abs(x)); ey = Math.max(ey, Math.abs(y)); ez = Math.max(ez, Math.abs(z))
  }
  const cy = p.y + p.h / 2
  return { minX: p.x - ex, maxX: p.x + ex, minY: cy - ey, maxY: cy + ey, minZ: p.z - ez, maxZ: p.z + ez }
}
export function modelBounds(parts) {
  const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity }
  for (const p of parts) { const q = partBox(p); b.minX = Math.min(b.minX, q.minX); b.maxX = Math.max(b.maxX, q.maxX); b.minY = Math.min(b.minY, q.minY); b.maxY = Math.max(b.maxY, q.maxY); b.minZ = Math.min(b.minZ, q.minZ); b.maxZ = Math.max(b.maxZ, q.maxZ) }
  return b
}
