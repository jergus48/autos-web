// The layout engine: furnishes every room of a plan with plain pieces of real size, one recipe per kind of room.
// Every placement passes the hard rules in ctx.js (inside the room, nothing overlaps, doors and windows respected, clear space around each
// piece, people can still walk to everything) and is scored on the soft rules (viewing distance, centred, against a wall, ...).
// `rank` (0, 1, 2) picks the best, second best or third best arrangement of the main anchor (TV wall, bed wall, kitchen shape).
import { buildSpace } from './space.js'
import { Ctx, bodyOf, front, side, rotOf, spreadAt } from './ctx.js'
import { RULES, TYPES, make } from './catalog.js'
import { obb, pip, overlaps } from './geom.js'
import { fitsRoom } from './space.js'

const pick = (arr, rank) => arr[Math.min(rank, arr.length - 1)]
const plain = (it) => { const { _b, _keep, _keepTry, ...rest } = it; return rest }

// ================================================================ living room
function sofaOptions(ctx, tv) {
  const area = ctx.room.area, sw = area < 12 ? 1.8 : area < 18 ? 2.2 : 2.4
  const proto = ctx.mk('sofa', { w: sw })
  const f = front(tv.rot), sd = side(tv.rot), P0 = [tv.x - f[0] * tv.d / 2, tv.z - f[1] * tv.d / 2]
  const rotS = rotOf(-f[0], -f[1]), bf = front(rotS), out = []
  tv._keep = []; ctx.items.push(tv)
  for (let dv = RULES.viewDist[0]; dv <= RULES.viewDist[1] + 1e-6; dv += 0.1) for (const lat of [0, 0.3, -0.3, 0.6, -0.6]) {
    const dist = dv + proto.d / 2, it = { ...proto }
    ctx.at(it, P0[0] + f[0] * dist + sd[0] * lat, P0[1] + f[1] * dist + sd[1] * lat, rotS)
    if (!ctx.can(it)) continue
    const back = ctx.free(it.x - bf[0] * it.d / 2, it.z - bf[1] * it.d / 2, -bf[0], -bf[1], [it])
    out.push({ it, dv, lat, back, score: -Math.abs(dv - RULES.viewDistTarget) * 1.2 - Math.abs(lat) * 0.8 + (back <= 0.06 ? 1 : back < 0.9 ? -1 : 0) })
  }
  ctx.items.pop()
  return out.sort((a, b) => b.score - a.score)
}

function living(ctx, rank) {
  const room = ctx.room, area = room.area
  if (room.kitchen && !ctx.items.some((i) => i.type === 'counter' || i.type === 'fridge')) kitchen(ctx, 0, false)           // open-plan living kitchen: the kitchen run first, it needs the walls
  const seats = area >= 40 ? 8 : area >= 24 ? 6 : 4, wantTable = room.dining && area >= 14
  const tv0 = ctx.lockedOf('tv_unit'), sofa0 = ctx.lockedOf('sofa')
  if (area >= 9 && (tv0 || sofa0)) anchoredLiving(ctx, tv0, sofa0, area)       // a locked TV unit or sofa is the anchor: the rest is placed around it
  else if (area >= 9) {
    const tvW = area < 14 ? 1.2 : 1.6
    const tvs = ctx.wallCands(ctx.mk('tv_unit', { w: tvW }), (it, e, s) => -Math.abs(s - e.len / 2) * 0.8 - (ctx.windowOn(e, s - tvW / 2, s + tvW / 2) ? 2 : 0) + Math.min(e.len, 5) * 0.1, { step: 0.1, take: 4 })
    const opts = []
    for (const c of tvs) {
      const all = sofaOptions(ctx, c.it)
      for (const cls of ['wall', 'float']) {       // the best sofa spot against a wall, and the best one standing free in the room
        const s = all.find((x) => (cls === 'wall') === (x.back <= 0.06)); if (s) opts.push({ tv: c.it, sofa: s.it, edge: c.edge.i, cls, score: c.score + s.score })
      }
    }
    const distinct = new Map(); for (const o of opts) { const k = o.edge + '|' + o.cls; if (!distinct.has(k) || distinct.get(k).score < o.score) distinct.set(k, o) }
    const ranked = [...distinct.values()].sort((a, b) => b.score - a.score)
    // try the arrangements from the chosen rank on; a dining table has to fit as well when the room is also the dining room
    let done = false
    for (const needTable of wantTable ? [true, false] : [false]) {
      const start = Math.max(0, Math.min(rank, ranked.length - 1))
      for (const o of [...ranked.slice(start), ...ranked.slice(0, start)]) {
        if (done) break
        ctx.add(o.tv)
        if (!ctx.can(o.sofa)) { ctx.remove(o.tv); continue }
        ctx.add(o.sofa)
        if (!ctx.circOK()) { ctx.remove(o.sofa); ctx.remove(o.tv); continue }
        const tab = coffeeTable(ctx, o.sofa, area)
        if (needTable && !placeDining(ctx, seats)) { for (const it of [tab, o.sofa, o.tv]) if (it) ctx.remove(it); continue }
        accents(ctx, o.sofa, tab, area); done = true
      }
      if (done) break
    }
  }
  if (area >= 16 && !ctx.lockedOf('sideboard')) {
    ctx.take(ctx.wallCands(ctx.mk('sideboard', { w: area >= 26 ? 1.6 : 1.2 }), (it, e, s) => -Math.min(s, e.len - s) * 0.3 - (ctx.windowOn(e, s - 0.6, s + 0.6) ? 1 : 0), { take: 3, step: 0.1 }))
  }
  if (wantTable && !ctx.items.some((i) => i.type === 'dining_table')) placeDining(ctx, seats)
  cornerPlant(ctx)
}

// a locked TV unit gets the best sofa in front of it; a locked sofa gets the TV wall that puts the screen at a comfortable distance; then the table and the accents
function anchoredLiving(ctx, tv, sofa, area) {
  if (tv && !sofa) { const o = sofaOptions(ctx, tv)[0]; if (o) sofa = ctx.addSafe(o.it) }
  else if (sofa && !tv) {
    const tvW = area < 14 ? 1.2 : 1.6
    const along = (it) => { const f = front(it.rot); return (sofa.x - it.x + f[0] * it.d / 2) * f[0] + (sofa.z - it.z + f[1] * it.d / 2) * f[1] - sofa.d / 2 }
    const facing = (it) => { const f = front(it.rot), sf = front(sofa.rot); return -(f[0] * sf[0] + f[1] * sf[1]) > 0.9 }
    const cands = ctx.wallCands(ctx.mk('tv_unit', { w: tvW }), (it) => { const sd = side(it.rot), lat = Math.abs((sofa.x - it.x) * sd[0] + (sofa.z - it.z) * sd[1]); return -Math.abs(along(it) - RULES.viewDistTarget) * 1.2 - lat * 0.8 },
      { step: 0.1, take: 6, filter: (it) => facing(it) && along(it) >= RULES.viewDist[0] && along(it) <= RULES.viewDist[1] })
    tv = ctx.take(cands)
  }
  if (!sofa) return
  const tab = ctx.lockedOf('coffee_table') || coffeeTable(ctx, sofa, area)
  accents(ctx, sofa, tab, area)
}

function coffeeTable(ctx, sofa, area) {
  const f = front(sofa.rot)
  for (const [w, d] of area < 14 ? [[0.9, 0.5]] : [[1.0, 0.55], [0.9, 0.5]]) for (const gp of [RULES.coffeeGapTarget, 0.38, 0.34]) {
    const it = ctx.mk('coffee_table', { w, d }), dist = sofa.d / 2 + gp + d / 2
    ctx.at(it, sofa.x + f[0] * dist, sofa.z + f[1] * dist, sofa.rot)
    if (ctx.can(it)) { const got = ctx.addSafe(it); if (got) return got }
  }
  return null
}

