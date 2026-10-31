// InvitationApp: renders each section from config.js, in order.
import { config } from "./config.js";
import { observeReveals, prefersReducedMotion } from "./utils.js";
import { WelcomeSection, FilmSection } from "./components/welcome.js";
import { WeddingIntro } from "./components/intro.js";
import { CoupleStorySection } from "./components/story.js";
import { MemoriesSection } from "./components/memories.js";
import { EventDetailsSection } from "./components/details.js";
import { CountdownTimer } from "./components/countdown.js";
import { VenueSection } from "./components/venue.js";
import { StorybookSection } from "./components/storybook.js";
import { ClosingSection } from "./components/closing.js";
import { MusicControl } from "./components/music.js";
import { startParallax, startMonogramVideos, startFilms, startSprings } from "./motion.js";
import { startWriting } from "./writing.js";

const $ = (id) => document.getElementById(id);
const options = { reducedMotion: prefersReducedMotion() };

// Each section renders on its own, so one failure never blanks the page.
const sections = [
  [FilmSection, "film"],
  [WelcomeSection, "home"],
  [CoupleStorySection, "story"],
  [MemoriesSection, "memories"],
  [EventDetailsSection, "celebration"],
  [CountdownTimer, "countdown"],
  [VenueSection, "venue"],
  [StorybookSection, "surprise"],
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

// Entrance animations start once the page is actually visible: right away,
// or after the opening intro hands over to the site.
const startMotion = () => {
  observeReveals();
  startParallax();
  startMonogramVideos();
  startFilms();
  startWriting();
  startSprings();
};
if ($("intro") && !$("intro").hidden) document.addEventListener("invitation:opened", startMotion, { once: true });
else startMotion();

// Deep links like …/#venue land on the section once content exists.
if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
