// Furniture catalogue: plain pieces with REAL sizes (metres) and the clear space each one needs to be used.
// Every piece is a few boxes, and the boxes are generated from the same numbers the layout engine checks, so what you see is what was measured.
// Local frame: x = width, z = depth with the FRONT at +z, y = up, origin at the centre of the footprint on the floor.
//   clear: free floor needed next to the piece, per side (front, back, left, right), measured from the piece's edge.
//   zoneOk: pieces that may stand inside that clear space on purpose (a coffee table in the clear space in front of a sofa).
// Sizes and distances follow common ergonomic guidance (Neufert and the usual kitchen, bedroom and bathroom rules of thumb).
import { MODELS, modelParts } from './models.js'
const box = (role, x, z, y, w, d, h) => ({ shape: 'box', role, x, z, y, w, d, h })
// wall cabinets of a kitchen run (y 1.45 to 2.15): the stretches of the run where no window is behind it, as [from, to] along the run (metres from its centre).
// A window that reaches above 1.45 m and stands behind the run (within half a metre of its back, facing the same way) takes its width and a hand on each side out of the wall units.
export const UPPER = { bottom: 1.45, top: 2.15, depth: 0.35, margin: 0.05, minLength: 0.3 }
export function upperSegments(it, windows = []) {
  let free = [[-it.w / 2, it.w / 2]]
  const cs = Math.cos(it.rot), sn = Math.sin(it.rot), fx = sn, fz = cs
  for (const win of windows) {
    if (win.sill + win.height <= UPPER.bottom + 1e-6 || win.sill >= UPPER.top) continue          // a low window sits under the wall units, a high one above them
    if (win.n[0] * fx + win.n[1] * fz < 0.9) continue                                              // not the wall behind this run
    const dx = win.at[0] - it.x, dz = win.at[1] - it.z, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs + it.d / 2
    if (lz < -0.35 || lz > 0.2) continue
    const a = lx - win.width / 2 - UPPER.margin, b = lx + win.width / 2 + UPPER.margin
    free = free.flatMap(([f0, f1]) => (b <= f0 || a >= f1 ? [[f0, f1]] : [[f0, Math.min(f1, a)], [Math.max(f0, b), f1]])).filter(([x, y]) => y - x > 1e-6)
  }
  return free.filter(([x, y]) => y - x >= UPPER.minLength)
}
const cyl = (role, x, z, y, r, h) => ({ shape: 'cyl', role, x, z, y, w: 2 * r, d: 2 * r, h })
// a box with rounded edges (soft furniture, tops, cushions)
const rbox = (role, x, z, y, w, d, h, r = 0.04) => ({ shape: 'rbox', role, x, z, y, w, d, h, r })
// four legs under a piece, inset from its corners
const legs = (role, w, d, size, h, inset = 0.06) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => box(role, sx * (w / 2 - inset), sz * (d / 2 - inset), 0, size, size, h))
// how many stacked drawers a chest has, read from the name of the product ("Kommode mit 3 Schubladen", "chest of 4 drawers", "dresser"); 0 when the name does not say it is a chest of drawers
const drawerRows = (o, height) => {
  const t = String(o?.product?.fullName || o?.product?.name || '').toLowerCase()
  const n = /(\d)\s*(?:-|\s)?(?:drawers?|schubl\w*|schubf\w*|stalci\w*|tiroirs?|cajones|cassetti|laden|skuffer|lad[ao]r)/.exec(t)
  if (n) return Math.min(8, Math.max(1, +n[1]))
  return /chest of drawers|kommode|dresser|commode|komod|cassettiera|cajonera|stalcių|stalciu/.test(t) ? Math.min(6, Math.max(2, Math.round(height / 0.27))) : 0
}
// a cabinet: legs (one under every joint of the fronts) or a plinth, the carcass, a top plate, and flush fronts with shadow gaps: doors in columns of about 55 cm, on a wide unit the
// middle columns a drawer over a door (mixed), or stacked drawers (rows); slim steel bar handles. role: the material of body and fronts ('wood' or 'cab'); the top plate is the 'top' role,
// legs and plinth the 'legs' role (the app gives them the colours of the product: a white cabinet with an oak top and white legs)
const cabinet = (w, d, h, { role = 'wood', leg = 0, plinth = false, top = 0.022, n = null, rows = 0, mixed = false, door = 0.019 } = {}) => {
  const out = [], gapRole = role + 'Gap', g = 0.003, bodyH = h - leg - top, cols = n || Math.max(1, Math.round(w / 0.55)), fw = w / cols, zf = d / 2 - door / 2
  if (leg && !plinth) {
    const k = Math.max(1, Math.round((w - 0.1) / 0.62))
    for (let i = 0; i <= k; i++) for (const z of [d / 2 - door - 0.04, -d / 2 + 0.04]) out.push(box('legs', -w / 2 + 0.035 + ((w - 0.07) / k) * i, z, 0, 0.045, 0.045, leg))
  } else if (leg) out.push(box('legs', 0, -0.01, 0, w - 0.04, d - 0.05, leg))
  out.push(box(role, 0, -door / 2, leg, w, d - door, bodyH))
  if (top) out.push(box('top', 0, 0, h - top, w, d, top))
  const y0 = leg + g * 0.7, y1 = h - top - g * 0.7, H = y1 - y0, zg = d / 2 - door + 0.004
  const front = (cx, y, hh) => out.push(box(role, cx, zf, y, fw - g, door, hh))
  const bar = (x, y, vertical) => out.push(box('metal', x, d / 2 + 0.003, y, vertical ? 0.01 : 0.12, 0.014, vertical ? 0.12 : 0.01))
  for (let i = 1; i < cols; i++) out.push(box(gapRole, -w / 2 + fw * i, zg, y0, 0.005, 0.012, H))
  for (let i = 0; i < cols; i++) {
    const cx = -w / 2 + fw * (i + 0.5), inner = i > 0 && i < cols - 1, side = i % 2 === 0 ? 1 : -1, hx = cx + side * (fw / 2 - 0.045)
    if (rows) {
      const rh = (H - g * (rows - 1)) / rows
      for (let r = 0; r < rows; r++) { const y = y0 + r * (rh + g); front(cx, y, rh); bar(cx, y + rh - 0.05, false); if (r) out.push(box(gapRole, cx, zg, y - g - 0.001, fw - g, 0.012, 0.005)) }
    } else if (mixed && inner && cols >= 3 && bodyH >= 0.5) {
      const dh = Math.min(0.28, H * 0.4), dr = H - dh - g
      front(cx, y0, dr); front(cx, y0 + dr + g, dh); out.push(box(gapRole, cx, zg, y0 + dr - 0.001, fw - g, 0.012, 0.005)); bar(cx, y0 + dr + g + dh - 0.05, false); bar(hx, y0 + dr - 0.15, true)
    } else { front(cx, y0, H); bar(hx, H > 1.5 ? y0 + H * 0.46 : y1 - 0.14, true) }
  }
  return out
}
// a sofa or an armchair: legs, a frame, arms, a back and one seat cushion and one back cushion for every 70 cm
const upholstered = (w, d, h, { cushion = 0.72 } = {}) => {
  const leg = Math.min(0.1, h * 0.12), arm = Math.min(0.2, w * 0.11), base = Math.min(0.2, h * 0.24), backT = Math.min(0.26, d * 0.28), innerW = w - 2 * arm, seatTop = leg + base
  const n = Math.max(1, Math.round(innerW / cushion)), cw = innerW / n, out = [...legs('dark', w, d, 0.05, leg, 0.07)]
  out.push(rbox('body', 0, 0, leg, w, d, base, 0.04), rbox('body', 0, -d / 2 + backT / 2, leg, innerW + 0.02, backT, h - leg, 0.07))
  for (const sg of [-1, 1]) out.push(rbox('body', sg * (w / 2 - arm / 2), 0, leg, arm, d, base + Math.min(0.26, h * 0.3), 0.06))
  for (let i = 0; i < n; i++) {
    const cx = -innerW / 2 + cw * (i + 0.5)
    out.push(rbox('body2', cx, backT / 2, seatTop, cw - 0.015, d - backT - 0.01, 0.15, 0.06), rbox('body2', cx, -d / 2 + backT + 0.09, seatTop + 0.05, cw - 0.04, 0.17, Math.max(0.2, h - seatTop - 0.12), 0.07))
  }
  return out
}
// books on a shelf compartment: a deterministic mix of heights, widths and colours (roles)
const books = (x0, x1, z, y, maxH, seed) => {
  const out = [], roles = ['body2', 'dark', 'light', 'wood', 'body'], d = 0.2; let x = x0 + 0.02, k = seed
  while (x < x1 - 0.06) {
    k = (k * 7 + 3) % 11; const bw = 0.025 + (k % 4) * 0.008, bh = Math.min(maxH, 0.18 + (k % 5) * 0.025)
    out.push(box(roles[k % roles.length], x + bw / 2, z, y, bw, d, bh)); x += bw + 0.002
    if (x > x0 + (x1 - x0) * 0.6) break
  }
  return out
}

