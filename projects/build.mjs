// Builds the projects page in English, Lithuanian and German from the data below. No dependencies.
//   node projects/build.mjs
// Writes projects/index.html (/projects), lt/projects/index.html (/lt/projects) and de/projects/index.html (/de/projects).
// Everything said about a project must come from what the site already says about it (the carousel on the home page): the task, what was built, what it does now.
// No invented numbers, results, quotes or client details. The build fails if an em dash or an en dash gets in.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://www.swiftrix.eu'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CLIENT = {
  hakom: { name: 'hakom.sk', url: 'https://hakom.sk' }, aluprint: { name: 'aluprint.sk', url: 'https://aluprint.sk' }, gaya: { name: 'gaya.sk', url: 'https://gaya.sk' },
  geosoul: { name: 'geosoul.sk', url: 'https://geosoul.sk' }, unisport: { name: 'unisport-kovac.sk', url: 'https://unisport-kovac.sk' }, urbar: { name: 'urbarlamac.sk', url: 'https://urbarlamac.sk' },
  upshift: { name: 'joinupshift.com', url: 'https://joinupshift.com' }, shorts: { name: 'lithuanianshorts.com', url: 'https://lithuanianshorts.com' },
}
// one entry per project: id, who it was for, and the text in each language (title, tag, task, built, now)
const PROJECTS = [
  { id: 'protocol-signing', clients: ['hakom', 'aluprint'], en: {
      tag: 'Document and protocol signing', title: 'Digital protocol signing on the factory floor',
      task: 'Signing off protocols on the factory floor was done on paper, and it added up to hundreds of paper forms.',
      built: 'A sign-off system for the factory floor. Workers log in with their factory ID card, see every new document they must review, and sign it digitally.',
      now: 'The paper forms are replaced by a fully auditable record. At Aluprint the same card-based system runs across the production line, so management can see at a glance that every worker has read and accepted the latest protocols, with no paperwork to chase.' },
    lt: {
      tag: 'Dokumentų ir protokolų pasirašymas', title: 'Skaitmeninis protokolų pasirašymas gamykloje',
      task: 'Protokolai gamykloje buvo pasirašomi popieriuje, ir susikaupdavo šimtai popierinių formų.',
      built: 'Pasirašymo sistema gamyklos cechui. Darbuotojai prisijungia gamyklos ID kortele, mato visus naujus dokumentus, kuriuos privalo peržiūrėti, ir pasirašo juos skaitmeniniu būdu.',
      now: 'Popierines formas pakeitė visiškai audituojamas įrašas. Aluprint ta pati kortelėmis pagrįsta sistema veikia visoje gamybos linijoje, todėl vadovybė iš karto mato, kad kiekvienas darbuotojas perskaitė ir priėmė naujausius protokolus, be jokių popierių, kuriuos reikėtų vaikytis.' },
    de: {
      tag: 'Dokumenten- und Protokollsignatur', title: 'Digitale Protokollsignatur in der Fabrik',
      task: 'Die Protokolle in der Fabrik wurden auf Papier abgezeichnet, und es sammelten sich Hunderte von Papierformularen an.',
      built: 'Ein Freigabesystem für die Produktionshalle. Mitarbeitende melden sich mit ihrem Werksausweis an, sehen jedes neue Dokument, das sie prüfen müssen, und unterschreiben es digital.',
      now: 'Die Papierformulare sind durch einen vollständig nachvollziehbaren Nachweis ersetzt. Bei Aluprint läuft dasselbe kartenbasierte System über die gesamte Produktionslinie, sodass die Leitung auf einen Blick sieht, dass jede Person die neuesten Protokolle gelesen und akzeptiert hat, ohne Papier, dem man hinterherlaufen muss.' } },
  { id: 'invoice-archive', clients: ['gaya'], en: {
      tag: 'Invoice archive cleanup', title: 'Knowing which paper invoices can be thrown away',
      task: 'A large archive of paper invoices had to be sorted out: which of them could be discarded?',
      built: 'A program wired into their scanner. It checks each scanned paper invoice against the database.',
      now: 'Staff are told exactly which paper invoices can be discarded, which frees up a large amount of storage space.' },
    lt: {
      tag: 'Sąskaitų archyvo sutvarkymas', title: 'Žinoti, kurias popierines sąskaitas galima išmesti',
      task: 'Reikėjo sutvarkyti didelį popierinių sąskaitų archyvą: kurias iš jų galima išmesti?',
      built: 'Programa, sujungta su jų skaitytuvu. Ji kiekvieną nuskaitytą popierinę sąskaitą patikrina pagal duomenų bazę.',
      now: 'Darbuotojams tiksliai pasakoma, kurias popierines sąskaitas galima išmesti, ir atlaisvinama daug vietos archyve.' },
    de: {
      tag: 'Aufräumen des Rechnungsarchivs', title: 'Wissen, welche Papierrechnungen weggeworfen werden können',
      task: 'Ein großes Archiv von Papierrechnungen musste aussortiert werden: Welche davon können entsorgt werden?',
      built: 'Ein Programm, das an ihren Scanner angebunden ist. Es gleicht jede gescannte Papierrechnung mit der Datenbank ab.',
      now: 'Die Mitarbeitenden erfahren genau, welche Papierrechnungen entsorgt werden können, und es wird viel Lagerplatz frei.' } },
  { id: 'structural-calculation', clients: ['geosoul'], en: {
      tag: 'Structural calculation engine', title: 'Statics calculations that write their own report',
      task: 'Their geotechnical projects need statics calculations and a tailored report for every project.',
      built: 'A custom app that performs the statics calculations. It is integrated with their products and handles different anchor types and soil conditions.',
      now: 'It generates a tailored Word report for each project automatically.' },
    lt: {
      tag: 'Statikos skaičiavimo variklis', title: 'Statikos skaičiavimai, kurie patys parašo ataskaitą',
      task: 'Jų geotechniniams projektams reikia statikos skaičiavimų ir pritaikytos ataskaitos kiekvienam projektui.',
      built: 'Individuali programa, atliekanti statikos skaičiavimus. Ji integruota su jų produktais ir moka dirbti su skirtingų tipų inkarais bei grunto sąlygomis.',
      now: 'Kiekvienam projektui ji automatiškai sugeneruoja pritaikytą Word ataskaitą.' },
    de: {
      tag: 'Statik-Berechnungs-Engine', title: 'Statikberechnungen, die ihren Bericht selbst schreiben',
      task: 'Ihre geotechnischen Projekte brauchen Statikberechnungen und für jedes Projekt einen individuellen Bericht.',
      built: 'Eine maßgeschneiderte App, die die Statikberechnungen durchführt. Sie ist in ihre Produkte integriert und beherrscht verschiedene Ankertypen und Bodenverhältnisse.',
      now: 'Sie erstellt für jedes Projekt automatisch einen individuellen Word-Bericht.' } },
  { id: 'database-migration', clients: ['unisport'], en: {
      tag: 'Database migration', title: 'Moving a very large database to a new website',
      task: 'A very large legacy database had to move from the old website to the new one.',
      built: 'An automated migration that cleans and re-sorts the data on the way.',
      now: 'Every record landed in the right place on the new website.' },
    lt: {
      tag: 'Duomenų bazės perkėlimas', title: 'Labai didelės duomenų bazės perkėlimas į naują svetainę',
      task: 'Labai didelę senąją duomenų bazę reikėjo perkelti iš senos svetainės į naują.',
      built: 'Automatizuotas perkėlimas, kuris pakeliui išvalo ir iš naujo surūšiuoja duomenis.',
      now: 'Kiekvienas įrašas atsidūrė tinkamoje vietoje naujoje svetainėje.' },
    de: {
      tag: 'Datenbankmigration', title: 'Eine sehr große Datenbank auf eine neue Website umziehen',
      task: 'Eine sehr große Altdatenbank musste von der alten auf die neue Website umziehen.',
      built: 'Eine automatisierte Migration, die die Daten unterwegs bereinigt und neu sortiert.',
      now: 'Jeder Datensatz landete an der richtigen Stelle auf der neuen Website.' } },
  { id: 'ownership-calculations', clients: ['urbar'], en: {
      tag: 'Monthly ownership calculations', title: 'Monthly payout calculations that run themselves',
      task: 'Every month the association needs Excel payout calculations for its members, based on the latest land-ownership certificates. It was a tedious manual task.',
      built: 'An automation that produces these calculations from the latest land-ownership certificates.',
      now: 'The monthly Excel payout calculations are generated automatically.' },
    lt: {
      tag: 'Mėnesiniai nuosavybės skaičiavimai', title: 'Mėnesiniai išmokų skaičiavimai, kurie vyksta patys',
      task: 'Kiekvieną mėnesį asociacijai reikia Excel išmokų skaičiavimų jos nariams pagal naujausius žemės nuosavybės pažymėjimus. Tai buvo varginantis rankinis darbas.',
      built: 'Automatizacija, kuri šiuos skaičiavimus parengia pagal naujausius žemės nuosavybės pažymėjimus.',
      now: 'Mėnesiniai Excel išmokų skaičiavimai sugeneruojami automatiškai.' },
    de: {
      tag: 'Monatliche Eigentumsberechnungen', title: 'Monatliche Auszahlungsberechnungen, die von selbst laufen',
      task: 'Jeden Monat braucht die Genossenschaft Excel-Auszahlungsberechnungen für ihre Mitglieder, basierend auf den neuesten Grundeigentumsnachweisen. Das war eine mühsame manuelle Aufgabe.',
      built: 'Eine Automatisierung, die diese Berechnungen aus den neuesten Grundeigentumsnachweisen erstellt.',
      now: 'Die monatlichen Excel-Auszahlungsberechnungen werden automatisch erzeugt.' } },
  { id: 'clipper-portal', clients: ['upshift'], en: {
      tag: 'Clipper recruitment and management portal', title: 'One portal for recruiting and managing clippers',
      task: 'Managing clippers means recruiting them, onboarding them, looking after their accounts and paying them, and keeping track of what each one brings in.',
      built: 'A complete portal that covers this end to end: recruiting and onboarding, account management and automated payouts.',
      now: 'Sales, views and revenue generated by each clipper are tracked from one dashboard.' },
    lt: {
      tag: 'Clipperių verbavimo ir valdymo portalas', title: 'Vienas portalas clipperiams verbuoti ir valdyti',
      task: 'Clipperių valdymas reiškia juos verbuoti, įvesti į darbą, prižiūrėti jų paskyras, mokėti jiems ir sekti, ką atneša kiekvienas.',
      built: 'Pilnas portalas, apimantis visą kelią: verbavimą ir įvedimą į darbą, paskyrų valdymą ir automatizuotas išmokas.',
      now: 'Kiekvieno clipperio sugeneruoti pardavimai, peržiūros ir pajamos stebimi viename skydelyje.' },
    de: {
      tag: 'Portal zur Gewinnung und Verwaltung von Clippern', title: 'Ein Portal, um Clipper zu gewinnen und zu verwalten',
      task: 'Clipper zu verwalten heißt, sie zu gewinnen, einzuarbeiten, ihre Konten zu betreuen, sie zu bezahlen und im Blick zu behalten, was jeder Einzelne bringt.',
      built: 'Ein vollständiges Portal, das den ganzen Weg abdeckt: Gewinnung und Onboarding, Kontoverwaltung und automatisierte Auszahlungen.',
      now: 'Umsätze, Aufrufe und Einnahmen jedes Clippers werden in einem Dashboard verfolgt.' } },
  { id: 'film-programming', clients: ['shorts'], en: {
      tag: 'Film programming and reporting tool', title: 'An internal tool for a film archive',
      task: 'The Lithuanian Shorts archive needed an internal tool for building film programmes and for reporting on screenings and revenue.',
      built: 'A tool built around their film archive. It syncs the catalogue from their website automatically and builds film programmes that fit a chosen film count and running time.',
      now: 'It produces screening and revenue reports as Word or PDF, in Lithuanian or English.' },
    lt: {
      tag: 'Filmų programų ir ataskaitų įrankis', title: 'Vidinis įrankis filmų archyvui',
      task: 'Lithuanian Shorts archyvui reikėjo vidinio įrankio filmų programoms sudaryti ir ataskaitoms apie seansus bei pajamas rengti.',
      built: 'Įrankis, sukurtas aplink jų filmų archyvą. Jis automatiškai sinchronizuoja katalogą iš jų svetainės ir sudaro filmų programas, atitinkančias pasirinktą filmų skaičių ir trukmę.',
      now: 'Jis parengia seansų ir pajamų ataskaitas Word arba PDF formatu, lietuvių arba anglų kalba.' },
    de: {
      tag: 'Tool für Filmprogramme und Berichte', title: 'Ein internes Tool für ein Filmarchiv',
      task: 'Das Archiv von Lithuanian Shorts brauchte ein internes Tool, um Filmprogramme zusammenzustellen und über Vorführungen und Einnahmen zu berichten.',
      built: 'Ein Tool rund um ihr Filmarchiv. Es synchronisiert den Katalog automatisch von ihrer Website und stellt Filmprogramme zusammen, die zu einer gewählten Filmanzahl und Laufzeit passen.',
      now: 'Es erstellt Vorführungs- und Umsatzberichte als Word oder PDF, auf Litauisch oder Englisch.' } },
]

