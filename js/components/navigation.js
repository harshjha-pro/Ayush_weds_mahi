import { esc, icon } from "../utils.js";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#story", label: "Our Story" },
  { href: "#celebration", label: "The Celebration" },
  { href: "#venue", label: "Location" },
  { href: "#surprise", label: "Surprise" },
];

export function Navigation(el, config) {
  const c = config.couple;
  el.innerHTML = `
    <nav class="nav" aria-label="Invitation sections">
      <a class="nav-brand" href="#home" aria-label="${esc(`${c.partnerOne.first} and ${c.partnerTwo.first}`)}, back to top">
        <img src="${esc(c.monogramSmall)}" width="40" height="40" alt="" />
        <span class="nav-brand-text">${esc(c.partnerOne.first)} <span class="amp">&amp;</span> ${esc(c.partnerTwo.first)}</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">
        ${icon("i-menu")}<span class="visually-hidden">Menu</span>
      </button>
      <ul class="nav-links" id="nav-links">
        ${LINKS.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join("")}
      </ul>
    </nav>
    <a class="location-fab" href="#venue" aria-label="Jump to venue and directions">${icon("i-pin")}</a>`;

  const toggle = el.querySelector(".nav-toggle");
  const links = el.querySelector(".nav-links");
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    el.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (el.classList.contains("is-open") && !el.contains(e.target)) setOpen(false);
  });

  const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Highlight the section currently in view. The countdown and closing sit
  // between named sections, so they map to their nearest neighbour.
  const owner = { countdown: "celebration", closing: "surprise" };
  const anchors = new Map(LINKS.map((l) => [l.href.slice(1), el.querySelector(`a[href="${l.href}"]`)]));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = owner[entry.target.id] ?? entry.target.id;
          anchors.forEach((a, key) => {
            if (key === id) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main > section").forEach((s) => io.observe(s));
  }
}
