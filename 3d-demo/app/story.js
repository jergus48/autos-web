// The words and numbers of a layout page, written from the measurements: the facts about the room, four short answers to the questions
// that decide a layout, pros and cons, a comparison table and the list of pieces. Nothing here is guessed; everything comes from the
// items and the validator's checks.
import { front } from '../layout/geom.js'
import { roomSig } from '../layout/variants.js'
import { labelOf, TYPES } from '../layout/catalog.js'
import { around } from '../layout/edit.js'
import { isSliding, isDouble } from '../layout/planedit.js'

const cm = (m) => Math.round(m * 100)
const fmtM = (m) => (m >= 1 ? `${m.toFixed(2).replace(/\.?0+$/, '')} m` : `${cm(m)} cm`)
export const compass = (n) => (n[1] > 0.7 ? 'north' : n[1] < -0.7 ? 'south' : n[0] > 0.7 ? 'west' : 'east')          // plan z grows to the south, so a wall whose inside is towards +z is the north wall
const frontOf = (it) => front(it.rot)

export function roomFacts(plan, space, i) {
  const r = space.rooms[i], b = r.bb, wins = r.windows, doors = r.doors
  if (r.outdoor) {          // an outdoor area: a railing instead of walls, no ceiling, a way in from the house
    const rail = r.edges.filter((e) => e.rail).reduce((s, e) => s + e.len, 0), wall = r.edges.filter((e) => !e.rail).reduce((s, e) => s + e.len, 0), nm = (k) => space.rooms[k]?.name || 'the house'
    const ways = [...doors.map((d) => `${d.kind === 'door' ? (isSliding(d) ? 'a sliding door' : isDouble(d) ? 'a double door' : 'a door') : 'an opening'} ${cm(d.width)} cm wide to ${nm(d.other)}`), ...wins.filter((w) => w.other !== null).map((w) => `glazing ${cm(w.width)} cm wide to ${nm(w.other)}`)]
    const text = `${r.name} is an outdoor area, ${b.w.toFixed(2)} × ${b.d.toFixed(2)} m (${r.area.toFixed(1)} m² of floor). ` +
      (rail > 0 ? `${rail.toFixed(1)} m of its edge is railing${wall > 0 ? ` and ${wall.toFixed(1)} m is the house wall` : ''}. ` : '') +
      (ways.length ? `It connects to the house through ${ways.join(' and ')}. ` : 'No way in from the house was found in the plan. ') +
      'Chairs, tables and benches keep at least 40 cm from the railing, because children climb them. Everything below is measured from the plan: sizes are real furniture sizes, and every distance is a measurement, not a guess.'
    return { eyebrow: `${r.name} · outdoor · ${b.w.toFixed(2)} × ${b.d.toFixed(2)} m · ${r.area.toFixed(1)} m²`.toUpperCase(), text }
  }
  const nb = (d) => space.rooms.find((x) => x !== r && x.doors.some((y) => y.id === d.id))?.name || 'outside'
  const bits = [`${b.w.toFixed(2)} × ${b.d.toFixed(2)} m`, `${r.area.toFixed(1)} m²`]
  const text = `${r.name} measures ${b.w.toFixed(2)} × ${b.d.toFixed(2)} m at its widest (${r.area.toFixed(1)} m² of floor). ` +
    (wins.length ? `It has ${wins.length} window${wins.length > 1 ? 's' : ''} (${wins.map((w) => cm(w.width) + ' cm').join(', ')} wide, sill at ${wins.map((w) => cm(w.sill)).filter((v, k, a) => a.indexOf(v) === k).join(' and ')} cm). ` : 'It has no window. ') +
    (doors.length ? `${doors.length === 1 ? 'The way in is' : 'The ways in are'} ${doors.map((d) => `${d.kind === 'door' ? 'a door' : 'an opening'} ${cm(d.width)} cm wide to ${nb(d)}`).join(' and ')}. ` : 'No door was found in the plan for this room. ') +
    'Everything below is measured from the plan: sizes are real furniture sizes, and every distance is a measurement, not a guess.'
  return { eyebrow: `${space.rooms[i].name} · ${bits.join(' · ')}`.toUpperCase(), text }
}

