export type Lang = 'lt' | 'en' | 'de';
export const LANGS: Lang[] = ['lt', 'en', 'de'];
export const LANG_NAMES: Record<Lang, string> = { lt: 'Lietuvių', en: 'English', de: 'Deutsch' };

type Work = { tag: string; name: string; sub: string; problem: string; solution: string; stats: [string, string][]; img: string };

export type Fixed = {
  ui: { problem: string; solution: string; wouldBuild: string; today: string };
  kinds: Record<string, string>;
  cover: { kicker: string; right: string; foot: string };
  what: { label: string; before: string; hl: string; after: string; chips: string[] };
  why: { label: string; title: string; items: string[] };
  build: { label: string; title: string; items: { t: string; d: string }[] };
  worksIntro: { label: string; title: string; text: string };
  works: Work[];
  pattern: { label: string; title: string; cols: { t: string; d: string; ex: string }[] };
  how: { label: string; title: string; steps: { t: string; d: string }[] };
  diff: { label: string; title: string; rows: { t: string; d: string }[] };
  short: { label: string; items: { v: string; t: string; d: string }[] };
  start: { label: string; title: string; items: { t: string; d: string }[] };
  qLabel: string;
  qFoot: string;
  closeLabel: string;
  ideasLabel: string;
};

const lt: Fixed = {
  ui: { problem: 'Anksčiau', solution: 'Ką sukūrėme', wouldBuild: 'KĄ SUKURTUMĖ', today: 'ŠIANDIEN' },
  kinds: { console: 'OPERACIJŲ KONSOLĖ', documents: 'DOKUMENTŲ AUTOMATIZAVIMAS', portal: 'SAVITARNOS PORTALAS', agent: 'DI AGENTAS', tool: 'VIDINIS ĮRANKIS' },
  cover: { kicker: 'INDIVIDUALIOS PROGRAMINĖS ĮRANGOS STUDIJA', right: 'PASIŪLYMO APŽVALGA · 2026', foot: 'Veikiantis prototipas per savaites, ne mėnesius' },
  what: { label: '01 — KĄ MES DAROME', before: 'Kuriame ', hl: 'individualią programinę įrangą', after: ' įmonėms, kurios peraugo skaičiuokles ir standartinius įrankius.', chips: ['Skydeliai ir konsolės', 'Klientų ir partnerių portalai', 'Duomenų ir dokumentų automatizavimas'] },
  why: { label: '02 — KODĖL ĮMONĖS KREIPIASI Į MUS', title: 'Geras verslas, stabdomas netinkamų įrankių.', items: ['Standartinė programinė įranga verčia jūsų procesus prisitaikyti prie jos produkto — o ne atvirkščiai.', 'Svarbiausias darbas vyksta ⟦skaičiuoklėse⟧ ir el. laiškuose — trapu, rankinis ir neįmanoma plėsti.', 'Universalūs sprendimai nepasiekia ⟦jūsų atvejų⟧, todėl žmonės tyliai užpildo spragas rankomis — komandos sąskaita.'] },
  build: { label: '03 — KĄ MES KURIAME', title: 'Keturi dalykai, atliekami išskirtinai gerai.', items: [
    { t: 'Operacijų konsolės', d: 'Skydeliai, paverčiantys neapdorotus veiklos duomenis sprendimais — rūšiavimas, peržiūra ir būsena vienu žvilgsniu.' },
    { t: 'Savitarnos portalai', d: 'Klientų, kūrėjų ir partnerių portalai su paskyromis, pateikimais, išmokomis ir moderavimu.' },
    { t: 'Dokumentų automatizavimas', d: 'Vienu paspaudimu sukuriamos ataskaitos, „Word“ failai ir skaičiuoklės, kurias komanda šiandien rengia rankomis.' },
    { t: 'Vidiniai įrankiai', d: 'Specialiai sukurti pakaitalai skaičiuoklių ir el. pašto procesams, ant kurių laikosi jūsų veikla.' }] },
  worksIntro: { label: '04 — ATRINKTI DARBAI', title: 'Atrinkti darbai', text: 'Šešios sistemos, sukurtos ir naudojamos — žiniasklaidoje, kultūroje, spaudoje, statybos inžinerijoje, dokumentų valdyme ir žemės administravime.' },
  works: [
    { tag: 'ATVEJIS 01 · ŽINIASKLAIDA / TURINIO AUTOMATIZAVIMAS', name: 'Upshift', sub: 'Turinio kūrimo ir planavimo platforma', problem: 'Turinys socialiniams tinklams buvo kuriamas rankomis — vaizdų paieška, tekstų rašymas, skaidrių rinkimas ir skelbimas kiekviename kanale po vieną.', solution: 'Visiškai automatizuotas srautas: sistema sugeneruoja vaizdus ir tekstus, surenka skaidres bei vaizdo įrašus, pateikia juos patvirtinti ir paskelbia tiesiai į „YouTube“, „Instagram“ ir „Facebook“. Ta pati platforma valdo kūrėjų portalą, kuris patikrina peržiūras ir automatiškai taiko pakopines išmokų taisykles.', stats: [['€1–2k', 'sutaupoma per mėnesį kūrėjams'], ['Nuo A iki Z', 'vaizdai, tekstai ir skelbimas']], img: 'upshift' },
    { tag: 'ATVEJIS 02 · DOKUMENTŲ VALDYMAS', name: 'Gaya', sub: 'Dokumentų skenavimo konsolė', problem: 'Darbuotojai rankomis, puslapis po puslapio, lygino dokumentus su duomenų baze.', solution: 'Konsolė, kuri visą partiją surūšiuoja į „palikti“, „atmesti“, „klaida“ ir „dublikatas“ — parodo tik dėmesio vertas išimtis.', stats: [['Visa partija', 'surūšiuojama iš karto'], ['1 paspaud.', 'skenuoti ir rūšiuoti']], img: 'gaya' },
    { tag: 'ATVEJIS 03 · STATYBOS INŽINERIJA', name: 'Geosoul', sub: 'Inžinerinių dokumentų generatorius', problem: 'Geotechninės ataskaitos rengiamos rankomis „Word“ — valandos kiekvienai, lengva suklysti.', solution: 'Dviejų žingsnių vediklis, kuris iš kelių struktūrintų įvesčių sugeneruoja visiškai suformatuotą techninį „Word“ dokumentą.', stats: [['2 žingsniai', 'iki baigtos ataskaitos'], ['.docx', 'sukuriama akimirksniu']], img: 'geosoul' },
    { tag: 'ATVEJIS 04 · GAMYBA / SPAUDA', name: 'Hakom & Aluprint', sub: 'Kokybės dokumentų valdymas', problem: 'Nurodymai ir procedūros platinami popieriuje — jokio įrodymo, kas ką perskaitė.', solution: 'Viena sistema, dvi įmonės: kiekvienas darbuotojas mato ir patvirtina jam taikomus dokumentus, su pilna versijų ir revizijų istorija.', stats: [['Auditui', 'perskaitymo įrodymai'], ['2 viename', 'bendra platforma']], img: 'hakom' },
    { tag: 'ATVEJIS 05 · ŽEMĖS ADMINISTRAVIMAS', name: 'Urbár', sub: 'Nuosavybės ir mandatų automatizavimas', problem: 'Šimtai valandų rankomis rašant „Excel“ lenteles ir skaičiuojant nuosavybės mandatus.', solution: 'Įkelkite nuosavybės lapus; sistema juos apdoroja, apskaičiuoja kiekvieną mandatą ir sujungia rezultatus į paruoštas skaičiuokles.', stats: [['100+ val.', 'sutaupoma per ciklą'], ['Auto', 'mandatų skaičiavimas']], img: 'urbar' },
    { tag: 'ATVEJIS 06 · KULTŪRA / KINO PLATINIMAS', name: 'Filmų programų ir rodymų ataskaitų įrankis', sub: 'Jau veikia ir naudojamas komandos darbe', problem: 'Filmų programos festivaliams ir partneriams buvo dėliojamos rankomis iš kelių šimtų filmų archyvo, skaičiuojant trukmes ir tikrinant licencijas, o rodymų ataskaitos kūrėjams rengiamos iš skaičiuoklių.', solution: 'Įrankis, kuris pagal temą ir ribas — filmų skaičių, bendrą trukmę, licencijas — pasiūlo kelis programos variantus, o rodymų duomenis paverčia ataskaita. Abu dokumentai sukuriami iš karto Word ir PDF formatu, lietuvių arba anglų kalba.', stats: [['Veikia', 'naudojamas komandos darbe'], ['LT / EN', '.docx ir PDF vienu paspaudimu']], img: 'films' },
  ],
  pattern: { label: '05 — BENDRAS VARDIKLIS', title: 'Šešios sritys. Vienas pasikartojantis modelis.', cols: [
    { t: 'Rūšiavimas ir peržiūra', d: 'Automatiškai surūšiuokite didelius kiekius; žmonės sprendžia tik išimtis.', ex: 'Gaya · Hakom' },
    { t: 'Kūrimas ir publikavimas', d: 'Automatiškai kurkite turinį ir skelbkite jį visuose kanaluose nuo pradžios iki pabaigos.', ex: 'Upshift' },
    { t: 'Generavimas vienu paspaudimu', d: 'Struktūrintas įvestis paverskite baigtais dokumentais ir skaičiuoklėmis.', ex: 'Geosoul · Urbár · Filmų programos' }] },
  how: { label: '06 — KAIP MES DIRBAME', title: 'Veikianti programinė įranga, greitai.', steps: [
    { t: 'Išsiaiškiname procesą', d: 'Suprantame, kaip darbas vyksta iš tikrųjų — įskaitant rankinius žingsnius, kurių niekas nedokumentuoja.' },
    { t: 'Prototipas per dienas', d: 'Beveik iškart reaguojate į veikiantį ekraną — ne skaidrę, ne maketą.' },
    { t: 'Paleidžiame gyvai', d: 'Naudojamas produktas anksti patenka į realias rankas, todėl nauda prasideda dar nepasibaigus projektui.' },
    { t: 'Tobuliname pagal naudojimą', d: 'Realus naudojimas parodo, ką tobulinti toliau. Produktas nuolat gerėja.' }] },
  diff: { label: '07 — KODĖL SWIFTRIX', title: 'Skirtumas — tinkamumas.', rows: [
    { t: 'Pritaikyta jums', d: 'Programinė įranga, pritaikyta jūsų procesui — ne šablonas, kurį derinate, kol beveik veikia.' },
    { t: 'Tikra programinė įranga', d: 'Pilno ciklo produktai, augantys kartu su jumis — jokių „no-code“ apribojimų po metų.' },
    { t: 'Greita nauda', d: 'Veikiantis produktas per savaites — grąžą pajusite gerokai anksčiau nei sąskaitą.' }] },
  short: { label: '08 — TRUMPAI', items: [
    { v: 'Savaitės', t: 'Iki veikiančios versijos', d: 'Ne mėnesiai specifikacijų, kol ką nors pamatysite.' },
    { v: 'Bet kuri', t: 'Sritis, bet koks procesas', d: 'Žiniasklaida, kultūra, dokumentai, inžinerija, spauda, žemė — jūsų kita.' },
    { v: '1', t: 'Studija nuo A iki Z', d: 'Projektuojame, kuriame ir paleidžiame po vienu stogu.' }] },
  start: { label: '09 — BENDRADARBIAVIMAS', title: 'Trys būdai pradėti.', items: [
    { t: 'Atradimo sprintas', d: 'Fiksuotas, mažo įsipareigojimo etapas procesui išsiaiškinti ir sprendimo prototipui sukurti.' },
    { t: 'Fiksuotos apimties kūrimas', d: 'Aiški apimtis, terminas ir kaina produktui suprojektuoti, sukurti ir paleisti.' },
    { t: 'Nuolatinė partnerystė', d: 'Toliau tobuliname ir plečiame produktą augant jūsų veiklai.' }] },
  qLabel: 'DABAR JUS', qFoot: 'Atsineškite šiuos atsakymus į atradimo sprintą — realų procesą išsiaiškiname prieš ką nors projektuodami.',
  closeLabel: 'KURKIME KARTU', ideasLabel: 'IDĖJOS',
};

