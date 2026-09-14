import { useSyncExternalStore, useCallback } from 'react';
import { subscribe, getSnapshot, getServerSnapshot, has, toggle } from './shortlist-store.ts';

/** React's view of the shared shortlist store. */
export function useShortlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items,
    count: items.length,
    has: useCallback((code: string) => items.some((i) => i.code === code), [items]),
    toggle,
    isIn: has,
  };
}

/**
 * A4 — adding animates the item toward the header counter, once, quickly.
 * This is the one place on the site where motion the user did not ask for
 * earns its keep: it tells them where the thing went, which is otherwise
 * invisible. Skipped entirely under prefers-reduced-motion.
 */
export function flyToCounter(from: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = document.querySelector<HTMLElement>('[data-shortlist-open]');
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'fly';
  dot.style.left = `${a.left + a.width / 2}px`;
  dot.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(dot);
  const anim = dot.animate(
    [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      {
        transform: `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${
          b.top + b.height / 2 - (a.top + a.height / 2)
        }px) translate(-50%,-50%) scale(0.4)`,
        opacity: 0,
      },
    ],
    { duration: 420, easing: 'cubic-bezier(0.2,0,0.13,1)' },
  );
  anim.onfinish = () => dot.remove();
}