function accents(ctx, sofa, tab, area) {
  const sd = side(sofa.rot), bf = front(sofa.rot)
  if (tab) {
    const nArm = area >= 26 ? 2 : area >= 16 ? 1 : 0
    let placed = 0
    for (const sg of [1, -1]) {
      if (placed >= nArm) break
      const arm = ctx.mk('armchair'), dir = [sd[0] * sg, sd[1] * sg], dist = tab.w / 2 + 0.45 + arm.d / 2
      ctx.at(arm, tab.x + dir[0] * dist, tab.z + dir[1] * dist, rotOf(-dir[0], -dir[1]))
      if (ctx.can(arm)) { ctx.add(arm); if (ctx.circOK()) placed++; else ctx.remove(arm) }
    }
  }
  const lamp = ctx.mk('floor_lamp')
  lampSearch: for (const dz of [0, 0.3, 0.6]) for (const sg of [1, -1]) {
    const dist = sofa.w / 2 + 0.3
    ctx.at(lamp, sofa.x + sd[0] * sg * dist - bf[0] * (sofa.d / 2 - 0.25 - dz), sofa.z + sd[1] * sg * dist - bf[1] * (sofa.d / 2 - 0.25 - dz), 0)
    if (ctx.addSafe(lamp)) break lampSearch
  }
}

function cornerPlant(ctx) {
  if (ctx.room.area < 9) return
  const proto = ctx.mk('plant')
  ctx.take(ctx.wallCands(proto, (it, e, s) => -ctx.doorDist(it.x, it.z) * 0.1 + (ctx.windowOn(e, s - 0.4, s + 0.4) ? 0.4 : 0), { take: 3, step: 0.1, filter: (it, e, s) => Math.min(s - it.w / 2, e.len - s - it.w / 2) < 0.2 }))
}

// ================================================================ dining
function seatPlan(seats, tab, chair) {
  const out = [], nl = seats <= 6 ? 2 : 3, cd = chair.d / 2 + 0.02
  for (const sg of [1, -1]) for (let i = 0; i < nl; i++) out.push({ lx: -tab.w / 2 + (tab.w * (i + 0.5)) / nl, lz: sg * (tab.d / 2 + cd), turn: sg > 0 ? Math.PI : 0 })
  if (seats >= 6) for (const sg of [1, -1]) out.push({ lx: sg * (tab.w / 2 + cd), lz: 0, turn: sg > 0 ? -Math.PI / 2 : Math.PI / 2 })
  return out
}

// the chairs around a table, not yet placed
function seatSpots(ctx, t, seats) {
  const chair0 = ctx.mk('chair'), out = []
  for (const sp of seatPlan(seats, t, chair0)) {
    const c = ctx.mk('chair'), f = front(t.rot), sd = side(t.rot)
    ctx.at(c, t.x + sd[0] * sp.lx + f[0] * sp.lz, t.z + sd[1] * sp.lx + f[1] * sp.lz, t.rot + sp.turn)
    out.push(c)
  }
  return out
}
function seatChairs(ctx, t, seats) { for (const c of seatSpots(ctx, t, seats)) ctx.addSafe(c) }

function placeDining(ctx, maxSeats) {
  const lt = ctx.lockedOf('dining_table')
  if (lt) {            // the user's table stays; chairs are added around it unless some already stand there
    const have = ctx.items.filter((i) => i.type === 'chair' && ctx.gapBetween(i, lt) < 0.15).length
    if (have < 2) seatChairs(ctx, lt, lt.w >= 2 ? 8 : lt.w >= 1.6 ? 6 : 4)
    return lt
  }
  const room = ctx.room, bb = room.bb
  const sets = [[8, 2.2, 1.0], [6, 1.8, 0.9], [4, 1.4, 0.8]].filter(([n]) => n <= maxSeats)
  // the table goes towards the middle of the room; in the other arrangements towards another part of it (rank 1: the start corner side, rank 2: the far side, ...)
  const cx = bb.x0 + bb.w * (ctx.rank ? 0.5 + (spreadAt(ctx.rank) - 0.5) * 0.6 : 0.5), cz = bb.z0 + bb.d * (ctx.rank ? 0.5 + (spreadAt(ctx.rank, 2) - 0.5) * 0.6 : 0.5), longX = bb.w >= bb.d
  for (const [seats, w, d] of sets) {
    const cands = []
    for (const rot of [0, Math.PI / 2]) for (let x = bb.x0; x <= bb.x1; x += 0.1) for (let z = bb.z0; z <= bb.z1; z += 0.1) {
      if (!pip(x, z, room.poly)) continue
      const it = ctx.mk('dining_table', { w, d }); ctx.at(it, x, z, rot)
      if (!ctx.can(it)) continue
      const alongX = rot === Math.PI / 2
      cands.push({ it, score: -Math.hypot(x - cx, z - cz) * 0.5 + (alongX === longX ? 0.4 : 0) - ctx.doorDist(x, z) * -0.05 })
    }
    cands.sort((a, b) => b.score - a.score)
    const t = ctx.take(cands.slice(0, 12))
    if (!t) continue
    seatChairs(ctx, t, seats)
    return t
  }
  return null
}

// ================================================================ bedroom
function bedroom(ctx, rank) {
  const room = ctx.room, area = room.area
  const mw = area >= 11 ? 160 : area >= 7.5 ? 140 : 90
  const proto = ctx.mk('bed', { mw }); proto.oneSide = mw === 90 || area < 9
  const lockedBed = ctx.lockedOf('bed')
  const cands = lockedBed ? [] : ctx.wallCands(proto, (it, e, s) => {
    const lo = s - it.w / 2, hi = s + it.w / 2
    let sc = -Math.abs(s - e.len / 2) * 0.6 - (ctx.windowOn(e, lo, hi) ? 1 : 0) - (ctx.doorOn(e, lo - 0.4, hi + 0.4) ? 1 : 0) + Math.min(ctx.doorDist(it.x, it.z), 4) * 0.1
    const r = side(it.rot), cl = ctx.free(it.x - r[0] * it.w / 2, it.z - r[1] * it.w / 2, -r[0], -r[1], [], 3), cr = ctx.free(it.x + r[0] * it.w / 2, it.z + r[1] * it.w / 2, r[0], r[1], [], 3)
    sc += (cl >= RULES.bedSide ? 0.5 : 0) + (cr >= RULES.bedSide ? 0.5 : 0)
    return sc
  }, { step: 0.1, take: 3 })
  const perEdge = new Map(); for (const c of cands) if (!perEdge.has(c.edge.i) || perEdge.get(c.edge.i).score < c.score) perEdge.set(c.edge.i, c)
  const ranked = [...perEdge.values()].sort((a, b) => b.score - a.score)
  let bed = lockedBed
  for (let k = Math.max(0, Math.min(rank, ranked.length - 1)); k < ranked.length && !bed; k++) bed = ctx.take([ranked[k]])
  if (!bed) bed = ctx.take(ranked)
  if (bed) {
    const f = front(bed.rot), r = side(bed.rot)
    for (const sg of [1, -1]) {
      const ns = ctx.mk('nightstand'), lat = bed.w / 2 + 0.02 + ns.w / 2, back = bed.d / 2 - ns.d / 2
      if (bed.w < 1.2 && sg < 0) continue                         // a single bed gets one bedside table
      ctx.at(ns, bed.x + r[0] * sg * lat - f[0] * back, bed.z + r[1] * sg * lat - f[1] * back, bed.rot)
      ctx.addSafe(ns)
    }
  }
  if (area >= 8 && !ctx.lockedOf('wardrobe')) for (const w of area >= 14 ? [2.4, 2.0, 1.6, 1.2] : [1.8, 1.4, 1.2]) {
    const got = ctx.take(ctx.wallCands(ctx.mk('wardrobe', { w }), (it, e, s) => -ctx.doorDist(it.x, it.z) * 0.05 - Math.abs(s - e.len / 2) * 0.05, { step: 0.1, take: 3 }))
    if (got) break
  }
  if (area >= 12 && !ctx.lockedOf('desk')) {
    const desk = ctx.take(ctx.wallCands(ctx.mk('desk', { w: 1.2 }), (it, e) => (ctx.windowOn(e, 0, e.len) ? 0.6 : 0) - ctx.doorDist(it.x, it.z) * -0.05, { step: 0.1, take: 3 }))
    if (desk) {
      const ch = ctx.mk('chair'), f = front(desk.rot), dist = desk.d / 2 + ch.d / 2 + 0.1
      ctx.at(ch, desk.x + f[0] * dist, desk.z + f[1] * dist, desk.rot + Math.PI)
      ctx.addSafe(ch)
    }
  }
  cornerPlant(ctx)
}

