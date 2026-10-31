# BFI — Marwari Invitations · studio app (PWA)

A separate installable web app for running the BFI invitation studio. It lives
entirely in this `bfi/` folder and shares nothing with the wedding invitation
site in the repository root.

## Who uses it

| Role | Pages |
|---|---|
| Admin | Dashboard (KPIs with change vs. the previous 30 days, revenue trend, recent projects, needs-attention list) · Leads & Sales (stage tabs, source/date filters, quote builder, convert, lost reasons) · Projects (list/board, SLA flags, assignment, exceptions, cancel & refund) · People (team, affiliates & vendors, time-boxed freelancers) · Finance (overview & order-wise margin, orders, commissions & payouts, invoices, refunds) · Content & Assets (template catalogue, asset library, testimonials) · Marketing · Compliance (consent, documents, audit log) · Metrics (Section 12, CSV export) · Communications (WhatsApp/email broadcasts, templates) · Settings |
| Marketing | Dashboard · Campaign calendar · Lead Source & CAC (donut + cost per acquisition) · Testimonial requests (Pending / Received / Declined) · SEO tracker · Paid ads (gated until 10 organic orders) · Asset library |
| Outreach & client management | Dashboard (clients needing attention, follow-ups, commission) · Vendor CRM (All / Invited / In Discussion / Agreed / Rejected) · Direct outreach (leads they own; claim unassigned ones) · My clients (projects they manage) · Referral codes · My commission |
| Designer / freelancer | My Projects · Asset Intake checklist · Design Workspace (preview, versions, revision log) · Workload & Deadlines · Brand Workspace (fonts, colours, templates, assets) · Handover checklist → QA · My commission. Freelancers only see the projects shared with them, until their access end date |
| QA reviewer | QA queue · QA review (pass / send back with defects) · Workload · Brand |
| Affiliate / vendor | Referral code & link · Leads & Projects · Commission tracker · Trade status · Submit a referral · Marketing kit · payout details in Settings |
| Client | One private account per family, `#/c/<token>`, no login, any number of projects: **Home** (the full BFI website with their projects on top, where "Book" starts a new project request) · Dashboard (per project) · My Projects (overview, details form, uploads, preview & consolidated changes, UPI payment, invitation + QR, review & consent) · Messages (one conversation per project; type @ to tag the Design team, Studio admin or QA team) · Settings. Older per-project links still work |
| Anyone | `#/site`: the public website (services, packages & pricing, add-ons, design catalogue, how it works, reviews, partner programme, FAQ, contact) · `#/enquire/<CODE>`: enquiry form; the code attributes the lead automatically |

## Commission

Every person earns the full rate on an order; it is booked when the order is delivered and fully paid, then paid out from Finance → Commissions.

| Order came… | Client manager | Designer | Vendor / affiliate |
|---|---|---|---|
| Direct (no vendor) | 15% Basic & Premium, 20% Luxury | 15% Basic & Premium, 20% Luxury | — |
| Via a vendor / affiliate | 10% Basic & Premium, 15% Luxury | 10% Basic & Premium, 15% Luxury | 15% Basic & Premium, 20% Luxury |

The client manager is the lead's owner (set when an Outreach user adds or claims a lead) and can be changed in a project's Assignment. One-time trade vendors get a discount instead of cash. All rates are editable in Settings → Prices & policies, with per-partner overrides in People.

## Booking capacity

Admin → Settings → Prices & policies → Booking capacity sets how many new orders the studio accepts per window (e.g. 5 per 7 days). Clients see the slots left on the website, the booking page and the enquiry form. When it's full, new requests join a waitlist. The admin dashboard shows the same meter.

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
