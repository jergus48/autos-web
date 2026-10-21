// Client-flow screens for the 2D to 3D product, running on placeholder data (no AI, email or payment is connected).
// Flow: upload -> processing -> email gate -> watermarked preview -> unlock with tokens -> full result.
import { renderStill, watermark, views, roomViews, OPTIONS, PALETTES, mountViewer, layoutFor, resetLayouts, resetSpace } from './stage.js'
import { layoutPlan, refitRoom, addProductTo, swapProduct } from '../layout/engine.js'
import { applyProducts, productSpec, reclassified, withModelSize } from '../layout/products.js'
import { MODELS, modelKeyOf } from '../layout/models.js'
import { mountProducts } from './products.js'
import { loadModels, reloadModels } from './models.js'
import { scalePlan, setRoomKind } from '../layout/planedit.js'
import { keyCards, flatCards, roomFacts, prosCons, compareRows, piecesRows, score, optionLabel, roomSig } from './story.js'
import { validate } from '../layout/validate.js'
import { buildSpace } from '../layout/space.js'
import { mountEditor } from './editor.js'
import { rebuild as recutWalls, refitWindows } from '../layout/windows.js'
import { lookFromStyle, summary, floorImagesFor } from './stylelook.js'
import { mountFloorPhotos, loadFloorPhotos } from './floorphoto.js'
import { openWallPaint } from './wallpaint.js'
import { cropBox, targetSize } from '../layout/planprep.js'
import { snapshot, restoreSnapshot, deleteRoom, mergeRooms, addRoom, reshapeRooms, remapWallColors, squareUp } from '../layout/planops.js'
import { roomIndexAt } from '../layout/edit.js'
import { checkOf, needsStep } from '../layout/readcheck.js'
import { mountReadCheck, readChip, mountReadNote } from './readcheck.js'
import { apiFetch, SUPABASE, signIn, signUp, signOut } from './apiclient.js'
import { PLANS, TX, LANG, translatePlan, mountPlanBar, mountShowcaseFurniture } from './showcase.js'

// the public showcase (app/showcase.html sets this): ready-made plans, a short list of IKEA pieces, no sign-in, no upload, nothing saved, no call to any API
const SHOW = Boolean(globalThis.SWX_SHOWCASE)

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// The public server (server/app.js) answers /api/me and keeps the accounts, the credits and the saved work. The local prototype server does not: then everything below behaves as the prototype always did
// (a "token" is only a number in the browser). With the public server the browser holds no money: the balance comes from the server, a reading takes a credit on the server, nothing here can add one.
let ME = null
try { if (SHOW) throw new Error('showcase'); const r = await apiFetch('/api/me'); if (r.ok) { const j = await r.json(); if (j && j.public === true) ME = j } } catch { /* the local prototype server */ }
if (SUPABASE && !ME) ME = { public: true, user: null, contact: '', operator: '', unreachable: true }          // the API cannot be reached: this stays the public version, never the prototype's pretend tokens
const PUBLIC = Boolean(ME)

const INCLUDED_PIECES = 2, MAX_PIECES = 5
// ?demo=plan2 (or aruodas, sample) opens an unlocked room on that plan in its own storage, independent of any saved demo state
const DEMO = PUBLIC ? null : new URLSearchParams(location.search).get('demo')
const KEY = PUBLIC ? 'swx3d-pub-' + (ME.user ? ME.user.email : 'guest') : DEMO ? 'swx3d-demo-view-' + DEMO : 'swx3d-demo-v1'
const fresh = () => ({ user: null, tokens: 0, rooms: [], userPlans: {}, windowTemplates: [] })
let state = SHOW ? fresh() : (() => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return fresh() } })()
let syncTimer = 0, syncWarned = false
// the saved work of the account (rooms, plans, templates) goes to the server a moment after every change; the balance is never sent
async function syncNow() {
  if (!PUBLIC || !state.user) return
  syncTimer = 0
  try {
    const r = await apiFetch('/api/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: { rooms: state.rooms, userPlans: state.userPlans, windowTemplates: state.windowTemplates } }) })
    if (r.status === 401) { state.user = null; renderHeader() }
    else if (!r.ok && !syncWarned) { syncWarned = true; const j = await r.json().catch(() => ({})); toast(j.message || 'Your work could not be saved to your account.') }
  } catch { /* offline: it is tried again at the next change */ }
}
const save = () => { if (SHOW) return; try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: it still works for this visit */ } if (PUBLIC && state.user) { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 900) } }
if (PUBLIC) {
  state.user = ME.user ? { email: ME.user.email } : null; state.tokens = ME.user ? ME.user.credits : 0
  if (ME.user) {          // the work of the account comes from the server; this browser only keeps a copy
    try {
      const j = await (await apiFetch('/api/state')).json()
      if (j.state) { state.rooms = j.state.rooms || []; state.userPlans = j.state.userPlans || {}; state.windowTemplates = j.state.windowTemplates || [] }
      else if (state.rooms.length) syncNow()          // a first sign-in on a browser that already has rooms: they are kept in the account
    } catch { /* offline: the copy in this browser is used */ }
  }
  addEventListener('pagehide', () => { if (syncTimer) { clearTimeout(syncTimer); syncNow() } })
}

let draft = null            // the file picked on the upload screen (kept in memory only)
let carry = null            // after a reshape the screen is made again: which room of the plan stays in focus, and that reshaping goes on
let cleanup = null          // dispose function of the current screen
const cache = new Map()     // rendered stills, memory only
const photoStore = new Map() // room id -> property photos [{ name, url, sample }], memory only
// (the walls the person painted travel with the plan into every picture: whatever is drawn asks lookOf first, so the paint of this room is put on the plan here)
// a close-up photo of the real floor that the person added is used whether or not the photos were read
const lookOf = (room, plan) => {
  plan.wallColors = room.wallColors || {}
  const look = room.match && room.style ? lookFromStyle(plan, room.style, { floorAll: room.floorAll !== false }) : null
  return room.floorPhotos?.length ? { ...(look || {}), floorImages: floorImagesFor(plan, room.floorPhotos) } : look
}

const ICON = {
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  google: '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 019.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>',
}

function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3400)
}

function openModal(html, setup, onClose) {
  const bg = document.createElement('div'); bg.className = 'modal-bg'
  bg.innerHTML = `<div class="modal card" role="dialog" aria-modal="true">${html}</div>`
  $('#modal-root').appendChild(bg)
  const onKey = (e) => { if (e.key === 'Escape') close() }
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); onClose?.() }
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) close() })
  document.addEventListener('keydown', onKey)
  setup?.($('.modal', bg), close)
  return close
}

const plans = {}
const getPlan = (id = 'sample') => (plans[id] ||= SHOW ? fetch(`./data/showcase/plan-${id}.json`).then((r) => r.json()).then((p) => { p.id = id; return translatePlan(p) }) : state.userPlans?.[id] ? Promise.resolve(state.userPlans[id]) : fetch(`./data/${id === 'sample' ? 'sample-plan' : 'plan-' + id}.json`).then((r) => r.json()).then((p) => { p.id = id; return p }))
const totalArea = (plan) => plan.rooms.reduce((s, r) => s + r.areaM2, 0)

// ---------- stills ----------
async function previewStills(plan, look = null, tag = '') {
  const ck = 'preview:' + plan.id + tag
  if (cache.has(ck)) return cache.get(ck)
  const vs = views(plan), out = { views: [], opts: {} }
  for (const v of vs) {
    out.views.push({ id: v.id, name: v.name, url: watermark(renderStill(plan, { option: 'A', view: v, width: 960, height: 540, look })).toDataURL('image/jpeg', 0.82) })
    await sleep(0)
  }
  for (const o of OPTIONS) {
    out.opts[o.id] = watermark(renderStill(plan, { option: o.id, view: vs[0], width: 640, height: 360, look }), 'PREVIEW').toDataURL('image/jpeg', 0.75)
    await sleep(0)
  }
  cache.set(ck, out); return out
}
function cleanThumb(plan, room, optionId, viewIdx = 0, w = 640, h = 360) {
  applyProducts(plan, room.products || [])
  return renderStill(plan, { option: optionId === 'custom' ? room.base || 'A' : optionId, items: optionId === 'custom' ? room.custom : null, view: views(plan)[viewIdx], width: w, height: h, look: lookOf(room, plan) }).toDataURL('image/jpeg', 0.85)
}

