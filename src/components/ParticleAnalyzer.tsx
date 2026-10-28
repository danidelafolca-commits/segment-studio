'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import type { AnalyzeResult, ImageDims, Point } from '@/lib/roboflow';
import { AnalyzeError, MAX_FILE_BYTES, analyzeFile, imageDims } from '@/lib/analyzeClient';
import { useAnalysis } from '@/hooks/useAnalysis';
import { DEFAULT_SHAPE_RULES } from '@/lib/morphometry';
import DetectionOverlay from '@/components/DetectionOverlay';
import { SWEEP_MS, SonarCount, SonarSweep, rowCenterX, sweepProgressAt } from '@/components/SonarSweep';
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe';
import CalibrationTool, { type CalMode } from '@/components/CalibrationTool';
import ThresholdPanel from '@/components/ThresholdPanel';
import BlankControlPanel, { type BlankSummary } from '@/components/BlankControlPanel';
import MorphometryTable from '@/components/MorphometryTable';
import ExportButton from '@/components/ExportButton';
import { useI18n } from '@/components/LanguageProvider';
import RevealText from '@/components/motion/RevealText';
import ScrollReveal from '@/components/ScrollReveal';
import SectionReveal from '@/components/SectionReveal';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const KNOWN_CLASSES = [
  { key: 'particle', dot: '#14918a' },
  { key: 'fiber', dot: '#2378c4' },
  { key: 'fragment', dot: '#e08a1e' },
  { key: 'sphere', dot: '#8b5cf6' },
] as const;

/** Decode base64 once into a Blob (avoids rebuilding a multi-MB data URL per render). */
function base64ToBlob(b64: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const mime = b64.startsWith('iVBOR') ? 'image/png' : b64.startsWith('R0lGOD') ? 'image/gif' : 'image/jpeg';
  return new Blob([bytes], { type: mime });
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function FlowChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--hairline-strong)] bg-paper px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
      {label}
    </span>
  );
}

