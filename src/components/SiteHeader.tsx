'use client';

import { useI18n } from '@/components/LanguageProvider';
import { LANGS } from '@/lib/i18n';
import { LetterSwapPingPong } from '@/components/LetterSwap';

function ParticleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M7 11V8.5A1.5 1.5 0 0 1 8.5 7H11M21 7h2.5A1.5 1.5 0 0 1 25 8.5V11M25 21v2.5a1.5 1.5 0 0 1-1.5 1.5H21M11 25H8.5A1.5 1.5 0 0 1 7 23.5V21"
        fill="none"
        stroke="#15b8b8"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="13" cy="14" r="2.1" fill="#e0ffff" />
      <circle cx="19.5" cy="18.5" r="1.5" fill="#15b8b8" />
      <circle cx="18" cy="12.5" r="1" fill="#aacbe0" />
    </svg>
  );
}

export default function SiteHeader() {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--hairline)] bg-ocean-night/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <ParticleMark />
          <LetterSwapPingPong
            label="Partikel"
            className="font-display text-base font-semibold tracking-tight text-ice-white"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#workspace"
            className="text-sm text-ice-blue/75 transition-colors hover:text-ice-white"
          >
            <LetterSwapPingPong label={t('nav.workspace')} />
          </a>
          <a
            href="#how"
            className="text-sm text-ice-blue/75 transition-colors hover:text-ice-white"
          >
            <LetterSwapPingPong label={t('nav.how')} />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center rounded-full border border-[var(--hairline)] bg-ocean-deep/50 p-0.5"
            role="group"
            aria-label="Language"
          >
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                  lang === code
                    ? 'bg-accent text-ocean-night'
                    : 'text-ice-blue/60 hover:text-ice-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <a
            href="#workspace"
            className="hidden rounded-full border border-[var(--hairline)] px-4 py-2 text-sm font-medium text-ice-white transition-colors hover:border-accent/60 hover:bg-accent/10 sm:inline-flex"
          >
            <LetterSwapPingPong label={t('nav.cta')} />
          </a>
        </div>
      </div>
    </header>
  );
}
