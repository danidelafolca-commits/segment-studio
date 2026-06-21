'use client';

import SeaHero from '@/components/SeaHero';
import { useI18n } from '@/components/LanguageProvider';
import { LetterSwapAppear, LetterSwapPingPong } from '@/components/LetterSwap';

export default function Hero() {
  const { t } = useI18n();

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-ocean-night px-6"
    >
      {/* Animated WebGL sea */}
      <SeaHero className="absolute inset-0 z-0" />

      {/* Scrim: legibility behind the text + fade into the page below */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(0,17,31,0.55), rgba(0,17,31,0.15) 60%, transparent 100%), linear-gradient(to bottom, rgba(0,17,31,0.5) 0%, transparent 28%, transparent 62%, var(--color-ocean-night) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.35em] text-accent drop-shadow-[0_1px_10px_rgba(0,17,31,0.9)]">
          {t('hero.eyebrow')}
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ice-white drop-shadow-[0_2px_30px_rgba(0,17,31,0.9)] md:text-7xl">
          <LetterSwapAppear label={t('hero.title')} />
        </h1>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ice-blue/85 drop-shadow-[0_1px_12px_rgba(0,17,31,0.8)]">
          {t('hero.body')}
        </p>
        <a
          href="#workspace"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#008080,#15b8b8)] px-7 py-3 text-sm font-semibold text-ocean-night shadow-[0_10px_34px_-10px_rgba(21,184,184,0.6)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <LetterSwapPingPong label={t('hero.cta')} />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ice-blue/50">
          {t('hero.scroll')}
        </p>
        <svg
          className="mx-auto mt-2 animate-bounce text-ice-blue/50"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
