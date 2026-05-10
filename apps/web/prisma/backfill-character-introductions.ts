/**
 * V4.5 — Mevcut karakterler için CharacterIntroduction backfill
 *
 * Daha önce spawn olmuş karakterlerin introduction kaydı yok. Bu script
 * onlar için template'lerinden geriye dönük introduction yazar.
 *
 * Çalıştırma: pnpm tsx prisma/backfill-character-introductions.ts
 */

import { PrismaClient } from '@prisma/client'
import { getCharacterTemplate } from '../lib/assistant/character-templates'
import {
  validateFirstContact,
  recordCharacterIntroduction,
  templateScenarioToValidatable,
} from '../lib/assistant/first-contact'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 CharacterIntroduction backfill başlıyor...\n')

  const characters = await prisma.character.findMany({
    where: {
      name: { in: ['Mia', 'Kerem', 'Selin', 'Ayşe', 'Mehmet'] },
      introduction: null,
    },
    select: { id: true, name: true, userId: true, physicalCity: true },
  })

  console.log(`📋 ${characters.length} introduction'sız karakter bulundu.\n`)

  for (const c of characters) {
    const key = c.name.toLowerCase().replace('ı', 'i').replace('ş', 's')
    const template = getCharacterTemplate(key)
    if (!template) {
      console.log(`⚠️  ${c.name}: template bulunamadı`)
      continue
    }
    const proposedScenario = templateScenarioToValidatable(template)
    const validated = await validateFirstContact({
      userId: c.userId,
      templateKey: key,
      proposedScenario,
      characterPhysicalCity: c.physicalCity,
    })
    await recordCharacterIntroduction({
      userId: c.userId,
      characterId: c.id,
      scenario: validated.scenario,
      platform: validated.platform,
      viaCharacterId: validated.viaCharacterId,
      reasonText: validated.reasonText,
      physicalProximityCity: validated.physicalProximityCity,
    })
    console.log(
      `✓ ${c.name.padEnd(8)} → ${validated.scenario.padEnd(20)} | "${validated.reasonText}"${
        validated.rewritten ? ' [REWRITTEN]' : ''
      }`
    )
  }

  console.log(`\n✅ Tamamlandı.`)
}

main()
  .catch((e) => {
    console.error('❌ Backfill hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
