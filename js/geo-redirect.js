// First visit to the English home page: send the visitor to the language of
// their country. A cookie records that this has run, so it happens once and
// anyone who then switches back to English stays there.
(function () {
  var COOKIE = 'swx_geo'
  // country -> language folder
  var COUNTRY_LANG = {
    LT: 'lt',
    DE: 'de', AT: 'de', CH: 'de', LI: 'de',
    FR: 'fr', ES: 'es', NO: 'no', DK: 'da', FI: 'fi', SE: 'sv',
    PT: 'pt', BR: 'pt',
    LV: 'lv'
  }
  // Languages that have a translated site (folder /<code>).
  var AVAILABLE = { lt: 1, de: 1, fr: 1, es: 1, no: 1, da: 1, fi: 1, sv: 1, pt: 1, lv: 1 }

  var p = location.pathname
  if (p !== '/' && p !== '/index.html') return
  if (document.cookie.indexOf(COOKIE + '=') !== -1) return
  try { if (/bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return } catch (e) {}

  function mark() {
    document.cookie = COOKIE + '=1; max-age=31536000; path=/; SameSite=Lax'
  }

  var ctrl = typeof AbortController === 'function' ? new AbortController() : null
  var timer = setTimeout(function () { if (ctrl) ctrl.abort() }, 1500)
  fetch('/api/geo', { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
    .then(function (r) { return r.json() })
    .then(function (d) {
      clearTimeout(timer)
      mark()
      var lang = COUNTRY_LANG[d && d.country]
      if (lang && AVAILABLE[lang]) location.replace('/' + lang + '/' + location.search + location.hash)
    })
    .catch(function () { clearTimeout(timer) }) // no cookie set: try again next visit
})()
