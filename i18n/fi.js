(window.SWX_I18N = window.SWX_I18N || {}).fi = {
  locale: 'fi-FI',
  themeLabel: ['Vaihda tummaan teemaan', 'Vaihda vaaleaan teemaan'],

  assistantT: {
    think: ['Analysoin ongelmaanne…', 'Etsin sopivimpia ratkaisuja…', 'Käyn läpi aiempia projektejamme…', 'Kirjoitan viestiä tiimillemme…'],
    understood: 'Näin ymmärsimme asian', offTopic: 'Vastaus',
    retryHint: 'Kuvailkaa yrityksenne tehtävä tai ongelma, jota haluaisitte helpottaa, esim. kuka sen tekee, kuinka kauan siihen menee aikaa ja mitä ohjelmistoja käytätte.', retry: 'Kuvaile toisin',
    kind: { agent: 'Tekoälyagentti', automation: 'Automaatio', integration: 'Integraatio', app: 'Räätälöity sovellus' },
    cx: { simple: 'Yksinkertainen', medium: 'Keskitasoinen', complex: 'Monimutkainen' },
    tooShort: 'Kuvailkaa ongelma hieman tarkemmin, vähintään yhdellä tai kahdella lauseella.',
    err: { rate: 'Liian monta pyyntöä peräkkäin. Yrittäkää uudelleen muutaman minuutin kuluttua.', off: 'Tekoälyavustaja ei ole juuri nyt käytettävissä. Kirjoittakaa meille alla tai varatkaa puhelu suoraan.', generic: 'Vastausta ei saatu. Yrittäkää uudelleen.' },
    needFields: 'Syöttäkää nimenne ja kelvollinen sähköpostiosoite sekä hyväksykää suostumus.',
    sending: 'Lähetetään…', send: 'Lähetä viesti',
    sent: function (n) { return 'Kiitos, ' + n + '! Olemme saaneet viestinne ja vastaamme sähköpostitse. Jos haluatte puhua pikemmin, varatkaa puhelu alla.' },
    sendOff: 'Automaattinen lähetys ei toimi juuri nyt. Avatkaa viesti sähköpostiohjelmassanne. Se on jo valmisteltu:',
    openMail: 'Avaa sähköpostiohjelmassa',
    sendErr: 'Lähetys epäonnistui. Yrittäkää uudelleen tai kirjoittakaa suoraan osoitteeseen info@swiftrix.eu.',
    rateSend: 'Täältä lähetettiin juuri äsken viesti. Jos haluatte lisätä jotain, kirjoittakaa suoraan osoitteeseen info@swiftrix.eu.',
    calFail: 'Kalenterin lataus epäonnistui.',
    notesPrefix: 'Swiftrix.eu-sivuston tekoälyavustajalta'
  },

  assistantCases: {
    hakom: ['Pöytäkirjojen digitaalinen hyväksyntä', 'Digitalisoimme koko pöytäkirjojen hyväksyntäprosessin tuotannossa. Työntekijät kirjautuvat henkilökortillaan, näkevät jokaisen uuden asiakirjan, joka heidän on tarkastettava, ja vahvistavat sen sähköisesti. Satoja paperilomakkeita korvattiin aukottomasti jäljitettävällä kirjauksella.', 'hakom.sk'],
    aluprint: ['Pöytäkirjojen digitaalinen hyväksyntä', 'Otimme saman korttipohjaisen hyväksyntäjärjestelmän käyttöön Aluprintin tuotantolinjalla. Johto näkee yhdellä silmäyksellä, että kaikki työntekijät ovat lukeneet ja vahvistaneet ajantasaiset pöytäkirjat, ilman paperityötä.', 'aluprint.sk'],
    gaya: ['Laskuarkiston siivous', 'Kehitimme skanneriin kytketyn ohjelman, joka vertaa jokaista skannattua paperilaskua tietokantaan ja näyttää tarkasti, mitkä voi hävittää. Se vapautti runsaasti varastotilaa.', 'gaya.sk'],
    geosoul: ['Rakennelaskentaohjelma', 'Räätälöity sovellus, joka suorittaa geoteknisten projektien statiikkalaskelmat ja luo jokaisesta projektista automaattisesti sopivan Word-raportin. Se on yhdistetty asiakkaan tuotteisiin ja huomioi eri ankkurityypit ja maaperäolosuhteet.', 'geosoul.sk'],
    unisport: ['Tietokannan migraatio', 'Automatisoimme erittäin suuren vanhan tietokannan koko siirron vanhalta verkkosivustolta uudelle ja siivosimme ja lajittelimme tiedot samalla, jotta jokainen tietue päätyi oikeaan paikkaan.', 'unisport-kovac.sk'],
    urbarlamac: ['Kuukausittaiset omistuslaskelmat', 'Automaatio, joka laatii osuuskunnan kuukausittaiset Excel-maksulaskelmat jäsenille ajantasaisten omistusasiakirjojen pohjalta. Työläs käsityö, joka nyt toimii automaattisesti.', 'urbarlamac.sk'],
    joinupshift: ['Leikkaajien rekrytointi- ja hallintaportaali', 'Kokonainen portaali leikkaajien (clipper) hallintaan alusta loppuun: hankkiminen ja perehdytys, tilien hallinta, palkkioiden automatisointi ja kunkin leikkaajan tuottamien myyntien, katselukertojen ja tulojen seuranta yhdestä näkymästä.', 'joinupshift.com']
  },

  calcT: {
    perMonth: '/kk', perYear: '/vuosi', h: 't', days: 'työpäivää', months: 'kk',
    per: { day: 't/pv', week: 't/vk', month: 't/kk' }, people: 'hlö',
    prefilled: 'Täytimme ajan kuvauksenne perusteella. Muokatkaa sitä tarvittaessa.',
    summary: function (c, f) {
      var T = window.SWX_I18N.fi.calcT
      return 'Laskuri: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/t → nyt ' +
        f.money(c.costMonth) + '/kk (' + f.money(c.costMonth * 12) + '/vuosi). Jos automaatio hoitaisi ' + c.share + ' %, säästö olisi noin ' +
        f.money(c.saveYear) + '/vuosi ja ' + f.num(c.hoursFreedYear) + ' t/vuosi' + (c.payback ? ', takaisinmaksuaika noin ' + f.num(c.payback, 1) + ' kk' : '') + '.'
    }
  },

  demoT: {
    own: 'Teidän viestinne', ownSubj: 'Liitä mikä tahansa sähköposti', from: 'Lähettäjä', subject: 'Aihe', to: 'Vastaanottaja',
    run: 'Käynnistä agentti', rerun: 'Käynnistä uudelleen', working: 'Agentti työskentelee…',
    idle: 'Odottaa', busy: 'Työskentelee', done: 'Valmis',
    pick: 'Valitse vasemmalta sähköposti ja paina ”Käynnistä agentti”.',
    resultIdle: 'Tähän ilmestyvät agentin yhteenveto ja vastausluonnos.',
    missing: 'Puuttuvat tiedot', reply: 'Vastausluonnos', approve: 'Hyväksy ja lähetä', edit: 'Muokkaa', editing: 'Muokkaus valmis',
    toast: 'Demotila: oikeassa käyttöönotossa tämä vastaus lähtisi asiakkaalle teidän omasta postilaatikostanne.',
    empty: 'Taulukko on toistaiseksi tyhjä. Käynnistä agentti.',
    cols: ['Nro', 'Asiakas', 'Tuote / palvelu', 'Määrä', 'Summa', 'Toimitus', 'Tila'],
    status: { ready: 'Valmis', waiting: 'Tieto puuttuu', review: 'Tarkista' },
    tooShort: 'Sähköposti on liian lyhyt. Liitä vähintään muutama lause.',
    reading: 'Luen sähköpostia…',
    liveNote: 'Live-tilassa agentti ei ole kytketty tuotekatalogiinne, joten se ei tarkista hintoja tai varastosaldoja. Oikeassa käyttöönotossa se toimii CRM:nne, toiminnanohjausjärjestelmänne tai Excelinne kanssa.',
    err: { rate: 'Liian monta yritystä peräkkäin. Yrittäkää uudelleen muutaman minuutin kuluttua.', off: 'Live-tila on tällä hetkellä pois käytöstä. Kokeilkaa esimerkkisähköposteja.', generic: 'Sähköpostia ei voitu käsitellä. Yrittäkää uudelleen tai kokeilkaa esimerkkejä.' },
    live: {
      type: { order: 'Luin sähköpostin: kyseessä on tilaus', quote: 'Luin sähköpostin: kyseessä on tarjouspyyntö', question: 'Luin sähköpostin: kyseessä on asiakkaan kysymys', complaint: 'Luin sähköpostin: kyseessä on reklamaatio', other: 'Luin sähköpostin: se ei ole tilaus eikä tiedustelu' },
      sender: 'Tunnistin lähettäjän: ', noSender: 'Lähettäjän yritystä ei mainita sähköpostissa',
      items: function (n) { return n ? 'Poimin ' + n + (n === 1 ? ' rivin' : ' riviä') : 'Tuote- tai palvelurivejä ei löytynyt' },
      missing: function (n) { return n ? (n === 1 ? 'Yksi tieto puuttuu, joten lisäsin vastaukseen kysymyksen' : n + ' tietoa puuttuu, joten lisäsin vastaukseen kysymykset') : 'Kaikki tarvittavat tiedot ovat mukana' },
      sheet: 'Kirjasin tilaustaulukkoon', reply: 'Valmistelin vastauksen, odottaa hyväksyntäänne'
    },
    sys: { mail: 'Sähköposti', crm: 'CRM', stock: 'Varasto', sheet: 'Tilaustaulukko' }
  },

  demoSamples: [
    {
      id: 'build', fromName: 'Timo Virtanen', fromEmail: 't.virtanen@rakennusrytmi.fi', time: '08:47',
      subject: 'Tilaus Hämeenkadun työmaalle',
      body: 'Hei,\n\nhaluaisimme tilata materiaalia työmaallemme osoitteessa Hämeenkatu 68, Tampere:\n- sementti CEM II/A-LL 42,5 R, 40 säkkiä à 25 kg\n- raudoitusteräs A500HW Ø12, 1,2 t\n- harkot 250 mm, 6 lavaa\n\nToimitus tarvitaan 15. lokakuuta klo 10 mennessä. Tavaran vastaanottaa työmaapäällikkömme Mikko, puh. +358 40 0000000.\nLaskutus Rakennusrytmi Oy:lle, kiitos.\n\nKiitos,\nTimo Virtanen\nHankintapäällikkö',
      steps: [
        ['mail', 'Luin sähköpostin: kyseessä on uusi tilaus'],
        ['crm', 'Löysin asiakkaan CRM:stä: Rakennusrytmi Oy, laskutus yritykselle'],
        ['stock', 'Yhdistin 3 tuotetta katalogiin ja tarkistin hinnat'],
        ['stock', 'Tarkistin varastosaldot: kaikki tuotteet ovat varastossa'],
        ['sheet', 'Kirjasin tilauksen taulukkoon: 3 riviä, 2 186,00 € ilman alv:ta'],
        ['mail', 'Valmistelin vahvistuksen asiakkaalle, odottaa hyväksyntäänne']
      ],
      result: {
        summary: 'Uusi tilaus Hämeenkadun työmaalle (Hämeenkatu 68, Tampere): 3 tuotetta, toimitus 15. lokakuuta klo 10 mennessä. Kaikki tiedot ovat mukana.',
        customer: 'Rakennusrytmi Oy', status: 'ready', delivery: '15.10. klo 10 mennessä, Hämeenkatu 68',
        items: [['Sementti CEM II/A-LL 42,5 R, 25 kg', '40 säkkiä', '248,00 €'], ['Raudoitusteräs A500HW Ø12', '1,2 t', '1 068,00 €'], ['Harkot 250 mm', '6 lavaa', '870,00 €']],
        missing: [],
        reply: { subject: 'VS: Tilaus Hämeenkadun työmaalle', body: 'Hei Timo,\n\nkiitos tilauksesta. Vahvistamme:\n- sementti CEM II/A-LL 42,5 R, 40 säkkiä: 248,00 €\n- raudoitusteräs A500HW Ø12, 1,2 t: 1 068,00 €\n- harkot 250 mm, 6 lavaa: 870,00 €\nYhteensä: 2 186,00 € + alv.\n\nToimitamme 15. lokakuuta klo 10 mennessä osoitteeseen Hämeenkatu 68, Tampere. Kuljettaja soittaa Mikolle ennen saapumista.\nLasku osoitetaan Rakennusrytmi Oy:lle.\n\nHyvää päivänjatkoa!' }
      }
    },
    {
      id: 'freight', fromName: 'Sari Korhonen', fromEmail: 's.korhonen@pohjolanpuhtaus.fi', time: '09:15',
      subject: 'Kuljetus Tallinnaan',
      body: 'Hei,\n\nmeidän pitäisi siirtää 4 EUR-lavaa (noin 1 800 kg) varastostamme Vantaalta Tallinnaan. Lastaus voisi olla ensi tiistaina iltapäivällä. Tavara on kotitalouksien puhdistusaineita, ei vaarallisia aineita (ei ADR).\n\nMitä tämä maksaisi, ja onnistuisiko toimitus keskiviikkona?\n\nSari Korhonen\nPohjolan Puhtaus Oy',
      steps: [
        ['mail', 'Luin sähköpostin: kyseessä on kuljetuksen tarjouspyyntö'],
        ['crm', 'Uusi asiakas, loin kortin: Pohjolan Puhtaus Oy'],
        ['mail', 'Poimin lastin tiedot: 4 EUR-lavaa, noin 1 800 kg, ei ADR'],
        ['mail', 'Huomasin, että 3 tietoa puuttuu, joita ilman hintaa ei voi laskea'],
        ['sheet', 'Kirjasin tiedustelun taulukkoon tilalla ”Tieto puuttuu”'],
        ['mail', 'Valmistelin vastauksen lisäkysymyksineen, odottaa hyväksyntäänne']
      ],
      result: {
        summary: 'Tarjouspyyntö: 4 EUR-lavaa (noin 1 800 kg) Vantaa → Tallinna, lastaus ensi tiistaina iltapäivällä, toimitus toivotaan keskiviikoksi.',
        customer: 'Pohjolan Puhtaus Oy', status: 'waiting', delivery: 'Lastaus ti, toimitus ke',
        items: [['Kuljetus Vantaa → Tallinna, puhdistusaineet (ei ADR), noin 1 800 kg', '4 lavaa', '-']],
        missing: ['Tarkka lastausosoite Vantaalla', 'Toimitusosoite Tallinnassa ja vastaanottajan yhteyshenkilö', 'Voiko lavat pinota päällekkäin (ja kuinka korkeita ne ovat)'],
        reply: { subject: 'VS: Kuljetus Tallinnaan', body: 'Hei Sari,\n\nkiitos tiedustelusta. Jotta voimme antaa tarkan hinnan ja vahvistaa toimituksen keskiviikoksi, tarvitsemme vielä:\n1. Tarkan lastausosoitteen Vantaalla.\n2. Toimitusosoitteen Tallinnassa ja vastaanottajan yhteyshenkilön.\n3. Voiko lavat pinota päällekkäin, ja kuinka korkeita ne ovat?\n\nKun saamme tiedot, lähetämme hinnan tunnin sisällä.\n\nHyvää päivänjatkoa!' }
      }
    },
    {
      id: 'cafe', fromName: 'Julia', fromEmail: 'julia@kahvilaaamu.fi', time: '10:02',
      subject: 'tilaus',
      body: 'moi, kuten viimeksi, mutta kahvia tuplamäärä 🙂 ja lisää 2 laatikkoa niitä 300 ml paperimukeja. onko teillä kauramaitoa? jos on, 12 kpl.\ntoimitus kuten aina\n\nJulia, Kahvila Aamu',
      steps: [
        ['mail', 'Luin sähköpostin: kyseessä on uusintatilaus'],
        ['crm', 'Löysin asiakkaan CRM:stä: Kahvila Aamu, Mannerheimintie 10, Helsinki'],
        ['crm', 'Hain edellisen tilauksen #1042: kahvi 6 kg, sokeripussit 2 laatikkoa'],
        ['stock', 'Tarkistin varastosaldot: kauramaitoa on saatavilla (34 kpl)'],
        ['sheet', 'Kirjasin tilauksen taulukkoon: 4 riviä, 343,80 € ilman alv:ta'],
        ['mail', 'Valmistelin vastauksen ja vastasin kysymykseen, odottaa hyväksyntäänne']
      ],
      result: {
        summary: 'Uusintatilaus tilauksen #1042 mukaan, kahvimäärä kaksinkertaistettu, lisäksi mukit ja kauramaito. Tavallinen osoite ja toimituspäivä.',
        customer: 'Kahvila Aamu', status: 'ready', delivery: 'Tiistaina, Mannerheimintie 10',
        items: [['Kahvipavut ”Espresso”, 1 kg (kuten #1042 × 2)', '12 kpl', '226,80 €'], ['Sokeripussit, 1000 kpl (kuten #1042)', '2 laatikkoa', '23,00 €'], ['Paperimukit 300 ml, 1000 kpl', '2 laatikkoa', '64,00 €'], ['Kauramaito Barista, 1 l', '12 kpl', '30,00 €']],
        missing: [],
        reply: { subject: 'VS: tilaus', body: 'Moi Julia,\n\ntilauksenne on vastaanotettu:\n- kahvi ”Espresso” 1 kg: 12 kpl (kaksinkertainen määrä viime kertaan nähden)\n- sokeripussit: 2 laatikkoa\n- paperimukit 300 ml: 2 laatikkoa\n- kauramaito Barista 1 l: 12 kpl (kyllä, on meillä!)\nYhteensä: 343,80 € + alv.\n\nToimitamme tiistaina kuten tavallista osoitteeseen Mannerheimintie 10.\n\nHyvää päivänjatkoa!' }
      }
    }
  ],

  faq: {
    'pitääkö palveluista maksaa etukäteen?': 'Aloitukseen pyydämme 30–50 %:n ennakkomaksun, ja loppuosa erääntyy toimituksen yhteydessä. Tuotannossa toimivia automaatioita ylläpidetään sen jälkeen kuukausimaksulla, joka kattaa seurannan, huollon ja tuen.',
    'sopiiko swiftrix myös pienille tiimeille ja startup-yrityksille?': 'Ehdottomasti. Pienet tiimit hyötyvät usein eniten, koska käsityö vie heidän päivästään suuremman osan. Jokainen ratkaisu sovitetaan koollenne, budjettiinne ja työkaluihinne.',
    'minkä työkalujen ja alustojen kanssa työskentelette?': 'Käytännössä kaiken kanssa, jolla on rajapinta: CRM-järjestelmät, taulukot, sähköposti, Slack, tietokannat, maksujärjestelmät ja omat sisäiset työkalut. Jos käyttöliittymä tai rajapinta on olemassa, voimme yleensä automatisoida sen.',
    'optimoitteko myös prosesseja vai ainoastaan rakennatteko?': 'Molempia. Aloitamme kartoittamalla ja analysoimalla työnkulkunne hukan poistamiseksi ja rakennamme sitten automaatiot. Jatkuva optimointi kuuluu jokaiseen projektiin.',
    'voinko irtisanoa milloin tahansa, jos en ole tyytyväinen?': 'Kyllä. Pitkiä sitovia sopimuksia ei ole. Jos emme tuota lisäarvoa, voitte lopettaa milloin tahansa, vaikka useimmat tiimit päättävät jäädä.',
    'mikä erottaa swiftrixin muista toimittajista?': 'Olemme insinöörejä, emme tavallinen toimisto. Jokainen automaatio rakennetaan räätälöidysti järjestelmiinne, sitä valvotaan jatkuvasti ja sen takana on toimivuustakuumme.',
    'rakennatteko automaatiot vai neuvotteletteko vain strategiasta?': 'Rakennamme. Strategia sisältyy hintaan, mutta lopputuloksena teillä on toimivat, tuotantokäyttöön valmiit automaatiot, ei pelkkä suositusdiasarja.'
  },

  heroWords: ['työnkulut'],
  aboutLabel: '/ MEISTÄ',
  aboutWords: ['toimisto']
}
