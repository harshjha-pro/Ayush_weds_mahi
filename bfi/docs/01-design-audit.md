# BFI — Marwari Invitations · Design Audit & Brand Direction

**Status:** proposal for approval. Nothing in the live app has been changed.
**Audited:** the public website (`#/site`), the client home (`#/c/<token>/home`), client dashboard, enquiry form and the welcome / sign-in screen, at 390 px (phone) and 1440 px (desktop), on 2 Nov 2026.

---

## 1. Understanding of the business

BFI designs **premium digital wedding invitations for Marwari families**: a mobile invitation website (with RSVP, maps, schedule, countdown) that the family shares on WhatsApp, plus a QR code for printed cards and standees.

What BFI really sells is not a web page. It is **confidence on the most public moment of a family's year**: every elder's name spelt right, Ganesh vandana in its place, the Mayra and Mahila sangeet given their due, and an invitation that the bride's mother is proud to forward to 400 relatives.

Business model (from the business plan):
- Three packages (Basic ₹4,999 · Premium ₹11,999 · Luxury/Bespoke ₹29,999) plus add-ons.
- Growth through wedding vendors and affiliates (planners, photographers, MUAs, venues) on commission, then referrals from happy families, SEO and Instagram.
- A studio of client managers, designers and QA, with a limited weekly capacity ("only N slots this week").

The website has two jobs:
1. **Win trust from a stranger in under a minute** (a family member who got the link from a planner or saw a Reel).
2. **Make the next step effortless**: see designs, understand price, start on WhatsApp or the enquiry form.

## 2. Target audience and expectations

| Who | Who they are | What they expect |
|---|---|---|
| **The couple** (25–32) | Urban, Instagram-native, often working in metros or abroad | Modern, elegant design they can show friends; mobile-first; fast; nothing "cheesy" |
| **The parents** (50–62) — usually the decision-maker and payer | Traditional, value family names, rituals and correct wording; WhatsApp-heavy | Cultural correctness, respect, Hindi/Marwari touches, a human to talk to, clear price |
| **NRI families** | Planning from Dubai, Singapore, US, UK | Everything online, reliable, guests anywhere can open it |
| **Wedding vendors / affiliates** | Planners, photographers, MUAs, venues | A brand they're proud to recommend; clear commission; easy referral |

Shared expectations: **trust** (real work, real reviews, clear policies), **warmth** (feels like a wedding, not software), **clarity** (price, timeline, what we need from you), **privacy** (family photos and names safe).

## 3. Existing website — analysis

### What works (preserve)
- **Content structure is complete**: services, packages with transparent prices, add-ons, design catalogue, 8-step process, why-BFI, delivery formats, reviews (consent-gated), partner programme, FAQ, contact.
- **Strong product logic** behind the scenes: capacity indicator, design → "Choose this design" → pre-filled booking, client accounts with multiple projects, private links, @tag messaging, waitlist.
- **Clear pricing cards** with "Most popular" Premium and feature ticks.
- **Template covers** already use maroon/gold Rajasthani motifs (jharokha arch, mandap, mandala, kalash, palace).
- **Accessible basics**: good touch-target sizes, readable 14.5 px body, responsive grids, no horizontal scroll.

### What should improve

| Area | Finding | Impact |
|---|---|---|
| **Entry point** | The root URL opens an internal **sign-in / role picker** (admin, designers, demo clients). The real website is hidden at `#/site`. | A visitor's first impression is a software login. Biggest single problem. |
| **Website vs app** | Everything is one PWA with hash URLs (`#/site`). Website pages have no real URLs, page titles or share previews. | Not indexable by Google (SEO is a core channel in the plan); WhatsApp shares show no rich preview. |
| **Colour** | Navy `#14213D` + cool grey `#F6F7F9` is a fintech/SaaS palette. Maroon/gold only appears inside the template art. | Feels like a dashboard, not a wedding brand. Brand and product don't match. |
| **Typography** | Inter for almost everything; Playfair Display only on the hero H1 and wordmark. No Devanagari anywhere. | Lacks the ceremonial, printed-card feel; misses an easy cultural signal. |
| **Hero** | Dark navy box with gradient; stats "**1+ families served**". | Navy reads corporate; "1+" actively undermines trust. |
| **Invitation previews** | Designs are flat square SVG covers; the same frame and corner ornaments repeat. No phone-frame previews of an actual invitation. | Customers buy what they can *see*; currently they can't see the product. |
| **Buttons / CTAs** | Mixed labels: "Book a consultation", "Enquire", "Start a new invitation", "Explore designs", "Choose Premium". Gold, navy and outline buttons on the same screen. | Unclear primary action; looks inconsistent. |
| **Section nav** | Sticky chip row (Services · Packages · …) under the hero. | Looks like app filters; competes with the header. |
| **Client home (mobile)** | Welcome card + full marketing hero + app tab bar; the hero pushes their own project below the fold. | Returning clients care about *their* invitation first. |
| **Cards** | Every section is a white card with a grey shadow on grey. | Visual monotony; no rhythm between sections. |
| **Decorative motifs** | Crest icon appears small; motifs absent between sections. | Missed opportunity for subtle Rajasthani identity. |
| **Trust** | No real photos, no "real weddings" gallery, no team/about, no legal pages linked. | Trust is the product for a ₹12–30k emotional purchase. |
| **Mobile** | Hero is ~1.5 screens tall before any design is visible; bottom tab bar appears on marketing pages. | Slow to the "wow"; app chrome on a website. |

