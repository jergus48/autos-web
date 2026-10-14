(window.SWX_I18N = window.SWX_I18N || {}).da = {
  locale: 'da-DK',
  themeLabel: ['Skift til mørkt tema', 'Skift til lyst tema'],

  assistantT: {
    think: ['Analyserer dit problem…', 'Finder de bedst egnede løsninger…', 'Gennemgår vores tidligere projekter…', 'Skriver e-mailen til vores team…'],
    understood: 'Sådan har vi forstået det', offTopic: 'Svar',
    retryHint: 'Beskriv en opgave eller et problem i din virksomhed, som du gerne vil gøre nemmere, f.eks. hvem der udfører den, hvor lang tid den tager, og hvilken software I bruger.', retry: 'Beskriv det anderledes',
    kind: { agent: 'AI-agent', automation: 'Automatisering', integration: 'Integration', app: 'Skræddersyet app' },
    cx: { simple: 'Enkel', medium: 'Middel kompleksitet', complex: 'Kompleks' },
    tooShort: 'Beskriv problemet lidt mere detaljeret, mindst en eller to sætninger.',
    err: { rate: 'For mange forespørgsler i træk. Prøv igen om et par minutter.', off: 'AI-assistenten er ikke tilgængelig lige nu. Skriv til os nedenfor, eller book en samtale med det samme.', generic: 'Der kom intet svar. Prøv igen.' },
    needFields: 'Indtast dit navn og en gyldig e-mailadresse, og sæt kryds ved samtykket.',
    sending: 'Sender…', send: 'Send e-mail',
    sent: function (n) { return 'Tak, ' + n + '! Vi har modtaget din e-mail og svarer på e-mail. Hvis du vil tale sammen hurtigere, kan du booke en samtale nedenfor.' },
    sendOff: 'Automatisk afsendelse virker ikke lige nu. Åbn e-mailen i dit mailprogram. Den er allerede forberedt:',
    openMail: 'Åbn i mailprogram',
    sendErr: 'Det lykkedes ikke at sende den. Prøv igen, eller skriv direkte til info@swiftrix.eu.',
    rateSend: 'Der er lige blevet sendt en e-mail herfra. Hvis du vil tilføje noget, så skriv direkte til info@swiftrix.eu.',
    calFail: 'Kalenderen kunne ikke indlæses.',
    notesPrefix: 'Fra AI-assistenten på swiftrix.eu'
  },

  assistantCases: {
    hakom: ['Digital protokolgodkendelse', 'Vi har digitaliseret hele godkendelsen af protokoller i produktionen. Medarbejderne logger ind med deres arbejdskort, ser hvert nyt dokument, de skal gennemgå, og kvitterer digitalt. Hundredvis af papirblanketter er erstattet af en fuldt sporbar dokumentation.', 'hakom.sk'],
    aluprint: ['Digital protokolgodkendelse', 'Det samme kortbaserede godkendelsessystem har vi indført på Aluprints produktionslinje. Ledelsen kan med et enkelt blik se, at alle medarbejdere har læst og bekræftet de nyeste protokoller, helt uden papirarbejde.', 'aluprint.sk'],
    gaya: ['Oprydning i fakturaarkivet', 'Vi har udviklet et program koblet til scanneren, der afstemmer hver scannet papirfaktura med databasen og viser præcis, hvilke der kan kasseres. Det har frigjort en masse lagerplads.', 'gaya.sk'],
    geosoul: ['Beregningsprogram til statik', 'En skræddersyet applikation, der udfører de statiske beregninger til geotekniske projekter og automatisk laver en tilhørende Word-rapport for hvert projekt. Den er koblet til kundens produkter og tager højde for forskellige ankertyper og jordbundsforhold.', 'geosoul.sk'],
    unisport: ['Databasemigrering', 'Vi har automatiseret hele migreringen af en meget stor gammel database fra den gamle til den nye hjemmeside og samtidig renset og omsorteret data, så hver post endte det rigtige sted.', 'unisport-kovac.sk'],
    urbarlamac: ['Månedlige ejerandelsberegninger', 'En automatisering, der laver foreningens månedlige Excel-udbetalingsberegninger til medlemmerne på baggrund af de nyeste tingbogsudskrifter. Et besværligt manuelt arbejde, der nu kører automatisk.', 'urbarlamac.sk'],
    joinupshift: ['Portal til rekruttering og administration af clippere', 'Et komplet portal til at administrere clippere fra A til Z: rekruttere og onboarde dem, styre konti, automatisere udbetalinger og følge i ét dashboard, hvilke salg, visninger og indtægter hver clipper skaber.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/md.', perYear: '/år', h: 't.', days: 'arbejdsdage', months: 'måneder',
    per: { day: 't./dag', week: 't./uge', month: 't./md.' }, people: 'pers.',
    prefilled: 'Tidsforbruget har vi overtaget fra din beskrivelse. Tilpas det efter behov.',
    summary: function (c, f) {
      var T = window.SWX_I18N.da.calcT
      return 'Beregner: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/t. → i dag ' +
        f.money(c.costMonth) + '/md. (' + f.money(c.costMonth * 12) + '/år). Overtager en automatisering ' + c.share + ' %, sparer det ~' +
        f.money(c.saveYear) + '/år og ' + f.num(c.hoursFreedYear) + ' t./år' + (c.payback ? ', tilbagebetaling på ~' + f.num(c.payback, 1) + ' måneder' : '') + '.'
    }
  },

  demoT: {
    own: 'Din e-mail', ownSubj: 'Indsæt en vilkårlig e-mail', from: 'Fra', subject: 'Emne', to: 'Til',
    run: 'Start agenten', rerun: 'Start igen', working: 'Agenten arbejder…',
    idle: 'Venter', busy: 'Arbejder', done: 'Færdig',
    pick: 'Vælg en e-mail til venstre, og klik på “Start agenten”.',
    resultIdle: 'Her vises agentens resumé og udkastet til svar.',
    missing: 'Manglende oplysninger', reply: 'Udkast til svar', approve: 'Godkend og send', edit: 'Rediger', editing: 'Færdig med at redigere',
    toast: 'Demotilstand: I en rigtig opsætning ville dette svar gå fra din egen indbakke til kunden.',
    empty: 'Arket er stadig tomt. Start agenten.',
    cols: ['Nr.', 'Kunde', 'Vare / ydelse', 'Antal', 'Beløb', 'Levering', 'Status'],
    status: { ready: 'Klar', waiting: 'Info mangler', review: 'Tjek' },
    tooShort: 'E-mailen er for kort. Indsæt mindst et par sætninger.',
    reading: 'Læser e-mailen…',
    liveNote: 'I live-tilstand er agenten ikke koblet til dit katalog og tjekker derfor ikke priser eller lagerbeholdning. I en rigtig opsætning arbejder den med dit CRM, ERP eller Excel.',
    err: { rate: 'For mange forsøg i træk. Prøv igen om et par minutter.', off: 'Live-tilstanden er slået fra lige nu. Prøv eksempel-e-mailsene.', generic: 'E-mailen kunne ikke behandles. Prøv igen, eller vælg et eksempel.' },
    live: {
      type: { order: 'Læste e-mailen: en ordre', quote: 'Læste e-mailen: en prisforespørgsel', question: 'Læste e-mailen: et kundespørgsmål', complaint: 'Læste e-mailen: en reklamation', other: 'Læste e-mailen: hverken en ordre eller en henvendelse' },
      sender: 'Afsender genkendt: ', noSender: 'Afsenderens virksomhed står ikke i e-mailen',
      items: function (n) { return n ? 'Registrerede ' + n + (n === 1 ? ' linje' : ' linjer') : 'Fandt ingen vare- eller ydelseslinjer' },
      missing: function (n) { return n ? (n === 1 ? '1 oplysning mangler, så jeg har tilføjet et opfølgende spørgsmål' : n + ' oplysninger mangler, så jeg har tilføjet opfølgende spørgsmål') + ' i svaret' : 'Alle nødvendige oplysninger er der' },
      sheet: 'Noteret i ordrearket', reply: 'Forberedte et svar, venter på din godkendelse'
    },
    sys: { mail: 'E-mail', crm: 'CRM', stock: 'Lager', sheet: 'Ordreark' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Thomas Bech', fromEmail: 't.bech@byggerytmen.dk', time: '08:47',
      subject: 'Bestilling til byggepladsen på Vestergade',
      body: 'Goddag,\n\nvi vil gerne bestille følgende materialer til vores byggeplads på Vestergade 68 i Odense:\n- Cement CEM II/A-LL 42,5 R, 40 sække à 25 kg\n- Armeringsstål B500 Ø12, 1,2 t\n- Mursten 25 cm, 6 paller\n\nLeveringen skal ske den 15. oktober inden kl. 10. Varerne modtages af vores byggeleder Mikkel, tlf. +45 20 00 00 00.\nFakturaen bedes udstedt til Byggerytmen ApS.\n\nMange tak\nThomas Bech\nIndkøb',
      steps: [
        ['mail', 'Læste e-mailen: en ny ordre'],
        ['crm', 'Fandt kunden i CRM: Byggerytmen ApS, faktura til virksomheden'],
        ['stock', 'Koblede 3 varer til kataloget og tjekkede priserne'],
        ['stock', 'Tjekkede lagerbeholdningen: alle varer er på lager'],
        ['sheet', 'Noterede ordren i arket: 3 linjer, 2.186,00 € ekskl. moms'],
        ['mail', 'Forberedte bekræftelse til kunden, venter på din godkendelse']
      ],
      result: {
        summary: 'Ny ordre til byggepladsen på Vestergade 68 i Odense: 3 varer, levering den 15. oktober inden kl. 10:00. Alle oplysninger er der.',
        customer: 'Byggerytmen ApS', status: 'ready', delivery: '15. okt. inden kl. 10:00, Vestergade 68',
        items: [['Cement CEM II/A-LL 42,5 R, 25 kg', '40 sække', '248,00 €'], ['Armeringsstål B500 Ø12', '1,2 t', '1.068,00 €'], ['Mursten 25 cm', '6 pal.', '870,00 €']],
        missing: [],
        reply: { subject: 'SV: Bestilling til byggepladsen på Vestergade', body: 'Goddag Thomas,\n\ntak for din bestilling. Vi bekræfter:\n- Cement CEM II/A-LL 42,5 R, 40 sække: 248,00 €\n- Armeringsstål B500 Ø12, 1,2 t: 1.068,00 €\n- Mursten 25 cm, 6 paller: 870,00 €\nI alt: 2.186,00 € plus moms.\n\nVi leverer den 15. oktober inden kl. 10 til Vestergade 68 i Odense. Chaufføren ringer til Mikkel inden ankomst.\nFakturaen udsteder vi til Byggerytmen ApS.\n\nHav en rigtig god dag!' }
      }
    },
    {
      id: 'freight', fromName: 'Sofie Krogh', fromEmail: 's.krogh@nordrens.dk', time: '09:15',
      subject: 'Transport til Hamborg',
      body: 'Hej,\n\nvi skal have flyttet 4 europaller (ca. 1.800 kg) fra vores lager i Kolding til Hamborg. Vi kan læsse næste tirsdag eftermiddag. Varer: rengøringsmidler til husholdning, ikke farligt gods.\n\nHvad vil det koste, og er levering om onsdagen mulig?\n\nSofie Krogh\nNordrens Rengøring A/S',
      steps: [
        ['mail', 'Læste e-mailen: en prisforespørgsel på transport'],
        ['crm', 'Ny kunde, kort oprettet: Nordrens Rengøring A/S'],
        ['mail', 'Registrerede lasten: 4 europaller, ca. 1.800 kg, ikke farligt gods'],
        ['mail', '3 oplysninger mangler, uden dem kan der ikke beregnes en pris'],
        ['sheet', 'Noterede forespørgslen med status “Info mangler” i arket'],
        ['mail', 'Forberedte svar med opfølgende spørgsmål, venter på din godkendelse']
      ],
      result: {
        summary: 'Prisforespørgsel: 4 europaller (ca. 1.800 kg) Kolding → Hamborg, læsning næste tirsdag eftermiddag, levering ønskes om onsdagen.',
        customer: 'Nordrens Rengøring A/S', status: 'waiting', delivery: 'Læsning tirs., levering ons.',
        items: [['Transport Kolding → Hamborg, rengøringsmidler (ikke farligt gods), ca. 1.800 kg', '4 pal.', '-']],
        missing: ['Den præcise læsseadresse i Kolding', 'Leveringsadresse i Hamborg og en kontaktperson på stedet', 'Om pallerne kan stables (og hvor høje de er)'],
        reply: { subject: 'SV: Transport til Hamborg', body: 'Hej Sofie,\n\ntak for din forespørgsel. For at vi kan give dig en præcis pris og bekræfte leveringen om onsdagen, mangler vi lige:\n1. Den præcise læsseadresse i Kolding.\n2. Leveringsadressen i Hamborg og en kontaktperson på stedet.\n3. Kan pallerne stables, og hvor høje er de?\n\nSå snart vi har oplysningerne, sender vi dig prisen inden for en time.\n\nHav en rigtig god dag!' }
      }
    },
    {
      id: 'cafe', fromName: 'Julie', fromEmail: 'julie@cafe-morgenrod.dk', time: '10:02',
      subject: 'bestilling',
      body: 'hej, ligesom sidst, bare dobbelt så meget kaffe 🙂 og læg gerne 2 kasser af de der 300 ml papkrus med. har I havredrik? hvis ja, 12 stk.\nlevering som altid\n\nJulie, Café Morgenrød',
      steps: [
        ['mail', 'Læste e-mailen: en genbestilling'],
        ['crm', 'Fandt kunden i CRM: Café Morgenrød, Bjergegade 10, Aarhus'],
        ['crm', 'Slog sidste ordre #1042 op: kaffe 6 kg, sukkerstænger 2 kasser'],
        ['stock', 'Tjekkede lagerbeholdningen: havredrik er tilgængelig (34 stk.)'],
        ['sheet', 'Noterede ordren: 4 linjer, 343,80 € ekskl. moms'],
        ['mail', 'Forberedte svar og besvarede spørgsmålet, venter på din godkendelse']
      ],
      result: {
        summary: 'Genbestilling som #1042 med dobbelt kaffemængde, dertil kopper og havredrik. Sædvanlig adresse, sædvanlig leveringsdag.',
        customer: 'Café Morgenrød', status: 'ready', delivery: 'Tirsdag, Bjergegade 10',
        items: [['Kaffebønner “Espresso”, 1 kg (som #1042 × 2)', '12 stk.', '226,80 €'], ['Sukkerstænger, 1000 stk. (som #1042)', '2 kasser', '23,00 €'], ['Papkrus 300 ml, 1000 stk.', '2 kasser', '64,00 €'], ['Havredrik Barista, 1 l', '12 stk.', '30,00 €']],
        missing: [],
        reply: { subject: 'SV: bestilling', body: 'Hej Julie,\n\nvi har modtaget jeres bestilling:\n- Kaffe “Espresso” 1 kg: 12 stk. (dobbelt så meget som sidst)\n- Sukkerstænger: 2 kasser\n- Papkrus 300 ml: 2 kasser\n- Havredrik Barista 1 l: 12 stk. (ja, det har vi!)\nI alt: 343,80 € plus moms.\n\nVi leverer som sædvanligt tirsdag til Bjergegade 10.\n\nHav en rigtig god dag!' }
      }
    }
  ],

  faq: {
    'skal jeg betale på forhånd for jeres ydelser?': 'Til start beder vi om en forudbetaling på 30–50 %, resten forfalder ved levering. Løbende automatiseringer driver vi derefter mod et fast månedligt gebyr til overvågning, vedligeholdelse og support.',
    'egner swiftrix sig også til små teams og startups?': 'Absolut. Små teams får ofte mest ud af det, fordi manuelt arbejde æder en større del af deres dag. Hver løsning tilpasser vi til din størrelse, dit budget og dine værktøjer.',
    'hvilke værktøjer og platforme arbejder i med?': 'Stort set alt med et API: CRM-systemer, regneark, e-mail, Slack, databaser, betalingssystemer og egne interne værktøjer. Findes der en grænseflade, kan vi som regel automatisere det.',
    'optimerer i også processer, eller bygger i kun?': 'Begge dele. Vi analyserer først dine arbejdsgange for at fjerne spild og bygger derefter automatiseringerne. Løbende optimering er en fast del af hvert projekt.',
    'kan jeg opsige når som helst, hvis jeg ikke er tilfreds?': 'Ja. Der er ingen lange bindinger. Leverer vi ikke merværdi, kan du stoppe når som helst, selv om de fleste teams bliver.',
    'hvad adskiller swiftrix fra andre udbydere?': 'Vi er ingeniører, ikke et standardbureau. Hver automatisering bygges individuelt til dine systemer, overvåges løbende og er sikret af vores oppetidsgaranti.',
    'bygger i automatiseringerne, eller rådgiver i kun om strategi?': 'Vi bygger. Strategien er inkluderet, men til sidst har du fungerende, driftsklare automatiseringer og ikke blot en præsentation med anbefalinger.'
  },

  heroWords: ['workflows'],
  aboutLabel: '/ OM OS',
  aboutWords: ['bureau']
}
