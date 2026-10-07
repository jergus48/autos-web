import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  let rows: any[];
  try {
    // status comes through to_jsonb so this still works (as 'approved') before the
    // users.status column exists, and nobody who already had an account is locked out.
    rows = await q(`select id,email,password_hash,role,coalesce(to_jsonb(users)->>'status','approved') as status from users where email=$1`, [String(email).toLowerCase().trim()]);
  } catch (e: any) {
    console.error('login db error', e?.code, e?.message);
    return NextResponse.json({ error: 'Server could not reach the database', code: e?.code || 'unknown' }, { status: 500 });
  }
  const u = rows[0];
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) {
    return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 });
  }
  // Applicants from /join can only sign in once an admin has approved them.
  // Checked after the password, so the message is shown only to the account owner.
  if (u.status !== 'approved') {
    return NextResponse.json({ error: 'Your application is still being reviewed. We will contact you as soon as it is approved.' }, { status: 403 });
  }
  const token = await signSession({ uid: u.id, email: u.email, role: u.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 14 * 86400 });
  return res;
}
