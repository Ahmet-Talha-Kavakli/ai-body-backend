import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const r = await prisma.character.updateMany({
    where: { tier: 'user_created', publishStatus: 'pending_review' },
    data: { publishStatus: 'published' },
  })
  console.log(`Approved ${r.count} pending characters → published`)
}
main().finally(() => prisma.$disconnect())
