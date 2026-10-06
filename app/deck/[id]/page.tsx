import { notFound, redirect } from 'next/navigation';
import { q } from '@/lib/db';
import { getSession } from '@/lib/auth';
import DeckView from '@/components/DeckView';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) redirect('/login');
  const { id } = await params;
  const rows = await q(
    `select d.*, c.name, c.email, c.phone, c.website,
            (exists(select 1 from calls k where k.company_id=c.id and k.outcome='meeting_booked') or exists(select 1 from meetings m where m.company_id=c.id)) as agreed
     from decks d join companies c on c.id=d.company_id where d.id=$1 and ($3::boolean or c.country=(select u0.country from users u0 where u0.id=$2))`,
    [id, s.uid, s.role === 'admin']
  );
  const d = rows[0];
  if (!d) notFound();
  return <DeckView deck={{ id: d.id, lang: d.lang, slides: d.slides, script: d.script, presenter: d.presenter, research: d.research, slidesEarly: d.slides_early }} company={{ id: d.company_id, name: d.name, email: d.email, phone: d.phone, website: d.website, agreed: d.agreed }} shareToken={d.share_token || ''} />;
}
