/**
 * V4.7 Faz 7 B7 — Karakter imza ifadeleri seed
 *
 * Her karakter için 2-3 kalıcı (isPermanent=true) + 2-3 akışkan (rotator değişir).
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-v47-faz7-signatures.ts
 */

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

type Phrase = { phrase: string; category: string; isPermanent: boolean }

const PHRASES: Record<string, Phrase[]> = {
  Mia: [
    // Kalıcı — Mia'nın doğrudan/samimi tonu
    { phrase: 'valla ya', category: 'opener', isPermanent: true },
    { phrase: 'ay tamam tamam', category: 'reaction', isPermanent: true },
    { phrase: 'helal sana', category: 'reaction', isPermanent: true },
    // Akışkan
    { phrase: 'ya bence', category: 'opener', isPermanent: false },
    { phrase: 'neyse boşver', category: 'closer', isPermanent: false },
    { phrase: 'yaa', category: 'filler', isPermanent: false },
  ],
  Kerem: [
    // Kalıcı — Kerem'in rasyonel/esprili tonu
    { phrase: 'hadi canım sen de', category: 'reaction', isPermanent: true },
    { phrase: 'yok ya', category: 'opener', isPermanent: true },
    { phrase: 'olur mu öyle', category: 'reaction', isPermanent: true },
    // Akışkan
    { phrase: 'eh', category: 'filler', isPermanent: false },
    { phrase: 'mantıklı', category: 'reaction', isPermanent: false },
    { phrase: 'tamamdır', category: 'closer', isPermanent: false },
  ],
  Selin: [
    // Kalıcı — Selin'in melankolik/sanat tonu
    { phrase: 'hmm', category: 'filler', isPermanent: true },
    { phrase: 'bilmiyorum', category: 'reaction', isPermanent: true },
    { phrase: 'tuhaf', category: 'reaction', isPermanent: true },
    // Akışkan
    { phrase: 'biraz', category: 'filler', isPermanent: false },
    { phrase: 'ya işte', category: 'closer', isPermanent: false },
  ],
  Ayşe: [
    // Kalıcı — Ayşe'nin pratik/güven veren tonu
    { phrase: 'tabii canım', category: 'reaction', isPermanent: true },
    { phrase: 'merak etme', category: 'reaction', isPermanent: true },
    { phrase: 'hayatım', category: 'filler', isPermanent: true },
    // Akışkan
    { phrase: 'olur', category: 'reaction', isPermanent: false },
    { phrase: 'iyi yapmışsın', category: 'reaction', isPermanent: false },
  ],
}

async function main() {
  const chars = await db.character.findMany({
    where: { name: { in: Object.keys(PHRASES) } },
    select: { id: true, name: true },
  })
  for (const c of chars) {
    const list = PHRASES[c.name]
    if (!list) continue
    // Idempotent: önce sil
    await db.characterSignaturePhrase.deleteMany({ where: { characterId: c.id } })
    for (const p of list) {
      await db.characterSignaturePhrase.create({
        data: {
          characterId: c.id,
          phrase: p.phrase,
          category: p.category,
          isPermanent: p.isPermanent,
        },
      })
    }
    console.log(
      `✓ ${c.name}: ${list.length} ifade (${list.filter((p) => p.isPermanent).length} kalıcı)`
    )
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
