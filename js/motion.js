// Gentle parallax for the botanical ornaments: they drift a little slower or
// faster than the page as it scrolls. Uses the `translate` property so it
// never fights the ornaments' own rotation, and does nothing for visitors who
// prefer reduced motion.
import { prefersReducedMotion } from "./utils.js";

const LAYERS = [
  [".hero-sprig", 0.08],
  [".closing-sprig", 0.06],
  [".venue-sprig", 0.05],
  [".arch-sprig", -0.04],
];

export function startParallax() {
  if (prefersReducedMotion()) return;
  const items = LAYERS.flatMap(([sel, speed]) => [...document.querySelectorAll(sel)].map((el) => ({ el, speed })));
  if (!items.length) return;

  let queued = false;
  const update = () => {
    queued = false;
    const mid = window.innerHeight / 2;
    for (const { el, speed } of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      const offset = (r.top + r.height / 2 - mid) * speed;
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

// Plays each monogram video once, when it is well into view, and leaves it on
// the finished monogram. If the video cannot load or the browser blocks
// playback (for example low-power mode), the still monogram shows instead.
export function startMonogramVideos() {
  document.querySelectorAll("[data-mono-video]").forEach((box) => {
    const video = box.querySelector("video");
    const fallback = () => {
      box.classList.add("is-fallback");
      video.removeAttribute("src");
      video.querySelectorAll("source").forEach((s) => s.remove());
    };
    const source = video.querySelector("source");
    // The format may be unsupported, or loading may already have failed
    // while the intro was showing (before these listeners existed).
    const unplayable = !source || !video.canPlayType(source.type) || video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
    if (unplayable || !("IntersectionObserver" in window)) return fallback();
    source.addEventListener("error", fallback, { once: true });
    video.addEventListener("error", fallback, { once: true });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        video.play().catch(fallback);
      },
      { threshold: 0.4 },
    );
    io.observe(box);
  });
}
