'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cubicBezier, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'footer';
}

/**
 * Scroll-driven mask: the section opens from an inset rounded "page" to full
 * bleed as it enters the viewport, so seams between sections read as a turn of
 * the page. Only mounted client-side once hydrated (SSR-safe).
 */
function SectionRevealInner({
  children,
  className,
  id,
  as,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as: 'section' | 'footer';
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.95', 'start 0.45'],
  });
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(6% 3.5% 0% 3.5% round 40px)', 'inset(0% 0% 0% 0% round 0px)'],
    { ease: cubicBezier(0.16, 1, 0.3, 1) }
  );
  const style = { clipPath, willChange: 'clip-path' } as const;

  if (as === 'footer') {
    return (
      <motion.footer ref={ref as React.Ref<HTMLElement>} id={id} className={className} style={style}>
        {children}
      </motion.footer>
    );
  }
  return (
    <motion.section ref={ref as React.Ref<HTMLElement>} id={id} className={className} style={style}>
      {children}
    </motion.section>
  );
}

export default function SectionReveal({
  children,
  className,
  id,
  as = 'section',
}: SectionRevealProps) {
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted || reduced) {
    const Tag = as;
    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  }

  return (
    <SectionRevealInner as={as} className={className} id={id}>
      {children}
    </SectionRevealInner>
  );
}
