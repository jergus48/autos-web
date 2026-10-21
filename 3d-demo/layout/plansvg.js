// The floor plan drawing of a layout, in metres, in the clean style of a design proposal: a dark floor for the room you are looking at, the
// neighbouring rooms dimmed and named, light walls, door swings, muted furniture at true size, overall dimensions in thin blue lines.
// Clear space is drawn only for the selected piece (or for all pieces when asked). Returns a standalone SVG string.
import { obb, zone } from './geom.js'
import { labelOf } from './catalog.js'
// what a piece is called on the plan: a piece from a shop link by its name on the shop's page (short), every other piece by its type
const planLabel = (it) => { const n = it.product?.name; return n ? (n.length > 16 ? n.slice(0, 15).trimEnd() + '…' : n) : labelOf(it.type) }
import { splitsOf } from './windows.js'
import { isOutdoor } from './space.js'
import { isSliding, isDouble } from './planedit.js'

// muted piece colours that read on a dark floor
export const FILL = { sofa: '#646b70', armchair: '#737a7f', coffee_table: '#8f7048', tv_unit: '#0f1113', shelf: '#6e5d49', sideboard: '#7d6548', bed: '#a3a9ae', nightstand: '#8f7048', wardrobe: '#50565b', desk: '#8f7048', chair: '#1e2124',
  dining_table: '#9c7448', counter: '#b58a5c', fridge: '#cfd4d8', bathtub: '#e8eaec', shower: '#8fb4c9', toilet: '#e8eaec', vanity: '#aaa59b', washer: '#d6d9db', shoe_cabinet: '#7d6548', plant: '#527f4d', floor_lamp: '#d8c9a0', rug: '#3c3835', bistro_table: '#7e858a', lounger: '#8f8b81', side_table: '#8f7048', product: '#c98a5a', outdoor_sofa: '#7f8a82', outdoor_table: '#a07a4c', planter: '#527f4d', grill: '#3a3d42', deck_box: '#8f7048' }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const cm = (m) => Math.round(m * 100)
const f2 = (v) => +v.toFixed(3)
const THEMES = {
  dark: { bg: '#13191b', deck: '#33302a', floor: '#2b2724', dim: '#1d2427', wall: '#e7e5e0', ink: '#e3e9e6', soft: '#8b979b', blue: '#7db4cf', line: '#f2f4f3', zone: '#7db4cf', label: '#ffffff' },
  light: { bg: '#ffffff', deck: '#e4dccb', floor: '#f2eee6', dim: '#e9e6df', wall: '#2a2b30', ink: '#17171c', soft: '#6b7478', blue: '#2563eb', line: '#17171c', zone: '#7fb02e', label: '#17171c' },
}
const WALL_FIRST = { dark: false, light: true }

