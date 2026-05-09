import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const conv = await prisma.assistantConversation.findFirst({
    where: { characterId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, characterId: true },
  })
  if (!conv) return
  const msgs = await prisma.assistantMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'desc' },
    take: 14,
    select: { id: true, role: true, content: true, createdAt: true },
  })
  msgs.reverse()
  for (const m of msgs) {
    console.log(
      `${m.createdAt.toISOString().slice(11, 19)} [${m.role.padEnd(9)}] ${m.content.slice(0, 110)}`
    )
  }
}

main().finally(() => prisma.$disconnect())
