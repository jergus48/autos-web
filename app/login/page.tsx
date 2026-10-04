'use client';
import { useState } from 'react';

export default function Login() {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) });
    if (r.ok) location.href = '/';
    else {
      const j = await r.json().catch(() => ({} as any));
      setErr((j.error || 'Login failed') + (j.code ? ` (${j.code})` : ` [HTTP ${r.status}]`));
      setBusy(false);
    }
  }
  return (
    <div className="login">
      <div className="logoRow"><img src="/swiftrix-s.png" alt="" />SWIFTRIX</div>
      <form className="card" onSubmit={submit}>
        <input name="email" type="email" placeholder="Email" required autoComplete="username" />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
        <button className="btn" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        {err && <div className="err">{err}</div>}
      </form>
      <p className="mini" style={{ marginTop: 14 }}><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
    </div>
  );
}
