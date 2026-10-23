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
 *  Items still waiting for details are marked  ⟶ TO ADD.
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
  },

  invitation: {
    eyebrow: "A Beautiful Beginning",
    welcomeLine: "We invite you to celebrate our engagement",
    // ⟶ TO ADD: hosts / family names, e.g.
    //   "Together with their families, Mr. & Mrs. … and Mr. & Mrs. …"
    hosts: null,
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
    parking: null,
    entrance: null,
    accommodation: null,
  },

  story: {
    // A short neutral intro for now. Replace with your own story when ready
    // (2–4 short paragraphs work best).
    paragraphs: ["Two hearts, one beautiful beginning.", "A few moments from our journey so far."],
    // Optional longer part, shown behind a "Read more" toggle.
    moreParagraphs: [],
    // Photos live in assets/photos/ (a 1600px version for the full-screen
    // viewer and an 800px "thumb" for the grid). The first one is shown larger.
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
    // ⟶ TO ADD (optional): a favourite quote or line.
    quote: null, // { text: "…", attribution: "…" }
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

  // ⟶ TO ADD (optional): background music you have the right to use.
  // Put the file in assets/audio/ (MP3 is the most compatible). The player
  // only appears when a file is set, and it never plays by itself.
  music: null, // { src: "assets/audio/song.mp3", title: "…" }
};
