# BFI — Marwari Invitations · studio app (PWA)

A separate installable web app for running the BFI invitation studio. It lives
entirely in this `bfi/` folder and shares nothing with the wedding invitation
site in the repository root.

## Who uses it

| Role | Pages |
|---|---|
| Admin | Dashboard (KPIs with change vs. the previous 30 days, revenue trend, recent projects, needs-attention list) · Leads & Sales (stage tabs, source/date filters, quote builder, convert, lost reasons) · Projects (list/board, SLA flags, assignment, exceptions, cancel & refund) · People (team, affiliates & vendors, time-boxed freelancers) · Finance (overview & order-wise margin, orders, commissions & payouts, invoices, refunds) · Content & Assets (template catalogue, asset library, testimonials) · Marketing · Compliance (consent, documents, audit log) · Metrics (Section 12, CSV export) · Communications (WhatsApp/email broadcasts, templates) · Settings |
| Marketing & outreach | Dashboard · Outreach CRM (All / Invited / In Discussion / Agreed / Rejected) · Campaign calendar · Lead Source & CAC (donut + cost per acquisition) · Testimonial requests (Pending / Received / Declined) · SEO tracker · Paid ads (gated until 10 organic orders) · Referral codes · Asset library |
| Designer / freelancer | My Projects · Asset Intake checklist · Design Workspace (preview, versions, revision log) · Workload & Deadlines · Brand Workspace (fonts, colours, templates, assets) · Handover checklist → QA. Freelancers only see the projects shared with them, until their access end date |
| QA reviewer | QA queue · QA review (pass / send back with defects) · Workload · Brand |
| Affiliate / vendor | Referral code & link · Leads & Projects · Commission tracker · Trade status · Submit a referral · Marketing kit · payout details in Settings |
| Client | Private link `#/c/<token>`, no login: Dashboard · My Project (overview, details form, uploads, preview & consolidated changes, payment by UPI, invitation + QR, review & consent) · Messages (design team, studio, QA) · Settings |
| Anyone | `#/enquire/<CODE>`: public enquiry form; the code attributes the lead automatically |

## Data

This first version stores everything **on the device** (localStorage, with
uploaded files in IndexedDB) and starts with sample data. Admin → Settings has
backup export/import and a reset. To let the team, partners and clients share
one live dataset across phones, connect a backend (e.g. Supabase) behind
`js/db.js`. Every read and write already goes through that file.

Sign-in is a demo picker with no passwords. Add real authentication before
inviting other people.

## Run locally

```bash
cd bfi
python3 -m http.server 8000
# open http://localhost:8000
```

No build step. Plain HTML, CSS and ES modules. `sw.js` caches the app for
offline use. When you change files, bump `VERSION` in `sw.js`.

Template covers are drawn in code (`templateArt` in `js/ui.js`), so no image files are needed.
