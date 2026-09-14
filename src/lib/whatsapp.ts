import { SITE } from '../config/site.ts';

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

/** Is the shop open right now, in India? Drives the dock's out-of-hours label. */
export function isOpenNow(date = new Date()): boolean {
  // IST is UTC+5:30 and has no daylight saving, so this is exact.
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60_000);
  const day = ist.getUTCDay();
  if (SITE.hours.closedWeekdays.includes(day as never)) return false;
  const hour = ist.getUTCHours() + ist.getUTCMinutes() / 60;
  return hour >= SITE.hours.weekday.openHour && hour < SITE.hours.weekday.closeHour;
}
