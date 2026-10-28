'use client';

import { useEffect, useState } from 'react';
import type { Row } from '@/hooks/useAnalysis';
import type { ImageDims } from '@/lib/roboflow';
import { classColor } from '@/components/DetectionOverlay';

export const SWEEP_MS = 2600;
/** Width of the glowing band, as a fraction of the image width. */
const BAND = 0.14;

/** Fraction of the sweep (0..1) at which the leading edge reaches image x = `x`. */
export function sweepProgressAt(x: number, width: number): number {
  return Math.min(1, Math.max(0, (x + width * BAND) / (width * (1 + BAND))));
}

export function rowCenterX(r: Row): number {
  return r.det.bbox[0] + r.det.bbox[2] / 2;
}

/** Scan band + sonar pings. Shares the overlay's viewBox so it tracks the
 *  `object-contain` image exactly, letterboxing included. */
export function SonarSweep({ dims, rows, onDone }: { dims: ImageDims; rows: Row[]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, SWEEP_MS + 700);
    return () => clearTimeout(t);
  }, [onDone]);

  const band = dims.width * BAND;
  const unit = Math.max(dims.width, dims.height) / 400;

  return (
    <svg
      viewBox={`0 0 ${dims.width} ${dims.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sonar-band" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3d8a82" stopOpacity="0" />
          <stop offset="0.85" stopColor="#3d8a82" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fbf8f2" stopOpacity="0.6" />
        </linearGradient>
        <clipPath id="sonar-clip">
          <rect width={dims.width} height={dims.height} />
        </clipPath>
      </defs>

      <g clipPath="url(#sonar-clip)">
        <g style={{ animation: `sonar-fade ${SWEEP_MS + 600}ms ease-out both` }}>
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              from={`${-band} 0`}
              to={`${dims.width} 0`}
              dur={`${SWEEP_MS}ms`}
              fill="freeze"
            />
            <rect width={band} height={dims.height} fill="url(#sonar-band)" />
            <rect
              x={band - unit * 0.6}
              width={unit * 0.6}
              height={dims.height}
              fill="#fbf8f2"
              style={{ filter: 'drop-shadow(0 0 6px #d98a5f)' }}
            />
          </g>
        </g>

        {rows.map((r) => {
          const [x, y, w, h] = r.det.bbox;
          const delay = sweepProgressAt(rowCenterX(r), dims.width) * SWEEP_MS;
          return (
            <circle
              key={r.det.id}
              cx={x + w / 2}
              cy={y + h / 2}
              r={Math.max(unit * 3, Math.hypot(w, h) / 2)}
              fill="none"
              stroke={classColor(r.det.cls)}
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              className="sonar-ping"
              style={{ animationDelay: `${delay}ms` }}
            />
          );
        })}
      </g>
    </svg>
  );
}

/** Counter that ticks up exactly as the band passes each detection. */
export function SonarCount({ progressPoints, total }: { progressPoints: number[]; total: number }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const v = Math.min(1, (t - t0) / SWEEP_MS);
      setP(v);
      if (v < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <>{p >= 1 ? total : progressPoints.filter((q) => q <= p).length}</>;
}
