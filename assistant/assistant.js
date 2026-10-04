// Solution assistant (/assistant in English, /lt/asistentas in Lithuanian).
// 1. The visitor describes a problem  →  /api/assistant returns solution ideas,
//    matching past projects, scoping questions and an email draft to Swiftrix.
// 2. They can answer the questions to refine the ideas.
// 3. They edit the email, add contacts and send it  →  /api/lead.
// 4. They book a call in the embedded Cal.com calendar, prefilled with what
//    they wrote, so the call starts from their problem.
(function () {
  'use strict'

  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var CAL_LINK = 'swiftrix/30-minute-call'
  var CONTACT = 'info@swiftrix.eu'

  var T = {
    lt: {
      think: ['Analizuoju jūsų problemą…', 'Ieškau tinkamiausių sprendimų…', 'Peržiūriu mūsų ankstesnius projektus…', 'Rašau laišką mūsų komandai…'],
      understood: 'Kaip supratome', offTopic: 'Atsakymas',
      retryHint: 'Aprašykite darbą ar problemą savo įmonėje, kurią norėtumėte palengvinti — pvz. kas ją daro, kiek laiko užima, kokias programas naudojate.', retry: 'Aprašyti kitaip',
      kind: { agent: 'DI agentas', automation: 'Automatizacija', integration: 'Integracija', app: 'Programa' },
      cx: { simple: 'Paprasta', medium: 'Vidutinio sudėtingumo', complex: 'Sudėtinga' },
      tooShort: 'Aprašykite problemą plačiau — bent vienu ar dviem sakiniais.',
      err: { rate: 'Per daug užklausų iš eilės — pabandykite po kelių minučių.', off: 'DI asistentas šiuo metu nepasiekiamas. Parašykite mums laišką žemiau arba iškart užsisakykite pokalbį.', generic: 'Nepavyko gauti atsakymo. Pabandykite dar kartą.' },
      needFields: 'Įrašykite vardą, teisingą el. pašto adresą ir pažymėkite sutikimą.',
      sending: 'Siunčiama…', send: 'Siųsti laišką',
      sent: function () { return 'Ačiū! Laišką gavome ir atsakysime el. paštu. Jei norite greičiau — užsisakykite pokalbį žemiau.' },
      sendOff: 'Automatinis siuntimas šiuo metu neveikia. Atidarykite laišką savo pašto programoje — jis jau paruoštas:',
      openMail: 'Atidaryti pašto programoje',
      sendErr: 'Nepavyko išsiųsti. Pabandykite dar kartą arba parašykite tiesiai ' + CONTACT + '.',
      rateSend: 'Laiškas jau išsiųstas neseniai. Jei norite ką nors pridėti, parašykite tiesiai ' + CONTACT + '.',
      calFail: 'Kalendoriaus nepavyko įkelti.',
      notesPrefix: 'Iš swiftrix.eu DI asistento'
    },
    en: {
      think: ['Analysing your problem…', 'Looking for the best-fitting solutions…', 'Checking our past projects…', 'Writing the email to our team…'],
      understood: 'What we understood', offTopic: 'Reply',
      retryHint: 'Describe a task or problem in your business you’d like to make easier — e.g. who does it, how long it takes, which software you use.', retry: 'Describe it differently',
      kind: { agent: 'AI agent', automation: 'Automation', integration: 'Integration', app: 'Custom app' },
      cx: { simple: 'Simple', medium: 'Medium complexity', complex: 'Complex' },
      tooShort: 'Describe the problem in a bit more detail — at least a sentence or two.',
      err: { rate: 'Too many requests in a row — please try again in a few minutes.', off: 'The AI assistant is unavailable right now. Write to us below or book a call straight away.', generic: 'Couldn’t get an answer. Please try again.' },
      needFields: 'Please enter your name, a valid email address and tick the consent box.',
      sending: 'Sending…', send: 'Send the email',
      sent: function (n) { return 'Thank you, ' + n + '! We’ve received your email and will reply by email. If you’d like to talk sooner, book a call below.' },
      sendOff: 'Automatic sending isn’t working right now. Open the email in your mail app — it’s ready to go:',
      openMail: 'Open in your mail app',
      sendErr: 'Couldn’t send it. Please try again or write to ' + CONTACT + ' directly.',
      rateSend: 'An email was sent from here a moment ago. To add something, write to ' + CONTACT + ' directly.',
      calFail: 'The calendar couldn’t be loaded.',
      notesPrefix: 'From the swiftrix.eu AI assistant'
    }
  }[LANG]

  // The site's own case-study wording (index.html / lt/index.html), keyed by
  // the ids /api/assistant may return.
  var CASES = {
    lt: {
      hakom: ['Dokumentų ir protokolų pasirašymas', 'Suskaitmeninome visą protokolų pasirašymo procesą gamykloje. Darbuotojai prisijungia su savo darbo kortele, mato kiekvieną naują dokumentą, kurį privalo peržiūrėti, ir pasirašo skaitmeniniu būdu — šimtus popierinių formų pakeitėme pilnai sekamu įrašu.', 'hakom.sk'],
      aluprint: ['Dokumentų ir protokolų pasirašymas', 'Tą pačią kortele paremtą pasirašymo sistemą įdiegėme „Aluprint“ gamybos linijoje, kad vadovybė akimirksniu matytų, jog kiekvienas darbuotojas perskaitė ir patvirtino naujausius protokolus — be jokio popierizmo.', 'aluprint.sk'],
      gaya: ['Sąskaitų archyvo valymas', 'Sukūrėme su jų skeneriu sujungtą programą, kuri kiekvieną nuskaitytą popierinę sąskaitą patikrina duomenų bazėje ir tiksliai nurodo darbuotojams, kurias galima išmesti — taip atlaisvinama daug saugyklos vietos.', 'gaya.sk'],
      geosoul: ['Statinių skaičiavimo sistema', 'Individuali programa, atliekanti statinius skaičiavimus jų geotechniniams projektams ir automatiškai sugeneruojanti pritaikytą Word ataskaitą kiekvienam projektui — integruota su jų produktais ir įvertinanti skirtingus inkarų tipus bei grunto sąlygas.', 'geosoul.sk'],
      unisport: ['Duomenų bazės migracija', 'Automatizavome visą jų didelės senos duomenų bazės perkėlimą iš senos svetainės į naują, kartu išvalydami ir pertvarkydami duomenis, kad kiekvienas įrašas atsidurtų tinkamoje vietoje.', 'unisport-kovac.sk'],
      urbarlamac: ['Mėnesiniai nuosavybės skaičiavimai', 'Automatizacija, generuojanti bendrijos mėnesinius Excel išmokų skaičiavimus nariams pagal naujausius nuosavybės dokumentus — varginanti rankinė užduotis dabar atliekama automatiškai.', 'urbarlamac.sk'],
      joinupshift: ['Klipų kūrėjų valdymo portalas', 'Pilnas portalas klipų kūrėjams valdyti nuo pradžios iki pabaigos — pritraukite ir prijunkite juos, valdykite jų paskyras, automatizuokite išmokas ir vienoje suvestinėje stebėkite kiekvieno kūrėjo generuojamus pardavimus, peržiūras ir pajamas.', 'joinupshift.com']
    },
    en: {
      hakom: ['Document & Protocol Signing', 'We digitised the entire protocol sign-off process on the factory floor. Workers log in with their factory ID card, see every new document they must review, and sign off digitally — replacing hundreds of paper forms with a fully auditable record.', 'hakom.sk'],
      aluprint: ['Document & Protocol Signing', 'We rolled out the same card-based signing system across Aluprint’s production line, so management can prove at a glance that every worker has read and accepted the latest protocols — with no paperwork to chase.', 'aluprint.sk'],
      gaya: ['Invoice Archive Cleanup', 'We built a program wired into their scanner that checks each scanned paper invoice against the database and tells staff exactly which ones can be discarded — freeing up a large amount of storage space.', 'gaya.sk'],
      geosoul: ['Structural Calculation Engine', 'A custom app that performs the statics calculations for their geotechnical projects and auto-generates a tailored Word report per project — integrated with their products and handling different anchor types and soil conditions.', 'geosoul.sk'],
      unisport: ['Database Migration', 'We automated the full migration of their very large legacy database from the old website to the new one, cleaning and re-sorting the data on the way so every record landed in the right place.', 'unisport-kovac.sk'],
      urbarlamac: ['Monthly Ownership Calculations', 'An automation that generates the association’s monthly Excel payout calculations for its members based on the latest land-ownership certificates — a tedious manual task that now runs automatically.', 'urbarlamac.sk'],
      joinupshift: ['Clipper Recruitment & Management Portal', 'A complete portal for managing clippers end to end — recruit and onboard them, manage their accounts, automate their payouts, and track the sales, views and revenue each clipper generates from one dashboard.', 'joinupshift.com']
    }
  }[LANG]

  function $(id) { return document.getElementById(id) }
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }
  function fit(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }

  var problemEl = $('problem'), contextEl = $('context'), askBtn = $('ask'), askMsg = $('ask-msg')
  var thinkEl = $('thinking'), ideasCard = $('card-ideas'), ideasEl = $('ideas'), refineEl = $('refine')
  var answersEl = $('answers'), refineBtn = $('refine-btn'), qsEl = $('questions')
  var leadCard = $('card-lead'), subjEl = $('subject'), bodyEl = $('body'), sendBtn = $('send'), sendMsg = $('send-msg')
  var bookCard = $('card-book')
  var last = null // the latest /api/assistant result
  var busy = false

  // ---- starter chips ----
  document.querySelectorAll('[data-starter]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = b.getAttribute('data-starter')
      problemEl.value = problemEl.value.trim() ? problemEl.value.replace(/\s*$/, '\n') + s : s
      problemEl.focus()
      problemEl.setSelectionRange(problemEl.value.length, problemEl.value.length)
    })
  })

  // ---- step 1 → 2: ask for ideas ----
  var thinkTimer = null
  function startThinking() {
    thinkEl.hidden = false
    thinkEl.textContent = ''
    var ul = el('ul', 'steps')
    thinkEl.appendChild(ul)
    var i = 0
    function next() {
      var prev = ul.lastChild
      if (prev) prev.className = 'step ok'
      if (i >= T.think.length) return
      var li = el('li', 'step work')
      li.appendChild(el('span', 'ic'))
      li.appendChild(el('span', 'tx', T.think[i++]))
      ul.appendChild(li)
      thinkTimer = setTimeout(next, 1400)
    }
    next()
  }
  function stopThinking() { clearTimeout(thinkTimer); thinkEl.hidden = true }

  function ask(withAnswers) {
    if (busy) return
    var problem = problemEl.value.trim()
    askMsg.textContent = ''
    if (problem.length < 30) { askMsg.textContent = T.tooShort; askMsg.className = 'msg err'; problemEl.focus(); return }
    busy = true
    askBtn.disabled = true
    refineBtn.disabled = true
    startThinking()
    if (withAnswers) thinkEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: problem, context: contextEl.value.trim(), answers: withAnswers ? answersEl.value.trim() : '', lang: LANG })
    }).then(function (res) {
      return res.json().catch(function () { return {} }).then(function (d) { return { status: res.status, data: d } })
    }).then(function (out) {
      stopThinking()
      if (out.status === 200 && out.data.result) return showIdeas(out.data.result)
      askMsg.className = 'msg err'
      askMsg.textContent = out.status === 429 ? T.err.rate : out.status === 503 ? T.err.off : T.err.generic
      // Assistant off: still let them write to us and book a call.
      if (out.status === 503) { showLead({ subject: '', body: problem }); bookCard.hidden = false }
    }).catch(function () {
      stopThinking()
      askMsg.className = 'msg err'
      askMsg.textContent = T.err.generic
    }).then(function () {
      busy = false
      askBtn.disabled = false
      refineBtn.disabled = false
    })
  }
  askBtn.addEventListener('click', function () { ask(false) })
  refineBtn.addEventListener('click', function () { ask(true) })

  function showIdeas(r) {
    last = r
    ideasEl.textContent = ''
    var u = el('div', 'understood' + (r.relevant ? '' : ' off'))
    u.appendChild(el('b', null, r.relevant ? T.understood : T.offTopic))
    u.appendChild(document.createTextNode(r.understanding))
    ideasEl.appendChild(u)

    // Declined (chit-chat, a test, a poem request…): point back to the form
    // instead of leaving a dead end.
    if (!r.relevant) {
      ideasEl.appendChild(el('p', 'lead-note', T.retryHint))
      var again = el('button', 'btn btn-ghost', T.retry)
      again.type = 'button'
      again.addEventListener('click', function () {
        problemEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        problemEl.focus()
        problemEl.select()
      })
      ideasEl.appendChild(again)
    }

    if (r.relevant && r.solutions.length) {
      var sols = el('div', 'sols')
      r.solutions.forEach(function (s, i) {
        var card = el('article', 'sol')
        card.style.animationDelay = (i * 120) + 'ms'
        var top = el('div', 'sol-top')
        top.appendChild(el('span', 'tag-kind', T.kind[s.kind] || s.kind))
        top.appendChild(el('span', 'tag-cx', T.cx[s.complexity] || s.complexity))
        card.appendChild(top)
        card.appendChild(el('h3', null, (i + 1) + '. ' + s.title))
        var ol = el('ol')
        s.steps.forEach(function (st) { ol.appendChild(el('li', null, st)) })
        card.appendChild(ol)
        if (s.systems.length) {
          var sy = el('div', 'sol-sys')
          s.systems.forEach(function (x) { sy.appendChild(el('span', null, x)) })
          card.appendChild(sy)
        }
        if (s.benefit) card.appendChild(el('p', 'sol-benefit', s.benefit))
        sols.appendChild(card)
      })
      ideasEl.appendChild(sols)
    }

    if (r.relevant && r.cases.length) {
      ideasEl.appendChild(el('h3', 'sub-h', ideasEl.getAttribute('data-cases')))
      var cs = el('div', 'cases')
      r.cases.forEach(function (id) {
        var c = CASES[id]
        if (!c) return
        var box = el('div', 'case')
        box.appendChild(el('h4', null, c[0]))
        box.appendChild(el('p', null, c[1]))
        box.appendChild(el('span', null, c[2]))
        cs.appendChild(box)
      })
      ideasEl.appendChild(cs)
    }

    refineEl.hidden = !(r.relevant && r.questions.length)
    qsEl.textContent = ''
    r.questions.forEach(function (q) { qsEl.appendChild(el('li', null, q)) })

    if (window.SwiftrixCalc && r.relevant) window.SwiftrixCalc.prefill(r.time, problemEl.value)
    ideasCard.hidden = false
    bookCard.hidden = false
    if (r.relevant && r.email.body) showLead(r.email)
    else leadCard.hidden = true
    ideasCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- step 3: send the email ----
  function showLead(email) {
    subjEl.value = email.subject || ''
    bodyEl.value = email.body || ''
    leadCard.hidden = false
    $('lead-form').hidden = false
    $('lead-done').hidden = true
    sendMsg.textContent = ''
    fit(bodyEl)
  }
  bodyEl.addEventListener('input', function () { fit(bodyEl) })

  function mailtoHref() {
    var body = bodyEl.value.trim()
    var sig = [$('name').value.trim(), $('company').value.trim(), $('phone').value.trim()].filter(Boolean).join('\n')
    if (sig) body += '\n\n' + sig
    if (calcSummary()) body += '\n\n' + calcSummary()
    return 'mailto:' + CONTACT + '?subject=' + encodeURIComponent(subjEl.value.trim()) + '&body=' + encodeURIComponent(body.slice(0, 1800))
  }

  sendBtn.addEventListener('click', function () {
    var name = $('name').value.trim(), email = $('email').value.trim()
    sendMsg.className = 'msg err'
    if (name.length < 2 || !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email) || !$('consent').checked) { sendMsg.textContent = T.needFields; return }
    if (bodyEl.value.trim().length < 20) { sendMsg.textContent = T.tooShort; bodyEl.focus(); return }
    sendBtn.disabled = true
    sendBtn.textContent = T.sending
    sendMsg.textContent = ''
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lang: LANG, name: name, email: email,
        company: $('company').value.trim(), phone: $('phone').value.trim(),
        subject: subjEl.value.trim(), body: bodyEl.value.trim(),
        problem: problemEl.value.trim(), context: contextEl.value.trim(), answers: answersEl.value.trim(),
        ideas: last ? { solutions: last.solutions, cases: last.cases } : {},
        calc: calcSummary(),
        website: $('website').value, consent: true
      })
    }).then(function (res) { return res.status }).catch(function () { return 0 }).then(function (status) {
      sendBtn.disabled = false
      sendBtn.textContent = T.send
      if (status === 200) {
        $('lead-form').hidden = true
        var done = $('lead-done')
        done.hidden = false
        done.lastChild.textContent = T.sent(name)
        bookCard.hidden = false
        return
      }
      sendMsg.textContent = ''
      if (status === 503) {
        sendMsg.className = 'msg'
        sendMsg.appendChild(document.createTextNode(T.sendOff + ' '))
        var a = el('a', null, T.openMail)
        a.href = mailtoHref()
        sendMsg.appendChild(a)
        return
      }
      sendMsg.textContent = status === 429 ? T.rateSend : T.sendErr
    })
  })

  function calcSummary() { return window.SwiftrixCalc ? window.SwiftrixCalc.summary() : '' }

  // ---- step 4: book a call (Cal.com inline embed, loaded on demand) ----
  function calNotes() {
    var calc = calcSummary()
    var notes = T.notesPrefix + ':\n' + (subjEl.value.trim() ? subjEl.value.trim() + '\n\n' : '') + problemEl.value.trim()
    // Keep the calculator line even when the problem text is long.
    return calc ? notes.slice(0, 880 - calc.length) + '\n\n' + calc : notes.slice(0, 900)
  }
  function calUrl() {
    var q = ['notes=' + encodeURIComponent(calNotes())]
    if ($('name').value.trim()) q.push('name=' + encodeURIComponent($('name').value.trim()))
    if ($('email').value.trim()) q.push('email=' + encodeURIComponent($('email').value.trim()))
    return 'https://cal.com/' + CAL_LINK + '?' + q.join('&')
  }
  $('book').addEventListener('click', function () {
    var box = $('cal-embed')
    $('cal-alt').href = calUrl()
    if (box.getAttribute('data-loaded')) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
    box.setAttribute('data-loaded', '1')
    box.classList.add('on')
    // Cal.com's standard embed loader (https://cal.com/docs/core-features/embed).
    ;(function (C, A, L) { var p = function (a, ar) { a.q.push(ar) }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; var s = d.head.appendChild(d.createElement('script')); s.src = A; s.onerror = calFailed; cal.loaded = true } if (ar[0] === L) { var api = function () { p(api, arguments) }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]) } else p(cal, ar); return } p(cal, ar) } })(window, 'https://app.cal.com/embed/embed.js', 'init')
    var theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    var config = { layout: 'month_view', theme: theme, notes: calNotes() }
    if ($('name').value.trim()) config.name = $('name').value.trim()
    if ($('email').value.trim()) config.email = $('email').value.trim()
    window.Cal('init', 'swx', { origin: 'https://cal.com' })
    window.Cal.ns.swx('inline', { elementOrSelector: '#cal-embed', calLink: CAL_LINK, config: config })
    window.Cal.ns.swx('ui', { theme: theme, hideEventTypeDetails: false, layout: 'month_view' })
    $('cal-alt-wrap').hidden = false
  })
  function calFailed() {
    var box = $('cal-embed')
    box.classList.remove('on')
    box.textContent = ''
    box.appendChild(el('p', 'msg err', T.calFail))
  }
})()