// ---------- routing ----------
const route = () => { const [p, q] = (location.hash.replace(/^#/, '') || '/').split('?'); return { parts: p.split('/').filter(Boolean), q: new URLSearchParams(q || '') } }
// the showcase: one room per plan, kept while the page is open; choosing a plan (or the same plan again, which starts it over) opens its room
const showRoom = (pid) => {
  let r = state.rooms.find((x) => x.id === 'sc-' + pid); const def = PLANS.find((p) => p.id === pid)
  if (!r) { r = { id: 'sc-' + pid, name: `${def.t[LANG][0]}, ${def.area} m²`, planId: pid, createdAt: Date.now(), status: 'unlocked', option: 'A', products: [] }; state.rooms.push(r) }
  return r
}
function switchPlan(pid) {
  const again = location.hash === '#/room/sc-' + pid
  if (again) { state.rooms = state.rooms.filter((x) => x.id !== 'sc-' + pid); const old = plans[pid]; delete plans[pid]; old?.then((p) => { resetLayouts(p); resetSpace(p) }) }          // the same plan again: start it over
  showRoom(pid); go('#/room/sc-' + pid)
}
async function render() {
  cleanup?.(); cleanup = null
  const { parts, q } = route(), el = $('#screen')
  renderHeader(); window.scrollTo(0, 0)
  if (SHOW) { const pid = /^sc-/.test(parts[1] || '') && PLANS.some((p) => 'sc-' + p.id === parts[1]) ? parts[1].slice(3) : 'family'; showRoom(pid); return screenRoom(el, 'sc-' + pid) }
  if (parts[0] === 'demo' && PUBLIC) return go('#/')          // the test rooms are for the local prototype only
  if (parts[0] === 'demo') {      // #/demo/<sample plan>: an unlocked room on a sample plan, for showing and testing
    const pid = parts[1] || 'plan2'
    let r = state.rooms.find((x) => x.demo === pid)
    if (!r) { state.user ||= { email: 'demo@swiftrix.eu' }; state.tokens = Math.max(state.tokens, 5); r = { id: 'demo-' + pid, demo: pid, name: { plan2: 'Apartment with terrace, 180 m²', aruodas: 'Real plan, 178 m²', palanga: 'Palanga apartment, 85 m²' }[pid] || 'Sample apartment', planId: pid, createdAt: Date.now(), status: 'unlocked', option: 'A', products: [] }; state.rooms.unshift(r); save() }
    return go('#/room/' + r.id)
  }
  if (parts[0] === 'processing') return screenProcessing(el)
  if (parts[0] === 'room') return screenRoom(el, parts[1])
  if (parts[0] === 'buy') return screenBuy(el, q)
  if (parts[0] === 'rooms') return screenRooms(el)
  return screenUpload(el)
}
window.addEventListener('hashchange', render)
const go = (h) => { if (location.hash === h) render(); else location.hash = h }

function renderHeader() {
  if (PUBLIC) { const pill = $('#nav-tokens'); if (pill) pill.innerHTML = `<span class="dot"></span><span id="token-count">${state.tokens}</span> credit${state.tokens === 1 ? '' : 's'}` }
  $('#token-count').textContent = state.tokens
  $('#acct').textContent = state.user ? state.user.email : 'Sign in'
}
$('#acct').addEventListener('click', () => {
  if (!state.user) return openAuth({ onDone: render })
  if (PUBLIC) return publicAccountMenu()
  openModal(`<h2>Your account</h2><p class="muted">${esc(state.user.email)}</p>
    <div class="row" style="justify-content:flex-start"><a class="btn" href="#/rooms" data-close>My rooms</a><a class="btn" href="#/buy" data-close>My tokens</a></div>
    <button class="btn" id="out" type="button">Sign out</button>`, (m, close) => {
    $$('[data-close]', m).forEach((a) => a.addEventListener('click', close))
    $('#out', m).onclick = () => { state.user = null; save(); close(); toast('Signed out'); go('#/') }
  })
})
$('#reset').addEventListener('click', () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } state = fresh(); cache.clear(); draft = null; toast('Demo reset'); go('#/') })

// ---------- sign in (email code, no password) ----------
function openAuth({ title = 'Sign in', sub = 'We email you a 6-digit code. There is no password to remember.', onDone } = {}) {
  if (PUBLIC) return openAuthPublic({ title })
  openModal('', (m, close) => {
    const finish = (email) => { state.user = { email }; save(); renderHeader(); close(); toast('Signed in as ' + email); onDone?.() }
    const stepEmail = () => {
      m.innerHTML = `<h2>${esc(title)}</h2><p class="muted">${esc(sub)}</p>
        <button class="btn google wide" id="g" type="button">${ICON.google} Continue with Google</button>
        <div class="divider">or use your email</div>
        <form id="f" style="display:grid;gap:12px"><input id="em" type="email" required autocomplete="email" placeholder="you@example.com" aria-label="Email">
        <label class="check"><input type="checkbox" checked> Keep me signed in for 30 days</label>
        <button class="btn primary wide" type="submit">Send me a code</button></form>
        <p class="muted small">Demo only: no email is sent and no account is created.</p>`
      $('#g', m).onclick = () => finish('you@gmail.com')
      $('#f', m).onsubmit = (e) => { e.preventDefault(); stepCode($('#em', m).value.trim()) }
      $('#em', m).focus()
    }
    const stepCode = (email) => {
      m.innerHTML = `<h2>Check your email</h2><p class="muted">Enter the 6-digit code we sent to <b style="color:var(--ink)">${esc(email)}</b>.</p>
        <div class="codes">${'<input inputmode="numeric" maxlength="1" aria-label="Code digit">'.repeat(6)}</div>
        <p class="muted small">Demo only: any 6 digits work.</p>
        <div class="row" style="justify-content:space-between"><button class="link muted" id="back" type="button">Use a different email</button><button class="link muted" id="again" type="button">Send again</button></div>`
      const boxes = $$('.codes input', m)
      boxes.forEach((b, i) => {
        b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, ''); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); if (boxes.every((x) => x.value)) finish(email) })
        b.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus() })
        b.addEventListener('paste', (e) => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); t.split('').forEach((c, k) => { boxes[k].value = c }); if (t.length === 6) finish(email) })
      })
      boxes[0].focus()
      $('#back', m).onclick = stepEmail; $('#again', m).onclick = () => toast('Code sent again (demo)')
    }
    stepEmail()
  })
}

// ---------- the public server: sign in with a password, credits from the server ----------
async function API(path, method = 'GET', body) {
  if (SUPABASE && path.startsWith('/api/auth/')) {          // with Supabase the browser signs in at Supabase Auth itself (app/apiclient.js)
    const kind = path.slice('/api/auth/'.length)
    if (kind === 'logout') { await signOut(); return { ok: true, status: 200, j: {} } }
    const r = await (kind === 'login' ? signIn : signUp)(body.email, body.password)
    return { ok: r.ok, status: r.ok ? 200 : 400, j: r.ok ? {} : { message: r.message } }
  }
  const r = await apiFetch(path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }
}
async function refreshMe() { if (!PUBLIC) return; const { ok, j } = await API('/api/me'); if (ok) { state.user = j.user ? { email: j.user.email } : null; state.tokens = j.user ? j.user.credits : 0; renderHeader() } }
const contactLink = () => (ME && ME.contact ? `<a href="mailto:${esc(ME.contact)}?subject=${encodeURIComponent('Credits for ' + (state.user ? state.user.email : 'my account'))}">${esc(ME.contact)}</a>` : 'us')
function noCredits() {
  openModal(`<h2>You have no credits yet</h2><p class="muted">One credit reads one floor plan and gives you a full, editable 3D room. We add credits by hand: write to ${contactLink()} from the e-mail of your account (<b>${esc(state.user.email)}</b>) and tell us how many you would like.</p><div class="row"><button class="btn primary" id="ok" type="button">OK</button></div>`, (m, close) => { $('#ok', m).onclick = close })
}
// reading a plan costs real money: it needs an account and a credit
const gateUpload = () => { if (!state.user) { openAuth({ title: 'Sign in to read your plan' }); return false } if (state.tokens < 1) { noCredits(); return false } return true }
function openAuthPublic({ title = 'Sign in' } = {}) {
  openModal('', (m, close) => {
    let mode = 'in'
    const draw = () => {
      m.innerHTML = `<h2>${esc(title)}</h2><div class="row" style="justify-content:flex-start;gap:8px;margin:6px 0 12px"><button class="chipx ${mode === 'in' ? 'on' : ''}" data-m="in" type="button">Sign in</button><button class="chipx ${mode === 'up' ? 'on' : ''}" data-m="up" type="button">Create account</button></div>
        <form id="af" novalidate style="display:grid;gap:12px"><label class="fld"><span>E-mail</span><input id="em" type="email" autocomplete="email" required></label>
          <label class="fld"><span>Password</span><input id="pw" type="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" minlength="10" required></label>
          <p class="muted small">${mode === 'up' ? 'At least 10 characters. A new account has no credits: after you sign up, write to us and we add some.' : 'Forgot your password? Write to us and we set a new one.'}</p>
          <p class="err" id="ae" role="alert"></p><button class="btn primary wide" id="go" type="submit">${mode === 'in' ? 'Sign in' : 'Create account'}</button></form>`
      $$('[data-m]', m).forEach((b) => { b.onclick = () => { mode = b.dataset.m; draw() } })
      $('#af', m).onsubmit = async (e) => {
        e.preventDefault(); const go = $('#go', m), err = $('#ae', m); err.textContent = ''; go.disabled = true
        const { ok, j } = await API('/api/auth/' + (mode === 'in' ? 'login' : 'signup'), 'POST', { email: $('#em', m).value, password: $('#pw', m).value }); go.disabled = false
        if (!ok) { err.textContent = j.message || 'That did not work. Try again.'; return }
        close(); location.reload()          // the page is made again for the account: its credits and its saved work
      }
      $('#em', m).focus()
    }
    draw()
  })
}
function publicAccountMenu() {
  openModal(`<h2>Your account</h2><p class="muted">${esc(state.user.email)}<br><b style="color:var(--ink)">${state.tokens}</b> credit${state.tokens === 1 ? '' : 's'}</p>
    <div class="row" style="justify-content:flex-start"><a class="btn" href="#/rooms" data-close>My rooms</a><a class="btn" href="#/buy" data-close>My credits</a></div>
    <div class="row" style="justify-content:flex-start;margin-top:10px"><button class="btn" id="out" type="button">Sign out</button><button class="btn" id="del" type="button">Delete my account</button></div>`, (m, close) => {
    $$('[data-close]', m).forEach((a) => a.addEventListener('click', close))
    const leave = () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } location.hash = '#/'; location.reload() }
    $('#out', m).onclick = async () => { await API('/api/auth/logout', 'POST', {}); leave() }
    $('#del', m).onclick = () => {
      m.innerHTML = `<h2>Delete your account?</h2><p class="muted">This removes your account, your rooms and any credits you have, for good. Type your password to confirm.</p><label class="fld"><span>Password</span><input id="dp" type="password" autocomplete="current-password"></label><p class="err" id="de" role="alert"></p><div class="row"><button class="btn" id="no" type="button">Cancel</button><button class="btn primary" id="yes" type="button">Delete everything</button></div>`
      $('#no', m).onclick = close
      $('#yes', m).onclick = async () => { const { ok, j } = await API('/api/me', 'DELETE', { password: $('#dp', m).value }); if (!ok) { $('#de', m).textContent = j.message || 'That did not work.'; return } leave() }
    }
  })
}
function screenCredits(el) {
  const unit = PUBLIC ? 'credit' : 'token', n = state.tokens
  el.innerHTML = `<section class="buy"><div><h1>${PUBLIC ? 'Credits' : 'Tokens'}</h1><p class="lead" style="margin-top:10px">${state.user ? `You have <b style="color:var(--ink)">${n}</b> ${unit}${n === 1 ? '' : 's'}.` : 'Create an account to get started.'}</p></div>
    <div class="how card"><b>How ${unit}s work</b><ul>${PUBLIC
      ? '<li>One credit reads one floor plan: you get a full, editable 3D room with furniture layouts.</li><li>Editing the room, changing walls, doors and windows and trying layouts never costs anything.</li><li>If a reading fails, the credit is given back at once.</li>'
      : `<li>1 token = 1 room: the clean 3D room, 3 interior options and ${INCLUDED_PIECES} furniture pieces from links.</li><li>An extra furniture piece or an extra interior option costs 1 token.</li><li>The free preview never costs a token.</li>`}</ul></div>
    <div class="how card"><b>Where do ${unit}s come from?</b><p class="muted" style="margin-top:8px">${unit[0].toUpperCase() + unit.slice(1)}s are not sold here. We give them to our clients by hand. ${state.user ? `Write to ${contactLink()} from the e-mail of your account (<b style="color:var(--ink)">${esc(state.user.email)}</b>) and tell us how many you would like.` : `Create an account first, then write to ${contactLink()} from the same e-mail.`}</p></div>
    ${state.user ? '' : '<button class="btn primary" id="si" type="button">Create an account</button>'}</section>`
  $('#si', el)?.addEventListener('click', () => openAuth({ title: 'Create your account', onDone: render }))
}
function publicInit() {
  $('.proto-strip')?.remove()
  $('#nav-tokens')?.setAttribute('aria-label', 'Your credits'); renderHeader()
}

