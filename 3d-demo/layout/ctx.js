// A room being furnished: what is placed, whether a piece may go somewhere (hard rules), candidate spots along the walls,
// and whether people can still walk to everything. The hard rules here are the same ones layout/validate.js checks afterwards.
import { obb, zone, overlaps, front, side, rotOf, edgesOf, ray, gap, segDist } from './geom.js'
import { RULES, solidHeight, make } from './catalog.js'
import { fitsRoom, freeRun } from './space.js'
import { freeGrid, edt, bottleneck } from './grid.js'

export const SIDES = ['front', 'back', 'left', 'right']
export const bodyOf = (it) => it._b || (it._b = obb(it.x, it.z, it.w, it.d, it.rot))
export const centre = (it) => [it.x, it.z]
const NEED = RULES.walkMin + 0.05                  // the search works on a 10 cm grid, so it keeps 5 cm in hand; the validator measures on 5 cm
const SPREAD_AT = [0.2, 0.8, 0, 1, 0.4, 0.6, 0.1, 0.9]          // where along a wall (0 = its start, 1 = its end) the pieces are drawn to in arrangement 1, 2, 3 ... (see Ctx.spread)
export const spreadAt = (rank, shift = 0) => SPREAD_AT[(rank - 1 + shift) % SPREAD_AT.length]
const OFFS = [0, 0.02, 0.05, 0.1, 0.15, 0.25]       // a piece may stand a little off the wall where the wall solid sticks out

export class Ctx {
  // overrides: { type: { w, d, h, product, finish } }, the pieces of this room that are a real product (read from a shop page) instead of the catalogue's piece of that type
  constructor(room, items = [], overrides = null) { this.room = room; this.overrides = overrides; this.rank = 0; this.items = items; this.n = items.length; this.locked = []; this.staticSegs = [...edgesOf(room.poly), ...room.blockers.flatMap((b) => edgesOf(b.pts))] }

  // pieces the user locked: they stand exactly where they are, with their clear space, and the recipes fill the room around them
  lock(items) {
    for (const src of items) {
      const it = { ...src }; delete it._b; it.room = this.room.i
      const r = this.check(it); it._keep = r.keep || []            // a locked piece that breaks a rule stays anyway (the checks will say so); it just keeps no clear zone
      this.items.push(it); this.locked.push(it); this.n++
    }
    return this
  }
  lockedOf(type) { return this.locked.find((i) => i.type === type) || null }

  // build a piece (not yet placed)
  // raw: the piece exactly as asked, without the product that replaces this type in the room
  mk(type, o = {}, raw = false) { const ov = !raw && this.overrides?.[type]; return make(type, ov ? { ...o, w: ov.w, d: ov.d, h: ov.h, product: ov.product, finish: ov.finish } : o) }
  at(it, x, z, rot) { it.x = x; it.z = z; it.rot = rot; it.room = this.room.i; delete it._b; return it }

