import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import DeckView from '@/components/DeckView';

export const metadata = { robots: { index: false, follow: false } };

export default async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rows = await q(`select d.id,d.lang,d.slides,c.name from decks d join companies c on c.id=d.company_id where d.share_token=$1`, [token]);
  const d = rows[0];
  if (!d) notFound();
  return <DeckView deck={{ id: d.id, lang: d.lang, slides: d.slides }} company={{ name: d.name }} shareToken={token} readOnly />;
}
