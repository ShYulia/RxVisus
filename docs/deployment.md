# Deployment

## Live PWA

**https://rxkit.pages.dev** — the current production deployment.
Installable straight from the browser (Add to Home Screen on
iOS/Android, Install App on desktop Chrome/Edge). Verified working: it
loads correctly, registers its service worker, and serves the same
`manifest.json` committed at `public/manifest.json`.

Cloudflare Pages also publishes a unique URL for every individual
deployment (of the form `https://<hash>.rxkit.pages.dev`), which stays
live even after a newer deployment becomes production. Those are useful
for pointing at one specific build, but `rxkit.pages.dev` is the one to
share — it always resolves to whatever is currently in production.

## Hosting

Hosted on **Cloudflare Pages**, project `rxkit`. The deployed site is
the static output of `npm run build` (the `dist/` folder), which
`vite-plugin-pwa` turns into an installable PWA — service worker and
manifest — as part of that same build. No backend, no server-side code.

## How the deployment relates to this repository

- `dist/` is build output and is **gitignored** — it's never committed,
  so the repository itself doesn't contain "the deployed code," only
  the source that produces it.
- There's currently **no CI/CD pipeline** wired into this repo (no
  GitHub Actions workflow, no `wrangler.toml`). Deploying is a manual
  step today: build locally with `npm run build`, then push the
  resulting `dist/` to the Cloudflare Pages project.
- Because of that, **the live site can lag behind the repository's
  latest commit** if a new build hasn't been deployed since a change
  landed. There's no automatic guarantee they're in sync — check the
  live URL directly, or redeploy, if that matters for what you're doing.

## Android

Further along in build tooling than in distribution: a signed release
build exists locally (Capacitor, with release signing configured), but
it hasn't been published to Google Play. See
[README.md](../README.md#status) for current status.
