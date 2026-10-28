'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe';
import SeaHero from '@/components/SeaHero';
import { useI18n } from '@/components/LanguageProvider';
import { LetterSwapPingPong } from '@/components/LetterSwap';
import RevealText, { plain } from '@/components/motion/RevealText';
import Magnetic from '@/components/motion/Magnetic';
import { useIntroDone } from '@/components/motion/intro';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const { t } = useI18n();
  const ready = useIntroDone();
  const reduced = useReducedMotionSafe();
  const frameRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'end start'] });
  const frameScale = useTransform(scrollYProgress, [0, 0.5], [0.94, 1]);
  const innerY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const radius = useTransform(scrollYProgress, [0, 0.5], [48, 20]);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: ready || reduced ? { opacity: 1, y: 0 } : undefined,
    transition: reduced ? { duration: 0 } : { duration: 1.1, ease: EASE, delay },
  });

  const meta = [
    { l: t('hero.meta.project_l'), v: t('hero.meta.project') },
    { l: t('hero.meta.author_l'), v: 'Quim Espigares Montes' },
    { l: t('hero.meta.tutor_l'), v: 'Irene Royo Garcia' },
    { l: t('hero.meta.centre_l'), v: t('hero.meta.centre') },
    { l: t('hero.meta.field_l'), v: t('hero.meta.field') },
  ];

  return (
    <section id="top" className="relative overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-[100rem]">
        {/* Running head */}
        <motion.div {...fadeUp(0.1)} className="eyebrow mb-10 flex items-center justify-between text-ink-mute md:mb-14">
          <span>
            <span className="text-ochre">●</span>&nbsp;&nbsp;{t('hero.eyebrow')}
          </span>
          <span className="hidden sm:inline">Ins Fontanelles — {new Date().getFullYear()}</span>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-[clamp(3.4rem,12.4vw,13rem)] font-[350] leading-[0.86] tracking-[-0.045em] text-ink">
          <span className="sr-only">{`${t('hero.title_a')} ${plain(t('hero.title_b'))}`}</span>
          <span aria-hidden="true" className="block">
            <RevealText text={t('hero.title_a')} className="block" play={ready} stagger={0.08} duration={1.3} />
          </span>
          <span aria-hidden="true" className="mt-1 grid items-end gap-8 md:grid-cols-12">
            <RevealText
              text={t('hero.title_b')}
              className="block md:col-span-8 md:col-start-2"
              italicClassName="serif-italic text-teal"
              play={ready}
              delay={0.18}
              duration={1.3}
            />
            <span className="hidden md:col-span-3 md:block" />
          </span>
        </h1>

        {/* Lede + CTA */}
        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
          <motion.p
            {...fadeUp(0.55)}
            className="font-display text-2xl leading-snug tracking-tight text-ink md:col-span-4 md:text-[1.7rem]"
          >
            <span className="serif-italic">{t('hero.kicker')}</span>
          </motion.p>
          <motion.div {...fadeUp(0.65)} className="md:col-span-5 md:col-start-6">
            <p className="max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">{t('hero.body')}</p>
            <Magnetic className="mt-8">
              <a
                href="#workspace"
                className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pl-6 pr-3 text-sm font-medium text-paper transition-colors duration-500 hover:bg-teal"
              >
                <LetterSwapPingPong label={t('hero.cta')} />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </span>
              </a>
            </Magnetic>
          </motion.div>
        </div>

        {/* Project sheet */}
        <dl className="mt-20 grid grid-cols-2 gap-x-6 gap-y-8 md:mt-28 md:grid-cols-5">
          {meta.map((m, i) => (
            <motion.div key={m.l} {...fadeUp(0.75 + i * 0.07)} className="border-t border-[var(--hairline-strong)] pt-4">
              <dt className="eyebrow text-ink-mute">{m.l}</dt>
              <dd className="mt-2 text-[0.95rem] leading-snug text-ink">{m.v}</dd>
            </motion.div>
          ))}
        </dl>

        {/* Figure: engraved wave field */}
        <motion.figure {...fadeUp(1)} className="mt-16 md:mt-24">
          <motion.div
            ref={frameRef}
            style={reduced ? { scale: 1, borderRadius: 20 } : { scale: frameScale, borderRadius: radius }}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-paper-deep sm:aspect-[16/8] lg:aspect-[16/7]"
          >
            <motion.div style={{ y: reduced ? '0%' : innerY }} className="absolute inset-[-10%_0]">
              <SeaHero className="absolute inset-0" />
            </motion.div>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(233,226,211,0.9) 0%, rgba(233,226,211,0) 30%), radial-gradient(ellipse at 50% 120%, rgba(233,226,211,0) 40%, rgba(233,226,211,0.6) 100%)',
              }}
            />
            <span className="eyebrow absolute left-5 top-5 text-ink-soft md:left-7 md:top-7">Partikel — TdR</span>
            <span className="eyebrow absolute right-5 top-5 text-ink-soft md:right-7 md:top-7">Three.js / GLSL</span>
          </motion.div>
          <figcaption className="mt-4 flex items-center justify-between gap-6">
            <span className="eyebrow text-ink-mute">{t('hero.fig')}</span>
            <a href="#manifesto" className="eyebrow flex items-center gap-3 text-ink-soft hover:text-ink">
              {t('hero.scroll')}
              <span className="relative block h-8 w-px overflow-hidden bg-[var(--hairline)]">
                <span className="animate-scroll-cue absolute inset-0 bg-ink" />
              </span>
            </a>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
