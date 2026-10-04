// Theme for the standalone pages (/demo, /assistant and their /lt versions).
// Uses the same localStorage key as the main site's switch (theme-switch.js),
// and links from the /light build pass ?theme=light. The <head> of each page
// applies the theme before first paint; this keeps the toggle and the
// "back to the site" links (data-home) in step with it.
(function () {
  'use strict'
  var root = document.documentElement
  var lt = root.lang === 'lt'

  function apply(t, save) {
    root.setAttribute('data-theme', t)
    if (save) { try { localStorage.setItem('swiftrix-theme', t) } catch (e) {} }
    document.querySelectorAll('[data-home]').forEach(function (a) {
      a.href = (t === 'light' ? '/light' : '') + (lt ? '/lt' : '/')
    })
  }

  var saved = null
  try { saved = localStorage.getItem('swiftrix-theme') } catch (e) {}
  var asked = (location.search.match(/[?&]theme=(light|dark)/) || [])[1]
  apply(asked || (saved === 'light' ? 'light' : 'dark'), !!asked)

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-theme-toggle]')) apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true)
  })
})()
