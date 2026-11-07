# Swiftrix blog: writing guide

This file is read by the daily blog task before it writes a post. Follow it exactly.

## Goal
Bring search traffic (Google and AI answer engines) from owners and managers of small and mid-sized businesses who lose hours to repetitive office work. One post a day, English only. A post that is thin or generic hurts us, so a skipped day is better than a weak post.

## Who reads it
A business owner, office manager or operations lead, non-technical, in the UK, Ireland, Lithuania and the wider EU. They want to know if something is worth doing, what it involves and what can go wrong.

## Facts you may use about Swiftrix (nothing else about the company)
- Swiftrix is a small independent software automation studio in Vilnius, run by Ignas Lūža.
- It builds automations and integrations (connecting tools a company already uses), AI agents (read emails, enter orders and invoices, answer customers, prepare reports, hand unclear cases to a person) and custom tools.
- Things it has built: digital protocol signing for factory staff with an ID card, replacing paper forms; an invoice archive cleanup program linked to a scanner that tells staff which paper invoices can be thrown away; a structural (statics) calculation app that writes a tailored Word report; a management portal for video clippers with onboarding, payouts and a sales dashboard.
- Projects usually cost between 1,500 and 4,000 euros. Only say this when it fits, never as a headline.
- A live AI agent demo is at /demo. A floor-plan-to-3D tool with a demo is at /3d-demo. Main site is /.
- Calls are booked at https://cal.com/swiftrix.

Never invent clients, case-study numbers, savings percentages, awards, team size, quotes or statistics. If a number is not in this file or well known and checkable, leave it out. General statements ("many offices still re-type invoices by hand") are fine; fake precision is not.

## Rules of style
- Plain, direct English (UK spelling). Short paragraphs. Concrete examples from offices, shops, workshops, clinics, logistics.
- NEVER use the characters for em dash or en dash. Use a comma, colon, full stop or brackets instead. The build fails if one is present.
- Do not use the word "free" about our services. No hype, no "revolutionary", no "game changer". No claims that we guarantee results, rankings or savings.
- Be honest about limits: say when automation is NOT worth it. This is what makes the posts trustworthy and quotable.
- Write 700 to 1,100 words. Use `##` headings that are real questions or clear statements people search for. Include a short answer in the first two sentences of the post.
- One or two natural internal links per post (/demo, /3d-demo, / or an earlier post as /blog/<slug>). At most one mention of booking a call, near the end. The page already adds a call-to-action box, so do not repeat it at length.
- No images are needed. No tables unless essential (the converter does not support them). Lists are fine.

## File format
Path: `blog/posts/YYYY-MM-DD-slug.md` using today's date. Slug: lowercase words with hyphens, 3 to 7 words, describing the topic.

```
---
title: A clear title under 65 characters
description: 140 to 160 characters, answers the question, used in search results
tags: automation, invoices
---

Body in Markdown...
```

## Choosing the topic
Open `blog/TOPICS.md`. Take the first line that is not marked `[done]`. If you have a better idea based on what a business owner would actually search for, you may write that instead, but add it to the list as done. Never repeat a topic already in `blog/posts/`. After writing, mark the line `[done YYYY-MM-DD slug]`. When fewer than 10 open topics remain, add 15 new ones to the end (practical questions about repetitive office work, AI agents, integrations, invoices, email, reporting, onboarding, quoting, scheduling, data entry, spreadsheets, GDPR for automation).

## Checks before committing
1. `node blog/build.mjs` must succeed.
2. Reread the post once for invented facts, dashes and hype, and fix them.
3. Do not touch any file outside `blog/`.
