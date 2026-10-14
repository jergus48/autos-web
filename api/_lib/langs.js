// Site languages the AI endpoints know about: the language name used in the
// prompts, the local word for "AI" (small models keep writing "AI" otherwise)
// and the standalone assistant page, which is named in the lead email.
'use strict'

const LANGS = {
  en: { name: 'English', page: '/assistant' },
  lt: { name: 'Lithuanian', ai: 'DI', note: ' (say "DI", not "AI": "DI agentas", "DI asistentas")', page: '/lt/asistentas' },
  de: { name: 'German', ai: 'KI', note: ' (formal "Sie"; say "KI", not "AI": "KI-Agent", "KI-Assistent")', page: '/de/assistent' },
  fr: { name: 'French', ai: 'IA', note: ' (formal "vous"; say "IA", not "AI": "agent IA", "assistant IA")', page: '/fr/assistant' },
  es: { name: 'Spanish (Spain)', ai: 'IA', note: ' (formal "usted"; say "IA", not "AI": "agente de IA", "asistente de IA")', page: '/es/asistente' },
  no: { name: 'Norwegian (Bokmål)', ai: 'KI', note: ' (use "du"/"dere"; say "KI", not "AI": "KI-agent", "KI-assistent")', page: '/no/assistent' },
  da: { name: 'Danish', note: ' (use "I"/"du"; say "AI" as Danes do: "AI-agent", "AI-assistent")', page: '/da/assistent' },
  fi: { name: 'Finnish', ai: 'tekoäly', note: ' (formal "te"; say "tekoäly", not "AI": "tekoälyagentti", "tekoälyavustaja")', page: '/fi/avustaja' },
  sv: { name: 'Swedish', note: ' (use "ni"; say "AI" as Swedes do: "AI-agent", "AI-assistent")', page: '/sv/assistent' },
  pt: { name: 'Portuguese (European)', ai: 'IA', note: ' (formal "o senhor/a senhora" or neutral "você"; say "IA", not "AI": "agente de IA", "assistente de IA")', page: '/pt/assistente' }
}

// 'xx' from the request body, or 'en' for anything unknown.
function pickLang(v) { return typeof v === 'string' && Object.prototype.hasOwnProperty.call(LANGS, v) ? v : 'en' }

module.exports = { LANGS, pickLang }
