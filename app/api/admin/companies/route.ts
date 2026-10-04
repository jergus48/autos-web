import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

// Every company across all callers, with its owner and latest call. Admin only (enforced by proxy.ts).
export async function GET() {
  const rows = await q(
    `select c.id,c.name,c.website,c.phone,c.email,c.country,c.owner_id,u.email as owner_email,
        lc.outcome as last_outcome, lc.created_at as last_at, lc.email as last_by, coalesce(cnt.n,0) as call_count
     from companies c left join users u on u.id=c.owner_id
     left join lateral (select k.outcome,k.created_at,uu.email from calls k left join users uu on uu.id=k.user_id where k.company_id=c.id order by k.created_at desc limit 1) lc on true
     left join lateral (select count(*)::int n from calls k where k.company_id=c.id) cnt on true
     order by c.created_at desc limit 2000`
  );
  return NextResponse.json(rows);
}

// Reassign companies to another user: { ids: number[], ownerId: number }
export async function PATCH(req: Request) {
  const { ids, ownerId } = await req.json();
  if (!Array.isArray(ids) || !ids.length || !Number.isInteger(ownerId)) return NextResponse.json({ error: 'ids and ownerId required' }, { status: 400 });
  const u = await q('select id from users where id=$1', [ownerId]);
  if (!u[0]) return NextResponse.json({ error: 'Unknown user' }, { status: 400 });
  await q('update companies set owner_id=$1 where id = any($2::int[])', [ownerId, ids.map(Number)]);
  return NextResponse.json({ ok: true, moved: ids.length });
}

export async function DELETE(req: Request) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: 'ids required' }, { status: 400 });
  await q('delete from companies where id = any($1::int[])', [ids.map(Number)]);
  return NextResponse.json({ ok: true, deleted: ids.length });
}
