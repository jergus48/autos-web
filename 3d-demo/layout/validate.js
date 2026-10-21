// Independent check of a layout: takes a plan and a list of placed pieces (from the engine or from anywhere else) and measures everything
// from the geometry alone: fit inside the room, overlaps, doors, windows, clear space around every piece, walking widths, and the
// distances that matter (sofa to TV, coffee table gap, bed sides, dining chairs, kitchen aisle and work triangle).
// Every check carries the measured value and the limit, level 'error' (breaks a hard rule), 'warn' (below the comfortable value) or 'ok'.
import { obb, zone, overlaps, gap, front, side, edgesOf, ray, pip, segDist } from './geom.js'
import { RULES, solidHeight, TYPES } from './catalog.js'
import { buildSpace, fitsRoom, freeRun } from './space.js'
import { freeGrid, edt, bottleneck, widthOf } from './grid.js'

const SIDES = ['front', 'back', 'left', 'right']
const nm = (t) => TYPES[t]?.label || t
const body = (it) => obb(it.x, it.z, it.w, it.d, it.rot)
const cm = (m) => Math.round(m * 100)
const levelOf = (v, min, ideal) => (v >= ideal - 0.005 ? 'ok' : v >= min - 0.005 ? 'warn' : 'error')

function roomIndexOf(space, it) {
  if (Number.isInteger(it.room) && space.rooms[it.room]) return it.room
  const hit = space.rooms.find((r) => pip(it.x, it.z, r.poly)); return hit ? hit.i : -1
}

