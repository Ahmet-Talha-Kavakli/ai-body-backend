/**
 * V4.7 Faz 4 — B4 Favori Mekan Seed
 *
 * Mia, Kerem, Selin, Ayşe için Türkiye odaklı (İstanbul) gerçek-tarz mekanlar.
 * Üretilmiş kafe/restoran adları, semt + il + kategori + tutarlı notlar.
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-v47-faz4-venues.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

type SeedVenue = {
  name: string
  city: string
  district: string
  category: 'cafe' | 'restaurant' | 'park' | 'gym' | 'shop' | 'bar' | 'work'
  visitFrequency: 'regular' | 'occasional' | 'rare'
  notes?: string
}

const VENUES: Record<string, SeedVenue[]> = {
  Mia: [
    {
      name: 'Norm Coffee',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'cafe',
      visitFrequency: 'regular',
      notes: 'her sabahın kafesi, latte takıntılı',
    },
    {
      name: 'Moda Sahili',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'park',
      visitFrequency: 'regular',
      notes: 'akşam yürüyüşü, kafa boşaltma',
    },
    {
      name: 'Çiya Sofrası',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'restaurant',
      visitFrequency: 'occasional',
      notes: 'arkadaşlarla, ev gibi',
    },
    {
      name: 'Kahve Dünyası — Bağdat',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'cafe',
      visitFrequency: 'occasional',
    },
    {
      name: 'MAC Fit Bostancı',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'gym',
      visitFrequency: 'regular',
      notes: 'haftada 3, sabah 7',
    },
  ],
  Kerem: [
    {
      name: 'Petra Roasting',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'cafe',
      visitFrequency: 'regular',
      notes: 'kod yazma yeri',
    },
    {
      name: 'Karaköy Güllüoğlu',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'restaurant',
      visitFrequency: 'rare',
      notes: 'eski iş arkadaşlarıyla buluşma',
    },
    {
      name: 'Caddebostan Sahili',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'park',
      visitFrequency: 'occasional',
    },
    {
      name: 'Coworking Hub Levent',
      city: 'İstanbul',
      district: 'Beşiktaş',
      category: 'work',
      visitFrequency: 'regular',
    },
    {
      name: 'Kıkırdak Bar',
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'bar',
      visitFrequency: 'occasional',
      notes: 'cuma akşamları',
    },
  ],
  Selin: [
    {
      name: 'Mums Cafe Cihangir',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'cafe',
      visitFrequency: 'regular',
      notes: 'sanat dergileri okuduğu yer',
    },
    {
      name: 'Salt Galata',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'shop',
      visitFrequency: 'occasional',
      notes: 'sergi takip',
    },
    {
      name: 'Ulus Parkı',
      city: 'İstanbul',
      district: 'Beşiktaş',
      category: 'park',
      visitFrequency: 'rare',
    },
    {
      name: 'Mandabatmaz',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'cafe',
      visitFrequency: 'occasional',
      notes: 'türk kahvesi',
    },
    {
      name: 'Atelier Studio',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'work',
      visitFrequency: 'regular',
      notes: 'kendi atölyesi',
    },
  ],
  Ayşe: [
    {
      name: "Walter's Coffee — Moda",
      city: 'İstanbul',
      district: 'Kadıköy',
      category: 'cafe',
      visitFrequency: 'regular',
    },
    {
      name: 'Cafe Privato',
      city: 'İstanbul',
      district: 'Beyoğlu',
      category: 'restaurant',
      visitFrequency: 'occasional',
      notes: 'önemli akşam yemekleri',
    },
    {
      name: 'Maçka Demokrasi Parkı',
      city: 'İstanbul',
      district: 'Şişli',
      category: 'park',
      visitFrequency: 'occasional',
    },
    {
      name: 'Migros — Etiler',
      city: 'İstanbul',
      district: 'Beşiktaş',
      category: 'shop',
      visitFrequency: 'regular',
      notes: 'haftalık alışveriş',
    },
  ],
}

async function main() {
  const characters = await db.character.findMany({
    where: { name: { in: Object.keys(VENUES) } },
    select: { id: true, name: true },
  })

  let total = 0
  for (const char of characters) {
    const venues = VENUES[char.name]
    if (!venues) continue

    // Mevcut venue'leri temizle (idempotent seed)
    await db.characterFavoriteVenue.deleteMany({ where: { characterId: char.id } })

    for (const v of venues) {
      await db.characterFavoriteVenue.create({
        data: {
          characterId: char.id,
          name: v.name,
          city: v.city,
          district: v.district,
          category: v.category,
          visitFrequency: v.visitFrequency,
          notes: v.notes ?? null,
          active: true,
        },
      })
      total++
    }
    console.log(`✓ ${char.name}: ${venues.length} mekan seed edildi`)
  }
  console.log(`\nToplam: ${total} venue, ${characters.length} karakter`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
