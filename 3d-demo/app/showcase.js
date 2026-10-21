// The public showcase (app/showcase.html): the same layout engine and 3D view as the product, with nothing to sign in to, nothing to upload and nothing that costs money. A visitor picks one of six ready-made
import { planSvg } from '../layout/plansvg.js'
import { furnitureSymbols } from './furnsymbols.js'
import { buildSpace } from '../layout/space.js'
// floor plans and adds furniture from a short list of IKEA pieces whose 3D models were made ahead of time with the product's own link-to-model method. The words of this screen come in three languages
// (?lang=en|lt|de); the texts the layout engine writes about the plan (checks, pros and cons) are English.
import { drawModelViews } from './modelshot.js'
import { MODELS, modelKeyOf } from '../layout/models.js'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const LANG = (() => { const l = new URLSearchParams(location.search).get('lang'); return ['en', 'lt', 'de'].includes(l) ? l : 'en' })()
export const BOOK_URL = 'https://cal.com/swiftrix/30-minute-call'

export const PLANS = [
  { id: 'studio', area: 44, t: { en: ['Studio', 'One person or a couple: a living room, a bedroom, a kitchen and a bathroom.'], lt: ['Studija', 'Vienam žmogui ar porai: svetainė, miegamasis, virtuvė ir vonios kambarys.'], de: ['Studio', 'Für eine Person oder ein Paar: Wohnzimmer, Schlafzimmer, Küche und Bad.'] } },
  { id: 'small', area: 54, t: { en: ['Small apartment', 'Two bedrooms in 54 m²: a young family or a rental.'], lt: ['Mažas butas', 'Du miegamieji 54 m²: jaunai šeimai ar nuomai.'], de: ['Kleine Wohnung', 'Zwei Schlafzimmer auf 54 m²: junge Familie oder Vermietung.'] } },
  { id: 'family', area: 103, t: { en: ['Family apartment', 'Three bedrooms, a hall and a balcony.'], lt: ['Šeimos butas', 'Trys miegamieji, koridorius ir balkonas.'], de: ['Familienwohnung', 'Drei Schlafzimmer, Flur und Balkon.'] } },
  { id: 'home', area: 188, t: { en: ['Big family home', 'A large house with a study, a dressing room and two bathrooms.'], lt: ['Didelis šeimos namas', 'Didelis namas su kabinetu, drabužine ir dviem vonios kambariais.'], de: ['Großes Familienhaus', 'Ein großes Haus mit Arbeitszimmer, Ankleide und zwei Bädern.'] } },
  { id: 'office-s', area: 63, t: { en: ['Small office', 'A team of ten: open workspace, meeting room and reception.'], lt: ['Mažas biuras', 'Dešimties žmonių komandai: atvira erdvė, susitikimų kambarys ir registratūra.'], de: ['Kleines Büro', 'Für ein Team von zehn: Großraum, Besprechungsraum und Empfang.'] } },
  { id: 'office-l', area: 216, t: { en: ['Big office', 'A company floor with open space, meeting rooms, a training room and a break room.'], lt: ['Didelis biuras', 'Įmonės aukštas: atvira erdvė, susitikimų kambariai, mokymų salė ir poilsio kambarys.'], de: ['Großes Büro', 'Eine Firmenetage mit Großraum, Besprechungsräumen, Schulungsraum und Pausenraum.'] } },
]

