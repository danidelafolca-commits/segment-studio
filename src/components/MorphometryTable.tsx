'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import type { AnalysisState, Row } from '@/hooks/useAnalysis';

type SortKey = 'confidence' | 'ecd' | 'feretMax' | 'aspectRatio' | 'circularity' | 'solidity';

const num = (v: number, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : '—');

function sortValue(r: Row, k: SortKey): number {
  return k === 'confidence' ? r.det.confidence : r.metrics[k];
}

export default function MorphometryTable({ a }: { a: AnalysisState }) {
  const { t } = useI18n();
  const [key, setKey] = useState<SortKey>('confidence');
  const [desc, setDesc] = useState(true);
  const unit = a.calibration?.unit ?? 'px';

  const sorted = useMemo(() => {
    const v = [...a.visible];
    v.sort((x, y) => (sortValue(x, key) - sortValue(y, key)) * (desc ? -1 : 1));
    return v.slice(0, 300);
  }, [a.visible, key, desc]);

  const head = (k: SortKey, label: string) => (
    <th
      className="cursor-pointer whitespace-nowrap px-2 py-1.5 text-left font-medium hover:text-ice-white"
      onClick={() => (k === key ? setDesc(!desc) : (setKey(k), setDesc(true)))}
    >
      {label}
      {k === key ? (desc ? ' ↓' : ' ↑') : ''}
    </th>
  );

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-paper-lift p-5">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ice-blue/50">
        {t('morph.title')} <span className="text-ice-blue/35">({a.visible.length})</span>
      </p>
      <div className="max-h-72 overflow-auto" data-lenis-prevent>
        <table className="w-full font-mono text-[11px] text-ink-soft">
          <thead className="sticky top-0 bg-ocean-deep text-ice-blue/50">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">ID</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('morph.class')}</th>
              <th className="px-2 py-1.5 text-left font-medium">{t('morph.shape')}</th>
              {head('confidence', t('thr.confidence'))}
              {head('ecd', `ECD (${unit})`)}
              {head('feretMax', `Feret (${unit})`)}
              {head('aspectRatio', 'AR')}
              {head('circularity', t('morph.circ'))}
              {head('solidity', t('morph.solidity'))}
              <th className="px-2 py-1.5 text-left font-medium">TP/FP</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const sel = r.det.id === a.selectedId;
              const l = a.labels[r.det.id];
              return (
                <tr
                  key={r.det.id}
                  onClick={() => a.setSelectedId(sel ? null : r.det.id)}
                  className={`cursor-pointer border-t border-[var(--hairline)] ${sel ? 'bg-accent/15' : 'hover:bg-ocean-night/50'}`}
                >
                  <td className="px-2 py-1">{i + 1}</td>
                  <td className="px-2 py-1">{r.det.cls}</td>
                  <td className="px-2 py-1">{r.shape ?? '—'}</td>
                  <td className="px-2 py-1">{num(r.det.confidence, 2)}</td>
                  <td className="px-2 py-1">{num(r.metrics.ecd, 2)}</td>
                  <td className="px-2 py-1">{num(r.metrics.feretMax, 2)}</td>
                  <td className="px-2 py-1">{num(r.metrics.aspectRatio, 2)}</td>
                  <td className="px-2 py-1">{num(r.metrics.circularity, 2)}</td>
                  <td className="px-2 py-1">{num(r.metrics.solidity, 2)}</td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => a.setLabel(r.det.id, l === 'tp' ? undefined : 'tp')}
                      className={`mr-1 cursor-pointer rounded px-1.5 ${l === 'tp' ? 'bg-accent text-ocean-night' : 'border border-[var(--hairline)]'}`}
                    >
                      TP
                    </button>
                    <button
                      onClick={() => a.setLabel(r.det.id, l === 'fp' ? undefined : 'fp')}
                      className={`cursor-pointer rounded px-1.5 ${l === 'fp' ? 'bg-red-700 text-paper' : 'border border-[var(--hairline)]'}`}
                    >
                      FP
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-xs text-ice-blue/70">
        <span>{t('morph.misses')}:</span>
        <button onClick={() => a.setMisses(Math.max(0, a.misses - 1))} className="cursor-pointer rounded border border-[var(--hairline)] px-2">−</button>
        <span className="text-ice-white">{a.misses}</span>
        <button onClick={() => a.setMisses(a.misses + 1)} className="cursor-pointer rounded border border-[var(--hairline)] px-2">+</button>
      </div>
    </div>
  );
}
