import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lftz25oez4aqbxpq.public.blob.vercel-storage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize Three.js / WASM loading
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    return config
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },
}

export default nextConfig
