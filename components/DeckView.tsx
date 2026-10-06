'use client';
import { useState } from 'react';
import Deck from './Deck';
import CallLogger from './CallLogger';
import { Lang } from '@/lib/fixed';

type Sec = { title: string; text: string };

export default function DeckView({ deck, company, shareToken, readOnly }: { deck: any; company: any; shareToken: string; readOnly?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [script, setScript] = useState<any>(deck.script || {});
  const [presenter, setPresenter] = useState<any>(deck.presenter || null);
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function save(root: 'script' | 'presenter', path: string, value: string) {
    await fetch(`/api/decks/${deck.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: `${root}.${path}`, value }) });
  }
  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }
  async function stage(stg: 'slides' | 'presenter', manual = false) {
    const r = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ companyId: company.id, lang: deck.lang, stage: stg, deckId: deck.id, manual }) });
    const j = await r.json().catch(() => ({ error: 'Server error (timeout?)' }));
    return { ok: r.ok, j };
  }
  async function generateSlides() {
    setErr('');
    let manual = false;
    if (!company.agreed) {
      if (!confirm('The client has not agreed to a meeting yet. Slides are for the Google Meet, not the cold call.\n\nGenerate them anyway? This is recorded as "generated early".')) return;
      manual = true;
    }
    setBusy('Writing the slides... ~30s');
    const a = await stage('slides', manual);
    if (!a.ok) { setBusy(''); return setErr(a.j.error || 'Failed'); }
    setBusy('Writing your presenter script... ~20s');
    const b = await stage('presenter');
    setBusy('');
    if (!b.ok) setErr('Slides are ready, but the presenter script failed: ' + (b.j.error || 'error') + '. Reload and use "Generate presenter script".');
    location.reload();
  }
  async function generatePresenter() {
    setErr('');
    setBusy('Writing your presenter script... ~20s');
    const b = await stage('presenter');
    setBusy('');
    if (!b.ok) return setErr(b.j.error || 'Failed');
    location.reload();
  }

  const share = typeof window !== 'undefined' && shareToken ? `${location.origin}/s/${shareToken}` : '';
  const r = deck.research || {};
  const NL = String.fromCharCode(10);
  const hasSlides = !!deck.slides;

  const sections: Sec[] =
    script.sections ||
    [script.call ? { title: 'Call script', text: script.call } : null].filter(Boolean) as any;
  const full = sections.map((x) => x.title + NL + x.text).join(NL + NL);
  const psections: Sec[] = presenter?.sections || [];
  const pfull = (presenter?.tips || []).map((t: string) => '- ' + t).join(NL) + NL + NL + psections.map((x) => x.title + NL + x.text).join(NL + NL);

  const label = (i: number, t: string) => (
    <div className="mono" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--g)', marginBottom: 4 }}>{String(i + 1).padStart(2, '0')} · {t.toUpperCase()}</div>
  );

  return (
    <>
      <div className="vbar noprint">
        <a className="btn ghost sm" href="/">All companies</a>
        <b style={{ marginRight: 'auto' }}>{company.name} <span className="pill">{deck.lang.toUpperCase()}</span></b>
        {!readOnly && hasSlides && <button className="btn ghost sm" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit text'}</button>}
        {share && <button className="btn ghost sm" onClick={() => copy('link', share)}>{copied === 'link' ? 'Link copied' : 'Copy share link'}</button>}
        {hasSlides && <button className="btn sm" onClick={() => window.print()}>Download PDF</button>}
      </div>
      <div className="vwrap">
        {hasSlides ? (
          <Deck slides={deck.slides} lang={deck.lang as Lang} edit={edit} deckId={deck.id} />
        ) : (
          <div className="card noprint" style={{ alignSelf: 'start' }}>
            <h3>SLIDES</h3>
            <p style={{ marginBottom: 10 }}>The slides are for the Google Meet, not for the cold call, so they are not generated yet. Use the call script on the right while you phone them.</p>
            {company.agreed ? (
              <p className="mini" style={{ color: 'var(--g)', marginBottom: 10 }}>The client agreed to a meeting. Generate the slides and your presenter script now.</p>
            ) : (
              <p className="mini" style={{ marginBottom: 10 }}>Generate them after the client agrees to a meeting. You can also generate them early, it is recorded.</p>
            )}
            <div className="row">
              <button className={'btn' + (company.agreed ? '' : ' ghost')} disabled={!!busy} onClick={generateSlides}>{busy || (company.agreed ? 'Generate slides + presenter script' : 'Generate early (manual)')}</button>
            </div>
            {err && <div className="err">{err}</div>}
          </div>
        )}
        {!readOnly && (
          <aside className="side noprint">
            {company.id && (
              <div className="card" style={{ borderColor: '#3d5a14' }}>
                <h3>LOG THIS CALL</h3>
                <CallLogger companyId={company.id} defaultEmail={company.email || ''} />
              </div>
            )}
            {hasSlides && (
              <div className="card" style={{ borderColor: '#3d5a14' }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>PRESENTING THE SLIDES</h3>
                  {presenter && <button className="btn ghost sm" onClick={() => copy('presenter', pfull)}>{copied === 'presenter' ? 'Copied' : 'Copy all'}</button>}
                </div>
                {deck.slidesEarly && <p className="mini" style={{ color: '#ffb86b', marginBottom: 8 }}>These slides were generated before the client agreed to a meeting.</p>}
                {!presenter ? (
                  <>
                    <p className="mini" style={{ marginBottom: 8 }}>No presenter script yet: what to say on each slide, plus short notes.</p>
                    <button className="btn sm" disabled={!!busy} onClick={generatePresenter}>{busy || 'Generate presenter script'}</button>
                    {err && <div className="err">{err}</div>}
                  </>
                ) : (
                  <>
                    <p style={{ marginBottom: 6 }}><b>Notes for you</b></p>
                    <ul style={{ marginBottom: 12 }}>{(presenter.tips || []).map((t: string, i: number) => <li key={i}>{t}</li>)}</ul>
                    {psections.map((sec, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        {label(i, sec.title)}
                        <textarea rows={Math.max(5, Math.ceil(sec.text.length / 42))} defaultValue={sec.text}
                          onBlur={(e) => { const t = e.target.value; setPresenter((p: any) => ({ ...p, sections: psections.map((x, j) => (j === i ? { ...x, text: t } : x)) })); save('presenter', `sections.${i}.text`, t); }} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            <div className="card">
              <h3>RESEARCH</h3>
              {!r.pagesRead?.length && <p className="mini" style={{ color: '#ffb86b', marginBottom: 8, display: 'block' }}>The website could not be read, so this research may be thin. Check the website address on the company and regenerate.</p>}
              <p>{r.summary}</p>
              <p style={{ marginTop: 8 }}><b>Size:</b> {r.size}</p>
              <p style={{ marginTop: 8 }}><b>Likely pain points</b></p>
              <ul>{(r.painPoints || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
              <p style={{ marginTop: 8 }}><b>Angle:</b> {r.angle}</p>
              <p style={{ marginTop: 8, color: 'var(--mute)' }}>Read {r.pagesRead?.length || 0} page(s) from the site.</p>
            </div>
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>CALL SCRIPT</h3>
                <button className="btn ghost sm" onClick={() => copy('script', full)}>{copied === 'script' ? 'Copied' : 'Copy all'}</button>
              </div>
              {sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  {label(i, sec.title)}
                  <textarea rows={Math.max(4, Math.ceil(sec.text.length / 42))} defaultValue={sec.text}
                    onBlur={(e) => { const t = e.target.value; setScript((s: any) => { const n = { ...s, sections: sections.map((x, j) => (j === i ? { ...x, text: t } : x)) }; return n; }); if (script.sections) save('script', `sections.${i}.text`, t); }} />
                </div>
              ))}
            </div>
            <div className="card">
              <h3>CONTACT</h3>
              <p>{company.email}<br />{company.phone}<br />{company.website}</p>
            </div>
            {hasSlides && <p style={{ color: 'var(--mute)', fontSize: 12 }}>PDF: choose "Save as PDF" in the print dialog, paper size and margins are preset, enable background graphics if your browser asks.</p>}
          </aside>
        )}
      </div>
    </>
  );
}