const first = (items, t) => items.find((i) => i.type === t)
const all = (items, t) => items.filter((i) => i.type === t)
const val = (rep, i, rule, f = () => true) => (rep?.checks || []).filter((c) => c.room === i && c.rule === rule && f(c))

export function keyCards(kind, items, rep, space, i) {
  const room = space.rooms[i], mine = items.filter((x) => x.room === i && !x.floor)
  const walk = val(rep, i, 'walk').map((c) => c.value), narrow = walk.length ? Math.min(...walk) : null
  const walkCard = { q: 'How much walking space?', a: narrow === null || narrow >= 9 ? 'Open floor' : `${cm(narrow)} cm at the narrowest`, sub: 'From the door to every piece. 60 cm is the minimum, 90 cm is comfortable.' }
  const cards = []
  if (room.outdoor) {
    const table = first(mine, 'outdoor_table') || first(mine, 'bistro_table'), chairs = mine.filter((x) => x.type === 'chair' && table && Math.hypot(x.x - table.x, x.z - table.z) < Math.max(table.w, table.d) / 2 + 0.7).length
    const sofa = first(mine, 'outdoor_sofa'), arm = all(mine, 'armchair').length, lounge = all(mine, 'lounger').length, plants = all(mine, 'planter').length + all(mine, 'plant').length
    const kd = room.doors.concat(room.windows).find((d) => d.otherKind === 'kitchen'), td = table && kd ? Math.hypot(table.x - kd.at[0], table.z - kd.at[1]) : null
    cards.push({ q: 'Where do we eat outside?', a: table ? `${chairs} seat${chairs === 1 ? '' : 's'} at a ${cm(table.w)} × ${cm(table.d)} table` : 'No dining set', sub: table ? `${td !== null ? `${td.toFixed(1)} m from the kitchen. ` : ''}${table.type === 'outdoor_table' ? '95 cm of free floor all round at the least, so a chair can be pulled out and a person can walk past.' : 'A small table with its chairs along the house wall.'}` : 'The area is too small or too busy for a table.' })
    cards.push({ q: 'Where do we relax?', a: sofa ? `Sofa ${cm(sofa.w)} cm${arm ? ` + ${arm} armchair${arm > 1 ? 's' : ''}` : ''}${lounge ? ` + ${lounge} lounger${lounge > 1 ? 's' : ''}` : ''}` : lounge ? `${lounge} sun lounger${lounge > 1 ? 's' : ''}` : 'No lounge', sub: sofa ? `Seats ${Math.floor(sofa.w / 0.7) + arm + lounge}, with a coffee table in reach and 45 cm in front of the sofa.` : lounge ? 'Away from the doors.' : 'Add one from the list above.' })
    cards.push({ q: 'What else is out here?', a: [first(mine, 'grill') ? 'A grill' : '', first(mine, 'deck_box') ? 'a storage bench' : '', all(mine, 'planter').length ? `${all(mine, 'planter').length} planter${all(mine, 'planter').length > 1 ? 's' : ''}` : '', all(mine, 'plant').length ? `${all(mine, 'plant').length} potted plant${all(mine, 'plant').length > 1 ? 's' : ''}` : ''].filter(Boolean).join(', ') || 'Nothing more', sub: first(mine, 'grill') ? 'The grill stands by the house wall, at least 1 m from the table.' : 'The floor stays free.' })
    cards.push(walkCard)
  } else if (kind === 'living') {
    const tv = first(mine, 'tv_unit'), sofa = first(mine, 'sofa'), arm = all(mine, 'armchair').length, tab = first(mine, 'coffee_table')
    const view = val(rep, i, 'view')[0], gapc = val(rep, i, 'coffee-gap')[0]
    cards.push({ q: 'Where does the TV go?', a: tv ? `On the ${compass(frontOf(tv))} wall` : 'No TV wall fits', sub: view?.value !== undefined ? `The sofa is ${cm(view.value)} cm from the screen. Comfortable is 180 to 330 cm.` : 'No sofa faces it.' })
    cards.push({ q: 'Where do we sit?', a: sofa ? `Sofa ${cm(sofa.w)} cm${arm ? ` + ${arm} armchair${arm > 1 ? 's' : ''}` : ''}` : 'No seating', sub: sofa ? `Seats ${Math.floor(sofa.w / 0.7) + arm}. ${tab && gapc ? `The coffee table is ${cm(gapc.value)} cm from the sofa.` : ''}` : '' })
    cards.push(walkCard)
    const extra = [all(mine, 'dining_table').length ? `a dining table for ${all(mine, 'chair').length}` : '', first(mine, 'counter') ? 'a kitchen run' : '', first(mine, 'sideboard') ? 'a sideboard' : '', first(mine, 'floor_lamp') ? 'a floor lamp' : ''].filter(Boolean)
    cards.push({ q: 'What else fits?', a: extra.length ? extra[0][0].toUpperCase() + extra[0].slice(1) : 'Nothing more is needed', sub: extra.slice(1).length ? 'Also ' + extra.slice(1).join(', ') + '.' : 'The floor stays free.' })
  } else if (kind === 'bedroom') {
    const bed = first(mine, 'bed'), wd = first(mine, 'wardrobe'), desk = first(mine, 'desk')
    const sides = val(rep, i, 'clear', (c) => c.type === 'bed' && (c.side === 'left' || c.side === 'right')).map((c) => cm(c.value))
    cards.push({ q: 'Where does the bed go?', a: bed ? `Head on the ${compass(frontOf(bed))} wall` : 'No bed fits', sub: bed ? `${Math.round((bed.w - 0.1) * 100)} cm mattress. Free floor at the sides: ${sides.map((v) => v + ' cm').join(' and ')}. You need 50, 60 is comfortable.` : '' })
    cards.push({ q: 'Where is the storage?', a: wd ? `Wardrobe ${cm(wd.w)} cm on the ${compass(frontOf(wd))} wall` : 'No wardrobe fits', sub: wd ? 'Its doors open into at least 70 cm of free floor.' : '' })
    cards.push({ q: 'Work or read?', a: desk ? `Desk ${cm(desk.w)} cm` : 'No desk', sub: desk ? 'With a chair, and 70 cm behind it to sit down.' : 'The room is too small or too busy for one.' })
    cards.push(walkCard)
  } else if (kind === 'kitchen' || (room.kitchen && mine.some((x) => x.type === 'counter'))) {
    const runs = all(mine, 'counter'), table = first(mine, 'dining_table'), chairs = all(mine, 'chair').length
    const tri = val(rep, i, 'work-triangle')[0], sep = val(rep, i, 'sink-hob')[0]
    const metres = runs.reduce((s, r) => s + r.w, 0)
    let shape = 'No kitchen run'
    if (runs.length === 1) shape = `One straight run, ${metres.toFixed(1)} m`
    if (runs.length >= 2) { const d = (a, b) => { const f1 = frontOf(a), f2 = frontOf(b); return f1[0] * f2[0] + f1[1] * f2[1] }; shape = Math.abs(d(runs[0], runs[1])) < 0.3 ? `L-shaped run, ${metres.toFixed(1)} m` : `Two facing runs, ${metres.toFixed(1)} m` }
    cards.push({ q: 'What shape is the kitchen?', a: shape, sub: 'Base units 60 cm deep, with the fridge at the end of the run.' })
    cards.push({ q: 'Where does the table go?', a: table ? 'Clear of the kitchen units' : 'No room for a table here', sub: table ? 'At least 110 cm between the units and the table edge, so a chair can be pulled out.' : 'It would block the kitchen.' })
    cards.push({ q: 'How many chairs?', a: table ? `${chairs} at a ${cm(table.w)} × ${cm(table.d)} table` : 'None', sub: table ? 'Chairs are 45 × 50 cm.' : '' })
    cards.push({ q: 'How much worktop?', a: runs.length ? `${metres.toFixed(1)} m of base units` : 'None', sub: tri ? `Work triangle ${tri.value.toFixed(1)} m (3.6 to 7.9 is comfortable)${sep ? `, sink to hob ${cm(sep.value)} cm` : ''}.` : '' })
  } else {
    const names = [...new Set(mine.map((x) => labelOf(x.type)))]
    cards.push({ q: 'What is in here?', a: names.length ? `${mine.length} piece${mine.length > 1 ? 's' : ''}` : 'Empty', sub: names.slice(0, 5).join(', ') + '.' })
    const big = [...mine].sort((a, b) => b.w * b.d - a.w * a.d)[0]
    cards.push({ q: 'The biggest piece?', a: big ? `${labelOf(big.type)}, ${cm(big.w)} × ${cm(big.d)} cm` : 'None', sub: big ? `Against the ${compass(frontOf(big))} wall.` : '' })
    cards.push(walkCard)
    const tight = (rep?.checks || []).filter((c) => c.room === i && c.level !== 'ok').length
    cards.push({ q: 'Anything tight?', a: tight ? `${tight} spot${tight > 1 ? 's' : ''}` : 'Nothing', sub: tight ? 'Listed under the checks below.' : 'Every distance is at or above the comfortable value.' })
  }
  return cards.slice(0, 4)
}

