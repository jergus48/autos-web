import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { buildDeck } from '@/lib/generate';
import { LANGS } from '@/lib/fixed';

export const maxDuration = 60;

export async function POST(req: Request) {
  const s = (await getSession())!;
  const { companyId, lang } = await req.json();
  if (!LANGS.includes(lang)) return NextResponse.json({ error: 'Bad language' }, { status: 400 });
  const rows = await q('select * from companies where id=$1 and owner_id=$2', [companyId, s.uid]);
  const c = rows[0];
  if (!c) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  if (s.role !== 'admin') {
    const limit = Number(process.env.DAILY_LIMIT || 40);
    const [{ n }] = await q(`select count(*)::int n from usage_log where user_id=$1 and created_at > now() - interval '1 day'`, [s.uid]);
    if (n >= limit) return NextResponse.json({ error: `Daily limit of ${limit} decks reached` }, { status: 429 });
  }

  try {
    await q(`update companies set status='working' where id=$1`, [c.id]);
    const out = await buildDeck(c, lang);
    const token = crypto.randomBytes(12).toString('hex');
    const [deck] = await q(
      'insert into decks(company_id,lang,research,slides,script,share_token) values($1,$2,$3,$4,$5,$6) returning id',
      [c.id, lang, out.research, out.slides, out.script, token]
    );
    await q(`update companies set status='ready', logo_url=coalesce(logo_url,$2) where id=$1`, [c.id, out.logo || null]);
    await q('insert into usage_log(user_id,company_id,tokens) values($1,$2,$3)', [s.uid, c.id, out.tokens]);
    return NextResponse.json({ deckId: deck.id });
  } catch (e: any) {
    await q(`update companies set status='error' where id=$1`, [c.id]);
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
