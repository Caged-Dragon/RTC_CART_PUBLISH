# Responsive Homepage Banner Fix

## What changed

- Removed the JavaScript-measured `aspectRatio` sizing dependency from `HomeBanner.tsx`.
- The banner frame now scales responsively using viewport width and viewport height, with separate desktop/tablet and mobile sizing rules.
- The complete uploaded image is contained inside the frame (`object-fit: contain`) so artwork is not stretched or cropped.
- A blurred, darkened backdrop fills the unused space around differently proportioned artwork.
- The CTA row remains a normal flex child below the image; it does not overlay or obscure the banner.
- On mobile, landscape uploads fall back to the portrait reference artwork when needed.

## Validation

- `node --test`: all 8 automated tests passed, including the new banner regression check.
- `tsc --noEmit` / production build cannot be completed in this workspace because `node_modules` is absent (React, Lucide and JSX runtime types are therefore unresolved).

## Files changed

- `src/components/HomeBanner.tsx`
- `src/index.css`
- `tests/brand-banner-visibility.test.cjs`
- `README.md`

## Run locally

```bash
npm ci
npm test
npm run lint
npm run build
npm run dev
```
