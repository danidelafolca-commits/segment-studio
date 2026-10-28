'use client';

import { useSyncExternalStore } from 'react';

// Tiny shared store: becomes `true` once the intro curtain has lifted, so hero
// reveals can wait for it instead of playing hidden behind the curtain.
let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useIntroDone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => done,
    () => false
  );
}
