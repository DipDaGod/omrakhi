import { useEffect, useRef, useState } from 'react';
import type { ProductView, GridLabels } from './types.ts';
import { useShortlist, flyToCounter } from './useShortlist.ts';

/**
 * P4 — the design drawer, addressed as ?d=OM-2418.
 *
 * Not a route. 400 near-identical product pages would be a thin-content SEO
 * liability, a photography burden and a maintenance cost every December; a
 * drawer with a shareable URL delivers the two things a route would give —
 * detail and a pasteable link — without the 400 pages.
 *
 * Right-hand drawer on desktop, bottom sheet on mobile, so the grid stays
 * visible behind it and the buyer keeps his place in a sixty-item scan.
 */
export default function DesignDrawer({
  product,
  labels,
  categoryName,
  whatsappBase,
  onClose,
  onStep,
  hasPrev,
  hasNext,
}: {
  product: ProductView;
  labels: GridLabels;
  categoryName: string;
  whatsappBase: string;
  onClose: () => void;
  onStep: (delta: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const heart = useRef<HTMLButtonElement>(null);
  const { has, toggle } = useShortlist();
  const [shot, setShot] = useState(0);
  const [copied, setCopied] = useState(false);
  const inList = has(product.code);

  const shots = product.detail ? [product.img, product.detail] : [product.img];
  useEffect(() => setShot(0), [product.code]);

  /* A8 — focus is trapped, Escape closes, focus returns to the card. */
  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    const prev = document.activeElement as HTMLElement | null;
    node.querySelector<HTMLElement>('button, a')?.focus();
    document.documentElement.style.setProperty('overflow', 'hidden');

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowLeft' && hasPrev) return onStep(-1);
      if (e.key === 'ArrowRight' && hasNext) return onStep(1);
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input'))
        .filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.removeProperty('overflow');
      prev?.focus?.();
    };
  }, [onClose, onStep, hasPrev, hasNext]);

  const shareUrl = typeof location !== 'undefined'
    ? `${location.origin}${location.pathname}?d=${product.code}`
    : '';

  return (
    <div className="dd" role="dialog" aria-modal="true" aria-label={product.code}>
      <div className="dd__scrim" onClick={onClose} />
      <div className="dd__panel" ref={panel}>
        <header className="dd__head">
          <div className="dd__nav">
            <button type="button" onClick={() => onStep(-1)} disabled={!hasPrev} aria-label={labels.previous}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={() => onStep(1)} disabled={!hasNext} aria-label={labels.next}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
            </button>
          </div>
          <button className="dd__close" type="button" onClick={onClose} aria-label={labels.close}>&times;</button>
        </header>

        <div className="dd__body">
          <figure className="dd__figure">
            <span className="plinth">
              <img
                key={shots[shot].src}
                src={shots[shot].src}
                srcSet={shots[shot].srcset}
                sizes="(max-width: 60rem) 100vw, 32rem"
                width={shots[shot].width}
                height={shots[shot].height}
                alt={shot === 1 && product.detailAlt ? product.detailAlt : product.alt}
              />
            </span>
            {shots.length > 1 && (
              <div className="dd__shots">
                {shots.map((s, i) => (
                  <button key={s.src} type="button" className={i === shot ? 'is-on' : ''}
                    onClick={() => setShot(i)} aria-label={`${labels.photo} ${i + 1}`}>
                    <img src={s.src} width="48" height="48" alt="" />
                  </button>
                ))}
              </div>
            )}
          </figure>

          <div className="dd__detail">
            <h2 className="dd__code code">{product.code}</h2>
            <p className="dd__name">{product.name}</p>

            <dl className="dd__spec">
              <dt>{labels.category}</dt><dd>{categoryName}</dd>
              <dt>{labels.materials}</dt><dd>{product.materials.join(' · ')}</dd>
              <dt>{labels.colours}</dt><dd>{product.colours.join(' · ')}</dd>
              <dt>{labels.size}</dt><dd>{product.sizeMm} mm</dd>
              <dt>{labels.pack}</dt><dd>{product.pack}</dd>
              <dt>{labels.moq}</dt><dd>{product.moq} {labels.pieces}</dd>
              <dt>{labels.priceBand}</dt><dd>{product.band}</dd>
            </dl>

            <div className="dd__actions">
              <a className="btn btn--primary btn--block"
                href={`${whatsappBase}${encodeURIComponent(`${labels.askAbout} ${product.code} (${categoryName}). ${labels.ratesPlease}`)}`}
                rel="noopener">
                {labels.askAbout} {product.code}
              </a>
              <button ref={heart} className="btn btn--secondary btn--block" type="button"
                aria-pressed={inList}
                onClick={() => { const added = toggle(product.code, product.moq); if (added && heart.current) flyToCounter(heart.current); }}>
                {inList ? labels.removeFromShortlist : labels.addToShortlist}
              </button>
              <button className="btn btn--quiet btn--block" type="button"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* no clipboard permission */ }
                }}>
                {copied ? labels.copied : labels.copyLink}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
