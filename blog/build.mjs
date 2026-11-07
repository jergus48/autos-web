// Builds the blog from blog/posts/*.md into static pages. No dependencies.
//   node blog/build.mjs
// Writes blog/index.html, blog/<slug>/index.html, blog/feed.xml and blog/sitemap.xml.
// A post is a Markdown file named YYYY-MM-DD-slug.md with a small header:
//   ---
//   title: ...
//   description: ... (140-160 characters, used in search results)
//   tags: automation, invoices
//   ---
// Supported Markdown: ## and ### headings, paragraphs, - and 1. lists, > quotes, **bold**, *italic*, [text](url).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const POSTS = path.join(DIR, 'posts')
const SITE = 'https://www.swiftrix.eu'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inline(s) {
  let t = esc(s)
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, u) => `<a href="${u}"${/^https?:/.test(u) && !u.startsWith(SITE) ? ' rel="noopener" target="_blank"' : ''}>${a}</a>`)
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  return t
}

function md(src) {
  const out = []; let para = [], list = null
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
  const flushL = () => { if (list) { out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null } }
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trimEnd(); let m
    if (!line.trim()) { flushP(); flushL(); continue }
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flushP(); flushL(); const id = m[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); out.push(`<h${m[1].length} id="${id}">${inline(m[2])}</h${m[1].length}>`); continue }
    if ((m = line.match(/^[-*]\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ul') { flushL(); list = { t: 'ul', items: [] } } list.items.push(m[1]); continue }
    if ((m = line.match(/^\d+\.\s+(.*)$/))) { flushP(); if (!list || list.t !== 'ol') { flushL(); list = { t: 'ol', items: [] } } list.items.push(m[1]); continue }
    if ((m = line.match(/^>\s?(.*)$/))) { flushP(); flushL(); out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`); continue }
    flushL(); para.push(line.trim())
  }
  flushP(); flushL()
  return out.join('\n')
}

function readPost(file) {
  const text = fs.readFileSync(path.join(POSTS, file), 'utf8').replace(/^﻿/, '')
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!m) throw new Error(file + ': missing --- header ---')
  const meta = Object.fromEntries(m[1].split(/\r?\n/).map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
  const fm = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/)
  if (!fm) throw new Error(file + ': name must be YYYY-MM-DD-slug.md')
  for (const k of ['title', 'description']) if (!meta[k]) throw new Error(file + ': missing ' + k)
  if (/[—–]/.test(text)) throw new Error(file + ': contains an em or en dash, rewrite with a comma or colon')
  const body = m[2].trim()
  const words = body.split(/\s+/).length
  return { date: fm[1], slug: fm[2], title: meta.title, description: meta.description, tags: (meta.tags || '').split(',').map(s => s.trim()).filter(Boolean), html: md(body), words, mins: Math.max(1, Math.round(words / 220)) }
}

const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const HEAD = (title, desc, canonical, extra = '') => `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${extra ? 'article' : 'website'}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <link rel="icon" href="/assets/images/swiftrixLogo.png">
  <link rel="alternate" type="application/rss+xml" title="Swiftrix blog" href="/blog/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Roboto:wght@400;500&display=swap">
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600&display=swap">
  <link rel="stylesheet" href="/css/pages.css">
  <link rel="stylesheet" href="/blog/blog.css">
${extra}</head>`

const NAV = `<body>
  <div class="backdrop" aria-hidden="true"></div>
  <nav class="vex-nav">
    <a class="vex-logo" data-site="" href="/" aria-label="Swiftrix">
      <img class="logo-dark" src="/assets/images/swiftrixLogo.png" alt="Swiftrix">
    </a>
    <div class="vex-links" id="vexLinks">
      <a href="/blog">All posts</a>
      <a data-site="" href="/">Our services</a>
      <a class="vex-mlink" href="https://cal.com/swiftrix" target="_blank" rel="noopener">Book a call</a>
    </div>
    <a class="vex-cta" href="https://cal.com/swiftrix" target="_blank" rel="noopener">Book a call</a>
    <button class="vex-burger" id="vexBurger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </nav>
`
const FOOT = `  <footer>© 2026 Swiftrix · <a data-site="" href="/">swiftrix.eu</a> · <a href="/blog">Blog</a></footer>
  <script src="/js/pages.js" defer></script>
</body>
</html>
`

const posts = fs.readdirSync(POSTS).filter(f => f.endsWith('.md')).map(readPost).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
const slugs = new Set(); for (const p of posts) { if (slugs.has(p.slug)) throw new Error('duplicate slug ' + p.slug); slugs.add(p.slug) }

// remove pages of posts that no longer exist
for (const d of fs.readdirSync(DIR, { withFileTypes: true })) if (d.isDirectory() && d.name !== 'posts' && !slugs.has(d.name)) fs.rmSync(path.join(DIR, d.name), { recursive: true, force: true })

for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}`
  const ld = `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Swiftrix', url: SITE }, publisher: { '@type': 'Organization', name: 'Swiftrix', logo: { '@type': 'ImageObject', url: SITE + '/assets/images/swiftrixLogo.png' } } })}</script>\n`
  const more = posts.filter(o => o.slug !== p.slug).slice(0, 3)
  const html = HEAD(`${p.title} | Swiftrix`, p.description, url, ld) + '\n' + NAV + `
  <main class="wrap post">
    <p class="crumbs"><a href="/blog">Blog</a></p>
    <article>
      <header class="post-head">
        <h1>${esc(p.title)}</h1>
        <p class="meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${p.mins} min read${p.tags.length ? ' · ' + p.tags.map(esc).join(', ') : ''}</p>
      </header>
      <div class="prose">
${p.html}
      </div>
    </article>
    <section class="cta post-cta">
      <span class="sec-badge"><i></i>Swiftrix</span>
      <h2>Have repetitive work you would like off your desk?</h2>
      <p>Swiftrix builds automations and AI agents for businesses. Book a short call and we will tell you honestly whether it is worth automating.</p>
      <div class="cta-actions"><a class="btn btn-primary" href="https://cal.com/swiftrix" target="_blank" rel="noopener">Book a call</a><a class="btn btn-ghost" href="/demo">Try the live agent demo</a></div>
    </section>${more.length ? `
    <section class="more-posts"><h2>More from the blog</h2><div class="plist">${more.map(o => `<a class="pcard" href="/blog/${o.slug}"><span class="pdate">${fmtDate(o.date)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p></a>`).join('')}</div></section>` : ''}
  </main>
` + FOOT
  fs.mkdirSync(path.join(DIR, p.slug), { recursive: true })
  fs.writeFileSync(path.join(DIR, p.slug, 'index.html'), html)
}

const indexLd = `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Blog', name: 'Swiftrix blog', url: SITE + '/blog', publisher: { '@type': 'Organization', name: 'Swiftrix', url: SITE } })}</script>\n`
fs.writeFileSync(path.join(DIR, 'index.html'), HEAD('Blog: automation and AI agents for business | Swiftrix', 'Practical articles from Swiftrix on automating repetitive office work, AI agents, invoices, email and reporting for small and mid-sized businesses.', SITE + '/blog', '') .replace('</head>', indexLd + '</head>') + '\n' + NAV + `
  <main class="wrap">
    <header class="hero">
      <p class="eyebrow"><span>THE SWIFTRIX BLOG</span></p>
      <h1>Automation and AI agents, in plain words</h1>
      <p>Practical notes on taking repetitive work off people's desks: what can be automated, what cannot, and what it costs in time and effort.</p>
    </header>
    <section class="block"><div class="plist">${posts.map(p => `<a class="pcard" href="/blog/${p.slug}"><span class="pdate">${fmtDate(p.date)} · ${p.mins} min read</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></a>`).join('')}</div></section>
  </main>
` + FOOT)

const rfc = d => new Date(d + 'T08:00:00Z').toUTCString()
fs.writeFileSync(path.join(DIR, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Swiftrix blog</title><link>${SITE}/blog</link><description>Automation and AI agents for business, in plain words.</description><language>en</language>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid><pubDate>${rfc(p.date)}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}
</channel></rss>
`)
fs.writeFileSync(path.join(DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}/blog</loc></url>
${posts.map(p => `<url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${p.date}</lastmod></url>`).join('\n')}
</urlset>
`)
console.log(`built ${posts.length} post(s)`)
