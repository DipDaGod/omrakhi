import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { ImgView } from '../islands/types.ts';
import { lqip } from './images.ts';

/**
 * Turns an image into the plain object an island can be handed. The srcset is
 * built at build time so the island never has to know about the image
 * pipeline — and so an island's markup carries the same widths, formats and
 * explicit dimensions the static grid does.
 */
export async function toImgView(
  src: ImageMetadata,
  widths: number[],
  sizes: string,
  code?: string,
): Promise<ImgView> {
  const variants = await Promise.all(
    widths.map((w) => getImage({ src, width: w, height: w, fit: 'cover', format: 'webp' })),
  );
  const largest = variants[variants.length - 1];
  return {
    src: largest.src,
    srcset: variants.map((v, i) => `${v.src} ${widths[i]}w`).join(', '),
    sizes,
    width: widths[widths.length - 1],
    height: widths[widths.length - 1],
    lqip: code ? lqip(code) : undefined,
  };
}