export default function ParticleAnalyzer() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<string | null>(null);

  const [naturalState, setNaturalState] = useState<{ file: File; dims: ImageDims } | null>(null);
  const [calMode, setCalMode] = useState<CalMode | null>(null);
  const [calPoints, setCalPoints] = useState<Point[]>([]);
  const [blank, setBlank] = useState<BlankSummary | null>(null);
  const [analysisId, setAnalysisId] = useState('');
  const [annotatedUrl, setAnnotatedUrl] = useState<string | null>(null);
  const [sweepId, setSweepId] = useState<string | null>(null);
  const reducedMotion = useReducedMotionSafe();

  // Natural pixel size of the uploaded image (what all measurements refer to).
  // Keyed by file so a stale value is never used for a newer image.
  const natural = naturalState && naturalState.file === file ? naturalState.dims : null;
  const a = useAnalysis(result, natural);

  // Keep the latest preview URL for unmount cleanup; cancel in-flight requests.
  useEffect(() => {
    previewRef.current = previewUrl;
  }, [previewUrl]);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    if (file) {
      imageDims(file)
        .then((dims) => !cancelled && setNaturalState({ file, dims }))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Annotated image blob URL: created in the analyze handler, revoked here.
  const annotatedRef = useRef<string | null>(null);
  const setAnnotated = (url: string | null) => {
    if (annotatedRef.current) URL.revokeObjectURL(annotatedRef.current);
    annotatedRef.current = url;
    setAnnotatedUrl(url);
  };
  useEffect(
    () => () => {
      if (annotatedRef.current) URL.revokeObjectURL(annotatedRef.current);
    },
    []
  );

  // Pause the decorative background animation while analysing.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('partikel:busy', { detail: loading }));
    return () => {
      window.dispatchEvent(new CustomEvent('partikel:busy', { detail: false }));
    };
  }, [loading]);

  const acceptFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError(t('err.format'));
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(t('err.size'));
      return;
    }
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
    setResult(null);
    setAnnotated(null);
    setCalMode(null);
    setCalPoints([]);
    a.setCalibration(null);
    setBlank(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = '';
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const analyze = async () => {
    if (!file) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnnotated(null);
    try {
      const data = await analyzeFile(file, ctrl.signal);
      if (ctrl.signal.aborted) return;
      const id = newId();
      setAnalysisId(id);
      setSweepId(reducedMotion ? null : id);
      setAnnotated(data.annotatedImage ? URL.createObjectURL(base64ToBlob(data.annotatedImage)) : null);
      setResult(data);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      if (err instanceof AnalyzeError) {
        setError(err.code === 'server' && err.message !== 'server' ? err.message : t(`err.${err.code}`));
      } else {
        setError(t('err.unexpected'));
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setLoading(false);
    setResult(null);
    setAnnotated(null);
    setError(null);
    setFile(null);
    setCalMode(null);
    setCalPoints([]);
    a.setCalibration(null);
    setBlank(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const extraClasses = Object.keys(a.counts.byClass).filter(
    (c) => !KNOWN_CLASSES.some((k) => k.key === c)
  );

  const hasGeometry = a.rows.length > 0 && !!a.dims;
  const picking = calMode !== null && calPoints.length < (calMode === 'circle' ? 3 : 2);
  const onPick = useCallback((p: Point) => setCalPoints((prev) => [...prev, p]), []);

  const sweeping = hasGeometry && sweepId !== null && sweepId === analysisId;
  const onSweepDone = useCallback(() => setSweepId(null), []);
  const sweepWidth = a.dims?.width ?? 1;
  const revealDelays = useMemo(
    () =>
      sweeping
        ? new Map(a.visible.map((r) => [r.det.id, sweepProgressAt(rowCenterX(r), sweepWidth) * SWEEP_MS]))
        : null,
    [sweeping, a.visible, sweepWidth]
  );
  const sweepPoints = useMemo(
    () => (sweeping ? a.visible.map((r) => sweepProgressAt(rowCenterX(r), sweepWidth)) : []),
    [sweeping, a.visible, sweepWidth]
  );

  const getExportInput = () => {
    return {
      blob: file as Blob,
      analysisId,
      file: { name: file?.name ?? '', mime: file?.type ?? '', bytes: file?.size ?? 0 },
      image: a.dims,
      inferenceId: result?.inferenceId ?? null,
      calibration: a.calibration,
      filters: {
        confidenceThreshold: a.filters.tau,
        minAreaPx: a.filters.minAreaPx,
        excludeBorder: a.filters.excludeBorder,
        classes: a.classes.filter((c) => !a.filters.hiddenClasses.includes(c)),
      },
      shapeRules: DEFAULT_SHAPE_RULES,
      objects: a.visible.map((r) => ({ det: r.det, metrics: r.metrics, shape: r.shape, label: a.labels[r.det.id] ?? null })),
      validation: a.pr,
      blank: blank
        ? {
            blankCount: blank.nBlanks,
            sampleDensityPerMm2: blank.sampleDensity,
            correctedDensityPerMm2: blank.corrected,
            lodPerMm2: blank.lod,
            belowLod: blank.belowLod,
          }
        : null,
    };
  };
  const onBlankSummary = useCallback((s: BlankSummary | null) => setBlank(s), []);
  const shapeEntries = useMemo(() => Object.entries(a.counts.byShape), [a.counts.byShape]);
  return (
    <SectionReveal
      id="workspace"
      className="relative w-full scroll-mt-24 bg-paper-deep px-6 py-28 md:px-10 md:py-40"
    >
      <div className="relative mx-auto max-w-[100rem]">
        <div className="mb-16 grid gap-8 md:mb-24 md:grid-cols-12">
          <p className="eyebrow flex items-center gap-3 text-ink-mute md:col-span-3">
            <span className="text-ochre">(01)</span>
            <span className="h-px w-8 bg-[var(--hairline-strong)]" />
            {t('ws.eyebrow')}
          </p>
          <div className="md:col-span-9">
            <RevealText
              as="h2"
              text={t('ws.heading')}
              className="font-display text-[clamp(2.6rem,6.5vw,6.5rem)] font-[350] leading-[0.95] tracking-[-0.035em] text-ink"
              italicClassName="serif-italic text-teal"
            />
            <ScrollReveal order={1}>
              <p className="mt-8 max-w-2xl text-[1.05rem] leading-relaxed text-ink-soft">{t('ws.subtitle')}</p>
            </ScrollReveal>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Left: upload / preview ──────────────────────────────────── */}
          <ScrollReveal className="flex flex-col gap-4" order={0}>
            {!previewUrl ? (
              <div
                role="button"
                tabIndex={0}
                aria-label={t('ws.drag')}
                onClick={() => inputRef.current?.click()}
                onKeyDown={onKeyDown}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                className={`group relative flex min-h-[380px] cursor-pointer flex-col items-center justify-center gap-5 rounded-[28px] border border-dashed px-6 text-center outline-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-ochre/60 ${
                  isDragging
                    ? 'scale-[1.01] border-teal bg-teal/10 shadow-glow'
                    : 'border-ink/25 bg-paper-lift hover:border-ink/50 hover:shadow-lab'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={onInputChange}
                  className="hidden"
                />
                <span
                  className={`flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-500 ${
                    isDragging
                      ? 'border-teal/50 bg-teal/15 text-teal'
                      : 'border-[var(--hairline-strong)] bg-paper text-ink-soft group-hover:-translate-y-1 group-hover:text-teal'
                  }`}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.6" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-3xl tracking-tight text-ink">
                    {isDragging ? t('ws.drop') : t('ws.drag')}
                  </p>
                  <p className="mt-1 text-sm text-ice-blue/65">
                    {t('ws.or')}{' '}
                    <span className="serif-italic text-base text-teal underline decoration-teal/30 underline-offset-4 group-hover:decoration-teal">
                      {t('ws.browse')}
                    </span>
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ice-blue/35">
                  {t('ws.formats')}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-paper-lift shadow-lab">
                <div className="relative aspect-video w-full bg-paper-shade/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={file?.name ?? t('ws.original')}
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft backdrop-blur">
                    {t('ws.original')}
                  </span>
                </div>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="truncate font-mono text-xs text-ice-blue/55">{file?.name}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={reset}
                      disabled={loading}
                      className="cursor-pointer rounded-full border border-[var(--hairline)] px-4 py-2 text-sm font-medium text-ice-blue transition-colors hover:border-ice-blue/50 hover:text-ice-white disabled:opacity-40"
                    >
                      {t('ws.change')}
                    </button>
                    <button
                      onClick={analyze}
                      disabled={loading}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-6 py-2 text-sm font-medium text-paper transition-all duration-500 hover:bg-teal active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Spinner className="h-4 w-4" />
                          {t('ws.analyzing')}
                        </>
                      ) : (
                        t('ws.analyze')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-700/25 bg-red-700/[0.06] px-4 py-3 text-sm text-red-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <p className="text-center font-mono text-[11px] leading-relaxed text-ink-mute">{t('ws.local_note')}</p>
          </ScrollReveal>

          {/* ── Right: results ──────────────────────────────────────────── */}
          <ScrollReveal className="flex flex-col" order={1}>
            {loading ? (
              <div className="flex min-h-[380px] flex-1 flex-col items-center justify-center gap-4 rounded-[28px] border border-[var(--hairline)] bg-paper-lift text-center shadow-lab">
                <Spinner className="h-9 w-9 text-teal" />
                <p className="font-display text-2xl tracking-tight text-ink">{t('ws.analyzing_full')}</p>
                <p className="font-mono text-xs text-ice-blue/45">{t('ws.running')}</p>
              </div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-paper-lift shadow-lab">
                  <div className="relative aspect-video w-full bg-paper-shade/50">
                    {hasGeometry && previewUrl && a.dims ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt={file?.name ?? t('ws.original')} decoding="async" className="h-full w-full object-contain" />
                        <DetectionOverlay
                          dims={a.dims}
                          rows={a.visible}
                          selectedId={a.selectedId}
                          labels={a.labels}
                          onSelect={a.setSelectedId}
                          picking={picking}
                          onPick={onPick}
                          markers={calPoints}
                          markerShape={calMode}
                          revealDelays={revealDelays}
                        />
                        {sweeping && (
                          <SonarSweep key={analysisId} dims={a.dims} rows={a.visible} onDone={onSweepDone} />
                        )}
                      </>
                    ) : annotatedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={annotatedUrl} alt={t('ws.annotated')} decoding="async" className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-ice-blue/50">
                        {t('ws.no_annotated')}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-paper/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-teal backdrop-blur">
                      {t('ws.annotated')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[28px] bg-ink px-7 py-6 text-paper">
                  <div>
                    <p className="eyebrow text-paper/55">{t('ws.detections')}</p>
                    <p className="mt-1 font-display text-lg italic text-paper/90">{t('ws.particles_detected')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-6xl font-[350] tabular-nums tracking-tight text-paper">
                      {sweeping ? (
                        <SonarCount key={analysisId} progressPoints={sweepPoints} total={a.visible.length} />
                      ) : hasGeometry ? (
                        a.visible.length
                      ) : (
                        result.boxCount
                      )}
                    </span>
                    {hasGeometry && (
                      <p className="font-mono text-[11px] text-paper/55">
                        {t('ws.shown')} / {a.rows.length}
                      </p>
                    )}
                  </div>
                </div>

                {hasGeometry && <p className="font-mono text-[11px] text-ink-mute">{t('ws.overlay_note')}</p>}
                {a.scaleMismatch && <p className="font-mono text-[11px] text-warn">{t('ws.scale_warn')}</p>}

                <div className="rounded-2xl border border-[var(--hairline)] bg-paper-lift p-5">
                  <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('ws.breakdown')}</p>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {KNOWN_CLASSES.map(({ key, dot }) => (
                      <li key={key} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--hairline)] bg-paper py-4">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ice-blue/70">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
                          {t(`class.${key}`)}
                        </span>
                        <span className="font-display text-3xl tabular-nums text-ink">
                          {(hasGeometry ? a.counts.byClass : result.classCounts)[key] ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {extraClasses.length > 0 && (
                    <p className="mt-4 font-mono text-xs text-ice-blue/50">
                      {t('ws.other_classes')}{' '}
                      {extraClasses.map((c) => `${c} (${a.counts.byClass[c]})`).join(' · ')}
                    </p>
                  )}
                  {a.calibration && shapeEntries.length > 0 && (
                    <p className="mt-4 font-mono text-xs text-ice-blue/50">
                      {t('morph.shape')}: {shapeEntries.map(([s, n]) => `${s} (${n})`).join(' · ')}
                    </p>
                  )}
                </div>

                {result.message && (
                  <div className="rounded-2xl border border-[var(--hairline)] bg-paper-lift p-5">
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('ws.summary')}</p>
                    <p className="text-sm leading-relaxed text-ice-blue/90">{result.message}</p>
                  </div>
                )}

                {hasGeometry && a.dims && (
                  <>
                    <CalibrationTool
                      dims={a.dims}
                      calibration={a.calibration}
                      onCalibration={a.setCalibration}
                      mode={calMode}
                      onMode={setCalMode}
                      points={calPoints}
                      onPoints={setCalPoints}
                    />
                    <ThresholdPanel a={a} />
                    <BlankControlPanel a={a} onSummary={onBlankSummary} />
                    <MorphometryTable a={a} />
                    <ExportButton getInput={getExportInput} disabled={!file || a.rows.length === 0} />
                  </>
                )}
              </div>
            ) : (
              <div className="relative flex min-h-[380px] flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-[28px] border border-[var(--hairline)] bg-paper/60 px-6 text-center">
                <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
                <div className="relative flex items-center gap-2">
                  <FlowChip label={t('ws.flow_image')} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ice-blue/30"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <FlowChip label={t('ws.flow_detect')} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ice-blue/30"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <FlowChip label={t('ws.flow_count')} />
                </div>
                <p className="relative max-w-xs font-display text-2xl leading-snug tracking-tight text-ink">{t('ws.empty_title')}</p>
                <p className="relative font-mono text-xs text-ink-mute">{t('ws.empty_sub')}</p>
              </div>
            )}
          </ScrollReveal>
        </div>
      </div>
    </SectionReveal>
  );
}
