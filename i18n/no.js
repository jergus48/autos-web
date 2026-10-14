// Norwegian (Bokmål) strings for the shared scripts. See i18n/README.md.
(window.SWX_I18N = window.SWX_I18N || {}).no = {
  locale: 'nb-NO',
  themeLabel: ['Bytt til mørkt tema', 'Bytt til lyst tema'],

  assistantT: {
    think: ['Analyserer problemet ditt…', 'Leter etter de beste løsningene…', 'Sjekker våre tidligere prosjekter…', 'Skriver e-posten til teamet vårt…'],
    understood: 'Slik forstod vi det', offTopic: 'Svar',
    retryHint: 'Beskriv en oppgave eller et problem i bedriften din som du vil gjøre enklere, for eksempel hvem som gjør det, hvor lang tid det tar og hvilken programvare du bruker.', retry: 'Beskriv det annerledes',
    kind: { agent: 'KI-agent', automation: 'Automatisering', integration: 'Integrasjon', app: 'Skreddersydd app' },
    cx: { simple: 'Enkel', medium: 'Middels omfang', complex: 'Komplekst' },
    tooShort: 'Beskriv problemet litt mer detaljert, minst en setning eller to.',
    err: { rate: 'For mange forespørsler på rad. Prøv igjen om noen minutter.', off: 'KI-assistenten er utilgjengelig akkurat nå. Skriv til oss under eller book en samtale med en gang.', generic: 'Vi fikk ikke noe svar. Prøv igjen.' },
    needFields: 'Skriv inn navnet ditt og en gyldig e-postadresse, og bekreft samtykket.',
    sending: 'Sender…', send: 'Send e-posten',
    sent: function (n) { return 'Takk, ' + n + '! Vi har mottatt e-posten din og svarer på e-post. Hvis du vil snakke med oss raskere, kan du booke en samtale under.' },
    sendOff: 'Automatisk sending fungerer ikke akkurat nå. Åpne e-posten i e-postprogrammet ditt. Den er allerede klargjort:',
    openMail: 'Åpne i e-postprogrammet',
    sendErr: 'Sendingen mislyktes. Prøv igjen eller skriv direkte til info@swiftrix.eu.',
    rateSend: 'Det ble nettopp sendt en e-post herfra. Hvis du vil legge til noe, skriv direkte til info@swiftrix.eu.',
    calFail: 'Kalenderen kunne ikke lastes.',
    notesPrefix: 'Fra KI-assistenten på swiftrix.eu'
  },

  assistantCases: {
    hakom: ['Digital signering av protokoller', 'Vi har digitalisert hele protokollsigneringen i produksjonen. De ansatte logger inn med adgangskortet sitt, ser hvert nytt dokument de må gjennomgå, og bekrefter det digitalt. Hundrevis av papirskjemaer er dermed erstattet av en fullt sporbar logg.', 'hakom.sk'],
    aluprint: ['Digital signering av protokoller', 'Det samme kortbaserte signeringssystemet har vi innført på produksjonslinjen hos Aluprint. Slik ser ledelsen med et blikk at alle ansatte har lest og bekreftet de nyeste protokollene, helt uten papirarbeid.', 'aluprint.sk'],
    gaya: ['Opprydding i fakturaarkivet', 'Vi har utviklet et program koblet til skanneren som sammenligner hver skannede papirfaktura med databasen og viser nøyaktig hvilke som kan kasseres. Det frigjorde mye lagerplass.', 'gaya.sk'],
    geosoul: ['Program for statiske beregninger', 'En skreddersydd applikasjon som utfører de statiske beregningene for geotekniske prosjekter og automatisk lager en tilpasset Word-rapport for hvert prosjekt. Den er knyttet til kundens produkter og tar hensyn til ulike ankertyper og grunnforhold.', 'geosoul.sk'],
    unisport: ['Databasemigrering', 'Vi har automatisert hele migreringen av en svært stor eldre database fra det gamle til det nye nettstedet, og ryddet og sortert dataene underveis, slik at hver post havnet på rett sted.', 'unisport-kovac.sk'],
    urbarlamac: ['Månedlige eierskapsberegninger', 'En automatisering som lager foreningens månedlige Excel-beregninger av utbetalinger til medlemmene, basert på de nyeste grunnboksutskriftene. Et tungvint manuelt arbeid som nå går av seg selv.', 'urbarlamac.sk'],
    joinupshift: ['Portal for rekruttering og administrasjon av clippere', 'En komplett portal for å administrere clippere fra A til Å: rekruttere og ta dem inn, styre kontoer, automatisere utbetalinger og følge med på salg, visninger og inntekter hver clipper genererer, i ett dashbord.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/måned', perYear: '/år', h: 't', days: 'arbeidsdager', months: 'måneder',
    per: { day: 't/dag', week: 't/uke', month: 't/måned' }, people: 'pers.',
    prefilled: 'Vi har fylt inn tidsbruken ut fra beskrivelsen din. Juster den om nødvendig.',
    summary: function (c, f) {
      var T = window.SWX_I18N.no.calcT
      return 'Kalkulator: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/t → i dag ' +
        f.money(c.costMonth) + '/måned (' + f.money(c.costMonth * 12) + '/år). Hvis en automatisering overtar ' + c.share + ' %, sparer det ~' +
        f.money(c.saveYear) + '/år og ' + f.num(c.hoursFreedYear) + ' t/år' + (c.payback ? ', tilbakebetalt på ~' + f.num(c.payback, 1) + ' måneder' : '') + '.'
    }
  },

  demoT: {
    own: 'Din e-post', ownSubj: 'Lim inn en vilkårlig e-post', from: 'Fra', subject: 'Emne', to: 'Til',
    run: 'Start agenten', rerun: 'Kjør på nytt', working: 'Agenten jobber…',
    idle: 'Venter', busy: 'Jobber', done: 'Ferdig',
    pick: 'Velg en e-post til venstre og trykk «Start agenten».',
    resultIdle: 'Her vises agentens oppsummering og utkastet til svar.',
    missing: 'Manglende opplysninger', reply: 'Utkast til svar', approve: 'Godkjenn og send', edit: 'Rediger', editing: 'Ferdig redigert',
    toast: 'Demomodus: I et ekte oppsett ville dette svaret gått til kunden fra din egen e-postboks.',
    empty: 'Tabellen er tom foreløpig. Start agenten.',
    cols: ['Nr.', 'Kunde', 'Vare / tjeneste', 'Antall', 'Beløp', 'Levering', 'Status'],
    status: { ready: 'Klar', waiting: 'Mangler info', review: 'Kontroller' },
    tooShort: 'E-posten er for kort. Lim inn minst noen setninger.',
    reading: 'Leser e-posten…',
    liveNote: 'I live-modus er agenten ikke koblet til katalogen din og sjekker derfor ikke priser eller beholdning. I et ekte oppsett jobber den med CRM-et, ERP-systemet eller Excel-arket ditt.',
    err: { rate: 'For mange forsøk på rad. Prøv igjen om noen minutter.', off: 'Live-modus er slått av akkurat nå. Prøv eksempel-e-postene.', generic: 'E-posten kunne ikke behandles. Prøv igjen eller bruk et eksempel.' },
    live: {
      type: { order: 'Leste e-posten: en bestilling', quote: 'Leste e-posten: en prisforespørsel', question: 'Leste e-posten: et kundespørsmål', complaint: 'Leste e-posten: en reklamasjon', other: 'Leste e-posten: verken en bestilling eller en henvendelse' },
      sender: 'Fant avsenderen: ', noSender: 'Avsenderens firma står ikke i e-posten',
      items: function (n) { return n ? 'Registrerte ' + n + (n === 1 ? ' linje' : ' linjer') : 'Fant ingen varelinjer eller tjenestelinjer' },
      missing: function (n) { return n ? (n === 1 ? '1 opplysning mangler, så jeg la inn et spørsmål' : n + ' opplysninger mangler, så jeg la inn spørsmål') + ' i svaret' : 'Alle nødvendige opplysninger er med' },
      sheet: 'Registrert i bestillingstabellen', reply: 'Svar forberedt, venter på godkjenningen din'
    },
    sys: { mail: 'E-post', crm: 'CRM', stock: 'Lager', sheet: 'Bestillingstabell' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Henrik Solberg', fromEmail: 'henrik.solberg@byggrytme.no', time: '08:47',
      subject: 'Bestilling til byggeplassen i Industriveien',
      body: 'Hei,\n\nvi vil bestille følgende materialer til byggeplassen vår i Industriveien 68 i Lillestrøm:\n- sement CEM II/A-LL 42,5 R, 40 sekker à 25 kg\n- armeringsstål B500 Ø12, 1,2 tonn\n- murblokker 25 cm, 6 paller\n\nLevering må skje 15. oktober innen kl. 10. Varene tas imot av byggeleder Markus, tlf. +47 400 00 000.\nFakturaen skal skrives ut til Byggrytme AS.\n\nTusen takk\nHenrik Solberg\nInnkjøp',
      steps: [
        ['mail', 'Leste e-posten: en ny bestilling'],
        ['crm', 'Fant kunden i CRM: Byggrytme AS, faktura til firmaet'],
        ['stock', 'Koblet 3 varer til katalogen og kontrollerte prisene'],
        ['stock', 'Sjekket beholdningen: alle varene er på lager'],
        ['sheet', 'Registrerte bestillingen: 3 linjer, 2 186,00 € eks. mva.'],
        ['mail', 'Forberedte en bekreftelse til kunden, venter på godkjenningen din']
      ],
      result: {
        summary: 'Ny bestilling til byggeplassen i Industriveien 68 i Lillestrøm: 3 varer, levering 15. oktober innen kl. 10:00. Alle opplysninger er med.',
        customer: 'Byggrytme AS', status: 'ready', delivery: '15. okt. innen 10:00, Industriveien 68',
        items: [['Sement CEM II/A-LL 42,5 R, 25 kg', '40 sekker', '248,00 €'], ['Armeringsstål B500 Ø12', '1,2 t', '1 068,00 €'], ['Murblokker 25 cm', '6 pal.', '870,00 €']],
        missing: [],
        reply: { subject: 'SV: Bestilling til byggeplassen i Industriveien', body: 'Hei Henrik,\n\ntakk for bestillingen. Vi bekrefter:\n- sement CEM II/A-LL 42,5 R, 40 sekker: 248,00 €\n- armeringsstål B500 Ø12, 1,2 tonn: 1 068,00 €\n- murblokker 25 cm, 6 paller: 870,00 €\nTotalt: 2 186,00 € + mva.\n\nVi leverer 15. oktober innen kl. 10 til Industriveien 68 i Lillestrøm. Sjåføren ringer Markus før ankomst.\nFakturaen skriver vi ut til Byggrytme AS.\n\nHa en fin dag!' }
      }
    },
    {
      id: 'freight', fromName: 'Silje Haugen', fromEmail: 's.haugen@nordrein.no', time: '09:15',
      subject: 'Transport til Göteborg',
      body: 'Hei,\n\nvi trenger å sende 4 europaller (ca. 1 800 kg) fra lageret vårt i Drammen til Göteborg. Lasting kan skje neste tirsdag ettermiddag. Varene er rengjøringsmidler til husholdning, ikke farlig gods.\n\nHva vil det koste, og er det mulig å levere onsdag?\n\nSilje Haugen\nNordrein Rengjøringsprodukter AS',
      steps: [
        ['mail', 'Leste e-posten: en prisforespørsel på transport'],
        ['crm', 'Ny kunde, opprettet kort: Nordrein Rengjøringsprodukter AS'],
        ['mail', 'Registrerte lasten: 4 europaller, ca. 1 800 kg, ikke farlig gods'],
        ['mail', '3 opplysninger mangler, uten dem kan ingen pris beregnes'],
        ['sheet', 'Registrerte forespørselen i tabellen med status «Mangler info»'],
        ['mail', 'Forberedte svar med oppfølgingsspørsmål, venter på godkjenningen din']
      ],
      result: {
        summary: 'Prisforespørsel: 4 europaller (ca. 1 800 kg) Drammen → Göteborg, lasting neste tirsdag ettermiddag, levering ønskes onsdag.',
        customer: 'Nordrein Rengjøringsprodukter AS', status: 'waiting', delivery: 'Lasting tir., levering ons.',
        items: [['Transport Drammen → Göteborg, rengjøringsmidler (ikke farlig gods), ca. 1 800 kg', '4 pal.', '-']],
        missing: ['Nøyaktig lasteadresse i Drammen', 'Leveringsadresse i Göteborg og kontaktperson på stedet', 'Om pallene kan stables (og hvor høye de er)'],
        reply: { subject: 'SV: Transport til Göteborg', body: 'Hei Silje,\n\ntakk for forespørselen. For at vi skal kunne gi deg en nøyaktig pris og bekrefte levering onsdag, trenger vi litt mer informasjon:\n1. Nøyaktig lasteadresse i Drammen.\n2. Leveringsadresse i Göteborg og en kontaktperson på stedet.\n3. Kan pallene stables, og hvor høye er de?\n\nNår vi har opplysningene, sender vi deg prisen innen en time.\n\nHa en fin dag!' }
      }
    },
    {
      id: 'cafe', fromName: 'Julie', fromEmail: 'julie@cafemorgenrode.no', time: '10:02',
      subject: 'bestilling',
      body: 'hei, som sist, bare dobbelt så mye kaffe 🙂 og ta med 2 esker av de 300 ml pappkoppene. har dere havredrikk? hvis ja, 12 stk.\nlevering som vanlig\n\nJulie, Café Morgenrøde',
      steps: [
        ['mail', 'Leste e-posten: en gjentatt bestilling'],
        ['crm', 'Fant kunden i CRM: Café Morgenrøde, Bergstien 10, Bergen'],
        ['crm', 'Slo opp forrige bestilling #1042: kaffe 6 kg, sukkerpinner 2 esker'],
        ['stock', 'Sjekket beholdningen: havredrikk er tilgjengelig (34 stk.)'],
        ['sheet', 'Registrerte bestillingen: 4 linjer, 343,80 € eks. mva.'],
        ['mail', 'Forberedte svar og besvarte spørsmålet, venter på godkjenningen din']
      ],
      result: {
        summary: 'Gjentatt bestilling som #1042 med dobbelt så mye kaffe, i tillegg til kopper og havredrikk. Vanlig adresse, vanlig leveringsdag.',
        customer: 'Café Morgenrøde', status: 'ready', delivery: 'Tirsdag, Bergstien 10',
        items: [['Kaffebønner «Espresso», 1 kg (som #1042 × 2)', '12 stk.', '226,80 €'], ['Sukkerpinner, 1000 stk. (som #1042)', '2 esker', '23,00 €'], ['Pappkopper 300 ml, 1000 stk.', '2 esker', '64,00 €'], ['Havredrikk Barista, 1 l', '12 stk.', '30,00 €']],
        missing: [],
        reply: { subject: 'SV: bestilling', body: 'Hei Julie,\n\nvi har fått bestillingen deres:\n- kaffe «Espresso» 1 kg: 12 stk. (dobbelt så mye som sist)\n- sukkerpinner: 2 esker\n- pappkopper 300 ml: 2 esker\n- havredrikk Barista 1 l: 12 stk. (ja, det har vi!)\nTotalt: 343,80 € + mva.\n\nVi leverer tirsdag som vanlig til Bergstien 10.\n\nHa en fin dag!' }
      }
    }
  ],

  faq: {
    'Må jeg betale på forhånd for tjenestene deres?': 'Vi ber om en forskuddsbetaling på 30–50 % for å sette i gang, resten forfaller ved levering. Løpende automatiseringer drifter vi deretter mot et fast månedlig beløp som dekker overvåking, vedlikehold og support.',
    'Passer swiftrix også for små team og oppstartsbedrifter?': 'Absolutt. Små team får ofte mest ut av det, fordi manuelt arbeid tar en større del av dagen deres. Hver løsning tilpasser vi størrelsen, budsjettet og verktøyene dine.',
    'Hvilke verktøy og plattformer jobber dere med?': 'Med nesten alt som har et API: CRM-systemer, regneark, e-post, Slack, databaser, betalingssystemer og egne interne verktøy. Hvis det finnes et grensesnitt, kan vi som regel automatisere det.',
    'Optimaliserer dere også prosesser, eller bygger dere bare?': 'Begge deler. Vi starter med å kartlegge arbeidsflytene dine for å fjerne sløsing, og bygger deretter automatiseringene. Løpende optimalisering er en del av hvert prosjekt.',
    'Kan jeg si opp når som helst hvis jeg ikke er fornøyd?': 'Ja. Det er ingen lange bindingstider. Hvis vi ikke leverer verdi, kan du når som helst slutte, selv om de fleste teamene velger å bli.',
    'Hva skiller swiftrix fra andre leverandører?': 'Vi er ingeniører, ikke et byrå som leverer ferdigpakker. Hver automatisering bygges skreddersydd for systemene dine, overvåkes kontinuerlig og er sikret av oppetidsgarantien vår.',
    'Bygger dere automatiseringene, eller gir dere bare strategiråd?': 'Vi bygger. Strategien er inkludert, men til slutt sitter du igjen med fungerende automatiseringer klare for produksjon, ikke bare en presentasjon med anbefalinger.'
  },

  heroWords: ['arbeidsflytene'],
  aboutLabel: '/ OM OSS',
  aboutWords: ['byrå']
}
