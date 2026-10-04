import { llmJson } from './llm';
import { readSite, webSearch, normUrl, logoTone } from './research';
import { Lang } from './fixed';

const LANG_FULL: Record<Lang, string> = {
  lt: 'Lithuanian (formal "Jūs" register)',
  en: 'English',
  de: 'German (formal "Sie" register)',
};

export type Company = { id: number; name: string; email?: string; phone?: string; website?: string; logo_url?: string };

export async function buildDeck(c: Company, lang: Lang) {
  const site = await readSite(c.website || '');
  const host = (() => {
    try {
      return new URL(normUrl(c.website)).host.replace(/^www\./, '');
    } catch {
      return '';
    }
  })();
  const search = await webSearch(`${c.name} ${host} company what they do, size, services`);

  let tokens = 0;

  // 1) research brief (English, for the seller)
  const r1 = await llmJson(
    'You are a B2B sales researcher for a custom-software and AI-automation studio. Use ONLY the supplied material; if something is unknown, say "unknown" instead of inventing it. Reply with a JSON object.',
    `Company: ${c.name}\nWebsite: ${c.website || 'n/a'}\n\nWEBSITE CONTENT:\n${site.text || '(could not be read)'}\n\nWEB SEARCH SUMMARY:\n${search.answer}\n${search.results.map((x) => `- ${x.title} (${x.url}): ${x.content}`).join('\n')}\n\nReturn JSON: {"summary": "2-3 sentences", "whatTheyDo": "...", "industry": "...", "size": "...", "painPoints": ["3-5 likely manual/spreadsheet/email-heavy processes, grounded in what they do"], "opportunities": ["3-5 automation or AI-agent opportunities"], "angle": "best angle for a cold approach", "sources": ["urls used"]}`
  );
  tokens += r1.tokens;
  const research = { ...r1.data, pagesRead: site.pagesRead };

  // 2) deck content + cold script in target language
  const r2 = await llmJson(
    `You write a personalised sales deck and cold outreach for Swiftrix (swiftrix.eu), a studio that builds custom software, portals, dashboards, document automation and AI agents for companies that outgrew spreadsheets. Write everything in ${LANG_FULL[lang]}. Be concrete and specific to the target company's real business; never invent facts about them (numbers inside UI mockups are illustrative). Short, plain sentences, no hype, no emojis, no em-dashes. Mock table rows and KPIs must look like real data from THIS industry: realistic specific names, places, dates, quantities and statuses. The mock MUST have exactly 4 kpis, exactly 4 cols (the last one being a status column) and exactly 4 rows with 4 cells each. Order the 4 mock rows as: two healthy/done rows, one problem/late row, one waiting row. Never use bracket placeholders like [Your Name] in the call script, speak as 'we at Swiftrix'. Never use placeholders like A/B/C, Project 1, Team 2 or Lorem. Each idea's problem must name a concrete manual task (spreadsheets, email threads, phone calls, paper) that this type of company really has. Reply with a JSON object.`,
    `Target company: ${c.name} (${c.website || ''})\nRESEARCH BRIEF:\n${JSON.stringify(research)}\n\nReturn JSON exactly in this shape:\n{
 "cover": {"tagline": "one line: software that actually runs <their business>, built not bought"},
 "ideasIntro": {"text": "1-2 sentences: four concrete places the same approach would work at this company"},
 "ideas": [ // EXACTLY 4, each a different kind: operations console, document automation, self-service portal or AI agent, internal tool
  {"name": "ONE word, max 12 characters, a plain noun like Objektai, Aktai, Pirkėjai, Gamyba or Orders, Reports, Portal", "subtitle": "short descriptor", "kind": "console|documents|portal|agent",
   "problem": "2 sentences about how it works manually today at THIS company",
   "solution": "2 sentences about what we would build",
   "stats": [{"v": "short value like 1 screen / 2 steps / 18 managers", "l": "tiny label"}, {"v": "...", "l": "..."}],
   "mock": {"url": "app.${host || 'company.com'}", "title": "screen title", "subtitle": "one line", "kpis": [{"l": "label", "v": "value"}, {"l": "", "v": ""}, {"l": "", "v": ""}, {"l": "", "v": ""}],
     "cols": ["col1", "col2", "col3", "Status"], "rows": [["a","b","c","status"], ["a","b","c","status"], ["a","b","c","status"], ["a","b","c","status"]]}}
 ],
 "questions": [ // EXACTLY 4 discovery questions tailored to this company, each with a one-line explanation
  {"q": "...", "d": "..."}
 ],
 "closing": {"title": "Let's turn <their most complex process> into software.", "text": "2 sentences inviting a discovery sprint"}
}`
  );
  tokens += r2.tokens;
  const d: any = r2.data;

  const ideaList = (d.ideas || []).slice(0, 4).map((i: any) => `- ${i.name}: ${i.subtitle}. Today: ${i.problem} Proposed: ${i.solution}`).join(String.fromCharCode(10));
  const r3 = await llmJson(
    `You write long, natural, spoken cold-call scripts for Swiftrix (swiftrix.eu), a studio that builds personalised AI agents and personalised software automations (dashboards, portals, document generators) for companies that outgrew spreadsheets. Write in ${LANG_FULL[lang]}. Plain spoken sentences a human can say out loud, no hype, no emojis, no em-dashes. Never use bracket placeholders; speak as 'we at Swiftrix'. Never invent facts about the target company; hedge estimates ('typically', 'often'). The script MUST be long: 950 to 1150 words in total, never shorter than 900. Reply with a JSON object.`,
    `Target company: ${c.name} (${c.website || ''})
RESEARCH BRIEF:
${JSON.stringify(research)}

IDEAS ALREADY PREPARED FOR THEM (refer to 2 of them by name):
${ideaList}

Return JSON: {"sections": [ exactly these 7 objects, each {"title": "short title in the target language", "text": "full spoken text with the stated minimum length"} ]}
1 Opening (80-105 words): greet, say you are from Swiftrix, why you are calling THEM, ask permission for 30 seconds.
2 Why this company (140-180 words): show homework, 3 concrete observations about how they work and where manual work likely hurts.
3 What we offer (230-290 words): explain both options in plain words, personalised AI agents (answering repetitive questions, sorting documents, drafting offers, chasing statuses) and personalised software automations (dashboards, portals, document generators replacing spreadsheets); choose the better fit for them and describe 2 of the prepared ideas concretely.
4 Time and money (170-215 words): how it saves hours per week, avoids errors, speeds up responses, avoids extra hires for routine work; careful estimates, a simple example calculation using typical numbers, clearly hedged.
5 Proof (95-125 words): we already built working systems for companies in media, construction engineering, document management and land administration; a first working prototype within weeks.
6 The ask: their email (155-200 words): ask for the best email address for them, even if we already have one, so we can send a short page with a Google Meet calendar link; explain we will do a 1:1 video call where we show the prepared slides and our previous work; propose two time slots wording and ask which suits.
7 Objections and close (200-260 words): short answers to 'not interested', 'send me an email', 'no time or budget', 'we already have software'; a polite close confirming the email and meeting; then a 15-second voicemail version.`
  );
  tokens += r3.tokens;

  const ideas = (d.ideas || []).slice(0, 4).map((i: any) => ({
    ...i,
    stats: (i.stats || []).slice(0, 2),
    mock: {
      ...(i.mock || {}),
      kpis: (i.mock?.kpis || []).slice(0, 4),
      cols: (i.mock?.cols || []).slice(0, 4),
      rows: (i.mock?.rows || []).slice(0, 4),
    },
  }));
  if (ideas.length < 4) throw new Error('Model returned fewer than 4 ideas, please retry');

  const slides = {
    companyName: c.name,
    logo: c.logo_url || site.logo || '',
    logoTone: await logoTone(c.logo_url || site.logo || ''),
    lang,
    cover: { ...(d.cover || {}), tagline: ((d.cover?.tagline as string) || '').replace(/^\s*(\p{L})/u, (m: string) => m.toUpperCase()) },
    ideasIntro: d.ideasIntro || {},
    ideas,
    questions: (d.questions || []).slice(0, 4),
    closing: d.closing || {},
  };
  return { research, slides, script: { sections: (r3.data as any).sections || [] }, logo: site.logo, tokens };
}
