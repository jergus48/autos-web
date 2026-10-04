import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type Session = { uid: number; email: string; role: 'admin' | 'user' };

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || '');

export async function signSession(s: Session) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('14d')
    .sign(key());
}

export async function verifyToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  return verifyToken(c.get('session')?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Response('Unauthorized', { status: 401 });
  return s;
}
