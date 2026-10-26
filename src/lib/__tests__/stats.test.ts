import { describe, expect, it } from "vitest";
import { bestTau, blankCorrect, countCurve, prCurve, prMetrics } from "@/lib/stats";
import { fromCircle, fromLine } from "@/lib/calibration";
import type { Detection } from "@/lib/roboflow";

const d = (id: string, confidence: number): Detection => ({
  id,
  cls: "x",
  classId: null,
  confidence,
  bbox: [0, 0, 1, 1],
  points: [],
});

describe("stats", () => {
  const dets = [d("a", 0.9), d("b", 0.7), d("c", 0.4), d("e", 0.2)];

  it("count curve is monotonic non-increasing", () => {
    const c = countCurve(dets, [0, 0.3, 0.5, 0.8, 1]);
    expect(c.map((x) => x.n)).toEqual([4, 3, 2, 1, 0]);
  });

  it("precision / recall / F1", () => {
    const labels = { a: "tp", b: "tp", c: "fp", e: "tp" } as const;
    const r = prMetrics(dets, labels, 1, 0.5); // tp=2 fp=0 fn=1 miss + 1 under threshold
    expect(r.tp).toBe(2);
    expect(r.fp).toBe(0);
    expect(r.fn).toBe(2);
    expect(r.precision).toBe(1);
    expect(r.recall).toBeCloseTo(0.5);
    expect(r.f1).toBeCloseTo(2 / 3);
  });

  it("bestTau picks the F1 maximum", () => {
    const labels = { a: "tp", b: "tp", c: "fp", e: "fp" } as const;
    const curve = prCurve(dets, labels, 0, [0.1, 0.5, 0.95]);
    expect(bestTau(curve)).toBe(0.5);
  });

  it("blank correction, LOD and clamping at 0", () => {
    const r = blankCorrect(50, 10, [
      { count: 2, area: 10 },
      { count: 4, area: 10 },
    ]);
    expect(r.sampleDensity).toBe(5);
    expect(r.blankMean).toBeCloseTo(0.3);
    expect(r.corrected).toBeCloseTo(4.7);
    expect(r.belowLod).toBe(false);
    expect(blankCorrect(1, 10, [{ count: 5, area: 10 }]).corrected).toBe(0);
  });
});

describe("calibration", () => {
  const dims = { width: 1000, height: 1000 };
  it("line: k = real / px and uncertainty shrinks with length", () => {
    const c = fromLine({ x: 0, y: 0 }, { x: 300, y: 400 }, 1, "mm", dims)!;
    expect(c.refPx).toBeCloseTo(500);
    expect(c.k).toBeCloseTo(0.002);
    expect(c.relUncertainty).toBeLessThan(0.003);
  });

  it("circle from 3 points", () => {
    const c = fromCircle({ x: 100, y: 0 }, { x: 0, y: 100 }, { x: -100, y: 0 }, 25, "mm", dims)!;
    expect(c.refPx).toBeCloseTo(200);
    expect(c.k).toBeCloseTo(0.125);
  });

  it("rejects non-positive input", () => {
    expect(fromLine({ x: 0, y: 0 }, { x: 0, y: 0 }, 1, "mm", dims)).toBeNull();
    expect(fromLine({ x: 0, y: 0 }, { x: 1, y: 0 }, 0, "mm", dims)).toBeNull();
  });
});
