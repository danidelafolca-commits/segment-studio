'use client';

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import type { AnalyzeResponse, AnalyzeResult } from '@/lib/roboflow';
import { useI18n } from '@/components/LanguageProvider';
import { LetterSwapAppear } from '@/components/LetterSwap';
import ScrollReveal from '@/components/ScrollReveal';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

const KNOWN_CLASSES = [
  { key: 'particle', dot: '#15b8b8' },
  { key: 'fiber', dot: '#2fd4d4' },
  { key: 'fragment', dot: '#f0a83c' },
] as const;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== 'string') {
        reject(new Error('read'));
        return;
      }
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error('file'));
    reader.readAsDataURL(file);
  });
}

function dataUrlFromBase64(b64: string): string {
  const mime = b64.startsWith('iVBOR')
    ? 'image/png'
    : b64.startsWith('R0lGOD')
      ? 'image/gif'
      : 'image/jpeg';
  return `data:${mime};base64,${b64}`;
}

function isError(r: AnalyzeResponse): r is { error: string; detail?: string } {
  return typeof (r as { error?: unknown }).error === 'string';
}

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
    <span className="rounded-md border border-[var(--hairline)] bg-ocean-night/60 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ice-blue/55">
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

  const acceptFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError(t('err.format'));
      return;
    }
    setError(null);
    setResult(null);
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
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data: AnalyzeResponse = await res.json();
      if (!res.ok || isError(data)) {
        throw new Error(isError(data) ? data.error : t('err.analyze'));
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t('err.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const extraClasses = result
    ? Object.keys(result.classCounts).filter(
        (c) => !KNOWN_CLASSES.some((k) => k.key === c)
      )
    : [];

  return (
    <section
      id="workspace"
      className="relative w-full scroll-mt-24 bg-ocean-night/50 px-6 py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-6xl">
        <ScrollReveal className="mb-12 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {t('ws.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ice-white md:text-4xl">
            <LetterSwapAppear label={t('ws.heading')} />
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ice-blue/80">
            {t('ws.subtitle')}
          </p>
        </ScrollReveal>

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
                className={`group relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 text-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  isDragging
                    ? 'scale-[1.01] border-accent bg-accent/10 shadow-glow'
                    : 'border-ice-blue/20 bg-ocean-deep/40 hover:border-ice-blue/45 hover:bg-ocean-deep/60'
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
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl border transition-colors ${
                    isDragging
                      ? 'border-accent/50 bg-accent/15 text-accent'
                      : 'border-[var(--hairline)] bg-ocean-night/60 text-ice-blue group-hover:text-accent'
                  }`}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.6" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-ice-white">
                    {isDragging ? t('ws.drop') : t('ws.drag')}
                  </p>
                  <p className="mt-1 text-sm text-ice-blue/65">
                    {t('ws.or')}{' '}
                    <span className="font-medium text-accent underline-offset-4 group-hover:underline">
                      {t('ws.browse')}
                    </span>
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ice-blue/35">
                  {t('ws.formats')}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 shadow-lab">
                <div className="relative aspect-video w-full bg-ocean-night">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={file?.name ?? t('ws.original')}
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-ocean-night/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-ice-blue/80 backdrop-blur">
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
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[linear-gradient(110deg,#008080,#15b8b8)] px-6 py-2 text-sm font-semibold text-ocean-night shadow-[0_8px_26px_-10px_rgba(21,184,184,0.6)] transition-transform hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
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
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <p className="text-center font-mono text-xs text-ice-blue/35">{t('ws.local_note')}</p>
          </ScrollReveal>

          {/* ── Right: results ──────────────────────────────────────────── */}
          <ScrollReveal className="flex flex-col" order={1}>
            {loading ? (
              <div className="flex min-h-[340px] flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 text-center shadow-lab">
                <Spinner className="h-9 w-9 text-accent" />
                <p className="font-display text-ice-white">{t('ws.analyzing_full')}</p>
                <p className="font-mono text-xs text-ice-blue/45">{t('ws.running')}</p>
              </div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 shadow-lab">
                  <div className="relative aspect-video w-full bg-ocean-night">
                    {result.annotatedImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dataUrlFromBase64(result.annotatedImage)} alt={t('ws.annotated')} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-ice-blue/50">
                        {t('ws.no_annotated')}
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-ocean-night/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent backdrop-blur">
                      {t('ws.annotated')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-accent/25 bg-accent/[0.08] px-6 py-5">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-ice-blue/55">{t('ws.detections')}</p>
                    <p className="text-sm text-ice-white">{t('ws.particles_detected')}</p>
                  </div>
                  <span className="font-display text-5xl font-bold tabular-nums text-accent">{result.boxCount}</span>
                </div>

                <div className="rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 p-5">
                  <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('ws.breakdown')}</p>
                  <ul className="grid grid-cols-3 gap-3">
                    {KNOWN_CLASSES.map(({ key, dot }) => (
                      <li key={key} className="flex flex-col items-center gap-1 rounded-xl border border-[var(--hairline)] bg-ocean-night/50 py-4">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ice-blue/70">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
                          {t(`class.${key}`)}
                        </span>
                        <span className="font-display text-2xl font-bold tabular-nums text-ice-white">
                          {result.classCounts[key] ?? 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {extraClasses.length > 0 && (
                    <p className="mt-4 font-mono text-xs text-ice-blue/50">
                      {t('ws.other_classes')}{' '}
                      {extraClasses.map((c) => `${c} (${result.classCounts[c]})`).join(' · ')}
                    </p>
                  )}
                </div>

                {result.message && (
                  <div className="rounded-2xl border border-[var(--hairline)] bg-ocean-deep/40 p-5">
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ice-blue/50">{t('ws.summary')}</p>
                    <p className="text-sm leading-relaxed text-ice-blue/90">{result.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-1 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-ice-blue/15 bg-ocean-deep/20 px-6 text-center">
                <div className="flex items-center gap-2">
                  <FlowChip label={t('ws.flow_image')} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ice-blue/30"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <FlowChip label={t('ws.flow_detect')} />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ice-blue/30"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  <FlowChip label={t('ws.flow_count')} />
                </div>
                <p className="text-ice-blue/60">{t('ws.empty_title')}</p>
                <p className="font-mono text-xs text-ice-blue/40">{t('ws.empty_sub')}</p>
              </div>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
