import type { Lang } from './fixed';

export type Country = 'lt' | 'de' | 'at' | 'ch' | 'other';
export const COUNTRIES: { code: Country; label: string; lang: Lang }[] = [
  { code: 'lt', label: 'Lithuania', lang: 'lt' },
  { code: 'de', label: 'Germany', lang: 'de' },
  { code: 'at', label: 'Austria', lang: 'de' },
  { code: 'ch', label: 'Switzerland', lang: 'de' },
  { code: 'other', label: 'Other (English)', lang: 'en' },
];

export const langFor = (c?: string | null): Lang => COUNTRIES.find((x) => x.code === c)?.lang || 'en';

const PHONE: [string, Country][] = [['+370', 'lt'], ['00370', 'lt'], ['+49', 'de'], ['0049', 'de'], ['+43', 'at'], ['0043', 'at'], ['+41', 'ch'], ['0041', 'ch']];
const TLD: Record<string, Country> = { lt: 'lt', de: 'de', at: 'at', ch: 'ch' };

/** Free-text (Excel cell or form value) to a country code, or null if empty/unclear. */
export function parseCountry(raw?: string | null): Country | null {
  const s = (raw || '').toString().trim().toLowerCase();
  if (!s) return null;
  if (['lt', 'de', 'at', 'ch'].includes(s)) return s as Country;
  if (/(lit|lietuv|litva|litau)/.test(s)) return 'lt';
  if (/(austria|österreich|osterreich|oesterreich|rakousk|rakúsk)/.test(s)) return 'at';
  if (/(switz|schweiz|suisse|svizzera|švýcar|švajcar|svajcar)/.test(s)) return 'ch';
  if (/(german|deutsch|německ|nemeck|vokiet)/.test(s)) return 'de';
  return 'other';
}

/** Best guess from the website domain, then the phone prefix. */
export function inferCountry(website?: string | null, phone?: string | null): Country {
  try {
    const host = new URL(/^https?:\/\//i.test(website || '') ? (website as string) : 'https://' + (website || '')).hostname;
    const tld = host.split('.').pop() || '';
    if (TLD[tld]) return TLD[tld];
  } catch {}
  const p = (phone || '').replace(/[\s()-]/g, '');
  for (const [pre, c] of PHONE) if (p.startsWith(pre)) return c;
  return 'other';
}
