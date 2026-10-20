# CSS MIME / deployment fix

## Root cause indicated by the browser error

The page requested a generated stylesheet such as `/assets/index-CAdOJ-3A.css`, but the response was `text/html`. The server therefore returned HTML (commonly the SPA index fallback) for a CSS URL. The browser correctly refuses to apply it because the MIME type is wrong. The install-prompt warning is independent; it appeared because the custom component called `preventDefault()` but might never call the saved event's `prompt()` method.

## Changes in this update

- Replaced the catch-all Vercel SPA rewrite with rewrites for actual customer application routes only. Missing hashed assets now return a real missing-asset response instead of `index.html`.
- Disabled caching for `/`, `/index.html`, and `/sw.js` so HTML can't linger with an asset hash from an older build.
- Bumped the service-worker cache version; activation clears old asset caches.
- The service worker validates JS/CSS MIME types and won't cache or return HTML as a stylesheet/script.
- The PWA component leaves `beforeinstallprompt` unprevented so the browser controls its native install prompt. When the browser doesn't expose that API, the app offers platform-specific manual instructions.
- The banner CSS and full UI source were otherwise preserved.

## Verification

- `node --test`: 11 tests pass, including 3 new deployment/PWA regression tests.
- Full Vite production build not run in this workspace because `node_modules/.bin/vite` is absent. Run `npm ci && npm run build` locally or in Vercel.

## Deployment note

Redeploy a **single complete `dist/` build** via Vercel. The code change cannot repair the currently live deployment until it is built and deployed. After deployment, inspect the CSS request in DevTools Network: status `200`, `Content-Type: text/css`. Clear the old service worker/site data once if this browser continues to display the prior response.
