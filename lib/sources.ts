// Cheat sheet for callers. Edit this file to add facts or change answers; the Sources page renders it.
// Only put in things that are true. If a caller is asked something not covered here, they should say
// they will confirm it on the video call, never improvise.

export const ABOUT = {
  who: 'Swiftrix (swiftrix.eu) is a studio that builds custom software and personalised AI agents for companies that outgrew spreadsheets and off-the-shelf tools.',
  contact: 'info@swiftrix.eu · swiftrix.eu',
  pitch30:
    'We at Swiftrix build custom software and personalised AI agents for companies whose important work still lives in spreadsheets, email and paper: dashboards, client portals, document generators and agents that answer repetitive questions or sort documents. We usually have a first working prototype within weeks, not months.',
  whatWeDo: [
    { t: 'Operations consoles', d: 'Dashboards that turn raw operational data into decisions: sorting, review and status at a glance.' },
    { t: 'Self-service portals', d: 'Portals for clients, creators and partners with accounts, submissions, payouts and moderation.' },
    { t: 'Document automation', d: 'Reports, Word files and spreadsheets the team writes by hand today, generated in one click.' },
    { t: 'Internal tools', d: 'Purpose-built replacements for the spreadsheet and email processes a business runs on.' },
    { t: 'Personalised AI agents', d: 'Agents that answer repetitive questions, sort documents, draft offers and chase statuses.' },
  ],
  howWeWork: ['We map the process', 'Prototype in days', 'We launch live', 'We refine through use'],
  ways: [
    { t: 'Discovery sprint', d: 'A fixed, low-commitment phase to map the process and build a prototype of the solution.' },
    { t: 'Fixed-scope build', d: 'Clear scope, timeline and price to design, build and launch the product.' },
    { t: 'Ongoing partnership', d: 'We keep improving and extending the product as the business grows.' },
  ],
};

export const FLOW = [
  'Cold call: be brief, show you did your homework, ask permission for 30 seconds.',
  'Goal of the call: get their best email address and agree a time for a short 1:1 video call (Google Meet). Do not try to sell on the phone.',
  'Log the call in the app. If they agreed to a meeting, tick "meeting agreed", enter their email, pick a free slot and send the Meet invite.',
  'After the client agrees, generate the slides and your presenter script for that company. Slides are for the Meet, not for the cold call.',
  'On the Meet: walk through the slides with the presenter script, ask the discovery questions, write down price expectations, tools they use and what they want in the agreement.',
  'After the Meet: open My calendar, flag the result (interested, maybe, not interested, no show) and fill in price, tools, agreement and notes.',
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Who are you and what do you do?',
    a: 'We at Swiftrix build custom software and personalised AI agents for companies that outgrew spreadsheets: dashboards, portals, document generators and agents for repetitive work. The point is software that fits how the company really works, not a template they bend their process around.',
  },
  {
    q: 'Why are you calling us?',
    a: 'Be honest and specific: we looked at your website and at how companies like yours work, and we think part of the day-to-day work (name one concrete process from the research) is still done by hand in spreadsheets, email or paper. We would like to show you in a short video call how that could run automatically. The call script in the app has the details for each company.',
  },
  {
    q: 'What exactly can you build for us?',
    a: 'Four kinds of things, done well: operations consoles (dashboards), self-service portals, document automation and internal tools, plus personalised AI agents. For their company we prepare four concrete ideas with mock screens, and we show them on the video call.',
  },
  {
    q: 'Do you have examples or previous projects?',
    a: 'Yes, six working systems: Upshift (content creation and publishing automation), Gaya (document scanning console), Geosoul (engineering report generator), Hakom & Aluprint (quality document management), Urbár (land ownership and mandate automation) and a film programme and screening report tool used by the team. Pick the one or two closest to their business. Details are below on this page.',
  },
  {
    q: 'How long does it take?',
    a: 'We aim for a first working prototype within weeks, not months. After a discovery sprint they see a working screen very early, not just a slide. Do not promise exact dates for their project on the phone.',
  },
  {
    q: 'How much does it cost?',
    a: 'Do not quote numbers on the cold call. Say that the price depends on the scope, and that after the video call we can start with a discovery sprint (a fixed, low-commitment phase) or propose a fixed-scope build with a clear scope, timeline and price. If they press, note their budget expectation and tell them we will come back with a concrete proposal.',
  },
  {
    q: 'We already have software / our Excel works fine.',
    a: 'That is exactly where we are useful: standard software makes the process fit its product, and spreadsheets break when volume grows or when several people depend on them. We do not replace what works. We build the part that people still fill in by hand. Ask which process takes the most manual time today.',
  },
  {
    q: 'Just send me an email.',
    a: 'Happy to. Ask for the best email address for them (even if you already have one) and explain that the email will contain a Google Meet link for a short 1:1 video call where we show a short presentation prepared for their company and our previous work. Offer two time slots and ask which suits.',
  },
  {
    q: 'We have no time or no budget.',
    a: 'The video call is short and shows something concrete, not a sales speech. Nothing to decide on the call. If there is no budget now, ask when they plan the next budget round and offer to follow up then; log it as call back with a date.',
  },
  {
    q: 'Is this a no-code tool or real software?',
    a: 'Real software: full-cycle products that grow with the company, without the limits of no-code tools a year from now. Do not go deeper into the technology on the phone.',
  },
  {
    q: 'What about AI agents?',
    a: 'We build personalised AI agents for repetitive work: answering routine questions, sorting documents, drafting offers, chasing statuses. We choose between an agent and classic automation depending on what fits their process better. Keep it concrete and tied to one process of theirs.',
  },
  {
    q: 'Who owns the software, where is data stored, what about GDPR and security?',
    a: 'Do not answer from memory. Say that this is an important question that we cover in detail on the video call and in the agreement, and note it so it goes into the "what to put in the agreement" field after the meeting.',
  },
  {
    q: 'Where are you based and how big is the team?',
    a: 'This is not written down here yet. Ask your admin before you make calls, and do not improvise. If asked before you know, say you will introduce the team on the video call.',
  },
];
