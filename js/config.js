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
    // ⟶ TO CONFIRM: the end time was not provided; 3:00 PM is an assumption.
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
    // ⟶ TO ADD: a short narrative (2–4 short paragraphs work best).
    paragraphs: [],
    // Optional longer part, shown behind a "Read more" toggle.
    moreParagraphs: [],
    // ⟶ TO ADD: 6–7 photos. Put the files in assets/photos/ and list them:
    //   { src: "assets/photos/01.jpg", alt: "Mahi and Ayush at …", width: 1200, height: 1600 }
    // width/height are the real pixel size; they keep the layout steady while loading.
    photos: [],
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
    // ⟶ TO ADD: the photo revealed inside the envelope.
    photo: null, // { src: "assets/photos/surprise.jpg", alt: "…" }
    // ⟶ TO ADD: the secret message. Until then this gentle draft is shown.
    message: "Thank you for being a part of our story. Your love and blessings mean the world to us.",
    signature: "Mahi & Ayush",
  },

  closing: {
    line: "We look forward to celebrating with you",
    thankYou: "With love,",
  },

  share: {
    // ⟶ TO ADD after publishing: the public website address.
    // While empty, the address the guest is currently viewing is shared.
    siteUrl: null,
    message:
      "You are warmly invited to celebrate the engagement of Mahi & Ayush on Sunday, 15 November 2026 in Chittorgarh.",
  },

  // ⟶ TO ADD (optional): background music you have the right to use.
  // Put the file in assets/audio/ (MP3 is the most compatible). The player
  // only appears when a file is set, and it never plays by itself.
  music: null, // { src: "assets/audio/song.mp3", title: "…" }
};
