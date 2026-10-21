// The reading check on screen (the rules are in layout/readcheck.js): the step before the preview, the chip and the note over the editor.
import { checkOf, needsNote, overlaySvg, wording, TIER_COLOURS, TIER_WORDS } from '../layout/readcheck.js'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const area = (a) => (Number.isFinite(a) ? `${a.toFixed(1)} m²` : '')

// the step: the uploaded plan with the reading over it on one side, the rooms with how sure we are on the other
export function mountReadCheck(el, { plan, image, name, onContinue, onRetry }) {
  const chk = checkOf(plan), w = wording(chk), low = chk.level === 'low'
  const counts = chk.counts && chk.counts.rooms.length > 1 && new Set(chk.counts.rooms).size > 1 ? `The ${chk.n} readings found ${chk.counts.rooms.join(', ')} rooms.` : ''
  const weak = chk.weakOpenings ? `${chk.weakOpenings} of ${chk.openings} doors and windows were seen in only one reading (dashed on the picture).` : ''
  const rows = chk.rooms.map((r) => `<li class="rc-row" data-room="${esc(r.id)}"><i style="background:${TIER_COLOURS[r.tier]}"></i><b>${r.i + 1}</b><span class="rc-name">${esc(r.name)}</span><span class="rc-area">${area(r.area)}</span><em class="${r.tier}">${TIER_WORDS[r.tier]}</em></li>`).join('')
  el.innerHTML = `<section class="rc">
    <div class="rc-pic" style="--ar:${plan.source ? (plan.source.imageSize[0] / plan.source.imageSize[1]).toFixed(4) : 1}">${image ? `<img src="${esc(image)}" alt="Your floor plan with the rooms we found drawn over it">` : ''}${overlaySvg(plan)}</div>
    <div class="rc-side">
      <span class="chip warn">${esc(w.chip)}</span>
      <h2>${esc(w.title)}</h2>
      <p class="muted">${esc(w.lead)}</p>
      <ul class="rc-list">${rows}</ul>
      ${counts || weak ? `<p class="muted small">${[counts, weak].filter(Boolean).map(esc).join(' ')}</p>` : ''}
      <div class="rc-actions">${low
        ? '<button class="btn primary" id="rc-retry" type="button">Try a clearer picture</button><button class="btn" id="rc-go" type="button">Continue anyway</button>'
        : '<button class="btn primary" id="rc-go" type="button">Looks right, continue</button><button class="btn" id="rc-retry" type="button">Try a clearer picture</button>'}</div>
      <p class="muted small">After you unlock the room you can fix anything in the editor: delete a room, join two rooms, rename them and move doors and windows.</p>
    </div></section>`
  const rows$ = [...el.querySelectorAll('.rc-row')], groups = [...el.querySelectorAll('.rc-room')]
  const hot = (id, on) => groups.forEach((g) => g.classList.toggle('hl', on && g.dataset.room === id)), dim = (id, on) => { el.querySelector('.rc-pic')?.classList.toggle('focus', on); hot(id, on) }
  rows$.forEach((r) => { r.addEventListener('mouseenter', () => dim(r.dataset.room, true)); r.addEventListener('mouseleave', () => dim(r.dataset.room, false)) })
  el.querySelector('#rc-go').onclick = () => onContinue(!low)
  el.querySelector('#rc-retry').onclick = onRetry
}

// a small chip for the head of the room: how sure the reading was
export function readChip(plan, room) {
  const chk = checkOf(plan, room); if (!chk) return ''
  const w = wording(chk); return `<span class="chip ${w.tone}" title="${esc(`Read ${chk.n} time${chk.n === 1 ? '' : 's'}`)}">${esc(w.chip)}</span>`
}

// the note over the editor while the rooms the readings disagreed on are not checked: each room can be shown, and "I checked" ends it
export function mountReadNote(host, { room, plan, onShow, onChecked }) {
  const chk = checkOf(plan, room)
  if (!needsNote(chk)) { host.hidden = true; host.innerHTML = ''; return }
  const list = chk.attention.map((r) => `<button class="chipx" data-i="${r.i}" type="button">${esc(r.name)} <span class="rc-tag ${r.tier}">${r.tier === 'bad' ? 'disagree' : 'unsure'}</span></button>`).join('')
  const what = chk.level === 'unchecked' ? 'The plan was read only once, so check every room.' : chk.attention.length ? 'The readings of your plan differed here. Look at these rooms against your picture:' : 'Some doors and windows were seen in only one reading.'
  host.hidden = false
  host.innerHTML = `<span><b>Check the reading.</b> ${esc(what)}</span><span class="rc-chips">${list}</span><button class="btn sm" id="rc-ok" type="button">I checked it</button>`
  host.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => onShow(Number(b.dataset.i)) })
  host.querySelector('#rc-ok').onclick = () => { onChecked(); host.hidden = true }
}
