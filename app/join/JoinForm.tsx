'use client';
import { useEffect, useState } from 'react';
import { TEXT, type Lang } from './text';

export default function JoinForm({ lang, sent = false, error = '' }: { lang: Lang; sent?: boolean; error?: string }) {
  const t = TEXT[lang];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(error ? t.errors[error] || t.errors.generic : '');
  const [done, setDone] = useState(sent);
  const [show, setShow] = useState(false);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
          experience: fd.get('experience'),
          consent: fd.get('consent') === 'on',
          website: fd.get('website'), // honeypot, stays empty for people
        }),
      });
      if (r.ok) { setDone(true); return; }
      const j = await r.json().catch(() => ({} as any));
      setErr(t.errors[j.code] || t.errors.generic);
    } catch {
      setErr(t.errors.generic);
    }
    setBusy(false);
  }

  return (
    <div className="join">
      <div className="logoRow"><img src="/swiftrix-s.png" alt="" />SWIFTRIX</div>
      <div className="langs">
        {(['en', 'lt', 'de'] as Lang[]).map((l) => (
          <a key={l} href={`/join?lang=${l}`} className={l === lang ? 'on' : ''} hrefLang={l}>{l.toUpperCase()}</a>
        ))}
      </div>
      {done ? (
        <div className="card joinDone">
          <h1>{t.doneTitle}</h1>
          <p>{t.doneBody}</p>
        </div>
      ) : (
        <form className="card joinForm" method="post" action="/api/register" onSubmit={submit}>
          <input type="hidden" name="lang" value={lang} />
          <h1>{t.h1}</h1>
          <p className="lead">{t.intro}</p>

          <label className="lbl" htmlFor="j-email">{t.email}</label>
          <input id="j-email" name="email" type="email" required autoComplete="username" maxLength={254} />

          <label className="lbl" htmlFor="j-pass">{t.password}</label>
          <input id="j-pass" name="password" type={show ? 'text' : 'password'} required minLength={10} maxLength={72} autoComplete="new-password" />
          <div className="hint">{t.passwordHint}</div>
          <label className="mini"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> {t.show}</label>

          <label className="lbl" htmlFor="j-exp">{t.experience}</label>
          <textarea id="j-exp" name="experience" rows={5} required minLength={3} maxLength={1500} placeholder={t.experiencePh} />

          {/* honeypot: hidden from people, bots fill it in */}
          <input className="hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <label className="consent">
            <input type="checkbox" name="consent" required />
            <span>{t.consent} <a href="/privacy" target="_blank" rel="noopener">{t.privacyLink}</a></span>
          </label>
          <div className="hint">{t.dataNote}</div>

          <button className="btn" disabled={busy}>{busy ? t.sending : t.submit}</button>
          {err && <div className="err">{err}</div>}
          <a className="signin" href="/login">{t.signIn}</a>
        </form>
      )}
    </div>
  );
}