// ================================================================ kitchen
function stretches(ctx, e) {
  const rot = rotOf(e.n[0], e.n[1])
  const ok = (s) => {          // can a 0.6 m unit stand at s: inside the room, clear of door landings and other pieces
    for (const o of [0, 0.02, 0.05, 0.1]) {
      const b = obb(e.a[0] + e.t[0] * s + e.n[0] * (0.3 + o), e.a[1] + e.t[1] * s + e.n[1] * (0.3 + o), 0.6, 0.6, rot)
      if (ctx.room.doors.some((d) => overlaps(d.zone, b, 0.01))) return false
      if (fitsRoom(ctx.room, b) && !ctx.items.some((i) => !i.floor && overlaps(bodyOf(i), b, 0.004))) return true
    }
    return false
  }
  const out = []; let start = null
  for (let s = 0.3; s <= e.len - 0.3 + 1e-9; s += 0.05) {
    if (ok(s)) { if (start === null) start = s } else if (start !== null) { out.push([start - 0.3, s - 0.05 + 0.3]); start = null }
  }
  if (start !== null) out.push([start - 0.3, e.len])
  return out.filter(([a, b]) => b - a >= 1.2)
}

function featurePos(run, f) { const r = side(run.rot); const lx = -run.w / 2 + f.at; return [run.x + r[0] * lx, run.z + r[1] * lx] }

// a run of base units along an edge: s0..s0+len measured along the edge; sink/hob positions are fractions of the run from its start
function runAlong(ctx, e, s0, len, feats, upper = true) {
  const rot = rotOf(e.n[0], e.n[1]), r = side(rot), dirSign = r[0] * e.t[0] + r[1] * e.t[1] > 0 ? 1 : -1
  const features = (feats || []).map((f) => ({ kind: f.kind, at: dirSign > 0 ? f.at : len - f.at }))
  const proto = ctx.mk('counter', { w: +len.toFixed(3), features, upper })
  const s = s0 + len / 2
  for (const o of [0, 0.02, 0.05, 0.1, 0.15]) {
    const it = { ...proto }; ctx.at(it, e.a[0] + e.t[0] * s + e.n[0] * (0.3 + o), e.a[1] + e.t[1] * s + e.n[1] * (0.3 + o), rot)
    if (ctx.can(it)) return it
  }
  return null
}
function fridgeAlong(ctx, e, s) {
  const rot = rotOf(e.n[0], e.n[1])
  for (const o of [0, 0.02, 0.05, 0.1]) {
    const it = ctx.mk('fridge'); ctx.at(it, e.a[0] + e.t[0] * s + e.n[0] * (0.325 + o), e.a[1] + e.t[1] * s + e.n[1] * (0.325 + o), rot)
    if (ctx.can(it)) return it
  }
  return null
}

function kitchenOptions(ctx) {
  const room = ctx.room, opts = [], E = room.edges
  const tryBuild = (name, build) => {
    const made = []; let ok = true
    const add = (it) => { if (!it) { ok = false; return null } if (!ctx.can(it)) { ok = false; return null } ctx.add(it); made.push(it); return it }
    let meta = {}
    try { meta = build(add) || {} } finally { for (const it of made.reverse()) ctx.remove(it) }
    if (!ok || made.length === 0) return
    opts.push({ name, items: made.slice().reverse(), ...meta })
  }
  const tri = (items) => {
    const sink = items.flatMap((r) => (r.features || []).filter((f) => f.kind === 'sink').map((f) => featurePos(r, f)))[0]
    const hob = items.flatMap((r) => (r.features || []).filter((f) => f.kind === 'hob').map((f) => featurePos(r, f)))[0]
    const fr = items.find((i) => i.type === 'fridge'); if (!sink || !hob || !fr) return 99
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]); return d(sink, hob) + d(hob, [fr.x, fr.z]) + d(sink, [fr.x, fr.z])
  }
  // A: one straight run with the fridge at one end
  for (const e of E) for (const [a, b] of stretches(ctx, e)) {
    for (const cap of [4.6, 3.6, 3.0]) {
    const len = Math.min(b - a, cap); if (len < 2.5 || (cap < 4.6 && b - a <= cap + 0.05)) continue
    for (const fridgeFirst of [true, false]) {
      const s0 = a, lc = len - 0.6
      tryBuild('single', (add) => {
        const run = fridgeFirst ? add(runAlong(ctx, e, s0 + 0.6, lc, [{ kind: 'sink', at: 0.5 }, { kind: 'hob', at: lc - 0.5 }])) : add(runAlong(ctx, e, s0, lc, [{ kind: 'sink', at: 0.5 }, { kind: 'hob', at: lc - 0.5 }]))
        add(fridgeFirst ? fridgeAlong(ctx, e, s0 + 0.3) : fridgeAlong(ctx, e, s0 + lc + 0.3))
        void run
        return { metres: lc }
      })
    }
    }
  }
  // B: L shape around a corner
  E.forEach((e1, i) => {
    const e2 = E[(i + 1) % E.length]
    if (e1.len < 1.8 || e2.len < 1.8 || e1.n[0] * e2.t[0] + e1.n[1] * e2.t[1] < 0.9) return      // a right-angled corner that points into the room
    const st1 = stretches(ctx, e1).find(([, b]) => b >= e1.len - 0.06), st2 = stretches(ctx, e2).find(([a]) => a <= 0.06)
    if (!st1 || !st2) return
    for (const [c1, c2] of [[3.6, 3.0], [2.8, 2.4], [2.4, 1.8]]) {
    const l1 = Math.min(e1.len - st1[0], c1), l2 = Math.min(st2[1] - 0.6, c2)
    if (l1 < 1.9 || l2 < 1.2) continue
    for (const swap of [false, true]) tryBuild('L', (add) => {
      add(runAlong(ctx, e1, e1.len - l1, l1, swap ? [{ kind: 'hob', at: 0.6 }] : [{ kind: 'sink', at: 0.6 }]))
      const r2 = add(runAlong(ctx, e2, 0.6, Math.max(l2 - 0.6, 0.6), swap ? [{ kind: 'sink', at: 0.5 }] : [{ kind: 'hob', at: 0.5 }]))
      add(fridgeAlong(ctx, e2, 0.6 + Math.max(l2 - 0.6, 0.6) + 0.3))
      void r2
      return { metres: l1 + l2 - 0.6 }
    })
    }
  })
  // C: two facing runs with an aisle of 0.9 to 1.5 m between them
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const a = E[i], b = E[j]
    if (a.n[0] * b.n[0] + a.n[1] * b.n[1] > -0.98) continue
    const D = Math.abs((b.a[0] - a.a[0]) * a.n[0] + (b.a[1] - a.a[1]) * a.n[1]), aisle = D - 1.2
    if (aisle < RULES.aisleMin - 0.01 || aisle > RULES.aisleMax) continue
    const pa = (p) => (p[0] - a.a[0]) * a.t[0] + (p[1] - a.a[1]) * a.t[1]
    const lo = Math.max(0, Math.min(pa(b.a), pa(b.b))), hi = Math.min(a.len, Math.max(pa(b.a), pa(b.b)))
    if (hi - lo < 2.4) continue
    const sb = (s) => ((a.a[0] + a.t[0] * s - b.a[0]) * b.t[0] + (a.a[1] + a.t[1] * s - b.a[1]) * b.t[1])
    for (const [aa] of stretches(ctx, a)) {
      const s0 = Math.max(lo, aa), len = Math.min(hi - s0, 3.6); if (len < 2.4) continue
      tryBuild('galley', (add) => {
        add(runAlong(ctx, a, s0, len - 0.6, [{ kind: 'sink', at: 0.5 }]))
        add(fridgeAlong(ctx, a, s0 + len - 0.3))
        const t0 = sb(s0), t1 = sb(s0 + len)
        add(runAlong(ctx, b, Math.min(t0, t1), len, [{ kind: 'hob', at: len / 2 }]))
        return { metres: 2 * len - 0.6 }
      })
    }
  }
  for (const o of opts) { const t = tri(o.items); o.tri = t; o.score = Math.min(o.metres, 5.5) - Math.abs((t === 99 ? 6.5 : t) - 5.5) * 0.4 + (o.name === 'L' ? 0.4 : 0) + (o.name === 'galley' ? 0.2 : 0) }
  return opts.sort((a, b) => b.score - a.score)
}

