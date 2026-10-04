import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { VALID_OUTCOMES, outcomeLabel } from '@/lib/outcomes';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(sp.get('days')) || 7));
  const user = sp.get('user');
  const outcome = sp.get('outcome');
  const country = sp.get('country');
  const params: any[] = [];
  let where = `k.created_at > now() - interval '${days} days'`;
  if (user && /^\d+$/.test(user)) { params.push(Number(user)); where += ` and k.user_id=$${params.length}`; }
  if (outcome && VALID_OUTCOMES.includes(outcome)) { params.push(outcome); where += ` and k.outcome=$${params.length}`; }
  if (country && ['lt', 'de', 'at', 'ch', 'other'].includes(country)) { params.push(country); where += ` and c.country=$${params.length}`; }
  const rows = await q(
    `select k.id,k.outcome,k.note,k.followup_at::text as followup_at,k.created_at,u.email as user_email,c.id as company_id,c.name,c.website,c.country,c.phone,c.email as company_email
     from calls k join companies c on c.id=k.company_id left join users u on u.id=k.user_id
     where ${where} order by k.created_at desc limit 500`,
    params
  );
  if (sp.get('format') === 'csv') {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['When', 'Caller', 'Company', 'Country', 'Website', 'Phone', 'Outcome', 'Follow-up', 'Note'];
    const lines = rows.map((r) => [new Date(r.created_at).toISOString(), r.user_email, r.name, r.country, r.website, r.phone, outcomeLabel(r.outcome), r.followup_at ? String(r.followup_at).slice(0, 10) : '', r.note].map(esc).join(','));
    return new NextResponse([head.map(esc).join(','), ...lines].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="calls.csv"' } });
  }
  return NextResponse.json(rows);
}
