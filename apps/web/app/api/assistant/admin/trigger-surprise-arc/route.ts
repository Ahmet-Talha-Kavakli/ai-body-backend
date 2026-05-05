/**
 * V3 Faz C — Manuel Surprise Arc Tetikle (DEV)
 *
 * POST /api/assistant/admin/trigger-surprise-arc
 *   Body: { force?: boolean } — true ise olasılığı atlar, %100 üretir.
 *
 * Sadece test için. Production'da disable edilir veya admin auth eklenir.
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { tryGenerateSurpriseArc } from '@/lib/assistant/surprise-arc-generator'

export const POST = withAuth(async (req, { user }) => {
  const body = (await req.json().catch(() => ({}))) as { force?: boolean }

  const result = await tryGenerateSurpriseArc(user.id, body.force === true)
  return NextResponse.json(result)
})
