---
title: How much does business automation cost, and what drives the price
description: What a small business automation project costs, the factors that push the price up or down, the running costs to expect, and when it is not worth paying for.
tags: automation, pricing, ai agents, planning
---

The cost of automating a business process depends less on the technology and more on how many systems are involved, how messy the input is and how many exceptions the process has. A single, well-defined task that connects two tools you already use is at the cheap end; a process that reads unpredictable documents, touches several systems and needs a person to approve edge cases costs more.

For context, the projects we build at Swiftrix usually land between 1,500 and 4,000 euros. That range is not a price list, and plenty of projects elsewhere cost far less or far more. What matters is understanding what you are paying for, so you can judge any quote you receive.

## What actually makes an automation project expensive?

Most of the work is not writing code. It is understanding the process, handling the cases nobody mentioned at the start and testing with real data. These are the factors that move the price most:

- **Number of systems.** Moving data from a shared mailbox into one accounting tool is one connection. Pulling from email, checking stock in a warehouse system, creating an invoice and updating a CRM is four. Each connection needs its own setup, error handling and testing.
- **Quality of the systems' connections.** Modern tools with a documented API are quick to connect. Older desktop software, or a supplier portal with no export, may need workarounds such as generating import files or reading screens. Workarounds take longer and break more often.
- **How predictable the input is.** If every invoice comes from the same three suppliers in the same layout, simple rules do the job. If customers send orders as PDFs, photos, spreadsheets and free text, you need an AI agent that reads and interprets them, plus checks for when it is unsure. We covered this choice in [automation or an AI agent](/blog/automation-vs-ai-agent-which-you-need).
- **Exceptions.** The usual case is easy. The unusual ones (credit notes, partial deliveries, a customer with two addresses) are where most of the effort goes. The more exceptions your team handles from memory, the more there is to build.
- **Who needs to review what.** If a person must approve some items before they go further, someone has to build the review step: a simple list, an email with approve and reject buttons, or a small dashboard.
- **Reporting and logs.** Being able to see what the automation did, and why, is worth paying for. It is also extra work.

## What are the running costs after the build?

The build is a one-off cost. After that, expect some or all of these:

- **Hosting.** The automation has to run somewhere, usually a small cloud server or a service that runs scheduled jobs. For small business volumes this is normally modest.
- **AI usage.** If the process uses an AI model to read emails or documents, each item processed has a small cost charged by the model provider. It grows with volume and with the size of the documents. A good builder will pick the cheapest model that does the job reliably and tell you roughly what to expect per month at your volume.
- **Subscriptions.** Some integrations need a paid plan on one of your existing tools to unlock its API.
- **Maintenance.** Software you connect to changes. A supplier redesigns their invoice, a tool updates its API, a new tax rule appears. Ask in advance how changes are handled and charged.

Ask for these costs in writing before you start. A quote that only covers the build is half a quote.

## How can you keep the price down?

The cheapest automation project is a small one that works. A few practical ways to get there:

1. **Start with one process.** Pick the task that eats the most hours each week and is the most repetitive. Leave the rest for later, once you have seen the first one working. Our post on [which office tasks are worth automating](/blog/which-office-tasks-are-worth-automating) helps with that choice.
2. **Collect real examples.** Gather 20 or 30 real emails, invoices or orders, including the awkward ones. This saves the builder from guessing and avoids surprises later.
3. **Write down the exceptions.** Ask the person who does the job today what they do when something does not fit. Those notes are often the most valuable part of the brief.
4. **Keep your existing tools.** Connecting to the software you already pay for is almost always cheaper than replacing it.
5. **Accept a human step.** Letting the automation handle the clear cases and pass unclear ones to a person is cheaper and safer than trying to automate every edge case.

## When is automation not worth the money?

Sometimes the honest answer is to leave a task alone. Automation is usually not worth paying for when:

- The task takes a few minutes a week. Even a small project will take years to pay back.
- The process changes every few months, because of new suppliers, new rules or a business that is still finding its shape. You would be paying to rebuild it.
- Every case is genuinely different and needs judgement, such as negotiating with a customer.
- The real problem is a missing decision, not missing software. If nobody agrees how a process should work, automating it only makes the confusion faster.
- A setting in a tool you already own does the job. Many accounting and CRM tools have built-in rules, imports and email parsing that people never switch on. Check these first.

## How do you compare quotes?

Prices for similar work vary a lot, so compare what is included rather than the headline figure. Useful questions:

- What exactly will it do, and what will it not do?
- What happens when it meets an input it does not understand?
- Who owns the code and the accounts it runs on?
- What are the monthly running costs at my volume?
- How are changes and fixes charged after launch?
- Can I see something similar working before I commit?

If you want to see what an AI agent looks like in practice before talking about money, try the [live demo](/demo). And if you have a specific process in mind, you can book a short call at https://cal.com/swiftrix and we will tell you honestly whether it is worth automating at all.
