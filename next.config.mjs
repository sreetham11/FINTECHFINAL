/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Type/lint errors are surfaced via `npm run typecheck` / `npm run lint`
    // instead of blocking builds. Consider tightening these once the existing
    // errors are cleaned up.
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Tree-shake large libraries so only the icons/components actually used are
    // bundled, reducing client JS. Safe, transparent transform.
    optimizePackageImports: ['recharts', 'framer-motion'],
  },
};

export default nextConfig;