// the page text per language
const T = {
  en: { lang: 'en', url: '/projects', title: 'Our projects: automation built for real businesses | Swiftrix',
    desc: 'A closer look at projects Swiftrix has built: digital protocol signing, invoice archive cleanup, a statics calculation engine, a database migration and more.',
    eyebrow: 'OUR PROJECTS', h1: 'Projects we have built', lead: 'A closer look at what we made for our clients: the task, what we built and what it does now. Every one is a custom tool shaped around how that company works.',
    task: 'The task', built: 'What we built', now: 'What it does now', forLabel: 'For', visit: 'Visit',
    navServices: 'Our services', navCall: 'Book a call', home: '/', crumbHome: 'Swiftrix', jump: 'Jump to',
    ctaH: 'Have a task like one of these?', ctaP: 'Tell us what keeps eating your team\'s time. Book a short call and we will say honestly whether it is worth automating and what it would involve.', ctaCall: 'Book a call', ctaDemo: 'Try the live agent demo', demo: '/demo', callUrl: 'https://cal.com/swiftrix' },
  lt: { lang: 'lt', url: '/lt/projects', title: 'Mūsų projektai: automatizacija realioms įmonėms | Swiftrix',
    desc: 'Atidžiau apie Swiftrix sukurtus projektus: skaitmeninis protokolų pasirašymas, sąskaitų archyvo sutvarkymas, statikos skaičiavimo variklis, duomenų bazės perkėlimas ir kita.',
    eyebrow: 'MŪSŲ PROJEKTAI', h1: 'Projektai, kuriuos sukūrėme', lead: 'Atidžiau apie tai, ką sukūrėme klientams: uždavinys, ką sukūrėme ir ką tai daro dabar. Kiekvienas įrankis pritaikytas prie to, kaip dirba konkreti įmonė.',
    task: 'Uždavinys', built: 'Ką sukūrėme', now: 'Ką tai daro dabar', forLabel: 'Klientas', visit: 'Aplankyti',
    navServices: 'Mūsų paslaugos', navCall: 'Užsisakyti skambutį', home: '/lt', crumbHome: 'Swiftrix', jump: 'Pereiti prie',
    ctaH: 'Turite panašų uždavinį?', ctaP: 'Papasakokite, kas jūsų komandai atima daugiausia laiko. Užsisakykite trumpą skambutį ir sąžiningai pasakysime, ar verta automatizuoti ir ką tai apimtų.', ctaCall: 'Užsisakyti skambutį', ctaDemo: 'Išbandyti DI agento demonstraciją', demo: '/lt/demo', callUrl: 'https://cal.com/swiftrix' },
  de: { lang: 'de', url: '/de/projects', title: 'Unsere Projekte: Automatisierung für echte Unternehmen | Swiftrix',
    desc: 'Ein genauerer Blick auf Projekte von Swiftrix: digitale Protokollsignatur, Aufräumen eines Rechnungsarchivs, eine Statik-Berechnungs-Engine, eine Datenbankmigration und mehr.',
    eyebrow: 'UNSERE PROJEKTE', h1: 'Projekte, die wir gebaut haben', lead: 'Ein genauerer Blick darauf, was wir für unsere Kunden gebaut haben: die Aufgabe, was wir gebaut haben und was es heute tut. Jedes ist ein maßgeschneidertes Werkzeug, geformt nach der Arbeitsweise des jeweiligen Unternehmens.',
    task: 'Die Aufgabe', built: 'Was wir gebaut haben', now: 'Was es heute tut', forLabel: 'Kunde', visit: 'Besuchen',
    navServices: 'Unsere Leistungen', navCall: 'Anruf buchen', home: '/de', crumbHome: 'Swiftrix', jump: 'Direkt zu',
    ctaH: 'Haben Sie eine ähnliche Aufgabe?', ctaP: 'Erzählen Sie uns, was die Zeit Ihres Teams auffrisst. Buchen Sie einen kurzen Anruf, und wir sagen Ihnen ehrlich, ob sich die Automatisierung lohnt und was dazugehört.', ctaCall: 'Anruf buchen', ctaDemo: 'Live-Demo des KI-Agenten testen', demo: '/de/demo', callUrl: 'https://cal.com/swiftrix' },
}

