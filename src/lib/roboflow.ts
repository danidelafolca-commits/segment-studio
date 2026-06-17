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

/** Normalised payload that /api/analyze returns to the client. */
export interface AnalyzeResult {
  /** Annotated image as base64 WITHOUT the `data:` prefix (or null). */
  annotatedImage: string | null;
  /** Total objects detected (from `box_count`, falling back to predictions). */
  boxCount: number;
  /** Summary text from `vision_events_message` (or null). */
  message: string | null;
  /** Count per class (lowercased name -> count), derived from `sam_3_output`. */
  classCounts: Record<string, number>;
  /** Raw SAM3 predictions, passed through untouched. */
  predictions: Sam3Output | null;
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
