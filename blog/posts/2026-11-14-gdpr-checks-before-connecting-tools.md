---
title: GDPR and automation: what to check before connecting tools
description: Before connecting tools or adding an AI agent, check what personal data moves, where it is stored, who processes it and how long it is kept.
tags: gdpr, automation, integrations, ai agents, data protection
---

Connecting your tools or adding an AI agent is usually fine under GDPR, as long as you know what personal data moves, where it goes, who handles it and how long it stays there. Most problems come from not asking those questions at the start, not from automation itself.

This post is a practical checklist for small and mid-sized businesses in the UK, Ireland, Lithuania and the rest of the EU. It is not legal advice. If your data is sensitive (health records, children, criminal records) or you are unsure, talk to a data protection specialist before you build anything.

## Does automation change anything under GDPR?

The rules are the same whether a person or a program handles the data. What changes is scale: a script copying customer details into a spreadsheet does exactly what a person would, just faster and more often.

Automation can make compliance easier. A well built integration moves only the fields it needs, logs what it did and deletes things on a schedule, while a busy office often leaves attachments in shared inboxes for years.

The risk is that a new connection quietly sends data somewhere you did not intend, such as a new cloud service, a country outside the EU or UK, or an AI model provider. That is what the checks below are for.

## What personal data will the automation touch?

Start with a short list. For each automation, write down:

- **Which data it reads.** Names, email addresses, phone numbers, delivery addresses, bank details, signatures, ID numbers, notes about customers or staff.
- **Which data it actually needs.** An invoice workflow needs the supplier, amounts, dates and reference numbers. It rarely needs the name of the person who sent the email.
- **Where the data comes from and where it ends up.** For example: a customer email, then an AI agent, then your order system and your accounting tool.

GDPR's principle of data minimisation means processing only what the purpose needs. Ask whoever builds the automation to pass only the necessary fields.

## Who is processing the data, and do you have agreements with them?

Every outside service that handles personal data for you is a processor: your email provider, CRM, accounting software, automation platform, hosting and any AI model provider.

Under GDPR you need a data processing agreement (often called a DPA) with each processor. Most established software companies publish one with their terms, so you usually just find it and keep a copy.

Check three things for each service:

1. **Is there a data processing agreement?** If a service cannot give you one, do not send personal data to it.
2. **Where is the data stored and processed?** Inside the EU or UK is simplest. If it goes elsewhere, the provider should explain the legal basis for the transfer, such as standard contractual clauses or, for the United States, certification under the EU-US Data Privacy Framework.
3. **Does the provider use your data for its own purposes?** For AI services in particular, check whether your inputs can be used to train their models. Business and API plans from the main providers usually say they do not, but read the terms for the plan you actually use.

## Is it safe to send customer data to an AI agent?

It can be, with the right setup. The questions are the same as for any processor, plus a few specific ones:

- **Which AI provider is used, and under which plan?** Consumer chat apps and business APIs often have different terms on retention and training.
- **How long are inputs and outputs kept?** Some providers keep them for a limited period for abuse monitoring. Know what that period is.
- **Can you remove what the agent does not need?** An agent that reads invoices can work from the document without seeing the full email thread around it.
- **Does a person make the final decision when it matters?** GDPR gives people rights around decisions made solely by automated means that have legal or similarly significant effects on them. For most office work (entering orders, sorting emails, drafting replies) this does not apply. For things like rejecting a job applicant or refusing credit, keep a person in the loop.

The design we described in [what happens when an AI agent gets something wrong](/blog/when-an-ai-agent-gets-it-wrong) helps here too, because sensitive or unusual cases go to a person.

## How long should automated data be kept?

Automations create copies (logs, temporary files, exports), and each copy needs a retention period.

Decide in advance:

- How long logs that contain personal data are kept (often weeks, not years).
- Whether temporary files are deleted once a job is done.
- That records you must keep for tax or accounting reasons stay in your accounting system, where they belong, and not in a side folder the automation created.

A short, automatic clean-up step is one of the easiest wins in any project.

## What should be written down?

You do not need a thick binder. For each automation, a one-page note covering the following is a good start:

- What it does and why (the purpose).
- Which personal data it uses.
- Which services it connects, with links to their data processing agreements.
- Where the data is stored.
- How long data is kept and how it is deleted.
- Who to contact if something goes wrong.

This also feeds your records of processing activities and helps when a customer asks what you hold about them. Large scale processing of sensitive data or systematic monitoring of people may also need a data protection impact assessment; a typical small office workflow usually does not.

## When should you not automate?

Sometimes the honest answer is to wait. Hold off if:

- You cannot find out where a tool stores its data or it has no data processing agreement.
- The process relies on special category data (health, biometrics and similar) and you have no clear legal basis or advice.
- Nobody in the business will own the automation once it is live, including access rights and the clean-up of old data.

## The short version

List the data, keep only what is needed, check every service for a data processing agreement and data location, set retention periods and write it down on one page. Do that and most automations sit comfortably within GDPR.

If you want to see how an agent handles documents and passes unclear cases to a person, try the [live demo](/demo). If you are planning a project and want to talk through the data side, you can [book a call](https://cal.com/swiftrix).