// the names of the rooms in the plan files are English; they are shown in the language of the page
const ROOM_NAMES = {
  lt: {  Kitchen: 'Virtuvė', Hall: 'Prieškambaris', Bathroom: 'Vonios kambarys', 'Living and kitchen': 'Svetainė ir virtuvė', Bedroom: 'Miegamasis', 'Kids room': 'Vaikų kambarys', 'Living room': 'Svetainė', 'Kitchen and dining': 'Virtuvė ir valgomasis', Balcony: 'Balkonas', 'Bedroom 1': 'Miegamasis 1', 'Bedroom 2': 'Miegamasis 2', 'Bedroom 3': 'Miegamasis 3', 'Utility room': 'Ūkio patalpa', Study: 'Kabinetas', 'Master bedroom': 'Pagrindinis miegamasis', 'Dressing room': 'Drabužinė', 'Bathroom 2': 'Vonios kambarys 2', 'Open workspace': 'Atvira darbo erdvė', 'Meeting room': 'Susitikimų kambarys', Kitchenette: 'Virtuvėlė', Reception: 'Registratūra', Toilet: 'Tualetas', 'Manager office': 'Vadovo kabinetas', 'Open space': 'Atvira darbo erdvė', 'Meeting room 1': 'Susitikimų kambarys 1', 'Meeting room 2': 'Susitikimų kambarys 2', 'Director office': 'Direktoriaus kabinetas', 'Break room': 'Poilsio kambarys', 'Toilet 1': 'Tualetas 1', 'Toilet 2': 'Tualetas 2', 'Server and storage': 'Serverinė ir sandėlis', 'Training room': 'Mokymų salė' },
  de: { 'Living and sleeping': 'Wohnen und Schlafen', Kitchen: 'Küche', Hall: 'Flur', Bathroom: 'Badezimmer', 'Living and kitchen': 'Wohnen und Küche', Bedroom: 'Schlafzimmer', 'Kids room': 'Kinderzimmer', 'Living room': 'Wohnzimmer', 'Kitchen and dining': 'Küche und Essbereich', Balcony: 'Balkon', 'Bedroom 1': 'Schlafzimmer 1', 'Bedroom 2': 'Schlafzimmer 2', 'Bedroom 3': 'Schlafzimmer 3', 'Utility room': 'Hauswirtschaftsraum', Study: 'Arbeitszimmer', 'Master bedroom': 'Elternschlafzimmer', 'Dressing room': 'Ankleidezimmer', 'Bathroom 2': 'Badezimmer 2', 'Open workspace': 'Offener Arbeitsbereich', 'Meeting room': 'Besprechungsraum', Kitchenette: 'Teeküche', Reception: 'Empfang', Toilet: 'WC', 'Manager office': 'Büro der Leitung', 'Open space': 'Großraumbüro', 'Meeting room 1': 'Besprechungsraum 1', 'Meeting room 2': 'Besprechungsraum 2', 'Director office': 'Direktionsbüro', 'Break room': 'Pausenraum', 'Toilet 1': 'WC 1', 'Toilet 2': 'WC 2', 'Server and storage': 'Server und Lager', 'Training room': 'Schulungsraum' },
}
export const translatePlan = (plan) => { const m = ROOM_NAMES[LANG]; if (m) plan.rooms.forEach((r) => { r.name = m[r.name] || r.name }); return plan }

