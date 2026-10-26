'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import type { AnalysisState } from '@/hooks/useAnalysis';
import { AnalyzeError, analyzeFile, imageDims } from '@/lib/analyzeClient';
import { areaMm2 } from '@/lib/calibration';
import { computeMetrics } from '@/lib/morphometry';
import type { Detection, ImageDims } from '@/lib/roboflow';
import { blankCorrect, type BlankCorrection } from '@/lib/stats';

interface Blank {
  name: string;
  dets: Detection[];
  dims: ImageDims;
}

export interface BlankSummary extends BlankCorrection {
  nBlanks: number;
}

interface Props {
  a: AnalysisState;
  onSummary: (s: BlankSummary | null) => void;
}

export default function BlankControlPanel({ a, onSummary }: Props) {
  const { t } = useI18n();
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { filters, calibration, dims, visible } = a;

  useEffect(() => () => abortRef.current?.abort(), []);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setErr(null);
    try {
      const added: Blank[] = [];
      for (const f of files) {
        const [res, d] = await Promise.all([analyzeFile(f, ctrl.signal), imageDims(f)]);
        added.push({ name: f.name, dets: res.detections, dims: d });
      }
      setBlanks((prev) => [...prev, ...added]);
    } catch (error) {
      if (!(error instanceof AnalyzeError && error.code === 'aborted')) {
        setErr(error instanceof AnalyzeError ? t(`err.${error.code}`) : t('err.unexpected'));
      }
    } finally {
      setBusy(false);
    }
  };

  // Same τ, min-area and border filters as the sample: identical criteria.
  const summary = useMemo<BlankSummary | null>(() => {
    if (!calibration || !dims || blanks.length === 0) return null;
    const hidden = new Set(filters.hiddenClasses);
    const counted = blanks.map((b) => {
      const count = b.dets.filter((d) => {
        if (d.confidence < filters.tau || hidden.has(d.cls)) return false;
        const m = computeMetrics(d, 1, b.dims);
        if (filters.minAreaPx > 0 && m.areaPx < filters.minAreaPx) return false;
        if (filters.excludeBorder && m.touchesBorder) return false;
        return true;
      }).length;
      return { count, area: areaMm2(b.dims.width * b.dims.height, calibration) };
    });
    const sampleArea = areaMm2(dims.width * dims.height, calibration);
    return { ...blankCorrect(visible.length, sampleArea, counted), nBlanks: blanks.length };
  }, [blanks, calibration, dims, filters, visible.length]);

  useEffect(() => onSummary(summary), [summary, onSummary]);

  const f = (v: number) => v.toFixed(3);

  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 p-5">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('blank.title')}</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple onChange={onFiles} className="hidden" />
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="cursor-pointer rounded-full border border-[var(--hairline)] px-4 py-1.5 text-sm text-ice-blue hover:border-ice-blue/50 hover:text-ice-white disabled:opacity-40"
        >
          {busy ? t('ws.analyzing') : t('blank.add')}
        </button>
        {blanks.length > 0 && (
          <button
            onClick={() => setBlanks([])}
            className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-ice-blue/50 hover:text-ice-white"
          >
            {t('blank.clear')} ({blanks.length})
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      {!calibration && <p className="mt-3 text-xs text-[#f0a83c]">{t('blank.need_cal')}</p>}

      {summary && (
        <div className="mt-4 font-mono text-xs text-ice-blue/80">
          <p>{t('blank.same_filters')}</p>
          <p>
            ρ {t('blank.sample')}: {f(summary.sampleDensity)} mm⁻² · ρ {t('blank.blank')}: {f(summary.blankMean)} ± {f(summary.blankSd)}
          </p>
          <p className="text-ice-white">
            {t('blank.corrected')}: {summary.belowLod ? `< LOD (${f(summary.lod)})` : `${f(summary.corrected)} mm⁻²`}
          </p>
          <p className="text-ice-blue/50">
            LOD {f(summary.lod)} · LOQ {f(summary.loq)} mm⁻²
          </p>
        </div>
      )}
    </div>
  );
}