export const RULES = {
  walkMin: 0.6,        // narrowest passage that is still passable (hard limit)
  walkGood: 0.9,       // comfortable main passage
  doorLanding: 0.9,    // free floor in front of a door, as deep as the door is wide, at least this
  viewDist: [1.8, 3.3],        // metres from the TV screen to the sofa's front edge (eyes sit about 0.4 m further back): comfortable for a 50 to 65 inch screen
  viewDistTarget: 2.6,
  coffeeGap: [0.3, 0.5], coffeeGapTarget: 0.42,   // sofa front edge to coffee table edge
  bedSide: 0.6, bedSideMin: 0.5, bedFoot: 0.7,    // free floor beside and at the foot of a bed
  diningPull: 0.8,     // from the table edge to the nearest wall or furniture, so a chair can be pulled out
  aisleMin: 0.9, aisleMax: 1.5, aisleTarget: 1.1, // between two facing kitchen runs
  toiletSide: 0.3,     // from the centre line of the toilet to the nearest obstacle on each side
  toiletFront: 0.6,
  windowDepth: 0.4,    // tall furniture keeps this far from a window
  tall: 1.2,           // taller than this counts as tall furniture
  railClear: 0.4,      // chairs, tables and storage benches keep this far from a railing (children climb them)
  slidingLanding: 0.6, // free floor in front of a sliding glass door: nothing swings, people just walk through along the glass
}

