/*
 * ────────────────────────────────────────────────────────────────
 *  INVITATION CONTENT — edit this file to change what guests see.
 * ────────────────────────────────────────────────────────────────
 *
 *  Rules of thumb:
 *  • Any value set to `null` (or an empty list `[]`) is simply hidden
 *    on the website. Nothing like "TBD" or "null" is ever shown.
 *  • Times are written with the India offset (+05:30) so the countdown
 *    and calendar are correct for guests in any time zone.
 *  • After editing, refresh the page. No build step is needed.
 *
 */

export const config = {
  couple: {
    // Order follows the approved monogram ("Mahi & Ayush", M&A).
    // Only their first names are used on the site (no surnames).
    partnerOne: { first: "Mahi", full: "Mahi" },
    partnerTwo: { first: "Ayush", full: "Ayush" },
    monogramLetters: "M&A",
    monogramImage: "assets/images/monogram-480.webp",
    monogramImageFallback: "assets/images/monogram-480.png",
    monogramSmall: "assets/images/monogram-160.webp",
    // The animated monogram used for the large monograms (welcome and
    // closing). Set to null to use the still image everywhere.
    monogramVideo: "assets/video/monogram.mp4",
    // The illustrated film in the welcome section (muted, loops while in
    // view). Set to null to hide it.
    heroVideo: {
      src: "assets/video/hero.mp4",
      poster: "assets/images/hero-poster.webp",
      posterFallback: "assets/images/hero-poster.jpg",
      alt: "Illustrated animation: Mahi, in an ivory sari, rests her hand with mehndi and her engagement ring on Ayush's shoulder",
    },
  },

  invitation: {
    eyebrow: "A Beautiful Beginning",
    welcomeLine: "We invite you to celebrate our engagement",
    // Shown on the welcome section and in the event details.
    familiesLine: "Together with their families",
    families: [
      { side: "Bride's Family", names: ["Mr. Mahesh Jagetiya", "Mrs. Meenakshi Jagetiya"] },
      { side: "Groom's Family", names: ["Mr. Arvind Kumar Porwal", "Mrs. Kala Maheshwari"] },
    ],
  },

  event: {
    title: "The Engagement",
    timeZone: "Asia/Kolkata",
    timeZoneLabel: "IST",
    // A separate arrival time (null: not shown; the card gives none).
    arrival: null,
    // The countdown counts down to the first function below.
    functions: [
      // As printed on the invitation card: सगाई दस्तूर 10:15 am,
      // स्वरुचि भोज 1:30 pm, 15-11-2026.
      { name: "Ring Ceremony", start: "2026-11-15T10:15:00+05:30" },
      { name: "Lunch", start: "2026-11-15T13:30:00+05:30" },
    ],
    // Only used for the calendar entry, never shown on the page.
    // Confirmed as 3:00 PM.
    calendarEnd: "2026-11-15T15:00:00+05:30",
    dressCode: null, // e.g. "Indian festive"
    notes: null, // e.g. "Parking is available at the venue."
  },

  venue: {
    name: "Deepak Food and Events",
    addressLines: ["VJWH+HGX, Keer Khera", "Chittorgarh, Rajasthan 312001"],
    city: "Chittorgarh",
    mapsUrl: "https://share.google/7hF6ujWya8rbWrLhs",
    // Map pin for the embedded map. Decoded from the plus code in the address
    // (VJWH+HGX near Chittorgarh = 7JPPVJWH+HGX, accurate to about 3 m).
    // Set to null to hide the embedded map; directions use mapsUrl either way.
    coordinates: { lat: 24.896488, lng: 74.628859 },
    parking: null,
    entrance: null,
    accommodation: null,
  },

  story: {
    // A general draft that invents no specific memories. Replace it with
    // your own words whenever you like (2–4 short paragraphs work best).
    paragraphs: [
      "Every love story is special, and this one is ours.",
      "What began as two people finding joy in each other's company has grown into a promise to walk through life side by side, with the love and blessings of our families.",
      "As we take this first step together, we would be honoured to have you with us for our beautiful beginning.",
    ],
    // Optional longer part, shown behind a "Read more" toggle.
    moreParagraphs: [],
    // Photos live in assets/photos/ (a 1600px version for the full-screen
    // viewer and an 800px "thumb" for the grid). The grid appears in the
    // Memories section only when it has no films. The first one is shown larger.
    //   { src, thumb, alt, width, height, focus }
    // width/height are the real pixel size; they keep the layout steady while loading.
    // focus (optional) moves the crop, e.g. "50% 20%" to keep heads in frame.
    photos: [
      { src: "assets/photos/01.jpg", thumb: "assets/photos/01-800.jpg", alt: "Mahi and Ayush smiling together at a café", width: 1280, height: 960 },
      { src: "assets/photos/02.jpg", thumb: "assets/photos/02-800.jpg", alt: "Mahi and Ayush in a selfie at night", width: 1200, height: 1600 },
      { src: "assets/photos/03.jpg", thumb: "assets/photos/03-800.jpg", alt: "Mahi and Ayush on an evening out", width: 1200, height: 1600 },
      { src: "assets/photos/04.jpg", thumb: "assets/photos/04-800.jpg", alt: "Mahi and Ayush smiling together at a café", width: 1200, height: 1600 },
      { src: "assets/photos/05.jpg", thumb: "assets/photos/05-800.jpg", alt: "Mahi striking a playful pose beside Ayush", width: 1200, height: 1600 },
      { src: "assets/photos/06.jpg", thumb: "assets/photos/06-800.jpg", alt: "Mahi and Ayush with their loved ones, holding a bouquet", width: 1200, height: 1600 },
      { src: "assets/photos/07.jpg", thumb: "assets/photos/07-800.jpg", alt: "Mahi smiling with a coffee cup", width: 1200, height: 1600 },
      { src: "assets/photos/08.jpg", thumb: "assets/photos/08-800.jpg", alt: "Mahi and Ayush sitting together", width: 1599, height: 899 },
      { src: "assets/photos/09.jpg", thumb: "assets/photos/09-800.jpg", alt: "Mahi and Ayush at a table outdoors in the evening", width: 900, height: 1600 },
      { src: "assets/photos/10.jpg", thumb: "assets/photos/10-800.jpg", alt: "Mahi and Ayush with their loved ones", width: 1600, height: 1200 },
      { src: "assets/photos/11.jpg", thumb: "assets/photos/11-800.jpg", alt: "Mahi and Ayush with their loved ones at home", width: 1600, height: 1200 },
      { src: "assets/photos/12.jpg", thumb: "assets/photos/12-800.jpg", alt: "Mahi and Ayush with their loved ones, holding roses", width: 1600, height: 1200 },
      { src: "assets/photos/13.jpg", thumb: "assets/photos/13-800.jpg", alt: "Mahi and Ayush in a selfie outdoors", width: 1600, height: 1200 },
    ],
    // "Sakhā saptapadī bhava": the line from the Vedic wedding vows that asks
    // the couple to become friends for life once the seven steps are taken.
    quote: { text: "Having walked seven steps together, be my friend.", attribution: "Sakhā saptapadī bhava · The Saptapadi" },
  },

  // The Memories section: a carousel of short films that glides to the next
  // one every few seconds (guests can also swipe, drag or use the arrows).
  // Clips 02–04 and 06–08 are cut from the couple's photo slideshow
  // (assets/video/story.mp4), 01 and 05 from the illustrated ring film.
  // Clips 09–12 are the couple's own landscape videos (shown first, in wide
  // cards: set landscape: true for 16:9 clips). The rest are portrait (9:16).
  // H.264 clips with a poster each, no sound; add or remove freely.
  memories: {
    eyebrow: "Moments together",
    // Seconds each film stays in the centre before the next one comes in.
    interval: 5,
    videos: [
      // The couple's own short clips (landscape, sound removed).
      { src: "assets/video/memories/09.mp4", poster: "assets/images/memories/09.webp", posterFallback: "assets/images/memories/09.jpg", landscape: true, alt: "Mahi and Ayush smiling together at a café" },
      { src: "assets/video/memories/10.mp4", poster: "assets/images/memories/10.webp", posterFallback: "assets/images/memories/10.jpg", landscape: true, alt: "Mahi and Ayush sitting side by side and laughing, with playful drawings around them" },
      { src: "assets/video/memories/11.mp4", poster: "assets/images/memories/11.webp", posterFallback: "assets/images/memories/11.jpg", landscape: true, alt: "Mahi and Ayush in a selfie at sunset beneath the palms" },
      { src: "assets/video/memories/12.mp4", poster: "assets/images/memories/12.webp", posterFallback: "assets/images/memories/12.jpg", landscape: true, alt: "Mahi and Ayush at a table under string lights, with a drawn crown and moustache" },
      { src: "assets/video/memories/01.mp4", poster: "assets/images/memories/01.webp", posterFallback: "assets/images/memories/01.jpg", alt: "Illustrated film: Ayush and Mahi, in an ivory sari, in a softly lit palace hall" },
      { src: "assets/video/memories/02.mp4", poster: "assets/images/memories/02.webp", posterFallback: "assets/images/memories/02.jpg", alt: "Photos of Mahi and Ayush together" },
      { src: "assets/video/memories/03.mp4", poster: "assets/images/memories/03.webp", posterFallback: "assets/images/memories/03.jpg", alt: "Photos of Mahi and Ayush together" },
      { src: "assets/video/memories/04.mp4", poster: "assets/images/memories/04.webp", posterFallback: "assets/images/memories/04.jpg", alt: "Photos of Mahi and Ayush together" },
      { src: "assets/video/memories/05.mp4", poster: "assets/images/memories/05.webp", posterFallback: "assets/images/memories/05.jpg", alt: "Illustrated film: Mahi's hand with mehndi and her engagement ring" },
      { src: "assets/video/memories/06.mp4", poster: "assets/images/memories/06.webp", posterFallback: "assets/images/memories/06.jpg", alt: "Photos of Mahi and Ayush together" },
      { src: "assets/video/memories/07.mp4", poster: "assets/images/memories/07.webp", posterFallback: "assets/images/memories/07.jpg", alt: "Photos of Mahi and Ayush together" },
      { src: "assets/video/memories/08.mp4", poster: "assets/images/memories/08.webp", posterFallback: "assets/images/memories/08.jpg", alt: "Photos of Mahi and Ayush together" },
    ],
  },

  countdown: {
    caption: "Counting down to our beautiful beginning",
    todayCaption: "Today is the day",
    startedMessage: "The celebration has begun",
    afterMessage: "Thank you for being part of our beautiful beginning",
  },

  // "The Story Behind the Yes": the illustrated storybook (storybook.js).
  // The illustrations were painted from the couple's own photos (Nov 2026).
  // Everything on its pages lives here. The chapter copy is a neutral draft:
  // it names no places, dates or milestones; change any line freely.
  // A chapter title that is also in js/lettering.js is drawn in script;
  // any other title is set in the serif.
  //   image: the illustration (WebP, with a JPG for older browsers) and
  //          its pixel size, so the page keeps its shape while loading.
  //   layout: bleed | framed | arch | vignette | polaroid | finale
  //   camera: push | pan-left | pan-right | rise (a slow 2–4% move)
  //   ambient: what moves in the scene, at points given as [x%, y%]
  //   inset: an optional small original photo, as a keepsake print
  storybook: {
    title: ["The Story", "Behind the Yes"],
    names: "Mahi & Ayush",
    tagline: "A little story, a lifetime of love.",
    cue: "Tap to open our story",
    cover: { src: "assets/images/storybook/cover.webp", fallback: "assets/images/storybook/cover.jpg", width: 960, height: 720, alt: "Illustration of Mahi and Ayush smiling together" },
    signature: "Mahi & Ayush",
    chapters: [
      {
        title: "A Story Begins",
        text: "Some stories become our favourite memories.",
        image: { src: "assets/images/storybook/s01.webp", fallback: "assets/images/storybook/s01.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Ayush and Mahi smiling together in a close selfie by a large window, leaves outside" },
        layout: "bleed", camera: "push",
        ambient: { beam: true, motes: true },
      },
      {
        title: "Little Moments",
        text: "The simplest moments can become the ones we treasure most.",
        image: { src: "assets/images/storybook/s02.webp", fallback: "assets/images/storybook/s02.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Mahi and Ayush sitting together at an outdoor table at night, warm lights among the trees" },
        layout: "framed", camera: "pan-right",
        ambient: { bokeh: [[8, 14], [15, 13], [30, 6], [37, 14], [88, 9]], lights: [[6, 12], [10, 17], [16, 14]] },
      },
      {
        title: "Side by Side",
        text: "Every shared moment adds another page to our story.",
        image: { src: "assets/images/storybook/s03.webp", fallback: "assets/images/storybook/s03.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Ayush and Mahi sitting side by side indoors, smiling, her head on his shoulder" },
        layout: "arch", camera: "pan-left",
        ambient: { beam: true, papers: true },
      },
      {
        title: "A Little Sweetness",
        text: "Little things, lovely memories.",
        image: { src: "assets/images/storybook/s04.webp", fallback: "assets/images/storybook/s04.jpg", width: 960, height: 1200, alt: "Watercolour portrait of Mahi smiling and winking as she holds up a small red cup" },
        layout: "vignette", camera: "push",
        ambient: { steam: [57, 27] },
      },
      {
        title: "Days to Remember",
        text: "Collecting moments, one day at a time.",
        image: { src: "assets/images/storybook/s05.webp", fallback: "assets/images/storybook/s05.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Ayush and Mahi in a sunny selfie, palms and open ground behind them" },
        layout: "arch", camera: "rise",
        ambient: { birds: true, sun: [86, 6], leaves: true },
      },
      {
        title: "Our Silly Side",
        text: "The laughter is part of the love.",
        image: { src: "assets/images/storybook/s06.webp", fallback: "assets/images/storybook/s06.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Mahi making a playful hand gesture beside a smiling Ayush" },
        layout: "polaroid", camera: "pan-right",
        ambient: { doodles: [[10, 18], [88, 12], [86, 72], [14, 78]] },
        inset: { src: "assets/photos/05-800.jpg", alt: "The original photo: Mahi and Ayush being playful", width: 600, height: 800 },
      },
      {
        title: "More Memories",
        text: "And so many reasons to smile.",
        image: { src: "assets/images/storybook/s07.webp", fallback: "assets/images/storybook/s07.jpg", width: 960, height: 1200, alt: "Watercolour close-up of Ayush and Mahi smiling together at night, warm lights among the leaves behind them" },
        layout: "framed", camera: "push",
        ambient: { lights: [[56, 10], [63, 19], [71, 22], [77, 27], [84, 33], [91, 39], [95, 45], [60, 30]] },
      },
      {
        title: "Golden Moments",
        text: "Some memories stay warm in our hearts.",
        image: { src: "assets/images/storybook/s08.webp", fallback: "assets/images/storybook/s08.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Ayush and Mahi close together beneath palms at sunset, his arm around her" },
        layout: "bleed", camera: "pan-left",
        ambient: { glow: [76, 36], palms: true, petals: true },
      },
      {
        title: "Together Through It All",
        text: "Every page is more beautiful with you beside me.",
        image: { src: "assets/images/storybook/s09.webp", fallback: "assets/images/storybook/s09.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Ayush and Mahi smiling together at night, city lights across the water and stars above" },
        layout: "polaroid", camera: "pan-left",
        ambient: { lights: [[70, 36], [74, 32], [80, 30], [86, 34], [92, 31], [97, 36]], stars: [[62, 8], [72, 12], [84, 6], [92, 14], [78, 20]], shimmer: [[84, 44], [94, 46]] },
        inset: { src: "assets/photos/03-800.jpg", alt: "The original photo: Mahi and Ayush together at night", width: 600, height: 800 },
      },
      {
        title: "The Beginning of Forever",
        text: "Thank you for being a part of our story. Your love and blessings mean the world to us.",
        image: { src: "assets/images/storybook/s10.webp", fallback: "assets/images/storybook/s10.jpg", width: 960, height: 1200, alt: "Watercolour illustration of Mahi and Ayush seen from behind, her head on his shoulder, watching the sun set over a palace by the lake" },
        layout: "finale", camera: "rise",
        ambient: { glow: [61, 33], shimmer: [[5, 50], [12, 54], [78, 50], [90, 53], [84, 58]], birds: true },
      },
    ],
  },


  closing: {
    line: "We look forward to celebrating with you",
    thankYou: "With love,",
  },

  share: {
    // The public website address, used in WhatsApp messages and calendar entries.
    // If set to null, the address the guest is currently viewing is shared.
    siteUrl: "https://mahi-ayush.vercel.app/",
    message:
      "You are warmly invited to celebrate the engagement of Mahi & Ayush on Sunday, 15 November 2026 in Chittorgarh.",
  },

  // The opening intro film (a dove carries the scroll across the palace
  // garden; made in Google Flow, its corner mark cropped out, sound removed,
  // sped up slightly to about 7.4 s).
  // It plays after the guest taps; the poster is its first frame and the card
  // is its last. Set to null to use the drawn intro instead. If the film
  // cannot play, the drawn intro plays automatically.
  intro: {
    video: "assets/video/intro.mp4",
    poster: "assets/images/intro-poster.webp",
    posterFallback: "assets/images/intro-poster.jpg",
    card: "assets/images/intro-card.webp",
    cardFallback: "assets/images/intro-card.jpg",
  },

  // Background music. The player never plays by itself.
  // "Tum Tak" is a commercial film song, used here as a short excerpt (0:01–1:50)
  // at the couple's request. To change it, put an MP3 in assets/audio/ and update
  // src. assets/audio/raag-bhupali.mp3 is an original, copyright-free alternative.
  music: {
    src: "assets/audio/tum-tak-excerpt.mp3",
    title: "Tum Tak",
    credit: "Music: “Tum Tak”, A.R. Rahman · Raanjhanaa",
  },
};
