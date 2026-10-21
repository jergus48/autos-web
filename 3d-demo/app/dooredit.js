// The door editor: a front view of one door in its wall, in the card next to the 3D view. Drag an edge to make it wider, the top edge for its height,
// the door itself to slide it along the wall; buttons put the hinge on the other side, open it into the other room, turn it into a plain opening or remove it.
// Limits come from layout/planedit.js (inside the rooms' wall, away from the neighbours). The plan follows while dragging, the 3D view and checks when the mouse is released.
import { freeSpan, wallLength } from '../layout/windows.js'
import { DOOR, fitDoor, setDoor, setDoorStyle, flipHinge, flipSide, toggleKind, roomsOfDoor, isSliding, widthRange } from '../layout/planedit.js'
import { doorStyle, DOOR_STYLES } from '../layout/space.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cm = (m) => Math.round(m * 100)
const f3 = (v) => +v.toFixed(3)
const q = (v) => Math.round(v / 0.05) * 0.05
const C = { bg: '#13191b', wall: '#2b3236', wallLine: '#59666b', leaf: 'rgba(212,218,220,.14)', frame: '#d4dadc', blue: '#7db4cf', soft: '#8b979b', ghost: '#3a454a' }

export function mountDoorEditor(host, { plan, space, edit, drag, remove, close, convert = null }) {
  let id = null, view = null, live = null, raf = 0
  const op = () => plan.openings.find((o) => o.id === id && (o.kind === 'door' || o.kind === 'opening'))
  const ceil = () => plan.ceilingHeight || 2.5
  const roomName = (r) => r.name
  // the rooms on the two sides, and the one the leaf swings into
  function sides(o) {
    const rooms = roomsOfDoor(space(), o.id), ids = rooms.map((r) => plan.rooms[r.i].id)
    const into = o.into && (ids.includes(o.into) || o.into === '__out') ? o.into : ids[0] ?? '__out'
    return { rooms, into, other: rooms.length >= 2 ? rooms.find((r) => plan.rooms[r.i].id !== into) : null }
  }

  function makeView(o) {
    const [lo, hi] = freeSpan(plan, o), L = wallLength(plan.walls.find((w) => w.id === o.wall))
    let x0 = Math.max(0, lo - 0.35), x1 = Math.min(L, hi + 0.35)
    if (x1 - x0 > 7) { x0 = Math.max(x0, o.offset - 3.5); x1 = Math.min(x1, x0 + 7); x0 = Math.max(0, x1 - 7) }
    return { x0, x1 }
  }

  function svgFor(o) {
    const { x0, x1 } = view, W = x1 - x0, H = ceil(), s = (v) => f3(v - x0), y = (v) => f3(H - v)
    const mL = 0.4, mR = 0.2, mT = 0.2, mB = 0.45, vw = W + mL + mR, vh = H + mT + mB, px = (host.clientWidth || 520) / vw, gr = Math.min(0.1, 7 / px)
    const l = o.offset - o.width / 2, r = o.offset + o.width / 2, t = o.height, isDoor = o.kind === 'door', end = o.hinge === 'end'
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-mL} ${-mT} ${f3(vw)} ${f3(vh)}" style="width:100%;height:auto;display:block;touch-action:none;user-select:none" font-family="IBM Plex Sans, Segoe UI, Arial, sans-serif">`]
    out.push(`<style>.dl{stroke:${C.blue};stroke-width:1.2;fill:none;vector-effect:non-scaling-stroke}.dx{font-family:IBM Plex Mono,Consolas,monospace;font-size:.13px;font-weight:500;fill:${C.blue};text-anchor:middle;paint-order:stroke;stroke:${C.bg};stroke-width:.05px}.cp{font-size:.1px;letter-spacing:.012px;fill:${C.soft};pointer-events:none}.hit{fill:transparent}.gp{fill:${C.bg};stroke:${C.blue};stroke-width:1.6;vector-effect:non-scaling-stroke;pointer-events:none}</style>`)
    out.push(`<rect x="${-mL}" y="${-mT}" width="${f3(vw)}" height="${f3(vh)}" fill="${C.bg}"/><rect x="0" y="0" width="${f3(W)}" height="${f3(H)}" fill="${C.wall}"/>`)
    out.push(`<line x1="0" y1="0" x2="${f3(W)}" y2="0" stroke="${C.wallLine}" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="0" y1="${f3(H)}" x2="${f3(W)}" y2="${f3(H)}" stroke="${C.wallLine}" stroke-width="2" vector-effect="non-scaling-stroke"/>`)
    out.push(`<text class="cp" x="0.05" y="-0.06">CEILING ${cm(H)} CM</text><text class="cp" x="0.05" y="${f3(H + 0.16)}">FLOOR</text>`)
    for (const q2 of plan.openings) {            // the other openings in this wall, as dashed outlines
      if (q2 === o || q2.wall !== o.wall) continue
      const a = q2.offset - q2.width / 2, z = q2.offset + q2.width / 2; if (z < x0 || a > x1) continue
      const bt = q2.kind === 'window' ? q2.sill : 0, tp = q2.kind === 'window' ? q2.sill + q2.height : q2.height
      out.push(`<rect x="${s(Math.max(a, x0))}" y="${y(tp)}" width="${f3(Math.min(z, x1) - Math.max(a, x0))}" height="${f3(tp - bt)}" fill="none" stroke="${C.ghost}" stroke-width="1.4" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`)
    }
    out.push(`<rect data-g="mv" x="${s(l)}" y="${y(t)}" width="${f3(o.width)}" height="${f3(t)}" fill="${C.leaf}" stroke="${C.frame}" stroke-width="0.05" style="cursor:ew-resize"/>`)
    const style = isDoor ? doorStyle(o) : null
    if (style === 'hinged') {                                // hinges on the hinge side, a handle on the other
      const hx = end ? r : l, gx = end ? l + 0.12 : r - 0.12
      for (const k of [0.25, 1, t - 0.25]) out.push(`<rect x="${s(hx - 0.02)}" y="${y(k + 0.06)}" width="0.04" height="0.12" fill="${C.blue}"/>`)
      out.push(`<rect x="${s(gx - 0.015)}" y="${y(1.05 + 0.08)}" width="0.03" height="0.16" fill="${C.frame}"/>`)
    } else if (style === 'double') {                         // two leaves: hinges on both outer edges, handles at the middle
      for (const hx of [l, r]) for (const k of [0.25, 1, t - 0.25]) out.push(`<rect x="${s(hx - 0.02)}" y="${y(k + 0.06)}" width="0.04" height="0.12" fill="${C.blue}"/>`)
      out.push(`<rect x="${s((l + r) / 2 - 0.01)}" y="${y(t)}" width="0.02" height="${f3(t)}" fill="${C.frame}"/><rect x="${s((l + r) / 2 - 0.1)}" y="${y(1.05 + 0.08)}" width="0.03" height="0.16" fill="${C.frame}"/><rect x="${s((l + r) / 2 + 0.07)}" y="${y(1.05 + 0.08)}" width="0.03" height="0.16" fill="${C.frame}"/>`)
    } else if (style === 'sliding') {                        // two panes of glass, one in front of the other
      out.push(`<rect x="${s((l + r) / 2 - 0.02)}" y="${y(t)}" width="0.04" height="${f3(t)}" fill="${C.frame}"/><rect x="${s((l + r) / 2 + 0.1)}" y="${y(1.05 + 0.1)}" width="0.03" height="0.2" fill="${C.frame}"/>`)
    }
    out.push(`<rect data-g="l" class="hit" x="${s(l - 0.09)}" y="${y(t)}" width="0.18" height="${f3(t)}" style="cursor:ew-resize"/><rect data-g="r" class="hit" x="${s(r - 0.09)}" y="${y(t)}" width="0.18" height="${f3(t)}" style="cursor:ew-resize"/>`)
    out.push(`<rect data-g="t" class="hit" x="${s(l)}" y="${f3(+y(t) - 0.09)}" width="${f3(o.width)}" height="0.18" style="cursor:ns-resize"/>`)
    for (const [cx, cy] of [[l, t / 2], [r, t / 2], [(l + r) / 2, t]]) out.push(`<circle class="gp" cx="${s(cx)}" cy="${y(cy)}" r="${f3(gr)}"/>`)
    const dy = +y(t) - 0.22
    if (dy > 0.1) out.push(`<line class="dl" x1="${s(l)}" y1="${f3(dy)}" x2="${s(r)}" y2="${f3(dy)}"/><line class="dl" x1="${s(l)}" y1="${f3(dy - 0.05)}" x2="${s(l)}" y2="${f3(dy + 0.05)}"/><line class="dl" x1="${s(r)}" y1="${f3(dy - 0.05)}" x2="${s(r)}" y2="${f3(dy + 0.05)}"/><text class="dx" x="${s((l + r) / 2)}" y="${f3(dy - 0.07)}">${cm(o.width)}</text>`)
    const hx2 = -0.16
    out.push(`<line class="dl" x1="${hx2}" y1="${y(t)}" x2="${hx2}" y2="${H}"/><line class="dl" x1="${hx2 - 0.05}" y1="${y(t)}" x2="${hx2 + 0.05}" y2="${y(t)}"/><text class="dx" x="${hx2}" y="${f3((+y(t) + H) / 2)}" transform="rotate(-90 ${hx2} ${f3((+y(t) + H) / 2)}) translate(0 -0.06)">${cm(t)}</text>`)
    out.push('</svg>')
    return out.join('')
  }

  function render() {
    const o = op(); if (!o) return hide()
    host.hidden = false
    const sd = sides(o), isDoor = o.kind === 'door'
    const label = sd.rooms.length >= 2 ? `${esc(roomName(sd.rooms[0]))} and ${esc(roomName(sd.rooms[1]))}` : sd.rooms[0] ? `${esc(roomName(sd.rooms[0]))} and outside` : ''
    const style = isDoor ? doorStyle(o) : null, [wMin, wMax] = widthRange(o)
    const into = !isDoor ? 'A plain opening: no door leaf' : style === 'sliding' ? 'A sliding glass door: nothing swings' : sd.into === '__out' ? 'Opens outwards' : `Opens into ${esc(roomName(space().rooms.find((r) => plan.rooms[r.i].id === sd.into) || sd.rooms[0] || { name: 'the room' }))}`
    const field = (k, lab, v, min, max) => `<label class="fld"><span>${lab}</span><input type="number" data-d="${k}" min="${min}" max="${max}" step="5" value="${cm(v)}"><small>cm</small></label>`
    host.innerHTML = `<div class="figh"><b>${isDoor ? 'Door editor' : 'Opening editor'}</b><span class="cap">${label.toUpperCase().replace(/&AMP;/g, '&')} · ${cm(o.width)} × ${cm(o.height)} CM</span><button class="btn sm" data-x="close" type="button">Close</button></div>
      <div class="we-wrap" id="de-wrap" tabindex="0" aria-label="Door editor: drag the edges to change the door"></div>
      <div class="we-ctl">${isDoor ? `<div class="seg" role="group" aria-label="Door style"><span class="seg-l">Style</span>${DOOR_STYLES.map(([v, l]) => `<button class="btn sm ${style === v ? 'on' : ''}" data-style="${v}" type="button" aria-pressed="${style === v}">${l}</button>`).join('')}</div>` : ''}<p class="hint-line" style="margin:0"><b style="color:var(--ink)">${into}.</b></p>
        <div class="selfields">${field('width', 'Width', o.width, cm(wMin), cm(wMax))}${field('height', 'Height', o.height, cm(DOOR.height[0]), cm(DOOR.height[1]))}</div>
        <div class="selbtns">${style === 'hinged' ? '<button class="btn sm" data-x="hinge" type="button">Hinge on the other side</button>' : ''}${style === 'hinged' || style === 'double' ? `<button class="btn sm" data-x="side" type="button">${sd.rooms.length >= 2 ? `Open into ${esc(roomName(sd.other || sd.rooms[0]))}` : sd.into === '__out' ? 'Open inwards' : 'Open outwards'}</button>` : ''}<button class="btn sm" data-x="kind" type="button">${isDoor ? 'Make it an open passage' : 'Put a door in it'}</button>${isDoor && convert ? '<button class="btn sm" data-x="towin" type="button">Make it a window</button>' : ''}<button class="btn sm danger" data-x="remove" type="button">Remove</button></div></div>
      ${isDoor && plan.openings.some((x) => x.leftoverOf === id) ? '<p class="hint-line we-hint" style="padding-top:0"><b style="color:var(--ink)">The rest of the glazing is a window beside the door.</b> Select it in the plan to change it or remove it. Choosing Sliding or Double gives the glass back to the door.</p>' : ''}
      <p class="hint-line we-hint">Drag an edge to change the width, the top edge for the height, the door to slide it along the wall. Steps of 5 cm. The 3D view updates when you let go.</p>`
    draw()
    host.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.style !== style) edit(() => setDoorStyle(plan, id, b.dataset.style)) }))
    host.querySelectorAll('[data-d]').forEach((inp) => inp.addEventListener('change', () => { const k = inp.dataset.d, v = Number(inp.value); if (v > 0) edit(() => setDoor(plan, id, { [k]: v / 100 })) }))
    host.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.x
      if (a === 'close') return close()
      if (a === 'remove') return remove(id)
      if (a === 'hinge') return edit(() => flipHinge(plan, id))
      if (a === 'side') return edit(() => flipSide(plan, space(), id))
      if (a === 'kind') return edit(() => toggleKind(plan, id))
      if (a === 'towin') return convert(id)
    }))
  }
  const wrap = () => host.querySelector('#de-wrap')
  function draw() { const o = op(), w = wrap(); if (o && w) w.innerHTML = svgFor(o) }
  function syncFields() {
    const o = op(); if (!o) return
    for (const k of ['width', 'height']) { const inp = host.querySelector(`[data-d="${k}"]`); if (inp) inp.value = cm(o[k]) }
    const cap = host.querySelector('.figh .cap'); if (cap) cap.textContent = cap.textContent.replace(/· \d+ × \d+ CM/, `· ${cm(o.width)} × ${cm(o.height)} CM`)
  }

  const model = (e) => { const svg = wrap().querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { s: p.x + view.x0, y: ceil() - p.y } }
  host.addEventListener('pointerdown', (e) => {
    const w = wrap(); if (!w || !w.contains(e.target)) return
    const g = e.target.closest?.('[data-g]'), o = op(); if (!g || !o) return
    w.focus({ preventScroll: true })
    live = { kind: g.dataset.g, p: model(e), init: { l: o.offset - o.width / 2, r: o.offset + o.width / 2, offset: o.offset, width: o.width, height: o.height }, before: drag.begin(), moved: false }
    try { w.setPointerCapture(e.pointerId) } catch { /* the pointer is gone already: moves on the picture still work */ }
    e.preventDefault()
  })
  host.addEventListener('pointermove', (e) => {
    if (!live) return
    const o = op(); if (!o) return
    const p = model(e), { init, kind } = live
    if (!live.moved && Math.abs(p.s - live.p.s) < 0.03 && Math.abs(p.y - live.p.y) < 0.03) return
    live.moved = true
    Object.assign(o, { offset: init.offset, width: init.width, height: init.height })
    if (kind === 'l') fitDoor(plan, id, { left: q(p.s) })
    else if (kind === 'r') fitDoor(plan, id, { right: q(p.s) })
    else if (kind === 't') fitDoor(plan, id, { height: q(p.y) })
    else if (kind === 'mv') { const ds = q(p.s - live.p.s); fitDoor(plan, id, { left: init.l + ds, right: init.r + ds }) }
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); syncFields(); drag.live() })
  })
  const up = () => { if (!live) return; const d = live; live = null; if (raf) { cancelAnimationFrame(raf); raf = 0 } if (d.moved) { view = null; drag.end(d.before) } else draw() }
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up)

  function show(next) {
    if (next !== id) { id = next; view = null }
    const o = op(); if (!o) return hide()
    if (!view) { host.hidden = false; view = makeView(o) }
    if (live) return
    render()
  }
  function hide() { if (id === null) return; id = null; view = null; live = null; host.hidden = true; host.innerHTML = '' }
  return { show, hide, destroy() { cancelAnimationFrame(raf); hide() } }
}