### Scorecard (current)
| Criterion | Score /5 | Note |
|---|---|---|
| Homepage design | 2.5 | Complete but generic SaaS styling |
| Navigation & journey | 2 | Website hidden behind sign-in; hash URLs |
| Typography | 2.5 | Clean, not ceremonial |
| Colour palette | 2 | Off-brand (navy) |
| Invitation designs | 3 | Good motifs, not real previews |
| Buttons & CTAs | 2.5 | Inconsistent labels/styles |
| Mobile responsiveness | 4 | Works well technically |
| Visual consistency | 3 | Consistent system, wrong mood |
| Ease of use | 3.5 | Strong flows once inside |

## 4. Recommended colour palette — **Option A · Royal Marwari** (refined)

### Core palette (use these 5)
| Token | HEX | Role |
|---|---|---|
| `maroon` | **#641E2B** | Primary brand: headings accent, primary buttons, header band, footer |
| `gold` | **#C6A15B** | Ornament & accent: borders, motifs, dividers, icons, highlights on maroon |
| `ivory` | **#FFF8EC** | Page background (warm paper) |
| `beige` | **#E9DCC8** | Section alternation, card borders, subtle fills |
| `brown` | **#392820** | Body text and dark UI (warmer than black) |

### Supporting tokens (derived, for accessibility & states)
| Token | HEX | Why |
|---|---|---|
| `maroon-700` | #4E1520 | Hover/pressed for maroon buttons |
| `gold-ink` | **#7E5F24** | Small gold-coloured *text* on ivory (5.6:1) — raw gold on ivory is only 2.3:1 |
| `muted` | #6E5A4E | Secondary text on ivory (6.2:1) |
| `paper` | #FFFDF8 | Card surface on ivory |
| `success` | #2F6B4F | Status only (muted emerald, never decorative) |
| `danger` | #A4372E | Errors/overdue only |

### Measured contrast (WCAG)
| Pair | Ratio | Use |
|---|---|---|
| Maroon on ivory | 11.3 : 1 | ✅ any text |
| Brown on ivory | 13.3 : 1 | ✅ body text |
| Ivory on maroon | 11.3 : 1 | ✅ button labels, footer |
| Gold on maroon | 4.9 : 1 | ✅ text on maroon bands |
| Gold-ink on ivory | 5.6 : 1 | ✅ small gold labels |
| Gold on ivory | 2.3 : 1 | ⚠️ ornaments & large display only — never body text |

### Why not B or C
- **B · Modern Luxury** (burgundy, champagne, rose): beautiful but **generic** — reads as a Western bridal boutique or skincare brand. Champagne on pearl is 1.7:1, so the gold accent can never carry text. Loses the Rajasthani identity that is BFI's whole positioning.
- **C · Traditional Celebration** (vermilion, saffron, emerald): authentic and festive, but **three strong hues** make it hard to look premium and calm; saffron on cream is 2.2:1. Better suited to a Mehendi or Haldi theme than to the brand frame.
- **A · Royal Marwari** is the colour of the occasion itself: **maroon of the bridal poshak and chunari, gold of zari and haveli frescoes, ivory of hand-made card paper**, brown of carved wood. It is instantly Marwari, it is calm enough to be premium, and it has excellent contrast. It also matches the invitation templates BFI already makes, so the brand and the product finally look like one family.

**Rules:** maroon + ivory dominate (~80% of any screen), gold is the jewellery (≤10%), beige separates sections, brown is for reading. No gradients except a very soft ivory→beige paper wash; no navy anywhere in the public website.

## 5. Typography

| Role | Typeface | Why |
|---|---|---|
| **Display & headings** | **Cormorant Garamond** 600/700 (italic for accents) | High-contrast classical serif that looks like letterpress invitation cards; elegant at large sizes; free (Google Fonts) |
| **Body & UI** | **Inter** 400/500/600 | Already in the app; superb legibility on phones; keeps the studio app consistent |
| **Devanagari accents** | **Tiro Devanagari Hindi** | For short ceremonial lines — "शुभ विवाह", "श्री गणेशाय नमः" — authentic, not decorative noise |

