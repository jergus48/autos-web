// Cheat sheet for callers, in all three languages. Edit this file to add facts or change answers;
// the Sources page renders it. Only put in things that are true. If a caller is asked something not
// covered here, they say they will confirm it on the video call, never improvise.
import { Lang } from './fixed';

export type Src = {
  ui: { who: string; pitch: string; flow: string; build: string; work: string; ways: string; faq: string; projects: string };
  who: string;
  contact: string;
  pitch30: string;
  flow: string[];
  whatWeDo: { t: string; d: string }[];
  howWeWork: string[];
  ways: { t: string; d: string }[];
  faq: { q: string; a: string }[];
};

const en: Src = {
  ui: { who: 'WHO WE ARE', pitch: 'THE 30-SECOND ANSWER', flow: 'HOW A LEAD GOES THROUGH THE APP', build: 'WHAT WE BUILD', work: 'HOW WE WORK', ways: 'THREE WAYS TO START', faq: 'QUESTIONS YOU MAY BE ASKED', projects: 'PREVIOUS PROJECTS' },
  who: 'Swiftrix (swiftrix.eu) is a studio that builds custom software and personalised AI agents for companies that outgrew spreadsheets and off-the-shelf tools.',
  contact: 'info@swiftrix.eu · swiftrix.eu',
  pitch30:
    'We at Swiftrix build custom software and personalised AI agents for companies whose important work still lives in spreadsheets, email and paper: dashboards, client portals, document generators and agents that answer repetitive questions or sort documents. We usually have a first working prototype within weeks, not months.',
  flow: [
    'Cold call: be brief, show you did your homework, ask permission for 30 seconds.',
    'Goal of the call: get their best email address and agree a time for a short 1:1 video call (Google Meet). Do not try to sell on the phone.',
    'Log the call in the app. If they agreed to a meeting, tick "meeting agreed", enter their email, pick a free slot and send the Meet invite.',
    'After the client agrees, generate the slides and your presenter script for that company. Slides are for the Meet, not for the cold call.',
    'On the Meet: walk through the slides with the presenter script, ask the discovery questions, write down price expectations, tools they use and what they want in the agreement.',
    'After the Meet: open My calendar, flag the result (interested, maybe, not interested, no show) and fill in price, tools, agreement and notes.',
  ],
  whatWeDo: [
    { t: 'Operations consoles', d: 'Dashboards that turn raw operational data into decisions: sorting, review and status at a glance.' },
    { t: 'Self-service portals', d: 'Portals for clients, creators and partners with accounts, submissions, payouts and moderation.' },
    { t: 'Document automation', d: 'Reports, Word files and spreadsheets the team writes by hand today, generated in one click.' },
    { t: 'Internal tools', d: 'Purpose-built replacements for the spreadsheet and email processes a business runs on.' },
    { t: 'Personalised AI agents', d: 'Agents that answer repetitive questions, sort documents, draft offers and chase statuses.' },
  ],
  howWeWork: ['We map the process', 'Prototype in days', 'We launch live', 'We refine through use'],
  ways: [
    { t: 'Discovery sprint', d: 'A fixed, low-commitment phase to map the process and build a prototype of the solution.' },
    { t: 'Fixed-scope build', d: 'Clear scope, timeline and price to design, build and launch the product.' },
    { t: 'Ongoing partnership', d: 'We keep improving and extending the product as the business grows.' },
  ],
  faq: [
    { q: 'Who are you and what do you do?', a: 'We at Swiftrix build custom software and personalised AI agents for companies that outgrew spreadsheets: dashboards, portals, document generators and agents for repetitive work. The point is software that fits how the company really works, not a template they bend their process around.' },
    { q: 'Why are you calling us?', a: 'Be honest and specific: we looked at your website and at how companies like yours work, and we think part of the day-to-day work (name one concrete process from the research) is still done by hand in spreadsheets, email or paper. We would like to show you in a short video call how that could run automatically. The call script in the app has the details for each company.' },
    { q: 'What exactly can you build for us?', a: 'Four kinds of things, done well: operations consoles (dashboards), self-service portals, document automation and internal tools, plus personalised AI agents. For their company we prepare four concrete ideas with mock screens, and we show them on the video call.' },
    { q: 'Do you have examples or previous projects?', a: 'Yes, six working systems: Upshift (content creation and publishing automation), Gaya (document scanning console), Geosoul (engineering report generator), Hakom & Aluprint (quality document management), Urbár (land ownership and mandate automation) and a film programme and screening report tool used by the team. Pick the one or two closest to their business. Details are below on this page.' },
    { q: 'How long does it take?', a: 'We aim for a first working prototype within weeks, not months. After a discovery sprint they see a working screen very early, not just a slide. Do not promise exact dates for their project on the phone.' },
    { q: 'How much does it cost?', a: 'Do not quote numbers on the cold call. Say that the price depends on the scope, and that after the video call we can start with a discovery sprint (a fixed, low-commitment phase) or propose a fixed-scope build with a clear scope, timeline and price. If they press, note their budget expectation and tell them we will come back with a concrete proposal.' },
    { q: 'We already have software / our Excel works fine.', a: 'That is exactly where we are useful: standard software makes the process fit its product, and spreadsheets break when volume grows or when several people depend on them. We do not replace what works. We build the part that people still fill in by hand. Ask which process takes the most manual time today.' },
    { q: 'Just send me an email.', a: 'Happy to. Ask for the best email address for them (even if you already have one) and explain that the email will contain a Google Meet link for a short 1:1 video call where we show a short presentation prepared for their company and our previous work. Offer two time slots and ask which suits.' },
    { q: 'We have no time or no budget.', a: 'The video call is short and shows something concrete, not a sales speech. Nothing to decide on the call. If there is no budget now, ask when they plan the next budget round and offer to follow up then; log it as call back with a date.' },
    { q: 'Is this a no-code tool or real software?', a: 'Real software: full-cycle products that grow with the company, without the limits of no-code tools a year from now. Do not go deeper into the technology on the phone.' },
    { q: 'What about AI agents?', a: 'We build personalised AI agents for repetitive work: answering routine questions, sorting documents, drafting offers, chasing statuses. We choose between an agent and classic automation depending on what fits their process better. Keep it concrete and tied to one process of theirs.' },
    { q: 'Who owns the software, where is data stored, what about GDPR and security?', a: 'Do not answer from memory. Say that this is an important question that we cover in detail on the video call and in the agreement, and note it so it goes into the "what to put in the agreement" field after the meeting.' },
    { q: 'Where are you based and how big is the team?', a: 'This is not written down here yet. Ask your admin before you make calls, and do not improvise. If asked before you know, say you will introduce the team on the video call.' },
  ],
};