  // ---- hard rules: null when the piece may stand there, otherwise the reason why not
  check(it) {
    const room = this.room, body = bodyOf(it)
    if (!fitsRoom(room, body)) return { why: 'outside' }
    if (it.floor) return { keep: [] }
    if (it.climb && room.outdoor && this.railDist(it) < (it.railGap ?? RULES.railClear) - 1e-6) return { why: 'railing' }          // children climb chairs, tables and benches: not within reach of the railing
    for (const d of room.doors) if (overlaps(d.zone, body, 0.01)) { if (!d.soft || freeRun(d, [...this.items.filter((o) => !o.floor && o !== it).map(bodyOf), body]) < RULES.walkGood - 1e-6) return { why: 'door' } }          // a sliding glass door keeps 90 cm of the glass free
    if (!it.decor && !room.outdoor) { const sh = solidHeight(it); if (sh > 0) { for (const w of room.windows) if (w.sill < sh - 0.02 && overlaps(w.zone, body, 0.01)) return { why: 'window' }; for (const d of room.doors) if (d.soft && overlaps(d.zone, body, 0.01)) return { why: 'window' } } }
    const others = this.items.filter((o) => !o.floor)
    for (const o of others) if (overlaps(bodyOf(o), body, 0.004)) return { why: 'overlap ' + o.type }
    if (it.farFrom) for (const o of others) { const lim = it.farFrom[o.type]; if (lim && gap(body, bodyOf(o)) < lim - 1e-6) return { why: 'near ' + o.type } }
    // clear space around the piece itself
    const keep = []
    const need = SIDES.filter((s) => it.clearMin[s] > 0)
    const lr = need.filter((s) => s === 'left' || s === 'right')
    const oneSide = Boolean(it.oneSide) && lr.length === 2           // a bed in a small room needs access on one side only
    const fails = []
    for (const s of need) {
      const z = zone(body, s, it.clearMin[s] + 0.012)      // a centimetre of margin so a measurement of the result never comes out a hair short
      let bad = !fitsRoom(room, z)
      if (!bad) for (const o of others) if (!it.zoneOk.includes(o.type) && overlaps(z, bodyOf(o), 0.01)) { bad = true; break }
      if (bad) fails.push(s); else keep.push({ side: s, depth: it.clearMin[s], o: z })
    }
    if (oneSide && lr.every((s) => fails.includes(s))) return { why: 'no side access' }
    const hard = fails.filter((s) => !(oneSide && (s === 'left' || s === 'right')))
    if (hard.length) return { why: 'clear ' + hard[0] }
    // clear space of the pieces already there must stay free of this one
    for (const o of others) for (const k of o._keep || []) if (!o.zoneOk.includes(it.type) && overlaps(k.o, body, 0.01)) return { why: 'blocks ' + o.type + ' ' + k.side }
    return { keep }
  }
  can(it) { const r = this.check(it); if (r.why) return false; it._keepTry = r.keep; return true }
  add(it) { const r = this.check(it); if (r.why) throw new Error('cannot place ' + it.type + ': ' + r.why); it._keep = r.keep; do { it.id = `${this.room.i}-${it.type}-${this.n++}` } while (this.items.some((x) => x.id === it.id)); this.items.push(it); return it }
  // add the piece only if people can still walk everywhere afterwards
  addSafe(it) { if (!this.can(it)) return null; this.add(it); if (this.circOK()) return it; this.remove(it); return null }
  remove(it) { const i = this.items.indexOf(it); if (i >= 0) this.items.splice(i, 1) }

  // ---- distance in free floor from a point along a direction to the nearest wall, wall solid or piece
  segs(ignore = []) { return [...this.staticSegs, ...this.items.filter((o) => !o.floor && !ignore.includes(o)).flatMap((o) => edgesOf(bodyOf(o).pts))] }
  free(x, z, dx, dz, ignore = [], max = 20) { return ray(x, z, dx, dz, this.segs(ignore), max) }

  // ---- walking: can people get from the doors to the clear space of every piece, and how narrow is the way?
  accessGroups(it) {
    const keep = it._keep || []
    if (it.type === 'bed') return [keep.filter((k) => k.side === 'left' || k.side === 'right')]
    if (it.type === 'dining_table' || it.type === 'bistro_table' || it.type === 'outdoor_table') return [keep]
    const f = keep.find((k) => k.side === 'front')
    return f && it.type !== 'chair' ? [[f]] : []
  }
  circulation(step = this.room.outdoor ? 0.05 : 0.1) {          // outdoor areas are measured on the same 5 cm grid as the validator, so the engine and the check agree
    const room = this.room, its = this.items, need = room.outdoor ? RULES.walkGood : NEED          // outdoors there is room for comfortable passages: 90 cm, not just the 60 cm that is passable
    const bodies = its.filter((i) => !i.floor).map(bodyOf)
    const g = freeGrid(room, bodies, step), d = edt(g)
    const doors = room.doors.map((x) => x.zone)
    const sources = doors.length ? doors : [obb(room.bb.x0 + room.bb.w / 2, room.bb.z0 + room.bb.d / 2, 0.5, 0.5, 0)]
    const exempt = [...doors, ...its.flatMap((i) => (i._keep || []).map((k) => k.o))]
    const b = bottleneck(g, d, sources, exempt)
    const out = { worst: 9, issues: [], widths: [] }
    for (const it of its) for (const grp of this.accessGroups(it)) {
      // a person reaches a clear zone from its sides too, so look at the zone and a hand's width around it
      const w = grp.length ? Math.max(...grp.map((k) => b.inZoneMax(obb(k.o.x, k.o.z, k.o.w + 0.7, k.o.d + 0.7, k.o.rot)))) : 0
      out.widths.push({ item: it, w }); out.worst = Math.min(out.worst, w)
      if (w < need) out.issues.push({ item: it, w })
    }
    // people also have to get from door to door through the room
    if (doors.length >= 2) {
      const b0 = bottleneck(g, d, [doors[0]], exempt)
      doors.slice(1).forEach((z, k) => {
        const w = b0.inZoneMax(obb(z.x, z.z, z.w + 0.7, z.d + 0.7, z.rot))
        out.worst = Math.min(out.worst, w)
        if (w < need) out.issues.push({ item: null, passage: k + 1, w })
      })
    }
    out.ok = out.issues.length === 0
    return out
  }
  circOK(step) { return this.circulation(step).ok }

