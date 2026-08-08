<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6b34e34d-7dd3-45d8-b1a7-09ad28b9be3e

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (see `.env.example`)
3. Run the app: `npm run dev`

## Deploy on Vercel

This app is a Vite SPA + Express API. Vercel serves the static `dist/` build and runs `/api` as a serverless function.

1. Push this repo to GitHub and import it in Vercel
2. Framework preset: **Vite** (or leave `vercel.json` to set build/output)
3. Add Environment Variable: `GEMINI_API_KEY` = your Gemini key
4. Deploy

After deploy, check:
- `https://YOUR_APP.vercel.app/api/cars` — should return JSON listings
- Browse page should show cars with remote image URLs

Rebuild the inventory anytime with: `npm run rebuild:db`
