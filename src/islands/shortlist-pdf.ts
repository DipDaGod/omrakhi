import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ShortlistItem } from './shortlist-store.ts';
import type { Row } from './catalogue-client.ts';

/**
 * P5 — the shortlist PDF, generated in the browser. No backend, no upload of
 * what a buyer is looking at.
 *
 * The buyer forwards it to his partner or prints it for a buying trip, so it
 * carries the firm's details in the header and the article numbers in a
 * column he can read down.
 *
 * Note: pdf-lib's standard fonts are WinAnsi only, so Devanagari cannot be
 * embedded without shipping a font file. The PDF is therefore laid out in
 * English with the article numbers, quantities and firm details — which is
 * what the recipient actually needs — regardless of the site language.
 */
export async function buildShortlistPdf(
  items: ShortlistItem[],
  byCode: Map<string, Row>,
  catNames: Map<string, string>,
  T: Record<string, string>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const body = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const INK = rgb(0.106, 0.09, 0.078);
  const MUTED = rgb(0.42, 0.384, 0.353);
  const LINE = rgb(0.886, 0.855, 0.816);

  const A4: [number, number] = [595.28, 841.89];
  const M = 48;
  let page = doc.addPage(A4);
  let y = A4[1] - M;

  const text = (s: string, x: number, size: number, font = body, colour = INK) =>
    page.drawText(s, { x, y, size, font, color: colour });

  text(T.firmName, M, 16, bold);
  y -= 16;
  text(T.firmAddress, M, 9, body, MUTED);
  y -= 12;
  text(`${T.firmPhone}  ·  ${T.firmSite}`, M, 9, body, MUTED);
  y -= 28;

  text(T.pdfTitle, M, 13, bold);
  y -= 14;
  text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), M, 9, body, MUTED);
  y -= 24;

  const cols = { code: M, name: M + 110, cat: M + 280, qty: A4[0] - M - 70 };
  const header = () => {
    page.drawText('Article', { x: cols.code, y, size: 9, font: bold, color: MUTED });
    page.drawText('Design', { x: cols.name, y, size: 9, font: bold, color: MUTED });
    page.drawText('Collection', { x: cols.cat, y, size: 9, font: bold, color: MUTED });
    page.drawText('Quantity', { x: cols.qty, y, size: 9, font: bold, color: MUTED });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1, color: LINE });
    y -= 16;
  };
  header();

  for (const item of items) {
    if (y < M + 80) {
      page = doc.addPage(A4);
      y = A4[1] - M;
      header();
    }
    const row = byCode.get(item.code);
    page.drawText(item.code, { x: cols.code, y, size: 10, font: bold, color: INK });
    page.drawText((row?.ne ?? T.gone).slice(0, 34), { x: cols.name, y, size: 9, font: body, color: INK });
    page.drawText((row ? (catNames.get(row.g) ?? '') : '').slice(0, 26), { x: cols.cat, y, size: 9, font: body, color: MUTED });
    page.drawText(`${item.qty} pcs`, { x: cols.qty, y, size: 9, font: body, color: INK });
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.5, color: LINE });
    y -= 14;
  }

  y -= 12;
  page.drawText(T.pdfFooter, { x: M, y, size: 9, font: body, color: MUTED, maxWidth: A4[0] - M * 2, lineHeight: 12 });

  return doc.save();
}
