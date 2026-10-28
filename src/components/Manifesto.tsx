'use client';

import { useI18n } from '@/components/LanguageProvider';
import InkParagraph from '@/components/motion/InkParagraph';
import ScrollReveal from '@/components/ScrollReveal';

const MARQUEE = ['Partikel', 'Treball de Recerca', 'Ins Fontanelles', 'Roboflow × SAM3'];

export default function Manifesto() {
  const { t } = useI18n();

  const stats = [
    { n: '04', l: t('manifesto.s1_l') },
    { n: 'SAM3', l: t('manifesto.s2_l') },
    { n: 'µm', l: t('manifesto.s3_l') },
  ];

  return (
    <section id="manifesto" className="relative scroll-mt-24 py-28 md:py-44">
      <div className="mx-auto grid max-w-[100rem] gap-10 px-6 md:grid-cols-12 md:px-10">
        <div className="md:col-span-3">
          <p className="eyebrow sticky top-32 flex items-center gap-3 text-ink-mute">
            <span className="h-px w-8 bg-ochre" />
            {t('manifesto.eyebrow')}
          </p>
        </div>
        <div className="md:col-span-9">
          <InkParagraph
            text={t('manifesto.body')}
            className="font-display text-[clamp(1.75rem,3.5vw,3.4rem)] font-[350] leading-[1.14] tracking-[-0.02em] text-ink"
          />

          <dl className="mt-20 grid gap-8 sm:grid-cols-3 md:mt-28">
            {stats.map((s, i) => (
              <ScrollReveal key={s.n} order={i} className="border-t border-[var(--hairline-strong)] pt-5">
                <dt className="font-display text-5xl tracking-tight text-ink md:text-6xl">{s.n}</dt>
                <dd className="mt-3 max-w-[14rem] text-sm leading-relaxed text-ink-soft">{s.l}</dd>
              </ScrollReveal>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-28 overflow-hidden border-y border-[var(--hairline)] py-6 md:mt-40" aria-hidden="true">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {[...MARQUEE, ...MARQUEE].map((w, i) => (
                <span key={i} className="flex items-center font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-none tracking-tight text-ink/85">
                  <span className={i % 2 ? 'serif-italic text-teal' : ''}>{w}</span>
                  <span className="mx-8 inline-block h-3 w-3 rounded-full bg-ochre md:mx-12" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
