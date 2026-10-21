// The public showcase (app/showcase.html): the same layout engine and 3D view as the product, with nothing to sign in to, nothing to upload and nothing that costs money. A visitor picks one of six ready-made
import { planSvg } from '../layout/plansvg.js'
import { furnitureSymbols } from './furnsymbols.js'
import { buildSpace } from '../layout/space.js'
// floor plans and adds furniture from a short list of IKEA pieces whose 3D models were made ahead of time with the product's own link-to-model method. The words of this screen come in three languages
// (?lang=en|lt|de); the texts the layout engine writes about the plan (checks, pros and cons) are English.
import { drawModelViews } from './modelshot.js'
import { MODELS, modelKeyOf } from '../layout/models.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
import { LANG, LANGS, PLANS, translatePlan, TX, EXTRA } from './showcase-text.js'
export { LANG, LANGS, PLANS, translatePlan, TX }
export const BOOK_URL = 'https://cal.com/swiftrix/30-minute-call'

// ---- the choice of the plan, above the room
let origOpen = true          // the original 2D plan stays open or shut while the visitor switches plans
// the plan drawn the way an architect hands it over: white paper, thin black walls, furniture as outlines, room names and measurements
const DRAWING_CSS = `.rl{fill:#fff!important;fill-opacity:1!important;stroke:#111!important;stroke-width:.02!important}.fl,.fo{fill:#fff!important}.wl{fill:#fff!important;stroke:#111!important;stroke-width:.022!important}.win{stroke:#111!important;stroke-width:.05!important;opacity:1!important}.wt{stroke:#111!important}.dr,.dra{stroke:#111!important;stroke-width:1.2px!important;fill:none!important;stroke-dasharray:none!important}.dop{stroke:#111!important;opacity:.7!important}.pc rect,.pc circle{fill:#fff!important;stroke:#333!important;stroke-width:.014!important}.pc line{stroke:#999!important;stroke-width:.01!important}.lbl{fill:#666!important;font-weight:400!important;font-size:.11px!important;stroke:none!important;paint-order:normal!important}.rn{fill:#111!important;fill-opacity:1!important;stroke:none!important;font-size:.2px!important;font-weight:400!important;letter-spacing:0!important}.dm{stroke:#111!important;stroke-width:.012!important}.dn>line:first-child{stroke:#fff!important}.dt{fill:#111!important;font-size:.2px!important;stroke:none!important}`
const drawing = (plan, items) => {
  try {
    const svg = planSvg(plan, [], { space: buildSpace(plan), theme: 'light', dims: true, labels: true, zones: 'none' }).replace(/<style>/, '<style>' + DRAWING_CSS), at = svg.indexOf('<text class="rn')
    const sym = furnitureSymbols(items)          // the furniture as plan symbols, under the room names
    return at < 0 ? svg.replace('</svg>', sym + '</svg>') : svg.slice(0, at) + sym + svg.slice(at)
  } catch { return '' }
}
export function mountPlanBar(host, currentId, onPick, { empty = false, onMode = null, plan = null } = {}) {
  host.innerHTML = `<div class="sc-plans" role="group" aria-label="${esc(TX.pickPlan)}">${PLANS.map((p) => `<button type="button" class="sc-plan ${p.id === currentId ? 'on' : ''}" data-plan="${p.id}" aria-pressed="${p.id === currentId}"><b>${esc(p.t[LANG][0])}</b><span class="sc-area">${p.area} m²</span><span class="sc-pd">${esc(p.t[LANG][1])}</span></button>`).join('')}</div>
    ${onMode ? `<div class="sc-modes" role="group"><button type="button" class="chipx ${empty ? '' : 'on'}" data-mode="full">${esc(TX.modeFurnished)}</button><button type="button" class="chipx ${empty ? 'on' : ''}" data-mode="empty">${esc(TX.modeEmpty)}</button>${empty ? `<span class="sc-modehint">${esc(TX.modeHint)}</span>` : ''}</div>` : ''}
    ${plan ? `<details class="sc-orig" ${origOpen ? 'open' : ''}><summary>${esc(TX.orig)}</summary><div class="sc-origimg"><img alt="${esc(TX.orig)}"></div></details>` : ''}`
  host.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => onPick(b.dataset.plan)))
  host.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { if ((b.dataset.mode === 'empty') !== empty) onMode(b.dataset.mode === 'empty') }))
  host.querySelector('.sc-orig')?.addEventListener('toggle', (e) => { origOpen = e.target.open })
  const img = host.querySelector('.sc-origimg img')
  return { update: (items) => { if (img && plan) img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawing(plan, items || [])) } }          // the drawing follows the arrangement that is shown
}

