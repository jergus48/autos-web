// Editing a layout by hand: moving a piece with snapping to walls and neighbours, turning, resizing, adding, and measuring the distances
// around a piece. Pure functions on the same item lists the engine produces, so every edit can be validated with validate().
import { obb, front, side, edgesOf, ray, pip, segDist, norm } from './geom.js'
import { make, TYPES } from './catalog.js'
import { Ctx, bodyOf } from './ctx.js'

export const roomIndexAt = (space, x, z) => {
  const hit = space.rooms.find((r) => pip(x, z, r.poly)); if (hit) return hit.i
  let best = -1, bd = Infinity
  for (const r of space.rooms) for (let i = 0; i < r.poly.length; i++) { const d = segDist(x, z, r.poly[i], r.poly[(i + 1) % r.poly.length]); if (d < bd) { bd = d; best = r.i } }
  return best
}

// the sizes of a piece the user may change, found by trying the catalogue
// (a piece read from a product page has the exact size of the product: nothing to adjust)
export const resizable = (type, item = null) => (item?.product ? [] : TYPES[type]?.userSize ? [...TYPES[type].userSize] : [])

export function resize(item, { w, d, mw }) {
  const o = {}
  if (item.type === 'bed') o.mw = mw ?? item.mw ?? 160
  else { o.w = w ?? item.w; if (d !== undefined || resizable(item.type).includes('d')) o.d = d ?? item.d }
  if (item.features) o.features = item.features.map((f) => ({ ...f }))
  if (item.upper) o.upper = true
  const fresh = make(item.type, o)
  if (fresh.features) { const lim = fresh.w - 0.3; fresh.features = fresh.features.map((f) => ({ ...f, at: Math.max(0.3, Math.min(lim, f.at)) })) }
  return { ...item, ...fresh, x: item.x, z: item.z, rot: item.rot, id: item.id, room: item.room }
}

export const turn = (item, quarters = 1) => ({ ...item, rot: norm(item.rot + quarters * Math.PI / 2) })

// ---- what is on each side of a piece: free distance and what stops it
export function around(space, items, item) {
  const room = space.rooms[roomIndexAt(space, item.x, item.z)]; if (!room) return []
  const ctx = new Ctx(room, items.filter((i) => i.id !== item.id && !i.floor && roomIndexAt(space, i.x, i.z) === room.i))
  const f = front(item.rot), r = side(item.rot), out = []
  for (const s of ['front', 'back', 'left', 'right']) {
    const dir = s === 'front' ? f : s === 'back' ? [-f[0], -f[1]] : s === 'right' ? r : [-r[0], -r[1]]
    const off = s === 'front' || s === 'back' ? item.d / 2 : item.w / 2, ox = item.x + dir[0] * off, oz = item.z + dir[1] * off
    let best = ray(ox, oz, dir[0], dir[1], ctx.staticSegs, 12), what = 'wall'
    for (const o of ctx.items) { const t = ray(ox, oz, dir[0], dir[1], edgesOf(bodyOf(o).pts), 12); if (t < best) { best = t; what = TYPES[o.type]?.label || o.type } }
    out.push({ side: s, value: best, what, a: [ox, oz], b: [ox + dir[0] * best, oz + dir[1] * best] })
  }
  return out
}

// ---- moving: the piece follows the pointer, then is pulled flush to a wall or a neighbour that is nearly touching it
// how a piece follows the pointer in the editor: to the centimetre, sticking to a wall or a neighbour only within 6 cm; with Alt held it moves freely (half a centimetre, no sticking)
export const SNAP = { grid: 0.01, pull: 0.06 }, FREE = { grid: 0.005, pull: 0 }
export function snapMove(space, items, item, x, z, { grid = 0.05, pull = 0.12 } = {}) {
  const moved = { ...item, x: Math.round(x / grid) * grid, z: Math.round(z / grid) * grid }; delete moved._b
  const room = space.rooms[roomIndexAt(space, moved.x, moved.z)]
  if (!room) return moved
  const ctx = new Ctx(room, items.filter((i) => i.id !== item.id && !i.floor && !item.floor && roomIndexAt(space, i.x, i.z) === room.i))
  const pullOnce = (axisFilter) => {
    const f = front(moved.rot), r = side(moved.rot), cands = []
    for (const [s, dir, off] of [['front', f, moved.d / 2], ['back', [-f[0], -f[1]], moved.d / 2], ['right', r, moved.w / 2], ['left', [-r[0], -r[1]], moved.w / 2]]) {
      if (axisFilter && Math.abs(dir[0]) > 0.5 !== (axisFilter === 'x')) continue
      let best = Infinity
      for (const k of [-0.8, 0, 0.8]) {
        const along = s === 'front' || s === 'back' ? r : f, half = (s === 'front' || s === 'back' ? moved.w : moved.d) / 2
        const t = ray(moved.x + dir[0] * off + along[0] * half * k, moved.z + dir[1] * off + along[1] * half * k, dir[0], dir[1], ctx.segs(), pull + 0.01)
        if (t < best) best = t
      }
      if (best > 0.002 && best <= pull) cands.push({ dir, t: best })
    }
    cands.sort((a, b) => a.t - b.t)
    return cands[0]
  }
  if (!item.floor) {
    const a = pullOnce(null)
    if (a) { moved.x += a.dir[0] * a.t; moved.z += a.dir[1] * a.t; delete moved._b
      const horizontal = Math.abs(a.dir[0]) > 0.5, b = pullOnce(horizontal ? 'z' : 'x')
      if (b) { moved.x += b.dir[0] * b.t; moved.z += b.dir[1] * b.t; delete moved._b } }
  }
  moved.x = +moved.x.toFixed(3); moved.z = +moved.z.toFixed(3)
  return moved
}

// ---- adding a piece from the catalogue at a free spot in a room (against a wall first, then anywhere)
export function addPiece(space, items, type, opts = {}, roomIndex = null) {
  const rooms = roomIndex !== null && space.rooms[roomIndex] ? [space.rooms[roomIndex]] : [...space.rooms].sort((a, b) => b.area - a.area)
  for (const room of rooms) {
    const ctx = new Ctx(room, items.filter((i) => roomIndexAt(space, i.x, i.z) === room.i).map((i) => ({ ...i })))
    const proto = ctx.mk(type, opts)
    const got = ctx.take(ctx.wallCands(proto, (it, e, s) => -ctx.doorDist(it.x, it.z) * -0.05 - Math.abs(s - e.len / 2) * 0.02, { take: 4, step: 0.1 }))
    if (got) return { ...got, id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 99), room: room.i }
    const bb = room.bb
    for (let x = bb.x0 + proto.w / 2; x <= bb.x1; x += 0.1) for (let z = bb.z0 + proto.d / 2; z <= bb.z1; z += 0.1) {
      const it = { ...proto }; ctx.at(it, x, z, 0)
      if (ctx.can(it)) return { ...it, id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 99), room: room.i }
    }
  }
  // nothing fits with its clear space: drop it in the middle of the room anyway, the checks will say what is wrong
  const room = rooms[0], it = make(type, opts)
  return { ...it, x: room.bb.x0 + room.bb.w / 2, z: room.bb.z0 + room.bb.d / 2, rot: 0, id: 'u' + Date.now().toString(36), room: room.i }
}

export const clean = (it) => { const { _b, _keep, _keepTry, ...rest } = it; return rest }