export function validate(plan, items, { space = buildSpace(plan) } = {}) {
  const checks = [], dims = []
  const add = (c) => { checks.push(c); return c }
  const by = new Map(); for (const it of items) { const r = roomIndexOf(space, it); if (r < 0) { add({ room: -1, item: it.id, rule: 'inside', level: 'error', label: `${nm(it.type)} is outside every room` }); continue } if (!by.has(r)) by.set(r, []); by.get(r).push({ ...it, room: r }) }

  for (const room of space.rooms) {
    const mine = by.get(room.i) || [], solid = mine.filter((i) => !i.floor), bodies = solid.map(body)
    const rc = (c) => add({ room: room.i, roomName: room.name, ...c })
    for (const it of mine) {
      const b = body(it)
      if (!fitsRoom(room, b)) rc({ item: it.id, type: it.type, rule: 'inside', level: 'error', label: `${nm(it.type)} does not fit inside the room's free floor (it hits a wall or leaves the room)` })
    }
    // overlaps
    for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
      if (overlaps(bodies[i], bodies[j], 0.004)) rc({ item: solid[i].id, type: solid[i].type, rule: 'overlap', level: 'error', label: `${nm(solid[i].type)} overlaps ${nm(solid[j].type)}` })
    }
    // doors and windows
    for (const it of solid) {
      const b = body(it)
      for (const d of room.doors) if (overlaps(d.zone, b, 0.01) && !d.soft) rc({ item: it.id, type: it.type, rule: 'door', level: 'error', label: `${nm(it.type)} stands in the floor in front of a door (${cm(d.zone.d)} cm deep needed)` })
      const sh = solidHeight(it)
      if (sh > 0 && !it.decor && !room.outdoor) for (const d of room.doors) if (d.soft && overlaps(d.zone, b, 0.01)) rc({ item: it.id, type: it.type, rule: 'window', level: 'error', label: `${nm(it.type)} (${cm(sh)} cm) stands in front of a glass door` })
      if (sh > 0 && !it.decor && !room.outdoor) for (const w of room.windows) if (w.sill < sh - 0.02 && overlaps(w.zone, b, 0.01)) rc({ item: it.id, type: it.type, rule: 'window', level: 'error', label: `${nm(it.type)} (${cm(sh)} cm) stands in front of a window with a ${cm(w.sill)} cm sill` })
    }
    // sliding glass doors: any 90 cm of the glass is enough to walk through
    for (const d of room.doors.filter((x) => x.soft)) {
      if (!solid.some((it) => overlaps(d.zone, body(it), 0.01))) continue
      const run = freeRun(d, bodies), others = d.other !== null ? space.rooms[d.other]?.name : null
      rc({ rule: 'door-glass', level: run >= RULES.walkGood - 0.005 ? 'ok' : run >= RULES.walkMin - 0.005 ? 'warn' : 'error', value: +run.toFixed(3), limit: RULES.walkGood, min: RULES.walkMin, label: `Sliding glass door${others ? ' to ' + others : ''}: ${cm(run)} cm of the glass stay free (walking through needs ${cm(RULES.walkGood)})` })
    }
    // clear space around each piece, measured with rays from the edges
    const roomSegs = [...edgesOf(room.poly), ...room.blockers.flatMap((b) => edgesOf(b.pts))]
    solid.forEach((it, idx) => {
      const need = SIDES.filter((s) => (it.clearMin?.[s] || 0) > 0 || (it.clear?.[s] || 0) > 0)
      if (!need.length) return
      const segs = [...roomSegs, ...solid.flatMap((o, k) => (k === idx || (it.zoneOk || []).includes(o.type) ? [] : edgesOf(bodies[k].pts)))]
      const f = front(it.rot), r = side(it.rot), dist = {}
      for (const s of need) {
        const dir = s === 'front' ? f : s === 'back' ? [-f[0], -f[1]] : s === 'right' ? r : [-r[0], -r[1]]
        const along = s === 'front' || s === 'back' ? r : f, half = (s === 'front' || s === 'back' ? it.w : it.d) / 2, off = s === 'front' ? it.d / 2 : s === 'back' ? it.d / 2 : it.w / 2
        let best = Infinity, bp = null
        for (const k of [-0.9, -0.45, 0, 0.45, 0.9]) {
          const ox = it.x + dir[0] * off + along[0] * half * k, oz = it.z + dir[1] * off + along[1] * half * k
          const t = ray(ox, oz, dir[0], dir[1], segs, 6)
          if (t < best) { best = t; bp = [ox, oz, ox + dir[0] * t, oz + dir[1] * t] }
        }
        dist[s] = best; if (bp) dims.push({ a: [bp[0], bp[1]], b: [bp[2], bp[3]], value: best, item: it.id, side: s, level: levelOf(best, it.clearMin?.[s] ?? 0, it.clear?.[s] ?? 0) })
      }
      const lr = ['left', 'right'].filter((s) => need.includes(s)), oneSide = it.oneSide && lr.length === 2
      for (const s of need) {
        const min = it.clearMin?.[s] ?? 0, ideal = it.clear?.[s] ?? 0, v = dist[s]
        let level = levelOf(v, min, ideal)
        if (oneSide && (s === 'left' || s === 'right') && level === 'error' && lr.some((o) => o !== s && dist[o] >= min - 0.005)) level = 'warn'
        rc({ item: it.id, type: it.type, rule: 'clear', side: s, level, value: +v.toFixed(3), limit: ideal, min, label: `${TYPES[it.type]?.label || it.type}, ${s}: ${cm(Math.min(v, 9.99))} cm free (needs ${cm(min)}, comfortable ${cm(ideal)})` })
      }
    })
    // walking: widths from the doors to the clear space of each piece, and between the doors
    if (solid.length || room.doors.length > 1) {
      const g = freeGrid(room, bodies, 0.05), d = edt(g)
      const zones = room.doors.map((x) => x.zone), keepZones = []
      for (const it of solid) for (const s of SIDES) if ((it.clearMin?.[s] || 0) > 0) keepZones.push({ it, s, o: zone(body(it), s, it.clearMin[s]) })
      const exempt = [...zones, ...keepZones.map((k) => k.o)]
      const sources = zones.length ? zones : [obb(room.bb.x0 + room.bb.w / 2, room.bb.z0 + room.bb.d / 2, 0.5, 0.5, 0)]
      const bt = bottleneck(g, d, sources, exempt)
      const grow = (o) => obb(o.x, o.z, o.w + 0.7, o.d + 0.7, o.rot)
      for (const it of solid) {
        const zs = keepZones.filter((k) => k.it === it), pick = it.type === 'bed' ? zs.filter((k) => k.s === 'left' || k.s === 'right') : (it.type === 'dining_table' || it.type === 'bistro_table' || it.type === 'outdoor_table') ? zs : zs.filter((k) => k.s === 'front' && it.type !== 'chair')
        if (!pick.length) continue
        const w = Math.max(...pick.map((k) => bt.inZoneMax(grow(k.o))))
        rc({ item: it.id, type: it.type, rule: 'walk', level: w >= 0.8 - 0.005 ? 'ok' : w >= RULES.walkMin - 0.005 ? 'warn' : 'error', value: +w.toFixed(3), limit: 0.8, min: RULES.walkMin, label: `${TYPES[it.type]?.label || it.type}: the way to it is ${w >= 9 ? 'open' : cm(w) + ' cm wide at the narrowest'}` })
      }
      if (room.doors.length >= 2) {
        const b0 = bottleneck(g, d, [room.doors[0].zone], exempt)
        room.doors.slice(1).forEach((dr, k) => {
          const w = b0.inZoneMax(grow(dr.zone))
          rc({ rule: 'passage', level: w >= RULES.walkGood - 0.005 ? 'ok' : w >= RULES.walkMin - 0.005 ? 'warn' : 'error', value: +w.toFixed(3), limit: RULES.walkGood, min: RULES.walkMin, label: `Passage from door 1 to door ${k + 2}: ${w >= 9 ? 'open' : cm(w) + ' cm wide at the narrowest'}` })
        })
      }
    }
    // relations
    for (const tv of solid.filter((i) => i.type === 'tv_unit')) {
      const f = front(tv.rot), screen = [tv.x - f[0] * tv.d / 2, tv.z - f[1] * tv.d / 2]
      let best = null
      for (const sf of solid.filter((i) => i.type === 'sofa')) {
        const sfF = front(sf.rot), facing = -(sfF[0] * f[0] + sfF[1] * f[1])
        if (facing < 0.9) continue
        const along = (sf.x - screen[0]) * f[0] + (sf.z - screen[1]) * f[1] - sf.d / 2
        if (!best || along < best.along) best = { sf, along }
      }
      if (best) {
        const v = best.along, ok = v >= RULES.viewDist[0] - 0.005 && v <= RULES.viewDist[1] + 0.005
        rc({ item: tv.id, type: 'tv_unit', rule: 'view', level: ok ? 'ok' : v >= 1.4 && v <= 3.9 ? 'warn' : 'error', value: +v.toFixed(3), limit: RULES.viewDist[1], min: RULES.viewDist[0], label: `TV to sofa: ${cm(v)} cm (comfortable ${cm(RULES.viewDist[0])} to ${cm(RULES.viewDist[1])})` })
        const sd = side(tv.rot), lat = Math.abs((best.sf.x - tv.x) * sd[0] + (best.sf.z - tv.z) * sd[1])
        rc({ item: tv.id, type: 'tv_unit', rule: 'view-centre', level: lat <= 0.5 ? 'ok' : lat <= 1.0 ? 'warn' : 'error', value: +lat.toFixed(3), limit: 0.5, label: `Sofa is ${cm(lat)} cm off the centre line of the TV` })
        dims.push({ a: screen, b: [best.sf.x - sfFront(best.sf)[0] * best.sf.d / 2, best.sf.z - sfFront(best.sf)[1] * best.sf.d / 2], value: v, item: tv.id, level: ok ? 'ok' : 'warn' })
      } else rc({ item: tv.id, type: 'tv_unit', rule: 'view', level: 'warn', label: 'No sofa faces the TV' })
    }
    for (const tab of solid.filter((i) => i.type === 'coffee_table')) {
      const sf = solid.filter((i) => i.type === 'sofa').map((s) => ({ s, g: gap(body(s), body(tab)) })).sort((a, b) => a.g - b.g)[0]
      if (sf && sf.g < 1.0) rc({ item: tab.id, type: 'coffee_table', rule: 'coffee-gap', level: sf.g >= RULES.coffeeGap[0] - 0.005 && sf.g <= RULES.coffeeGap[1] + 0.005 ? 'ok' : sf.g >= 0.25 && sf.g <= 0.6 ? 'warn' : 'error', value: +sf.g.toFixed(3), limit: RULES.coffeeGapTarget, label: `Sofa to coffee table: ${cm(sf.g)} cm (comfortable ${cm(RULES.coffeeGap[0])} to ${cm(RULES.coffeeGap[1])})` })
    }
    for (const t of solid.filter((i) => i.type === 'dining_table' || i.type === 'outdoor_table')) {
      const n = solid.filter((i) => i.type === 'chair' && gap(body(i), body(t)) < 0.1).length
      const near = solid.filter((i) => ['counter', 'fridge'].includes(i.type)).map((o) => gap(body(o), body(t))).sort((a, b) => a - b)[0]
      rc({ item: t.id, type: 'dining_table', rule: 'seats', level: n >= 2 ? 'ok' : 'warn', value: n, label: `Dining table with ${n} chairs` })
      if (near !== undefined) rc({ item: t.id, type: 'dining_table', rule: 'kitchen-table', level: near >= 1.1 - 0.005 ? 'ok' : near >= 0.9 ? 'warn' : 'error', value: +near.toFixed(3), limit: 1.1, min: 0.9, label: `Kitchen units to dining table: ${cm(near)} cm (needs 110 for a pulled-out chair and a person walking past)` })
    }
    const runs = solid.filter((i) => i.type === 'counter')
    if (runs.length) {
      const pos = (kind) => runs.flatMap((r) => (r.features || []).filter((f) => f.kind === kind).map((f) => { const rr = side(r.rot), lx = -r.w / 2 + f.at; return { p: [r.x + rr[0] * lx, r.z + rr[1] * lx], run: r, at: f.at } }))[0]
      const sink = pos('sink'), hob = pos('hob'), fr = solid.find((i) => i.type === 'fridge')
      if (sink && hob && fr) {
        const dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), tri = dd(sink.p, hob.p) + dd(hob.p, [fr.x, fr.z]) + dd(sink.p, [fr.x, fr.z])
        rc({ rule: 'work-triangle', level: tri >= 3.6 && tri <= 7.9 ? 'ok' : 'warn', value: +tri.toFixed(3), limit: 7.9, min: 3.6, label: `Work triangle (sink, hob, fridge): ${tri.toFixed(1)} m (comfortable 3.6 to 7.9)` })
        const sep = sink.run === hob.run ? Math.abs(sink.at - hob.at) : dd(sink.p, hob.p)
        rc({ rule: 'sink-hob', level: sep >= 0.9 ? 'ok' : sep >= 0.6 ? 'warn' : 'error', value: +sep.toFixed(3), limit: 0.9, min: 0.6, label: `Sink to hob: ${cm(sep)} cm apart (worktop between them)` })
      }
      const metres = runs.reduce((s, r) => s + r.w, 0)
      rc({ rule: 'kitchen-length', level: metres >= 3.0 ? 'ok' : metres >= 2.0 ? 'warn' : 'error', value: +metres.toFixed(2), limit: 3.0, label: `Kitchen units: ${metres.toFixed(1)} m of base units` })
    }
    if (room.outdoor) {
      // outdoor areas: the plan often shows the glass between the house and the terrace as windows
      if (!room.doors.length && room.windows.some((w) => w.otherKind && w.otherKind !== 'none')) rc({ rule: 'no-door', level: 'warn', label: `${room.name}: the plan shows no door to it, only windows. If one of them is a glass door, select it in the plan and choose "Make it a glass door", so the walking routes can be checked.` })
      // children climb chairs, tables and benches: keep them away from the railing
      for (const it of solid.filter((i) => i.climb)) {
        const b = body(it); let dmin = Infinity
        for (const e of room.edges) if (e.rail) for (const c of b.pts) dmin = Math.min(dmin, segDist(c[0], c[1], e.a, e.b))
        const lim = it.railGap ?? RULES.railClear
        if (dmin < 1.5) rc({ item: it.id, type: it.type, rule: 'rail-climb', level: dmin >= lim - 0.005 ? 'ok' : dmin >= lim - 0.15 ? 'warn' : 'error', value: +dmin.toFixed(3), limit: lim, label: `${nm(it.type)} is ${cm(dmin)} cm from the railing (keep at least ${cm(lim)} cm${it.railGap ? ' so its chairs are not at the railing' : ': children can climb it'})` })
      }
      // a strip of floor that is typically under 1.1 m wide (a balcony whose house wall takes 30 cm of it) cannot hold a seat with room to sit and walk: no warning there
      const widest = (() => { const g = freeGrid(room, [], 0.05), d = edt(g), v = []; for (let i = 0; i < d.length; i++) if (d[i] > 0) v.push(d[i]); v.sort((p, q) => p - q); return v.length ? widthOf(v[Math.floor(v.length * 0.8)], g.step) : 0 })()          // typical width (80th percentile): a door gap in the house wall does not make a strip wide
      if (room.area >= 4 && widest >= 1.1 && !solid.some((i) => ['outdoor_sofa', 'sofa', 'chair', 'armchair', 'lounger', 'bistro_table', 'outdoor_table'].includes(i.type))) rc({ rule: 'missing', level: 'warn', label: `${room.name}: no seating could be placed` })
    } else if (!room.doors.length && room.kind !== 'none') rc({ rule: 'no-door', level: 'warn', label: `${room.name}: no door was found in the plan, so the walking routes could not be checked. Add the door to the plan.` })
    // what the room should contain
    const has = (t) => solid.some((i) => i.type === t)
    const need = { living: ['sofa', 'tv_unit'], bedroom: ['bed'], kitchen: ['counter', 'fridge'], bathroom: ['toilet', 'vanity'], wc: ['toilet', 'vanity'] }[room.kind] || []
    for (const t of need) if (!has(t) && !(t === 'toilet' && room.noToilet)) rc({ rule: 'missing', level: 'warn', label: `${room.name}: no ${TYPES[t].label.toLowerCase()} could be placed` })
  }
  // a built-in piece (drawn in the plan itself: a bathtub, a sink counter, a shower cabin) is a fact, not a mistake: a rule it does not meet is shown as a note, not as an error
  const builtIn = new Set(items.filter((i) => i.fixed).map((i) => i.id)), byHand = new Set(items.filter((i) => i.pinned).map((i) => i.id))          // pinned: put on a spot the person clicked
  for (const c of checks) if (c.level === 'error' && c.item && (builtIn.has(c.item) || byHand.has(c.item))) { c.level = 'warn'; c.label += builtIn.has(c.item) ? ' (built in, as drawn in the plan)' : ' (placed where you chose)'; c.builtIn = builtIn.has(c.item); c.byHand = byHand.has(c.item) }
  const counts = { error: 0, warn: 0, ok: 0 }; for (const c of checks) counts[c.level] = (counts[c.level] || 0) + 1
  return { checks, dims, counts, pass: counts.error === 0, rooms: space.rooms.map((r) => ({ i: r.i, name: r.name, kind: r.kind, checks: checks.filter((c) => c.room === r.i) })) }
}
const sfFront = (s) => front(s.rot)
