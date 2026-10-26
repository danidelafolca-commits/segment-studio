import type { Detection } from "@/lib/roboflow";

export type Label = "tp" | "fp";

export function confidenceHistogram(dets: Detection[], binWidth = 0.05): { start: number; count: number }[] {
  const n = Math.ceil(1 / binWidth);
  const bins = Array.from({ length: n }, (_, i) => ({ start: +(i * binWidth).toFixed(4), count: 0 }));
  for (const d of dets) {
    const i = Math.min(n - 1, Math.max(0, Math.floor(d.confidence / binWidth)));
    bins[i].count++;
  }
  return bins;
}

/** N(tau): number of detections with confidence >= tau, for each tau. */
export function countCurve(dets: Detection[], taus: number[]): { tau: number; n: number }[] {
  return taus.map((tau) => ({ tau, n: dets.filter((d) => d.confidence >= tau).length }));
}

export interface PrResult {
  tp: number;
  fp: number;
  fn: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

/** Precision/recall at threshold tau from manual labels.
 *  `misses` = objects the model never detected (added manually). */
export function prMetrics(
  dets: Detection[],
  labels: Record<string, Label | undefined>,
  misses: number,
  tau: number
): PrResult {
  let tp = 0;
  let fp = 0;
  let missedByThreshold = 0;
  for (const d of dets) {
    const l = labels[d.id];
    if (!l) continue;
    if (d.confidence >= tau) {
      if (l === "tp") tp++;
      else fp++;
    } else if (l === "tp") missedByThreshold++;
  }
  const fn = misses + missedByThreshold;
  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null;
  const f1 =
    precision !== null && recall !== null && precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null;
  return { tp, fp, fn, precision, recall, f1 };
}

export function prCurve(
  dets: Detection[],
  labels: Record<string, Label | undefined>,
  misses: number,
  taus: number[]
): (PrResult & { tau: number })[] {
  return taus.map((tau) => ({ tau, ...prMetrics(dets, labels, misses, tau) }));
}

/** Threshold that maximises F1 (null if there are no labels). */
export function bestTau(curve: (PrResult & { tau: number })[]): number | null {
  let best: { tau: number; f1: number } | null = null;
  for (const c of curve) if (c.f1 !== null && (!best || c.f1 > best.f1)) best = { tau: c.tau, f1: c.f1 };
  return best ? best.tau : null;
}

export interface BlankCorrection {
  /** Objects per area unit. */
  sampleDensity: number;
  blankMean: number;
  blankSd: number;
  corrected: number;
  lod: number;
  loq: number;
  belowLod: boolean;
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const sd = (v: number[]) => {
  if (v.length < 2) return 0;
  const m = mean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1));
};

/** Blank-corrected density. Areas must share the same unit (e.g. mm^2). */
export function blankCorrect(
  sampleCount: number,
  sampleArea: number,
  blanks: { count: number; area: number }[]
): BlankCorrection {
  const sampleDensity = sampleArea > 0 ? sampleCount / sampleArea : 0;
  const dens = blanks.filter((b) => b.area > 0).map((b) => b.count / b.area);
  const blankMean = mean(dens);
  const blankSd = sd(dens);
  const lod = blankMean + 3 * blankSd;
  const loq = blankMean + 10 * blankSd;
  return {
    sampleDensity,
    blankMean,
    blankSd,
    corrected: Math.max(0, sampleDensity - blankMean),
    lod,
    loq,
    belowLod: dens.length > 0 && sampleDensity < lod,
  };
}
