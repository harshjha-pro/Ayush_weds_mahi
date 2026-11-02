# BFI Design System · "Royal Marwari"

Applies to the public website first; the studio/client app adopts the same tokens so the brand is one family. Pending approval (see `01-design-audit.md`).

## Tokens

```css
:root {
  /* Brand */
  --maroon: #641E2B;      --maroon-700: #4E1520;
  --gold: #C6A15B;        --gold-ink: #7E5F24;   /* gold text on light */
  --ivory: #FFF8EC;       --paper: #FFFDF8;      --beige: #E9DCC8;
  --brown: #392820;       --muted: #6E5A4E;
  /* Status (app only, never decorative) */
  --success: #2F6B4F;     --danger: #A4372E;     --info: #3D5A80;
  /* Lines & depth */
  --line: #E6D8C2;        --shadow: 0 1px 2px rgba(57,40,32,.06), 0 8px 24px rgba(57,40,32,.06);
  --radius: 14px;         --radius-sm: 10px;
  /* Type */
  --serif: "Cormorant Garamond", Georgia, serif;
  --sans: Inter, system-ui, sans-serif;
  --deva: "Tiro Devanagari Hindi", serif;
}
```

Dark mode (app only): background `#1E1512`, surface `#2A1E1A`, text `#F4EBDD`, maroon lifts to `#C4687A`, gold stays `#C6A15B`.

## Colour usage
- 80% ivory/paper + brown text · 10% maroon · ≤10% gold + beige.
- Maroon: primary buttons, header-on-scroll bar, closing CTA band, footer, highlighted price card.
- Gold: rules, motifs, icons, focus rings, stars, small accents on maroon. **Never** gold text on ivory below 24 px — use `gold-ink`.
- Beige: alternate section backgrounds, card borders, input borders.
- No navy, no cool greys, no multi-stop gradients.

## Typography
| Style | Font | Size (mobile / desktop) | Weight / tracking |
|---|---|---|---|
| Display (hero) | Cormorant Garamond | 36 / 60 px, line-height 1.05 | 600 |
| H2 | Cormorant Garamond | 28 / 40 | 600 |
| H3 | Cormorant Garamond | 20 / 24 | 700 |
| Eyebrow | Inter | 12 | 600, uppercase, 0.18em, `gold-ink` |
| Body | Inter | 16 / 17 | 400, line-height 1.6, `brown` |
| Small | Inter | 14 | 400, `muted` |
| Price | Cormorant Garamond | 36 | 600, lining numerals |
| Devanagari line | Tiro Devanagari Hindi | 16–18 | 400, `gold-ink` or `gold` on maroon |

## Components
- **Buttons** — 48 px tall, 999px radius (pill, like a gold-edged card), 600 weight.
  - Primary: maroon fill, ivory text, hover maroon-700.
  - Secondary: transparent, 1.5px maroon border, maroon text.
  - On maroon: gold fill, maroon text.
  - Text link: maroon, underline on hover, gold underline offset 3px.
- **Cards** — paper fill, 1px `line` border, radius 14, soft shadow only on hover; optional inner gold hairline 6px inset for "invitation" cards.
- **Price card** — Premium inverted (maroon, gold rule, ivory text).
- **Design preview** — phone frame (rounded 28px, brown bezel) inside an arch-topped beige panel; name in serif below; tier chip.
- **Section heading** — eyebrow + serif H2 + optional lotus divider (gold, 120px wide).
- **Chips/badges** — beige fill, brown text; status colours only in the app.
- **Inputs** — 48px, paper fill, beige border, gold focus ring 3px.
- **Header** — 72px, wordmark left (crest + "BFI" serif + "Marwari Invitations" small caps), links, primary CTA.
- **Footer** — maroon, ivory text, gold double rule on top.

## Motifs (use sparingly — max one per section)
- **Jharokha arch** — hero frame, design preview frame, empty states.
- **Lotus divider** — between heading and content.
- **Double gold rule** — top of footer, around price highlight.
- **Four-dot corner** — corners of invitation-like cards.
All drawn as inline SVG strokes in `gold`, 1.5px, never filled, never animated except a single fade-in.

## Layout & spacing
- 4px base grid; section padding 64px mobile / 112px desktop; content max-width 1160px; reading width 640px.
- Alternate section backgrounds: ivory → beige-tint (#F7EEDF) → ivory.
- Phone gutter 20px; cards full-width on phones; carousels with scroll-snap.

## Motion
- Fade/translate-in 12px on first view, 300ms, once. No parallax, no autoplay carousels, honour `prefers-reduced-motion`.

## Voice
Warm, respectful, concise. Address the family ("your family", "your guests"), use ritual names correctly, avoid tech jargon ("website builder", "SaaS"). One Hindi/Devanagari line per page at most.
