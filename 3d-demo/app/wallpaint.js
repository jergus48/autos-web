// The small window that opens when a wall is double-clicked (in the 3D view or on the plan): a colour for that wall, for the other side of it, or for the whole room.
// layout/wallpaint.js decides what a wall is and keeps the paint in `map` ({ key: '#rrggbb' }); onApply(map) is called after every change so that the page can save and draw again.
import { colourOf, paint } from '../layout/wallpaint.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const WALL_COLOURS = [['Warm white', '#f1ece2'], ['Cloud', '#e4e6e8'], ['Greige', '#cdc4b6'], ['Sand', '#e0cfae'], ['Sage', '#b3bfa6'], ['Sky', '#b9cbd8'], ['Dusty blue', '#8ea5bb'], ['Clay', '#c48f79'], ['Forest', '#4f6a58'], ['Charcoal', '#46494f'], ['Navy', '#2c3d57']]

export function openWallPaint({ sides, selected = sides.slice(0, 1), at = {}, map, onApply, original = '#f1ece2' }) {
  document.querySelector('.wallpop')?.remove()
  const on = new Set(selected.map((s) => s.key)); let whole = false
  const pop = document.createElement('div'); pop.className = 'wallpop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Wall colour')
  const chosen = () => sides.filter((s) => on.has(s.key))
  const current = () => { const s = chosen()[0]; return (s && colourOf(map, s.key)) || null }
  function draw() {
    const cur = current(), rooms = [...new Set(chosen().map((s) => s.room.name))]
    pop.innerHTML = `<div class="wp-h"><b>Wall colour</b><button class="wp-x" type="button" aria-label="Close">&times;</button></div>
      <div class="wp-sides">${sides.map((s, i) => `<button class="chipx ${on.has(s.key) ? 'on' : ''}" type="button" data-s="${i}" aria-pressed="${on.has(s.key)}">${esc(s.label)}</button>`).join('')}</div>
      <label class="check wp-whole"><input type="checkbox" id="wp-whole" ${whole ? 'checked' : ''}> All the walls of ${esc(rooms.join(' and ') || 'the room')}</label>
      <div class="wp-sw">${WALL_COLOURS.map(([n, h]) => `<button type="button" class="wp-c ${cur === h ? 'on' : ''}" style="background:${h}" data-c="${h}" title="${esc(n)}" aria-label="${esc(n)}"></button>`).join('')}
        <label class="wp-own" title="Any colour"><input type="color" id="wp-own" value="${cur || original}" aria-label="Pick any colour"><span>Other</span></label></div>
      <div class="wp-f"><button class="btn sm" type="button" id="wp-reset" ${chosen().length ? '' : 'disabled'}>Back to the usual colour</button><span class="muted small">${cur ? esc(cur) : 'usual colour'}</span></div>`
    pop.querySelector('.wp-x').onclick = close
    pop.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { const k = sides[+b.dataset.s].key; if (on.has(k) && on.size === 1) return; on.has(k) ? on.delete(k) : on.add(k); draw() }))
    pop.querySelector('#wp-whole').onchange = (e) => { whole = e.target.checked }
    pop.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => apply(b.dataset.c)))
    let t = 0; const own = pop.querySelector('#wp-own')
    own.oninput = () => { clearTimeout(t); t = setTimeout(() => apply(own.value, false), 120) }          // while the colour is dragged the scene is drawn about every 120 ms
    own.onchange = () => { clearTimeout(t); apply(own.value) }
    pop.querySelector('#wp-reset').onclick = () => apply(null)
  }
  function apply(hex, redraw = true) { paint(map, chosen(), hex, whole); onApply(map); if (redraw) draw() }
  const onKey = (e) => { if (e.key === 'Escape') close() }, onDown = (e) => { if (!pop.contains(e.target)) close() }
  function close() { pop.remove(); document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown, true) }
  draw(); document.body.appendChild(pop)
  const w = pop.offsetWidth || 300, h = pop.offsetHeight || 300
  pop.style.left = Math.max(8, Math.min((at.clientX ?? 200) + 14, innerWidth - w - 8)) + 'px'; pop.style.top = Math.max(8, Math.min((at.clientY ?? 200) + 14, innerHeight - h - 8)) + 'px'
  document.addEventListener('keydown', onKey); setTimeout(() => document.addEventListener('pointerdown', onDown, true), 0)
  return { close }
}
