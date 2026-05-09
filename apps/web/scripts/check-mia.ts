import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const chars = await prisma.character.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      currentMood: true,
      currentActivity: true,
      lastSeenAt: true,
      pendingChainCount: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log('All characters:')
  for (const c of chars) {
    console.log(
      `  ${c.id} | ${c.name} | ${c.status} | mood=${c.currentMood} | activity=${c.currentActivity} | lastSeen=${c.lastSeenAt?.toISOString().slice(0, 16)} | pending=${c.pendingChainCount}`
    )
  }
}

main().finally(() => prisma.$disconnect())
