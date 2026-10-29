// The agent tabs on the industry demo pages: [data-agent-tab] buttons show the section with the same name in [data-agent]. #site, #chat and so on in the address pick a tab, so a tab can be linked to.
(function () {
  'use strict'
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-agent-tab]'))
  var panes = Array.prototype.slice.call(document.querySelectorAll('[data-agent]'))
  if (!tabs.length) return
  function show(name) {
    if (!panes.some(function (p) { return p.getAttribute('data-agent') === name })) name = tabs[0].getAttribute('data-agent-tab')
    tabs.forEach(function (t) { var on = t.getAttribute('data-agent-tab') === name; t.setAttribute('aria-selected', String(on)); t.classList.toggle('on', on) })
    panes.forEach(function (p) { p.hidden = p.getAttribute('data-agent') !== name })
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var name = t.getAttribute('data-agent-tab')
      show(name)
      try { history.replaceState(null, '', name === tabs[0].getAttribute('data-agent-tab') ? location.pathname : '#' + name) } catch (e) { /* a file:// page has no history */ }
    })
  })
  show(location.hash ? location.hash.slice(1) : tabs[0].getAttribute('data-agent-tab'))
  window.addEventListener('hashchange', function () { show(location.hash ? location.hash.slice(1) : tabs[0].getAttribute('data-agent-tab')) })
})()