// ---- the furniture: a card per piece, a model picture drawn from our own 3D model, a link to the shop
let catalog = null
const loadCatalog = () => (catalog ||= fetch('./data/showcase/furniture.json').then((r) => r.json()).then((c) => { if (EXTRA?.furn) for (const x of c) x.desc[LANG] = EXTRA.furn[x.id] || x.desc.en; return c }))
const cmText = (d) => [d.w, d.d, d.h].map((v) => Math.round(v * 100)).join(' × ') + ' ' + TX.cm
const newId = (() => { let n = 0; return (k) => `sc-${k}-${Date.now().toString(36)}${n++}` })()

export function mountShowcaseFurniture(host, api) {
  let filter = 'all', msg = '', roomSel = null, items = []
  host.classList.add('sc-furn')
  host.innerHTML = `<div class="sc-note"><p>${esc(TX.intro)}</p><a class="btn sm" href="${BOOK_URL}" target="_blank" rel="noopener">${esc(TX.book)}</a></div>
    <div class="sc-bar"><label class="sc-room">${esc(TX.room)} <select id="sc-room"></select></label><div class="chipbar" id="sc-filter"></div><button class="btn sm" id="sc-clear" type="button">${esc(TX.reset)}</button></div>
    <p class="sc-msg" id="sc-msg" role="status"></p><div class="sc-added" id="sc-added"></div><div class="sc-grid" id="sc-grid"></div>`
  const $ = (s) => host.querySelector(s), thumbs = new Map()

  const rooms = () => api.rooms()
  const drawRooms = () => {
    const sel = $('#sc-room'), list = rooms(), cur = roomSel ?? list.find((r) => r.i === api.focusRoom())?.id ?? list[0]?.id
    roomSel = list.some((r) => r.id === cur) ? cur : list[0]?.id
    sel.innerHTML = list.map((r) => `<option value="${esc(r.id)}" ${r.id === roomSel ? 'selected' : ''}>${esc(r.name)}</option>`).join('')
    sel.onchange = () => { roomSel = sel.value; drawGrid() }
  }
  const drawFilter = () => {
    $('#sc-filter').innerHTML = [['all', TX.all], ['home', TX.home], ['office', TX.office]].map(([k, t]) => `<button class="chipx ${filter === k ? 'on' : ''}" data-f="${k}" type="button">${esc(t)}</button>`).join('')
    host.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; drawFilter(); drawGrid() }))
  }
  const say = (t, bad = false) => { msg = t; const m = $('#sc-msg'); m.textContent = t; m.classList.toggle('bad', bad) }
  const roomName = (id) => rooms().find((r) => r.id === id)?.name || ''

  function drawAdded() {
    const list = api.list()
    $('#sc-added').innerHTML = list.length ? `<h3>${esc(TX.added)} (${list.length})</h3><ul>${list.map((p) => `<li><span><b>${esc(p.name)}</b> <span class="muted small">${esc(roomName(p.roomId))}</span></span><span class="sc-acts"><button class="btn sm" data-show="${esc(p.id)}" type="button">${esc(TX.show)}</button><button class="btn sm" data-rm="${esc(p.id)}" type="button">${esc(TX.remove)}</button></span></li>`).join('')}</ul>` : `<p class="muted small">${esc(TX.none)}</p>`
    host.querySelectorAll('[data-show]').forEach((b) => b.addEventListener('click', () => api.show(api.list().find((p) => p.id === b.dataset.show))))
    host.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', async () => { await api.remove(b.dataset.rm); say(''); refresh() }))
  }
  function drawGrid() {
    loadCatalog().then((cat) => {
      const shown = cat.filter((c) => filter === 'all' || c.use.includes(filter)), onList = new Set(api.list().map((p) => p.catId))
      $('#sc-grid').innerHTML = shown.map((c) => `<article class="sc-card ${onList.has(c.id) ? 'in' : ''}"><div class="sc-pic"><img data-pic="${esc(c.id)}" alt="" ${thumbs.has(c.id) ? `src="${thumbs.get(c.id)}"` : 'hidden'}></div>
        <div class="sc-body"><h3>${esc(c.name)}</h3><p class="sc-dims">${esc(cmText(c.dims))}</p><p class="sc-desc">${esc(c.desc[LANG])}</p>
        <div class="sc-row"><button class="btn primary sm" data-add="${esc(c.id)}" type="button">${esc(TX.add)}</button><a class="sc-link" href="${esc(c.link)}" target="_blank" rel="noopener">${esc(TX.ikea)} ↗</a></div></div></article>`).join('')
      host.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => addPiece(cat.find((c) => c.id === b.dataset.add))))
      drawThumbs(shown)
    })
  }
  // one picture per piece, drawn from its 3D model: one at a time, so the page stays smooth
  let drawing = Promise.resolve()
  function drawThumbs(shown) {
    for (const c of shown) {
      if (thumbs.has(c.id)) continue
      drawing = drawing.then(() => new Promise((res) => setTimeout(() => {
        try {
          const m = MODELS.get(modelKeyOf(c.link)); if (!m) return res()
          const url = drawModelViews(document.createElement('canvas'), m, { width: 480, height: 360, mime: 'image/jpeg', quality: 0.85, only: 'three-quarter' })
          thumbs.set(c.id, url); const im = host.querySelector(`img[data-pic="${c.id}"]`); if (im) { im.src = url; im.hidden = false }
        } catch { /* the card stays without a picture */ }
        res()
      }, 0)))
    }
  }
  async function addPiece(c) {
    if (!roomSel) return
    const i = rooms().find((r) => r.id === roomSel)?.i, replace = ['bed', 'tv_unit', 'sofa', 'dining_table', 'wardrobe'].includes(c.type) && api.hasType(i, c.type)
    const p = { id: newId(c.id), catId: c.id, link: c.link, host: 'ikea.com', name: c.name.split(',')[0], fullName: c.name, brand: 'IKEA', image: '', type: c.type, dims: { ...c.dims }, mode: replace ? 'replace' : 'extra', roomId: roomSel }
    say('')
    let r = await api.add(p)
    if ((!r || !r.ok) && p.mode === 'replace') r = await api.add({ ...p, mode: 'extra' })          // the room cannot be arranged around it instead of its own piece: try it as an extra piece
    if (!r || !r.ok) say(r?.message || TX.limit, true)
    else {
      say(r.message || '')
      const added = api.list().find((q) => q.id === p.id), btn = document.createElement('button')          // straight to the result: the plan and the 3D view of the room with the new piece
      btn.type = 'button'; btn.className = 'btn sm'; btn.textContent = TX.view; btn.style.marginLeft = '10px'; btn.onclick = () => added && api.show(added)
      $('#sc-msg').append(btn)
    }
    refresh()
  }
  $('#sc-clear').onclick = async () => { for (const p of [...api.list()]) await api.remove(p.id); say(''); refresh() }
  function refresh() { drawRooms(); drawAdded(); drawGrid() }
  drawFilter(); refresh()
  return { refresh }
}

// inside the page of the website (an iframe of the same site): tell it how tall this page is, so the page scrolls as one
if (window.parent !== window) {
  const post = () => parent.postMessage({ swx3dHeight: document.body.getBoundingClientRect().height + 8 }, location.origin)
  new ResizeObserver(post).observe(document.body); addEventListener('load', post)
}
