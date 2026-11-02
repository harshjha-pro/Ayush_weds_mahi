# PRD — BFI Marwari Invitations: Website + Studio App (v2 "Go-live")

| | |
|---|---|
| **Owner** | BFI founder / admin |
| **Status** | Draft for approval |
| **Today** | A single installable PWA (`bfi/`) with demo data stored on each device; the public website lives inside it at `#/site`. Live at `bfi-marwari-invitations.vercel.app`. |
| **Goal** | Go live as a **real business website** (found on Google, shared on WhatsApp) with a **studio + client app** backed by a **shared database**, in the Royal Marwari brand. |

## 1. Problem
1. Visitors land on an internal sign-in screen; the website is hidden and not indexable.
2. All data lives in one browser — the team, partners and clients can't work on the same data, so the app can't be used with real clients.
3. Brand (navy software look) doesn't match the product (maroon/gold invitations) or the audience.
4. No legal pages, real payments or production hosting suitable for a commercial business.

## 2. Goals & success metrics (first 90 days after launch)
| Goal | Metric | Target |
|---|---|---|
| Be found | Organic visitors / month | 1,000 by day 90 |
| Convert | Visitor → enquiry | ≥ 3% |
| Close | Enquiry → paid order | ≥ 25% |
| Deliver well | On-time delivery | ≥ 90% |
| Delight | Reviews collected / delivered | ≥ 60%, avg ≥ 4.7★ |
| Partners | Active vendor/affiliate partners | ≥ 10 |

## 3. Users & roles (unchanged from the app)
Visitor · Client (family, many projects) · Admin · Marketing · Outreach & client management · Designer · QA · Freelancer · Affiliate/vendor partner. Full role matrix in `bfi/README.md`.

## 4. Scope

### 4.1 Public website (new, at `/`)
Real, pre-rendered pages with their own URLs, titles, descriptions and share images:

| URL | Content |
|---|---|
| `/` | Homepage per `01-design-audit.md` §6 |
| `/designs/` | Catalogue with tier filter |
| `/designs/<slug>/` | Design detail: phone preview, live demo link, tiers, "Choose this design" |
| `/pricing/` | Packages, add-ons, what's included, rush/policy |
| `/how-it-works/` | 8-step process, what we need from you, timelines |
| `/real-weddings/` | Consented case studies & reviews |
| `/about/` | Story, team, why Marwari only |
| `/faq/` | Full FAQ |
| `/partners/` | Vendor/affiliate programme + apply |
| `/contact/` (`/enquire/`) | Enquiry form (keeps referral code attribution), WhatsApp, email |
| `/legal/terms/`, `/legal/privacy/`, `/legal/refunds/` | Required before taking money |
| `/blog/<slug>/` (phase 2) | SEO guides: invitation wording, Marwari rituals, digital vs printed |

Requirements:
- **W1** Every page is static HTML (fast, indexable) with the shared header/footer and Royal Marwari design system.
- **W2** SEO: unique `<title>`/meta description, canonical, Open Graph + WhatsApp preview image, `sitemap.xml`, `robots.txt`, schema.org `LocalBusiness`, `Product`/`Offer` for packages, `FAQPage`.
- **W3** Live data on the site (capacity slots, approved reviews, active designs) is fetched from the database, with a static fallback if unavailable.
- **W4** Enquiry form writes a lead to the database (with `?ref=CODE` attribution) and confirms on WhatsApp/email.
- **W5** Lighthouse ≥ 90 (performance, accessibility, SEO) on mobile.
- **W6** Consent-first: no personal data shown without logged consent; analytics privacy-friendly, no ad trackers at launch.

### 4.2 Studio & client app (existing, moves to `/app`)
All existing features are preserved: leads & quotes, projects & stages, assignment, revisions, QA, payments & invoices, commissions & payouts, capacity, campaigns, outreach CRM, client portal with multiple projects, @tag chat, consent, audit log, metrics.

