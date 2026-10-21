// The layout editor: the floor plan at true scale with every piece, window and door draggable. Moving, turning, resizing, adding and deleting
// re-measure the whole layout (layout/validate.js), so the distances, clear space and checks follow the pointer. A window or a door can be slid along its
// wall, stretched and edited in a card next to the 3D view; the walls are cut again around it. Pieces can be locked (they stay put when a room is
// fitted again), a room can be given another kind, and the whole plan can be scaled by measuring one length that is known.
import { planSvg } from '../layout/plansvg.js'
import { validate } from '../layout/validate.js'
import { snapMove, SNAP, FREE, resize, turn, around, addPiece, resizable, roomIndexAt, clean } from '../layout/edit.js'
import { moveWindow, setWindow, addWindow, removeWindow, rebuild, placement, panesOf, templateOf, applyTemplate, LIMITS } from '../layout/windows.js'
import { addDoorAt, addWindowAt, removeOpening, doorsOf, roomsOfDoor, setRoomKind, scalePlan, scaleItems, windowToDoor, doorToWindow } from '../layout/planedit.js'
import { buildSpace, kindOf, KIND_OPTIONS } from '../layout/space.js'
import { obb, overlaps, segDist, zone } from '../layout/geom.js'
import { labelOf, make } from '../layout/catalog.js'
import { Ctx } from '../layout/ctx.js'
import { nearWall, sidesAt } from '../layout/wallpaint.js'
import { sharedLength, cornerChanges, wallChanges, insertChanges, removeChanges } from '../layout/planops.js'
import { mountWindowEditor } from './winedit.js'
import { mountDoorEditor } from './dooredit.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cm = (m) => Math.round(m * 100)
const ADDABLE = ['sofa', 'armchair', 'coffee_table', 'side_table', 'tv_unit', 'shelf', 'sideboard', 'dining_table', 'chair', 'bed', 'nightstand', 'wardrobe', 'desk', 'counter', 'fridge', 'shoe_cabinet', 'bathtub', 'shower', 'toilet', 'vanity', 'washer', 'floor_lamp', 'plant', 'rug']
// the editor option that matches what a room is now (a kind from the plan reader or from its name)
const optionOf = (room) => { const k = kindOf(room); return room.userKind || (k.kind === 'living' ? (k.kitchen ? 'living_kitchen' : k.dining ? 'living_dining' : 'living') : k.kind === 'kitchen' ? (k.dining ? 'kitchen_dining' : 'kitchen') : k.kind) }

