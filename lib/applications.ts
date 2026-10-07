// Partner applications: people apply on the public /join page with an email,
// a password and their experience. That creates a user with status 'pending'.
// A pending user cannot sign in (see app/api/login/route.ts) and sees nothing
// until an admin approves them on the Admin page. Rejecting deletes the
// application. Everyone who existed before this feature stays 'approved'.
//
// No path aliases and no framework imports in this file on purpose: it takes
// the database function and the password hasher as arguments, so it can be
// tested against a plain Postgres without starting Next.js.

export type Q = <T = any>(text: string, params?: any[]) => Promise<T[]>;

export const LIMITS = {
  emailMax: 254,
  passwordMin: 10,
  passwordMaxBytes: 72, // bcrypt ignores everything after 72 bytes
  experienceMin: 3,
  experienceMax: 1500,
  perHour: 20, // new pending applications the whole site accepts per hour
  pendingMax: 300, // pending applications waiting at any time
};

let ensured = false;

// Idempotent. Runs the first time it is needed in each server process, so the
// deploy works even if `npm run migrate` was not run first.
export async function ensureUserColumns(q: Q) {
  if (ensured) return;
  await q(`alter table users add column if not exists status text not null default 'approved'`);
  await q(`alter table users add column if not exists experience text`);
  await q(`alter table users add column if not exists applied_at timestamptz`);
  ensured = true;
}

export type ApplyInput = {
  email?: unknown;
  password?: unknown;
  experience?: unknown;
  consent?: unknown;
  website?: unknown; // honeypot: a hidden field that people never fill in
};
export type ApplyCode = 'consent' | 'email' | 'password_short' | 'password_long' | 'experience_short' | 'experience_long' | 'rate';
export type ApplyResult = { ok: true } | { ok: false; status: number; code: ApplyCode; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function registerApplicant(q: Q, hash: (pw: string) => string, input: ApplyInput): Promise<ApplyResult> {
  // Bots fill every field. Pretend it worked and store nothing.
  if (typeof input.website === 'string' && input.website.trim() !== '') return { ok: true };

  const email = String(input.email ?? '').toLowerCase().trim();
  const password = typeof input.password === 'string' ? input.password : '';
  const experience = String(input.experience ?? '').trim();

  if (input.consent !== true) return { ok: false, status: 400, code: 'consent', error: 'Please confirm that you have read the privacy notice.' };
  if (!email || email.length > LIMITS.emailMax || !EMAIL_RE.test(email)) return { ok: false, status: 400, code: 'email', error: 'Please enter a valid email address.' };
  if (password.length < LIMITS.passwordMin) return { ok: false, status: 400, code: 'password_short', error: `Password must be at least ${LIMITS.passwordMin} characters.` };
  if (Buffer.byteLength(password, 'utf8') > LIMITS.passwordMaxBytes) return { ok: false, status: 400, code: 'password_long', error: 'Password is too long (72 bytes at most).' };
  if (experience.length < LIMITS.experienceMin) return { ok: false, status: 400, code: 'experience_short', error: 'Please tell us a little about your experience.' };
  if (experience.length > LIMITS.experienceMax) return { ok: false, status: 400, code: 'experience_long', error: `Please keep your experience under ${LIMITS.experienceMax} characters.` };

  // Only now, with valid input, does the database get touched (junk costs nothing).
  await ensureUserColumns(q);

  const load = await q<{ hour: number; pending: number }>(
    `select count(*) filter (where applied_at > now() - interval '1 hour')::int as hour,
            count(*) filter (where status = 'pending')::int as pending
       from users`
  );
  if (load[0].hour >= LIMITS.perHour || load[0].pending >= LIMITS.pendingMax) {
    return { ok: false, status: 429, code: 'rate', error: 'We are receiving a lot of applications right now. Please try again later.' };
  }

  // An email that already has an account (or an earlier application) is left
  // alone, and the answer is the same as for a new one, so this form cannot be
  // used to find out who has an account.
  await q(
    `insert into users(email, password_hash, role, status, experience, applied_at)
     values($1, $2, 'user', 'pending', $3, now())
     on conflict(email) do nothing`,
    [email, hash(password), experience]
  );
  return { ok: true };
}

// Admin side. Approving makes the user a normal caller (optionally with the
// country whose companies they will see); rejecting deletes the application.
export async function decideApplication(q: Q, id: number, action: 'approve' | 'reject', country?: string | null) {
  if (action === 'approve') {
    const r = await q(
      `update users set status = 'approved', country = coalesce($2, country) where id = $1 and status = 'pending' returning id`,
      [id, country || null]
    );
    return r.length > 0;
  }
  const r = await q(`delete from users where id = $1 and status = 'pending' returning id`, [id]);
  return r.length > 0;
}
