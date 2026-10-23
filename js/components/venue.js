import { esc, has, icon, ornament, sectionHeading, copyText, toast } from "../utils.js";

export function VenueSection(el, config) {
  const { venue } = config;
  const fullAddress = [venue.name, ...venue.addressLines].join(", ");
  const hasMap = has(venue.mapsUrl);
  const pin = validPin(venue.coordinates);

  const extras = [
    has(venue.parking) && ["Parking", venue.parking],
    has(venue.entrance) && ["Entrance", venue.entrance],
    has(venue.accommodation) && ["Staying nearby", venue.accommodation],
  ].filter(Boolean);

  el.innerHTML = `
    ${sectionHeading({ id: "venue-title", eyebrow: "Find Us", title: "The Venue" })}
    <div class="venue-card" data-animate>
      <div class="venue-art">
        <svg class="venue-map-art" aria-hidden="true" viewBox="0 0 320 200" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
          <path d="M-10 150C60 130 90 160 150 140S260 90 330 110" opacity=".55" />
          <path d="M-10 60C50 80 110 40 170 60S280 40 330 30" opacity=".35" />
          <path d="M90 -10C100 50 80 120 110 210" opacity=".35" />
          <path d="M230 -10C210 60 250 130 220 210" opacity=".55" />
          <path d="M-10 105H330" opacity=".2" stroke-dasharray="2 6" />
          <circle cx="160" cy="96" r="38" opacity=".5" />
          <circle cx="160" cy="96" r="58" opacity=".25" />
        </svg>
        <span class="venue-pin" aria-hidden="true">${icon("i-pin")}</span>
        ${ornament("sprig", "venue-sprig")}
        ${pin ? `<a class="venue-map-open" href="${esc(osmLink(pin))}" target="_blank" rel="noopener">Open larger map</a>` : ""}
      </div>
      <div class="venue-info">
        <p class="eyebrow">${esc(venue.city)}</p>
        <h3 class="venue-name">${esc(venue.name)}</h3>
        <address class="venue-address">${venue.addressLines.map(esc).join("<br />")}</address>
        <div class="venue-actions">
          ${
            hasMap
              ? `<a class="btn btn-primary" href="${esc(venue.mapsUrl)}" target="_blank" rel="noopener">${icon("i-navigate")} Get Directions</a>`
              : `<p class="venue-awaiting">Map link coming soon</p>`
          }
          <button class="btn btn-ghost" type="button" data-copy-address>${icon("i-copy")} Copy Address</button>
        </div>
        ${
          extras.length
            ? `<dl class="venue-extras">${extras.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`
            : ""
        }
      </div>
    </div>`;

  if (pin) lazyMap(el.querySelector(".venue-art"), pin, venue.name);

  el.querySelector("[data-copy-address]").addEventListener("click", async () => {
    toast((await copyText(fullAddress)) ? "Address copied" : "Could not copy. Please copy it by hand.");
  });
}

/* ── Embedded map (OpenStreetMap, no key needed) ─────────── */

const validPin = (c) => (c && Number.isFinite(c.lat) && Number.isFinite(c.lng) ? c : null);

const osmLink = ({ lat, lng }) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

function osmEmbed({ lat, lng }) {
  const dLat = 0.0035;
  const dLng = 0.005;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(6)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

// The map loads only as the venue section comes near, so it never slows the
// opening. The illustrated card stays underneath as the fallback.
function lazyMap(host, pin, name) {
  const load = () => {
    if (host.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.className = "venue-map-frame";
    frame.title = `Map showing ${name}`;
    frame.src = osmEmbed(pin);
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.addEventListener("load", () => host.classList.add("has-map"), { once: true });
    host.prepend(frame);
  };
  if (!("IntersectionObserver" in window)) return load();
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    },
    { rootMargin: "600px 0px" },
  );
  io.observe(host);
}
