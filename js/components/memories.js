import { esc, has, icon, scriptText, prefersReducedMotion } from "../utils.js";
import { LETTERING } from "../lettering.js";
import { celDivider } from "./celebration-art.js";
import { landingBranch } from "./landing-art.js";
import { PhotoGallery } from "./story.js";

// The exact codec lets browsers that cannot play the clips show posters
// instead of a broken player.
const TYPE = 'video/mp4; codecs="avc1.64001F"';
// How long a guest's last touch holds the carousel before it moves on again.
const RESUME_AFTER = 5000;

// Memories: the couple's short films in a carousel. The film in the centre
// plays (muted); the ones beside it peek in, a little smaller and softer.
// Every few seconds (memories.interval) the next one glides in, with a fine
// gold line filling beneath to show when. Guests can swipe, drag, scroll
// sideways, use the arrows or dots, and tap the centre film to watch it
// larger; any of these pauses the carousel until they have let it be for a
// few seconds. Only one film ever plays, and only while it is on screen.
export function MemoriesSection(el, config) {
  const mem = config.memories ?? {};
  const videos = (mem.videos ?? []).filter((v) => has(v?.src));
  const photos = (config.story?.photos ?? []).filter((p) => has(p?.src));
  if (!videos.length && !photos.length) {
    el.remove();
    return;
  }
  const n = videos.length;

  el.innerHTML = `
    <div class="mem-bg" aria-hidden="true">
      <div class="mem-branch mem-branch-l">${landingBranch()}</div>
      <div class="mem-branch mem-branch-r">${landingBranch()}</div>
    </div>
    <header class="section-head mem-head" data-mem>
      ${has(mem.eyebrow) ? `<p class="mem-eyebrow">${esc(mem.eyebrow)}</p>` : ""}
      <h2 class="section-title mem-title${LETTERING["Our Memories"] ? " is-script" : ""}" id="memories-title">${scriptText("Our Memories", "script mem-script")}</h2>
      ${celDivider()}
    </header>
    ${
      n
        ? `<div class="mem-carousel" role="region" aria-roledescription="carousel" aria-label="Films of ${esc(config.couple.partnerOne.first)} and ${esc(config.couple.partnerTwo.first)}">
            <div class="mem-track${videos[0].landscape ? " starts-wide" : ""}${videos[n - 1].landscape ? " ends-wide" : ""}">
              ${videos.map((v, i) => card(v, i, n)).join("")}
            </div>
            <p class="visually-hidden" id="mem-keys">Use the left and right arrow keys to move between films.</p>
            ${
              n > 1
                ? `<div class="mem-controls">
                    <button class="mem-arrow mem-prev" type="button" aria-label="Previous film">${icon("i-left")}</button>
                    <div class="mem-dots">${videos.map((_, i) => `<button class="mem-dot" type="button" data-i="${i}" aria-label="Film ${i + 1} of ${n}"></button>`).join("")}</div>
                    <button class="mem-arrow mem-next" type="button" aria-label="Next film">${icon("i-right")}</button>
                  </div>
                  <div class="mem-progress" aria-hidden="true"><span></span></div>`
                : ""
            }
          </div>`
        : `<div class="gallery" data-count="${photos.length}"></div>`
    }`;

  revealHead(el);
  if (!n) return PhotoGallery(el.querySelector(".gallery"), photos);
  Carousel(el.querySelector(".mem-carousel"), videos, Math.max(2, Number(mem.interval) || 5) * 1000);
}

function card(v, i, n) {
  return `
    <div class="mem-card${v.landscape ? " is-wide" : ""}" role="group" aria-roledescription="slide" aria-label="Film ${i + 1} of ${n}" data-i="${i}" style="--k:1">
      <div class="mem-frame">
        <picture class="mem-poster">
          ${has(v.poster) ? `<source srcset="${esc(v.poster)}" type="image/webp" />` : ""}
          <img src="${esc(v.posterFallback || v.poster)}" alt="${esc(v.alt ?? "")}" ${v.landscape ? 'width="960" height="540"' : 'width="360" height="640"'} draggable="false"
               loading="${i < 3 ? "eager" : "lazy"}" decoding="async" />
        </picture>
        <video class="mem-video" muted playsinline disablepictureinpicture preload="none" aria-hidden="true" data-src="${esc(v.src)}"></video>
        <span class="mem-play" aria-hidden="true">${icon("i-play")}</span>
        <span class="mem-expand" aria-hidden="true">${icon("i-expand")}</span>
        <button class="mem-hit" type="button" aria-label="Watch film ${i + 1} of ${n} larger${v.alt ? `: ${esc(v.alt)}` : ""}" aria-describedby="mem-keys"></button>
      </div>
    </div>`;
}

