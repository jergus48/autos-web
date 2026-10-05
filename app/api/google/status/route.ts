import { NextResponse } from 'next/server';
import { googleStatus } from '@/lib/google';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  return NextResponse.json({ ...(await googleStatus()), me: s?.email || null });
}
