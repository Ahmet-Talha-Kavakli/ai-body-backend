import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const msgs = await prisma.assistantMessage.findMany({
    where: {
      createdAt: { gte: since },
      conversation: { characterId: { not: null } },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true, audioUrl: true },
  })

  console.log('All messages chronological (last 2h):\n')
  for (const m of msgs) {
    const audio = m.audioUrl ? 'AUDIO' : '     '
    console.log(
      `${m.createdAt.toISOString().slice(11, 19)} ${audio} [${m.role.padEnd(9)}] ${m.content.slice(0, 90)}`
    )
  }
}

main().finally(() => prisma.$disconnect())
