// Shared by the public API functions (agent.js, assistant.js, lead.js).
// Vercel does not turn files under an "_"-prefixed folder into endpoints.
'use strict'

const ORIGIN_OK = /^https:\/\/(www\.)?swiftrix\.eu$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
const FALLBACK_MODEL = 'gemini-flash-latest'

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}

// Vercel parses JSON bodies into req.body; a bare Node server doesn't.
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)) } catch (e) { return Promise.resolve(null) } }
  return new Promise(resolve => {
    let raw = ''
    req.on('data', ch => { raw += ch; if (raw.length > 40000) { raw = ''; req.destroy() } })
    req.on('end', () => { try { resolve(JSON.parse(raw)) } catch (e) { resolve(null) } })
    req.on('error', () => resolve(null))
  })
}

// Answers the CORS preflight and rejects anything not POSTed from the site.
// Returns true when the request was already answered.
function guard(req, res) {
  const origin = req.headers.origin || ''
  if (origin && ORIGIN_OK.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    send(res, 204, {})
    return true
  }
  if (req.method !== 'POST') { send(res, 405, { error: 'method' }); return true }
  if (!origin || !ORIGIN_OK.test(origin)) { send(res, 403, { error: 'origin' }); return true }
  return false
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim()
}

// Per-IP limit kept in the function instance's memory: best-effort, since
// Vercel may run several instances and recycles them.
function rateLimiter(perWindow, windowMs) {
  const hits = new Map()
  return function limited(ip) {
    const now = Date.now()
    const recent = (hits.get(ip) || []).filter(t => now - t < windowMs)
    if (recent.length >= perWindow) { hits.set(ip, recent); return true }
    recent.push(now)
    hits.set(ip, recent)
    if (hits.size > 5000) hits.clear()
    return false
  }
}

function clip(v, n) { return typeof v === 'string' ? v.trim().slice(0, n) : '' }

// One structured-output call to Gemini. Resolves { status, json } where
// status is 200 (json = parsed object), 429 (out of quota), 503 (no key) or
// 502 (anything else).
async function gemini({ system, user, schema, maxTokens, temperature }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { status: 503 }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  const call = (model, noThinking) => {
    const generationConfig = { temperature: temperature == null ? 0.2 : temperature, maxOutputTokens: maxTokens || 1500, responseMimeType: 'application/json', responseSchema: schema }
    if (noThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 }
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig })
    }).then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }))
  }
  try {
    let out
    for (const model of [MODEL, FALLBACK_MODEL]) {
      // Turning thinking off makes replies faster, but some models reject the
      // setting ("invalid argument") — then ask again without it.
      out = await call(model, true)
      if (out.status === 400 && /invalid argument/i.test((out.data.error && out.data.error.message) || '')) out = await call(model, false)
      // Overloaded or out of quota: try the other model before giving up.
      if (out.status !== 429 && out.status !== 503 && out.status !== 500) break
    }
    if (out.status === 429) return { status: 429 }
    if (out.status !== 200) return { status: 502 }
    const parts = (out.data.candidates && out.data.candidates[0] && out.data.candidates[0].content && out.data.candidates[0].content.parts) || []
    try { return { status: 200, json: JSON.parse(parts.map(p => p.text || '').join('')) } } catch (e) { return { status: 502 } }
  } catch (e) {
    return { status: 502 }
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { send, readBody, guard, clientIp, rateLimiter, clip, gemini }