// ---------- screen: upload ----------
function screenUpload(el) {
  el.innerHTML = `<section class="hero">
    <span class="badge">2D to 3D interior visualisation</span>
    <h1>Turn a floor plan into a <mark>3D room</mark></h1>
    <p class="lead">Upload your plan and see a free watermarked preview in about a minute, no sign-up needed. Unlock the full result with tokens.</p>
    <label class="drop" id="drop" tabindex="0">${ICON.upload}<span class="big">Drop your floor plan here, or browse</span><span class="muted">PNG, JPG or PDF, up to 20 MB</span><span class="err" id="err" role="alert"></span>
      <input id="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden></label>
    <div class="muted">No plan at hand? Try <button class="link" id="sample" type="button">a simple sample</button> or <button class="link" id="sample2" type="button">a real 4-bedroom plan</button> or <button class="link" id="sample3" type="button">a 180 m² apartment with terrace</button></div>
    <ol class="flow">
      <li><b>1</b><span>Upload your plan</span><small>A drawing, a sketch or a scan of the floor plan.</small></li>
      <li><b>2</b><span>See a free preview</span><small>Your plan as a 3D room, with a watermark.</small></li>
      <li><b>3</b><span>Unlock with tokens</span><small>Clean 3D room, interior options and furniture from links.</small></li>
    </ol>
    <div class="trust"><span class="chip ok">Free preview</span><span class="chip">No card needed</span><span class="chip">Your plan stays private</span></div>
  </section>`
  const drop = $('#drop'), file = $('#file'), err = $('#err')
  if (PUBLIC) {
    $('.lead', el).textContent = 'Upload your floor plan and get an editable 3D room in about a minute. Each plan you upload uses one credit.'
    $('.flow', el).innerHTML = '<li><b>1</b><span>Create an account</span><small>We add credits to it for you.</small></li><li><b>2</b><span>Upload your plan</span><small>A drawing, a sketch or a scan of the floor plan.</small></li><li><b>3</b><span>Check and edit</span><small>Fix rooms, walls, doors and windows, then try furniture layouts.</small></li>'
    $('.trust', el).innerHTML = '<span class="chip">Your plans stay private to your account</span>'
    $('#sample', el).closest('div').innerHTML = 'No plan at hand? Try <button class="link" id="sample" type="button">a simple sample</button> (free, no account needed).'
    drop.addEventListener('click', (e) => { if (!gateUpload()) e.preventDefault() })
  }
  const take = (f) => {
    if (!f) return
    if (PUBLIC && !gateUpload()) return
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(f.type)) { err.textContent = 'Please choose a PNG, JPG or PDF file.'; return }
    if (f.size > 20 * 1024 * 1024) { err.textContent = 'That file is larger than 20 MB.'; return }
    draft = { name: f.name, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null, source: 'upload' }
    go('#/processing')
  }
  file.addEventListener('change', () => take(file.files[0]))
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click() } })
  ;['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over') }))
  ;['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over') }))
  drop.addEventListener('drop', (e) => take(e.dataTransfer.files[0]))
  $('#sample').onclick = () => { draft = { name: 'sample-plan.png', url: './data/sample-plan.png', source: 'sample', planId: 'sample' }; go('#/processing') }
  if ($('#sample2')) $('#sample2').onclick = () => { draft = { name: 'real-plan.png', url: './data/plan-aruodas.png', source: 'sample', planId: 'aruodas' }; go('#/processing') }
  if ($('#sample3')) $('#sample3').onclick = () => { draft = { name: 'terrace-plan.png', url: './data/plan-plan2.png', source: 'sample', planId: 'plan2' }; go('#/processing') }
}

// ---------- screen: processing ----------
function screenProcessing(el) {
  if (!draft) return go('#/')
  const STEPS = [['Reading your plan', 1100], ['Measuring the rooms', 1200], ['Building walls, doors and windows', 1300], ['Rendering your preview', 1100]]
  el.innerHTML = `<section class="proc">
    <div class="plan-thumb">${draft.url ? `<img src="${esc(draft.url)}" alt="Your floor plan">` : '<div style="height:240px;display:grid;place-items:center;color:#555">PDF</div>'}<span class="scan"></span><span class="file">${esc(draft.name)}</span></div>
    <div><h2 id="ptitle">Building your 3D room</h2><p class="muted" id="psub">Usually under a minute. You can leave this page open.</p>
      <ul class="psteps">${STEPS.map(([t]) => `<li><i></i><span>${t}</span></li>`).join('')}</ul>
      <div class="bar"><i id="bar"></i></div>
      <div id="done" style="margin-top:18px"></div></div></section>`
  let dead = false; cleanup = () => { dead = true }
  const lis = $$('.psteps li', el)
  // an uploaded plan is read by the server (one paid call, off unless the owner allowed it); the samples are ready-made
  const reading = draft.source === 'upload' ? readUploadedPlan(draft) : Promise.resolve(null)
  reading.catch(() => {})
  ;(async () => {
    let acc = 0; const total = STEPS.reduce((s, x) => s + x[1], 0)
    for (let i = 0; i < STEPS.length; i++) {
      lis[i].className = 'on'; await sleep(STEPS[i][1]); if (dead) return
      lis[i].className = 'done'; acc += STEPS[i][1]; $('#bar', el).style.width = Math.round((acc / total) * 100) + '%'
    }
    let read = null
    try { read = await reading } catch (e) {
      $('#ptitle', el).textContent = 'We could not read this plan'; $('#psub', el).textContent = e.message; refreshMe()          // a failed reading gives the credit back: show the balance as it is now
      $('#done', el).innerHTML = '<a class="btn primary" href="#/">Try a sample plan</a>'; return
    }
    if (read) { draft.planId = read.id; state.userPlans[read.id] = read; plans[read.id] = Promise.resolve(read) }
    // a reading the three readings did not agree on is shown over the uploaded plan first: the person looks at it before it is turned into a room
    const chk = read ? checkOf(read) : null
    const finish = (checked) => {
    const room = { id: 'r' + Date.now().toString(36), ...(draft.original ? { original: draft.original } : {}), ...(checked ? { readChecked: true } : {}), name: draft.source === 'sample' ? (draft.planId === 'aruodas' ? 'Real plan, 178 m\u00b2' : draft.planId === 'plan2' ? 'Apartment with terrace, 180 m\u00b2' : 'Sample apartment') : draft.name.replace(/\.[^.]+$/, ''), planId: draft.planId || 'sample', createdAt: Date.now(), status: PUBLIC ? 'unlocked' : 'demo', option: 'A', products: [] }
    state.rooms.unshift(room); save()
    if ($('#ptitle', el)) { $('#ptitle', el).textContent = 'Your preview is ready'; $('#psub', el).textContent = state.user ? 'Opening it now.' : 'Enter your email to see it. We also send you the link so you can come back.' }
    const open = () => go('#/room/' + room.id)
    if (state.user || PUBLIC) return open()
    const gate = () => openAuth({ title: 'Your preview is ready', sub: 'Enter your email to see it. We also send you the link so you can come back.', onDone: open })
    if ($('#done', el)) { $('#done', el).innerHTML = '<button class="btn primary" id="see" type="button">See my preview</button>'; $('#see', el).onclick = gate }
    gate()
    }
    if (needsStep(chk) && !dead) return mountReadCheck(el, { plan: read, image: draft.original && draft.original.image, name: draft.name, onContinue: finish, onRetry: () => go('#/') })
    finish(false)
  })()
}

// the picture the reader gets: the margin cut off and the drawing enlarged (or brought down) to about 1600 pixels, see layout/planprep.js for why; sharpened a little, so thin lines stay lines
async function preparePlan(url, long = 1600) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const k0 = Math.min(1, 3000 / Math.max(img.naturalWidth, img.naturalHeight)), W = Math.round(img.naturalWidth * k0), H = Math.round(img.naturalHeight * k0)
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, W, H)
  const [x0, y0, x1, y1] = cropBox(g.getImageData(0, 0, W, H).data, W, H), [tw, th] = targetSize(x1 - x0, y1 - y0, long)
  const o = document.createElement('canvas'); o.width = tw; o.height = th; const og = o.getContext('2d', { willReadFrequently: true }); og.imageSmoothingEnabled = true; og.imageSmoothingQuality = 'high'; og.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, tw, th)
  const d = og.getImageData(0, 0, tw, th), src = new Uint8ClampedArray(d.data), a = 0.35          // unsharp: 3 x 3 kernel with the centre 1 + 4a and the four neighbours -a
  for (let y = 1; y < th - 1; y++) for (let x = 1; x < tw - 1; x++) { const i = (y * tw + x) * 4; for (let q = 0; q < 3; q++) d.data[i + q] = (1 + 4 * a) * src[i + q] - a * (src[i - 4 + q] + src[i + 4 + q] + src[i - tw * 4 + q] + src[i + tw * 4 + q]) }
  og.putImageData(d, 0, 0)
  const png = o.toDataURL('image/png'); return png.length < 6e6 ? png : o.toDataURL('image/jpeg', 0.92)
}
// the picture that is kept with the room to show next to the plan while doors and windows are placed: the same picture, about 1000 pixels and a JPEG, so that it stays small in the browser
async function referencePicture(url, long = 1000) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const [w, h] = targetSize(img.naturalWidth, img.naturalHeight, long), c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', 0.82)
}

