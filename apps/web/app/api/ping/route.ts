import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Public health check endpoint — no auth required.
// Used by load balancers, Kubernetes liveness probes, and monitoring systems.
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
  })
}
