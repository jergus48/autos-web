// The browser's furniture: every piece is the plain boxes defined in layout/catalog.js, at the size the layout engine measured.
// Local frame as in the catalogue (x width, z depth with the front at +z, y up); the piece group sits at (x, 0, z) turned by rot.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { partsOf, labelOf, modelOf } from '../layout/catalog.js'

// one colour palette for every arrangement: the options differ only in where the furniture stands
export const PALETTES = {
  A: { wood: 0xcaa77a, fabric: 0xd9d5ca, fabric2: 0x9fb59a, accent: 0x9fb59a, rug: 0xe8e2d6, cab: 0xece8de },
}
// option = one arrangement (rank 0, 1, 2 of the layout engine); the names shown to the client are written from the arrangement itself (app/story.js optionLabel)
export const OPTIONS = [
  { id: 'A', name: 'Arrangement A', blurb: 'The arrangement the measurements like best.', palette: 'A', rank: 0 },
  { id: 'B', name: 'Arrangement B', blurb: 'The same furniture and colours with the main pieces on another wall.', palette: 'A', rank: 1 },
  { id: 'C', name: 'Arrangement C', blurb: 'A third way to place the same furniture, with other walls for the main pieces.', palette: 'A', rank: 2 },
]

const mats = new Map()
// a part of a model made from pictures has its own colour
const paints = new Map(), tiles = new Map()
// a woven pattern for fabric: { kind: 'plaid', base, bands: [[color, share of the tile, strength]...], thin: color, size (metres per repeat) }, drawn on a small canvas
function tile(t) {
  const key = JSON.stringify(t)
  if (!tiles.has(key)) {
    const S = t.kind === 'grain' ? 256 : 128, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d')
    g.fillStyle = t.base; g.fillRect(0, 0, S, S)
    if (t.kind === 'grain') {          // the grain of wood: long wavy lines along u (they wrap, so the tile repeats without a seam), darker and lighter, a few thick ones
      let s = 7919; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
      for (let i = 0; i < 110; i++) {
        const y = rnd() * S, a = 0.05 + rnd() * 0.17, th = 0.6 + rnd() * (rnd() < 0.15 ? 3.2 : 1.4), ph = rnd() * 6.283, am = 0.8 + rnd() * 3.5, per = 1 + Math.floor(rnd() * 2), col = rnd() < 0.72 ? t.dark || '#000' : t.light || '#fff'
        g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = th
        for (const off of [-S, 0, S]) { g.beginPath(); for (let x = 0; x <= S; x += 8) { const yy = y + off + Math.sin((x / S) * 6.283 * per + ph) * am; x ? g.lineTo(x, yy) : g.moveTo(x, yy) } g.stroke() }
      }
      g.globalAlpha = 1
    }
    if (t.kind === 'plaid') {
      for (const [color, at, w, a] of t.bands || []) { g.globalAlpha = a ?? 0.75; g.fillStyle = color; g.fillRect(at * 128, 0, w * 128, 128); g.fillRect(0, at * 128, 128, w * 128) }
      g.globalAlpha = 0.9; g.fillStyle = t.thin || t.base; for (const at of [0.1, 0.62]) { g.fillRect(at * 128, 0, 2, 128); g.fillRect(0, at * 128, 128, 2) }
    }
    if (t.kind !== 'grain') { g.globalAlpha = 0.08; g.fillStyle = '#000'; for (let y = 0; y < 128; y += 2) g.fillRect(0, y, 128, 1) }          // the weave
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tiles.set(key, tex)
  }
  return tiles.get(key)
}
function paint(p) {
  const key = `${p.color}:${p.rough ?? 0.7}:${p.metal ?? 0}:${p.opacity ?? 1}:${p.texture ? JSON.stringify(p.texture) : ''}`
  if (!paints.has(key)) {
    const opts = { color: p.texture ? 0xffffff : new THREE.Color(p.color), roughness: p.rough ?? 0.7, metalness: p.metal ?? 0 }
    if (p.opacity != null && p.opacity < 1) { opts.transparent = true; opts.opacity = p.opacity; opts.depthWrite = false }          // glass
    if (p.texture) opts.map = tile(p.texture)
    paints.set(key, new THREE.MeshStandardMaterial(opts))
  }
  return paints.get(key)
}
// a part with a pattern gets texture coordinates in metres (one unit = one repeat of the pattern), taken from the face each vertex lies on, so the checks are the same size on every face
const patterned = new Map()
function patternedGeometry(p) {
  const size = p.texture.size || 0.2, grain = p.texture.kind === 'grain', key = `${p.shape}:${p.w.toFixed(3)}:${p.h.toFixed(3)}:${p.d.toFixed(3)}:${(p.r || 0).toFixed(3)}:${size}:${grain}`
  if (!patterned.has(key)) {
    const g = geometry(p.shape, p.w, p.h, p.d, p.r).clone(), pos = g.attributes.position, nor = g.attributes.normal, uv = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i))
      // grain of wood: on a top it runs along the long side, on a side or a front it runs up (like a door); a pattern is the same size on every face
      const [u, v] = grain ? (ay >= ax && ay >= az ? (p.w >= p.d ? [x, z] : [z, x]) : ax >= az ? [y, z] : [y, x]) : ay >= ax && ay >= az ? [x, z] : ax >= az ? [z, y] : [x, y]
      uv[i * 2] = u / size; uv[i * 2 + 1] = v / size
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); patterned.set(key, g)
  }
  return patterned.get(key)
}
function material(role, pal) {
  const key = role + ':' + JSON.stringify([pal.wood, pal.fabric, pal.fabric2, pal.rug, pal.cab, pal.dark, pal.top, pal.legs])
  if (mats.has(key)) return mats.get(key)
  const std = (color, rough = 0.8, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra })
  const m = {
    top: std(pal.top ?? pal.wood, 0.55), legs: std(pal.legs ?? pal.dark ?? 0x2a2b30, 0.6), woodGap: std(shade(pal.wood, 0.66), 0.9), bodyGap: std(shade(pal.fabric, 0.7), 0.9), cabGap: std(shade(pal.cab ?? 0xece8de, 0.7), 0.9),
    body: std(pal.fabric, 0.92), body2: std(pal.fabric2, 0.92), wood: std(pal.wood, 0.6), cab: std(pal.cab ?? 0xece8de, 0.55), rug: std(pal.rug, 1),
    dark: std(pal.dark ?? 0x2a2b30, 0.6), light: std(0xf4f2ee, 0.45), metal: std(0xc9ccd2, 0.35, 0.5), tv: std(0x0b0c0e, 0.2), water: std(0xcfe3ee, 0.1),
    glass: std(0xcfe0ea, 0.05, 0, { transparent: true, opacity: 0.3 }), plant: std(0x4f7f4a, 0.8), pot: std(0xb86f4d, 0.8),
  }[role] || std(0xff00ff)
  mats.set(key, m); return m
}

