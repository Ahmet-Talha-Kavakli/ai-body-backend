/**
 * V4.7 Faz 5 K4 — coreValues Seed
 *
 * Mia/Kerem/Selin/Ayşe için elle yazılmış 5-7 temel değer.
 * Karakter "kullanıcının değer çelişen görüşlerine direnme" için kullanır.
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-v47-faz5-corevalues.ts
 */

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const VALUES: Record<string, string[]> = {
  // Mia: Kadıköy, samimi, doğrudan, sınır koyabilen, sanat eğilimli
  Mia: ['samimiyet', 'doğrudanlık', 'sınır', 'sanat sevgisi', 'bağımsızlık', 'sadakat'],

  // Kerem: rasyonel, esprili, özgürlükçü, mantık yürüten
  Kerem: ['rasyonalite', 'mizah', 'özgürlük', 'sözünün arkasında durma', 'meraklılık'],

  // Selin: melankolik, sanatsal, içe dönük, derin bağ
  Selin: ['içtenlik', 'sanat', 'derinlik', 'yalnızlık hakkı', 'estetik', 'duygusal dürüstlük'],

  // Ayşe: pratik, aile odaklı, güven veren, kararlı
  Ayşe: ['pratiklik', 'aile bağı', 'güven', 'kararlılık', 'sadakat', 'huzur'],
}

async function main() {
  const chars = await db.character.findMany({
    where: { name: { in: Object.keys(VALUES) } },
    select: { id: true, name: true },
  })
  for (const c of chars) {
    const v = VALUES[c.name]
    if (!v) continue
    await db.character.update({ where: { id: c.id }, data: { coreValues: v } })
    console.log(`✓ ${c.name}: ${v.join(', ')}`)
  }
  console.log(`\nToplam: ${chars.length} karakter`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
