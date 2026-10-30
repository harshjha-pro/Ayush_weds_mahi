# Vendored libraries

Kept in the site (not loaded from a CDN) so the invitation works on its own.

| File | Library | Version | Licence |
|---|---|---|---|
| `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js` | [GSAP](https://gsap.com) | 3.15.0 | GSAP Standard "no charge" licence, https://gsap.com/standard-license |
| `motion.min.js` | [Motion](https://motion.dev) (`animate`, `inView`, `hover`, `press`, `stagger` only, bundled with esbuild) | 14.8.0 | MIT |

To rebuild `motion.min.js`:

```bash
npm i motion@14.8.0 esbuild
echo 'export { animate, inView, hover, press, stagger } from "motion";' > entry.js
npx esbuild entry.js --bundle --format=esm --minify --outfile=js/vendor/motion.min.js
```
