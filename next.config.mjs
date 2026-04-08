import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
};

// Bundle analyzer — run with: ANALYZE=true npm run build
// Requires: npm install -D @next/bundle-analyzer
let config = nextConfig;
if (process.env.ANALYZE === "true") {
  const { default: withBundleAnalyzer } = await import("@next/bundle-analyzer");
  config = withBundleAnalyzer({ enabled: true })(nextConfig);
}

// Sentry подключается только если задан DSN
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Автоматически загружает source maps (нужен SENTRY_AUTH_TOKEN)
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : config;
