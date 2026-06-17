# Partikel

A computer-vision tool to detect and count **microparticles** (particles, fibers, fragments) in microscopy images, powered by a **Roboflow + SAM3** workflow.

Upload an image, run the workflow on the server, and get back the annotated image, the total count, and a per-class breakdown.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** (scroll-expand hero, scroll-linked reveals, particle field, letter-swap)
- Trilingual UI — **Español / English / Català** (lightweight in-house i18n)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Roboflow values
npm run dev
```

Open http://localhost:3000.

## Environment variables

Set these in `.env.local` (never committed):

| Variable | Required | Description |
| --- | --- | --- |
| `ROBOFLOW_API_KEY` | yes | Private API key from https://app.roboflow.com/settings/api |
| `ROBOFLOW_WORKSPACE_NAME` | yes | Roboflow workspace slug (e.g. `video-analizer`) |
| `ROBOFLOW_WORKFLOW_ID` | no | Workflow id; defaults to `custom-workflow` |

The key is used only on the server in [`src/app/api/analyze/route.ts`](src/app/api/analyze/route.ts) and is never exposed to the browser.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
```

## How it works

1. The browser sends the uploaded image (base64) to `POST /api/analyze`.
2. The route calls the Roboflow serverless workflow
   `https://serverless.roboflow.com/infer/workflows/{workspace}/{workflow}`
   with the server-side API key.
3. The workflow (SAM3 → bounding-box visualization → count) returns the annotated
   image, `box_count`, `sam_3_output` predictions and a summary message, which the
   UI renders as the annotated preview, a big counter and a per-class breakdown.

## Deploy

Deploy to any Next.js host (e.g. Vercel). Add the environment variables above in the
host's project settings.