export function mountEditor(host, { plan, space: space0, items, focus = null, onChange = () => {}, onSelect = () => {}, onReport = () => {}, onWindows = () => {}, onPlan = null, onAddFromLink = null, onRoomEdit = () => {}, onRefitRoom = () => {}, onScale = () => {}, onWall = null, original = null, onAttachOriginal = null, refHost = null, onStructure = null, startReshape = null, structUndo = null, onStructureUndo = null, windowHost = null, windowTemplates = null }) {
  let space = space0, cur = items.map((i) => ({ ...i })), selected = null, selWin = null, selDoor = null, rep = null, note = ''
  const planChanged = onPlan || onWindows
  const opts = { zones: false, labels: true }
  const undo = [], redo = []
  let drag = null, raf = 0, evalTimer = 0, we = null, de = null
  let mode = null, meas = null, drawing = null, reshape = null, rdrag = null, pick = null, lastAspect = null, lastNa = 1          // mode: null | 'place-door' | 'place-opening' | 'place-window' | 'measure' | 'draw-room' (the outline of a new room) | 'reshape' (drag the corners and walls of the room in focus) | 'pick-spot' (a ghost of a piece from a link follows the pointer)
  const placing = (m) => m === 'place-door' || m === 'place-opening' || m === 'place-window'
  let selWall = null, refHover = null, refRaf = 0          // selWall: { sides } of the wall that was clicked; refHover: where the pointer is (metres) while a door or window is placed

  host.innerHTML = `<div class="ed">
    <div class="ed-bar"><span class="ed-btns"><button class="btn sm" id="ed-undo" type="button">Undo</button><button class="btn sm" id="ed-redo" type="button">Redo</button>
      <select id="ed-add" aria-label="Piece to add"></select><button class="btn sm" id="ed-measure" type="button" title="Measure a length on the plan, and set the scale of the whole plan from a length you know">Measure</button><button class="btn sm" id="ed-sundo" type="button" hidden title="Bring back what the last deleted room or removed wall took away">Undo room change</button></span>
      <span class="ed-tools"><label class="check"><input type="checkbox" data-o="zones"> Clear space</label><label class="check"><input type="checkbox" data-o="labels" checked> Names</label></span></div>
    <div class="ed-room" id="ed-room" hidden></div>
    <div class="ed-ref" id="ed-ref" hidden></div>
    <div class="ed-plan" id="ed-plan" tabindex="0" aria-label="Floor plan editor"></div>
    <div class="ed-sel" id="ed-sel"></div></div>`
  const $ = (s) => host.querySelector(s)
  // the "Add a piece" list holds the doors, the window and the saved window templates too
  const addOptions = () => `<option value="">Add a piece...</option><optgroup label="Openings"><option value="__door">Door (click a wall)</option><option value="__opening">Open passage (click a wall)</option><option value="__window_click">Window (click a wall)</option><option value="__window">Window (automatic spot)</option>${(windowTemplates?.list() || []).map((t) => `<option value="__tpl:${esc(t.id)}">Window: ${esc(t.name)}</option>`).join('')}</optgroup>${onStructure ? '<optgroup label="Rooms"><option value="__room">Room or corridor (draw its outline)</option></optgroup>' : ''}<optgroup label="Furniture"><option value="__link">Piece from a shop link...</option>${ADDABLE.map((t) => `<option value="${t}">${esc(labelOf(t))}</option>`).join('')}</optgroup>`
  $('#ed-add').innerHTML = addOptions()
  const planEl = $('#ed-plan'), selEl = $('#ed-sel'), roomEl = $('#ed-room'), refEl = refHost || $('#ed-ref')          // the original plan: in a card of its own above the plan when the page gives one
  { const su = $('#ed-sundo'), n = structUndo ? structUndo() : 0; if (n > 0 && onStructureUndo) { su.hidden = false; su.textContent = `Undo room change (${n})`; su.onclick = () => onStructureUndo() } }

  // one snapshot holds the furniture and the openings, so undo covers both
  const snap = () => ({ items: cur.map((i) => ({ ...i })), openings: JSON.stringify(plan.openings) })
  const restore = (s) => {
    cur = s.items.map((i) => ({ ...i }))
    if (s.openings !== JSON.stringify(plan.openings)) { plan.openings = JSON.parse(s.openings); recut() }
    if (!cur.some((i) => i.id === selected)) selected = null
    if (!plan.openings.some((o) => o.id === selWin)) selWin = null
    if (!plan.openings.some((o) => o.id === selDoor)) selDoor = null
  }
  // the walls are cut again around the openings, the measured space is made again, the page is told
  function recut() { rebuild(plan); space = buildSpace(plan); planChanged(space) }

  const statusMap = () => {
    const m = {}
    for (const c of rep?.checks || []) if (c.item && c.level !== 'ok') m[c.item] = c.level === 'error' ? 'error' : m[c.item] || 'warn'
    return m
  }
  const evaluate = () => { rep = validate(plan, cur, { space }); onReport(rep); drawSel(); redraw() }
  const schedule = () => { clearTimeout(evalTimer); evalTimer = setTimeout(evaluate, 140) }

  // The plan fills its box: the box is at least as tall as the plan is at the full width (but not taller than 74% of the screen, and never under 420 px), and the view is widened or heightened to the shape
  // of the box, so the plan card is as tall as the 3D card without empty space around the plan.
  function fitBox() {
    const W = planEl.clientWidth; if (!W) return
    planEl.style.minHeight = Math.round(Math.min(Math.max(420, W / lastNa), window.innerHeight * 0.74)) + 'px'
    const H = planEl.clientHeight; if (!H) return
    const a = W / H; if (!lastAspect || Math.abs(a - lastAspect) > 0.01) { lastAspect = a; redraw() }
  }
  const boxWatch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fitBox()) : null; boxWatch?.observe(planEl)
  function reshapeView() { const xs = reshapeRoom().polygon.map((q) => q[0]), zs = reshapeRoom().polygon.map((q) => q[1]); return { x0: Math.min(...xs) - 1.2, z0: Math.max(0, Math.min(...zs) - 1.2), x1: Math.max(...xs) + 1.2, z1: Math.max(...zs) + 1.2 } }
  function redraw() {
    const sel = cur.find((i) => i.id === selected)
    planEl.innerHTML = planSvg(plan, cur, { space, zones: opts.zones ? 'all' : 'selected', labels: opts.labels, dims: true, selected, selectedWin: selWin, selectedDoor: selDoor, measure: meas, drawing: mode === 'draw-room' ? drawing : null, reshape: mode === 'reshape' && reshapeRoom() ? { id: reshape.id, polys: rdrag?.changes || null, hover: reshape.hover, guides: rdrag?.lock?.guides || null } : null, view: mode === 'draw-room' ? { x0: 0, z0: 0, x1: plan.bounds.width + 3, z1: plan.bounds.depth + 3 } : mode === 'reshape' && reshapeRoom() ? reshapeView() : null, status: statusMap(), focus: mode === 'draw-room' ? null : focus, around: sel ? around(space, cur, sel) : [], theme: 'dark', fit: true, fill: true, aspect: lastAspect })
    { const na = Number(planEl.querySelector('svg').dataset.na) || 1; if (Math.abs(na - lastNa) > 0.001) { lastNa = na; fitBox() } }          // the view changed shape (another room, reshape mode): the box is sized again
    if (mode === 'reshape') { const k = pxPerM(); planEl.querySelectorAll('.rh-c').forEach((c) => c.setAttribute('r', (c.classList.contains('hov') ? 9 : 6.5) / k)) }          // the handles keep their size on the screen
    if (mode === 'pick-spot' && pick?.pos) drawGhost()
    if (selWall) drawWallHighlight()
    drawRef()
  }

  // ---- choosing the spot of a piece from a link: a ghost of the piece at its true size follows the pointer (pulled to walls like a drag), green where it fits with all its clear space,
  // amber where it fits but is tight, red where it cannot stand; R turns it, a click puts it there, Esc cancels
  function pickState(x, z) {
    const g = { ...pick.ghost, x, z, rot: pick.rot }; delete g._b
    const ri = roomIndexAt(space, x, z), target = space.rooms[pick.room]
    if (ri !== pick.room) return { level: 'bad', text: `That spot is not inside ${target?.name || 'the room'}.` }
    const ctx = new Ctx(space.rooms[ri], []); ctx.lock(cur.filter((i) => !i.floor && roomIndexAt(space, i.x, i.z) === ri).map((i) => ({ ...i })))
    const r = ctx.check(g), why = r.why || '', other = (/^(?:overlap|blocks) (\w+)/.exec(why) || [])[1]
    if (/^outside/.test(why)) return { level: 'bad', text: 'Part of it would stand outside the room or in a wall.' }
    if (/^overlap/.test(why)) return { level: 'bad', text: `It would overlap the ${labelOf(other).toLowerCase()}.` }
    if (/^door/.test(why)) return { level: 'bad', text: 'It would stand in the way of a door.' }
    if (/^window/.test(why)) return { level: 'bad', text: 'It is too tall to stand in front of this window.' }
    if (/^clear/.test(why)) return { level: 'tight', text: `Tight: not enough free floor at its ${why.split(' ')[1]} (${cm(pick.ghost.clearMin[why.split(' ')[1]] || 0)} cm wanted).` }
    if (/^blocks/.test(why)) return { level: 'tight', text: `It would take the free floor in front of the ${labelOf(other).toLowerCase()}.` }
    if (why) return { level: 'tight', text: 'It would stand too close to something that needs room round it.' }
    ctx.items.push({ ...g, _keep: r.keep }); if (!ctx.circOK()) return { level: 'tight', text: 'It would make the way through the room narrow.' }
    return { level: 'good', text: 'It fits, with all its clear space free.' }
  }
  const PICK = { good: ['rgba(121,201,154,.38)', '#79c99a'], tight: ['rgba(229,178,93,.38)', '#e5b25d'], bad: ['rgba(239,127,106,.38)', '#ef7f6a'] }
  function drawGhost() {
    const svg = planEl.querySelector('svg'); if (!svg || !pick?.pos) return
    let g = svg.querySelector('#ghost'); if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'ghost'; g.style.pointerEvents = 'none'; svg.appendChild(g) }
    const it = { ...pick.ghost, x: pick.pos.x, z: pick.pos.z, rot: pick.rot }, [fill, stroke] = PICK[pick.state.level], f = (v) => Math.round(v * 1000) / 1000
    const zones = ['front', 'back', 'left', 'right'].map((s) => ({ s, d: it.clearMin?.[s] || 0 })).filter((q) => q.d > 0).map((q) => `<polygon points="${zone(obb(it.x, it.z, it.w, it.d, it.rot), q.s, q.d).pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="${stroke}" fill-opacity=".10" stroke="${stroke}" stroke-opacity=".35" stroke-width=".012" stroke-dasharray=".05 .04"/>`).join('')
    g.innerHTML = `${zones}<g transform="translate(${f(it.x)} ${f(it.z)}) rotate(${f(-it.rot * 180 / Math.PI)})"><rect x="${f(-it.w / 2)}" y="${f(-it.d / 2)}" width="${f(it.w)}" height="${f(it.d)}" rx=".03" fill="${fill}" stroke="${stroke}" stroke-width=".03"/><line x1="0" y1="${f(it.d / 2 - 0.02)}" x2="0" y2="${f(it.d / 2 - Math.min(0.14, it.d / 3))}" stroke="${stroke}" stroke-width=".035"/></g>`
  }
  function pickMove(p, keep = false, free = false) {
    const ghost = { ...pick.ghost, rot: pick.rot }, moved = keep ? { x: p.x, z: p.z } : snapMove(space, cur, { ...ghost, id: '__ghost' }, p.x, p.z, free ? FREE : SNAP)
    pick.pos = { x: moved.x, z: moved.z }; pick.state = pickState(moved.x, moved.z)
    if (!pick.raf) pick.raf = requestAnimationFrame(() => { pick.raf = 0; drawGhost(); const s = selEl.querySelector('[data-pick-status]'); if (s) { s.textContent = pick.state.text; s.className = 'pickstat ' + pick.state.level } })
  }
  function pickClick(p, free = false) {
    pickMove(p, false, free); if (pick.state.level === 'bad') { drawGhost(); return }
    endPick({ x: +pick.pos.x.toFixed(3), z: +pick.pos.z.toFixed(3), rot: pick.rot })
  }
  function endPick(result) {
    const p = pick; pick = null; if (!p) return
    cancelAnimationFrame(p.raf); planEl.querySelector('#ghost')?.remove()
    if (mode === 'pick-spot') { mode = null; planEl.classList.remove('placing'); drawSel() }
    p.resolve(result)
  }
  const pickPanel = () => `<p class="hint-line"><b style="color:var(--ink)">Click the spot for ${esc(pick.name)}</b> (${cm(pick.ghost.w)} × ${cm(pick.ghost.d)} cm). It follows the pointer and sticks to walls. <span>R turns it · Esc cancels</span></p><p class="pickstat ${pick.state?.level || 'good'}" data-pick-status>${esc(pick.state?.text || 'Move the pointer over the room.')}</p><div class="selbtns" style="margin-top:8px"><button class="btn sm" data-a="cancel-pick" type="button">Cancel</button></div>`

  const capture = (e) => { try { planEl.setPointerCapture(e.pointerId) } catch { /* the pointer is already gone: the drag still works with move events on the plan */ } }
  const point = (e) => {
    const svg = planEl.querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { x: p.x, z: p.y }
  }
  function commit(next, keepSel = true) {
    undo.push(snap()); if (undo.length > 80) undo.shift(); redo.length = 0
    cur = next; if (!keepSel) selected = null
    onChange(cur.map(clean)); evaluate()
  }
  // a change to the windows or doors: remember the state, change, cut the walls again, measure again
  function winEdit(fn) {
    undo.push(snap()); if (undo.length > 80) undo.shift(); redo.length = 0
    note = ''; fn(); recut(); evaluate()
  }
  const select = (id, win = null, door = null) => { selected = id; selWin = win; selDoor = door; selWall = null; onSelect(id || win || door) }
  const locked = (it) => Boolean(it?.locked)
  const lockedNote = () => { note = 'This piece is locked. Unlock it to move or change it.'; drawSel() }

  // ---- modes: placing a door, measuring
  function setMode(m) {
    if (mode === 'pick-spot' && m !== 'pick-spot') endPick(null)
    mode = m; if (m !== 'measure') meas = null
    drawing = m === 'draw-room' ? { pts: [], cur: null, name: '', kind: 'hall' } : null
    rdrag = null; reshape = m === 'reshape' && focus !== null && plan.rooms[focus] ? { id: plan.rooms[focus].id, hover: null } : null
    if (m === 'reshape' && !reshape) { mode = null; m = null }
    $('#er-reshape')?.classList.toggle('on', m === 'reshape')
    planEl.classList.toggle('placing', placing(m) || m === 'pick-spot' || m === 'draw-room'); planEl.classList.toggle('measuring', m === 'measure')
    $('#ed-measure').classList.toggle('on', m === 'measure')
    if (m) { select(null); planEl.focus({ preventScroll: true }) }
    drawSel(); redraw()
  }
  // the nearest corner of a room, or the nearest point on a room's wall face, within reach of the pointer
  function snapPoint(p, skipId = null, reach = null, skip = null) {          // reach { c, f }: how near (metres) a corner and a wall face must be to catch the point; the default is the one the Measure tool always had
    let best = null; const rc = reach ? reach.c : 0.2, rf = reach ? reach.f : 0.12
    for (const r of plan.rooms) for (let i = 0; i < (r.id === skipId ? 0 : r.polygon.length); i++) {
      const a = r.polygon[i], b = r.polygon[(i + 1) % r.polygon.length], dv = Math.hypot(p.x - a[0], p.z - a[1])
      if (skip && skip.v(r, i)) continue
      if (dv < rc && (!best || dv < best.d)) best = { d: dv, x: a[0], z: a[1] }
    }
    if (best) return [best.x, best.z, true]
    for (const r of plan.rooms) for (let i = 0; i < (r.id === skipId ? 0 : r.polygon.length); i++) {
      const a = r.polygon[i], b = r.polygon[(i + 1) % r.polygon.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L
      if (skip && skip.e(r, i)) continue
      const s = (p.x - a[0]) * ux + (p.z - a[1]) * uz, dd = segDist(p.x, p.z, a, b)
      if (dd < rf && s > 0 && s < L && (!best || dd < best.d)) best = { d: dd, x: a[0] + ux * s, z: a[1] + uz * s }
    }
    return best ? [best.x, best.z, true] : [Math.round(p.x * 100) / 100, Math.round(p.z * 100) / 100, false]
  }
  // ---- reshape the room in focus: drag a corner or a wall, double-click a wall to add a corner or a corner to take it away. The new outlines are worked out while the pointer moves (layout/planops.js)
  // and applied when it is let go; a wall that another room shares moves that room's wall too, a corner that is the same corner of the building moves in every room.
  const pxPerM = () => { const m = planEl.querySelector('svg')?.getScreenCTM(); return m ? m.a : 60 }
  const reshapeRoom = () => (reshape ? plan.rooms.find((r) => r.id === reshape.id) : null)
  function reshapeHit(p) {
    const room = reshapeRoom(); if (!room) return null
    const k = pxPerM(), poly = room.polygon; let best = null
    poly.forEach((c, i) => { const d = Math.hypot(p.x - c[0], p.z - c[1]) * k; if (d < 14 && (!best || d < best.d)) best = { kind: 'corner', index: i, d } })
    if (best) return best
    poly.forEach((a, i) => { const d = segDist(p.x, p.z, a, poly[(i + 1) % poly.length]) * k; if (d < 9 && (!best || d < best.d)) best = { kind: 'wall', index: i, d } })
    return best
  }
  // ---- locks. While a corner is dragged, each of the two walls at it locks to a direction when the pointer comes within LOCK_PX pixels of that direction: horizontal, vertical, PARALLEL to another wall of the
  // plan, or at 90 degrees to one. A locked wall stays exactly on its direction while the pointer is anywhere near it (the corner then slides along the line, or sits where two locked walls cross); the wall
  // it is locked to is drawn dashed. A wall dragged sideways sticks to the lines of the other walls the same way. Alt turns every lock off.
  const LOCK_PX = 9
  const lineAt = (p, u, q, v) => { const det = u[0] * v[1] - u[1] * v[0]; if (Math.abs(det) < 1e-6) return null; const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / det; return [p[0] + u[0] * t, p[1] + u[1] * t] }
  function wallRefs(from) {          // the directions of the walls of the plan, except the walls at the corner being dragged (they move with it)
    const same = (q) => Math.hypot(q[0] - from[0], q[1] - from[1]) < 0.03, refs = [{ u: [1, 0], axis: true, name: 'horizontal' }, { u: [0, 1], axis: true, name: 'vertical' }]
    for (const r of plan.rooms) r.polygon.forEach((a, i) => {
      const b = r.polygon[(i + 1) % r.polygon.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.5 || same(a) || same(b)) return
      const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; if (Math.abs(u[0]) < 0.003 || Math.abs(u[1]) < 0.003) return          // along an axis: the axes are in the list
      if (refs.some((q) => Math.abs(q.u[0] * u[1] - q.u[1] * u[0]) < 0.004)) return          // the same direction as one that is there (a quarter of a degree)
      refs.push({ u, a, b, name: 'wall' })
    })
    return refs
  }
  const lockName = (r, sq) => (r.axis ? (sq ? (r.name === 'horizontal' ? 'vertical' : 'horizontal') : r.name) : sq ? 'at 90\u00b0 to a wall' : 'parallel to a wall')
  const guideOf = (r, N, at) => (r.axis ? { a: [at[0] - r.u[0] * 2.5, at[1] - r.u[1] * 2.5], b: [at[0] + r.u[0] * 2.5, at[1] + r.u[1] * 2.5], axis: true } : { a: [r.a[0] - r.u[0] * 2, r.a[1] - r.u[1] * 2], b: [r.b[0] + r.u[0] * 2, r.b[1] + r.u[1] * 2] })
  function lockCorner(t, room, idx) {
    const R = LOCK_PX / pxPerM(), n = room.polygon.length, refs = wallRefs(room.polygon[idx])
    const found = [room.polygon[(idx + n - 1) % n], room.polygon[(idx + 1) % n]].map((N) => {
      let best = null
      for (const r of refs) for (const sq of [false, true]) {
        const ux = sq ? -r.u[1] : r.u[0], uz = sq ? r.u[0] : r.u[1], d = Math.abs((t[0] - N[0]) * uz - (t[1] - N[1]) * ux)
        if (d < R && (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) < 1e-9 && r.axis && !best.r.axis))) best = { d, N, u: [ux, uz], r, sq }
      }
      return best
    }).filter(Boolean)
    if (!found.length) return null
    const proj = (f) => { const s = (t[0] - f.N[0]) * f.u[0] + (t[1] - f.N[1]) * f.u[1]; return [f.N[0] + f.u[0] * s, f.N[1] + f.u[1] * s] }
    let to, used = found
    if (found.length === 2) { const x = lineAt(found[0].N, found[0].u, found[1].N, found[1].u); if (x && Math.hypot(x[0] - t[0], x[1] - t[1]) <= 3 * R) to = x; else { used = [found[0].d <= found[1].d ? found[0] : found[1]]; to = proj(used[0]) } } else to = proj(found[0])
    return { to, text: [...new Set(used.map((f) => lockName(f.r, f.sq)))].join(' and '), guides: used.map((f) => guideOf(f.r, f.N, to)) }
  }
  // a point snaps to a corner or wall face of another room only when the pointer is within a few pixels of it (so it does not catch from far away when the plan is zoomed out), otherwise it
  // follows the pointer to the centimetre, or locks to a wall direction (above); Alt turns all snapping off
  const reachPx = (free) => { const k = pxPerM(); return free ? { c: 0, f: 0 } : { c: 8 / k, f: 5 / k } }
  function reshapeCorner(p, free, room, idx) {
    const from = room.polygon[idx], same = (q) => Math.hypot(q[0] - from[0], q[1] - from[1]) < 0.03          // the corners and walls that move with this corner do not catch the pointer
    let [x, z, hit] = snapPoint(p, room.id, reachPx(free), { v: (r, i) => same(r.polygon[i]), e: (r, i) => same(r.polygon[i]) || same(r.polygon[(i + 1) % r.polygon.length]) })
    let lock = null
    if (!hit && !free) { lock = lockCorner([x, z], room, idx); if (lock) { x = lock.to[0]; z = lock.to[1] } }
    return { to: [Math.max(0, x), Math.max(0, z)], lock }
  }
  function reshapeWall(p, free, room, idx) {
    const poly = room.polygon, n = poly.length, a = poly[idx], b = poly[(idx + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L
    let d = (p.x - rdrag.p0.x) * uz - (p.z - rdrag.p0.z) * ux
    if (free) return { d, lock: null }
    let best = null
    for (const o of plan.rooms) {
      if (o.id === room.id) continue
      o.polygon.forEach((c, j) => {          // the wall lines of the other rooms that run the same way: the wall locks onto them
        const e = o.polygon[(j + 1) % o.polygon.length], M = Math.hypot(e[0] - c[0], e[1] - c[1]) || 1
        if (Math.abs(((e[0] - c[0]) / M) * uz - ((e[1] - c[1]) / M) * ux) > 0.02) return
        const s = (c[0] - a[0]) * uz - (c[1] - a[1]) * ux; if (Math.abs(s) < 0.04) return          // the same line as this wall: it moves with it
        const dd = Math.abs(d - s); if (dd < LOCK_PX / pxPerM() && (!best || dd < best.dd)) best = { dd, s, c, e, M }
      })
    }
    if (best) { const nx = uz, nz = -ux, g = best.s, mid = [(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + nz * g]; return { d: best.s, lock: { text: 'in line with a wall', guides: [{ a: [mid[0] - ux * 3, mid[1] - uz * 3], b: [mid[0] + ux * 3, mid[1] + uz * 3] }] } } }
    d = Math.round(d * 100) / 100
    return { d: Math.abs(d) < 0.005 ? 0 : d, lock: null }
  }
  function reshapeDown(e) {
    const room = reshapeRoom(), p = point(e), h = reshapeHit(p); if (!room || !h) return
    rdrag = { ...h, p0: p, off: h.kind === 'corner' ? [p.x - room.polygon[h.index][0], p.z - room.polygon[h.index][1]] : null, changes: null, moved: false }; capture(e); note = ''
  }
  function reshapeMove(e) {
    const room = reshapeRoom(); if (!room) return
    const p = point(e)
    if (!rdrag) { const h = reshapeHit(p), was = reshape.hover; reshape.hover = h ? { kind: h.kind, index: h.index } : null; if ((was?.kind !== reshape.hover?.kind || was?.index !== reshape.hover?.index) && !raf) raf = requestAnimationFrame(() => { raf = 0; redraw() }); return }
    if (!rdrag.started) { if (Math.hypot(p.x - rdrag.p0.x, p.z - rdrag.p0.z) * pxPerM() < 3) return; rdrag.started = true }          // a click is not a drag: nothing moves until the pointer has travelled a few pixels
    if (rdrag.kind === 'corner') {
      const res = reshapeCorner({ x: p.x - rdrag.off[0], z: p.z - rdrag.off[1] }, e.altKey, room, rdrag.index), to = res.to, from = room.polygon[rdrag.index]
      rdrag.lock = res.lock; rdrag.changes = cornerChanges(plan, room.id, rdrag.index, to); rdrag.moved = Math.hypot(to[0] - from[0], to[1] - from[1]) > 0.004
    } else {
      const res = reshapeWall(p, e.altKey, room, rdrag.index), d = res.d
      rdrag.lock = res.lock; rdrag.changes = wallChanges(plan, room.id, rdrag.index, d); rdrag.moved = Math.abs(d) > 0.004
    }
    reshape.hover = { kind: rdrag.kind, index: rdrag.index }
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw(); drawSel() })
  }
  function reshapeEnd() {
    const d = rdrag; rdrag = null
    if (d && d.moved && d.changes && d.changes.length) return applyReshape(d.changes, null)
    drawSel(); redraw()
  }
  function applyReshape(changes, edit) {
    if (!changes || !changes.length) return
    const res = onStructure({ op: 'reshape', changes, edit, focusId: reshape.id })
    if (res && res.ok === false) { note = res.error; rdrag = null; drawSel(); redraw() }
  }
  function reshapeDouble(e) {
    const room = reshapeRoom(), p = point(e), h = reshapeHit(p); if (!room || !h) return
    const n = room.polygon.length
    if (h.kind === 'corner') {
      if (n <= 3) { note = 'A room needs at least three corners.'; drawSel(); return }
      return applyReshape(removeChanges(plan, room.id, h.index), { type: 'remove', vertex: h.index, n })
    }
    const a = room.polygon[h.index], b = room.polygon[(h.index + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L
    const s = Math.max(0.2, Math.min(L - 0.2, Math.round(((p.x - a[0]) * ux + (p.z - a[1]) * uz) * 100) / 100))
    applyReshape(insertChanges(plan, room.id, h.index, [a[0] + ux * s, a[1] + uz * s]), { type: 'insert', edge: h.index })
  }
  // 90 degree corners: every nearly straight wall made exactly straight, walls of different rooms that are nearly on one line put on one line (layout/planops.js squareUp); ids: the rooms to square, null = all
  function squareRooms(ids, angle) {
    const res = onStructure({ op: 'square', ids, angle, focusId: focus !== null && plan.rooms[focus] ? plan.rooms[focus].id : null, reshape: mode === 'reshape' })
    if (res && res.ok === false) { note = res.error; if (mode === 'reshape') drawSel() }
  }
  function drawReshapePanel() {
    const room = reshapeRoom(); if (!room) return
    const poly = (rdrag?.changes?.find((c) => c.id === room.id) || {}).polygon || room.polygon
    const area = Math.abs(poly.reduce((s, q, i) => { const r = poly[(i + 1) % poly.length]; return s + (q[0] * r[1] - r[0] * q[1]) / 2 }, 0))
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>Reshape ${esc(room.name)}</b><small>${area.toFixed(1)} m\u00b2, ${poly.length} corners${rdrag && rdrag.lock ? ` <span class="lockinfo">&middot; locked ${esc(rdrag.lock.text)}</span>` : ''}</small></div>
      <div class="selbtns"><button class="btn sm" data-a="square1" type="button" title="Make every wall of this room exactly horizontal or vertical, even a wall that is slanted a lot (up to 40 degrees), and put the walls on the wall lines of the rooms next to it">Square up this room</button><button class="btn sm" data-a="squareAll" type="button" title="The same for every room of the plan">Square up all rooms</button><button class="btn sm primary" data-a="done" type="button">Done</button></div></div>
      <p class="hint-line" style="margin-top:8px">Drag a <b>corner</b> to move it. Drag a <b>wall</b> to move the whole wall: a wall that another room shares moves with it. Double-click a wall to add a corner, double-click a corner to take it away. Doors and windows in a wall move with it. A corner or wall locks when it gets close to horizontal, vertical, parallel or square to another wall (a dashed line shows which); hold Alt to move freely. <span>Esc stops</span></p>`
    selEl.querySelector('[data-a="done"]').onclick = () => setMode(null)
    selEl.querySelector('[data-a="square1"]').onclick = () => squareRooms([room.id], 40)
    selEl.querySelector('[data-a="squareAll"]').onclick = () => squareRooms(null)
  }
  // ---- drawing the outline of a room: corners stick to the corners and wall faces of the rooms; lines run straight (across or along) unless Alt is held; the first corner closes the outline
  const CLOSE = 0.25
  function drawPoint(p, free) {
    const k = pxPerM(); let [x, z, hit] = snapPoint(p, null, reachPx(free))
    if (!hit) {
      const a = drawing.pts[drawing.pts.length - 1]
      if (a && !free) { if (Math.abs(x - a[0]) < 4 / k) x = a[0]; else if (Math.abs(z - a[1]) < 4 / k) z = a[1] }          // a straight line when the pointer is within a few pixels of one
    }
    const first = drawing.pts[0]; if (first && drawing.pts.length >= 3 && Math.hypot(p.x - first[0], p.z - first[1]) < CLOSE) return [first[0], first[1]]
    return [Math.max(0, x), Math.max(0, z)]
  }
  function drawClick(p, free) {
    const q = drawPoint(p, free), first = drawing.pts[0]
    if (first && drawing.pts.length >= 3 && q[0] === first[0] && q[1] === first[1]) return finishRoom()
    const last = drawing.pts[drawing.pts.length - 1]; if (last && Math.hypot(q[0] - last[0], q[1] - last[1]) < 0.05) return
    drawing.pts.push(q); note = ''; drawing.cur = q; drawSel(); redraw()
  }
  function finishRoom() {
    if (drawing.pts.length < 3) { note = 'Click at least three corners first.'; drawSel(); return }
    const res = onStructure({ op: 'add', polygon: drawing.pts.map((q) => [...q]), name: drawing.name, kind: drawing.kind })
    if (res && res.ok === false) { note = res.error; drawSel() }
  }
  function drawRoomPanel() {
    const n = drawing.pts.length, pts = drawing.cur && n ? [...drawing.pts, drawing.cur] : drawing.pts
    const area = pts.length >= 3 ? Math.abs(pts.reduce((s, q, i) => { const r = pts[(i + 1) % pts.length]; return s + (q[0] * r[1] - r[0] * q[1]) / 2 }, 0)) : 0
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>New room</b><small>${n === 0 ? 'Click its first corner' : n < 3 ? `${n} corner${n > 1 ? 's' : ''}, click the next` : `${n} corners${area ? ', ' + area.toFixed(1) + ' m\u00b2' : ''}`}</small></div>
      <div class="selfields"><label class="fld"><span>Name</span><input type="text" id="dr-name" maxlength="40" placeholder="Corridor" value="${esc(drawing.name)}"></label>
      <label class="fld"><span>Type</span><select id="dr-kind">${KIND_OPTIONS.map(([v, l]) => `<option value="${v}" ${v === drawing.kind ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
      <div class="selbtns"><button class="btn sm primary" data-a="finish" type="button" ${n >= 3 ? '' : 'disabled'}>Finish the room</button><button class="btn sm" data-a="back" type="button" ${n ? '' : 'disabled'}>Remove last corner</button><button class="btn sm" data-a="cancel" type="button">Cancel</button></div></div>
      <p class="hint-line" style="margin-top:8px">Click the corners one after the other around the missing room. Corners stick to the corners and walls of the rooms next to it, and lines run straight (hold Alt to draw freely). Click the first corner again, or press Enter, to finish. <span>Backspace removes the last corner, Esc cancels</span>. Add its doors afterwards with Add a piece.</p>`
    $('#dr-name').oninput = (e) => { drawing.name = e.target.value }; $('#dr-kind').onchange = (e) => { drawing.kind = e.target.value }
    selEl.querySelector('[data-a="finish"]').onclick = finishRoom
    selEl.querySelector('[data-a="back"]').onclick = () => { drawing.pts.pop(); drawing.cur = null; note = ''; drawSel(); redraw(); planEl.focus({ preventScroll: true }) }
    selEl.querySelector('[data-a="cancel"]').onclick = () => setMode(null)
  }
  function measureClick(p) {
    const pt = snapPoint(p)
    if (!meas || meas.b) meas = { a: pt, b: null, cur: pt }
    else { meas.b = pt }
    drawSel(); redraw()
  }
  function placeAt(p) {
    const before = snap(), win = mode === 'place-window', r = win ? addWindowAt(plan, p.x, p.z) : addDoorAt(plan, p.x, p.z, mode === 'place-opening' ? 'opening' : 'door')
    if (r.error) { note = r.error; drawSel(); return }
    undo.push(before); if (undo.length > 80) undo.shift(); redo.length = 0
    mode = null; planEl.classList.remove('placing'); note = ''
    if (win) select(null, r.op.id); else select(null, null, r.op.id)
    if (win && r.inner) note = 'This wall is between two rooms, not on the outside, so this window looks into the next room (an inner window). Daylight only comes through windows on outside walls.'
    recut(); evaluate()
  }

  // ---- pointer: select, drag with snapping (pieces) or slide along the wall (windows, doors)
  planEl.addEventListener('pointerdown', (e) => {
    planEl.focus({ preventScroll: true })
    if (mode === 'measure') { measureClick(point(e)); return }
    if (mode === 'draw-room') { drawClick(point(e), e.altKey); return }
    if (mode === 'reshape') { reshapeDown(e); return }
    if (mode === 'pick-spot') { pickClick(point(e), e.altKey); return }
    if (placing(mode)) { placeAt(point(e)); return }
    const wg = e.target.closest('.wn'), dg = e.target.closest('.dn'), g = e.target.closest('.pc')
    if ((wg || dg) && !g) {
      const op = plan.openings.find((o) => o.id === (wg ? wg.dataset.wid : dg.dataset.did)); if (!op) return
      if (wg) select(null, op.id); else select(null, null, op.id)
      const p = point(e), pl = placement(plan, op), s = (p.x - pl.wall.a[0]) * pl.u[0] + (p.z - pl.wall.a[1]) * pl.u[1]
      drag = { win: op.id, off: s - op.offset, moved: false, before: snap() }
      capture(e); drawSel(); redraw(); return
    }
    if (!g) {
      const p = point(e), sides = nearWall(plan, p.x, p.z) ? sidesAt(plan, p.x, p.z) : []          // a click on a wall selects it: remove it (the rooms join) or colour it
      if (sides.length) { select(null); selWall = { sides }; note = ''; drawSel(); redraw(); return }
      if (selected || selWin || selDoor || selWall) { select(null); evaluate() }
      return
    }
    const id = g.dataset.id, it = cur.find((i) => i.id === id); if (!it) return
    if (selected !== id || selWin || selDoor) select(id)
    if (locked(it)) { drawSel(); redraw(); return }         // a locked piece can be selected but not dragged
    const p = point(e); drag = { id, off: [p.x - it.x, p.z - it.z], moved: false, before: snap() }
    capture(e); drawSel(); redraw()
  })
  planEl.addEventListener('pointermove', (e) => {
    if (mode === 'reshape') { reshapeMove(e); return }
    if (mode === 'draw-room' && drawing) { drawing.cur = drawPoint(point(e), e.altKey); if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw() }); return }
    if (placing(mode) && original) { refHover = point(e); if (!refRaf) refRaf = requestAnimationFrame(() => { refRaf = 0; drawRef() }); return }          // the circle on the original plan follows the pointer
    if (mode === 'pick-spot' && pick) { pickMove(point(e), false, e.altKey); return }
    if (mode === 'measure' && meas?.a && !meas.b) { meas.cur = snapPoint(point(e)); if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw() }); return }
    if (!drag) return
    const p = point(e)
    if (drag.win) {
      const op = plan.openings.find((o) => o.id === drag.win), pl = placement(plan, op), s = (p.x - pl.wall.a[0]) * pl.u[0] + (p.z - pl.wall.a[1]) * pl.u[1] - drag.off
      if (!drag.moved && Math.abs(s - op.offset) < 0.04) return
      drag.moved = true; moveWindow(plan, op.id, Math.round(s * 20) / 20)
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw() })
      return
    }
    const it = cur.find((i) => i.id === drag.id)
    const tx = p.x - drag.off[0], tz = p.z - drag.off[1]
    if (!drag.moved && Math.hypot(tx - it.x, tz - it.z) < 0.04) return
    drag.moved = true
    const moved = snapMove(space, cur, it, tx, tz, e.altKey ? FREE : SNAP); moved.room = roomIndexAt(space, moved.x, moved.z)
    cur = cur.map((i) => (i.id === moved.id ? moved : i))
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; redraw() })
    schedule()
  })
  const end = () => {
    if (mode === 'reshape') return reshapeEnd()
    if (!drag) return
    const d = drag; drag = null
    if (d.moved) { undo.push(d.before); if (undo.length > 80) undo.shift(); redo.length = 0; if (d.win) { recut(); evaluate() } else { onChange(cur.map(clean)); evaluate() } return }
    evaluate()
  }
  planEl.addEventListener('pointerup', end); planEl.addEventListener('pointercancel', end)
  // a double click on a wall (not on a piece, a window or a door): the colour of the wall; a wall between two rooms has a side in each
  planEl.addEventListener('dblclick', (e) => {
    if (mode === 'reshape') { e.preventDefault(); return reshapeDouble(e) }
    if (!onWall || mode || e.target.closest('.wn, .dn, .pc')) return
    const p = point(e); if (!nearWall(plan, p.x, p.z)) return
    const sides = sidesAt(plan, p.x, p.z); if (sides.length) onWall({ sides, selected: sides, clientX: e.clientX, clientY: e.clientY })
  })

  // ---- keyboard
  planEl.addEventListener('keydown', (e) => {
    if (mode === 'pick-spot' && pick && e.key.toLowerCase() === 'r') { e.preventDefault(); pick.rot = (pick.rot + (e.shiftKey ? -1 : 1) * Math.PI / 2 + 4 * Math.PI) % (2 * Math.PI); if (pick.pos) pickMove(pick.pos, true); return }
    if (mode === 'draw-room' && drawing) {
      if (e.key === 'Enter') { e.preventDefault(); return finishRoom() }
      if (e.key === 'Backspace' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z')) { e.preventDefault(); drawing.pts.pop(); drawing.cur = null; note = ''; drawSel(); redraw(); return }
    }
    if (e.key === 'Escape' && mode) { e.preventDefault(); return setMode(null) }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return e.shiftKey ? doRedo() : doUndo() }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); return doRedo() }
    if (selWin || selDoor) {
      const op = plan.openings.find((o) => o.id === (selWin || selDoor)); if (!op) return
      const step = e.shiftKey ? 0.2 : 0.05
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); return winEdit(() => moveWindow(plan, op.id, op.offset + (e.key === 'ArrowLeft' ? -step : step))) }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return winEdit(() => { selWin ? removeWindow(plan, op.id) : removeOpening(plan, op.id); select(null) }) }
      return
    }
    const it = cur.find((i) => i.id === selected)
    if (!it) return
    const step = e.shiftKey ? 0.1 : 0.01          // a piece moves 1 cm with an arrow key, 10 cm with Shift
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (mv || e.key.toLowerCase() === 'r' || e.key === 'Delete' || e.key === 'Backspace') { if (locked(it)) { e.preventDefault(); return lockedNote() } }
    if (mv) { e.preventDefault(); const n = snapMove(space, cur, it, it.x + mv[0], it.z + mv[1], FREE); n.room = roomIndexAt(space, n.x, n.z); return commit(cur.map((i) => (i.id === it.id ? n : i))) }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); return commit(cur.map((i) => (i.id === it.id ? turn(i, e.shiftKey ? -1 : 1) : i))) }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return removeSel() }
  })
  function doUndo() { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); onChange(cur.map(clean)); evaluate() }
  function doRedo() { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); onChange(cur.map(clean)); evaluate() }
  function removeSel() { if (!selected) return; const id = selected; select(null); commit(cur.filter((i) => i.id !== id), false) }

  // ---- the room row: name, kind and re-fit for the room in focus
  function drawRoom() {
    const r = focus !== null ? plan.rooms[focus] : null
    roomEl.hidden = !r; if (!r) { roomEl.innerHTML = ''; return }
    const cur0 = optionOf(r), outdoor = space.rooms[focus]?.outdoor
    roomEl.innerHTML = `<label class="fld"><span>Room</span><input type="text" id="er-name" maxlength="40" value="${esc(r.name)}" aria-label="Room name"></label>
      <label class="fld"><span>Type</span><select id="er-kind" aria-label="Room type">${KIND_OPTIONS.map(([v, l]) => `<option value="${v}" ${v === cur0 ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <button class="btn sm" id="er-refit" type="button" title="Place the furniture of this room again. Locked pieces stay where they are.">Re-fit this room</button>
      <button class="btn sm ${mode === 'reshape' ? 'on' : ''}" id="er-reshape" type="button" ${onStructure ? '' : 'hidden'} title="Drag the corners and walls of this room to the right place, add a corner, or take one away. You can undo it.">Reshape this room</button>
      <button class="btn sm" id="er-square" type="button" ${onStructure ? '' : 'hidden'} title="Make every wall that is nearly horizontal or vertical exactly horizontal or vertical (90 degree corners), and line up the walls of the rooms that are nearly on one line. A wall that is slanted on purpose is left alone. You can undo it.">Square up all rooms</button>
      <button class="btn sm danger" id="er-del" type="button" ${onStructure && plan.rooms.length > 1 ? '' : 'hidden'} title="Take this room off the plan (a room the plan reader made up, for example). You can undo it.">Delete this room</button>
      <span class="muted small">${outdoor ? 'An outdoor area: railing instead of walls, outdoor furniture.' : 'The type decides which furniture is placed.'}</span>`
    const apply = (patch) => {
      const before = JSON.stringify(kindOf(plan.rooms[focus]))
      setRoomKind(plan, focus, patch); space = buildSpace(plan); undo.length = 0; redo.length = 0
      onRoomEdit(focus, space, JSON.stringify(kindOf(plan.rooms[focus])) !== before)
    }
    $('#er-name').onchange = (e) => apply({ name: e.target.value })
    $('#er-kind').onchange = (e) => apply({ userKind: e.target.value })
    $('#er-refit').onclick = () => onRefitRoom(focus)
    $('#er-reshape').onclick = () => setMode(mode === 'reshape' ? null : 'reshape')
    $('#er-square').onclick = () => squareRooms(null)
    $('#er-del').onclick = (ev) => {          // two clicks: the first asks
      const b = ev.currentTarget, id = r.id
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Really delete ' + r.name + '?'; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ''; b.textContent = 'Delete this room' } }, 4000); return }
      onStructure({ op: 'delete', room: id })
    }
  }

  // ---- a wall that was clicked: remove it (the two rooms it separates join into one) or colour it
  function drawWall() {
    const sides = selWall.sides, A = sides[0].room, B = sides[1]?.room || null, share = B ? sharedLength(plan, A.id, B.id) : 0, canJoin = Boolean(B) && share >= 0.3 && Boolean(onStructure), big = B && B.areaM2 > A.areaM2 ? B : A
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>${B ? `Wall between ${esc(A.name)} and ${esc(B.name)}` : `Outer wall of ${esc(A.name)}`}</b><small>${B ? `${cm(share)} cm shared` : ''}</small></div>
      <div class="selbtns">${canJoin ? '<button class="btn sm danger" data-a="join" type="button">Remove this wall (join the rooms)</button>' : ''}${onWall ? '<button class="btn sm" data-a="colour" type="button">Colour</button>' : ''}<button class="btn sm" data-a="done" type="button">Done</button></div></div>
      <p class="hint-line" style="margin-top:8px">${canJoin ? `Removing the wall joins <b>${esc(A.name)}</b> and <b>${esc(B.name)}</b> into one room, named ${esc(big.name)}. The doors in that wall go with it and the furniture stays where it is. You can undo it.` : B ? 'These two rooms only touch at a corner, so there is no wall between them to remove.' : 'An outer wall cannot be removed on its own. To take away everything behind it, pick the room in the row above the plan and press Delete this room.'}</p>`
    selEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a
      if (a === 'join') return onStructure({ op: 'merge', rooms: [A.id, B.id] })
      if (a === 'colour') { const r = b.getBoundingClientRect(); return onWall({ sides, selected: sides, clientX: r.left, clientY: r.bottom }) }
      selWall = null; drawSel(); redraw()
    }))
  }
  function drawWallHighlight() {
    const svg = planEl.querySelector('svg'); if (!svg || !selWall) return
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.style.pointerEvents = 'none'
    g.innerHTML = selWall.sides.map((s) => { const p = s.room.polygon, a = p[s.edge], b = p[(s.edge + 1) % p.length]; return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#c6f24e" stroke-width=".11" stroke-linecap="round" opacity=".85"/>` }).join('')
    svg.appendChild(g)
  }

  // ---- the plan that was uploaded, above the generated plan while a door, a window or an open passage is placed or edited, with the openings of the generated plan marked on it
  // (and a ring that follows the pointer): so that the client can check each one against the picture they know. Plans without a saved picture have no such panel.
  const toImage = (x, z) => { const s = plan.scale?.mPerUnit, o = plan.source?.origin; return s && o ? [o[0] + x / s, o[1] + z / s] : null }
  function drawRef() {
    const editing = placing(mode) || Boolean(selWin) || Boolean(selDoor), want = Boolean(original?.image) && editing
    if (!want) {
      refHover = null
      // a room made before the picture was kept with it: the person can add the picture again (nothing is read again, it costs nothing)
      if (editing && !original?.image && onAttachOriginal) {
        if (!refEl.querySelector('.ed-ref-add')) {
          refEl.hidden = false
          refEl.innerHTML = `<div class="ed-ref-h"><b>Your original plan</b><span class="muted small">This room was made before the picture was kept with it. Add the picture you uploaded to compare it with the plan below. Nothing is read again.</span></div><div class="ed-ref-add"><label class="btn sm">Add the picture<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label><span class="muted small" id="ed-ref-msg"></span></div>`
          const inp = refEl.querySelector('input'), msg = refEl.querySelector('#ed-ref-msg')
          inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; msg.textContent = 'Adding...'; try { await onAttachOriginal(f) } catch { msg.textContent = 'That file could not be used. Please choose a PNG or JPG.' } }
        }
        return
      }
      if (!refEl.hidden) { refEl.hidden = true; refEl.innerHTML = '' }
      return
    }
    const size = plan.source?.imageSize, can = Boolean(size) && Boolean(toImage(0, 0))
    if (refEl.hidden || !refEl.firstChild) { refEl.hidden = false; refEl.innerHTML = `<div class="ed-ref-h"><b>Your original plan</b><span class="muted small">${can ? 'Doors are green, windows blue, open passages orange. The ring follows your pointer on the plan below.' : 'The picture you uploaded, to compare with.'}</span></div><div class="ed-ref-box"><img alt="Your original plan" src="${esc(original.image)}">${can ? `<svg class="ed-ref-ov" viewBox="0 0 ${size[0]} ${size[1]}" preserveAspectRatio="none"></svg>` : ''}</div>` }
    const ov = refEl.querySelector('.ed-ref-ov'); if (!ov) return
    const k = size[0] / 60, col = { window: '#3b8cf0', door: '#2fb457', opening: '#f08c14' }
    let svg = ''
    for (const o of plan.openings) {
      let pl; try { pl = placement(plan, o) } catch { continue }
      const a = toImage(pl.a[0], pl.a[1]), b = toImage(pl.b[0], pl.b[1]), on = o.id === selWin || o.id === selDoor; if (!a || !b) continue
      svg += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col[o.kind] || '#c0c'}" stroke-width="${on ? k * 0.34 : k * 0.2}" stroke-linecap="round" opacity="${on ? 1 : 0.85}"/>`
      if (on) svg += `<circle cx="${(a[0] + b[0]) / 2}" cy="${(a[1] + b[1]) / 2}" r="${k * 0.85}" fill="none" stroke="#fff" stroke-width="${k * 0.14}"/>`
    }
    if (refHover) { const c = toImage(refHover.x, refHover.z); if (c) svg += `<circle cx="${c[0]}" cy="${c[1]}" r="${k * 0.8}" fill="none" stroke="#c6f24e" stroke-width="${k * 0.16}"/><line x1="${c[0] - k * 1.4}" y1="${c[1]}" x2="${c[0] + k * 1.4}" y2="${c[1]}" stroke="#c6f24e" stroke-width="${k * 0.1}"/><line x1="${c[0]}" y1="${c[1] - k * 1.4}" x2="${c[0]}" y2="${c[1] + k * 1.4}" stroke="#c6f24e" stroke-width="${k * 0.1}"/>` }
    ov.innerHTML = svg
  }


  // ---- a slim bar under the plan for the selected piece, window or door, or the hint of the current mode
  function syncPanels() {
    if (selWin && we) { de?.hide(); we.show(selWin) }
    else if (selDoor && de) { we?.hide(); de.show(selDoor) }
    else { we?.hide(); de?.hide() }
  }
  function drawSel() {
    syncPanels()
    if (mode === 'measure') return drawMeasure()
    if (mode === 'draw-room' && drawing) return drawRoomPanel()
    if (mode === 'reshape' && reshape) return drawReshapePanel()
    if (mode === 'pick-spot' && pick) { selEl.innerHTML = pickPanel(); selEl.querySelector('[data-a="cancel-pick"]').onclick = () => setMode(null); return }
    if (selWall && !placing(mode)) return drawWall()
    if (placing(mode)) { selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<p class="hint-line"><b style="color:var(--ink)">Click on a wall</b> to place the ${mode === 'place-door' ? 'door' : mode === 'place-window' ? 'window' : 'open passage'}. It goes inside the wall of the room it belongs to and clear of the other doors and windows.${mode === 'place-window' ? ' Outside walls give daylight; a wall between two rooms makes an inner window.' : ''} <span>Esc cancels</span></p><div class="selbtns" style="margin-top:8px"><button class="btn sm" data-a="cancel-mode" type="button">Cancel</button></div>`; selEl.querySelector('[data-a]').onclick = () => setMode(null); return }
    if (selWin) return drawWin()
    if (selDoor) return drawDoor()
    const it = cur.find((i) => i.id === selected)
    if (!it) { selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<p class="hint-line">Click a piece, a window or a door to select it, then drag it; click a wall to remove it or colour it. Pieces move to the centimetre and stick to a wall or a neighbour within 6 cm (hold Alt to move freely); windows and doors slide along their wall. Distances and checks update as you move. <span>R turns a piece · arrow keys nudge 1 cm (Shift 10 cm) · Delete removes · Ctrl+Z undoes · a locked piece stays put when a room is fitted again</span></p>`; return }
    const rs = resizable(it.type, it), mine = (rep?.checks || []).filter((c) => c.item === it.id && c.level !== 'ok'), lk = locked(it)
    const field = (k, label, v) => `<label class="fld"><span>${label}</span><input type="number" data-f="${k}" min="10" max="900" step="5" value="${cm(v)}" ${lk ? 'disabled' : ''}><small>cm</small></label>`
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>${esc(it.product?.fullName || it.product?.name || labelOf(it.type))}${lk ? ' · locked' : ''}</b><small>${esc(space.rooms[roomIndexAt(space, it.x, it.z)]?.name || '')}${it.product ? ` · ${esc(labelOf(it.type))} · exact size from ${/^https?:\/\//.test(it.product.link || '') ? `<a href="${esc(it.product.link)}" target="_blank" rel="noopener noreferrer">${esc(it.product.host || 'the shop')}</a>` : esc(it.product.host || 'the shop page')}` : ''}</small></div>
      <div class="selfields">${rs.includes('w') ? field('w', 'Width', it.w) : `<span class="ro">Width <b>${cm(it.w)}</b> cm</span>`}${rs.includes('d') ? field('d', 'Depth', it.d) : `<span class="ro">Depth <b>${cm(it.d)}</b> cm</span>`}
      ${rs.includes('mw') ? `<label class="fld"><span>Mattress</span><select data-f="mw" ${lk ? 'disabled' : ''}>${[90, 140, 160].map((n) => `<option ${Math.round((it.w - 0.1) * 100) === n ? 'selected' : ''}>${n}</option>`).join('')}</select><small>cm</small></label>` : ''}</div>
      <div class="selbtns"><button class="btn sm ${lk ? 'on' : ''}" data-a="lock" type="button" title="A locked piece cannot be moved by accident and stays where it is when the room is fitted again">${lk ? 'Unlock' : 'Lock'}</button><button class="btn sm" data-a="left" type="button" ${lk ? 'disabled' : ''}>Turn left</button><button class="btn sm" data-a="right" type="button" ${lk ? 'disabled' : ''}>Turn right</button><button class="btn sm danger" data-a="del" type="button" ${lk ? 'disabled' : ''}>Delete</button></div></div>
      ${mine.length ? `<ul class="selmine">${mine.map((c) => `<li class="${c.level}">${esc(c.label)}</li>`).join('')}</ul>` : ''}`
    selEl.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.f, v = Number(inp.value); if (!(v > 0)) return
      const next = k === 'mw' ? resize(it, { mw: v }) : resize(it, { [k]: v / 100 }); next.room = roomIndexAt(space, next.x, next.z)
      commit(cur.map((i) => (i.id === it.id ? next : i)))
    }))
    selEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a; note = ''
      if (a === 'lock') return commit(cur.map((i) => (i.id === it.id ? { ...i, locked: !lk } : i)))
      if (a === 'del') return removeSel()
      commit(cur.map((i) => (i.id === it.id ? turn(i, a === 'left' ? -1 : 1) : i)))
    }))
  }
  function drawMeasure() {
    if (!meas) { selEl.innerHTML = `<p class="hint-line"><b style="color:var(--ink)">Click the first point</b> of a length you know, such as the two ends of one wall. Points snap to the corners and wall faces of the rooms. <span>Esc cancels</span></p>`; return }
    if (!meas.b) { selEl.innerHTML = `<p class="hint-line"><b style="color:var(--ink)">Now click the second point.</b></p>`; return }
    const L = Math.hypot(meas.b[0] - meas.a[0], meas.b[1] - meas.a[1])
    selEl.innerHTML = `<div class="selbar"><div class="selname"><b>Measured ${cm(L)} cm</b><small>on this plan</small></div>
      <div class="selfields"><label class="fld"><span>Real length</span><input type="number" id="ms-real" min="30" max="3000" step="1" value="${cm(L)}"><small>cm</small></label></div>
      <div class="selbtns"><button class="btn sm primary" data-a="scale" type="button">Set as the scale</button><button class="btn sm" data-a="again" type="button">Measure again</button><button class="btn sm" data-a="done" type="button">Done</button></div></div>
      <p class="hint-line" style="margin-top:8px">${note ? esc(note) + ' ' : ''}Setting the scale stretches the whole plan, doors and windows included, and fits the furniture again; locked pieces keep their place. Use it when the plan reader got the size wrong.</p>`
    selEl.querySelector('[data-a="again"]').onclick = () => { meas = null; drawSel(); redraw() }
    selEl.querySelector('[data-a="done"]').onclick = () => setMode(null)
    selEl.querySelector('[data-a="scale"]').onclick = () => {
      const real = Number($('#ms-real').value) / 100, f = real / L
      if (!(real > 0) || f < 0.4 || f > 2.5) { note = 'That is more than 2.5 times off. Check the length you typed.'; drawSel(); return }
      if (Math.abs(f - 1) < 0.002) { setMode(null); return }
      applyScale(f)
    }
  }
  function applyScale(f) {
    const was = plan._baseScale
    scalePlan(plan, f); rebuild(plan); space = buildSpace(plan); cur = scaleItems(cur, f)
    undo.length = 0; redo.length = 0; note = ''; mode = null; meas = null; drawing = null; planEl.classList.remove('measuring', 'placing'); $('#ed-measure').classList.remove('on')
    void was
    onScale(f, space, cur.map(clean))
  }
  function drawWin() {
    const op = plan.openings.find((o) => o.id === selWin); if (!op) { selWin = null; return drawSel() }
    const pl = placement(plan, op), maxPanes = Math.max(1, Math.min(LIMITS.maxPanes, Math.floor(op.width / LIMITS.minPane)))
    const nf = (k, label, v, min, max, step = 5) => `<label class="fld"><span>${label}</span><input type="number" data-w="${k}" min="${min}" max="${max}" step="${step}" value="${cm(v)}"><small>cm</small></label>`
    // the pieces that stand in front of this window and are too tall for its sill
    const zones = space.rooms.flatMap((r) => r.windows.filter((w) => w.id === op.id).map((w) => w.zone))
    const hit = new Set(cur.filter((it) => zones.some((z) => overlaps(z, obb(it.x, it.z, it.w, it.d, it.rot), 0.01))).map((it) => it.id))
    const mine = (rep?.checks || []).filter((c) => c.rule === 'window' && hit.has(c.item) && c.level !== 'ok')
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>Window</b><small>${esc(space.rooms.find((r) => r.windows.some((w) => w.id === op.id))?.name || '')}${op.width >= 1.9 ? ', wide window' : op.width <= 0.8 ? ', narrow window' : ''}</small></div>
      <div class="selfields">${we ? `<span class="ro">${cm(op.width)} × ${cm(op.height)} cm · sill ${cm(op.sill)} · ${panesOf(op)} pane${panesOf(op) > 1 ? 's' : ''}</span>` : `${nf('width', 'Width', op.width, cm(LIMITS.width[0]), cm(LIMITS.width[1]))}${nf('height', 'Height', op.height, cm(LIMITS.height[0]), cm(LIMITS.height[1]))}${nf('sill', 'Sill', op.sill, 0, cm(LIMITS.sill[1]))}
      <label class="fld"><span>Panes</span><select data-w="panes">${Array.from({ length: maxPanes }, (_, k) => k + 1).map((n) => `<option ${panesOf(op) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`}</div>
      <div class="selbtns"><button class="btn sm" data-a="wleft" type="button">Slide left</button><button class="btn sm" data-a="wright" type="button">Slide right</button><button class="btn sm danger" data-a="wdel" type="button">Remove</button></div></div>
      <p class="hint-line" style="margin-top:8px">${we ? 'The window editor next to the 3D view stretches it, divides it into panes and sets its height. Here you can also drag it along its wall.' : `Drag the window along its wall, or type a size. Each pane is ${cm(op.width / panesOf(op))} cm wide.`} <span>Position ${cm(op.offset - op.width / 2)} cm from the wall's start, ${cm(pl.length - op.offset - op.width / 2)} cm from its end</span></p>
      ${mine.length ? `<ul class="selmine">${mine.map((c) => `<li class="${c.level}">${esc(c.label)}</li>`).join('')}</ul>` : ''}`
    selEl.querySelectorAll('[data-w]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.w, v = Number(inp.value); if (!(v > 0)) return
      winEdit(() => setWindow(plan, op.id, { [k]: k === 'panes' ? v : v / 100 }))
    }))
    selEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a
      if (a === 'wdel') return winEdit(() => { removeWindow(plan, op.id); select(null) })
      winEdit(() => moveWindow(plan, op.id, op.offset + (a === 'wleft' ? -0.1 : 0.1)))
    }))
  }
  function drawDoor() {
    const op = plan.openings.find((o) => o.id === selDoor); if (!op) { selDoor = null; return drawSel() }
    const pl = placement(plan, op), rooms = roomsOfDoor(space, op.id), names = rooms.map((r) => r.name).join(' and ') || 'outside'
    selEl.innerHTML = `${note ? `<p class="selnote">${esc(note)}</p>` : ''}<div class="selbar"><div class="selname"><b>${op.kind === 'door' ? 'Door' : 'Open passage'}</b><small>${esc(names)}</small></div>
      <div class="selfields"><span class="ro">${cm(op.width)} × ${cm(op.height)} cm</span></div>
      <div class="selbtns"><button class="btn sm" data-a="dleft" type="button">Slide left</button><button class="btn sm" data-a="dright" type="button">Slide right</button><button class="btn sm danger" data-a="ddel" type="button">Remove</button></div></div>
      <p class="hint-line" style="margin-top:8px">${de ? 'The door editor next to the 3D view changes the width and height and puts the hinge on the other side or opens the door into the other room.' : ''} <span>Position ${cm(op.offset - op.width / 2)} cm from the wall's start, ${cm(pl.length - op.offset - op.width / 2)} cm from its end</span></p>`
    selEl.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a
      if (a === 'ddel') return winEdit(() => { removeOpening(plan, op.id); select(null) })
      winEdit(() => moveWindow(plan, op.id, op.offset + (a === 'dleft' ? -0.1 : 0.1)))
    }))
  }

  host.querySelectorAll('[data-o]').forEach((c) => c.addEventListener('change', () => { opts[c.dataset.o] = c.checked; redraw() }))
  $('#ed-undo').onclick = doUndo; $('#ed-redo').onclick = doRedo
  $('#ed-measure').onclick = () => setMode(mode === 'measure' ? null : 'measure')
  $('#ed-add').onchange = (e) => {
    const t = e.target.value; e.target.value = ''; if (!t) return
    if (t === '__door' || t === '__opening' || t === '__window_click') { note = ''; return setMode(t === '__door' ? 'place-door' : t === '__opening' ? 'place-opening' : 'place-window') }
    if (t === '__room') { note = ''; return setMode('draw-room') }
    if (t === '__link') return onAddFromLink?.()
    if (t === '__window' || t.startsWith('__tpl:')) return addWindowTo(t.startsWith('__tpl:') ? windowTemplates?.list().find((x) => x.id === t.slice(6)) : null)
    const p = addPiece(space, cur, t, {}, focus); select(p.id); commit([...cur, p])
  }

  // a new window (default or from a template) in the room being looked at, or in the biggest room
  function addWindowTo(tpl) {
    const ri = focus ?? [...space.rooms].filter((r) => r.kind !== 'none').sort((a, b) => b.area - a.area)[0]?.i
    let added = null
    winEdit(() => { added = addWindow(plan, space, ri, tpl); if (added) select(null, added.id) })
    if (!added) { note = 'No free stretch of outside wall in this room for another window. Use "Window (click a wall)" to choose a wall yourself.'; drawSel() }
  }
  const tplApi = windowTemplates && {
    list: () => windowTemplates.list(),
    save: (name) => { const op = plan.openings.find((o) => o.id === selWin); if (!op) return; windowTemplates.add(templateOf(op, name)); $('#ed-add').innerHTML = addOptions(); we?.show(selWin) },
    use: (tid) => { const t = windowTemplates.list().find((x) => x.id === tid), id = selWin; if (t && id) winEdit(() => applyTemplate(plan, id, t)) },
    addTo: (tid) => addWindowTo(windowTemplates.list().find((x) => x.id === tid) || null),
    drop: (tid) => { windowTemplates.remove(tid); $('#ed-add').innerHTML = addOptions(); we?.show(selWin) },
  }
  const dragApi = { begin: snap, live: () => redraw(), end: (before) => { undo.push(before); if (undo.length > 80) undo.shift(); redo.length = 0; note = ''; recut(); evaluate() } }
  if (windowHost) {
    we = mountWindowEditor(windowHost, {
      templates: tplApi, plan, edit: winEdit, roomName: (o) => space.rooms.find((r) => r.windows.some((w) => w.id === o.id))?.name || '',
      drag: dragApi, remove: (wid) => winEdit(() => { removeWindow(plan, wid); select(null) }), close: () => { select(null); evaluate() },
      convert: (wid) => winEdit(() => { windowToDoor(plan, wid); select(null, null, wid) }),
    })
    de = mountDoorEditor(windowHost, {
      plan, space: () => space, edit: winEdit, drag: dragApi, remove: (did) => winEdit(() => { removeOpening(plan, did); select(null) }), close: () => { select(null); evaluate() },
      convert: (did) => winEdit(() => { doorToWindow(plan, did); select(null, did) }),
    })
  }
  drawRoom(); evaluate()
  if (startReshape && focus !== null) setMode('reshape')          // after a change the editor is made again: go on reshaping the same room
  return {
    getItems: () => cur.map(clean), getReport: () => rep, getSpace: () => space, select: (id) => { select(id); drawSel(); redraw() },
    setItems(next) { cur = next.map((i) => ({ ...i })); undo.length = 0; redo.length = 0; if (!cur.some((i) => i.id === selected)) selected = null; drawRoom(); evaluate() },
    setSpace(nextSpace) { space = nextSpace; drawRoom() },
    refresh(nextSpace) { if (nextSpace) space = nextSpace; drawRoom(); evaluate() },
    // the person chooses where a piece goes: resolves { x, z, rot } on a click, null on Esc or Cancel
    pickSpot({ type, w, d, h, name, roomIndex }) {
      return new Promise((resolve) => {
        if (pick) endPick(null)
        select(null); mode = 'pick-spot'; planEl.classList.add('placing'); planEl.focus({ preventScroll: true })
        pick = { ghost: { ...make(type || 'product', { w, d, h }), id: '__ghost' }, rot: 0, room: roomIndex, name: name || 'the piece', resolve, pos: null, state: { level: 'good', text: 'Move the pointer over the room.' } }
        drawSel(); redraw()
      })
    },
    setOriginal(img) { original = img || null; refEl.hidden = true; refEl.innerHTML = ''; drawRef() },
    focusRoom(i) { focus = i; selected = null; selWin = null; selDoor = null; selWall = null; if (mode && !(mode === 'reshape' && reshape && plan.rooms[i] && plan.rooms[i].id === reshape.id)) { mode = null; meas = null; drawing = null; reshape = null; rdrag = null; planEl.classList.remove('placing', 'measuring'); $('#ed-measure').classList.remove('on') } onSelect(null); drawRoom(); drawSel(); redraw() },
    destroy() { boxWatch?.disconnect(); clearTimeout(evalTimer); cancelAnimationFrame(raf); we?.destroy(); de?.destroy(); host.innerHTML = ''; if (refHost) { refHost.hidden = true; refHost.innerHTML = '' } },
  }
}
void doorsOf