const en: Fixed = {
  ui: { problem: 'Before', solution: 'What we built', wouldBuild: 'WHAT WE WOULD BUILD', today: 'TODAY' },
  kinds: { console: 'OPERATIONS CONSOLE', documents: 'DOCUMENT AUTOMATION', portal: 'SELF-SERVICE PORTAL', agent: 'AI AGENT', tool: 'INTERNAL TOOL' },
  cover: { kicker: 'CUSTOM SOFTWARE STUDIO', right: 'PROPOSAL OVERVIEW · 2026', foot: 'Working prototypes in weeks, not months' },
  what: { label: '01 — WHAT WE DO', before: 'We build ', hl: 'custom software', after: ' for companies that have outgrown spreadsheets and off-the-shelf tools.', chips: ['Dashboards and consoles', 'Client and partner portals', 'Data and document automation'] },
  why: { label: '02 — WHY COMPANIES COME TO US', title: 'Good businesses, held back by the wrong tools.', items: ['Off-the-shelf software forces your processes to fit its product, not the other way round.', 'The most important work happens in ⟦spreadsheets⟧ and email: fragile, manual and impossible to scale.', 'Generic tools never fit ⟦your exact cases⟧, so people quietly fill the gaps by hand, at the team\'s expense.'] },
  build: { label: '03 — WHAT WE BUILD', title: 'Four things, done exceptionally well.', items: [
    { t: 'Operations consoles', d: 'Dashboards that turn raw operational data into decisions: sorting, review and status at a glance.' },
    { t: 'Self-service portals', d: 'Portals for clients, creators and partners with accounts, submissions, payouts and moderation.' },
    { t: 'Document automation', d: 'Reports, Word files and spreadsheets your team writes by hand today, generated in one click.' },
    { t: 'Internal tools', d: 'Purpose-built replacements for the spreadsheet and email processes your business runs on.' }] },
  worksIntro: { label: '04 — SELECTED WORK', title: 'Selected work', text: 'Six systems built and in daily use across media, culture, print, construction engineering, document management and land administration.' },
  works: [
    { tag: 'CASE 01 · MEDIA / CONTENT AUTOMATION', name: 'Upshift', sub: 'Content creation and planning platform', problem: 'Social media content was made by hand: finding images, writing copy, assembling slides and posting to each channel one by one.', solution: 'A fully automated flow: the system generates images and copy, assembles slides and videos, sends them for approval and publishes straight to YouTube, Instagram and Facebook. The same platform runs a creator portal that checks views and applies tiered payout rules automatically.', stats: [['€1–2k', 'saved per month on creators'], ['A to Z', 'visuals, copy and publishing']], img: 'upshift' },
    { tag: 'CASE 02 · DOCUMENT MANAGEMENT', name: 'Gaya', sub: 'Document scanning console', problem: 'Staff compared documents against a database by hand, page by page.', solution: 'A console that sorts a whole batch into keep, reject, error and duplicate, and shows only the exceptions that need attention.', stats: [['Whole batch', 'sorted at once'], ['1 click', 'to scan and sort']], img: 'gaya' },
    { tag: 'CASE 03 · CONSTRUCTION ENGINEERING', name: 'Geosoul', sub: 'Engineering document generator', problem: 'Geotechnical reports were written by hand in Word: hours each and easy to get wrong.', solution: 'A two-step wizard that turns a few structured inputs into a fully formatted technical Word document.', stats: [['2 steps', 'to a finished report'], ['.docx', 'generated instantly']], img: 'geosoul' },
    { tag: 'CASE 04 · MANUFACTURING / PRINT', name: 'Hakom & Aluprint', sub: 'Quality document management', problem: 'Instructions and procedures were distributed on paper, with no proof of who had read what.', solution: 'One system for two companies: every employee sees and confirms the documents that apply to them, with full version and revision history.', stats: [['Audit-ready', 'proof of reading'], ['2 in 1', 'shared platform']], img: 'hakom' },
    { tag: 'CASE 05 · LAND ADMINISTRATION', name: 'Urbár', sub: 'Ownership and mandate automation', problem: 'Hundreds of hours spent typing Excel tables and calculating ownership mandates by hand.', solution: 'Upload the ownership sheets; the system processes them, calculates every mandate and merges the results into ready-made spreadsheets.', stats: [['100+ hrs', 'saved per cycle'], ['Auto', 'mandate calculation']], img: 'urbar' },
    { tag: 'CASE 06 · CULTURE / FILM DISTRIBUTION', name: 'Film programme and screening report tool', sub: 'Live and used by the team', problem: 'Film programmes for festivals and partners were assembled by hand from an archive of several hundred films, counting runtimes and checking licences, while screening reports for creators were built from spreadsheets.', solution: 'A tool that proposes several programme options from a theme and limits (film count, total runtime, licences) and turns screening data into a report. Both documents are produced instantly as Word and PDF, in Lithuanian or English.', stats: [['Live', 'used by the team'], ['LT / EN', '.docx and PDF in one click']], img: 'films' },
  ],
  pattern: { label: '05 — THE COMMON THREAD', title: 'Six fields. One repeating pattern.', cols: [
    { t: 'Sorting and review', d: 'Sort large volumes automatically; people only decide the exceptions.', ex: 'Gaya · Hakom' },
    { t: 'Creating and publishing', d: 'Create content and publish it across every channel, end to end, automatically.', ex: 'Upshift' },
    { t: 'One-click generation', d: 'Turn structured input into finished documents and spreadsheets.', ex: 'Geosoul · Urbár · Film programmes' }] },
  how: { label: '06 — HOW WE WORK', title: 'Working software, fast.', steps: [
    { t: 'We map the process', d: 'We learn how the work really happens, including the manual steps nobody documents.' },
    { t: 'Prototype in days', d: 'You react to a working screen almost immediately, not a slide or a mockup.' },
    { t: 'We launch live', d: 'A used product reaches real hands early, so the value starts before the project ends.' },
    { t: 'We refine through use', d: 'Real usage shows what to improve next. The product keeps getting better.' }] },
  diff: { label: '07 — WHY SWIFTRIX', title: 'The difference is fit.', rows: [
    { t: 'Made for you', d: 'Software fitted to your process, not a template you tweak until it almost works.' },
    { t: 'Real software', d: 'Full-cycle products that grow with you, with no no-code limits a year from now.' },
    { t: 'Fast payback', d: 'A working product within weeks, so you feel the return long before the invoice.' }] },
  short: { label: '08 — IN SHORT', items: [
    { v: 'Weeks', t: 'To a working version', d: 'Not months of specifications before you see anything.' },
    { v: 'Any', t: 'Field, any process', d: 'Media, culture, documents, engineering, print, land: yours is next.' },
    { v: '1', t: 'Studio, A to Z', d: 'We design, build and launch under one roof.' }] },
  start: { label: '09 — WORKING TOGETHER', title: 'Three ways to start.', items: [
    { t: 'Discovery sprint', d: 'A fixed, low-commitment phase to map the process and build a prototype of the solution.' },
    { t: 'Fixed-scope build', d: 'Clear scope, timeline and price to design, build and launch the product.' },
    { t: 'Ongoing partnership', d: 'We keep improving and extending the product as your business grows.' }] },
  qLabel: 'NOW YOU', qFoot: 'Bring these answers to a discovery sprint: we map the real process before designing anything.',
  closeLabel: 'LET\'S BUILD TOGETHER', ideasLabel: 'IDEAS',
};

