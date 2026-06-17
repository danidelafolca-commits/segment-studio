'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  type AnimationOptions,
  motion,
  stagger,
  useAnimate,
  useInView,
  useReducedMotion,
} from 'framer-motion';

interface TextProps {
  label: string;
  reverse?: boolean;
  transition?: AnimationOptions;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | number;
  className?: string;
  onClick?: () => void;
}

const DEFAULT_TRANSITION: AnimationOptions = {
  type: 'spring',
  duration: 0.7,
};

function Letters({ label, reverse }: { label: string; reverse: boolean }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      {label.split('').map((letter, i) => (
        <span className="relative flex whitespace-pre" key={`${letter}-${i}`}>
          <motion.span className="letter relative" style={{ top: 0 }}>
            {letter}
          </motion.span>
          <motion.span
            className="letter-secondary absolute"
            aria-hidden
            style={{ top: reverse ? '-100%' : '100%' }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </>
  );
}

/** Letters swap once on hover-enter, then reset (good for one-shot triggers). */
export function LetterSwapForward({
  label,
  reverse = true,
  transition = DEFAULT_TRANSITION,
  staggerDuration = 0.03,
  staggerFrom = 'first',
  className,
  onClick,
}: TextProps) {
  const [scope, animate] = useAnimate();
  const [blocked, setBlocked] = useState(false);

  const merge = (base: AnimationOptions) => ({
    ...base,
    delay: stagger(staggerDuration, { from: staggerFrom }),
  });

  const hoverStart = () => {
    if (blocked) return;
    setBlocked(true);
    animate('.letter', { y: reverse ? '100%' : '-100%' }, merge(transition)).then(() => {
      animate('.letter', { y: 0 }, { duration: 0 }).then(() => setBlocked(false));
    });
    animate('.letter-secondary', { top: '0%' }, merge(transition)).then(() => {
      animate('.letter-secondary', { top: reverse ? '-100%' : '100%' }, { duration: 0 });
    });
  };

  return (
    <span
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ''}`}
      onMouseEnter={hoverStart}
      onClick={onClick}
      ref={scope}
    >
      <Letters label={label} reverse={reverse} />
    </span>
  );
}

/** Letters swap on hover-enter and swap back on hover-leave (best for nav/buttons). */
export function LetterSwapPingPong({
  label,
  reverse = true,
  transition = DEFAULT_TRANSITION,
  staggerDuration = 0.03,
  staggerFrom = 'first',
  className,
  onClick,
}: TextProps) {
  const [scope, animate] = useAnimate();

  const merge = (base: AnimationOptions) => ({
    ...base,
    delay: stagger(staggerDuration, { from: staggerFrom }),
  });

  const hoverStart = () => {
    animate('.letter', { y: reverse ? '100%' : '-100%' }, merge(transition));
    animate('.letter-secondary', { top: '0%' }, merge(transition));
  };

  const hoverEnd = () => {
    animate('.letter', { y: 0 }, merge(transition));
    animate('.letter-secondary', { top: reverse ? '-100%' : '100%' }, merge(transition));
  };

  return (
    <motion.span
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ''}`}
      onHoverStart={hoverStart}
      onHoverEnd={hoverEnd}
      onClick={onClick}
      ref={scope}
    >
      <Letters label={label} reverse={reverse} />
    </motion.span>
  );
}

/**
 * Plays the swap once when scrolled into view, and again on hover.
 * Splits by words so long headings still wrap normally. Best for headings,
 * card titles and other prominent (non-inline-link) text.
 */
export function LetterSwapAppear({
  label,
  reverse = true,
  transition = DEFAULT_TRANSITION,
  staggerDuration = 0.025,
  staggerFrom = 'first',
  className,
  onClick,
}: TextProps) {
  const [scope, animate] = useAnimate();
  const inView = useInView(scope, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();

  const play = useCallback(() => {
    const merged = {
      ...transition,
      delay: stagger(staggerDuration, { from: staggerFrom }),
    };
    animate('.letter', { y: reverse ? '100%' : '-100%' }, merged).then(() => {
      animate('.letter', { y: 0 }, { duration: 0 });
    });
    animate('.letter-secondary', { top: '0%' }, merged).then(() => {
      animate('.letter-secondary', { top: reverse ? '-100%' : '100%' }, { duration: 0 });
    });
  }, [animate, reverse, transition, staggerDuration, staggerFrom]);

  useEffect(() => {
    if (inView && !reduced) play();
  }, [inView, reduced, play]);

  const words = label.split(' ');

  return (
    <span
      ref={scope}
      className={`inline ${className ?? ''}`}
      onMouseEnter={() => !reduced && play()}
      onClick={onClick}
    >
      <span className="sr-only">{label}</span>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span
            className="relative inline-flex overflow-hidden whitespace-pre align-bottom"
            aria-hidden
          >
            {word.split('').map((ch, ci) => (
              <span className="relative flex" key={ci}>
                <motion.span className="letter relative" style={{ top: 0 }}>
                  {ch}
                </motion.span>
                <motion.span
                  className="letter-secondary absolute"
                  style={{ top: reverse ? '-100%' : '100%' }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </span>
  );
}
