import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { buildPrep, buildSlides, buildPresenter } from '@/lib/generate';
import { LANGS } from '@/lib/fixed';

export const maxDuration = 60;

// Three stages, each its own request so every one fits the time limit:
//   prep      research + cold-call script (before the call)
//   slides    the personalised deck, meant for the Meet (after the meeting is agreed, or manual)
//   presenter what to say while presenting the slides
export async function POST(req: Request) {
  const s = (await getSession())!;
  const { companyId, lang, stage = 'prep', deckId, manual } = await req.json();
  if (!LANGS.includes(lang)) return NextResponse.json({ error: 'Bad language' }, { status: 400 });
  if (!['prep', 'slides', 'presenter'].includes(stage)) return NextResponse.json({ error: 'Bad stage' }, { status: 400 });
  const rows = await q('select * from companies where id=$1 and ($3::boolean or country=(select u0.country from users u0 where u0.id=$2))', [companyId, s.uid, s.role === 'admin']);
  const c = rows[0];
  if (!c) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  try {
    if (stage === 'prep') {
      if (s.role !== 'admin') {
        const limit = Number(process.env.DAILY_LIMIT || 40);
        const [{ n }] = await q(`select count(*)::int n from usage_log where user_id=$1 and created_at > now() - interval '1 day'`, [s.uid]);
        if (n >= limit) return NextResponse.json({ error: `Daily limit of ${limit} preparations reached` }, { status: 429 });
      }
      await q(`update companies set status='working' where id=$1`, [c.id]);
      const out = await buildPrep(c, lang);
      const [deck] = await q('insert into decks(company_id,lang,research,script) values($1,$2,$3,$4) returning id', [c.id, lang, out.research, out.script]);
      await q(`update companies set status='ready', logo_url=coalesce(logo_url,$2) where id=$1`, [c.id, out.logo || null]);
      await q('insert into usage_log(user_id,company_id,tokens) values($1,$2,$3)', [s.uid, c.id, out.tokens]);
      return NextResponse.json({ deckId: deck.id });
    }

    const deck = (await q('select * from decks where id=$1 and company_id=$2', [deckId, c.id]))[0];
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

    if (stage === 'slides') {
      const [{ agreed }] = await q(
        `select (exists(select 1 from calls where company_id=$1 and outcome='meeting_booked') or exists(select 1 from meetings where company_id=$1)) as agreed`,
        [c.id]
      );
      if (!agreed && !manual) {
        return NextResponse.json({ error: 'The client has not agreed to a meeting yet. Slides are for the meeting, not the cold call.', code: 'not_agreed' }, { status: 409 });
      }
      const out = await buildSlides(c, lang, deck.research || {});
      const token = deck.share_token || crypto.randomBytes(12).toString('hex');
      await q(
        `update decks set slides=$2, presenter=null, share_token=$3, slides_at=now(), slides_by=$4, slides_early=coalesce(slides_early,$5) where id=$1`,
        [deck.id, out.slides, token, s.uid, !agreed]
      );
      await q('insert into usage_log(user_id,company_id,tokens) values($1,$2,$3)', [s.uid, c.id, out.tokens]);
      return NextResponse.json({ deckId: deck.id });
    }

    if (!deck.slides) return NextResponse.json({ error: 'Generate the slides first' }, { status: 400 });
    const out = await buildPresenter(c, lang, deck.research || {}, deck.slides);
    await q('update decks set presenter=$2 where id=$1', [deck.id, out.presenter]);
    await q('insert into usage_log(user_id,company_id,tokens) values($1,$2,$3)', [s.uid, c.id, out.tokens]);
    return NextResponse.json({ deckId: deck.id });
  } catch (e: any) {
    if (stage === 'prep') await q(`update companies set status='error' where id=$1`, [c.id]);
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 });
  }
}
