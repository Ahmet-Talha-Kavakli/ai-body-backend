/**
 * CharacterMemoryFact'lerinden suçlama pattern'lerini archive et.
 */

import { PrismaClient } from '@prisma/client'
import { sanitizeFalseRepeat } from '../lib/assistant/repeat-detector'

const prisma = new PrismaClient()

async function main() {
  const facts = await prisma.characterMemoryFact.findMany({
    where: { archived: false },
    select: { id: true, content: true },
  })

  console.log(`Aktif fact: ${facts.length}`)

  let archived = 0
  for (const f of facts) {
    const result = sanitizeFalseRepeat(f.content)
    if (!result.modified) continue
    // Suçlama içeren fact'i archive et
    await prisma.characterMemoryFact.update({
      where: { id: f.id },
      data: { archived: true, archivedAt: new Date() },
    })
    archived++
  }

  console.log(`Archive edilen fact: ${archived}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
