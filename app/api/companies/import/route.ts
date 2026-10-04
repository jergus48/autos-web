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
  const form = await req.formData();
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
  for (const r of rows) {
    const name = String(r[map.name] || '').trim();
    if (!name) continue;
    const g = (k: string) => (map[k] ? String(r[map[k]]).trim() || null : null);
    const country = parseCountry(g('country')) || inferCountry(g('website'), g('phone'));
    await q('insert into companies(owner_id,name,email,phone,website,country) values($1,$2,$3,$4,$5,$6)', [s.uid, name, g('email'), g('phone'), g('website'), country]);
    added++;
    byCountry[country] = (byCountry[country] || 0) + 1;
  }
  return NextResponse.json({ added, mapped: map, byCountry });
}
