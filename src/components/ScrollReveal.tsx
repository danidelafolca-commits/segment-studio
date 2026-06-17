'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Initial vertical offset in px (motion intensity). */
  y?: number;
  /** Stagger order for items that share the same scroll position (e.g. cards in a row). */
  order?: number;
  id?: string;
}

/**
 * Scroll-bound layer — only mounted on the client once the DOM is hydrated,
 * so framer's `useScroll` target ref is valid (avoids the SSR "ref not
 * hydrated" error) and the server never ships a stuck `opacity:0`.
 */
function ScrollRevealMotion({
  children,
  className,
  y,
  order,
  id,
}: {
  children: ReactNode;
  className?: string;
  y: number;
  order: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start center'],
  });

  const begin = Math.min(order * 0.1, 0.45);
  const opacity = useTransform(scrollYProgress, [begin, begin + 0.55], [0, 1]);
  const translateY = useTransform(scrollYProgress, [begin, begin + 0.55], [y, 0]);

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      style={{ opacity, y: translateY, willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-linked (scrubbed) reveal: opacity + rise tied to scroll progress, so
 * the block "builds in" as you scroll and reverses on the way back. `order`
 * staggers same-row items. Respects prefers-reduced-motion and is SSR-safe
 * (content is always rendered; the effect only enhances it after mount).
 */
export default function ScrollReveal({
  children,
  className,
  y = 36,
  order = 0,
  id,
}: ScrollRevealProps) {
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => setMounted(true), []);

  if (!mounted || reduced) {
    return (
      <div className={className} id={id}>
        {children}
      </div>
    );
  }

  return (
    <ScrollRevealMotion className={className} y={y} order={order} id={id}>
      {children}
    </ScrollRevealMotion>
  );
}
