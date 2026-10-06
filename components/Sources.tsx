'use client';
import { useEffect, useState } from 'react';
import { FIXED, LANGS, LANG_NAMES, Lang } from '@/lib/fixed';
import { SRC } from '@/lib/sources';

export default function Sources({ email }: { email: string }) {
  const [lang, setLang] = useState<Lang>('en');
  const [open, setOpen] = useState<number | null>(0);
  useEffect(() => {
    try { const l = localStorage.getItem('sourcesLang') as Lang | null; if (l && LANGS.includes(l)) setLang(l); } catch {}
  }, []);
  const pick = (l: Lang) => { setLang(l); setOpen(0); try { localStorage.setItem('sourcesLang', l); } catch {} };
  const f = FIXED[lang];
  const x = SRC[lang];

  return (
    <div className="wrap">
      <div className="nav">
        <div className="l"><img src="/swiftrix-s.png" alt="" />SWIFTRIX SOURCES</div>
        <div className="r">
          {LANGS.map((l) => <button key={l} className={'btn sm' + (lang === l ? '' : ' ghost')} onClick={() => pick(l)}>{LANG_NAMES[l]}</button>)}
          <a className="btn ghost sm" href="/">Companies</a>
          <a className="btn ghost sm" href="/calendar">My calendar</a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{x.ui.who}</h3>
        <p style={{ marginBottom: 10 }}>{x.who}</p>
        <p className="mini" style={{ marginBottom: 12 }}>{x.contact}</p>
        <h3>{x.ui.pitch}</h3>
        <p>{x.pitch30}</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{x.ui.flow}</h3>
        <ol style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>{x.flow.map((t, i) => <li key={i}>{t}</li>)}</ol>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{x.ui.build}</h3>
        <div className="src-grid">
          {x.whatWeDo.map((w) => (
            <div key={w.t}><b>{w.t}</b><p className="mini" style={{ display: 'block', marginTop: 4 }}>{w.d}</p></div>
          ))}
        </div>
        <h3 style={{ marginTop: 18 }}>{x.ui.work}</h3>
        <p>{x.howWeWork.map((t, i) => `${i + 1}. ${t}`).join('   ')}</p>
        <h3 style={{ marginTop: 18 }}>{x.ui.ways}</h3>
        <div className="src-grid">
          {x.ways.map((w) => (
            <div key={w.t}><b>{w.t}</b><p className="mini" style={{ display: 'block', marginTop: 4 }}>{w.d}</p></div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{x.ui.faq}</h3>
        {x.faq.map((it, i) => (
          <div key={i} className="faq">
            <button type="button" className={open === i ? 'on' : ''} onClick={() => setOpen(open === i ? null : i)}>{it.q}</button>
            {open === i && <p>{it.a}</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>{x.ui.projects}</h3>
        <p className="mini" style={{ marginBottom: 14, display: 'block' }}>{f.worksIntro.text}</p>
        <div className="src-works">
          {f.works.map((w) => (
            <div key={w.name} className="src-work">
              <img src={`/portfolio/${w.img}.jpg`} alt="" />
              <div>
                <div className="mono" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--g)' }}>{w.tag}</div>
                <b style={{ display: 'block', margin: '4px 0 2px', fontSize: 16 }}>{w.name}</b>
                <div className="mini" style={{ display: 'block', marginBottom: 6 }}>{w.sub}</div>
                <p><b>{f.ui.problem}:</b> {w.problem}</p>
                <p style={{ marginTop: 4 }}><b>{f.ui.solution}:</b> {w.solution}</p>
                <div className="row" style={{ marginTop: 8 }}>{w.stats.map((s, i) => <span key={i} className="pill">{s[0]} · {s[1]}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
