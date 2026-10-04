import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { authUrl } from '@/lib/google';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  if (!process.env.GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'GOOGLE_CLIENT_ID is not set' }, { status: 500 });
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authUrl(req, state));
  res.cookies.set('g_state', state, { httpOnly: true, secure: !req.url.startsWith('http://localhost'), sameSite: 'lax', maxAge: 600, path: '/' });
  return res;
}