Changes:
- **A1** Move from `/` to `/app/`. **Every existing link keeps working**: the website's root page includes a tiny script that forwards any URL with a `#/…` hash (e.g. `/#/c/<token>/p/<id>`) to `/app/#/…` unchanged. Client tokens, project IDs and referral links are not altered.
- **A2** Replace on-device storage with the shared database (see `04-database.md`) behind the existing `js/db.js` interface, so views change minimally.
- **A3** Real sign-in for team & partners (email magic link / OTP). The demo role picker remains only on a separate demo environment.
- **A4** Client portal stays **link-based** (private, non-guessable token), with an optional "email me a login link" for families who lose it.
- **A5** Files (photos, voice notes, PDFs) move to cloud storage with private, signed URLs.
- **A6** Payments: keep UPI deep links + QR; add a payment-gateway link (Razorpay/Cashfree) per invoice so payments reconcile automatically (phase 2).
- **A7** Notifications: email for key events (preview ready, payment received, delivery); WhatsApp stays one-tap (official WhatsApp Business API later).
- **A8** Apply the Royal Marwari tokens to the app (navy → maroon), keeping layouts.

### 4.3 Out of scope (this release)
Self-service invitation builder (Phase 4 in the business plan), multi-language website, mobile store apps, AI design generation.

## 5. Architecture
```
Visitor ─▶ /            static website pages (Vercel, CDN)
           /designs/... ─┐
                         ├─▶ Supabase (Postgres + Auth + Storage + Edge Functions)
Team/Client ─▶ /app/ ────┘        ▲
                                  └─ RLS policies per role; token RPC for client portal
```
- Hosting: Vercel (needs **Pro** for commercial use — see `06-launch-checklist.md`).
- No build step required for the website (plain HTML/CSS/JS, like the app); a small Node script can generate design detail pages and the sitemap from the template list.
- Domain: custom domain (EU.org free option pending approval, or a paid `.in`/`.com`).

## 6. Non-functional requirements
- **Performance:** LCP < 2.5s on 4G, JS < 60 KB on website pages.
- **Security:** RLS on every table; tokens 22+ random chars; private storage; audit log for all writes; no secrets in client code (only Supabase anon key).
- **Privacy (DPDP Act 2023, India):** privacy notice, purpose-limited data, consent records (already in app), data-deletion on request, retention policy.
- **Reliability:** daily database backups; export to JSON/CSV from admin.
- **Accessibility:** WCAG 2.1 AA.
- **Compatibility:** last 2 versions of Chrome/Safari/Samsung Internet; iOS 15+, Android 9+.

## 7. Release plan
| Phase | What | Exit criteria |
|---|---|---|
| **0 · Design sign-off** | Approve direction, palette, homepage plan | Your approval |
| **1 · Website** (1–2 wks) | Static website at `/`, app moved to `/app` with link forwarding, Royal Marwari applied to site | Preview approved; all old links tested |
| **2 · Database** (2–3 wks) | Supabase schema, auth, storage, migrate app data layer, import from backup | Team can work on shared data; client links work |
| **3 · Go-live** (1 wk) | Legal pages, Vercel Pro, domain, analytics, Search Console, real data cleared of demo | Launch checklist complete |
| **4 · Growth** | Blog/SEO pages, payment gateway, email notifications, partner onboarding | Per `05-go-to-market.md` |

## 8. Risks & open questions
- **Vercel Hobby is non-commercial** → Pro ($20/month) needed before taking orders; or move to another host with a commercial free tier.
- **Supabase free tier** pauses inactive projects and has no automatic backups → acceptable for testing, Pro ($25/month) recommended at launch.
- **Commission load:** team + vendor commission is 30–35% of order value (see `05-go-to-market.md` §6) — confirm this is intended alongside designer hourly cost.
- **EU.org approval** may take weeks; launching on the `.vercel.app` address first is possible.
- Who writes legal pages (lawyer review recommended).
