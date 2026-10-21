// The three arrangements of the furniture. Every room gets three arrangements that really differ, whenever the room has anything to arrange:
// the engine's own ranks 0, 1 and 2 first, and for a room where two of them came out the same (one wall that works, one place for the bed) further ranks of that room
// (3, 4, ...: the pieces drawn to other places along their walls) until one is different and no worse. The ranks used are kept in plan._eff so that fitting a room again
// gives the same arrangement the person was looking at.
import { buildSpace } from './space.js'
import { layoutPlan, layoutRoom } from './engine.js'
import { validate } from './validate.js'

// does this room look the same in two arrangements? (small pieces do not count: a plant or a chair on the other side is not another arrangement)
export const roomSig = (items, i) => items.filter((x) => x.room === i && !x.floor && !['plant', 'floor_lamp', 'chair'].includes(x.type)).map((x) => `${x.type}@${x.x.toFixed(1)},${x.z.toFixed(1)},${x.rot.toFixed(1)}`).sort().join('|')

const pieces = (items, i) => items.filter((x) => x.room === i && !x.floor).length
const errors = (rep, i) => rep.checks.filter((c) => c.room === i && c.level === 'error').length

export function layoutOptions(plan, { count = 3, space = buildSpace(plan), maxTries = 8 } = {}) {
  plan._eff = null
  const runs = Array.from({ length: count }, (_, rank) => layoutPlan(plan, { rank, space })), items = runs.map((r) => r.items.slice()), eff = {}
  const reps = items.map((it) => validate(plan, it, { space }))
  for (const room of space.rooms) {
    const i = room.i, seen = new Set([roomSig(items[0], i)])
    for (let k = 1; k < count; k++) {
      if (!seen.has(roomSig(items[k], i))) { seen.add(roomSig(items[k], i)); continue }
      if (!pieces(items[k], i)) continue                                  // nothing in the room to arrange
      const others = items[k].filter((x) => x.room !== i), baseErr = errors(reps[k], i), basePieces = pieces(items[k], i)
      for (let e = count; e < count + maxTries; e++) {
        const mine = layoutRoom(plan, i, { rank: e, space, others })
        if (seen.has(roomSig(mine, i)) || pieces(mine, i) < basePieces) continue
        const next = [...others, ...mine]
        if (errors(validate(plan, next, { space }), i) > baseErr) continue
        items[k] = next; (eff[i] ||= {})[k] = e; seen.add(roomSig(mine, i)); break
      }
    }
  }
  plan._eff = Object.keys(eff).length ? eff : null
  return { items, notes: runs[0].notes, space }
}
