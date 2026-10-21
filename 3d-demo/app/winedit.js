// The window editor: a front view of one window in its wall, next to the 3D view. Drag an edge to stretch the window, drag the window to slide it
// (sideways along the wall, up and down for the sill), drag a bar to move it, click a bar and press Delete to remove it. The numbers are always the
// real ones (layout/windows.js clamps them against the neighbours, the wall ends, the ceiling and the smallest pane); the plan follows while dragging
// and the 3D view and every check follow when the mouse is released.
import { freeSpan, wallLength, splitsOf, panesOf, LIMITS, fitWindow, setWindow, setSplit, addBar, removeBar, equalPanes } from '../layout/windows.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cm = (m) => Math.round(m * 100)
const f3 = (v) => +v.toFixed(3)
const q = (v) => Math.round(v / 0.05) * 0.05                  // 5 cm steps
const C = { bg: '#13191b', wall: '#2b3236', wallLine: '#59666b', glass: 'rgba(125,180,207,.2)', frame: '#d4dadc', blue: '#7db4cf', ink: '#e3e9e6', soft: '#8b979b', ghost: '#3a454a' }

// a small front view of a template: the proportions of the window and its bars
function thumb(t) {
  const k = Math.min(50 / t.width, 30 / t.height), w = t.width * k, h = t.height * k, x = (60 - w) / 2, y = (38 - h) / 2
  const bars = (t.splits || Array.from({ length: Math.max(0, t.panes - 1) }, (_, i) => (i + 1) / t.panes)).map((f) => `<line x1="${(x + w * f).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w * f).toFixed(1)}" y2="${(y + h).toFixed(1)}" stroke="#d4dadc" stroke-width="1.2"/>`).join('')
  return `<svg viewBox="0 0 60 38" width="60" height="38" aria-hidden="true"><rect width="60" height="38" fill="#2b3236"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgba(125,180,207,.25)" stroke="#d4dadc" stroke-width="1.6"/>${bars}</svg>`
}