function kitchen(ctx, rank, withTable = true) {
  const area = ctx.room.area
  const seats = withTable && (ctx.room.dining || area >= 14) ? (area >= 22 ? 8 : area >= 16 ? 6 : area >= 11 ? 4 : 0) : 0
  if (ctx.items.some((i) => i.type === 'counter' || i.type === 'fridge')) { if (seats) placeDining(ctx, seats); return }          // locked kitchen units: the kitchen stays as it is
  const groups = new Map()
  for (const o of kitchenOptions(ctx)) { if (!groups.has(o.name)) groups.set(o.name, []); groups.get(o.name).push(o) }
  const order = [...groups.values()].sort((a, b) => b[0].score - a[0].score)
  // the best of every shape first (single, L, galley), then the other positions of the shapes, so the arrangements really differ
  const sig = (o) => o.items.map((i) => `${i.type}@${i.x.toFixed(1)},${i.z.toFixed(1)}`).join('|'), seenSig = new Set(), flat = []
  for (const g of order) { flat.push(g[0]); seenSig.add(sig(g[0])) }
  for (const g of order) for (const o of g) if (!seenSig.has(sig(o))) { seenSig.add(sig(o)); flat.push(o) }
  const start = Math.max(0, Math.min(rank, flat.length - 1)), seq = [[...flat.slice(start), ...flat.slice(0, start)]]
  const tryOption = (o, needTable) => {
    const added = []
    for (const it of o.items) { if (!ctx.can(it)) { added.reverse().forEach((x) => ctx.remove(x)); return false } ctx.add(it); added.push(it) }
    if (!ctx.circOK() || (needTable && !placeDining(ctx, seats))) { added.reverse().forEach((x) => ctx.remove(x)); return false }
    return true
  }
  for (const needTable of seats ? [true, false] : [false]) for (const g of seq) for (const o of g) if (tryOption(o, needTable)) return
}

// ================================================================ bathroom, hall, storage, balcony
function bathroom(ctx, rank = 0) {
  const room = ctx.room, area = room.area
  const awayFromDoor = (it) => Math.min(ctx.doorDist(it.x, it.z), 4)
  const facesDoor = (it) => { const f = front(it.rot); return room.doors.some((d) => { const vx = d.at[0] - it.x, vz = d.at[1] - it.z, L = Math.hypot(vx, vz) || 1; return (vx * f[0] + vz * f[1]) / L > 0.85 && L < 3.5 }) ? 1 : 0 }
  if (ctx.lockedOf('bathtub') || ctx.lockedOf('shower')) { /* the user's bath or shower stays */ } else if (room.kind === 'wc') { /* a WC has no bath, however big it is drawn */ } else if (area >= 5) {
    const tubW = area >= 7 ? 1.7 : 1.6
    if (!ctx.takeRanked(ctx.wallCands(ctx.mk('bathtub', { w: tubW }), (it, e, s) => awayFromDoor(it) * 0.3 + (Math.min(s - it.w / 2, e.len - s - it.w / 2) < 0.05 ? 0.8 : 0), { take: 4, step: 0.1 }), rank)) ctx.takeRanked(ctx.wallCands(ctx.mk('shower'), (it) => awayFromDoor(it) * 0.3, { take: 4, step: 0.05 }), rank)
  } else if (room.kind === 'bathroom' && area >= 3.4) ctx.takeRanked(ctx.wallCands(ctx.mk('shower'), (it) => awayFromDoor(it) * 0.3, { take: 4, step: 0.05 }), rank)
  const rankedToilet = (area >= 5 && room.kind !== 'wc') || (room.kind === 'bathroom' && area >= 3.4) ? 0 : rank        // in a bathroom the tub or shower already varies; in a WC the toilet does
  if (!room.noToilet && !ctx.lockedOf('toilet')) ctx.takeRanked(ctx.wallCands(ctx.mk('toilet'), (it) => -facesDoor(it) * 1.2 + (ctx.doorDist(it.x, it.z) < 1.2 ? -0.4 : 0) - Math.abs(it.x - room.bb.x0 - room.bb.w / 2) * 0.02, { take: 4, step: 0.05 }), rankedToilet)
  if (!ctx.lockedOf('vanity')) ctx.take(ctx.wallCands(ctx.mk('vanity', { w: area >= 6 ? 0.8 : 0.6 }), (it) => -facesDoor(it) * 0.5 - Math.min(ctx.doorDist(it.x, it.z), 3) * 0.1, { take: 4, step: 0.05 })) || ctx.take(ctx.wallCands(ctx.mk('vanity', { w: 0.6 }), () => 0, { take: 4, step: 0.05 }))
  if (area >= 7.5 && !ctx.lockedOf('washer') && !ctx.locked.some((i) => i.fixed)) ctx.take(ctx.wallCands(ctx.mk('washer'), (it) => awayFromDoor(it) * 0.1, { take: 3, step: 0.1 }))
}

function hall(ctx, rank = 0) {
  const area = ctx.room.area
  if (area < 3) return
  if (!ctx.lockedOf('shoe_cabinet')) ctx.takeRanked(ctx.wallCands(ctx.mk('shoe_cabinet', { w: area >= 6 ? 1.2 : 0.9 }), (it) => -Math.min(ctx.doorDist(it.x, it.z), 3) * 0.2, { take: 4, step: 0.1 }), rank)
  if (!ctx.items.length && !ctx.lockedOf('shoe_cabinet')) ctx.take(ctx.wallCands(ctx.mk('shoe_cabinet', { w: 0.6 }), (it) => -Math.min(ctx.doorDist(it.x, it.z), 3) * 0.2, { take: 4, step: 0.1 }))          // a hall that is all doors: a narrow cabinet, or at least a plant
  if (area >= 8 && !ctx.lockedOf('wardrobe')) ctx.take(ctx.wallCands(ctx.mk('wardrobe', { w: 1.6 }), (it) => -ctx.doorDist(it.x, it.z) * 0.05, { take: 3, step: 0.1 }))
  cornerPlant(ctx)
  if (!ctx.items.length) ctx.take(ctx.wallCands(ctx.mk('plant'), (it) => -ctx.doorDist(it.x, it.z) * 0.1, { take: 4, step: 0.1 }))
}

function storage(ctx) {
  for (let n = ctx.items.filter((i) => i.type === 'wardrobe').length; n < 4; n++) {
    let got = null
    for (const w of [3.0, 2.4, 1.8, 1.2, 0.9]) {
      got = ctx.take(ctx.wallCands(ctx.mk('wardrobe', { w }), (it, e) => e.len * 0.1 - ctx.doorDist(it.x, it.z) * -0.02, { take: 2, step: 0.1 }))
      if (got) break
    }
    if (!got) break
  }
}

// ================================================================ terrace and balcony: outdoor areas
// A railing instead of walls, the house wall on one side, doors or glazing to the rooms inside. Zones: dining near the kitchen door, a lounge in front of the living room,
// sun loungers away from the doors, a grill by the kitchen, planters along the railing. Tables and chairs keep away from the railing (children climb them).
const distTo = (it, p) => Math.hypot(it.x - p[0], it.z - p[1])
const anchorPoint = (a) => (a ? [a.at[0] + a.n[0] * 1.2, a.at[1] + a.n[1] * 1.2] : null)
const houseWall = (it, e) => !e.rail
function outdoorAnchors(room) {
  const open = [...room.doors, ...room.windows.filter((w) => w.otherKind && w.otherKind !== 'none')]
  const pick = (kinds) => open.find((a) => kinds.includes(a.otherKind))
  return { kitchen: pick(['kitchen']), living: pick(['living']), any: open[0] }
}

