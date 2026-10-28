'use client';

import type { ReactNode } from 'react';
import { useI18n } from '@/components/LanguageProvider';
import RevealText from '@/components/motion/RevealText';
import ScrollReveal from '@/components/ScrollReveal';
import SectionReveal from '@/components/SectionReveal';

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
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
    <SectionReveal id="how" className="relative w-full scroll-mt-24 bg-paper px-6 py-28 md:px-10 md:py-44">
      <div className="mx-auto grid max-w-[100rem] gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-32">
            <p className="eyebrow mb-8 flex items-center gap-3 text-ink-mute">
              <span className="text-ochre">(02)</span>
              <span className="h-px w-8 bg-[var(--hairline-strong)]" />
              {t('how.eyebrow')}
            </p>
            <RevealText
              as="h2"
              text={t('how.heading')}
              className="font-display text-[clamp(2.8rem,6vw,6rem)] font-[350] leading-[0.95] tracking-[-0.035em] text-ink"
              italicClassName="serif-italic text-teal"
            />
            <ScrollReveal order={1}>
              <p className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-ink-soft">{t('how.intro')}</p>
            </ScrollReveal>
          </div>
        </div>

        <ol className="md:col-span-7 md:col-start-6">
          {steps.map((s, i) => (
            <li key={s.n}>
              <ScrollReveal order={i % 2}>
                <div className="group relative grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 overflow-hidden border-t border-[var(--hairline-strong)] py-10 md:grid-cols-[7rem_1fr_auto] md:gap-x-10 md:py-14">
                  <span
                    className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-paper-deep transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
                    aria-hidden="true"
                  />
                  <span className="serif-italic relative font-display text-5xl leading-none text-ink-mute transition-colors duration-500 group-hover:text-teal md:text-7xl">
                    {s.n}
                  </span>
                  <div className="relative transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:translate-x-3">
                    <h3 className="font-display text-3xl tracking-tight text-ink md:text-[2.4rem] md:leading-tight">{s.title}</h3>
                    <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{s.body}</p>
                  </div>
                  <span className="relative hidden h-12 w-12 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-ink-soft transition-all duration-500 group-hover:border-ink group-hover:bg-ink group-hover:text-paper md:flex">
                    {ICONS[i]}
                  </span>
                </div>
              </ScrollReveal>
            </li>
          ))}
          <li aria-hidden="true" className="border-t border-[var(--hairline-strong)]" />
        </ol>
      </div>
    </SectionReveal>
  );
}
