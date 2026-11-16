---
title: How to tell if a task is too messy to automate
description: A practical test for whether a messy office task can be automated, can be automated after tidying, or should stay with a person, with signs to look for in each case.
tags: automation, planning, ai agents, processes
---

A task is too messy to automate when nobody can describe what "done correctly" looks like, or when the right answer depends on judgement that changes from case to case and is never written down. Messy input on its own is rarely the problem: an AI agent can read untidy emails and documents, but it cannot follow a rule that only exists in one person's head.

Most businesses have a few tasks everyone agrees are painful but nobody is sure can be handed to software. Here is a way to sort them: automate now, tidy first, or leave with a person.

## What does "messy" actually mean?

People use the word for very different problems, and they are not equally hard.

- **Messy input.** Orders arrive as PDFs, photos of handwritten notes, spreadsheets and plain emails. Supplier invoices all have different layouts. This used to rule automation out. Today an AI agent can usually read these, with a check for cases where it is unsure.
- **Messy rules.** The person doing the task makes decisions they cannot fully explain. "This customer always gets a discount, unless it is a rush order, unless it is Maria asking." Rules like this can be automated, but only once someone writes them down.
- **Messy outcomes.** There is no agreed definition of a correct result. Two people in the same office would handle the same case differently, and both would say they were right. This is the hard one.
- **Messy systems.** The data sits in an old desktop program with no export, a shared spreadsheet with five versions, or someone's inbox. This is a technical obstacle, often solvable, but it adds cost.

When someone says a task is "too messy", ask which of these four they mean.

## A simple test: can you explain it to a new hire?

Imagine a sensible new employee on their first week. Could you write one page that lets them do the task correctly most of the time, and tells them when to ask for help?

If yes, the task can very likely be automated. The page is, more or less, the specification.

If you could write the page but it would take a long afternoon and several conversations with colleagues, the task can be automated after tidying. The tidying often improves the process even before any software is involved.

If you genuinely cannot write the page, because every case is "it depends" and the person doing it relies on years of feel for customers or materials, keep it with a person for now. Software can still gather the information they need, but it should not make the decision.

## Signs a messy task is still a good candidate

- **The volume is high and the cases look alike underneath.** A hundred order emails a week in twenty formats are still a hundred orders with a customer, products, quantities and a delivery date.
- **Most cases are routine and a few are odd.** If eight out of ten cases follow the usual path, an automation can handle those and pass the rest to a person. You do not need to automate every case to save time.
- **Mistakes are easy to spot and cheap to fix.** If a wrong entry gets caught at the next step and corrected in a minute, you can accept some errors while the system is tuned.
- **The output goes into a structured place.** An accounting tool, a CRM or an order system has fixed fields. That gives the automation a clear target and you an easy way to check it.

This is the kind of work where an AI agent fits well. We described it in more detail in [how to automate order entry from customer emails](/blog/automate-order-entry-from-customer-emails).

## Signs it is too messy, at least for now

- **The process changes every month.** If the business is still working out how it wants to do something, automating it locks in a moving target. Wait until it settles.
- **Each case needs a conversation.** Negotiating with a supplier, calming an unhappy customer or agreeing a non-standard quote are relationship work. An agent can draft and prepare, but the decision belongs to a person.
- **Errors are expensive or hard to undo.** Payments, legal documents, safety decisions and anything sent straight to a customer without review deserve extra caution. These can still be automated in part, but with a human approval step, which reduces the time saved.
- **The volume is tiny.** A task that happens a few times a year is rarely worth building for. Keep a checklist instead.
- **Nobody owns the process.** If no one can say what correct looks like and no one has the authority to decide, the project will stall regardless of the technology.

## How to tidy a task before automating it

If your task lands in the middle group, a few steps usually get it ready:

1. **Collect real examples.** Gather twenty or thirty recent cases, including the awkward ones.
2. **Write down the decisions.** For each example, note what was done and why. Contradictions will appear that need a manager's decision.
3. **Agree a "send to a person" rule.** Decide in advance which cases the software should not handle: unusual amounts, unknown customers, missing information. This is what makes automation safe.
4. **Fix the input where you can.** Sometimes a simple change upstream, such as a standard order form or a fixed email address for invoices, removes half the mess before any automation exists.
5. **Start with the routine cases.** Automate the common path first, measure how it performs, then decide whether the remaining cases are worth extending to.

## What if you are still not sure?

Try a small test before committing to a full project. Take a batch of real, anonymised examples and see how well a tool or an agent handles them. You can get a feel for how an agent reads and sorts messy input on our [live demo](/demo). If it copes with most cases and the failures are obvious, the task is probably not as messy as it felt.

It is also worth being honest about the opposite result. Sometimes the best outcome of looking closely at a messy task is deciding to simplify the process, train someone properly or drop a step altogether, rather than build software for it. If you would like a second opinion on a specific task, you can book a short call at https://cal.com/swiftrix and we will tell you which group we think it falls into.
