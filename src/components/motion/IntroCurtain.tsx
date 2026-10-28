'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, animate } from 'framer-motion';
import { markIntroDone } from '@/components/motion/intro';

const SEEN_KEY = 'partikel-intro-seen';
const EASE = [0.76, 0, 0.24, 1] as const;

/** First-visit curtain: a 0→100 counter in ink, then the sheet lifts away. */
export default function IntroCurtain() {
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {}

    if (reduced || seen) {
      const raf = requestAnimationFrame(() => {
        setVisible(false);
        markIntroDone();
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('partikel:scroll-lock', { detail: true }));
    const controls = animate(0, 100, {
      duration: 1.5,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => {
        try {
          sessionStorage.setItem(SEEN_KEY, '1');
        } catch {}
        setVisible(false);
        markIntroDone();
      },
    });
    return () => controls.stop();
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        window.dispatchEvent(new CustomEvent('partikel:scroll-lock', { detail: false }));
      }}
    >
      {visible && (
        <motion.div
          key="curtain"
          className="intro-curtain fixed inset-0 z-[100] flex flex-col justify-between bg-ink px-6 py-6 text-paper md:px-10 md:py-8"
          initial={{ y: 0 }}
          exit={{ y: '-100%', transition: { duration: 1.05, ease: EASE } }}
          aria-hidden="true"
        >
          <div className="flex items-start justify-between">
            <span className="font-display text-xl tracking-tight">Partikel</span>
            <span className="eyebrow text-paper/50">Treball de Recerca</span>
          </div>

          <div className="flex items-end justify-between gap-6">
            <p className="eyebrow max-w-[16rem] leading-relaxed text-paper/50">
              Quim Espigares Montes
              <br />
              Ins Fontanelles
            </p>
            <span className="font-display text-[clamp(5rem,18vw,15rem)] leading-[0.8] tabular-nums tracking-tighter">
              {String(count).padStart(3, '0')}
            </span>
          </div>

          <motion.span
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-paper/30"
            style={{ scaleX: count / 100 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
