'use client';

import { useRef, type MouseEvent } from 'react';
import type { Row } from '@/hooks/useAnalysis';
import type { ImageDims, Point } from '@/lib/roboflow';
import type { Label } from '@/lib/stats';
import { circumcircle } from '@/lib/geometry';
import { screenToImage } from '@/lib/calibration';

const CLASS_COLORS: Record<string, string> = {
  particle: '#15b8b8',
  fiber: '#2fd4d4',
  fragment: '#f0a83c',
  sphere: '#a78bfa',
};

export function classColor(cls: string): string {
  return CLASS_COLORS[cls] ?? '#aacbe0';
}

interface Props {
  dims: ImageDims;
  rows: Row[];
  selectedId: string | null;
  labels: Record<string, Label | undefined>;
  onSelect: (id: string | null) => void;
  /** When set, clicks add calibration points instead of selecting. */
  picking?: boolean;
  onPick?: (p: Point) => void;
  markers?: Point[];
  /** Draw the line/circle defined by the markers. */
  markerShape?: 'line' | 'circle' | null;
}

/** SVG layer with viewBox = image pixels. preserveAspectRatio="meet" gives the
 *  exact same transform as `object-contain`, so there is zero drift. */
export default function DetectionOverlay({
  dims,
  rows,
  selectedId,
  labels,
  onSelect,
  picking = false,
  onPick,
  markers = [],
  markerShape = null,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const unit = Math.max(dims.width, dims.height) / 400; // marker size in image px

  const onClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!picking || !svgRef.current || !onPick) return;
    const p = screenToImage(svgRef.current, e.clientX, e.clientY);
    if (p && p.x >= 0 && p.y >= 0 && p.x <= dims.width && p.y <= dims.height) onPick(p);
  };

  const circle = markerShape === 'circle' && markers.length === 3 ? circumcircle(markers[0], markers[1], markers[2]) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${dims.width} ${dims.height}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={onClick}
      className={`absolute inset-0 h-full w-full ${picking ? 'cursor-crosshair' : ''}`}
      role="img"
      aria-label="Detections overlay"
    >
      {rows.map(({ det }) => {
        const selected = det.id === selectedId;
        const color = classColor(det.cls);
        const label = labels[det.id];
        const stroke = label === 'fp' ? '#f87171' : color;
        const common = {
          fill: color,
          fillOpacity: selected ? 0.35 : 0.15,
          stroke,
          strokeWidth: selected ? 3 : 1.5,
          vectorEffect: 'non-scaling-stroke' as const,
          strokeDasharray: label === 'fp' ? '4 3' : undefined,
          style: { cursor: picking ? 'crosshair' : 'pointer' },
          onClick: (e: MouseEvent) => {
            if (picking) return;
            e.stopPropagation();
            onSelect(selected ? null : det.id);
          },
        };
        return det.points.length >= 3 ? (
          <polygon key={det.id} points={det.points.map((p) => `${p.x},${p.y}`).join(' ')} {...common} />
        ) : (
          <rect key={det.id} x={det.bbox[0]} y={det.bbox[1]} width={det.bbox[2]} height={det.bbox[3]} {...common} />
        );
      })}

      {markerShape === 'line' && markers.length === 2 && (
        <line x1={markers[0].x} y1={markers[0].y} x2={markers[1].x} y2={markers[1].y} stroke="#f0f8ff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      )}
      {circle && (
        <circle cx={circle.center.x} cy={circle.center.y} r={circle.radius} fill="none" stroke="#f0f8ff" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
      )}
      {markers.map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={unit} fill="#f0f8ff" stroke="#00111f" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
