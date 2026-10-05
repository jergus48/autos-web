'use client';
import { useEffect, useMemo, useState } from 'react';

type Mtg = {
  id: number; start_at: string; end_at: string; meet_url?: string; html_link?: string; attendee_email?: string; user_email?: string;
  company_id: number; name: string; phone?: string; email?: string; website?: string; country?: string;
  share_token?: string; deck_id?: number; last_note?: string;
  result?: string; price?: string; tools?: string; agreement?: string; debrief?: string;
};

const H0 = 8, H1 = 20, PX = 48; // visible hours and pixels per hour
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monday = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const hm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const RESULTS = [
  { v: 'interested', label: 'Interested', cls: 'good' },
  { v: 'maybe', label: 'Maybe / thinking', cls: 'warn' },
  { v: 'not_interested', label: 'Not interested', cls: 'bad' },
  { v: 'no_show', label: 'No show', cls: 'mute' },
];
const resultCls = (m: Mtg) => (m.result ? 'r-' + m.result : new Date(m.end_at) < new Date() ? 'r-pending' : '');
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function Calendar({ email, admin }: { email: string; admin: boolean }) {
  const [start, setStart] = useState(() => monday(new Date()));
  const [rows, setRows] = useState<Mtg[]>([]);
  const [sel, setSel] = useState<Mtg | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ result: '', price: '', tools: '', agreement: '', debrief: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meetings?from=${encodeURIComponent(start.toISOString())}&to=${encodeURIComponent(addDays(start, 7).toISOString())}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => { setRows(j); setSel(null); })
      .finally(() => setLoading(false));
  }, [start]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  useEffect(() => {
    setForm({ result: sel?.result || '', price: sel?.price || '', tools: sel?.tools || '', agreement: sel?.agreement || '', debrief: sel?.debrief || '' });
    setSaved('');
  }, [sel?.id]);

  async function saveDebrief() {
    if (!sel) return;
    setSaving(true);
    const r = await fetch(`/api/meetings/${sel.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (!r.ok) return setSaved((await r.json().catch(() => ({}))).error || 'Could not save');
    const next = { ...sel, ...form };
    setRows((rs) => rs.map((m) => (m.id === sel.id ? next : m)));
    setSel(next);
    setSaved('Saved');
  }

  const days = useMemo(() => DAYS.map((_, i) => addDays(start, i)), [start]);
  const label = `${days[0].toLocaleDateString([], { day: 'numeric', month: 'short' })} - ${days[6].toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const hours = Array.from({ length: H1 - H0 }, (_, i) => H0 + i);

  function pos(m: Mtg) {
    const s = new Date(m.start_at), e = new Date(m.end_at);
    const top = Math.max(0, (s.getHours() + s.getMinutes() / 60 - H0) * PX);
    const bottom = Math.min((H1 - H0) * PX, (e.getHours() + e.getMinutes() / 60 - H0) * PX);
    return { top, height: Math.max(22, bottom - top) };
  }

  const nowTop = (now.getHours() + now.getMinutes() / 60 - H0) * PX;

  return (
    <div className="wrap wide">
      <div className="nav">
        <div className="l"><img src="/swiftrix-s.png" alt="" />SWIFTRIX CALENDAR</div>
        <div className="r">
          <span>{email}</span>
          <a className="btn ghost sm" href="/">Companies</a>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn ghost sm" onClick={() => setStart(addDays(start, -7))}>&lt; Prev</button>
        <button className="btn ghost sm" onClick={() => setStart(monday(new Date()))}>This week</button>
        <button className="btn ghost sm" onClick={() => setStart(addDays(start, 7))}>Next &gt;</button>
        <b style={{ marginLeft: 8 }}>{label}</b>
        <span className="mini" style={{ color: 'var(--mute)' }}>
          {loading ? 'Loading...' : `${rows.length} meeting${rows.length === 1 ? '' : 's'}`}{admin ? ' (all callers)' : ''}
        </span>
      </div>

      <div className="cal">
        <div className="cal-head">
          <div />
          {days.map((d, i) => (
            <div key={i} className={'cal-dh' + (sameDay(d, now) ? ' today' : '')}>{DAYS[i]} <b>{d.getDate()}</b></div>
          ))}
        </div>
        <div className="cal-body" style={{ height: (H1 - H0) * PX }}>
          <div className="cal-hours">
            {hours.map((h) => <div key={h} style={{ height: PX }}>{String(h).padStart(2, '0')}:00</div>)}
          </div>
          {days.map((d, i) => (
            <div key={i} className={'cal-col' + (sameDay(d, now) ? ' today' : '')}>
              {hours.map((h) => <div key={h} className="cal-line" style={{ height: PX }} />)}
              {sameDay(d, now) && nowTop >= 0 && nowTop <= (H1 - H0) * PX && <div className="cal-now" style={{ top: nowTop }} />}
              {rows.filter((m) => sameDay(new Date(m.start_at), d)).map((m) => {
                const p = pos(m);
                return (
                  <button key={m.id} className={'cal-ev ' + resultCls(m) + (sel?.id === m.id ? ' on' : '')} style={{ top: p.top, height: p.height }} onClick={() => setSel(m)}>
                    <b>{hm(m.start_at)}</b> {m.name}
                    {m.result ? <small>{RESULTS.find((x) => x.v === m.result)?.label}</small> : resultCls(m) === 'r-pending' ? <small>Flag the result</small> : null}
                    {admin && m.user_email && <small>{m.user_email}</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{sel.name}</h3>
            <button className="btn ghost sm" onClick={() => setSel(null)}>Close</button>
          </div>
          <div className="mono" style={{ margin: '8px 0' }}>
            {new Date(sel.start_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })} · {hm(sel.start_at)} - {hm(sel.end_at)}
          </div>
          <div className="cal-info">
            {sel.attendee_email && <div><span>Client email</span>{sel.attendee_email}</div>}
            {sel.phone && <div><span>Phone</span>{sel.phone}</div>}
            {sel.website && <div><span>Website</span><a href={/^https?:/.test(sel.website) ? sel.website : 'https://' + sel.website} target="_blank" rel="noreferrer">{sel.website}</a></div>}
            {admin && sel.user_email && <div><span>Caller</span>{sel.user_email}</div>}
            {sel.last_note && <div><span>Last call note</span>{sel.last_note}</div>}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {sel.meet_url && <a className="btn sm" href={sel.meet_url} target="_blank" rel="noreferrer">Join Google Meet</a>}
            {sel.share_token && <a className="btn ghost sm" href={`/s/${sel.share_token}`} target="_blank" rel="noreferrer">Open slides</a>}
            {sel.deck_id && <a className="btn ghost sm" href={`/deck/${sel.deck_id}`}>Deck, script and call log</a>}
            {sel.html_link && <a className="btn ghost sm" href={sel.html_link} target="_blank" rel="noreferrer">Google Calendar event</a>}
          </div>

          <h3 style={{ marginTop: 22 }}>AFTER THE CALL</h3>
          <div className="logger"><div className="oc-grid">
            {RESULTS.map((o) => (
              <button key={o.v} type="button" className={`oc ${o.cls}${form.result === o.v ? ' on' : ''}`} onClick={() => setForm({ ...form, result: form.result === o.v ? '' : o.v })}>{o.label}</button>
            ))}
          </div></div>
          <div className="cal-form">
            <label>Price discussed<input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1500 EUR one-off + 80 EUR/month" /></label>
            <label>Tools / systems needed<textarea rows={2} value={form.tools} onChange={(e) => setForm({ ...form, tools: e.target.value })} placeholder="e.g. their CRM, Google Sheets, Outlook, ERP access" /></label>
            <label>Put in the agreement<textarea rows={2} value={form.agreement} onChange={(e) => setForm({ ...form, agreement: e.target.value })} placeholder="Scope, deadlines, payment terms, support, anything they asked for" /></label>
            <label>Notes<textarea rows={3} value={form.debrief} onChange={(e) => setForm({ ...form, debrief: e.target.value })} placeholder="What they said, objections, next step" /></label>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn sm" disabled={saving} onClick={saveDebrief}>{saving ? 'Saving...' : 'Save'}</button>
            {saved && <span className="mini" style={{ color: saved === 'Saved' ? 'var(--g)' : '#ff8f8f' }}>{saved}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
