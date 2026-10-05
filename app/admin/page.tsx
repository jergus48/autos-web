'use client';
import GoogleConnect from '@/components/GoogleConnect';
import { useCallback, useEffect, useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { OUTCOMES, ago, outcomeLabel, outcomeTone } from '@/lib/outcomes';

type U = { id: number; email: string; role: string; country?: string | null; decks: number; tokens: number };
type Stats = {
  days: number;
  totals: { calls: number; interested: number; meetings: number; emails: number; companies: number };
  perUser: { id: number; email: string; calls: number; interested: number; meetings: number; emails: number; not_interested: number; no_answer: number; companies: number; list_size: number; last_call?: string }[];
  perDay: { day: string; n: number; good: number }[];
  outcomes: { outcome: string; n: number }[];
  followupsDue: number;
  companies: { n: number; untouched: number };
};
type Co = { id: number; name: string; website?: string; phone?: string; country?: string; owner_id: number; owner_email?: string; last_outcome?: string; last_at?: string; last_by?: string; call_count: number };
type Feed = { id: number; outcome: string; note?: string; followup_at?: string; created_at: string; user_email?: string; name: string; website?: string; country?: string; phone?: string };

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '-');

export default function Admin() {
  const [tab, setTab] = useState<'calls' | 'companies' | 'users'>('calls');
  const [cos, setCos] = useState<Co[]>([]);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [cq, setCq] = useState('');
  const [cOwner, setCOwner] = useState('');
  const [cCountry, setCCountry] = useState('');
  const [cState, setCState] = useState('');
  const [target, setTarget] = useState('');
  const [cmsg, setCmsg] = useState('');
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feed, setFeed] = useState<Feed[]>([]);
  const [fu, setFu] = useState('');
  const [fo, setFo] = useState('');
  const [fc, setFc] = useState('');
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ email: '', password: '', role: 'user', country: '' });

  const loadCalls = useCallback(async () => {
    const qs = new URLSearchParams({ days: String(days) });
    if (fu) qs.set('user', fu);
    if (fo) qs.set('outcome', fo);
    if (fc) qs.set('country', fc);
    const [s, c] = await Promise.all([fetch(`/api/admin/stats?days=${days}`), fetch(`/api/admin/calls?${qs}`)]);
    if (s.ok) setStats(await s.json());
    if (c.ok) setFeed(await c.json());
  }, [days, fu, fo, fc]);
  useEffect(() => { loadCalls(); }, [loadCalls]);

  async function loadCos() {
    const r = await fetch('/api/admin/companies');
    if (r.ok) setCos(await r.json());
  }
  useEffect(() => { if (tab === 'companies') loadCos(); }, [tab]);

  const shownCos = cos.filter((c) => {
    const q = cq.trim().toLowerCase();
    return (!q || [c.name, c.website, c.phone].some((v) => (v || '').toLowerCase().includes(q))) &&
      (!cOwner || String(c.owner_id) === cOwner) && (!cCountry || c.country === cCountry) &&
      (!cState || (cState === 'never' ? !c.call_count : cState === 'called' ? c.call_count > 0 : c.last_outcome === cState));
  });
  const allSel = shownCos.length > 0 && shownCos.every((c) => sel.has(c.id));
  async function moveSelected() {
    if (!sel.size || !target) return;
    const r = await fetch('/api/admin/companies', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: [...sel], ownerId: Number(target) }) });
    const j = await r.json();
    setCmsg(r.ok ? `Moved ${j.moved} companies` : j.error);
    setSel(new Set());
    loadCos();
  }
  async function deleteSelected() {
    if (!sel.size || !confirm(`Delete ${sel.size} companies with their decks and call log?`)) return;
    const r = await fetch('/api/admin/companies', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: [...sel] }) });
    const j = await r.json();
    setCmsg(r.ok ? `Deleted ${j.deleted} companies` : j.error);
    setSel(new Set());
    loadCos();
  }

  async function loadUsers() {
    const r = await fetch('/api/admin/users');
    if (r.ok) setUsers(await r.json());
  }
  useEffect(() => { loadUsers(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    const j = await r.json();
    if (!r.ok) return setErr(j.error);
    setF({ email: '', password: '', role: 'user', country: '' });
    loadUsers();
  }
  async function del(u: U) {
    if (!confirm(`Remove ${u.email}? Their companies, decks and call log are deleted too.`)) return;
    await fetch('/api/admin/users', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: u.id }) });
    loadUsers();
    loadCalls();
  }

  const max = Math.max(1, ...(stats?.perDay || []).map((d) => d.n));
  const t = stats?.totals;
  const csv = `/api/admin/calls?format=csv&days=${days}${fu ? `&user=${fu}` : ''}${fo ? `&outcome=${fo}` : ''}${fc ? `&country=${fc}` : ''}`;

  return (
    <div className="wrap wide">
      <div className="nav">
        <div className="l"><img src="/swiftrix-s.png" alt="" />ADMIN</div>
        <div className="r"><a className="btn ghost sm" href="/">Back to my list</a></div>
      </div>

      <GoogleConnect />

      <div className="row" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={tab === 'calls' ? 'on' : ''} onClick={() => setTab('calls')}>Call dashboard</button>
          <button className={tab === 'companies' ? 'on' : ''} onClick={() => setTab('companies')}>Companies</button>
          <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}>Users</button>
        </div>
        {tab === 'calls' && (
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ marginLeft: 'auto' }}>
            <option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
        )}
      </div>

      {tab === 'calls' && stats && t && (
        <>
          <div className="kpi-row">
            <div className="kpi"><b>{t.calls}</b><span>calls logged</span></div>
            <div className="kpi good"><b>{t.meetings}</b><span>meetings agreed ({pct(t.meetings, t.calls)})</span></div>
            <div className="kpi good"><b>{t.interested}</b><span>interested ({pct(t.interested, t.calls)})</span></div>
            <div className="kpi good"><b>{t.emails}</b><span>emails / decks sent</span></div>
            <div className={'kpi' + (stats.followupsDue ? ' hot' : '')}><b>{stats.followupsDue}</b><span>follow-ups overdue</span></div>
            <div className="kpi"><b>{stats.companies.untouched}</b><span>of {stats.companies.n} companies never called</span></div>
          </div>

          <div className="grid2">
            <div className="card">
              <h3>CALLS PER DAY</h3>
              <div className="bars">
                {stats.perDay.map((d) => (
                  <div key={d.day} className="bar" title={`${d.day}: ${d.n} calls, ${d.good} positive`}>
                    <div className="col"><div className="n" style={{ height: (d.n / max) * 100 + '%' }}><div className="g" style={{ height: d.n ? (d.good / d.n) * 100 + '%' : 0 }} /></div></div>
                    <span>{stats.perDay.length <= 14 ? d.day.slice(5) : ''}</span>
                  </div>
                ))}
              </div>
              <div className="legend"><i className="gd" /> positive (interested, meeting, email sent) <i className="nd" /> other</div>
            </div>
            <div className="card">
              <h3>HOW CALLS ENDED</h3>
              {OUTCOMES.map((o) => {
                const n = stats.outcomes.find((x) => x.outcome === o.code)?.n || 0;
                return (
                  <div key={o.code} className="orow">
                    <span className={`pill oc-${o.tone}`}>{o.label}</span>
                    <div className="obar"><div className={`of oc-${o.tone}`} style={{ width: (t.calls ? (n / t.calls) * 100 : 0) + '%' }} /></div>
                    <b>{n}</b>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3>CALLERS</h3>
            <table className="t">
              <thead><tr><th>CALLER</th><th>CALLS</th><th>COMPANIES REACHED</th><th>INTERESTED</th><th>MEETINGS</th><th>EMAILS</th><th>NO ANSWER</th><th>NOT INTERESTED</th><th>HIT RATE</th><th>LIST SIZE</th><th>LAST CALL</th></tr></thead>
              <tbody>
                {stats.perUser.map((u) => (
                  <tr key={u.id}>
                    <td><a href="#" onClick={(e) => { e.preventDefault(); setFu(String(u.id)); }}><b>{u.email}</b></a></td>
                    <td>{u.calls}</td><td>{u.companies}</td><td>{u.interested}</td><td>{u.meetings}</td><td>{u.emails}</td><td>{u.no_answer}</td><td>{u.not_interested}</td>
                    <td>{pct(u.interested + u.meetings + u.emails, u.calls)}</td><td>{u.list_size}</td><td>{u.last_call ? ago(u.last_call) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ color: 'var(--mute)', fontSize: 12, marginTop: 8 }}>Hit rate = interested + meeting agreed + email sent, divided by calls.</div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="toolbar">
              <h3 style={{ margin: 0, marginRight: 'auto' }}>ACTIVITY</h3>
              <select value={fu} onChange={(e) => setFu(e.target.value)}>
                <option value="">All callers</option>
                {stats.perUser.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
              </select>
              <select value={fo} onChange={(e) => setFo(e.target.value)}>
                <option value="">All outcomes</option>
                {OUTCOMES.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
              <select value={fc} onChange={(e) => setFc(e.target.value)}>
                <option value="">All countries</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <a className="btn ghost sm" href={csv}>Export CSV</a>
            </div>
            <table className="t">
              <thead><tr><th>WHEN</th><th>CALLER</th><th>COMPANY</th><th>COUNTRY</th><th>OUTCOME</th><th>NOTE</th></tr></thead>
              <tbody>
                {feed.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--mute)' }} title={new Date(r.created_at).toLocaleString()}>{ago(r.created_at)}</td>
                    <td>{r.user_email || '(removed user)'}</td>
                    <td><b>{r.name}</b><div style={{ color: 'var(--mute)', fontSize: 12 }}>{r.website}{r.phone ? ` · ${r.phone}` : ''}</div></td>
                    <td>{(r.country || '').toUpperCase()}</td>
                    <td><span className={`pill oc-${outcomeTone(r.outcome)}`}>{outcomeLabel(r.outcome)}</span>{r.followup_at && <div className="sub" style={{ fontSize: 11, color: 'var(--mute)' }}>follow-up {String(r.followup_at).slice(0, 10)}</div>}</td>
                    <td style={{ maxWidth: 360, color: '#bdbdc2', fontSize: 13 }}>{r.note}</td>
                  </tr>
                ))}
                {!feed.length && <tr><td colSpan={6} style={{ color: 'var(--mute)', padding: 24 }}>No calls logged for this filter yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'companies' && (
        <div className="card">
          <div className="toolbar">
            <input style={{ flex: 1, minWidth: 180 }} placeholder="Search name, website, phone..." value={cq} onChange={(e) => setCq(e.target.value)} />
            <select value={cOwner} onChange={(e) => setCOwner(e.target.value)}>
              <option value="">All callers</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select>
            <select value={cCountry} onChange={(e) => setCCountry(e.target.value)}>
              <option value="">All countries</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <select value={cState} onChange={(e) => setCState(e.target.value)}>
              <option value="">Any status</option>
              <option value="never">Never called</option>
              <option value="called">Called</option>
              {OUTCOMES.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          <div className="toolbar" style={{ background: sel.size ? '#16200a' : undefined, padding: sel.size ? 10 : 0, borderRadius: 8 }}>
            <b style={{ fontSize: 13 }}>{sel.size} selected</b>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Move selected to...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select>
            <button className="btn sm" disabled={!sel.size || !target} onClick={moveSelected}>Move</button>
            <button className="btn ghost sm" disabled={!sel.size} onClick={deleteSelected}>Delete selected</button>
            {cmsg && <span style={{ color: 'var(--g)', fontSize: 13 }}>{cmsg}</span>}
            <span style={{ marginLeft: 'auto', color: 'var(--mute)', fontSize: 12 }}>{shownCos.length} of {cos.length} companies</span>
          </div>
          <table className="t">
            <thead><tr><th style={{ width: 30 }}><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(shownCos.map((c) => c.id)))} /></th><th>COMPANY</th><th>COUNTRY</th><th>ASSIGNED TO</th><th>LAST CALL</th></tr></thead>
            <tbody>
              {shownCos.map((c) => (
                <tr key={c.id}>
                  <td><input type="checkbox" checked={sel.has(c.id)} onChange={() => { const n = new Set(sel); n.has(c.id) ? n.delete(c.id) : n.add(c.id); setSel(n); }} /></td>
                  <td><b>{c.name}</b><div style={{ color: 'var(--mute)', fontSize: 12 }}>{c.website}{c.phone ? ` · ${c.phone}` : ''}</div></td>
                  <td>{(c.country || '').toUpperCase()}</td>
                  <td>{c.owner_email || '-'}</td>
                  <td>{c.call_count ? <><span className={`pill oc-${outcomeTone(c.last_outcome)}`}>{outcomeLabel(c.last_outcome)}</span><div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 3 }}>{c.last_by} · {ago(c.last_at)} · {c.call_count} call{c.call_count > 1 ? 's' : ''}</div></> : <span className="pill">never called</span>}</td>
                </tr>
              ))}
              {!shownCos.length && <tr><td colSpan={5} style={{ color: 'var(--mute)', padding: 24 }}>No companies match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3>ADD USER</h3>
            <form className="row" onSubmit={add}>
              <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
              <input type="text" placeholder="Password (min 8)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="user">Caller</option><option value="admin">Admin</option></select>
              <select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} title="Which country's companies this caller sees">
                <option value="">Country: none</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <button className="btn">Add user</button>
            </form>
            {err && <div className="err">{err}</div>}
          </div>
          <div className="card">
            <table className="t">
              <thead><tr><th>EMAIL</th><th>ROLE</th><th>CALLS COMPANIES FROM</th><th>DECKS</th><th>TOKENS USED</th><th></th></tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.id}><td>{u.email}</td><td><span className="pill">{u.role}</span></td>
                  <td>{u.role === 'admin' ? <span style={{ color: 'var(--mute)' }}>all</span> : (
                    <select value={u.country || ''} onChange={async (e) => { await fetch('/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: u.id, country: e.target.value }) }); loadUsers(); }}>
                      <option value="">Not set (sees nothing)</option>
                      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>)}</td><td>{u.decks}</td><td>{u.tokens.toLocaleString()}</td>
                  <td><button className="btn ghost sm" onClick={() => del(u)}>Remove</button></td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