// every type takes exact sizes: make('sofa', { w: 2.05, d: 0.88, h: 0.9 }) is a sofa of exactly that size (a piece read from a product page); without them the type's own default is used
const dims = (o, w, d, h) => ({ w: o.w || w, d: o.d || d, h: o.h || h })
const T = {}
const def = (type, spec) => { T[type] = { clear: {}, min: {}, zoneOk: [], ...spec }; return T[type] }

// ---------------------------------------------------------------- living
def('sofa', { label: 'Sofa', size: (o) => dims(o, 2.2, 0.95, 0.85), userSize: ['w'], clear: { front: 0.4 }, min: { front: 0.35 }, zoneOk: ['coffee_table', 'rug', 'armchair', 'side_table'], seat: true,
  parts: (w, d, h) => upholstered(w, d, h) })
def('armchair', { label: 'Armchair', size: (o) => dims(o, 0.85, 0.85, 0.85), clear: { front: 0.5 }, min: { front: 0.45 }, zoneOk: ['coffee_table', 'rug'], seat: true,
  parts: (w, d, h) => upholstered(w, d, h, { cushion: 0.9 }) })
def('coffee_table', { label: 'Coffee table', size: (o) => dims(o, 1.0, 0.55, 0.4), userSize: ['w', 'd'], clear: { front: 0.3, back: 0.3, left: 0.3, right: 0.3 }, min: { front: 0.25, back: 0.25, left: 0.25, right: 0.25 }, zoneOk: ['sofa', 'armchair', 'rug', 'side_table'],
  parts: (w, d, h) => [rbox('top', 0, 0, h - 0.04, w, d, 0.04, 0.015), ...legs('legs', w, d, 0.04, h - 0.04, 0.05), ...(h >= 0.36 ? [box('wood', 0, 0, 0.1, w - 0.16, d - 0.16, 0.02)] : [])] })
