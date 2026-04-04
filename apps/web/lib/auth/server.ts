import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated user from the database.
 * Redirects to sign-in if not authenticated.
 */
export async function getAuthUser() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      healthProfile: true,
      injuries: { where: { isActive: true } },
      subscription: true,
    },
  })

  if (!user) {
    // User exists in Clerk but not yet in our DB — sync
    const clerkUser = await currentUser()
    if (!clerkUser) redirect('/sign-in')

    return db.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        avatarUrl: clerkUser.imageUrl,
      },
      include: {
        healthProfile: true,
        injuries: true,
        subscription: true,
      },
    })
  }

  return user
}

/**
 * Get clerk user ID or throw. Use in API routes.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}
