import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const listings = await p.marketplaceListing.findMany({
    include: { character: { select: { name: true, publishStatus: true, isRetired: true } } },
  })
  console.log(`Total listings: ${listings.length}`)
  for (const l of listings) {
    console.log(
      `- ${l.character.name} (${l.character.publishStatus}, retired=${l.character.isRetired}): rent=${l.rentEnabled} buy=${l.buyEnabled} 7d=${l.rentPrice7d} 30d=${l.rentPrice30d}`
    )
  }
}
main().finally(() => p.$disconnect())
