// What the 3D floor of a room is drawn from. The photo reading (lib/stylebook.js) describes a floor as { kind, color, tile_cm, layout, shade_variation, grain, gloss, joint_color, note };
// floorSpec cleans that up (a reading made before these fields existed, or written by hand, has fewer of them) and floorPlan works out the geometry of the texture that is drawn from it
// (viewer/floortex.js): how many metres one picture covers across and down, and whether it is turned.
export const FLOOR_KINDS = ['herringbone', 'chevron', 'plank', 'tile', 'deck', 'carpet', 'stone']
export const LAYOUTS = ['straight', 'staggered', 'diagonal']

// what a floor of each kind is like when the reading does not say
const DEFAULTS = {
  plank: { layout: 'staggered', shade: 0.45, grain: 0.5, gloss: 0.35 }, herringbone: { layout: 'straight', shade: 0.5, grain: 0.5, gloss: 0.35 }, chevron: { layout: 'straight', shade: 0.45, grain: 0.5, gloss: 0.35 },
  tile: { layout: 'straight', shade: 0.25, grain: 0, gloss: 0.6 }, stone: { layout: 'straight', shade: 0.45, grain: 0.5, gloss: 0.55 }, deck: { layout: 'staggered', shade: 0.4, grain: 0.4, gloss: 0.15 }, carpet: { layout: 'straight', shade: 0.3, grain: 0.5, gloss: 0 },
}
// the kind of floor of a room when nothing is known about it (the type of the room decides)
export const usualKind = (roomType) => ({ bathroom: 'tile', balcony: 'deck' }[roomType] || (['living', 'kitchen', 'bedroom', 'hall', 'storage', 'office'].includes(roomType) ? 'plank' : null))

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const unit = (v, d) => (Number.isFinite(v) ? clamp(v, 0, 1) : d)
const hex = (h) => (typeof h === 'string' && /^#?[0-9a-f]{6}$/i.test(h) ? parseInt(h.replace('#', ''), 16) : null)
const pos = (v) => (Number.isFinite(v) && v > 0 ? v : null)

export function floorSpec(f, fallbackKind = 'plank') {
  const kind = FLOOR_KINDS.includes(f?.kind) ? f.kind : fallbackKind, d = DEFAULTS[kind]
  const tc = Array.isArray(f?.tile_cm) ? f.tile_cm : [], cm = pos(tc[0]) ? [pos(tc[0]), pos(tc[1])] : null          // [width, length] of a board or tile in cm (the length may be unknown)
  return {
    kind, cm, layout: LAYOUTS.includes(f?.layout) ? f.layout : d.layout,
    shade: unit(f?.shade_variation, d.shade), grain: unit(f?.grain, d.grain), gloss: unit(f?.gloss, d.gloss), joint: hex(f?.joint_color), color: hex(f?.color),
  }
}

// the geometry of the texture of a floor: worldX and worldY are the metres that the picture covers across and down (it repeats), rotate turns it in the room
// (a diagonal floor, a herringbone), and the numbers of boards or tiles in it. All of it is chosen so that the picture repeats without a seam.
export function floorPlan(spec) {
  const s = spec, w = (s.cm?.[0] || 0) / 100, l = (s.cm?.[1] || 0) / 100, out = { kind: s.kind, rotate: 0 }
  if (s.kind === 'tile' || s.kind === 'stone') {
    const tw = clamp(w || (s.kind === 'stone' ? 0.6 : 0.3), 0.1, 1.2), th = clamp(l || tw, 0.1, 1.2)
    const nx = clamp(Math.round(1.2 / tw), 2, 8)          // at least 2 x 2 tiles in a picture, so that their shades can differ
    let ny = clamp(Math.round(1.2 / th), 2, 8); if (s.layout === 'staggered' && ny % 2) ny++          // a brick bond needs an even number of rows to repeat
    return { ...out, tw, th, nx, ny, worldX: nx * tw, worldY: ny * th, rotate: s.layout === 'diagonal' ? Math.PI / 4 : 0 }
  }
  if (s.kind === 'herringbone') {
    const bw = clamp(w || 0.075, 0.03, 0.2), K = clamp(Math.round((l || bw * 4) / bw), 3, 8)          // boards K times as long as wide: the pattern repeats every 2K boards' widths
    return { ...out, bw, K, worldX: 2 * K * bw, worldY: 2 * K * bw, rotate: Math.PI / 4 }
  }
  if (s.kind === 'chevron') {
    const bw = clamp(w || 0.075, 0.03, 0.2), L = clamp(l || 0.4, 0.15, 1), run = L / Math.SQRT2, t = bw * Math.SQRT2, n = clamp(Math.round(1.2 / t), 2, 12)          // boards at 45 degrees, ends cut straight
    return { ...out, bw, L, run, t, n, worldX: 2 * run, worldY: n * t }
  }
  if (s.kind === 'carpet') return { ...out, worldX: 1.2, worldY: 1.2 }
  const bw = clamp(w || (s.kind === 'deck' ? 0.14 : 0.19), 0.04, 0.4), L = clamp(l || 1.2, 0.2, 2.4), rows = clamp(Math.round(1.2 / bw), 2, 14), cols = clamp(Math.round(1.2 / L), 1, 6)
  return { ...out, bw, L, rows, cols, worldX: cols * L, worldY: rows * bw, rotate: s.layout === 'diagonal' ? Math.PI / 4 : 0 }
}

// a grey for the joints of a floor whose joint colour is known, in the scale of the texture (which is multiplied with the colour of the floor)
export function jointGrey(spec, base = 236) {
  if (spec.joint === null || spec.color === null) return null
  const lum = (n) => 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
  return clamp(Math.round((base * (lum(spec.joint) + 8)) / (lum(spec.color) + 8)), 15, 255)
}
