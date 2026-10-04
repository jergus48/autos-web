import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

// Setup check: only reports which settings exist (true/false) and the database error CODE, never values.
export async function GET() {
  const env = Object.fromEntries(
    ['DATABASE_URL', 'SESSION_SECRET', 'OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'TAVILY_API_KEYS'].map((k) => [k, !!(process.env[k] || '').trim()])
  );
  let db: string = 'ok';
  let users: number | null = null;
  try {
    const r = await q('select count(*)::int n from users');
    users = r[0].n;
  } catch (e: any) {
    db = 'error: ' + (e?.code || e?.name || 'unknown');
  }
  return NextResponse.json({ env, db, users, urlShape: shape(process.env.DATABASE_URL) });
}

// Shape of the connection string with all secrets hidden, to spot copy/paste mistakes.
function shape(u?: string) {
  if (!u) return 'missing';
  const t = u.trim();
  const flags = [];
  if (t !== u) flags.push('has-surrounding-whitespace');
  if (/^["']|["']$/.test(t)) flags.push('wrapped-in-quotes');
  if (!/^postgres(ql)?:\/\//.test(t.replace(/^["']/, ''))) flags.push('bad-scheme');
  const m = t.replace(/^["']|["']$/g, '').match(/^postgres(?:ql)?:\/\/([^:]+):([^@]*)@([^:/]+):(\d+)\/(.+)$/);
  if (!m) return ['unparseable', ...flags].join(',');
  return [`user=${m[1].split('.')[0]}${m[1].includes('.') ? '.<ref>' : ''}`, `host=${m[3].replace(/^[^.]*/, '*')}`, `port=${m[4]}`, `db=${m[5].split('?')[0]}`, `pwHasPercent=${/%/.test(m[2])}`, ...flags].join(' ');
}
