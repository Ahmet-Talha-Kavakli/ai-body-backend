import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const result = await prisma.character.updateMany({
    data: { tier: 'free_official', publishStatus: 'published' },
  })
  console.log(`Updated ${result.count} characters to free_official/published`)
}
main().finally(() => prisma.$disconnect())
