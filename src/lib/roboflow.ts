// Shared types + defensive parsers for the Roboflow "Custom Workflow" (SAM3)
// integration. Pure functions only — safe to import from both the server route
// and (type-only) from the client component.

/** A single SAM3 prediction. Fields are optional because Roboflow's exact
 *  JSON shape varies by block; we read defensively. */
export interface Sam3Prediction {
  class?: string;
  class_name?: string;
  label?: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface Sam3Output {
  predictions?: Sam3Prediction[];
  [key: string]: unknown;
}

export interface Point {
  x: number;
  y: number;
}

/** A detection normalised to ORIGINAL image pixels (top-left bbox origin). */
export interface Detection {
  id: string;
  cls: string;
  classId: number | null;
  confidence: number;
  /** [x0, y0, w, h] — top-left corner, in image pixels. */
  bbox: [number, number, number, number];
  /** Polygon vertices in image pixels (empty if the model gave none). */
  points: Point[];
}

export interface ImageDims {
  width: number;
  height: number;
}

/** Normalised payload that /api/analyze returns to the client. */
export interface AnalyzeResult {
  /** Annotated image as base64 WITHOUT the `data:` prefix (or null). */
  annotatedImage: string | null;
  /** Total objects detected (always derived from detections when available). */
  boxCount: number;
  /** Summary text from `vision_events_message` (or null). */
  message: string | null;
  /** Count per class (lowercased name -> count), derived from `sam_3_output`. */
  classCounts: Record<string, number>;
  /** Detections normalised to image pixels. */
  detections: Detection[];
  /** Dimensions of the image as seen by the model (or null if unknown). */
  image: ImageDims | null;
  /** Roboflow inference id, if the workflow provided one. */
  inferenceId: string | null;
}

export interface AnalyzeErrorResult {
  error: string;
  detail?: string;
}

export type AnalyzeResponse = AnalyzeResult | AnalyzeErrorResult;

const DATA_URL_PREFIX = /^data:.*?;base64,/i;

/** Remove a leading `data:image/...;base64,` prefix if present. */
export function stripDataUrlPrefix(value: string): string {
  return value.replace(DATA_URL_PREFIX, '');
}

/** A Roboflow workflow image output may be a raw base64 string or a wrapper
 *  object such as `{ type: "base64", value: "..." }`. Normalise to base64. */
export function extractBase64Image(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return stripDataUrlPrefix(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['value', 'image', 'base64', 'visualization']) {
      const candidate = obj[key];
      if (typeof candidate === 'string') return stripDataUrlPrefix(candidate);
    }
  }
  return null;
}

/** Pull the predictions array out of `sam_3_output`, whatever its wrapping. */
export function getPredictions(sam3: unknown): Sam3Prediction[] {
  if (!sam3) return [];
  if (Array.isArray(sam3)) return sam3 as Sam3Prediction[];
  if (typeof sam3 === 'object') {
    const preds = (sam3 as Sam3Output).predictions;
    if (Array.isArray(preds)) return preds;
  }
  return [];
}

/** Resolve a prediction's class name (lowercased), trying common field names. */
export function predictionClass(p: Sam3Prediction): string | null {
  const raw = p.class ?? p.class_name ?? p.label;
  return typeof raw === 'string' && raw.trim() ? raw.trim().toLowerCase() : null;
}

/** Count predictions by class name. */
export function countByClass(sam3: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of getPredictions(sam3)) {
    const cls = predictionClass(p);
    if (cls) counts[cls] = (counts[cls] ?? 0) + 1;
  }
  return counts;
}

/** `vision_events_message` is usually a string but can be wrapped. */
export function coerceMessage(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['message', 'output', 'text', 'value']) {
      const candidate = obj[key];
      if (typeof candidate === 'string') return candidate.trim() || null;
    }
  }
  return null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Image dimensions reported by the model, if any. */
export function extractImageDims(sam3: unknown): ImageDims | null {
  if (!sam3 || typeof sam3 !== 'object' || Array.isArray(sam3)) return null;
  const img = (sam3 as { image?: { width?: unknown; height?: unknown } }).image;
  const w = num(img?.width);
  const h = num(img?.height);
  return w && h && w > 0 && h > 0 ? { width: w, height: h } : null;
}

/** Convert raw predictions into Detections in image pixels.
 *  Roboflow x/y are the CENTRE of the box; we store the top-left corner. */
export function normalizeDetections(sam3: unknown): Detection[] {
  const out: Detection[] = [];
  getPredictions(sam3).forEach((p, i) => {
    const raw = p as Record<string, unknown>;
    const cls = predictionClass(p) ?? 'unknown';
    const w = num(raw.width) ?? 0;
    const h = num(raw.height) ?? 0;
    const cx = num(raw.x) ?? 0;
    const cy = num(raw.y) ?? 0;
    const pts: Point[] = [];
    if (Array.isArray(raw.points)) {
      for (const q of raw.points as Array<Record<string, unknown>>) {
        const px = num(q?.x);
        const py = num(q?.y);
        if (px !== null && py !== null) pts.push({ x: px, y: py });
      }
    }
    out.push({
      id: typeof raw.detection_id === 'string' ? raw.detection_id : `det-${i}`,
      cls,
      classId: num(raw.class_id),
      confidence: num(p.confidence) ?? 0,
      bbox: [cx - w / 2, cy - h / 2, w, h],
      points: pts,
    });
  });
  return out;
}

export function countDetectionsByClass(dets: Detection[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of dets) counts[d.cls] = (counts[d.cls] ?? 0) + 1;
  return counts;
}

export interface CleanOptions {
  /** Drop detections whose bbox covers more than this fraction of the image (background masks). */
  maxImageFraction: number;
  /** Class-agnostic IoU above which the lower-confidence detection is dropped. */
  dedupIou: number;
}

export const DEFAULT_CLEAN: CleanOptions = { maxImageFraction: 0.05, dedupIou: 0.5 };

function bboxIou(a: Detection["bbox"], b: Detection["bbox"]): number {
  const ix = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

/** Remove workflow artefacts: giant background masks and cross-class duplicates. */
export function cleanDetections(
  dets: Detection[],
  image: ImageDims | null,
  opts: CleanOptions = DEFAULT_CLEAN
): Detection[] {
  const maxBox = image ? image.width * image.height * opts.maxImageFraction : Infinity;
  const kept = dets
    .filter((d) => d.bbox[2] * d.bbox[3] <= maxBox)
    .sort((a, b) => b.confidence - a.confidence);
  const out: Detection[] = [];
  for (const d of kept) {
    if (!out.some((k) => bboxIou(k.bbox, d.bbox) >= opts.dedupIou)) out.push(d);
  }
  return out;
}