const geoCache = new Map()
function geometry(shape, w, h, d, r = 0) {
  const key = `${shape}:${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`
  if (!geoCache.has(key)) geoCache.set(key, shape === 'cyl' ? new THREE.CylinderGeometry(w / 2, w / 2, h, 20) : shape === 'rbox' ? new RoundedBoxGeometry(w, h, d, 3, Math.max(0.002, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3))) : new THREE.BoxGeometry(w, h, d))
  return geoCache.get(key)
}

// a small floating name tag over a piece, like the reference drawing's 3D labels
const tagCache = new Map()
function nameTag(text, height) {
  if (!tagCache.has(text)) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d')
    let size = 28; x.font = `600 ${size}px Segoe UI, Arial`
    while (size > 14 && x.measureText(text).width > 220) { size -= 2; x.font = `600 ${size}px Segoe UI, Arial` }          // a long product name gets a smaller font instead of being cut
    const w = Math.min(244, x.measureText(text).width + 24)
    x.fillStyle = 'rgba(20,24,26,.82)'; x.beginPath(); x.roundRect((256 - w) / 2, 10, w, 44, 10); x.fill()
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33)
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tagCache.set(text, tex)
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagCache.get(text), transparent: true, depthTest: false }))
  sp.scale.set(0.8, 0.2, 1); sp.position.y = height; sp.renderOrder = 12; return sp
}

