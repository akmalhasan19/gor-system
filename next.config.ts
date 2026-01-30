import type { NextConfig } from "next";

// Bundle Analyzer - enable with ANALYZE=true npm run build
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Content Security Policy - Tightened per SECURITY_AUDIT.md recommendations
// - Remove 'unsafe-eval' in production to prevent eval() attacks
// - Add frame-ancestors, base-uri, form-action for additional protection
const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  // Allow 'unsafe-eval' only in development for hot reload/debugging
  `script-src 'self' ${isDev ? "'unsafe-eval'" : ""} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https: ${isDev ? 'http://127.0.0.1:54321' : ''}`,
  "font-src 'self' data:",
  `connect-src 'self' https://haknornfainyyfrnzyxp.supabase.co wss://haknornfainyyfrnzyxp.supabase.co ${isDev ? 'http://127.0.0.1:54321 ws://127.0.0.1:54321' : ''}`,
  "frame-ancestors 'none'",  // Prevent clickjacking
  "base-uri 'self'",         // Prevent <base> tag injection
  "form-action 'self'",      // Restrict form submissions to same origin
].join('; ');

const nextConfig: NextConfig = {
  /* config options here */
  // Empty turbopack config to silence migration warning
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'haknornfainyyfrnzyxp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives
          }
        ]
      }
    ]
  }
};

const withSerwist = require("@serwist/next").default({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Disable in development for Turbopack compatibility
  disable: process.env.NODE_ENV !== 'production',
});

// Wrap with both plugins: Bundle Analyzer -> Serwist -> Next Config
export default withBundleAnalyzer(withSerwist(nextConfig));
