// Machine Ear live demo (swiftrix.eu/machine-ear, /lt/masinos-ausis, /de/maschinenohr).
//
// Everything here runs in the visitor's browser. A simulated machine is
// synthesised with the Web Audio API (motor hum, airflow, gear whine). The
// "learning week" runs sped up: the detector listens to the normal sound and
// remembers, band by band, how loud it gets. After that it compares what it
// hears with that learned range. The scenario buttons only change the sound;
// the verdicts come from features measured on the audio (which bands are above
// normal, how tonal, how steady, how regular the beat is). Nothing here looks
// at which button was pressed.
(function () {
  'use strict'
  var root = document.getElementById('machine-ear-demo')
  if (!root) return
  var T = JSON.parse(document.getElementById('me-i18n').textContent)
  var $ = function (s) { return root.querySelector(s) }

  var canvas = $('#me-canvas')
  var g2 = canvas.getContext('2d')
  var pill = $('#me-pill')
  var startBtn = $('#me-start')
  var soundBtn = $('#me-sound')
  var hint = $('#me-hint')
  var progress = $('#me-progress')
  var progressBar = progress.querySelector('span')
  var progressTxt = progress.querySelector('em')
  var logList = $('#me-log ul')
  var phone = $('#me-phone')
  var scnBtns = [].slice.call(root.querySelectorAll('[data-scn]'))

  // ---------------------------------------------------------------- bands
  var FMIN = 50, FMAX = 12000, NB = 44
  var DMIN = -105, DMAX = -35
  var edges = [], centers = []
  for (var i = 0; i <= NB; i++) edges.push(FMIN * Math.pow(FMAX / FMIN, i / NB))
  for (i = 0; i < NB; i++) centers.push(Math.sqrt(edges[i] * edges[i + 1]))
  function regionOf(f) { return f < 300 ? 'low' : f < 2000 ? 'mid' : 'high' }
  var region = centers.map(regionOf)
  var count = { low: 0, mid: 0, high: 0 }
  region.forEach(function (r) { count[r]++ })

  // ---------------------------------------------------------------- state
  var eng = null
  var mode = 'idle'            // idle | learning | guard
  var learnStart = 0, LEARN_MS = 9000
  var v = new Float32Array(NB).fill(DMIN)         // smoothed level per band (dB)
  var sum = new Float32Array(NB), mx = new Float32Array(NB).fill(DMIN), samples = 0
  var thr = new Float32Array(NB).fill(DMIN)       // learned upper limit of normal
  var env = [], lastEnv = 0
  var active = null, lastFrame = 0
  var score = { bearing: 0, leak: 0, knock: 0, voice: 0, vehicle: 0 }   // seconds of evidence per verdict
  var scenario = 'normal'
  var feat = {}
  var colors = {}
  var rafId = 0

  function readColors() {
    var cs = getComputedStyle(document.documentElement)
    var light = document.documentElement.getAttribute('data-theme') === 'light'
    colors.accent = cs.getPropertyValue('--accent').trim() || '#b0e562'
    colors.text = cs.getPropertyValue('--text').trim() || '#f4f2ef'
    colors.muted = cs.getPropertyValue('--muted-2').trim() || '#999'
    colors.border = cs.getPropertyValue('--border').trim() || '#222'
    colors.bad = light ? '#d4262c' : '#ff5d5d'
    colors.band = light ? 'rgba(124,58,237,.14)' : 'rgba(176,229,98,.13)'
    colors.bandLine = light ? 'rgba(124,58,237,.55)' : 'rgba(176,229,98,.5)'
    colors.grid = light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.07)'
  }

  // ---------------------------------------------------------------- audio
  function noiseBuffer(ctx, secs) {
    var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate), d = b.getChannelData(0)
    for (var k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1
    return b
  }
  function bufSrc(ctx, buf) { var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s }
  function osc(ctx, type, f) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o }
  function gain(ctx, x) { var g = ctx.createGain(); g.gain.value = x; return g }
  function filt(ctx, type, f, q) { var n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q) n.Q.value = q; return n }
  function chain() { for (var k = 0; k < arguments.length - 1; k++) arguments[k].connect(arguments[k + 1]); return arguments[arguments.length - 1] }

  // How loud each fault is when its scenario is on (tuned so the detector sees
  // a clear but realistic change, a few to a few tens of dB above normal).
  var LEVEL = { bearing: 0.003, leak: 0.014, knock: 0.22, voice: 2.2, vehicle: 0.4 }

  function build() {
    var AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    var ctx = new AC()
    var out = gain(ctx, 1)
    var analyser = ctx.createAnalyser()
    analyser.fftSize = 4096
    analyser.smoothingTimeConstant = 0.55
    analyser.minDecibels = -125
    analyser.maxDecibels = -10
    var speaker = gain(ctx, 0)       // audible output, muted until the visitor turns sound on
    var pull = gain(ctx, 0)          // keeps the analyser running even when muted
    out.connect(analyser); analyser.connect(pull); pull.connect(ctx.destination)
    out.connect(speaker); speaker.connect(ctx.destination)

    var nb = noiseBuffer(ctx, 3)

    // the machine: motor hum with a slow load wobble, airflow, gear whine, faint room hiss
    var humG = gain(ctx, 0.15)
    chain(osc(ctx, 'sawtooth', 50), filt(ctx, 'lowpass', 420, 0.7), humG, out)
    chain(osc(ctx, 'sine', 150), gain(ctx, 0.02), out)
    chain(osc(ctx, 'sine', 200), gain(ctx, 0.016), out)
    chain(osc(ctx, 'sine', 0.4), gain(ctx, 0.045), humG.gain)
    chain(bufSrc(ctx, nb), filt(ctx, 'lowpass', 1500, 0.7), gain(ctx, 0.05), out)
    chain(osc(ctx, 'sine', 320), gain(ctx, 0.008), out)
    chain(osc(ctx, 'sine', 640), gain(ctx, 0.004), out)
    chain(bufSrc(ctx, nb), filt(ctx, 'highpass', 1800), gain(ctx, 0.0035), out)

    var lv = {}
    // bearing wear: a tonal whine around 3 kHz with a harmonic and a fast flutter
    var am = gain(ctx, 0.7)
    chain(osc(ctx, 'sine', 29), gain(ctx, 0.3), am.gain)
    lv.bearing = gain(ctx, 0)
    chain(osc(ctx, 'sine', 3150), am); chain(osc(ctx, 'sine', 6300), gain(ctx, 0.4), am)
    chain(am, lv.bearing, out)
    // air leak: steady high-frequency hiss
    lv.leak = gain(ctx, 0)
    chain(bufSrc(ctx, nb), filt(ctx, 'highpass', 3800), filt(ctx, 'lowpass', 11000), lv.leak, out)
    // loose part: a regular knock, 4.5 per second
    var kb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), kd = kb.getChannelData(0)
    for (var n = 0; n < 9; n++) {
      var s0 = Math.floor(n * ctx.sampleRate * 2 / 9)
      for (var j = 0; j < ctx.sampleRate * 0.09; j++) {
        var t = j / ctx.sampleRate, e = Math.exp(-t * 55)
        kd[s0 + j] += e * (0.6 * (Math.random() * 2 - 1) + 0.7 * Math.sin(2 * Math.PI * 1350 * t))
      }
    }
    lv.knock = gain(ctx, 0)
    chain(bufSrc(ctx, kb), lv.knock, out)
    // voice: a buzzing source shaped by three formants, switched on and off in irregular syllables
    var voiceEnv = gain(ctx, 0.04)
    var vib = osc(ctx, 'sine', 5.2)
    var vo = osc(ctx, 'sawtooth', 122)
    chain(vib, gain(ctx, 4), vo.frequency)
    var F = [filt(ctx, 'bandpass', 700, 6), filt(ctx, 'bandpass', 1200, 8), filt(ctx, 'bandpass', 2600, 9)]
    var FG = [1, 0.7, 0.35]
    F.forEach(function (f, k) { chain(vo, f, gain(ctx, FG[k]), voiceEnv) })
    chain(bufSrc(ctx, nb), filt(ctx, 'bandpass', 3000, 0.8), gain(ctx, 0.05), voiceEnv)
    lv.voice = gain(ctx, 0)
    chain(voiceEnv, lv.voice, out)
    // forklift: low rumble that swells
    lv.vehicle = gain(ctx, 0)
    var veh = filt(ctx, 'lowpass', 240)
    chain(osc(ctx, 'sawtooth', 42), veh); chain(osc(ctx, 'square', 84), gain(ctx, 0.5), veh)
    chain(bufSrc(ctx, nb), filt(ctx, 'lowpass', 320), gain(ctx, 0.8), veh)
    chain(veh, lv.vehicle, out)

    return { ctx: ctx, analyser: analyser, speaker: speaker, lv: lv, voiceEnv: voiceEnv, F: F, data: new Float32Array(analyser.frequencyBinCount) }
  }

  var VOWELS = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870], [660, 1720]]
  var voiceTimer = 0, voiceOn = false
  function voiceStep() {
    if (!voiceOn || !eng) return
    var t = eng.ctx.currentTime, w = VOWELS[Math.floor(Math.random() * VOWELS.length)]
    eng.F[0].frequency.setTargetAtTime(w[0], t, 0.03)
    eng.F[1].frequency.setTargetAtTime(w[1], t, 0.03)
    eng.voiceEnv.gain.setTargetAtTime(1, t, 0.02)
    var talk = 110 + Math.random() * 300
    setTimeout(function () { if (eng) eng.voiceEnv.gain.setTargetAtTime(0.04, eng.ctx.currentTime, 0.03) }, talk)
    voiceTimer = setTimeout(voiceStep, talk + 60 + Math.random() * 260)
  }

  function setScenario(name) {
    scenario = name
    scnBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-scn') === name ? 'true' : 'false') })
    if (!eng) return
    var t = eng.ctx.currentTime
    Object.keys(eng.lv).forEach(function (k) {
      eng.lv[k].gain.setTargetAtTime(k === name ? LEVEL[k] : 0, t, k === 'vehicle' ? 0.7 : 0.18)
    })
    var wantVoice = name === 'voice'
    if (wantVoice && !voiceOn) { voiceOn = true; voiceStep() }
    if (!wantVoice && voiceOn) { voiceOn = false; clearTimeout(voiceTimer); eng.voiceEnv.gain.setTargetAtTime(0.04, t, 0.05) }
  }

  // ---------------------------------------------------------------- analysis
  function readBands() {
    eng.analyser.getFloatFrequencyData(eng.data)
    var hz = eng.ctx.sampleRate / eng.analyser.fftSize, d = eng.data
    var raw = new Float32Array(NB)
    for (var b = 0; b < NB; b++) {
      var k0 = Math.ceil(edges[b] / hz), k1 = Math.floor(edges[b + 1] / hz), m
      if (k1 < k0) {
        var pos = centers[b] / hz, a = Math.floor(pos), fr = pos - a
        m = d[a] * (1 - fr) + d[a + 1] * fr
      } else {
        m = -200
        for (var k = k0; k <= k1; k++) if (d[k] > m) m = d[k]
      }
      raw[b] = Math.max(DMIN - 10, Math.min(DMAX + 20, m))
    }
    return raw
  }

  function regionMean(arr, name) {
    var s = 0, c = 0
    for (var b = 0; b < NB; b++) if (region[b] === name) { s += arr[b]; c++ }
    return s / c
  }

  function periodicity() {
    var n = env.length
    if (n < 60) return { r: 0, hz: 0 }
    var mean = 0, k
    for (k = 0; k < n; k++) mean += env[k]
    mean /= n
    var den = 0
    for (k = 0; k < n; k++) den += (env[k] - mean) * (env[k] - mean)
    if (den < 1e-6) return { r: 0, hz: 0 }
    var rs = [], best = 0
    for (var L = 3; L <= 18; L++) {
      var s = 0
      for (k = 0; k + L < n; k++) s += (env[k] - mean) * (env[k + L] - mean)
      var r = s / den * (n / (n - L))
      rs[L] = r
      if (r > best) best = r
    }
    var bl = 0
    for (L = 4; L <= 17; L++) {
      if (rs[L] >= best * 0.85 && rs[L] >= rs[L - 1] && rs[L] >= rs[L + 1]) { bl = L; break }
    }
    return { r: best, hz: bl ? 1 / (bl * 0.02) : 0 }
  }

  function std(arr) {
    if (arr.length < 10) return 0
    var m = 0, s = 0, k
    for (k = 0; k < arr.length; k++) m += arr[k]
    m /= arr.length
    for (k = 0; k < arr.length; k++) s += (arr[k] - m) * (arr[k] - m)
    return Math.sqrt(s / arr.length)
  }

  function measure() {
    var c = { low: 0, mid: 0, high: 0 }, hiSum = 0, hiN = 0, hiMax = -99
    for (var b = 0; b < NB; b++) {
      var e = v[b] - thr[b]
      if (e > 2.5) {
        c[region[b]]++
        if (region[b] === 'high') { hiSum += e; hiN++; if (e > hiMax) hiMax = e }
      }
    }
    var p = periodicity()
    return {
      lowFrac: c.low / count.low, midFrac: c.mid / count.mid, highFrac: c.high / count.high,
      highMean: hiN ? hiSum / hiN : 0, highMax: hiMax, periodic: p.r, beatHz: p.hz, mod: std(env)
    }
  }

  // pulsing (mod) and regular -> knock; pulsing and irregular -> speech; steady
  // broadband -> leak; steady narrow peaks -> bearing; low rumble only -> vehicle
  function classify(f) {
    var pulsing = f.mod >= 2.5, loud = Math.max(f.midFrac, f.highFrac) >= 0.2
    if (pulsing && f.periodic >= 0.78 && loud) return 'knock'
    if (!pulsing && f.highFrac >= 0.55 && f.highMean >= 5) return 'leak'
    if (!pulsing && f.highFrac > 0 && f.highFrac < 0.55 && f.highMax >= 9 && f.midFrac < 0.25) return 'bearing'
    if (pulsing && f.midFrac >= 0.25) return 'voice'
    if (f.lowFrac >= 0.35 && f.midFrac < 0.25 && f.highFrac < 0.2) return 'vehicle'
    return null
  }
  var FAULT = { bearing: 1, leak: 1, knock: 1 }

  // ---------------------------------------------------------------- UI
  function setPill(state) {
    pill.setAttribute('data-state', state)
    pill.textContent = T.status[state]
    root.setAttribute('data-state', state)
  }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o && o[k] != null ? o[k] : m }) }
  function addLog(kind, title, text) {
    var li = document.createElement('li')
    li.className = 'me-ev me-ev--' + kind
    li.innerHTML = '<b></b><span></span>'
    li.firstChild.textContent = title
    li.lastChild.textContent = text
    logList.insertBefore(li, logList.firstChild)
    while (logList.children.length > 6) logList.removeChild(logList.lastChild)
  }
  var phoneTimer = 0
  function showPhone(title, text) {
    clearTimeout(phoneTimer)
    phone.querySelector('[data-p="text"]').textContent = fmt(T.notif, { title: title, text: text })
    phone.classList.add('on')
  }
  function hidePhone(delay) {
    clearTimeout(phoneTimer)
    phoneTimer = setTimeout(function () { phone.classList.remove('on') }, delay || 0)
  }

  function commit(cls, f) {
    active = cls
    root.setAttribute('data-class', cls)
    var o = { db: Math.round(cls === 'bearing' ? f.highMax : f.highMean), hz: (f.beatHz ? f.beatHz.toFixed(1) : '4.5').replace('.', document.documentElement.lang === 'en' ? '.' : ',') }
    var ev = T.events[cls]
    var title = ev[0], text = fmt(ev[1], o)
    if (FAULT[cls]) {
      setPill('attention')
      addLog('bad', title, text)
      showPhone(title, text)
    } else {
      addLog('ignored', title, text)
    }
  }
  function release(silent) {
    var was = active
    active = null
    root.setAttribute('data-class', '')
    if (FAULT[was] && !silent) {
      setPill('normal')
      addLog('ok', T.back[0], T.back[1])
      hidePhone(2500)
    }
  }

  // Evidence builds up for the verdict the measurements point to and drains
  // slowly otherwise, so a short dropout in the measurements does not reset it.
  function guard(dt, f) {
    var cand = classify(f)
    feat.cand = cand
    Object.keys(score).forEach(function (c) {
      score[c] = c === cand ? Math.min(1.6, score[c] + dt) : Math.max(0, score[c] - dt * 0.8)
    })
    var best = null
    Object.keys(score).forEach(function (c) {
      if (score[c] >= (FAULT[c] ? 1.3 : 0.9) && (!best || score[c] > score[best])) best = c
    })
    if (best && best !== active) {
      var swap = active && FAULT[active] && FAULT[best]
      if (active) release(swap)
      commit(best, f)
    } else if (active && !best && score[active] <= 0.01) {
      release()
    }
  }

  // ---------------------------------------------------------------- drawing
  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(300, Math.floor(r.width * dpr))
    canvas.height = Math.floor(canvas.clientHeight * dpr)
    g2.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  function Y(db, h) { return h - 22 - (Math.max(DMIN, Math.min(DMAX, db)) - DMIN) / (DMAX - DMIN) * (h - 34) }
  function X(i, w) { return 6 + i / NB * (w - 12) }

  function draw() {
    var w = canvas.clientWidth, h = canvas.clientHeight
    g2.clearRect(0, 0, w, h)
    // grid and frequency labels
    g2.font = '11px ui-monospace, Menlo, Consolas, monospace'
    g2.textAlign = 'center'
    ;[[100, '100 Hz'], [1000, '1 kHz'], [10000, '10 kHz']].forEach(function (t) {
      var pos = Math.log(t[0] / FMIN) / Math.log(FMAX / FMIN) * NB
      var x = X(pos, w)
      g2.strokeStyle = colors.grid; g2.lineWidth = 1
      g2.beginPath(); g2.moveTo(x, 8); g2.lineTo(x, h - 20); g2.stroke()
      g2.fillStyle = colors.muted
      g2.fillText(t[1], Math.min(x, w - 26), h - 6)
    })
    var learnedSomething = mode !== 'idle' && samples > 20
    var limit = mode === 'learning' ? mx : thr
    // learned normal range: everything below the learned limit
    if (learnedSomething) {
      g2.beginPath()
      g2.moveTo(X(0, w), Y(DMIN, h))
      for (var b = 0; b < NB; b++) {
        g2.lineTo(X(b, w), Y(limit[b] + (mode === 'guard' ? 0 : 0), h))
        g2.lineTo(X(b + 1, w), Y(limit[b], h))
      }
      g2.lineTo(X(NB, w), Y(DMIN, h))
      g2.closePath()
      g2.fillStyle = colors.band; g2.fill()
      g2.beginPath()
      for (b = 0; b < NB; b++) { g2.lineTo(X(b, w), Y(limit[b], h)); g2.lineTo(X(b + 1, w), Y(limit[b], h)) }
      g2.strokeStyle = colors.bandLine; g2.lineWidth = 1.5; g2.setLineDash([5, 4]); g2.stroke(); g2.setLineDash([])
    }
    // live bars
    var bw = (w - 12) / NB
    for (b = 0; b < NB; b++) {
      var y = Y(v[b], h), base = Y(DMIN, h)
      var over = mode === 'guard' && v[b] - thr[b] > 2.5
      g2.fillStyle = over ? colors.bad : colors.accent
      g2.globalAlpha = over ? 0.95 : 0.85
      g2.fillRect(X(b, w) + 1, y, Math.max(1, bw - 2), base - y)
    }
    g2.globalAlpha = 1
  }

  // ---------------------------------------------------------------- main loop
  function frame(now) {
    rafId = requestAnimationFrame(frame)
    if (!eng) { draw(); return }
    var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016
    lastFrame = now
    var raw = readBands()
    // peak-hold with a steady fall (like a level meter): short bursts stay
    // visible and the measurements do not flicker between knocks
    for (var b = 0; b < NB; b++) v[b] = Math.max(raw[b], v[b] - 30 * dt)
    if (now - lastEnv >= 20) {
      lastEnv = now
      env.push((regionMean(raw, 'mid') * count.mid + regionMean(raw, 'high') * count.high) / (count.mid + count.high))
      if (env.length > 75) env.shift()
    }
    if (mode === 'learning') {
      var p = Math.min(1, (now - learnStart) / LEARN_MS)
      if (now - learnStart > 700) {
        for (b = 0; b < NB; b++) { sum[b] += v[b]; if (v[b] > mx[b]) mx[b] = v[b] }
        samples++
      }
      var day = Math.min(7, 1 + Math.floor(p * 7))
      progressBar.style.width = (p * 100).toFixed(1) + '%'
      progressTxt.textContent = fmt(T.learning, { d: day })
      if (p >= 1 && samples > 60) {
        for (b = 0; b < NB; b++) thr[b] = mx[b] + 3
        mode = 'guard'
        root.setAttribute('data-mode', 'guard')
        progress.hidden = true
        hint.textContent = T.hintGuard
        scnBtns.forEach(function (x) { x.disabled = false })
        setPill('normal')
      }
    } else if (mode === 'guard') {
      feat = measure()
      guard(dt, feat)
    }
    draw()
  }

  // ---------------------------------------------------------------- controls
  function ensureEngine() {
    if (eng) { if (eng.ctx.state === 'suspended') eng.ctx.resume(); return true }
    eng = build()
    if (!eng) { hint.textContent = T.noAudio; return false }
    if (eng.ctx.state === 'suspended') eng.ctx.resume()
    return true
  }
  function setSound(on) {
    soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
    soundBtn.querySelector('span').textContent = on ? T.soundOn : T.soundOff
    if (eng) eng.speaker.gain.setTargetAtTime(on ? 0.5 : 0, eng.ctx.currentTime, 0.05)
  }

  startBtn.addEventListener('click', function () {
    if (mode !== 'idle' || !ensureEngine()) return
    mode = 'learning'
    root.setAttribute('data-mode', 'learning')
    learnStart = performance.now()
    sum.fill(0); mx.fill(DMIN); samples = 0
    startBtn.hidden = true
    progress.hidden = false
    hint.textContent = ''
    setPill('learning')
    setSound(soundBtn.getAttribute('aria-pressed') === 'true')
  })
  soundBtn.addEventListener('click', function () {
    if (!ensureEngine()) return
    setSound(soundBtn.getAttribute('aria-pressed') !== 'true')
  })
  scnBtns.forEach(function (b) {
    b.disabled = true
    b.addEventListener('click', function () { if (mode === 'guard') setScenario(b.getAttribute('data-scn')) })
  })
  document.addEventListener('visibilitychange', function () {
    if (!eng) return
    if (document.hidden) eng.ctx.suspend(); else eng.ctx.resume()
  })
  window.addEventListener('resize', resize)
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  // test hook (read only): lets the page be checked from the console
  window.__machineEar = {
    state: function () { return { mode: mode, active: active, scenario: scenario, feat: feat } },
    excess: function () { return Array.prototype.map.call(v, function (x, b) { return Math.round(x - thr[b]) }) }
  }

  readColors(); resize(); setPill('idle')
  hint.textContent = T.hintStart
  setScenario('normal')
  rafId = requestAnimationFrame(frame)
})()
