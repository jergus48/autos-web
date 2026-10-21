// The reading check: a plan is read several times (lib/consensus.js) and the reading in the middle is kept. Every room and every door or window of the kept reading carries `support`
// (0 to 1): how far the other readings back it up. This file turns that into what the person sees: which rooms to look at first, a picture of the reading over the uploaded plan,
// and one verdict for the whole plan. No drawing code or page code here, so it can be tested.
export const SURE = 0.85          // at or above this the other readings put the same room in the same place
export const DISAGREE = 0.6       // below this the readings disagree about the room

export const tierOf = (s) => (!Number.isFinite(s) ? 'unknown' : s >= SURE ? 'ok' : s >= DISAGREE ? 'soft' : 'bad')
export const TIER_WORDS = { ok: 'sure', soft: 'not fully sure', bad: 'the readings disagree', unknown: '' }
export const TIER_COLOURS = { ok: '#b0e562', soft: '#ffb86b', bad: '#ff6b6b', unknown: '#9aa3b2' }

// what the check says about this plan now (the rooms are read from the plan as it is: a room that was deleted or joined is not in the list any more)
// null when the plan was not read by several readings (a sample plan, or one read before the check existed)
export function checkOf(plan, room = {}) {
  const rc = plan && plan.readCheck; if (!rc) return null
  const rooms = plan.rooms.map((r, i) => ({ i, id: r.id, name: r.name, area: r.areaM2, support: r.support, tier: tierOf(r.support) }))
  const attention = rooms.filter((r) => r.tier === 'soft' || r.tier === 'bad').sort((a, b) => a.support - b.support)
  const weakOpenings = plan.openings.filter((o) => o.support === 0).length
  return { level: room.readChecked ? 'checked' : rc.level, readingLevel: rc.level, n: rc.n || 1, score: rc.score, rooms, attention, weakOpenings, openings: plan.openings.length, counts: rc.counts || null }
}
// the step before the preview is only shown when there is something to look at
export const needsStep = (chk) => Boolean(chk) && (chk.level === 'check' || chk.level === 'low' || chk.level === 'unchecked')
// the note over the editor stays until the person says they checked, or until nothing is left to look at
export const needsNote = (chk) => Boolean(chk) && (chk.level === 'check' || chk.level === 'low' || chk.level === 'unchecked') && (chk.attention.length > 0 || chk.weakOpenings > 0 || chk.level === 'unchecked')

// the words, one place so the step, the chip and the note say the same
export function wording(chk) {
  const n = chk.n
  if (chk.level === 'good') return { chip: `${n} of ${n} readings agree`, tone: 'ok', title: 'The plan was read with confidence', lead: `We read your plan ${n} times and the readings agree.` }
  if (chk.level === 'checked') return { chip: 'You checked the rooms', tone: 'ok', title: 'You checked this reading', lead: '' }
  if (chk.level === 'low') return { chip: 'Reading uncertain', tone: 'warn', title: 'We are not sure we understood this plan', lead: `The ${n} readings of your plan disagree a lot. A sharper, straighter picture usually helps. You can also continue and fix the rooms yourself in the editor.` }
  if (chk.level === 'unchecked') return { chip: 'Read once', tone: 'warn', title: 'Please check how we read your plan', lead: 'We could only read your plan once, so we cannot tell how sure we are. Look at the rooms before you go on.' }
  return { chip: 'Check the rooms', tone: 'warn', title: 'Please check how we read your plan', lead: `We read your plan ${n} times and the readings differ in a few places. The rooms in amber and red are the ones we are least sure about.` }
}

// ---- the reading drawn over the uploaded picture (the svg has the pixel size of the picture that was read, so it lines up with the picture when both are scaled to the same width)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
export function overlaySvg(plan) {
  const size = plan.source && plan.source.imageSize, o = plan.source && plan.source.origin, s = plan.scale && plan.scale.mPerUnit
  if (!size || !o || !s) return ''
  const px = (x, z) => [o[0] + x / s, o[1] + z / s], k = size[0] / 100
  let svg = `<svg viewBox="0 0 ${size[0]} ${size[1]}" preserveAspectRatio="none" aria-hidden="true">`
  plan.rooms.forEach((r, i) => {
    const t = tierOf(r.support), col = TIER_COLOURS[t], pts = r.polygon.map((p) => px(p[0], p[1]))
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
    svg += `<g class="rc-room" data-room="${esc(r.id)}"><polygon points="${pts.map((p) => p.map((v) => Math.round(v * 10) / 10).join(',')).join(' ')}" fill="${col}" fill-opacity="${t === 'ok' || t === 'unknown' ? 0.14 : 0.3}" stroke="${col}" stroke-width="${(k * 0.2).toFixed(2)}" ${t === 'bad' ? `stroke-dasharray="${(k * 0.8).toFixed(1)} ${(k * 0.5).toFixed(1)}"` : ''} stroke-linejoin="round"/>`
    svg += `<text x="${cx.toFixed(1)}" y="${(cy + k * 0.7).toFixed(1)}" text-anchor="middle" font-size="${(k * 2).toFixed(1)}" font-weight="700" fill="#fff" stroke="#10131a" stroke-width="${(k * 0.4).toFixed(1)}" paint-order="stroke" font-family="IBM Plex Sans, Arial, sans-serif">${i + 1}</text></g>`
  })
  for (const op of plan.openings) {
    const w = plan.walls.find((q) => q.id === op.wall); if (!w) continue
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, h = op.width / 2
    const a = px(w.a[0] + ux * (op.offset - h), w.a[1] + uz * (op.offset - h)), b = px(w.a[0] + ux * (op.offset + h), w.a[1] + uz * (op.offset + h))
    const weak = op.support === 0, col = weak ? TIER_COLOURS.soft : op.kind === 'window' ? '#7db4cf' : '#c6f24e'
    svg += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${(k * (weak ? 0.8 : 0.5)).toFixed(2)}" stroke-linecap="round"${weak ? ` stroke-dasharray="${(k * 0.7).toFixed(1)} ${(k * 0.4).toFixed(1)}"` : ''}/>`
  }
  return svg + '</svg>'
}
