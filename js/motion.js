// Gentle parallax for the botanical ornaments: they drift a little slower or
// faster than the page as it scrolls. Uses the `translate` property so it
// never fights the ornaments' own rotation, and does nothing for visitors who
// prefer reduced motion.
import { prefersReducedMotion } from "./utils.js";

const LAYERS = [
  [".hero-sprig", 0.08],
  [".closing-sprig", 0.06],
  [".arch-sprig", -0.04],
  [".cel-palace", 0.06],
  [".cel-garden", 0.03],
  [".cel-spray-l", 0.05],
  [".cel-spray-r", -0.04],
  [".cd-palace", 0.05],
  [".vn-palace", 0.05],
  [".cd-spray-l", 0.04],
  [".cd-spray-r", 0.04],
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
    // Films in the same section wait for this (see startFilm).
    const done = () => {
      if (box.dataset.done) return;
      box.dataset.done = "1";
      box.dispatchEvent(new Event("mono:done"));
    };
    video.addEventListener("ended", done, { once: true });
    const fallback = () => {
      done();
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

// Plays each film while it is well on screen and pauses it when scrolled
// away, so it never runs unseen. A film that shares its section with an
// animated monogram waits for the monogram to finish first, so the two never
// play at once; if the monogram is off screen, the film does not wait for
// it. If a film cannot play, its poster stays.
export function startFilms() {
  document.querySelectorAll("[data-film]").forEach(startFilm);
}

function startFilm(box) {
  const video = box.querySelector("video");
  if (!video) return;
  const source = video.querySelector("source");
  const playBtn = box.querySelector(".film-play");
  const fallback = () => {
    box.classList.remove("is-playing", "is-seam");
    playBtn?.remove();
    video.remove();
  };
  if (!source || !video.canPlayType(source.type) || video.error || !("IntersectionObserver" in window)) return fallback();
  // Fade the film in over the poster only once frames are actually moving.
  video.addEventListener("playing", () => box.classList.add("is-playing"), { once: true });

  // Reduced motion: the poster stays until the visitor presses play.
  const manual = prefersReducedMotion();
  // Download only when the film is about to be seen (or, with reduced
  // motion, only once the visitor asks for it).
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    // Listen for failures only now: an empty <source> reports an error on
    // its own before it has an address.
    source.addEventListener("error", fallback, { once: true });
    video.addEventListener("error", fallback, { once: true });
    source.src = source.dataset.src;
    video.preload = "auto";
    video.load();
  };
  if (!manual)
    new IntersectionObserver(
      ([entry], obs) => {
        if (!entry.isIntersecting) return;
        load();
        obs.disconnect();
      },
      { rootMargin: "300px 0px" },
    ).observe(box);
  let wanted = false; // whether the visitor started it by hand
  const showPlay = (on) => {
    if (playBtn) playBtn.hidden = !on;
  };
  const tryPlay = () => {
    load();
    video.play().then(
      () => showPlay(false),
      (err) => {
        // Blocked autoplay (e.g. low-power mode): offer the button. Other
        // rejections come from a pause() racing the play(); ignore those.
        if (err?.name === "NotAllowedError") showPlay(true);
      },
    );
  };
  playBtn?.addEventListener("click", () => {
    wanted = true;
    tryPlay();
  });
  if (manual) showPlay(true);

  // A smooth loop: just before the end the poster (the first frame) fades
  // in over the last frames; the film restarts underneath; the poster fades
  // away. The loop dissolves from the end into the beginning.
  const SEAM = 0.45;
  let seaming = false;
  const watchEnd = () => {
    if (video.paused || !video.isConnected) return;
    const left = video.duration - video.currentTime;
    if (!seaming && Number.isFinite(left) && left < SEAM) {
      seaming = true;
      box.classList.add("is-seam");
    }
    requestAnimationFrame(watchEnd);
  };
  video.addEventListener("playing", () => requestAnimationFrame(watchEnd));
  video.addEventListener("ended", () => {
    video.currentTime = 0;
    video.play().catch(() => {});
    video.addEventListener(
      "seeked",
      () => {
        box.classList.remove("is-seam");
        seaming = false;
      },
      { once: true },
    );
  });

  // The monogram to wait for: named by data-after, or the one in the same section.
  const mono = box.dataset.after ? document.querySelector(box.dataset.after) : box.closest("section")?.querySelector("[data-mono-video]");
  let filmInView = false;
  let monoInView = false;
  const update = () => {
    if (!video.isConnected) return;
    const monoBusy = mono && !mono.dataset.done && monoInView;
    if (filmInView && !monoBusy && (!manual || wanted)) tryPlay();
    else video.pause();
  };
  // The monogram is watched first, so its state is known before the film's
  // first visibility check.
  if (mono) {
    mono.addEventListener("mono:done", update, { once: true });
    new IntersectionObserver(([entry]) => {
      monoInView = entry.isIntersecting;
      update();
    }).observe(mono);
  }
  new IntersectionObserver(
    ([entry]) => {
      filmInView = entry.isIntersecting;
      update();
    },
    { threshold: 0.5 },
  ).observe(box);
}

// Motion (js/vendor/motion.min.js): gentle springs when buttons are hovered
// or pressed, and the couple's film rising into view. Loaded on demand; if it
// cannot load, the page simply works without these touches.
export async function startSprings() {
  if (prefersReducedMotion()) return;
  let M;
  try {
    M = await import("./vendor/motion.min.js");
  } catch {
    return;
  }
  const { animate, hover, press, inView } = M;
  const spring = { type: "spring", stiffness: 420, damping: 24 };
  hover(".btn", (el) => {
    animate(el, { y: -2 }, spring);
    return () => animate(el, { y: 0 }, spring);
  });
  press(".btn, .surprise-envelope", (el) => {
    animate(el, { scale: 0.96 }, spring);
    return () => animate(el, { scale: 1 }, spring);
  });

  const film = document.querySelector(".hero-film");
  if (film && film.getBoundingClientRect().top > window.innerHeight) {
    // Hidden only while it is still below the screen, so it never blinks out.
    film.style.opacity = "0";
    inView(
      film,
      () => {
        animate(film, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 1.1, ease: [0.22, 0.61, 0.36, 1] });
      },
      { amount: 0.15 },
    );
  }
}
