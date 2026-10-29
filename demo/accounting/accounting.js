// Accounting demo, agent 1 (/demo/accounting, /lt/demo/buhalterija): month-end document intake. Each client document is read, checked, posted to a journal or held back, and the missing items become one request to the client.
// Everything runs in the visitor's browser on example documents: nothing is sent anywhere and no AI service is called.
// The reading is a small set of rules for labelled invoices and receipts (supplier, VAT number, number, date, amounts); the checks and the limits are the ones shown on the page, and the visitor can change them.
// The same reading and checks are offered to the chat agent (js/chat.js) as window.SWX_ACC, so both agents answer from the same books.
(function () {
  'use strict'
  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var USD_EUR = 0.92, VAT_RATE = 21
  var FIRM = LANG === 'lt' ? 'Kreda buhalterija' : 'Kreda Accounting'
  var rules = { period: { y: 2026, m: 3 }, limit: 500, conf: 80, needVat: true }

  var COPY = {
    en: {
      from: 'From', file: 'File', run: 'Run the agent', rerun: 'Run again', runAll: 'Process all documents', own: 'Your own document', ownSubj: 'Paste the text of a document',
      idle: 'Idle', busy: 'Working', done: 'Done', periods: [{ y: 2026, m: 3, label: 'March 2026' }, { y: 2026, m: 4, label: 'April 2026' }],
      sys: { inbox: 'Inbox', read: 'Reader', checks: 'Checks', ledger: 'Journal.xlsx', client: 'Client request' },
      type: { invoice: 'invoice', receipt: 'receipt', contract: 'contract', other: 'other document' },
      cat: { office: 'Office supplies', fuel: 'Fuel', software: 'Software and hosting', design: 'Design and marketing', rent: 'Rent', other: 'To classify' },
      sInbox: 'Received {file} from {client}', sRead: 'Read the document: {type}, {supplier}, no. {no}', sReadBad: 'Could not read everything: {parts}',
      sAmounts: 'Amounts: net {net}, VAT {vat}, total {total}', sFx: 'Converted {from} to {to} at {rate}', sConf: 'Confidence in the reading: {n}%',
      sChecksOk: 'Checks passed: VAT number, totals, duplicates, period', sChecksBad: 'Check failed: {what}',
      sPost: 'Posted to the journal: {cat}', sHold: 'Held back: waiting for the client', sDup: 'Not posted: duplicate', sReview: 'Not posted: needs your decision',
      sClient: 'Added to the request for the client',
      fields: { type: 'Type', supplier: 'Supplier', vatCode: 'VAT code', no: 'Document no.', date: 'Date', net: 'Net', vat: 'VAT', total: 'Total', cat: 'Category', conf: 'Confidence' },
      calc: '(calculated)', none: 'none', eur: 'EUR',
      summary: {
        ready: 'Ready to post. The agent filled in the journal.', readyNote: 'Posted, with a note for you below.',
        waiting: 'Held back: the client has to fix something. A line was added to the request for the client.',
        duplicate: 'This is a duplicate of an earlier document, so it is not posted.',
        review: 'Not posted: this one needs your decision.',
        contract: 'This is a contract, not a booking document. The agent flags it for you instead of posting it.'
      },
      checksTitle: 'Checks',
      okVat: 'Supplier VAT number present', badVatNo: 'No supplier VAT number: the VAT cannot be deducted without it', badVatFmt: 'The VAT number {code} does not look valid', infoVatOff: 'No supplier VAT number, but your rules do not require one',
      okSum: 'Net + VAT equals the total', badSum: 'Net + VAT is {exp} but the total says {got}',
      okDup: 'Not a duplicate', badDup: 'Same supplier, number and total as an earlier document',
      okPeriod: 'The date is in {period}', badPeriod: 'The date {date} is outside {period}',
      badMissing: 'Missing: {parts}', mTotal: 'total', mDate: 'date', mSupplier: 'supplier',
      badLimit: 'The total {total} is over your limit of {limit} for posting on its own: it needs your approval',
      badConf: 'Confidence {n}% is below your threshold of {t}%: it needs a human look',
      infoFx: 'Foreign currency: converted at {rate} (an example rate, the real agent uses the bank rate of the invoice date)',
      infoReverse: 'No VAT charged: reverse charge may apply. You confirm.',
      infoRent: 'Monthly rent {rent}: create a recurring entry? Needs your approval.',
      ask: {
        noVat: 'Please send the full invoice with the supplier VAT number (the receipt only shows the total).',
        badVat: 'The VAT number {code} does not look valid. Please check it with the supplier.',
        sum: 'The totals do not add up (net + VAT = {exp}, total shown {got}). Please ask the supplier for a corrected invoice.',
        period: 'The date {date} is outside {period}. Please confirm which period it belongs to.',
        missing: 'Some data could not be read ({parts}). Please send a clearer copy.'
      },
      st: { ready: 'Posted', waiting: 'Waiting for client', review: 'Needs you', duplicate: 'Duplicate' },
      post: { title: 'Posting preview', debit: 'Debit', credit: 'Credit', exp: 'Expense: {cat}', vatIn: 'VAT receivable (input VAT)', pay: 'Accounts payable: {supplier}' },
      monthTitle: 'Month-end status', pending: 'not processed yet', legendReady: 'posted', legendWaiting: 'waiting for client', legendReview: 'needs you', legendDup: 'duplicates',
      monthLine: '{n} of {t} documents processed',
      vat: { net: 'Net purchases posted', input: 'Input VAT posted', held: 'VAT waiting on documents', rc: 'Reverse charge items to confirm' },
      clientTitle: 'Request to the client', clientEmpty: 'Nothing to ask yet. Run the agent on the documents.', approve: 'Approve and send', toast: 'In the real system this message would be sent now.',
      remind: 'Remind the client on Thursday at 10:00 if there is no reply', remindOn: 'Reminder scheduled: Thursday 10:00', remindOff: 'No reminder scheduled',
      reqBody: 'Hello,\n\nFor the {period} bookkeeping we still need the following:\n\n{list}\n\nPlease send them by Friday so we can close the month.\n\nBest regards,\n{firm}',
      to: 'To', subject: 'Subject', reqSubject: 'Documents we still need for {period}',
      head: ['#', 'Date', 'Supplier', 'Doc no.', 'Category', 'Net', 'VAT', 'Total (EUR)', 'Status'], csvHead: ['Date', 'Supplier', 'Doc no.', 'Category', 'Net', 'VAT', 'Total (EUR)', 'Status', 'Confidence (%)'],
      emptyRow: 'The journal is empty. Run the agent on a document.', csv: 'Download CSV', csvName: 'Journal-{period}.csv',
      pasteNeed: 'Paste the text of an invoice or a receipt first.',
      docs: [
        { id: 'd1', fromName: 'Baltic Trade MB', file: 'invoice_0412.pdf', time: '08:10', text: 'INVOICE INV-2026-0412\nSupplier: Baltic Office Supplies Ltd\nVAT code: LT100012345611\nDate: 03 March 2026\nPaper, toner, folders\nNet: 200.00 EUR\nVAT 21%: 42.00 EUR\nTotal: 242.00 EUR' },
        { id: 'd2', fromName: 'Auto Service Kaunas', file: 'receipt_shell.jpg', time: '08:25', text: 'Shell Kaunas\nReceipt No 88213\nDate: 05 March 2026\nDiesel 52.4 l\nTotal: 82.10 EUR (incl. VAT)' },
        { id: 'd3', fromName: 'Baltic Trade MB', file: 'scan_0041.pdf', time: '09:02', text: 'Invoice No INV-2026-0412\nSupplier: Baltic Office Supplies Ltd\nVAT code: LT100012345611\nDate: 03 March 2026\nPaper, toner, folders\nNet: 200.00 EUR\nVAT 21%: 42.00 EUR\nTotal: 242.00 EUR' },
        { id: 'd4', fromName: 'Dev Studio MB', file: 'cloudhost_7781.pdf', time: '09:40', text: 'Invoice 7781\nCloudHost Inc., Austin, USA\nDate: 12 March 2026\nHosting, March\nTotal USD 120.00\nNo VAT charged (reverse charge applies)' },
        { id: 'd5', fromName: 'Marketing Plus MB', file: 'invoice_118.pdf', time: '10:15', text: 'Invoice 2026/118\nSupplier: Studio Vilnius MB\nVAT code: LT200045678914\nDate: 18 March 2026\nLogo design\nNet: 500.00 EUR\nVAT 21%: 105.00 EUR\nTotal: 650.00 EUR' },
        { id: 'd6', fromName: 'Office Landlord', file: 'rent_agreement.pdf', time: '10:40', text: 'Office rent agreement\nLandlord: Vilnius Properties UAB\nMonthly rent: 450.00 EUR (excl. VAT)\nValid from: 1 April 2026, 12 months' }
      ]
    },
    lt: {
      from: 'Nuo', file: 'Failas', run: 'Paleisti agentą', rerun: 'Paleisti iš naujo', runAll: 'Apdoroti visus dokumentus', own: 'Jūsų dokumentas', ownSubj: 'Įklijuokite dokumento tekstą',
      idle: 'Laukia', busy: 'Dirba', done: 'Baigta', periods: [{ y: 2026, m: 3, label: '2026 m. kovas' }, { y: 2026, m: 4, label: '2026 m. balandis' }],
      sys: { inbox: 'Paštas', read: 'Skaitytuvas', checks: 'Patikrinimai', ledger: 'Journal.xlsx', client: 'Užklausa klientui' },
      type: { invoice: 'sąskaita faktūra', receipt: 'kvitas', contract: 'sutartis', other: 'kitas dokumentas' },
      cat: { office: 'Biuro prekės', fuel: 'Degalai', software: 'Programinė įranga ir talpinimas', design: 'Dizainas ir rinkodara', rent: 'Nuoma', other: 'Reikia priskirti' },
      sInbox: 'Gautas failas {file} (klientas: {client})', sRead: 'Perskaitytas dokumentas: {type}, {supplier}, nr. {no}', sReadBad: 'Nepavyko perskaityti visko: {parts}',
      sAmounts: 'Sumos: be PVM {net}, PVM {vat}, iš viso {total}', sFx: 'Perskaičiuota iš {from} į {to} pagal kursą {rate}', sConf: 'Skaitymo patikimumas: {n} %',
      sChecksOk: 'Patikrinimai praėjo: PVM kodas, sumos, dublikatai, laikotarpis', sChecksBad: 'Patikrinimas nepraėjo: {what}',
      sPost: 'Įrašyta į žurnalą: {cat}', sHold: 'Sulaikyta: laukiama kliento', sDup: 'Neįrašyta: dublikatas', sReview: 'Neįrašyta: reikia jūsų sprendimo',
      sClient: 'Įtraukta į užklausą klientui',
      fields: { type: 'Rūšis', supplier: 'Tiekėjas', vatCode: 'PVM kodas', no: 'Dok. nr.', date: 'Data', net: 'Be PVM', vat: 'PVM', total: 'Iš viso', cat: 'Kategorija', conf: 'Patikimumas' },
      calc: '(apskaičiuota)', none: 'nėra', eur: 'EUR',
      summary: {
        ready: 'Paruošta įrašyti. Agentas užpildė žurnalą.', readyNote: 'Įrašyta, žemiau yra pastaba jums.',
        waiting: 'Sulaikyta: klientas turi ką nors ištaisyti. Eilutė įtraukta į užklausą klientui.',
        duplicate: 'Tai ankstesnio dokumento dublikatas, todėl neįrašyta.',
        review: 'Neįrašyta: šiam dokumentui reikia jūsų sprendimo.',
        contract: 'Tai sutartis, o ne apskaitos dokumentas. Agentas jos neįrašo, o pažymi jums.'
      },
      checksTitle: 'Patikrinimai',
      okVat: 'Tiekėjo PVM kodas yra', badVatNo: 'Nėra tiekėjo PVM kodo: be jo PVM atskaityti negalima', badVatFmt: 'PVM kodas {code} neatrodo teisingas', infoVatOff: 'Nėra tiekėjo PVM kodo, bet jūsų taisyklės jo nereikalauja',
      okSum: 'Be PVM + PVM lygu bendrai sumai', badSum: 'Be PVM + PVM yra {exp}, o nurodyta suma {got}',
      okDup: 'Ne dublikatas', badDup: 'Tas pats tiekėjas, numeris ir suma kaip ankstesniame dokumente',
      okPeriod: 'Data patenka į laikotarpį: {period}', badPeriod: 'Data {date} nepatenka į laikotarpį: {period}',
      badMissing: 'Trūksta: {parts}', mTotal: 'sumos', mDate: 'datos', mSupplier: 'tiekėjo',
      badLimit: 'Suma {total} viršija jūsų nustatytą ribą ({limit}) savarankiškam įrašymui: reikia jūsų pritarimo',
      badConf: 'Patikimumas {n} % yra mažesnis už jūsų ribą ({t} %): reikia žmogaus peržiūros',
      infoFx: 'Užsienio valiuta: perskaičiuota pagal kursą {rate} (pavyzdinis kursas, tikras agentas naudoja sąskaitos dienos banko kursą)',
      infoReverse: 'PVM neskaičiuotas: gali būti taikomas atvirkštinis apmokestinimas. Patvirtinkite jūs.',
      infoRent: 'Mėnesinė nuoma {rent}: sukurti pasikartojantį įrašą? Reikia jūsų pritarimo.',
      ask: {
        noVat: 'Prašome atsiųsti pilną sąskaitą faktūrą su tiekėjo PVM kodu (kvite nurodyta tik bendra suma).',
        badVat: 'PVM kodas {code} neatrodo teisingas. Prašome pasitikslinti pas tiekėją.',
        sum: 'Sumos nesutampa (be PVM + PVM = {exp}, nurodyta {got}). Prašome paprašyti tiekėjo ištaisytos sąskaitos.',
        period: 'Data {date} už laikotarpio ribų. Prašome patvirtinti, kuriam laikotarpiui priklauso.',
        missing: 'Nepavyko perskaityti dalies duomenų ({parts}). Prašome atsiųsti aiškesnę kopiją.'
      },
      st: { ready: 'Įrašyta', waiting: 'Laukiama kliento', review: 'Reikia jūsų', duplicate: 'Dublikatas' },
      post: { title: 'Įrašo peržiūra', debit: 'Debetas', credit: 'Kreditas', exp: 'Sąnaudos: {cat}', vatIn: 'PVM gautinas (įskaitomas PVM)', pay: 'Mokėtinos sumos: {supplier}' },
      monthTitle: 'Laikotarpio uždarymo būsena', pending: 'dar neapdorota', legendReady: 'įrašyta', legendWaiting: 'laukiama kliento', legendReview: 'reikia jūsų', legendDup: 'dublikatai',
      monthLine: 'Apdorota {n} iš {t} dokumentų',
      vat: { net: 'Įrašyti pirkimai be PVM', input: 'Įrašytas įskaitomas PVM', held: 'PVM, laukiantis dokumentų', rc: 'Atvirkštinio apmokestinimo atvejai patvirtinti' },
      clientTitle: 'Užklausa klientui', clientEmpty: 'Kol kas nieko klausti nereikia. Paleiskite agentą su dokumentais.', approve: 'Patvirtinti ir siųsti', toast: 'Tikroje sistemoje ši žinutė dabar būtų išsiųsta.',
      remind: 'Priminti klientui ketvirtadienį 10:00, jei neatsakys', remindOn: 'Priminimas suplanuotas: ketvirtadienis 10:00', remindOff: 'Priminimas nesuplanuotas',
      reqBody: 'Sveiki,\n\nkad galėtume uždaryti laikotarpį ({period}), dar reikia:\n\n{list}\n\nPrašome atsiųsti iki penktadienio.\n\nPagarbiai,\n{firm}',
      to: 'Kam', subject: 'Tema', reqSubject: 'Dokumentai, kurių dar reikia: {period}',
      head: ['#', 'Data', 'Tiekėjas', 'Dok. nr.', 'Kategorija', 'Be PVM', 'PVM', 'Iš viso (EUR)', 'Būsena'], csvHead: ['Data', 'Tiekėjas', 'Dok. nr.', 'Kategorija', 'Be PVM', 'PVM', 'Iš viso (EUR)', 'Būsena', 'Patikimumas (%)'],
      emptyRow: 'Žurnalas tuščias. Paleiskite agentą su dokumentu.', csv: 'Atsisiųsti CSV', csvName: 'Zurnalas-{period}.csv',
      pasteNeed: 'Pirmiausia įklijuokite sąskaitos ar kvito tekstą.',
      docs: [
        { id: 'd1', fromName: 'UAB Baltijos prekyba', file: 'saskaita_0412.pdf', time: '08:10', text: 'SĄSKAITA FAKTŪRA BP-2026-0412\nTiekėjas: UAB Biuro Pasaulis\nPVM kodas: LT100012345611\nData: 2026 m. kovo 3 d.\nPopierius, tonerio kasetė, segtuvai\nSuma be PVM: 200,00 EUR\nPVM 21%: 42,00 EUR\nIš viso: 242,00 EUR' },
        { id: 'd2', fromName: 'Autoservisas Kaune', file: 'cekis_degaline.jpg', time: '08:25', text: 'Degalinė Nafta, Kaunas\nČekis Nr. 88213\nData: 2026-03-05\nDyzelinas 52,4 l\nIš viso: 82,10 EUR (su PVM)' },
        { id: 'd3', fromName: 'UAB Baltijos prekyba', file: 'skenavimas_0041.pdf', time: '09:02', text: 'Sąskaita faktūra Nr. BP-2026-0412\nTiekėjas: UAB Biuro Pasaulis\nPVM kodas: LT100012345611\nData: 2026 m. kovo 3 d.\nPopierius, tonerio kasetė, segtuvai\nSuma be PVM: 200,00 EUR\nPVM 21%: 42,00 EUR\nIš viso: 242,00 EUR' },
        { id: 'd4', fromName: 'Programuotojų MB', file: 'cloudhost_7781.pdf', time: '09:40', text: 'Invoice 7781\nCloudHost Inc., Austin, USA\nDate: 12 March 2026\nHosting, March\nTotal USD 120.00\nNo VAT charged (reverse charge applies)' },
        { id: 'd5', fromName: 'Reklamos MB', file: 'saskaita_118.pdf', time: '10:15', text: 'Sąskaita faktūra 2026/118\nTiekėjas: MB Studija Vilnius\nPVM kodas: LT200045678914\nData: 2026 m. kovo 18 d.\nLogotipo dizainas\nSuma be PVM: 500,00 EUR\nPVM 21%: 105,00 EUR\nIš viso: 650,00 EUR' },
        { id: 'd6', fromName: 'Biuro nuomotojas', file: 'nuomos_sutartis.pdf', time: '10:40', text: 'Patalpų nuomos sutartis\nNuomotojas: UAB Vilniaus nekilnojamasis turtas\nMėnesinė nuoma: 450,00 EUR (be PVM)\nGalioja nuo: 2026 m. balandžio 1 d., 12 mėnesių' }
      ]
    }
  }
  var T = COPY[LANG]
  var nf = new Intl.NumberFormat(LANG === 'lt' ? 'lt-LT' : 'en-IE', { style: 'currency', currency: 'EUR' })
  function fmt(n) { return n == null ? '-' : nf.format(n) }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m }) }
  function r2(n) { return Math.round(n * 100) / 100 }
  function rateStr() { return LANG === 'lt' ? String(USD_EUR).replace('.', ',') : String(USD_EUR) }
  function periodLabel() { var p = T.periods.filter(function (x) { return x.y === rules.period.y && x.m === rules.period.m })[0]; return p ? p.label : '' }

  // ---- reading a document ----
  var MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  var MONTHS_LT = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio']
  function pad(n) { return (n < 10 ? '0' : '') + n }
  function parseDate(t) {
    var m, y, mo, d
    if ((m = t.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/))) { y = +m[1]; mo = +m[2]; d = +m[3] }
    else if ((m = t.match(new RegExp('\\b(\\d{1,2})\\s+(' + MONTHS_EN.join('|') + ')\\s+(20\\d\\d)', 'i')))) { d = +m[1]; mo = MONTHS_EN.indexOf(m[2].toLowerCase()) + 1; y = +m[3] }
    else if ((m = t.match(new RegExp('(20\\d\\d)\\s*m\\.\\s*(' + MONTHS_LT.join('|') + ')\\s*(\\d{1,2})\\s*d', 'i')))) { y = +m[1]; mo = MONTHS_LT.indexOf(m[2].toLowerCase()) + 1; d = +m[3] }
    else return null
    return { y: y, m: mo, d: d, iso: y + '-' + pad(mo) + '-' + pad(d) }
  }
  function num(s) {
    s = String(s).replace(/[\s ]/g, '')
    if (/,\d{1,2}$/.test(s) && !/\.\d{3}/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
    var v = parseFloat(s)
    return isFinite(v) ? v : null
  }
  function grab(t, re) { var m = t.match(re); return m ? num(m[1]) : null }
  var CATS = [
    ['office', /toner|paper|folder|office|biuro|popier|kanceliar|segtuv/i], ['fuel', /diesel|petrol|fuel|degal|dyzel|benzin/i],
    ['software', /cloud|hosting|software|subscription|licen|serveri|talpinim/i], ['design', /design|studio|logo|dizain|studija|marketing|rinkodar/i], ['rent', /\brent|nuom/i]
  ]

  function readDoc(text) {
    var t = text.replace(/\r/g, ''), lines = t.split('\n').map(function (l) { return l.trim() }).filter(Boolean)
    var d = { type: 'other' }
    if (/agreement|contract|sutart/i.test(t)) d.type = 'contract'
    else if (/receipt|kvitas|čekis/i.test(t)) d.type = 'receipt'
    else if (/invoice|sąskait/i.test(t)) d.type = 'invoice'
    var sm = t.match(/^(?:supplier|tiekėjas|pardavėjas|seller|landlord|nuomotojas)\s*:\s*(.+)$/im)
    if (sm) d.supplier = sm[1].trim()
    else {
      var first = lines.filter(function (l) { return !/^(invoice|receipt|sąskaita|kvitas|čekis|.*(agreement|sutartis))/i.test(l) })[0]
      if (first) d.supplier = first.split(',')[0].trim()
    }
    var vm = t.match(/(?:vat\s*(?:code|no\.?|number)|pvm\s*(?:mokėtojo\s*)?kodas)\s*:?\s*([A-Z]{2}\s?[A-Z0-9]{6,14})/i)
    d.vatCode = vm ? vm[1].replace(/\s/g, '').toUpperCase() : null
    var nm = t.match(/(?:sąskaita faktūra|sąskaita|invoice|receipt|kvitas|čekis)\s*(?:no\.?|nr\.?|numeris)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\/\-]{2,})/i)
    d.no = nm && /\d/.test(nm[1]) ? nm[1].toUpperCase() : null
    d.date = parseDate(t)
    d.currency = /\busd\b|\$/i.test(t) ? 'USD' : 'EUR'
    d.net = grab(t, /(?:\bnet(?:\s+amount)?|subtotal|suma be pvm|be pvm)\s*:?\s*(?:eur|usd|€|\$)?\s*(\d[\d\s.,]*)/i)
    d.vat = grab(t, /(?:^|\n)\s*(?:vat|pvm)\s*(?:\d{1,2}\s*%)?\s*:?\s*(?:eur|usd|€|\$)?\s*(\d[\d\s.,]*)/i)
    d.total = grab(t, /(?:\btotal(?:\s+amount)?|iš viso|\bviso|suma mokėti|amount due)\s*:?\s*(?:eur|usd|€|\$)?\s*(\d[\d\s.,]*)/i)
    d.reverse = /reverse charge|no vat charged|atvirkštin/i.test(t)
    d.derived = false
    if (d.total != null && d.net == null && d.vat == null && /incl\.?\s*vat|su pvm|including vat/i.test(t)) {
      d.vat = r2(d.total * VAT_RATE / (100 + VAT_RATE)); d.net = r2(d.total - d.vat); d.derived = true
    }
    var rent = grab(t, /(?:monthly rent|mėnesinė nuoma)\s*:?\s*(\d[\d\s.,]*)/i)
    if (rent != null) d.rent = rent
    var cat = 'other'
    CATS.some(function (c) { if (c[1].test(t)) { cat = c[0]; return true } return false })
    d.cat = cat
    return d
  }

  // ---- the checks (the rules on the page decide what holds a document back) ----
  function check(doc, d, seenMap) {
    var items = [], holds = [], key = (d.supplier || '') + '|' + (d.no || '') + '|' + (d.total != null ? d.total : '')
    var dup = false, conf = 100
    var eur = d.currency === 'EUR' ? d.total : d.total != null ? r2(d.total * USD_EUR) : null
    if (d.type === 'contract') {
      if (d.rent != null) items.push({ ok: true, info: true, text: fill(T.infoRent, { rent: fmt(d.rent) }) })
      return { items: items, holds: holds, status: 'review', kind: 'contract', dup: false, conf: 100 }
    }
    var missing = []
    if (d.total == null) missing.push(T.mTotal)
    if (!d.date) missing.push(T.mDate)
    if (!d.supplier) missing.push(T.mSupplier)
    if (missing.length) { items.push({ ok: false, text: fill(T.badMissing, { parts: missing.join(', ') }) }); holds.push({ ask: fill(T.ask.missing, { parts: missing.join(', ') }) }); conf -= 30 }
    if (d.vatCode) {
      if (/^[A-Z]{2}[A-Z0-9]{8,12}$/.test(d.vatCode) && (!/^LT/.test(d.vatCode) || /^LT(\d{9}|\d{12})$/.test(d.vatCode))) items.push({ ok: true, text: T.okVat + ' (' + d.vatCode + ')' })
      else { items.push({ ok: false, text: fill(T.badVatFmt, { code: d.vatCode }) }); holds.push({ ask: fill(T.ask.badVat, { code: d.vatCode }) }); conf -= 25 }
    } else if (d.reverse || d.currency !== 'EUR') { items.push({ ok: true, info: true, text: T.infoReverse }); conf -= 5 }
    else if (!rules.needVat) { items.push({ ok: true, info: true, text: T.infoVatOff }); conf -= 10 }
    else { items.push({ ok: false, text: T.badVatNo }); holds.push({ ask: T.ask.noVat }); conf -= 25 }
    if (d.net != null && d.vat != null && d.total != null && !d.derived) {
      var exp = r2(d.net + d.vat)
      if (Math.abs(exp - d.total) > 0.02) { items.push({ ok: false, text: fill(T.badSum, { exp: fmt(exp), got: fmt(d.total) }) }); holds.push({ ask: fill(T.ask.sum, { exp: fmt(exp), got: fmt(d.total) }) }); conf -= 25 }
      else items.push({ ok: true, text: T.okSum })
    }
    if (d.derived) conf -= 15
    if (d.date) {
      if (d.date.y === rules.period.y && d.date.m === rules.period.m) items.push({ ok: true, text: fill(T.okPeriod, { period: periodLabel() }) })
      else { items.push({ ok: false, text: fill(T.badPeriod, { date: d.date.iso, period: periodLabel() }) }); holds.push({ ask: fill(T.ask.period, { date: d.date.iso, period: periodLabel() }) }); conf -= 20 }
    }
    if (seenMap[key] && seenMap[key] !== doc.id && d.total != null && d.no) { dup = true; items.push({ ok: false, text: T.badDup }) }
    else { seenMap[key] = doc.id; items.push({ ok: true, text: T.okDup }) }
    if (d.currency !== 'EUR') { items.push({ ok: true, info: true, text: fill(T.infoFx, { rate: '1 ' + d.currency + ' = ' + rateStr() + ' EUR' }) }); conf -= 10 }
    conf = Math.max(0, Math.min(100, conf))
    var status = dup ? 'duplicate' : holds.length ? 'waiting' : 'ready'
    if (status === 'ready' && eur != null && eur > rules.limit) { items.push({ ok: false, text: fill(T.badLimit, { total: fmt(eur), limit: fmt(rules.limit) }) }); status = 'review' }
    if (status === 'ready' && conf < rules.conf) { items.push({ ok: false, text: fill(T.badConf, { n: conf, t: rules.conf }) }); status = 'review' }
    return { items: items, holds: holds, status: status, kind: d.type, dup: dup, conf: conf }
  }
  function analyse(doc, seenMap) {
    var d = readDoc(doc.text), c = check(doc, d, seenMap)
    var eur = d.currency === 'EUR' ? d.total : d.total != null ? r2(d.total * USD_EUR) : null
    var row = { id: doc.id, date: d.date ? d.date.iso : '-', supplier: d.supplier || '-', no: d.no || '-', cat: d.type === 'contract' ? 'rent' : d.cat, net: d.type === 'contract' ? d.rent : d.currency === 'EUR' ? d.net : null, vat: d.type === 'contract' ? null : d.currency === 'EUR' ? d.vat : null, total: d.type === 'contract' ? d.rent : eur, status: c.status, conf: c.conf }
    return { doc: doc, d: d, c: c, row: row }
  }
  // all example documents in order, with a clean memory of what was seen: what the chat agent answers from
  function analyseAll() { var seenMap = {}; return T.docs.map(function (doc) { return analyse(doc, seenMap) }) }

  // ---- screen ----
  function $(s) { return document.querySelector(s) }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n }
  var list = $('#mail-list'), reader = $('#reader'), runBtn = $('#run'), allBtn = $('#run-all'), stepsEl = $('#steps'), agentPill = $('#agent-pill'), resultBody = $('#result-body'), resultPill = $('#result-pill')
  var tbody = $('#sheet-body'), toast = $('#toast'), sysEls = {}
  document.querySelectorAll('[data-sys]').forEach(function (n) { n.textContent = T.sys[n.getAttribute('data-sys')]; sysEls[n.getAttribute('data-sys')] = n })
  var current = 0, busy = false, results = {}, ownText = '', seen = {}, remindOn = true

  function renderList() {
    list.textContent = ''
    T.docs.concat([{ id: 'own', fromName: T.own, file: T.ownSubj, time: '✎' }]).forEach(function (s, i) {
      var li = el('li'), b = el('button', 'mail-item' + (results[s.id] ? ' processed' : ''))
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === current))
      var from = el('span', 'mail-from', s.fromName); from.appendChild(el('span', 'done-dot')); b.appendChild(from)
      b.appendChild(el('span', 'mail-time', s.time)); b.appendChild(el('span', 'mail-subj', s.file))
      b.addEventListener('click', function () { if (!busy) { current = i; renderList(); renderReader() } })
      li.appendChild(b); list.appendChild(li)
    })
  }
  function renderReader() {
    reader.textContent = ''
    if (current < T.docs.length) {
      var s = T.docs[current], meta = el('div', 'reader-meta')
      meta.appendChild(el('b', null, T.from + ': ')); meta.appendChild(document.createTextNode(s.fromName)); meta.appendChild(el('br'))
      meta.appendChild(el('b', null, T.file + ': ')); meta.appendChild(document.createTextNode(s.file))
      reader.appendChild(meta); reader.appendChild(el('p', 'reader-body doc-text', s.text))
      runBtn.textContent = results[s.id] ? T.rerun : T.run
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
  function fmtC(n, cur) { return cur === 'EUR' ? fmt(n) : (LANG === 'lt' ? n.toFixed(2).replace('.', ',') + ' ' + cur : cur + ' ' + n.toFixed(2)) }

  function stepsFor(r) {
    var d = r.d, c = r.c, s = [['inbox', fill(T.sInbox, { file: r.doc.file || '-', client: r.doc.fromName }), 'ok']]
    var bad = []
    if (!d.supplier) bad.push(T.mSupplier)
    if (!d.date && d.type !== 'contract') bad.push(T.mDate)
    if (d.total == null && d.type !== 'contract') bad.push(T.mTotal)
    s.push(['read', fill(T.sRead, { type: T.type[d.type], supplier: d.supplier || '-', no: d.no || '-' }), 'ok'])
    if (bad.length) s.push(['read', fill(T.sReadBad, { parts: bad.join(', ') }), 'err'])
    if (d.type !== 'contract' && d.total != null) {
      s.push(['read', fill(T.sAmounts, { net: d.net != null ? fmtC(d.net, d.currency) : '-', vat: d.vat != null ? fmtC(d.vat, d.currency) : '-', total: fmtC(d.total, d.currency) }) + (d.derived ? ' ' + T.calc : ''), 'ok'])
      if (d.currency !== 'EUR') s.push(['read', fill(T.sFx, { from: d.currency, to: 'EUR', rate: rateStr() }), 'ok'])
      s.push(['read', fill(T.sConf, { n: c.conf }), c.conf >= rules.conf ? 'ok' : 'err'])
    }
    if (d.type !== 'contract') {
      var fails = c.items.filter(function (i) { return !i.ok })
      if (fails.length) fails.forEach(function (f) { s.push(['checks', fill(T.sChecksBad, { what: f.text }), 'err']) })
      else s.push(['checks', T.sChecksOk, 'ok'])
    }
    s.push(['ledger', c.status === 'ready' ? fill(T.sPost, { cat: T.cat[r.row.cat] }) : c.status === 'waiting' ? T.sHold : c.status === 'duplicate' ? T.sDup : T.sReview, c.status === 'ready' ? 'ok' : 'err'])
    if (c.holds.length) s.push(['client', T.sClient, 'ok'])
    return s
  }

  function orderedRows() { return T.docs.concat([{ id: 'own' }]).filter(function (x) { return results[x.id] }).map(function (x) { return results[x.id].row }) }
  function renderSheet(flashId) {
    tbody.textContent = ''
    var rows = orderedRows()
    if (!rows.length) { var tr0 = el('tr', 'empty-row'), td0 = el('td', null, T.emptyRow); td0.colSpan = 9; tr0.appendChild(td0); tbody.appendChild(tr0); return }
    rows.forEach(function (r, i) {
      var tr = el('tr', r.id === flashId ? 'flash' : '')
      tr.appendChild(el('td', 'no', String(i + 1))); tr.appendChild(el('td', null, r.date)); tr.appendChild(el('td', null, r.supplier)); tr.appendChild(el('td', null, r.no)); tr.appendChild(el('td', null, T.cat[r.cat]))
      ;[r.net, r.vat, r.total].forEach(function (v) { tr.appendChild(el('td', 'num', v == null ? '-' : fmt(v))) })
      var st = el('td'); st.appendChild(el('span', 'status ' + (r.status === 'ready' ? 'ready' : r.status === 'waiting' ? 'waiting' : 'review'), T.st[r.status])); tr.appendChild(st); tbody.appendChild(tr)
    })
  }
  function renderMonth() {
    var docs = T.docs, n = docs.filter(function (x) { return results[x.id] }).length, t = docs.length
    var count = { ready: 0, waiting: 0, review: 0, duplicate: 0 }
    docs.forEach(function (x) { if (results[x.id]) count[results[x.id].c.status]++ })
    var bar = $('#month-bar'); bar.textContent = ''
    ;[['ready', 'seg-ready'], ['waiting', 'seg-waiting'], ['review', 'seg-review'], ['duplicate', 'seg-dup']].forEach(function (p) { if (count[p[0]]) { var s = el('span', 'seg ' + p[1]); s.style.flexGrow = count[p[0]]; bar.appendChild(s) } })
    if (t - n) { var pn = el('span', 'seg seg-pending'); pn.style.flexGrow = t - n; bar.appendChild(pn) }
    var lg = $('#month-legend'); lg.textContent = ''
    ;[['ready', 'legendReady', 'seg-ready'], ['waiting', 'legendWaiting', 'seg-waiting'], ['review', 'legendReview', 'seg-review'], ['duplicate', 'legendDup', 'seg-dup']].forEach(function (p) {
      var li = el('span', 'lg'); li.appendChild(el('i', p[2])); li.appendChild(document.createTextNode(count[p[0]] + ' ' + T[p[1]])); lg.appendChild(li)
    })
    var pl = el('span', 'lg'); pl.appendChild(el('i', 'seg-pending')); pl.appendChild(document.createTextNode((t - n) + ' ' + T.pending)); lg.appendChild(pl)
    $('#month-line').textContent = fill(T.monthLine, { n: n, t: t })
    // the VAT picture of what is posted and what is held back
    var net = 0, input = 0, held = 0, rc = 0
    docs.forEach(function (x) {
      var r = results[x.id]; if (!r || r.d.type === 'contract') return
      if (r.c.status === 'ready') { net += r.row.net || (r.row.total && r.d.currency !== 'EUR' ? r.row.total : 0); input += r.row.vat || 0; if (r.d.reverse) rc++ }
      else if (r.c.status === 'waiting') held += r.row.vat || 0
    })
    var vb = $('#vat-body'); vb.textContent = ''
    ;[[T.vat.net, fmt(net)], [T.vat.input, fmt(input)], [T.vat.held, fmt(held)], [T.vat.rc, String(rc)]].forEach(function (p) { vb.appendChild(el('dt', null, p[0])); vb.appendChild(el('dd', null, p[1])) })
  }
  function renderClient() {
    var body = $('#client-body'); body.textContent = ''
    var asks = []
    T.docs.forEach(function (x) { var r = results[x.id]; if (r && r.c.holds.length) r.c.holds.forEach(function (h) { asks.push((x.file || '') + ' (' + (r.d.supplier || x.fromName) + '): ' + h.ask) }) })
    if (!asks.length) { body.appendChild(el('p', 'placeholder', T.clientEmpty)); return }
    var card = el('div', 'reply'), head = el('div', 'reply-head')
    var to = el('span'); to.appendChild(el('b', null, T.to + ': ')); to.appendChild(document.createTextNode('accounts@client.example')); head.appendChild(to)
    var sj = el('span'); sj.appendChild(el('b', null, T.subject + ': ')); sj.appendChild(document.createTextNode(fill(T.reqSubject, { period: periodLabel() }))); head.appendChild(sj); card.appendChild(head)
    var ta = el('textarea'); ta.readOnly = true
    ta.value = fill(T.reqBody, { period: periodLabel(), list: asks.map(function (a, i) { return (i + 1) + '. ' + a }).join('\n'), firm: FIRM }); card.appendChild(ta)
    var act = el('div', 'reply-actions'), ok = el('button', 'btn btn-primary', T.approve); ok.type = 'button'; ok.addEventListener('click', function () { showToast(T.toast) }); act.appendChild(ok); card.appendChild(act); body.appendChild(card)
    var rem = el('label', 'remind'), cb = el('input'); cb.type = 'checkbox'; cb.checked = remindOn
    var stat = el('span', 'remind-s', remindOn ? T.remindOn : T.remindOff)
    cb.addEventListener('change', function () { remindOn = cb.checked; stat.textContent = remindOn ? T.remindOn : T.remindOff })
    rem.appendChild(cb); rem.appendChild(el('span', null, T.remind)); body.appendChild(rem); body.appendChild(stat)
  }

  function showResult(r) {
    var d = r.d, c = r.c
    resultBody.textContent = ''
    var note = c.items.some(function (i) { return i.info }) && c.status === 'ready'
    resultBody.appendChild(el('p', 'summary', T.summary[c.kind === 'contract' ? 'contract' : c.status === 'ready' && note ? 'readyNote' : c.status]))
    if (d.type !== 'contract') {
      var g = el('dl', 'kv')
      var rows = [['type', T.type[d.type]], ['supplier', d.supplier || T.none], ['vatCode', d.vatCode || T.none], ['no', d.no || T.none], ['date', d.date ? d.date.iso : T.none],
        ['net', d.net != null ? fmtC(d.net, d.currency) + (d.derived ? ' ' + T.calc : '') : T.none], ['vat', d.vat != null ? fmtC(d.vat, d.currency) + (d.derived ? ' ' + T.calc : '') : T.none],
        ['total', d.total != null ? fmtC(d.total, d.currency) + (d.currency !== 'EUR' ? ' = ' + fmt(r.row.total) : '') : T.none], ['cat', T.cat[d.cat]], ['conf', c.conf + '%']]
      rows.forEach(function (p) { g.appendChild(el('dt', null, T.fields[p[0]])); g.appendChild(el('dd', null, p[1])) })
      resultBody.appendChild(g)
      var bar = el('div', 'pbar conf'), f = el('i'); f.style.width = c.conf + '%'; if (c.conf < rules.conf) f.className = 'low'; bar.appendChild(f); resultBody.appendChild(bar)
    }
    if (c.items.length) {
      var box = el('div', 'checks'); box.appendChild(el('b', null, T.checksTitle)); var ul = el('ul')
      c.items.forEach(function (i) { var li = el('li', i.info ? 'info' : i.ok ? 'ok' : 'bad'); li.appendChild(el('i')); li.appendChild(document.createTextNode(i.text)); ul.appendChild(li) })
      box.appendChild(ul); resultBody.appendChild(box)
    }
    if (c.status === 'ready' && d.type !== 'contract') {          // the entry the agent would post, double entry
      var p = el('div', 'checks'); p.appendChild(el('b', null, T.post.title))
      var tb = el('table', 'est-table post'), head = el('tr'); ;['', T.post.debit, T.post.credit].forEach(function (h, i) { head.appendChild(el('th', i ? 'num' : '', h)) }); tb.appendChild(el('thead')).appendChild(head)
      var body = el('tbody'), eur = r.row.total, vat = d.currency === 'EUR' ? (d.vat || 0) : 0, net = r2(eur - vat)
      var line = function (label, dr, cr) { var tr = el('tr'); tr.appendChild(el('td', null, label)); tr.appendChild(el('td', 'num', dr == null ? '' : fmt(dr))); tr.appendChild(el('td', 'num', cr == null ? '' : fmt(cr))); body.appendChild(tr) }
      line(fill(T.post.exp, { cat: T.cat[d.cat] }), net, null)
      if (vat > 0) line(T.post.vatIn, vat, null)
      line(fill(T.post.pay, { supplier: d.supplier }), null, eur)
      tb.appendChild(body); p.appendChild(tb); resultBody.appendChild(p)
    }
  }

  function process(doc, fast) {
    var r = analyse(doc, seen); results[doc.id] = r
    var chain = Promise.resolve()
    stepsEl.textContent = ''; resultBody.textContent = ''; resetSys(); setPill(agentPill, 'busy'); setPill(resultPill, 'idle')
    stepsFor(r).forEach(function (st) {
      chain = chain.then(function () {
        lightSys(st[0]); var li = addStep(st[1], 'work')
        return wait(fast ? 110 : 480 + Math.random() * 280).then(function () {
          finishStep(li, st[2])
          if (st[0] === 'ledger') { renderSheet(doc.id); renderMonth() }
          if (st[0] === 'client') renderClient()
        })
      })
    })
    return chain.then(function () { lightSys(null); showResult(r); setPill(agentPill, 'done'); setPill(resultPill, 'done'); renderClient(); renderMonth(); renderSheet(doc.id) })
  }
  function selected() {
    if (current < T.docs.length) return T.docs[current]
    var txt = (ownText || '').trim()
    if (txt.length < 15) { showToast(T.pasteNeed); return null }
    return { id: 'own', fromName: T.own, file: '-', text: txt }
  }
  function lock(on) { busy = on; runBtn.disabled = on; allBtn.disabled = on }
  runBtn.addEventListener('click', function () {
    if (busy) return
    var doc = selected(); if (!doc) return
    if (doc.id !== 'own') delete results[doc.id]
    lock(true); process(doc, false).then(function () { lock(false); renderList(); renderReader() })
  })
  allBtn.addEventListener('click', function () {
    if (busy) return
    seen = {}; results = {}; renderSheet(); renderMonth(); renderClient()
    lock(true)
    var chain = Promise.resolve()
    T.docs.forEach(function (doc, i) { chain = chain.then(function () { current = i; renderList(); renderReader(); return process(doc, true) }) })
    chain.then(function () { lock(false); renderList(); renderReader() })
  })

  // ---- journal as a CSV file ----
  function csvText(rows) {
    var q = function (v) { v = v == null ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }
    var lines = [T.csvHead.map(q).join(',')]
    rows.forEach(function (r) { lines.push([r.date, r.supplier, r.no, T.cat[r.cat], r.net == null ? '' : r.net.toFixed(2), r.vat == null ? '' : r.vat.toFixed(2), r.total == null ? '' : r.total.toFixed(2), T.st[r.status], r.conf].map(q).join(',')) })
    return '﻿' + lines.join('\r\n')
  }
  function downloadCsv(rows) {
    var blob = new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a')
    a.href = url; a.download = fill(T.csvName, { period: periodLabel().replace(/\s+/g, '-').toLowerCase() }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
  }
  $('#csv').addEventListener('click', function () { var rows = orderedRows(); if (!rows.length) { showToast(T.emptyRow); return } downloadCsv(rows) })

  // ---- the rules the visitor can change ----
  function initRules() {
    var ps = $('#r-period'), lim = $('#r-limit'), cf = $('#r-conf'), vt = $('#r-vat')
    if (ps) { T.periods.forEach(function (p) { var o = el('option', null, p.label); o.value = p.y + '-' + p.m; ps.appendChild(o) }); ps.addEventListener('change', function () { var v = ps.value.split('-'); rules.period = { y: +v[0], m: +v[1] }; renderClient() }) }
    if (lim) { lim.value = rules.limit; lim.addEventListener('input', function () { var v = parseFloat(lim.value); rules.limit = isFinite(v) && v >= 0 ? v : 0 }) }
    if (cf) { cf.value = rules.conf; cf.addEventListener('input', function () { var v = parseFloat(cf.value); rules.conf = isFinite(v) ? Math.max(0, Math.min(100, v)) : 0 }) }
    if (vt) vt.addEventListener('change', function () { rules.needVat = vt.checked })
  }

  // what the chat agent uses
  window.SWX_ACC = { T: T, LANG: LANG, analyseAll: analyseAll, fmt: fmt, fill: fill, periodLabel: periodLabel, downloadCsv: downloadCsv, rules: rules, firm: FIRM }

  // ---- start ----
  var head = $('#sheet-head'); T.head.forEach(function (h, i) { head.appendChild(el('th', i >= 5 && i <= 7 ? 'num' : '', h)) })
  $('#month-title').textContent = T.monthTitle; $('#client-title').textContent = T.clientTitle; $('#csv').textContent = T.csv; allBtn.textContent = T.runAll
  setPill(agentPill, 'idle'); setPill(resultPill, 'idle')
  initRules(); renderList(); renderReader(); renderSheet(); renderMonth(); renderClient()
})()
