// The textures of floors: drawn from a floor spec (layout/floorspec.js), or made from a photo of the real floor. A texture is multiplied with the colour of the floor, so it is drawn in light greys:
// the boards or tiles differ in shade by the variation the photos showed, carry the grain or veins they showed, and are separated by joints of the colour they showed. The plan UVs are metres,
// so the repeat of a texture is 1 / the metres it covers (worldX, worldY of floorPlan) and the pictures repeat without a seam.
import * as THREE from 'three'
import { floorPlan, jointGrey } from '../layout/floorspec.js'

const cache = new Map()
const frac = (v) => v - Math.floor(v)
const hash = (a, b = 0, seed = 0) => frac(Math.sin(a * 127.1 + b * 311.7 + seed * 74.7 + 1.3) * 43758.5453)

export function floorTexture(spec) {
  const key = JSON.stringify([spec.kind, spec.cm, spec.layout, spec.shade, spec.grain, spec.joint, spec.color])
  if (cache.has(key)) return cache.get(key)
  const P = floorPlan(spec), S = 512
  const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = '#ececec'; g.fillRect(0, 0, S, S)
  const X = (m) => (m * S) / P.worldX, Y = (m) => (m * S) / P.worldY
  let seed = 1; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) % 100003
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const woody = spec.kind !== 'tile' && spec.kind !== 'stone' && spec.kind !== 'carpet'
  const joint = jointGrey(spec), jointStyle = joint === null ? (woody ? 'rgba(0,0,0,.26)' : 'rgba(0,0,0,.30)') : `rgb(${joint},${joint},${joint})`
  // one board: a quadrilateral whose first side p0 -> p1 is its length; shade by the number of the board, grain lines along its length
  const board = (p, id, jw = woody ? 1.6 : 3) => {
    const v = Math.round(236 + (hash(id, 3, seed) - 0.5) * 2 * spec.shade * 30), tint = woody ? [0, -2, -5] : [0, 0, 0]
    g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath()
    g.fillStyle = `rgb(${v + tint[0]},${v + tint[1]},${v + tint[2]})`; g.fill()
    if (spec.grain > 0 && woody) {          // lines along the board, a few lighter and darker, a little wavy
      const n = 3 + Math.round(spec.grain * 6)
      g.save(); g.clip()
      for (let q = 0; q < n; q++) {
        const f = (q + 0.3 + rnd() * 0.4) / n, a0 = [p[0][0] + (p[3][0] - p[0][0]) * f, p[0][1] + (p[3][1] - p[0][1]) * f], a1 = [p[1][0] + (p[2][0] - p[1][0]) * f, p[1][1] + (p[2][1] - p[1][1]) * f]
        const dark = rnd() < 0.7; g.strokeStyle = dark ? `rgba(0,0,0,${0.03 + spec.grain * 0.13})` : `rgba(255,255,255,${0.04 + spec.grain * 0.10})`; g.lineWidth = 0.8 + rnd() * 1.4
        g.beginPath(); g.moveTo(a0[0], a0[1]); g.bezierCurveTo(a0[0] + (a1[0] - a0[0]) * 0.33, a0[1] + (a1[1] - a0[1]) * 0.33 + (rnd() - 0.5) * 3, a0[0] + (a1[0] - a0[0]) * 0.66, a0[1] + (a1[1] - a0[1]) * 0.66 + (rnd() - 0.5) * 3, a1[0], a1[1]); g.stroke()
      }
      g.restore()
    }
    g.strokeStyle = jointStyle; g.lineWidth = jw; g.beginPath(); p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke()
  }
  const rect = (x, y, w, h) => [[X(x), Y(y)], [X(x + w), Y(y)], [X(x + w), Y(y + h)], [X(x), Y(y + h)]]          // metres -> a board lying along x
  if (P.kind === 'tile' || P.kind === 'stone') {
    for (let j = 0; j < P.ny; j++) for (let i = -1; i <= P.nx; i++) {
      const off = spec.layout === 'staggered' && j % 2 ? P.tw / 2 : 0
      board(rect(i * P.tw + off, j * P.th, P.tw, P.th), (((i % P.nx) + P.nx) % P.nx) + j * 31)
    }
    if (P.kind === 'stone' || spec.grain > 0.2) {          // veins: long faint wandering lines over the stone
      const n = Math.round(spec.grain * 40); g.lineCap = 'round'
      for (let k = 0; k < n; k++) {
        g.strokeStyle = `rgba(70,70,70,${0.04 + rnd() * 0.08 * (0.5 + spec.grain)})`; g.lineWidth = 0.8 + rnd() * 2.2; g.beginPath(); let x = rnd() * S, y = rnd() * S; g.moveTo(x, y)
        for (let q = 0; q < 6; q++) { x += (rnd() - 0.3) * 120; y += (rnd() - 0.5) * 90; g.lineTo(x, y) } g.stroke()
      }
    }
  } else if (P.kind === 'herringbone') {
    // boards of K x 1 cells; one lying and one standing board repeat along the diagonal (1, 1) and every 2K cells: an exact tiling of a 2K x 2K cell square, turned 45 degrees in the room
    const w = P.bw, K = P.K, plank = (cx, cy, lying, id) => {
      for (const ox of [-P.worldX, 0, P.worldX]) for (const oy of [-P.worldY, 0, P.worldY]) {
        const x = cx * w + ox, y = cy * w + oy
        board(lying ? [[X(x), Y(y)], [X(x + K * w), Y(y)], [X(x + K * w), Y(y + w)], [X(x), Y(y + w)]] : [[X(x), Y(y)], [X(x), Y(y + K * w)], [X(x + w), Y(y + K * w)], [X(x + w), Y(y)]], id + (lying ? 0 : 97), 1.8)
      }
    }
    for (let a = 0; a < 2 * K; a++) { plank(a, a, true, a); plank(a + K, a + 1 - K, false, a) }          // (the other boards are these moved by 2K cells: the copies at the edges draw them)
  } else if (P.kind === 'chevron') {
    // boards at 45 degrees with straight ends: a left half rising to the right, a right half falling, meeting in a V; the rows repeat every board width
    const R = P.run, t = P.t, extra = Math.ceil(R / t) + 2
    for (let r = -extra; r < P.n + extra; r++) {
      const y0 = r * t, id = ((r % P.n) + P.n) % P.n
      board([[X(0), Y(y0)], [X(R), Y(y0 + R)], [X(R), Y(y0 + R + t)], [X(0), Y(y0 + t)]], id, 1.8)
      board([[X(R), Y(y0 + R)], [X(2 * R), Y(y0)], [X(2 * R), Y(y0 + t)], [X(R), Y(y0 + R + t)]], id + 53, 1.8)
    }
  } else if (P.kind === 'carpet') {
    const d = g.getImageData(0, 0, S, S), px = d.data, amp = 8 + spec.grain * 34
    for (let i = 0; i < px.length; i += 4) { const v = 232 + Math.floor((rnd() - 0.5) * amp); px[i] = v; px[i + 1] = v; px[i + 2] = v }
    g.putImageData(d, 0, 0)
    for (let k = 0; k < 18; k++) { const x = rnd() * S, y = rnd() * S, r = 120 + rnd() * 160, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},.022)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r) }          // very faint, wide patches of lighter and darker pile
  } else {          // planks and deck: rows of boards, straight (joints in line), staggered (each row moved by a golden-ratio fraction of a board) or the same turned 45 degrees
    for (let j = 0; j < P.rows; j++) {
      const off = spec.layout === 'straight' ? 0 : frac(j * 0.381966 + 0.17) * P.L
      for (let k = -1; k <= P.cols; k++) board(rect(k * P.L - off, j * P.bw, P.L, P.bw), (((k % P.cols) + P.cols) % P.cols) + j * 17)
    }
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / P.worldX, 1 / P.worldY); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
  if (P.rotate) { tex.center.set(0.5, 0.5); tex.rotation = P.rotate }
  cache.set(key, tex); return tex
}

