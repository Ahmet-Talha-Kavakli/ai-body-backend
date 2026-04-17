import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
      { protocol: 'https', hostname: 'vercel.live' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {},
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    return config
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
})
