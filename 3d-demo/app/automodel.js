// The browser side of automatic models (server: lib/automodel_api.js). makeModel(link): ask the server for a model of the piece, follow the job, show the draft as soon as it is there (so the piece
// changes in the 3D view while the check runs), draw the draft in four views, send that picture back so the vision model can compare it with the product pictures, show the corrected model.
import { registerModel, modelProblems } from '../layout/models.js'
import { drawModelViews } from './modelshot.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function call(path, body) {
  const res = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { ok: res.ok, status: res.status, j: await res.json().catch(() => ({})) }
}

// { enabled, reason, model, estimate: { perPieceUsd, measured }, ... } of the server; { enabled: false } when it cannot be asked
export async function autoStatus() { try { const r = await call('/api/automodel/status'); return r.ok ? r.j : { enabled: false } } catch { return { enabled: false } } }

// the result: { ok, exists?, costUsd, refined, note } or { ok: false, message }
export async function makeModel(link, { onStage = () => {}, onModel = () => {} } = {}) {
  const show = (model, quality) => { if (model && !modelProblems(model).length) { registerModel(model); onModel(model, quality); return true } return false }
  let r; try { r = await call('/api/automodel', { link }) } catch { return { ok: false, message: 'The server could not be reached.' } }
  if (!r.ok) return { ok: false, message: r.j.message || 'The model could not be started.' }
  if (r.j.status === 'exists') return { ok: true, exists: true }
  const id = r.j.id, t0 = Date.now(); let j = r.j
  while (j.status === 'working') {
    onStage(j.stage); await sleep(1500)
    if (Date.now() - t0 > 8 * 60e3) return { ok: false, message: 'It took too long. Try again in a minute.' }
    try { const p = await call('/api/automodel/job?id=' + encodeURIComponent(id)); if (!p.ok) return { ok: false, message: p.j.message || 'The job was lost.' }; j = p.j } catch { /* the next round asks again */ }
  }
  if (j.status === 'error') return { ok: false, message: j.error?.message || 'The model could not be made.', costUsd: j.costUsd }
  if (!show(j.model, 'draft')) return { ok: false, message: 'The model that came back cannot be drawn.', costUsd: j.costUsd }
  onStage('Drawing the draft to check it against the pictures')
  let image = null; try { image = drawModelViews(document.createElement('canvas'), j.model, { width: 1000, height: 640, mime: 'image/jpeg', quality: 0.82 }) } catch { /* no picture: the draft stays */ }
  if (!image) { await call('/api/automodel/finish', { job: id }).catch(() => {}); return { ok: true, costUsd: j.costUsd, refined: false } }
  onStage('Comparing the model with the pictures')
  let f; try { f = await call('/api/automodel/refine', { job: id, image }) } catch { f = { ok: false, j: {} } }
  if (f.ok && f.j.model) { show(f.j.model, f.j.refined ? 'refined' : 'draft'); j = f.j }
  return { ok: true, costUsd: j.costUsd, refined: Boolean(f.j?.refined), note: f.j?.refineNote }
}
