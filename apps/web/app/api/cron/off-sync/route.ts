/**
 * Weekly OpenFoodFacts dump sync.
 * Vercel cron header'ı kontrol edilir, sonra import script'i tetiklenir.
 *
 * vercel.json'a:
 *   {
 *     "crons": [{ "path": "/api/cron/off-sync", "schedule": "0 4 * * 0" }]
 *   }
 *
 * Çalışma zamanı uzun: bu route Vercel'de 5 dk timeout'a takılır.
 * Production'da bunu Vercel cron yerine GitHub Actions veya kendi sunucudan tetikle.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Production'da bu komutu ayrı bir worker'a delege et — Vercel function timeout'u 5dk.
    // Şimdilik manuel: pnpm --filter web tsx scripts/import-off-dump.ts
    const { stdout, stderr } = await execAsync(
      'cd /Users/talha/Desktop/AiPt/ai-pt/apps/web && ./node_modules/.bin/tsx scripts/import-off-dump.ts',
      { maxBuffer: 50 * 1024 * 1024 }
    )
    return NextResponse.json({ ok: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-2000) })
  } catch (err) {
    console.error('[off-sync]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
