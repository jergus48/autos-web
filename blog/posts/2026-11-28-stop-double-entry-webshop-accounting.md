---
title: How to stop double entry between your webshop and accounting
description: Stop re-typing webshop orders into your accounting software. The ways to connect the two, what to decide first, and when manual entry is still the right call.
tags: automation, integrations, webshop, accounting, invoices
---

To stop double entry between your webshop and your accounting software, you connect the two so that each paid order, refund and payout is sent across automatically, with agreed rules for customers, tax rates and payment fees. Depending on your tools, that can be a ready-made connector, an integration platform or a small custom link, and the right choice depends more on your edge cases than on your order volume.

The goal: an order is typed once, by the customer, and never again by your staff.

## What does double entry look like in practice?

In many small shops the routine is the same. Someone opens the webshop admin, goes through yesterday's orders and creates matching sales invoices in the accounting software. Later, someone else matches the payouts from the payment provider against those invoices in the bank feed. Refunds and returns are handled whenever someone remembers.

It works, but it costs you:

- the same customer name, address, items and prices are typed twice
- typing mistakes mean the books and the shop disagree, and finding why takes time
- VAT can be applied wrongly, especially for customers in other countries
- payouts from the payment provider rarely match a single order, so reconciliation becomes guesswork
- when the person who does it is ill or on holiday, it piles up

## What are the ways to connect a webshop to accounting?

There are three common routes, roughly in order of effort.

**A ready-made connector.** Most popular webshop platforms and accounting packages offer apps or plug-ins that link them. If both of your tools are mainstream and your setup is ordinary, this is usually the first thing to try. Check what it actually sends: some only push a daily summary, others create one invoice per order, and few handle refunds and fees well out of the box.

**An integration platform.** Tools such as Zapier or Make let you build a flow like "when an order is paid, create an invoice in accounting". They give you more control than a fixed connector, but someone has to set them up carefully and look after them when a field changes.

**A custom integration.** When you have unusual rules, several shops, a local accounting system without a good connector, or a warehouse or ERP in the middle, a small custom link written for your setup is often more reliable. It costs more at the start, but it does exactly what your accountant needs. We go through connectors and their limits step by step in [how to connect your CRM, email and accounting tool without a developer](/blog/connect-crm-email-accounting-without-developer).

## What should you decide before connecting anything?

Most failed links fail on decisions, not technology. Agree these with your accountant first:

1. **One invoice per order, or a daily summary?** Per order gives detail and makes customer questions easy to answer. A daily summary keeps the books lighter. Both are valid, but you need to pick one.
2. **Which customers get their own record?** Business customers who need a proper invoice with their VAT number usually do. Private customers are often booked to a general "webshop customer" account.
3. **How VAT is handled.** Domestic sales, sales to other EU countries and sales outside the EU can need different tax codes. The link has to map each case to the right code in your accounting software.
4. **Where payment fees go.** Card and payment provider fees are taken before the money reaches your bank. Decide which expense account they belong to, so payouts can be matched.
5. **What happens with refunds, partial refunds and returns.** These are the cases most connectors get wrong. Decide whether a refund creates a credit note and how it links to the original invoice.
6. **Which system is the source of truth for products and prices.** If both systems hold product codes, decide which one wins when they differ.

With these answers written down, almost any route can work. Without them, even an expensive integration produces books your accountant has to fix.

## What about payouts and bank reconciliation?

This is where shops lose the most time, and it is often ignored. A payment provider might send one payout covering dozens of orders, minus fees and minus refunds. Your bank shows one amount, your shop shows many.

A good integration records each payout as a set of matched orders, fees and refunds, so the bank line can be reconciled in one step. If your current connector only creates invoices and leaves the payouts for a person to untangle, you have removed half of the double entry, not all of it.

## What can go wrong?

- **Duplicates.** If an order is edited or a sync runs twice, the same invoice can be created twice. A proper link checks whether an order has already been sent.
- **Silent failures.** A connector stops working after an update or a changed password, and nobody notices for weeks. Make sure someone gets a message when a sync fails.
- **Odd orders.** Gift cards, discount codes, shipping charged separately, bundles. Test each of these before going live, not after.
- **Personal data.** Customer names and addresses now live in two systems. Check that access to both is limited to the people who need it.

## When is manual entry still the better choice?

If you take a handful of orders a week and they are all similar, typing them in may take less time than setting up and watching an integration. The same goes if your shop is about to move platform, because you would build the link twice.

It is also not worth automating if your accountant books everything from a monthly export and is happy with it. In that case, a clean, consistent export may be all you need.

The case gets strong when orders arrive daily, several people touch the books, you sell to other countries, or reconciliation regularly takes longer than it should.

## How do you start?

Take one recent month. Count the orders, refunds and payouts, and note every case that needed a manual fix. Show the list to your accountant and agree the decisions above. Then try the simplest route that handles your real cases, and run it next to the manual process for a few weeks before you switch the manual process off.

If your setup needs a custom link, for example several shops or an accounting system without a connector, you can [book a call](https://cal.com/swiftrix) to talk it through.
