// Furniture drawn the way it appears on an architect's floor plan: top-view symbols in thin lines (cushions on a sofa, pillows on a bed,
// hob rings on a kitchen run, an X on a wardrobe). Used for the "original 2D plan" card of the showcase; the numbers are the real sizes of the pieces.
const f2 = (v) => +v.toFixed(3)
const OUT = '#222', THIN = '#666'
const attrs = (o) => Object.entries(o).map(([k, v]) => ` ${k.replace(/_/g, '-')}="${v}"`).join('')
const rect = (x, y, w, h, rx = 0, o = {}) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" rx="${rx}"${attrs(o)}/>`
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" stroke="${THIN}" stroke-width=".009"${attrs(o)}/>`
const circ = (cx, cy, r, o = {}) => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}"${attrs(o)}/>`
const ell = (cx, cy, rx, ry, o = {}) => `<ellipse cx="${f2(cx)}" cy="${f2(cy)}" rx="${f2(rx)}" ry="${f2(ry)}"${attrs(o)}/>`
const thin = { stroke: THIN, stroke_width: '.009' }
const dark = { fill: OUT, stroke: 'none' }
const strong = { fill: '#fff', stroke: OUT, stroke_width: '.012' }

const cabinet = (w, d, cross) => {
  const n = Math.max(1, Math.round(w / 0.5)), cw = w / n, o = [rect(-w / 2, -d / 2, w, d, 0.01)]
  for (let i = 0; i < n; i++) { const x = -w / 2 + i * cw; if (i) o.push(line(x, -d / 2, x, d / 2)); if (cross) o.push(line(x, -d / 2, x + cw, d / 2), line(x + cw, -d / 2, x, d / 2)) }
  return o
}
const plant = (r) => [circ(0, 0, r, strong), ...[0, 1, 2, 3, 4].map((k) => { const a = (k * 2 * Math.PI) / 5, x = Math.cos(a) * r * 0.45, y = Math.sin(a) * r * 0.45; return ell(x, y, r * 0.4, r * 0.18, { ...thin, transform: `rotate(${f2((a * 180) / Math.PI)} ${f2(x)} ${f2(y)})` }) }), circ(0, 0, r * 0.1, thin)]

