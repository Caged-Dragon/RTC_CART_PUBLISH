# Responsive Homepage Banner Fix

## What changed

- The active banner image reports its intrinsic width/height ratio to `HomeBanner.tsx`.
- The frame uses that ratio and `width: 100%`; it has no fixed height, viewport-height cap, or min/max pixel height. This means the banner continuously scales when the viewport changes or browser zoom changes the CSS viewport.
- The active `<picture>` source supplies the ratio, so switching to portrait mobile art also switches the frame to that image's natural proportions.
- `object-fit: contain` keeps all banner artwork visible without stretching or cropping.
- The Shop/WhatsApp CTA row remains in normal document flow after the banner.
- A blurred background fills any letterbox space without obscuring the banner itself.

## Validation

- The regression test checks for image-derived aspect-ratio sizing and rejects fixed/clamped banner heights in the final rules.
- Browser-level build/visual checks still require installing dependencies locally (`npm ci`), then running `npm test`, `npm run lint`, and `npm run build`.

## Run locally

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```