Type scale (mobile → desktop): H1 36→60 px · H2 28→40 · H3 20→24 · body 16 · small 14 · eyebrow 12 with 0.18em tracking, uppercase, `gold-ink`.
Rules: serif only for headings and names; never set paragraphs in the serif; no script fonts in the brand frame (they belong inside invitations); Devanagari max one line per section.

## 6. Homepage improvement plan

New order, each section with one job:

1. **Header** — crest + "BFI · Marwari Invitations" wordmark; links: Designs · Pricing · How it works · Real weddings · FAQ; secondary link "Track my invitation"; primary button **"Plan my invitation"**. Transparent on ivory, becomes solid on scroll. Phone: menu button + the primary CTA.
2. **Hero** — ivory paper background, a single **jharokha-arch frame** around a **phone showing a real invitation** (scrollable mini-preview). Small Devanagari line "॥ श्री गणेशाय नमः ॥" above the H1 *"Wedding invitations, the Marwari way"*. Sub: rituals, family names, delivered as an invitation website. Buttons: **Explore designs** (maroon) · **Chat on WhatsApp** (outline). Under it, one quiet capacity line ("3 of 5 slots open this week").
3. **Three promises strip** (instead of "1+ families"): *Made for Marwari rituals* · *Every name checked by hand* · *Private, consent-first*. Replace with real numbers only when they are impressive.
4. **Designs** — horizontal carousel of **phone-frame previews** with the design name, tier and "Preview" → design detail page with a live demo and "Choose this design".
5. **Rituals we design for** — Ganesh puja · Mayra / Bhaat · Haldi · Mehendi · Mahila sangeet · Baraat · Phera · Reception, as a simple illustrated row. This is the strongest proof of specialism.
6. **How it works** — 4 steps (Choose → Share details → Review preview → Share with family) with a link to the full 8-step process.
7. **Pricing** — the three cards (Premium highlighted in maroon), add-ons collapsed under "Add-ons".
8. **Real weddings & reviews** — consented testimonials with couple names, city and a cover; until enough exist, show 2 reviews + "Your story could be next".
9. **For wedding professionals** — maroon band: commission, "Become a partner".
10. **FAQ** — top 6, link to full FAQ page.
11. **Closing CTA** — "Let's write your invitation together" + WhatsApp + enquiry.
12. **Footer** — maroon, gold rule; contact, city, legal links (Terms, Privacy, Refund policy), partner login, team login.

**CTA system (one vocabulary everywhere):** primary = **Plan my invitation** (enquiry/booking); secondary = **Explore designs**; tertiary = **Chat on WhatsApp**. Inside a design: **Choose this design**. Logged-in clients: **Start a new invitation**.

**Decorative system:** one motif family — jharokha arch, lotus divider, thin double gold rule, 4-dot corner. Max one ornament per section; ornaments in `gold`, never filled blocks.

## 7. Mobile experience recommendations

- **Website ≠ app chrome:** no bottom tab bar on public pages; use a slim header + a **sticky bottom CTA bar** ("Explore designs · WhatsApp") that appears after the hero.
- **First screen shows the product:** phone preview inside the hero is visible on a 390 px screen without scrolling (H1 ≤ 3 lines at 36 px).
- **Thumb zone:** primary actions in the lower half; 48 px buttons; 16 px body (prevents iOS zoom on inputs).
- **Carousels with scroll-snap** for designs and reviews; show a partial next card as a swipe hint.
- **Fast on 4G:** system-font fallback, fonts with `display=swap`, SVG ornaments, lazy-loaded previews, < 200 KB above the fold.
- **WhatsApp-native:** every page has Open Graph image/title so shared links show a rich card; one-tap "Share this design".
- **Client portal on phones:** returning clients land on *their project* (progress + "what we need from you") with the website one tap away, not under it.
- **Accessibility:** AA contrast (tokens above), visible focus rings in gold, reduced-motion respected, Hindi lines marked `lang="hi"`.

## 8. Why Royal Marwari suits BFI

Marwari weddings are, visually, **maroon, gold and ivory**: the bride's poshak and odhni, the gold zari and kundan, the haveli frescoes and jharokhas of Shekhawati, the cream card stock of a traditional *kankotri*. Using exactly these colours — calmly, with lots of ivory space — tells a Marwari family in one glance *"these people understand our wedding"*, which is BFI's entire positioning ("not a template studio that resizes a generic design").

It also solves the brand-product split: today the invitations are maroon and gold but the website is navy software. With Option A, the website frames the invitations like a jharokha frames a courtyard — the product becomes the hero.

Finally, it is **timeless rather than trendy**: parents read it as respectful and traditional, couples read it as editorial and premium (serif + whitespace), and it holds up for years without a redesign.

---

### Decision needed
1. Approve **Option A · Royal Marwari** (or pick B/C).
2. Approve the **website/app split** described in `03-prd.md` (website at `/`, studio & client app at `/app`, all old links kept working).
3. Approve starting implementation on the development branch with a **preview** deployment (production untouched until you say "go live").
