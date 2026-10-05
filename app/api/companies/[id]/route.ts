import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { parseCountry } from '@/lib/countries';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  if (s.role !== 'admin') return NextResponse.json({ error: 'Only the admin can delete companies' }, { status: 403 });
  const { id } = await params;
  await q('delete from companies where id=$1', [id]);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const b = await req.json();
  const country = b.country ? parseCountry(b.country) : null;
  await q(
    `update companies set name=coalesce($3,name), email=coalesce($4,email), phone=coalesce($5,phone), website=coalesce($6,website), logo_url=coalesce($7,logo_url), country=coalesce($8,country)
     where id=$1 and ($9::boolean or country=(select u0.country from users u0 where u0.id=$2))`,
    [id, s.uid, b.name ?? null, b.email ?? null, b.phone ?? null, b.website ?? null, b.logo_url ?? null, country, s.role === 'admin']
  );
  return NextResponse.json({ ok: true });
}
