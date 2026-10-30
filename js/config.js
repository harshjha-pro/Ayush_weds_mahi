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
    partnerOne: { first: "Mahi", full: "Mahi Jagetiya" },
    partnerTwo: { first: "Ayush", full: "Ayush Porwal" },
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
    // Guests are asked to arrive at this time.
    arrival: "2026-11-15T10:00:00+05:30",
    // The countdown counts down to the first function below.
    functions: [
      { name: "Ring Ceremony", start: "2026-11-15T12:00:00+05:30" },
      { name: "Lunch", start: "2026-11-15T14:00:00+05:30" },
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
    // viewer and an 800px "thumb" for the grid). The first one is shown larger.
    //   { src, thumb, alt, width, height, focus }
    // width/height are the real pixel size; they keep the layout steady while loading.
    // focus (optional) moves the crop, e.g. "50% 20%" to keep heads in frame.
    // The couple's photo slideshow, shown in place of the photo grid
    // (slowed to about 1.3 s per photo, muted). Set to null to show the
    // photos below as a grid again.
    video: {
      src: "assets/video/story.mp4",
      poster: "assets/images/story-poster.webp",
      posterFallback: "assets/images/story-poster.jpg",
      alt: "Slideshow of photos of Mahi and Ayush together",
    },
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

  countdown: {
    caption: "Counting down to our beautiful beginning",
    todayCaption: "Today is the day",
    startedMessage: "The celebration has begun",
    afterMessage: "Thank you for being part of our beautiful beginning",
  },

  surprise: {
    hint: "A little something for you",
    // The photo revealed inside the envelope (kept out of the gallery on purpose).
    photo: { src: "assets/photos/surprise.jpg", alt: "Mahi and Ayush together at sunset", focus: "62% 40%" },
    // Approved. Replace this text to change the secret message.
    message: "Thank you for being a part of our story. Your love and blessings mean the world to us.",
    signature: "Mahi & Ayush",
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
