import JoinForm from './JoinForm';
import type { Lang } from './text';

export const metadata = {
  title: 'Apply as a sales partner - Swiftrix',
  robots: { index: false, follow: false },
};

// Public page (see proxy.ts). The language comes from ?lang=lt|de|en, so the
// links on swiftrix.eu/collaboration can open the form in the visitor's language.
// ?sent=1 and ?error=<code> are how a plain form post (no scripts) reports back.
export default async function Join({ searchParams }: { searchParams: Promise<{ lang?: string; sent?: string; error?: string }> }) {
  const { lang, sent, error } = await searchParams;
  const l: Lang = lang === 'lt' || lang === 'de' ? lang : 'en';
  return <JoinForm lang={l} sent={sent === '1'} error={typeof error === 'string' ? error : ''} />;
}
