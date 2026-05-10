/**
 * Marketplace seed karakterleri için DALL-E 3 ile farklı avatarlar üret.
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-marketplace-avatars.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateCharacterAvatar } from '../lib/marketplace/avatar-generator'

const db = new PrismaClient()

const PROMPTS: Record<string, string> = {
  Defne:
    '25 yaşında kadın, kahverengi dalgalı omuz hizası saç, yeşil gözler, bilge ve sıcak ifade, krem rengi triko, İstanbul kafesinde, doğal ışık',
  Cem: '30 yaşında erkek, kısa siyah saç, koyu kahve gözler, düşünceli ifade, gri kazak, hafif sakallı, Ankara, akşam ışığı',
  Onur: '27 yaşında erkek, dağınık kahverengi saç, gülen gözler, esprici ifade, mavi tişört, İzmir sahil arka plan, parlak gündüz',
  Pelin:
    '26 yaşında kadın, siyah uzun düz saç, koyu kahve gözler, kendinden emin sokak tarzı, deri ceket, İstanbul gece',
  İnci: '29 yaşında kadın, sarışın orta uzunluk saç, mavi gözler, sakin ve bilge ifade, beyaz gömlek, Bursa park arka plan, yumuşak ışık',
  Burak:
    '32 yaşında erkek, kahverengi saç, hafif kırlaşmış sakal, ela gözler, düşünür filozof havası, lacivert blazer, Antalya deniz manzarası',
  Ada: '24 yaşında kadın, kısa kestane saç, kahverengi gözler, doğal sokak tarzı, beyaz tişört+kot ceket, İstanbul Kadıköy sokak',
  Emir: '28 yaşında erkek, açık kahverengi saç, yeşil gözler, samimi gülümseme, açık renkli triko, İzmir kafe arka plan',
}

async function main() {
  const characters = await db.character.findMany({
    where: { name: { in: Object.keys(PROMPTS) } },
    select: { id: true, name: true, age: true, gender: true, hometown: true },
  })

  console.log(`Found ${characters.length} characters to generate avatars`)

  for (const char of characters) {
    const userPrompt = PROMPTS[char.name]
    if (!userPrompt) continue
    console.log(`\n→ Generating ${char.name}...`)
    const result = await generateCharacterAvatar({
      characterId: char.id,
      userPrompt,
      characterContext: {
        name: char.name,
        age: char.age,
        gender: char.gender,
        hometown: char.hometown,
        category: null,
        bio: null,
      },
    })
    if (result.ok) {
      console.log(`✓ ${char.name}: ${result.url}`)
    } else {
      console.log(`✗ ${char.name}: ${result.reason}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
