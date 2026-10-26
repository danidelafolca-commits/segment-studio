// Pure geometry helpers. All inputs/outputs are in the SAME unit (image pixels
// unless the caller scales them). No DOM, no React.

export interface Pt {
  x: number;
  y: number;
}

/** Signed shoelace area (positive for counter-clockwise in a y-up system). */
export function polygonSignedArea(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** Shoelace (Gauss) area, always >= 0. */
export function polygonArea(p: Pt[]): number {
  return Math.abs(polygonSignedArea(p));
}

export function polygonPerimeter(p: Pt[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return s;
}

export function polygonCentroid(p: Pt[]): Pt {
  const A = polygonSignedArea(p);
  if (Math.abs(A) < 1e-12) {
    const n = p.length || 1;
    return { x: p.reduce((s, q) => s + q.x, 0) / n, y: p.reduce((s, q) => s + q.y, 0) / n };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    const c = a.x * b.y - b.x * a.y;
    cx += (a.x + b.x) * c;
    cy += (a.y + b.y) * c;
  }
  return { x: cx / (6 * A), y: cy / (6 * A) };
}

/** Convex hull, Andrew's monotone chain. Returns CCW hull without repeats. */
export function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export interface CalipersResult {
  feretMax: number;
  feretMin: number;
  /** Minimum-area oriented rectangle: L >= W. */
  minRect: { L: number; W: number; angle: number };
}

/** Feret diameters and min-area bounding rectangle via edge-aligned projection
 *  on the convex hull (equivalent to rotating calipers; O(h^2), h = hull size). */
export function rotatingCalipers(hull: Pt[]): CalipersResult {
  const n = hull.length;
  if (n === 0) return { feretMax: 0, feretMin: 0, minRect: { L: 0, W: 0, angle: 0 } };
  if (n === 1) return { feretMax: 0, feretMin: 0, minRect: { L: 0, W: 0, angle: 0 } };

  let feretMax = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      feretMax = Math.max(feretMax, Math.hypot(hull[i].x - hull[j].x, hull[i].y - hull[j].y));

  if (n === 2) return { feretMax, feretMin: 0, minRect: { L: feretMax, W: 0, angle: 0 } };

  let feretMin = Infinity;
  let best = { L: 0, W: 0, angle: 0, area: Infinity };
  for (let i = 0; i < n; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % n];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 1e-12) continue;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const p of hull) {
      const u = (p.x - a.x) * ux + (p.y - a.y) * uy;
      const v = -(p.x - a.x) * uy + (p.y - a.y) * ux;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const w = maxU - minU;
    const h = maxV - minV;
    feretMin = Math.min(feretMin, h);
    const area = w * h;
    if (area < best.area) {
      const L = Math.max(w, h);
      const W = Math.min(w, h);
      const angle = Math.atan2(uy, ux) + (h > w ? Math.PI / 2 : 0);
      best = { L, W, angle, area };
    }
  }
  if (!Number.isFinite(feretMin)) feretMin = 0;
  return { feretMax, feretMin, minRect: { L: best.L, W: best.W, angle: best.angle } };
}

function segmentsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** O(n^2) self-intersection test; skip for very large polygons (returns false). */
export function isSelfIntersecting(p: Pt[], maxVertices = 500): boolean {
  const n = p.length;
  if (n < 4 || n > maxVertices) return false;
  for (let i = 0; i < n; i++) {
    const a1 = p[i];
    const a2 = p[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent through closure
      if (segmentsIntersect(a1, a2, p[j], p[(j + 1) % n])) return true;
    }
  }
  return false;
}

/** True if the bbox [x0,y0,w,h] lies within `margin` px of any image edge. */
export function touchesBorder(
  bbox: [number, number, number, number],
  dims: { width: number; height: number },
  margin = 1
): boolean {
  const [x, y, w, h] = bbox;
  return x <= margin || y <= margin || x + w >= dims.width - margin || y + h >= dims.height - margin;
}

/** Circle through three points. Returns null if they are collinear. */
export function circumcircle(a: Pt, b: Pt, c: Pt): { center: Pt; radius: number } | null {
  const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(D) < 1e-12) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / D;
  const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / D;
  return { center: { x: ux, y: uy }, radius: Math.hypot(a.x - ux, a.y - uy) };
}