export function flatCards(items, rep, space) {
  const real = items.filter((i) => !i.floor), rooms = new Set(real.map((i) => i.room)), c = rep?.counts || { error: 0, warn: 0, ok: 0 }
  const walk = (rep?.checks || []).filter((k) => k.rule === 'walk').map((k) => k.value), narrow = walk.length ? Math.min(...walk) : null
  const biggest = [...space.rooms].sort((a, b) => b.area - a.area)[0]
  return [
    { q: 'What is furnished?', a: (() => { const out = space.rooms.filter((r) => r.outdoor && rooms.has(r.i)).length; return `${rooms.size - out} rooms${out ? ` and ${out} outdoor area${out > 1 ? 's' : ''}` : ''}, ${real.length} pieces` })(), sub: 'Every piece is a real size from the catalogue.' },
    { q: 'Anything wrong?', a: c.error ? `${c.error} problem${c.error > 1 ? 's' : ''}` : 'No problems', sub: c.error ? 'Pick the room to see them.' : 'Nothing overlaps, blocks a door or a window, or cuts off a route.' },
    { q: 'How much walking space?', a: narrow === null || narrow >= 9 ? 'Open floor' : `${cm(narrow)} cm at the narrowest`, sub: '60 cm is the minimum, 90 cm is comfortable.' },
    { q: 'The biggest room?', a: biggest ? `${biggest.name}, ${biggest.area.toFixed(1)} m²` : '–', sub: `${c.warn} tight spot${c.warn === 1 ? '' : 's'} in the flat.` },
  ]
}
const PRO = {
  view: (c) => `The TV is ${cm(c.value)} cm from the sofa, inside the comfortable 180 to 330 cm`,
  'view-centre': (c) => (c.value <= 0.1 ? 'The sofa sits on the centre line of the TV' : `The sofa is within ${cm(c.value)} cm of the TV's centre line`),
  'coffee-gap': (c) => `The coffee table is ${cm(c.value)} cm from the sofa, within easy reach`,
  seats: (c) => `A dining table with ${c.value} chairs`,
  'kitchen-table': (c) => `${cm(c.value)} cm between the kitchen units and the table, enough to pull a chair out`,
  'work-triangle': (c) => `A work triangle of ${c.value.toFixed(1)} m between sink, hob and fridge`,
  'sink-hob': (c) => `${cm(c.value)} cm of worktop between the sink and the hob`,
  passage: (c) => (c.value >= 9 ? 'The doors connect across open floor' : `Between the doors the way is ${cm(c.value)} cm wide at the narrowest`),
}
export function prosCons(rep, i) {
  const mine = (rep?.checks || []).filter((c) => i === null || c.room === i)
  const pros = Object.keys(PRO).flatMap((r) => mine.filter((c) => c.rule === r && c.level === 'ok' && c.value !== undefined)).map((c) => PRO[c.rule](c))
  const clear = mine.filter((c) => c.rule === 'clear' && c.level === 'ok').length
  if (clear) pros.push(`${clear} spots have all the clear space they need`)
  const bad = [...mine.filter((c) => c.level === 'error'), ...mine.filter((c) => c.level === 'warn')].map((c) => c.label)
  return { pros: pros.slice(0, 5), cons: bad.slice(0, 5) }
}
export const score = (rep, i) => { const m = (rep?.checks || []).filter((c) => i === null || c.room === i); return m.filter((c) => c.level === 'error').length * 100 + m.filter((c) => c.level === 'warn').length * 3 - m.filter((c) => c.level === 'ok').length * 0.1 }

