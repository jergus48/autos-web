---
title: How to automate order entry from customer emails
description: An AI agent can read order emails and PDFs, match products and customers, and draft the order in your system. What it involves, what to check, and when not to.
tags: automation, ai agents, orders, email
---

You can automate order entry from email by letting an AI agent read each incoming order (the email text, a PDF or a spreadsheet), match the customer and products against your own records, and create a draft order in the system you already use. A person then checks the unclear ones instead of typing every line by hand.

It works best for businesses that receive many similar orders from regular customers, such as wholesalers, food suppliers, print shops, spare parts sellers and logistics firms. It works less well when every order is a one-off conversation.

## Why is order entry from email still done by hand?

Because customers do not order the way your system wants them to. One sends a PDF from their purchasing software. Another types "the usual plus 2 boxes of the blue ones" in the body of an email. A third attaches an Excel file with their own product codes, not yours. Someone in the office reads each one, works out what was meant, finds the products and types the lines into the order system.

Plain rule-based automation struggles here because there is no single layout to follow. This is exactly the kind of messy input where an AI agent makes sense. If you are not sure which of the two you need, we explained the difference in [automation or an AI agent](/blog/automation-vs-ai-agent-which-you-need).

## What does an automated order entry flow look like?

A typical setup has five steps:

1. **Collect.** The agent watches a shared mailbox such as orders@ and picks up every new message and its attachments.
2. **Classify.** It decides whether the email is a new order, a change to an existing order, a question or something else. Only orders go further; the rest are passed to a person or left in the inbox.
3. **Extract.** It reads the customer, delivery address, delivery date, products, quantities and any notes, from the email text or the attachment.
4. **Match.** It looks up the customer in your records and matches each line to one of your products. "Blue ones" becomes a real product code because the agent can see what that customer ordered before, or the product names in your catalogue.
5. **Create and report.** It creates the order as a draft in your system (or fills in a ready-to-import file if the system has no connection), then replies or flags it for review.

Steps 1, 2 and 5 are mostly ordinary automation. Steps 3 and 4 are where the agent earns its place.

## Do you need to replace your order system?

No. The agent sits next to the tools you already have. If your ERP, webshop or accounting software has an API, the agent writes orders straight into it. If it has an import function (often a CSV file), the agent prepares that file. If it has neither, there are still options, such as filling a shared spreadsheet the team already uses, though each extra manual step reduces the benefit.

Before starting, it is worth finding out which of these your system supports. It changes the size of the project more than anything else.

## How accurate is it, and what happens when it gets something wrong?

An agent will misread some orders. Handwritten scans, unusual units ("a pallet" when you sell per box) and products with very similar names are the usual causes. The important part is designing for that, not pretending it will not happen.

Good setups do three things:

- **Show confidence per line.** If a product match is uncertain, the line is marked, and the order waits for a person instead of going through.
- **Check against rules you already know.** A quantity ten times higher than the customer normally orders, a product they have never bought, or a delivery date in the past should all stop the order for review.
- **Keep the original.** Every draft order links back to the email and attachment it came from, so whoever checks it can compare in seconds.

In practice the team moves from typing every order to reviewing the flagged ones. How many get flagged depends heavily on how tidy your product data and customer orders are, so do not trust anyone who promises a fixed figure before seeing your emails.

## What do you need to prepare?

- **A sample of real orders.** A few weeks of typical order emails, including the awkward ones, so the setup is tested on your reality rather than on clean examples.
- **A clean product list.** Names, codes, units and, ideally, common alternative names customers use. Messy product data is the most common reason matching goes wrong.
- **Customer records with history.** Past orders help the agent understand what "the usual" means.
- **A decision on who reviews.** One named person or a small group should own the review queue, with a rule for how quickly they handle it.

## When is automating order entry not worth it?

Be honest with yourself on these points:

- **Low volume.** If you receive a handful of orders a week, typing them is probably faster than maintaining any system.
- **Orders that are really negotiations.** If most orders involve back-and-forth on price, specs or availability, a person needs to be in the conversation anyway.
- **Customers you can move to a portal.** If your main customers would happily use a webshop or an order form, that structured input is cheaper and more reliable than reading emails. Many businesses end up with both: a portal for those who will use it, an agent for those who will not.
- **Chaotic product data.** If your own team struggles to find the right product code, fix the catalogue first. An agent will not do better than the data it matches against.

## What does it cost to run?

There are two parts: building and connecting the setup once, and the running cost of the AI model per email, which is usually small per order but grows with volume and long attachments. At Swiftrix, projects of this size usually fall between 1,500 and 4,000 euros, depending mostly on how your order system can be connected and how many order formats need handling.

## How to start without a big project

Pick your five or ten biggest customers by order count, collect their last few dozen orders, and test extraction and matching on those alone. If it handles them reliably, add more customers step by step. You get most of the benefit from a small group of regular customers, and you learn where your data needs cleaning before anything goes live.

To see how an agent reads an email and decides what to do with it, try the live example at [/demo](/demo). If you want to talk through your own order flow, you can book a short call at https://cal.com/swiftrix.