def('side_table', { label: 'Side table', size: (o) => dims(o, 0.45, 0.45, 0.5), zoneOk: ['coffee_table'], parts: (w, d, h) => [cyl('top', 0, 0, h - 0.03, Math.min(w, d) / 2, 0.03), cyl('legs', 0, 0, 0, 0.025, h - 0.03)] })
def('tv_unit', { label: 'TV unit', size: (o) => dims(o, 1.6, 0.4, 0.45), userSize: ['w'], tvSize: 55, solidH: 1.7,
  parts: (w, d, h, o) => {
    const tw = Math.min(o.tvW || 1.23, w - 0.1), th = o.product ? tw * 0.585 : o.tvH || 0.72, leg = h >= 0.3 ? Math.min(0.1, h * 0.25) : 0, body = cabinet(w, d, h, { leg, top: Math.min(0.022, h * 0.06), n: Math.max(2, Math.round(w / 0.55)) })
    return h > 1.2 ? body : [...body, box('tv', 0, -d / 2 + 0.03, o.product ? h + 0.04 : 0.95, tw, 0.05, th)]          // a TV wall (a tall combination) has its TV in the niche, which the model of the product shows
  } })
def('shelf', { label: 'Bookcase', size: (o) => dims(o, 0.9, 0.35, 1.9), userSize: ['w'], clear: { front: 0.7 }, parts: (w, d, h) => {
    const t = 0.022, n = Math.max(1, Math.round(h / 0.38) - 1), out = [box('wood', -(w / 2 - t / 2), 0, 0, t, d, h), box('wood', w / 2 - t / 2, 0, 0, t, d, h), box('wood', 0, -d / 2 + 0.006, 0, w - 2 * t, 0.012, h), box('wood', 0, 0, 0, w - 2 * t, d, t), box('wood', 0, 0, h - t, w, d, t)]
    for (let k = 1; k <= n; k++) out.push(box('wood', 0, 0.004, (k * h) / (n + 1), w - 2 * t, d - 0.012, t))
    for (let k = 0; k <= n; k++) { const y0 = k === 0 ? t : (k * h) / (n + 1) + t, y1 = k === n ? h - t : ((k + 1) * h) / (n + 1); if (k % 3 !== 1 && y1 - y0 > 0.2 && w > 0.4) out.push(...books(-w / 2 + t, w / 2 - t, -d / 2 + 0.006 + Math.min(d, 0.3) / 2 - 0.0, y0, Math.min(y1 - y0 - 0.03, 0.3), k + 2)) }
    return out } })
def('sideboard', { label: 'Sideboard', cabinet: true, size: (o) => dims(o, 1.4, 0.42, 0.8), userSize: ['w'], clear: { front: 0.6 },
  parts: (w, d, h, o) => { const leg = h >= 0.5 ? Math.min(0.14, h * 0.18) : 0, rows = drawerRows(o, h - leg); return cabinet(w, d, h, { leg, ...(rows ? { rows, n: Math.max(1, Math.round(w / 0.8)) } : { mixed: w >= 1.6 && h - leg >= 0.5 }) }) } })
def('floor_lamp', { label: 'Floor lamp', decor: true, size: (o) => dims(o, 0.35, 0.35, 1.6), parts: (w, d, h) => [cyl('dark', 0, 0, 0, Math.min(0.14, Math.min(w, d) / 2), 0.03), cyl('dark', 0, 0, 0.03, 0.012, h - 0.35), cyl('light', 0, 0, h - 0.35, Math.min(w, d) / 2, 0.35)] })
def('plant', { label: 'Plant', decor: true, size: (o) => dims(o, 0.4, 0.4, 1.2), parts: (w, d, h) => [cyl('pot', 0, 0, 0, Math.min(0.17, Math.min(w, d) * 0.42), 0.32), cyl('plant', 0, 0, 0.32, Math.min(w, d) / 2, h - 0.32)] })
def('rug', { label: 'Rug', size: (o) => ({ ...dims(o, 2.4, 1.7, 0.015), h: 0.015 }), userSize: ['w', 'd'], floor: true, parts: (w, d, h) => [box('rug', 0, 0, 0, w, d, h)] })

// ---------------------------------------------------------------- dining
def('dining_table', { label: 'Dining table', size: (o) => dims(o, 1.4, 0.8, 0.75), userSize: ['w', 'd'], clear: { front: 0.8, back: 0.8, left: 0.8, right: 0.8 }, min: { front: 0.75, back: 0.75, left: 0.75, right: 0.75 }, zoneOk: ['chair'], farFrom: { counter: 1.1, fridge: 1.1 },
  parts: (w, d, h) => [rbox('top', 0, 0, h - 0.035, w, d, 0.035, 0.012), ...legs('legs', w, d, 0.06, h - 0.035, 0.07), box('legs', 0, -(d / 2 - 0.09), h - 0.09, w - 0.2, 0.02, 0.055), box('legs', 0, d / 2 - 0.09, h - 0.09, w - 0.2, 0.02, 0.055)] })
