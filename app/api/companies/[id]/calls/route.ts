import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { VALID_OUTCOMES } from '@/lib/outcomes';

async function owns(s: { uid: number; role: string }, id: string) {
  const r = await q('select id from companies where id=$1 and ($3::boolean or owner_id=$2)', [id, s.uid, s.role === 'admin']);
  return !!r[0];
}

// Full history for this company, including calls other users made to the same company (matched by domain or name).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  if (!(await owns(s, id))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const rows = await q(
    `select k.id,k.outcome,k.note,k.followup_at::text as followup_at,k.created_at,u.email as user_email,(k.user_id=$2) as mine
     from calls k join companies c2 on c2.id=k.company_id left join users u on u.id=k.user_id
     join companies c on c.id=$1
     where c2.id=c.id or (dom(c.website)<>'' and dom(c2.website)=dom(c.website)) or lower(c2.name)=lower(c.name)
     order by k.created_at desc limit 50`,
    [id, s.uid]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  if (!(await owns(s, id))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const b = await req.json();
  if (!VALID_OUTCOMES.includes(b.outcome)) return NextResponse.json({ error: 'Pick an outcome' }, { status: 400 });
  const follow = /^\d{4}-\d{2}-\d{2}$/.test(b.followup_at || '') ? b.followup_at : null;
  const rows = await q('insert into calls(company_id,user_id,outcome,note,followup_at) values($1,$2,$3,$4,$5) returning id', [
    id, s.uid, b.outcome, (b.note || '').toString().slice(0, 2000) || null, follow,
  ]);
  return NextResponse.json({ ok: true, id: rows[0].id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const { callId } = await req.json();
  // you can only undo your own log entries
  await q('delete from calls where id=$1 and company_id=$2 and user_id=$3', [callId, id, s.uid]);
  return NextResponse.json({ ok: true });
}
