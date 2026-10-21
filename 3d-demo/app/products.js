// "Furniture from links": paste the link of a piece in a shop, the server reads the page (IKEA and most shops give the real measurements), the person checks the numbers,
// chooses the room and whether the piece replaces the one the room has or is added to it. The layout engine then fits the room around the exact size.
import { PRODUCT_TYPES, sizeOk, isProductType, SIZE_LIMITS, withModelSize } from '../layout/products.js'
import { labelOf } from '../layout/catalog.js'
import { dominantColours, reconcile } from '../lib/colours.js'
import { MODELS, modelKeyOf } from '../layout/models.js'
import { autoStatus, makeModel } from './automodel.js'
import { apiFetch, SUPABASE } from './apiclient.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cmText = (m) => (Number.isFinite(m) ? String(Math.round(m * 1000) / 10) : '')
const hexOf = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6)
const newId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)
// a room has one of these: a second one is not an extra piece, it is a replacement
const ONLY_ONE = new Set(['tv_unit', 'bed'])
const STATUS = { ok: ['ok', 'All three sizes were read from the page'], check: ['check', 'Check these sizes against the page'], missing: ['miss', 'The page does not show its sizes: type them'] }
// shop names are long ("MALM Bed frame, high - white/Luröy Standard Double"): the piece is called by the part before the first comma or dash
const shortName = (n) => { const t = String(n || '').split(/\s+[-–]\s+|,\s/)[0].trim(); return t.length >= 3 ? t : String(n || '').trim() }
const priceText = (p) => (p ? `${p.amount.toFixed(2).replace(/\.00$/, '')} ${p.currency === 'EUR' ? '€' : p.currency || ''}`.trim() : '')

