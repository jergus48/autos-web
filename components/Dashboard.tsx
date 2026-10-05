'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import CallLogger from './CallLogger';
import { COUNTRIES, langFor } from '@/lib/countries';
import { ago, outcomeLabel, outcomeTone } from '@/lib/outcomes';

type Deck = { id: number; lang: string; share_token: string; created_at: string };
type Company = {
  id: number; name: string; email?: string; phone?: string; website?: string; logo_url?: string; status: string; country?: string; decks: Deck[] | null;
  last_outcome?: string; last_note?: string; last_at?: string; last_followup?: string; last_by?: string; last_by_other?: boolean; call_count: number;
};

const STAGES = [
  { at: 0, label: 'Reading their website...', short: 'Website' },
  { at: 7, label: 'Finding their logo...', short: 'Logo' },
  { at: 11, label: 'Searching the web for news and size...', short: 'Web search' },
  { at: 17, label: 'Writing the research brief...', short: 'Research' },
  { at: 28, label: 'Designing 4 project ideas and mockups...', short: 'Ideas' },
  { at: 40, label: 'Writing the call script...', short: 'Script' },
];

const today = () => new Date().toISOString().slice(0, 10);
const isDue = (c: Company) => c.last_outcome === 'call_back' && !!c.last_followup && String(c.last_followup).slice(0, 10) <= today();
const priority = (c: Company) => (isDue(c) ? 0 : !c.call_count ? 1 : ['no_answer', 'voicemail'].includes(c.last_outcome || '') ? 2 : 3);

const FILTERS: { v: string; label: string; test: (c: Company) => boolean }[] = [
  { v: 'all', label: 'All companies', test: () => true },
  { v: 'todo', label: 'To call (new + follow-ups due)', test: (c) => !c.call_count || isDue(c) },
  { v: 'new', label: 'Never called', test: (c) => !c.call_count },
  { v: 'due', label: 'Follow-ups due', test: isDue },
  { v: 'meeting_booked', label: 'Meeting agreed', test: (c) => c.last_outcome === 'meeting_booked' },
  { v: 'interested', label: 'Interested', test: (c) => c.last_outcome === 'interested' },
  { v: 'email_sent', label: 'Email / deck sent', test: (c) => c.last_outcome === 'email_sent' },
  { v: 'noans', label: 'No answer / voicemail', test: (c) => ['no_answer', 'voicemail'].includes(c.last_outcome || '') },
  { v: 'not_interested', label: 'Not interested / wrong number', test: (c) => ['not_interested', 'wrong_number'].includes(c.last_outcome || '') },
];