// The heading reveals once: label, the script written in gold, the divider.
function revealHead(el) {
  const head = el.querySelector(".mem-head");
  const show = () => {
    head.classList.add("is-in");
    head.querySelector(".mem-script")?.classList.add("is-drawn");
  };
  whenOnScreen(head, show, 0.3);
}

// Runs `fn` once, the first time `target` is on screen (after the intro).
function whenOnScreen(target, fn, threshold) {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return fn();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fn();
    },
    { threshold },
  );
  setTimeout(() => {
    const intro = document.getElementById("intro");
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", () => io.observe(target), { once: true });
    else io.observe(target);
  });
}

function Carousel(root, videos, interval) {
  const track = root.querySelector(".mem-track");
  const cards = [...root.querySelectorAll(".mem-card")];
  const dots = [...root.querySelectorAll(".mem-dot")];
  const bar = root.querySelector(".mem-progress span");
  const n = cards.length;
  const reduced = prefersReducedMotion();
  const canPlay = !!document.createElement("video").canPlayType(TYPE);
  const behavior = reduced ? "auto" : "smooth";

  // Browsers that cannot play the clips keep the posters.
  if (!canPlay) cards.forEach((c) => c.querySelector(".mem-video").remove());

  let active = -1;
  let awake = false; // films load only once the section is near
  let inView = false;
  let entered = false;
  let held = false; // a guest is touching, dragging or has just navigated
  let viewerOpen = false;
  let resumeTimer = 0;
  let elapsed = 0;
  let last = 0;
  let raf = 0;

  // ── Position: each card's emphasis follows its distance from the centre.
  let centres = [];
  let step = 1;
  const measure = () => {
    centres = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    step = n > 1 ? centres[1] - centres[0] : 1;
  };
  const targetLeft = (i) => centres[i] - track.clientWidth / 2;
  const nearest = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    centres.forEach((c, i) => Math.abs(c - mid) < Math.abs(centres[best] - mid) && (best = i));
    return best;
  };
  let queued = false;
  const paint = () => {
    queued = false;
    const mid = track.scrollLeft + track.clientWidth / 2;
    cards.forEach((c, i) => {
      // One card away reads as 1, whether the cards are tall or wide.
      const gapTo = centres[i] >= mid ? centres[i] - (centres[i - 1] ?? centres[i] - step) : (centres[i + 1] ?? centres[i] + step) - centres[i];
      const d = Math.max(-2, Math.min(2, (centres[i] - mid) / (gapTo || step)));
      c.style.setProperty("--d", d.toFixed(3));
      c.style.setProperty("--a", Math.max(0, 1 - Math.abs(d)).toFixed(3));
    });
  };
  const queuePaint = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paint);
    }
  };

  // ── Playback: only the centre film plays; its neighbours are loaded
  // (metadata only) so they are ready to start the moment they arrive.
  const video = (i) => cards[i]?.querySelector(".mem-video");
  const load = (i, preload) => {
    const v = video(i);
    if (!v || !awake) return;
    if (!v.getAttribute("src")) {
      v.preload = preload;
      v.src = v.dataset.src;
    } else if (preload === "auto") v.preload = "auto";
  };
  const playActive = () => {
    const v = video(active);
    const c = cards[active];
    if (!v?.getAttribute("src") || !inView || viewerOpen || document.hidden) return;
    if (reduced && !c.classList.contains("is-started")) {
      c.classList.add("is-blocked");
      return;
    }
    v.play().then(
      () => c.classList.remove("is-blocked"),
      () => c.classList.add("is-blocked"),
    );
  };
  const loadAround = (i) => {
    load(i, "auto");
    load((i + 1) % n, "metadata");
    load((i - 1 + n) % n, "metadata");
  };
  const pauseAll = () => cards.forEach((_, i) => video(i)?.pause());

  cards.forEach((c, i) => {
    const v = video(i);
    if (!v) return;
    v.addEventListener("playing", () => c.classList.add("is-playing"));
    // A clip that fails to load leaves its poster in place.
    v.addEventListener("error", () => {
      c.classList.remove("is-playing", "is-blocked");
      v.remove();
    });
  });

  const setActive = (i) => {
    if (i === active) return;
    const prev = active;
    active = i;
    cards.forEach((c, k) => {
      c.classList.toggle("is-active", k === i);
      c.setAttribute("aria-hidden", String(k !== i));
      c.querySelector(".mem-hit").tabIndex = k === i ? 0 : -1;
    });
    dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"));
    // Keyboard focus follows the film that comes to the centre.
    if (document.activeElement?.classList.contains("mem-hit")) cards[i].querySelector(".mem-hit").focus({ preventScroll: true });
    if (prev >= 0) {
      const pv = video(prev);
      pv?.pause();
      cards[prev].classList.remove("is-playing", "is-blocked");
    }
    loadAround(i);
    const v = video(i);
    if (v) {
      v.loop = true; // it may stay in the centre longer than the clip lasts
      if (v.readyState) v.currentTime = 0;
    }
    playActive();
    elapsed = 0;
    drawBar();
  };

  const go = (i, how = behavior) => {
    const to = ((i % n) + n) % n;
    track.scrollTo({ left: targetLeft(to), behavior: how });
    // The scroll settles into setActive; a jump (no animation) settles now.
    if (how === "auto") setActive(to);
  };

  // ── Settling: when the track stops moving, the nearest film is the one.
  let settleTimer = 0;
  const settle = () => {
    clearTimeout(settleTimer);
    track.classList.remove("is-dragging");
    setActive(nearest());
  };
  track.addEventListener(
    "scroll",
    () => {
      queuePaint();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 140);
    },
    { passive: true },
  );
  track.addEventListener("scrollend", () => !dragging && settle());

  // ── The automatic rotation, with its progress line.
  const running = () => entered && inView && !held && !viewerOpen && !document.hidden && !reduced && n > 1;
  const drawBar = () => {
    if (bar) bar.style.transform = `scaleX(${Math.min(1, elapsed / interval).toFixed(4)})`;
  };
  const tick = (now) => {
    raf = 0;
    if (!running()) return;
    elapsed += Math.min(100, now - last);
    last = now;
    if (elapsed >= interval) {
      elapsed = 0;
      go(active + 1);
    }
    drawBar();
    raf = requestAnimationFrame(tick);
  };
  const resume = () => {
    root.classList.toggle("is-paused", !running());
    if (!running() || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // Any touch, drag, sideways scroll, key or button holds the rotation; it
  // starts again (with a fresh interval) a few seconds after the last one.
  const interact = () => {
    held = true;
    root.classList.add("is-paused");
    clearTimeout(resumeTimer);
    if (dragging || pressing) return;
    resumeTimer = setTimeout(() => {
      held = false;
      elapsed = 0;
      drawBar();
      resume();
    }, RESUME_AFTER);
  };

  // ── Mouse dragging (touch and trackpads scroll the track natively).
  let dragging = false;
  let pressing = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;
  track.addEventListener("pointerdown", (e) => {
    pressing = true;
    moved = 0;
    interact();
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = e.clientX;
    startLeft = track.scrollLeft;
    track.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    track.scrollLeft = startLeft - (e.clientX - startX);
  });
  const release = (e) => {
    if (!pressing) return;
    pressing = false;
    if (dragging) {
      dragging = false;
      // A quick flick goes on to the next film, even if not yet half way.
      const dx = e.clientX - startX;
      let i = nearest();
      if (i === active && Math.abs(dx) > 40) i = active + (dx < 0 ? 1 : -1);
      track.scrollTo({ left: targetLeft(Math.max(0, Math.min(n - 1, i))), behavior });
    }
    interact();
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  // A drag is not a tap.
  track.addEventListener("click", (e) => moved > 6 && (e.stopPropagation(), e.preventDefault(), (moved = 0)), true);
  track.addEventListener("wheel", (e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && interact(), { passive: true });
  track.addEventListener("touchstart", interact, { passive: true });
  track.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    interact();
    go(active + (e.key === "ArrowRight" ? 1 : -1));
  });

  root.querySelector(".mem-prev")?.addEventListener("click", () => (interact(), go(active - 1)));
  root.querySelector(".mem-next")?.addEventListener("click", () => (interact(), go(active + 1)));
  dots.forEach((d) => d.addEventListener("click", () => (interact(), go(Number(d.dataset.i)))));

  // Tapping a side film brings it to the centre; tapping the centre film
  // opens it larger (or, if the browser blocked it, starts it).
  const viewer = Viewer(videos, {
    onOpen: () => {
      viewerOpen = true;
      pauseAll();
      resume();
    },
    onClose: () => {
      viewerOpen = false;
      interact();
      playActive();
    },
  });
  cards.forEach((c, i) =>
    c.querySelector(".mem-hit").addEventListener("click", () => {
      interact();
      if (i !== active) return go(i);
      if (c.classList.contains("is-blocked") && video(i)) {
        c.classList.add("is-started");
        return playActive();
      }
      viewer.open(i, c.querySelector(".mem-hit"));
    }),
  );

  // ── On screen or not: nothing plays or moves while the section is away.
  const io = new IntersectionObserver(
    (entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !entered) enter();
      if (inView) playActive();
      else pauseAll();
      resume();
    },
    { threshold: 0.35 },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAll();
    else playActive();
    resume();
  });

  // The first time it is seen: the centre film scales in, its neighbours
  // follow, then the progress line; the rotation starts after that.
  const enter = () => {
    root.classList.add("is-in");
    setTimeout(() => {
      entered = true;
      resume();
    }, reduced ? 0 : 1400);
  };

  const layout = () => {
    measure();
    if (active >= 0) track.scrollTo({ left: targetLeft(active), behavior: "auto" });
    paint();
  };
  window.addEventListener("resize", layout);
  measure();
  paint();
  cards.forEach((c, i) => c.style.setProperty("--k", String(Math.min(i, 3))));
  go(0, "auto");
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      awake = true;
      loadAround(active);
      playActive();
    },
    { rootMargin: "600px 0px" },
  );
  setTimeout(() => {
    const intro = document.getElementById("intro");
    const watch = () => (near.observe(root), io.observe(root));
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", watch, { once: true });
    else watch();
  });
}

