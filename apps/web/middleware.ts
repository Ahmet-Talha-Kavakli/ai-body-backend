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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Giriş yapmamış kullanıcı dashboard'a girmeye çalışırsa sign-in'e yönlendir
  if (!userId && isDashboardRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Giriş yapmamış kullanıcı onboarding'e girmeye çalışırsa sign-in'e yönlendir
  if (!userId && req.nextUrl.pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
