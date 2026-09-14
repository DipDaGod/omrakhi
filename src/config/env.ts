/**
 * Build-time environment.
 *
 * Read through one accessor rather than scattered `import.meta.env` lookups,
 * because the two runtimes disagree: Vite exposes `import.meta.env` in module
 * code, while a Vercel build puts project environment variables on
 * `process.env`. Every value here is read during the static build and baked
 * into the HTML — nothing is read in the browser.
 */
function read(...names: string[]): string | undefined {
  for (const name of names) {
    const fromVite = (import.meta.env as Record<string, string | undefined>)?.[name];
    if (fromVite) return fromVite;
    if (typeof process !== 'undefined' && process.env?.[name]) return process.env[name];
  }
  return undefined;
}

const flag = (...names: string[]) => {
  const value = read(...names)?.toLowerCase();
  return value === '1' || value === 'true';
};

/**
 * Vercel sets these on every build. `VERCEL_ENV` is 'production', 'preview' or
 * 'development'; outside Vercel they are simply absent.
 * https://vercel.com/docs/environment-variables/system-environment-variables
 */
const vercelEnv = read('VERCEL_ENV', 'PUBLIC_VERCEL_ENV');

export const ENV = {
  onVercel: vercelEnv !== undefined,

  /**
   * True for preview and branch deployments. Those get a `noindex` meta tag:
   * Vercel already sends `X-Robots-Tag: noindex` on non-production
   * deployments, but a preview URL that leaks into a WhatsApp thread is
   * exactly the kind of thing that ends up indexed, and two defences cost
   * nothing. Canonical URLs point at SITE.origin regardless, which is the
   * stronger guarantee of the two.
   */
  isPreview: vercelEnv !== undefined && vercelEnv !== 'production',

  /**
   * Vercel Speed Insights closes the one gap in the A9 enforcement story: LCP
   * and CLS cannot be measured in a build, and these are field measurements
   * from real dealers on real phones rather than a lab run. Off unless
   * switched on, and the privacy page changes with it.
   *
   * Enable the feature in the Vercel project first, then set
   * PUBLIC_SPEED_INSIGHTS=1. The script is served from this origin
   * (/_vercel/…), so it needs no CSP exception.
   */
  speedInsights: flag('PUBLIC_SPEED_INSIGHTS'),

  /** Vercel Web Analytics. Same arrangement: off unless switched on. */
  webAnalytics: flag('PUBLIC_WEB_ANALYTICS'),
} as const;

export const ANALYTICS_ON = ENV.speedInsights || ENV.webAnalytics;
