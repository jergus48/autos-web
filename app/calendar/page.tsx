import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Calendar from '@/components/Calendar';

export default async function CalendarPage() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <Calendar email={s.email} admin={s.role === 'admin'} />;
}
