/**
 * Fixed facts. Every page reads the firm's details from here.
 * Nothing in a component hardcodes an address, a number, or a year.
 */
export const SITE = {
  origin: 'https://omrakhi.vercel.app',
  name: 'Om Rakhi Udyog',
  legalName: 'Om Rakhi Udyog',
  shortDescription: 'Rakhi manufacturer and wholesale supplier, Burrabazar, Kolkata',

  address: {
    line1: 'P-15 Kalakar Street, 2nd Floor',
    line2: 'Burrabazar',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700007',
    country: 'IN',
    landmark: 'near ICICI Bank',
    /** Used by the static map image and the "open in Maps" link. */
    geo: { lat: 22.5787, lng: 88.3561 },
  },

  phone: {
    display: '+91 93309 11943',
    tel: '+919330911943',
    whatsapp: '919330911943',
  },

  email: 'omrakhiudyog@gmail.com',

  social: {
    instagram: 'https://instagram.com/omrakhiudyog',
    instagramHandle: '@omrakhiudyog',
    indiamart: 'https://indiamart.com/om-rakhi-udyog',
  },

  /**
   * Web3Forms access key. Public by design — it ends up in the HTML of the
   * form that posts with it, and Web3Forms does its own spam/domain checks
   * server-side, so there is nothing to gain by hiding it behind an env var.
   */
  web3formsKey: 'b56bc06f-8b2d-4bb6-8cd4-e0d62853513d',

  hours: {
    season: [
      { days: 'Monday – Saturday', open: '10:00', close: '19:00' },
      { days: 'Sunday', open: null, close: null },
    ],
    offSeason: [
      { days: 'Monday – Saturday', open: '11:00', close: '18:00' },
      { days: 'Sunday', open: null, close: null },
    ],
    /** Numeric form, for the "are we open right now?" check in the contact dock. */
    weekday: { openHour: 10, closeHour: 19 },
    closedWeekdays: [0], // Sunday
  },
} as const;

/**
 * [POS] Positioning. Three frames were on the table; this switch selects one.
 *
 *  'specialist'        — we make pearl/kundan/designer rakhi, and we make it well.
 *  'legible-supplier'  — every design, rate band and pack size is published before you call.
 *  'on-ramp'           — we are the easiest place to start a rakhi business from.
 *
 * Changing this value changes: the home hero copy, the position of /how-to-order
 * in the nav, and the weight given to /custom. Nothing else needs editing.
 */
export type Positioning = 'specialist' | 'legible-supplier' | 'on-ramp';
export const POSITIONING: Positioning = 'legible-supplier';

/**
 * The season the site is currently selling. Drives the status strip (A7), the
 * "book by" dates on /custom, and the calendar on /how-to-order.
 *
 * Update these two values each December. Nothing else on the site carries a year.
 */
export const SEASON = {
  year: 2027,
  /** Raksha Bandhan, the date the whole trade calendar hangs off. */
  rakshaBandhan: '2027-08-17',
} as const;

/**
 * P1 §3 — the proof bar. Real numbers only.
 *
 * A specific "42 dealers across 7 states" is more persuasive to a buyer who
 * will meet those dealers than an unverifiable "9,000+". Anything set to null
 * is omitted from the page entirely rather than guessed at.
 *
 * ⚠ Fill these in from the firm's own records before launch. Design and
 * collection counts are derived from the catalogue and are not listed here.
 */
export const PROOF: {
  yearsInTrade: number | null;
  dealers: number | null;
  states: number | null;
  countries: number | null;
} = {
  yearsInTrade: null,
  dealers: null,
  states: null,
  countries: null,
};

/**
 * P1 §6 — claims that must each survive a phone call.
 * "Quality" and "trust" are the default noise of every competitor page and are
 * deliberately absent.
 */
export const CLAIMS = [
  {
    en: {
      title: 'Every design published, with its number',
      body: 'The whole range is on this site with article numbers, pack configuration and price band. You never have to ask what we make before you can ask what it costs.',
    },
    hi: {
      title: 'हर डिज़ाइन, नंबर के साथ, खुले तौर पर',
      body: 'पूरी रेंज इस साइट पर है — आर्टिकल नंबर, पैक कॉन्फ़िगरेशन और प्राइस बैंड सहित। दाम पूछने से पहले यह पूछना नहीं पड़ता कि हम बनाते क्या हैं।',
    },
  },
  {
    en: {
      title: 'Consistent pack configuration',
      body: 'Per card, per box and per carton counts hold across a category and across seasons, so a retailer can plan shelf space and reorder against last year’s sheet.',
    },
    hi: {
      title: 'एक जैसा पैक कॉन्फ़िगरेशन',
      body: 'प्रति कार्ड, प्रति बॉक्स और प्रति कार्टन की गिनती पूरी श्रेणी और हर सीज़न में एक जैसी रहती है, जिससे रिटेलर शेल्फ़ की जगह तय कर सकता है और पिछले साल की शीट से दोबारा ऑर्डर कर सकता है।',
    },
  },
  {
    en: {
      title: 'Barcoded and modern-trade ready',
      body: 'Cards can be barcoded and MRP-labelled to your specification, so goods go from the carton to the shelf without repacking.',
    },
    hi: {
      title: 'बारकोड और मॉडर्न ट्रेड के लिए तैयार',
      body: 'कार्ड पर आपकी ज़रूरत के मुताबिक़ बारकोड और एमआरपी लेबल लग सकते हैं, जिससे माल कार्टन से सीधे शेल्फ़ पर जाता है, दोबारा पैक किए बिना।',
    },
  },
  {
    en: {
      title: 'A replacement policy that is written down',
      body: 'Manufacturing defects reported with photographs within a week are replaced in your next dispatch or credited. It is on the ordering page, not left to a phone call.',
    },
    hi: {
      title: 'लिखी हुई रिप्लेसमेंट पॉलिसी',
      body: 'एक हफ़्ते के भीतर तस्वीरों के साथ बताई गई निर्माण संबंधी ख़राबी अगली खेप में बदली जाती है या पैसे समायोजित होते हैं। यह ऑर्डर पेज पर लिखा है, फ़ोन कॉल पर नहीं छोड़ा गया।',
    },
  },
] as const;
