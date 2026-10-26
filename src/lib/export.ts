import type { Detection, ImageDims } from "@/lib/roboflow";
import type { Calibration } from "@/lib/calibration";
import type { Metrics, ShapeClass, ShapeRules } from "@/lib/morphometry";
import type { Label, PrResult } from "@/lib/stats";

export interface ExportObject {
  det: Detection;
  metrics: Metrics;
  shape: ShapeClass | null;
  label: Label | null;
}

export interface RecordInput {
  analysisId: string;
  file: { name: string; mime: string; bytes: number; sha256: string };
  image: ImageDims | null;
  inferenceId: string | null;
  calibration: Calibration | null;
  filters: { confidenceThreshold: number; minAreaPx: number; excludeBorder: boolean; classes: string[] };
  shapeRules: ShapeRules;
  objects: ExportObject[];
  validation: PrResult | null;
  blank: {
    blankCount: number;
    sampleDensityPerMm2: number;
    correctedDensityPerMm2: number;
    lodPerMm2: number;
    belowLod: boolean;
  } | null;
}

export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const round = (v: number, d = 4) => (Number.isFinite(v) ? +v.toFixed(d) : null);

export function buildAnalysisRecord(input: RecordInput) {
  const byClass: Record<string, number> = {};
  const byShape: Record<string, number> = {};
  for (const o of input.objects) {
    byClass[o.det.cls] = (byClass[o.det.cls] ?? 0) + 1;
    const s = o.shape ?? "invalid";
    byShape[s] = (byShape[s] ?? 0) + 1;
  }
  const cal = input.calibration;
  return {
    schema_version: "1.0",
    app: { name: "partikel", commit: process.env.NEXT_PUBLIC_APP_COMMIT ?? "dev" },
    analysis_id: input.analysisId,
    timestamp_utc: new Date().toISOString(),
    image: {
      filename: input.file.name,
      mime: input.file.mime,
      bytes: input.file.bytes,
      sha256: input.file.sha256,
      width_px: input.image?.width ?? null,
      height_px: input.image?.height ?? null,
    },
    roboflow: { inference_id: input.inferenceId },
    calibration: cal
      ? {
          method: cal.method,
          ref_real: cal.refReal,
          unit: cal.unit,
          ref_px: round(cal.refPx),
          k_unit_per_px: cal.k,
          rel_uncertainty: round(cal.relUncertainty, 6),
        }
      : { method: "none", unit: "px", k_unit_per_px: 1 },
    filters: {
      confidence_threshold: input.filters.confidenceThreshold,
      min_area_px: input.filters.minAreaPx,
      exclude_border: input.filters.excludeBorder,
      classes: input.filters.classes,
    },
    shape_rules: {
      fiber_lw_min: input.shapeRules.fiberLwMin,
      sphere_circ_min: input.shapeRules.sphereCircMin,
      sphere_ar_min: input.shapeRules.sphereArMin,
      irregular_solidity_max: input.shapeRules.irregularSolidityMax,
    },
    blank: input.blank
      ? {
          n_blanks: input.blank.blankCount,
          sample_density_per_mm2: round(input.blank.sampleDensityPerMm2, 6),
          corrected_density_per_mm2: round(input.blank.correctedDensityPerMm2, 6),
          lod_per_mm2: round(input.blank.lodPerMm2, 6),
          below_lod: input.blank.belowLod,
        }
      : null,
    summary: { total: input.objects.length, by_class: byClass, by_shape: byShape },
    validation: input.validation,
    objects: input.objects.map(({ det, metrics: m, shape, label }) => ({
      id: det.id,
      class_model: det.cls,
      class_shape: shape,
      confidence: round(det.confidence),
      bbox_px: det.bbox.map((v) => round(v, 2)),
      centroid_px: [round(m.centroidPx.x, 2), round(m.centroidPx.y, 2)],
      n_vertices: m.nVertices,
      area_px: round(m.areaPx, 2),
      area: round(m.area),
      perimeter: round(m.perimeter),
      ecd: round(m.ecd),
      feret_max: round(m.feretMax),
      feret_min: round(m.feretMin),
      aspect_ratio: round(m.aspectRatio),
      elongation: round(m.elongation),
      circularity: round(m.circularity),
      solidity: round(m.solidity),
      convexity: round(m.convexity),
      fiber_length: round(m.fiberLength),
      fiber_width: round(m.fiberWidth),
      self_intersecting: m.selfIntersecting,
      touches_border: m.touchesBorder,
      manual_label: label,
    })),
  };
}

export type AnalysisRecord = ReturnType<typeof buildAnalysisRecord>;

function csvCell(v: unknown, decimal: string): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? String(v) : String(v);
  if (typeof v === "number" && decimal !== ".") s = s.replace(".", decimal);
  return /[",;\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** One row per object (tidy). Audit columns repeat on every row. */
export function toCSV(rec: AnalysisRecord, opts: { delimiter?: "," | ";"; decimal?: "." | "," } = {}): string {
  const delimiter = opts.delimiter ?? ",";
  const decimal = opts.decimal ?? ".";
  const unit = rec.calibration.unit;
  const audit = {
    analysis_id: rec.analysis_id,
    timestamp_utc: rec.timestamp_utc,
    image_sha256: rec.image.sha256,
    image_filename: rec.image.filename,
    unit,
    k_unit_per_px: rec.calibration.k_unit_per_px,
    confidence_threshold: rec.filters.confidence_threshold,
    total_objects: rec.summary.total,
  };
  const rows = rec.objects.map((o) => ({ ...audit, ...o, bbox_px: o.bbox_px.join(" "), centroid_px: o.centroid_px.join(" ") }));
  const header = rows.length ? Object.keys(rows[0]) : Object.keys(audit);
  const lines = [header.join(delimiter)];
  for (const r of rows) {
    lines.push(header.map((h) => csvCell((r as Record<string, unknown>)[h], decimal)).join(delimiter));
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
