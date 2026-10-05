// Order-agent demo (/demo in English, /lt/demo in Lithuanian, /de/demo in
// German; the language comes from <html lang>). The three sample emails play back pre-written
// agent runs — instant, free, and they show the catalog / CRM / stock lookups
// a real deployment does. "Your email" goes to /api/agent for a live run,
// which only extracts and drafts: it has no catalog, so it never quotes prices.
(function () {
  'use strict'

  var LANG = { lt: 'lt', de: 'de' }[document.documentElement.lang] || 'en'
  // Theme handling is shared with the assistant page: /js/pages.js.

  var T = {
    lt: {
      own: 'Jūsų laiškas', ownSubj: 'Įklijuokite bet kokį laišką', from: 'Nuo', subject: 'Tema', to: 'Kam',
      run: 'Paleisti agentą', rerun: 'Paleisti dar kartą', working: 'Agentas dirba…',
      idle: 'Laukia', busy: 'Dirba', done: 'Baigė',
      pick: 'Pasirinkite laišką kairėje ir paspauskite „Paleisti agentą“.',
      resultIdle: 'Čia atsiras agento santrauka ir atsakymo juodraštis.',
      missing: 'Trūksta informacijos', reply: 'Atsakymo juodraštis', approve: 'Patvirtinti ir siųsti', edit: 'Redaguoti', editing: 'Baigti redaguoti',
      toast: 'Demo režimas: tikroje sistemoje šis laiškas būtų išsiųstas klientui iš jūsų pašto dėžutės.',
      empty: 'Lentelė kol kas tuščia. Paleiskite agentą.',
      cols: ['Nr.', 'Klientas', 'Prekė / paslauga', 'Kiekis', 'Suma', 'Pristatymas', 'Būsena'],
      status: { ready: 'Paruošta', waiting: 'Laukia info', review: 'Peržiūrėti' },
      tooShort: 'Laiškas per trumpas. Įklijuokite bent kelis sakinius.',
      reading: 'Skaitau laišką…',
      liveNote: 'Gyvame režime agentas neprijungtas prie jūsų katalogo, todėl kainų ir likučių netikrina. Tikroje sistemoje jis dirba su jūsų CRM, ERP ar Excel.',
      err: { rate: 'Per daug bandymų iš eilės. Pabandykite po kelių minučių.', off: 'Gyvas režimas šiuo metu išjungtas. Išbandykite pavyzdinius laiškus.', generic: 'Nepavyko apdoroti laiško. Pabandykite dar kartą arba išbandykite pavyzdžius.' },
      live: {
        type: { order: 'Perskaičiau laišką: tai užsakymas', quote: 'Perskaičiau laišką: tai kainos užklausa', question: 'Perskaičiau laišką: tai kliento klausimas', complaint: 'Perskaičiau laišką: tai skundas', other: 'Perskaičiau laišką: tai ne užsakymas ir ne užklausa' },
        sender: 'Atpažinau siuntėją: ', noSender: 'Siuntėjo įmonė laiške nenurodyta',
        items: function (n) { return n ? 'Ištraukiau ' + n + (n === 1 ? ' eilutę' : n < 10 ? ' eilutes' : ' eilučių') : 'Prekių ar paslaugų eilučių neradau' },
        missing: function (n) { return n ? 'Trūksta ' + n + (n === 1 ? ' dalyko, todėl įtraukiau klausimą' : ' dalykų, todėl įtraukiau klausimus') + ' į atsakymą' : 'Visa reikalinga informacija yra' },
        sheet: 'Įrašiau į užsakymų lentelę', reply: 'Paruošiau atsakymą, laukia jūsų patvirtinimo'
      },
      sys: { mail: 'El. paštas', crm: 'CRM', stock: 'Sandėlis', sheet: 'Užsakymų lentelė' }
    },
    en: {
      own: 'Your email', ownSubj: 'Paste any email', from: 'From', subject: 'Subject', to: 'To',
      run: 'Run the agent', rerun: 'Run again', working: 'Agent working…',
      idle: 'Waiting', busy: 'Working', done: 'Done',
      pick: 'Pick an email on the left and press “Run the agent”.',
      resultIdle: 'The agent’s summary and draft reply will appear here.',
      missing: 'Missing information', reply: 'Draft reply', approve: 'Approve & send', edit: 'Edit', editing: 'Done editing',
      toast: 'Demo mode: in a real setup this reply would go to the customer from your own mailbox.',
      empty: 'The sheet is empty for now. Run the agent.',
      cols: ['No.', 'Customer', 'Item / service', 'Qty', 'Amount', 'Delivery', 'Status'],
      status: { ready: 'Ready', waiting: 'Needs info', review: 'Review' },
      tooShort: 'That email is too short. Paste at least a few sentences.',
      reading: 'Reading the email…',
      liveNote: 'In live mode the agent isn’t connected to your catalog, so it doesn’t check prices or stock. In a real setup it works with your CRM, ERP or Excel.',
      err: { rate: 'Too many tries in a row. Please try again in a few minutes.', off: 'Live mode is switched off right now. Try the sample emails.', generic: 'Couldn’t process that email. Try again, or try the samples.' },
      live: {
        type: { order: 'Read the email: it’s an order', quote: 'Read the email: it’s a quote request', question: 'Read the email: it’s a customer question', complaint: 'Read the email: it’s a complaint', other: 'Read the email: it isn’t an order or an enquiry' },
        sender: 'Identified the sender: ', noSender: 'The email doesn’t name the sender’s company',
        items: function (n) { return n ? 'Extracted ' + n + (n === 1 ? ' line' : ' lines') : 'Found no item or service lines' },
        missing: function (n) { return n ? n + (n === 1 ? ' thing is missing, so I added a question' : ' things are missing, so I added questions') + ' to the reply' : 'All the information needed is there' },
        sheet: 'Logged it in the orders sheet', reply: 'Drafted a reply, waiting for your approval'
      },
      sys: { mail: 'Email', crm: 'CRM', stock: 'Stock', sheet: 'Orders sheet' }
    },
    de: {
      own: 'Ihre E-Mail', ownSubj: 'Beliebige E-Mail einfügen', from: 'Von', subject: 'Betreff', to: 'An',
      run: 'Agent starten', rerun: 'Erneut starten', working: 'Agent arbeitet…',
      idle: 'Wartet', busy: 'Arbeitet', done: 'Fertig',
      pick: 'Wählen Sie links eine E-Mail und klicken Sie auf „Agent starten“.',
      resultIdle: 'Hier erscheinen die Zusammenfassung des Agenten und der Antwortentwurf.',
      missing: 'Fehlende Angaben', reply: 'Antwortentwurf', approve: 'Freigeben & senden', edit: 'Bearbeiten', editing: 'Fertig bearbeitet',
      toast: 'Demo-Modus: In einem echten Setup ginge diese Antwort aus Ihrem eigenen Postfach an den Kunden.',
      empty: 'Die Tabelle ist noch leer. Starten Sie den Agenten.',
      cols: ['Nr.', 'Kunde', 'Artikel / Leistung', 'Menge', 'Betrag', 'Lieferung', 'Status'],
      status: { ready: 'Bereit', waiting: 'Info fehlt', review: 'Prüfen' },
      tooShort: 'Die E-Mail ist zu kurz. Fügen Sie mindestens ein paar Sätze ein.',
      reading: 'Lese die E-Mail…',
      liveNote: 'Im Live-Modus ist der Agent nicht mit Ihrem Katalog verbunden und prüft daher keine Preise oder Bestände. In einem echten Setup arbeitet er mit Ihrem CRM, ERP oder Excel.',
      err: { rate: 'Zu viele Versuche hintereinander. Bitte versuchen Sie es in ein paar Minuten erneut.', off: 'Der Live-Modus ist gerade ausgeschaltet. Probieren Sie die Beispiel-E-Mails aus.', generic: 'Die E-Mail konnte nicht verarbeitet werden. Versuchen Sie es erneut oder nehmen Sie ein Beispiel.' },
      live: {
        type: { order: 'E-Mail gelesen: eine Bestellung', quote: 'E-Mail gelesen: eine Preisanfrage', question: 'E-Mail gelesen: eine Kundenfrage', complaint: 'E-Mail gelesen: eine Reklamation', other: 'E-Mail gelesen: keine Bestellung und keine Anfrage' },
        sender: 'Absender erkannt: ', noSender: 'Die Firma des Absenders steht nicht in der E-Mail',
        items: function (n) { return n ? n + (n === 1 ? ' Position' : ' Positionen') + ' erfasst' : 'Keine Artikel- oder Leistungspositionen gefunden' },
        missing: function (n) { return n ? (n === 1 ? '1 Angabe fehlt, deshalb habe ich eine Rückfrage' : n + ' Angaben fehlen, deshalb habe ich Rückfragen') + ' in die Antwort aufgenommen' : 'Alle nötigen Angaben sind vorhanden' },
        sheet: 'In die Bestelltabelle eingetragen', reply: 'Antwort vorbereitet, wartet auf Ihre Freigabe'
      },
      sys: { mail: 'E-Mail', crm: 'CRM', stock: 'Lager', sheet: 'Bestelltabelle' }
    }
  }[LANG]

  // ---- sample runs ----
  var SAMPLES = {
    lt: [
      {
        id: 'build', fromName: 'Tomas Petrauskas', fromEmail: 'tomas.p@statyburitmas.lt', time: '08:47',
        subject: 'Užsakymas objektui Žirmūnų g.',
        body: 'Laba diena,\n\nnorėtume užsakyti medžiagas objektui Žirmūnų g. 68, Vilniuje:\n- cementas CEM II/A-LL 42,5 R, 40 maišų po 25 kg\n- armatūra A500 Ø12, 1,2 t\n- mūro blokeliai 250 mm, 6 paletės\n\nPristatyti reikėtų spalio 15 d. iki 10 val. Krovinį priims darbų vadovas Mindaugas, tel. +370 612 00000.\nSąskaitą prašome išrašyti UAB „Statybų ritmas“.\n\nAčiū,\nTomas Petrauskas\nTiekimo vadybininkas',
        steps: [
          ['mail', 'Perskaičiau laišką: tai naujas užsakymas'],
          ['crm', 'Radau klientą CRM: UAB „Statybų ritmas“, sąskaitos išrašomos įmonei'],
          ['stock', 'Susiejau 3 prekes su katalogu ir patikrinau kainas'],
          ['stock', 'Patikrinau likučius: visos prekės yra sandėlyje'],
          ['sheet', 'Įrašiau užsakymą į lentelę: 3 eilutės, 2 186,00 € be PVM'],
          ['mail', 'Paruošiau patvirtinimą klientui, laukia jūsų patvirtinimo']
        ],
        result: {
          summary: 'Naujas užsakymas objektui Žirmūnų g. 68, Vilniuje: 3 prekės, pristatymas spalio 15 d. iki 10:00. Visa informacija yra.',
          customer: 'UAB „Statybų ritmas“', status: 'ready', delivery: 'Spalio 15 d. iki 10:00, Žirmūnų g. 68',
          items: [['Cementas CEM II/A-LL 42,5 R, 25 kg', '40 maiš.', '248,00 €'], ['Armatūra A500 Ø12', '1,2 t', '1 068,00 €'], ['Mūro blokeliai 250 mm', '6 pal.', '870,00 €']],
          missing: [],
          reply: { subject: 'RE: Užsakymas objektui Žirmūnų g.', body: 'Laba diena, Tomai,\n\načiū už užsakymą. Patvirtiname:\n- cementas CEM II/A-LL 42,5 R, 40 maišų: 248,00 €\n- armatūra A500 Ø12, 1,2 t: 1 068,00 €\n- mūro blokeliai 250 mm, 6 paletės: 870,00 €\nIš viso: 2 186,00 € + PVM.\n\nPristatysime spalio 15 d. iki 10 val. į Žirmūnų g. 68, Vilniuje. Prieš atvykdamas vairuotojas paskambins Mindaugui.\nSąskaitą išrašysime UAB „Statybų ritmas“.\n\nGražios dienos!' }
        }
      },
      {
        id: 'freight', fromName: 'Rasa Jankauskienė', fromEmail: 'rasa@baltijossvara.lt', time: '09:15',
        subject: 'Krovinys į Rygą',
        body: 'Sveiki,\n\nreikia pervežti 4 europaletes (apie 1 800 kg) iš mūsų sandėlio Kaune į Rygą. Pakrovimas galėtų būti kitą antradienį po pietų. Krovinys: buitinė chemija, ne ADR.\n\nKiek tai kainuotų ir ar spėtumėte pristatyti trečiadienį?\n\nRasa\nUAB „Baltijos švara“',
        steps: [
          ['mail', 'Perskaičiau laišką: tai kainos užklausa pervežimui'],
          ['crm', 'Klientas naujas, sukūriau kortelę: UAB „Baltijos švara“'],
          ['mail', 'Ištraukiau krovinio duomenis: 4 EUR paletės, ~1 800 kg, ne ADR'],
          ['mail', 'Pastebėjau, kad trūksta 3 dalykų, be kurių kainos neapskaičiuosi'],
          ['sheet', 'Įrašiau užklausą į lentelę su būsena „Laukia info“'],
          ['mail', 'Paruošiau atsakymą su klausimais, laukia jūsų patvirtinimo']
        ],
        result: {
          summary: 'Kainos užklausa: 4 europaletės (~1 800 kg) Kaunas → Ryga, pakrovimas kitą antradienį po pietų, pristatymas pageidaujamas trečiadienį.',
          customer: 'UAB „Baltijos švara“', status: 'waiting', delivery: 'Pakr. antradienį, prist. trečiadienį',
          items: [['Pervežimas Kaunas → Ryga, buitinė chemija (ne ADR), ~1 800 kg', '4 EUR pal.', '-']],
          missing: ['Tikslus pakrovimo adresas Kaune', 'Pristatymo adresas Rygoje ir gavėjo kontaktas', 'Ar paletes galima krauti viena ant kitos (koks aukštis)'],
          reply: { subject: 'RE: Krovinys į Rygą', body: 'Sveiki, Rasa,\n\načiū už užklausą. Kad galėtume pateikti tikslią kainą ir patvirtinti pristatymą trečiadienį, patikslinkite:\n1. Tikslų pakrovimo adresą Kaune.\n2. Pristatymo adresą Rygoje ir gavėjo kontaktą.\n3. Ar paletes galima krauti viena ant kitos (koks jų aukštis)?\n\nGavę šią informaciją, kainą atsiųsime per valandą.\n\nGražios dienos!' }
        }
      },
      {
        id: 'cafe', fromName: 'Justė', fromEmail: 'juste@kavinerytine.lt', time: '10:02',
        subject: 'užsakymas',
        body: 'labas, kaip praeitą kartą, tik kavos dvigubai 🙂 ir pridėkit 2 dėžes tų popierinių puodelių 300 ml. ar turit avižinio pieno? jei taip, 12 vnt.\npristatymas kaip visada\n\nJustė, kavinė „Rytinė“',
        steps: [
          ['mail', 'Perskaičiau laišką: tai pakartotinis užsakymas'],
          ['crm', 'Radau klientą CRM: kavinė „Rytinė“, Vokiečių g. 10, Vilnius'],
          ['crm', 'Peržiūrėjau ankstesnį užsakymą #1042: kava 6 kg, cukraus lazdelės 2 dėž.'],
          ['stock', 'Patikrinau likučius: avižinio gėrimo yra (34 vnt.)'],
          ['sheet', 'Įrašiau užsakymą į lentelę: 4 eilutės, 343,80 € be PVM'],
          ['mail', 'Paruošiau atsakymą ir atsakiau į klausimą, laukia jūsų patvirtinimo']
        ],
        result: {
          summary: 'Pakartotinis užsakymas pagal #1042: kavos kiekis padvigubintas, pridėti puodeliai ir avižinis gėrimas. Pristatymas įprastu adresu ir įprastą dieną.',
          customer: 'Kavinė „Rytinė“', status: 'ready', delivery: 'Antradienį, Vokiečių g. 10',
          items: [['Kava pupelėmis „Espresso“, 1 kg (pagal #1042 × 2)', '12 vnt.', '226,80 €'], ['Cukraus lazdelės, 1000 vnt. (pagal #1042)', '2 dėž.', '23,00 €'], ['Popieriniai puodeliai 300 ml, 1000 vnt.', '2 dėž.', '64,00 €'], ['Avižinis gėrimas Barista, 1 l', '12 vnt.', '30,00 €']],
          missing: [],
          reply: { subject: 'RE: užsakymas', body: 'Labas, Juste,\n\nužsakymą gavome:\n- kava „Espresso“ 1 kg: 12 vnt. (dvigubai nei praeitą kartą)\n- cukraus lazdelės: 2 dėž.\n- popieriniai puodeliai 300 ml: 2 dėž.\n- avižinis gėrimas Barista 1 l: 12 vnt. (taip, turime!)\nIš viso: 343,80 € + PVM.\n\nPristatysime antradienį, kaip įprastai, į Vokiečių g. 10.\n\nGražios dienos!' }
        }
      }
    ],
    en: [
      {
        id: 'build', fromName: 'Tomas Petrauskas', fromEmail: 'tomas.p@statyburitmas.lt', time: '08:47',
        subject: 'Order for the Žirmūnų St. site',
        body: 'Hello,\n\nwe’d like to order materials for our site at Žirmūnų St. 68, Vilnius:\n- cement CEM II/A-LL 42.5 R, 40 bags of 25 kg\n- rebar A500 Ø12, 1.2 t\n- masonry blocks 250 mm, 6 pallets\n\nDelivery needed on 15 October before 10 am. Our site manager Mindaugas will receive it, tel. +370 612 00000.\nPlease invoice UAB “Statybų ritmas”.\n\nThanks,\nTomas Petrauskas\nProcurement manager',
        steps: [
          ['mail', 'Read the email: it’s a new order'],
          ['crm', 'Found the customer in the CRM: UAB “Statybų ritmas”, invoiced to the company'],
          ['stock', 'Matched 3 items to the catalog and checked prices'],
          ['stock', 'Checked stock: everything is in the warehouse'],
          ['sheet', 'Logged the order: 3 lines, €2,186.00 excl. VAT'],
          ['mail', 'Drafted a confirmation, waiting for your approval']
        ],
        result: {
          summary: 'New order for the Žirmūnų St. 68 site in Vilnius: 3 items, delivery on 15 October before 10:00. Nothing is missing.',
          customer: 'UAB “Statybų ritmas”', status: 'ready', delivery: '15 Oct before 10:00, Žirmūnų St. 68',
          items: [['Cement CEM II/A-LL 42.5 R, 25 kg', '40 bags', '€248.00'], ['Rebar A500 Ø12', '1.2 t', '€1,068.00'], ['Masonry blocks 250 mm', '6 pallets', '€870.00']],
          missing: [],
          reply: { subject: 'RE: Order for the Žirmūnų St. site', body: 'Hello Tomas,\n\nthank you for your order. Confirmed:\n- cement CEM II/A-LL 42.5 R, 40 bags: €248.00\n- rebar A500 Ø12, 1.2 t: €1,068.00\n- masonry blocks 250 mm, 6 pallets: €870.00\nTotal: €2,186.00 + VAT.\n\nWe’ll deliver on 15 October before 10 am to Žirmūnų St. 68, Vilnius. The driver will call Mindaugas before arriving.\nThe invoice will be issued to UAB “Statybų ritmas”.\n\nHave a good day!' }
        }
      },
      {
        id: 'freight', fromName: 'Rasa Jankauskienė', fromEmail: 'rasa@baltijossvara.lt', time: '09:15',
        subject: 'Shipment to Riga',
        body: 'Hi,\n\nwe need to move 4 euro pallets (about 1,800 kg) from our warehouse in Kaunas to Riga. Loading could be next Tuesday afternoon. The goods are household chemicals, not ADR.\n\nHow much would it cost, and could you deliver on Wednesday?\n\nRasa\nUAB “Baltijos švara”',
        steps: [
          ['mail', 'Read the email: it’s a freight quote request'],
          ['crm', 'New customer, created a card: UAB “Baltijos švara”'],
          ['mail', 'Extracted the load: 4 euro pallets, ~1,800 kg, not ADR'],
          ['mail', 'Noticed 3 things missing that a price depends on'],
          ['sheet', 'Logged the request with status “Needs info”'],
          ['mail', 'Drafted a reply with the questions, waiting for your approval']
        ],
        result: {
          summary: 'Quote request: 4 euro pallets (~1,800 kg) Kaunas → Riga, loading next Tuesday afternoon, delivery wanted on Wednesday.',
          customer: 'UAB “Baltijos švara”', status: 'waiting', delivery: 'Load Tue, deliver Wed',
          items: [['Freight Kaunas → Riga, household chemicals (not ADR), ~1,800 kg', '4 pallets', '-']],
          missing: ['Exact loading address in Kaunas', 'Delivery address in Riga and a recipient contact', 'Whether the pallets can be stacked (and their height)'],
          reply: { subject: 'RE: Shipment to Riga', body: 'Hi Rasa,\n\nthanks for your request. To give you an exact price and confirm Wednesday delivery, could you tell us:\n1. The exact loading address in Kaunas.\n2. The delivery address in Riga and a recipient contact.\n3. Whether the pallets can be stacked (and how high they are)?\n\nOnce we have this, we’ll send the price within the hour.\n\nHave a good day!' }
        }
      },
      {
        id: 'cafe', fromName: 'Justė', fromEmail: 'juste@kavinerytine.lt', time: '10:02',
        subject: 'order',
        body: 'hi, same as last time but double the coffee 🙂 and add 2 boxes of those 300 ml paper cups. do you have oat milk? if yes, 12 please.\nusual delivery\n\nJustė, café “Rytinė”',
        steps: [
          ['mail', 'Read the email: it’s a repeat order'],
          ['crm', 'Found the customer in the CRM: café “Rytinė”, Vokiečių St. 10, Vilnius'],
          ['crm', 'Looked up the previous order #1042: coffee 6 kg, sugar sticks 2 boxes'],
          ['stock', 'Checked stock: oat drink is available (34 units)'],
          ['sheet', 'Logged the order: 4 lines, €343.80 excl. VAT'],
          ['mail', 'Drafted a reply that answers the question, waiting for your approval']
        ],
        result: {
          summary: 'Repeat of order #1042 with the coffee doubled, plus cups and oat drink. Usual address, usual delivery day.',
          customer: 'Café “Rytinė”', status: 'ready', delivery: 'Tuesday, Vokiečių St. 10',
          items: [['Coffee beans “Espresso”, 1 kg (as #1042 × 2)', '12 pcs', '€226.80'], ['Sugar sticks, 1000 pcs (as #1042)', '2 boxes', '€23.00'], ['Paper cups 300 ml, 1000 pcs', '2 boxes', '€64.00'], ['Oat drink Barista, 1 l', '12 pcs', '€30.00']],
          missing: [],
          reply: { subject: 'RE: order', body: 'Hi Justė,\n\nwe’ve got your order:\n- coffee “Espresso” 1 kg: 12 pcs (double last time)\n- sugar sticks: 2 boxes\n- paper cups 300 ml: 2 boxes\n- oat drink Barista 1 l: 12 pcs (yes, we have it!)\nTotal: €343.80 + VAT.\n\nWe’ll deliver on Tuesday as usual, to Vokiečių St. 10.\n\nHave a good day!' }
        }
      }
    ],
    de: [
      {
        id: 'build', fromName: 'Thomas Becker', fromEmail: 't.becker@baurhythmus.de', time: '08:47',
        subject: 'Bestellung für die Baustelle Lindenstraße',
        body: 'Guten Tag,\n\nwir möchten folgendes Material für unsere Baustelle Lindenstraße 68 in Leipzig bestellen:\n- Zement CEM II/A-LL 42,5 R, 40 Sack à 25 kg\n- Betonstahl B500 Ø12, 1,2 t\n- Mauersteine 25 cm, 6 Paletten\n\nGeliefert werden müsste am 15. Oktober bis 10 Uhr. Angenommen wird die Ware von unserem Bauleiter Markus, Tel. +49 151 0000000.\nBitte stellen Sie die Rechnung auf die Baurhythmus GmbH aus.\n\nVielen Dank\nThomas Becker\nEinkauf',
        steps: [
          ['mail', 'E-Mail gelesen: eine neue Bestellung'],
          ['crm', 'Kunde im CRM gefunden: Baurhythmus GmbH, Rechnung an die Firma'],
          ['stock', '3 Artikel dem Katalog zugeordnet und Preise geprüft'],
          ['stock', 'Bestand geprüft: alle Artikel sind auf Lager'],
          ['sheet', 'Bestellung eingetragen: 3 Positionen, 2.186,00 € netto'],
          ['mail', 'Bestätigung an den Kunden vorbereitet, wartet auf Ihre Freigabe']
        ],
        result: {
          summary: 'Neue Bestellung für die Baustelle Lindenstraße 68 in Leipzig: 3 Artikel, Lieferung am 15. Oktober bis 10:00 Uhr. Alle Angaben sind vorhanden.',
          customer: 'Baurhythmus GmbH', status: 'ready', delivery: '15. Okt. bis 10:00, Lindenstraße 68',
          items: [['Zement CEM II/A-LL 42,5 R, 25 kg', '40 Sack', '248,00 €'], ['Betonstahl B500 Ø12', '1,2 t', '1.068,00 €'], ['Mauersteine 25 cm', '6 Pal.', '870,00 €']],
          missing: [],
          reply: { subject: 'AW: Bestellung für die Baustelle Lindenstraße', body: 'Guten Tag Herr Becker,\n\nvielen Dank für Ihre Bestellung. Wir bestätigen:\n- Zement CEM II/A-LL 42,5 R, 40 Sack: 248,00 €\n- Betonstahl B500 Ø12, 1,2 t: 1.068,00 €\n- Mauersteine 25 cm, 6 Paletten: 870,00 €\nGesamt: 2.186,00 € zzgl. MwSt.\n\nWir liefern am 15. Oktober bis 10 Uhr in die Lindenstraße 68 in Leipzig. Der Fahrer ruft Markus vor der Ankunft an.\nDie Rechnung stellen wir auf die Baurhythmus GmbH aus.\n\nEinen schönen Tag noch!' }
        }
      },
      {
        id: 'freight', fromName: 'Sabine Krüger', fromEmail: 's.krueger@nordrein.de', time: '09:15',
        subject: 'Transport nach Posen',
        body: 'Hallo,\n\nwir müssten 4 Europaletten (ca. 1.800 kg) von unserem Lager in Berlin nach Posen bringen. Verladen werden könnte nächsten Dienstag am Nachmittag. Ware: Haushaltsreiniger, kein Gefahrgut.\n\nWas würde das kosten, und wäre eine Zustellung am Mittwoch möglich?\n\nSabine Krüger\nNordrein Reinigungsmittel GmbH',
        steps: [
          ['mail', 'E-Mail gelesen: eine Preisanfrage für einen Transport'],
          ['crm', 'Neuer Kunde, Karte angelegt: Nordrein Reinigungsmittel GmbH'],
          ['mail', 'Ladung erfasst: 4 Europaletten, ca. 1.800 kg, kein Gefahrgut'],
          ['mail', '3 Angaben fehlen, ohne die sich kein Preis berechnen lässt'],
          ['sheet', 'Anfrage mit Status „Info fehlt“ in die Tabelle eingetragen'],
          ['mail', 'Antwort mit Rückfragen vorbereitet, wartet auf Ihre Freigabe']
        ],
        result: {
          summary: 'Preisanfrage: 4 Europaletten (ca. 1.800 kg) Berlin → Posen, Verladung nächsten Dienstagnachmittag, Zustellung am Mittwoch gewünscht.',
          customer: 'Nordrein Reinigungsmittel GmbH', status: 'waiting', delivery: 'Verladung Di, Zustellung Mi',
          items: [['Transport Berlin → Posen, Haushaltsreiniger (kein Gefahrgut), ca. 1.800 kg', '4 Pal.', '-']],
          missing: ['Genaue Ladeadresse in Berlin', 'Lieferadresse in Posen und Ansprechpartner vor Ort', 'Ob die Paletten stapelbar sind (und wie hoch)'],
          reply: { subject: 'AW: Transport nach Posen', body: 'Hallo Frau Krüger,\n\nvielen Dank für Ihre Anfrage. Damit wir Ihnen einen genauen Preis nennen und die Zustellung am Mittwoch bestätigen können, bräuchten wir noch:\n1. Die genaue Ladeadresse in Berlin.\n2. Die Lieferadresse in Posen und einen Ansprechpartner vor Ort.\n3. Sind die Paletten stapelbar, und wie hoch sind sie?\n\nSobald wir die Angaben haben, schicken wir Ihnen den Preis innerhalb einer Stunde.\n\nEinen schönen Tag noch!' }
        }
      },
      {
        id: 'cafe', fromName: 'Julia', fromEmail: 'julia@cafe-morgenrot.de', time: '10:02',
        subject: 'bestellung',
        body: 'hallo, wie letztes mal, nur doppelt so viel kaffee 🙂 und packt bitte 2 kartons von den 300 ml pappbechern dazu. habt ihr haferdrink? wenn ja, 12 stück.\nlieferung wie immer\n\nJulia, Café Morgenrot',
        steps: [
          ['mail', 'E-Mail gelesen: eine Nachbestellung'],
          ['crm', 'Kunde im CRM gefunden: Café Morgenrot, Bergstraße 10, Dresden'],
          ['crm', 'Letzte Bestellung #1042 nachgeschlagen: Kaffee 6 kg, Zuckersticks 2 Kartons'],
          ['stock', 'Bestand geprüft: Haferdrink ist verfügbar (34 Stück)'],
          ['sheet', 'Bestellung eingetragen: 4 Positionen, 343,80 € netto'],
          ['mail', 'Antwort vorbereitet und die Frage beantwortet, wartet auf Ihre Freigabe']
        ],
        result: {
          summary: 'Nachbestellung wie #1042 mit doppelter Kaffeemenge, dazu Becher und Haferdrink. Übliche Adresse, üblicher Liefertag.',
          customer: 'Café Morgenrot', status: 'ready', delivery: 'Dienstag, Bergstraße 10',
          items: [['Kaffeebohnen „Espresso“, 1 kg (wie #1042 × 2)', '12 Stk.', '226,80 €'], ['Zuckersticks, 1000 Stk. (wie #1042)', '2 Kart.', '23,00 €'], ['Pappbecher 300 ml, 1000 Stk.', '2 Kart.', '64,00 €'], ['Haferdrink Barista, 1 l', '12 Stk.', '30,00 €']],
          missing: [],
          reply: { subject: 'AW: bestellung', body: 'Hallo Julia,\n\neure Bestellung ist angekommen:\n- Kaffee „Espresso“ 1 kg: 12 Stk. (doppelt so viel wie letztes Mal)\n- Zuckersticks: 2 Kartons\n- Pappbecher 300 ml: 2 Kartons\n- Haferdrink Barista 1 l: 12 Stk. (ja, haben wir!)\nGesamt: 343,80 € zzgl. MwSt.\n\nWir liefern wie gewohnt am Dienstag in die Bergstraße 10.\n\nEinen schönen Tag noch!' }
        }
      }
    ]
  }[LANG]

  // ---- elements ----
  function $(s) { return document.querySelector(s) }
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }
  var list = $('#mail-list'), reader = $('#reader'), runBtn = $('#run'), stepsEl = $('#steps')
  var agentPill = $('#agent-pill'), resultBody = $('#result-body'), resultPill = $('#result-pill')
  var tbody = $('#sheet-body'), toast = $('#toast')
  var sysEls = {}
  document.querySelectorAll('[data-sys]').forEach(function (n) { sysEls[n.getAttribute('data-sys')] = n })

  var current = 0 // index into SAMPLES, or SAMPLES.length for "your email"
  var busy = false
  var processed = {}
  var nextNo = 1043
  var ownText = ''

  // ---- inbox ----
  function renderList() {
    list.textContent = ''
    SAMPLES.concat([{ id: 'own', fromName: T.own, subject: T.ownSubj, time: '✎' }]).forEach(function (s, i) {
      var li = el('li')
      var b = el('button', 'mail-item' + (processed[s.id] ? ' processed' : ''))
      b.type = 'button'
      b.setAttribute('role', 'tab')
      b.setAttribute('aria-selected', String(i === current))
      var from = el('span', 'mail-from', s.fromName)
      from.appendChild(el('span', 'done-dot'))
      b.appendChild(from)
      b.appendChild(el('span', 'mail-time', s.time))
      b.appendChild(el('span', 'mail-subj', s.subject))
      b.addEventListener('click', function () { if (!busy) { current = i; renderList(); renderReader() } })
      li.appendChild(b)
      list.appendChild(li)
    })
  }

  function renderReader() {
    reader.textContent = ''
    if (current < SAMPLES.length) {
      var s = SAMPLES[current]
      var meta = el('div', 'reader-meta')
      meta.appendChild(el('b', null, T.from + ': '))
      meta.appendChild(document.createTextNode(s.fromName + ' <' + s.fromEmail + '>'))
      meta.appendChild(el('br'))
      meta.appendChild(el('b', null, T.subject + ': '))
      meta.appendChild(document.createTextNode(s.subject))
      reader.appendChild(meta)
      reader.appendChild(el('p', 'reader-body', s.body))
      runBtn.textContent = processed[s.id] ? T.rerun : T.run
    } else {
      var box = el('div', 'own')
      var ta = el('textarea')
      ta.id = 'own-text'
      ta.maxLength = 3000
      ta.placeholder = reader.getAttribute('data-placeholder')
      ta.value = ownText
      ta.addEventListener('input', function () { ownText = ta.value })
      box.appendChild(ta)
      box.appendChild(el('p', 'hint', reader.getAttribute('data-privacy')))
      reader.appendChild(box)
      runBtn.textContent = T.run
    }
  }

  // ---- agent panel ----
  function setPill(pill, state) {
    pill.className = 'pill' + (state === 'busy' ? ' working' : state === 'done' ? ' done' : '')
    pill.lastChild.textContent = T[state]
  }
  function lightSys(key) {
    Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on') })
    if (key && sysEls[key]) sysEls[key].classList.add('on', 'used')
  }
  function resetSys() { Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on', 'used') }) }
  function addStep(text, state) {
    var li = el('li', 'step ' + state)
    li.appendChild(el('span', 'ic'))
    li.appendChild(el('span', 'tx', text))
    stepsEl.appendChild(li)
    return li
  }
  function finishStep(li, text, state) {
    li.className = 'step ' + (state || 'ok')
    if (text) li.lastChild.textContent = text
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  // Plays steps one by one; the sheet row and the reply appear on their steps.
  function playSteps(steps, result, sampleId) {
    var chain = Promise.resolve()
    steps.forEach(function (st) {
      chain = chain.then(function () {
        lightSys(st[0])
        var li = addStep(st[1], 'work')
        return wait(650 + Math.random() * 350).then(function () {
          finishStep(li)
          if (st[0] === 'sheet') addRows(result, sampleId)
        })
      })
    })
    return chain.then(function () { lightSys(null); showResult(result) })
  }

  // ---- result panel ----
  function showResult(r, note) {
    resultBody.textContent = ''
    resultBody.appendChild(el('p', 'summary', r.summary))
    if (r.missing && r.missing.length) {
      var m = el('div', 'missing')
      m.appendChild(el('b', null, T.missing))
      var ul = el('ul')
      r.missing.forEach(function (x) { ul.appendChild(el('li', null, x)) })
      m.appendChild(ul)
      resultBody.appendChild(m)
    }
    if (r.reply && r.reply.body) {
      var card = el('div', 'reply')
      var head = el('div', 'reply-head')
      head.appendChild(el('span', null, T.reply))
      var to = el('span')
      to.appendChild(el('b', null, T.to + ': '))
      to.appendChild(document.createTextNode(r.replyTo || ''))
      head.appendChild(to)
      var sj = el('span')
      sj.appendChild(el('b', null, T.subject + ': '))
      sj.appendChild(document.createTextNode(r.reply.subject || ''))
      head.appendChild(sj)
      card.appendChild(head)
      var ta = el('textarea')
      ta.readOnly = true
      ta.value = r.reply.body
      card.appendChild(ta)
      var actions = el('div', 'reply-actions')
      var ok = el('button', 'btn btn-primary', T.approve)
      ok.type = 'button'
      ok.addEventListener('click', function () { showToast(T.toast) })
      var ed = el('button', 'btn btn-ghost', T.edit)
      ed.type = 'button'
      ed.addEventListener('click', function () {
        ta.readOnly = !ta.readOnly
        ed.textContent = ta.readOnly ? T.edit : T.editing
        if (!ta.readOnly) ta.focus()
      })
      actions.appendChild(ok)
      actions.appendChild(ed)
      card.appendChild(actions)
      resultBody.appendChild(card)
      // Grow with the text instead of scrolling inside a small box.
      var fit = function () { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
      ta.addEventListener('input', fit)
      fit()
    }
    if (note) resultBody.appendChild(el('p', 'note', note))
    setPill(resultPill, 'done')
  }

  // ---- sheet ----
  function addRows(r, sampleId) {
    if (sampleId && processed[sampleId]) {
      // Re-run of a sample: its rows are already there — just point at them.
      tbody.querySelectorAll('tr[data-sample="' + sampleId + '"]').forEach(function (tr) {
        tr.classList.remove('flash'); void tr.offsetWidth; tr.classList.add('flash')
      })
      return
    }
    var empty = tbody.querySelector('.empty-row')
    if (empty) empty.remove()
    var no = '#' + (nextNo++)
    var items = r.items && r.items.length ? r.items : [[r.summary, '', '']]
    items.forEach(function (it, i) {
      var tr = el('tr', 'flash')
      if (sampleId) tr.setAttribute('data-sample', sampleId)
      tr.appendChild(el('td', 'no', i === 0 ? no : ''))
      tr.appendChild(el('td', null, i === 0 ? r.customer : ''))
      tr.appendChild(el('td', null, it[0]))
      tr.appendChild(el('td', 'num', it[1]))
      tr.appendChild(el('td', 'num', it[2]))
      tr.appendChild(el('td', null, i === 0 ? r.delivery : ''))
      var st = el('td')
      if (i === 0) st.appendChild(el('span', 'status ' + r.status, T.status[r.status]))
      tr.appendChild(st)
      tbody.appendChild(tr)
    })
  }
  function renderEmptySheet() {
    var tr = el('tr', 'empty-row')
    var td = el('td', null, T.empty)
    td.colSpan = T.cols.length
    tr.appendChild(td)
    tbody.appendChild(tr)
  }

  function showToast(msg) {
    toast.textContent = msg
    toast.classList.add('show')
    clearTimeout(showToast.t)
    showToast.t = setTimeout(function () { toast.classList.remove('show') }, 3800)
  }

  // ---- run ----
  function startRun() {
    busy = true
    runBtn.disabled = true
    runBtn.textContent = T.working
    stepsEl.textContent = ''
    resetSys()
    setPill(agentPill, 'busy')
    setPill(resultPill, 'idle')
    resultBody.textContent = ''
    resultBody.appendChild(el('p', 'placeholder', T.resultIdle))
    if (window.matchMedia('(max-width: 760px)').matches) $('#panel-agent').scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function endRun() {
    busy = false
    runBtn.disabled = false
    setPill(agentPill, 'done')
    renderList()
    renderReader()
  }

  function runSample(s) {
    startRun()
    var r = Object.assign({ replyTo: s.fromName + ' <' + s.fromEmail + '>' }, s.result)
    playSteps(s.steps, r, s.id).then(function () { processed[s.id] = true; endRun() })
  }

  function runLive() {
    var text = ownText.trim()
    if (text.length < 40) { showToast(T.tooShort); return }
    startRun()
    lightSys('mail')
    var first = addStep(T.reading, 'work')
    fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: text, lang: LANG })
    }).then(function (res) {
      return res.json().catch(function () { return {} }).then(function (data) { return { status: res.status, data: data } })
    }).then(function (out) {
      if (out.status !== 200 || !out.data || !out.data.result) {
        var msg = out.status === 429 ? T.err.rate : out.status === 503 ? T.err.off : T.err.generic
        finishStep(first, msg, 'err')
        lightSys(null)
        setPill(agentPill, 'idle')
        busy = false; runBtn.disabled = false; runBtn.textContent = T.run
        return
      }
      var x = out.data.result
      var L = T.live
      finishStep(first, L.type[x.type] || L.type.other)
      var who = (x.customer && (x.customer.company || x.customer.contact)) || ''
      var items = (x.items || []).map(function (it) {
        return [it.name + (it.note ? ' (' + it.note + ')' : ''), [it.quantity, it.unit].filter(Boolean).join(' '), '-']
      })
      var r = {
        summary: x.summary,
        customer: who || '-',
        status: x.type === 'other' ? 'review' : (x.missing || []).length ? 'waiting' : 'ready',
        delivery: [x.delivery && x.delivery.date, x.delivery && x.delivery.address].filter(Boolean).join(', ') || '-',
        items: items,
        missing: x.missing || [],
        reply: x.reply,
        replyTo: [x.customer && x.customer.contact, x.customer && x.customer.email && '<' + x.customer.email + '>'].filter(Boolean).join(' ')
      }
      var steps = [
        ['crm', who ? L.sender + who : L.noSender],
        ['mail', L.items(items.length)],
        ['mail', L.missing(r.missing.length)],
        ['sheet', L.sheet],
        ['mail', L.reply]
      ]
      var chain = Promise.resolve()
      steps.forEach(function (st) {
        chain = chain.then(function () {
          lightSys(st[0])
          var li = addStep(st[1], 'work')
          return wait(420).then(function () { finishStep(li); if (st[0] === 'sheet') addRows(r, null) })
        })
      })
      return chain.then(function () { lightSys(null); showResult(r, T.liveNote); endRun() })
    }).catch(function () {
      finishStep(first, T.err.generic, 'err')
      lightSys(null)
      setPill(agentPill, 'idle')
      busy = false; runBtn.disabled = false; runBtn.textContent = T.run
    })
  }

  runBtn.addEventListener('click', function () {
    if (busy) return
    if (current < SAMPLES.length) runSample(SAMPLES[current])
    else runLive()
  })

  // ---- init ----
  var head = $('#sheet-head')
  T.cols.forEach(function (c, i) { head.appendChild(el('th', i === 3 || i === 4 ? 'num' : null, c)) })
  Object.keys(sysEls).forEach(function (k) { sysEls[k].textContent = T.sys[k] })
  renderEmptySheet()
  renderList()
  renderReader()
  stepsEl.appendChild(el('li', 'placeholder', T.pick))
  resultBody.appendChild(el('p', 'placeholder', T.resultIdle))
  setPill(agentPill, 'idle')
  setPill(resultPill, 'idle')
})()
