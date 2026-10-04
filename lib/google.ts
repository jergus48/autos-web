import { q } from '@/lib/db';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

const hasClient = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function redirectUri(req: Request) {
  const u = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || u.host;
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : u.protocol.replace(':', ''));
  return `${proto}://${host}/api/google/callback`;
}

export function authUrl(req: Request, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

async function tokenCall(body: Record<string, string>) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', ...body }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.error || `Google token error ${r.status}`);
  return j;
}

export async function exchangeCode(code: string, req: Request) {
  return tokenCall({ code, grant_type: 'authorization_code', redirect_uri: redirectUri(req) });
}

export async function getSetting(key: string) {
  const r = await q('select value from settings where key=$1', [key]);
  return (r[0]?.value as string) || null;
}
export async function setSetting(key: string, value: string | null) {
  if (value === null) await q('delete from settings where key=$1', [key]);
  else await q('insert into settings(key,value) values($1,$2) on conflict(key) do update set value=excluded.value', [key, value]);
}

export async function googleStatus() {
  if (!hasClient()) return { configured: false, connected: false } as const;
  const rt = await getSetting('google_refresh_token');
  return { configured: true, connected: !!rt, email: await getSetting('google_email'), scopes: await getSetting('google_scopes') } as const;
}

async function accessToken() {
  const rt = await getSetting('google_refresh_token');
  if (!rt) throw new Error('Google is not connected. An admin must connect it in Admin.');
  const j = await tokenCall({ grant_type: 'refresh_token', refresh_token: rt });
  return j.access_token as string;
}

async function gjson(url: string, init: RequestInit = {}) {
  const t = await accessToken();
  const r = await fetch(url, { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${t}`, 'content-type': 'application/json' } });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${j.error?.message || j.error_description || 'Google API error'} (${r.status})`);
  return j;
}

export async function primaryCalendarEmail() {
  const j = await gjson('https://www.googleapis.com/calendar/v3/calendars/primary');
  return j.id as string;
}

export async function createMeeting(o: { summary: string; description?: string; start: string; end: string; timeZone: string; attendee: string }) {
  const j = await gjson('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all', {
    method: 'POST',
    body: JSON.stringify({
      summary: o.summary,
      description: o.description || '',
      start: { dateTime: o.start, timeZone: o.timeZone },
      end: { dateTime: o.end, timeZone: o.timeZone },
      attendees: [{ email: o.attendee }],
      conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
    }),
  });
  return {
    eventId: j.id as string,
    meetUrl: (j.hangoutLink as string) || null,
    meetCode: (j.conferenceData?.conferenceId as string) || null,
    htmlLink: (j.htmlLink as string) || null,
  };
}

// Transcript via the Meet REST API; falls back to exporting the transcript Doc from Drive.
export async function fetchTranscript(meetCode: string): Promise<{ state: string; text?: string }> {
  const recs = await gjson(`https://meet.googleapis.com/v2/conferenceRecords?filter=${encodeURIComponent(`space.meeting_code="${meetCode}"`)}`);
  const records: any[] = recs.conferenceRecords || [];
  if (!records.length) return { state: 'no_meeting_yet' };
  const names: Record<string, string> = {};
  const parts: string[] = [];
  for (const rec of records.reverse()) {
    const tr = await gjson(`https://meet.googleapis.com/v2/${rec.name}/transcripts`);
    for (const t of (tr.transcripts || []) as any[]) {
      if (t.state && t.state !== 'FILE_GENERATED' && t.state !== 'ENDED') continue;
      let text = '';
      try {
        let page = '';
        do {
          const e = await gjson(`https://meet.googleapis.com/v2/${t.name}/entries?pageSize=100${page ? `&pageToken=${page}` : ''}`);
          for (const en of (e.transcriptEntries || []) as any[]) {
            if (!(en.participant in names)) {
              try {
                const p = await gjson(`https://meet.googleapis.com/v2/${en.participant}`);
                names[en.participant] = p.signedinUser?.displayName || p.anonymousUser?.displayName || 'Guest';
              } catch { names[en.participant] = 'Speaker'; }
            }
            text += `${names[en.participant]}: ${en.text}\n`;
          }
          page = e.nextPageToken || '';
        } while (page);
      } catch (err) {
        const id = t.docsDestination?.document;
        if (!id) throw err;
        const tk = await accessToken();
        const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`, { headers: { authorization: `Bearer ${tk}` } });
        if (!r.ok) throw err;
        text = await r.text();
      }
      if (text.trim()) parts.push(text.trim());
    }
  }
  const text = parts.join('\n\n');
  return text ? { state: 'ready', text } : { state: 'no_transcript' };
}
