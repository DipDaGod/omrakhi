import { SITE } from '../config/site.ts';
import { openCloseForNow } from './season.ts';

/**
 * A3 — contextual prefill. The single biggest friction in a B2B enquiry is the
 * buyer having to explain what he is looking at, so every WhatsApp link on the
 * site carries the context of the page it was tapped on.
 */
export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${SITE.phone.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telHref = `tel:${SITE.phone.tel}`;

/**
 * Is the shop open right now, in India? Drives the dock's out-of-hours label
 * and the footer's status line. Hours come from the seasonal table, so this
 * can never disagree with the hours the footer prints.
 */
export function isOpenNow(date = new Date()): boolean {
  // IST is UTC+5:30 and has no daylight saving, so this is exact.
  const { openHour, closeHour, closedWeekdays } = openCloseForNow(date);
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60_000);
  if (closedWeekdays.includes(ist.getUTCDay())) return false;
  const hour = ist.getUTCHours() + ist.getUTCMinutes() / 60;
  return hour >= openHour && hour < closeHour;
}