export function mountProducts(host, api) {
  let card = null, busy = false, error = ''
  host.classList.add('pf')
  host.innerHTML = `<p class="section-sub" style="margin-top:0">Paste the link of a piece of furniture from IKEA or another shop. We read the page for its real width, depth and height, and fit the room around that exact size, with its clear space kept and the walking routes open.</p>
    <form class="pf-form" id="pf-form"><input type="url" id="pf-link" placeholder="https://www.ikea.com/gb/en/p/billy-bookcase-white-00263850/" aria-label="Product link" required><button class="btn primary" id="pf-read" type="submit">Read the page</button><button class="btn" id="pf-manual" type="button">Type the sizes myself</button></form>
    <div id="pf-msg"></div><div id="pf-card"></div><p class="muted small" id="pf-count"></p><p class="muted small" id="pf-hint" hidden>To put a piece where you want it: press "Show in the plan", then drag it in the floor plan (R turns it, the arrow keys nudge it by 1 cm, Alt while dragging stops it sticking to walls).</p><div class="pf-list" id="pf-list"></div>`
  const $ = (s) => host.querySelector(s)
  // automatic 3D models (a vision model writes the model from the pictures; paid, so the server may have it switched off): the status of the server, what is being made, what went wrong
  // With the server's spending on, a model is made by itself: when a link is read, when a piece is added, and for stored pieces that have none; one piece at a time, each tried once per visit.
  let autoInfo = { enabled: false }; const working = new Map(), failed = new Map(), tried = new Set(); let chain = Promise.resolve()
  const statusReady = autoStatus().then((s) => { autoInfo = s; drawModelNote(); drawList(); autoMakeAll() })
  const centsOf = (usd) => (usd < 0.001 ? 'less than 0.1 cent' : `${(usd * 100).toFixed(usd < 0.1 ? 1 : 0)} cents`)          // what a model cost, as it is shown
  const cents = () => { const u = autoInfo.estimate?.perPieceUsd; return u == null ? '' : u < 0.015 ? 'about 1 cent' : `about ${Math.round(u * 100)} cents` }
  const makeBtn = (link, label) => `<button class="btn sm" data-make="${esc(link)}" type="button">${label}</button>`
  const canMake = (link) => autoInfo.enabled && /^https?:\/\//i.test(link || '') && !MODELS.has(modelKeyOf(link))
  const sized = (p) => sizeOk(p?.dims)          // a model needs the three sizes: the card waits until they are there
  // asks for a model of this link unless it has one, is being made, or was tried already in this visit (force: the person pressed the button)
  function enqueue(link, force = false) {
    const key = modelKeyOf(link); if (!key || working.has(key) || MODELS.has(key) || !canMake(link)) return
    if (!force && (tried.has(key) || failed.has(key))) return
    tried.add(key); failed.delete(key); working.set(key, 'Waiting for its turn'); drawModelNote(); drawList()
    chain = chain.then(() => generate(link))
  }
  const autoMake = (link, p = null) => statusReady.then(() => { if (!p || sized(p)) enqueue(link) })
  const autoMakeAll = () => { if (autoInfo.enabled) for (const p of api.list()) if (sized(p)) enqueue(p.link) }
  async function generate(link) {
    const key = modelKeyOf(link)
    working.set(key, 'Starting'); drawModelNote(); drawList()
    const r = await makeModel(link, { onStage: (s) => { working.set(key, s); drawModelNote(); drawList() }, onModel: () => api.modelsChanged?.() })
    working.delete(key)
    if (r.exists) await api.reloadModels?.()
    else if (!r.ok) { failed.set(key, r.message); api.toast(r.message) }
    else api.toast((r.refined ? '3D model made and checked against the pictures' : '3D model made from the pictures') + (Number.isFinite(r.costUsd) ? `. It cost ${centsOf(r.costUsd)}.` : ''))
    autoStatus().then((s) => { autoInfo = s; drawModelNote(); drawList() })
    api.modelsChanged?.()
  }
  host.addEventListener('click', (e) => { const b = e.target.closest?.('[data-make]'); if (b) enqueue(b.dataset.make, true) })

  const rooms = () => api.rooms()
  const typeLabel = (t) => (t === 'product' ? 'other piece' : labelOf(t).toLowerCase())
  // the room that suits a product best: the room in focus if it has a piece of that type, else the first room that has one, else the focus room, else the first
  const defaultRoom = (type) => {
    const rs = rooms(), focus = api.focusRoom(), has = (r) => api.hasType(r.i, type)
    return (rs.find((r) => r.i === focus && has(r)) || rs.find(has) || rs.find((r) => r.i === focus) || rs[0])?.id || ''
  }
  const canReplace = () => Boolean(card && card.roomId && card.type !== 'product' && api.hasType(rooms().find((r) => r.id === card.roomId)?.i, card.type))

  function fromApi(p, link) {
    const finish = p.finish?.hex ?? null
    return { link, host: p.host, name: shortName(p.name), fullName: p.name || '', brand: p.brand || '', image: p.images?.[0] || '', price: p.price, type: isProductType(p.type) ? p.type : 'product', status: p.status, evidence: p.evidence || '', notes: p.notes || [], source: p.source || '',
      dims: { w: p.dims?.w ?? null, d: p.dims?.d ?? null, h: p.dims?.h ?? null }, finish, finish2: null, finishWord: p.finish?.word || '', useColour: finish !== null, mode: 'replace', roomId: '' }
  }
  const blank = () => ({ link: '', host: '', name: '', brand: '', image: '', price: null, type: 'sofa', status: 'missing', evidence: '', notes: [], source: '', dims: { w: null, d: null, h: null }, finish: null, finish2: null, finishWord: '', useColour: false, mode: 'replace', roomId: '', manual: true })

  function open(c) {
    card = c; card.roomId = defaultRoom(card.type); card.mode = canReplace() ? 'replace' : 'extra'; error = ''
    drawCard(); $('#pf-card').scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); sampleColours(card)
    if (card.link) autoMake(card.link, card)          // the model is made while the person checks the numbers
  }

  async function read(link) {
    error = ''; $('#pf-msg').innerHTML = ''; card = null; drawCard()
    $('#pf-read').disabled = true; $('#pf-read').textContent = 'Reading the page...'
    try {
      const res = await apiFetch('/api/product', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ link }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.product) { $('#pf-msg').innerHTML = `<p class="err-box">${esc(j.message || 'The page could not be read.')} <button class="btn sm" id="pf-typeit" type="button">Type the sizes myself</button></p>`; $('#pf-typeit').onclick = () => { $('#pf-msg').innerHTML = ''; open({ ...blank(), link, host: (() => { try { return new URL(link).hostname.replace(/^www\./, '') } catch { return '' } })() }) }; return }
      open(fromApi(j.product, link))
    } catch { $('#pf-msg').innerHTML = '<p class="err-box">The server could not be reached. Is the prototype server running?</p>' }
    finally { $('#pf-read').disabled = false; $('#pf-read').textContent = 'Read the page' }
  }

  function drawCard() {
    const el = $('#pf-card')
    if (!card) { el.innerHTML = ''; return }
    const [cls, say] = STATUS[card.status] || STATUS.missing, c = card
    el.innerHTML = `<div class="pf-card">
      <div class="pf-top">${c.image ? `<img class="pf-img" src="${esc(c.image)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : '<div class="pf-img none"></div>'}
        <div class="pf-title"><input class="pf-name" data-k="name" type="text" value="${esc(c.name)}" placeholder="Name of the piece" aria-label="Name of the piece">
          <small>${[c.brand, c.host, priceText(c.price)].filter(Boolean).map(esc).join(' · ') || 'Typed by you'}</small>
          <span class="pf-st ${cls}">${esc(c.manual ? 'Typed by you' : say)}</span></div></div>
      ${c.evidence ? `<p class="pf-evid">From the page: ${esc(c.evidence)}${c.source && c.source !== 'the measurements on the page' ? ` (${esc(c.source)})` : ''}</p>` : ''}
      <p class="pf-model" id="pf-modelnote"></p>
      ${c.notes.length ? `<ul class="pf-notes">${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <div class="pf-grid">
        <label class="pf-f wide"><span>This is a</span><select data-k="type">${PRODUCT_TYPES.map((t) => `<option value="${t.type}" ${t.type === c.type ? 'selected' : ''}>${esc(t.type === 'product' ? 'Other piece' : t.label)}</option>`).join('')}</select></label>
        ${['w', 'd', 'h'].map((k) => `<label class="pf-f"><span>${{ w: 'Width', d: 'Depth', h: 'Height' }[k]}</span><span class="pf-num"><input type="number" data-k="${k}" min="${SIZE_LIMITS.min * 100}" max="${SIZE_LIMITS.max * 100}" step="0.5" value="${cmText(c.dims[k])}" placeholder="cm"><small>cm</small></span></label>`).join('')}
        <div class="pf-f wide pf-colour" id="pf-colours"></div>
      </div>
      <p class="muted small pf-hint">Width is the side you look at, depth goes from front to back, height is from the floor to the top. Change a number if the page says something else.</p>
      <div id="pf-where"></div>
      <div class="pf-actions"><button class="btn primary" id="pf-use" type="button"></button><button class="btn" id="pf-cancel" type="button">Cancel</button></div>
      <div id="pf-err"></div></div>`
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', () => change(inp)))
    drawColours(); drawModelNote()
    $('#pf-cancel').onclick = () => { card = null; drawCard() }
    $('#pf-use').onclick = use
    drawWhere()
  }

  // does this link have a 3D model made from the pictures of its page (app/data/models)?
  function drawModelNote() {
    const el = $('#pf-modelnote'); if (!el || !card?.link) { if (el) el.textContent = ''; return }
    const key = modelKeyOf(card.link), m = MODELS.get(key), busy = working.get(key), bad = failed.get(key)
    el.className = 'pf-model' + (m ? ' ok' : '')
    if (busy) { el.innerHTML = `<span class="pf-busy">Making a 3D model from the pictures: ${esc(busy.toLowerCase())}...</span> <small>(about a minute; the piece is drawn in the shape of its type until it is done)</small>`; return }
    if (m) { el.textContent = m.meta?.generated ? `3D model made automatically from the pictures of this page${m.meta.quality === 'refined' ? ' and checked against them' : ' (first draft)'}, at the real size.${Number.isFinite(m.meta.costUsd) ? ` It cost ${centsOf(m.meta.costUsd)}.` : ''}` : '3D model made from the pictures of this page, at the real size.'; return }
    const base = 'No 3D model made from the pictures of this page yet: the piece is drawn in the shape of its type, at the real size.'
    el.innerHTML = canMake(card.link) ? `${esc(base)} ${makeBtn(card.link, bad ? 'Try again' : 'Make a 3D model from the pictures')} <small>takes about a minute, ${esc(cents() || 'uses the Claude API')}</small>${bad ? `<br><span class="pf-bad">${esc(bad)}</span>` : ''}` : esc(base + ' It is put on the list of models to make.')
  }
  // the colours of the piece: the main colour and the colour of legs and details, read from the product picture (through the server, which passes the picture on)
  function drawColours() {
    const el = $('#pf-colours'); if (!el || !card) return
    const c = card, on = c.useColour
    el.innerHTML = `<span>Colours in 3D</span><span class="pf-sw"><label><input type="checkbox" data-k="useColour" ${on ? 'checked' : ''}> use them</label>
      <label class="pf-swatch"><input type="color" data-k="colour" value="${hexOf(c.finish ?? 0xcccccc)}" ${on ? '' : 'disabled'}> main</label>
      <label class="pf-swatch"><input type="color" data-k="colour2" value="${hexOf(c.finish2 ?? 0x2a2b30)}" ${on ? '' : 'disabled'}> second colour (top, legs, details)</label>
      <small>${c.fromPhoto ? 'read from the picture' : c.finishWord ? `from the name: ${esc(c.finishWord)}` : c.sampling ? 'reading the picture...' : 'optional'}</small></span>`
    el.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', () => change(inp)))
  }
  async function sampleColours(c) {
    if (!c.image || SUPABASE) return          // (a picture from a shop is passed on by the server; the Supabase version has no such pass-through)
    c.sampling = true; drawColours()
    try {
      const img = new Image()
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = '/api/image?u=' + encodeURIComponent(c.image) })
      const k = Math.min(1, 96 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(8, Math.round(img.naturalWidth * k)), h = Math.max(8, Math.round(img.naturalHeight * k))
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h)
      const { main, second } = reconcile(dominantColours(g.getImageData(0, 0, w, h).data, w, h), Number.isFinite(c.finish) ? c.finish : null)          // (a white piece on a white picture: the colour of the name, the oak top from the picture)
      if (main !== null && !c.touchedColour) { c.finish = main; c.finish2 = second; c.useColour = true; c.fromPhoto = true }
    } catch { /* the colour named on the page stays */ }
    c.sampling = false
    if (card === c) drawColours()          // only this part of the card is drawn again: what was typed stays
  }

  function change(inp) {
    const k = inp.dataset.k
    if (k === 'name') card.name = inp.value
    else if (k === 'w' || k === 'd' || k === 'h') { const v = Number(inp.value); card.dims[k] = inp.value !== '' && Number.isFinite(v) ? Math.round(v * 10) / 1000 : null }
    else if (k === 'type') { card.type = inp.value; card.roomId = defaultRoom(card.type); card.mode = canReplace() ? 'replace' : 'extra'; drawWhere() }
    else if (k === 'useColour') { card.useColour = inp.checked; if (inp.checked && !Number.isFinite(card.finish)) card.finish = parseInt($('#pf-card').querySelector('[data-k="colour"]').value.slice(1), 16); drawColours() }
    else if (k === 'colour') { card.finish = parseInt(inp.value.slice(1), 16); card.touchedColour = true; card.fromPhoto = false }
    else if (k === 'colour2') { card.finish2 = parseInt(inp.value.slice(1), 16); card.touchedColour = true }
    else if (k === 'room') { card.roomId = inp.value; if (card.mode === 'replace' && !canReplace()) card.mode = 'extra'; drawWhere() }
    else if (k === 'mode') { card.mode = inp.value; drawWhere() }
  }

  function drawWhere() {
    const w = $('#pf-where'); if (!w || !card) return
    const rs = rooms(), room = rs.find((r) => r.id === card.roomId), can = canReplace(), t = typeLabel(card.type)
    w.innerHTML = `<div class="pf-where"><label class="pf-f"><span>Put it in</span><select data-k="room">${rs.map((r) => `<option value="${esc(r.id)}" ${r.id === card.roomId ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></label>
      <div class="pf-modes" role="radiogroup" aria-label="How to use it">
        <label class="pf-mode ${can ? '' : 'off'}"><input type="radio" name="pf-mode" data-k="mode" value="replace" ${card.mode === 'replace' ? 'checked' : ''} ${can ? '' : 'disabled'}><span><b>Instead of the ${esc(t)}</b><small>${can ? `The room is arranged again around this exact ${esc(t)}.` : room ? `${esc(room.name)} has no ${esc(t)} in this arrangement.` : 'Pick a room.'}</small></span></label>
        <label class="pf-mode"><input type="radio" name="pf-mode" data-k="mode" value="extra" ${card.mode === 'extra' ? 'checked' : ''}><span><b>As an extra piece</b><small>${can && ONLY_ONE.has(card.type) ? `The room already has a ${esc(t)}, and one is enough: two would confuse the measurements. Use the other choice.` : 'Added to what the room already has, at a spot the engine finds.'}</small></span></label>
        <label class="pf-mode"><input type="radio" name="pf-mode" data-k="mode" value="click" ${card.mode === 'click' ? 'checked' : ''}><span><b>Where I click on the plan</b><small>You choose the exact spot on the floor plan: a ghost of the piece at its true size follows the pointer and shows green where it fits.</small></span></label></div></div>`
    w.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('change', () => change(inp)))
    const s = api.slots(), free = s.used < s.paid
    $('#pf-use').textContent = card.mode === 'click' ? 'Choose the spot on the plan' + (free ? '' : ' (1 token)') : free ? 'Use it in my room' : 'Use it in my room (1 token)'
  }

  async function use() {
    const c = card, err = $('#pf-err'); err.innerHTML = ''
    const fail = (m) => { err.innerHTML = `<p class="err-box">${esc(m)}</p>` }
    if (!sizeOk(c.dims)) return fail(`Enter the width, depth and height, between ${SIZE_LIMITS.min * 100} and ${SIZE_LIMITS.max * 100} cm.`)
    if (!c.roomId) return fail('Pick a room.')
    const btn = $('#pf-use'); btn.disabled = true
    let at = null
    if (c.mode === 'click') {          // the person points at the spot on the floor plan first
      btn.textContent = 'Click the spot on the plan...'
      at = await api.pick({ type: c.type, dims: { ...c.dims }, name: c.name.trim() || c.fullName || labelOf(c.type), roomId: c.roomId })
      if (!at) { btn.disabled = false; drawWhere(); return }          // cancelled: the card stays as it was
    }
    btn.textContent = 'Fitting it into the room...'
    await new Promise((r) => setTimeout(r, 30))
    try {
      const res = await api.add({ ...(at ? { at } : {}), id: newId(), link: c.link, host: c.host, name: c.name.trim() || c.fullName || (c.type === 'product' ? 'Other piece' : labelOf(c.type)), fullName: c.fullName || c.name.trim(), brand: c.brand, image: c.image, price: c.price, type: c.type, dims: { ...c.dims }, finish: c.useColour && Number.isFinite(c.finish) ? c.finish : null, finish2: c.useColour && Number.isFinite(c.finish2) ? c.finish2 : null, mode: at ? 'extra' : canReplace() && c.mode === 'replace' ? 'replace' : 'extra', roomId: c.roomId })
      if (!res.ok) { if (res.message) fail(res.message); return }
      if (c.link && !MODELS.has(modelKeyOf(c.link))) fetch('/api/model-request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: modelKeyOf(c.link), link: c.link, name: c.fullName || c.name, type: c.type, dims: c.dims, image: c.image }) }).catch(() => {})          // so the model can be made from its pictures later
      if (c.link) autoMake(c.link)
      card = null; drawCard(); api.toast(res.message || 'Placed in your room'); drawList()
    } finally { btn.disabled = false; if (card) drawWhere() }
  }

  function drawList() {
    const list = api.list(), s = api.slots()
    $('#pf-count').textContent = `${list.length} of ${s.max} pieces. ${Math.max(0, s.paid - list.length)} free place${s.paid - list.length === 1 ? '' : 's'} left; each piece beyond that costs 1 token (removing a piece keeps its place).`
    $('#pf-hint').hidden = !list.length
    $('#pf-list').innerHTML = list.map((p) => {
      const room = rooms().find((r) => r.id === p.roomId), placed = api.placed(p.id)
      return `<div class="pf-item">${p.image ? `<img class="pf-th" src="${esc(p.image)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : '<div class="pf-th none"></div>'}
        <div><b>${esc(p.fullName || p.name)}</b>${failed.has(modelKeyOf(p.link)) ? `<small class="pf-bad">The 3D model could not be made: ${esc(failed.get(modelKeyOf(p.link)))}</small>` : ''}<small>${esc([Math.round(p.dims.w * 100), Math.round(p.dims.d * 100), Math.round(p.dims.h * 100)].join(' × '))} cm · ${esc(typeLabel(p.type))} · ${esc(room?.name || 'a room that is gone')} · ${p.mode === 'replace' ? 'instead of the room\'s own' : 'extra piece'}${/^https?:\/\//.test(p.link || '') ? ` · <a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">${esc(p.host || 'the page')}</a>` : ''}</small></div>
        <span>${working.has(modelKeyOf(p.link)) ? `<span class="chip">${esc(working.get(modelKeyOf(p.link)))}...</span>` : canMake(p.link) ? makeBtn(p.link, 'Make 3D model') : ''} ${placed ? '<span class="chip ok">In this arrangement</span>' : '<span class="chip warn">Not in this arrangement</span>'} ${placed ? `<button class="btn sm" data-show="${esc(p.id)}" type="button">Show in the plan</button>` : ''} <button class="btn sm danger" data-rm="${esc(p.id)}" type="button">Remove</button></span></div>`
    }).join('') || '<p class="muted">No pieces yet.</p>'
    host.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => api.show(list.find((x) => x.id === b.dataset.show))))
    host.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', async () => { b.disabled = true; await new Promise((r) => setTimeout(r, 30)); await api.remove(b.dataset.rm); drawList() }))
  }

  $('#pf-form').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#pf-link').value.trim(); if (v) read(v) })
  $('#pf-manual').onclick = () => { $('#pf-msg').innerHTML = ''; open(blank()) }
  drawList()
  return { refresh() { drawList(); autoMakeAll(); if (card?.link) { const fixed = withModelSize(card, MODELS.get(modelKeyOf(card.link))); if (fixed !== card) { card.dims = fixed.dims; drawCard() } } if (card) { drawModelNote(); card.roomId = rooms().some((r) => r.id === card.roomId) ? card.roomId : defaultRoom(card.type); drawWhere() } } }
}
