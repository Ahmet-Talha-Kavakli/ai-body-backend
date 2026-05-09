/**
 * Geçmiş AI mesajlarındaki "iki kere yazdın" tarzı suçlamaları kalıcı temizler.
 * sanitizeFalseRepeat'ı tüm karakter sohbetlerindeki AI mesajlarına uygular.
 *
 * Neden: Claude/Haiku conversation history'den eski cevaplarını okuyup
 * "ben böyle konuşuyorum" diye taklit ediyor. Pattern'leri DB'den kaldırınca
 * kökten çözülüyor.
 */

import { PrismaClient } from '@prisma/client'
import { sanitizeFalseRepeat } from '../lib/assistant/repeat-detector'

const prisma = new PrismaClient()

async function main() {
  const msgs = await prisma.assistantMessage.findMany({
    where: {
      role: 'assistant',
      conversation: { characterId: { not: null } },
    },
    select: { id: true, content: true },
  })

  console.log(`Toplam karakter AI mesajı: ${msgs.length}`)

  let modified = 0
  let totallyEmptied = 0
  for (const m of msgs) {
    const result = sanitizeFalseRepeat(m.content)
    if (!result.modified) continue

    if (result.cleaned.length < 5) {
      // Tüm cevap suçlamaymış — fallback metin
      await prisma.assistantMessage.update({
        where: { id: m.id },
        data: { content: 'Hımm, anladım.' },
      })
      totallyEmptied++
    } else {
      await prisma.assistantMessage.update({
        where: { id: m.id },
        data: { content: result.cleaned },
      })
    }
    modified++
  }

  console.log(`Temizlenen mesaj: ${modified}`)
  console.log(`Tamamen boş kalan (fallback'e çevrilen): ${totallyEmptied}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
