import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.aiCallLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { model: true, createdAt: true, purpose: true, inputTokens: true, outputTokens: true },
  })
  for (const l of logs) {
    console.log(
      `${l.createdAt.toISOString().slice(11, 19)} | ${l.purpose} | ${l.model} | in=${l.inputTokens} out=${l.outputTokens}`
    )
  }
}

main().finally(() => prisma.$disconnect())
