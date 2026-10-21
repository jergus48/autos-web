// Where the API is and how a visitor signs in.
// On the static host (Vercel) the build writes config.js: window.SWX_CONFIG = { api, supabaseUrl, supabaseKey }. Then the API is the Supabase edge function, accounts and logins are Supabase Auth's, and every request carries the
// login token ("Authorization: Bearer ..."). The key in the config is Supabase's public (publishable) key: it only lets a browser ask Supabase Auth to sign somebody in; it opens nothing else.
// Without the config (the local server, or a host that serves both the pages and the API) the API is on the same address and the old cookie sign-in works unchanged.
const CFG = globalThis.SWX_CONFIG && globalThis.SWX_CONFIG.supabaseUrl ? globalThis.SWX_CONFIG : null
export const SUPABASE = Boolean(CFG)
const SKEY = 'swx3d-sb-session'
const load = () => { try { return JSON.parse(localStorage.getItem(SKEY) || 'null') } catch { return null } }
const store = (s) => { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY) } catch { /* private mode: the login lasts until the page is closed */ } }
let session = SUPABASE ? load() : null, refreshing = null

const gotrue = (path, body, token) => fetch(CFG.supabaseUrl.replace(/\/+$/, '') + '/auth/v1' + path, { method: 'POST', headers: { apikey: CFG.supabaseKey, 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body || {}) })
const keep = (j) => { session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) }; store(session) }

// a token that is valid for at least another minute (renewed with the refresh token when it is about to end)
async function token() {
  if (!session) return null
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token
  refreshing ||= (async () => {
    try {
      const r = await gotrue('/token?grant_type=refresh_token', { refresh_token: session.refresh_token })
      if (r.ok) keep(await r.json()); else if (r.status >= 400 && r.status < 500) { session = null; store(null) }          // the login is over: signed out
    } catch { /* offline: the old token is tried and will be refused */ } finally { refreshing = null }
  })()
  await refreshing
  return session ? session.access_token : null
}

export async function apiFetch(path, init = {}) {
  if (!SUPABASE) return fetch(path, { credentials: 'same-origin', ...init })
  const headers = { ...(init.headers || {}) }, t = await token(); if (t) headers.authorization = 'Bearer ' + t
  return fetch(CFG.api.replace(/\/+$/, '') + path, { ...init, headers })
}

const WHY = {
  invalid_credentials: 'The e-mail or the password is wrong.', user_already_exists: 'There is already an account with that e-mail. Sign in instead.', email_exists: 'There is already an account with that e-mail. Sign in instead.',
  over_request_rate_limit: 'Too many tries. Wait a little and try again.', over_email_send_rate_limit: 'Too many tries. Wait a little and try again.', over_sms_send_rate_limit: 'Too many tries. Wait a little and try again.',
  signup_disabled: 'New accounts are closed for now.', email_not_confirmed: 'Confirm your e-mail first, then sign in.', validation_failed: 'That does not look like an e-mail address.',
}
const say = (j) => WHY[j.error_code || j.code] || j.msg || j.message || j.error_description || 'That did not work. Try again.'
async function enter(path, email, password) {
  let r; try { r = await gotrue(path, { email: String(email || '').trim(), password: String(password || '') }) } catch { return { ok: false, message: 'The server could not be reached.' } }
  const j = await r.json().catch(() => ({}))
  if (!r.ok) return { ok: false, message: say(j) }
  if (!j.access_token) return { ok: false, message: 'Check your e-mail to confirm the account, then sign in.' }          // only when the project still asks for e-mail confirmation
  keep(j); return { ok: true }
}
export const signIn = (email, password) => enter('/token?grant_type=password', email, password)
export const signUp = (email, password) => enter('/signup', email, password)
export async function signOut() {
  const t = session && session.access_token; session = null; store(null)
  if (t) await gotrue('/logout', {}, t).catch(() => {})
}
