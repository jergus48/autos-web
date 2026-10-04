'use client';
import { useEffect, useState } from 'react';

export default function GoogleConnect() {
  const [st, setSt] = useState<{ configured: boolean; connected: boolean; email?: string | null } | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetch('/api/google/status').then((r) => r.json()).then(setSt).catch(() => {});
    const g = new URLSearchParams(location.search).get('google');
    if (g) setMsg(g === 'connected' ? 'Google connected.' : `Google connect failed: ${g}`);
  }, []);
  return (
    <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <b>Google Meet</b>
      <span className="mini">
        {!st ? '...' : !st.configured ? 'GOOGLE_CLIENT_ID / SECRET are not set on the server.' : st.connected ? `Connected${st.email ? ` as ${st.email}` : ''}. Meetings and transcripts use this account.` : 'Not connected. Meeting agreed will not create a Meet until you connect.'}
      </span>
      {st?.configured && <a className="btn sm" href="/api/google/connect" style={{ marginLeft: 'auto' }}>{st.connected ? 'Reconnect' : 'Connect Google'}</a>}
      {msg && <div className="err" style={{ width: '100%' }}>{msg}</div>}
    </div>
  );
}
