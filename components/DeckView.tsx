'use client';
import { useState } from 'react';
import Deck from './Deck';
import CallLogger from './CallLogger';
import { Lang } from '@/lib/fixed';

export default function DeckView({ deck, company, shareToken, readOnly }: { deck: any; company: any; shareToken: string; readOnly?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [script, setScript] = useState<any>(deck.script || {});
  const [copied, setCopied] = useState('');

  async function saveScript(path: string, value: string) {
    await fetch(`/api/decks/${deck.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: 'script.' + path, value }) });
  }
  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }
  const share = typeof window !== 'undefined' ? `${location.origin}/s/${shareToken}` : '';
  const r = deck.research || {};

  const sections: { title: string; text: string }[] =
    script.sections ||
    [script.call ? { title: 'Call script', text: script.call } : null].filter(Boolean) as any;
  const NL = String.fromCharCode(10);
  const full = sections.map((x) => x.title + NL + x.text).join(NL + NL);

  return (
    <>
      <div className="vbar noprint">
        <a className="btn ghost sm" href="/">All companies</a>
        <b style={{ marginRight: 'auto' }}>{company.name} <span className="pill">{deck.lang.toUpperCase()}</span></b>
        {!readOnly && <button className="btn ghost sm" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit text'}</button>}
        <button className="btn ghost sm" onClick={() => copy('link', share)}>{copied === 'link' ? 'Link copied' : 'Copy share link'}</button>
        <button className="btn sm" onClick={() => window.print()}>Download PDF</button>
      </div>
      <div className="vwrap">
        <Deck slides={deck.slides} lang={deck.lang as Lang} edit={edit} deckId={deck.id} />
        {!readOnly && (
          <aside className="side noprint">
            {company.id && (
              <div className="card" style={{ borderColor: '#3d5a14' }}>
                <h3>LOG THIS CALL</h3>
                <CallLogger companyId={company.id} defaultEmail={company.email || ''} />
              </div>
            )}
            <div className="card">
              <h3>RESEARCH</h3>
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
                  <div className="mono" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--g)', marginBottom: 4 }}>{String(i + 1).padStart(2, '0')} · {sec.title.toUpperCase()}</div>
                  <textarea rows={Math.max(4, Math.ceil(sec.text.length / 42))} defaultValue={sec.text}
                    onBlur={(e) => { const t = e.target.value; setScript((s: any) => { const n = { ...s, sections: sections.map((x, j) => (j === i ? { ...x, text: t } : x)) }; return n; }); if (script.sections) saveScript(`sections.${i}.text`, t); }} />
                </div>
              ))}
            </div>
            <div className="card">
              <h3>CONTACT</h3>
              <p>{company.email}<br />{company.phone}<br />{company.website}</p>
            </div>
            <p style={{ color: 'var(--mute)', fontSize: 12 }}>PDF: choose "Save as PDF" in the print dialog, paper size and margins are preset, enable background graphics if your browser asks.</p>
          </aside>
        )}
      </div>
    </>
  );
}
