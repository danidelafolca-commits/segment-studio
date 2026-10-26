import { circumcircle, type Pt } from "@/lib/geometry";

export type CalUnit = "mm" | "µm";

export interface Calibration {
  method: "line" | "circle";
  refReal: number;
  unit: CalUnit;
  refPx: number;
  /** Real units per image pixel. */
  k: number;
  /** Relative uncertainty of k (1 sigma, assuming ~0.75 px endpoint error). */
  relUncertainty: number;
  imageDims: { width: number; height: number };
}

const SIGMA_PX = 0.75;
export const MIN_REF_PX = 100;

export function fromLine(
  p1: Pt,
  p2: Pt,
  real: number,
  unit: CalUnit,
  imageDims: { width: number; height: number }
): Calibration | null {
  const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (!(px > 0) || !(real > 0)) return null;
  return {
    method: "line",
    refReal: real,
    unit,
    refPx: px,
    k: real / px,
    relUncertainty: (Math.SQRT2 * SIGMA_PX) / px,
    imageDims,
  };
}

/** Three points on a circular edge (e.g. a membrane filter) + its real diameter. */
export function fromCircle(
  p1: Pt,
  p2: Pt,
  p3: Pt,
  diameter: number,
  unit: CalUnit,
  imageDims: { width: number; height: number }
): Calibration | null {
  const c = circumcircle(p1, p2, p3);
  if (!c || !(diameter > 0)) return null;
  const px = 2 * c.radius;
  return {
    method: "circle",
    refReal: diameter,
    unit,
    refPx: px,
    k: diameter / px,
    relUncertainty: (Math.SQRT2 * SIGMA_PX) / px,
    imageDims,
  };
}

/** A calibration is only valid for the pixel grid it was made on. */
export function isValidFor(cal: Calibration, dims: { width: number; height: number }): boolean {
  return cal.imageDims.width === dims.width && cal.imageDims.height === dims.height;
}

/** Convert a length (px) / area (px^2) to real units. */
export const lengthToReal = (px: number, cal: Calibration) => px * cal.k;
export const areaToReal = (px2: number, cal: Calibration) => px2 * cal.k * cal.k;

/** Area in mm^2 regardless of the calibration unit. */
export function areaMm2(px2: number, cal: Calibration): number {
  const k_mm = cal.unit === "µm" ? cal.k / 1000 : cal.k;
  return px2 * k_mm * k_mm;
}

// ── Persistent instrument profiles ────────────────────────────────────────
const KEY = "partikel.calibrations";
export type CalProfiles = Record<string, Calibration>;

export function loadProfiles(): CalProfiles {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CalProfiles) : {};
  } catch {
    return {};
  }
}

export function saveProfile(name: string, cal: Calibration) {
  try {
    const all = loadProfiles();
    all[name] = cal;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

const DEFAULT_KEY = "partikel.defaultCalibration";

export function loadDefaultCalibration(): Calibration | null {
  try {
    const raw = localStorage.getItem(DEFAULT_KEY);
    return raw ? (JSON.parse(raw) as Calibration) : null;
  } catch {
    return null;
  }
}

export function saveDefaultCalibration(cal: Calibration | null) {
  try {
    if (cal) localStorage.setItem(DEFAULT_KEY, JSON.stringify(cal));
    else localStorage.removeItem(DEFAULT_KEY);
  } catch {}
}

/** Same optics, different pixel grid: rescale k by the width ratio if the aspect ratio matches. */
export function adaptTo(cal: Calibration, dims: { width: number; height: number }): Calibration | null {
  if (isValidFor(cal, dims)) return cal;
  const a = cal.imageDims.width / cal.imageDims.height;
  const b = dims.width / dims.height;
  if (Math.abs(a - b) / a > 0.01) return null;
  const s = cal.imageDims.width / dims.width;
  return { ...cal, k: cal.k * s, refPx: cal.refPx / s, imageDims: { ...dims } };
}

/** Map a client (screen) point to image pixels through an <svg viewBox>. */
export function screenToImage(svg: SVGSVGElement, clientX: number, clientY: number): Pt | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}