const de: Fixed = {
  ui: { problem: 'Vorher', solution: 'Was wir gebaut haben', wouldBuild: 'WAS WIR BAUEN WÜRDEN', today: 'HEUTE' },
  kinds: { console: 'OPERATIONS-KONSOLE', documents: 'DOKUMENTENAUTOMATISIERUNG', portal: 'SELF-SERVICE-PORTAL', agent: 'KI-AGENT', tool: 'INTERNES TOOL' },
  cover: { kicker: 'STUDIO FÜR INDIVIDUELLE SOFTWARE', right: 'ANGEBOTSÜBERBLICK · 2026', foot: 'Funktionierende Prototypen in Wochen, nicht Monaten' },
  what: { label: '01 — WAS WIR TUN', before: 'Wir entwickeln ', hl: 'individuelle Software', after: ' für Unternehmen, die Tabellenkalkulationen und Standardtools entwachsen sind.', chips: ['Dashboards und Konsolen', 'Kunden- und Partnerportale', 'Daten- und Dokumentenautomatisierung'] },
  why: { label: '02 — WARUM UNTERNEHMEN ZU UNS KOMMEN', title: 'Gute Unternehmen, ausgebremst von den falschen Werkzeugen.', items: ['Standardsoftware zwingt Ihre Prozesse, sich ihrem Produkt anzupassen, nicht umgekehrt.', 'Die wichtigste Arbeit passiert in ⟦Tabellen⟧ und E-Mails: fragil, manuell und nicht skalierbar.', 'Universallösungen passen nie zu ⟦Ihren genauen Fällen⟧, deshalb schließen Mitarbeitende die Lücken still von Hand, auf Kosten des Teams.'] },
  build: { label: '03 — WAS WIR BAUEN', title: 'Vier Dinge, außergewöhnlich gut gemacht.', items: [
    { t: 'Operations-Konsolen', d: 'Dashboards, die Rohdaten in Entscheidungen verwandeln: Sortieren, Prüfen und Status auf einen Blick.' },
    { t: 'Self-Service-Portale', d: 'Portale für Kunden, Creator und Partner mit Konten, Einreichungen, Auszahlungen und Moderation.' },
    { t: 'Dokumentenautomatisierung', d: 'Berichte, Word-Dateien und Tabellen, die Ihr Team heute von Hand erstellt, per Klick erzeugt.' },
    { t: 'Interne Tools', d: 'Maßgeschneiderter Ersatz für die Tabellen- und E-Mail-Prozesse, auf denen Ihr Geschäft läuft.' }] },
  worksIntro: { label: '04 — AUSGEWÄHLTE PROJEKTE', title: 'Ausgewählte Projekte', text: 'Sechs Systeme, gebaut und täglich im Einsatz in Medien, Kultur, Druck, Bauingenieurwesen, Dokumentenmanagement und Grundstücksverwaltung.' },
  works: [
    { tag: 'FALL 01 · MEDIEN / CONTENT-AUTOMATISIERUNG', name: 'Upshift', sub: 'Plattform für Content-Erstellung und Planung', problem: 'Social-Media-Inhalte wurden von Hand erstellt: Bilder suchen, Texte schreiben, Slides zusammenstellen und jeden Kanal einzeln bespielen.', solution: 'Ein vollautomatischer Ablauf: Das System erzeugt Bilder und Texte, stellt Slides und Videos zusammen, legt sie zur Freigabe vor und veröffentlicht direkt auf YouTube, Instagram und Facebook. Dieselbe Plattform betreibt ein Creator-Portal, das Aufrufe prüft und gestaffelte Auszahlungsregeln automatisch anwendet.', stats: [['€1–2k', 'pro Monat bei Creatorn gespart'], ['A bis Z', 'Visuals, Texte und Veröffentlichung']], img: 'upshift' },
    { tag: 'FALL 02 · DOKUMENTENMANAGEMENT', name: 'Gaya', sub: 'Konsole zum Scannen von Dokumenten', problem: 'Mitarbeitende verglichen Dokumente Seite für Seite von Hand mit einer Datenbank.', solution: 'Eine Konsole, die einen ganzen Stapel in Behalten, Ablehnen, Fehler und Duplikat sortiert und nur die Ausnahmen zeigt, die Aufmerksamkeit brauchen.', stats: [['Ganzer Stapel', 'sofort sortiert'], ['1 Klick', 'zum Scannen und Sortieren']], img: 'gaya' },
    { tag: 'FALL 03 · BAUINGENIEURWESEN', name: 'Geosoul', sub: 'Generator für Ingenieurdokumente', problem: 'Geotechnische Berichte wurden von Hand in Word geschrieben: Stunden pro Bericht und fehleranfällig.', solution: 'Ein Zwei-Schritte-Assistent, der aus wenigen strukturierten Eingaben ein vollständig formatiertes technisches Word-Dokument erzeugt.', stats: [['2 Schritte', 'zum fertigen Bericht'], ['.docx', 'sofort erzeugt']], img: 'geosoul' },
    { tag: 'FALL 04 · FERTIGUNG / DRUCK', name: 'Hakom & Aluprint', sub: 'Management von Qualitätsdokumenten', problem: 'Anweisungen und Verfahren wurden auf Papier verteilt, ohne Nachweis, wer was gelesen hat.', solution: 'Ein System für zwei Firmen: Jeder Mitarbeitende sieht und bestätigt die für ihn geltenden Dokumente, mit vollständiger Versions- und Revisionshistorie.', stats: [['Auditfähig', 'Lesenachweis'], ['2 in 1', 'gemeinsame Plattform']], img: 'hakom' },
    { tag: 'FALL 05 · GRUNDSTÜCKSVERWALTUNG', name: 'Urbár', sub: 'Automatisierung von Eigentum und Mandaten', problem: 'Hunderte Stunden gingen für das Tippen von Excel-Tabellen und die manuelle Berechnung von Eigentumsmandaten drauf.', solution: 'Eigentumslisten hochladen; das System verarbeitet sie, berechnet jedes Mandat und führt die Ergebnisse in fertigen Tabellen zusammen.', stats: [['100+ Std.', 'gespart pro Zyklus'], ['Auto', 'Mandatsberechnung']], img: 'urbar' },
    { tag: 'FALL 06 · KULTUR / FILMVERLEIH', name: 'Tool für Filmprogramme und Vorführberichte', sub: 'Live und im Team im Einsatz', problem: 'Filmprogramme für Festivals und Partner wurden von Hand aus einem Archiv mit mehreren hundert Filmen zusammengestellt, inklusive Laufzeiten und Lizenzprüfung, und Vorführberichte für Kreative entstanden aus Tabellen.', solution: 'Ein Tool, das aus Thema und Grenzen (Filmanzahl, Gesamtlaufzeit, Lizenzen) mehrere Programmvarianten vorschlägt und Vorführdaten in einen Bericht verwandelt. Beide Dokumente entstehen sofort als Word und PDF, auf Litauisch oder Englisch.', stats: [['Live', 'im Team im Einsatz'], ['LT / EN', '.docx und PDF per Klick']], img: 'films' },
  ],
  pattern: { label: '05 — DER ROTE FADEN', title: 'Sechs Felder. Ein wiederkehrendes Muster.', cols: [
    { t: 'Sortieren und Prüfen', d: 'Große Mengen automatisch sortieren; Menschen entscheiden nur die Ausnahmen.', ex: 'Gaya · Hakom' },
    { t: 'Erstellen und Veröffentlichen', d: 'Inhalte erstellen und über alle Kanäle automatisch veröffentlichen, von Anfang bis Ende.', ex: 'Upshift' },
    { t: 'Erzeugung per Klick', d: 'Strukturierte Eingaben in fertige Dokumente und Tabellen verwandeln.', ex: 'Geosoul · Urbár · Filmprogramme' }] },
  how: { label: '06 — WIE WIR ARBEITEN', title: 'Funktionierende Software, schnell.', steps: [
    { t: 'Wir erfassen den Prozess', d: 'Wir verstehen, wie die Arbeit wirklich abläuft, einschließlich der manuellen Schritte, die niemand dokumentiert.' },
    { t: 'Prototyp in Tagen', d: 'Sie reagieren fast sofort auf einen funktionierenden Bildschirm, nicht auf eine Folie oder ein Mockup.' },
    { t: 'Wir gehen live', d: 'Ein genutztes Produkt kommt früh in echte Hände, der Nutzen beginnt also vor Projektende.' },
    { t: 'Wir verbessern durch Nutzung', d: 'Die reale Nutzung zeigt, was als Nächstes zu verbessern ist. Das Produkt wird stetig besser.' }] },
  diff: { label: '07 — WARUM SWIFTRIX', title: 'Der Unterschied ist die Passgenauigkeit.', rows: [
    { t: 'Für Sie gemacht', d: 'Software, passend zu Ihrem Prozess, keine Vorlage, die Sie anpassen, bis sie fast funktioniert.' },
    { t: 'Echte Software', d: 'Vollwertige Produkte, die mit Ihnen wachsen, ohne No-Code-Grenzen in einem Jahr.' },
    { t: 'Schneller Nutzen', d: 'Ein funktionierendes Produkt in Wochen, Sie spüren den Ertrag lange vor der Rechnung.' }] },
  short: { label: '08 — KURZ GEFASST', items: [
    { v: 'Wochen', t: 'Bis zur lauffähigen Version', d: 'Keine Monate an Spezifikationen, bevor Sie etwas sehen.' },
    { v: 'Jedes', t: 'Feld, jeder Prozess', d: 'Medien, Kultur, Dokumente, Ingenieurwesen, Druck, Land: Ihrer ist der nächste.' },
    { v: '1', t: 'Studio von A bis Z', d: 'Wir entwerfen, bauen und starten unter einem Dach.' }] },
  start: { label: '09 — ZUSAMMENARBEIT', title: 'Drei Wege zum Start.', items: [
    { t: 'Discovery-Sprint', d: 'Eine feste Phase mit geringem Commitment, um den Prozess zu erfassen und einen Prototyp der Lösung zu bauen.' },
    { t: 'Entwicklung mit festem Umfang', d: 'Klarer Umfang, Zeitplan und Preis für Entwurf, Bau und Start des Produkts.' },
    { t: 'Laufende Partnerschaft', d: 'Wir entwickeln das Produkt weiter und erweitern es mit Ihrem Wachstum.' }] },
  qLabel: 'JETZT SIE', qFoot: 'Bringen Sie diese Antworten in einen Discovery-Sprint mit: Wir erfassen den echten Prozess, bevor wir etwas entwerfen.',
  closeLabel: 'GEMEINSAM BAUEN', ideasLabel: 'IDEEN',
};

export const FIXED: Record<Lang, Fixed> = { lt, en, de };
