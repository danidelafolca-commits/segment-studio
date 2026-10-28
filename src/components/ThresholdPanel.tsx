'use client';

import { useMemo } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import type { AnalysisState } from '@/hooks/useAnalysis';
import { bestTau, confidenceHistogram, countCurve, prCurve } from '@/lib/stats';

function MiniChart({ values, tau, kind }: { values: number[]; tau: number; kind: 'bars' | 'line' }) {
  const W = 220;
  const H = 56;
  const max = Math.max(1, ...values);
  const n = values.length;
  const x = (i: number) => (i / (kind === 'bars' ? n : n - 1)) * W;
  const y = (v: number) => H - 3 - (v / max) * (H - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full" aria-hidden="true">
      {kind === 'bars' ? (
        values.map((v, i) => (
          <rect key={i} x={x(i) + 0.5} y={y(v)} width={W / n - 1} height={H - 3 - y(v)} fill="#2e6e68" fillOpacity={0.55} />
        ))
      ) : (
        <polyline fill="none" stroke="#2e6e68" strokeWidth={1.5} points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      )}
      <line x1={tau * W} x2={tau * W} y1={0} y2={H} stroke="#b4582f" strokeOpacity={0.8} strokeDasharray="3 3" />
    </svg>
  );
}

export default function ThresholdPanel({ a, locked = false }: { a: AnalysisState; locked?: boolean }) {
  const { t } = useI18n();
  const { filters, setFilters, rows, classes, pr, labels, misses } = a;

  const dets = useMemo(() => rows.map((r) => r.det), [rows]);
  const hist = useMemo(() => confidenceHistogram(dets, 0.05).map((b) => b.count), [dets]);
  const taus = useMemo(() => Array.from({ length: 101 }, (_, i) => i / 100), []);
  const curve = useMemo(() => countCurve(dets, taus).map((c) => c.n), [dets, taus]);
  const best = useMemo(
    () => (Object.keys(labels).length ? bestTau(prCurve(dets, labels, misses, taus)) : null),
    [dets, labels, misses, taus]
  );

  const fmt = (v: number | null) => (v === null ? '—' : v.toFixed(3));

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-paper-lift p-5">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('thr.title')}</p>

      <label className="flex items-center justify-between font-mono text-xs text-ice-blue/70">
        <span>{t('thr.confidence')} τ</span>
        <span className="text-accent">{filters.tau.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={filters.tau}
        disabled={locked}
        onChange={(e) => setFilters((f) => ({ ...f, tau: parseFloat(e.target.value) }))}
        className="mb-4 w-full accent-[#2e6e68]"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ice-blue/40">{t('thr.histogram')}</p>
          <MiniChart values={hist} tau={filters.tau} kind="bars" />
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ice-blue/40">N(τ)</p>
          <MiniChart values={curve} tau={filters.tau} kind="line" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-ice-blue/80">
        <label className="flex items-center gap-2 font-mono text-xs">
          {t('thr.min_area')}
          <input
            type="number"
            min={0}
            value={filters.minAreaPx}
            disabled={locked}
            onChange={(e) => setFilters((f) => ({ ...f, minAreaPx: Math.max(0, Number(e.target.value) || 0) }))}
            className="w-20 rounded-md border border-[var(--hairline)] bg-ocean-night/60 px-2 py-1 text-ice-white outline-none focus:border-accent"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-mono text-xs">
          <input
            type="checkbox"
            checked={filters.excludeBorder}
            disabled={locked}
            onChange={(e) => setFilters((f) => ({ ...f, excludeBorder: e.target.checked }))}
            className="accent-[#2e6e68]"
          />
          {t('thr.exclude_border')}
        </label>
      </div>

      {classes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {classes.map((c) => {
            const hidden = filters.hiddenClasses.includes(c);
            return (
              <button
                key={c}
                disabled={locked}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    hiddenClasses: hidden ? f.hiddenClasses.filter((x) => x !== c) : [...f.hiddenClasses, c],
                  }))
                }
                className={`cursor-pointer rounded-md border px-2 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  hidden ? 'border-[var(--hairline)] text-ice-blue/30 line-through' : 'border-accent/40 text-accent'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {pr && (
        <div className="mt-4 border-t border-[var(--hairline)] pt-3 font-mono text-xs text-ice-blue/80">
          <p>
            TP {pr.tp} · FP {pr.fp} · FN {pr.fn}
          </p>
          <p>
            {t('thr.precision')} {fmt(pr.precision)} · {t('thr.recall')} {fmt(pr.recall)} · F1 {fmt(pr.f1)}
          </p>
          {best !== null && (
            <button
              onClick={() => setFilters((f) => ({ ...f, tau: best }))}
              disabled={locked}
              className="mt-2 cursor-pointer rounded-md border border-[var(--hairline)] px-2 py-1 text-[11px] uppercase tracking-wider text-ice-blue hover:text-ice-white"
            >
              {t('thr.best')} τ = {best.toFixed(2)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