export function planSvg(plan, items, { space = null, zones = 'selected', dims = true, labels = true, selected = null, selectedWin = null, selectedDoor = null, measure = null, drawing = null, reshape = null, status = {}, focus = null, view = null, theme = 'dark', around = [], title = '', fit = true, fill = false, aspect = null, scale = 70, bg = true } = {}) {
  const T = THEMES[theme] || THEMES.dark
  const m = focus === null ? 0.95 : 0.85, W = plan.bounds.width, D = plan.bounds.depth
  const room0 = focus !== null && plan.rooms[focus] ? plan.rooms[focus] : null
  let v = view || { x0: 0, z0: 0, x1: W, z1: D }
  if (!view && room0) { const xs = room0.polygon.map((p) => p[0]), zs = room0.polygon.map((p) => p[1]); v = { x0: Math.min(...xs) - 0.4, z0: Math.min(...zs) - 0.4, x1: Math.max(...xs) + 0.4, z1: Math.max(...zs) + 0.4 } }
  let vx = v.x0 - m, vz = v.z0 - m - (title ? 0.3 : 0), vw = v.x1 - v.x0 + 2 * m, vh = v.z1 - v.z0 + 2 * m + (title ? 0.3 : 0)
  const naturalAspect = vw / vh
  if (fill && aspect > 0) { if (aspect > naturalAspect) { const nw = vh * aspect; vx -= (nw - vw) / 2; vw = nw } else { const nh = vw / aspect; vz -= (nh - vh) / 2; vh = nh } }          // the box is wider (or taller) than the view: show more of the plan around it, at the same scale
  const poly = (pts) => pts.map(([x, z]) => `${f2(x)},${f2(z)}`).join(' ')
  const inFocus = (i) => focus === null || i === focus
  const o = []
  const sizeAttr = fill ? `data-na="${naturalAspect.toFixed(4)}" style="position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none"` : fit ? 'style="width:100%;height:auto;display:block;touch-action:none;user-select:none"' : `width="${Math.round(vw * scale)}" height="${Math.round(vh * scale)}"`
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" ${sizeAttr} viewBox="${f2(vx)} ${f2(vz)} ${f2(vw)} ${f2(vh)}" font-family="IBM Plex Sans, Segoe UI, Arial, sans-serif">`)
  o.push(`<style>.fl{fill:${T.floor}}.fo{fill:${T.deck}}.rl{fill:${T.blue};fill-opacity:.55;stroke:${T.blue};stroke-width:.01}.fd{fill:${T.dim}}.wl{fill:${T.wall};stroke:${T.wall};stroke-width:.008}.wn{cursor:pointer}.wh{stroke:transparent;stroke-width:.45;fill:none;pointer-events:stroke}.win{stroke:${T.blue};stroke-width:.07;fill:none;opacity:.9}.wn.sel .win{stroke-width:.13;opacity:1}.wt{stroke:${T.blue};stroke-width:1.4;vector-effect:non-scaling-stroke}.wn.sel .wt{stroke:#fff}.dn{cursor:pointer}.dh{stroke:transparent;stroke-width:.45;fill:none;pointer-events:stroke}.dn.sel .dr{stroke:${T.blue};stroke-width:2.6;opacity:1}.dn.sel .dra{stroke:${T.blue};opacity:1}.dop{stroke:${T.line};stroke-width:1.2;stroke-dasharray:3 3;opacity:.55;fill:none;vector-effect:non-scaling-stroke}.dn.sel .dop{stroke:${T.blue};opacity:1;stroke-dasharray:none;stroke-width:2.6}.lk{pointer-events:none}.ms{stroke:#f0c36a;stroke-width:1.8;fill:none;vector-effect:non-scaling-stroke}.dr{stroke:#c6f24e;stroke-width:2;fill:none;stroke-dasharray:6 4;vector-effect:non-scaling-stroke}.drf{fill:#c6f24e;fill-opacity:.14;stroke:none}.rs{fill:#c6f24e;fill-opacity:.1;stroke:#c6f24e;stroke-width:2;stroke-dasharray:6 4;vector-effect:non-scaling-stroke}.rn{fill-opacity:.06;stroke-opacity:.6}.rh-w{stroke:#c6f24e;stroke-opacity:0;stroke-width:12;stroke-linecap:round;vector-effect:non-scaling-stroke;cursor:move}.rh-w.hov{stroke-opacity:.4}.rh-m{stroke:#c6f24e;stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke;pointer-events:none}.rh-c{fill:#fff;stroke:#c6f24e;stroke-width:2;vector-effect:non-scaling-stroke;cursor:move}.rh-c.hov{fill:#c6f24e}.rg{stroke:#ff7ad9;stroke-width:1.6;stroke-dasharray:7 5;vector-effect:non-scaling-stroke;pointer-events:none}.rg-t{font-family:IBM Plex Mono,Consolas,monospace;font-size:.13px;font-weight:700;fill:#ff7ad9;paint-order:stroke;stroke:${T.bg};stroke-width:.04px;text-anchor:middle}.drt{font-family:IBM Plex Mono,Consolas,monospace;font-size:.14px;font-weight:600;fill:#c6f24e;text-anchor:middle;paint-order:stroke;stroke:${T.bg};stroke-width:.04px}.mt{font-family:IBM Plex Mono,Consolas,monospace;font-size:.15px;font-weight:600;fill:#f0c36a;text-anchor:middle;paint-order:stroke;stroke:${T.bg};stroke-width:.06px;pointer-events:none}.dr{stroke:${T.line};stroke-width:1.1;fill:none;vector-effect:non-scaling-stroke;opacity:.8}.dra{stroke:${T.line};stroke-width:1;stroke-dasharray:3 3;fill:none;vector-effect:non-scaling-stroke;opacity:.55}.zn{fill:${T.zone};fill-opacity:.16;stroke:${T.zone};stroke-opacity:.75;stroke-width:1;stroke-dasharray:3 3;vector-effect:non-scaling-stroke}.pc rect,.pc circle{stroke:rgba(255,255,255,.55);stroke-width:1;vector-effect:non-scaling-stroke}.pc.bad rect,.pc.bad circle{stroke:#ef7f6a;stroke-width:2.6}.pc.warn rect,.pc.warn circle{stroke:#e5b25d;stroke-width:2.2}.pc.sel rect,.pc.sel circle{stroke:${T.blue};stroke-width:2.8}.pc{cursor:grab}.pc.drag{cursor:grabbing}.lbl{font-size:.115px;fill:${T.label};pointer-events:none;letter-spacing:.004px}.rn{font-size:.16px;font-weight:600;fill:${T.soft};pointer-events:none;letter-spacing:.012px}.rn.f{fill:${T.ink};opacity:.55}.dm{stroke:${T.blue};stroke-width:1.2;fill:none;vector-effect:non-scaling-stroke}.dt{font-family:IBM Plex Mono, Consolas, monospace;font-size:.13px;font-weight:500;fill:${T.blue};text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:${T.bg};stroke-width:.05px}.dt.k{fill:${T.ink}}.fm{stroke:#fff;stroke-width:1.4;stroke-opacity:.45;vector-effect:non-scaling-stroke;pointer-events:none}</style>`)
  if (bg) o.push(`<rect x="${f2(vx)}" y="${f2(vz)}" width="${f2(vw)}" height="${f2(vh)}" fill="${T.bg}" data-bg="1"/>`)
  if (title) o.push(`<text x="${f2(v.x0)}" y="${f2(vz + 0.25)}" font-size=".22" font-weight="600" fill="${T.ink}">${esc(title)}</text>`)
  plan.rooms.forEach((r, i) => o.push(`<polygon class="${inFocus(i) ? (isOutdoor(r) ? 'fo' : 'fl') : 'fd'}" points="${poly(r.polygon)}"/>`))
  for (const b of plan.wallBoxes || []) if (b.y0 < 0.05 && !b.diag) o.push(b.slant ? `<path class="wl" fill-rule="evenodd" d="${[b.slant, ...(b.holes || [])].map((l) => 'M' + l.map((q) => f2(q[0]) + ',' + f2(q[1])).join('L') + 'Z').join('')}"/>` : `<rect class="${b.cls === 'rail' ? 'rl' : 'wl'}" x="${f2(b.x0)}" y="${f2(b.z0)}" width="${f2(b.x1 - b.x0)}" height="${f2(b.z1 - b.z0)}"/>`)
  // windows, doors with their swing
  const seen = new Set()
  for (const op of plan.openings) {
    const w = plan.walls.find((q) => q.id === op.wall); if (!w) continue
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, cx = w.a[0] + ux * op.offset, cz = w.a[1] + uz * op.offset, hw = op.width / 2
    const a = [cx - ux * hw, cz - uz * hw], b = [cx + ux * hw, cz + uz * hw]
    if (op.kind === 'window') {      // the glass line, the bars that divide it into panes, and a wide invisible target to click
      const bars = splitsOf(op), n = bars.length + 1, sel = selectedWin === op.id, nx = -uz, nz = ux
      let g = `<g class="wn${sel ? ' sel' : ''}" data-wid="${esc(op.id)}"><line class="wh" x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}"/><line class="win" x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}"/>`
      for (const f of bars) { const px = a[0] + (b[0] - a[0]) * f, pz = a[1] + (b[1] - a[1]) * f; g += `<line class="wt" x1="${f2(px - nx * 0.11)}" y1="${f2(pz - nz * 0.11)}" x2="${f2(px + nx * 0.11)}" y2="${f2(pz + nz * 0.11)}"/>` }
      o.push(g + '</g>')
      if (sel) o.push(`<text class="dt k" x="${f2(cx + nx * 0.5)}" y="${f2(cz + nz * 0.5)}">${cm(op.width)} × ${cm(op.height)} · sill ${cm(op.sill)} · ${n} pane${n > 1 ? 's' : ''}</text>`)
      continue
    }
    const dsel = selectedDoor === op.id, seg = `x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}"`
    let g = `<g class="dn${dsel ? ' sel' : ''}" data-did="${esc(op.id)}"><line ${seg} stroke="${T.floor}" stroke-width="${f2(Math.max(w.thickness || 0.12, 0.12))}"/><line class="dh" ${seg}/>`
    if (op.kind === 'opening') g += `<line class="dop" ${seg}/>`
    if (isSliding(op)) {          // a sliding door: two thin leaves side by side in the wall, no swing
      const nx2 = -uz * 0.05, nz2 = ux * 0.05
      g += `<line class="dr" x1="${f2(a[0] + nx2)}" y1="${f2(a[1] + nz2)}" x2="${f2(cx + nx2)}" y2="${f2(cz + nz2)}"/><line class="dr" x1="${f2(cx - nx2)}" y1="${f2(cz - nz2)}" x2="${f2(b[0] - nx2)}" y2="${f2(b[1] - nz2)}"/>`
    } else if (op.kind === 'door' && space) {
      const rms = space.rooms.filter((r) => r.doors.some((d) => d.id === op.id)).sort((p, q) => (p.outdoor ? 1 : 0) - (q.outdoor ? 1 : 0)); let n = null
      if (op.into === '__out') { const d0 = rms[0]?.doors.find((q) => q.id === op.id); if (d0) n = [-d0.n[0], -d0.n[1]] }
      else { const room = (op.into && rms.find((r) => plan.rooms[r.i].id === op.into)) || rms[0], d = room?.doors.find((q) => q.id === op.id); if (d) n = d.n }
      if (n) {
        const cr = ux * n[1] - uz * n[0], fa = cr > 0 ? 0 : 1          // sweep of the arc from the open leaf back to the closed position (the other way round for a hinge at the end)
        const leaves = isDouble(op) ? [{ h: a, far: [cx, cz], end: false, len: op.width / 2 }, { h: b, far: [cx, cz], end: true, len: op.width / 2 }] : [{ h: op.hinge === 'end' ? b : a, far: op.hinge === 'end' ? a : b, end: op.hinge === 'end', len: op.width }]
        for (const { h, far, end, len } of leaves) {
          const tipx = h[0] + n[0] * len, tipz = h[1] + n[1] * len, F = end ? 1 - fa : fa
          g += `<line class="dr" x1="${f2(h[0])}" y1="${f2(h[1])}" x2="${f2(tipx)}" y2="${f2(tipz)}"/><path class="dra" d="M${f2(tipx)} ${f2(tipz)} A${f2(len)} ${f2(len)} 0 0 ${F} ${f2(far[0])} ${f2(far[1])}"/>`
        }
      }
    }
    o.push(g + '</g>')
    if (dsel) o.push(`<text class="dt k" x="${f2(cx + (-uz) * 0.55)}" y="${f2(cz + ux * 0.55)}">${cm(op.width)} × ${cm(op.height)}</text>`)
  }
  const roomOf = (it) => (Number.isInteger(it.room) ? it.room : -1)
  const shown = items.filter((it) => focus === null || roomOf(it) === focus)
  const sorted = [...shown].sort((p, q) => (q.floor ? 1 : 0) - (p.floor ? 1 : 0))
  const zoneFor = (it) => zones === 'all' || (zones === 'selected' && it.id === selected)
  for (const it of sorted) {
    if (it.floor || !zoneFor(it)) continue
    const body = obb(it.x, it.z, it.w, it.d, it.rot)
    for (const s of ['front', 'back', 'left', 'right']) { const dpt = it.clearMin?.[s] || 0; if (dpt > 0) o.push(`<polygon class="zn" points="${poly(zone(body, s, dpt).pts)}"/>`) }
  }
  for (const it of sorted) {
    const cls = ['pc', status[it.id] === 'error' ? 'bad' : status[it.id] === 'warn' ? 'warn' : '', selected === it.id ? 'sel' : ''].filter(Boolean).join(' ')
    const deg = f2(-it.rot * 180 / Math.PI), fill = FILL[it.type] || '#888'
    const round = ['plant', 'floor_lamp', 'side_table', 'bistro_table'].includes(it.type)
    o.push(`<g class="${cls}" data-id="${esc(it.id)}" transform="translate(${f2(it.x)} ${f2(it.z)}) rotate(${deg})" opacity="${it.floor ? 0.8 : 1}">${round ? `<circle r="${f2(Math.min(it.w, it.d) / 2)}" fill="${fill}"/>` : `<rect x="${f2(-it.w / 2)}" y="${f2(-it.d / 2)}" width="${f2(it.w)}" height="${f2(it.d)}" rx="${it.floor ? 0 : 0.04}" fill="${fill}"/>`}${it.floor ? '' : `<line class="fm" x1="0" y1="${f2(it.d * 0.18)}" x2="0" y2="${f2(it.d * 0.46)}"/>`}</g>`)
  }
  for (const it of sorted) {          // locked pieces carry a small padlock on their back corner
    if (!it.locked) continue
    const lx = it.w / 2 - 0.1, lz = -it.d / 2 + 0.1, wx = it.x + Math.cos(it.rot) * lx + Math.sin(it.rot) * lz, wz = it.z - Math.sin(it.rot) * lx + Math.cos(it.rot) * lz
    o.push(`<g class="lk" transform="translate(${f2(wx)} ${f2(wz)})"><circle r=".12" fill="#13191b" stroke="${T.blue}" stroke-width=".02"/><rect x="-.05" y="-.01" width=".1" height=".07" rx=".012" fill="#fff"/><path d="M-.03 -.01 v-.025 a.03 .03 0 0 1 .06 0 v.025" stroke="#fff" stroke-width=".018" fill="none"/></g>`)
  }
  if (labels) for (const it of sorted) {
    if (it.floor || Math.min(it.w, it.d) < 0.42 || ['plant', 'floor_lamp'].includes(it.type)) continue
    const along = it.w < it.d * 0.8 && Math.abs(Math.cos(it.rot)) > 0.7 ? -90 : 0        // a narrow upright piece reads along its length
    const rotated = Math.abs(Math.sin(it.rot)) > 0.7 ? (it.w >= it.d ? -90 : 0) : along
    o.push(`<text class="lbl" x="${f2(it.x)}" y="${f2(it.z)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotated} ${f2(it.x)} ${f2(it.z)})">${esc(planLabel(it))}</text>`)
  }
  plan.rooms.forEach((r, i) => {
    const xs = r.polygon.map((p) => p[0]), zs = r.polygon.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
    if (x1 < v.x0 || x0 > v.x1 || z1 < v.z0 || z0 > v.z1) return
    const f = inFocus(i) && focus !== null
    o.push(`<text class="rn${f ? ' f' : ''}" x="${f2((x0 + x1) / 2)}" y="${f2(f ? z0 + 0.3 : (z0 + z1) / 2)}" text-anchor="middle">${esc(r.name.toUpperCase())}</text>`)
  })
  if (dims) {      // overall size in thin blue lines
    const tick = (x1, z1, x2, z2) => `<line class="dm" x1="${f2(x1)}" y1="${f2(z1)}" x2="${f2(x2)}" y2="${f2(z2)}"/>`
    const zt = v.z0 - 0.5, xl = v.x0 - 0.5
    o.push(tick(v.x0, zt, v.x1, zt), tick(v.x0, zt - 0.08, v.x0, zt + 0.08), tick(v.x1, zt - 0.08, v.x1, zt + 0.08), `<text class="dt" x="${f2((v.x0 + v.x1) / 2)}" y="${f2(zt - 0.09)}">${cm(v.x1 - v.x0)}</text>`)
    o.push(tick(xl, v.z0, xl, v.z1), tick(xl - 0.08, v.z0, xl + 0.08, v.z0), tick(xl - 0.08, v.z1, xl + 0.08, v.z1), `<text class="dt" transform="translate(${f2(xl - 0.1)} ${f2((v.z0 + v.z1) / 2)}) rotate(-90)">${cm(v.z1 - v.z0)}</text>`)
  }
  const sel = selected && items.find((i) => i.id === selected)
  if (sel) {
    for (const a of around) {
      if (a.value > 8) continue
      o.push(`<line class="dm" x1="${f2(a.a[0])}" y1="${f2(a.a[1])}" x2="${f2(a.b[0])}" y2="${f2(a.b[1])}"/><circle cx="${f2(a.b[0])}" cy="${f2(a.b[1])}" r=".03" fill="${T.blue}"/><text class="dt" x="${f2((a.a[0] + a.b[0]) / 2)}" y="${f2((a.a[1] + a.b[1]) / 2 - 0.06)}">${cm(a.value)}</text>`)
    }
    o.push(`<text class="dt k" x="${f2(sel.x)}" y="${f2(sel.z + Math.max(sel.w, sel.d) / 2 + 0.25)}">${cm(sel.w)} × ${cm(sel.d)}</text>`)
  }
  if (measure?.a) {
    const e = measure.b || measure.cur
    if (e) { const L = Math.hypot(e[0] - measure.a[0], e[1] - measure.a[1]); o.push(`<line class="ms" x1="${f2(measure.a[0])}" y1="${f2(measure.a[1])}" x2="${f2(e[0])}" y2="${f2(e[1])}"/><circle cx="${f2(e[0])}" cy="${f2(e[1])}" r=".05" fill="#f0c36a"/><text class="mt" x="${f2((measure.a[0] + e[0]) / 2)}" y="${f2((measure.a[1] + e[1]) / 2 - 0.1)}">${cm(L)} cm</text>`) }
    o.push(`<circle cx="${f2(measure.a[0])}" cy="${f2(measure.a[1])}" r=".05" fill="#f0c36a"/>`)
  }
  if (drawing && drawing.pts.length) {          // the outline of a room that is being drawn: the corners so far, the edge to the pointer, the length of each edge
    const pts = drawing.pts, cur = drawing.cur, ring = cur ? [...pts, cur] : pts, closable = pts.length >= 3 && cur && Math.hypot(cur[0] - pts[0][0], cur[1] - pts[0][1]) < 0.25
    if (ring.length >= 3) o.push(`<polygon class="drf" points="${ring.map((q) => f2(q[0]) + ',' + f2(q[1])).join(' ')}"/>`)
    o.push(`<polyline class="dr" points="${(closable ? [...pts, pts[0]] : ring).map((q) => f2(q[0]) + ',' + f2(q[1])).join(' ')}"/>`)
    for (let i = 0; i + 1 < ring.length; i++) { const a = ring[i], b = ring[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 0.3) o.push(`<text class="drt" x="${f2((a[0] + b[0]) / 2)}" y="${f2((a[1] + b[1]) / 2 - 0.08)}">${cm(L)}</text>`) }
    pts.forEach((q, i) => o.push(`<circle cx="${f2(q[0])}" cy="${f2(q[1])}" r="${i === 0 ? (closable ? 0.13 : 0.08) : 0.05}" fill="#c6f24e"${i === 0 && closable ? ' fill-opacity=".45" stroke="#c6f24e" stroke-width=".03"' : ''}/>`))
    if (cur && !closable) o.push(`<circle cx="${f2(cur[0])}" cy="${f2(cur[1])}" r=".05" fill="none" stroke="#c6f24e" stroke-width=".02"/>`)
  }
  if (reshape) {          // the room that is being reshaped: its outline (or the outlines it would get while a corner or wall is dragged), the length of each wall, a handle on every corner and every wall
    const room = plan.rooms.find((r) => r.id === reshape.id), polys = reshape.polys || (room ? [{ id: room.id, polygon: room.polygon }] : [])
    const mine = polys.find((c) => c.id === reshape.id)
    for (const g of reshape.guides || []) o.push(`<line class="rg" x1="${f2(g.a[0])}" y1="${f2(g.a[1])}" x2="${f2(g.b[0])}" y2="${f2(g.b[1])}"/>`)          // the wall or axis the dragged corner or wall is locked to
    for (const c of polys) o.push(`<polygon class="rs${c.id === reshape.id ? '' : ' rn'}" points="${c.polygon.map((q) => f2(q[0]) + ',' + f2(q[1])).join(' ')}"/>`)
    if (mine) {
      const P = mine.polygon, n = P.length, hv = reshape.hover || {}
      for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 0.3) o.push(`<text class="drt" x="${f2((a[0] + b[0]) / 2)}" y="${f2((a[1] + b[1]) / 2 - 0.1)}">${cm(L)}</text>`) }
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, h = Math.min(0.18, L / 4)
        o.push(`<line class="rh-w${hv.kind === 'wall' && hv.index === i ? ' hov' : ''}" x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}"/>`)
        o.push(`<line class="rh-m" x1="${f2(mx - ux * h)}" y1="${f2(mz - uz * h)}" x2="${f2(mx + ux * h)}" y2="${f2(mz + uz * h)}"/>`)
      }
      P.forEach((q, i) => o.push(`<circle class="rh-c${hv.kind === 'corner' && hv.index === i ? ' hov' : ''}" cx="${f2(q[0])}" cy="${f2(q[1])}" r=".09"/>`))
    }
  }
  o.push('</svg>')
  void WALL_FIRST
  return o.join('')
}
