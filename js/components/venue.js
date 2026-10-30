// "The Venue": a framed map card at the centre of the section, with the
// venue's name, address and actions beside it.
//
// The map is OpenStreetMap, drawn with Leaflet (js/vendor/leaflet), centred
// on venue.coordinates with a gold pin; tapping the pin shows the venue's
// name and address. It loads only as the section comes near. If Leaflet
// cannot load, the OpenStreetMap embed (the original map) is used instead.
// "Expand" opens a larger, fully interactive map inside the page.
//
// OpenStreetMap has no satellite imagery, so there is no map/satellite
// switch rather than a pretend one.
import { esc, has, icon, scriptText, copyText, toast, prefersReducedMotion } from "../utils.js";
import { celPalace, celSpray, celDivider } from "./celebration-art.js";
import { LETTERING } from "../lettering.js";

export function VenueSection(el, config) {
  const { venue } = config;
  const fullAddress = [venue.name, ...venue.addressLines].join(", ");
  const pin = validPin(venue.coordinates);
  const directions = pin ? directionsUrl(pin) : venue.mapsUrl;
  const shareLink = has(venue.mapsUrl) ? venue.mapsUrl : pin ? osmLink(pin) : "";

  const extras = [
    has(venue.parking) && ["Parking", venue.parking],
    has(venue.entrance) && ["Entrance", venue.entrance],
    has(venue.accommodation) && ["Staying nearby", venue.accommodation],
  ].filter(Boolean);

  el.innerHTML = `
    <div class="vn-bg" aria-hidden="true">
      <div class="vn-palace">${celPalace("vnp-")}</div>
      <div class="vn-spray vn-spray-l">${celSpray()}</div>
      <div class="vn-spray vn-spray-r">${celSpray()}</div>
    </div>

    <header class="section-head vn-head" data-vn>
      <p class="vn-label">Find Us</p>
      <h2 class="section-title${LETTERING["The Venue"] ? " is-script" : ""}" id="venue-title">${scriptText("The Venue", "script vn-script")}</h2>
      ${celDivider()}
    </header>

    <div class="venue-card vn-card" data-vn>
      ${
        pin
          ? `<div class="vn-map-wrap">
              <div class="vn-map" role="region" aria-label="${esc(`Map showing ${venue.name}`)}"></div>
              <button class="vn-tool vn-expand" type="button" aria-haspopup="dialog">${icon("i-expand")}<span>Expand</span></button>
              <p class="vn-hint" aria-hidden="true">Pinch to zoom · tap the pin</p>
            </div>`
          : ""
      }
      <div class="venue-info vn-info">
        <p class="vn-label">${icon("i-pin")} ${esc(venue.city)}</p>
        <h3 class="venue-name">${esc(venue.name)}</h3>
        <address class="venue-address">${venue.addressLines.map(esc).join("<br />")}</address>
        <div class="venue-actions">
          ${
            has(directions)
              ? `<a class="btn btn-primary vn-directions" href="${esc(directions)}" target="_blank" rel="noopener">${icon("i-navigate")} Get Directions</a>`
              : `<p class="venue-awaiting">Map link coming soon</p>`
          }
          <button class="btn btn-ghost" type="button" data-copy-address>${icon("i-copy")} Copy Address</button>
          ${has(shareLink) ? `<button class="btn btn-ghost" type="button" data-share-location>${icon("i-share")} Share Location</button>` : ""}
        </div>
        ${pin ? `<a class="vn-osm" href="${esc(osmLink(pin))}" target="_blank" rel="noopener">View on OpenStreetMap</a>` : ""}
        ${
          extras.length
            ? `<dl class="venue-extras">${extras.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
            : ""
        }
      </div>
    </div>

    ${
      pin
        ? `<dialog class="vn-dialog" aria-labelledby="vn-dialog-title">
            <div class="vn-dialog-inner">
              <div class="vn-dialog-head">
                <div>
                  <p class="vn-label">The Venue</p>
                  <h3 class="vn-dialog-title" id="vn-dialog-title">${esc(venue.name)}</h3>
                </div>
                <button class="vn-tool vn-close" type="button" aria-label="Close the map">${icon("i-close")}<span>Close</span></button>
              </div>
              <div class="vn-dialog-map" role="region" aria-label="${esc(`Larger map showing ${venue.name}`)}"></div>
              <div class="vn-dialog-foot">
                <address class="venue-address">${venue.addressLines.map(esc).join(", ")}</address>
                ${has(directions) ? `<a class="btn btn-primary vn-directions" href="${esc(directions)}" target="_blank" rel="noopener">${icon("i-navigate")} Get Directions</a>` : ""}
              </div>
            </div>
          </dialog>`
        : ""
    }`;

  el.querySelector("[data-copy-address]").addEventListener("click", async () => {
    toast((await copyText(fullAddress)) ? "Address copied" : "Could not copy. Please copy it by hand.");
  });

  el.querySelector("[data-share-location]")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: venue.name, text: fullAddress, url: shareLink });
      } catch {
        /* The guest closed the share sheet. */
      }
      return;
    }
    toast((await copyText(shareLink)) ? "Location link copied" : "Could not copy. Please copy it by hand.");
  });

  if (pin) setUpMaps(el, pin, venue, directions);
  revealVenue(el);
}

/* ── Maps ─────────────────────────────────────────────────── */

const validPin = (c) => (c && Number.isFinite(c.lat) && Number.isFinite(c.lng) ? c : null);

const osmLink = ({ lat, lng }) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

// Turn-by-turn directions to the venue's pin in Google Maps.
const directionsUrl = ({ lat, lng }) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

// The original OpenStreetMap embed, used if Leaflet cannot load.
function osmEmbed({ lat, lng }) {
  const dLat = 0.0035;
  const dLng = 0.005;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

let leaflet;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  leaflet ??= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "js/vendor/leaflet/leaflet.css";
    document.head.append(css);
    const script = document.createElement("script");
    script.src = "js/vendor/leaflet/leaflet.js";
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet missing")));
    script.onerror = reject;
    document.head.append(script);
  });
  return leaflet;
}

const PIN_SVG = `<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 51C20 51 38 31 38 19A18 18 0 0 0 2 19C2 31 20 51 20 51Z" fill="#86672F" stroke="#FFF9F0" stroke-width="2"/><circle cx="20" cy="19" r="7.5" fill="#FFF9F0"/><circle cx="20" cy="19" r="3.4" fill="#D6B779"/></svg>`;

function buildMap(L, host, pin, venue, directions, { full }) {
  // On touch screens the small map leaves one-finger swipes to the page
  // (pinch still zooms); the expanded map takes every gesture.
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const map = L.map(host, {
    center: [pin.lat, pin.lng],
    zoom: 16,
    scrollWheelZoom: full,
    dragging: full || !touch,
    touchZoom: true,
    tap: false,
    zoomControl: true,
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  }).addTo(map);
  const marker = L.marker([pin.lat, pin.lng], {
    title: venue.name,
    alt: `${venue.name} (show address)`,
    keyboard: true,
    riseOnHover: true,
    icon: L.divIcon({
      className: "vn-pin",
      html: `<span class="vn-ring"></span><span class="vn-ring vn-ring-2"></span><span class="vn-pin-body">${PIN_SVG}</span>`,
      iconSize: [44, 56],
      iconAnchor: [22, 54],
      popupAnchor: [0, -50],
    }),
  }).addTo(map);
  marker.bindPopup(
    `<div class="vn-pop"><strong>${esc(venue.name)}</strong><span>${venue.addressLines.map(esc).join("<br />")}</span>${
      has(directions) ? `<a href="${esc(directions)}" target="_blank" rel="noopener">Get Directions</a>` : ""
    }</div>`,
    { closeButton: true, autoPanPadding: [24, 24] },
  );
  return { map, marker };
}

function embedFallback(host, pin, venue) {
  const frame = document.createElement("iframe");
  frame.className = "venue-map-frame";
  frame.title = `Map showing ${venue.name}`;
  frame.src = osmEmbed(pin);
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer-when-downgrade";
  host.replaceChildren(frame);
  host.classList.add("is-embed");
}

function setUpMaps(root, pin, venue, directions) {
  const host = root.querySelector(".vn-map");
  const dialog = root.querySelector(".vn-dialog");
  const dialogHost = root.querySelector(".vn-dialog-map");
  let L = null;
  let big = null;

  // The small map loads as the section comes near.
  const load = async () => {
    try {
      L = await loadLeaflet();
      buildMap(L, host, pin, venue, directions, { full: false });
      host.classList.add("is-ready");
    } catch {
      embedFallback(host, pin, venue);
    }
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        load();
      },
      { rootMargin: "500px 0px" },
    );
    io.observe(host);
  } else load();

  // Expanded map: a dialog over the page with its own, fully interactive map.
  const opener = root.querySelector(".vn-expand");
  const open = async () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.documentElement.classList.add("has-dialog");
    if (!L) {
      try {
        L = await loadLeaflet();
      } catch {
        /* fall through to the embed */
      }
    }
    if (!big) {
      if (L) {
        big = buildMap(L, dialogHost, pin, venue, directions, { full: true });
        dialogHost.classList.add("is-ready");
      } else embedFallback(dialogHost, pin, venue);
    }
    requestAnimationFrame(() => {
      big?.map.invalidateSize();
      big?.map.setView([pin.lat, pin.lng], 17);
      big?.marker.openPopup();
    });
  };
  const close = () => {
    if (dialog.open) dialog.close();
  };
  opener.addEventListener("click", open);
  root.querySelector(".vn-close").addEventListener("click", close);
  // A click on the dimmed backdrop (outside the panel) also closes it.
  dialog.addEventListener("click", (e) => e.target === dialog && close());
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-dialog");
    opener.focus({ preventScroll: true });
  });
}

/* ── Reveal ───────────────────────────────────────────────── */

// Each part reveals once as it comes into view (styles: "Venue reveals").
// The divider and the pin's drop and ripple follow their parents' classes.
function revealVenue(root) {
  const parts = [...root.querySelectorAll("[data-vn]")];
  const show = (p) => {
    p.classList.add("is-in");
    p.querySelector(".cel-divider")?.classList.add("is-in");
  };
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    parts.forEach(show);
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        show(e.target);
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
  );
  // The intro covers the page at first (it is set up just after this
  // section); start once it hands over.
  setTimeout(() => {
    const intro = document.getElementById("intro");
    const start = () => parts.forEach((p) => io.observe(p));
    if (intro && !intro.hidden) document.addEventListener("invitation:opened", start, { once: true });
    else start();
  });
}
