import { db } from '../lib/db/client'
async function main() {
  const ch = await db.character.findMany({
    where: { name: { contains: 'mehe', mode: 'insensitive' } },
    select: { id: true, name: true, creatorId: true },
  })
  console.log('characters:', ch)
  for (const c of ch) {
    const l = await db.marketplaceListing.findUnique({
      where: { characterId: c.id },
      select: { id: true, ownerId: true, boostUntil: true },
    })
    console.log(`listing for ${c.name}:`, l)
  }
}
main().then(() => process.exit(0))
