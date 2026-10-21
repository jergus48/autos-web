// A close-up photo of the real floor, added in the photos tab: it becomes the floor of the rooms the person chooses (viewer/floortex.js tiles it with mirrored edges, after taking the light out of it).
// room.floorPhotos = [{ id, name, url (a small JPEG as a data URL, kept with the room), widthCm (what the longer side of the photo covers), turns (quarter turns), rooms: '*' | a room id }]
import { loadFloorPhoto } from '../viewer/floortex.js'

export const MAX_FLOOR_PHOTOS = 4
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// the photos of a room are loaded ahead of the scene (it is built in one go): how many are there now
export async function loadFloorPhotos(room) {
  let n = 0
  for (const p of room.floorPhotos || []) { try { await loadFloorPhoto(p.url, p.turns || 0); n++ } catch { /* a picture that no longer loads is simply not used */ } }
  return n
}

// a file or a data URL -> a small JPEG data URL (a close-up does not need more than 640 pixels to show its grain; the room keeps it in the browser)
export async function shrinkPhoto(src, max = 640) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.86)
}

export function mountFloorPhotos(host, { room, plan, onChange, toast = () => {} }) {
  const list = (room.floorPhotos ||= [])
  let pending = null
  const target = (p) => (p.rooms === '*' ? 'the rooms that share the main floor' : (plan.rooms.find((r) => r.id === p.rooms) || {}).name || 'a room that is gone')
  host.innerHTML = `<section class="fp card"><h3>A close-up of the real floor</h3>
    <p class="muted small">For the exact look. Take a photo straight down at the floor, about one metre across, in even light: no sun streaks, no shadows, nothing standing on it. It becomes the floor of the rooms you choose, repeated across them, so the grain and the colours are the real ones.</p>
    <label class="drop mini" id="fpdrop" tabindex="0"><span class="big">Add a close-up of the floor</span><span class="muted">JPG, PNG or WebP</span><span class="err" id="fperr" role="alert"></span><input id="fpfile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
    <div class="fp-opts" id="fpopts" hidden><img id="fpprev" alt="Your close-up of the floor">
      <div class="fp-fields"><label>The longer side of the photo shows about <input type="number" id="fpw" min="20" max="400" step="5" value="100" aria-label="Centimetres"> cm</label>
        <label>Use it for <select id="fpfor"><option value="*">the rooms that share the main floor</option>${plan.rooms.map((r) => `<option value="${esc(r.id)}">${esc(r.name)} only</option>`).join('')}</select></label>
        <div class="row" style="justify-content:flex-start"><button class="btn primary" id="fpadd" type="button">Use this floor</button><button class="btn" id="fpcancel" type="button">Cancel</button></div></div></div>
    <div class="fp-list" id="fplist"></div></section>`
  const $ = (s) => host.querySelector(s), err = $('#fperr'), file = $('#fpfile'), drop = $('#fpdrop')
  const drawList = () => {
    $('#fplist').innerHTML = list.map((p, i) => `<div class="fp-item"><img src="${esc(p.url)}" alt="" style="transform:rotate(${(p.turns || 0) * 90}deg)"><div><b>${esc(p.name)}</b><small class="muted">about ${p.widthCm} cm across · for ${esc(target(p))}</small></div>
      <span class="selbtns"><button class="btn sm" type="button" data-turn="${i}" title="Turn the floor a quarter turn, so the boards run the other way">Turn</button><button class="btn sm" type="button" data-rm="${i}">Remove</button></span></div>`).join('')
    host.querySelectorAll('[data-turn]').forEach((b) => (b.onclick = async () => { const p = list[+b.dataset.turn]; p.turns = ((p.turns || 0) + 1) % 4; await loadFloorPhoto(p.url, p.turns); onChange() }))
    host.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { list.splice(+b.dataset.rm, 1); onChange() }))
  }
  const pick = async (files) => {
    err.textContent = ''; const f = files[0]; if (!f) return
    if (list.length >= MAX_FLOOR_PHOTOS) { err.textContent = `Up to ${MAX_FLOOR_PHOTOS} close-ups.`; return }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { err.textContent = 'The photo must be JPG, PNG or WebP.'; return }
    if (f.size > 15 * 1024 * 1024) { err.textContent = 'The photo is larger than 15 MB.'; return }
    try { const u = URL.createObjectURL(f); pending = { name: f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Floor', url: await shrinkPhoto(u) }; URL.revokeObjectURL(u) } catch { err.textContent = 'The photo could not be read.'; return }
    $('#fpprev').src = pending.url; $('#fpopts').hidden = false
  }
  file.addEventListener('change', () => { pick([...file.files]); file.value = '' })
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click() } })
  ;['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over') }))
  ;['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over') }))
  drop.addEventListener('drop', (e) => pick([...e.dataTransfer.files]))
  $('#fpcancel').onclick = () => { pending = null; $('#fpopts').hidden = true }
  $('#fpadd').onclick = async () => {
    if (!pending) return
    const w = Math.round(Number($('#fpw').value)); if (!(w >= 20 && w <= 400)) { err.textContent = 'Say how many centimetres the longer side of the photo shows (20 to 400).'; return }
    const p = { id: 'fp' + Date.now().toString(36), name: pending.name, url: pending.url, widthCm: w, turns: 0, rooms: $('#fpfor').value }
    try { await loadFloorPhoto(p.url, 0) } catch { err.textContent = 'The photo could not be used.'; return }
    list.push(p); pending = null; toast('Floor added'); onChange()
  }
  drawList()
}
