'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe';
import { useI18n } from '@/components/LanguageProvider';
import RevealText from '@/components/motion/RevealText';
import Magnetic from '@/components/motion/Magnetic';
import ScrollReveal from '@/components/ScrollReveal';
import SectionReveal from '@/components/SectionReveal';

const EASE = [0.16, 1, 0.3, 1] as const;
const AUTHOR = 'Quim Espigares Montes';
const TUTOR = 'Irene Royo Garcia';

function Signature() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotionSafe();
  return (
    <div ref={ref} className="relative inline-block">
      <RevealText
        text={`*${AUTHOR}*`}
        className="block font-display text-[clamp(2.6rem,7vw,7.5rem)] leading-[0.95] tracking-[-0.03em] text-paper"
        italicClassName="serif-italic"
        stagger={0.09}
        duration={1.3}
      />
      <svg
        className="absolute -bottom-4 left-0 h-6 w-full text-ochre-soft md:-bottom-6 md:h-8"
        viewBox="0 0 600 30"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <motion.path
          d="M4 22 C 120 6, 220 28, 330 14 S 520 4, 596 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView || reduced ? { pathLength: 1 } : undefined}
          transition={reduced ? { duration: 0 } : { duration: 1.8, ease: EASE, delay: 0.6 }}
        />
      </svg>
    </div>
  );
}

export default function SiteFooter() {
  const { t } = useI18n();
  const reduced = useReducedMotionSafe();
  const wordRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wordRef, offset: ['start end', 'end end'] });
  const wordY = useTransform(scrollYProgress, [0, 1], ['55%', '0%']);
  const year = new Date().getFullYear();

  const credits = [
    { role: t('colophon.role.concept'), value: AUTHOR, strong: true },
    { role: t('colophon.role.dev'), value: AUTHOR, strong: true },
    { role: t('colophon.role.tutor'), value: TUTOR, strong: true },
    { role: t('colophon.role.centre'), value: t('colophon.centre') },
    { role: t('colophon.role.tech'), value: 'Roboflow · SAM3 · Next.js · Three.js · Framer Motion · Lenis' },
    { role: t('colophon.role.type'), value: 'Fraunces · Inter · Geist Mono' },
  ];

  return (
    <SectionReveal as="footer" id="credits" className="relative scroll-mt-0 overflow-hidden rounded-t-[40px] bg-ink text-paper">
      <div className="mx-auto max-w-[100rem] px-6 pt-24 md:px-10 md:pt-36">
        {/* Running head */}
        <div className="flex items-center justify-between">
          <p className="eyebrow flex items-center gap-3 text-paper/50">
            <span className="text-ochre-soft">(03)</span>
            <span className="h-px w-8 bg-paper/25" />
            {t('colophon.eyebrow')}
          </p>
          <Magnetic>
            <a
              href="#top"
              className="group flex items-center gap-3 rounded-full border border-paper/20 py-2 pl-4 pr-2 text-sm text-paper/80 transition-colors duration-500 hover:border-paper hover:bg-paper hover:text-ink"
            >
              {t('colophon.top')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper/10 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:bg-ink/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </span>
            </a>
          </Magnetic>
        </div>

        {/* Lead */}
        <RevealText
          as="p"
          text={t('colophon.lead')}
          className="mt-16 max-w-5xl font-display text-[clamp(2rem,4.4vw,4.4rem)] font-[350] leading-[1.05] tracking-[-0.025em] text-paper md:mt-24"
          italicClassName="serif-italic text-ochre-soft"
          stagger={0.035}
        />

        {/* Signature */}
        <div className="mt-24 md:mt-36">
          <ScrollReveal>
            <p className="eyebrow mb-6 text-paper/45">{t('colophon.signature')}</p>
          </ScrollReveal>
          <Signature />
        </div>

        {/* Credits sheet */}
        <dl className="mt-24 grid gap-x-10 sm:grid-cols-2 md:mt-32 lg:grid-cols-3">
          {credits.map((c, i) => (
            <ScrollReveal key={c.role} order={i % 3} className="border-t border-[var(--hairline-light)] py-7">
              <dt className="eyebrow text-paper/45">{c.role}</dt>
              <dd className={`mt-3 leading-snug ${c.strong ? 'font-display text-2xl tracking-tight text-paper md:text-[1.7rem]' : 'text-[0.95rem] text-paper/75'}`}>
                {c.value}
              </dd>
            </ScrollReveal>
          ))}
        </dl>

        {/* Academic note + legal */}
        <div className="mt-16 grid gap-6 border-t border-[var(--hairline-light)] py-8 text-sm md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-paper/75">{t('footer.academic')}</p>
            <p className="mt-1.5 text-paper/50">{t('footer.author')}</p>
          </div>
          <p className="font-mono text-xs text-paper/45 md:col-span-3">{t('footer.tagline')}</p>
          <p className="font-mono text-xs text-paper/45 md:col-span-3 md:text-right">
            © {year} · {t('footer.built')}
          </p>
        </div>
      </div>

      {/* Bleeding wordmark */}
      <div ref={wordRef} className="relative overflow-hidden" aria-hidden="true">
        <motion.p
          style={{ y: reduced ? '0%' : wordY }}
          className="select-none whitespace-nowrap text-center font-display text-[22vw] font-[350] leading-[0.78] tracking-[-0.06em] text-paper"
        >
          Parti<span className="serif-italic text-ochre-soft">kel</span>
        </motion.p>
      </div>
    </SectionReveal>
  );
}