// ---- the real floor: a close-up photo that the person added (app/floorphoto.js). Loaded, flattened and made seamless ahead of time (the scene is built in one go), then tiled
export const floorPhotos = new Map()          // "<url>|<quarter turns>" -> a canvas
const photoKey = (url, turns) => url + '|' + (turns || 0)
export function prepareFloorPhoto(img, turns = 0, max = 512) {
  const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height)), w = Math.max(8, Math.round((img.naturalWidth || img.width) * k)), h = Math.max(8, Math.round((img.naturalHeight || img.height) * k))
  const t = ((turns % 4) + 4) % 4, W = t % 2 ? h : w, H = t % 2 ? w : h, c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d'); g.translate(W / 2, H / 2); g.rotate((t * Math.PI) / 2); g.drawImage(img, -w / 2, -h / 2, w, h); g.setTransform(1, 0, 0, 1, 0, 0)
  // take the light out: every colour channel is divided by its own blurred version (an 8 pixel version of the picture, enlarged) and brought back to the average, so a sun streak, a shadow, a darker
  // corner or a warm patch next to a cool one does not repeat over the room; the grain and the boards stay
  const small = document.createElement('canvas'); small.width = 8; small.height = Math.max(2, Math.round((8 * H) / W)); small.getContext('2d').drawImage(c, 0, 0, small.width, small.height)
  const low = document.createElement('canvas'); low.width = W; low.height = H; const lg = low.getContext('2d'); lg.imageSmoothingEnabled = true; lg.imageSmoothingQuality = 'high'; lg.drawImage(small, 0, 0, W, H)
  const a = g.getImageData(0, 0, W, H), b = lg.getImageData(0, 0, W, H), pa = a.data, pb = b.data, mean = [0, 0, 0], n = pb.length / 4
  for (let i = 0; i < pb.length; i += 4) for (let q = 0; q < 3; q++) mean[q] += pb[i + q] / n
  for (let i = 0; i < pa.length; i += 4) for (let q = 0; q < 3; q++) pa[i + q] = Math.min(255, pa[i + q] * Math.min(2, Math.max(0.5, mean[q] / Math.max(16, pb[i + q]))))
  // seamless: each pixel is mixed with the pixel half a picture away, the more the nearer it is to an edge (nothing at all in the middle), and the contrast lost by mixing two different pixels is put back;
  // at the edges the picture is the shifted one, which is the same on both sides, so it repeats without a seam
  const src = new Uint8ClampedArray(pa), ramp = (t) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u) }, zone = 0.22
  for (let y = 0; y < H; y++) {
    const wy = ramp(Math.min(y + 0.5, H - y - 0.5) / (zone * H)), y2 = (y + (H >> 1)) % H
    for (let x = 0; x < W; x++) {
      const wx = ramp(Math.min(x + 0.5, W - x - 0.5) / (zone * W)), k = wx * wy, i = (y * W + x) * 4, j = (y2 * W + ((x + (W >> 1)) % W)) * 4, keep = 1 / Math.sqrt(k * k + (1 - k) * (1 - k))
      for (let q = 0; q < 3; q++) pa[i + q] = Math.min(255, Math.max(0, mean[q] + (k * src[i + q] + (1 - k) * src[j + q] - mean[q]) * keep))
    }
  }
  g.putImageData(a, 0, 0); return c
}
export async function loadFloorPhoto(url, turns = 0) {
  const key = photoKey(url, turns); if (floorPhotos.has(key)) return true
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  floorPhotos.set(key, prepareFloorPhoto(img, turns)); return true
}
const photoTex = new Map()
// widthCm: how many cm the LONGER side of the photo covers (so turning the photo does not change what the number means); null while the picture is not loaded yet (the scene then draws the usual floor)
export function floorPhotoTexture({ url, widthCm, turns = 0 }) {
  const c = floorPhotos.get(photoKey(url, turns)); if (!c) return null
  const key = photoKey(url, turns) + '|' + widthCm; if (photoTex.has(key)) return photoTex.get(key)
  const mpp = Math.max(0.1, widthCm / 100) / Math.max(c.width, c.height), wm = c.width * mpp, hm = c.height * mpp          // metres per pixel
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / wm, 1 / hm); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
  photoTex.set(key, tex); return tex
}