export function mountWindowEditor(host, { plan, edit, drag, remove, close, convert = null, roomName = () => '', templates = null }) {
  let id = null, selBar = null, view = null, live = null, raf = 0
  const op = () => plan.openings.find((o) => o.id === id && o.kind === 'window')
  const ceil = () => plan.ceilingHeight || 2.5

  // the part of the wall that is drawn: the free stretch around the window, never wider than 8 m, fixed while the mouse is down
  function makeView(o) {
    const [lo, hi] = freeSpan(plan, o), L = wallLength(plan.walls.find((w) => w.id === o.wall))
    let x0 = Math.max(0, lo - 0.35), x1 = Math.min(L, hi + 0.35)
    if (x1 - x0 > 8) { x0 = Math.max(x0, o.offset - 4); x1 = Math.min(x1, x0 + 8); x0 = Math.max(0, x1 - 8) }
    return { x0, x1 }
  }

  function svgFor(o) {
    const { x0, x1 } = view, W = x1 - x0, H = ceil(), s = (v) => f3(v - x0), y = (v) => f3(H - v)
    const mL = 0.45, mR = 0.2, mT = 0.2, mB = 0.45, vw = W + mL + mR, vh = H + mT + mB, px = (host.clientWidth || 520) / vw, gr = Math.min(0.1, 7 / px)
    const l = o.offset - o.width / 2, r = o.offset + o.width / 2, b = o.sill, t = o.sill + o.height, bars = splitsOf(o)
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-mL} ${-mT} ${f3(vw)} ${f3(vh)}" style="width:100%;height:auto;display:block;touch-action:none;user-select:none" font-family="IBM Plex Sans, Segoe UI, Arial, sans-serif">`]
    out.push(`<style>.dl{stroke:${C.blue};stroke-width:1.2;fill:none;vector-effect:non-scaling-stroke}.dx{font-family:IBM Plex Mono,Consolas,monospace;font-size:.13px;font-weight:500;fill:${C.blue};text-anchor:middle;paint-order:stroke;stroke:${C.bg};stroke-width:.05px}.px{font-family:IBM Plex Mono,Consolas,monospace;font-size:.11px;fill:${C.soft};text-anchor:middle;pointer-events:none}.cp{font-size:.1px;letter-spacing:.012px;fill:${C.soft};pointer-events:none}.hit{fill:transparent}.gp{fill:${C.bg};stroke:${C.blue};stroke-width:1.6;vector-effect:non-scaling-stroke;pointer-events:none}</style>`)
    out.push(`<rect x="${-mL}" y="${-mT}" width="${f3(vw)}" height="${f3(vh)}" fill="${C.bg}"/>`)
    out.push(`<rect x="0" y="0" width="${f3(W)}" height="${f3(H)}" fill="${C.wall}"/><line x1="0" y1="0" x2="${f3(W)}" y2="0" stroke="${C.wallLine}" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="0" y1="${f3(H)}" x2="${f3(W)}" y2="${f3(H)}" stroke="${C.wallLine}" stroke-width="2" vector-effect="non-scaling-stroke"/>`)
    out.push(`<text class="cp" x="0.05" y="-0.06">CEILING ${cm(H)} CM</text><text class="cp" x="0.05" y="${f3(H + 0.16)}">FLOOR</text>`)
    // what else is in this wall: other windows and doors, for orientation and because they limit the stretch
    for (const q2 of plan.openings) {
      if (q2 === o || q2.wall !== o.wall) continue
      const a = q2.offset - q2.width / 2, z = q2.offset + q2.width / 2; if (z < x0 || a > x1) continue
      const bt = q2.kind === 'window' ? q2.sill : 0, tp = q2.kind === 'window' ? q2.sill + q2.height : q2.height
      out.push(`<rect x="${s(Math.max(a, x0))}" y="${y(tp)}" width="${f3(Math.min(z, x1) - Math.max(a, x0))}" height="${f3(tp - bt)}" fill="none" stroke="${C.ghost}" stroke-width="1.4" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`)
      if (Math.min(z, x1) - Math.max(a, x0) > 0.6) out.push(`<text class="cp" x="${s(Math.max(a, x0) + 0.04)}" y="${f3(+y(tp) + 0.14)}">${q2.kind === 'window' ? 'WINDOW' : 'DOOR'}</text>`)
    }
    // the window: glass, frame, panes
    out.push(`<rect data-g="mv" x="${s(l)}" y="${y(t)}" width="${f3(o.width)}" height="${f3(o.height)}" fill="${C.glass}" stroke="${C.frame}" stroke-width="0.05" style="cursor:move"/>`)
    bars.forEach((f, k) => {
      const bx = l + o.width * f, on = selBar === k
      out.push(`<rect x="${s(bx - 0.02)}" y="${y(t)}" width="0.04" height="${f3(o.height)}" fill="${on ? C.blue : C.frame}" pointer-events="none"/>`)
      out.push(`<rect data-g="bar" data-k="${k}" class="hit" x="${s(bx - 0.09)}" y="${y(t)}" width="0.18" height="${f3(o.height)}" style="cursor:ew-resize"/>`)
      out.push(`<circle class="gp" cx="${s(bx)}" cy="${y((t + b) / 2)}" r="${f3(gr * (on ? 1.05 : 0.75))}" ${on ? `style="fill:${C.blue}"` : ''}/>`)
    })
    const pts = [0, ...bars, 1]
    for (let i = 1; i < pts.length; i++) { const wpx = (pts[i] - pts[i - 1]) * o.width; out.push(`<text class="px" x="${s(l + o.width * (pts[i] + pts[i - 1]) / 2)}" y="${f3(+y(b) - 0.08)}">${cm(wpx)}</text>`) }
    // the four edges (wide invisible targets) with a grip in the middle
    const gx = (l + r) / 2, gy = (t + b) / 2
    out.push(`<rect data-g="l" class="hit" x="${s(l - 0.09)}" y="${y(t)}" width="0.18" height="${f3(o.height)}" style="cursor:ew-resize"/><rect data-g="r" class="hit" x="${s(r - 0.09)}" y="${y(t)}" width="0.18" height="${f3(o.height)}" style="cursor:ew-resize"/>`)
    out.push(`<rect data-g="t" class="hit" x="${s(l)}" y="${f3(+y(t) - 0.09)}" width="${f3(o.width)}" height="0.18" style="cursor:ns-resize"/><rect data-g="b" class="hit" x="${s(l)}" y="${f3(+y(b) - 0.09)}" width="${f3(o.width)}" height="0.18" style="cursor:ns-resize"/>`)
    for (const [cx, cy] of [[l, gy], [r, gy], [gx, t], [gx, b]]) out.push(`<circle class="gp" cx="${s(cx)}" cy="${y(cy)}" r="${f3(gr)}"/>`)
    // dimensions: width above the window, height at its right edge, sill from the floor to the window
    const dy = +y(t) - 0.22
    if (dy > 0.1) out.push(`<line class="dl" x1="${s(l)}" y1="${f3(dy)}" x2="${s(r)}" y2="${f3(dy)}"/><line class="dl" x1="${s(l)}" y1="${f3(dy - 0.05)}" x2="${s(l)}" y2="${f3(dy + 0.05)}"/><line class="dl" x1="${s(r)}" y1="${f3(dy - 0.05)}" x2="${s(r)}" y2="${f3(dy + 0.05)}"/><text class="dx" x="${s(gx)}" y="${f3(dy - 0.07)}">${cm(o.width)}</text>`)
    else out.push(`<text class="dx" x="${s(gx)}" y="${f3(+y(b) + 0.34)}">${cm(o.width)} wide</text>`)
    const hx = -0.16
    out.push(`<line class="dl" x1="${hx}" y1="${y(t)}" x2="${hx}" y2="${y(b)}"/><line class="dl" x1="${hx - 0.05}" y1="${y(t)}" x2="${hx + 0.05}" y2="${y(t)}"/><line class="dl" x1="${hx - 0.05}" y1="${y(b)}" x2="${hx + 0.05}" y2="${y(b)}"/><text class="dx" x="${hx}" y="${f3((+y(t) + +y(b)) / 2)}" transform="rotate(-90 ${hx} ${f3((+y(t) + +y(b)) / 2)}) translate(0 -0.06)">${cm(o.height)}</text>`)
    if (b > 0.05) out.push(`<line class="dl" x1="${hx}" y1="${y(b)}" x2="${hx}" y2="${H}" stroke-dasharray="3 3"/><text class="dx" x="${hx}" y="${f3((+y(b) + H) / 2)}" transform="rotate(-90 ${hx} ${f3((+y(b) + H) / 2)}) translate(0 -0.06)">${cm(b)}</text>`)
    out.push('</svg>')
    return out.join('')
  }

  function render() {
    const o = op(); if (!o) return hide()
    host.hidden = false
    const n = panesOf(o), custom = !!o.splits, maxPanes = Math.max(1, Math.min(LIMITS.maxPanes, Math.floor(o.width / LIMITS.minPane)))
    const field = (k, label, v, min, max) => `<label class="fld"><span>${label}</span><input type="number" data-w="${k}" min="${min}" max="${max}" step="5" value="${cm(v)}"><small>cm</small></label>`
    host.innerHTML = `<div class="figh"><b>Window editor</b><span class="cap">${esc(roomName(o)).toUpperCase()} · ${cm(o.width)} × ${cm(o.height)} CM · ${n} PANE${n > 1 ? 'S' : ''}</span><button class="btn sm" data-x="close" type="button">Close</button></div>
      <div class="we-wrap" id="we-wrap" tabindex="0" aria-label="Window editor: drag the edges to stretch the window"></div>
      <div class="we-ctl"><div class="selfields">${field('width', 'Width', o.width, cm(LIMITS.width[0]), cm(LIMITS.width[1]))}${field('height', 'Height', o.height, cm(LIMITS.height[0]), cm(LIMITS.height[1]))}${field('sill', 'Sill', o.sill, 0, cm(LIMITS.sill[1]))}
        <label class="fld"><span>Panes</span><select data-w="panes">${Array.from({ length: maxPanes }, (_, k) => k + 1).map((p) => `<option ${n === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label></div>
        <div class="selbtns"><button class="btn sm" data-x="add" type="button">Add a bar</button><button class="btn sm" data-x="del-bar" type="button" ${selBar === null ? 'disabled title="Click a bar first"' : ''}>Remove bar</button>${custom ? '<button class="btn sm" data-x="equal" type="button">Equal panes</button>' : ''}${convert ? '<button class="btn sm" data-x="todoor" type="button" title="The plan reader often takes the glazing of a terrace for windows. A glass door reaches the floor and lets people walk out.">Make it a glass door</button>' : ''}<button class="btn sm danger" data-x="remove" type="button">Remove window</button></div></div>
      ${templates ? `<div class="tpl-box"><div class="tpl-head"><b>Window templates</b><span class="tpl-save"><input type="text" id="tpl-name" maxlength="40" placeholder="Name (optional)" aria-label="Template name"><button class="btn sm" data-x="tpl-save" type="button">Save this window as a template</button></span></div>
        <div class="tpl-list">${templates.list().length ? templates.list().map((t) => `<div class="tpl"><span class="tpl-th">${thumb(t)}</span><span class="tpl-nm"><b>${esc(t.name)}</b><small>${cm(t.width)} × ${cm(t.height)} cm · sill ${cm(t.sill)} · ${t.panes} pane${t.panes > 1 ? 's' : ''}</small></span>
          <span class="tpl-bt"><button class="btn sm" data-tpl="use" data-id="${esc(t.id)}" type="button" title="Give this window the template's size and panes">Use here</button><button class="btn sm" data-tpl="add" data-id="${esc(t.id)}" type="button" title="Add a new window with this template to the room you are looking at">Add to room</button><button class="btn sm" data-tpl="del" data-id="${esc(t.id)}" type="button" aria-label="Delete template ${esc(t.name)}">×</button></span></div>`).join('') : '<p class="muted small" style="margin:0">Nothing saved yet. Shape a window, then save it here to use it in other rooms.</p>'}</div></div>` : ''}
      <p class="hint-line we-hint">Drag an edge to stretch it, drag the glass to slide it, drag a bar to move it. Click a bar and press Delete to remove it. Steps of 5 cm. The 3D view updates when you let go.</p>`
    draw()
    host.querySelectorAll('[data-w]').forEach((inp) => inp.addEventListener('change', () => {
      const k = inp.dataset.w, v = Number(inp.value); if (!(v > 0)) return
      edit(() => setWindow(plan, id, { [k]: k === 'panes' ? v : v / 100 }))
    }))
    host.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.tpl, tid = b.dataset.id
      if (a === 'use') return templates.use(tid)
      if (a === 'add') return templates.addTo(tid)
      if (a === 'del') return templates.drop(tid)
    }))
    host.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.x
      if (a === 'tpl-save') return templates.save(host.querySelector('#tpl-name')?.value || '')
      if (a === 'close') return close()
      if (a === 'remove') return remove(id)
      if (a === 'todoor') return convert(id)
      if (a === 'add') return edit(() => { addBar(plan, id); selBar = null })
      if (a === 'del-bar') { const k = selBar; selBar = null; return edit(() => removeBar(plan, id, k)) }
      if (a === 'equal') return edit(() => { equalPanes(plan, id); selBar = null })
    }))
  }
  const wrap = () => host.querySelector('#we-wrap')
  function draw() { const o = op(), w = wrap(); if (!o || !w) return; w.innerHTML = svgFor(o) }
  // the numbers under the picture follow the drag
  function syncFields() {
    const o = op(); if (!o) return
    for (const k of ['width', 'height', 'sill']) { const inp = host.querySelector(`[data-w="${k}"]`); if (inp) inp.value = cm(o[k]) }
    const cap = host.querySelector('.figh .cap'); if (cap) cap.textContent = `${roomName(o).toUpperCase()} · ${cm(o.width)} × ${cm(o.height)} CM · ${panesOf(o)} PANE${panesOf(o) > 1 ? 'S' : ''}`
  }

  // ---- mouse: edges, the glass, the bars
  const model = (e) => {
    const svg = wrap().querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { s: p.x + view.x0, y: ceil() - p.y }
  }
  host.addEventListener('pointerdown', (e) => {
    const g = e.target.closest?.('[data-g]'); const w = wrap(); if (!w || !w.contains(e.target)) return
    const o = op(); if (!o) return
    w.focus({ preventScroll: true })
    if (!g) { if (selBar !== null) { selBar = null; draw(); renderCtl() } return }
    const p = model(e), kind = g.dataset.g, k = kind === 'bar' ? Number(g.dataset.k) : null
    if (kind === 'bar') { selBar = k; renderCtl() } else if (selBar !== null) { selBar = null; renderCtl() }
    live = { kind, k, p, init: { l: o.offset - o.width / 2, r: o.offset + o.width / 2, b: o.sill, t: o.sill + o.height, offset: o.offset, width: o.width, height: o.height, sill: o.sill, splits: o.splits ? [...o.splits] : null, panes: o.panes }, before: drag.begin(), moved: false }
    try { w.setPointerCapture(e.pointerId) } catch { /* the pointer is gone already: moves on the picture still work */ }
    e.preventDefault(); draw()
  })
  host.addEventListener('pointermove', (e) => {
    if (!live) return
    const o = op(); if (!o) return
    const p = model(e), { init, kind } = live, ds = q(p.s - live.p.s), dyy = q(p.y - live.p.y)
    if (!live.moved && Math.abs(p.s - live.p.s) < 0.03 && Math.abs(p.y - live.p.y) < 0.03) return
    live.moved = true
    // every frame starts from the state at the mouse-down, so the clamps never accumulate
    Object.assign(o, { offset: init.offset, width: init.width, height: init.height, sill: init.sill }); if (init.splits) o.splits = [...init.splits]; else delete o.splits; if (init.panes !== undefined) o.panes = init.panes; else delete o.panes
    if (kind === 'l') fitWindow(plan, id, { left: q(p.s) })
    else if (kind === 'r') fitWindow(plan, id, { right: q(p.s) })
    else if (kind === 't') fitWindow(plan, id, { top: q(p.y) })
    else if (kind === 'b') { const v = q(p.y); fitWindow(plan, id, { bottom: Math.abs(v - 0.9) < 0.04 ? 0.9 : v }) }
    else if (kind === 'mv') fitWindow(plan, id, { left: init.l + ds, right: init.r + ds, bottom: init.b + dyy, top: init.t + dyy })
    else if (kind === 'bar') setSplit(plan, id, live.k, (p.s - (o.offset - o.width / 2)) / o.width)
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); syncFields(); drag.live() })
  })
  const up = () => {
    if (!live) return
    const d = live; live = null
    if (raf) { cancelAnimationFrame(raf); raf = 0 }
    if (d.moved) { view = null; drag.end(d.before) } else draw()
  }
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up)
  host.addEventListener('keydown', (e) => {
    if (!wrap()?.contains(e.target) || !op()) return
    if ((e.key === 'Delete' || e.key === 'Backspace') && selBar !== null) { e.preventDefault(); const k = selBar; selBar = null; edit(() => removeBar(plan, id, k)); return }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selBar !== null) {
      e.preventDefault(); const o = op(), step = (e.shiftKey ? 0.2 : 0.05) * (e.key === 'ArrowLeft' ? -1 : 1), cur = splitsOf(o)[selBar]; const k = selBar
      edit(() => setSplit(plan, id, k, cur + step / o.width)); selBar = k
    }
  })
  // re-draw only the buttons/fields part when the selected bar changes
  function renderCtl() { const btn = host.querySelector('[data-x="del-bar"]'); if (btn) { btn.disabled = selBar === null; if (selBar === null) btn.title = 'Click a bar first'; else btn.removeAttribute('title') } }

  function show(next) {
    if (next !== id) { id = next; selBar = null; view = null }
    const o = op(); if (!o) return hide()
    if (!view) { host.hidden = false; view = makeView(o) }
    if (live) return
    render()
  }
  function hide() { if (id === null) return; id = null; selBar = null; view = null; live = null; host.hidden = true; host.innerHTML = '' }
  return { show, hide, destroy() { cancelAnimationFrame(raf); hide() } }
}
