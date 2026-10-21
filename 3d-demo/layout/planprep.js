// Getting a plan picture ready for the reader (the browser does this before the upload, app/app.js preparePlan): cut the empty margin round the drawing and bring the picture to a size
// a vision model reads well. A plan is often a tiny screenshot (240 x 370 pixels) with a wide coloured border; a model reads thin wall lines, door arcs and window bars far better when the
// drawing fills a picture of about 1600 pixels (a plan read as a 237-pixel screenshot came out with 3 rooms and no doors; the same plan enlarged came out with 6 or 7 rooms and every opening).
// The functions work on the pixel array of a canvas (RGBA, row by row) so they can be tested without a browser.

// the background colour of a picture: the median of its outermost two pixels
export function backgroundOf(px, w, h) {
  const r = [], g = [], b = []
  const add = (x, y) => { const i = (y * w + x) * 4; r.push(px[i]); g.push(px[i + 1]); b.push(px[i + 2]) }
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) if (y >= 0 && y < h) add(x, y)
  for (let y = 0; y < h; y++) for (const x of [0, 1, w - 2, w - 1]) if (x >= 0 && x < w) add(x, y)
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1]
  return [med(r), med(g), med(b)]
}

// the box [x0, y0, x1, y1] (x1 and y1 are the first pixels outside) round everything that differs from the background, plus a margin of 5 % of the longer side
export function cropBox(px, w, h, { tol = 22, margin = 0.05 } = {}) {
  const [br, bg, bb] = backgroundOf(px, w, h)
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    if (0.299 * Math.abs(px[i] - br) + 0.587 * Math.abs(px[i + 1] - bg) + 0.114 * Math.abs(px[i + 2] - bb) > tol) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  if (x1 < 0) return [0, 0, w, h]          // nothing differs: leave the picture alone
  const m = Math.round(margin * Math.max(x1 - x0 + 1, y1 - y0 + 1)) + 2
  return [Math.max(0, x0 - m), Math.max(0, y0 - m), Math.min(w, x1 + 1 + m), Math.min(h, y1 + 1 + m)]
}

// the size of the picture that is sent: the longer side becomes `long` pixels (bigger pictures are brought down to it, as the model would do anyway, smaller ones are enlarged)
export function targetSize(w, h, long = 1600) {
  const k = long / Math.max(w, h)
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))]
}
