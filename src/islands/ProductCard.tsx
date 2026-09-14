import { useRef } from 'react';
import type { ProductView, GridLabels } from './types.ts';
import { useShortlist, flyToCounter } from './useShortlist.ts';

/**
 * P3 — card anatomy, in visual priority order: photograph, article number,
 * price band, pack config, shortlist control, "new" tag.
 *
 * The article number is the largest text on the card, not the design name.
 * Dealers order by number — every phone call, every WhatsApp message and every
 * order sheet in this trade uses the code. Making the marketing name bigger
 * would be designing for a consumer shopper who does not exist on this site.
 */
export default function ProductCard({
  p,
  labels,
  onOpen,
  eager = false,
}: {
  p: ProductView;
  labels: GridLabels;
  onOpen: (code: string) => void;
  eager?: boolean;
}) {
  const { has, toggle } = useShortlist();
  const btn = useRef<HTMLButtonElement>(null);
  const inList = has(p.code);

  return (
    <article className="pc">
      <a
        className="pc__hit"
        href={`?d=${p.code}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onOpen(p.code);
        }}
      >
        <span className="plinth pc__plinth">
          <img
            src={p.img.src}
            srcSet={p.img.srcset}
            sizes={p.img.sizes}
            width={p.img.width}
            height={p.img.height}
            alt={p.alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding={eager ? 'sync' : 'async'}
            style={p.img.lqip ? { backgroundImage: `url(${p.img.lqip})`, backgroundSize: 'cover' } : undefined}
          />
        </span>
        <span className="pc__code code">{p.code}</span>
        <span className="pc__band">{p.band}</span>
        <span className="pc__pack">{p.pack}</span>
      </a>

      {p.isNew && <span className="tag pc__new">{labels.new}</span>}

      <button
        ref={btn}
        type="button"
        className="pc__heart"
        aria-pressed={inList}
        aria-label={`${inList ? labels.removeFromShortlist : labels.addToShortlist} — ${p.code}`}
        onClick={() => {
          const added = toggle(p.code, p.moq);
          if (added && btn.current) flyToCounter(btn.current);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={inList ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3Z" />
        </svg>
      </button>
    </article>
  );
}
