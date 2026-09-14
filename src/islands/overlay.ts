/**
 * A8 — shared overlay mechanics. Drawers and modals trap focus, close on
 * Escape, and return focus to the element that opened them.
 */
export type Overlay = { root: HTMLElement; close: () => void };

const SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/* Must match --dur-base in tokens.css. The exit is driven by a timer rather
   than transitionend because a transition that never runs — reduced motion, a
   backgrounded tab, a panel the compositor skips — would never fire the event
   and the overlay would stay in the DOM forever. */
const EXIT_MS = 240;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function openOverlay(root: HTMLElement, onClose?: () => void): Overlay {
  const returnTo = document.activeElement as HTMLElement | null;
  document.body.appendChild(root);
  document.documentElement.style.setProperty('overflow', 'hidden');
  /* One frame on the closed state before the open one, or the browser
     coalesces both into a single style resolution and nothing animates. */
  requestAnimationFrame(() => root.classList.add('is-in'));

  const items = () => Array.from(root.querySelectorAll<HTMLElement>(SELECTOR)).filter((el) => el.offsetParent !== null);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const list = items();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  let closing = false;
  function close() {
    if (closing) return;
    closing = true;
    root.removeEventListener('keydown', onKey);
    root.classList.remove('is-in');
    root.classList.add('is-out');
    /* Focus goes back immediately — a keyboard user should not wait out an
       animation — but the scroll lock holds until the panel is gone, or the
       page jumps behind the fade. */
    returnTo?.focus?.();

    const done = () => {
      root.remove();
      document.documentElement.style.removeProperty('overflow');
      onClose?.();
    };
    if (reduced()) done();
    else setTimeout(done, EXIT_MS);
  }

  root.addEventListener('keydown', onKey);
  root.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).dataset.overlayDismiss !== undefined) close();
  });
  queueMicrotask(() => items()[0]?.focus());

  return { root, close };
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
