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
  if (+start < Date.now() - 5 * 60000) return NextResponse.json({ error: 'That time is in the past' }, { status: 400 });
  const clash = (await q(
    `select c.name, m.start_at, m.end_at from meetings m join companies c on c.id=m.company_id
     where m.user_id=$1 and m.start_at < $3 and m.end_at > $2 order by m.start_at limit 1`,
    [s.uid, start.toISOString(), end.toISOString()]
  ))[0];
  if (clash) {
    const t = (d: Date) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: String(b.timeZone || 'Europe/Vilnius') });
    return NextResponse.json({ error: `You already have a call with ${clash.name} at ${t(clash.start_at)}-${t(clash.end_at)}. Pick a free slot.` }, { status: 409 });
  }
  const lang = ['de', 'at', 'ch'].includes(c.country) ? 'de' : c.country === 'lt' ? 'lt' : 'en';
  const intro = {
    en: `Hi,\n\nThank you for your time on the phone. As agreed, here is our Google Meet where we will walk you through a short presentation prepared for ${c.name} and show examples of our previous work.`,
    lt: `Sveiki,\n\nDekojame uz pokalbi telefonu. Kaip susitareme, siunciame Google Meet nuoroda, kurioje parodysime jums, ${c.name}, paruosta trumpa pristatyma ir ankstesnius musu darbus.`,
    de: `Guten Tag,\n\nvielen Dank fuer das Telefonat. Wie besprochen finden Sie hier unser Google Meet, in dem wir Ihnen eine kurze, fuer ${c.name} vorbereitete Praesentation und Beispiele unserer bisherigen Arbeit zeigen.`,
  }[lang];
  const caller = String(b.callerEmail || '').trim();
  if (caller && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(caller)) return NextResponse.json({ error: 'Enter a valid email for yourself' }, { status: 400 });
  const description = [
    intro,
    b.note ? String(b.note).slice(0, 500) : '',
    'Swiftrix | swiftrix.eu',
  ].filter(Boolean).join('\n\n');
  try {
    const m = await createMeeting({
      summary: `Swiftrix x ${c.name}`,
      description,
      start: start.toISOString(),
      end: end.toISOString(),
      timeZone: String(b.timeZone || 'Europe/Vilnius'),
      attendees: [email, ...(caller && caller.toLowerCase() !== email.toLowerCase() ? [caller] : [])],
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
