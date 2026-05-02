/**
 * Mobile rehber kayıtlarını backend ContactShadow'a sync eder.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface ContactInput {
  externalId: string
  name: string
  phoneNumbers?: string[]
  emails?: string[]
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { contacts: ContactInput[] }
  if (!Array.isArray(body.contacts)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Full replace
  await db.contactShadow.deleteMany({ where: { userId: user.id } })

  if (body.contacts.length > 0) {
    await db.contactShadow.createMany({
      data: body.contacts
        .filter((c) => c.name && c.externalId)
        .map((c) => ({
          userId: user.id,
          externalId: c.externalId,
          name: c.name,
          phoneNumbers: c.phoneNumbers ?? [],
          emails: c.emails ?? [],
        })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ ok: true, synced: body.contacts.length })
})
