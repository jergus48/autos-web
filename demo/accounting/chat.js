// Accounting demo, agent 2 (the "Client questions" tab on /demo/accounting and /lt/demo/buhalterija): a client asks a question and the agent answers from the same journal and documents as agent 1 (window.SWX_ACC).
// It looks things up, says what it used, and hands the conversation to a person, with a summary, when the question is not one it should answer. Runs in the visitor's browser: nothing is sent anywhere and no AI service is called.
(function () {
  'use strict'
  var box = document.getElementById('c-messages'); if (!box || !window.SWX_ACC) return
  var A = window.SWX_ACC, LANG = A.LANG, fill = A.fill, fmt = A.fmt
  var ACCOUNTANT = 'Jonas'

  var COPY = {
    en: {
      greet: 'Hi, I am the assistant of Kreda Accounting. I can see the documents you sent for {period} ({n} files). Ask me about a document, what is missing, VAT or the month-end.',
      chips: ['Did you get my Shell receipt?', 'What are you missing from me?', 'How much VAT is recorded for March?', 'Can I deduct the VAT on the fuel receipt?', 'When does the month close?', 'Send me the journal', 'Should I lend my company 20,000 EUR?'],
      tools: { journal: 'Journal', docs: 'Document inbox', policy: 'Office policy', person: 'Your accountant' },
      topic: { status: 'status of a document', missing: 'what is missing', vat: 'VAT for the period', deduct: 'VAT deduction', deadline: 'month-end deadline', export: 'a copy of the journal', hello: 'a greeting', human: 'a question for a person' },
      lUnderstood: 'Understood the question: {topic}', lLooked: 'Looked up: {tools}', lAnswered: 'Answered from your documents', lHanded: 'Not something to guess at: handed to {who}', lMore: 'Offered a file to download',
      status: {
        ready: 'Yes, I have {file} ({supplier}, {total}). It is posted in the journal as {cat}.',
        waiting: 'I have {file} ({supplier}, {total}), but I could not post it yet. {ask}',
        duplicate: 'I have {file}, but it is a copy of an invoice I already posted ({orig}), so I did not post it twice.',
        contract: 'I have {file}. It is a contract, not a booking document, so I passed it to {who} to decide how to book it{rent}.',
        review: 'I have {file} ({supplier}, {total}). It is waiting for {who} to approve it.'
      },
      dupNote: ' I also have a second file with the same invoice ({dup}), which I treated as a duplicate.',
      rent: ' (monthly rent {rent})',
      none: 'I could not find that document. These are the files I have: {files}.',
      missingNone: 'Nothing is missing for {period}. Everything you sent is posted or with {who}.',
      missingList: 'For {period} I still need:\n{list}\nSend them by Friday so the month can close.',
      vat: 'For {period} I have posted {n} documents with input VAT of {input}. Another {held} of VAT sits on {m} documents that still need fixing, so it is not counted yet.{rc} Your sales VAT is not part of this demo, so I cannot say what you owe: {who} confirms that.',
      vatRc: ' One invoice has no VAT charged because of reverse charge, which {who} still has to confirm.',
      deduct: 'On our checklist a receipt without the supplier’s VAT number is not enough to deduct the VAT. For the Shell receipt I need the full invoice with the VAT number. With it, the VAT of {vat} can be counted. For anything beyond that checklist, {who} decides.',
      deadline: 'We close {period} on Friday. Documents that arrive later go into the next month. Right now {n} documents still need something: {list}.',
      deadlineNone: 'We close {period} on Friday. Documents that arrive later go into the next month. At the moment nothing is waiting on you.',
      exportTxt: 'Here is the journal for {period} as a file: posted and held items, each with its status.', exportBtn: 'Download CSV',
      hello: 'Hello! How can I help with your {period} documents?',
      handoff: 'I am not sure about that one, and I do not want to guess on a question like this. I have passed it to {who}, your accountant, with a summary. They will reply to you directly.',
      sumTitle: 'Summary passed on', sumQ: 'Question', sumP: 'Period', sumD: 'Documents', sumDv: '{ready} posted, {waiting} waiting for you, {review} with {who}',
      you: 'You', bot: 'Assistant', placeholder: 'Ask a question…'
    },
    lt: {
      greet: 'Sveiki, aš Kreda buhalterijos asistentas. Matau dokumentus, kuriuos atsiuntėte už laikotarpį ({period}), failų: {n}. Klauskite apie dokumentą, ko trūksta, PVM ar laikotarpio uždarymą.',
      chips: ['Ar gavote mano degalinės čekį?', 'Ko iš manęs trūksta?', 'Kiek PVM įrašyta už kovą?', 'Ar galiu atskaityti PVM nuo degalų čekio?', 'Kada uždaromas laikotarpis?', 'Atsiųskite man žurnalą', 'Ar turėčiau paskolinti įmonei 20 000 EUR?'],
      tools: { journal: 'Žurnalas', docs: 'Dokumentų paštas', policy: 'Biuro taisyklės', person: 'Jūsų buhalteris' },
      topic: { status: 'dokumento būsena', missing: 'ko trūksta', vat: 'laikotarpio PVM', deduct: 'PVM atskaita', deadline: 'laikotarpio uždarymo terminas', export: 'žurnalo kopija', hello: 'sveikinimas', human: 'klausimas žmogui' },
      lUnderstood: 'Suprastas klausimas: {topic}', lLooked: 'Peržiūrėta: {tools}', lAnswered: 'Atsakyta pagal jūsų dokumentus', lHanded: 'Čia spėlioti nedera: perduota ({who})', lMore: 'Pasiūlytas atsisiuntimo failas',
      status: {
        ready: 'Taip, failą {file} ({supplier}, {total}) turiu. Jis įrašytas į žurnalą, kategorija: {cat}.',
        waiting: 'Failą {file} ({supplier}, {total}) turiu, bet dar negalėjau jo įrašyti. {ask}',
        duplicate: 'Failą {file} turiu, bet tai jau įrašytos sąskaitos kopija ({orig}), todėl antrą kartą jos neįrašiau.',
        contract: 'Failą {file} turiu. Tai sutartis, o ne apskaitos dokumentas, todėl perdaviau buhalteriui ({who}), kad nuspręstų, kaip ją apskaityti{rent}.',
        review: 'Failą {file} ({supplier}, {total}) turiu. Jis laukia buhalterio ({who}) pritarimo.'
      },
      dupNote: ' Turiu ir antrą failą su ta pačia sąskaita ({dup}), jį laikiau dublikatu.',
      rent: ' (mėnesinė nuoma {rent})',
      none: 'Šio dokumento neradau. Štai failai, kuriuos turiu: {files}.',
      missingNone: 'Už laikotarpį ({period}) nieko netrūksta. Viskas, ką atsiuntėte, įrašyta arba pas buhalterį ({who}).',
      missingList: 'Už laikotarpį ({period}) dar reikia:\n{list}\nAtsiųskite iki penktadienio, kad laikotarpis būtų uždarytas.',
      vat: 'Už laikotarpį ({period}) įrašiau dokumentų: {n}, įskaitomas PVM {input}. Dar {held} PVM yra dokumentuose, kuriuos reikia ištaisyti (jų: {m}), todėl jis kol kas neįskaičiuotas.{rc} Jūsų pardavimų PVM šiame demo nėra, todėl negaliu pasakyti, kiek mokėsite: tai patvirtina buhalteris ({who}).',
      vatRc: ' Viena sąskaita išrašyta be PVM dėl atvirkštinio apmokestinimo, tai dar turi patvirtinti buhalteris ({who}).',
      deduct: 'Pagal mūsų kontrolinį sąrašą kvito be tiekėjo PVM kodo PVM atskaityti nepakanka. Dėl degalinės čekio man reikia pilnos sąskaitos faktūros su PVM kodu. Ją gavus, galima įskaityti {vat} PVM. Dėl visko, kas peržengia šį sąrašą, sprendžia buhalteris ({who}).',
      deadline: 'Laikotarpį ({period}) uždarome penktadienį. Vėliau gauti dokumentai patenka į kitą mėnesį. Šiuo metu dar reikia dokumentų: {n}, tai {list}.',
      deadlineNone: 'Laikotarpį ({period}) uždarome penktadienį. Vėliau gauti dokumentai patenka į kitą mėnesį. Šiuo metu iš jūsų nieko nelaukiame.',
      exportTxt: 'Štai laikotarpio ({period}) žurnalas failu: įrašyti ir sulaikyti dokumentai su jų būsena.', exportBtn: 'Atsisiųsti CSV',
      hello: 'Sveiki! Kuo galiu padėti dėl jūsų dokumentų už laikotarpį ({period})?',
      handoff: 'Dėl šio klausimo nesu tikras ir nenoriu spėlioti. Perdaviau jį jūsų buhalteriui ({who}) su santrauka. Jis atsakys jums tiesiogiai.',
      sumTitle: 'Perduota santrauka', sumQ: 'Klausimas', sumP: 'Laikotarpis', sumD: 'Dokumentai', sumDv: 'Įrašyta: {ready}, laukia jūsų: {waiting}, pas buhalterį ({who}): {review}',
      you: 'Jūs', bot: 'Asistentas', placeholder: 'Užduokite klausimą…'
    }
  }
  var T = COPY[LANG]
  var KEYS = {
    d1: /0412|baltic|biuro|office supplies|paper|toner|folder|popier|tonerio|segtuv/i, d2: /shell|receipt|fuel|diesel|nafta|čekį|čekis|degalin|kvit/i, d3: /scan|0041|duplicate|dublikat|skenav/i,
    d4: /cloudhost|hosting|usd|dollar|talpin/i, d5: /118|studio|studij|logo|dizain/i, d6: /rent|agreement|contract|landlord|nuom|sutart/i
  }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  var busy = false

  function addMsg(role, text, extra) {
    var m = el('div', 'msg ' + role), b = el('div', 'bubble'); b.appendChild(el('span', 'who', role === 'user' ? T.you : T.bot)); b.appendChild(el('p', null, text))
    if (extra) b.appendChild(extra)
    m.appendChild(b); box.appendChild(m); box.scrollTop = box.scrollHeight; return m
  }
  function typing() { var m = el('div', 'msg bot typing'), b = el('div', 'bubble'); b.appendChild(el('span', 'dots', '...')); m.appendChild(b); box.appendChild(m); box.scrollTop = box.scrollHeight; return m }
  function logSteps(steps) {
    var ul = document.getElementById('c-log'); ul.textContent = ''
    return steps.reduce(function (chain, st) {
      return chain.then(function () { var li = el('li', 'step ' + st[1]); li.appendChild(el('span', 'ic')); li.appendChild(el('span', 'tx', st[0])); ul.appendChild(li); return wait(180) })
    }, Promise.resolve())
  }

  function tools(keys) { return keys.map(function (k) { return T.tools[k] }).join(', ') }
  function answer(q) {
    var all = A.analyseAll(), A_ = A.T, period = A.periodLabel(), who = ACCOUNTANT
    var ready = all.filter(function (r) { return r.c.status === 'ready' && r.c.kind !== 'contract' }), waiting = all.filter(function (r) { return r.c.status === 'waiting' }), review = all.filter(function (r) { return r.c.status === 'review' })
    var total = function (r) { return r.d.total != null ? fmtC(r) : '-' }
    function fmtC(r) { return r.d.currency === 'EUR' ? fmt(r.d.total) : (LANG === 'lt' ? r.d.total.toFixed(2).replace('.', ',') + ' ' + r.d.currency : r.d.currency + ' ' + r.d.total.toFixed(2)) }
    var s = q.trim(), out = { topic: 'human', used: ['person'], text: '', handoff: false, action: null }
    if (/^(hi|hello|hey|thanks|thank you|ačiū|aciu|sveiki|labas)\b/i.test(s) && s.split(/\s+/).length <= 4) { out.topic = 'hello'; out.used = ['policy']; out.text = fill(T.hello, { period: period }); return out }
    if (/deduct|reclaim|claim back|atskait|įskaityt|atskaityt/i.test(s)) {
      var fuel = all[1]; out.topic = 'deduct'; out.used = ['docs', 'policy']; out.text = fill(T.deduct, { vat: fmt(fuel.d.vat || 0), who: who }); return out
    }
    if (/should i|can i (write off|expense|lend|borrow)|legal|audit|fine\b|penalty|loan|lend|borrow|payroll|salary|bonus|dividend|tax advice|inspection|bauda|patarim|teisėt|paskol|atlyginim|dividend|inspekc/i.test(s)) { out.handoff = true; return handoff(s, out, all, ready, waiting, review, period, who) }
    if (/export|csv|download|spreadsheet|excel|journal|atsisiųs|atsiuns|eksport|žurnal|zurnal/i.test(s)) { out.topic = 'export'; out.used = ['journal']; out.text = fill(T.exportTxt, { period: period }); out.action = 'csv'; return out }
    if (/(vat|pvm)/i.test(s) && /(how much|total|owe|pay|recorded|sum|kiek|suma|mokėt|įrašyt)/i.test(s)) {
      var input = 0, held = 0, rc = 0
      ready.forEach(function (r) { input += r.d.vat || 0; if (r.d.reverse) rc++ }); waiting.forEach(function (r) { held += r.d.vat || 0 })
      out.topic = 'vat'; out.used = ['journal', 'docs']; out.text = fill(T.vat, { period: period, n: ready.length, input: fmt(input), held: fmt(held), m: waiting.length, rc: rc ? fill(T.vatRc, { who: who }) : '', who: who }); return out
    }
    var hit = Object.keys(KEYS).filter(function (id) { return KEYS[id].test(s) })
    if (hit.length) {
      var id = hit[0] === 'd3' && hit.indexOf('d1') < 0 ? 'd1' : hit[0], r = all[+id.slice(1) - 1], file = r.doc.file
      var dupFile = id === 'd1' ? all[2].doc.file : ''
      var text
      if (r.c.kind === 'contract') text = fill(T.status.contract, { file: file, who: who, rent: r.d.rent != null ? fill(T.rent, { rent: fmt(r.d.rent) }) : '' })
      else if (r.c.status === 'duplicate') text = fill(T.status.duplicate, { file: file, orig: all[0].doc.file })
      else if (r.c.status === 'ready') text = fill(T.status.ready, { file: file, supplier: r.d.supplier, total: total(r), cat: A_.cat[r.row.cat] }) + (dupFile && all[2].c.status === 'duplicate' ? fill(T.dupNote, { dup: dupFile }) : '')
      else if (r.c.status === 'waiting') text = fill(T.status.waiting, { file: file, supplier: r.d.supplier, total: total(r), ask: r.c.holds.map(function (h) { return h.ask }).join(' ') })
      else text = fill(T.status.review, { file: file, supplier: r.d.supplier, total: total(r), who: who })
      out.topic = 'status'; out.used = ['docs', 'journal']; out.text = text; return out
    }
    if (/missing|still need|outstanding|what do you need|need from me|trūksta|ko (dar )?reikia|ko trūksta|ko iš manęs/i.test(s)) {
      out.topic = 'missing'; out.used = ['docs', 'journal']
      var items = []; all.forEach(function (r) { r.c.holds.forEach(function (h) { items.push('- ' + r.doc.file + ': ' + h.ask) }) })
      out.text = items.length ? fill(T.missingList, { period: period, list: items.join('\n') }) : fill(T.missingNone, { period: period, who: who }); return out
    }
    if (/deadline|clos(e|ing)|cut-?off|when.*(month|period)|terminas|uždar|uzdar|kada.*(laikotarp|mėnes)/i.test(s)) {
      out.topic = 'deadline'; out.used = ['policy', 'docs']
      out.text = waiting.length ? fill(T.deadline, { period: period, n: waiting.length, list: waiting.map(function (r) { return r.doc.file }).join(', ') }) : fill(T.deadlineNone, { period: period }); return out
    }
    out.handoff = true
    return handoff(s, out, all, ready, waiting, review, period, who)
  }
  function handoff(s, out, all, ready, waiting, review, period, who) {
    out.topic = 'human'; out.used = ['person']; out.text = fill(T.handoff, { who: who })
    var card = el('div', 'handoff'); card.appendChild(el('b', null, T.sumTitle))
    var dl = el('dl', 'kv')
    ;[[T.sumQ, '“' + s.slice(0, 120) + '”'], [T.sumP, period], [T.sumD, fill(T.sumDv, { ready: ready.length, waiting: waiting.length, review: review.length, who: who })]].forEach(function (p) { dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1])) })
    card.appendChild(dl); out.extra = card
    return out
  }

  function ask(q) {
    q = (q || '').trim(); if (!q || busy) return
    busy = true; document.getElementById('c-send').disabled = true
    addMsg('user', q)
    var t = typing(), res = answer(q)
    var steps = [[fill(T.lUnderstood, { topic: T.topic[res.topic] }), 'ok'], [fill(T.lLooked, { tools: tools(res.used) }), 'ok'], res.handoff ? [fill(T.lHanded, { who: ACCOUNTANT }), 'err'] : [T.lAnswered, 'ok']]
    if (res.action) steps.push([T.lMore, 'ok'])
    logSteps(steps).then(function () { return wait(250) }).then(function () {
      t.remove()
      var extra = res.extra || null
      if (res.action === 'csv') {
        extra = el('button', 'btn btn-ghost', T.exportBtn); extra.type = 'button'
        extra.addEventListener('click', function () { var rows = A.analyseAll().map(function (r) { return r.row }); A.downloadCsv(rows) })
      }
      addMsg('bot', res.text, extra); busy = false; document.getElementById('c-send').disabled = false; document.getElementById('c-input').focus()
    })
  }

  // ---- start ----
  var chips = document.getElementById('c-chips')
  T.chips.forEach(function (c) { var b = el('button', 'chip', c); b.type = 'button'; b.addEventListener('click', function () { ask(c) }); chips.appendChild(b) })
  document.getElementById('c-form').addEventListener('submit', function (e) { e.preventDefault(); var i = document.getElementById('c-input'), v = i.value; i.value = ''; ask(v) })
  document.getElementById('c-input').placeholder = T.placeholder
  addMsg('bot', fill(T.greet, { period: A.periodLabel(), n: A.T.docs.length }))
})()