// The larger viewer: the film with its own controls (still muted until the
// guest chooses sound), previous and next, swipe, Escape to close.
function Viewer(videos, { onOpen, onClose }) {
  const n = videos.length;
  const box = document.createElement("dialog");
  box.className = "mem-viewer";
  box.setAttribute("aria-label", "Film viewer");
  box.innerHTML = `
    <div class="mem-viewer-inner">
      <video class="mem-viewer-video" controls playsinline muted loop disablepictureinpicture></video>
      <p class="mem-viewer-count" aria-live="polite"></p>
    </div>
    <button class="lightbox-btn lightbox-close mem-viewer-close" type="button" aria-label="Close film">${icon("i-close")}</button>
    ${n > 1 ? `
      <button class="lightbox-btn lightbox-prev mem-viewer-prev" type="button" aria-label="Previous film">${icon("i-left")}</button>
      <button class="lightbox-btn lightbox-next mem-viewer-next" type="button" aria-label="Next film">${icon("i-right")}</button>` : ""}`;
  document.body.append(box);
  const v = box.querySelector("video");
  const count = box.querySelector(".mem-viewer-count");
  let index = 0;
  let returnFocus = null;

  const show = (i) => {
    index = (i + n) % n;
    const f = videos[index];
    v.poster = f.posterFallback || f.poster || "";
    v.src = f.src;
    v.setAttribute("aria-label", f.alt ?? "");
    box.classList.toggle("is-wide", !!f.landscape);
    count.textContent = n > 1 ? `${index + 1} / ${n}` : "";
    v.play().catch(() => {});
  };

  // Sound is the guest's choice; it never plays over the site's music.
  v.addEventListener("volumechange", () => {
    if (!v.muted && v.volume > 0) document.dispatchEvent(new Event("invitation:pause-music"));
  });
  document.addEventListener("invitation:music-playing", () => (v.muted = true));

  box.addEventListener("click", (e) => {
    if (e.target.closest(".mem-viewer-close") || e.target === box) box.close();
    else if (e.target.closest(".mem-viewer-prev")) show(index - 1);
    else if (e.target.closest(".mem-viewer-next")) show(index + 1);
  });
  box.addEventListener("keydown", (e) => {
    if (n < 2 || e.target === v) return;
    if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });
  let startX = null;
  box.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  box.addEventListener("touchend", (e) => {
    if (startX === null || n < 2) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
  box.addEventListener("close", () => {
    v.pause();
    v.removeAttribute("src");
    v.load();
    document.documentElement.classList.remove("is-locked");
    returnFocus?.focus({ preventScroll: true });
    onClose();
  });

  return {
    open(i, trigger) {
      returnFocus = trigger;
      onOpen();
      show(i);
      document.documentElement.classList.add("is-locked");
      box.showModal();
      box.querySelector(".mem-viewer-close").focus({ preventScroll: true });
    },
  };
}