function planters(ctx, max) {
  const placed = []
  for (let n = 0; n < max; n++) {
    const got = ctx.take(ctx.wallCands(ctx.mk('planter'), (it) => Math.min(3, placed.length ? Math.min(...placed.map((p) => distTo(it, [p.x, p.z]))) : 3) * 0.5 - Math.min(ctx.doorDist(it.x, it.z), 2) * -0.1, { take: 3, step: 0.2, filter: (it, e) => e.rail }))
    if (!got) break
    placed.push(got)
  }
  return placed
}

function smallOutdoor(ctx, rank, anchors) {
  const room = ctx.room, area = room.area, minDim = Math.min(room.bb.w, room.bb.d)
  const away = anchors.any ? anchorPoint(anchors.any) : null
  let sat = null
  if (minDim >= 1.2 && area >= 3.5) {
    for (const f of [houseWall, null]) {
      const cands = ctx.wallCands(ctx.mk('bistro_table'), (it) => (away ? Math.min(distTo(it, away), 3) * 0.05 : 0), { take: 4, step: 0.1, filter: f ? (it, e) => f(it, e) : null })
      sat = ctx.takeRanked(cands, rank); if (sat) break
    }
    if (sat) for (const sg of [1, -1]) { const ch = ctx.mk('chair'), r = side(sat.rot); ctx.at(ch, sat.x + r[0] * sg * (0.3 + ch.d / 2 + 0.05), sat.z + r[1] * sg * (0.3 + ch.d / 2 + 0.05), rotOf(-r[0] * sg, -r[1] * sg)); ctx.addSafe(ch) }
  }
  if (!sat) {            // too narrow for a table: two chairs and a little table between them along the house wall
    const tab = ctx.take(ctx.wallCands(ctx.mk('side_table'), () => 0, { take: 4, step: 0.1, filter: (it, e) => !e.rail && e.len >= 1.4 }))
    if (tab) for (const sg of [1, -1]) { const ch = ctx.mk('chair'), r = side(tab.rot); ctx.at(ch, tab.x + r[0] * sg * (tab.w / 2 + ch.w / 2 + 0.08), tab.z + r[1] * sg * (tab.w / 2 + ch.w / 2 + 0.08), tab.rot); ctx.addSafe(ch) }
  }
  if (area >= 4) planters(ctx, area >= 7 ? 2 : 1)
  if (area >= 5) cornerPlant(ctx)
}

// the chairs that fit around a table, all added, then the walking routes checked once (when they are cut off, the chairs come out again and the list is empty)
function seatBatch(ctx, table, seats) {
  const placed = []
  for (const c of seatSpots(ctx, table, seats)) if (ctx.can(c)) { ctx.add(c); placed.push(c) }
  if (placed.length && !ctx.circOK()) { for (const c of placed) ctx.remove(c); return [] }
  return placed
}

// a table with all of its chairs: the first spot where every chair fits wins; otherwise the spot that seats the most (at least four)
function diningSet(ctx, cands, seats) {
  let best = null
  for (const c of cands) {
    const table = ctx.take([c]); if (!table) continue
    const chairs = seatBatch(ctx, table, seats)
    if (chairs.length >= seats) return table
    if (!best || chairs.length > best.n) best = { c, n: chairs.length }
    for (const ch of chairs) ctx.remove(ch)
    ctx.remove(table)
  }
  if (best && best.n >= Math.min(4, seats)) { const table = ctx.take([best.c]); if (table) { seatBatch(ctx, table, seats); return table } }
  return null
}

// an outdoor sofa with the coffee table in front of it (and armchairs at the sides): a spot only wins when the table fits as well, house wall first, then smaller sofas, then the railing;
// when nothing takes the table, the best sofa stands alone
function loungeSet(ctx, widths, area, score, rank) {
  let alone = null
  for (const [f, sw] of widths.map((w) => [houseWall, w]).concat(widths.map((w) => [null, w]))) {
    const cands = ctx.wallCands(ctx.mk('outdoor_sofa', { w: sw }), score, { take: 4, step: 0.2, filter: f ? (it, e) => f(it, e) : null })
    for (const c of ctx.ranked(cands, rank).slice(0, 8)) {
      const fr0 = front(c.it.rot), t0 = ctx.mk('coffee_table', { w: 0.9, d: 0.55 }), d0 = c.it.d / 2 + 0.42 + t0.d / 2
      if (!ctx.lockedOf('coffee_table')) { ctx.at(t0, c.it.x + fr0[0] * d0, c.it.z + fr0[1] * d0, c.it.rot); if (!ctx.can(t0)) { if (!alone) alone = c; continue } }          // no room for the table in front of this spot: next spot
      const sofa = ctx.take([c]); if (!sofa) continue
      const fr = front(sofa.rot), t = ctx.mk('coffee_table', { w: 0.9, d: 0.55 }), dist = sofa.d / 2 + 0.42 + t.d / 2
      ctx.at(t, sofa.x + fr[0] * dist, sofa.z + fr[1] * dist, sofa.rot)
      const tab = ctx.lockedOf('coffee_table') || ctx.addSafe(t)
      if (!tab) { if (!alone) alone = c; ctx.remove(sofa); continue }
      const sd = side(sofa.rot); let placed = 0
      for (const sg of [1, -1]) {
        if (placed >= (area >= 24 ? 2 : 1)) break
        const arm = ctx.mk('armchair'), dir = [sd[0] * sg, sd[1] * sg], d2 = tab.w / 2 + 0.45 + arm.d / 2
        ctx.at(arm, tab.x + dir[0] * d2, tab.z + dir[1] * d2, rotOf(-dir[0], -dir[1]))
        if (ctx.addSafe(arm)) placed++
      }
      return sofa
    }
  }
  if (alone) { const sofa = ctx.take([alone]); if (sofa) return sofa }
  return null
}

