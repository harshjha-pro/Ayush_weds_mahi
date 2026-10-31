# Storybook illustrations: prompts for full-resolution art

The storybook's pictures (`assets/images/storybook/s01–s10`, `cover`) are
currently cut from the couple's storyboard and enlarged. To make sharper
replacements, use an image model that accepts reference photos (identity
references), one scene at a time, always with the same two face references
and the same style block. Save each result as WebP (about 1200 px tall,
portrait, 4:5 or close) under the same name, and update `width`/`height` in
`js/config.js`. Nothing else needs to change.

**Identity references (attach to every prompt):** `assets/photos/01.jpg`
(both faces, clear, indoor light) and `assets/photos/surprise.jpg` (both
faces, outdoor light), plus the scene's own photo below.

**Style block (paste into every prompt):**
> 2D hand-painted watercolour storybook illustration with fine pencil and ink
> outlines and soft watercolour fills, warm cream paper texture, gentle paint
> variation, soft warm light. Palette: cream, dusty blush, muted sage, soft
> blue, warm brown, restrained gold. The same young Indian couple as in the
> reference photos: keep their face shapes, complexions, eyes, eyebrows,
> smiles, hairstyles and proportions exactly recognisable, natural and
> unexaggerated; not anime, not a caricature, not photorealistic, not 3D.
> Natural hands. No text, no lettering, no borders. Faces fully in frame,
> in the upper-middle of the picture, with breathing room around them.

| File | Scene photo | Scene |
|---|---|---|
| `s01` | `assets/photos/01.jpg` | The two of them smiling together in a close selfie by a large window, warm window light falling across them, leaves just visible outside, a few dust motes in the light. |
| `s02` | `assets/photos/09.jpg` | Sitting together at a small outdoor table at night beneath greenery, warm soft lights glowing among the leaves, gentle distant bokeh. |
| `s03` | `assets/photos/08.jpg` | Sitting close together side by side indoors, relaxed and smiling, as in the photo; soft ambient room light. Do not add a location. |
| `s04` | `assets/photos/07.jpg` | A playful portrait of Mahi alone holding a small red cup near her face, smiling; warm light. Only Mahi. |
| `s05` | `assets/photos/13.jpg` | A daytime selfie of the two of them near open ground with palm trees and a wide sky behind. |
| `s06` | `assets/photos/05.jpg` | At night, Mahi making the playful hand gesture from the photo beside a smiling Ayush; keep the gesture and hands natural. |
| `s07` | `assets/photos/04.jpg` | A warm close-up of both smiling together at night under strings of small warm lights. |
| `s08` | `assets/photos/surprise.jpg` | The sunset photo: the two close together beneath palms, glowing sunset sky; a full, important scene. |
| `s09` | `assets/photos/03.jpg` | The two together on an evening with city lights behind them; no named place. |
| `s10` | `assets/photos/surprise.jpg` (faces) | A grand final scene: the two seen sitting together facing a warm sunset sky, a soft palace and garden silhouette in the distance, delicate florals; the couple is the focal point. No ring, proposal or ceremony. |
| `cover` | `assets/photos/01.jpg` | A small watercolour portrait of the two of them smiling together, head and shoulders, softly fading into cream paper at the edges, with a few blush flowers. Landscape, about 4:3. |
