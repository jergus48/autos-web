// "Book a call" opens Cal.com's booking calendar as a popup on top of the page, instead of sending
// the visitor to cal.com in a new tab. It works on every link to https://cal.com/swiftrix..., so the
// Framer homepage buttons (EN, LT, DE) and the standalone pages share it. Without JavaScript, or if
// cal.com is blocked, the links keep working and open cal.com as before.
(function () {
  'use strict'
  var EVENT = 'swiftrix/30-minute-call'   // the same 30-minute call the assistant page embeds
  var NS = 'swxpop'                        // own namespace, the assistant page uses 'swx' for its inline calendar
  var started = false
  var failed = false

  // Called by the loader below when the calendar script cannot be loaded (blocked or offline).
  function calFailed() { failed = true }

  function start() {
    if (started) return
    started = true
    // Cal.com's standard embed loader (https://cal.com/docs/core-features/embed).
    ;(function (C, A, L) { var p = function (a, ar) { a.q.push(ar) }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; var s = d.head.appendChild(d.createElement('script')); s.src = A; s.onerror = calFailed; cal.loaded = true } if (ar[0] === L) { var api = function () { p(api, arguments) }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]) } else p(cal, ar); return } p(cal, ar) } })(window, 'https://app.cal.com/embed/embed.js', 'init')
    window.Cal('init', NS, { origin: 'https://cal.com' })
    window.Cal.ns[NS]('ui', {
      theme: 'dark', layout: 'month_view', hideEventTypeDetails: false,
      cssVarsPerTheme: { dark: { 'cal-brand': '#b0e562', 'cal-brand-text': '#0a0a0c' }, light: { 'cal-brand': '#b0e562', 'cal-brand-text': '#0a0a0c' } }
    })
  }

  function calLink(el) {
    var a = el && el.closest ? el.closest('a') : null
    var href = a && a.getAttribute('href') || ''
    return /^https:\/\/cal\.com\/swiftrix/.test(href) && a.getAttribute('data-cal') !== 'off' ? a : null
  }

  // Start loading the calendar as soon as someone points at a booking button, so the popup opens at once.
  ;['pointerover', 'touchstart', 'focusin'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (calLink(e.target)) start() }, { capture: true, passive: true })
  })

  // Capture phase, so this runs before the homepage's own click handlers.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return   // keep "open in new tab" working
    var a = calLink(e.target)
    if (!a) return
    start()
    if (failed) return   // the calendar script is blocked: let the link open cal.com
    e.preventDefault()
    e.stopPropagation()
    window.Cal.ns[NS]('modal', { calLink: EVENT, config: { layout: 'month_view', theme: 'dark' } })
    // If the popup never appears (calendar blocked or slow network), fall back to the plain link.
    setTimeout(function () {
      if (document.querySelector('cal-modal-box')) return
      if (!window.open(a.href, '_blank', 'noopener')) location.href = a.href
    }, 8000)
  }, true)
})()