function outdoor(ctx, rank = 0) {
  const room = ctx.room, area = room.area
  if (area < 2.5) return
  const A = outdoorAnchors(room)
  if (area < 9) return smallOutdoor(ctx, rank, A)
  const dineAt = anchorPoint(rank % 3 === 1 ? A.living || A.any : A.kitchen || A.any), loungeAt = anchorPoint(rank % 3 === 1 ? A.kitchen || A.any : A.living || A.any)
  const bb = room.bb, cx = bb.x0 + bb.w / 2, cz = bb.z0 + bb.d / 2, tableDist = rank % 3 === 2 ? 4.5 : 3.0
  // ---- dining: the table where the kitchen door is close, with all of its chairs (clear space all round keeps it away from the railing)
  let table = ctx.lockedOf('outdoor_table')
  if (table) {
    const have = ctx.items.filter((i) => i.type === 'chair' && ctx.gapBetween(i, table) < 0.15).length
    if (have < 2) seatChairs(ctx, table, table.w >= 2.2 ? 8 : table.w >= 1.7 ? 6 : 4)
  } else {
    const sets = (area >= 30 ? [[6, 2.0, 1.0], [6, 1.8, 0.9], [4, 1.4, 0.8]] : area >= 16 ? [[6, 1.8, 0.9], [4, 1.4, 0.8]] : [[4, 1.4, 0.8]])
    for (const [seats, w, d] of sets) {
      const cands = []
      for (const rot of [0, Math.PI / 2]) for (let x = bb.x0; x <= bb.x1; x += 0.2) for (let z = bb.z0; z <= bb.z1; z += 0.2) {
        if (!pip(x, z, room.poly)) continue
        const it = ctx.mk('outdoor_table', { w, d }); ctx.at(it, x, z, rot)
        if (!ctx.can(it)) continue
        const fit = seatSpots(ctx, it, seats).filter((c) => ctx.can(c)).length          // how many of the chairs have a place at this spot (cheap: no walking check yet)
        cands.push({ it, fit, score: (fit >= seats ? 100 : 0) + fit * 5 + (dineAt ? -Math.abs(distTo(it, dineAt) - tableDist) * 0.6 : -Math.hypot(x - cx, z - cz) * 0.3) + ((rot === Math.PI / 2) === (bb.d > bb.w) ? 0.2 : 0) })
      }
      cands.sort((p, q) => q.score - p.score)
      table = diningSet(ctx, cands.filter((c) => c.fit >= seats).slice(0, 5), seats); if (table) break          // only spots where every chair fits; a smaller table is tried before a big one with missing chairs
    }
    if (!table) {            // nothing seats a full set: the largest table that seats at least four
      const [seats, w, d] = sets[0], cands = []
      for (const rot of [0, Math.PI / 2]) for (let x = bb.x0; x <= bb.x1; x += 0.2) for (let z = bb.z0; z <= bb.z1; z += 0.2) {
        if (!pip(x, z, room.poly)) continue
        const it = ctx.mk('outdoor_table', { w, d }); ctx.at(it, x, z, rot)
        if (!ctx.can(it)) continue
        const fit = seatSpots(ctx, it, seats).filter((c) => ctx.can(c)).length
        if (fit >= 4) cands.push({ it, fit, score: fit * 5 + (dineAt ? -Math.abs(distTo(it, dineAt) - tableDist) * 0.6 : 0) })
      }
      cands.sort((p, q) => q.score - p.score)
      table = diningSet(ctx, cands.slice(0, 3), seats)
    }
  }
  // ---- lounge: an outdoor sofa against the house wall near the living room, a table in front, armchairs, a rug
  if (area >= 12 && !ctx.lockedOf('outdoor_sofa')) {
    const widths = area >= 24 ? [2.4, 2.0, 1.7] : area >= 16 ? [2.0, 1.7] : [1.7]
    loungeSet(ctx, widths, area, (it, e) => (loungeAt ? -Math.min(distTo(it, loungeAt), 8) * 0.15 : 0) + Math.min(e.len, 8) * 0.1 - (table ? Math.max(0, 2.6 - distTo(it, [table.x, table.z])) * 1.0 : 0), rank)
  }
  // ---- sun loungers, side by side, on the house wall away from the doors and the other groups
  if (area >= 20 && !ctx.lockedOf('lounger')) {
    const others = ctx.items.filter((i) => ['outdoor_table', 'outdoor_sofa'].includes(i.type))
    let l1 = null
    for (const f of [(it, e) => !e.rail, null]) {          // against the house wall first, then against the railing
      l1 = ctx.take(ctx.wallCands(ctx.mk('lounger'), (it) => Math.min(ctx.doorDist(it.x, it.z), 6) * 0.2 + (others.length ? Math.min(...others.map((o) => distTo(it, [o.x, o.z]))) * 0.2 : 0), { take: 4, step: 0.2, filter: f }))
      if (l1) break
    }
    if (l1) {          // a second lounger beside the first, with a small table between them
      const r = side(l1.rot), l2 = ctx.mk('lounger'), gapW = 0.55, off = l1.w + gapW
      let sg = 1; ctx.at(l2, l1.x + r[0] * off, l1.z + r[1] * off, l1.rot)
      if (!ctx.addSafe(l2)) { sg = -1; ctx.at(l2, l1.x - r[0] * off, l1.z - r[1] * off, l1.rot); if (!ctx.addSafe(l2)) sg = 0 }
      if (sg) { const t = ctx.mk('side_table'), f = front(l1.rot), back = l1.d / 2 - 0.4; ctx.at(t, l1.x + r[0] * sg * off / 2 - f[0] * back, l1.z + r[1] * sg * off / 2 - f[1] * back, 0); ctx.addSafe(t) }
    }
  }
  // ---- a grill by the kitchen, a storage bench, planters on the railing, potted plants in the corners
  if (area >= 14 && A.kitchen && !ctx.lockedOf('grill')) ctx.take(ctx.wallCands(ctx.mk('grill'), (it) => -Math.abs(distTo(it, anchorPoint(A.kitchen)) - 2.2) * 0.4, { take: 4, step: 0.2, filter: (it, e) => !e.rail }))
  if (area >= 20 && !ctx.lockedOf('deck_box')) ctx.take(ctx.wallCands(ctx.mk('deck_box'), (it) => Math.min(ctx.doorDist(it.x, it.z), 6) * 0.1, { take: 3, step: 0.2, filter: (it, e) => !e.rail }))
  const railLen = room.edges.filter((e) => e.rail).reduce((s, e) => s + e.len, 0)
  planters(ctx, Math.min(8, Math.floor(railLen / 2.6)))
  cornerPlant(ctx); cornerPlant(ctx)
}

// ================================================================ rugs under the groups
function rugs(ctx) {
  const room = ctx.room
  const put = (x, z, rot, w, d) => {
    for (const k of [1, 0.9, 0.8, 0.7, 0.6]) {
      const r = ctx.mk('rug', { w: +(w * k).toFixed(2), d: +(d * k).toFixed(2) }); ctx.at(r, x, z, rot)
      if (ctx.can(r)) { r.id = `${room.i}-rug-${ctx.n++}`; r._keep = []; ctx.items.push(r); return r }
    }
    return null
  }
  if (ctx.items.some((i) => i.type === 'rug')) return
  if (room.kind === 'living') {
    const sofa = ctx.items.find((i) => i.type === 'sofa'), tab = ctx.items.find((i) => i.type === 'coffee_table')
    if (sofa && tab) { const f = front(sofa.rot); put(sofa.x + f[0] * (sofa.d / 2 + 0.6), sofa.z + f[1] * (sofa.d / 2 + 0.6), sofa.rot, Math.max(2.4, sofa.w), 1.7) }
  }
  if (room.outdoor && room.area >= 14) {
    const sofa = ctx.items.find((i) => i.type === 'outdoor_sofa'), tab = ctx.items.find((i) => i.type === 'coffee_table')
    if (sofa && tab) { const f = front(sofa.rot); put(sofa.x + f[0] * (sofa.d / 2 + 0.55), sofa.z + f[1] * (sofa.d / 2 + 0.55), sofa.rot, Math.max(2.2, sofa.w), 1.6) }
  }
  if (room.kind === 'bedroom') {
    const bed = ctx.items.find((i) => i.type === 'bed')
    if (bed) { const f = front(bed.rot); put(bed.x + f[0] * (bed.d / 2 - 0.05), bed.z + f[1] * (bed.d / 2 - 0.05), bed.rot, bed.w + 0.5, 1.5) }
  }
}

