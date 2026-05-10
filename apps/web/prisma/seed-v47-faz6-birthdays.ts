/**
 * V4.7 Faz 6 B1 — Karakter doğum günü seed
 *
 * Mia/Kerem/Selin/Ayşe için doğum tarihleri (year önemsiz, MM-DD karşılaştırılıyor).
 * Bugüne (2026-05-08) yakın bir tarih Mia'ya verildi → birthday-checker test edilebilir.
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-v47-faz6-birthdays.ts
 */

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// year=2000 nominal, MM-DD önemli
const BIRTHDAYS: Record<string, string> = {
  Mia: '2000-05-08', // bugün — test için
  Kerem: '2000-09-15',
  Selin: '2000-03-22',
  Ayşe: '2000-11-03',
}

async function main() {
  const chars = await db.character.findMany({
    where: { name: { in: Object.keys(BIRTHDAYS) } },
    select: { id: true, name: true },
  })
  for (const c of chars) {
    const dateStr = BIRTHDAYS[c.name]
    if (!dateStr) continue
    await db.character.update({
      where: { id: c.id },
      data: { birthDate: new Date(dateStr) },
    })
    console.log(`✓ ${c.name}: ${dateStr}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