const page = (L) => {
  const t = T[L], canonical = SITE + t.url
  const alt = Object.entries(T).map(([k, v]) => `  <link rel="alternate" hreflang="${k}" href="${SITE}${v.url}">`).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}/projects">`
  const itemList = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.h1, url: canonical, inLanguage: t.lang, isPartOf: { '@type': 'WebSite', name: 'Swiftrix', url: SITE },
    mainEntity: { '@type': 'ItemList', itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p[L].title, url: `${canonical}#${p.id}` })) } }
  const card = (p) => { const x = p[L]; return `
      <article class="proj" id="${p.id}">
        <header class="proj-head">
          <span class="proj-tag">${esc(x.tag)}</span>
          <h2>${esc(x.title)}</h2>
          <p class="proj-for">${t.forLabel}: ${p.clients.map(c => `<a href="${CLIENT[c].url}" target="_blank" rel="noopener">${esc(CLIENT[c].name)}</a>`).join(', ')}</p>
        </header>
        <div class="proj-grid">
          <section><h3>${t.task}</h3><p>${esc(x.task)}</p></section>
          <section><h3>${t.built}</h3><p>${esc(x.built)}</p></section>
          <section><h3>${t.now}</h3><p>${esc(x.now)}</p></section>
        </div>
      </article>` }
  return `<!doctype html>
<html lang="${t.lang}" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)}</title>
  <meta name="description" content="${esc(t.desc)}">
  <link rel="canonical" href="${canonical}">
${alt}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.desc)}">
  <link rel="icon" href="/assets/images/swiftrixLogo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Roboto:wght@400;500&display=swap">
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600&display=swap">
  <link rel="stylesheet" href="/css/pages.css">
  <link rel="stylesheet" href="/projects/projects.css">
  <script type="application/ld+json">${JSON.stringify(itemList)}</script>
</head>
<body>
  <div class="backdrop" aria-hidden="true"></div>
  <nav class="vex-nav">
    <a class="vex-logo" data-site="" href="${t.home}" aria-label="Swiftrix">
      <img class="logo-dark" src="/assets/images/swiftrixLogo.png" alt="Swiftrix">
    </a>
    <div class="vex-links" id="vexLinks">
      <a data-site="" href="${t.home}">${t.navServices}</a>
      <a class="vex-mlink" href="${t.callUrl}" target="_blank" rel="noopener">${t.navCall}</a>
    </div>
    <a class="vex-cta" href="${t.callUrl}" target="_blank" rel="noopener">${t.navCall}</a>
    <button class="vex-burger" id="vexBurger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </nav>
  <main class="wrap">
    <header class="hero">
      <p class="eyebrow"><span>${t.eyebrow}</span></p>
      <h1>${esc(t.h1)}</h1>
      <p>${esc(t.lead)}</p>
    </header>
    <nav class="proj-jump" aria-label="${t.jump}">${PROJECTS.map(p => `<a href="#${p.id}">${esc(p[L].tag)}</a>`).join('')}</nav>
    <div class="proj-list">${PROJECTS.map(card).join('')}
    </div>
    <section class="cta post-cta">
      <span class="sec-badge"><i></i>Swiftrix</span>
      <h2>${esc(t.ctaH)}</h2>
      <p>${esc(t.ctaP)}</p>
      <div class="cta-actions"><a class="btn btn-primary" href="${t.callUrl}" target="_blank" rel="noopener">${t.ctaCall}</a><a class="btn btn-ghost" href="${t.demo}">${esc(t.ctaDemo)}</a></div>
    </section>
  </main>
  <footer>© 2026 Swiftrix · <a data-site="" href="${t.home}">swiftrix.eu</a></footer>
  <script src="/js/pages.js" defer></script>
</body>
</html>
`
}

for (const L of Object.keys(T)) {
  const html = page(L)
  if (/[–—]/.test(html)) throw new Error(`an em dash or en dash got into the ${L} page`)
  const dir = L === 'en' ? path.join(ROOT, 'projects') : path.join(ROOT, L, 'projects')
  fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'index.html'), html)
}
console.log(`built ${Object.keys(T).length} pages, ${PROJECTS.length} projects each`)