// ================================================================ office (a workspace) and meeting room
// A workspace: desks with their chairs, along the walls first and then in back-to-back pairs across the middle, as many as the floor allows (about one desk for every 4.5 m2), then storage.
// Every desk and chair passes the same hard rules as the rest (clear space, doors, windows, walking routes); `rank` changes the direction and the corner the rows start from.
function officeDesk(ctx, desk) {
  if (!ctx.can(desk)) return null
  ctx.add(desk)
  const ch = ctx.mk('chair'), f = front(desk.rot), dist = desk.d / 2 + ch.d / 2 + 0.1
  ctx.at(ch, desk.x + f[0] * dist, desk.z + f[1] * dist, desk.rot + Math.PI)
  if (!ctx.can(ch)) { ctx.remove(desk); return null }          // a desk nobody can sit at is not placed
  ctx.add(ch)
  if (!ctx.circOK()) { ctx.remove(ch); ctx.remove(desk); return null }
  return desk
}
function office(ctx, rank) {
  const room = ctx.room, area = room.area, bb = room.bb
  const want = Math.max(1, Math.min(22, Math.floor(area / 4.5))), count = () => ctx.items.filter((i) => i.type === 'desk').length
  // along the walls: the best free spot, again and again (windows are liked, the doorway is not)
  for (let guard = 0; guard < 24 && count() < want; guard++) {
    const cands = ctx.wallCands(ctx.mk('desk', { w: 1.4, d: 0.7 }), (it, e, s) => (ctx.windowOn(e, s - it.w / 2, s + it.w / 2) ? 0.6 : 0) + Math.min(ctx.doorDist(it.x, it.z), 4) * 0.1, { step: 0.1, take: 4 })
    let ok = false
    for (const c of cands) if (officeDesk(ctx, c.it)) { ok = true; break }
    if (!ok) break
  }
  // across the middle: pairs of desks back to back (their chairs on the outer sides), rows from one end of the room
  if (count() < want && area >= 14) {
    const spots = []
    for (const rot of rank % 2 ? [Math.PI / 2, 0] : [0, Math.PI / 2]) for (let x = bb.x0; x <= bb.x1; x += 0.2) for (let z = bb.z0; z <= bb.z1; z += 0.2) if (pip(x, z, room.poly)) spots.push({ x, z, rot })
    spots.sort((a, b) => (rank >= 2 ? (b.x + b.z) - (a.x + a.z) : (a.x + a.z) - (b.x + b.z)))
    for (const sp of spots) {
      if (count() >= want) break
      const a = ctx.mk('desk', { w: 1.4, d: 0.7 }); ctx.at(a, sp.x, sp.z, sp.rot)
      if (!ctx.can(a)) continue
      const fa = front(sp.rot), b = ctx.mk('desk', { w: 1.4, d: 0.7 }); ctx.at(b, sp.x - fa[0] * a.d, sp.z - fa[1] * a.d, sp.rot + Math.PI)
      if (!ctx.can(b)) continue
      const da = officeDesk(ctx, a); if (!da) continue
      if (!officeDesk(ctx, b) && count() < 1) ctx.remove(da)
    }
  }
  if (area >= 14) for (let k = 0; k < (area >= 40 ? 3 : area >= 24 ? 2 : 1); k++) ctx.take(ctx.wallCands(ctx.mk('shelf', { w: 0.9 }), (it, e, s) => -ctx.doorDist(it.x, it.z) * -0.05 - (ctx.windowOn(e, s - 0.5, s + 0.5) ? 1 : 0), { step: 0.1, take: 3 }))
  if (area >= 30) ctx.take(ctx.wallCands(ctx.mk('sideboard', { w: 1.6 }), (it, e, s) => -ctx.doorDist(it.x, it.z) * -0.05 - (ctx.windowOn(e, s - 0.8, s + 0.8) ? 1 : 0), { step: 0.1, take: 3 }))
  cornerPlant(ctx)
}
// A meeting room: one table in the middle with chairs round it, a cabinet along a wall, a plant.
function meeting(ctx, rank) {
  const room = ctx.room, area = room.area
  placeDining(ctx, area >= 22 ? 8 : area >= 11 ? 6 : 4)
  if (area >= 10 && !ctx.lockedOf('sideboard')) ctx.take(ctx.wallCands(ctx.mk('sideboard', { w: 1.6 }), (it, e, s) => -ctx.doorDist(it.x, it.z) * -0.05 - Math.abs(s - e.len / 2) * 0.1 - (ctx.windowOn(e, s - 0.8, s + 0.8) ? 1 : 0), { step: 0.1, take: 3 }))
  cornerPlant(ctx)
}

const RECIPES = { living, bedroom, office, meeting, kitchen, bathroom, wc: bathroom, hall, storage, balcony: outdoor, terrace: outdoor }

// ================================================================ pieces from product links
// plan._overrides[roomIndex][type] = { w, d, h, product, finish }: a product that replaces the catalogue's piece of that type in that room (a sofa of exactly that size)
// plan._extras = [{ room, type, w, d, h, product, finish }]: products added on top of what the room already has
// furniture the plan itself shows as built in (a bathtub, a sink counter, a shower cabin drawn in the plan): locked in place, in every arrangement and every refit
export function fixedOf(plan, space) {
  const out = []
  ;(plan.furniture || []).forEach((f, k) => {
    if (!f.fixed || !TYPES[f.type]) return
    const room = space.rooms.find((r) => pip(f.x, f.z, r.poly)); if (!room) return
    out.push({ ...make(f.type, { w: f.w, d: f.d, h: f.h }), x: f.x, z: f.z, rot: f.rot || 0, id: 'fx' + k, room: room.i, locked: true, fixed: true })
  })
  return out
}
// products the person put at a spot of their own choosing (a click on the plan): locked there before the rest of the room is arranged, in every arrangement and refit
export function pinnedOf(plan, space) {
  const out = []
  for (const e of plan._extras || []) {
    if (!e.at || !e.product?.id) continue
    const room = space.rooms[e.room]; if (!room) continue
    const it = { ...make(e.type || 'product', { w: e.w, d: e.d, h: e.h, product: e.product, finish: e.finish }), x: e.at.x, z: e.at.z, rot: e.at.rot || 0, id: 'x-' + e.product.id, room: room.i, locked: true, pinned: true }
    if (fitsRoom(room, bodyOf(it))) out.push(it)          // a spot that has become outside the room (the plan was changed) is not kept: the piece is placed again by the engine
  }
  return out
}
const withFixed = (plan, space, keep) => { const f = [...fixedOf(plan, space), ...pinnedOf(plan, space)].filter((x) => !keep.some((k) => k.id === x.id)); return f.length ? [...keep, ...f] : keep }
const overridesOf = (plan, room) => plan._overrides?.[room.i] || null
// the arrangement a room shows for a rank: its own rank, or the further rank layout/variants.js found for it when the plain one repeated an earlier arrangement
const effRank = (plan, room, rank) => plan._eff?.[room.i]?.[rank] ?? rank
const extrasOf = (plan, room) => (plan._extras || []).filter((e) => e.room === room.i)

// a piece read from a product page, placed in the room of ctx: against a wall first (clear space kept, walking routes open), then anywhere it fits; null when there is no spot
export function placeProduct(ctx, spec) {
  const id = spec.product?.id
  if (id && ctx.items.some((i) => i.product?.id === id)) return ctx.items.find((i) => i.product?.id === id)
  const proto = ctx.mk(spec.type || 'product', spec, true), room = ctx.room
  let got = null
  if (spec.at) {
    // the spot the person chose: exactly there if the piece can stand there (inside the room, clear of every piece and door); tight clear space is allowed, it is shown as a note afterwards
    const it = { ...proto, x: spec.at.x, z: spec.at.z, rot: spec.at.rot || 0, locked: true, pinned: true }; delete it._b
    const r = ctx.check(it)
    if (!r.why || /^(clear|blocks|near|railing)/.test(r.why)) { it._keep = r.keep || []; it.room = room.i; it.id = id ? 'x-' + id : `${room.i}-${it.type}-${ctx.n++}`; ctx.items.push(it); ctx.n++; return it }
  }
  if (proto.free && !proto.floor) {
    // a piece that stands free (a kitchen island): the spot nearest the middle of the room's open floor that keeps its clear space and the walking routes; if the room is too full for the
    // comfortable space (90 cm all round) a tighter one is tried (down to 60 cm, the narrowest passage), and last a spot against a wall
    const cx = room.bb.x0 + room.bb.w / 2, cz = room.bb.z0 + room.bb.d / 2, runs = ctx.items.filter((i) => i.type === 'counter')          // an island goes about 1.7 m from the kitchen run, else the middle
    const spotScore = (x, z) => (runs.length ? -Math.min(...runs.map((c) => Math.abs(Math.hypot(x - c.x, z - c.z) - 1.7))) : -Math.hypot(x - cx, z - cz))
    for (const k of [1, 0.85, 0.75]) {
      const tight = { ...proto, clearMin: Object.fromEntries(Object.entries(proto.clearMin).map(([s, v]) => [s, Math.max(0.6, +(v * k).toFixed(2))])) }, spots = []
      for (let x = room.bb.x0 + proto.w / 2; x <= room.bb.x1; x += 0.1) for (let z = room.bb.z0 + proto.d / 2; z <= room.bb.z1; z += 0.1) for (const rot of [0, Math.PI / 2]) { const it = { ...tight }; ctx.at(it, x, z, rot); if (ctx.can(it)) spots.push({ it, score: spotScore(x, z) }) }
      spots.sort((a, b) => b.score - a.score); got = ctx.take(spots.slice(0, 12)); if (got) break
    }
  } else if (proto.floor) {
    // a rug or a mat: the middle of the room if it fits there, else the nearest spot to it that does
    const cx = room.bb.x0 + room.bb.w / 2, cz = room.bb.z0 + room.bb.d / 2, spots = []
    for (let x = room.bb.x0; x <= room.bb.x1; x += 0.2) for (let z = room.bb.z0; z <= room.bb.z1; z += 0.2) spots.push([x, z, Math.hypot(x - cx, z - cz)])
    spots.sort((a, b) => a[2] - b[2]); spots.unshift([cx, cz, 0])
    for (const [x, z] of spots) { const it = { ...proto }; ctx.at(it, x, z, 0); if (ctx.can(it)) { ctx.add(it); got = it; break } }
  } else {
    got = ctx.take(ctx.wallCands(proto, (it, e, s) => -ctx.doorDist(it.x, it.z) * -0.05 - Math.abs(s - e.len / 2) * 0.02 + (ctx.windowOn(e, s - it.w / 2, s + it.w / 2) ? -0.3 : 0), { take: 5, step: 0.1 }))
    const bb = room.bb
    for (let x = bb.x0 + proto.w / 2; !got && proto.w * proto.d < room.area && x <= bb.x1; x += 0.1) for (let z = bb.z0 + proto.d / 2; !got && z <= bb.z1; z += 0.1) {
      for (const rot of [0, Math.PI / 2]) { const it = { ...proto }; ctx.at(it, x, z, rot); if (ctx.can(it)) { ctx.add(it); if (ctx.circOK()) { got = it; break } ctx.remove(it) } }
    }
  }
  if (!got && proto.free) { const flat = { ...proto, clearMin: { ...proto.clearMin, back: 0 }, clear: { ...proto.clear, back: 0 } }; got = ctx.take(ctx.wallCands(flat, () => 0, { take: 5, step: 0.1 })) }          // no room to stand free: against a wall rather than nowhere
  if (got && id) got.id = 'x-' + id
  return got
}
function placeExtras(ctx, extras, notes) {
  for (const e of extras) { try { if (!placeProduct(ctx, e)) notes?.push({ room: ctx.room.i, name: ctx.room.name, note: 'no free spot for ' + (e.product?.name || e.type) }) } catch (err) { notes?.push({ room: ctx.room.i, name: ctx.room.name, note: 'failed: ' + err.message }) } }
}