// the colour read from a product page goes on the part of the piece that is that colour: the cloth of a sofa, the frame or top of wooden furniture, the doors of a cupboard
const FINISH_ROLE = { sofa: 'fabric', armchair: 'fabric', outdoor_sofa: 'fabric', product: 'fabric', rug: 'rug', wardrobe: 'cab', shoe_cabinet: 'cab', fridge: 'cab', washer: 'cab' }
// wood-coloured: a warm hue that is not too pale, too dark or grey. Such parts get the grain of wood; white, grey and black ones are painted
const hexStr = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0')
export function woodish(hex) {
  const o = {}; new THREE.Color(hex).getHSL(o, THREE.SRGBColorSpace)
  const deg = o.h * 360; return deg >= 12 && deg <= 52 && o.s >= 0.2 && o.l >= 0.22 && o.l <= 0.86
}
const TOPPED = new Set(['sideboard', 'tv_unit', 'nightstand', 'kitchen_island', 'desk', 'dining_table', 'coffee_table', 'side_table', 'wardrobe', 'shoe_cabinet', 'product'])
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return c.getHex() }
// finish.hex: the main colour (read from the picture or the name of the product), finish.hex2: legs, frame and handles
export function finishOf(item, pal) {
  const f = item.finish, main = Number.isFinite(f?.hex), second = Number.isFinite(f?.hex2)
  if (!main && !second) return pal
  const out = { ...pal }, role = FINISH_ROLE[item.type] || 'wood'
  if (main) {
    if (role === 'fabric') { out.fabric = f.hex; out.fabric2 = shade(f.hex, 0.88) } else out[role] = f.hex
    if (item.type === 'bed') { out.fabric = f.hex; out.fabric2 = shade(f.hex, 0.9); out.wood = second ? f.hex2 : f.hex }          // headboard and duvet in the main colour, the frame in the second
    if (item.type === 'chair') out.fabric2 = f.hex                                                                            // the seat
  }
  if (second && item.type !== 'bed') out.dark = f.hex2
  if (TOPPED.has(item.type)) {          // main = the body or frame; a wood-coloured second colour on a body that is not wood is the top plate (a white cabinet with an oak top); otherwise the second colour is legs and details, and with none the legs match the body
    const body = main ? f.hex : pal[role], topOnTop = second && !woodish(body) && woodish(f.hex2)
    out.top = topOnTop ? f.hex2 : body; out.legs = second && !topOnTop ? f.hex2 : body
  }
  return out
}
const tagText = (s) => (s.length > 24 ? s.slice(0, 23).trimEnd() + '…' : s)

export function buildPiece(item, pal, { label = false, windows = null } = {}) {
  const g = new THREE.Group()
  const modelled = Boolean(modelOf(item))
  if (!modelled) pal = finishOf(item, pal)          // (a model made from pictures has its own colours)
  for (let p of partsOf(item, windows ? { windows } : undefined)) {
    if (!modelled) {          // the shapes of a type: edges that catch the light (a small bevel on every box that is thick enough) and the grain of wood on wood-coloured parts
      const m = Math.min(p.w, p.h, p.d)
      if (p.shape === 'box' && m >= 0.018) p = { ...p, shape: 'rbox', r: Math.min(0.006, m * 0.2) }
      const c = p.role === 'top' ? pal.top ?? pal.wood : p.role === 'wood' ? pal.wood : null
      if (c !== null && woodish(c)) p = { ...p, color: hexStr(c), rough: 0.55, texture: { kind: 'grain', base: hexStr(c), dark: hexStr(shade(c, 0.8)), light: hexStr(shade(c, 1.12)), size: 0.55 } }
    }
    const mesh = new THREE.Mesh(p.texture ? patternedGeometry(p) : geometry(p.shape, p.w, p.h, p.d, p.r), p.color ? paint(p) : material(p.role, pal))
    mesh.position.set(p.x, p.y + p.h / 2, p.z)
    if (p.rx || p.ry || p.rz) mesh.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0)
    mesh.castShadow = p.role !== 'glass' && !(p.opacity != null && p.opacity < 0.7); mesh.receiveShadow = true
    g.add(mesh)
  }
  if (label && item.type !== 'rug' && Math.min(item.w, item.d) >= 0.34) { const t = nameTag(tagText(item.product?.name || labelOf(item.type)), item.h + 0.22); g.add(t) }
  g.position.set(item.x, 0, item.z); g.rotation.y = item.rot; g.userData = { id: item.id, type: item.type }
  return g
}

// items: the layout engine's pieces; look (optional): a style read from photos with palFor(item) -> palette
export function buildPieces(items, palette, look = null, { labels = false, space = null } = {}) {
  const group = new THREE.Group(), base = PALETTES[palette] || PALETTES.A
  for (const it of items) group.add(buildPiece(it, look?.palFor?.(it) ? { ...base, ...look.palFor(it) } : base, { label: labels, windows: space && Number.isInteger(it.room) ? space.rooms[it.room]?.windows : null }))
  return group
}
