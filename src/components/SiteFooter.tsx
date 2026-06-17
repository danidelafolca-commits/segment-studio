'use client';

import { useI18n } from '@/components/LanguageProvider';
import ScrollReveal from '@/components/ScrollReveal';

export default function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-[var(--hairline)] bg-ocean-night px-6 py-10">
      <ScrollReveal className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="13" cy="14" r="2.1" fill="#e0ffff" />
            <circle cx="19.5" cy="18.5" r="1.5" fill="#15b8b8" />
            <circle cx="18" cy="12.5" r="1" fill="#aacbe0" />
          </svg>
          <span className="font-display text-sm font-semibold text-ice-white">
            Partikel
          </span>
        </div>
        <p className="font-mono text-xs text-ice-blue/55">{t('footer.tagline')}</p>
        <p className="font-mono text-xs text-ice-blue/40">
          © {new Date().getFullYear()} · {t('footer.built')}
        </p>
      </ScrollReveal>
    </footer>
  );
}
