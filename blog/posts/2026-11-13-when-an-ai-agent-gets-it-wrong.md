---
title: What happens when an AI agent gets something wrong
description: AI agents do make mistakes. A well designed one checks its own work, stops when unsure and hands unclear cases to a person, so errors are caught before they cost money.
tags: ai agents, automation, risk, quality control
---

An AI agent will get things wrong sometimes, just as a new member of staff does. The question is not whether it makes mistakes but whether the system around it catches them before they reach a customer, a supplier or your accounts.

This post covers the mistakes agents make in office work, how to design for them, and when you should keep a person doing the job.

## What kinds of mistakes do AI agents make?

In everyday office work, the errors tend to fall into a few groups:

- **Misreading a document.** A smudged scan, an unusual invoice layout or a handwritten note can lead to a wrong amount, date or reference number.
- **Matching to the wrong record.** Two customers with similar names, a supplier who changed their trading name, or a product code that looks like another one.
- **Misunderstanding intent.** A customer email that says "cancel the second item, keep the rest" can be read the wrong way if the order has several lines.
- **Sounding sure when it should not.** Language models can produce a confident answer even when the information they were given is incomplete. This is the one to design against most carefully.
- **Following a rule that no longer applies.** A price changed, a supplier moved to new payment terms, and nobody updated what the agent works from.

People make all of these too. The difference is that an agent works at speed, so a flaw in its setup can repeat many times before anyone notices. That is why the checks matter more than the cleverness of the model.

## How do you design an agent so mistakes are caught?

A good agent is built like a careful junior employee with a supervisor. In practice that means a handful of habits.

**1. It checks its work against things it can verify.** If an agent reads an invoice, it should confirm that the line items add up to the total, that the VAT figure is consistent, and that the supplier exists in your system. If it reads an order, it should confirm that the product codes exist and the quantities are sensible. These are plain rules, not AI, and they catch a large share of reading errors.

**2. It knows when to stop.** The agent should hand a case to a person whenever something does not fit: a new supplier, an amount above a set limit, a total that does not match, a customer complaint, or any email it cannot classify with confidence. Handing over is not a failure. It is the agent doing its job properly.

**3. It starts with a person approving everything.** In the first weeks, the agent prepares the work (a draft invoice entry, a reply, an order) and a person clicks approve. Once you have seen it handle real cases well, you let it complete the simple, low-risk ones on its own and keep approval for the rest.

**4. It keeps a record.** Every action should be logged: what came in, what the agent decided, what it changed and why. When something goes wrong, you can see exactly what happened and fix the cause rather than guess.

**5. It has limited permissions.** An agent that enters supplier invoices does not need the ability to make payments. An agent that drafts customer replies does not need to delete records. Giving it only the access the task needs keeps the worst case small.

**6. Changes can be undone.** Entries go in as drafts or can be reversed, rather than being final the moment the agent acts.

If you want to see how an agent handles a request in practice, you can try the [live agent demo](/demo).

## What happens when a mistake gets through anyway?

Some will. The design goal is that when one does, it is small, visible and easy to correct. A typical sequence looks like this:

1. Someone notices a wrong entry, or a daily check flags it.
2. The log shows what the agent saw and what it did.
3. The entry is corrected or reversed.
4. The cause is fixed: a new rule, a better example, a supplier added to the "always check" list, or a threshold lowered.

Step four is the important one. Once the rule is written down, a properly corrected agent should not repeat that specific mistake. Over the first months, the cases that go to a person usually become fewer and more predictable.

## When should a person keep doing the task?

Keep a person in charge, or at least approving every case, when:

- **A single error is expensive or hard to reverse.** Paying suppliers, signing contracts, sending legal notices or changing someone's medical or employment records.
- **The judgement is genuinely human.** Handling a distressed customer, deciding whether to extend credit to a struggling client, or anything where the right answer depends on a relationship.
- **The volume is tiny.** If a task happens five times a month, the effort to build and supervise an agent will not pay back. A checklist is often the better tool.
- **The inputs are chaotic.** If every request arrives in a different form and needs a phone call to clarify, the agent will hand nearly everything back. We wrote about spotting this in [how to tell if a task is too messy to automate](/blog/how-to-tell-if-task-too-messy-to-automate).

In many businesses the best setup is a split: the agent handles the routine bulk, a person handles the exceptions and the decisions that matter.

## What should you ask before trusting an agent with real work?

Whether you build one yourself or hire someone, these questions are worth asking:

- What does the agent do when it is not sure?
- Which checks run on its output before anything is saved or sent?
- Can I see a log of every action it took?
- What permissions does it have, and why does it need each one?
- How do I undo something it did?
- Who updates the rules when our prices, suppliers or processes change?

If the answers are vague, the agent is not ready for your business.

## The short version

An agent that gets something wrong is not a disaster if it was built to expect it. Verify what can be verified, stop on anything unusual, start with approval, log everything, limit access and keep changes reversible.

If you are weighing up an agent for invoices, orders or customer emails and want to talk through where the risks are, you can book a short call at [cal.com/swiftrix](https://cal.com/swiftrix).
