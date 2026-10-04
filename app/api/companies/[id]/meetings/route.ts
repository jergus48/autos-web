import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createMeeting } from '@/lib/google';

async function company(s: { uid: number; role: string }, id: string) {
  const r = await q('select * from companies where id=$1 and ($3::boolean or owner_id=$2)', [id, s.uid, s.role === 'admin']);
  return r[0];
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  if (!(await company(s, id))) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const rows = await q(
    `select m.id,m.meet_url,m.meet_code,m.html_link,m.attendee_email,m.start_at,m.end_at,m.transcript_state,(m.transcript is not null) as has_transcript,m.created_at,u.email as user_email
     from meetings m left join users u on u.id=m.user_id where m.company_id=$1 order by m.start_at desc`,
    [id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const c = await company(s, id);
  if (!c) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const b = await req.json();
  const email = String(b.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
  const start = new Date(b.startsAt);
  if (isNaN(+start)) return NextResponse.json({ error: 'Pick a date and time' }, { status: 400 });
  const minutes = Math.min(180, Math.max(15, Number(b.minutes) || 30));
  const end = new Date(+start + minutes * 60000);
  try {
    const m = await createMeeting({
      summary: `Swiftrix x ${c.name}`,
      description: `Call with Swiftrix: slides and previous work.${b.note ? '\n\n' + String(b.note).slice(0, 500) : ''}`,
      start: start.toISOString(),
      end: end.toISOString(),
      timeZone: String(b.timeZone || 'Europe/Vilnius'),
      attendee: email,
    });
    const rows = await q(
      'insert into meetings(company_id,user_id,event_id,meet_url,meet_code,html_link,attendee_email,start_at,end_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',
      [id, s.uid, m.eventId, m.meetUrl, m.meetCode, m.htmlLink, email, start.toISOString(), end.toISOString()]
    );
    if (!c.email) await q('update companies set email=$2 where id=$1', [id, email]);
    return NextResponse.json({ ok: true, id: rows[0].id, meetUrl: m.meetUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
