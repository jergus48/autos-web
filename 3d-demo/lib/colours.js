// The colours of a product from its picture: the main colour of the piece and a second one (legs, frame, handles). Pure (RGBA pixels in, numbers out), so it runs in the
// browser on a small canvas and in tests.
//   background = the colour along the border of the picture (or transparent pixels); everything near it is not the product
//   a product on a white background that is itself white leaves almost nothing: then primary is null (the colour named on the page is used) but an accent is still returned when a coloured part
//   stands out (the oak top of a white cabinet): the most common saturated colour of what is not background (also returned beside a main colour; reconcile decides whether it is used)
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const median = (v) => { const s = [...v].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] ?? 255 }
const hex = (c) => (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2])

// the most common saturated colour among the pixels that are not background (null when none is at least 0.4% of the picture)
function accentOf(bins, total, min = 0.004) {
  let best = null
  for (const b of bins.values()) {
    const c = [b.r / b.n, b.g / b.n, b.b / b.n], mx = Math.max(...c), mn = Math.min(...c)
    if (mx - mn < 0.16 * 255 || mx < 70) continue
    if (b.n >= total * min && (!best || b.n > best.n)) best = { n: b.n, c }
  }
  return best ? hex(best.c) : null
}

export function dominantColours(rgba, w, h, { background = 40, minShare = 0.05, secondShare = 0.04, apart = 70 } = {}) {
  const px = (i) => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]]
  const edge = Math.max(1, Math.round(Math.min(w, h) * 0.04)), br = [], bg = [], bb = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= edge && y >= edge && x < w - edge && y < h - edge) { x = w - edge - 1; continue }
    const p = px(y * w + x); if (p[3] >= 200) { br.push(p[0]); bg.push(p[1]); bb.push(p[2]) }
  }
  const bgc = br.length ? [median(br), median(bg), median(bb)] : null
  const bins = new Map(); let fg = 0
  for (let i = 0; i < w * h; i++) {
    const p = px(i); if (p[3] < 128) continue
    if (bgc && dist(p, bgc) < background) continue
    fg++
    const key = (p[0] >> 4) * 256 + (p[1] >> 4) * 16 + (p[2] >> 4), b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 }
    b.n++; b.r += p[0]; b.g += p[1]; b.b += p[2]; bins.set(key, b)
  }
  const accent = accentOf(bins, w * h)
  if (fg / (w * h) < minShare) return { primary: null, secondary: null, accent, share: fg / (w * h) }
  // smooth: a bin counts with its neighbours (a fabric has many shades of one colour)
  const at = (r, g, b) => bins.get(r * 256 + g * 16 + b)
  const scored = [...bins.entries()].map(([k, v]) => {
    const r = k >> 8, g = (k >> 4) & 15, b = k & 15; let n = 0, sr = 0, sg = 0, sb = 0
    for (let dr = -1; dr <= 1; dr++) for (let dg = -1; dg <= 1; dg++) for (let db = -1; db <= 1; db++) { const q = at(r + dr, g + dg, b + db); if (q) { n += q.n; sr += q.r; sg += q.g; sb += q.b } }
    return { n, c: [sr / n, sg / n, sb / n] }
  }).sort((a, b) => b.n - a.n)
  const primary = scored[0].c, second = scored.find((s) => dist(s.c, primary) > apart && s.n >= fg * secondShare)
  return { primary: hex(primary), secondary: second ? hex(second.c) : null, accent, share: fg / (w * h) }
}

// the colours of a picture and the colour named on the page, to one main colour and one second colour. A white piece on a white picture shows only its shaded sides, which read as light grey:
// when the page names a light neutral colour (white) and the picture's main colour is a light neutral too (or nothing), the colour of the page wins and the greys of the shadows are no second colour;
// beside a neutral main colour a saturated part of the picture (the oak top of a white cabinet) is the second colour. word: the colour of the page as a number, or null.
const channels = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
const sat = (c) => { const [r, g, b] = channels(c), mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx }
const light = (c) => { const [r, g, b] = channels(c); return (Math.max(r, g, b) + Math.min(r, g, b)) / 510 }
const neutralLight = (c) => c !== null && c !== undefined && sat(c) < 0.12 && light(c) >= 0.6
export function reconcile({ primary = null, secondary = null, accent = null } = {}, word = null) {
  let main = primary, second = secondary
  if (neutralLight(word) && (main === null || neutralLight(main))) { main = word; if (second !== null && sat(second) < 0.12) second = null }
  if (second === null && accent !== null && main !== null && sat(main) < 0.12 && dist(channels(main), channels(accent)) > 70) second = accent
  return { main, second }
}