def('chair', { label: 'Chair', size: (o) => dims(o, 0.45, 0.5, 0.9), seat: true, zoneOk: ['dining_table', 'outdoor_table', 'desk'], climb: true,
  parts: (w, d, h) => [rbox('body2', 0, 0.02, 0.42, w, d - 0.04, 0.05, 0.02), ...legs('dark', w, d - 0.04, 0.035, 0.42, 0.04), box('dark', -(w / 2 - 0.03), -d / 2 + 0.04, 0.42, 0.03, 0.03, h - 0.42), box('dark', w / 2 - 0.03, -d / 2 + 0.04, 0.42, 0.03, 0.03, h - 0.42), rbox('body2', 0, -d / 2 + 0.04, h - 0.34, w - 0.06, 0.035, 0.26, 0.02)] })

// ---------------------------------------------------------------- bedroom (mw = mattress width: 90, 140 or 160 cm, mattress length 200 cm)
def('bed', { label: 'Bed', size: (o) => { const mw = (o.mw || 160) / 100; return dims(o, mw + 0.1, 2.08, 0.95) }, userSize: ['mw'], clear: { left: 0.6, right: 0.6, front: 0.7 }, min: { left: 0.5, right: 0.5, front: 0.6 }, zoneOk: ['nightstand', 'rug'], headBack: true,
  parts: (w, d, h) => {
    const k = Math.min(1, h / 0.75), leg = 0.1 * k, fr = 0.16 * k, mat = 0.2 * k, ht = 0.1, top = leg + fr + mat, np = w > 1.3 ? 2 : 1, pw = Math.max(0.35, (w - 0.2) / np - 0.06)
    const out = [...legs('dark', w, d, 0.06, leg, 0.05), rbox('wood', 0, 0, leg, w, d, fr, 0.03), rbox('body', 0, -d / 2 + ht / 2, leg, w, ht, Math.max(0.3, h - leg), 0.05), rbox('light', 0, ht / 2, leg + fr, w - 0.1, d - ht - 0.04, mat, 0.06), rbox('body2', 0, d / 2 - 0.04 - (d * 0.55) / 2, top - 0.03 * k, w - 0.07, d * 0.55, 0.08 * k + 0.03 * k, 0.05)]
    for (let i = 0; i < np; i++) out.push(rbox('light', -((np - 1) * (pw + 0.06)) / 2 + i * (pw + 0.06), -d / 2 + ht + 0.22, top, pw, 0.34, 0.12 * k, 0.05))
    return out } })
def('nightstand', { label: 'Bedside table', cabinet: true, size: (o) => dims(o, 0.45, 0.4, 0.5), clear: { front: 0.4 }, zoneOk: ['rug'],
  parts: (w, d, h, o) => cabinet(w, d, h, { leg: h >= 0.4 ? 0.1 : 0, top: 0.02, n: 1, rows: drawerRows(o, h) || 2, door: 0.018 }) })
def('wardrobe', { label: 'Wardrobe', size: (o) => dims(o, 1.8, 0.6, 2.2), userSize: ['w'], clear: { front: 0.8 }, min: { front: 0.7 }, zoneOk: ['rug'],
  parts: (w, d, h) => cabinet(w, d, h, { role: 'cab', leg: 0.08, plinth: true, top: 0, n: Math.max(2, Math.round(w / 0.5)) }) })
def('desk', { label: 'Desk', size: (o) => dims(o, 1.2, 0.6, 0.75), userSize: ['w'], clear: { front: 0.75 }, min: { front: 0.7 }, zoneOk: ['chair'],
  parts: (w, d, h) => [rbox('top', 0, 0, h - 0.04, w, d, 0.04, 0.012), box('legs', w / 2 - 0.03, 0, 0, 0.04, d - 0.06, h - 0.04), ...(w >= 1 ? [box('wood', -(w / 2 - 0.22), 0, 0.04, 0.4, d - 0.06, h - 0.08), box('woodGap', -(w / 2 - 0.22), d / 2 - 0.02, 0.04 + (h - 0.08) * 0.33, 0.4, 0.008, 0.006), box('woodGap', -(w / 2 - 0.22), d / 2 - 0.02, 0.04 + (h - 0.08) * 0.66, 0.4, 0.008, 0.006), box('metal', -(w / 2 - 0.22), d / 2 + 0.002, 0.04 + (h - 0.08) * 0.18, 0.1, 0.012, 0.012), box('metal', -(w / 2 - 0.22), d / 2 + 0.002, 0.04 + (h - 0.08) * 0.5, 0.1, 0.012, 0.012), box('metal', -(w / 2 - 0.22), d / 2 + 0.002, 0.04 + (h - 0.08) * 0.82, 0.1, 0.012, 0.012)] : [box('legs', -(w / 2 - 0.03), 0, 0, 0.04, d - 0.06, h - 0.04)]), box('tv', 0, -0.12, h, 0.55, 0.03, 0.32)] })

