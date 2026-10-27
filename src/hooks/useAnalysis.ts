"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { cleanDetections, type AnalyzeResult, type Detection, type ImageDims } from "@/lib/roboflow";
import { computeMetrics, classifyShape, DEFAULT_SHAPE_RULES, type Metrics, type ShapeClass } from "@/lib/morphometry";
import { adaptTo, loadDefaultCalibration, type Calibration } from "@/lib/calibration";
import { prMetrics, type Label } from "@/lib/stats";

export interface Filters {
  /** Confidence threshold tau. */
  tau: number;
  /** Minimum polygon area, in image pixels. */
  minAreaPx: number;
  excludeBorder: boolean;
  /** Classes hidden by the user. */
  hiddenClasses: string[];
}

// tau = 0 mirrors the Roboflow dashboard: the workflow already applies its own confidence floor (~0.05).
export const DEFAULT_FILTERS: Filters = { tau: 0, minAreaPx: 20, excludeBorder: false, hiddenClasses: [] };

export interface Row {
  det: Detection;
  metrics: Metrics;
  shape: ShapeClass | null;
}

/** Rescale detections if the model saw a different resolution than the browser. */
function rescale(dets: Detection[], model: ImageDims | null, natural: ImageDims | null): Detection[] {
  if (!model || !natural) return dets;
  const sx = natural.width / model.width;
  const sy = natural.height / model.height;
  if (Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6) return dets;
  return dets.map((d) => ({
    ...d,
    bbox: [d.bbox[0] * sx, d.bbox[1] * sy, d.bbox[2] * sx, d.bbox[3] * sy],
    points: d.points.map((p) => ({ x: p.x * sx, y: p.y * sy })),
  }));
}

export function useAnalysis(result: AnalyzeResult | null, natural: ImageDims | null) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [calibration, setCalibration] = useState<Calibration | null>(() => loadDefaultCalibration());
  const [labels, setLabels] = useState<Record<string, Label | undefined>>({});
  const [misses, setMisses] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset per-result state when a new result arrives (derived-state pattern, no effect).
  const [prevResult, setPrevResult] = useState(result);
  if (prevResult !== result) {
    setPrevResult(result);
    setLabels({});
    setMisses(0);
    setSelectedId(null);
  }

  const dims = natural ?? result?.image ?? null;
  const activeCal = calibration && dims ? adaptTo(calibration, dims) : null;
  const k = activeCal?.k ?? 1;

  const scaleMismatch = !!(result?.image && natural &&
    (Math.abs(result.image.width - natural.width) > 0.5 || Math.abs(result.image.height - natural.height) > 0.5));

  // Heavy work: once per result / calibration, NOT per slider tick.
  const rows: Row[] = useMemo(() => {
    if (!result) return [];
    const dets = cleanDetections(rescale(result.detections, result.image, natural), natural ?? result.image);
    return dets.map((det) => {
      const metrics = computeMetrics(det, k, dims);
      return { det, metrics, shape: classifyShape(metrics, DEFAULT_SHAPE_RULES) };
    });
  }, [result, natural, dims, k]);

  const deferredTau = useDeferredValue(filters.tau);

  const visible = useMemo(() => {
    const hidden = new Set(filters.hiddenClasses);
    return rows.filter(
      (r) =>
        r.det.confidence >= deferredTau &&
        !hidden.has(r.det.cls) &&
        (filters.minAreaPx <= 0 || r.metrics.areaPx >= filters.minAreaPx) &&
        !(filters.excludeBorder && r.metrics.touchesBorder)
    );
  }, [rows, deferredTau, filters.hiddenClasses, filters.minAreaPx, filters.excludeBorder]);

  const counts = useMemo(() => {
    const byClass: Record<string, number> = {};
    const byShape: Record<string, number> = {};
    for (const r of visible) {
      byClass[r.det.cls] = (byClass[r.det.cls] ?? 0) + 1;
      const s = r.shape ?? "invalid";
      byShape[s] = (byShape[s] ?? 0) + 1;
    }
    return { byClass, byShape };
  }, [visible]);

  const classes = useMemo(() => Array.from(new Set(rows.map((r) => r.det.cls))), [rows]);

  const pr = useMemo(
    () =>
      Object.keys(labels).length || misses
        ? prMetrics(rows.map((r) => r.det), labels, misses, deferredTau)
        : null,
    [rows, labels, misses, deferredTau]
  );

  const setLabel = (id: string, l: Label | undefined) =>
    setLabels((prev) => {
      const next = { ...prev };
      if (l) next[id] = l;
      else delete next[id];
      return next;
    });

  return {
    dims,
    rows,
    visible,
    counts,
    classes,
    filters,
    setFilters,
    calibration: activeCal,
    rawCalibration: calibration,
    setCalibration,
    labels,
    setLabel,
    misses,
    setMisses,
    selectedId,
    setSelectedId,
    pr,
    scaleMismatch,
  };
}

export type AnalysisState = ReturnType<typeof useAnalysis>;
