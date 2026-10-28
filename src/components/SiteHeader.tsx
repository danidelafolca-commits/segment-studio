'use client';

import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useI18n } from '@/components/LanguageProvider';
import { LANGS } from '@/lib/i18n';
import { LetterSwapPingPong } from '@/components/LetterSwap';

function ParticleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="13" cy="14" r="2.6" fill="currentColor" />
      <circle cx="19.8" cy="18.8" r="1.8" fill="#2e6e68" />
      <circle cx="18.6" cy="11.8" r="1.1" fill="#b4582f" />
    </svg>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 240 && y > prev + 2 ? true : y < prev - 2 ? false : hidden);
  });

  const links = [
    { href: '#workspace', n: '01', label: t('nav.workspace') },
    { href: '#how', n: '02', label: t('nav.how') },
    { href: '#credits', n: '03', label: t('nav.credits') },
  ];

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={false}
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div
        className={`mx-auto flex items-center justify-between px-6 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:px-10 ${
          scrolled
            ? 'mt-3 max-w-6xl rounded-full border border-[var(--hairline)] bg-paper/80 py-2.5 shadow-[0_18px_40px_-30px_rgba(22,35,47,0.5)] backdrop-blur-xl md:mx-6 lg:mx-auto'
            : 'max-w-[100rem] border border-transparent py-6'
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5 text-ink" aria-label="Partikel">
          <ParticleMark />
          <LetterSwapPingPong label="Partikel" className="font-display text-xl tracking-tight" />
          <span className="eyebrow hidden translate-y-px text-ink-mute lg:inline">· TdR</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label={t('nav.menu')}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="group flex items-baseline gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink">
              <span className="font-mono text-[10px] text-ink-mute transition-colors group-hover:text-ochre">({l.n})</span>
              <LetterSwapPingPong label={l.label} />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1 font-mono text-[11px]" role="group" aria-label="Language">
            {LANGS.map(({ code, label }, i) => (
              <span key={code} className="flex items-center gap-1">
                <button
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`cursor-pointer px-0.5 py-1 transition-colors ${
                    lang === code ? 'text-ink underline decoration-ochre decoration-[1.5px] underline-offset-[5px]' : 'text-ink-mute hover:text-ink'
                  }`}
                >
                  {label}
                </button>
                {i < LANGS.length - 1 && <span className="text-ink-mute/50">/</span>}
              </span>
            ))}
          </div>
          <a
            href="#workspace"
            className="group hidden items-center gap-2 rounded-full bg-ink py-2 pl-4 pr-2 text-sm font-medium text-paper transition-colors hover:bg-teal sm:inline-flex"
          >
            <LetterSwapPingPong label={t('nav.cta')} />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper text-ink transition-transform duration-500 group-hover:rotate-[-45deg]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </motion.header>
  );
}
