---
title: How to write a good brief for an automation project
description: A good automation brief describes one task as it happens today, with real examples, the tools involved, the exceptions and what done looks like.
tags: automation, planning, project brief
---

A good brief for an automation project describes one task exactly as it happens today, with a few real examples, the tools involved, the awkward exceptions and what a finished result should look like. It does not need technical language, and it does not need to propose a solution: the clearer the picture of the current work, the better the solution someone can design.

Most owners who want to automate something have a feeling rather than a description: "we spend too long on orders" or "invoices are a mess". Nobody can quote or build from a feeling. A one or two page brief closes that gap, and it often shows you whether the task is worth automating at all.

## What should an automation brief include?

Keep it short and concrete. These are the parts that matter most:

- **The task in one sentence.** For example: "When a customer emails an order, someone types it into our order system and replies with a delivery date."
- **Who does it today and how often.** Roughly how many times a day or week, and roughly how long each one takes. An honest estimate is fine; you do not need a time study.
- **The steps, in order.** Write what the person actually does, click by click if needed. "Open the email, find the customer in the system, copy each product code, check stock in the spreadsheet, type the order, reply."
- **The tools involved.** Name every program, spreadsheet, inbox and website the task touches, including the ones that feel too small to mention.
- **Real examples.** Attach three to ten real cases: actual emails, invoices, forms or exports, with personal details removed if needed. Include at least one messy example.
- **The exceptions.** What goes wrong or needs a judgement call? A product code that does not exist, a customer who orders by phone, a supplier who sends a scan instead of a PDF.
- **What done looks like.** Where should the result end up, and who should be told when something cannot be handled automatically?

That is the whole brief.

## Why describe the current process instead of the solution?

It is tempting to write "we need an AI tool that reads our emails" or "we need an app for our warehouse". The trouble is that the solution you imagine may be bigger, smaller or different from what the task really needs. Sometimes a well-placed connection between two existing tools does the job, and nobody needs a new app. Sometimes the task really does need judgement, and an AI agent that hands unclear cases to a person is the better fit. We wrote about that difference in [automation versus an AI agent](/blog/automation-vs-ai-agent-which-you-need).

Describe the work as it is and you leave room for the simplest workable answer.

## How much detail is enough?

Enough that someone who has never seen your office could follow the task with your notes in hand. A useful test: give the steps to a colleague from another department and ask them to do one case. Wherever they stop and ask a question, the brief is missing something.

You do not need to cover every rare situation. Note the common path in detail, list the exceptions you know about, and say roughly how often they happen. "About one order in twenty has a product code we do not recognise" is far more useful than an attempt to describe every possible error.

## Which mistakes make a brief less useful?

A few come up again and again:

- **Too many tasks at once.** "Automate our office" is not a brief. Pick the one task that costs the most time or causes the most errors, and start there. Others can follow.
- **No real examples.** A description of an invoice is never as useful as the invoice itself. Real documents show the variations that nobody remembers to mention.
- **Leaving out the person who does the work.** The owner often knows the goal, but the person who handles the task every day knows the shortcuts and the traps. Ask them to read the brief before you send it.
- **Hiding the messy parts.** If half the orders arrive by phone or WhatsApp, say so. A builder who learns this later has to redo work.
- **No clear owner.** Someone on your side needs to answer questions and test the result. Name that person in the brief.

## What about access, data and privacy?

Say which systems hold personal or sensitive data and who currently has access to them. You do not need to share passwords in a brief, and you should not. It is enough to list what the automation would need to read and write, so that access can be limited to exactly that. If customer or staff data is involved, it is worth checking the points in our post on [GDPR before connecting tools](/blog/gdpr-checks-before-connecting-tools).

## When does writing a brief tell you not to automate?

Sometimes the act of writing it down is the most useful outcome. You may find that the task happens only a few times a month and takes minutes each time, in which case building anything costs more than it saves. You may find that the steps change every week, or that every case needs a different judgement, which makes the task hard to automate reliably. Or you may find that the real problem is a missing rule, such as nobody agreeing which supplier invoices need approval, and that fixing the rule solves most of it with no software at all.

None of that is a failure. A brief that ends with "we will tidy up the process first" has saved you money.

## What happens after the brief?

With a clear brief, a first conversation can be short and specific. The builder asks about the exceptions, looks at the examples and tells you what is realistic, roughly what it would involve and what it might cost. For context, projects at Swiftrix usually fall between 1,500 and 4,000 euros, depending mostly on how many tools are involved and how messy the exceptions are.

If you want to see what an agent handling this kind of work looks like before you write anything, there is a live example at [/demo](/demo). And if you have a brief, or half of one, you can book a short call at https://cal.com/swiftrix to talk it through.
