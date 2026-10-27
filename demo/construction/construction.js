// Construction demo (/demo/construction, /lt/demo/statyba): an enquiry email becomes a priced estimate, questions, a site visit or a polite refusal.
// Everything runs in the visitor's browser on example enquiries and an editable price list: nothing is sent anywhere and no AI service is called.
// The reading of the email is a small set of rules (work type, area, town, deadline, budget), the price comes from the price list on the page, the decision from the rules on the page.
(function () {
  'use strict'
  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var COMPANY = 'Nova Statyba'
  var LIMIT = 15000, WASTE = 0.04, LOW = 0.92, HIGH = 1.12
  var DEFAULT_RATES = { bathroom: 700, kitchen: 380, painting: 18, flooring: 45, roof: 85 }
  var JOB_ORDER = ['bathroom', 'kitchen', 'painting', 'flooring', 'roof']

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
      sPrice: 'Priced the work from your price list: {total}', sNoPrice: 'Not enough information to price the work',
      sRules: 'Checked your rules: area served, quote limit', sOutside: 'Outside your service area ({place})', sBig: 'Too big to quote by email: a site visit is needed',
      sCal: 'Checked your calendar: Tue 10:00 and Thu 14:00 are free for a site visit',
      sSheet: 'Added the enquiry to Jobs.xlsx', sDraft: 'Wrote the reply for you to approve',
      estimate: 'Estimate', waste: 'Waste removal and cleanup', rangeLine: 'Estimate, excl. VAT', prelimTag: 'first estimate',
      summary: {
        quote: 'Estimate ready: {low} to {high} (excl. VAT). It is within your rules, so the reply can go out as soon as you approve it.',
        questions: 'Not enough information for a price. The agent asks for what is missing before it quotes.',
        visit: 'This job is too big to quote by email. The agent proposes a free site visit instead.',
        declined: 'Outside your service area. The agent writes a polite refusal.'
      },
      missing: 'Questions the agent asks', reply: 'Reply to the customer', to: 'To', approve: 'Approve and send', edit: 'Edit', editDone: 'Done editing',
      toast: 'In the real system this reply would be sent now.',
      status: { quote: 'Quote ready', questions: 'Questions sent', visit: 'Site visit', declined: 'Declined' },
      next: { quote: 'Waiting for the customer', questions: 'Waiting for answers', visit: 'Book the site visit', declined: 'Closed, outside area' },
      head: ['#', 'Customer', 'Work', 'Location', 'Area', 'Estimate', 'Status', 'Next step'],
      emptyRow: 'No enquiries yet. Run the agent on an email.', visitCell: 'after visit', noneCell: 'n/a',
      subj: 'RE: ', unitPer: 'per m²', priceTitle: 'Your price list', priceHint: 'Change a price and run the agent again to see the estimate change.', reset: 'Reset prices',
      reply_: {
        hello: 'Hello,', bye: 'Best regards,',
        thanks: 'Thank you for your enquiry.',
        quoteIntro: 'Based on what you wrote, this is our estimate:', place: 'Location',
        total: 'Estimate: {low} to {high} (excl. VAT)',
        budgetOk: 'This fits within your budget of {budget}.',
        budgetClose: 'Your budget of {budget} is within this range, so we can plan the work to stay at or below it.',
        budgetLow: 'Your budget of {budget} is below this estimate. We can look at a smaller scope, for example keeping existing fixtures, to get closer to it.',
        timeDate: 'You mentioned "{t}", so we will check our calendar for that.', timeSeason: 'You mentioned "{t}", so we can plan the work for then.', timeFlex: 'There is no rush, so we can plan the work for a quiet period.',
        next: 'If this works for you, reply to this email and we will book a free site visit to confirm the price and agree the start date.',
        qIntro: 'To give you a price we need a little more information:',
        prelim: 'For the work you have described so far, a first estimate is {low} to {high} (excl. VAT). The final price will depend on your answers.',
        visit: 'The price of a job this size depends on the foundation, the design and permits, so we do not quote it by email. We would be glad to visit the site free of charge. We have these times free:',
        slot1: '- Tuesday 10:00', slot2: '- Thursday 14:00', which: 'Which one suits you?',
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
      sPrice: 'Darbai įkainoti pagal jūsų kainoraštį: {total}', sNoPrice: 'Per mažai informacijos kainai apskaičiuoti',
      sRules: 'Patikrintos jūsų taisyklės: aptarnaujama teritorija, kainos riba', sOutside: 'Už jūsų aptarnaujamos teritorijos ribų ({place})', sBig: 'Per didelis darbas kainai el. paštu: reikia apžiūros',
      sCal: 'Patikrintas jūsų kalendorius: antradienį 10:00 ir ketvirtadienį 14:00 laisva apžiūrai',
      sSheet: 'Užklausa įrašyta į Jobs.xlsx', sDraft: 'Parašytas atsakymas jūsų patvirtinimui',
      estimate: 'Įvertinimas', waste: 'Atliekų išvežimas ir sutvarkymas', rangeLine: 'Įvertinimas be PVM', prelimTag: 'pirminis įvertinimas',
      summary: {
        quote: 'Kaina paruošta: nuo {low} iki {high} (be PVM). Užklausa atitinka jūsų taisykles, todėl atsakymas gali būti išsiųstas, kai jį patvirtinsite.',
        questions: 'Kainai trūksta informacijos. Prieš pateikdamas kainą agentas paklausia to, ko trūksta.',
        visit: 'Šio darbo kainos el. paštu nenurodome. Agentas vietoje to siūlo nemokamą apžiūros vizitą.',
        declined: 'Objektas už jūsų aptarnaujamos teritorijos ribų. Agentas parašo mandagų atsisakymą.'
      },
      missing: 'Klausimai, kuriuos užduoda agentas', reply: 'Atsakymas klientui', to: 'Kam', approve: 'Patvirtinti ir siųsti', edit: 'Redaguoti', editDone: 'Baigti redaguoti',
      toast: 'Tikroje sistemoje šis atsakymas dabar būtų išsiųstas.',
      status: { quote: 'Kaina paruošta', questions: 'Klausimai išsiųsti', visit: 'Reikalinga apžiūra', declined: 'Atsisakyta' },
      next: { quote: 'Laukiama kliento', questions: 'Laukiama atsakymų', visit: 'Suderinti apžiūros laiką', declined: 'Uždaryta, ne mūsų teritorija' },
      head: ['#', 'Klientas', 'Darbai', 'Vieta', 'Plotas', 'Kaina', 'Būsena', 'Kitas žingsnis'],
      emptyRow: 'Užklausų dar nėra. Paleiskite agentą su laišku.', visitCell: 'po apžiūros', noneCell: 'nėra',
      subj: 'Re: ', unitPer: 'už kv. m', priceTitle: 'Jūsų kainoraštis', priceHint: 'Pakeiskite kainą ir paleiskite agentą iš naujo: įvertinimas pasikeis.', reset: 'Atkurti kainas',
      reply_: {
        hello: 'Sveiki,', bye: 'Pagarbiai,',
        thanks: 'Dėkojame už užklausą.',
        quoteIntro: 'Remdamiesi jūsų laišku, parengėme tokį įvertinimą:', place: 'Vieta',
        total: 'Įvertinimas: nuo {low} iki {high} (be PVM)',
        budgetOk: 'Ši suma telpa į jūsų nurodytą biudžetą ({budget}).',
        budgetClose: 'Jūsų nurodytas biudžetas ({budget}) patenka į šį intervalą, todėl galime suplanuoti darbus taip, kad jo neviršytume.',
        budgetLow: 'Jūsų nurodytas biudžetas ({budget}) mažesnis už šį įvertinimą. Galime aptarti mažesnę darbų apimtį, pavyzdžiui, palikti esamą santechniką, kad priartėtume prie jo.',
        timeDate: 'Minėjote terminą „{t}“, todėl patikrinsime savo grafiką.', timeSeason: 'Minėjote „{t}“, todėl galėsime suplanuoti darbus tam laikui.', timeFlex: 'Skubėti nereikia, todėl galėsime suplanuoti darbus patogiu laiku.',
        next: 'Jei tai tinka, atsakykite į šį laišką: susitarsime dėl nemokamo apžiūros vizito, kad patvirtintume kainą ir suderintume darbų pradžią.',
        qIntro: 'Kad galėtume pateikti kainą, reikia šiek tiek daugiau informacijos:',
        prelim: 'Daliai jau aprašytų darbų pirminis įvertinimas yra nuo {low} iki {high} (be PVM). Galutinė kaina priklausys nuo jūsų atsakymų.',
        visit: 'Tokio dydžio darbų kaina priklauso nuo pamatų, projekto ir leidimų, todėl jos el. paštu nenurodome. Mielai nemokamai apžiūrėtume objektą. Turime laisvus laikus:',
        slot1: '- antradienį 10:00', slot2: '- ketvirtadienį 14:00', which: 'Kuris jums tinka?',
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

  function canon(t) {
    return t.replace(/²/g, '2').replace(/\bkv\.\s?m\b/gi, 'm2').replace(/\bsq\.?\s?m\b/gi, 'm2').replace(/m\^2/gi, 'm2')
  }
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

  // ---- pricing and the decision ----
  var rates = {}
  function resetRates() { JOB_ORDER.forEach(function (id) { rates[id] = DEFAULT_RATES[id] }) }
  resetRates()

  function estimate(a) {
    var lines = [], sum = 0
    a.jobs.forEach(function (j) { if (j.area && rates[j.id] != null) { var c = j.area * rates[j.id]; lines.push({ id: j.id, area: j.area, amount: c }); sum += c } })
    if (!lines.length) return null
    var total = sum * (1 + WASTE)
    return { lines: lines, waste: sum * WASTE, total: total, low: round10(total * LOW), high: round10(total * HIGH) }
  }
  function decide(a, est) {
    var missing = []
    if (!a.jobs.length) missing.push({ k: 'work', q: T.qWork })
    a.jobs.forEach(function (j) { if (!j.area && j.id !== 'extension') missing.push({ k: 'area', q: T.jobs[j.id].q }) })
    if (!a.place) missing.push({ k: 'place', q: T.qPlace })
    var ext = a.jobs.some(function (j) { return j.id === 'extension' }), big = est && est.total > LIMIT, status
    if (a.place && !a.place.ok) status = 'declined'
    else if (a.place && (ext || big)) status = 'visit'
    else if (missing.length) status = 'questions'
    else status = 'quote'
    return { status: status, missing: missing, big: Boolean(big), ext: ext }
  }

  function jobNames(a) { return a.jobs.map(function (j) { return T.jobs[j.id].name }) }
  function replyFor(a, est, d, who) {
    var out = [R.hello, '', R.thanks, '']
    if (d.status === 'quote') {
      out.push(R.quoteIntro, '')
      est.lines.forEach(function (l) { out.push('- ' + T.jobs[l.id].name + ', ' + fmtArea(l.area) + ': ' + fmt(l.amount)) })
      out.push('- ' + T.waste + ': ' + fmt(est.waste), R.place + ': ' + a.place.name, '', fill(R.total, { low: fmt(est.low), high: fmt(est.high) }), '')
      if (a.budget) out.push(fill(a.budget >= est.high ? R.budgetOk : a.budget >= est.low ? R.budgetClose : R.budgetLow, { budget: fmt(a.budget) }), '')
      if (a.deadline) out.push(a.deadline.kind === 'date' ? fill(R.timeDate, { t: a.deadline.text }) : a.deadline.kind === 'season' ? fill(R.timeSeason, { t: a.deadline.text }) : R.timeFlex, '')
      out.push(R.next)
    } else if (d.status === 'questions') {
      out.push(R.qIntro, '')
      d.missing.forEach(function (m, i) { out.push((i + 1) + '. ' + m.q) })
      if (est) out.push('', fill(R.prelim, { low: fmt(est.low), high: fmt(est.high) }))
    } else if (d.status === 'visit') {
      out.push(R.visit, '', R.slot1, R.slot2, '', R.which)
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
  var current = 0, busy = false, processed = {}, rows = [], ownText = ''

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
  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.classList.remove('show') }, 2600) }

  function stepsFor(s, a, est, d) {
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
    if (d.status === 'declined') st.push(['rules', fill(T.sOutside, { place: a.place.name }), 'err'])
    else if (d.status === 'visit') st.push(['rules', T.sBig, 'err'])
    else st.push(['rules', T.sRules, 'ok'])
    if (d.status === 'visit' || d.status === 'quote') st.push(['calendar', T.sCal, 'ok'])
    st.push(['sheet', T.sSheet, 'ok'], ['mail', T.sDraft, 'ok'])
    return st
  }

  function rowFor(s, a, est, d) {
    return { id: s.id, client: s.fromName, work: jobNames(a).join(', ') || '-', place: a.place ? a.place.name : '-',
      area: a.jobs.filter(function (j) { return j.area }).map(function (j) { return fmtArea(j.area) }).join(', ') || '-',
      est: d.status === 'visit' ? T.visitCell : d.status === 'declined' || !est ? T.noneCell : fmt(est.low) + ' - ' + fmt(est.high) + (d.status === 'questions' ? ' (' + T.prelimTag + ')' : ''),
      status: d.status }
  }
  function renderSheet(flashId) {
    tbody.textContent = ''
    if (!rows.length) { var tr = el('tr', 'empty-row'), td = el('td', null, T.emptyRow); td.colSpan = 8; tr.appendChild(td); tbody.appendChild(tr); return }
    rows.forEach(function (r, i) {
      var tr = el('tr', r.id === flashId ? 'flash' : ''), cells = [i + 1, r.client, r.work, r.place, r.area, r.est]
      cells.forEach(function (c, k) { tr.appendChild(el('td', k === 0 ? 'no' : k === 5 ? 'num' : '', String(c))) })
      var st = el('td'), chip = el('span', 'status ' + (r.status === 'quote' ? 'ready' : r.status === 'questions' ? 'waiting' : 'review'), T.status[r.status]); st.appendChild(chip); tr.appendChild(st)
      tr.appendChild(el('td', null, T.next[r.status])); tbody.appendChild(tr)
    })
  }

  function showResult(s, a, est, d, replyText) {
    resultBody.textContent = ''
    resultBody.appendChild(el('p', 'summary', fill(T.summary[d.status], est ? { low: fmt(est.low), high: fmt(est.high) } : {})))
    if (est && d.status !== 'visit' && d.status !== 'declined') {
      var card = el('div', 'est'), h = el('div', 'est-head', T.estimate + (d.status === 'questions' ? ' (' + T.prelimTag + ')' : '')); card.appendChild(h)
      var tb = el('table', 'est-table')
      est.lines.forEach(function (l) { var tr = el('tr'); tr.appendChild(el('td', null, T.jobs[l.id].name + ', ' + fmtArea(l.area))); tr.appendChild(el('td', 'num', fmt(l.amount))); tb.appendChild(tr) })
      var w = el('tr'); w.appendChild(el('td', null, T.waste)); w.appendChild(el('td', 'num', fmt(est.waste))); tb.appendChild(w)
      var t = el('tr', 'est-total'); t.appendChild(el('td', null, T.rangeLine)); t.appendChild(el('td', 'num', fmt(est.low) + ' - ' + fmt(est.high))); tb.appendChild(t)
      card.appendChild(tb); resultBody.appendChild(card)
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
    var a = analyse(s.body), est = estimate(a), d = decide(a, est), reply = replyFor(a, est, d), chain = Promise.resolve()
    stepsFor(s, a, est, d).forEach(function (st) {
      chain = chain.then(function () {
        lightSys(st[0]); var li = addStep(st[1], 'work')
        return wait(520 + Math.random() * 300).then(function () {
          finishStep(li, st[2])
          if (st[0] === 'sheet') { var r = rowFor(s, a, est, d); rows = rows.filter(function (x) { return x.id !== s.id }); rows.push(r); renderSheet(s.id) }
        })
      })
    })
    chain.then(function () {
      lightSys(null); showResult(s, a, est, d, reply); processed[s.id] = true
      setPill(agentPill, 'done'); setPill(resultPill, 'done'); busy = false; runBtn.disabled = false; renderList(); renderReader()
    })
  }

  // ---- price list ----
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

  // ---- start ----
  var head = $('#sheet-head'); if (head) T.head.forEach(function (h, i) { head.appendChild(el('th', i === 5 ? 'num' : '', h)) })
  runBtn.addEventListener('click', run)
  setPill(agentPill, 'idle'); setPill(resultPill, 'idle')
  renderList(); renderReader(); renderSheet(); renderPrices()
})()