  // ---- candidate spots: the back of a piece flush against a room wall (front facing into the room)
  // scoreFn(item, edge, s) -> number; the best `take` valid spots per wall, best first
  wallCands(proto, scoreFn = () => 0, { step = 0.05, take = 6, filter = null } = {}) {
    const out = []
    for (const e of this.room.edges) {
      if (e.len < proto.w + 0.02) continue
      const ss = []
      for (let s = proto.w / 2; s <= e.len - proto.w / 2 + 1e-9; s += step) ss.push(s)
      const last = e.len - proto.w / 2; if (Math.abs(ss[ss.length - 1] - last) > 1e-6) ss.push(last)
      const rot = rotOf(e.n[0], e.n[1]), arr = []
      for (const s of ss) {
        const it = { ...proto }
        let off = null
        for (const o of OFFS) {
          this.at(it, e.a[0] + e.t[0] * s + e.n[0] * (proto.d / 2 + o), e.a[1] + e.t[1] * s + e.n[1] * (proto.d / 2 + o), rot)
          if (this.can(it)) { off = o; break }
        }
        if (off === null) continue
        if (filter && !filter(it, e, s)) continue
        it._keepTry = undefined
        arr.push({ it, edge: e, s, off, score: scoreFn(it, e, s) - off * 5 + this.spread(e, s) })
      }
      arr.sort((a, b) => b.score - a.score); out.push(...arr.slice(0, take))
    }
    return out.sort((a, b) => b.score - a.score)
  }

  // the three arrangements of a room differ in more than the wall a piece stands on (a room may have only one wall that works): from rank 1 on the pieces that go on a wall
  // are drawn towards one end of it (rank 1: the start, rank 2: the far end), rank 0 keeps the best spot
  spread(e, s) {
    if (!this.rank) return 0
    const t = SPREAD_AT[(this.rank - 1) % SPREAD_AT.length]
    return -Math.abs(s / e.len - t) * Math.min(e.len, 5) * 0.9
  }

  // first candidate that can be added without cutting off the walking routes; returns the placed item or null
  take(cands) {
    for (const c of cands) {
      const it = c.it ? c.it : c
      if (!this.can(it)) continue
      this.add(it)
      if (this.circOK()) return it
      this.remove(it)
    }
    return null
  }

  // like take(), but the arrangement of the room depends on `rank`: the best spot on the rank-th wall (walls ordered by their best spot) goes first
  takeRanked(cands, rank = 0) { return this.take(this.ranked(cands, rank)) }
  // the candidates in the order takeRanked tries them: the best spot of every wall, starting with the rank-th wall, then all the others
  ranked(cands, rank = 0) {
    const byEdge = new Map()
    for (const c of cands) { const k = c.edge ? c.edge.i : -1; if (!byEdge.has(k) || byEdge.get(k).score < c.score) byEdge.set(k, c) }
    const best = [...byEdge.values()].sort((a, b) => b.score - a.score), start = best.length ? rank % best.length : 0
    return [...best.slice(start), ...best.slice(0, start), ...cands]
  }

  // distance from a piece to the nearest railing edge of an outdoor area (9 when there is none)
  railDist(it) {
    let d = 9; const b = bodyOf(it)
    for (const e of this.room.edges) if (e.rail) for (const c of b.pts) d = Math.min(d, segDist(c[0], c[1], e.a, e.b))
    return d
  }

  // distance from a point to the nearest door
  doorDist(x, z) { return this.room.doors.length ? Math.min(...this.room.doors.map((d) => Math.hypot(d.at[0] - x, d.at[1] - z))) : 9 }
  // is a wall stretch [s0, s1] of an edge broken by a window?
  windowOn(edge, s0, s1) { return edge.openings.some((o) => o.kind === 'window' && o.s1 > s0 && o.s0 < s1) }
  doorOn(edge, s0, s1) { return edge.openings.some((o) => o.kind !== 'window' && o.s1 + 0.05 > s0 && o.s0 - 0.05 < s1) }
  gapBetween(a, b) { return gap(bodyOf(a), bodyOf(b)) }
}

export { front, side, rotOf, zone, overlaps }
