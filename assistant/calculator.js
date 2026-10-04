// Savings calculator on the assistant page: what the manual work costs now
// and what automating part of it would save. Everything is computed in the
// browser from the visitor's own numbers; the share automation takes over is
// their assumption (a slider), not a promise. assistant.js prefills the time
// from the AI's reading of their problem and adds summary() to the email.
(function () {
  'use strict'

  var LANG = document.documentElement.lang === 'lt' ? 'lt' : 'en'
  var DAYS_PER_MONTH = 21      // working days
  var WEEKS_PER_MONTH = 4.33
  var HOURS_PER_MONTH = 168    // full-time hours, to turn a monthly salary into €/h
  var HOURS_PER_DAY = 8

  var T = {
    lt: {
      perMonth: '/mėn.', perYear: '/metus', h: 'val.', days: 'darbo d.', months: 'mėn.',
      per: { day: 'val./d.', week: 'val./sav.', month: 'val./mėn.' }, people: 'žm.',
      prefilled: 'Laiką užpildėme pagal jūsų aprašymą — pataisykite, jei reikia.',
      summary: function (c, f) {
        return 'Skaičiuoklė: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + T.people + ', ' + f.money(c.rate) + '/val. → dabar ' +
          f.money(c.costMonth) + '/mėn. (' + f.money(c.costMonth * 12) + '/metus). Jei automatizacija perimtų ' + c.share + ' % — sutaupytų ~' +
          f.money(c.saveYear) + '/metus ir ' + f.num(c.hoursFreedYear) + ' val./metus' + (c.payback ? ', atsipirktų per ~' + f.num(c.payback, 1) + ' mėn.' : '.')
      }
    },
    en: {
      perMonth: '/month', perYear: '/year', h: 'h', days: 'working days', months: 'months',
      per: { day: 'h/day', week: 'h/week', month: 'h/month' }, people: 'people',
      prefilled: 'We filled in the time from your description — adjust it if needed.',
      summary: function (c, f) {
        return 'Calculator: ' + c.amount + ' ' + T.per[c.per] + ' × ' + c.people + ' ' + (c.people === 1 ? 'person' : T.people) + ', ' + f.money(c.rate) + '/h → now ' +
          f.money(c.costMonth) + '/month (' + f.money(c.costMonth * 12) + '/year). If automation took over ' + c.share + '% — saves ~' +
          f.money(c.saveYear) + '/year and ' + f.num(c.hoursFreedYear) + ' h/year' + (c.payback ? ', pays back in ~' + f.num(c.payback, 1) + ' months' : '') + '.'
      }
    }
  }[LANG]

  var locale = LANG === 'lt' ? 'lt-LT' : 'en-IE'
  var fmt = {
    money: function (v) { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(v)) },
    num: function (v, d) { return new Intl.NumberFormat(locale, { maximumFractionDigits: d || 0 }).format(v) }
  }

  function $(id) { return document.getElementById(id) }
  var f = {
    amount: $('c-amount'), per: $('c-per'), people: $('c-people'), rate: $('c-rate'), rateUnit: $('c-rate-unit'),
    errors: $('c-errors'), share: $('c-share'), invest: $('c-invest')
  }
  if (!f.amount) return
  var out = $('calc-out'), empty = $('calc-empty'), note = $('calc-note')

  function n(input) {
    var v = parseFloat(String(input.value).replace(',', '.'))
    return isFinite(v) && v > 0 ? v : 0
  }

  // Returns null until the two numbers that matter (time and cost) are in.
  function compute() {
    var amount = n(f.amount), people = n(f.people) || 1, rateIn = n(f.rate)
    if (!amount || !rateIn) return null
    var per = f.per.value
    var hoursMonth = amount * (per === 'day' ? DAYS_PER_MONTH : per === 'week' ? WEEKS_PER_MONTH : 1) * people
    var rate = f.rateUnit.value === 'month' ? rateIn / HOURS_PER_MONTH : rateIn
    var share = Number(f.share.value) / 100
    var costMonth = hoursMonth * rate
    var saveMonth = (costMonth + n(f.errors)) * share
    var invest = n(f.invest)
    return {
      amount: amount, per: per, people: people, rate: rate, share: Math.round(share * 100),
      hoursMonth: hoursMonth, costMonth: costMonth, saveMonth: saveMonth, saveYear: saveMonth * 12,
      hoursFreedYear: hoursMonth * share * 12, afterMonth: costMonth + n(f.errors) - saveMonth,
      payback: invest && saveMonth ? invest / saveMonth : 0
    }
  }

  function set(id, text) { $(id).textContent = text }

  function render() {
    $('c-share-val').textContent = f.share.value + ' %'
    var c = compute()
    out.hidden = !c
    empty.hidden = !!c
    if (!c) return
    set('r-now-month', fmt.money(c.costMonth) + T.perMonth)
    set('r-now-year', fmt.money(c.costMonth * 12) + T.perYear + ' · ' + fmt.num(c.hoursMonth) + ' ' + T.h + T.perMonth)
    set('r-save-year', fmt.money(c.saveYear) + T.perYear)
    set('r-save-month', fmt.money(c.saveMonth) + T.perMonth)
    set('r-hours', fmt.num(c.hoursFreedYear) + ' ' + T.h + T.perYear)
    set('r-days', '≈ ' + fmt.num(c.hoursFreedYear / HOURS_PER_DAY) + ' ' + T.days)
    $('r-payback-box').hidden = !c.payback
    if (c.payback) set('r-payback', '≈ ' + fmt.num(c.payback, 1) + ' ' + T.months)
    var max = Math.max(c.costMonth + n(f.errors), 1)
    $('bar-now').style.width = '100%'
    $('bar-after').style.width = Math.max(2, (c.afterMonth / max) * 100) + '%'
    set('bar-now-val', fmt.money(c.costMonth + n(f.errors)) + T.perMonth)
    set('bar-after-val', fmt.money(c.afterMonth) + T.perMonth)
  }

  Object.keys(f).forEach(function (k) { f[k].addEventListener('input', render) })
  render()

  window.SwiftrixCalc = {
    // Fill the time from the AI's reading of the problem, unless the visitor
    // has already typed their own numbers.
    prefill: function (t) {
      if (!t || !(t.amount > 0) || n(f.amount)) return
      f.amount.value = String(Math.round(t.amount * 10) / 10)
      if (t.per === 'day' || t.per === 'week' || t.per === 'month') f.per.value = t.per
      if (t.people > 0) f.people.value = String(Math.round(t.people))
      note.textContent = T.prefilled
      note.hidden = false
      render()
    },
    summary: function () { var c = compute(); return c ? T.summary(c, fmt) : '' }
  }
})()
