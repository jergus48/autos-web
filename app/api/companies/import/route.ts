import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { inferCountry, parseCountry } from '@/lib/countries';

const FIELDS: Record<string, RegExp> = {
  name: /^(name|company|company name|firma|spolocnost|společnost|imone|įmonė|pavadinimas|unternehmen|nazov|názov)/i,
  email: /(e-?mail|el\.? ?pa[sš]tas|mail)/i,
  phone: /(phone|tel|mobil|telefon|numeris)/i,
  website: /(web|url|site|domain|www|svetain)/i,
  country: /(country|land|salis|šalis|lietuva|krajina|štát|stat\b|nation|region)/i,
};

export async function POST(req: Request) {
  const s = (await getSession())!;
  if (s.role !== 'admin') return NextResponse.json({ error: 'Only the admin can import companies' }, { status: 403 });
  const form = await req.formData();
  const assign = String(form.get('assignTo') || 'me');
  let owners: number[] = [s.uid];
  if (assign === 'split') {
    const callers = await q("select id from users where role='user' order by id");
    if (callers.length) owners = callers.map((c: any) => c.id);
  } else if (/^\d+$/.test(assign)) {
    const u = await q('select id from users where id=$1', [Number(assign)]);
    if (u[0]) owners = [u[0].id];
  }
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
  const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  if (!rows.length) return NextResponse.json({ error: 'Empty sheet' }, { status: 400 });

  const headers = Object.keys(rows[0]);
  const map: Record<string, string> = {};
  for (const f of ['name', 'email', 'phone', 'website', 'country']) {
    const h = headers.find((h) => FIELDS[f].test(h.trim()) && !Object.values(map).includes(h));
    if (h) map[f] = h;
  }
  if (!map.name) map.name = headers[0];

  let added = 0;
  const byCountry: Record<string, number> = {};
  const byOwner: Record<number, number> = {};
  for (const r of rows) {
    const name = String(r[map.name] || '').trim();
    if (!name) continue;
    const g = (k: string) => (map[k] ? String(r[map[k]]).trim() || null : null);
    const country = parseCountry(g('country')) || inferCountry(g('website'), g('phone'));
    const owner = owners[added % owners.length];
    await q('insert into companies(owner_id,name,email,phone,website,country) values($1,$2,$3,$4,$5,$6)', [owner, name, g('email'), g('phone'), g('website'), country]);
    byOwner[owner] = (byOwner[owner] || 0) + 1;
    added++;
    byCountry[country] = (byCountry[country] || 0) + 1;
  }
  return NextResponse.json({ added, mapped: map, byCountry, assignedTo: Object.keys(byOwner).length });
}
