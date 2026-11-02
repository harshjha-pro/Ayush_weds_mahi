# Go-Live Checklist

Tick in order. Nothing here changes production until you approve each item.

## A. Decisions (you)
- [ ] Approve design direction (Option A · Royal Marwari) — `01-design-audit.md`
- [ ] Approve website/app split (`/` website, `/app` studio & client app) — `03-prd.md`
- [ ] Approve database plan and creating a Supabase project — `04-database.md`
- [ ] Decide commission vs designer-hours cost — `05-go-to-market.md` §6
- [ ] Choose domain path: EU.org (free, slow) or paid `.in`/`.com`

## B. Build (development branch → preview only)
- [ ] Royal Marwari design tokens & fonts
- [ ] Website pages (home, designs, pricing, how it works, real weddings, about, FAQ, partners, contact, legal)
- [ ] Phone-frame invitation previews for each design (live demo invitations)
- [ ] App moved to `/app`, root forwards old `#/…` links (test every link type: client, project, enquiry with code)
- [ ] SEO: titles, descriptions, Open Graph images, sitemap, robots, schema.org
- [ ] Supabase schema, RLS, storage, auth; `db.js` swapped; import from backup
- [ ] Email notifications (preview ready, payment, delivery)
- [ ] Lighthouse ≥ 90 mobile; manual test on iPhone Safari + Android Chrome

## C. Business & legal (you, with help)
- [ ] Terms of service, privacy policy (DPDP Act 2023), refund & cancellation policy — lawyer review recommended
- [ ] GST registration if applicable; invoice format with GSTIN
- [ ] Business bank account + UPI ID updated in Settings
- [ ] Payment gateway account (Razorpay/Cashfree) — optional at launch
- [ ] Partner/affiliate agreement template (commission, payout timing, disclosure)
- [ ] Font & music licences confirmed for templates

## D. Accounts & hosting
- [ ] Vercel Pro plan (commercial use) — Hobby is non-commercial
- [ ] Supabase Pro (backups, no pause) — or free tier during soft launch
- [ ] Custom domain connected, HTTPS active, `.vercel.app` redirects to it
- [ ] Google Search Console + sitemap submitted
- [ ] Google Business Profile ("BFI Marwari Invitations", city, WhatsApp)
- [ ] Privacy-friendly analytics (Vercel Web Analytics or Plausible)
- [ ] WhatsApp Business profile with catalogue linking to design pages
- [ ] Studio email (e.g. hello@yourdomain)

## E. Data
- [ ] Remove demo data (demo clients, leads, partners) from production
- [ ] Real settings: prices, add-ons, capacity, SLA days, policy text, UPI
- [ ] Real team accounts with correct roles; freelancer access dates
- [ ] Real templates with preview links

## F. Launch day
- [ ] Production deploy (with your "go live")
- [ ] Smoke test: enquiry form → lead appears; client link opens; payment link; QR
- [ ] Announce to partners (WhatsApp broadcast from Comms)
- [ ] First Reel + Google Business post

## G. First week after launch
- [ ] Daily check of leads, overdue projects, error logs
- [ ] Collect first feedback; fix top 3 issues
- [ ] Weekly backup export stored safely
