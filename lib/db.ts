import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// TLS stays verified. Supabase signs with its own CA, so trust it explicitly:
// either PEM text in DATABASE_CA_CERT, or the file certs/supabase-ca.crt.
function loadCa(): string | undefined {
  if (process.env.DATABASE_CA_CERT) return process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n');
  const p = path.join(process.cwd(), 'certs', 'supabase-ca.crt');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : undefined;
}

const g = globalThis as any;
export const pool: Pool =
  g.__pool ||
  (g.__pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { ca: loadCa() },
    max: 3,
  }));

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const r = await pool.query(text, params);
  return r.rows as T[];
}
