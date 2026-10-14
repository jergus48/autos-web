// Shared by the standalone pages (/demo, /assistant, /collaboration, the interior page and
// their /lt and /de versions): nav links, the slimmer nav on scroll and the mobile menu.
// The site has one theme (dark), so there is no theme switch any more.
(function () {
  'use strict'
  var root = document.documentElement
  var lang = root.lang === 'lt' || root.lang === 'de' ? root.lang : 'en'
  // Links back into the homepage (data-site="#faq" etc.) and to the other language versions
  // of a page (data-page) get their final address here.
  var home = lang === 'en' ? '/' : '/' + lang
  document.querySelectorAll('[data-site]').forEach(function (a) { a.href = home + a.getAttribute('data-site') })
  document.querySelectorAll('[data-page]').forEach(function (a) { a.href = a.getAttribute('data-page') })

  // Slimmer nav once the page scrolls — js/deck-motion.js on the homepage.
  var nav = document.querySelector('.vex-nav')
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

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
