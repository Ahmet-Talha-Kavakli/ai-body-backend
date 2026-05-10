import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const ch = await p.character.findFirst({
    where: { tier: 'user_created', publishStatus: 'published', name: { contains: 'eh' } },
    select: { id: true, userId: true, name: true },
  })
  if (!ch) {
    console.log('Karakter yok')
    return
  }
  const existing = await p.marketplaceListing.findUnique({ where: { characterId: ch.id } })
  if (existing) {
    console.log('Zaten listing var:', existing.id)
    return
  }
  const l = await p.marketplaceListing.create({
    data: {
      characterId: ch.id,
      ownerId: ch.userId,
      rentPrice7d: 50,
      rentPrice14d: 75,
      rentPrice30d: 120,
      rentEnabled: true,
      buyEnabled: false,
      concurrentLimit: 5,
      publishedAt: new Date(),
    },
  })
  console.log(`Listing yaratıldı: ${l.id} for ${ch.name}`)
}
main().finally(() => p.$disconnect())
