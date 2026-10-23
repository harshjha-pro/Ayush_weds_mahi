# Mahi & Ayush · Engagement Invitation

A single-page digital invitation for the engagement of **Mahi Jagetiya & Ayush Porwal**, Sunday 15 November 2026, Chittorgarh.

It is a plain static website (HTML, CSS and JavaScript modules). It has no build step, no backend and no tracking.

## Run it on your computer

Browsers block JavaScript modules on `file://` pages, so serve the folder:

```bash
cd Ayush_weds_mahi
python3 -m http.server 8000
# then open http://localhost:8000
```

(`npx serve .` works too.)

## Change the content

**All text, dates, places and media live in one file: [`js/config.js`](js/config.js).** Anything set to `null` or `[]` is hidden on the page. Guests never see "TBD" or empty boxes. Lines marked `⟶ TO ADD` are still waiting for details.

| To change… | Edit in `js/config.js` |
|---|---|
| Names or monogram | `couple` |
| Welcome line, host/family names | `invitation.welcomeLine`, `invitation.hosts` |
| Date and times | `event.arrival`, `event.functions` (keep the `+05:30`) |
| Calendar end time | `event.calendarEnd` |
| Dress code or notes | `event.dressCode`, `event.notes` |
| Venue, address, map link | `venue` |
| Parking, entrance or hotel info | `venue.parking`, `venue.entrance`, `venue.accommodation` |
| Story text | `story.paragraphs` (and `story.moreParagraphs` for "Read more") |
| Quote | `story.quote` |
| Secret message | `surprise.message` |
| Public link used for sharing | `share.siteUrl` |
| Background music | `music` |

The `<noscript>` block and the link-preview `<meta>` tags in `index.html` repeat the names, date and venue. If any of those change, update them there too.

### Add photos

1. Resize photos to about 1600 px on the long side and save as JPG (around 200–400 KB each).
2. Put them in `assets/photos/`.
3. List them in `story.photos`, in the order you want:
   ```js
   photos: [
     { src: "assets/photos/01.jpg", alt: "Mahi and Ayush at the lake", width: 1600, height: 1200 },
     { src: "assets/photos/02.jpg", alt: "…", width: 1200, height: 1600 },
   ],
   ```
   The first photo is shown larger. `alt` describes the photo for screen readers.

### The surprise photo and message

Set `surprise.photo` to `{ src: "assets/photos/surprise.jpg", alt: "…" }` and replace `surprise.message`. Until a photo is set, the envelope reveals the monogram.

### Music

Put an MP3 you have the right to use in `assets/audio/` and set `music: { src: "assets/audio/song.mp3", title: "Song name" }`. A play/pause button then appears in the bottom-left corner. It never plays by itself.

## Live site

**https://mahi-ayush.vercel.app/**, hosted on Vercel (project `mahi-ayush`). Every push to the `claude/luxury-engagement-invitation-w2e6ig` branch redeploys it automatically within a minute.

## Publishing elsewhere

Any static host works. Two free options:

- **GitHub Pages:** on GitHub open the repository, go to **Settings → Pages**, choose "Deploy from a branch", pick the branch and the `/ (root)` folder, then save. The link appears at the top of that page after a minute or two.
- **Netlify or Vercel:** import the repository, leave the build command empty and set the output directory to the project root.

If you move it to another host:

1. Set `share.siteUrl` in `js/config.js` to the new public link, so WhatsApp shares and calendar entries carry it.
2. In `index.html`, update the `og:url` and `og:image` addresses so WhatsApp shows the preview card (`assets/images/share-card.jpg`).

## Project layout

```
index.html              Page shell, SVG ornaments and icons
css/styles.css          Design tokens and all styles
js/config.js            ← all invitation content
js/main.js              Renders the sections in order
js/utils.js             Shared helpers (date formatting, copy, toast)
js/components/          One file per part of the page:
  navigation.js         Top bar, mobile menu, venue shortcut
  welcome.js            Welcome section + opening envelope
  story.js              Our Story, photo gallery, lightbox
  details.js            The Celebration (event details)
  calendar.js           Google Calendar link + .ics download
  countdown.js          Live countdown
  venue.js              Venue card, directions, copy address
  surprise.js           Sealed-envelope surprise
  closing.js            Closing section + sharing
  music.js              Optional music button
assets/images/          Monogram (original + transparent web versions)
assets/photos/          Your photos go here
assets/audio/           Optional music file goes here
```