const S = {
  en: { modeFurnished: 'Furnished by the program', modeEmpty: 'Empty rooms: I furnish them', modeHint: 'Empty rooms: add pieces from the IKEA tab and they are placed for you.', orig: 'The original 2D floor plan this was made from', origHide: 'Hide', origShow: 'Show the original 2D plan', plan: 'Floor plan', pickPlan: 'Choose a floor plan', furniture: 'IKEA furniture', layout: 'Layout',
    intro: 'In the full Swiftrix 3D program you paste any IKEA or other shop link. The program reads the real size from the page, builds a 3D model from the product pictures and fits your room around it. This demo has 16 IKEA pieces prepared in advance. Add some to the room and watch the layout adjust.',
    all: 'All', home: 'Home', office: 'Office', addTo: 'Add to', room: 'Room', add: 'Add', remove: 'Remove', show: 'Show in the plan', view: 'View in 3D', ikea: 'View on IKEA', added: 'In your room', none: 'Nothing added yet.',
    cm: 'cm', limit: 'This demo holds up to 14 pieces. Remove one first.', book: 'Book a call', ctaTitle: 'Want this for your business?', ctaText: 'Swiftrix 3D reads a floor plan, furnishes it and shows it in 3D. The full program is for companies: furniture shops, developers, estate agents and designers.', pieces: 'pieces', ready: 'Ready-made plan',
    reset: 'Clear furniture' },
  lt: { modeFurnished: 'Įrengta programos', modeEmpty: 'Tuščios patalpos: įrengiu pats', modeHint: 'Tuščios patalpos: pridėkite baldų iš IKEA skirtuko ir jie bus išdėstyti už jus.', orig: 'Originalus 2D planas, pagal kurį sukurta', origHide: 'Slėpti', origShow: 'Rodyti originalų 2D planą', plan: 'Planas', pickPlan: 'Pasirinkite planą', furniture: 'IKEA baldai', layout: 'Išplanavimas',
    intro: 'Pilnoje „Swiftrix 3D“ programoje įklijuojate bet kurią IKEA ar kitos parduotuvės nuorodą. Programa perskaito tikrus matmenis iš puslapio, pagal prekės nuotraukas sukuria 3D modelį ir pritaiko patalpą aplink jį. Šioje demonstracijoje paruošta 16 IKEA baldų. Įdėkite kelis į patalpą ir stebėkite, kaip keičiasi išplanavimas.',
    all: 'Visi', home: 'Namams', office: 'Biurui', addTo: 'Įdėti į', room: 'Patalpa', add: 'Įdėti', remove: 'Pašalinti', show: 'Rodyti plane', view: 'Žiūrėti 3D', ikea: 'Žiūrėti IKEA', added: 'Jūsų patalpoje', none: 'Dar nieko neįdėta.',
    cm: 'cm', limit: 'Šioje demonstracijoje telpa iki 14 baldų. Pirmiausia vieną pašalinkite.', book: 'Užsakyti skambutį', ctaTitle: 'Norite to savo verslui?', ctaText: '„Swiftrix 3D“ perskaito planą, įrengia jį baldais ir parodo 3D. Pilna programa skirta įmonėms: baldų parduotuvėms, vystytojams, nekilnojamojo turto agentams ir dizaineriams.', pieces: 'baldai', ready: 'Paruoštas planas',
    reset: 'Išvalyti baldus' },
  de: { modeFurnished: 'Vom Programm möbliert', modeEmpty: 'Leere Räume: ich möbliere', modeHint: 'Leere Räume: Fügen Sie Möbel im IKEA-Tab hinzu, sie werden für Sie platziert.', orig: 'Der originale 2D-Grundriss, aus dem dies erstellt wurde', origHide: 'Ausblenden', origShow: 'Originalen 2D-Grundriss zeigen', plan: 'Grundriss', pickPlan: 'Grundriss wählen', furniture: 'IKEA-Möbel', layout: 'Aufteilung',
    intro: 'Im vollständigen Swiftrix-3D-Programm fügen Sie einen beliebigen IKEA- oder anderen Shop-Link ein. Das Programm liest die echten Maße von der Seite, baut aus den Produktbildern ein 3D-Modell und passt Ihren Raum darum herum an. In dieser Demo sind 16 IKEA-Möbel vorbereitet. Stellen Sie einige in den Raum und sehen Sie, wie sich die Aufteilung anpasst.',
    all: 'Alle', home: 'Wohnen', office: 'Büro', addTo: 'Hinzufügen zu', room: 'Raum', add: 'Hinzufügen', remove: 'Entfernen', show: 'Im Plan zeigen', view: 'In 3D ansehen', ikea: 'Bei IKEA ansehen', added: 'In Ihrem Raum', none: 'Noch nichts hinzugefügt.',
    cm: 'cm', limit: 'Diese Demo fasst bis zu 14 Möbel. Entfernen Sie zuerst eines.', book: 'Gespräch buchen', ctaTitle: 'Das für Ihr Unternehmen?', ctaText: 'Swiftrix 3D liest einen Grundriss, möbliert ihn und zeigt ihn in 3D. Das vollständige Programm ist für Unternehmen gedacht: Möbelhäuser, Bauträger, Makler und Designer.', pieces: 'Möbel', ready: 'Fertiger Grundriss',
    reset: 'Möbel entfernen' },
}
export const TX = S[LANG]

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
const loadCatalog = () => (catalog ||= fetch('./data/showcase/furniture.json').then((r) => r.json()))
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
