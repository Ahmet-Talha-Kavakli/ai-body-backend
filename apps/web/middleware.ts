import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/features',
  '/pricing',
  '/about',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

const isDev = process.env.NODE_ENV === 'development'
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fitai.app'

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  // Force HTTPS for 1 year
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy — restrict powerful browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), payment=()'
  )
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://cdn.jsdelivr.net`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https: http:`,
    `connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://clerk.com wss: ${isDev ? 'ws:' : ''}`,
    `media-src 'self' blob:`,
    `worker-src 'self' blob:`,
    `frame-ancestors 'none'`,
  ]
    .filter(Boolean)
    .join('; ')
  response.headers.set('Content-Security-Policy', csp)

  return response
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Giriş yapmamış kullanıcı dashboard'a girmeye çalışırsa sign-in'e yönlendir
  if (!userId && isDashboardRoute(req)) {
    const redirectResponse = NextResponse.redirect(new URL('/sign-in', req.url))
    return applySecurityHeaders(redirectResponse)
  }

  // Giriş yapmamış kullanıcı onboarding'e girmeye çalışırsa sign-in'e yönlendir
  if (!userId && req.nextUrl.pathname === '/onboarding') {
    const redirectResponse = NextResponse.redirect(new URL('/sign-in', req.url))
    return applySecurityHeaders(redirectResponse)
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
