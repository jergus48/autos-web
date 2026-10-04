'use client';
import { useEffect, useState } from 'react';
import { OUTCOMES, ago, outcomeLabel, outcomeTone } from '@/lib/outcomes';

type Entry = { id: number; outcome: string; note?: string; followup_at?: string; created_at: string; user_email?: string; mine: boolean };

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function CallLogger({ companyId, onSaved }: { companyId: number; onSaved?: () => void }) {
  const [history, setHistory] = useState<Entry[]>([]);
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [follow, setFollow] = useState(tomorrow());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    const r = await fetch(`/api/companies/${companyId}/calls`);
    if (r.ok) setHistory(await r.json());
  }
  useEffect(() => { load(); }, [companyId]);

  async function save() {
    if (!outcome) return setErr('Pick how the call ended');
    setBusy(true);
    setErr('');
    const r = await fetch(`/api/companies/${companyId}/calls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ outcome, note, followup_at: outcome === 'call_back' ? follow : null }),
    });
    setBusy(false);
    if (!r.ok) return setErr((await r.json().catch(() => ({}))).error || 'Could not save');
    setOutcome('');
    setNote('');
    await load();
    onSaved?.();
  }

  async function undo(id: number) {
    if (!confirm('Remove this log entry?')) return;
    await fetch(`/api/companies/${companyId}/calls`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ callId: id }) });
    await load();
    onSaved?.();
  }

  return (
    <div className="logger">
      <div className="oc-grid">
        {OUTCOMES.map((o) => (
          <button key={o.code} type="button" className={`oc ${o.tone}${outcome === o.code ? ' on' : ''}`} onClick={() => setOutcome(o.code)}>{o.label}</button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <input style={{ flex: 1, minWidth: 180 }} placeholder="Note (who you spoke to, what they said...)" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        {outcome === 'call_back' && (
          <label className="mini">Call back on <input type="date" value={follow} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setFollow(e.target.value)} /></label>
        )}
        <button className="btn sm" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save call'}</button>
      </div>
      {err && <div className="err">{err}</div>}
      {history.length > 0 && (
        <div className="hist">
          {history.map((h) => (
            <div key={h.id} className="hrow">
              <span className={`pill oc-${outcomeTone(h.outcome)}`}>{outcomeLabel(h.outcome)}</span>
              <span className="who">{h.mine ? 'you' : h.user_email}</span>
              <span className="when">{ago(h.created_at)}</span>
              {h.followup_at && <span className="when">follow-up {String(h.followup_at).slice(0, 10)}</span>}
              {h.note && <span className="hnote">{h.note}</span>}
              {h.mine && <button className="x" title="Remove" onClick={() => undo(h.id)}>x</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
