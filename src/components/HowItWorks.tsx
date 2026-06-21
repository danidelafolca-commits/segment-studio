'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import { LetterSwapAppear } from '@/components/LetterSwap';
import ScrollReveal from '@/components/ScrollReveal';
import SectionReveal from '@/components/SectionReveal';

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: ReactNode[] = [
  <svg key="1" {...iconProps}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M12 3v13M7 8l5-5 5 5" />
  </svg>,
  <svg key="2" {...iconProps}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </svg>,
  <svg key="3" {...iconProps}>
    <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </svg>,
  <svg key="4" {...iconProps}>
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>,
];

export default function HowItWorks() {
  const { t } = useI18n();

  const steps = [
    { n: '01', title: t('how.s1.t'), body: t('how.s1.b') },
    { n: '02', title: t('how.s2.t'), body: t('how.s2.b') },
    { n: '03', title: t('how.s3.t'), body: t('how.s3.b') },
    { n: '04', title: t('how.s4.t'), body: t('how.s4.b') },
  ];

  return (
    <SectionReveal
      id="how"
      className="relative w-full scroll-mt-24 bg-ocean-deep/50 px-6 py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-6xl">
        <ScrollReveal className="mb-14 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {t('how.eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ice-white md:text-4xl">
            <LetterSwapAppear label={t('how.heading')} />
          </h2>
        </ScrollReveal>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n} className="h-full">
              <ScrollReveal order={i} className="h-full">
                <div className="group flex h-full flex-col rounded-2xl border border-[var(--hairline)] bg-ocean-night/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lab">
                  <div className="mb-5 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--hairline)] bg-ocean-deep text-accent transition-colors group-hover:bg-accent/10">
                  {ICONS[i]}
                </span>
                <span className="font-mono text-xs tabular-nums text-ice-blue/35">
                  {s.n}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-ice-white">
                <LetterSwapAppear label={s.title} staggerDuration={0.02} />
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ice-blue/70">
                {s.body}
              </p>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </div>
    </SectionReveal>
  );
}