// ---------------------------------------------------------------- kitchen (a run of base units; features = sink and hob positions along the run)
def('counter', { label: 'Kitchen run', solidH: 0.9, size: (o) => dims(o, 2.4, 0.6, 0.9), userSize: ['w'], clear: { front: 1.0 }, min: { front: 0.9 }, zoneOk: ['dining_table', 'chair', 'rug'], run: true,
  parts: (w, d, h, o, env) => {
    const n = Math.max(1, Math.round(w / 0.6)); const p = [box('cab', 0, 0, 0, w, d, h - 0.04), box('light', 0, 0, h - 0.04, w, d, 0.04)]
    for (let i = 1; i < n; i++) p.push(box('dark', -w / 2 + (w / n) * i, d / 2 - 0.004, 0.06, 0.006, 0.012, h - 0.14))
    for (const f of o.features || []) {
      const fx = -w / 2 + f.at
      if (f.kind === 'sink') p.push(box('metal', fx, 0, h, 0.5, 0.4, 0.01))
      if (f.kind === 'hob') p.push(box('tv', fx, 0, h, 0.58, 0.5, 0.012))
    }
    if (o.upper) for (const [a, b] of upperSegments({ ...o, w, d }, env?.windows)) p.push(box('cab', (a + b) / 2, -d / 2 + UPPER.depth / 2, UPPER.bottom, b - a, UPPER.depth, UPPER.top - UPPER.bottom))
    return p } })
// a kitchen island stands free in the room (never against a wall) with room to walk all round it
def('kitchen_island', { label: 'Kitchen island', free: true, cabinet: true, size: (o) => dims(o, 1.2, 0.7, 0.9), userSize: ['w', 'd'], clear: { front: 0.9, back: 0.9, left: 0.9, right: 0.9 }, min: { front: 0.8, back: 0.8, left: 0.8, right: 0.8 }, zoneOk: ['chair'],
  parts: (w, d, h) => cabinet(w, d, h, { role: 'cab', leg: 0.08, plinth: true, top: 0.04, n: Math.max(1, Math.round(w / 0.6)) }) })
def('fridge', { label: 'Fridge', size: (o) => dims(o, 0.6, 0.65, 1.85), clear: { front: 0.9 }, min: { front: 0.8 }, parts: (w, d, h) => [box('metal', 0, 0, 0, w, d, h), box('dark', 0, d / 2 + 0.0, Math.min(1.0, h - 0.05), w - 0.1, 0.01, 0.01)] })

// ---------------------------------------------------------------- bathroom
def('bathtub', { label: 'Bathtub', size: (o) => dims(o, 1.7, 0.75, 0.55), userSize: ['w'], clear: { front: 0.6 }, parts: (w, d, h) => [box('light', 0, 0, 0, w, d, h), box('water', 0, 0, h - 0.02, w - 0.14, d - 0.14, 0.02)] })
def('shower', { label: 'Shower', size: (o) => dims(o, 0.9, 0.9, 2.0), clear: { front: 0.6 }, parts: (w, d, h) => [box('light', 0, 0, 0, w, d, 0.05), box('glass', 0, d / 2 - 0.01, 0.05, w, 0.01, h - 0.05), box('glass', w / 2 - 0.005, 0, 0.05, 0.01, d, h - 0.05)] })
def('toilet', { label: 'Toilet', size: (o) => dims(o, 0.38, 0.65, 0.8), clear: { front: 0.6, left: 0.2, right: 0.2 }, min: { front: 0.55, left: 0.2, right: 0.2 }, parts: (w, d, h) => [box('light', 0, 0.08, 0, w - 0.04, d - 0.16, 0.4), box('light', 0, -d / 2 + 0.09, 0, w, 0.18, h)] })
def('vanity', { label: 'Vanity with basin', solidH: 1.1, size: (o) => dims(o, 0.6, 0.45, 0.85), userSize: ['w'], clear: { front: 0.7 }, parts: (w, d, h) => [box('cab', 0, 0, 0.1, w, d, h - 0.1), box('dark', 0, 0, 0, w - 0.1, d - 0.1, 0.1), box('light', 0, 0.02, h, w - 0.1, d - 0.12, 0.02)] })
def('washer', { label: 'Washing machine', cabinet: true, size: (o) => dims(o, 0.6, 0.6, 0.85), clear: { front: 0.7 }, parts: (w, d, h) => [box('light', 0, 0, 0, w, d, h), box('dark', 0, d / 2 + 0.002, h * 0.47, Math.min(0.4, w - 0.1, h * 0.47), 0.012, Math.min(0.4, w - 0.1, h * 0.47))] })