const lt: Src = {
  ui: { who: 'KAS MES ESAME', pitch: 'ATSAKYMAS PER 30 SEKUNDŽIŲ', flow: 'KAIP KLIENTAS EINA PER PROGRAMĖLĘ', build: 'KĄ MES KURIAME', work: 'KAIP MES DIRBAME', ways: 'TRYS BŪDAI PRADĖTI', faq: 'KLAUSIMAI, KURIŲ GALITE SULAUKTI', projects: 'ANKSTESNI PROJEKTAI' },
  who: 'Swiftrix (swiftrix.eu) yra studija, kuri kuria individualią programinę įrangą ir personalizuotus DI agentus įmonėms, kurios peraugo skaičiuokles ir standartinius įrankius.',
  contact: 'info@swiftrix.eu · swiftrix.eu',
  pitch30:
    'Mes Swiftrix kuriame individualią programinę įrangą ir personalizuotus DI agentus įmonėms, kurių svarbiausias darbas vis dar vyksta skaičiuoklėse, el. laiškuose ir ant popieriaus: skydelius, klientų portalus, dokumentų generatorius ir agentus, kurie atsako į pasikartojančius klausimus ar rūšiuoja dokumentus. Pirmą veikiantį prototipą paprastai turime per savaites, ne per mėnesius.',
  flow: [
    'Šaltas skambutis: kalbėkite trumpai, parodykite, kad pasiruošėte, paprašykite 30 sekundžių.',
    'Skambučio tikslas: gauti geriausią jų el. pašto adresą ir sutarti laiką trumpam vaizdo skambučiui 1:1 (Google Meet). Nebandykite parduoti telefonu.',
    'Užregistruokite skambutį programėlėje. Jei sutiko susitikti, pažymėkite „meeting agreed“, įveskite jų el. paštą, pasirinkite laisvą laiką ir išsiųskite Meet kvietimą.',
    'Kai klientas sutinka, sugeneruokite tos įmonės skaidres ir savo pristatymo scenarijų. Skaidrės skirtos Meet susitikimui, ne šaltam skambučiui.',
    'Meet metu: eikite per skaidres pagal pristatymo scenarijų, užduokite atradimo klausimus, užsirašykite numatomą kainą, jų naudojamus įrankius ir ką jie nori matyti sutartyje.',
    'Po Meet: atidarykite „My calendar“, pažymėkite rezultatą (interested, maybe, not interested, no show) ir užpildykite kainą, įrankius, sutartį ir pastabas.',
  ],
  whatWeDo: [
    { t: 'Operacijų konsolės', d: 'Skydeliai, paverčiantys neapdorotus veiklos duomenis sprendimais: rūšiavimas, peržiūra ir būsena vienu žvilgsniu.' },
    { t: 'Savitarnos portalai', d: 'Klientų, kūrėjų ir partnerių portalai su paskyromis, pateikimais, išmokomis ir moderavimu.' },
    { t: 'Dokumentų automatizavimas', d: 'Vienu paspaudimu sukuriamos ataskaitos, Word failai ir skaičiuoklės, kurias komanda šiandien rengia rankomis.' },
    { t: 'Vidiniai įrankiai', d: 'Specialiai sukurti pakaitalai skaičiuoklių ir el. pašto procesams, ant kurių laikosi veikla.' },
    { t: 'Personalizuoti DI agentai', d: 'Agentai, kurie atsako į pasikartojančius klausimus, rūšiuoja dokumentus, rengia pasiūlymus ir primena apie statusus.' },
  ],
  howWeWork: ['Išsiaiškiname procesą', 'Prototipas per dienas', 'Paleidžiame gyvai', 'Tobuliname pagal naudojimą'],
  ways: [
    { t: 'Atradimo sprintas', d: 'Fiksuotas, mažo įsipareigojimo etapas procesui išsiaiškinti ir sprendimo prototipui sukurti.' },
    { t: 'Fiksuotos apimties kūrimas', d: 'Aiški apimtis, terminas ir kaina produktui suprojektuoti, sukurti ir paleisti.' },
    { t: 'Nuolatinė partnerystė', d: 'Toliau tobuliname ir plečiame produktą augant veiklai.' },
  ],
  faq: [
    { q: 'Kas jūs esate ir ką darote?', a: 'Mes Swiftrix kuriame individualią programinę įrangą ir personalizuotus DI agentus įmonėms, kurios peraugo skaičiuokles: skydelius, portalus, dokumentų generatorius ir agentus pasikartojančiam darbui. Esmė: programinė įranga, pritaikyta tam, kaip įmonė iš tikrųjų dirba, o ne šablonas, prie kurio reikia derinti procesus.' },
    { q: 'Kodėl mums skambinate?', a: 'Būkite sąžiningi ir konkretūs: peržiūrėjome jūsų svetainę ir tai, kaip dirba panašios įmonės, ir manome, kad dalis kasdienio darbo (įvardykite vieną konkretų procesą iš tyrimo) vis dar daroma rankomis skaičiuoklėse, el. laiškuose ar ant popieriaus. Norėtume per trumpą vaizdo skambutį parodyti, kaip tai galėtų vykti automatiškai. Skambučio scenarijus programėlėje turi detales kiekvienai įmonei.' },
    { q: 'Ką tiksliai galite mums sukurti?', a: 'Keturių rūšių dalykus, atliekamus gerai: operacijų konsoles (skydelius), savitarnos portalus, dokumentų automatizavimą ir vidinius įrankius, taip pat personalizuotus DI agentus. Jų įmonei paruošiame keturias konkrečias idėjas su maketais ir parodome vaizdo skambučio metu.' },
    { q: 'Ar turite pavyzdžių ar ankstesnių projektų?', a: 'Taip, šešios veikiančios sistemos: Upshift (turinio kūrimo ir skelbimo automatizavimas), Gaya (dokumentų skenavimo konsolė), Geosoul (inžinerinių ataskaitų generatorius), Hakom & Aluprint (kokybės dokumentų valdymas), Urbár (žemės nuosavybės ir mandatų automatizavimas) ir filmų programų bei rodymų ataskaitų įrankis, kurį naudoja komanda. Pasirinkite vieną ar du, artimiausius jų verslui. Detalės žemiau šiame puslapyje.' },
    { q: 'Kiek tai trunka?', a: 'Siekiame pirmo veikiančio prototipo per savaites, ne mėnesius. Po atradimo sprinto jie labai anksti mato veikiantį ekraną, ne tik skaidrę. Telefonu nežadėkite tikslių jų projekto terminų.' },
    { q: 'Kiek tai kainuoja?', a: 'Šaltame skambutyje neįvardykite sumų. Sakykite, kad kaina priklauso nuo apimties, o po vaizdo skambučio galime pradėti nuo atradimo sprinto (fiksuotas, mažo įsipareigojimo etapas) arba pasiūlyti fiksuotos apimties kūrimą su aiškia apimtimi, terminu ir kaina. Jei spaudžia, užsirašykite jų biudžeto lūkestį ir pasakykite, kad grįšime su konkrečiu pasiūlymu.' },
    { q: 'Jau turime programinę įrangą / mūsų Excel puikiai veikia.', a: 'Būtent čia ir esame naudingi: standartinė programinė įranga verčia procesą derintis prie jos produkto, o skaičiuoklės genda, kai auga apimtys arba nuo jų priklauso keli žmonės. Mes nekeičiame to, kas veikia. Kuriame tai, ką žmonės vis dar pildo rankomis. Paklauskite, kuris procesas šiandien atima daugiausia rankinio darbo.' },
    { q: 'Tiesiog atsiųskite el. laišką.', a: 'Mielai. Paprašykite geriausio jų el. pašto adreso (net jei jau turite) ir paaiškinkite, kad laiške bus Google Meet nuoroda į trumpą vaizdo skambutį 1:1, kuriame parodysime trumpą jų įmonei paruoštą pristatymą ir ankstesnius mūsų darbus. Pasiūlykite du laikus ir paklauskite, kuris tinka.' },
    { q: 'Neturime laiko arba biudžeto.', a: 'Vaizdo skambutis trumpas ir parodo ką nors konkretaus, o ne pardavimo kalbą. Skambučio metu nieko nereikia spręsti. Jei dabar biudžeto nėra, paklauskite, kada planuoja kitą biudžeto etapą, ir pasiūlykite susisiekti tada; užregistruokite kaip „call back“ su data.' },
    { q: 'Tai „no-code“ įrankis ar tikra programinė įranga?', a: 'Tikra programinė įranga: pilno ciklo produktai, augantys kartu su įmone, be „no-code“ įrankių apribojimų po metų. Telefonu į technologijas neinkite giliau.' },
    { q: 'O kaip DI agentai?', a: 'Kuriame personalizuotus DI agentus pasikartojančiam darbui: atsakymams į įprastus klausimus, dokumentų rūšiavimui, pasiūlymų rengimui, statusų priminimui. Tarp agento ir klasikinės automatizacijos renkamės pagal tai, kas geriau tinka jų procesui. Kalbėkite konkrečiai ir susiekite su vienu jų procesu.' },
    { q: 'Kam priklauso programinė įranga, kur saugomi duomenys, kaip su BDAR ir saugumu?', a: 'Neatsakinėkite iš atminties. Sakykite, kad tai svarbus klausimas, kurį detaliai aptariame vaizdo skambučio metu ir sutartyje, ir užsirašykite, kad po susitikimo jis patektų į laukelį „ką įrašyti į sutartį“.' },
    { q: 'Kur esate įsikūrę ir kokia komanda?', a: 'Čia kol kas neaprašyta. Pasiklauskite administratoriaus prieš skambindami ir neimprovizuokite. Jei paklaus, kol dar nežinote, sakykite, kad komandą pristatysite vaizdo skambučio metu.' },
  ],
};