// local frame of a piece: x across, y from the back (-y) to the front (+y), origin in the middle
const SYMBOLS = {
  sofa: (w, d) => {
    const a = 0.16, back = 0.2, n = Math.max(1, Math.round((w - 2 * a) / 0.78)), sw = (w - 2 * a) / n
    const o = [rect(-w / 2, -d / 2, w, d, 0.05), rect(-w / 2, -d / 2, w, back, 0.04, thin), rect(-w / 2, -d / 2, a, d, 0.04, thin), rect(w / 2 - a, -d / 2, a, d, 0.04, thin)]
    for (let i = 0; i < n; i++) o.push(rect(-w / 2 + a + i * sw + 0.015, -d / 2 + back + 0.01, sw - 0.03, d - back - 0.04, 0.05, thin))
    return o
  },
  armchair: (w, d) => SYMBOLS.sofa(w, d),
  coffee_table: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.03), rect(-w / 2 + 0.04, -d / 2 + 0.04, w - 0.08, d - 0.08, 0.02, thin)],
  side_table: (w, d) => [circ(0, 0, Math.min(w, d) / 2), circ(0, 0, Math.min(w, d) / 2 - 0.04, thin)],
  bistro_table: (w, d) => SYMBOLS.side_table(w, d),
  dining_table: (w, d) => (Math.abs(w - d) < 0.06 && w < 1.15 ? [circ(0, 0, w / 2), circ(0, 0, w / 2 - 0.05, thin)] : [rect(-w / 2, -d / 2, w, d, 0.03), rect(-w / 2 + 0.05, -d / 2 + 0.05, w - 0.1, d - 0.1, 0.02, thin)]),
  chair: (w, d) => [rect(-w / 2, -d / 2 + 0.07, w, d - 0.07, 0.05), rect(-w / 2 + 0.02, -d / 2, w - 0.04, 0.07, 0.025, dark)],
  bed: (w, d) => {
    const n = w > 1.3 ? 2 : 1, pw = Math.min(0.62, (w - 0.12) / n - 0.06)
    const o = [rect(-w / 2, -d / 2, w, d, 0.03), rect(-w / 2 + 0.03, -d / 2 + 0.03, w - 0.06, d - 0.06, 0.02, thin)]
    for (let i = 0; i < n; i++) { const cx = n === 1 ? 0 : (i === 0 ? -1 : 1) * (w / 4); o.push(rect(cx - pw / 2, -d / 2 + 0.09, pw, 0.36, 0.07, thin)) }
    o.push(rect(-w / 2 + 0.03, -d / 2 + 0.58, w - 0.06, d - 0.61, 0.02, thin))
    return o
  },
  nightstand: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), circ(0, 0, Math.min(w, d) * 0.22, thin)],
  wardrobe: (w, d) => {
    const n = Math.max(1, Math.round(w / 0.5)), cw = w / n, o = [rect(-w / 2, -d / 2, w, d, 0.01)]
    for (let i = 0; i < n; i++) { const x = -w / 2 + i * cw; if (i) o.push(line(x, -d / 2, x, d / 2)); o.push(line(x, -d / 2, x + cw, d / 2), line(x + cw, -d / 2, x, d / 2)) }
    return o
  },
  desk: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.015), rect(-0.27, -d / 2 + 0.05, 0.54, 0.035, 0.01, dark), rect(-0.2, -d / 2 + 0.16, 0.4, 0.13, 0.02, thin)],
  tv_unit: (w, d) => { const tw = Math.min(w * 0.6, 1.3); return [rect(-w / 2, -d / 2, w, d, 0.01), line(-w / 2, 0, w / 2, 0), rect(-tw / 2, -d / 2 + 0.06, tw, 0.04, 0.01, dark)] },
  sideboard: (w, d) => cabinet(w, d, false),
  shoe_cabinet: (w, d) => cabinet(w, d, false),
  shelf: (w, d) => cabinet(w, d, true),
  counter: (w, d, it) => {
    const n = Math.max(1, Math.round(w / 0.6)), o = [rect(-w / 2, -d / 2, w, d, 0.01), line(-w / 2, d / 2 - 0.04, w / 2, d / 2 - 0.04)]
    for (let i = 1; i < n; i++) o.push(line(-w / 2 + (w / n) * i, -d / 2, -w / 2 + (w / n) * i, d / 2))
    for (const f of it.features || []) {
      const x = -w / 2 + f.at
      if (f.kind === 'sink') o.push(rect(x - 0.25, -0.2, 0.5, 0.4, 0.04, strong), rect(x - 0.21, -0.16, 0.42, 0.32, 0.03, thin), circ(x, 0, 0.025, thin))
      if (f.kind === 'hob') { o.push(rect(x - 0.29, -0.25, 0.58, 0.5, 0.03, strong)); for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) o.push(circ(x + dx * 0.135, dy * 0.12, 0.085, thin), circ(x + dx * 0.135, dy * 0.12, 0.04, thin)) }
    }
    return o
  },
  kitchen_island: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), rect(-w / 2 + 0.05, -d / 2 + 0.05, w - 0.1, d - 0.1, 0.02, thin)],
  fridge: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), line(-w / 2, -d / 2 + d * 0.2, w / 2, d / 2 - d * 0.2), line(-w / 2, d / 2 - d * 0.2, w / 2, -d / 2 + d * 0.2)],
  shower: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), line(-w / 2, -d / 2, w / 2, d / 2), circ(0, 0, 0.04, thin), circ(-w / 2 + 0.1, -d / 2 + 0.1, 0.05, thin)],
  bathtub: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.1), rect(-w / 2 + 0.06, -d / 2 + 0.06, w - 0.12, d - 0.12, Math.min(0.2, d / 2 - 0.07), thin), circ(-w / 2 + 0.2, 0, 0.03, thin)],
  toilet: (w, d) => { const ry = (d - 0.2) / 2; return [rect(-w / 2 + 0.03, -d / 2, w - 0.06, 0.2, 0.03), ell(0, -d / 2 + 0.2 + ry, w / 2 - 0.02, ry), ell(0, -d / 2 + 0.2 + ry, w / 2 - 0.07, Math.max(0.02, ry - 0.05), thin)] },
  vanity: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), ell(0, 0.02, Math.min(w * 0.3, 0.22), Math.min(d * 0.32, 0.17), thin), circ(0, -d / 2 + 0.06, 0.02, thin)],
  washer: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02), circ(0, 0.02, Math.min(w, d) * 0.34, thin), circ(0, 0.02, Math.min(w, d) * 0.22, thin)],
  plant: (w, d) => plant(Math.min(w, d) / 2),
  planter: (w, d) => plant(Math.min(w, d) / 2),
  floor_lamp: (w, d) => [circ(0, 0, Math.min(w, d) / 2), circ(0, 0, Math.min(w, d) / 4, thin)],
  rug: (w, d) => [rect(-w / 2, -d / 2, w, d, 0.02, { fill: 'none', stroke: '#aaa', stroke_width: '.009', stroke_dasharray: '.05 .04' })],
}

// the SVG group of the pieces (plan coordinates in metres, as in layout/plansvg.js); a piece without a symbol is drawn as a plain outline
export function furnitureSymbols(items) {
  const out = [], sorted = [...items].sort((p, q) => (q.type === 'rug' ? 1 : 0) - (p.type === 'rug' ? 1 : 0))
  for (const it of sorted) {
    const make = SYMBOLS[it.type] || ((w, d) => [rect(-w / 2, -d / 2, w, d, 0.02)])
    out.push(`<g transform="translate(${f2(it.x)} ${f2(it.z)}) rotate(${f2((-it.rot * 180) / Math.PI)})">${make(it.w, it.d, it).join('')}</g>`)
  }
  return `<g fill="#fff" stroke="${OUT}" stroke-width=".016" stroke-linejoin="round" stroke-linecap="round">${out.join('')}</g>`
}