// ---------------------------------------------------------------- hall, balcony
def('shoe_cabinet', { label: 'Shoe cabinet', cabinet: true, size: (o) => dims(o, 0.9, 0.35, 0.9), userSize: ['w'], clear: { front: 0.8 },
  parts: (w, d, h) => cabinet(w, d, h, { role: 'cab', leg: 0.06, plinth: true, top: 0, n: Math.max(1, Math.round(w / 0.45)) }) })
def('bistro_table', { label: 'Bistro table', size: (o) => dims(o, 0.6, 0.6, 0.72), clear: { front: 0.6, back: 0.6, left: 0.6, right: 0.6 }, zoneOk: ['chair'], climb: true, parts: (w, d, h) => [cyl('metal', 0, 0, h - 0.03, Math.min(w, d) / 2, 0.03), cyl('dark', 0, 0, 0, 0.03, h - 0.03)] })
def('lounger', { label: 'Sun lounger', size: (o) => dims(o, 0.7, 1.9, 0.4), clear: { front: 0.5, left: 0.4, right: 0.4 }, zoneOk: ['side_table'], parts: (w, d, h) => [box('metal', 0, 0, 0, w, d, 0.18), box('body2', 0, 0, 0.18, w - 0.06, d - 0.08, 0.12)] })

// ---------------------------------------------------------------- terrace and balcony (outdoor furniture)
def('outdoor_sofa', { label: 'Outdoor sofa', size: (o) => dims(o, 2.0, 0.85, 0.8), userSize: ['w'], clear: { front: 0.45 }, min: { front: 0.4 }, zoneOk: ['coffee_table', 'rug', 'armchair', 'side_table'], seat: true,
  parts: (w, d, h) => [box('metal', 0, 0, 0, w - 0.1, d - 0.1, 0.16), box('body', 0, 0.06, 0.16, w - 0.24, d - 0.22, 0.2), box('body', 0, -d / 2 + 0.1, 0.16, w - 0.12, 0.16, h - 0.16), box('wood', -(w / 2 - 0.06), 0, 0.16, 0.12, d - 0.1, 0.3), box('wood', w / 2 - 0.06, 0, 0.16, 0.12, d - 0.1, 0.3)] })
def('outdoor_table', { label: 'Outdoor dining table', size: (o) => dims(o, 1.6, 0.9, 0.75), userSize: ['w', 'd'], clear: { front: 0.85, back: 0.85, left: 0.85, right: 0.85 }, min: { front: 0.85, back: 0.85, left: 0.85, right: 0.85 }, zoneOk: ['chair'], farFrom: { grill: 1.0 }, climb: true, railGap: 0.92,
  parts: (w, d, h) => [box('wood', 0, 0, h - 0.04, w, d, 0.04), box('metal', -(w / 2 - 0.1), 0, 0, 0.05, d - 0.2, h - 0.04), box('metal', w / 2 - 0.1, 0, 0, 0.05, d - 0.2, h - 0.04)] })
def('planter', { label: 'Planter', size: (o) => dims(o, 0.8, 0.35, 0.9), userSize: ['w'], clear: { front: 0.2 }, min: { front: 0.15 },
  parts: (w, d, h) => [box('pot', 0, 0, 0, w, d, 0.45), box('plant', 0, 0, 0.45, w - 0.08, d - 0.08, h - 0.45)] })
