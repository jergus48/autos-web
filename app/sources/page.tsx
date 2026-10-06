import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sources from '@/components/Sources';

export default async function SourcesPage() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <Sources email={s.email} />;
}
