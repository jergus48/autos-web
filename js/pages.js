// Shared by the standalone pages (/demo, /assistant and their /lt versions):
// theme, theme switch, nav links and the mobile menu.
//
// Theme uses the same localStorage key as the main site's switch
// (js/theme-switch.js), and links from the /light build pass ?theme=light.
// The <head> of each page applies it before first paint. The main site keeps
// light and dark as separate builds ("/" and "/light") and its switch jumps
// between them; these pages are a single build, so the switch below looks
// the same but flips the theme in place. Links back into the homepage
// (data-site="#faq" etc.) point at whichever build matches the theme.
(function () {
  'use strict'
  var root = document.documentElement
  var lt = root.lang === 'lt'
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'

  var btn = document.createElement('button')
  btn.type = 'button'
  btn.innerHTML = '<span class="dts-track"><span class="dts-ic dts-sun">' + SUN + '</span><span class="dts-ic dts-moon">' + MOON + '</span><span class="dts-knob"></span></span>'

  function apply(t, save) {
    var light = t === 'light'
    root.setAttribute('data-theme', t)
    if (save) { try { localStorage.setItem('swiftrix-theme', t) } catch (e) {} }
    btn.className = 'dts-switch ' + (light ? 'is-light' : 'is-dark')
    btn.setAttribute('aria-label', light ? (lt ? 'Įjungti tamsią temą' : 'Switch to dark mode') : (lt ? 'Įjungti šviesią temą' : 'Switch to light mode'))
    var home = (light ? '/light' : '') + (lt ? '/lt' : '/')
    document.querySelectorAll('[data-site]').forEach(function (a) {
      a.href = home + a.getAttribute('data-site')
    })
    // Other standalone pages carry the theme in the link, so a visitor who
    // turned light mode on keeps it even if localStorage is blocked.
    document.querySelectorAll('[data-page]').forEach(function (a) {
      a.href = a.getAttribute('data-page') + (light ? '?theme=light' : '')
    })
  }

  var saved = null
  try { saved = localStorage.getItem('swiftrix-theme') } catch (e) {}
  var asked = (location.search.match(/[?&]theme=(light|dark)/) || [])[1]
  apply(asked || (saved === 'light' ? 'light' : 'dark'), !!asked)
  btn.addEventListener('click', function () { apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true) })
  document.body.appendChild(btn)

  // Mobile menu — same behaviour as js/vex-fix.js initNav() on the homepage.
  var burger = document.getElementById('vexBurger')
  var links = document.getElementById('vexLinks')
  if (burger && links) {
    var close = function () { links.classList.remove('open'); burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false') }
    burger.addEventListener('click', function (e) {
      e.stopPropagation()
      var open = links.classList.toggle('open')
      burger.classList.toggle('open', open)
      burger.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close) })
    document.addEventListener('click', function (e) { if (!links.contains(e.target) && !burger.contains(e.target)) close() })
  }
})()
