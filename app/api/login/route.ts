import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  let rows: any[];
  try {
    rows = await q('select id,email,password_hash,role from users where email=$1', [String(email).toLowerCase().trim()]);
  } catch (e: any) {
    console.error('login db error', e?.code, e?.message);
    return NextResponse.json({ error: 'Server could not reach the database', code: e?.code || 'unknown' }, { status: 500 });
  }
  const u = rows[0];
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) {
    return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 });
  }
  const token = await signSession({ uid: u.id, email: u.email, role: u.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 14 * 86400 });
  return res;
}
