import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete DB first (cascade removes all related records)
    await db.user.delete({ where: { clerkId } })

    // Then delete Clerk user — if this fails, DB is already deleted (log only)
    try {
      const client = await clerkClient()
      await client.users.deleteUser(clerkId)
    } catch (clerkErr) {
      console.error('Clerk user deletion failed after DB delete:', clerkErr)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
