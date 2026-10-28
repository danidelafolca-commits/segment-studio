'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/** Inertial page scroll (Lenis). Native scroll stays the source of truth, so
 *  framer-motion's `useScroll` keeps working unchanged. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      anchors: { offset: -72 },
      allowNestedScroll: true,
      autoRaf: true,
    });

    const onLock = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) lenis.stop();
      else lenis.start();
    };
    window.addEventListener('partikel:scroll-lock', onLock);

    return () => {
      window.removeEventListener('partikel:scroll-lock', onLock);
      lenis.destroy();
    };
  }, []);

  return null;
}
