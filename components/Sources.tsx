'use client';
import { useState } from 'react';
import { FIXED, LANGS, LANG_NAMES, Lang } from '@/lib/fixed';
import { ABOUT, FAQ, FLOW } from '@/lib/sources';

export default function Sources({ email }: { email: string }) {
  const [lang, setLang] = useState<Lang>('en');
  const [open, setOpen] = useState<number | null>(0);
  const f = FIXED[lang];

  return (
    <div className="wrap">
      <div className="nav">
        <div className="l"><img src="/swiftrix-s.png" alt="" />SWIFTRIX SOURCES</div>
        <div className="r">
          <span>{email}</span>
          <a className="btn ghost sm" href="/">Companies</a>
          <a className="btn ghost sm" href="/calendar">My calendar</a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>WHO WE ARE</h3>
        <p style={{ marginBottom: 10 }}>{ABOUT.who}</p>
        <p className="mini" style={{ marginBottom: 12 }}>{ABOUT.contact}</p>
        <h3>THE 30-SECOND ANSWER</h3>
        <p>{ABOUT.pitch30}</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>HOW A LEAD GOES THROUGH THE APP</h3>
        <ol style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>{FLOW.map((x, i) => <li key={i}>{x}</li>)}</ol>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>WHAT WE BUILD</h3>
        <div className="src-grid">
          {ABOUT.whatWeDo.map((x) => (
            <div key={x.t}><b>{x.t}</b><p className="mini" style={{ display: 'block', marginTop: 4 }}>{x.d}</p></div>
          ))}
        </div>
        <h3 style={{ marginTop: 18 }}>HOW WE WORK</h3>
        <p>{ABOUT.howWeWork.map((x, i) => `${i + 1}. ${x}`).join('   ')}</p>
        <h3 style={{ marginTop: 18 }}>THREE WAYS TO START</h3>
        <div className="src-grid">
          {ABOUT.ways.map((x) => (
            <div key={x.t}><b>{x.t}</b><p className="mini" style={{ display: 'block', marginTop: 4 }}>{x.d}</p></div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>QUESTIONS YOU MAY BE ASKED</h3>
        {FAQ.map((x, i) => (
          <div key={i} className="faq">
            <button type="button" className={open === i ? 'on' : ''} onClick={() => setOpen(open === i ? null : i)}>{x.q}</button>
            {open === i && <p>{x.a}</p>}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>PREVIOUS PROJECTS</h3>
          <div className="row">
            {LANGS.map((l) => <button key={l} className={'btn sm' + (lang === l ? '' : ' ghost')} onClick={() => setLang(l)}>{LANG_NAMES[l]}</button>)}
          </div>
        </div>
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
