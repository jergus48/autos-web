import { notFound, redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import DeckView from '@/components/DeckView';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) redirect('/login');
  const { id } = await params;
  const rows = await q(
    `select d.*, c.name, c.email, c.phone, c.website from decks d join companies c on c.id=d.company_id where d.id=$1 and ($3::boolean or c.owner_id=$2)`,
    [id, s.uid, s.role === 'admin']
  );
  const d = rows[0];
  if (!d) notFound();
  return <DeckView deck={{ id: d.id, lang: d.lang, slides: d.slides, script: d.script, research: d.research }} company={{ id: d.company_id, name: d.name, email: d.email, phone: d.phone, website: d.website }} shareToken={d.share_token} />;
}
