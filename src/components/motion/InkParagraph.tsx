'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe';

function Word({
  children,
  progress,
  range,
  italic,
  still,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  italic: boolean;
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity: still ? 1 : opacity }} className={italic ? 'serif-italic text-teal' : undefined}>
      {children}
    </motion.span>
  );
}

/** Paragraph that "inks in" word by word as it scrolls through the viewport.
 *  `*word*` marks an italic accent. */
export default function InkParagraph({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const still = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] });

  const words: { w: string; italic: boolean }[] = [];
  let italic = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw;
    if (w.startsWith('*')) {
      italic = true;
      w = w.slice(1);
    }
    const closes = w.endsWith('*');
    if (closes) w = w.slice(0, -1);
    words.push({ w, italic });
    if (closes) italic = false;
  }

  const n = words.length;
  return (
    <p ref={ref} className={`relative ${className ?? ''}`}>
      {words.map(({ w, italic }, i) => (
        <span key={i}>
          <Word
            progress={scrollYProgress}
            range={[i / n, Math.min(1, (i + 2) / n)]}
            italic={italic}
            still={still}
          >
            {w}
          </Word>
          {i < n - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
