# BFI — Marwari Invitations · studio app (PWA)

A separate installable web app for running the BFI invitation studio. It lives
entirely in this `bfi/` folder and shares nothing with the wedding invitation
site in the repository root.

## Who uses it

| Role | Opens | Sees |
|---|---|---|
| Admin | Sign in → Admin | Leads & quotes, projects (SLA flags, assignment, exceptions, cancellations), people, finance (margins, payments, commissions & payouts, invoices, refunds), content (templates, asset library, testimonials), growth, Section 12 metrics with CSV export, comms (WhatsApp/email broadcasts, templates), compliance (consent, documents, audit log), studio settings |
| Marketing & outreach | Sign in → Marketing | Vendor CRM with follow-ups, referral codes & links, consent-gated campaign calendar, testimonial requests, asset requests, sources & CAC, SEO tracker, ad A/B notes |
| Designer / QA / freelancer | Sign in | Only their assigned projects: brief, client references, preview push, revision checklist, internal notes, handover checklist, QA verdict, brand kit. Freelancer access expires on its end date |
| Affiliate / vendor | Sign in → Partner | Code + shareable link + pitch, referred leads (status only), intro form, marketing kit, commission ledger, payouts, payout details |
| Client | Private link `#/c/<token>` (no login) | Status in plain words + what's needed next, guided details form, uploads, preview + consolidated revision requests with a counter, UPI payment, final sign-off, live link + QR, review & consent toggles, referral code |
| Anyone | `#/enquire/<CODE>` | Public enquiry form; the code attributes the lead automatically |

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
