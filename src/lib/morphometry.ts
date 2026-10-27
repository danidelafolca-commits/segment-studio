import type { Detection } from "@/lib/roboflow";
import {
  convexHull,
  isSelfIntersecting,
  polygonArea,
  polygonCentroid,
  polygonPerimeter,
  rotatingCalipers,
  touchesBorder,
  type Pt,
} from "@/lib/geometry";

export type ShapeClass = "fiber" | "sphere" | "fragment" | "irregular";

export interface ShapeRules {
  /** Fiber if length/width >= this. */
  fiberLwMin: number;
  sphereCircMin: number;
  sphereArMin: number;
  /** Fragment is flagged 'irregular' if solidity < this. */
  irregularSolidityMax: number;
}

export const DEFAULT_SHAPE_RULES: ShapeRules = {
  fiberLwMin: 3,
  sphereCircMin: 0.85,
  sphereArMin: 0.8,
  irregularSolidityMax: 0.9,
};

export interface Metrics {
  valid: boolean;
  nVertices: number;
  /** Always in image pixels. */
  areaPx: number;
  centroidPx: Pt;
  /** Scaled by calibration k (units/px); equals px values when k = 1. */
  area: number;
  perimeter: number;
  ecd: number;
  feretMax: number;
  feretMin: number;
  /** Feret min / max. */
  aspectRatio: number;
  /** 1 - W/L of the min-area rectangle. */
  elongation: number;
  circularity: number;
  solidity: number;
  convexity: number;
  fiberLength: number;
  fiberWidth: number;
  selfIntersecting: boolean;
  touchesBorder: boolean;
}

const EMPTY: Metrics = {
  valid: false,
  nVertices: 0,
  areaPx: 0,
  centroidPx: { x: 0, y: 0 },
  area: 0,
  perimeter: 0,
  ecd: 0,
  feretMax: 0,
  feretMin: 0,
  aspectRatio: 0,
  elongation: 0,
  circularity: 0,
  solidity: 0,
  convexity: 0,
  fiberLength: 0,
  fiberWidth: 0,
  selfIntersecting: false,
  touchesBorder: false,
};

/** Compute all morphometric descriptors. `k` = real units per pixel (1 = px).
 *  Dimensionless ratios are computed from pixel geometry. */
export function computeMetrics(
  det: Detection,
  k = 1,
  dims?: { width: number; height: number } | null
): Metrics {
  const pts = det.points;
  // Box-only detections still need an area / border flag for the client filters.
  const boxOnly = (): Metrics => ({
    ...EMPTY,
    nVertices: pts.length,
    areaPx: det.bbox[2] * det.bbox[3],
    touchesBorder: dims ? touchesBorder(det.bbox, dims) : false,
  });
  if (pts.length < 3) return boxOnly();
  const areaPx = polygonArea(pts);
  if (areaPx <= 0) return boxOnly();

  const perimPx = polygonPerimeter(pts);
  const hull = convexHull(pts);
  const hullArea = polygonArea(hull);
  const hullPerim = polygonPerimeter(hull);
  const { feretMax, feretMin, minRect } = rotatingCalipers(hull);

  const circularity = perimPx > 0 ? Math.min(1, (4 * Math.PI * areaPx) / (perimPx * perimPx)) : 0;
  const solidity = hullArea > 0 ? Math.min(1, areaPx / hullArea) : 0;
  const convexity = perimPx > 0 ? Math.min(1, hullPerim / perimPx) : 0;
  const aspectRatio = feretMax > 0 ? feretMin / feretMax : 0;
  const elongation = minRect.L > 0 ? 1 - minRect.W / minRect.L : 0;

  // Ribbon model: P = 2(L+W), A = L*W. Falls back to Feret max if not ribbon-like.
  let fiberLength = feretMax;
  let fiberWidth = feretMax > 0 ? areaPx / feretMax : 0;
  const disc = perimPx * perimPx - 16 * areaPx;
  if (disc >= 0) {
    fiberLength = (perimPx + Math.sqrt(disc)) / 4;
    fiberWidth = areaPx / fiberLength;
  }

  return {
    valid: true,
    nVertices: pts.length,
    areaPx,
    centroidPx: polygonCentroid(pts),
    area: areaPx * k * k,
    perimeter: perimPx * k,
    ecd: 2 * Math.sqrt(areaPx / Math.PI) * k,
    feretMax: feretMax * k,
    feretMin: feretMin * k,
    aspectRatio,
    elongation,
    circularity,
    solidity,
    convexity,
    fiberLength: fiberLength * k,
    fiberWidth: fiberWidth * k,
    selfIntersecting: isSelfIntersecting(pts),
    touchesBorder: dims ? touchesBorder(det.bbox, dims) : false,
  };
}

export function classifyShape(m: Metrics, rules: ShapeRules = DEFAULT_SHAPE_RULES): ShapeClass | null {
  if (!m.valid) return null;
  const lw = m.fiberWidth > 0 ? m.fiberLength / m.fiberWidth : 0;
  if (lw >= rules.fiberLwMin) return "fiber";
  if (m.circularity >= rules.sphereCircMin && m.aspectRatio >= rules.sphereArMin) return "sphere";
  if (m.solidity < rules.irregularSolidityMax) return "irregular";
  return "fragment";
}
