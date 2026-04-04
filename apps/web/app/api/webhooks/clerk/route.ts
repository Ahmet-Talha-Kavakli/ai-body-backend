import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/db/client'
import type { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json() as unknown
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    await db.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email: email_addresses[0]?.email_address ?? '',
        name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        avatarUrl: image_url,
      },
      update: {},
    })
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    await db.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses[0]?.email_address ?? '',
        name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        avatarUrl: image_url,
      },
    })
  }

  if (evt.type === 'user.deleted' && evt.data.id) {
    await db.user.delete({ where: { clerkId: evt.data.id } }).catch(() => null)
  }

  return new Response('OK', { status: 200 })
}
