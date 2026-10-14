// Swedish (/sv) strings for the shared scripts. See i18n/README.md.
(window.SWX_I18N = window.SWX_I18N || {}).sv = {
  locale: 'sv-SE',
  themeLabel: ['Byt till mörkt läge', 'Byt till ljust läge'],

  assistantT: {
    think: ['Analyserar ert problem…', 'Letar efter de bäst lämpade lösningarna…', 'Går igenom våra tidigare projekt…', 'Skriver mejlet till vårt team…'],
    understood: 'Så här uppfattade vi det', offTopic: 'Svar',
    retryHint: 'Beskriv en uppgift eller ett problem i ert företag som ni vill förenkla, till exempel vem som gör det, hur lång tid det tar och vilken programvara ni använder.', retry: 'Beskriv det på ett annat sätt',
    kind: { agent: 'AI-agent', automation: 'Automatisering', integration: 'Integration', app: 'Skräddarsydd app' },
    cx: { simple: 'Enkel', medium: 'Medelstor insats', complex: 'Komplex' },
    tooShort: 'Beskriv problemet lite mer utförligt, minst en eller två meningar.',
    err: { rate: 'För många förfrågningar i rad. Försök igen om några minuter.', off: 'AI-assistenten är inte tillgänglig just nu. Skriv till oss nedan eller boka ett samtal direkt.', generic: 'Vi fick inget svar. Försök igen.' },
    needFields: 'Ange ert namn och en giltig e-postadress och bekräfta samtycket.',
    sending: 'Skickar…', send: 'Skicka mejlet',
    sent: function (n) { return 'Tack, ' + n + '! Vi har tagit emot ert mejl och svarar per e-post. Vill ni prata tidigare kan ni boka ett samtal nedan.' },
    sendOff: 'Automatiskt utskick fungerar inte just nu. Öppna mejlet i ert mejlprogram. Det är redan förberett:',
    openMail: 'Öppna i mejlprogrammet',
    sendErr: 'Det gick inte att skicka. Försök igen eller skriv direkt till info@swiftrix.eu.',
    rateSend: 'Ett mejl skickades härifrån alldeles nyss. Om ni vill lägga till något, skriv direkt till info@swiftrix.eu.',
    calFail: 'Kalendern kunde inte laddas.',
    notesPrefix: 'Från AI-assistenten på swiftrix.eu'
  },

  assistantCases: {
    hakom: ['Digital protokollsignering', 'Vi digitaliserade hela protokollsigneringen i produktionen. Medarbetare loggar in med sitt passerkort, ser varje nytt dokument de måste granska och signerar digitalt. Hundratals pappersblanketter ersattes med ett fullt spårbart underlag.', 'hakom.sk'],
    aluprint: ['Digital protokollsignering', 'Samma kortbaserade signeringssystem införde vi på Aluprints produktionslinje. Ledningen ser nu direkt att alla medarbetare har läst och godkänt de senaste protokollen, helt utan pappershantering.', 'aluprint.sk'],
    gaya: ['Rensning av fakturaarkivet', 'Vi byggde ett program kopplat till skannern som stämmer av varje inskannad pappersfaktura mot databasen och visar exakt vilka som kan kasseras. Det frigjorde mycket förvaringsutrymme.', 'gaya.sk'],
    geosoul: ['Program för statiska beräkningar', 'En skräddarsydd applikation som utför de statiska beräkningarna för geotekniska projekt och automatiskt skapar en anpassad Word-rapport för varje projekt. Den är kopplad till kundens produkter och hanterar olika ankartyper och markförhållanden.', 'geosoul.sk'],
    unisport: ['Databasmigrering', 'Vi automatiserade hela migreringen av en mycket stor äldre databas från den gamla webbplatsen till den nya, och rensade och sorterade om datan på vägen så att varje post hamnade på rätt plats.', 'unisport-kovac.sk'],
    urbarlamac: ['Månatliga ägarberäkningar', 'En automatisering som skapar föreningens månatliga Excel-beräkningar av utbetalningar till medlemmarna utifrån de senaste lagfartsuppgifterna. Ett segt manuellt arbete som nu går av sig självt.', 'urbarlamac.sk'],
    joinupshift: ['Portal för rekrytering & hantering av clippers', 'En komplett portal för att hantera clippers från början till slut: rekrytera och introducera dem, hantera deras konton, automatisera utbetalningar och följa försäljning, visningar och intäkter per clipper i en och samma översikt.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/mån.', perYear: '/år', h: 'tim.', days: 'arbetsdagar', months: 'mån.',
    per: { day: 'tim./dag', week: 'tim./vecka', month: 'tim./mån.' }, people: 'pers.',
    prefilled: 'Tidsåtgången har vi hämtat från er beskrivning. Justera den vid behov.',
    summary: function (c, f) {
      var T = window.SWX_I18N.sv.calcT
      return 'Kalkylator: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/tim. → i dag ' +
        f.money(c.costMonth) + '/mån. (' + f.money(c.costMonth * 12) + '/år). Om en automatisering tog över ' + c.share + ' % sparar det ~' +
        f.money(c.saveYear) + '/år och ' + f.num(c.hoursFreedYear) + ' tim./år' + (c.payback ? ', återbetalt på ~' + f.num(c.payback, 1) + ' månader' : '') + '.'
    }
  },

  demoT: {
    own: 'Ert mejl', ownSubj: 'Klistra in ett valfritt mejl', from: 'Från', subject: 'Ämne', to: 'Till',
    run: 'Starta agenten', rerun: 'Kör igen', working: 'Agenten arbetar…',
    idle: 'Väntar', busy: 'Arbetar', done: 'Klar',
    pick: 'Välj ett mejl till vänster och klicka på ”Starta agenten”.',
    resultIdle: 'Här visas agentens sammanfattning och svarsutkastet.',
    missing: 'Saknade uppgifter', reply: 'Svarsutkast', approve: 'Godkänn & skicka', edit: 'Redigera', editing: 'Klar med redigeringen',
    toast: 'Demoläge: i en riktig installation skulle det här svaret skickas till kunden från er egen inkorg.',
    empty: 'Tabellen är fortfarande tom. Starta agenten.',
    cols: ['Nr', 'Kund', 'Artikel / tjänst', 'Antal', 'Belopp', 'Leverans', 'Status'],
    status: { ready: 'Klar', waiting: 'Info saknas', review: 'Granska' },
    tooShort: 'Mejlet är för kort. Klistra in minst ett par meningar.',
    reading: 'Läser mejlet…',
    liveNote: 'I liveläget är agenten inte kopplad till er katalog och kontrollerar därför inga priser eller lagersaldon. I en riktig installation arbetar den med ert CRM, affärssystem eller Excel.',
    err: { rate: 'För många försök i rad. Försök igen om några minuter.', off: 'Live-läget är avstängt just nu. Testa exempelmejlen.', generic: 'Mejlet kunde inte behandlas. Försök igen eller ta ett av exemplen.' },
    live: {
      type: { order: 'Mejl läst: en beställning', quote: 'Mejl läst: en prisförfrågan', question: 'Mejl läst: en kundfråga', complaint: 'Mejl läst: en reklamation', other: 'Mejl läst: varken beställning eller förfrågan' },
      sender: 'Avsändare identifierad: ', noSender: 'Avsändarens företag framgår inte av mejlet',
      items: function (n) { return n ? n + (n === 1 ? ' rad' : ' rader') + ' registrerade' : 'Inga artikel- eller tjänsterader hittades' },
      missing: function (n) { return n ? (n === 1 ? '1 uppgift saknas, så jag har lagt in en följdfråga' : n + ' uppgifter saknas, så jag har lagt in följdfrågor') + ' i svaret' : 'Alla nödvändiga uppgifter finns' },
      sheet: 'Införd i beställningstabellen', reply: 'Svar förberett, väntar på ert godkännande'
    },
    sys: { mail: 'E-post', crm: 'CRM', stock: 'Lager', sheet: 'Beställningstabell' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Johan Lindqvist', fromEmail: 'j.lindqvist@bygghyttan.se', time: '08:47',
      subject: 'Beställning till bygget på Storgatan',
      body: 'Hej,\n\nvi vill beställa följande material till vårt bygge på Storgatan 68 i Västerås:\n- Cement CEM II/A-LL 42,5 R, 40 säckar à 25 kg\n- Armeringsstål B500 Ø12, 1,2 t\n- Murblock 25 cm, 6 pallar\n\nLeverans behöver ske den 15 oktober senast klockan 10. Varorna tas emot av vår platschef Markus, tel. 070-000 00 00.\nFakturan ställs till Bygghyttan AB.\n\nTack på förhand\nJohan Lindqvist\nInköp',
      steps: [
        ['mail', 'Mejl läst: en ny beställning'],
        ['crm', 'Kund hittad i CRM: Bygghyttan AB, faktura till företaget'],
        ['stock', '3 artiklar matchade mot katalogen och priserna kontrollerade'],
        ['stock', 'Lagersaldo kontrollerat: alla artiklar finns i lager'],
        ['sheet', 'Beställning införd: 3 rader, 2 186,00 € netto'],
        ['mail', 'Bekräftelse till kunden förberedd, väntar på ert godkännande']
      ],
      result: {
        summary: 'Ny beställning till bygget på Storgatan 68 i Västerås: 3 artiklar, leverans den 15 oktober senast kl. 10.00. Alla uppgifter finns.',
        customer: 'Bygghyttan AB', status: 'ready', delivery: '15 okt. senast 10.00, Storgatan 68',
        items: [['Cement CEM II/A-LL 42,5 R, 25 kg', '40 säckar', '248,00 €'], ['Armeringsstål B500 Ø12', '1,2 t', '1 068,00 €'], ['Murblock 25 cm', '6 pallar', '870,00 €']],
        missing: [],
        reply: { subject: 'SV: Beställning till bygget på Storgatan', body: 'Hej Johan,\n\ntack för er beställning. Vi bekräftar:\n- Cement CEM II/A-LL 42,5 R, 40 säckar: 248,00 €\n- Armeringsstål B500 Ø12, 1,2 t: 1 068,00 €\n- Murblock 25 cm, 6 pallar: 870,00 €\nSumma: 2 186,00 € exkl. moms\n\nVi levererar den 15 oktober senast kl. 10 till Storgatan 68 i Västerås. Föraren ringer Markus innan ankomst.\nFakturan ställer vi till Bygghyttan AB.\n\nHa en fin dag!' }
      }
    },
    {
      id: 'freight', fromName: 'Sofia Nyström', fromEmail: 's.nystrom@nordrent.se', time: '09:15',
      subject: 'Transport till Poznań',
      body: 'Hej,\n\nvi behöver flytta 4 EUR-pallar (ca 1 800 kg) från vårt lager i Malmö till Poznań. Lastning kan ske nästa tisdag eftermiddag. Gods: hushållsrengöringsmedel, inte farligt gods.\n\nVad skulle det kosta, och är leverans på onsdag möjlig?\n\nSofia Nyström\nNordrent Rengöring AB',
      steps: [
        ['mail', 'Mejl läst: en prisförfrågan om transport'],
        ['crm', 'Ny kund, kort skapat: Nordrent Rengöring AB'],
        ['mail', 'Last registrerad: 4 EUR-pallar, ca 1 800 kg, inte farligt gods'],
        ['mail', '3 uppgifter saknas, utan vilka inget pris kan beräknas'],
        ['sheet', 'Förfrågan införd i tabellen med status ”Info saknas”'],
        ['mail', 'Svar med följdfrågor förberett, väntar på ert godkännande']
      ],
      result: {
        summary: 'Prisförfrågan: 4 EUR-pallar (ca 1 800 kg) Malmö → Poznań, lastning nästa tisdag eftermiddag, leverans önskas på onsdag.',
        customer: 'Nordrent Rengöring AB', status: 'waiting', delivery: 'Lastning tis, leverans ons',
        items: [['Transport Malmö → Poznań, hushållsrengöringsmedel (inte farligt gods), ca 1 800 kg', '4 pallar', '-']],
        missing: ['Exakt lastadress i Malmö', 'Leveransadress i Poznań och kontaktperson på plats', 'Om pallarna är stapelbara (och hur höga de är)'],
        reply: { subject: 'SV: Transport till Poznań', body: 'Hej Sofia,\n\ntack för er förfrågan. För att vi ska kunna ge er ett exakt pris och bekräfta leverans på onsdag behöver vi veta:\n1. Den exakta lastadressen i Malmö.\n2. Leveransadressen i Poznań och en kontaktperson på plats.\n3. Är pallarna stapelbara, och hur höga är de?\n\nSå fort vi har uppgifterna skickar vi priset inom en timme.\n\nHa en fin dag!' }
      }
    },
    {
      id: 'cafe', fromName: 'Julia', fromEmail: 'julia@cafesoluppgang.se', time: '10:02',
      subject: 'beställning',
      body: 'hej, som förra gången, fast dubbelt så mycket kaffe 🙂 och lägg gärna till 2 kartonger av de där 300 ml pappmuggarna. har ni havredryck? isåfall 12 st.\nleverans som vanligt\n\nJulia, Café Soluppgång',
      steps: [
        ['mail', 'Mejl läst: en återbeställning'],
        ['crm', 'Kund hittad i CRM: Café Soluppgång, Kungsgatan 10, Uppsala'],
        ['crm', 'Senaste beställning #1042 slagen upp: kaffe 6 kg, sockerstavar 2 kartonger'],
        ['stock', 'Lagersaldo kontrollerat: havredryck finns (34 st)'],
        ['sheet', 'Beställning införd: 4 rader, 343,80 € netto'],
        ['mail', 'Svar förberett och frågan besvarad, väntar på ert godkännande']
      ],
      result: {
        summary: 'Återbeställning som #1042 med dubbel mängd kaffe, plus muggar och havredryck. Vanlig adress, vanlig leveransdag.',
        customer: 'Café Soluppgång', status: 'ready', delivery: 'Tisdag, Kungsgatan 10',
        items: [['Kaffebönor ”Espresso”, 1 kg (som #1042 × 2)', '12 st', '226,80 €'], ['Sockerstavar, 1 000 st (som #1042)', '2 kart.', '23,00 €'], ['Pappmuggar 300 ml, 1 000 st', '2 kart.', '64,00 €'], ['Havredryck Barista, 1 l', '12 st', '30,00 €']],
        missing: [],
        reply: { subject: 'SV: beställning', body: 'Hej Julia,\n\nera varor är beställda:\n- Kaffe ”Espresso” 1 kg: 12 st (dubbelt så mycket som sist)\n- Sockerstavar: 2 kartonger\n- Pappmuggar 300 ml: 2 kartonger\n- Havredryck Barista 1 l: 12 st (ja, det har vi!)\nSumma: 343,80 € exkl. moms\n\nVi levererar som vanligt på tisdag till Kungsgatan 10.\n\nHa en fin dag!' }
      }
    }
  ],

  faq: {
    'måste jag betala i förskott för era tjänster?': 'Vi ber om 30–50 % i förskott för att starta arbetet, resten förfaller vid leverans. Aktiva automatiseringar sköter vi sedan mot en fast månadsavgift som omfattar övervakning, underhåll och support.',
    'passar swiftrix även små team och startups?': 'Absolut. Små team har ofta mest att vinna, eftersom manuellt arbete tar en större del av deras dag. Varje lösning anpassas efter er storlek, er budget och era verktyg.',
    'vilka verktyg och plattformar arbetar ni med?': 'Med i princip allt som har ett API: CRM, kalkylblad, e-post, Slack, databaser, betalsystem och egna interna verktyg. Finns det ett gränssnitt kan vi oftast automatisera det.',
    'optimerar ni även processer, eller bygger ni bara?': 'Båda delarna. Vi börjar med att kartlägga och analysera era arbetsflöden för att få bort slöseri och bygger sedan automatiseringarna. Löpande optimering ingår i varje uppdrag.',
    'kan jag avsluta när som helst om jag inte är nöjd?': 'Ja. Det finns inga långa bindningstider. Om vi inte levererar värde är ni fria att sluta, även om de flesta team väljer att stanna.',
    'vad skiljer swiftrix från andra leverantörer?': 'Vi är ingenjörer, inte en byrå av standardsnitt. Varje automatisering byggs skräddarsytt för era system, övervakas löpande och backas upp av vår tillgänglighetsgaranti.',
    'bygger ni automatiseringarna, eller ger ni bara strategiråd?': 'Vi bygger. Strategin ingår, men ni får fungerande, produktionsklara automatiseringar och inte bara en presentation med rekommendationer.'
  },

  heroWords: ['arbetsflöden'],
  aboutLabel: '/ OM OSS',
  aboutWords: ['byrå']
}
