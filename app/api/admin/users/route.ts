import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { q } from '@/lib/db';

export async function GET() {
  const rows = await q(
    `select u.id,u.email,u.role,u.created_at,
       (select count(*)::int from decks d join companies c on c.id=d.company_id where c.owner_id=u.id) as decks,
       (select coalesce(sum(tokens),0)::int from usage_log l where l.user_id=u.id) as tokens
     from users u order by u.id`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { email, password, role } = await req.json();
  if (!email || !password || String(password).length < 8) return NextResponse.json({ error: 'Email and password (min 8 chars) required' }, { status: 400 });
  try {
    const rows = await q('insert into users(email,password_hash,role) values($1,$2,$3) returning id,email,role', [
      String(email).toLowerCase().trim(), bcrypt.hashSync(String(password), 10), role === 'admin' ? 'admin' : 'user',
    ]);
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await q(`delete from users where id=$1 and email <> $2`, [id, (process.env.ADMIN_EMAIL || '').toLowerCase()]);
  return NextResponse.json({ ok: true });
}
