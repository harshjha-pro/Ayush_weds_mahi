// InvitationApp: renders each section from config.js, in order.
import { config } from "./config.js";
import { observeReveals, prefersReducedMotion } from "./utils.js";
import { Navigation } from "./components/navigation.js";
import { WelcomeSection } from "./components/welcome.js";
import { WeddingIntro } from "./components/intro.js";
import { CoupleStorySection } from "./components/story.js";
import { EventDetailsSection } from "./components/details.js";
import { CountdownTimer } from "./components/countdown.js";
import { VenueSection } from "./components/venue.js";
import { SurpriseMessage } from "./components/surprise.js";
import { ClosingSection } from "./components/closing.js";
import { MusicControl } from "./components/music.js";

const $ = (id) => document.getElementById(id);
const options = { reducedMotion: prefersReducedMotion() };

// Each section renders on its own, so one failure never blanks the page.
const sections = [
  [Navigation, "site-nav"],
  [WelcomeSection, "home"],
  [CoupleStorySection, "story"],
  [EventDetailsSection, "celebration"],
  [CountdownTimer, "countdown"],
  [VenueSection, "venue"],
  [SurpriseMessage, "surprise"],
  [ClosingSection, "closing"],
  [WeddingIntro, "intro"],
];

for (const [render, id] of sections) {
  try {
    render($(id), config, options);
  } catch (err) {
    console.error(`Could not render #${id}`, err);
  }
}

MusicControl(config);
observeReveals();

// Deep links like …/#venue land on the section once content exists.
if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
