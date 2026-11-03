# BFI · Marwari Wedding Invitations (PWA)

The installable web app for **BFI**, a Marwari wedding invitation agency.

It is completely separate from the engagement invitation at the repository root. Everything lives inside this `bfi/` folder. Nothing here loads files from outside it, and its service worker only covers `bfi/`.

## What's inside

- **Hero, services, ceremonies, process, packages, FAQ.** All the text comes from `js/config.js`.
- **Invite maker.** Visitors type names, a function, date and venue, then pick one of 10 templates. The card is drawn live, plays a reveal animation with falling marigold petals, and downloads as a sharp PNG, a print-ready PDF (5 × 6.25 in) or an animated video (MP4 or WebM, where the browser can record it).
- **Free templates.** All 10 designs (Kesariya, Rani, Leheriya, Shahi, Haldi, Mehendi, Neel, Gulabi, Mor, Chandni) with the visitor's own details, or blank with ruled lines to fill in by hand. Each downloads free as PNG or PDF. The patterns are traditional: bandhani, leheriya, jaali, mothda and mandana.
- **Animations.** Falling petals and a staggered entrance in the hero, the hero card's reveal, hover effects on templates and buttons. All motion is skipped for visitors who have reduced motion turned on.
- **Enquiry form.** Opens WhatsApp with the details already filled in. If there is no WhatsApp number it falls back to email, and if there is no email it copies the text.
- **PWA.** It can be installed (Android and desktop show an Install button, iPhone shows a tip), works offline, and has app shortcuts for "Invite maker" and "Enquire".

## Run locally

```bash
cd Ayush_weds_mahi
python3 -m http.server 8000
# open http://localhost:8000/bfi/
```

Once GitHub Pages is on, the app is at `https://<user>.github.io/<repo>/bfi/`.

## Fill in the business details

Open `js/config.js` and fill the lines marked `⟶ TO ADD`:

| Field | What it does |
|---|---|
| `brand.name`, `brand.city` | Full agency name and city |
| `contact.whatsapp` | Digits only with country code (e.g. `919876543210`). Turns on the WhatsApp button and WhatsApp enquiries. |
| `contact.phone`, `email`, `instagram`, `address` | Shown in the contact strip |
| `packages[].price` | e.g. `'From ₹4,999'`; `null` shows "Price on request" |
| `portfolio` | Real work photos, e.g. `{ src: 'images/riya-kunal.jpg', caption: 'Riya & Kunal · Mehendi' }`. The "Our work" section stays hidden until you add some. |

## After changing any file

Bump `VERSION` in `sw.js` (e.g. `bfi-v3`) so installed copies pick up the update. If you add new files, list them in `SHELL` too.

## Files

```
bfi/
  index.html            page
  manifest.webmanifest  install settings
  sw.js                 offline cache (scope: bfi/ only)
  css/bfi.css           styles
  js/config.js          all business content
  js/app.js             page logic
  js/card.js            invitation card drawing, templates and animation
  js/pdf.js             PDF export (no library)
  icons/                app icons (SVG sources and PNGs)
```
