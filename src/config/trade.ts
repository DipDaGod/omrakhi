/**
 * Firm policy. Everything on /how-to-order, /custom and /export that is a
 * commercial commitment rather than a fact about a product lives here.
 *
 * ⚠ CONFIRM EVERY VALUE IN THIS FILE WITH THE FIRM BEFORE LAUNCH.
 * These are drafted to trade-standard terms so the pages can be built and
 * reviewed. Publishing a policy the firm does not actually follow is worse
 * than publishing none — see CONTENT.md.
 */

export const TERMS = {
  booking: {
    /** Percentage taken as advance to confirm a booking. */
    advancePercent: 30,
    balance: 'Balance against dispatch, before goods leave the godown.',
    confirms:
      'An order is confirmed when the advance is received and we send back a signed order sheet with article numbers, quantities and a dispatch week.',
    methods: ['Bank transfer (NEFT / RTGS / IMPS)', 'UPI', 'Cheque, subject to clearing'],
  },

  rates: {
    basis: 'Net, ex-GST, per piece. GST is charged at the applicable rate on the invoice.',
    volume: 'Rates step down at higher quantities per design, not on total order value.',
    validity: 'A quoted rate holds for the season it was quoted in.',
    whyNotPublished:
      'Rates move with material cost through the season and vary by quantity and by how long we have worked with a buyer. A published list would be wrong within weeks and would price every dealer identically regardless of what they actually book.',
  },

  dispatch: {
    modes: [
      {
        name: 'Transport (road)',
        detail:
          'The normal route for anything above a few cartons. Goods are booked to a transport company; you receive a bilty (LR) number and collect from their godown in your city.',
      },
      {
        name: 'Courier',
        detail:
          'For samples and small top-up orders. Door delivery, faster, and materially more expensive per kilo.',
      },
    ],
    freight: 'Freight is to the buyer’s account and paid at the receiving end, unless agreed otherwise in writing.',
    /** Typical road transit from Kolkata. Used by /how-to-order and city pages. */
    transitDays: [
      { to: 'Guwahati', days: '2–3' },
      { to: 'Raipur', days: '2–4' },
      { to: 'Patna, Ranchi', days: '2–3' },
      { to: 'Hyderabad', days: '3–5' },
      { to: 'Delhi', days: '4–6' },
      { to: 'Jaipur', days: '4–6' },
      { to: 'Bengaluru, Chennai', days: '4–6' },
      { to: 'Mumbai, Ahmedabad', days: '5–7' },
    ],
  },

  damages: {
    window: 7,
    policy:
      'Check the consignment at the transport godown before you take delivery. Breakage in transit is claimed against the transporter, and we will supply the invoice and packing list you need to file it. Manufacturing defects — a stone out of its cup, a dori that has not held — are ours: report them with photographs within 7 days of delivery and we replace the pieces in your next dispatch or credit them against the balance.',
    notCovered: 'Goods that have been retail-displayed for a season, and colour variation within the stated batch tolerance on handicraft lines.',
  },

  samples: {
    available: true,
    policy:
      'We send a sample box of 20–25 pieces chosen across the categories you are interested in. The box is charged at rate plus courier; the amount is adjusted in full against your first order.',
    lead: '2–3 working days to despatch, plus courier transit.',
  },

  custom: {
    /** Custom minimums are higher than catalogue MOQ, and stating that filters enquiries. */
    minPiecesPerDesign: 1000,
    minPiecesLogoCard: 2000,
    sampling: {
      lead: '10–15 days from approved artwork to a physical sample.',
      cost: 'Sampling is charged. The charge is adjusted against the production order if it goes ahead.',
    },
    leadWeeks: { production: '6–8 weeks from sample approval', packing: '2 weeks' },
    /** Latest sensible booking date for custom work, as a month-day in the season year. */
    bookByMonthDay: '04-15',
    canCustomise: [
      'Design and stone layout',
      'Colour and dori',
      'Card printing, size and layout',
      'Box and carton branding',
      'Your logo on card or box',
      'Barcoding and MRP labelling for modern trade',
    ],
  },

  export: {
    /** Be honest. Raise these only when the firm has actually done the work. */
    documentsHandled: [
      'Commercial invoice and packing list',
      'Shipping bill filing through our CHA',
      'Certificate of origin where required',
    ],
    documentsBuyerHandles: [
      'Import clearance and duty in the destination country',
      'Any destination-specific labelling or compliance',
      'Inland freight from the arrival port or airport',
    ],
    packing:
      'Export consignments are packed in double-walled cartons with an inner polybag per box, strapped and marked. Carton weight is kept under 25 kg so it can be handled without a forklift at the far end.',
    payment: 'Advance by bank transfer, or against documents through the bank. Letter of credit for established buyers.',
    currencyNote: 'Rates are quoted on enquiry, in INR or USD. We do not publish converted prices.',
  },
} as const;

/** Catalogue files in public/catalogue/. Versioned by season in the filename. */
export const CATALOGUE = {
  full: { file: null as string | null, sizeMb: null as number | null, pages: null as number | null, updated: null as string | null },
  printedAvailable: true,
} as const;