def('grill', { label: 'Grill', size: (o) => dims(o, 1.2, 0.6, 0.95), clear: { front: 0.9, left: 0.3, right: 0.3 }, min: { front: 0.8, left: 0.25, right: 0.25 }, farFrom: { outdoor_table: 1.0 },
  parts: (w, d, h) => [box('dark', 0, 0, 0, w, d, h * 0.79), box('metal', 0, 0, h * 0.79, w, d, h * 0.21), box('light', 0, d / 2 - 0.02, h * 0.32, w - 0.2, 0.01, h * 0.32)] })
def('deck_box', { label: 'Storage bench', size: (o) => dims(o, 1.3, 0.55, 0.55), userSize: ['w'], clear: { front: 0.4 }, min: { front: 0.4 }, climb: true,
  parts: (w, d, h) => [box('wood', 0, 0, 0, w, d, h - 0.05), box('dark', 0, 0, h - 0.05, w + 0.02, d + 0.02, 0.05)] })

def('product', { label: 'Other piece', userSize: ['w', 'd'], size: (o) => dims(o, 0.8, 0.8, 0.85), clear: { front: 0.4 }, min: { front: 0.35 }, parts: (w, d, h) => (d <= 0.7 && w >= 0.6 && h >= 0.5 && (w / h >= 1.1 || h >= 1.2)
    ? cabinet(w, d, h, { role: 'body', leg: h > 1.3 ? 0.08 : h >= 0.7 ? Math.min(0.12, h * 0.15) : 0, plinth: h > 1.3, top: h > 1.3 ? 0 : 0.022, n: Math.max(1, Math.round(w / 0.55)) })          // as big and flat as a cabinet: drawn as one, not as a block
    : [box('dark', 0, 0, 0, w - 0.06, d - 0.06, Math.min(0.06, h * 0.2)), rbox('body', 0, 0, Math.min(0.06, h * 0.2), w, d, h - Math.min(0.06, h * 0.2), Math.min(0.06, Math.min(w, d) / 4))]) })

export const TYPES = T
export const isTall = (type, h) => (h ?? 0) >= RULES.tall
// how high the wall behind a piece has to be solid: a window whose sill is lower than this may not sit behind it
// (cabinets and cupboards count at their own height, however low: a sideboard does not stand in front of a window whose sill is lower than the sideboard)
export const solidHeight = (it) => it.solidH || (TYPES[it.type]?.cabinet || (it.h ?? 0) >= RULES.tall ? it.h ?? 0 : 0)

// A placeable piece: type, size and clear space (the engine adds x, z, rot, room)
export function make(type, o = {}) {
  const t = T[type]; if (!t) throw new Error('unknown furniture type ' + type)
  const { w, d, h } = t.size(o)
  const clear = { front: 0, back: 0, left: 0, right: 0, ...t.clear }
  const clearMin = Object.fromEntries(Object.entries(clear).map(([k, v]) => [k, t.min[k] ?? +(v * 0.85).toFixed(2)]))
  const item = { type, w: +w.toFixed(3), d: +d.toFixed(3), h: +h.toFixed(3), clear, clearMin, zoneOk: t.zoneOk, ...(t.floor ? { floor: true } : {}), ...(t.decor ? { decor: true } : {}), ...(t.climb ? { climb: true } : {}), ...(t.free ? { free: true } : {}), ...(t.railGap ? { railGap: t.railGap } : {}), ...(t.farFrom ? { farFrom: t.farFrom } : {}), ...(t.solidH ? { solidH: t.solidH } : {}), ...(o.features ? { features: o.features } : {}), ...(o.upper ? { upper: true } : {}), ...(o.mw ? { mw: o.mw } : {}), ...(o.product ? { product: o.product } : {}), ...(o.finish ? { finish: o.finish } : {}) }
  return item
}
// env (optional): { windows } of the item's room, so wall cabinets can leave the windows free
// a product with a model made from its pictures is drawn from that model (stretched to the sizes it has); every other piece from the shapes of its type
export const modelOf = (item) => (item.product?.modelKey ? MODELS.get(item.product.modelKey) || null : null)
export const partsOf = (item, env) => { const m = modelOf(item); return m ? modelParts(m, item) : T[item.type].parts(item.w, item.d, item.h, item, env) }
export const labelOf = (type) => (T[type] ? T[type].label : type)
export const isFloorLayer = (type) => Boolean(T[type]?.floor)
