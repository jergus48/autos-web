// Construction demo, agent 2 (the "Site updates" tab on /demo/construction and /lt/demo/statyba): a foreman's message from the site becomes a ticked-off checklist, a forecast, an update for the client,
// an order for the supplier and an alert for the manager. Runs in the visitor's browser on example messages and example projects: nothing is sent anywhere and no AI service is called.
(function () {
  'use strict'
  var host = document.getElementById('s-list'); if (!host) return
  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var COMPANY = 'Nova Statyba'
  var TODAY = new Date()

  var PROJECTS = {
    p1: { name: { en: 'Bathroom, Žirmūnai', lt: 'Vonios kambarys, Žirmūnai' }, kw: /bathroom|vonia|vonios|žirmūn/i,
      tasks: [['demolition', 1, /removed|demolish|demolition|torn out|ripped out|nugriov|išardy|pašalin|nuimt/i], ['plumbing', 2, /plumbing|rough-?in|santechnik|vamzdyn/i], ['waterproofing', 2, /waterproof|membrane|hidroizol/i],
        ['tiling', 3, /(tiling|tiles) (is |are )?(done|finished|laid|fixed|complete)|išklijuot|plytelės (įklijuotos|baigtos)/i], ['fixtures', 2, /(fixtures|toilet|shower|sink) (is |are )?(installed|fitted|done)|įrengt/i],
        ['electrics', 1, /(electrics|wiring|electrical) (is |are )?(done|finished|complete)|elektra (baigta|įrengta)/i], ['cleanup', 1, /cleaned|clean-?up done|cleaning done|sutvarkyta|išvalyta/i]] },
    p2: { name: { en: 'House painting, Kaunas', lt: 'Namo dažymas, Kaunas' }, kw: /paint|dažy|dažym|dažai|namo daž|kaun/i,
      tasks: [['masking', 1, /masked|masking|taped|užklijuota|užmaskuo/i], ['primer', 1, /primed|primer|gruntuota|nugruntuot|gruntav/i], ['walls', 4, /two coats|2 coats|second coat|painted|nudažyt|dažyta|nudažėme/i],
        ['ceilings', 2, /ceilings? (painted|done|finished)|lubos (nudažytos|baigtos)/i], ['touchup', 1, /touch-?up|pataisymai (atlikti|baigti)/i], ['cleanup', 1, /cleaned|clean-?up done|cleaning done|sutvarkyta|išvalyta/i]] },
    p3: { name: { en: 'Extension, Panevėžys', lt: 'Priestatas, Panevėžys' }, kw: /extension|foundation|priestat|pamat|panevėž/i,
      tasks: [['excavation', 2, /(trenches|excavation|foundation pit)( are| is)? (dug|done|finished)|trenches dug|iškast|iškasėme/i], ['rebar', 2, /rebar|reinforcement|armatūr/i], ['concrete', 3, /concrete (poured|done|finished|laid)|betonas (supiltas|išpiltas)|betonuota/i],
        ['walls', 8, /walls? (up|built|done|finished)|sienos (pastatytos|baigtos)/i], ['roof', 5, /roof (done|finished|on)|stogas (baigtas|uždėtas)/i], ['windows', 2, /windows (fitted|installed|done)|langai (sumontuoti|įstatyti)/i]] }
  }
  var MAT = [
    { id: 'adhesive', kw: /adhesive|klij/i, name: { en: 'Tile adhesive 25 kg', lt: 'Plytelių klijai 25 kg' }, unit: { en: 'bag', lt: 'maiš.' }, price: 18 },
    { id: 'paint', kw: /paint|dažų|dažai/i, name: { en: 'White paint 15 l', lt: 'Balti dažai 15 l' }, unit: { en: 'bucket', lt: 'kib.' }, price: 78 },
    { id: 'membrane', kw: /membrane|hidroizol/i, name: { en: 'Waterproofing membrane', lt: 'Hidroizoliacinė membrana' }, unit: { en: 'roll', lt: 'rul.' }, price: 45 },
    { id: 'grout', kw: /grout|siūlių/i, name: { en: 'Tile grout', lt: 'Siūlių užpildas' }, unit: { en: 'kg', lt: 'kg' }, price: 12 },
    { id: 'gravel', kw: /gravel|žvyr/i, name: { en: 'Gravel', lt: 'Žvyras' }, unit: { en: 'tonne', lt: 't' }, price: 26 },
    { id: 'cement', kw: /cement/i, name: { en: 'Cement 25 kg', lt: 'Cementas 25 kg' }, unit: { en: 'bag', lt: 'maiš.' }, price: 9 },
    { id: 'tiles', kw: /\btiles?\b|plytel/i, name: { en: 'Floor tiles', lt: 'Grindų plytelės' }, unit: { en: 'm²', lt: 'kv. m' }, price: 32 }
  ]

  var COPY = {
    en: {
      from: 'From', subject: 'Message', run: 'Run the agent', rerun: 'Run again', own: 'Your own message', ownSubj: 'Paste a site message', idle: 'Idle', busy: 'Working', done: 'Done',
      sys: { chat: 'Site chat', plan: 'Project plan', stock: 'Material prices', rules: 'Your rules', mail: 'Mailbox', alert: 'Manager' },
      tasks: { demolition: 'Demolition', plumbing: 'Plumbing', waterproofing: 'Waterproofing', tiling: 'Tiling', fixtures: 'Fixtures', electrics: 'Electrics', cleanup: 'Cleanup', masking: 'Masking', primer: 'Primer', walls: 'Walls', ceilings: 'Ceilings', touchup: 'Touch-ups', excavation: 'Excavation', rebar: 'Rebar', concrete: 'Concrete', roof: 'Roof', windows: 'Windows' },
      cause: { rain: 'rain', cancel: 'a cancelled delivery', access: 'no access to the site' },
      sRead: 'Read the site message ({name}, {app})', sProject: 'Matched the project: {p}', sNoProject: 'Could not tell which project this is about', sTick: 'Ticked off: {list}', sNoTick: 'No finished steps found in the message',
      sProg: 'Progress {pct}%: about {n} working days left, forecast finish {date}', sMat: 'Materials needed: {list}', sPriced: 'Priced from your material list: {total}',
      sRules: 'Checked your rules: delay alert from {d} days, orders up to {m} go out on their own', sClient: 'Wrote the update for the client', sOrder: 'Prepared the order for the supplier', sAlert: 'Alerted the manager: delay of about {n} working days', sAsk: 'Wrote a question to the foreman',
      progress: 'Progress', stepsDone: '{n} of {t} steps done', forecast: 'Forecast finish', left: 'about {n} working days left',
      outClient: 'Update for the client', outOrder: 'Order for the supplier', outAlert: 'Alert for the manager', outAsk: 'Question to the foreman', to: 'To', subj: 'Subject',
      approve: 'Approve and send', needApproval: 'Needs your approval (over {m})', autoSend: 'Goes out on its own (under {m})', send: 'Send alert', toast: 'In the real system this would be sent now.',
      clientBody: 'Hello,\n\nUpdate on {project} ({date}):\n\nProgress: {pct}% ({n} of {t} steps done).\nDone: {done}.\nNext: {next}.\n{delay}{answer}\nWe will keep you posted.\n\nBest regards,\n{co}',
      delayLine: '\nDelay: {cause}, about {n} working days.', ansDate: '\nYou asked about finishing by the {d}th: we expect to finish around {date}, so {verdict}.', verdictOk: 'this is on track', verdictNo: 'we cannot promise that date',
      ansStage: '\nYou asked when the next stage starts: we expect it around {date}.',
      orderBody: 'Hello,\n\nPlease deliver to {project} tomorrow by 8:00:\n\n{lines}\n\nThank you,\n{co}', alertBody: '{project} is delayed by about {n} working days because of {cause}. The client has been told. New forecast finish: {date}.',
      askBody: 'Thanks. To update the plan we need a bit more: what was finished today, any problems or delays, any materials you need, and a photo of the work.',
      noneYet: 'nothing yet', nextNone: 'finishing touches', projects: 'Projects', rules: 'Your rules', ruleDelay: 'Alert the manager from', ruleDays: 'working days of delay', ruleLimit: 'Order on its own up to', materials: 'Your material prices',
      orders: 'Orders.xlsx', ordHead: ['#', 'Project', 'Item', 'Qty', 'Est. cost', 'Status'], ordEmpty: 'No orders yet. Run the agent on a message that mentions missing materials.', ordAuto: 'Sent', ordApprove: 'Needs approval', ordPrice: 'Price on request',
      matHead: ['Item', 'Unit', 'Price'], delayBadge: '+{n} d', pasteNeed: 'Paste the text of a site message first.', unknownItem: 'Unknown item',
      msgs: [
        { id: 'm1', project: 'p1', fromName: 'Rokas, foreman', app: 'chat "Žirmūnai bathroom"', time: '17:42', body: 'Day 6. Old tiles are removed and the plumbing rough-in is done. Waterproofing is applied, it needs 2 days to cure before tiling. We are short of tile adhesive, need 3 bags tomorrow morning. Client asked if we can still finish by the 25th.' },
        { id: 'm2', project: 'p2', fromName: 'Darius, painter', app: 'chat "Kaunas house"', time: '16:20', body: 'Hall and living room painted, two coats. Bedrooms are primed, painting them tomorrow. Need 2 buckets of white paint 15 l. No access to the study until Thursday, the client is away.' },
        { id: 'm3', project: 'p3', fromName: 'Vytas, site manager', app: 'chat "Panevėžys extension"', time: '15:05', body: 'Foundation trenches dug and rebar placed. The concrete truck was cancelled because of rain, rescheduled in 3 days. Need 2 tonnes of gravel for the base. Client wants to know when the next stage can start.' },
        { id: 'm4', project: 'p1', fromName: 'Rokas, foreman', app: 'chat "Žirmūnai bathroom"', time: '18:30', body: 'all ok' }
      ]
    },
    lt: {
      from: 'Nuo', subject: 'Žinutė', run: 'Paleisti agentą', rerun: 'Paleisti iš naujo', own: 'Jūsų žinutė', ownSubj: 'Įklijuokite žinutę iš objekto', idle: 'Laukia', busy: 'Dirba', done: 'Baigta',
      sys: { chat: 'Objekto pokalbis', plan: 'Projekto planas', stock: 'Medžiagų kainos', rules: 'Jūsų taisyklės', mail: 'Paštas', alert: 'Vadovas' },
      tasks: { demolition: 'Ardymas', plumbing: 'Santechnika', waterproofing: 'Hidroizoliacija', tiling: 'Plytelių klijavimas', fixtures: 'Įranga', electrics: 'Elektra', cleanup: 'Sutvarkymas', masking: 'Maskavimas', primer: 'Gruntas', walls: 'Sienos', ceilings: 'Lubos', touchup: 'Pataisymai', excavation: 'Kasimas', rebar: 'Armatūra', concrete: 'Betonas', roof: 'Stogas', windows: 'Langai' },
      cause: { rain: 'lietus', cancel: 'atšauktas pristatymas', access: 'nėra prieigos prie objekto' },
      sRead: 'Perskaityta žinutė iš objekto ({name}, {app})', sProject: 'Priskirta projektui: {p}', sNoProject: 'Nepavyko nustatyti, kuriam projektui žinutė skirta', sTick: 'Pažymėta atlikta: {list}', sNoTick: 'Žinutėje nerasta atliktų etapų',
      sProg: 'Pažanga {pct} %: liko apie {n} darbo d., numatoma pabaiga {date}', sMat: 'Reikalingos medžiagos: {list}', sPriced: 'Įkainota pagal jūsų medžiagų kainas: {total}',
      sRules: 'Patikrintos jūsų taisyklės: vadovui pranešama nuo {d} d. vėlavimo, užsakymai iki {m} išsiunčiami patys', sClient: 'Parašytas pranešimas klientui', sOrder: 'Paruoštas užsakymas tiekėjui', sAlert: 'Pranešta vadovui: vėluojama apie {n} darbo d.', sAsk: 'Parašytas klausimas meistrui',
      progress: 'Pažanga', stepsDone: 'Atlikta {n} iš {t} etapų', forecast: 'Numatoma pabaiga', left: 'liko apie {n} darbo d.',
      outClient: 'Pranešimas klientui', outOrder: 'Užsakymas tiekėjui', outAlert: 'Pranešimas vadovui', outAsk: 'Klausimas meistrui', to: 'Kam', subj: 'Tema',
      approve: 'Patvirtinti ir siųsti', needApproval: 'Reikia jūsų pritarimo (daugiau nei {m})', autoSend: 'Išsiunčiama pati (iki {m})', send: 'Siųsti pranešimą', toast: 'Tikroje sistemoje tai dabar būtų išsiųsta.',
      clientBody: 'Sveiki,\n\nPranešame apie objektą „{project}“ ({date}):\n\nPažanga: {pct} % (atlikta {n} iš {t} etapų).\nAtlikta: {done}.\nToliau: {next}.\n{delay}{answer}\nInformuosime ir toliau.\n\nPagarbiai,\n{co}',
      delayLine: '\nVėlavimas: {cause}, apie {n} darbo d.', ansDate: '\nKlausėte, ar baigsime iki {d} d.: numatome baigti apie {date}, todėl {verdict}.', verdictOk: 'spėsime', verdictNo: 'tos datos pažadėti negalime',
      ansStage: '\nKlausėte, kada prasidės kitas etapas: numatome apie {date}',
      orderBody: 'Sveiki,\n\nPrašome rytoj iki 8:00 pristatyti į objektą „{project}“:\n\n{lines}\n\nAčiū,\n{co}', alertBody: 'Objektas „{project}“ vėluoja apie {n} darbo d.: {cause}. Klientas informuotas. Nauja numatoma pabaiga: {date}',
      askBody: 'Ačiū. Kad atnaujintume planą, reikia šiek tiek daugiau: kas šiandien baigta, ar buvo problemų ar vėlavimų, kokių medžiagų reikia, ir darbo nuotraukos.',
      noneYet: 'kol kas nieko', nextNone: 'galutiniai darbai', projects: 'Projektai', rules: 'Jūsų taisyklės', ruleDelay: 'Pranešti vadovui nuo', ruleDays: 'darbo d. vėlavimo', ruleLimit: 'Užsakyti savarankiškai iki', materials: 'Jūsų medžiagų kainos',
      orders: 'Orders.xlsx', ordHead: ['#', 'Projektas', 'Prekė', 'Kiekis', 'Kaina', 'Būsena'], ordEmpty: 'Užsakymų dar nėra. Paleiskite agentą su žinute, kurioje trūksta medžiagų.', ordAuto: 'Išsiųsta', ordApprove: 'Reikia pritarimo', ordPrice: 'Kaina pagal užklausą',
      matHead: ['Prekė', 'Vienetas', 'Kaina'], delayBadge: '+{n} d.', pasteNeed: 'Pirmiausia įklijuokite žinutės tekstą.', unknownItem: 'Nežinoma prekė',
      msgs: [
        { id: 'm1', project: 'p1', fromName: 'Rokas, meistras', app: 'pokalbis „Žirmūnų vonia“', time: '17:42', body: 'Šeštoji diena. Senos plytelės nuimtos, vamzdynas sumontuotas. Hidroizoliacija užtepta, prieš plyteles ji turi džiūti 2 dienas. Trūksta plytelių klijų, rytoj ryte reikia 3 maišų. Klientas klausė, ar vis dar spėsime baigti iki 25 d.' },
        { id: 'm2', project: 'p2', fromName: 'Darius, dažytojas', app: 'pokalbis „Kauno namas“', time: '16:20', body: 'Prieškambaris ir svetainė nudažyti, du sluoksniai. Miegamieji nugruntuoti, juos dažysime rytoj. Reikia 2 kibirų baltų dažų po 15 l. Į kabinetą iki ketvirtadienio patekti negalime, klientas išvykęs.' },
        { id: 'm3', project: 'p3', fromName: 'Vytas, objekto vadovas', app: 'pokalbis „Panevėžio priestatas“', time: '15:05', body: 'Pamatų tranšėjos iškastos, armatūra sumontuota. Betono sunkvežimis atšauktas dėl lietaus, perkeltas 3 dienoms. Reikia 2 tonų žvyro pagrindui. Klientas klausia, kada galėsime pradėti kitą etapą.' },
        { id: 'm4', project: 'p1', fromName: 'Rokas, meistras', app: 'pokalbis „Žirmūnų vonia“', time: '18:30', body: 'viskas gerai' }
      ]
    }
  }
  var T = COPY[LANG]
  var nf = new Intl.NumberFormat(LANG === 'lt' ? 'lt-LT' : 'en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  function fmt(n) { return nf.format(Math.round(n)) }
  function fill(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m }) }
  function $(s) { return document.querySelector(s) }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms) }) }

  // ---- dates: working days from today ----
  function addWork(n) { var d = new Date(TODAY.getTime()), left = Math.max(0, Math.ceil(n)); while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left-- } return d }
  function unitOf(mat, qty) { var u = mat.unit[LANG]; return LANG === 'en' && qty !== 1 && !/^(kg|m²)$/.test(u) ? u + 's' : u }
  function dateStr(d) { return d.toLocaleDateString(LANG === 'lt' ? 'lt-LT' : 'en-GB', { day: 'numeric', month: 'long' }) }

  // ---- reading the message ----
  function guessProject(text) { var best = null; Object.keys(PROJECTS).forEach(function (id) { if (!best && PROJECTS[id].kw.test(text)) best = id }); return best }
  function readMessage(text, pid) {
    var t = text.replace(/\s+/g, ' '), sents = t.replace(/([.!?])\s+/g, '$1\u0001').split('\u0001')
    var out = { pid: pid || guessProject(t), done: [], mats: [], delay: 0, cause: null, askDate: null, askStage: false }
    var proj = out.pid ? PROJECTS[out.pid] : null
    if (proj) proj.tasks.forEach(function (tk) { if (tk[2].test(t)) out.done.push(tk[0]) })
    sents.forEach(function (s) {
      if (/need|needs|short of|missing|reikia|trūksta/i.test(s)) {
        var mat = MAT.filter(function (m) { return m.kw.test(s) })[0], q = s.match(/(\d+(?:[.,]\d+)?)\s*(bags?|buckets?|boxes?|rolls?|tonnes?|tons?|kg|m2|pcs|maiš\S*|kibir\S*|dėž\S*|rulon\S*|ton\S*|vnt)/i)
        if (mat) out.mats.push({ mat: mat, qty: q ? parseFloat(q[1].replace(',', '.')) : 1 })
      }
      if (/cancel|postpon|reschedul|no access|rain|atšauk|perkelt|negalime patekti|lietus|lietaus/i.test(s)) {
        var d = s.match(/(\d+)\s*(?:days?|d\b|dien\S*)/i), cause = /rain|lietus|lietaus/i.test(s) ? 'rain' : /cancel|atšauk/i.test(s) ? 'cancel' : 'access'
        if (d && /cancel|postpon|reschedul|atšauk|perkelt/i.test(s)) { out.delay += parseInt(d[1], 10); out.cause = cause === 'access' ? out.cause : cause } else if (!out.cause && cause === 'access') out.blocker = cause
      }
      var ad = s.match(/(?:by the|until|by|iki)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
      if (ad && /ask|know|client|klient|klaus|can|spėsim|finish|baigti/i.test(s)) out.askDate = parseInt(ad[1], 10)
      if (/when (?:can |will )?(?:the )?(?:walls? |next stage |next step )?(?:can )?start|kada .*(?:pradėti|prasidės)/i.test(s) && /client|klient/i.test(s)) out.askStage = true
    })
    return out
  }

  // ---- the state of the projects, rebuilt from the messages that were processed ----
  var results = {}, rules = { delay: 2, limit: 100 }, current = 0, busy = false, ownText = ''
  function stateOf(pid) {
    var proj = PROJECTS[pid], done = {}, delay = 0
    Object.keys(results).forEach(function (mid) { var r = results[mid].read; if (r.pid === pid) { r.done.forEach(function (k) { done[k] = 1 }); delay += r.delay } })
    var total = proj.tasks.reduce(function (n, tk) { return n + tk[1] }, 0), doneW = proj.tasks.reduce(function (n, tk) { return n + (done[tk[0]] ? tk[1] : 0) }, 0), nDone = proj.tasks.filter(function (tk) { return done[tk[0]] }).length
    var leftDays = total - doneW + delay
    return { done: done, delay: delay, pct: Math.round((doneW / total) * 100), nDone: nDone, nTotal: proj.tasks.length, leftDays: leftDays, finish: addWork(leftDays) }
  }
  function nextTasks(pid, st) { return PROJECTS[pid].tasks.filter(function (tk) { return !st.done[tk[0]] }).slice(0, 2).map(function (tk) { return T.tasks[tk[0]] }) }
  // the next stage starts when the step that is being worked on now is finished, after any delay
  function stageStart(pid, st) { var open = PROJECTS[pid].tasks.filter(function (tk) { return !st.done[tk[0]] }); return addWork(st.delay + (open.length ? open[0][1] : 0)) }

  // ---- screen pieces ----
  var list = $('#s-list'), reader = $('#s-reader'), runBtn = $('#s-run'), stepsEl = $('#s-steps'), agentPill = $('#s-agent-pill'), resultBody = $('#s-result-body'), resultPill = $('#s-result-pill'), toast = $('#toast'), sysEls = {}
  document.querySelectorAll('[data-ssys]').forEach(function (n) { n.textContent = T.sys[n.getAttribute('data-ssys')]; sysEls[n.getAttribute('data-ssys')] = n })
  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.classList.remove('show') }, 3000) }
  function setPill(pill, state) { pill.className = 'pill' + (state === 'busy' ? ' working' : state === 'done' ? ' done' : ''); pill.lastChild.textContent = T[state] }
  function lightSys(key) { Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on') }); if (key && sysEls[key]) sysEls[key].classList.add('on', 'used') }
  function resetSys() { Object.keys(sysEls).forEach(function (k) { sysEls[k].classList.remove('on', 'used') }) }
  function addStep(text, state) { var li = el('li', 'step ' + state); li.appendChild(el('span', 'ic')); li.appendChild(el('span', 'tx', text)); stepsEl.appendChild(li); return li }

  function renderList() {
    list.textContent = ''
    T.msgs.concat([{ id: 'own', fromName: T.own, app: T.ownSubj, time: '✎' }]).forEach(function (s, i) {
      var li = el('li'), b = el('button', 'mail-item' + (results[s.id] ? ' processed' : ''))
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === current))
      var from = el('span', 'mail-from', s.fromName); from.appendChild(el('span', 'done-dot')); b.appendChild(from)
      b.appendChild(el('span', 'mail-time', s.time)); b.appendChild(el('span', 'mail-subj', s.app))
      b.addEventListener('click', function () { if (!busy) { current = i; renderList(); renderReader() } })
      li.appendChild(b); list.appendChild(li)
    })
  }
  function renderReader() {
    reader.textContent = ''
    if (current < T.msgs.length) {
      var s = T.msgs[current], meta = el('div', 'reader-meta')
      meta.appendChild(el('b', null, T.from + ': ')); meta.appendChild(document.createTextNode(s.fromName)); meta.appendChild(el('br'))
      meta.appendChild(el('b', null, T.subject + ': ')); meta.appendChild(document.createTextNode(s.app))
      reader.appendChild(meta); reader.appendChild(el('p', 'reader-body', s.body))
      runBtn.textContent = results[s.id] ? T.rerun : T.run
    } else {
      var box = el('div', 'own'), ta = el('textarea')
      ta.maxLength = 2000; ta.placeholder = reader.getAttribute('data-placeholder'); ta.value = ownText; ta.addEventListener('input', function () { ownText = ta.value })
      box.appendChild(ta); box.appendChild(el('p', 'hint', reader.getAttribute('data-privacy'))); reader.appendChild(box); runBtn.textContent = T.run
    }
  }

  function renderBoard() {
    var b = $('#s-board'); b.textContent = ''
    Object.keys(PROJECTS).forEach(function (pid) {
      var st = stateOf(pid), card = el('div', 'pcard'), head = el('div', 'pcard-h'); head.appendChild(el('b', null, PROJECTS[pid].name[LANG])); head.appendChild(el('span', 'pct', st.pct + '%')); card.appendChild(head)
      var bar = el('div', 'pbar'), fill_ = el('i'); fill_.style.width = st.pct + '%'; bar.appendChild(fill_); card.appendChild(bar)
      var chips = el('div', 'pchips'); PROJECTS[pid].tasks.forEach(function (tk) { chips.appendChild(el('span', 'pchip' + (st.done[tk[0]] ? ' on' : ''), T.tasks[tk[0]])) }); card.appendChild(chips)
      var foot = el('div', 'pcard-f'); foot.appendChild(el('span', null, T.forecast + ': ' + dateStr(st.finish)))
      if (st.delay) foot.appendChild(el('em', 'delay', fill(T.delayBadge, { n: st.delay }))); card.appendChild(foot); b.appendChild(card)
    })
  }
  function renderOrders() {
    var body = $('#s-orders-body'); body.textContent = ''
    var rows = []
    T.msgs.concat([{ id: 'own' }]).forEach(function (m) { var r = results[m.id]; if (r && r.order) r.order.lines.forEach(function (l) { rows.push({ proj: r.read.pid, line: l, status: r.order.status }) }) })
    if (!rows.length) { var tr0 = el('tr', 'empty-row'), td0 = el('td', null, T.ordEmpty); td0.colSpan = 6; tr0.appendChild(td0); body.appendChild(tr0); return }
    rows.forEach(function (r, i) {
      var tr = el('tr'); tr.appendChild(el('td', 'no', String(i + 1))); tr.appendChild(el('td', null, r.proj ? PROJECTS[r.proj].name[LANG] : '-')); tr.appendChild(el('td', null, r.line.mat.name[LANG])); tr.appendChild(el('td', 'num', r.line.qty + ' ' + unitOf(r.line.mat, r.line.qty))); tr.appendChild(el('td', 'num', fmt(r.line.qty * r.line.mat.price)))
      var td = el('td'); td.appendChild(el('span', 'status ' + (r.status === 'auto' ? 'ready' : 'waiting'), r.status === 'auto' ? T.ordAuto : T.ordApprove)); tr.appendChild(td); body.appendChild(tr)
    })
  }

  function card(title, to, subject, body, actions) {
    var c = el('div', 'reply'), h = el('div', 'reply-head'); h.appendChild(el('span', null, title))
    if (to) { var t = el('span'); t.appendChild(el('b', null, T.to + ': ')); t.appendChild(document.createTextNode(to)); h.appendChild(t) }
    if (subject) { var s = el('span'); s.appendChild(el('b', null, T.subj + ': ')); s.appendChild(document.createTextNode(subject)); h.appendChild(s) }
    c.appendChild(h); var ta = el('textarea'); ta.readOnly = true; ta.value = body; c.appendChild(ta)
    if (actions) { var a = el('div', 'reply-actions'); actions.forEach(function (x) { a.appendChild(x) }); c.appendChild(a) }
    return c
  }
  function btn(label, cls, fn) { var b = el('button', 'btn ' + cls, label); b.type = 'button'; b.addEventListener('click', fn); return b }

  function analyse(msg) {
    var read = readMessage(msg.body, msg.project), pid = read.pid, res = { msg: msg, read: read }
    results[msg.id] = res
    var st = pid ? stateOf(pid) : null; res.st = st
    var proj = pid ? PROJECTS[pid] : null
    if (read.mats.length) {
      var lines = read.mats, total = lines.reduce(function (n, l) { return n + l.qty * l.mat.price }, 0)
      res.order = { lines: lines, total: total, status: total > rules.limit ? 'approve' : 'auto' }
    }
    if (st && !read.done.length && !read.mats.length && !read.delay && !read.askDate && !read.askStage) res.ask = T.askBody          // nothing usable in the message: ask the foreman, tell the client nothing
    if (st && !res.ask) {
      var done = proj.tasks.filter(function (tk) { return read.done.indexOf(tk[0]) >= 0 }).map(function (tk) { return T.tasks[tk[0]] })
      var next = nextTasks(pid, st), bits = ''
      var delayLine = read.delay ? fill(T.delayLine, { cause: T.cause[read.cause || 'rain'], n: read.delay }) : ''
      var ans = ''
      if (read.askDate) { var tgt = new Date(TODAY.getFullYear(), TODAY.getMonth(), read.askDate); if (tgt < TODAY) tgt = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, read.askDate); ans = fill(T.ansDate, { d: read.askDate, date: dateStr(st.finish), verdict: st.finish <= tgt ? T.verdictOk : T.verdictNo }) }
      else if (read.askStage) ans = fill(T.ansStage, { date: dateStr(stageStart(pid, st)) })
      res.client = fill(T.clientBody, { project: proj.name[LANG], date: dateStr(TODAY), pct: st.pct, n: st.nDone, t: st.nTotal, done: done.length ? done.join(', ') : T.noneYet, next: next.length ? next.join(', ') : T.nextNone, delay: delayLine, answer: ans, co: COMPANY })
      if (read.delay >= rules.delay) res.alert = fill(T.alertBody, { project: proj.name[LANG], n: read.delay, cause: T.cause[read.cause || 'rain'], date: dateStr(st.finish) })
    }
    return res
  }
  function stepsFor(r) {
    var m = r.msg, s = [['chat', fill(T.sRead, { name: m.fromName, app: m.app }), 'ok']]
    if (r.read.pid) {
      s.push(['plan', fill(T.sProject, { p: PROJECTS[r.read.pid].name[LANG] }), 'ok'])
      var names = r.read.done.map(function (k) { return T.tasks[k] })
      s.push(['plan', names.length ? fill(T.sTick, { list: names.join(', ') }) : T.sNoTick, names.length ? 'ok' : 'err'])
      s.push(['plan', fill(T.sProg, { pct: r.st.pct, n: r.st.leftDays, date: dateStr(r.st.finish) }), 'ok'])
    } else s.push(['plan', T.sNoProject, 'err'])
    if (r.order) { s.push(['stock', fill(T.sMat, { list: r.order.lines.map(function (l) { return l.qty + ' × ' + l.mat.name[LANG] }).join(', ') }), 'ok']); s.push(['stock', fill(T.sPriced, { total: fmt(r.order.total) }), 'ok']) }
    s.push(['rules', fill(T.sRules, { d: rules.delay, m: fmt(rules.limit) }), 'ok'])
    if (r.client) s.push(['mail', T.sClient, 'ok'])
    if (r.order) s.push(['mail', T.sOrder, 'ok'])
    if (r.alert) s.push(['alert', fill(T.sAlert, { n: r.read.delay }), 'err'])
    if (r.ask) s.push(['mail', T.sAsk, 'ok'])
    return s
  }
  function showResult(r) {
    resultBody.textContent = ''
    if (r.st) {
      var p = el('div', 'prog'), h = el('div', 'prog-h'); h.appendChild(el('b', null, PROJECTS[r.read.pid].name[LANG])); h.appendChild(el('span', null, r.st.pct + '%')); p.appendChild(h)
      var bar = el('div', 'pbar'), f = el('i'); f.style.width = r.st.pct + '%'; bar.appendChild(f); p.appendChild(bar)
      p.appendChild(el('p', 'prog-s', fill(T.stepsDone, { n: r.st.nDone, t: r.st.nTotal }) + '. ' + T.forecast + ': ' + dateStr(r.st.finish) + ' (' + fill(T.left, { n: r.st.leftDays }) + ')')); resultBody.appendChild(p)
    }
    if (r.alert) { var al = el('div', 'missing'); al.appendChild(el('b', null, T.outAlert)); al.appendChild(el('p', null, r.alert)); var sb = btn(T.send, 'btn-ghost', function () { showToast(T.toast) }); sb.classList.add('q-open'); al.appendChild(sb); resultBody.appendChild(al) }
    if (r.client) resultBody.appendChild(card(T.outClient, 'client@example.com', null, r.client, [btn(T.approve, 'btn-primary', function () { showToast(T.toast) })]))
    if (r.order) {
      var note = el('p', 'note', r.order.status === 'auto' ? fill(T.autoSend, { m: fmt(rules.limit) }) : fill(T.needApproval, { m: fmt(rules.limit) }))
      var lines = r.order.lines.map(function (l) { return '- ' + l.qty + ' × ' + l.mat.name[LANG] + ' (' + fmt(l.qty * l.mat.price) + ')' }).join('\n')
      var c = card(T.outOrder, 'orders@supplier.example', null, fill(T.orderBody, { project: PROJECTS[r.read.pid].name[LANG], lines: lines, co: COMPANY }), r.order.status === 'approve' ? [btn(T.approve, 'btn-primary', function () { showToast(T.toast) })] : null)
      resultBody.appendChild(c); resultBody.appendChild(note)
    }
    if (r.ask) resultBody.appendChild(card(T.outAsk, 'foreman', null, r.ask, null))
  }
  function run() {
    if (busy) return
    var msg
    if (current < T.msgs.length) msg = T.msgs[current]
    else { var txt = (ownText || '').trim(); if (txt.length < 12) { showToast(T.pasteNeed); return } msg = { id: 'own', project: null, fromName: T.own, app: '-', body: txt } }
    busy = true; runBtn.disabled = true; stepsEl.textContent = ''; resultBody.textContent = ''; resetSys(); setPill(agentPill, 'busy'); setPill(resultPill, 'idle')
    var r = analyse(msg), chain = Promise.resolve()
    stepsFor(r).forEach(function (st) {
      chain = chain.then(function () {
        lightSys(st[0]); var li = addStep(st[1], 'work')
        return wait(480 + Math.random() * 280).then(function () { li.className = 'step ' + st[2]; if (st[0] === 'plan') renderBoard(); if (st[0] === 'stock') renderOrders() })
      })
    })
    chain.then(function () { lightSys(null); showResult(r); renderBoard(); renderOrders(); setPill(agentPill, 'done'); setPill(resultPill, 'done'); busy = false; runBtn.disabled = false; renderList(); renderReader() })
  }

  function renderStatic() {
    var h = $('#s-orders-head'); T.ordHead.forEach(function (x, i) { h.appendChild(el('th', i === 3 || i === 4 ? 'num' : '', x)) })
    var mh = $('#s-mat-head'); T.matHead.forEach(function (x, i) { mh.appendChild(el('th', i === 2 ? 'num' : '', x)) })
    var mb = $('#s-mat-body'); MAT.forEach(function (m) { var tr = el('tr'); tr.appendChild(el('td', null, m.name[LANG])); tr.appendChild(el('td', 'unit', m.unit[LANG])); tr.appendChild(el('td', 'num', fmt(m.price))); mb.appendChild(tr) })
    var d = $('#s-rule-delay'), l = $('#s-rule-limit')
    if (d) { d.value = rules.delay; d.addEventListener('input', function () { var v = parseFloat(d.value); rules.delay = isFinite(v) && v >= 0 ? v : 0 }) }
    if (l) { l.value = rules.limit; l.addEventListener('input', function () { var v = parseFloat(l.value); rules.limit = isFinite(v) && v >= 0 ? v : 0 }) }
  }
  runBtn.addEventListener('click', run)
  setPill(agentPill, 'idle'); setPill(resultPill, 'idle'); renderList(); renderReader(); renderStatic(); renderBoard(); renderOrders()
})()