async function readUploadedPlan(d) {
  if (!d.url) throw new Error('PDF plans are not read in this prototype yet. Please upload a PNG or JPG of the plan.')
  const image = await preparePlan(d.url)
  try { d.original = { image: await referencePicture(image) } } catch { d.original = null }
  const r = await apiFetch('/api/extract-plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image, name: d.name }) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error === 'spend_disabled' ? 'Reading your own plan is not switched on in this prototype: it makes paid calls to the Claude API (about 25 cents). The three sample plans work.' : (j.message || 'The plan could not be read.'))
  if (Number.isFinite(j.credits)) { state.tokens = j.credits; renderHeader() }
  const plan = j.plan; plan.id = 'u' + Date.now().toString(36); plan.readCostUsd = j.costUsd; plan.readVotes = { n: j.votes || 1, agreement: j.agreement || [] }
  return plan
}

// ---------- screen: room (preview or result) ----------
async function screenRoom(el, id) {
  const room = state.rooms.find((r) => r.id === id)
  if (!room) { toast('That room was not found'); return go('#/') }
  if (!state.user && !(PUBLIC && room.planId === 'sample')) {          // a guest may open the free sample
    el.innerHTML = '<div class="empty"><h2>Sign in to see your room</h2><p class="muted">We send a code to your email. No password.</p><button class="btn primary" id="si" type="button">Sign in</button></div>'
    const gate = () => openAuth({ title: 'Sign in to see your room', onDone: render }); $('#si', el).onclick = gate; return gate()
  }
  const plan = await getPlan(room.planId || 'sample')
  if (PUBLIC && room.status !== 'unlocked') { room.status = 'unlocked'; save() }          // with the public server a room is always the full room: the credit is spent when the plan is read
  return room.status === 'unlocked' ? screenResult(el, room, plan) : screenDemo(el, room, plan)
}

function screenDemo(el, room, plan) {
  el.innerHTML = `<div class="room-head"><div><span class="chip">Free preview</span><h1 style="margin-top:8px">${esc(room.name)}</h1></div>
      <span class="row" style="gap:8px"><span class="chip ok">Plan read: ${plan.rooms.length} rooms, ${plan.bounds.width.toFixed(1)} x ${plan.bounds.depth.toFixed(1)} m, ${totalArea(plan).toFixed(0)} m&sup2;</span>${readChip(plan, room)}</span></div>
    <div class="room-grid"><div>
      <div class="still"><div class="skeleton" id="sk"></div><img id="big" alt="Preview of your room" hidden><span class="note">Free preview &middot; low resolution &middot; watermarked</span></div>
      <div class="thumbs" id="thumbs"></div>
      <h2 class="section-title">Interior options</h2><p class="section-sub">Option A is shown in your preview. Unlock the room to see B and C and to switch between them.</p>
      <div class="opt-grid" id="opts">${OPTIONS.map((o) => `<div class="opt ${o.id === 'A' ? '' : 'locked'}"><div class="img"><div class="skeleton"></div><img data-o="${o.id}" alt="" hidden>${o.id === 'A' ? '' : `<div class="lock"><span>${ICON.lock} Unlock to see</span></div>`}</div>
        <div class="meta"><b>Arrangement ${o.id}</b><p>${esc(o.blurb)}</p></div></div>`).join('')}</div>
      <h2 class="section-title">Make it match your property</h2><div id="photos-demo"></div>
    </div>
    <aside class="panel card">
      <h2>Unlock this room</h2>
      <div class="price"><span class="tok">1 token</span><span class="muted">per room</span></div>
      <ul class="incl"><li>Clean 3D room, no watermark</li><li>Interactive 3D: rotate, top view, cut-away walls</li><li>HD pictures to download</li><li>3 interior options to compare</li><li>${INCLUDED_PIECES} furniture pieces from links, placed in your room</li></ul>
      <button class="btn primary wide" id="unlock" type="button">${state.tokens >= 1 ? 'Unlock with 1 token' : 'No tokens left'}</button>
      <p class="muted small">You have <b style="color:var(--ink)">${state.tokens}</b> token${state.tokens === 1 ? '' : 's'}. ${state.tokens >= 1 ? '' : `<a href="#/buy?return=${encodeURIComponent('/room/' + room.id)}">How to get tokens</a>`}</p>
      <details><summary>How do tokens work?</summary><p>One token unlocks one room: the clean 3D room, 3 interior options and ${INCLUDED_PIECES} furniture pieces. Extra furniture pieces or extra interior options cost 1 token each.</p></details>
    </aside></div>`
  $('#unlock', el).onclick = () => {
    if (state.tokens < 1) return go('#/buy?return=' + encodeURIComponent('/room/' + room.id))
    state.tokens -= 1; room.status = 'unlocked'; save(); renderHeader(); toast('Room unlocked. 1 token used.'); render()
  }
  photosPanel($('#photos-demo', el), room, plan, { onApply: render })
  previewStills(plan, lookOf(room, plan), room.match ? ':m' + room.id + ':' + (room.styleV || 0) : '').then((p) => {
    if (!$('#big', el)) return
    const show = (i) => { $('#big', el).src = p.views[i].url; $$('.thumb', el).forEach((t, k) => t.classList.toggle('sel', k === i)) }
    $('#thumbs', el).innerHTML = p.views.map((v, i) => `<button class="thumb" type="button" data-i="${i}"><img src="${v.url}" alt="${esc(v.name)}"><span>${esc(v.name)}</span></button>`).join('')
    $$('.thumb', el).forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)))
    $('#big', el).hidden = false; $('#sk', el).remove(); show(0)
    $$('#opts img', el).forEach((im) => { im.src = p.opts[im.dataset.o]; im.hidden = false; im.previousElementSibling?.remove() })
  })
}

// what the person changed on the plan earlier (scale, doors, windows, room types and names) is put back before anything is measured
function applyEdits(room, plan) {
  const e = room.edits
  if (e?.struct?.current) restoreSnapshot(plan, e.struct.current)          // the rooms and walls as they were after the last room was deleted or two were joined (the scale and the openings are put back below)
  if (e) {
    const base = plan._baseScale || 1
    if (e.scale && Math.abs(e.scale - base) > 1e-6) scalePlan(plan, e.scale / base)
    if (e.openings) plan.openings = e.openings.map((o) => ({ ...o }))
    for (const [id, r] of Object.entries(e.rooms || {})) { const i = plan.rooms.findIndex((x) => x.id === id); if (i >= 0) setRoomKind(plan, i, { name: r.name, userKind: r.userKind || '' }) }
  } else if (room.windows) plan.openings = [...plan.openings.filter((o) => o.kind !== 'window'), ...room.windows.map((o) => ({ ...o }))]          // saved by an older version
  if (e || room.windows) refitWindows(plan)
  if (e || room.windows || plan._wallsRev !== 7) recutWalls(plan)
}