// a short name for an arrangement of one room, written from where the main pieces stand (null when there is nothing to say)
const near = (a) => (a.value < 0.2 && a.what === 'wall')
export function optionLabel(kind, items, space, i) {
  const mine = items.filter((x) => x.room === i && !x.floor)
  const wall = (it) => compass(frontOf(it)) + ' wall'
  if (kind === 'living') {
    const tv = first(mine, 'tv_unit'), sofa = first(mine, 'sofa'); if (!tv) return null
    const back = sofa && around(space, items, sofa).find((a) => a.side === 'back')
    return `TV on the ${wall(tv)}${sofa ? (back && near(back) ? ', sofa against the wall' : ', sofa in the room') : ''}`
  }
  if (kind === 'bedroom') { const bed = first(mine, 'bed'); return bed ? `Bed head on the ${wall(bed)}` : null }
  if (kind === 'kitchen') {
    const runs = all(mine, 'counter'); if (!runs.length) return null
    const longest = [...runs].sort((a, b) => b.w - a.w)[0]
    if (runs.length === 1) return `Straight run on the ${wall(longest)}`
    const d = frontOf(runs[0])[0] * frontOf(runs[1])[0] + frontOf(runs[0])[1] * frontOf(runs[1])[1]
    return Math.abs(d) < 0.3 ? `L-shaped run, longest side on the ${wall(longest)}` : 'Two facing runs'
  }
  if (kind === 'bathroom' || kind === 'wc') { const t = first(mine, 'toilet'); return t ? `Toilet on the ${wall(t)}` : null }
  if (kind === 'hall') { const s = first(mine, 'shoe_cabinet'); return s ? `Shoe cabinet on the ${wall(s)}` : null }
  if (kind === 'terrace' || kind === 'balcony') {
    const sofa = first(mine, 'outdoor_sofa'), table = first(mine, 'outdoor_table') || first(mine, 'bistro_table'), r = space.rooms[i], b = r.bb
    const end = table ? (b.w >= b.d ? (table.x < b.x0 + b.w / 2 ? 'west' : 'east') : (table.z < b.z0 + b.d / 2 ? 'north' : 'south')) : null
    if (sofa) return `Lounge on the ${wall(sofa)}${end ? `, dining at the ${end} end` : ''}`
    if (table) return table.type === 'bistro_table' ? `Table on the ${wall(table)}` : `Dining set at the ${end} end`
    return null
  }
  return null
}
// does this room look the same in two arrangements? (layout/variants.js; every room gets three that differ, so this only says "same" for a room with nothing to arrange)
export { roomSig }

