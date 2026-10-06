import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';

function setPath(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (o[keys[i]] == null) return false;
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = value;
  return true;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const { path, value } = await req.json();
  if (typeof path !== 'string' || typeof value !== 'string') return NextResponse.json({ error: 'bad input' }, { status: 400 });
  const rows = await q(
    'select d.slides,d.script,d.presenter from decks d join companies c on c.id=d.company_id where d.id=$1 and ($3::boolean or c.country=(select u0.country from users u0 where u0.id=$2))',
    [id, s.uid, s.role === 'admin']
  );
  if (!rows[0]) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const [root, ...rest] = path.split('.');
  if (root === 'script') {
    if (!setPath(rows[0].script, rest.join('.'), value)) return NextResponse.json({ error: 'bad path' }, { status: 400 });
    await q('update decks set script=$2 where id=$1', [id, rows[0].script]);
  } else if (root === 'presenter') {
    const pr = rows[0].presenter || {};
    if (!setPath(pr, rest.join('.'), value)) return NextResponse.json({ error: 'bad path' }, { status: 400 });
    await q('update decks set presenter=$2 where id=$1', [id, pr]);
  } else if (root === 'slides') {
    if (!setPath(rows[0].slides, rest.join('.'), value)) return NextResponse.json({ error: 'bad path' }, { status: 400 });
    await q('update decks set slides=$2 where id=$1', [id, rows[0].slides]);
  } else return NextResponse.json({ error: 'bad path' }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  await q('delete from decks d using companies c where d.id=$1 and c.id=d.company_id and ($3::boolean or c.country=(select u0.country from users u0 where u0.id=$2))', [id, s.uid, s.role === 'admin']);
  return NextResponse.json({ ok: true });
}