function screenResult(el, room, plan) {
  const tabs = SHOW ? [['layout', TX.layout], ['furniture', TX.furniture]] : [['layout', 'Layout'], ['furniture', 'Furniture from links'], ['photos', 'Property photos'], ['downloads', 'Downloads']]
  applyEdits(room, plan)
  plan._empty = SHOW && room.empty ? true : null
  room.products = (room.products || []).map(reclassified); room.slots = Math.max(room.slots || 0, INCLUDED_PIECES); delete room.pieces          // pieces from links are real pieces of the layout; the first INCLUDED_PIECES places are free
  applyProducts(plan, room.products)
  let space = buildSpace(plan)
  room.base = room.base || (room.option !== 'custom' ? room.option : 'A') || 'A'
  const baseItems = (o) => layoutFor(plan, o)
  const current = () => (room.option === 'custom' && room.custom ? room.custom : baseItems(room.option))
  let furnished = space.rooms.filter((r) => r.kind !== 'none')
  const carried = carry && carry.room === room.id ? carry : null; carry = null
  const carriedAt = carried ? plan.rooms.findIndex((x) => x.id === carried.focusId) : -1
  let focus = carriedAt >= 0 ? carriedAt : SHOW ? null : (space.rooms.find((r) => r.kind === 'living' && r.area >= 15) || furnished[0]).i
  let editor = null, lastRep = null, scores = null, viewList = [], labels = {}
  el.innerHTML = `${SHOW ? '<div id="sc-planbar"></div>' : ''}<div class="room-head"><div><span class="chip ok">Unlocked</span> <span id="rchip">${readChip(plan, room)}</span><h1 style="margin-top:8px">${esc(room.name)}</h1></div>
      <span class="chip" id="tokinfo"></span></div>
    <div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button class="tab" role="tab" data-t="${k}" type="button">${t}</button>`).join('')}</div>
    <section data-p="layout" class="proj">
      <div class="eyebrow" id="pj-eyebrow"></div>
      <h2 class="pj-title" id="pj-title"></h2>
      <p class="pj-lead" id="pj-lead"></p>
      <div class="keycards" id="pj-cards"></div>
      <div class="chipbar" id="pj-rooms" aria-label="Room"></div>
      <div class="chipbar big" id="vchips" aria-label="Arrangement"></div>
      <div class="winnote readnote" id="readnote" hidden></div>
      <div class="winnote" id="winnote" hidden></div>
      <div class="winnote" id="scalenote" hidden></div>
      <div class="fig" id="fig">
        <div class="figcol figleft"><div class="figcard ref-card" id="ref-card" hidden></div>
          <div class="figcard"><div class="figh"><b id="fig-plan-t">Floor plan</b><span class="cap">SCALE FROM YOUR PLAN · CM</span></div><div id="editor-host"></div></div></div>
        <div class="figcol"><div class="figcard we" id="win-card" hidden></div>
          <div class="figcard"><div class="figh"><b>3D model</b><span class="vviews" id="vviews"></span></div>
            <div class="viewer-wrap" id="vw"><div class="viewer-bar"><span class="grow"></span><button class="btn sm" id="vCeil" type="button" title="Show the ceiling in the eye-level views (off by default, so you can look into the rooms from above)">Ceiling</button><button class="btn sm" id="vTags" type="button">Names</button></div><div class="hint">Drag to rotate · scroll to zoom · right-drag to pan · double-click a wall to colour it</div></div></div></div>
      </div>
      <div class="vtext"><div class="eyebrow" id="vt-eyebrow"></div><h2 id="vt-title"></h2><p id="vt-desc"></p></div>
      <div class="pc2"><div><h3 class="good">Pros</h3><ul id="pj-pros"></ul></div><div><h3 class="bad">Cons</h3><ul id="pj-cons"></ul></div></div>
      <h2 class="pj-h2">Comparison</h2><div class="tbl" id="pj-cmp"></div>
      <h2 class="pj-h2">Pieces in this layout</h2><div class="tbl" id="pj-pieces"></div>
      <details class="allchecks"><summary>Every check, with its measured value</summary><div id="pj-checks"></div></details>
    </section>
    <section data-p="furniture" class="proj" hidden><div id="pf-host"></div></section>
    <section data-p="photos" hidden><div id="photos-host"></div></section>
    <section data-p="downloads" hidden><div class="dl" id="dl"></div><p class="muted small" style="margin-top:12px">3D model files (GLB) are coming soon.</p></section>`
  const planBar = !SHOW ? null : mountPlanBar($('#sc-planbar', el), room.planId, switchPlan, { empty: Boolean(room.empty), plan, onMode: (empty) => { room.empty = empty; room.custom = null; room.products = []; room.option = 'A'; room.base = 'A'; resetLayouts(plan); resetSpace(plan); render() } })
  // a double click on a wall (in the 3D view or on the plan): its colour, kept with the room, drawn at once in the 3D view and in every picture made later
  const paintWalls = (hit) => openWallPaint({ ...hit, at: hit, map: (room.wallColors ||= {}), onApply: (map) => { room.wallColors = map; plan.wallColors = map; cache.clear(); save(); viewer.refresh(); const d = $('#dl', el); if (d) d.innerHTML = '' } })
  const viewer = mountViewer($('#vw', el), plan, { option: room.base, items: current(), look: lookOf(room, plan), onWall: paintWalls })
  cleanup = () => { viewer.dispose(); editor?.destroy() }
  // a plan that prints no measurements has its sizes estimated (cues and doors); say so, and say how to make them exact, until the person has set the scale or hidden the note
  const estimated = plan.scale && plan.scale.source !== 'printed_dimensions' && !(plan._baseScale && Math.abs(plan._baseScale - 1) > 1e-6) && !room.scaleNoteHidden
  if (estimated) { const n = $('#scalenote', el); n.hidden = false; n.innerHTML = `<span><b>The sizes are estimated.</b> This plan prints no measurements, so the scale comes from the doors and fixtures in it (usually within 10 to 15 %). If you know one real length, press <b>Measure</b> on the plan, mark it and set the scale: every size becomes exact.</span><button class="btn sm" id="scalehide" type="button">Got it</button>`; $('#scalehide', el).onclick = () => { room.scaleNoteHidden = true; save(); n.hidden = true } }
  // the rooms the readings of the plan disagreed on, until the person says they checked (the note is drawn again whenever the structure changes)
  const drawReadNote = () => mountReadNote($('#readnote', el), { room, plan, onShow: (i) => setFocus(i), onChecked: () => { room.readChecked = true; save(); $('#rchip', el).innerHTML = readChip(plan, room) } })
  drawReadNote()
  loadFloorPhotos(room).then((n) => { if (n) { cache.clear(); viewer.refresh() } })          // the close-ups of the real floor are loaded, then drawn
  loadModels().then((n) => { if (n) { adoptSizes(); viewer.refresh(); products?.refresh() } })          // products with a model made from their pictures are drawn from it
  const tokinfo = () => { $('#tokinfo', el).textContent = `${state.tokens} ${PUBLIC ? 'credit' : 'token'}${state.tokens === 1 ? '' : 's'} left`; renderHeader() }
  const invalidate = () => { scores = null; const d = $('#dl', el); if (d) d.innerHTML = ''; drawPanel() }

  // ---- chips: which room, which arrangement
  function drawRooms() {
    $('#pj-rooms', el).innerHTML = `<button class="chipx ${focus === null ? 'on' : ''}" data-r="all" type="button">Whole flat</button>` + furnished.map((r) => `<button class="chipx ${focus === r.i ? 'on' : ''}" data-r="${r.i}" type="button">${esc(r.name)}</button>`).join('')
    $$('[data-r]', el).forEach((b) => b.addEventListener('click', () => setFocus(b.dataset.r === 'all' ? null : Number(b.dataset.r))))
  }
  function drawChips() {
    planBar?.update(current())
    const list = [...OPTIONS.map((o) => ({ id: o.id, name: `${o.id} · ${labels[o.id] || o.name}` })), ...(room.custom ? [{ id: 'custom', name: 'Yours · edited by you' }] : [])]
    const best = scores ? Object.entries(scores).filter(([k]) => k !== 'custom').sort((a, b) => a[1] - b[1])[0]?.[0] : null
    $('#vchips', el).innerHTML = list.map((c) => `<button class="chipx lg ${room.option === c.id ? 'on' : ''}" data-opt="${c.id}" type="button">${esc(c.name)}${c.id === best ? ' <span class="rec">RECOMMENDED</span>' : ''}</button>`).join('')
    $$('[data-opt]', el).forEach((b) => b.addEventListener('click', () => setOpt(b.dataset.opt)))
  }
  function setOpt(o) {
    room.option = o; if (o !== 'custom') room.base = o; save(); drawChips()
    editor?.setItems(current()); viewer.setBoth(room.base, current())
    products?.refresh()
    const lost = room.products.filter((p) => !current().some((x) => x.product?.id === p.id)).length
    if (lost) toast(`${lost} piece${lost === 1 ? '' : 's'} from links ${lost === 1 ? 'does' : 'do'} not fit in this arrangement`)
  }
  function setFocus(i) {
    focus = i; scores = null; drawRooms(); editor?.focusRoom(i); viewer.setFocus(i)          // the arrangement names and the recommended one are worked out again for the room in focus
    viewList = i === null ? [] : roomViews(plan, i)
    drawViews()
    if (i === null) viewer.setView('orbit'); else viewer.setCamera(viewList[0])
    drawPanel()
  }
  function drawViews() {
    const list = focus === null ? [['orbit', 'Orbit'], ['top', 'Top']] : viewList.map((v, k) => ['v' + k, v.name])
    $('#vviews', el).innerHTML = list.map(([k, n], j) => `<button class="btn sm ${j === 0 ? 'on' : ''}" data-v="${k}" type="button">${esc(n)}</button>`).join('')
    $$('[data-v]', el).forEach((b) => b.addEventListener('click', () => {
      $$('[data-v]', el).forEach((x) => x.classList.toggle('on', x === b)); const k = b.dataset.v
      if (k === 'orbit' || k === 'top') viewer.setView(k); else viewer.setCamera(viewList[+k.slice(1)])
    }))
  }
  $('#vCeil', el).onclick = (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); viewer.setCeiling(on) }
  $('#vTags', el).onclick = (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); viewer.setTags(on) }

  // ---- the words and numbers, from the measurements of what is on the plan now
  function nameArrangements() {
    labels = {}
    if (focus === null) return
    const kind = space.rooms[focus].kind, seen = new Map(), used = new Map()
    for (const o of OPTIONS) {
      const items = baseItems(o.id), sg = roomSig(items, focus)
      if (seen.has(sg)) { labels[o.id] = `Same as ${seen.get(sg)}`; continue }
      seen.set(sg, o.id)
      const base = optionLabel(kind, items, space, focus) || o.name, n = (used.get(base) || 0) + 1
      used.set(base, n); labels[o.id] = n > 1 ? `${base} (variation ${n})` : base
    }
  }
  function variantReps() {
    if (scores) return scores.reps
    nameArrangements()
    const reps = {}, sc = {}
    for (const o of OPTIONS) { reps[o.id] = validate(plan, baseItems(o.id), { space }); sc[o.id] = score(reps[o.id], focus) }
    if (room.custom) { reps.custom = validate(plan, room.custom, { space }); sc.custom = score(reps.custom, focus) }
    scores = Object.assign(sc, { reps }); return scores.reps
  }
  const li = (arr, empty) => (arr.length ? arr.map((t) => `<li>${esc(t)}</li>`).join('') : `<li class="none">${esc(empty)}</li>`)
  function drawPanel() {
    if (!lastRep) return
    const items = editor ? editor.getItems() : current(), r = focus === null ? null : space.rooms[focus], rep = lastRep
    const facts = focus === null ? { eyebrow: `${room.name} · ${plan.bounds.width.toFixed(1)} × ${plan.bounds.depth.toFixed(1)} m · ${furnished.filter((r) => !r.outdoor).length} rooms${furnished.some((r) => r.outdoor) ? ` and ${furnished.filter((r) => r.outdoor).length} outdoor` : ''}`.toUpperCase(), text: `${furnished.filter((r) => !r.outdoor).length} rooms${furnished.some((r) => r.outdoor) ? ` and ${furnished.filter((r) => r.outdoor).length} outdoor area${furnished.filter((r) => r.outdoor).length > 1 ? 's' : ''}` : ''} are furnished with ${items.filter((i) => !i.floor).length} pieces of furniture. Pick a room above to look at it closely: its plan, a 3D view from each door and the numbers that decide the layout.` } : roomFacts(plan, space, focus)
    $('#pj-eyebrow', el).textContent = facts.eyebrow
    $('#pj-title', el).textContent = focus === null ? 'Layout of the whole flat' : `${r.name}: layout options`
    $('#pj-lead', el).textContent = facts.text
    const cards = focus === null ? flatCards(items, rep, space) : keyCards(r.kind, items, rep, space, focus)
    $('#pj-cards', el).innerHTML = cards.map((c) => `<div class="kc"><span class="q">${esc(c.q)}</span><b>${esc(c.a)}</b><p>${esc(c.sub || '')}</p></div>`).join('')
    $('#fig-plan-t', el).textContent = `Floor plan · ${room.option === 'custom' ? 'your layout' : 'option ' + room.option}`
    const opt = OPTIONS.find((o) => o.id === room.base) || OPTIONS[0], pc = prosCons(rep, focus)
    $('#vt-eyebrow', el).textContent = (room.option === 'custom' ? 'YOUR LAYOUT · STARTED FROM ARRANGEMENT ' + opt.id : 'ARRANGEMENT ' + opt.id + (labels[opt.id] ? ' · ' + labels[opt.id].toUpperCase() : ''))
    $('#vt-title', el).textContent = cards[0] ? `${cards[0].a}${cards[1] ? ' · ' + cards[1].a : ''}` : opt.name
    $('#vt-desc', el).textContent = room.option === 'custom' ? 'Your own arrangement. After every move the whole plan is measured again, so the numbers, the pros and cons and the table below always describe what you see.' : opt.blurb + ' ' + (cards[0]?.sub || '')
    $('#pj-pros', el).innerHTML = li(pc.pros, 'Nothing stands out yet.'); $('#pj-cons', el).innerHTML = li(pc.cons, 'Nothing is tight in this arrangement.')
    $('#pj-pieces', el).innerHTML = focus === null ? '<p class="muted">Pick a room to see its pieces.</p>' : `<table><thead><tr><th>Piece</th><th>Size (W × D × H)</th><th>Where</th></tr></thead><tbody>${piecesRows(items, space, focus).map((p) => `<tr><td class="k">${esc(p.name)}</td><td class="mono">${esc(p.size)}</td><td>${esc(p.where)}</td></tr>`).join('')}</tbody></table>`
    const groups = rep.rooms.filter((g) => focus === null || g.i === focus).map((g) => ({ ...g, list: g.checks.filter((c) => c.value !== undefined || c.level !== 'ok') })).filter((g) => g.list.length)
    $('#pj-checks', el).innerHTML = groups.map((g) => `<div class="chkgrp"><b>${esc(g.name)}</b><ul>${g.list.map((c) => `<li class="${c.level}"><span class="dot"></span>${esc(c.label)}</li>`).join('')}</ul></div>`).join('') || '<p class="muted">No checks for this room.</p>'
    clearTimeout(drawPanel.t); drawPanel.t = setTimeout(drawCompare, 60)
  }
  function drawCompare() {
    const host = $('#pj-cmp', el); if (!host.isConnected) return
    const reps = variantReps(), list = [...OPTIONS.map((o) => ({ id: o.id, name: `${o.id} · ${labels[o.id] || o.name}`, rep: reps[o.id], items: baseItems(o.id) })), ...(room.custom ? [{ id: 'custom', name: 'Yours', rep: reps.custom, items: room.custom }] : [])]
    drawChips()
    const kind = focus === null ? 'flat' : space.rooms[focus].kind
    const rows = focus === null ? [{ label: 'Problems', cells: list.map((v) => { const e = v.rep.counts.error; return { text: e ? String(e) : 'none', level: e ? 'error' : 'ok' } }) }, { label: 'Tight spots', cells: list.map((v) => { const w = v.rep.counts.warn; return { text: w ? String(w) : 'none', level: w ? 'warn' : 'ok' } }) }, { label: 'Pieces', cells: list.map((v) => ({ text: String(v.items.filter((x) => !x.floor).length), level: 'none' })) }] : compareRows(kind, list, focus)
    host.innerHTML = `<table><thead><tr><th></th>${list.map((v) => `<th class="${room.option === v.id ? 'cur' : ''}">${esc(v.name)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><td class="k">${esc(r.label)}</td>${r.cells.map((c) => `<td class="${c.level} mono">${esc(c.text)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  }

  // ---- the plan was changed in the editor (windows, doors, room types, scale): the walls are cut again, every check is repeated, the furniture stays where it is
  // until the person asks to fit it again (locked pieces always stay where they are)
  const rankOf = (id) => (OPTIONS.find((o) => o.id === id) || OPTIONS[0]).rank
  const saveEdits = () => {
    const struct = room.edits?.struct
    room.edits = { scale: plan._baseScale || 1, openings: plan.openings.map((o) => ({ ...o })), rooms: Object.fromEntries(plan.rooms.map((r) => [r.id, { name: r.name, ...(r.userKind ? { userKind: r.userKind } : {}) }])), ...(struct ? { struct } : {}) }
    delete room.windows; save()
  }
  // ---- rooms deleted, or two rooms joined by taking the wall between them away (layout/planops.js): the walls are worked out again, every check is repeated, the furniture of the rooms that are left stays,
  // and the state before the change is kept so that it can be undone (room.edits.struct: { current, undo: [...] })
  function afterStructure(r) {
    room.products = (room.products || []).map((p) => (r.mapped?.[p.roomId] ? { ...p, roomId: r.mapped[p.roomId] } : p)).filter((p) => plan.rooms.some((x) => x.id === p.roomId))          // a piece in a room that is gone goes with it
    recutWalls(plan); resetLayouts(plan); resetSpace(plan)
    if (room.custom) {          // your own arrangement: the pieces that stand in a room of the new plan stay where they are, a room that has none gets the arrangement it started from
      const sp = buildSpace(plan), again = new Set((r.reshaped || []).map((id) => plan.rooms.findIndex((x) => x.id === id))), kept = room.custom.map((it) => ({ ...it, room: roomIndexAt(sp, it.x, it.z) })).filter((it) => it.room >= 0 && (!again.has(it.room) || it.locked)), have = new Set(kept.map((it) => it.room))
      room.custom = [...kept, ...layoutFor(plan, room.base).filter((it) => !have.has(it.room))]
    }
    saveEdits(); cache.clear(); render()
  }
  function structureChanged(op) {
    const before = snapshot(plan)
    const r = op.op === 'delete' ? deleteRoom(plan, op.room) : op.op === 'merge' ? mergeRooms(plan, op.rooms[0], op.rooms[1]) : op.op === 'add' ? addRoom(plan, op.polygon, { name: op.name, kind: op.kind }) : op.op === 'reshape' ? reshapeRooms(plan, op.changes, op.edit) : op.op === 'square' ? squareUp(plan, op.ids, op.angle ? { angle: op.angle } : {}) : { ok: false, error: 'That change is not known.' }
    if (!r.ok) { toast(r.error); return r }
    const st = room.edits?.struct || { undo: [] }; st.undo = [...st.undo, before].slice(-12); st.current = snapshot(plan)
    room.edits = { ...(room.edits || {}), struct: st }
    const gone = r.openingsDropped ? `, with ${r.openingsDropped} door${r.openingsDropped > 1 ? 's' : ''} or window${r.openingsDropped > 1 ? 's' : ''}` : ''
    if (op.op === 'reshape' || op.op === 'square') carry = { room: room.id, focusId: op.focusId, reshape: op.op === 'reshape' || Boolean(op.reshape) }
    if (op.op === 'reshape') { if (op.edit) room.wallColors = remapWallColors(room.wallColors, op.changes[0].id, op.edit) }
    toast(op.op === 'square' ? `${r.squared} room${r.squared === 1 ? '' : 's'} squared up${r.skipped && r.skipped.length ? `; ${r.skipped.join(', ')} left as ${r.skipped.length === 1 ? 'it was' : 'they were'}` : ''}${r.hint ? '. ' + r.hint : ''}${gone}` : op.op === 'reshape' ? `${r.name} reshaped${gone}` : op.op === 'delete' ? `${r.name} deleted${gone}` : op.op === 'add' ? `${r.name} added. Add its doors with Add a piece, then Door.` : `${r.joined[0]} and ${r.joined[1]} are one room now${gone}`)
    afterStructure(r); return r
  }
  function undoStructure() {
    const st = room.edits?.struct; if (!st?.undo?.length) return
    restoreSnapshot(plan, st.undo[st.undo.length - 1]); st.undo = st.undo.slice(0, -1); st.current = snapshot(plan)
    const sc = room.edits.scale, base = plan._baseScale || 1; if (sc && Math.abs(sc - base) > 1e-6) scalePlan(plan, sc / base)          // the scale the person set stays
    toast('Undone'); afterStructure({ mapped: {} })
  }
  function setSpace(sp) { space = sp; furnished = space.rooms.filter((r) => r.kind !== 'none') }
  function spaceChanged(sp) {          // the door views are made again, the 3D view cuts the walls again
    setSpace(sp); scores = null; resetSpace(plan)
    if (focus !== null) viewList = roomViews(plan, focus)
    viewer.refresh(); const d = $('#dl', el); if (d) d.innerHTML = ''
  }
  function afterRefit(msg, all = true) {
    save(); scores = null; if (all) $('#winnote', el).hidden = true
    editor?.setItems(current()); viewer.setBoth(room.base, current()); drawChips(); drawPanel(); toast(msg)
  }
  const keptNote = (n) => (n ? `, ${n} locked piece${n > 1 ? 's' : ''} kept` : '')
  function refitAll() {
    resetLayouts(plan); layoutFor(plan, room.base)          // (the three arrangements are worked out again first: a room is fitted with the arrangement it showed under that letter)
    const cur = editor ? editor.getItems() : current(), keep = cur.filter((i) => i.locked)
    if (!room.custom && !keep.length) { room.custom = null; room.option = room.base }
    else { room.custom = layoutPlan(plan, { rank: rankOf(room.base), space, keep }).items; room.option = 'custom' }
    afterRefit('Furniture fitted again' + keptNote(keep.length))
  }
  function refitRoomNow(i) {
    layoutFor(plan, room.base)
    const cur = editor ? editor.getItems() : current(), locks = cur.filter((x) => x.room === i && x.locked).length
    room.custom = refitRoom(plan, cur, i, { rank: rankOf(room.base), space }); room.option = 'custom'
    afterRefit(`${space.rooms[i].name} fitted again${keptNote(locks)}`, false)
  }
  function planChanged(sp) {
    spaceChanged(sp); saveEdits()
    const n = $('#winnote', el); n.hidden = false
    n.innerHTML = `<span><b>The plan changed.</b> The walls were cut again and every check was repeated. The furniture stays where it is${room.custom ? ', so your own edits are kept' : ''}. Fit it again to use the new plan${room.custom ? ' (this replaces your edits, but locked pieces stay where they are)' : ''}.</span><button class="btn sm" id="refit" type="button">Re-fit the furniture</button>`
    $('#refit', el).onclick = refitAll
  }
  function roomEdited(i, sp, kindChanged) {          // a room got another name or kind: a new kind needs its own furniture
    setSpace(sp); resetLayouts(plan); saveEdits(); scores = null; drawRooms()
    if (kindChanged) refitRoomNow(i); else { drawPanel(); editor?.refresh(sp) }
  }
  function scaled(f, sp, items) {          // the whole plan was stretched: everything is measured and fitted again, locked pieces keep their (scaled) place
    spaceChanged(sp); resetLayouts(plan); layoutFor(plan, room.base); saveEdits()
    const keep = items.filter((i) => i.locked)
    if (room.option !== 'custom' && !keep.length) { room.custom = null; room.option = room.base }
    else { room.custom = layoutPlan(plan, { rank: rankOf(room.base), space, keep }).items; room.option = 'custom' }
    if (focus === null) viewer.setView('orbit'); else if (viewList[0]) viewer.setCamera(viewList[0])
    afterRefit(`Scale set (x${f.toFixed(3)}). The furniture was fitted again` + keptNote(keep.length))
  }
  // ---- the editor and the 3D view stay in step
  const startEditor = () => {
    if (editor) return
    editor = mountEditor($('#editor-host', el), {
      plan, space, items: current(), focus, windowHost: $('#win-card', el), refHost: $('#ref-card', el),
      windowTemplates: {
        list: () => (state.windowTemplates ||= []),
        add: (t) => { state.windowTemplates = [...(state.windowTemplates || []).filter((x) => !(x.name === t.name && x.width === t.width && x.height === t.height && x.sill === t.sill)), t].slice(-12); save(); toast('Window template saved') },
        remove: (id) => { state.windowTemplates = (state.windowTemplates || []).filter((x) => x.id !== id); save() },
      },
      onReport: (rep) => { lastRep = rep; drawPanel() }, onWall: paintWalls,
      onAddFromLink: () => { showTab('furniture'); setTimeout(() => $('#pf-link', el)?.focus(), 50) },
      original: room.original || null, startReshape: carried && carried.reshape ? true : null,
      onAttachOriginal: async (file) => {          // the picture the person uploaded, added to a room that was made without it (the same small picture a new upload keeps)
        const url = URL.createObjectURL(file)
        try { room.original = { image: await referencePicture(url) }; save(); editor.setOriginal(room.original); toast('The original plan is added') } finally { URL.revokeObjectURL(url) }
      },
      onStructure: structureChanged, structUndo: () => room.edits?.struct?.undo?.length || 0, onStructureUndo: undoStructure,
      onPlan: planChanged, onRoomEdit: roomEdited, onRefitRoom: refitRoomNow, onScale: scaled,
      onChange: (items) => { room.custom = items; room.option = 'custom'; save(); scores = null; drawChips(); viewer.setBoth(room.base, items); const d = $('#dl', el); if (d) d.innerHTML = '' },
    })
  }
  const showTab = (t) => {
    $$('.tab', el).forEach((b) => b.classList.toggle('sel', b.dataset.t === t)); $$('[data-p]', el).forEach((s) => { s.hidden = s.dataset.p !== t })
    if (t === 'layout') { startEditor(); if (!viewList.length && focus !== null) setFocus(focus) }
    if (t === 'downloads') buildDownloads(); if (t === 'photos') photosPanel($('#photos-host', el), room, plan, { onApply: applyLook })
  }
  $$('.tab', el).forEach((b) => b.addEventListener('click', () => showTab(b.dataset.t)))
  if (SHOW) { const b = document.createElement('button'); b.type = 'button'; b.id = 'vIkea'; b.className = 'btn sm primary'; b.textContent = '+ IKEA'; b.onclick = () => { showTab('furniture'); $('.tabs', el).scrollIntoView({ behavior: 'smooth', block: 'start' }) }; $('.viewer-bar', el).insertBefore(b, $('#vCeil', el)) }          // the way to the furniture, right on the 3D view
  function applyLook() { viewer.setLook(lookOf(room, plan)); invalidate(); showTab('photos') }
  function buildDownloads() {
    const host = $('#dl', el), vs = views(plan)
    host.innerHTML = vs.map((v, i) => `<div class="card"><img data-v="${i}" alt="${esc(v.name)}"><b>${esc(v.name)}</b><button class="btn" data-dl="${i}" type="button">Download HD (2560 x 1440)</button></div>`).join('')
    vs.forEach((v, i) => setTimeout(() => { $(`img[data-v="${i}"]`, host).src = cleanThumb(plan, room, room.option, i) }, i * 30))
    $$('[data-dl]', host).forEach((b) => b.addEventListener('click', () => {
      const v = vs[+b.dataset.dl]; b.disabled = true; b.textContent = 'Rendering...'
      setTimeout(() => {
        renderStill(plan, { option: room.base, view: v, width: 2560, height: 1440, look: lookOf(room, plan), items: room.option === 'custom' ? room.custom : null }).toBlob((blob) => {
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${room.name.replace(/\W+/g, '-')}-${v.id}-${room.option}.png`; a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 4000); b.disabled = false; b.textContent = 'Download HD (2560 x 1440)'
        }, 'image/png')
      }, 40)
    }))
  }

  // ---- furniture from links: a product is a real piece of the layout at the exact size of the page (room.products keeps them, plan._overrides / plan._extras tell the engine)
  // "instead of" the room's own piece of that type: the room is arranged around the product; "extra": added where it fits. A layout the person edited is changed by hand instead.
  const rankNow = () => rankOf(room.base)
  const hasProduct = (items, id) => items.some((i) => i.product?.id === id)
  function tryProduct(p, i) {
    const spec = productSpec(p), res = { ok: true, custom: undefined }
    if (room.custom) {
      let next = null
      if (p.mode === 'extra') { const it = addProductTo(plan, room.custom, i, spec, { space }); next = it ? [...room.custom, it] : null }
      else next = swapProduct(plan, room.custom, i, spec, { space }) || refitRoom(plan, room.custom, i, { rank: rankNow(), space })
      if (next && hasProduct(next, p.id)) res.custom = next
      else if (room.option === 'custom') res.ok = false
    }
    if (room.option !== 'custom' && !hasProduct(layoutFor(plan, room.base), p.id)) res.ok = false
    if (!res.ok) res.message = p.mode === 'extra' ? `There is no free spot for this piece in ${space.rooms[i].name} with its clear space and the walking routes kept. Try another room, or use it instead of the room's own piece.` : `${space.rooms[i].name} cannot be arranged around this piece without blocking a door, a window or the way through. Try adding it as an extra piece, or another room.`
    return res
  }
  const askToken = () => new Promise((res) => openModal(`<h2>Add this piece for 1 token?</h2><p class="muted">Your ${room.slots} included places are used. You have ${state.tokens} token${state.tokens === 1 ? '' : 's'}. Removing a piece later keeps its place, so you can swap pieces without paying again.</p><div class="row"><button class="btn" id="no" type="button">Cancel</button><button class="btn primary" id="yes" type="button">Use 1 token</button></div>`, (m, close) => { $('#no', m).onclick = () => { close(); res(false) }; $('#yes', m).onclick = () => { res(true); close() } }, () => res(false)))
  // a model that knows the whole size of a set (a sofa with its chaise) corrects stored pieces that still have the page's partial size (layout/products.js withModelSize)
  function adoptSizes() {
    const fixed = []
    room.products = room.products.map((p) => { const q = withModelSize(p, MODELS.get(modelKeyOf(p.link))); if (q !== p) fixed.push(q); return q })
    if (!fixed.length) return 0
    applyProducts(plan, room.products)
    if (room.custom) for (const q of fixed) { const i = plan.rooms.findIndex((r) => r.id === q.roomId); if (i >= 0) room.custom = refitRoom(plan, room.custom.map((x) => (x.product?.id === q.id ? { ...x, locked: false } : x)), i, { rank: rankNow(), space }) }
    productsShown(); toast(`${fixed.map((q) => q.name).join(', ')}: the size is now the whole piece (${fixed.map((q) => [q.dims.w, q.dims.d, q.dims.h].map((v) => Math.round(v * 100)).join(' × ')).join('; ')} cm)`)
    return fixed.length
  }
  function productsShown() { save(); editor?.setItems(current()); viewer.setBoth(room.base, current()); drawChips(); invalidate(); products?.refresh() }
  async function addProduct(p) {
    const i = plan.rooms.findIndex((r) => r.id === p.roomId); if (i < 0) return { ok: false, message: 'That room is gone.' }
    const before = room.products, swapped = before.find((q) => p.mode === 'replace' && q.mode === 'replace' && q.roomId === p.roomId && q.type === p.type)
    const next = [...before.filter((q) => q !== swapped), p]
    if (next.length > (SHOW ? 14 : MAX_PIECES)) return { ok: false, message: SHOW ? TX.limit : `Up to ${MAX_PIECES} pieces per room in this prototype. Remove one first.` }
    applyProducts(plan, next)          // tried before anything is paid
    const out = tryProduct(p, i)
    if (!out.ok) { applyProducts(plan, before); return out }
    if (!PUBLIC && !SHOW && next.length > room.slots) {
      if (state.tokens < 1) { applyProducts(plan, before); openModal(`<h2>This piece costs 1 token</h2><p class="muted">Your ${room.slots} included places are used. You have 0 tokens.</p><div class="row"><a class="btn primary" href="#/buy?return=${encodeURIComponent('/room/' + room.id)}" data-close>How to get tokens</a></div>`, (m, close) => $$('[data-close]', m).forEach((a) => a.addEventListener('click', close))); return { ok: false } }
      if (!(await askToken())) { applyProducts(plan, before); return { ok: false } }
      state.tokens -= 1; room.slots += 1; tokinfo()
    }
    room.products = next
    if (out.custom) room.custom = swapped && room.custom ? out.custom.filter((x) => x.product?.id !== swapped.id) : out.custom
    else if (swapped && room.custom) room.custom = room.custom.filter((x) => x.product?.id !== swapped.id)
    productsShown()
    return { ok: true, message: p.mode === 'replace' ? `${p.name} is now the ${p.type.replace(/_/g, ' ')} of ${space.rooms[i].name}` : `${p.name} placed in ${space.rooms[i].name}` }
  }
  async function removeProduct(id) {
    const p = room.products.find((q) => q.id === id); if (!p) return
    room.products = room.products.filter((q) => q.id !== id); applyProducts(plan, room.products)
    if (room.custom) {
      const i = plan.rooms.findIndex((r) => r.id === p.roomId)
      room.custom = p.mode === 'extra' || i < 0 ? room.custom.filter((x) => x.product?.id !== id) : refitRoom(plan, room.custom.map((x) => (x.product?.id === id ? { ...x, locked: false } : x)), i, { rank: rankNow(), space })
    }
    productsShown(); toast('Piece removed')
  }
  const products = (SHOW ? mountShowcaseFurniture : mountProducts)($('#pf-host', el), {
    rooms: () => furnished.map((r) => ({ id: plan.rooms[r.i].id, i: r.i, name: r.name, kind: r.kind })),
    focusRoom: () => focus, hasType: (i, type) => i >= 0 && current().some((x) => x.room === i && x.type === type),
    list: () => room.products, slots: () => ({ used: room.products.length, paid: room.slots, max: MAX_PIECES }), placed: (id) => hasProduct(current(), id),
    add: addProduct, remove: removeProduct, toast,
    modelsChanged: () => { adoptSizes(); viewer.refresh(); products?.refresh() }, reloadModels: async () => { await reloadModels(); adoptSizes(); viewer.refresh(); products?.refresh() },          // a model was made: the pieces are drawn again
    pick: async (d) => {          // the person clicks the spot on the plan: the plan opens on the room of the piece with a ghost of it at its true size
      const i = plan.rooms.findIndex((r) => r.id === d.roomId); if (i < 0) return null
      showTab('layout'); setFocus(i); await sleep(300); startEditor()
      $('#editor-host', el).scrollIntoView({ block: 'center', behavior: 'smooth' })
      const spot = await editor.pickSpot({ type: d.type, w: d.dims.w, d: d.dims.d, h: d.dims.h, name: d.name, roomIndex: i })
      if (!spot) showTab('furniture')          // cancelled: back to the card
      return spot
    },
    show: (p) => {          // the plan with the room of this piece in focus and the piece selected, ready to drag
      const i = plan.rooms.findIndex((r) => r.id === p.roomId); if (i < 0) return
      showTab('layout'); setFocus(i)
      setTimeout(() => { const it = current().find((x) => x.product?.id === p.id); if (it) editor?.select(it.id); $('#editor-host', el).scrollIntoView({ block: 'center', behavior: 'smooth' }) }, 250)
    },
  })

  drawRooms(); drawChips(); tokinfo(); showTab('layout'); setFocus(focus)
}

// ---------- property photos: read the real flat's style from photos so the 3D room matches it ----------
const hex = (n) => (typeof n === 'string' ? n : '#' + n.toString(16).padStart(6, '0'))
async function shrink(url, max = 1024) {   // photos go to the server as modest JPEGs
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.85)
}
function photosPanel(host, room, plan, { onApply }) {
  const list = photoStore.get(room.id) || []; photoStore.set(room.id, list)
  const MAXP = 30
  host.innerHTML = `<p class="section-sub" style="margin-top:0">Add photos of the real flat (agent photos, your own phone photos). We read the floors, walls, doors, curtains, upholstery, wood and cabinets, so the 3D room uses the real materials and colours instead of a stock palette. More photos of more rooms make it more accurate.</p>
    <label class="drop mini" id="pdrop" tabindex="0">${ICON.upload}<span class="big">Add photos, or drop them here</span><span class="muted">JPG, PNG or WebP, up to ${MAXP} photos</span><span class="err" id="perr" role="alert"></span>
      <input id="pfile" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></label>
    ${room.planId === 'plan2' && !list.length ? '<p class="muted small" style="margin-top:10px">No photos at hand? <button class="link" id="psample" type="button">Use the 20 listing photos of this flat</button></p>' : ''}
    <div class="pgrid" id="pgrid"></div><div class="row" id="pbar" style="justify-content:flex-start;margin-top:14px"></div><div id="pres"></div><div id="pfloor" style="margin-top:26px"></div>`
  const grid = $('#pgrid', host), bar = $('#pbar', host), res = $('#pres', host), err = $('#perr', host)
  const drawGrid = () => {
    grid.innerHTML = list.map((p, i) => `<div class="pthumb"><img src="${esc(p.url)}" alt="${esc(p.name)}"><button type="button" data-rm="${i}" aria-label="Remove photo">&times;</button></div>`).join('')
    $$('[data-rm]', grid).forEach((b) => b.addEventListener('click', () => { list.splice(+b.dataset.rm, 1); drawGrid() }))
    bar.innerHTML = list.length ? `<button class="btn primary" id="pread" type="button">${room.style ? 'Read the photos again' : 'Read my photos'} (${list.length})</button><span class="muted small">${list.length} photo${list.length === 1 ? '' : 's'}</span>` : ''
    if (list.length) $('#pread', host).onclick = read
  }
  const add = (files) => {
    err.textContent = ''
    for (const f of files) {
      if (list.length >= MAXP) { err.textContent = `Up to ${MAXP} photos.`; break }
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { err.textContent = 'Photos must be JPG, PNG or WebP.'; continue }
      if (f.size > 15 * 1024 * 1024) { err.textContent = 'A photo is larger than 15 MB.'; continue }
      list.push({ name: f.name, url: URL.createObjectURL(f) })
    }
    drawGrid()
  }
  const file = $('#pfile', host), drop = $('#pdrop', host)
  file.addEventListener('change', () => { add([...file.files]); file.value = '' })
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click() } })
  ;['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over') }))
  ;['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over') }))
  drop.addEventListener('drop', (e) => add([...e.dataTransfer.files]))
  $('#psample', host)?.addEventListener('click', async () => {
    const names = await fetch('./data/photos-plan2/index.json').then((r) => r.json())
    names.forEach((n) => list.push({ name: n, url: './data/photos-plan2/' + n, sample: true })); drawGrid(); $('#psample', host)?.parentElement.remove()
  })

  async function read() {
    const btn = $('#pread', host); btn.disabled = true
    const steps = ['Sorting the photos by room', 'Reading floors, walls and doors', 'Reading furniture, fabrics and wood', 'Matching colours']
    const ul = document.createElement('ul'); ul.className = 'psteps'; ul.innerHTML = steps.map((t) => `<li><i></i><span>${t}</span></li>`).join(''); res.innerHTML = ''; res.appendChild(ul)
    const lis = $$('li', ul); let i = 0
    const tick = setInterval(() => { if (i > 0) lis[i - 1].className = 'done'; if (i < lis.length) lis[i++].className = 'on' }, 700); lis[0].className = 'on'; i = 1
    try {
      let style, note
      if (PUBLIC) throw new Error('Reading property photos is not available in the public version yet. The close-up of your floor and the colours you choose yourself work as usual.')          // a paid reading that is not part of the public launch
      if (list.every((p) => p.sample)) {                        // the sample flat: read ahead of time from these very photos
        await sleep(2800); style = await fetch('./data/style-plan2.json').then((r) => r.json()); note = 'Sample: this flat\u2019s photos were read ahead of time.'
      } else {
        const images = []; for (const p of list) images.push(await shrink(p.url))
        const r = await fetch('/api/style-from-photos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ images }) })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error === 'spend_disabled' ? 'Reading your own photos is not connected in this prototype yet: it needs the paid Claude API. The 20 sample photos of the 180 m\u00b2 flat work.' : (j.message || 'Could not read the photos.'))
        style = j.style; note = 'Read from your photos.'
      }
      clearInterval(tick); room.style = style; room.styleNote = note; room.match = true; room.styleV = (room.styleV || 0) + 1; cache.clear(); save(); drawGrid(); drawStyle(); onApply?.()
    } catch (e) { clearInterval(tick); res.innerHTML = `<p class="err-box">${esc(e.message)}</p>`; btn.disabled = false }
  }

  function drawStyle() {
    if (!room.style) { res.innerHTML = ''; return }
    const cards = summary(room.style).map((r) => `<div class="card scard"><b>${esc(r.label)}</b>
      <div class="swrows">${r.swatches.map(([k, c, t]) => `<div><i style="background:${esc(c)}"></i><span>${esc(k)}</span><small>${esc(t || c)}</small></div>`).join('')}</div>
      ${r.pieces.length ? `<small class="muted">${r.pieces.map(esc).join(' &middot; ')}</small>` : ''}</div>`).join('')
    res.innerHTML = `<div class="row" style="justify-content:space-between;margin:18px 0 10px"><div><h3>Your property's style</h3><p class="muted small">${esc(room.styleNote || '')} Confidence ${Math.round((room.style.confidence || 0) * 100)}%.</p></div>
      <div style="display:grid;gap:6px"><label class="check"><input type="checkbox" id="pmatch" ${room.match ? 'checked' : ''}> Match my property in the 3D room</label>
      <label class="check"><input type="checkbox" id="pall" ${room.floorAll !== false ? 'checked' : ''}> Same floor in the rooms the photos did not show</label></div></div>
      <div class="stylecards">${cards}</div>
      ${(room.style.missing || []).length ? `<p class="muted small" style="margin-top:10px">Not seen in the photos: ${room.style.missing.map(esc).join('; ')}. Those rooms keep the stock look.</p>` : ''}`
    $('#pmatch', res).onchange = (e) => { room.match = e.target.checked; room.styleV = (room.styleV || 0) + 1; cache.clear(); save(); onApply?.() }
    $('#pall', res).onchange = (e) => { room.floorAll = e.target.checked; room.styleV = (room.styleV || 0) + 1; cache.clear(); save(); onApply?.() }
  }
  drawGrid(); drawStyle()
  mountFloorPhotos($('#pfloor', host), { room, plan, toast, onChange: () => { room.styleV = (room.styleV || 0) + 1; cache.clear(); save(); onApply?.() } })
}

