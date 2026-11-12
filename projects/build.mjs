// Builds the projects page in English, Lithuanian and German from the data below. No dependencies.
//   node projects/build.mjs
// Writes projects/index.html (/projects), lt/projects/index.html (/lt/projects) and de/projects/index.html (/de/projects).
// Everything said here must come from what Swiftrix has said about its own work: the carousel on the home page and the Transsparta proposal (Swiftrix_x_Transsparta_LT.pdf).
// No invented numbers, results, quotes or client details. The build fails if an em dash or an en dash gets in.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://www.swiftrix.eu'
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CLIENT = {
  upshift: { name: 'joinupshift.com', url: 'https://joinupshift.com' }, gaya: { name: 'gaya.sk', url: 'https://gaya.sk' }, geosoul: { name: 'geosoul.sk', url: 'https://geosoul.sk' },
  hakom: { name: 'hakom.sk', url: 'https://hakom.sk' }, aluprint: { name: 'aluprint.sk', url: 'https://aluprint.sk' }, urbar: { name: 'urbarlamac.sk', url: 'https://urbarlamac.sk' },
  unisport: { name: 'unisport-kovac.sk', url: 'https://unisport-kovac.sk' }, shorts: { name: 'lithuanianshorts.com', url: 'https://lithuanianshorts.com' },
}
// one entry per project: id, who it was for, and the text in each language (tag, title, task, built, now, stats: [big, small] pairs)
const PROJECTS = [
  { id: 'content-platform', clients: ['upshift'], en: {
      tag: 'Content creation and creator portal', title: 'A content platform that creates, approves and publishes on its own',
      task: 'Content for social networks was made by hand: finding images, writing texts, putting slides together and posting on each channel one by one. Creators also had to be recruited, onboarded and paid.',
      built: 'A fully automated flow. The system generates the images and texts, assembles the slides and videos, sends them for approval and publishes straight to YouTube, Instagram and Facebook. The same platform runs a creator portal for recruiting and onboarding clippers and managing their accounts. It checks views and applies tiered payout rules automatically.',
      now: 'Content goes from start to published post without manual steps, and one dashboard tracks the sales, views and revenue each clipper generates. For creators this saves €1,000 to €2,000 a month.',
      stats: [['€1,000 to €2,000', 'saved per month for creators'], ['A to Z', 'images, texts and publishing']] },
    lt: {
      tag: 'Turinio kūrimas ir kūrėjų portalas', title: 'Turinio platforma, kuri pati sukuria, patvirtina ir paskelbia',
      task: 'Turinys socialiniams tinklams buvo kuriamas rankomis: vaizdų paieška, tekstų rašymas, skaidrių rinkimas ir skelbimas kiekviename kanale po vieną. Kūrėjus taip pat reikėjo verbuoti, įvesti į darbą ir jiems mokėti.',
      built: 'Visiškai automatizuotas srautas. Sistema sugeneruoja vaizdus ir tekstus, surenka skaidres bei vaizdo įrašus, pateikia juos patvirtinti ir paskelbia tiesiai „YouTube“, „Instagram“ ir „Facebook“. Ta pati platforma valdo kūrėjų portalą clipperiams verbuoti, įvesti į darbą ir jų paskyroms valdyti. Jis patikrina peržiūras ir automatiškai taiko pakopines išmokų taisykles.',
      now: 'Turinys nuo pradžios iki paskelbimo eina be rankinių žingsnių, o viename skydelyje stebimi pardavimai, peržiūros ir pajamos, kurias sugeneruoja kiekvienas clipperis. Kūrėjams tai sutaupo nuo 1 000 iki 2 000 € per mėnesį.',
      stats: [['1 000 iki 2 000 €', 'sutaupoma per mėnesį kūrėjams'], ['Nuo A iki Z', 'vaizdai, tekstai ir skelbimas']] },
    de: {
      tag: 'Content-Erstellung und Creator-Portal', title: 'Eine Content-Plattform, die selbst erstellt, freigibt und veröffentlicht',
      task: 'Inhalte für soziale Netzwerke wurden von Hand erstellt: Bilder suchen, Texte schreiben, Folien zusammenstellen und auf jedem Kanal einzeln veröffentlichen. Außerdem mussten Creator gewonnen, eingearbeitet und bezahlt werden.',
      built: 'Ein vollständig automatisierter Ablauf. Das System erzeugt Bilder und Texte, stellt Folien und Videos zusammen, legt sie zur Freigabe vor und veröffentlicht direkt auf YouTube, Instagram und Facebook. Dieselbe Plattform betreibt ein Creator-Portal, um Clipper zu gewinnen, einzuarbeiten und ihre Konten zu verwalten. Es prüft Aufrufe und wendet gestaffelte Auszahlungsregeln automatisch an.',
      now: 'Inhalte gehen ohne manuelle Schritte vom Anfang bis zum veröffentlichten Beitrag, und ein Dashboard zeigt Umsätze, Aufrufe und Einnahmen jedes Clippers. Für Creator spart das 1.000 bis 2.000 € im Monat.',
      stats: [['1.000 bis 2.000 €', 'gespart pro Monat für Creator'], ['Von A bis Z', 'Bilder, Texte und Veröffentlichung']] } },
  { id: 'document-scanning', clients: ['gaya'], en: {
      tag: 'Document scanning console', title: 'A console that sorts a whole batch of scanned documents',
      task: 'Employees compared documents with the database by hand, page by page, to decide what to keep and which paper invoices could be thrown away.',
      built: 'A program wired into their scanner, with a console on top of it. It sorts the whole batch into keep, reject, error and duplicate, and shows only the exceptions that deserve attention.',
      now: 'The whole batch is sorted at once. Staff are told exactly which paper invoices can be discarded, which frees up a large amount of storage space.',
      stats: [['One click', 'to scan and sort'], ['Whole batch', 'sorted at once']] },
    lt: {
      tag: 'Dokumentų skenavimo konsolė', title: 'Konsolė, kuri išrūšiuoja visą nuskaitytų dokumentų partiją',
      task: 'Darbuotojai rankomis, puslapis po puslapio, lygino dokumentus su duomenų baze, kad nuspręstų, ką palikti ir kurias popierines sąskaitas galima išmesti.',
      built: 'Programa, sujungta su jų skaitytuvu, ir ant jos pastatyta konsolė. Ji visą partiją išrūšiuoja į „palikti“, „atmesti“, „klaida“ ir „dublikatas“ ir parodo tik dėmesio vertas išimtis.',
      now: 'Visa partija išrūšiuojama iš karto. Darbuotojams tiksliai pasakoma, kurias popierines sąskaitas galima išmesti, ir atlaisvinama daug vietos archyve.',
      stats: [['1 paspaudimas', 'skenuoti ir rūšiuoti'], ['Visa partija', 'surūšiuojama iš karto']] },
    de: {
      tag: 'Konsole für das Dokumentenscannen', title: 'Eine Konsole, die einen ganzen Stapel gescannter Dokumente sortiert',
      task: 'Mitarbeitende verglichen Dokumente Seite für Seite von Hand mit der Datenbank, um zu entscheiden, was bleibt und welche Papierrechnungen weggeworfen werden können.',
      built: 'Ein Programm, das an ihren Scanner angebunden ist, mit einer Konsole darüber. Sie sortiert den ganzen Stapel in „behalten“, „ablehnen“, „Fehler“ und „Duplikat“ und zeigt nur die Ausnahmen, die Aufmerksamkeit verdienen.',
      now: 'Der ganze Stapel wird auf einmal sortiert. Die Mitarbeitenden erfahren genau, welche Papierrechnungen entsorgt werden können, und es wird viel Lagerplatz frei.',
      stats: [['Ein Klick', 'zum Scannen und Sortieren'], ['Ganzer Stapel', 'auf einmal sortiert']] } },
  { id: 'engineering-reports', clients: ['geosoul'], en: {
      tag: 'Engineering document generator', title: 'Geotechnical reports generated in two steps',
      task: 'Geotechnical reports were written by hand in Word: hours for each one, and easy to get wrong.',
      built: 'A two-step guide that turns a few structured inputs into a fully formatted technical Word document. Behind it is a custom app that performs the statics calculations, integrated with their products and handling different anchor types and soil conditions.',
      now: 'A tailored Word report for each project is created in a moment.',
      stats: [['2 steps', 'to a finished report'], ['.docx', 'created in a moment']] },
    lt: {
      tag: 'Inžinerinių dokumentų generatorius', title: 'Geotechninės ataskaitos, sukuriamos per du žingsnius',
      task: 'Geotechninės ataskaitos buvo rengiamos rankomis „Word“: valandos kiekvienai, lengva suklysti.',
      built: 'Dviejų žingsnių vediklis, kuris iš kelių struktūrintų įvesčių sugeneruoja visiškai suformatuotą techninį „Word“ dokumentą. Už jo veikia individuali programa, atliekanti statikos skaičiavimus, integruota su jų produktais ir mokanti dirbti su skirtingų tipų inkarais bei grunto sąlygomis.',
      now: 'Kiekvieno projekto pritaikyta „Word“ ataskaita sukuriama akimirksniu.',
      stats: [['2 žingsniai', 'iki baigtos ataskaitos'], ['.docx', 'sukuriamas akimirksniu']] },
    de: {
      tag: 'Generator für technische Dokumente', title: 'Geotechnische Berichte in zwei Schritten',
      task: 'Geotechnische Berichte wurden von Hand in Word geschrieben: Stunden für jeden einzelnen, und leicht Fehler zu machen.',
      built: 'Ein Zwei-Schritte-Assistent, der aus wenigen strukturierten Eingaben ein vollständig formatiertes technisches Word-Dokument erzeugt. Dahinter steht eine maßgeschneiderte App, die die Statikberechnungen durchführt, in ihre Produkte integriert ist und verschiedene Ankertypen und Bodenverhältnisse beherrscht.',
      now: 'Ein individueller Word-Bericht für jedes Projekt entsteht im Handumdrehen.',
      stats: [['2 Schritte', 'bis zum fertigen Bericht'], ['.docx', 'im Handumdrehen erstellt']] } },
  { id: 'quality-documents', clients: ['hakom', 'aluprint'], en: {
      tag: 'Quality document management', title: 'Digital protocols and read receipts for two factories',
      task: 'Instructions and procedures were distributed on paper, with no proof of who had read what. Signing off protocols produced hundreds of paper forms.',
      built: 'One system for two companies. Workers log in with their factory ID card, and every employee sees and confirms the documents that apply to them. The system keeps the full version and revision history.',
      now: 'Proof of reading is ready for an audit. At Aluprint, management can see at a glance that every worker has read and accepted the latest protocols, with no paperwork to chase.',
      stats: [['Audit ready', 'proof of who read what'], ['2 in 1', 'one shared platform']] },
    lt: {
      tag: 'Kokybės dokumentų valdymas', title: 'Skaitmeniniai protokolai ir perskaitymo įrodymai dviem gamykloms',
      task: 'Nurodymai ir procedūros buvo platinami popieriuje, be jokio įrodymo, kas ką perskaitė. Pasirašant protokolus susikaupdavo šimtai popierinių formų.',
      built: 'Viena sistema dviem įmonėms. Darbuotojai prisijungia gamyklos ID kortele, o kiekvienas darbuotojas mato ir patvirtina jam taikomus dokumentus. Sistema saugo pilną versijų ir revizijų istoriją.',
      now: 'Perskaitymo įrodymai paruošti auditui. Aluprint vadovybė iš karto mato, kad kiekvienas darbuotojas perskaitė ir priėmė naujausius protokolus, be jokių popierių, kuriuos reikėtų vaikytis.',
      stats: [['Auditui', 'įrodymai, kas ką perskaitė'], ['2 viename', 'bendra platforma']] },
    de: {
      tag: 'Verwaltung von Qualitätsdokumenten', title: 'Digitale Protokolle und Lesenachweise für zwei Fabriken',
      task: 'Anweisungen und Verfahren wurden auf Papier verteilt, ohne Nachweis, wer was gelesen hat. Das Abzeichnen von Protokollen erzeugte Hunderte von Papierformularen.',
      built: 'Ein System für zwei Unternehmen. Mitarbeitende melden sich mit ihrem Werksausweis an, und jede Person sieht und bestätigt die Dokumente, die für sie gelten. Das System führt die vollständige Versions- und Revisionshistorie.',
      now: 'Der Lesenachweis liegt für ein Audit bereit. Bei Aluprint sieht die Leitung auf einen Blick, dass jede Person die neuesten Protokolle gelesen und akzeptiert hat, ohne Papier, dem man hinterherlaufen muss.',
      stats: [['Auditfähig', 'Nachweis, wer was gelesen hat'], ['2 in 1', 'eine gemeinsame Plattform']] } },
  { id: 'ownership-mandates', clients: ['urbar'], en: {
      tag: 'Ownership and mandate automation', title: 'Ownership calculations that run themselves',
      task: 'Hundreds of hours went into writing Excel tables by hand and calculating ownership mandates, including the association\'s monthly payout calculations for its members.',
      built: 'Ownership sheets are uploaded, and the system processes them, calculates each mandate and merges the results into ready-made spreadsheets, based on the latest land-ownership certificates.',
      now: 'The monthly Excel calculations are generated automatically, and over 100 hours are saved per cycle.',
      stats: [['100+ hours', 'saved per cycle'], ['Automatic', 'mandate calculation']] },
    lt: {
      tag: 'Nuosavybės ir mandatų automatizavimas', title: 'Nuosavybės skaičiavimai, kurie vyksta patys',
      task: 'Šimtai valandų buvo skiriama rankomis rašant „Excel“ lenteles ir skaičiuojant nuosavybės mandatus, įskaitant asociacijos mėnesinius išmokų skaičiavimus nariams.',
      built: 'Įkeliami nuosavybės lapai, o sistema juos apdoroja, apskaičiuoja kiekvieną mandatą ir sujungia rezultatus į paruoštas skaičiuokles pagal naujausius žemės nuosavybės pažymėjimus.',
      now: 'Mėnesiniai „Excel“ skaičiavimai sugeneruojami automatiškai, o per ciklą sutaupoma daugiau nei 100 valandų.',
      stats: [['100+ val.', 'sutaupoma per ciklą'], ['Automatinis', 'mandatų skaičiavimas']] },
    de: {
      tag: 'Automatisierung von Eigentum und Mandaten', title: 'Eigentumsberechnungen, die von selbst laufen',
      task: 'Hunderte von Stunden gingen dafür drauf, Excel-Tabellen von Hand zu schreiben und Eigentumsmandate zu berechnen, einschließlich der monatlichen Auszahlungsberechnungen der Genossenschaft für ihre Mitglieder.',
      built: 'Eigentumsblätter werden hochgeladen, und das System verarbeitet sie, berechnet jedes Mandat und führt die Ergebnisse in fertigen Tabellen zusammen, basierend auf den neuesten Grundeigentumsnachweisen.',
      now: 'Die monatlichen Excel-Berechnungen werden automatisch erzeugt, und pro Zyklus werden über 100 Stunden gespart.',
      stats: [['100+ Std.', 'gespart pro Zyklus'], ['Automatische', 'Mandatsberechnung']] } },
  { id: 'database-migration', clients: ['unisport'], en: {
      tag: 'Database migration', title: 'Moving a very large database to a new website',
      task: 'A very large legacy database had to move from the old website to the new one.',
      built: 'An automated migration that cleans and re-sorts the data on the way.',
      now: 'Every record landed in the right place on the new website.', stats: [] },
    lt: {
      tag: 'Duomenų bazės perkėlimas', title: 'Labai didelės duomenų bazės perkėlimas į naują svetainę',
      task: 'Labai didelę senąją duomenų bazę reikėjo perkelti iš senos svetainės į naują.',
      built: 'Automatizuotas perkėlimas, kuris pakeliui išvalo ir iš naujo surūšiuoja duomenis.',
      now: 'Kiekvienas įrašas atsidūrė tinkamoje vietoje naujoje svetainėje.', stats: [] },
    de: {
      tag: 'Datenbankmigration', title: 'Eine sehr große Datenbank auf eine neue Website umziehen',
      task: 'Eine sehr große Altdatenbank musste von der alten auf die neue Website umziehen.',
      built: 'Eine automatisierte Migration, die die Daten unterwegs bereinigt und neu sortiert.',
      now: 'Jeder Datensatz landete an der richtigen Stelle auf der neuen Website.', stats: [] } },
  { id: 'film-programming', clients: ['shorts'], en: {
      tag: 'Film programming and reporting tool', title: 'An internal tool for a film archive',
      task: 'The Lithuanian Shorts archive needed an internal tool for building film programmes and for reporting on screenings and revenue.',
      built: 'A tool built around their film archive. It syncs the catalogue from their website automatically and builds film programmes that fit a chosen film count and running time.',
      now: 'It produces screening and revenue reports as Word or PDF, in Lithuanian or English.', stats: [] },
    lt: {
      tag: 'Filmų programų ir ataskaitų įrankis', title: 'Vidinis įrankis filmų archyvui',
      task: 'Lithuanian Shorts archyvui reikėjo vidinio įrankio filmų programoms sudaryti ir ataskaitoms apie seansus bei pajamas rengti.',
      built: 'Įrankis, sukurtas aplink jų filmų archyvą. Jis automatiškai sinchronizuoja katalogą iš jų svetainės ir sudaro filmų programas, atitinkančias pasirinktą filmų skaičių ir trukmę.',
      now: 'Jis parengia seansų ir pajamų ataskaitas „Word“ arba PDF formatu, lietuvių arba anglų kalba.', stats: [] },
    de: {
      tag: 'Tool für Filmprogramme und Berichte', title: 'Ein internes Tool für ein Filmarchiv',
      task: 'Das Archiv von Lithuanian Shorts brauchte ein internes Tool, um Filmprogramme zusammenzustellen und über Vorführungen und Einnahmen zu berichten.',
      built: 'Ein Tool rund um ihr Filmarchiv. Es synchronisiert den Katalog automatisch von ihrer Website und stellt Filmprogramme zusammen, die zu einer gewählten Filmanzahl und Laufzeit passen.',
      now: 'Es erstellt Vorführungs- und Umsatzberichte als Word oder PDF, auf Litauisch oder Englisch.', stats: [] } },
]

