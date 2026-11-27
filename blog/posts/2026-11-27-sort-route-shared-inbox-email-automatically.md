---
title: How to sort and route shared inbox email automatically
description: Stop a shared inbox from swallowing orders, invoices and complaints. How automatic sorting and routing works, what it needs, and when simple rules are enough.
tags: automation, email, AI agents, shared inbox
---

To sort and route a shared inbox automatically, you decide which kinds of email arrive, who should handle each kind, and then let rules or an AI agent read each message, label it and pass it to the right person or system. Anything the system is unsure about goes to a person, so nothing is lost when a message does not fit.

The aim is not an empty inbox. It is that every email lands with someone who knows it is theirs.

## Why does a shared inbox get out of hand?

An address like info@ or office@ starts as a convenience. Customers, suppliers, the bank, job applicants and newsletters all use it. Over time it collects a bit of everything:

- orders and quote requests
- supplier invoices and payment reminders
- complaints and delivery questions
- job applications and CVs
- messages from the accountant or the tax office
- spam and marketing that slipped past the filter

When several people share the inbox, two problems appear. Some emails get answered twice, because two people saw them. Others get answered by nobody, because everyone assumed someone else would.

## What does automatic sorting actually do?

It does three things for every incoming message.

**It works out what the email is.** An order, an invoice, a complaint, a question about an existing job, a CV, or something else. This is the hard part, and where the method matters most.

**It pulls out the useful details.** For an order, the customer and the items. For an invoice, the supplier, the amount and the due date. For a complaint, the order or job number it refers to.

**It sends the message where it belongs.** That can mean a label and an assignment in the inbox, a forward to a person or team, a new task in your job system, or the invoice dropped into the accounting software's inbox.

## Are simple email rules enough?

Sometimes, yes, and it is worth trying them first. The filters built into Outlook or Gmail can sort by sender, subject or keywords at no extra cost.

Rules work well when:

- a known sender always sends the same kind of email, such as one supplier's invoices or your webshop's order notifications
- the subject line follows a fixed pattern
- you only need to move or label messages, not read what is inside

Rules break down when the same kind of email arrives in many different forms. Customers do not write "ORDER" in the subject. A complaint might be titled "Re: your delivery" or have no subject at all. A supplier changes its email address and the rule silently stops working. When your team spends time fixing what the rules got wrong, you have outgrown them.

## Where does an AI agent help?

An AI agent reads the message the way a person would, rather than matching keywords. It can tell that "the boxes came but two were crushed" is a complaint, and that "can you do the same as last time but 200 units" is an order, even though neither uses the obvious words.

It can also handle the in-between cases more sensibly. An email that contains both an invoice and a question about it can go to finance with a note that a reply is needed.

The important design choice is what happens when the agent is not sure. A well built setup gives every message a confidence check. Clear cases are routed straight away. Unclear ones go to a named person with the agent's best guess attached, so they can confirm or correct it in a few seconds. We go into this in more depth in [what happens when an AI agent gets something wrong](/blog/when-an-ai-agent-gets-it-wrong).

## What do you need to set it up?

1. **A list of email types.** Look through a few weeks of the inbox and write down the categories that actually come in. Six to ten is usually enough. Add an "other" category for everything else.
2. **An owner for each type.** One person or team per category, and a backup for holidays.
3. **What "done" means.** For an invoice, is it done when it is filed, or when it is approved? For a complaint, when it is acknowledged, or when it is resolved?
4. **Access to the inbox.** The automation needs permission to read the mailbox and to label or forward messages. Give it only that, not access to everything else in your company account.
5. **Examples.** A handful of real emails for each category, including awkward ones, so the setup can be tested before it goes live.

Because a shared inbox often contains personal data, from CVs to customers' home addresses, check where the messages are processed and who can see them.

## What should still be handled by a person?

Sorting is a good job for automation. Replying is not always. Keep a person on:

- complaints from upset customers, at least for the first reply
- anything involving money disputes, legal letters or the tax office
- messages from your most important customers, where tone matters
- anything the agent flagged as unclear

If you later let the agent draft routine replies, start with one narrow kind of question and review the drafts for a while.

## When is it not worth it?

If your shared inbox receives a few dozen emails a week and one person reads it every morning, automatic routing will not change much. A couple of filters and a clear rule about who checks the inbox will do the job.

It is also not worth automating if nobody owns the categories. Routing an email to "sales" only helps if someone in sales is expected to act on it.

The case is strong when the inbox is busy, shared by several people, and carries emails that create real work: orders to enter, invoices to approve, complaints with a deadline.

## How do you start?

Export or skim a month of messages and count roughly how many fall into each category. Pick the one or two that cause the most trouble, often orders and invoices, and route only those at first. Leave everything else in the inbox as it is. Once the team trusts the first categories, add more.

You can see an AI agent reading and sorting incoming emails in the [live demo](/demo). If you want to talk through your own inbox, you can [book a call](https://cal.com/swiftrix).
