/**
 * A8 — shared overlay mechanics. Drawers and modals trap focus, close on
 * Escape, and return focus to the element that opened them.
 */
export type Overlay = { root: HTMLElement; close: () => void };

const SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function openOverlay(root: HTMLElement, onClose?: () => void): Overlay {
  const returnTo = document.activeElement as HTMLElement | null;
  document.body.appendChild(root);
  document.documentElement.style.setProperty('overflow', 'hidden');

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

  function close() {
    root.removeEventListener('keydown', onKey);
    root.remove();
    document.documentElement.style.removeProperty('overflow');
    returnTo?.focus?.();
    onClose?.();
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
