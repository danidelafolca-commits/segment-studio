'use client';

import { Fragment, useRef, type ElementType } from 'react';
import { motion, useInView } from 'framer-motion';
import { useReducedMotionSafe } from '@/components/motion/useReducedMotionSafe';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Token {
  word: string;
  italic: boolean;
}

/** `*word*` (or `*several words*`) marks an italic serif accent. */
function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let italic = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw;
    const opens = w.startsWith('*');
    if (opens) {
      italic = true;
      w = w.slice(1);
    }
    const closes = w.endsWith('*');
    if (closes) w = w.slice(0, -1);
    out.push({ word: w, italic });
    if (closes) italic = false;
  }
  return out;
}

export function plain(text: string) {
  return text.replace(/\*/g, '');
}

interface RevealTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  italicClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** Controlled trigger; when omitted the reveal plays on scroll into view. */
  play?: boolean;
}

/** Word-masked reveal: each word rises out of its own clipping line. */
export default function RevealText({
  text,
  as: Tag = 'span',
  className,
  italicClassName = 'serif-italic',
  delay = 0,
  stagger = 0.055,
  duration = 1.1,
  play,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduced = useReducedMotionSafe();
  const active = play ?? inView;
  const tokens = tokenize(text);

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{plain(text)}</span>
      <span aria-hidden="true">
        {tokens.map((t, i) => (
          <Fragment key={i}>
            <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-top">
              <motion.span
                className={`inline-block ${t.italic ? italicClassName : ''}`}
                initial={{ y: '115%', rotate: 4 }}
                animate={active || reduced ? { y: '0%', rotate: 0 } : undefined}
                transition={reduced ? { duration: 0 } : { duration, ease: EASE, delay: delay + i * stagger }}
              >
                {t.word}
              </motion.span>
            </span>
            {i < tokens.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
