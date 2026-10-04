// Sends the solution assistant's email (written with the visitor, then edited
// by them) to the Swiftrix inbox, with their contact details and what the
// assistant suggested, so the reply or the call can pick up from there.
//
// Environment (Vercel project settings):
//   SMTP_HOST   e.g. mail.privateemail.com
//   SMTP_PORT   465 (default)
//   SMTP_USER   the mailbox it sends from, e.g. info@swiftrix.eu
//   SMTP_PASS   that mailbox's password
//   LEADS_TO    where leads go (defaults to SMTP_USER)
// Without them this answers 503 and the page offers a mailto: link instead.
//
// The recipient is fixed and no copy goes to the visitor's address, so the
// form can't be used to send mail to anyone else. Reply-To is the visitor.
'use strict'

const { send, readBody, guard, clientIp, rateLimiter, clip } = require('./_lib/common.js')

const limited = rateLimiter(3, 60 * 60 * 1000)
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i
const oneLine = s => s.replace(/[\r\n]+/g, ' ').trim()

const L = {
  lt: { contacts: 'Kontaktai', name: 'Vardas', company: 'Įmonė', email: 'El. paštas', phone: 'Telefonas', ideas: 'Ką pasiūlė DI asistentas', cases: 'Panašūs projektai', original: 'Pradinis problemos aprašymas', context: 'Apie įmonę', answers: 'Atsakymai į klausimus' },
  en: { contacts: 'Contact', name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', ideas: 'What the AI assistant suggested', cases: 'Similar projects', original: 'Original problem description', context: 'About the company', answers: 'Answers to questions' }
}

function compose(d, t) {
  const lines = [d.body, '', '— — —', t.contacts + ':', `${t.name}: ${d.name}`]
  if (d.company) lines.push(`${t.company}: ${d.company}`)
  lines.push(`${t.email}: ${d.email}`)
  if (d.phone) lines.push(`${t.phone}: ${d.phone}`)
  if (d.calc) lines.push('', '— — —', d.calc)
  if (d.solutions.length) {
    lines.push('', '— — —', t.ideas + ':')
    d.solutions.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.title} (${s.kind}, ${s.complexity})`)
      s.steps.forEach(st => lines.push('   - ' + st))
    })
    if (d.cases.length) lines.push(t.cases + ': ' + d.cases.join(', '))
  }
  lines.push('', '— — —', t.original + ':', d.problem)
  if (d.context) lines.push('', t.context + ': ' + d.context)
  if (d.answers) lines.push('', t.answers + ':', d.answers)
  lines.push('', `swiftrix.eu ${d.lang === 'lt' ? '/lt/asistentas' : '/assistant'}`)
  return lines.join('\n')
}

module.exports = async function handler(req, res) {
  if (guard(req, res)) return
  const body = (await readBody(req)) || {}

  // Bots fill every field, including this one hidden from people.
  if (body.website) return send(res, 200, { ok: true })

  const ideas = body.ideas && typeof body.ideas === 'object' ? body.ideas : {}
  const d = {
    lang: body.lang === 'lt' ? 'lt' : 'en',
    name: oneLine(clip(body.name, 100)),
    email: oneLine(clip(body.email, 150)),
    company: oneLine(clip(body.company, 150)),
    phone: oneLine(clip(body.phone, 40)),
    subject: oneLine(clip(body.subject, 150)),
    body: clip(body.body, 4000),
    problem: clip(body.problem, 2500),
    context: clip(body.context, 200),
    answers: clip(body.answers, 1500),
    calc: clip(body.calc, 600),
    solutions: (Array.isArray(ideas.solutions) ? ideas.solutions : []).slice(0, 3).map(s => ({
      title: oneLine(clip(s && s.title, 120)), kind: oneLine(clip(s && s.kind, 20)), complexity: oneLine(clip(s && s.complexity, 20)),
      steps: (Array.isArray(s && s.steps) ? s.steps : []).slice(0, 5).map(x => oneLine(clip(x, 240)))
    })),
    cases: (Array.isArray(ideas.cases) ? ideas.cases : []).slice(0, 2).map(x => oneLine(clip(x, 30)))
  }
  if (d.name.length < 2 || !EMAIL_RE.test(d.email) || d.body.length < 20 || body.consent !== true) {
    return send(res, 400, { error: 'fields' })
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return send(res, 503, { error: 'off' })
  if (limited(clientIp(req))) return send(res, 429, { error: 'rate' })

  const t = L[d.lang]
  const message = {
    from: { name: 'swiftrix.eu', address: SMTP_USER },
    to: process.env.LEADS_TO || SMTP_USER,
    replyTo: { name: d.name, address: d.email },
    subject: '[swiftrix.eu] ' + (d.subject || d.company || d.name),
    text: compose(d, t)
  }

  try {
    const nodemailer = require('nodemailer')
    // LEADS_DRY_RUN builds the message without sending it (local testing).
    const transport = process.env.LEADS_DRY_RUN
      ? nodemailer.createTransport({ streamTransport: true, buffer: true })
      : nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (Number(process.env.SMTP_PORT) || 465) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      })
    const info = await transport.sendMail(message)
    if (process.env.LEADS_DRY_RUN) console.log(info.message.toString())
    return send(res, 200, { ok: true })
  } catch (e) {
    return send(res, 502, { error: 'send' })
  }
}
