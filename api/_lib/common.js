// Shared by the public API functions (agent.js, assistant.js, lead.js).
// Vercel does not turn files under an "_"-prefixed folder into endpoints.
'use strict'

const ORIGIN_OK = /^https:\/\/(www\.)?swiftrix\.eu$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
// AI provider: OpenRouter (OPENROUTER_API_KEY) — the same account the outreach
// tools use. Default model gpt-4.1-nano, the cheapest one tested that handles
// the structured output (~$0.0005 per answer). In side-by-side tests
// (2026-10-04) openai/gpt-4.1-mini gave noticeably sharper assistant answers
// for ~4x the price; OPENROUTER_MODEL switches to it (or any other model).
// Gemini (GEMINI_API_KEY) is only used when no OpenRouter key is set.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-nano'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
const GEMINI_FALLBACK_MODEL = 'gemini-flash-latest'

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

function hasAiKey() { return !!(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY) }

// OpenRouter is a paid key, so on top of each endpoint's per-IP limit there is
// a ceiling on all AI calls per function instance. Also set a credit limit on
// the key itself in OpenRouter.
const allCalls = rateLimiter(300, 60 * 60 * 1000)

// One structured-output call. Resolves { status, json } where status is 200
// (json = parsed object), 429 (rate/quota), 503 (no key, or out of credit) or
// 502 (anything else). Schemas are written in Gemini's format (type: 'OBJECT'
// etc.) and converted for OpenRouter.
async function ai(opts) {
  if (!hasAiKey()) return { status: 503 }
  if (allCalls('all')) return { status: 429 }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  try {
    const out = process.env.OPENROUTER_API_KEY ? await openrouter(opts, ctrl.signal) : await gemini(opts, ctrl.signal)
    if (out.json) out.json = dedash(out.json)
    return out
  } catch (e) {
    return { status: 502 }
  } finally {
    clearTimeout(timer)
  }
}

// The site avoids em dashes (they read as AI-written). The prompts ask for
// none, but small models slip, so every string the model returns is cleaned:
// a dash opening a line is dropped, any other em dash (or spaced en dash used
// as one) becomes a comma. Number ranges like 2–3 keep their en dash.
function dedash(v) {
  if (typeof v === 'string') return v.replace(/^[ \t]*[—–][ \t]*/gm, '').replace(/[ \t]*—[ \t]*| – /g, ', ')
  if (Array.isArray(v)) return v.map(dedash)
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = dedash(v[k]); return o }
  return v
}

// OpenAI-style strict JSON schema: lower-case types, every property required
// (empty values are fine — each endpoint's sanitize() handles them), no extras.
function toJsonSchema(s) {
  const type = String(s.type).toLowerCase()
  if (type === 'object') {
    const properties = {}
    Object.keys(s.properties || {}).forEach(k => { properties[k] = toJsonSchema(s.properties[k]) })
    return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false }
  }
  if (type === 'array') return { type: 'array', items: toJsonSchema(s.items) }
  return s.enum ? { type, enum: s.enum } : { type }
}

async function openrouter({ system, user, schema, maxTokens, temperature }, signal) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
      'HTTP-Referer': 'https://www.swiftrix.eu',
      'X-Title': 'swiftrix.eu'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: temperature == null ? 0.2 : temperature,
      max_tokens: maxTokens || 1500,
      response_format: { type: 'json_schema', json_schema: { name: 'result', strict: true, schema: toJsonSchema(schema) } }
    })
  })
  const data = await r.json().catch(() => ({}))
  if (r.status === 429) return { status: 429 }
  if (r.status === 402) return { status: 503 } // out of credit: pages fall back as if switched off
  if (!r.ok) return { status: 502 }
  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  try { return { status: 200, json: JSON.parse(text) } } catch (e) { return { status: 502 } }
}

async function gemini({ system, user, schema, maxTokens, temperature }, signal) {
  const call = (model, noThinking) => {
    const generationConfig = { temperature: temperature == null ? 0.2 : temperature, maxOutputTokens: maxTokens || 1500, responseMimeType: 'application/json', responseSchema: schema }
    if (noThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 }
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig })
    }).then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }))
  }
  let out
  for (const model of [GEMINI_MODEL, GEMINI_FALLBACK_MODEL]) {
    // Some models reject turning thinking off ("invalid argument") — then ask
    // again without it. Overloaded or out of quota: try the other model.
    out = await call(model, true)
    if (out.status === 400 && /invalid argument/i.test((out.data.error && out.data.error.message) || '')) out = await call(model, false)
    if (out.status !== 429 && out.status !== 503 && out.status !== 500) break
  }
  if (out.status === 429) return { status: 429 }
  if (out.status !== 200) return { status: 502 }
  const parts = (out.data.candidates && out.data.candidates[0] && out.data.candidates[0].content && out.data.candidates[0].content.parts) || []
  try { return { status: 200, json: JSON.parse(parts.map(p => p.text || '').join('')) } } catch (e) { return { status: 502 } }
}

module.exports = { send, readBody, guard, clientIp, rateLimiter, clip, hasAiKey, ai }