// ================================================================ the whole plan
// keep: pieces to leave exactly where they are (the ones the user locked); every room is furnished around the ones that belong to it
export function layoutPlan(plan, { rank = 0, space = buildSpace(plan), keep: keep0 = [] } = {}) {
  const ctxs = new Map(), notes = [], keep = withFixed(plan, space, keep0)
  for (const room of space.rooms) {
    const er = effRank(plan, room, rank), ctx = new Ctx(room, [], overridesOf(plan, room)); ctx.rank = er; ctx.lock(keep.filter((i) => i.room === room.i)); ctxs.set(room.i, ctx)
    const f = plan._empty ? null : RECIPES[room.kind]          // _empty: the rooms are left bare (only fixed pieces and the extras the person adds)
    if (!f) { if (!plan._empty) notes.push({ room: room.i, name: room.name, note: 'not furnished (' + room.kind + ')' }); continue }
    try { f(ctx, er) } catch (e) { notes.push({ room: room.i, name: room.name, note: 'failed: ' + e.message }) }
  }
  // an open-plan "kitchen and dining" that has no space for the table borrows the living room it opens into
  for (const room of space.rooms) {
    const ctx = ctxs.get(room.i)
    if (room.kind !== 'kitchen' || !room.dining || ctx.items.some((i) => i.type === 'dining_table')) continue
    const ids = new Set(room.doors.map((d) => d.id))
    for (const other of space.rooms) {
      if (other.kind !== 'living' || !other.doors.some((d) => ids.has(d.id))) continue
      const t = placeDining(ctxs.get(other.i), other.area >= 24 ? 6 : 4)
      if (t) { notes.push({ room: other.i, name: other.name, note: 'dining table for ' + room.name }); break }
    }
  }
  const items = []
  for (const room of space.rooms) {
    const ctx = ctxs.get(room.i); if (!RECIPES[room.kind] && !ctx.locked.length) continue
    placeExtras(ctx, extrasOf(plan, room), notes)
    try { if (RECIPES[room.kind] && !plan._empty) rugs(ctx) } catch (e) { notes.push({ room: room.i, name: room.name, note: 'rugs failed: ' + e.message }) }
    items.push(...ctx.items.map(plain))
  }
  return { items, notes, space }
}
// one room again, with the locked pieces of that room kept: all the items of the room (locked and new)
// others: the pieces of the other rooms, so a living room that lends its floor to an open "kitchen and dining" without a table still gets that table
export function layoutRoom(plan, roomIndex, { rank = 0, space = buildSpace(plan), keep: keep0 = [], others = [] } = {}) {
  const room = space.rooms[roomIndex]; if (!room) return []
  const keep = withFixed(plan, space, keep0)
  const ctx = new Ctx(room, [], overridesOf(plan, room)); ctx.rank = rank; ctx.lock(keep.filter((i) => i.room === room.i))
  const f = plan._empty ? null : RECIPES[room.kind]
  if (f) {
    try { f(ctx, rank) } catch { /* the room keeps what was placed so far */ }
    if (room.kind === 'living' && !ctx.items.some((i) => i.type === 'dining_table')) {
      const ids = new Set(room.doors.map((d) => d.id))
      for (const k of space.rooms) {
        if (k.kind !== 'kitchen' || !k.dining || !k.doors.some((d) => ids.has(d.id)) || others.some((i) => i.room === k.i && i.type === 'dining_table')) continue
        try { placeDining(ctx, room.area >= 24 ? 6 : 4) } catch { /* no table */ }
        break
      }
    }
    placeExtras(ctx, extrasOf(plan, room))
    try { rugs(ctx) } catch { /* no rug */ }
  }
  else placeExtras(ctx, extrasOf(plan, room))
  return ctx.items.map(plain)
}
// the whole layout with one room furnished again: the other rooms stay as they are
export function refitRoom(plan, items, roomIndex, { rank = 0, space = buildSpace(plan) } = {}) {
  const keep = items.filter((i) => i.room === roomIndex && i.locked)
  const others = items.filter((i) => i.room !== roomIndex)
  return [...others, ...layoutRoom(plan, roomIndex, { rank: effRank(plan, { i: roomIndex }, rank), space, keep, others })]
}
export { Ctx, buildSpace, plain, bodyOf }

// ---- a layout the person has edited (room.custom) cannot be furnished again from scratch, so a product goes into it by hand:
// added as an extra piece at the best free spot of the room they chose (null when there is none)
export function addProductTo(plan, items, roomIndex, spec, { space = buildSpace(plan) } = {}) {
  const room = space.rooms[roomIndex]; if (!room) return null
  const ctx = new Ctx(room, items.filter((i) => i.room === room.i).map((i) => ({ ...i })))
  const got = placeProduct(ctx, spec)
  return got ? { ...plain(got), room: room.i } : null
}
// or put in the place of the piece of its type that the room has (same spot, same turn). Null when it does not fit there with its clear space and the walking routes:
// the caller then furnishes the room again around the product
export function swapProduct(plan, items, roomIndex, spec, { space = buildSpace(plan) } = {}) {
  const room = space.rooms[roomIndex]; if (!room) return null
  const mine = items.filter((i) => i.room === roomIndex && i.type === spec.type && !i.floor)
  if (!mine.length) return null
  const ctx = new Ctx(room, []); ctx.lock(items.filter((i) => i.room === roomIndex && !mine.includes(i)))
  const fresh = new Map()
  for (const old of mine) {
    const it = { ...ctx.mk(spec.type, spec, true), x: old.x, z: old.z, rot: old.rot, id: old.id, room: old.room, ...(old.locked ? { locked: true } : {}) }
    const r = ctx.check(it); if (r.why) return null
    it._keep = r.keep; ctx.items.push(it); fresh.set(old, plain(it))
  }
  if (!ctx.circOK()) return null
  return items.map((i) => fresh.get(i) || i)
}

// a piece the client adds from a link: the best free spot (against a wall, clear space kept, walking routes open) in the best room for it
export function placeExtra(plan, items, spec, { space = buildSpace(plan), roomKinds = ['living', 'bedroom', 'office', 'meeting', 'kitchen', 'hall', 'terrace', 'balcony'] } = {}) {
  const rooms = space.rooms.filter((r) => roomKinds.includes(r.kind)).sort((a, b) => roomKinds.indexOf(a.kind) - roomKinds.indexOf(b.kind) || b.area - a.area)
  for (const room of rooms) {
    const ctx = new Ctx(room, items.filter((i) => i.room === room.i).map((i) => ({ ...i })))
    const got = placeProduct(ctx, spec)
    if (got) return { ...plain(got), room: room.i }
  }
  return null
}