// ---------- screen: tokens ----------
// Nothing is sold in the app: a client gets tokens from us, by hand (screenCredits says so). The link #/buy stays so that the header pill and the old links still land on this page.
const screenBuy = (el) => screenCredits(el)

// ---------- screen: my rooms ----------
function screenRooms(el) {
  if (!state.user) { el.innerHTML = '<div class="empty"><h2>Sign in to see your rooms</h2><button class="btn primary" id="si" type="button">Sign in</button></div>'; $('#si', el).onclick = () => openAuth({ onDone: render }); return }
  if (!state.rooms.length) { el.innerHTML = '<div class="empty"><h2>No rooms yet</h2><p class="muted">Upload a floor plan to make your first one.</p><a class="btn primary" href="#/">Upload a plan</a></div>'; return }
  el.innerHTML = `<h1>My rooms</h1><div class="rooms-grid">${state.rooms.map((r) => `<a class="rcard card" href="#/room/${r.id}"><div class="img"><div class="skeleton"></div><img data-r="${r.id}" alt="" hidden></div>
    <div class="meta"><b>${esc(r.name)}</b><span class="chip ${r.status === 'unlocked' ? 'ok' : ''}">${r.status === 'unlocked' ? 'Unlocked' : 'Preview'}</span></div></a>`).join('')}</div>`
  state.rooms.forEach((r, i) => getPlan(r.planId || 'sample').then((plan) => setTimeout(() => {
    const im = $(`img[data-r="${r.id}"]`, el); if (!im) return
    applyProducts(plan, r.products || [])
    const c = renderStill(plan, { option: r.option === 'custom' ? r.base || 'A' : r.option || 'A', items: r.option === 'custom' ? r.custom : null, view: views(plan)[0], width: 480, height: 270, look: lookOf(r, plan) })
    im.src = (r.status === 'unlocked' ? c : watermark(c, 'PREVIEW')).toDataURL('image/jpeg', 0.8); im.hidden = false; im.previousElementSibling?.remove()
  }, i * 40)))
}

if (DEMO) {
  if (!state.user) state.user = { email: 'demo@swiftrix.eu' }
  if (!state.rooms.some((r) => r.id === 'demo-' + DEMO)) state.rooms.unshift({ id: 'demo-' + DEMO, demo: DEMO, name: { plan2: 'Apartment with terrace, 180 m²', aruodas: 'Real plan, 178 m²', palanga: 'Palanga apartment, 85 m²' }[DEMO] || 'Sample apartment', planId: DEMO, createdAt: Date.now(), status: 'unlocked', option: 'A', products: [] })
  state.tokens = Math.max(state.tokens, 5); save()
  if (!/^#\/(room\/|rooms$)/.test(location.hash)) location.hash = '#/room/demo-' + DEMO          // a link to #/rooms opens the list of the rooms in this demo; anything else opens the demo room itself
}
if (SHOW) { state.user = { email: 'showcase' }; document.body.classList.add('sc-mode') }
if (PUBLIC) publicInit()
render()
