import { NextResponse } from 'next/server';
import { googleStatus } from '@/lib/google';

export async function GET() {
  return NextResponse.json(await googleStatus());
}
