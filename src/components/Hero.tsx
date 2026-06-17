'use client';

import ScrollExpandMedia from '@/components/ScrollExpandMedia';
import { useI18n } from '@/components/LanguageProvider';
import { LetterSwapAppear, LetterSwapPingPong } from '@/components/LetterSwap';

export default function Hero() {
  const { t } = useI18n();

  return (
    <div id="top">
      <h1 className="sr-only">Partikel — {t('hero.title')}</h1>
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="/hero-video.mp4"
        bgImageSrc="/hero-bg-cliffs.jpg"
        title={t('hero.title')}
        date={t('hero.eyebrow')}
        scrollToExpand={t('hero.scroll')}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="font-display text-2xl font-bold tracking-tight text-ice-white md:text-3xl">
            <LetterSwapAppear label={t('hero.kicker')} />
          </h3>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ice-blue/85">
            {t('hero.body')}
          </p>
          <a
            href="#workspace"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(110deg,#008080,#15b8b8)] px-7 py-3 text-sm font-semibold text-ocean-night shadow-[0_10px_34px_-10px_rgba(21,184,184,0.55)] transition-transform hover:scale-[1.03] active:scale-95"
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
      </ScrollExpandMedia>
    </div>
  );
}
