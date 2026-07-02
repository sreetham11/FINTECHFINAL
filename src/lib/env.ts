/**
 * Server-side environment access with fail-loud semantics.
 *
 * The previous approach scattered `process.env.X || 'placeholder'` fallbacks
 * across the codebase. For a fintech app that's dangerous: a missing
 * DATABASE_URL would silently connect to a local/placeholder database instead
 * of surfacing the misconfiguration. These helpers throw a clear error in
 * production when a required variable is absent, while still allowing a
 * developer-friendly fallback in local development.
 */

const isProd = process.env.NODE_ENV === 'production';
// `next build` imports route modules (which pull in prisma/supabase) with
// NODE_ENV=production. We must not throw during the build — only when a real
// request is served — otherwise a build without env configured would fail.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Returns a required server env var.
 *   - Present            → returned as-is.
 *   - Missing at runtime in production → throws (fail loud, no silent
 *     connection to a placeholder database).
 *   - Missing in dev / during build with a fallback → warns and uses it.
 */
export function requireServerEnv(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;

  const mustThrow = (isProd && !isBuildPhase) || devFallback === undefined;
  if (mustThrow) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Set it in .env.local (see .env.local.example).`
    );
  }

  console.warn(
    `[env] "${name}" is not set — using fallback. ` +
      `Set it in .env.local before deploying.`
  );
  return devFallback as string;
}
