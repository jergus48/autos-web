import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { exchangeCode, primaryCalendarEmail, redirectUri, setSetting } from '@/lib/google';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const u = new URL(req.url);
  const origin = new URL(redirectUri(req)).origin;
  const back = (m: string) => NextResponse.redirect(`${origin}/admin?google=${encodeURIComponent(m)}`);
  const want = /(?:^|; )g_state=([^;]+)/.exec(req.headers.get('cookie') || '')?.[1];
  if (u.searchParams.get('error')) return back(u.searchParams.get('error')!);
  if (!want || want !== u.searchParams.get('state')) return back('bad_state');
  try {
    const t = await exchangeCode(u.searchParams.get('code') || '', req);
    if (!t.refresh_token) return back('no_refresh_token');
    await setSetting('google_refresh_token', t.refresh_token);
    await setSetting('google_scopes', t.scope || '');
    try { await setSetting('google_email', await primaryCalendarEmail()); } catch {}
    return back('connected');
  } catch (e: any) {
    return back('error: ' + e.message);
  }
}
