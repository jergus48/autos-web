import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';
import { registerApplicant } from '@/lib/applications';

// Public: someone applying to become a sales partner (see /join). Creates a
// pending account. The password is hashed here and never stored or logged in
// plain text. Nothing is readable by the applicant until an admin approves.
//
// Two ways in: the page sends JSON with fetch; a plain HTML form post (used if
// the page's scripts have not loaded, or are blocked) is answered with a
// redirect back to /join. The form is always a POST, never a GET, so a password
// can never end up in a URL.
export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 20_000) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });

  const ct = req.headers.get('content-type') || '';
  const isForm = ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data');
  let lang = 'en';
  let body: any = null;
  if (isForm) {
    const fd = await req.formData().catch(() => null);
    if (fd) {
      const l = String(fd.get('lang') || '');
      lang = l === 'lt' || l === 'de' ? l : 'en';
      body = { email: fd.get('email'), password: fd.get('password'), experience: fd.get('experience'), consent: fd.get('consent') === 'on', website: fd.get('website') };
    }
  } else {
    body = await req.json().catch(() => null);
  }
  if (!body || typeof body !== 'object') {
    return isForm ? back(req, lang, 'error', 'generic') : NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const r = await registerApplicant(q, (pw) => bcrypt.hashSync(pw, 10), body);
    if ('error' in r) return isForm ? back(req, lang, 'error', r.code) : NextResponse.json({ error: r.error, code: r.code }, { status: r.status });
    return isForm ? back(req, lang, 'sent', '1') : NextResponse.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (e: any) {
    console.error('register error', e?.code, e?.message); // never the request body
    return isForm
      ? back(req, lang, 'error', 'unavailable')
      : NextResponse.json({ error: 'Applications are temporarily unavailable. Please try again later.', code: 'unavailable' }, { status: 500 });
  }
}

// 303 so the browser follows with a GET to the page (never re-posts the form).
function back(req: Request, lang: string, key: 'sent' | 'error', value: string) {
  return NextResponse.redirect(new URL(`/join?lang=${lang}&${key}=${encodeURIComponent(value)}`, req.url), 303);
}
