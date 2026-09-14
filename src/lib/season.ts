import { SEASON, SITE } from '../config/site.ts';
import type { Locale } from '../i18n/ui.ts';

/**
 * A7 — the seasonal status strip, and the calendar on /how-to-order.
 *
 * A dealer's most urgent unspoken question is "is this site current?". A site
 * that visibly knows what month it is answers that in one line, and it is the
 * cheapest possible defence against a page still saying "2024 Collection" two
 * years later. Everything here derives from two values in src/config/site.ts.
 */

export type Phase = 'development' | 'launch' | 'booking' | 'dispatch' | 'festival';

/** Month (1–12) → phase. */
export function phaseForMonth(month: number): Phase {
  if (month >= 9 && month <= 11) return 'development';
  if (month === 12 || month === 1) return 'launch';
  if (month >= 2 && month <= 4) return 'booking';
  if (month >= 5 && month <= 7) return 'dispatch';
  return 'festival'; // August
}

export function currentPhase(date = new Date()): Phase {
  const ist = new Date(date.getTime() + (5 * 60 + 30) * 60_000);
  return phaseForMonth(ist.getUTCMonth() + 1);
}

export function rakshaBandhanDate(): Date {
  return new Date(`${SEASON.rakshaBandhan}T00:00:00Z`);
}

function festivalDate(locale: Locale): string {
  return rakshaBandhanDate().toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** Every phase's message, in both languages. Used by the strip's live update. */
export function strapline(phase: Phase, locale: Locale): string {
  const y = SEASON.year;
  const en: Record<Phase, string> = {
    development: `${y} collection in development. Photographs from December.`,
    launch: `${y} collection now live. Pre-booking open.`,
    booking: `Booking open for ${y}. Visit us at Kalakar Street.`,
    dispatch: 'Dispatch season. Call before ordering to check availability.',
    festival: `Raksha Bandhan ${festivalDate('en')}. Limited stock — call first.`,
  };
  const hi: Record<Phase, string> = {
    development: `${y} का संग्रह तैयार हो रहा है। तस्वीरें दिसंबर से।`,
    launch: `${y} का संग्रह आ गया है। प्री-बुकिंग शुरू।`,
    booking: `${y} के लिए बुकिंग खुली है। कलाकार स्ट्रीट पर आइए।`,
    dispatch: 'डिस्पैच का मौसम। ऑर्डर से पहले उपलब्धता के लिए कॉल करें।',
    festival: `रक्षाबंधन ${festivalDate('hi')}। स्टॉक सीमित — पहले कॉल करें।`,
  };
  return (locale === 'hi' ? hi : en)[phase];
}

export const PHASES: Phase[] = ['development', 'launch', 'booking', 'dispatch', 'festival'];

/** P7 — the season calendar, anchored to Raksha Bandhan so it never goes stale. */
export function seasonCalendar(locale: Locale) {
  const y = SEASON.year;
  const rows = [
    {
      phase: 'launch' as Phase,
      when: { en: `December ${y - 1} – January ${y}`, hi: `दिसंबर ${y - 1} – जनवरी ${y}` },
      title: { en: 'New collection published', hi: 'नया संग्रह प्रकाशित' },
      body: {
        en: 'Photographs and article numbers go up on this site. Pre-booking opens. This is when the full range is available and nothing is sold out.',
        hi: 'तस्वीरें और आर्टिकल नंबर इस साइट पर आ जाते हैं। प्री-बुकिंग शुरू। इसी समय पूरी रेंज उपलब्ध रहती है और कुछ भी ख़त्म नहीं होता।',
      },
    },
    {
      phase: 'booking' as Phase,
      when: { en: `February – April ${y}`, hi: `फ़रवरी – अप्रैल ${y}` },
      title: { en: 'Booking window', hi: 'बुकिंग की अवधि' },
      body: {
        en: 'The right time to place an order. You get your choice of designs and a dispatch week you can plan a season around. Custom and private label work must be booked in this window.',
        hi: 'ऑर्डर देने का सही समय। डिज़ाइन की पसंद और ऐसा डिस्पैच सप्ताह मिलता है जिस पर पूरा सीज़न टिकाया जा सके। कस्टम और प्राइवेट लेबल का काम इसी अवधि में बुक करना होता है।',
      },
    },
    {
      phase: 'dispatch' as Phase,
      when: { en: `May – July ${y}`, hi: `मई – जुलाई ${y}` },
      title: { en: 'Production and dispatch', hi: 'उत्पादन और डिस्पैच' },
      body: {
        en: 'Booked orders are made and sent. New orders are filled from what is already in production, so the range narrows. Call before committing a design to a customer.',
        hi: 'बुक किए ऑर्डर बनते और भेजे जाते हैं। नए ऑर्डर उसी माल से पूरे होते हैं जो पहले से बन रहा है, इसलिए रेंज घट जाती है। किसी ग्राहक से डिज़ाइन का वादा करने से पहले कॉल कर लें।',
      },
    },
    {
      phase: 'festival' as Phase,
      when: { en: `Raksha Bandhan, ${festivalDate('en')} ${y}`, hi: `रक्षाबंधन, ${festivalDate('hi')} ${y}` },
      title: { en: 'The festival', hi: 'त्योहार' },
      body: {
        en: 'Retail sells through in the last ten days. We hold limited stock for top-ups until roughly two weeks before; after that, what is in your shop is what you have.',
        hi: 'रिटेल की बिक्री आख़िरी दस दिनों में होती है। लगभग दो हफ़्ते पहले तक हम टॉप-अप के लिए सीमित स्टॉक रखते हैं; उसके बाद जो आपकी दुकान में है, वही है।',
      },
    },
    {
      phase: 'development' as Phase,
      when: { en: `September – November ${y}`, hi: `सितंबर – नवंबर ${y}` },
      title: { en: 'Next season in development', hi: 'अगला सीज़न तैयार हो रहा है' },
      body: {
        en: 'Samples are made and the next range is decided. A good time to tell us what sold and what did not — it genuinely changes what we make.',
        hi: 'सैंपल बनते हैं और अगली रेंज तय होती है। यही सही समय है बताने का कि क्या बिका और क्या नहीं — इससे सचमुच तय होता है कि हम क्या बनाएँगे।',
      },
    },
  ];
  return rows.map((r) => ({
    phase: r.phase,
    when: r.when[locale],
    title: r.title[locale],
    body: r.body[locale],
  }));
}

/** Opening hours for the current phase. Season = Dec–Aug, off-season = Sep–Nov. */
export function hoursForNow(date = new Date()) {
  return currentPhase(date) === 'development' ? SITE.hours.offSeason : SITE.hours.season;
}

/**
 * The same hours as a pair of numbers, for "are we open right now?".
 *
 * Parsed from the rows above rather than stored separately. They used to be a
 * third hardcoded pair that matched the in-season hours only, so through the
 * off-season the footer table said 11:00–18:00 while the dock counted 10:00
 * as open — the site contradicted itself for three months of every year.
 */
export function openCloseForNow(date = new Date()) {
  const row = hoursForNow(date).find((h) => h.open && h.close);
  const hour = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h + m / 60;
  };
  return {
    openHour: row?.open ? hour(row.open) : 0,
    closeHour: row?.close ? hour(row.close) : 0,
    closedWeekdays: SITE.hours.closedWeekdays as readonly number[],
  };
}
