import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Meetings in a time window. Callers see their own; admins see everyone's
// unless mine=1 (used for free-slot checks, which are per caller).
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const u = new URL(req.url);
  const from = new Date(u.searchParams.get('from') || '');
  const to = new Date(u.searchParams.get('to') || '');
  if (isNaN(+from) || isNaN(+to)) return NextResponse.json({ error: 'from/to required' }, { status: 400 });
  const all = s.role === 'admin' && u.searchParams.get('mine') !== '1';
  const rows = await q(
    `select m.id,m.start_at,m.end_at,m.meet_url,m.html_link,m.attendee_email,m.user_id,u.email as user_email,m.result,m.price,m.tools,m.agreement,m.debrief,
            c.id as company_id,c.name,c.phone,c.email,c.website,c.country,
            (select d.share_token from decks d where d.company_id=c.id and d.share_token is not null
               order by (d.lang = case when c.country in ('de','at','ch') then 'de' when c.country='lt' then 'lt' else 'en' end) desc, d.created_at desc limit 1) as share_token,
            (select d.id from decks d where d.company_id=c.id
               order by (d.lang = case when c.country in ('de','at','ch') then 'de' when c.country='lt' then 'lt' else 'en' end) desc, d.created_at desc limit 1) as deck_id,
            (select cl.note from calls cl where cl.company_id=c.id and coalesce(cl.note,'')<>'' order by cl.created_at desc limit 1) as last_note
     from meetings m
     join companies c on c.id=m.company_id
     left join users u on u.id=m.user_id
     where m.start_at < $2 and m.end_at > $1 and ($3::boolean or m.user_id=$4)
     order by m.start_at`,
    [from.toISOString(), to.toISOString(), all, s.uid]
  );
  return NextResponse.json(rows);
}