const de: Src = {
  ui: { who: 'WER WIR SIND', pitch: 'DIE ANTWORT IN 30 SEKUNDEN', flow: 'WIE EIN LEAD DURCH DIE APP LÄUFT', build: 'WAS WIR BAUEN', work: 'WIE WIR ARBEITEN', ways: 'DREI WEGE ZUM START', faq: 'FRAGEN, DIE SIE BEKOMMEN KÖNNEN', projects: 'FRÜHERE PROJEKTE' },
  who: 'Swiftrix (swiftrix.eu) ist ein Studio, das individuelle Software und personalisierte KI-Agenten für Unternehmen baut, die Tabellenkalkulationen und Standardtools entwachsen sind.',
  contact: 'info@swiftrix.eu · swiftrix.eu',
  pitch30:
    'Wir bei Swiftrix bauen individuelle Software und personalisierte KI-Agenten für Unternehmen, deren wichtigste Arbeit noch in Tabellen, E-Mails und auf Papier stattfindet: Dashboards, Kundenportale, Dokumentengeneratoren und Agenten, die wiederkehrende Fragen beantworten oder Dokumente sortieren. Einen ersten lauffähigen Prototyp haben wir in der Regel innerhalb von Wochen, nicht Monaten.',
  flow: [
    'Kaltanruf: kurz fassen, zeigen, dass Sie sich vorbereitet haben, um 30 Sekunden bitten.',
    'Ziel des Anrufs: die beste E-Mail-Adresse bekommen und einen Termin für einen kurzen 1:1-Videoanruf (Google Meet) vereinbaren. Versuchen Sie nicht, am Telefon zu verkaufen.',
    'Anruf in der App protokollieren. Wenn ein Termin vereinbart wurde, „meeting agreed“ wählen, deren E-Mail eintragen, einen freien Slot wählen und die Meet-Einladung senden.',
    'Sobald der Kunde zugestimmt hat, die Folien und Ihr Präsentationsskript für dieses Unternehmen erzeugen. Die Folien sind für das Meet, nicht für den Kaltanruf.',
    'Im Meet: die Folien anhand des Präsentationsskripts durchgehen, die Discovery-Fragen stellen und Preisvorstellung, genutzte Tools und Wünsche für den Vertrag notieren.',
    'Nach dem Meet: „My calendar“ öffnen, das Ergebnis markieren (interested, maybe, not interested, no show) und Preis, Tools, Vertrag und Notizen eintragen.',
  ],
  whatWeDo: [
    { t: 'Operations-Konsolen', d: 'Dashboards, die Rohdaten in Entscheidungen verwandeln: Sortieren, Prüfen und Status auf einen Blick.' },
    { t: 'Self-Service-Portale', d: 'Portale für Kunden, Creator und Partner mit Konten, Einreichungen, Auszahlungen und Moderation.' },
    { t: 'Dokumentenautomatisierung', d: 'Berichte, Word-Dateien und Tabellen, die das Team heute von Hand erstellt, per Klick erzeugt.' },
    { t: 'Interne Tools', d: 'Maßgeschneiderter Ersatz für die Tabellen- und E-Mail-Prozesse, auf denen ein Unternehmen läuft.' },
    { t: 'Personalisierte KI-Agenten', d: 'Agenten, die wiederkehrende Fragen beantworten, Dokumente sortieren, Angebote entwerfen und Status nachverfolgen.' },
  ],
  howWeWork: ['Wir erfassen den Prozess', 'Prototyp in Tagen', 'Wir gehen live', 'Wir verbessern durch Nutzung'],
  ways: [
    { t: 'Discovery-Sprint', d: 'Eine feste Phase mit geringem Commitment, um den Prozess zu erfassen und einen Prototyp der Lösung zu bauen.' },
    { t: 'Entwicklung mit festem Umfang', d: 'Klarer Umfang, Zeitplan und Preis für Entwurf, Bau und Start des Produkts.' },
    { t: 'Laufende Partnerschaft', d: 'Wir entwickeln das Produkt weiter und erweitern es mit dem Wachstum des Unternehmens.' },
  ],
  faq: [
    { q: 'Wer sind Sie und was machen Sie?', a: 'Wir bei Swiftrix bauen individuelle Software und personalisierte KI-Agenten für Unternehmen, die Tabellen entwachsen sind: Dashboards, Portale, Dokumentengeneratoren und Agenten für wiederkehrende Arbeit. Der Punkt: Software, die dazu passt, wie das Unternehmen wirklich arbeitet, keine Vorlage, der man seinen Prozess anpassen muss.' },
    { q: 'Warum rufen Sie uns an?', a: 'Seien Sie ehrlich und konkret: Wir haben uns Ihre Website angesehen und wie Unternehmen wie Ihres arbeiten, und wir glauben, dass ein Teil der täglichen Arbeit (nennen Sie einen konkreten Prozess aus der Recherche) noch von Hand in Tabellen, E-Mails oder auf Papier erledigt wird. Wir möchten Ihnen in einem kurzen Videoanruf zeigen, wie das automatisch laufen könnte. Das Anrufskript in der App enthält die Details für jedes Unternehmen.' },
    { q: 'Was genau können Sie für uns bauen?', a: 'Vier Arten von Dingen, gut gemacht: Operations-Konsolen (Dashboards), Self-Service-Portale, Dokumentenautomatisierung und interne Tools, dazu personalisierte KI-Agenten. Für das jeweilige Unternehmen bereiten wir vier konkrete Ideen mit Mockups vor und zeigen sie im Videoanruf.' },
    { q: 'Haben Sie Beispiele oder frühere Projekte?', a: 'Ja, sechs laufende Systeme: Upshift (Automatisierung von Content-Erstellung und Veröffentlichung), Gaya (Konsole zum Scannen von Dokumenten), Geosoul (Generator für Ingenieurberichte), Hakom & Aluprint (Management von Qualitätsdokumenten), Urbár (Automatisierung von Grundeigentum und Mandaten) und ein Tool für Filmprogramme und Vorführberichte, das im Team genutzt wird. Wählen Sie ein bis zwei, die ihrem Geschäft am nächsten sind. Details weiter unten auf dieser Seite.' },
    { q: 'Wie lange dauert das?', a: 'Wir streben einen ersten lauffähigen Prototyp innerhalb von Wochen an, nicht Monaten. Nach einem Discovery-Sprint sehen sie sehr früh einen funktionierenden Bildschirm, nicht nur eine Folie. Versprechen Sie am Telefon keine genauen Termine für ihr Projekt.' },
    { q: 'Was kostet das?', a: 'Nennen Sie im Kaltanruf keine Zahlen. Sagen Sie, dass der Preis vom Umfang abhängt und dass wir nach dem Videoanruf mit einem Discovery-Sprint (feste Phase mit geringem Commitment) beginnen oder eine Entwicklung mit festem Umfang, klarem Zeitplan und Preis vorschlagen können. Wenn sie nachhaken, notieren Sie die Budgetvorstellung und sagen Sie, dass wir mit einem konkreten Vorschlag zurückkommen.' },
    { q: 'Wir haben schon Software / unser Excel funktioniert gut.', a: 'Genau dort sind wir nützlich: Standardsoftware zwingt den Prozess in ihr Produkt, und Tabellen brechen, wenn das Volumen wächst oder mehrere Personen davon abhängen. Wir ersetzen nicht, was funktioniert. Wir bauen den Teil, den Menschen noch von Hand ausfüllen. Fragen Sie, welcher Prozess heute die meiste manuelle Zeit kostet.' },
    { q: 'Schicken Sie mir einfach eine E-Mail.', a: 'Gern. Fragen Sie nach der besten E-Mail-Adresse (auch wenn Sie schon eine haben) und erklären Sie, dass die E-Mail einen Google-Meet-Link für einen kurzen 1:1-Videoanruf enthält, in dem wir eine kurze, für ihr Unternehmen vorbereitete Präsentation und unsere bisherigen Arbeiten zeigen. Bieten Sie zwei Termine an und fragen Sie, welcher passt.' },
    { q: 'Wir haben keine Zeit oder kein Budget.', a: 'Der Videoanruf ist kurz und zeigt etwas Konkretes, keine Verkaufsrede. Im Gespräch muss nichts entschieden werden. Wenn aktuell kein Budget da ist, fragen Sie, wann die nächste Budgetrunde geplant ist, und bieten Sie an, sich dann zu melden; als „call back“ mit Datum erfassen.' },
    { q: 'Ist das ein No-Code-Tool oder echte Software?', a: 'Echte Software: vollwertige Produkte, die mit dem Unternehmen wachsen, ohne die Grenzen von No-Code-Tools in einem Jahr. Gehen Sie am Telefon nicht tiefer in die Technik.' },
    { q: 'Was ist mit KI-Agenten?', a: 'Wir bauen personalisierte KI-Agenten für wiederkehrende Arbeit: Routinefragen beantworten, Dokumente sortieren, Angebote entwerfen, Status nachverfolgen. Ob Agent oder klassische Automatisierung, entscheiden wir danach, was besser zu ihrem Prozess passt. Bleiben Sie konkret und beziehen Sie sich auf einen ihrer Prozesse.' },
    { q: 'Wem gehört die Software, wo liegen die Daten, was ist mit DSGVO und Sicherheit?', a: 'Antworten Sie nicht aus dem Gedächtnis. Sagen Sie, dass dies eine wichtige Frage ist, die wir im Videoanruf und im Vertrag im Detail klären, und notieren Sie sie, damit sie nach dem Meeting ins Feld „was in den Vertrag gehört“ kommt.' },
    { q: 'Wo sind Sie ansässig und wie groß ist das Team?', a: 'Das ist hier noch nicht festgehalten. Fragen Sie vor den Anrufen Ihren Admin und improvisieren Sie nicht. Wenn Sie gefragt werden, bevor Sie es wissen, sagen Sie, dass Sie das Team im Videoanruf vorstellen.' },
  ],
};

export const SRC: Record<Lang, Src> = { en, lt, de };
