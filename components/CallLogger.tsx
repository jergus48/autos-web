'use client';
import { useEffect, useState } from 'react';
import { OUTCOMES, ago, outcomeLabel, outcomeTone } from '@/lib/outcomes';

type Entry = { id: number; outcome: string; note?: string; followup_at?: string; created_at: string; user_email?: string; mine: boolean };

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

type Meeting = { id: number; meet_url?: string; attendee_email?: string; start_at: string; transcript_state?: string; has_transcript: boolean; user_email?: string };

export default function CallLogger({ companyId, defaultEmail, onSaved }: { companyId: number; defaultEmail?: string; onSaved?: () => void }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [gOk, setGOk] = useState(false);
  const [mk, setMk] = useState(true);
  const [mEmail, setMEmail] = useState(defaultEmail || '');
  const [mWhen, setMWhen] = useState('');
  const [mMin, setMMin] = useState(30);
  const [open, setOpen] = useState<number | null>(null);
  const [tx, setTx] = useState<Record<number, string>>({});
  const [txBusy, setTxBusy] = useState<number | null>(null);
  const [txMsg, setTxMsg] = useState('');
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
  async function loadMeetings() {
    const r = await fetch(`/api/companies/${companyId}/meetings`);
    if (r.ok) setMeetings(await r.json());
  }
  useEffect(() => { load(); loadMeetings(); }, [companyId]);
  useEffect(() => { fetch('/api/google/status').then((r) => r.json()).then((j) => setGOk(!!j.connected)).catch(() => {}); }, []);

  async function pullTranscript(id: number) {
    setTxBusy(id);
    setTxMsg('');
    const r = await fetch(`/api/meetings/${id}/transcript`, { method: 'POST' });
    const j = await r.json().catch(() => ({} as any));
    setTxBusy(null);
    if (!r.ok) return setTxMsg(j.error || 'Could not fetch transcript');
    if (j.transcript) { setTx((t) => ({ ...t, [id]: j.transcript })); setOpen(id); }
    else setTxMsg(j.state === 'no_meeting_yet' ? 'The meeting has not happened yet.' : 'No transcript yet. Start transcription in the meeting, then try again after it ends.');
    loadMeetings();
  }
  async function showTranscript(id: number) {
    if (open === id) return setOpen(null);
    if (!tx[id]) {
      const r = await fetch(`/api/meetings/${id}/transcript`);
      const j = await r.json().catch(() => ({} as any));
      if (j.transcript) setTx((t) => ({ ...t, [id]: j.transcript }));
    }
    setOpen(id);
  }

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
    if (outcome === 'meeting_booked' && gOk && mk) {
      const m = await fetch(`/api/companies/${companyId}/meetings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: mEmail, startsAt: mWhen ? new Date(mWhen).toISOString() : '', minutes: mMin, note, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      if (!m.ok) { setErr('Call saved, but the Meet was not created: ' + ((await m.json().catch(() => ({}))).error || 'error')); await load(); await loadMeetings(); onSaved?.(); return; }
      await loadMeetings();
    }
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
      {outcome === 'meeting_booked' && (
        <div className="row" style={{ marginTop: 10 }}>
          {gOk ? (
            <>
              <label className="mini"><input type="checkbox" checked={mk} onChange={(e) => setMk(e.target.checked)} /> Create Google Meet and email the invite</label>
              {mk && (
                <>
                  <input style={{ minWidth: 200 }} type="email" placeholder="Their email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} />
                  <input type="datetime-local" value={mWhen} onChange={(e) => setMWhen(e.target.value)} />
                  <select value={mMin} onChange={(e) => setMMin(Number(e.target.value))}><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select>
                </>
              )}
            </>
          ) : (
            <span className="mini">Google is not connected yet, so no Meet is created. An admin can connect it in Admin.</span>
          )}
        </div>
      )}
      {err && <div className="err">{err}</div>}
      {meetings.length > 0 && (
        <div className="hist">
          {meetings.map((m) => (
            <div key={m.id} className="hrow" style={{ flexWrap: 'wrap' }}>
              <span className="pill oc-good">Meet</span>
              <span className="when">{new Date(m.start_at).toLocaleString()}</span>
              <span className="who">{m.attendee_email}</span>
              {m.meet_url && <a href={m.meet_url} target="_blank" rel="noreferrer">Open Meet</a>}
              <button className="btn ghost sm" disabled={txBusy === m.id} onClick={() => pullTranscript(m.id)}>{txBusy === m.id ? 'Fetching...' : m.has_transcript ? 'Refresh transcript' : 'Get transcript'}</button>
              {m.has_transcript && <button className="btn ghost sm" onClick={() => showTranscript(m.id)}>{open === m.id ? 'Hide' : 'Show'} transcript</button>}
              {open === m.id && tx[m.id] && <pre style={{ width: '100%', whiteSpace: 'pre-wrap', maxHeight: 320, overflow: 'auto' }}>{tx[m.id]}</pre>}
            </div>
          ))}
          {txMsg && <div className="err">{txMsg}</div>}
        </div>
      )}
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
