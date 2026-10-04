import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { inferCountry, parseCountry } from '@/lib/countries';

// Each row also carries the latest call on the same company by ANYONE (matched by id, website domain or name),
// so a caller sees when a colleague already phoned them.
export async function GET() {
  const s = (await getSession())!;
  const rows = await q(
    `select c.*,
        (select json_agg(json_build_object('id',d.id,'lang',d.lang,'share_token',d.share_token,'created_at',d.created_at) order by d.created_at desc)
           from decks d where d.company_id=c.id) as decks,
        lc.outcome as last_outcome, lc.note as last_note, lc.created_at as last_at, lc.followup_at as last_followup,
        lc.email as last_by, (lc.user_id is distinct from $1) as last_by_other,
        coalesce(cnt.n,0) as call_count
     from companies c
     left join lateral (
        select k.outcome,k.note,k.created_at,k.followup_at::text as followup_at,k.user_id,u.email
        from calls k join companies c2 on c2.id=k.company_id left join users u on u.id=k.user_id
        where c2.id=c.id or (dom(c.website)<>'' and dom(c2.website)=dom(c.website)) or lower(c2.name)=lower(c.name)
        order by k.created_at desc limit 1) lc on true
     left join lateral (
        select count(*)::int n from calls k join companies c2 on c2.id=k.company_id
        where c2.id=c.id or (dom(c.website)<>'' and dom(c2.website)=dom(c.website)) or lower(c2.name)=lower(c.name)) cnt on true
     where c.owner_id=$1 order by c.created_at desc`,
    [s.uid]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = (await getSession())!;
  if (s.role !== 'admin') return NextResponse.json({ error: 'Only the admin can add companies' }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const country = parseCountry(b.country) || inferCountry(b.website, b.phone);
  let owner = s.uid;
  if (b.assignTo && Number(b.assignTo) !== s.uid) {
    const u = await q('select id from users where id=$1', [Number(b.assignTo)]);
    if (!u[0]) return NextResponse.json({ error: 'Unknown user' }, { status: 400 });
    owner = u[0].id;
  }
  const rows = await q('insert into companies(owner_id,name,email,phone,website,country) values($1,$2,$3,$4,$5,$6) returning *', [
    owner, b.name.trim(), b.email || null, b.phone || null, b.website || null, country,
  ]);
  return NextResponse.json(rows[0]);
}
