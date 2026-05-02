import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'

const SUPABASE_URL = 'https://bollxgwrevnwjhnzdwcb.supabase.co'
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbGx4Z3dyZXZud2pobnpkd2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTgwOTUsImV4cCI6MjA5MTA3NDA5NX0.E7LAox2rfeDDHBgb2qGXh-mUGQ2Se3Up5XDR0uyjE-o'
const BUCKET = 'activity-images'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`
  const arrayBuf = await file.arrayBuffer()

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: Buffer.from(arrayBuf),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
  return NextResponse.json({ url: publicUrl })
})
