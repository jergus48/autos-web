import * as cheerio from 'cheerio';
import sharp from 'sharp';

const UA = 'Mozilla/5.0 (compatible; OutreachStudio/1.0)';

export function normUrl(u?: string | null) {
  if (!u) return '';
  u = u.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

async function get(url: string, ms = 9000): Promise<Response | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    return r;
  } catch {
    return null;
  }
}

function abs(base: string, href?: string) {
  if (!href) return '';
  try {
    return new URL(href, base).toString();
  } catch {
    return '';
  }
}

async function isImage(url: string) {
  const r = await get(url, 6000);
  if (!r || !r.ok) return false;
  const ct = r.headers.get('content-type') || '';
  return ct.startsWith('image/') || /\.(svg|png|jpe?g|webp|ico)(\?|$)/i.test(url);
}

function pageText($: cheerio.CheerioAPI) {
  $('script,style,noscript,svg,iframe,nav,footer').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export type SiteInfo = { text: string; logo: string; title: string; description: string; pagesRead: string[] };

export async function readSite(website: string): Promise<SiteInfo> {
  const base = normUrl(website);
  const empty: SiteInfo = { text: '', logo: '', title: '', description: '', pagesRead: [] };
  if (!base) return empty;
  const r = await get(base);
  if (!r || !r.ok) return empty;
  const finalUrl = r.url || base;
  const html = await r.text();
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim();
  const description = ($('meta[name=description]').attr('content') || $('meta[property="og:description"]').attr('content') || '').trim();

  // logo candidates, best first
  const cands: string[] = [];
  const logoSel = [
    'header img[src*="logo" i]', 'nav img[src*="logo" i]', 'img[class*="logo" i]', 'img[alt*="logo" i]',
    'a[class*="logo" i] img', '.logo img', '#logo img', 'img[src*="logo" i]', 'header img',
  ];
  for (const sel of logoSel) {
    $(sel).slice(0, 3).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const u = abs(finalUrl, src);
      if (u && !u.startsWith('data:')) cands.push(u);
    });
  }
  $('link[rel~="apple-touch-icon"]').each((_, el) => { cands.push(abs(finalUrl, $(el).attr('href'))); });
  $('link[rel~="icon"],link[rel="shortcut icon"]').each((_, el) => { cands.push(abs(finalUrl, $(el).attr('href'))); });
  cands.push(abs(finalUrl, $('meta[property="og:image"]').attr('content')));
  cands.push(abs(finalUrl, '/favicon.ico'));
  let logo = '';
  for (const c of [...new Set(cands.filter(Boolean))].slice(0, 8)) {
    if (await isImage(c)) {
      logo = c;
      break;
    }
  }

  // extra pages: about / services / contact
  const links = new Set<string>();
  $('a[href]').each((_, el) => {
    const h = $(el).attr('href') || '';
    const t = ($(el).text() + ' ' + h).toLowerCase();
    if (/(about|apie|uber|ueber|o-nas|o-nama|company|unternehmen|services|leistungen|paslaugos|sluzby|produkt|products|solutions)/.test(t)) {
      const u = abs(finalUrl, h);
      try {
        if (u && new URL(u).host === new URL(finalUrl).host && u !== finalUrl) links.add(u.split('#')[0]);
      } catch {}
    }
  });
  const pagesRead = [finalUrl];
  let text = `PAGE ${finalUrl}\n${pageText($).slice(0, 5000)}`;
  const extras = [...links].slice(0, 3);
  const results = await Promise.all(extras.map((u) => get(u, 8000)));
  for (let i = 0; i < extras.length; i++) {
    const rr = results[i];
    if (!rr || !rr.ok) continue;
    const $$ = cheerio.load(await rr.text());
    pagesRead.push(extras[i]);
    text += `\n\nPAGE ${extras[i]}\n${pageText($$).slice(0, 3500)}`;
  }
  return { text: text.slice(0, 14000), logo, title, description, pagesRead };
}

// ---- Tavily with key rotation ----
let keyIdx = 0;
const dead = new Set<string>();

export async function webSearch(query: string): Promise<{ answer: string; results: { title: string; url: string; content: string }[] }> {
  const keys = (process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const live = keys.filter((k) => !dead.has(k));
  for (let n = 0; n < live.length; n++) {
    const k = live[(keyIdx + n) % live.length];
    try {
      const r = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${k}` },
        body: JSON.stringify({ query, max_results: 5, include_answer: true, search_depth: 'basic' }),
      });
      if (r.status === 429 || r.status === 432 || r.status === 433 || r.status === 401 || r.status === 402) {
        dead.add(k);
        continue;
      }
      if (!r.ok) continue;
      const j = await r.json();
      keyIdx = (keyIdx + 1) % Math.max(live.length, 1);
      return { answer: j.answer || '', results: (j.results || []).map((x: any) => ({ title: x.title, url: x.url, content: (x.content || '').slice(0, 500) })) };
    } catch {}
  }
  return { answer: '', results: [] };
}


// 'light' = mostly white/light artwork on a transparent background (sits directly on the dark slide).
// 'dark'  = anything else (dark artwork or an opaque image), which gets a light plate behind it.
export async function logoTone(url: string): Promise<'light' | 'dark'> {
  try {
    const r = await get(url, 8000);
    if (!r || !r.ok) return 'dark';
    const buf = Buffer.from(await r.arrayBuffer());
    const { data, info } = await sharp(buf).resize(64, 64, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let seen = 0, total = 0, lum = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      total++;
      if (data[i + 3] > 60) {
        seen++;
        lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
    }
    if (!seen || seen / total > 0.75) return 'dark'; // opaque image, needs a plate
    return lum / seen > 170 ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}
