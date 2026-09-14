/**
 * P11 — the facts on /about that only the firm can supply.
 *
 * Anything left null is omitted from the page rather than guessed at. An
 * unclaimed founding year is better than a disputed one, and a team section
 * with invented names is worse than no team section.
 *
 * ⚠ Fill these in with the firm before launch. See CONTENT.md.
 */
export const STORY: {
  foundedYear: number | null;
  generations: number | null;
  /** How many artisans, doing what. State it as fact or not at all. */
  artisans: { count: number; work: string; homeBased: number } | null;
  team: { name: string; role: { en: string; hi: string } }[];
} = {
  foundedYear: null,
  generations: null,
  artisans: null,
  team: [],
};
