import fs from "fs";

const file = "index.html";
let h = fs.readFileSync(file, "utf8");

const R = [
  // ---- meta / head ----
  ['Agelix is a SaaS growth agency delivering high-converting ad campaigns, optimized funnels, and qualified demos to boost MRR and drive predictable growth for SaaS startups and scale-ups.',
   'swiftrix is a software automation studio building reliable, custom workflows and AI integrations that eliminate manual work and save teams hours every week.'],
  ['Agelix – SaaS Growth Agency', 'swiftrix – Software Automation Studio'],

  // ---- hero ----
  ['RISE ABOVE THE NOISE   ·   BE SEEN - BE HEARD', 'ELIMINATE THE BUSYWORK   ·   AUTOMATE EVERYTHING'],
  ['Generate quality leads without lifting a finger', 'Automate your workflows without lifting a finger'],
  ['Are you tired of inefficient marketing strategies?', 'Are you tired of repetitive manual tasks?'],
  ['As experts in efficiency and leaders in lead generation, we have combined extensive human expertise with AI automation to provide unrivaled results',
   'As experts in efficiency and leaders in software automation, we have combined extensive engineering expertise with AI to provide unrivaled results'],
  ['Claim Your Strategy Session', 'Claim Your Automation Audit'],

  // ---- stat card ----
  ['We audited 150 SaaS funnels…', 'We mapped 200 manual workflows…'],
  ['85% lost money in the first 48h.', '73% wasted hours on manual work.'],
  ['Discover why most SaaS funnels fail and how to turn yours into a consistent revenue machine.',
   'Discover why most teams lose hours to manual work and how to turn yours into a self-running machine.'],

  // ---- features ----
  ['Predictable Demo Flow', 'Predictable Automations'],
  ['We don’t gamble with ads. Our system consistently delivers 15–30 qualified SaaS demos every month.',
   'We don’t gamble with guesswork. Our system consistently delivers 15–30 reliable automations every month.'],
  ['Funnel Diagnosis™', 'Process Diagnosis™'],
  ['Every decision comes from hard numbers, not guesswork — so you know exactly where revenue leaks are fixed.',
   'Every decision comes from hard numbers, not guesswork — so you know exactly where time leaks are fixed.'],
  ['Authentic Creatives', 'Custom Integrations'],
  ['Authentic, high-performing ads designed to cut through noise and convert fast — no generic templates.',
   'Custom, high-performing integrations built to fit your stack and run fast — no generic templates.'],
  ['Growth Lab™', 'Optimization Lab™'],
  ['Your campaigns are tested, tweaked, and optimized weekly to squeeze maximum ROI from every dollar.',
   'Your workflows are tested, tweaked, and optimized weekly to squeeze maximum efficiency from every process.'],
  ['Demo Guarantee', 'Uptime Guarantee'],
  ['Trusted by SaaS startups and accelerators — we’ve audited 127+ funnels and know what actually works.',
   'Trusted by startups and ops teams — we’ve automated 200+ workflows and know what actually works.'],

  // ---- benefits ----
  ['SaaS Growth Made Predictable and Profitable', 'Software Automation Made Simple and Reliable'],
  ['Revenue Predictability', 'Time Savings'],
  ['Know your growth month to month.', 'Reclaim hours every single week.'],
  ['Rapid Ad Results', 'Rapid Deployment'],
  ['Fill your pipeline with qualified demos fast.', 'Get your automations live fast.'],
  ['High-Converting Campaigns', 'Reliable Integrations'],
  ['Ads designed to turn', 'Built to turn'],
  ['clicks into demos.', 'manual steps into flows.'],
  ['Scalable Campaigns', 'Scalable Systems'],
  ['Growth that keeps up with your SaaS.', 'Automation that scales with your team.'],
  ['Conversion Insights', 'Process Insights'],
  ['See what drives demos and signups.', 'See what drives speed and savings.'],
  ['SaaS Expertise', 'Automation Expertise'],
  ['Strategies built for software businesses.', 'Systems built for software businesses.'],

  // ---- process ----
  ['We learn about your SaaS, goals, and current funnel.', 'We learn about your team, goals, and current workflows.'],
  ['Funnel Audit', 'Workflow Audit'],
  ['Tailored ad + funnel plan designed for your growth stage.', 'Tailored automation plan designed for your operation.'],
  ['Campaign Launch', 'Build & Deploy'],
  ['We deploy high-converting SaaS ads across key platforms.', 'We build and deploy automations across your key tools.'],
  ['Weekly testing, reporting, and improvements for max ROI.', 'Weekly testing, monitoring, and improvements for max efficiency.'],
  ['Double down on what works to unlock predictable MRR growth.', 'Double down on what works to unlock predictable time savings.'],

  // ---- services ----
  ['SaaS Ad Campaigns', 'Workflow Automation'],
  ['Ads designed to generate qualified demos and accelerate growth.', 'Automations designed to eliminate manual work and accelerate output.'],
  ['Audience research & targeting', 'Process mapping & discovery'],
  ['High-converting creative ads', 'Custom integration builds'],
  ['Multi-platform campaign setup', 'Multi-tool workflow setup'],
  ['Weekly performance reporting', 'Weekly performance monitoring'],
  ['Continuous optimization for ROI', 'Continuous optimization for efficiency'],
  ['Funnel Optimization', 'Process Optimization'],
  ['Maximize every click and demo with data-driven improvements.', 'Maximize every workflow with data-driven improvements.'],
  ['Full funnel audit & analysis', 'Full workflow audit & analysis'],
  ['Landing page & signup optimization', 'System & integration optimization'],
  ['Conversion tracking setup', 'Performance tracking setup'],
  ['A/B testing for ads & pages', 'Testing & validation for every flow'],
  ['Weekly recommendations for growth', 'Weekly recommendations for efficiency'],
  ['Social Media Growth', 'AI Agents & Bots'],
  ['Scale your SaaS presence and engagement across platforms.', 'Deploy AI agents to handle tasks across your stack.'],

  // ---- comparison ----
  ['Run generic campaigns', 'Run generic scripts'],
  ['Vanity Metrics', 'Brittle Setups'],
  ['Surface-Level Ads', 'Surface-Level Fixes'],
  ['SaaS-Specific Strategies', 'Tailored Automations'],
  ['Qualified Demo Bookings', 'Reliable Time Savings'],
  ['Tailored Growth Systems', 'Tailored Automation Systems'],
  ['Demo-or-Free Guarantee', 'Uptime-or-Free Guarantee'],
  ['Continuous Funnel Improvements', 'Continuous Workflow Improvements'],
  ['Data-Driven Revenue Growth', 'Data-Driven Efficiency Gains'],

  // ---- testimonials ----
  ['delivered 25 demos in our first month', 'automated half of our manual work in the first month'],
  ['doesn’t just run ads — they understand SaaS growth. Their strategies are precise, data-driven, and we finally see consistent MRR growth',
   'doesn’t just write scripts — they understand operations. Their builds are precise, data-driven, and we finally see consistent time savings'],
  ['our SaaS leads were unpredictable. After their ad campaigns, our calendar filled with qualified demos in just 3 weeks.',
   'our processes were a mess. After their automations, our team saved 20+ hours a week in just 3 weeks.'],

  // ---- FAQ ----
  ['How soon will I see results from your campaigns?', 'How soon will I see results from your automations?'],
  ['work for pre-revenue SaaS startups?', 'work for small teams and startups?'],
  ['Which platforms do you run ads on?', 'Which tools and platforms do you integrate with?'],
  ['Do you handle funnel optimization or just ads?', 'Do you handle process optimization or just builds?'],
  ['different from other agencies?', 'different from other providers?'],
  ['Do you provide creative for the ads or just strategy?', 'Do you build the automations or just advise on strategy?'],

  // ---- footer ----
  ['Experts in SaaS growth delivering results-driven ad campaigns and funnels.',
   'Experts in software automation delivering reliable, time-saving workflows.'],
];

let report = [];
for (const [from, to] of R) {
  const count = h.split(from).length - 1;
  if (count === 0) report.push("MISS: " + from.slice(0, 50));
  h = h.split(from).join(to);
}

// brand name everywhere (after specific phrases handled)
const agelixCount = h.split("Agelix").length - 1;
h = h.split("Agelix").join("swiftrix");
report.push("Agelix replaced: " + agelixCount);

fs.writeFileSync(file, h, "utf8");

// leftover SaaS-marketing terms to review
for (const t of ["SaaS", "funnel", "demos", "MRR", " ads", "campaign"]) {
  const c = h.split(t).length - 1;
  if (c > 0) report.push("LEFTOVER \"" + t + "\": " + c);
}
console.log(report.join("\n"));
