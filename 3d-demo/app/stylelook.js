// "Match my property" for the browser scene: turns the style read from photos (lib/stylebook.js format, hex strings) into
// floor colours per room, a wall colour and a furniture palette per room, in the same room order the Blender renderer uses.
import { floorSpec } from '../layout/floorspec.js'
const KIND_OF = { living: 'living', hall: 'storage', corridor: 'storage', dining: 'kitchen', kitchen: 'kitchen', bedroom: 'bedroom', office: 'bedroom', bathroom: 'bathroom', wc: 'bathroom', storage: 'storage', balcony: 'balcony', terrace: 'balcony' }
export const kindOf = (room) => KIND_OF[room.type] || 'living'
const num = (h, d) => (typeof h === 'string' && /^#?[0-9a-f]{6}$/i.test(h) ? parseInt(h.replace('#', ''), 16) : d)

function inside(x, z, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}

// entry of the style for every room of the plan: the n-th room of a kind takes the n-th look of that kind (looks repeat)
export function entriesFor(plan, style) {
  const byKind = {}
  for (const r of style.rooms || []) (byKind[r.kind] ||= []).push(r)
  const seen = {}
  return plan.rooms.map((room) => {
    const k = kindOf(room), list = byKind[k], i = seen[k] || 0; seen[k] = i + 1
    return list ? list[i % list.length] : null
  })
}

// the floor of a flat is mostly one floor: a room the photos did not show takes the main floor they did show (the living room's, else a bedroom's, hall's or kitchen's; never a carpet or a wet room's tiles).
// Bathrooms and balconies keep their own floor unless they were photographed.
const DRY = ['living', 'kitchen', 'bedroom', 'storage']
function mainFloor(entries) {
  for (const k of ['living', 'bedroom', 'storage', 'kitchen']) { const e = entries.find((x) => x && x.kind === k && x.floor && x.floor.kind !== 'carpet'); if (e) return e.floor }
  return null
}

export function lookFromStyle(plan, style, { floorAll = true } = {}) {
  const entries = entriesFor(plan, style), main = floorAll ? mainFloor(style.rooms || []) : null
  const floorOf = (e, i) => (e ? e.floor : main && DRY.includes(kindOf(plan.rooms[i])) ? main : null)
  const floors = entries.map(floorOf)
  const first = (k) => (style.rooms || []).find((r) => r.kind === k)
  const living = first('living') || entries.find(Boolean)
  const palette = (e) => ({
    wood: num(e.wood_color, 0xc9a679), fabric: num(e.upholstery_color, 0xd9d5ca), fabric2: num(e.secondary_color, 0x9fb59a), accent: num(e.accent_color, 0x9fb59a), rug: num(e.rug_color, 0xe8e2d6), cab: num(e.cabinet_color, 0xece8de),
  })
  const pals = entries.map((e) => (e ? palette(e) : null))
  return {
    floors: floors.map((f) => (f ? num(f.color, null) : null)),
    floorKinds: floors.map((f) => (f ? f.kind || null : null)),          // herringbone, plank, tile, deck, carpet or stone: the 3D floor is drawn as that
    floorTiles: floors.map((f) => (f && Array.isArray(f.tile_cm) ? f.tile_cm : null)),
    floorSpecs: floors.map((f) => (f ? { ...floorSpec(f), color: num(f.color, null) } : null)),          // everything the 3D floor is drawn from (layout/floorspec.js)          // [width, length] in cm of a tile or plank when the photos showed it
    walls: entries.map((e) => (e ? num(e.wall_color, null) : null)),
    wall: living ? num(living.wall_color, null) : null,
    door: style.doors ? num(style.doors.color, null) : null,
    // furniture palette for a piece at (x, z): the palette of the room it stands in
    palFor(item) {
      const i = plan.rooms.findIndex((r) => inside(item.x, item.z, r.polygon))
      return (i >= 0 && pals[i]) || pals.find(Boolean) || null
    },
    noRug: entries.map((e) => !e || e.rug_color == null),
  }
}

// the close-up photos of the real floor the person added (room.floorPhotos: { url, widthCm, turns, rooms: '*' | a room id }): which one a room of the plan uses. One for a room by itself beats one for
// the rooms that share the main floor (living rooms, kitchens, bedrooms, halls: not bathrooms or balconies); of two for the same rooms the one added last wins
export function floorImagesFor(plan, photos = []) {
  const newest = [...photos].reverse()
  return plan.rooms.map((room) => {
    const p = newest.find((q) => q.rooms !== '*' && [].concat(q.rooms).includes(room.id)) || newest.find((q) => q.rooms === '*' && DRY.includes(kindOf(room)))
    return p ? { url: p.url, widthCm: p.widthCm, turns: p.turns || 0 } : null
  })
}

// short summary for the UI cards
export function summary(style) {
  return (style.rooms || []).map((r) => ({
    label: r.label, kind: r.kind,
    swatches: [['Floor', r.floor.color, r.floor.kind + (r.floor.tile_cm ? ` ${r.floor.tile_cm[0]}x${r.floor.tile_cm[1]} cm` : '')], ['Walls', r.wall_color, ''], ...(r.accent_wall_color ? [['Feature wall', r.accent_wall_color, r.accent_wall_note]] : []),
      ['Upholstery', r.upholstery_color, r.upholstery_material], ['Wood', r.wood_color, ''], ...(r.curtain_color ? [['Curtains', r.curtain_color, '']] : []), ['Cabinets', r.cabinet_color, '']],
    pieces: (r.furniture || []).map((f) => `${f.type}: ${f.material}`),
  }))
}
