# BFI · Marwari Wedding Invitations (PWA)

The installable web app for **BFI**, a Marwari wedding invitation agency.

It is completely separate from the engagement invitation at the repository root. Everything lives inside this `bfi/` folder. Nothing here loads files from outside it, and its service worker only covers `bfi/`.

## What's inside

- **Hero, services, ceremonies, process, packages, FAQ.** All the text comes from `js/config.js`.
- **Invite maker.** Visitors type names, a function, date and venue, then pick one of four themes (Kesariya, Rani, Leheriya, Shahi). A sample card is drawn live and can be downloaded as a PNG or shared.
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
| `portfolio` | Real work photos, e.g. `{ src: 'images/riya-kunal.jpg', caption: 'Riya & Kunal · Mehendi' }`. While it is empty, the gallery shows sample cards from the invite maker. |

## After changing any file

Bump `VERSION` in `sw.js` (e.g. `bfi-v2`) so installed copies pick up the update. If you add new files, list them in `SHELL` too.

## Files

```
bfi/
  index.html            page
  manifest.webmanifest  install settings
  sw.js                 offline cache (scope: bfi/ only)
  css/bfi.css           styles
  js/config.js          all business content
  js/app.js             page logic
  js/card.js            invitation card drawing and themes
  icons/                app icons (SVG sources and PNGs)
```
