// Construction demo, agent 1 (/demo/construction, /lt/demo/statyba): an enquiry email becomes a priced estimate, questions, a site visit or a polite refusal.
// Everything runs in the visitor's browser on example enquiries and an editable price list: nothing is sent anywhere and no AI service is called.
// The reading of the email is a small set of rules (work type, area, town, deadline, budget), the price comes from the price list on the page, the decision from the rules on the page.
// Around that: a week calendar the agent proposes site-visit slots from (and the visitor can book), a printable quotation, finish level and VAT options, time on site, a pipeline view.
(function () {
  'use strict'
  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var COMPANY = 'Nova Statyba'
  var LIMIT = 15000, WASTE = 0.04, LOW = 0.92, HIGH = 1.12, VAT = 0.21
  var DEFAULT_RATES = { bathroom: 700, kitchen: 380, painting: 18, flooring: 45, roof: 85 }
  var JOB_ORDER = ['bathroom', 'kitchen', 'painting', 'flooring', 'roof']
  var DUR = { bathroom: [5, 1.4], kitchen: [4, 0.8], painting: [1, 0.06], flooring: [1, 0.15], roof: [2, 0.12] }          // working days on site: a base plus days per m²
  var SLOTS = ['09:00', '11:00', '14:00', '16:00']
  var BUSY = { '0-0': 1, '0-2': 1, '1-1': 1, '2-0': 1, '2-1': 1, '2-3': 1, '3-2': 1, '4-0': 1, '4-1': 1, '4-2': 1 }          // day-slot pairs that are already taken in the example calendar

  var COPY = {
    en: {
      from: 'From', subject: 'Subject', run: 'Run the agent', rerun: 'Run again', own: 'Your own enquiry', ownSubj: 'Paste an enquiry',
      idle: 'Idle', busy: 'Working', done: 'Done',
      sys: { mail: 'Mailbox', prices: 'Price list', rules: 'Your rules', calendar: 'Calendar', sheet: 'Jobs.xlsx' },
      jobs: {
        bathroom: { name: 'Bathroom renovation', q: 'How large is the bathroom floor in m²?' },
        kitchen: { name: 'Kitchen renovation', q: 'How large is the kitchen in m²?' },
        painting: { name: 'Painting', q: 'How large is the area to be painted, in m² of floor space?' },
        flooring: { name: 'New flooring', q: 'How large is the floor to be replaced, in m²?' },
        roof: { name: 'Roof work', q: 'How large is the roof in m²?' },
        extension: { name: 'House extension', q: '' }
      },
      qWork: 'What work would you like done (for example a bathroom or kitchen renovation, painting, new flooring)?',
      qPlace: 'In which town is the property?',
      sRead: 'Read the enquiry (from {name})', sFound: 'Found: {parts}', sMissing: 'Missing: {parts}',
      mWork: 'type of work', mArea: 'area', mPlace: 'town',
      sPrice: 'Priced the work from your price list: {total}', sNoPrice: 'Not enough information to price the work', sTime: 'Planned the time on site: about {n} working days',
      sRules: 'Checked your rules: area served, quote limit', sOutside: 'Outside your service area ({place})', sBig: 'Too big to quote by email: a site visit is needed',
      sCal: 'Checked your calendar: {s1} and {s2} are free for a site visit', sCalNone: 'Checked your calendar: no free slot this week',
      sSheet: 'Added the enquiry to Jobs.xlsx', sDraft: 'Wrote the reply for you to approve',
      estimate: 'Estimate', waste: 'Waste removal and cleanup', rangeLine: 'Estimate', prelimTag: 'first estimate', timeOnSite: 'Time on site', daysN: 'about {n} working days',
      vatEx: 'excl. VAT', vatIn: 'incl. VAT',
      summary: {
        quote: 'Estimate ready: {low} to {high} ({vat}). It is within your rules, so the reply can go out as soon as you approve it.',
        questions: 'Not enough information for a price. The agent asks for what is missing before it quotes.',
        visit: 'This job is too big to quote by email. The agent proposes a free site visit instead.',
        declined: 'Outside your service area. The agent writes a polite refusal.'
      },
      missing: 'Questions the agent asks', reply: 'Reply to the customer', to: 'To', approve: 'Approve and send', edit: 'Edit', editDone: 'Done editing',
      toast: 'In the real system this reply would be sent now.',
      status: { quote: 'Quote ready', questions: 'Questions sent', visit: 'Site visit', declined: 'Declined', booked: 'Visit booked' },
      next: { quote: 'Waiting for the customer', questions: 'Waiting for answers', visit: 'Book the site visit', declined: 'Closed, outside area', booked: 'Visit on {slot}' },
      head: ['#', 'Customer', 'Work', 'Location', 'Area', 'Estimate', 'Status', 'Next step'],
      emptyRow: 'No enquiries yet. Run the agent on an email.', visitCell: 'after visit', noneCell: 'n/a',
      subj: 'RE: ', unitPer: 'per m²', reset: 'Reset prices',
      optFinish: 'Finish level', optStd: 'Standard', optPrem: 'Premium (+25%)', optVat: 'Show prices incl. 21% VAT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], dayHead: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      calFree: 'free', calBusy: 'booked', calProp: 'proposed', calMine: 'Visit: {who}', calTitleAria: 'Site visit calendar',
      bookedToast: 'Visit booked: {slot}. In the real system the customer gets a confirmation and your calendar is updated.',
      quoteBtn: 'Open the quote as a document', quoteTitle: 'Indicative quotation', qRef: 'Reference', qDate: 'Date', qValid: 'Valid until', qFor: 'Prepared for',
      qItem: 'Item', qArea: 'Area', qAmount: 'Amount', qSub: 'Subtotal', qVatL: 'VAT 21%', qTot: 'Total', qFinish: 'Finish level', qPrint: 'Print or save as PDF', qClose: 'Close',
      qNotes: ['This is an indicative estimate based on your enquiry. The final price is confirmed after a free site visit.', 'Prices include labour and standard materials.', 'Not included: building permits, furniture and appliances.', 'Valid for 30 days.'],
      kpiN: 'enquiries', kpiQ: 'quotes ready', kpiV: 'site visits', kpiP: 'pipeline value (excl. VAT)', viewTable: 'Table', viewBoard: 'Board',
      colQuote: 'Quote ready', colAsk: 'Waiting for customer', colVisit: 'Site visit', colClosed: 'Closed',
      reply_: {
        hello: 'Hello,', bye: 'Best regards,',
        thanks: 'Thank you for your enquiry.',
        quoteIntro: 'Based on what you wrote, this is our estimate:', place: 'Location', finish: 'Finish level: premium', daysLine: 'Expected time on site: about {n} working days.',
        total: 'Estimate: {low} to {high} ({vat})',
        budgetOk: 'This fits within your budget of {budget}.',
        budgetClose: 'Your budget of {budget} is within this range, so we can plan the work to stay at or below it.',
        budgetLow: 'Your budget of {budget} is below this estimate. We can look at a smaller scope, for example keeping existing fixtures, to get closer to it.',
        timeDate: 'You mentioned "{t}", so we will check our calendar for that.', timeSeason: 'You mentioned "{t}", so we can plan the work for then.', timeFlex: 'There is no rush, so we can plan the work for a quiet period.',
        next: 'If this works for you, reply to this email and we will book a free site visit to confirm the price and agree the start date.',
        qIntro: 'To give you a price we need a little more information:',
        prelim: 'For the work you have described so far, a first estimate is {low} to {high} ({vat}). The final price will depend on your answers.',
        visit: 'The price of a job this size depends on the foundation, the design and permits, so we do not quote it by email. We would be glad to visit the site free of charge. We have these times free:',
        which: 'Which one suits you?',
        declined: 'Unfortunately we only work in Vilnius, Kaunas, Klaipėda, Šiauliai and Panevėžys, so we cannot take this job. We wish you the best of luck with the project.'
      },
      samples: [
        { id: 's1', fromName: 'Anna Jones', fromEmail: 'anna.jones@example.com', subject: 'Bathroom renovation in Vilnius', time: '08:42',
          body: 'Hello,\n\nWe bought a flat in Vilnius (Žirmūnai) and want the bathroom redone completely: new tiles, toilet, shower, plumbing and electrics. The bathroom is about 5.5 m². We would like it finished before the end of April. Our budget is around 4,500 EUR. I can send photos if that helps.\n\nThanks,\nAnna' },
        { id: 's2', fromName: 'Tomas Petrauskas', fromEmail: 'tomas.p@example.com', subject: 'House painting and a new floor', time: '09:15',
          body: 'Hi,\n\nI need the whole house repainted and the floor in the living room replaced. The house is in Kaunas and has 120 m². The living room is quite big, I have not measured it. There is no rush, maybe in the summer.\n\nBest,\nTomas' },
        { id: 's3', fromName: 'Mindaugas Jonaitis', fromEmail: 'mindaugas.j@example.com', subject: 'Extension to our house', time: '10:03',
          body: 'Hello,\n\nWe would like to build an extension of about 30 m² to our house near Panevėžys: two rooms and a bathroom. Do you do this, and what would it cost?\n\nMindaugas' },
        { id: 's4', fromName: 'Jonas', fromEmail: 'jonas@example.com', subject: 'Renovation price?', time: '11:20',
          body: 'Hi, how much would it cost to renovate my house?\n\nThanks,\nJonas' },
        { id: 's5', fromName: 'Kristjan Tamm', fromEmail: 'kristjan@example.ee', subject: 'Kitchen renovation in Tallinn', time: '12:05',
          body: 'Hello,\n\nI would like a quote for renovating my kitchen, about 12 m², in Tallinn. We would like to start in June.\n\nKristjan' }
      ]
    },
    lt: {
      from: 'Nuo', subject: 'Tema', run: 'Paleisti agentą', rerun: 'Paleisti iš naujo', own: 'Jūsų užklausa', ownSubj: 'Įklijuokite užklausą',
      idle: 'Laukia', busy: 'Dirba', done: 'Baigta',
      sys: { mail: 'Paštas', prices: 'Kainoraštis', rules: 'Jūsų taisyklės', calendar: 'Kalendorius', sheet: 'Jobs.xlsx' },
      jobs: {
        bathroom: { name: 'Vonios kambario remontas', q: 'Koks vonios kambario plotas kv. m?' },
        kitchen: { name: 'Virtuvės remontas', q: 'Koks virtuvės plotas kv. m?' },
        painting: { name: 'Dažymo darbai', q: 'Koks dažomų patalpų plotas kv. m?' },
        flooring: { name: 'Grindų keitimas', q: 'Koks keičiamų grindų plotas kv. m?' },
        roof: { name: 'Stogo darbai', q: 'Koks stogo plotas kv. m?' },
        extension: { name: 'Priestato statyba', q: '' }
      },
      qWork: 'Kokius darbus norite atlikti (pavyzdžiui, vonios kambario ar virtuvės remontą, dažymą, grindų keitimą)?',
      qPlace: 'Kuriame mieste yra objektas?',
      sRead: 'Perskaitytas užklausos laiškas (siuntėjas: {name})', sFound: 'Rasta: {parts}', sMissing: 'Trūksta: {parts}',
      mWork: 'darbų rūšies', mArea: 'ploto', mPlace: 'miesto',
      sPrice: 'Darbai įkainoti pagal jūsų kainoraštį: {total}', sNoPrice: 'Per mažai informacijos kainai apskaičiuoti', sTime: 'Suplanuota trukmė objekte: apie {n} darbo d.',
      sRules: 'Patikrintos jūsų taisyklės: aptarnaujama teritorija, kainos riba', sOutside: 'Už jūsų aptarnaujamos teritorijos ribų ({place})', sBig: 'Per didelis darbas kainai el. paštu: reikia apžiūros',
      sCal: 'Patikrintas jūsų kalendorius: {s1} ir {s2} laisva apžiūrai', sCalNone: 'Patikrintas jūsų kalendorius: šią savaitę laisvų laikų nėra',
      sSheet: 'Užklausa įrašyta į Jobs.xlsx', sDraft: 'Parašytas atsakymas jūsų patvirtinimui',
      estimate: 'Įvertinimas', waste: 'Atliekų išvežimas ir sutvarkymas', rangeLine: 'Įvertinimas', prelimTag: 'pirminis įvertinimas', timeOnSite: 'Trukmė objekte', daysN: 'apie {n} darbo d.',
      vatEx: 'be PVM', vatIn: 'su PVM',
      summary: {
        quote: 'Kaina paruošta: nuo {low} iki {high} ({vat}). Užklausa atitinka jūsų taisykles, todėl atsakymas gali būti išsiųstas, kai jį patvirtinsite.',
        questions: 'Kainai trūksta informacijos. Prieš pateikdamas kainą agentas paklausia to, ko trūksta.',
        visit: 'Šio darbo kainos el. paštu nenurodome. Agentas vietoje to siūlo nemokamą apžiūros vizitą.',
        declined: 'Objektas už jūsų aptarnaujamos teritorijos ribų. Agentas parašo mandagų atsisakymą.'
      },
      missing: 'Klausimai, kuriuos užduoda agentas', reply: 'Atsakymas klientui', to: 'Kam', approve: 'Patvirtinti ir siųsti', edit: 'Redaguoti', editDone: 'Baigti redaguoti',
      toast: 'Tikroje sistemoje šis atsakymas dabar būtų išsiųstas.',
      status: { quote: 'Kaina paruošta', questions: 'Klausimai išsiųsti', visit: 'Reikalinga apžiūra', declined: 'Atsisakyta', booked: 'Apžiūra suderinta' },
      next: { quote: 'Laukiama kliento', questions: 'Laukiama atsakymų', visit: 'Suderinti apžiūros laiką', declined: 'Uždaryta, ne mūsų teritorija', booked: 'Apžiūra: {slot}' },
      head: ['#', 'Klientas', 'Darbai', 'Vieta', 'Plotas', 'Kaina', 'Būsena', 'Kitas žingsnis'],
      emptyRow: 'Užklausų dar nėra. Paleiskite agentą su laišku.', visitCell: 'po apžiūros', noneCell: 'nėra',
      subj: 'Re: ', unitPer: 'už kv. m', reset: 'Atkurti kainas',
      optFinish: 'Apdailos lygis', optStd: 'Standartinis', optPrem: 'Aukštesnis (+25 %)', optVat: 'Rodyti kainas su 21 % PVM',
      days: ['pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį'], dayHead: ['Pr', 'An', 'Tr', 'Kt', 'Pn'],
      calFree: 'laisva', calBusy: 'užimta', calProp: 'pasiūlyta', calMine: 'Apžiūra: {who}', calTitleAria: 'Apžiūrų kalendorius',
      bookedToast: 'Apžiūra suderinta: {slot}. Tikroje sistemoje klientas gauna patvirtinimą, o jūsų kalendorius atnaujinamas.',
      quoteBtn: 'Atidaryti pasiūlymą kaip dokumentą', quoteTitle: 'Orientacinis pasiūlymas', qRef: 'Nr.', qDate: 'Data', qValid: 'Galioja iki', qFor: 'Parengta klientui',
      qItem: 'Darbai', qArea: 'Plotas', qAmount: 'Suma', qSub: 'Tarpinė suma', qVatL: 'PVM 21 %', qTot: 'Iš viso', qFinish: 'Apdailos lygis', qPrint: 'Spausdinti arba išsaugoti PDF', qClose: 'Uždaryti',
      qNotes: ['Tai orientacinis įvertinimas pagal jūsų užklausą. Galutinė kaina patvirtinama po nemokamo apžiūros vizito.', 'Kainos apima darbą ir standartines medžiagas.', 'Neįtraukta: statybos leidimai, baldai ir buitinė technika.', 'Galioja 30 dienų.'],
      kpiN: 'užklausos', kpiQ: 'paruoštos kainos', kpiV: 'apžiūros', kpiP: 'galimų užsakymų vertė (be PVM)', viewTable: 'Lentelė', viewBoard: 'Lenta',
      colQuote: 'Kaina paruošta', colAsk: 'Laukiama kliento', colVisit: 'Apžiūra', colClosed: 'Uždaryta',
      reply_: {
        hello: 'Sveiki,', bye: 'Pagarbiai,',
        thanks: 'Dėkojame už užklausą.',
        quoteIntro: 'Remdamiesi jūsų laišku, parengėme tokį įvertinimą:', place: 'Vieta', finish: 'Apdailos lygis: aukštesnis', daysLine: 'Numatoma trukmė objekte: apie {n} darbo d.',
        total: 'Įvertinimas: nuo {low} iki {high} ({vat})',
        budgetOk: 'Ši suma telpa į jūsų nurodytą biudžetą ({budget}).',
        budgetClose: 'Jūsų nurodytas biudžetas ({budget}) patenka į šį intervalą, todėl galime suplanuoti darbus taip, kad jo neviršytume.',
        budgetLow: 'Jūsų nurodytas biudžetas ({budget}) mažesnis už šį įvertinimą. Galime aptarti mažesnę darbų apimtį, pavyzdžiui, palikti esamą santechniką, kad priartėtume prie jo.',
        timeDate: 'Minėjote terminą „{t}“, todėl patikrinsime savo grafiką.', timeSeason: 'Minėjote „{t}“, todėl galėsime suplanuoti darbus tam laikui.', timeFlex: 'Skubėti nereikia, todėl galėsime suplanuoti darbus patogiu laiku.',
        next: 'Jei tai tinka, atsakykite į šį laišką: susitarsime dėl nemokamo apžiūros vizito, kad patvirtintume kainą ir suderintume darbų pradžią.',
        qIntro: 'Kad galėtume pateikti kainą, reikia šiek tiek daugiau informacijos:',
        prelim: 'Daliai jau aprašytų darbų pirminis įvertinimas yra nuo {low} iki {high} ({vat}). Galutinė kaina priklausys nuo jūsų atsakymų.',
        visit: 'Tokio dydžio darbų kaina priklauso nuo pamatų, projekto ir leidimų, todėl jos el. paštu nenurodome. Mielai nemokamai apžiūrėtume objektą. Turime laisvus laikus:',
        which: 'Kuris jums tinka?',
        declined: 'Deja, dirbame tik Vilniuje, Kaune, Klaipėdoje, Šiauliuose ir Panevėžyje, todėl šio objekto imtis negalime. Linkime sėkmės įgyvendinant projektą.'
      },
      samples: [
        { id: 's1', fromName: 'Ona Petraitė', fromEmail: 'ona.petraite@example.com', subject: 'Vonios kambario remontas Vilniuje', time: '08:42',
          body: 'Sveiki,\n\nĮsigijome butą Vilniuje (Žirmūnuose) ir norime visiškai atnaujinti vonios kambarį: nauja plytelių danga, unitazas, dušas, vamzdynai ir elektra. Vonios kambario plotas apie 5,5 kv. m. Norėtume viską baigti iki balandžio pabaigos. Biudžetas apie 4 500 eurų. Galiu atsiųsti nuotraukų.\n\nAčiū,\nOna' },
        { id: 's2', fromName: 'Tomas Kazlauskas', fromEmail: 'tomas.k@example.com', subject: 'Namo dažymas ir grindys', time: '09:15',
          body: 'Sveiki,\n\nReikia perdažyti visą namą ir pakeisti grindis svetainėje. Namas yra Kaune, jo plotas 120 kv. m. Svetainės dydžio dar neišmatavau. Nesiskubiname, galbūt vasarą.\n\nPagarbiai,\nTomas' },
        { id: 's3', fromName: 'Mindaugas Jonaitis', fromEmail: 'mindaugas.j@example.com', subject: 'Priestato statyba', time: '10:03',
          body: 'Sveiki,\n\nNorėtume prie savo namo prie Panevėžio pristatyti apie 30 kv. m priestatą: du kambariai ir vonia. Ar tuo užsiimate ir kiek tai kainuotų?\n\nMindaugas' },
        { id: 's4', fromName: 'Jonas', fromEmail: 'jonas@example.com', subject: 'Kiek kainuoja remontas?', time: '11:20',
          body: 'Sveiki, kiek kainuotų atnaujinti mano namą?\n\nAčiū,\nJonas' },
        { id: 's5', fromName: 'Kristjan Tamm', fromEmail: 'kristjan@example.ee', subject: 'Virtuvės remontas Taline', time: '12:05',
          body: 'Sveiki,\n\nNorėčiau pasiūlymo virtuvės remontui, apie 12 kv. m, Taline. Pradėti norėtume birželį.\n\nKristjan' }
      ]
    }
  }
  var T = COPY[LANG], R = T.reply_
  var nf = new Intl.NumberFormat(LANG === 'lt' ? 'lt-LT' : 'en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  function fmt(n) { return nf.format(Math.round(n)) }
  function fmtArea(a) { return LANG === 'lt' ? String(a).replace('.', ',') + ' kv. m' : a + ' m²' }
  function round10(n) { return Math.round(n / 10) * 10 }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m }) }
  function pad(n) { return (n < 10 ? '0' : '') + n }

  // ---- reading the email ----
  var JOBS = {
    bathroom: { kw: /bathroom|shower|toilet|\bwc\b|vonios|vonia|dušo|dušas|tualet/, hint: /bathroom|shower|toilet|vonios|vonia|dušo|dušas|tualet/ },
    kitchen: { kw: /kitchen|virtuv/, hint: /kitchen|virtuv/ },
    painting: { kw: /paint|dažy|dažym|dažo/, hint: /house|flat|apartment|home|whole|walls|paint|nam[aąoų]|butas|buto|butą|visą|sien|dažy|dažym/ },
    flooring: { kw: /\bfloor|laminate|parquet|grind|parket/, hint: /floor|living|room|hall|laminate|grind|svetain|kambar|salon/ },
    roof: { kw: /\broof|stog/, hint: /roof|stog/ },
    extension: { kw: /extension|priestat/, hint: /extension|priestat/ }
  }
  var PLACES = [
    { re: /vilni/, name: 'Vilnius', ok: true }, { re: /kaun/, name: 'Kaunas', ok: true }, { re: /klaipėd|klaiped/, name: 'Klaipėda', ok: true },
    { re: /šiaul|siaul/, name: 'Šiauliai', ok: true }, { re: /panevėž|panevez/, name: 'Panevėžys', ok: true },
    { re: /alyt/, name: 'Alytus', ok: false }, { re: /tallin|talin/, name: 'Tallinn', ok: false }, { re: /\briga\b|rygo|rygoj/, name: 'Riga', ok: false }
  ]
  var MONTH_EN = 'january|february|march|april|may|june|july|august|september|october|november|december'
  var MONTH_LT = 'sausi|vasari|kov[oąa]|balandž|gegužė|birželi|liepos|liepą|rugpjūč|rugsėj|spal(?:io|į)|lapkrič|gruod'
  var RE_DATE_EN = new RegExp('\\b((?:by|before|until|in|start in|from)\\s+(?:the\\s+)?(?:(?:end|middle|beginning) of\\s+)?(?:' + MONTH_EN + '))\\b', 'i')
  var RE_DATE_LT = new RegExp('((?:iki\\s+)?\\S*(?:' + MONTH_LT + ')\\S*(?:\\s+(?:pabaigos|vidurio|pradžios))?)', 'i')

  function canon(t) { return t.replace(/²/g, '2').replace(/\bkv\.\s?m\b/gi, 'm2').replace(/\bsq\.?\s?m\b/gi, 'm2').replace(/m\^2/gi, 'm2') }
  function sentences(t) { return t.replace(/([.!?])\s+/g, '$1\u0001').split(/\u0001|\n+/) }
  function areaIn(s) { var m = s.match(/(\d+(?:[.,]\d+)?)\s*m2/i); return m ? parseFloat(m[1].replace(',', '.')) : null }

  function analyse(raw) {
    var text = canon(raw), low = text.toLowerCase(), sents = sentences(low)
    var ids = Object.keys(JOBS).filter(function (id) { return JOBS[id].kw.test(low) })
    if (ids.indexOf('extension') >= 0) ids = ['extension']          // an extension includes its rooms and bathroom
    var withArea = sents.filter(function (s) { return areaIn(s) != null })
    var jobs = ids.map(function (id) {
      var s = withArea.filter(function (x) { return JOBS[id].hint.test(x) })[0], area = s ? areaIn(s) : null
      if (area == null && ids.length === 1 && withArea.length === 1) area = areaIn(withArea[0])
      return { id: id, area: area }
    })
    var place = null
    PLACES.forEach(function (p) { if (!place && p.re.test(low)) place = p })
    var deadline = null, m
    if ((m = text.match(RE_DATE_EN)) && LANG === 'en') deadline = { text: m[1], kind: 'date' }
    else if ((m = text.match(RE_DATE_LT)) && LANG === 'lt') deadline = { text: m[1], kind: 'date' }
    else if ((m = low.match(/\b(summer|spring|autumn|winter)\b/))) deadline = { text: m[1], kind: 'season' }
    else if ((m = low.match(/(vasar[ąa]|pavasar\S*|ruden\S*|žiem\S*)/))) deadline = { text: m[1], kind: 'season' }
    else if (/no rush|not in a hurry|flexible|nesiskub|neskub/.test(low)) deadline = { text: '', kind: 'flex' }
    var bm = text.match(/€\s?(\d{1,3}(?:[\s .,]\d{3})+|\d{3,6})|(\d{1,3}(?:[\s .,]\d{3})+|\d{3,6})\s*(?:eur|€|euro)/i)
    var budget = bm ? parseInt((bm[1] || bm[2]).replace(/\D/g, ''), 10) : null
    return { jobs: jobs, place: place, deadline: deadline, budget: budget, photos: /photo|picture|nuotrauk/i.test(low) }
  }

  // ---- options, pricing and the decision ----
  var rates = {}, opts = { finish: 'standard', vat: false }
  function resetRates() { JOB_ORDER.forEach(function (id) { rates[id] = DEFAULT_RATES[id] }) }
  resetRates()
  var fm = function () { return opts.finish === 'premium' ? 1.25 : 1 }, vm = function () { return opts.vat ? 1 + VAT : 1 }
  function vatWord() { return opts.vat ? T.vatIn : T.vatEx }

  function estimate(a) {
    var lines = [], raw = [], sum = 0, days = 0
    a.jobs.forEach(function (j) {
      if (j.area && rates[j.id] != null) {
        var c = j.area * rates[j.id] * fm()
        lines.push({ id: j.id, area: j.area, amount: c * vm() }); raw.push({ id: j.id, area: j.area, amount: c }); sum += c
        days += Math.ceil(DUR[j.id][0] + DUR[j.id][1] * j.area)
      }
    })
    if (!lines.length) return null
    var net = sum * (1 + WASTE)
    return { lines: lines, raw: raw, waste: sum * WASTE * vm(), wasteRaw: sum * WASTE, net: net, low: round10(round10(net * LOW) * vm()), high: round10(round10(net * HIGH) * vm()), lowRaw: round10(net * LOW), highRaw: round10(net * HIGH), days: Math.ceil(days * (opts.finish === 'premium' ? 1.2 : 1)) }
  }
  function decide(a, est) {
    var missing = []
    if (!a.jobs.length) missing.push({ k: 'work', q: T.qWork })
    a.jobs.forEach(function (j) { if (!j.area && j.id !== 'extension') missing.push({ k: 'area', q: T.jobs[j.id].q }) })
    if (!a.place) missing.push({ k: 'place', q: T.qPlace })
    var ext = a.jobs.some(function (j) { return j.id === 'extension' }), big = est && est.net > LIMIT, status
    if (a.place && !a.place.ok) status = 'declined'
    else if (a.place && (ext || big)) status = 'visit'
    else if (missing.length) status = 'questions'
    else status = 'quote'
    return { status: status, missing: missing, big: Boolean(big), ext: ext }
  }
  function jobNames(a) { return a.jobs.map(function (j) { return T.jobs[j.id].name }) }

  // ---- the calendar the agent proposes site visits from ----
  var booked = {}, proposed = {}          // booked: 'day-slot' -> who; proposed: sample id -> ['day-slot', ...]
  function isTaken(k) { return BUSY[k] || booked[k] }
  function slotName(k) { var p = k.split('-'); return T.days[+p[0]] + ' ' + SLOTS[+p[1]] }
  function propose(id) {
    var out = [], usedDay = {}
    for (var d = 0; d < 5 && out.length < 2; d++) {
      for (var s = 0; s < 4; s++) {
        var k = d + '-' + s
        if (!isTaken(k) && !usedDay[d] && !Object.keys(proposed).some(function (o) { return o !== id && proposed[o].indexOf(k) >= 0 })) { out.push(k); usedDay[d] = 1; break }
      }
    }
    proposed[id] = out
    return out
  }

  // ---- reply text ----
  function replyFor(a, est, d, slots) {
    var out = [R.hello, '', R.thanks, '']
    if (d.status === 'quote') {
      out.push(R.quoteIntro, '')
      est.lines.forEach(function (l) { out.push('- ' + T.jobs[l.id].name + ', ' + fmtArea(l.area) + ': ' + fmt(l.amount)) })
      out.push('- ' + T.waste + ': ' + fmt(est.waste), R.place + ': ' + a.place.name)
      if (opts.finish === 'premium') out.push(R.finish)
      out.push(fill(R.daysLine, { n: est.days }), '', fill(R.total, { low: fmt(est.low), high: fmt(est.high), vat: vatWord() }), '')
      if (a.budget) out.push(fill(a.budget >= est.high ? R.budgetOk : a.budget >= est.low ? R.budgetClose : R.budgetLow, { budget: fmt(a.budget) }), '')
      if (a.deadline) out.push(a.deadline.kind === 'date' ? fill(R.timeDate, { t: a.deadline.text }) : a.deadline.kind === 'season' ? fill(R.timeSeason, { t: a.deadline.text }) : R.timeFlex, '')
      out.push(R.next)
    } else if (d.status === 'questions') {
      out.push(R.qIntro, '')
      d.missing.forEach(function (m, i) { out.push((i + 1) + '. ' + m.q) })
      if (est) out.push('', fill(R.prelim, { low: fmt(est.low), high: fmt(est.high), vat: vatWord() }))
    } else if (d.status === 'visit') {
      out.push(R.visit, '')
      slots.forEach(function (k) { out.push('- ' + slotName(k)) })
      out.push('', R.which)
    } else out.push(R.declined)
    out.push('', R.bye, COMPANY)
    return out.join('\n')
  }

  // ---- screen ----
  function $(s) { return document.querySelector(s) }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n }
  var list = $('#mail-list'), reader = $('#reader'), runBtn = $('#run'), stepsEl = $('#steps'), agentPill = $('#agent-pill'), resultBody = $('#result-body'), resultPill = $('#result-pill')
  var tbody = $('#sheet-body'), toast = $('#toast'), sysEls = {}
  document.querySelectorAll('[data-sys]').forEach(function (n) { n.textContent = T.sys[n.getAttribute('data-sys')]; sysEls[n.getAttribute('data-sys')] = n })
  var current = 0, busy = false, processed = {}, rows = [], ownText = '', last = {}, view = 'table'

  function renderList() {
    list.textContent = ''
    T.samples.concat([{ id: 'own', fromName: T.own, subject: T.ownSubj, time: '✎' }]).forEach(function (s, i) {
      var li = el('li'), b = el('button', 'mail-item' + (processed[s.id] ? ' processed' : ''))
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === current))
      var from = el('span', 'mail-from', s.fromName); from.appendChild(el('span', 'done-dot')); b.appendChild(from)
      b.appendChild(el('span', 'mail-time', s.time)); b.appendChild(el('span', 'mail-subj', s.subject))
      b.addEventListener('click', function () { if (!busy) { current = i; renderList(); renderReader() } })
      li.appendChild(b); list.appendChild(li)
    })
  }
  function renderReader() {
    reader.textContent = ''
    if (current < T.samples.length) {
      var s = T.samples[current], meta = el('div', 'reader-meta')
      meta.appendChild(el('b', null, T.from + ': ')); meta.appendChild(document.createTextNode(s.fromName + ' <' + s.fromEmail + '>')); meta.appendChild(el('br'))
      meta.appendChild(el('b', null, T.subject + ': ')); meta.appendChild(document.createTextNode(s.subject))
      reader.appendChild(meta); reader.appendChild(el('p', 'reader-body', s.body))
      runBtn.textContent = processed[s.id] ? T.rerun : T.run
    } else {
      var box = el('div', 'own'), ta = el('textarea')
      ta.id = 'own-text'; ta.maxLength = 3000; ta.placeholder = reader.getAttribute('data-placeholder'); ta.value = ownText
      ta.addEventListener('input', function () { ownText = ta.value })
      box.appendChild(ta); box.appendChild(el('p', 'hint', reader.getAttribute('data-privacy'))); reader.appendChild(box)
      runBtn.textContent = T.run
    }
  }
  function setPill(pill, state) { pill.className = 'pill' + (state === 'busy' ? ' working' : state === 'done' ? ' done' : ''); pill.lastChild.textContent = T[state] }
  function lightSys(key) { Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on') }); if (key && sysEls[key]) sysEls[key].classList.add('on', 'used') }
  function resetSys() { Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on', 'used') }) }
  function addStep(text, state) { var li = el('li', 'step ' + state); li.appendChild(el('span', 'ic')); li.appendChild(el('span', 'tx', text)); stepsEl.appendChild(li); return li }
  function finishStep(li, state) { li.className = 'step ' + (state || 'ok') }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.classList.remove('show') }, 3200) }

  function stepsFor(s, a, est, d, slots) {
    var st = [['mail', fill(T.sRead, { name: s.fromName }), 'ok']]
    var found = a.jobs.map(function (j) { return T.jobs[j.id].name + (j.area ? ' ' + fmtArea(j.area) : '') })
    if (a.place) found.push(a.place.name)
    if (a.deadline && a.deadline.text) found.push(a.deadline.text)
    if (a.budget) found.push(fmt(a.budget))
    st.push(['mail', found.length ? fill(T.sFound, { parts: found.join(', ') }) : fill(T.sMissing, { parts: T.mWork }), found.length ? 'ok' : 'err'])
    var gaps = []
    if (!a.jobs.length) gaps.push(T.mWork)
    if (a.jobs.some(function (j) { return !j.area && j.id !== 'extension' })) gaps.push(T.mArea)
    if (!a.place) gaps.push(T.mPlace)
    if (gaps.length && found.length) st.push(['mail', fill(T.sMissing, { parts: gaps.join(', ') }), 'err'])
    if (!d.ext && d.status !== 'declined') st.push(['prices', est ? fill(T.sPrice, { total: fmt(est.low) + ' - ' + fmt(est.high) }) : T.sNoPrice, est ? 'ok' : 'err'])
    if (est && d.status !== 'declined') st.push(['prices', fill(T.sTime, { n: est.days }), 'ok'])
    if (d.status === 'declined') st.push(['rules', fill(T.sOutside, { place: a.place.name }), 'err'])
    else if (d.status === 'visit') st.push(['rules', T.sBig, 'err'])
    else st.push(['rules', T.sRules, 'ok'])
    if (d.status === 'visit' || d.status === 'quote') st.push(['calendar', slots.length >= 2 ? fill(T.sCal, { s1: slotName(slots[0]), s2: slotName(slots[1]) }) : T.sCalNone, slots.length >= 2 ? 'ok' : 'err'])
    st.push(['sheet', T.sSheet, 'ok'], ['mail', T.sDraft, 'ok'])
    return st
  }

  function rowFor(s, a, est, d) {
    return { id: s.id, client: s.fromName, work: jobNames(a).join(', ') || '-', place: a.place ? a.place.name : '-',
      area: a.jobs.filter(function (j) { return j.area }).map(function (j) { return fmtArea(j.area) }).join(', ') || '-',
      est: d.status === 'visit' ? T.visitCell : d.status === 'declined' || !est ? T.noneCell : fmt(est.low) + ' - ' + fmt(est.high) + (d.status === 'questions' ? ' (' + T.prelimTag + ')' : ''),
      mid: est && (d.status === 'quote' || d.status === 'questions') ? Math.round((est.lowRaw + est.highRaw) / 2) : 0, status: d.status, visit: null }
  }

  // ---- the sheet, its numbers and the board ----
  function renderSheet(flashId) {
    tbody.textContent = ''
    if (!rows.length) { var tr0 = el('tr', 'empty-row'), td0 = el('td', null, T.emptyRow); td0.colSpan = 8; tr0.appendChild(td0); tbody.appendChild(tr0) }
    rows.forEach(function (r, i) {
      var tr = el('tr', r.id === flashId ? 'flash' : ''), cells = [i + 1, r.client, r.work, r.place, r.area, r.est]
      cells.forEach(function (c, k) { tr.appendChild(el('td', k === 0 ? 'no' : k === 5 ? 'num' : '', String(c))) })
      var st = el('td'); st.appendChild(el('span', 'status ' + (r.status === 'quote' || r.status === 'booked' ? 'ready' : r.status === 'questions' ? 'waiting' : 'review'), T.status[r.status])); tr.appendChild(st)
      tr.appendChild(el('td', null, fill(T.next[r.status], { slot: r.visit || '' }))); tbody.appendChild(tr)
    })
    renderKpi(); renderBoard()
  }
  function renderKpi() {
    var k = $('#kpi'); if (!k) return
    k.textContent = ''
    var q = rows.filter(function (r) { return r.status === 'quote' }).length, v = rows.filter(function (r) { return r.status === 'visit' || r.status === 'booked' }).length
    var pipe = rows.reduce(function (n, r) { return n + (r.mid || 0) }, 0)
    ;[[rows.length, T.kpiN], [q, T.kpiQ], [v, T.kpiV], [fmt(pipe), T.kpiP]].forEach(function (p) { var c = el('div', 'kpi-chip'); c.appendChild(el('b', null, String(p[0]))); c.appendChild(el('span', null, p[1])); k.appendChild(c) })
  }
  function renderBoard() {
    var b = $('#board'); if (!b) return
    b.textContent = ''
    var cols = [['quote', T.colQuote, ['quote']], ['questions', T.colAsk, ['questions']], ['visit', T.colVisit, ['visit', 'booked']], ['closed', T.colClosed, ['declined']]]
    cols.forEach(function (c) {
      var col = el('div', 'bcol'), items = rows.filter(function (r) { return c[2].indexOf(r.status) >= 0 })
      col.appendChild(el('div', 'bcol-h', c[1] + ' (' + items.length + ')'))
      items.forEach(function (r) {
        var card = el('div', 'bcard' + (r.status === 'booked' ? ' booked' : '')); card.appendChild(el('b', null, r.client)); card.appendChild(el('span', null, r.work + (r.place !== '-' ? ', ' + r.place : '')))
        card.appendChild(el('em', null, r.status === 'booked' ? fill(T.next.booked, { slot: r.visit }) : r.est)); col.appendChild(card)
      })
      b.appendChild(col)
    })
  }
  function setView(v) {
    view = v; $('#sheet-scroll').hidden = v !== 'table'; $('#board').hidden = v !== 'board'
    document.querySelectorAll('#view-toggle button').forEach(function (btn) { btn.setAttribute('aria-pressed', String(btn.getAttribute('data-view') === v)) })
  }

  // ---- the calendar panel ----
  function renderCalendar() {
    var host = $('#cal'); if (!host) return
    host.textContent = ''
    var tb = el('table', 'cal'), head = el('tr'); head.appendChild(el('th', null, ''))
    T.dayHead.forEach(function (d) { head.appendChild(el('th', null, d)) }); tb.appendChild(el('thead')).appendChild(head)
    var body = el('tbody')
    var cell = function (d, s) {          // one function per cell, so each click handler keeps its own slot
      var k = d + '-' + s, td = el('td'), who = booked[k], prop = Object.keys(proposed).filter(function (id) { return proposed[id].indexOf(k) >= 0 })[0]
      var b = el('button', 'cal-cell ' + (who ? 'mine' : BUSY[k] ? 'busy' : prop ? 'prop' : 'free'), who ? fill(T.calMine, { who: who }) : BUSY[k] ? T.calBusy : prop ? T.calProp : T.calFree)
      b.type = 'button'; b.disabled = !prop || Boolean(who)
      if (prop && !who) b.addEventListener('click', function () { book(prop, k) })
      td.appendChild(b); return td
    }
    SLOTS.forEach(function (time, s) {
      var tr = el('tr'); tr.appendChild(el('th', 'time', time))
      for (var d = 0; d < 5; d++) tr.appendChild(cell(d, s))
      body.appendChild(tr)
    })
    tb.appendChild(body); host.appendChild(tb)
  }
  function book(id, k) {
    var row = rows.filter(function (r) { return r.id === id })[0]
    booked[k] = row ? row.client : id; delete proposed[id]
    if (row) { row.status = 'booked'; row.visit = slotName(k) }
    renderCalendar(); renderSheet(id); showToast(fill(T.bookedToast, { slot: slotName(k) }))
    var note = $('#booked-note'); if (note) note.textContent = fill(T.next.booked, { slot: slotName(k) })
  }

  // ---- the quotation document ----
  function openQuote(s, a, est, d, n) {
    var old = $('.quote-modal'); if (old) old.remove()
    var today = new Date(), until = new Date(today.getTime() + 30 * 86400000), loc = LANG === 'lt' ? 'lt-LT' : 'en-GB'
    var modal = el('div', 'quote-modal'), sheet = el('div', 'quote-sheet'); modal.appendChild(sheet)
    var h = el('div', 'q-head'); h.appendChild(el('b', 'q-co', COMPANY)); h.appendChild(el('span', null, T.quoteTitle)); sheet.appendChild(h)
    var meta = el('div', 'q-meta')
    ;[[T.qRef, 'NS-' + today.getFullYear() + '-' + pad(n)], [T.qDate, today.toLocaleDateString(loc)], [T.qValid, until.toLocaleDateString(loc)], [T.qFor, s.fromName + (a.place ? ', ' + a.place.name : '')]].forEach(function (p) { var d1 = el('div'); d1.appendChild(el('span', null, p[0])); d1.appendChild(el('b', null, p[1])); meta.appendChild(d1) })
    sheet.appendChild(meta)
    var tb = el('table', 'q-table'), th = el('tr')
    ;[T.qItem, T.qArea, T.qAmount].forEach(function (x, i) { th.appendChild(el('th', i ? 'num' : '', x)) }); tb.appendChild(el('thead')).appendChild(th)
    var body = el('tbody')
    est.raw.forEach(function (l) { var tr = el('tr'); tr.appendChild(el('td', null, T.jobs[l.id].name)); tr.appendChild(el('td', 'num', fmtArea(l.area))); tr.appendChild(el('td', 'num', fmt(l.amount))); body.appendChild(tr) })
    var w = el('tr'); w.appendChild(el('td', null, T.waste)); w.appendChild(el('td', 'num', '')); w.appendChild(el('td', 'num', fmt(est.wasteRaw))); body.appendChild(w)
    if (opts.finish === 'premium') { var f = el('tr'); f.appendChild(el('td', null, T.qFinish + ': ' + T.optPrem.replace(/ \(.*/, ''))); f.appendChild(el('td', 'num', '')); f.appendChild(el('td', 'num', '')); body.appendChild(f) }
    var totLow = round10(est.lowRaw * (1 + VAT)), totHigh = round10(est.highRaw * (1 + VAT))
    ;[[T.qSub, fmt(est.lowRaw) + ' - ' + fmt(est.highRaw), 'q-sub'], [T.qVatL, fmt(totLow - est.lowRaw) + ' - ' + fmt(totHigh - est.highRaw), ''], [T.qTot, fmt(totLow) + ' - ' + fmt(totHigh), 'q-tot']].forEach(function (p) {
      var tr = el('tr', p[2]); var c1 = el('td', null, p[0]); c1.colSpan = 2; tr.appendChild(c1); tr.appendChild(el('td', 'num', p[1])); body.appendChild(tr)
    })
    tb.appendChild(body); sheet.appendChild(tb)
    var ul = el('ul', 'q-notes'); T.qNotes.forEach(function (x) { ul.appendChild(el('li', null, x)) }); sheet.appendChild(ul)
    sheet.appendChild(el('div', 'q-time', T.timeOnSite + ': ' + fill(T.daysN, { n: est.days })))
    var act = el('div', 'q-actions'), pr = el('button', 'btn btn-primary', T.qPrint), cl = el('button', 'btn btn-ghost', T.qClose); pr.type = 'button'; cl.type = 'button'
    pr.addEventListener('click', function () { window.print() }); cl.addEventListener('click', function () { modal.remove(); document.removeEventListener('keydown', esc) })
    function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc) } }
    document.addEventListener('keydown', esc)
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove() })
    act.appendChild(pr); act.appendChild(cl); sheet.appendChild(act); document.body.appendChild(modal); cl.focus()
  }

  function showResult(s, a, est, d, replyText, n) {
    resultBody.textContent = ''
    resultBody.appendChild(el('p', 'summary', fill(T.summary[d.status], est ? { low: fmt(est.low), high: fmt(est.high), vat: vatWord() } : {})))
    if (est && d.status !== 'visit' && d.status !== 'declined') {
      var card = el('div', 'est'), h = el('div', 'est-head', T.estimate + ' (' + vatWord() + ')' + (d.status === 'questions' ? ', ' + T.prelimTag : '') + (opts.finish === 'premium' ? ', ' + T.optPrem.replace(/ \(.*/, '').toLowerCase() : '')); card.appendChild(h)
      var tb = el('table', 'est-table')
      est.lines.forEach(function (l) { var tr = el('tr'); tr.appendChild(el('td', null, T.jobs[l.id].name + ', ' + fmtArea(l.area))); tr.appendChild(el('td', 'num', fmt(l.amount))); tb.appendChild(tr) })
      var w = el('tr'); w.appendChild(el('td', null, T.waste)); w.appendChild(el('td', 'num', fmt(est.waste))); tb.appendChild(w)
      var t = el('tr', 'est-total'); t.appendChild(el('td', null, T.rangeLine)); t.appendChild(el('td', 'num', fmt(est.low) + ' - ' + fmt(est.high))); tb.appendChild(t)
      var tm = el('tr'); tm.appendChild(el('td', null, T.timeOnSite)); tm.appendChild(el('td', 'num', fill(T.daysN, { n: est.days }))); tb.appendChild(tm)
      card.appendChild(tb); resultBody.appendChild(card)
      if (d.status === 'quote') { var qb = el('button', 'btn btn-ghost q-open', T.quoteBtn); qb.type = 'button'; qb.addEventListener('click', function () { openQuote(s, a, est, d, n) }); resultBody.appendChild(qb) }
    }
    if (d.status === 'questions' && d.missing.length) {
      var m = el('div', 'missing'); m.appendChild(el('b', null, T.missing)); var ul = el('ul')
      d.missing.forEach(function (x) { ul.appendChild(el('li', null, x.q)) }); m.appendChild(ul); resultBody.appendChild(m)
    }
    var rc = el('div', 'reply'), head = el('div', 'reply-head'); head.appendChild(el('span', null, T.reply))
    var to = el('span'); to.appendChild(el('b', null, T.to + ': ')); to.appendChild(document.createTextNode(s.fromEmail)); head.appendChild(to)
    var sj = el('span'); sj.appendChild(el('b', null, T.subject + ': ')); sj.appendChild(document.createTextNode(T.subj + s.subject)); head.appendChild(sj); rc.appendChild(head)
    var ta = el('textarea'); ta.readOnly = true; ta.value = replyText; rc.appendChild(ta)
    var actions = el('div', 'reply-actions'), ok = el('button', 'btn btn-primary', T.approve), ed = el('button', 'btn btn-ghost', T.edit)
    ok.type = 'button'; ed.type = 'button'
    ok.addEventListener('click', function () { showToast(T.toast) })
    ed.addEventListener('click', function () { ta.readOnly = !ta.readOnly; ed.textContent = ta.readOnly ? T.edit : T.editDone; if (!ta.readOnly) ta.focus() })
    actions.appendChild(ok); actions.appendChild(ed); rc.appendChild(actions); resultBody.appendChild(rc)
    var bn = el('p', 'note booked-note'); bn.id = 'booked-note'; resultBody.appendChild(bn)
  }

  function run() {
    if (busy) return
    var s
    if (current < T.samples.length) s = T.samples[current]
    else {
      var txt = (ownText || '').trim()
      if (txt.length < 15) { showToast(LANG === 'lt' ? 'Įklijuokite užklausos tekstą.' : 'Paste the text of an enquiry first.'); return }
      s = { id: 'own', fromName: T.own, fromEmail: 'customer@example.com', subject: T.ownSubj, body: txt }
    }
    busy = true; runBtn.disabled = true; stepsEl.textContent = ''; resultBody.textContent = ''; resetSys()
    setPill(agentPill, 'busy'); setPill(resultPill, 'idle')
    var a = analyse(s.body), est = estimate(a), d = decide(a, est)
    var slots = d.status === 'visit' || d.status === 'quote' ? propose(s.id) : (delete proposed[s.id], [])
    var reply = replyFor(a, est, d, slots), chain = Promise.resolve()
    stepsFor(s, a, est, d, slots).forEach(function (st) {
      chain = chain.then(function () {
        lightSys(st[0]); var li = addStep(st[1], 'work')
        return wait(520 + Math.random() * 300).then(function () {
          finishStep(li, st[2])
          if (st[0] === 'sheet') { var r = rowFor(s, a, est, d); rows = rows.filter(function (x) { return x.id !== s.id }); rows.push(r); renderSheet(s.id); renderCalendar() }
        })
      })
    })
    chain.then(function () {
      lightSys(null); var n = rows.map(function (r) { return r.id }).indexOf(s.id) + 1
      last = { s: s, a: a, est: est, d: d }
      showResult(s, a, est, d, reply, n); processed[s.id] = true
      setPill(agentPill, 'done'); setPill(resultPill, 'done'); busy = false; runBtn.disabled = false; renderList(); renderReader()
    })
  }

  // ---- price list and options ----
  function renderPrices() {
    var body = $('#price-body'); if (!body) return
    body.textContent = ''
    JOB_ORDER.forEach(function (id) {
      var tr = el('tr'); tr.appendChild(el('td', null, T.jobs[id].name)); tr.appendChild(el('td', 'unit', T.unitPer))
      var td = el('td', 'num'), inp = el('input'); inp.type = 'number'; inp.min = '0'; inp.step = '5'; inp.value = rates[id]; inp.setAttribute('aria-label', T.jobs[id].name)
      inp.addEventListener('input', function () { var v = parseFloat(inp.value); rates[id] = isFinite(v) && v >= 0 ? v : 0 })
      td.appendChild(inp); td.appendChild(document.createTextNode(' €')); tr.appendChild(td); body.appendChild(tr)
    })
    var reset = $('#price-reset'); if (reset) { reset.textContent = T.reset; reset.onclick = function () { resetRates(); renderPrices() } }
  }
  function initOptions() {
    var f = $('#opt-finish'), v = $('#opt-vat')
    if (f) { f.textContent = ''; [['standard', T.optStd], ['premium', T.optPrem]].forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; f.appendChild(op) }); f.addEventListener('change', function () { opts.finish = f.value }) }
    if (v) v.addEventListener('change', function () { opts.vat = v.checked })
    var lf = $('#opt-finish-l'), lv = $('#opt-vat-l'); if (lf) lf.textContent = T.optFinish; if (lv) lv.textContent = T.optVat
  }

  // ---- start ----
  var head = $('#sheet-head'); if (head) T.head.forEach(function (h, i) { head.appendChild(el('th', i === 5 ? 'num' : '', h)) })
  var vt = $('#view-toggle'); if (vt) { vt.querySelectorAll('button').forEach(function (b) { b.textContent = b.getAttribute('data-view') === 'table' ? T.viewTable : T.viewBoard; b.addEventListener('click', function () { setView(b.getAttribute('data-view')) }) }) }
  runBtn.addEventListener('click', run)
  setPill(agentPill, 'idle'); setPill(resultPill, 'idle')
  renderList(); renderReader(); renderSheet(); renderPrices(); initOptions(); renderCalendar(); setView('table')
})()
