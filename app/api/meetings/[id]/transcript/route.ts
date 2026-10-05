import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { fetchTranscript } from '@/lib/google';

async function load(s: { uid: number; role: string }, id: string) {
  const r = await q('select m.* from meetings m join companies c on c.id=m.company_id where m.id=$1 and ($3::boolean or c.country=(select u0.country from users u0 where u0.id=$2))', [id, s.uid, s.role === 'admin']);
  return r[0];
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const m = await load(s, id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ transcript: m.transcript, state: m.transcript_state });
}

// Pulls the transcript from Google (Meet API, Drive Doc as fallback) and stores it.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = (await getSession())!;
  const { id } = await params;
  const m = await load(s, id);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!m.meet_code) return NextResponse.json({ error: 'This meeting has no Meet code' }, { status: 400 });
  try {
    const r = await fetchTranscript(m.meet_code);
    await q('update meetings set transcript=coalesce($2,transcript), transcript_state=$3 where id=$1', [id, r.text || null, r.state]);
    return NextResponse.json({ state: r.state, transcript: r.text || m.transcript || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