export default function Dashboard({ email, admin }: { email: string; admin: boolean }) {
  const [rows, setRows] = useState<Company[]>([]);
  const [lang, setLang] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<Record<number, boolean>>({});
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '', country: '' });
  const [open, setOpen] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [cfilter, setCfilter] = useState('all');
  const [smart, setSmart] = useState(true);
  const [users, setUsers] = useState<{ id: number; email: string; role: string }[]>([]);
  const [assignOne, setAssignOne] = useState('me');
  const [assignImport, setAssignImport] = useState('split');
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Record<number, { name: string; start: number; done?: boolean }>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!Object.keys(jobs).length) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [jobs]);

  async function load() {
    const r = await fetch('/api/companies');
    if (r.ok) setRows(await r.json());
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!admin) return;
    fetch('/api/admin/users').then((r) => (r.ok ? r.json() : [])).then(setUsers);
  }, [admin]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.v === filter)!;
    const s = q.trim().toLowerCase();
    let list = rows.filter((c) => f.test(c) && (cfilter === 'all' || c.country === cfilter) && (!s || [c.name, c.website, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(s))));
    if (smart) list = [...list].sort((a, b) => priority(a) - priority(b));
    return list;
  }, [rows, q, filter, cfilter, smart]);

  const stats = useMemo(() => ({
    total: rows.length,
    never: rows.filter((c) => !c.call_count).length,
    due: rows.filter(isDue).length,
    good: rows.filter((c) => ['interested', 'meeting_booked', 'email_sent'].includes(c.last_outcome || '')).length,
  }), [rows]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await fetch('/api/companies', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, assignTo: assignOne === 'me' ? undefined : Number(assignOne) }) });
    setForm({ name: '', email: '', phone: '', website: '', country: '' });
    load();
  }

  async function upload(f: File) {
    const fd = new FormData();
    fd.append('file', f);
    fd.append('assignTo', assignImport);
    const r = await fetch('/api/companies/import', { method: 'POST', body: fd });
    const j = await r.json();
    setMsg(r.ok ? `Imported ${j.added} companies (${Object.entries(j.byCountry || {}).map(([k, v]) => `${String(k).toUpperCase()} ${v}`).join(', ')})` : j.error || 'Import failed');
    if (fileRef.current) fileRef.current.value = '';
    load();
  }

  async function setCountry(c: Company, country: string) {
    setRows((rs) => rs.map((x) => (x.id === c.id ? { ...x, country } : x)));
    await fetch(`/api/companies/${c.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ country }) });
  }

  async function generate(c: Company) {
    const l = lang[c.id] || langFor(c.country);
    setBusy((b) => ({ ...b, [c.id]: true }));
    setJobs((j) => ({ ...j, [c.id]: { name: c.name, start: Date.now() } }));
    setMsg('');
    const r = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ companyId: c.id, lang: l }) });
    const j = await r.json().catch(() => ({ error: 'Server error (timeout?)' }));
    setBusy((b) => ({ ...b, [c.id]: false }));
    setJobs((js) => ({ ...js, [c.id]: { ...js[c.id], done: true } }));
    if (r.ok) location.href = `/deck/${j.deckId}`;
    else {
      setMsg(`${c.name}: ${j.error}`);
      setJobs((js) => { const n = { ...js }; delete n[c.id]; return n; });
      load();
    }
  }

  async function del(c: Company) {
    if (!confirm(`Delete ${c.name}, its decks and call log?`)) return;
    await fetch(`/api/companies/${c.id}`, { method: 'DELETE' });
    load();
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    location.href = '/login';
  }

  return (
    <div className="wrap wide">
      <div className="nav">
        <div className="l"><img src="/swiftrix-s.png" alt="" />SWIFTRIX OUTREACH</div>
        <div className="r">
          <span>{email}</span>
          <a className="btn ghost sm" href="/calendar">My calendar</a>
          {admin && <a className="btn ghost sm" href="/admin">Admin dashboard</a>}
          <button className="btn ghost sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><b>{stats.total}</b><span>companies</span></div>
        <div className="kpi"><b>{stats.never}</b><span>never called</span></div>
        <div className={'kpi' + (stats.due ? ' hot' : '')}><b>{stats.due}</b><span>follow-ups due</span></div>
        <div className="kpi good"><b>{stats.good}</b><span>interested / meeting / email sent</span></div>
      </div>

      {admin && (
      <div className="card" style={{ marginBottom: 18 }}>
        <h3>ADD COMPANY</h3>
        <form className="row" onSubmit={add}>
          <input placeholder="Company name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="">Country: auto-detect</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <select value={assignOne} onChange={(e) => setAssignOne(e.target.value)} title="Who gets this company">
            <option value="me">Assign to: me</option>
            {users.filter((u) => u.role === 'user').map((u) => <option key={u.id} value={u.id}>Assign to: {u.email}</option>)}
          </select>
          <button className="btn">Add</button>
          <span style={{ color: 'var(--mute)' }}>or upload Excel:</span>
          <select value={assignImport} onChange={(e) => setAssignImport(e.target.value)} title="Who gets the imported companies">
            <option value="split">Split evenly between callers</option>
            <option value="me">All to me</option>
            {users.filter((u) => u.role === 'user').map((u) => <option key={u.id} value={u.id}>All to {u.email}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </form>
        <div style={{ color: 'var(--mute)', fontSize: 12, marginTop: 8 }}>
          Excel/CSV columns: name, email, phone, website, country (optional). Callers only see the companies assigned to them; reassign anytime in Admin, Companies. With no country the app reads it from the website domain (.lt .de .at .ch) or the phone prefix, otherwise English. The deck language follows the country: LT = Lithuanian, DE / AT / CH = German, other = English.
        </div>
        {msg && <div className="err">{msg}</div>}
      </div>
      )}

      {Object.entries(jobs).map(([id, j]) => {
        const t = (now - j.start) / 1000;
        const pct = j.done ? 100 : Math.min(92, 92 * (1 - Math.exp(-t / 20)));
        const stage = [...STAGES].reverse().find((x) => t >= x.at) || STAGES[0];
        return (
          <div key={id} className="card job">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{j.name}</b>
              <span className="mono">{j.done ? 'Done, opening deck...' : stage.label}</span>
              <span className="mono">{Math.round(pct)}% · {Math.floor(t)}s</span>
            </div>
            <div className="track"><div className="fill" style={{ width: pct + '%' }} /></div>
            <div className="steps">{STAGES.map((x) => <span key={x.label} className={j.done || t >= x.at ? 'on' : ''}>{x.short}</span>)}</div>
          </div>
        );
      })}

      <div className="card">
        <div className="toolbar">
          <input style={{ flex: 1, minWidth: 180 }} placeholder="Search name, website, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>{FILTERS.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}</select>
          <select value={cfilter} onChange={(e) => setCfilter(e.target.value)}>
            <option value="all">All countries</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <label className="mini"><input type="checkbox" checked={smart} onChange={(e) => setSmart(e.target.checked)} /> Smart order (follow-ups, then new)</label>
        </div>
        <table className="t">
          <thead><tr><th></th><th>COMPANY</th><th>CONTACT</th><th>COUNTRY</th><th>CALL STATUS</th><th style={{ width: 360 }}>ACTIONS</th></tr></thead>
          <tbody>
            {shown.map((c) => {
              const l = lang[c.id] || langFor(c.country);
              const ex = (c.decks || []).find((d) => d.lang === l);
              const due = isDue(c);
              return (
                <Fragment key={c.id}>
                  <tr className={open === c.id ? 'openrow' : ''}>
                    <td>{c.logo_url ? <img className="lg" src={c.logo_url} alt="" /> : null}</td>
                    <td><b>{c.name}</b><div style={{ color: 'var(--mute)', fontSize: 12 }}>{c.website}</div></td>
                    <td style={{ fontSize: 12.5, color: '#bdbdc2' }}>
                      {c.phone && <a className="tel" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>}
                      <br />{c.email}
                    </td>
                    <td>
                      <select className="cs" value={c.country || 'other'} onChange={(e) => setCountry(c, e.target.value)}>
                        {COUNTRIES.map((x) => <option key={x.code} value={x.code}>{x.code.toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td>
                      {c.call_count ? (
                        <div className="cstat" onClick={() => setOpen(open === c.id ? null : c.id)}>
                          <span className={`pill oc-${outcomeTone(c.last_outcome)}`}>{outcomeLabel(c.last_outcome)}</span>
                          <div className="sub">{c.last_by_other ? <b className="other">{c.last_by}</b> : 'you'} · {ago(c.last_at)}{c.call_count > 1 ? ` · ${c.call_count} calls` : ''}</div>
                          {due && <div className="due">follow-up due {String(c.last_followup).slice(0, 10)}</div>}
                          {!due && c.last_outcome === 'call_back' && c.last_followup && <div className="sub">call back {String(c.last_followup).slice(0, 10)}</div>}
                          {c.last_note && <div className="sub note" title={c.last_note}>{c.last_note}</div>}
                        </div>
                      ) : <span className="pill">not called yet</span>}
                    </td>
                    <td>
                      <div className="row">
                        <button className={'btn sm' + (c.call_count ? ' ghost' : '')} onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Close' : 'Log call'}</button>
                        <select value={l} onChange={(e) => setLang({ ...lang, [c.id]: e.target.value })}>
                          <option value="lt">Lietuvių</option><option value="en">English</option><option value="de">Deutsch</option>
                        </select>
                        {ex ? (
                          <>
                            <a className="btn sm" href={`/deck/${ex.id}`}>Open slides + script</a>
                            <button className="btn ghost sm" disabled={busy[c.id]} title="Write a brand new deck (uses tokens)" onClick={() => { if (confirm('Generate a new deck? The current one stays saved.')) generate(c); }}>{busy[c.id] ? 'Working...' : 'Regenerate'}</button>
                          </>
                        ) : (
                          <button className="btn sm" disabled={busy[c.id]} onClick={() => generate(c)}>{busy[c.id] ? 'Researching... ~40s' : 'Generate'}</button>
                        )}
                        {admin && <button className="btn ghost sm" onClick={() => del(c)} title="Delete company">x</button>}
                      </div>
                    </td>
                  </tr>
                  {open === c.id && (
                    <tr className="logrow"><td colSpan={6}><CallLogger companyId={c.id} defaultEmail={c.email || ''} onSaved={load} /></td></tr>
                  )}
                </Fragment>
              );
            })}
            {!shown.length && <tr><td colSpan={6} style={{ color: 'var(--mute)', padding: 24 }}>{rows.length ? 'Nothing matches this filter.' : admin ? 'No companies yet. Add one above or upload a spreadsheet.' : 'No companies assigned to you yet. Ask your admin to assign some.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
