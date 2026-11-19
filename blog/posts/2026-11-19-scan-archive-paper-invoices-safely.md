---
title: How to scan old paper invoices and know which to throw away
description: Scan invoices with a fixed routine, record each one's date and type, then let a simple rule check which paper copies are past their retention period.
tags: invoices, archiving, scanning, automation
---

The safe way to clear a paper invoice archive is to scan each document with a fixed routine, record its date and type as you go, and then let a simple rule tell you which paper copies are past the period you must keep them for. The scanning is the easy part; the part that saves you from mistakes is knowing, document by document, whether the original can go.

Many businesses have a room, a basement or a stack of boxes full of supplier invoices, receipts and delivery notes. Nobody wants to throw them away because nobody is sure which ones are still needed. So the boxes stay, the room fills up, and finding one invoice for an auditor takes an afternoon.

## Can you throw away a paper invoice once it is scanned?

Often yes, but not always, and the answer depends on your country and the type of document. Many tax authorities accept a clear, complete digital copy in place of the paper original, provided you can produce it when asked. Some documents, or some situations (for example a dispute or an ongoing audit), may require you to keep the original.

The retention period also varies. In the UK, HMRC generally expects business and VAT records to be kept for at least six years. Irish Revenue also generally works with six years. Other EU countries can set longer periods for accounting documents. Before you design anything, ask your accountant two questions in writing: how long do we need to keep each type of document, and are scanned copies acceptable in place of the paper ones? Their answer becomes the rule your process follows.

## What does a good scanning routine look like?

A scanner alone does not solve the problem. What matters is that every scanned document ends up with enough information attached to make a decision about it later. A practical routine looks like this:

1. **Work box by box.** Label each box and keep the label in the record, so you know where the paper physically is until it is destroyed.
2. **Scan to a fixed folder with a fixed naming pattern.** For example supplier, invoice date and invoice number. Consistent names make searching possible without any special software.
3. **Record the key fields.** Document type (purchase invoice, sales invoice, receipt, credit note), date, supplier or customer and amount. This can be typed by a person or read automatically from the scan.
4. **Check readability.** A faded thermal receipt that scans as a grey blur is not a usable copy. Flag those for keeping or for a better scan.
5. **Store the scans in two places.** A scan that exists only on one laptop is not an archive. Use your normal backed-up storage.

## Where does automation help?

The slow, error-prone part is step 3: reading each document and noting its date and type. With hundreds or thousands of pages, people get tired and mistakes creep in. This is where a small automation earns its place.

Software can read the scan, pick out the invoice date, number and supplier, and put them into a list. An AI model can handle invoices in different layouts better than older template-based tools, though it will still struggle with handwriting, stamps across the text and poor scans. A well-designed tool sends those unclear pages to a person instead of guessing.

Once the dates and types are known, the decision becomes a rule: if this type of document is older than the retention period, the paper can be destroyed; if not, keep it and note the date it can go. The tool can then tell staff, page by page or box by box, which originals are safe to throw away and which must stay.

We built exactly this kind of program for a client: an invoice archive cleanup tool linked to a scanner, which tells staff which paper invoices can be thrown away. The useful part of a tool like this is not the scanning, it is removing the uncertainty that keeps the boxes on the shelves.

## What can go wrong?

A few things are worth planning for:

- **The wrong date.** Some invoices show an order date, an invoice date and a due date. The rule must use the right one, so test it on a sample of real documents first.
- **The retention clock starts later than you think.** In many countries the period runs from the end of the financial year, not from the invoice date. Build that into the rule.
- **Documents linked to ongoing matters.** Invoices tied to a warranty, a dispute, a loan or a long-term asset may need to be kept longer. Give staff a simple way to mark a document as "keep" whatever the rule says.
- **Personal data.** Invoices from individuals, or receipts with names and addresses, contain personal data. Shred the paper properly and make sure the scans sit somewhere with access control. Our post on [GDPR checks before connecting tools](/blog/gdpr-checks-before-connecting-tools) covers the questions to ask.
- **Destroying before checking the scan.** Never shred a box until the scans from it have been checked and backed up.

## When is it not worth automating?

If you have a few boxes and someone has a quiet week, a person with a scanner and a spreadsheet can do it. A custom tool makes sense when the archive is large, when the same job will repeat every year as new boxes pass their retention date, or when several people need to work through it consistently.

It is also not worth automating if your accountant tells you the originals must be kept anyway. In that case, scanning still helps with searching, but the boxes stay and the decision logic adds nothing.

## Stopping the pile from growing again

Clearing the old archive is a one-off. The lasting fix is to stop new paper from piling up. If supplier invoices still arrive on paper, ask suppliers to email them instead. If they already arrive by email, they can be read and filed automatically from the start, which we described in [automating invoice handling without new software](/blog/automate-invoice-handling-without-new-software).

A sensible order is: get your retention rules in writing, scan and record a single box as a test, check the results, then decide whether the rest is a job for a person or for a tool. If you would like to talk through a large archive, you can book a short call at https://cal.com/swiftrix.