// rows of the comparison table for one room: each cell is { text, level }
export function compareRows(kind, variants, i) {
  const cell = (c, f) => (c ? { text: f(c), level: c.level } : { text: '–', level: 'none' })
  const per = (v, rule, f = (c) => c) => val(v.rep, i, rule).map(f)
  const rows = [['Problems', (v) => { const e = (v.rep.checks || []).filter((c) => c.room === i && c.level === 'error').length; return { text: e ? String(e) : 'none', level: e ? 'error' : 'ok' } }],
    ['Tight spots', (v) => { const w = (v.rep.checks || []).filter((c) => c.room === i && c.level === 'warn').length; return { text: w ? String(w) : 'none', level: w ? 'warn' : 'ok' } }]]
  const row = (label, rule, f, pick = (a) => a[0]) => rows.push([label, (v) => { const a = per(v, rule); return a.length ? cell(pick(a), f) : { text: '–', level: 'none' } }])
  const worst = (a) => a.sort((x, y) => (x.level === y.level ? x.value - y.value : x.level === 'error' ? -1 : y.level === 'error' ? 1 : x.level === 'warn' ? -1 : 1))[0]
  if (kind === 'living') { row('TV to sofa', 'view', (c) => cm(c.value) + ' cm'); row('Sofa off the TV centre line', 'view-centre', (c) => cm(c.value) + ' cm'); row('Sofa to coffee table', 'coffee-gap', (c) => cm(c.value) + ' cm'); row('Narrowest way to a piece', 'walk', (c) => (c.value >= 9 ? 'open' : cm(c.value) + ' cm'), (a) => worst(a)); row('Dining chairs', 'seats', (c) => String(c.value)) }
  else if (kind === 'bedroom') { rows.push(['Bed: free at the sides', (v) => { const a = val(v.rep, i, 'clear', (c) => c.type === 'bed' && (c.side === 'left' || c.side === 'right')); if (!a.length) return { text: '–', level: 'none' }; const w = a.sort((x, y) => x.value - y.value)[0]; return { text: a.map((c) => cm(c.value)).join(' / ') + ' cm', level: w.level } }]); row('Wardrobe: free in front', 'clear', (c) => cm(c.value) + ' cm', (a) => a.find((c) => c.type === 'wardrobe') || a[0]); row('Narrowest way to a piece', 'walk', (c) => (c.value >= 9 ? 'open' : cm(c.value) + ' cm'), (a) => worst(a)) }
  else if (kind === 'kitchen') { row('Base units', 'kitchen-length', (c) => c.value.toFixed(1) + ' m'); row('Work triangle', 'work-triangle', (c) => c.value.toFixed(1) + ' m'); row('Sink to hob', 'sink-hob', (c) => cm(c.value) + ' cm'); row('Units to table', 'kitchen-table', (c) => cm(c.value) + ' cm'); row('Dining chairs', 'seats', (c) => String(c.value)); row('Narrowest way to a piece', 'walk', (c) => (c.value >= 9 ? 'open' : cm(c.value) + ' cm'), (a) => worst(a)) }
  else if (kind === 'terrace' || kind === 'balcony') { row('Dining seats', 'seats', (c) => String(c.value)); row('Nearest chair or table to the railing', 'rail-climb', (c) => cm(c.value) + ' cm', (a) => [...a].sort((x, y) => x.value - y.value)[0]); row('Narrowest way to a piece', 'walk', (c) => (c.value >= 9 ? 'open' : cm(c.value) + ' cm'), (a) => worst(a)) }
  else row('Narrowest way to a piece', 'walk', (c) => (c.value >= 9 ? 'open' : cm(c.value) + ' cm'), (a) => worst(a))
  rows.push(['Pieces', (v) => ({ text: String(v.items.filter((x) => x.room === i && !x.floor).length), level: 'none' })])
  return rows.map(([label, f]) => ({ label, cells: variants.map(f) }))
}

// the list of pieces with real sizes and where they stand (like the reference's module list)
export function piecesRows(items, space, i) {
  const mine = items.filter((x) => x.room === i && !x.floor)
  const groups = new Map()
  for (const it of mine) { const k = it.type + '|' + cm(it.w) + 'x' + cm(it.d) + '|' + (it.product?.id || ''); const g = groups.get(k) || { it, n: 0 }; g.n++; groups.set(k, g) }
  return [...groups.values()].map(({ it, n }) => {
    const back = around(space, items, it).find((a) => a.side === 'back'), wall = back && back.value < 0.2 && back.what === 'wall' ? `against the ${compass(frontOf(it))} wall` : 'in the room'
    return { name: (n > 1 ? n + ' × ' : '') + (it.product?.name ? `${it.product.fullName || it.product.name} (${labelOf(it.type).toLowerCase()})` : labelOf(it.type)), size: `${cm(it.w)} × ${cm(it.d)} × ${cm(it.h)} cm`, where: wall }
  })
}
void TYPES; void fmtM
