import { describe, expect, it } from "vitest";
import {
  circumcircle,
  convexHull,
  isSelfIntersecting,
  polygonArea,
  polygonPerimeter,
  rotatingCalipers,
} from "@/lib/geometry";
import { classifyShape, computeMetrics } from "@/lib/morphometry";
import type { Detection } from "@/lib/roboflow";

const det = (pts: [number, number][]): Detection => ({
  id: "t",
  cls: "x",
  classId: null,
  confidence: 1,
  bbox: [0, 0, 1, 1],
  points: pts.map(([x, y]) => ({ x, y })),
});

const circle = (r: number, n = 360): [number, number][] =>
  Array.from({ length: n }, (_, i) => [
    100 + r * Math.cos((2 * Math.PI * i) / n),
    100 + r * Math.sin((2 * Math.PI * i) / n),
  ]);

describe("geometry", () => {
  const unit = det([[0, 0], [1, 0], [1, 1], [0, 1]]).points;

  it("unit square: A=1, P=4", () => {
    expect(polygonArea(unit)).toBeCloseTo(1);
    expect(polygonPerimeter(unit)).toBeCloseTo(4);
  });

  it("reverse orientation gives the same area", () => {
    expect(polygonArea([...unit].reverse())).toBeCloseTo(1);
  });

  it("10x1 rectangle: AR=0.1, Feret max=sqrt(101)", () => {
    const m = computeMetrics(det([[0, 0], [10, 0], [10, 1], [0, 1]]));
    expect(m.aspectRatio).toBeCloseTo(0.1);
    expect(m.feretMax).toBeCloseTo(Math.sqrt(101));
    expect(classifyShape(m)).toBe("fiber");
  });

  it("circle: circularity > 0.999 and classified as sphere", () => {
    const m = computeMetrics(det(circle(50)));
    expect(m.circularity).toBeGreaterThan(0.999);
    expect(classifyShape(m)).toBe("sphere");
  });

  it("calibration scales: area by k^2, length by k", () => {
    const m = computeMetrics(det([[0, 0], [10, 0], [10, 10], [0, 10]]), 0.5);
    expect(m.area).toBeCloseTo(25);
    expect(m.perimeter).toBeCloseTo(20);
  });

  it("degenerate polygon is invalid", () => {
    expect(computeMetrics(det([[0, 0], [1, 1]])).valid).toBe(false);
    expect(computeMetrics(det([[0, 0], [1, 1], [2, 2]])).valid).toBe(false);
  });

  it("hull + calipers on a square", () => {
    const r = rotatingCalipers(convexHull(unit));
    expect(r.feretMax).toBeCloseTo(Math.SQRT2);
    expect(r.feretMin).toBeCloseTo(1);
  });

  it("detects a bow-tie self-intersection", () => {
    expect(isSelfIntersecting(det([[0, 0], [1, 1], [1, 0], [0, 1]]).points)).toBe(true);
    expect(isSelfIntersecting(unit)).toBe(false);
  });

  it("circumcircle of 3 known points", () => {
    const c = circumcircle({ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 });
    expect(c?.center.x).toBeCloseTo(0);
    expect(c?.center.y).toBeCloseTo(0);
    expect(c?.radius).toBeCloseTo(1);
    expect(circumcircle({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBeNull();
  });
});
