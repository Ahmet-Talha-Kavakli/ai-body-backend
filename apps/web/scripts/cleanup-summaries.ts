/**
 * Conversation runningSummary'lerinden suçlama pattern'lerini temizle.
 */

import { PrismaClient } from '@prisma/client'
import { sanitizeFalseRepeat } from '../lib/assistant/repeat-detector'

const prisma = new PrismaClient()

async function main() {
  const convs = await prisma.assistantConversation.findMany({
    where: {
      characterId: { not: null },
      runningSummary: { not: null },
    },
    select: { id: true, runningSummary: true },
  })

  console.log(`Summary'li conversation: ${convs.length}`)

  let modified = 0
  for (const c of convs) {
    if (!c.runningSummary) continue
    const result = sanitizeFalseRepeat(c.runningSummary)
    if (!result.modified) continue

    await prisma.assistantConversation.update({
      where: { id: c.id },
      data: { runningSummary: result.cleaned.length > 10 ? result.cleaned : null },
    })
    modified++
  }

  console.log(`Temizlenen summary: ${modified}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
