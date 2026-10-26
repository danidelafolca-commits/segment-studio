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

## Scientific methodology

All measurements are computed client-side from the polygon vertices returned by the
workflow, **in original image pixels**, then scaled by the calibration factor `k`.

| Quantity | Formula |
| --- | --- |
| Area | Shoelace: `A = ½·|Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)|` · `A_real = A_px·k²` |
| Perimeter | `P = Σ‖vᵢ₊₁ − vᵢ‖` · `P_real = P_px·k` |
| ECD | `2·√(A/π)` |
| Feret max/min, min-area rectangle | convex hull (monotone chain) + edge-aligned calipers |
| Circularity | `4πA/P²` |
| Aspect ratio / elongation | `F_min/F_max` / `1 − W/L` |
| Solidity / convexity | `A/A_hull` / `P_hull/P` |
| Fibre length/width | ribbon model `L=(P+√(P²−16A))/4`, `W=A/L` |

**Default shape rules** (exported with every analysis, `src/lib/morphometry.ts`):
fibre if `L/W ≥ 3`; sphere if circularity ≥ 0.85 and AR ≥ 0.8; otherwise fragment
(`irregular` if solidity < 0.9). The morphological class is stored separately from the model class.

**Calibration** (`src/lib/calibration.ts`): line on a known scale, or a circle from 3 points
(e.g. a filter of known diameter). `k = L_real / L_px`; relative uncertainty ≈ `√2·σ/L_px` with
σ = 0.75 px. A calibration is only valid for the pixel grid it was made on.

**Statistical control**: τ (confidence), minimum area and border exclusion are applied
in the browser without calling the API again. Manual TP/FP labels and manual misses give
precision/recall/F1 per τ. Blank control: `ρ_corr = max(0, ρ_sample − mean ρ_blank)`,
`LOD = mean + 3·sd`, `LOQ = mean + 10·sd`, using identical filters and calibration.

**Export** (JSON/CSV): schema v1.0 with analysis id, UTC timestamp, SHA-256 of the image,
app commit, calibration, filters, shape rules, blank correction, validation and one row per object.

### Known limitations

- Polygons are outer contours only (holes are not subtracted).
- Perimeter depends on resolution and vertex simplification; compare `n_vertices` and use the convex-hull descriptors across images.
- Only JPG/PNG are accepted (no 16-bit TIFF); prefer PNG (lossless).
- Images are limited to 3 MB. Do not downscale before calibrating.
- JPEGs with EXIF rotation: coordinates are checked against the browser's decoded size and rescaled if they differ, but prefer pre-rotated images.
- The rate limiter is in-memory per server instance (swap `src/lib/rateLimit.ts` for KV in production).

## Tests

```bash
npm test   # vitest: geometry, morphometry, statistics, calibration
```

## Deploy

Deploy to any Next.js host (e.g. Vercel). Add the environment variables above in the
host's project settings.