// the page text per language. about = what Swiftrix does, in short (from the Transsparta proposal)
const T = {
  en: { lang: 'en', url: '/projects', title: 'Our projects: custom software built for real businesses | Swiftrix',
    desc: 'What Swiftrix does and what it has built: a content platform, a document scanning console, a report generator, digital protocol signing, ownership calculations and more.',
    eyebrow: 'OUR PROJECTS', h1: 'Projects we have built', lead: 'A closer look at what we made for our clients: the task, what we built and what it does now. Every one is a custom tool shaped around how that company works.',
    aboutH: 'What Swiftrix does',
    about: 'Swiftrix is an independent software studio. We build custom software for companies that have outgrown spreadsheets and standard tools: operations consoles, client and partner portals, document and data automation, and internal tools that replace the spreadsheets and email routines a business runs on. We map the real process first, show a working prototype within days and a working version within weeks, put it into real hands early and keep improving it with use.',
    aboutItems: ['Operations consoles', 'Self-service portals', 'Document automation', 'Internal tools'],
    task: 'The task', built: 'What we built', now: 'What it does now', forLabel: 'For', jump: 'Jump to',
    navServices: 'Our services', navCall: 'Book a call', home: '/',
    ctaH: 'Have a task like one of these?', ctaP: 'Tell us what keeps eating your team\'s time. Book a short call and we will say honestly whether it is worth automating and what it would involve.', ctaCall: 'Book a call', ctaDemo: 'Try the live agent demo', demo: '/demo', callUrl: 'https://cal.com/swiftrix' },
  lt: { lang: 'lt', url: '/lt/projects', title: 'Mūsų projektai: individuali programinė įranga realioms įmonėms | Swiftrix',
    desc: 'Ką daro Swiftrix ir ką sukūrė: turinio platforma, dokumentų skenavimo konsolė, ataskaitų generatorius, skaitmeninis protokolų pasirašymas, nuosavybės skaičiavimai ir kita.',
    eyebrow: 'MŪSŲ PROJEKTAI', h1: 'Projektai, kuriuos sukūrėme', lead: 'Atidžiau apie tai, ką sukūrėme klientams: uždavinys, ką sukūrėme ir ką tai daro dabar. Kiekvienas įrankis pritaikytas prie to, kaip dirba konkreti įmonė.',
    aboutH: 'Ką daro Swiftrix',
    about: 'Swiftrix yra nepriklausoma programinės įrangos studija. Kuriame individualią programinę įrangą įmonėms, kurios peraugo skaičiuokles ir standartinius įrankius: operacijų konsoles, klientų ir partnerių portalus, dokumentų ir duomenų automatizavimą bei vidinius įrankius, kurie pakeičia skaičiuokles ir el. pašto procesus, ant kurių laikosi veikla. Pirmiausia išsiaiškiname tikrąjį procesą, per kelias dienas parodome veikiantį prototipą, o per kelias savaites veikiančią versiją, anksti paleidžiame ją realioms rankoms ir toliau tobuliname pagal naudojimą.',
    aboutItems: ['Operacijų konsolės', 'Savitarnos portalai', 'Dokumentų automatizavimas', 'Vidiniai įrankiai'],
    task: 'Uždavinys', built: 'Ką sukūrėme', now: 'Ką tai daro dabar', forLabel: 'Klientas', jump: 'Pereiti prie',
    navServices: 'Mūsų paslaugos', navCall: 'Užsisakyti skambutį', home: '/lt',
    ctaH: 'Turite panašų uždavinį?', ctaP: 'Papasakokite, kas jūsų komandai atima daugiausia laiko. Užsisakykite trumpą skambutį ir sąžiningai pasakysime, ar verta automatizuoti ir ką tai apimtų.', ctaCall: 'Užsisakyti skambutį', ctaDemo: 'Išbandyti DI agento demonstraciją', demo: '/lt/demo', callUrl: 'https://cal.com/swiftrix' },
  de: { lang: 'de', url: '/de/projects', title: 'Unsere Projekte: Individualsoftware für echte Unternehmen | Swiftrix',
    desc: 'Was Swiftrix macht und gebaut hat: eine Content-Plattform, eine Konsole für das Dokumentenscannen, ein Berichtsgenerator, digitale Protokollsignatur, Eigentumsberechnungen und mehr.',
    eyebrow: 'UNSERE PROJEKTE', h1: 'Projekte, die wir gebaut haben', lead: 'Ein genauerer Blick darauf, was wir für unsere Kunden gebaut haben: die Aufgabe, was wir gebaut haben und was es heute tut. Jedes ist ein maßgeschneidertes Werkzeug, geformt nach der Arbeitsweise des jeweiligen Unternehmens.',
    aboutH: 'Was Swiftrix macht',
    about: 'Swiftrix ist ein unabhängiges Softwarestudio. Wir bauen Individualsoftware für Unternehmen, die aus Tabellen und Standardwerkzeugen herausgewachsen sind: Betriebskonsolen, Kunden- und Partnerportale, Dokumenten- und Datenautomatisierung sowie interne Werkzeuge, die die Tabellen und E-Mail-Abläufe ersetzen, auf denen ein Betrieb läuft. Wir klären zuerst den echten Prozess, zeigen innerhalb von Tagen einen funktionierenden Prototyp und innerhalb von Wochen eine funktionierende Version, bringen sie früh in echte Hände und verbessern sie mit der Nutzung weiter.',
    aboutItems: ['Betriebskonsolen', 'Self-Service-Portale', 'Dokumentenautomatisierung', 'Interne Werkzeuge'],
    task: 'Die Aufgabe', built: 'Was wir gebaut haben', now: 'Was es heute tut', forLabel: 'Kunde', jump: 'Direkt zu',
    navServices: 'Unsere Leistungen', navCall: 'Anruf buchen', home: '/de',
    ctaH: 'Haben Sie eine ähnliche Aufgabe?', ctaP: 'Erzählen Sie uns, was die Zeit Ihres Teams auffrisst. Buchen Sie einen kurzen Anruf, und wir sagen Ihnen ehrlich, ob sich die Automatisierung lohnt und was dazugehört.', ctaCall: 'Anruf buchen', ctaDemo: 'Live-Demo des KI-Agenten testen', demo: '/de/demo', callUrl: 'https://cal.com/swiftrix' },
}

const page = (L) => {
  const t = T[L], canonical = SITE + t.url
  const alt = Object.entries(T).map(([k, v]) => `  <link rel="alternate" hreflang="${k}" href="${SITE}${v.url}">`).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${SITE}/projects">`
  const itemList = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.h1, url: canonical, inLanguage: t.lang, isPartOf: { '@type': 'WebSite', name: 'Swiftrix', url: SITE },
    description: t.about, mainEntity: { '@type': 'ItemList', itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p[L].title, url: `${canonical}#${p.id}` })) } }
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
        </div>${x.stats.length ? `
        <ul class="proj-stats">${x.stats.map(([a, b]) => `<li><strong>${esc(a)}</strong><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}
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
    <section class="proj-about" aria-labelledby="about-h">
      <h2 id="about-h">${esc(t.aboutH)}</h2>
      <p>${esc(t.about)}</p>
      <ul class="proj-about-list">${t.aboutItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </section>
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
