/**
 * Marketplace test data seed
 *
 * 4 fake user + 8 karakter (4 user_created + 2 premium_official + 2 free_official)
 * + 8 published listing
 * + Mehmet'e 2 kiracı (1 active + 1 ended)
 *
 * Avatar: Mia'nın avatar URL'sini placeholder olarak yeniden kullanıyor (DALL-E maliyet yok).
 *
 * Çalıştır: pnpm tsx apps/web/prisma/seed-marketplace-test-data.ts
 */

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const TALHA_USER_ID = 'cmntgyt630000lb04eyb9taqs'
const PLACEHOLDER_AVATAR =
  'https://v3b.fal.media/files/b/0a98f9cb/M5Cswz8PNH9cYdjfl8e9-_c72f264a1bea48bcbc5cfe4f35021587.jpg'

type Tier = 'free_official' | 'premium_official' | 'user_created'

const FAKE_USERS = [
  {
    clerkId: 'fake_user_001',
    email: 'ela@example.com',
    name: 'Ela Yılmaz',
    bio: 'Karakter yaratıyorum, drama severim.',
  },
  {
    clerkId: 'fake_user_002',
    email: 'baris@example.com',
    name: 'Barış Demir',
    bio: 'Yazılımcı, esprili karakterler yaparım.',
  },
  {
    clerkId: 'fake_user_003',
    email: 'zeynep@example.com',
    name: 'Zeynep Kaya',
    bio: 'Sanat öğrencisi, melankolik karakterler.',
  },
  {
    clerkId: 'fake_user_004',
    email: 'fitai@example.com',
    name: 'FitAI Studio',
    bio: 'Resmi FitAI karakter stüdyosu.',
  },
]

const CHARACTERS: Array<{
  ownerClerkId: string
  name: string
  age: number
  gender: 'male' | 'female'
  hometown: string
  archetype: string
  tier: Tier
  rentPrice7d: number
  rentPrice14d: number
  rentPrice30d: number
}> = [
  // Ela'nın karakterleri (user_created)
  {
    ownerClerkId: 'fake_user_001',
    name: 'Defne',
    age: 25,
    gender: 'female',
    hometown: 'İstanbul',
    archetype: 'sage',
    tier: 'user_created',
    rentPrice7d: 40,
    rentPrice14d: 70,
    rentPrice30d: 130,
  },
  {
    ownerClerkId: 'fake_user_001',
    name: 'Cem',
    age: 30,
    gender: 'male',
    hometown: 'Ankara',
    archetype: 'philosopher',
    tier: 'user_created',
    rentPrice7d: 35,
    rentPrice14d: 65,
    rentPrice30d: 120,
  },

  // Barış'ın karakterleri (user_created)
  {
    ownerClerkId: 'fake_user_002',
    name: 'Onur',
    age: 27,
    gender: 'male',
    hometown: 'İzmir',
    archetype: 'comedian',
    tier: 'user_created',
    rentPrice7d: 45,
    rentPrice14d: 80,
    rentPrice30d: 150,
  },
  {
    ownerClerkId: 'fake_user_002',
    name: 'Pelin',
    age: 26,
    gender: 'female',
    hometown: 'İstanbul',
    archetype: 'street',
    tier: 'user_created',
    rentPrice7d: 50,
    rentPrice14d: 90,
    rentPrice30d: 170,
  },

  // FitAI Studio premium_official (FitAI'nin yayınladığı premium)
  {
    ownerClerkId: 'fake_user_004',
    name: 'İnci',
    age: 29,
    gender: 'female',
    hometown: 'Bursa',
    archetype: 'sage',
    tier: 'premium_official',
    rentPrice7d: 80,
    rentPrice14d: 150,
    rentPrice30d: 280,
  },
  {
    ownerClerkId: 'fake_user_004',
    name: 'Burak',
    age: 32,
    gender: 'male',
    hometown: 'Antalya',
    archetype: 'philosopher',
    tier: 'premium_official',
    rentPrice7d: 75,
    rentPrice14d: 140,
    rentPrice30d: 260,
  },

  // FitAI Studio free_official (kiralanabilir resmi karakterler)
  {
    ownerClerkId: 'fake_user_004',
    name: 'Ada',
    age: 24,
    gender: 'female',
    hometown: 'İstanbul',
    archetype: 'street',
    tier: 'free_official',
    rentPrice7d: 25,
    rentPrice14d: 45,
    rentPrice30d: 80,
  },
  {
    ownerClerkId: 'fake_user_004',
    name: 'Emir',
    age: 28,
    gender: 'male',
    hometown: 'İzmir',
    archetype: 'comedian',
    tier: 'free_official',
    rentPrice7d: 25,
    rentPrice14d: 45,
    rentPrice30d: 80,
  },
]

async function main() {
  // 1) Fake user'ları upsert et
  const userMap = new Map<string, string>() // clerkId → userId
  for (const u of FAKE_USERS) {
    const user = await db.user.upsert({
      where: { clerkId: u.clerkId },
      create: {
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        bio: u.bio,
        avatarUrl: PLACEHOLDER_AVATAR,
        profilePublic: true,
      },
      update: { name: u.name, bio: u.bio },
    })
    userMap.set(u.clerkId, user.id)
    console.log(`✓ User: ${u.name} (${user.id})`)
  }

  // 2) Karakter + listing oluştur (idempotent: aynı isimde varsa skip)
  for (const c of CHARACTERS) {
    const ownerId = userMap.get(c.ownerClerkId)!
    const existing = await db.character.findFirst({
      where: { userId: ownerId, name: c.name },
      select: { id: true },
    })
    if (existing) {
      console.log(`- Character ${c.name} zaten var, skip`)
      continue
    }
    const character = await db.character.create({
      data: {
        userId: ownerId,
        name: c.name,
        age: c.age,
        gender: c.gender,
        hometown: c.hometown,
        archetype: c.archetype,
        avatarUrl: PLACEHOLDER_AVATAR,
        tier: c.tier,
        status: 'active',
      },
    })
    await db.marketplaceListing.create({
      data: {
        characterId: character.id,
        ownerId,
        rentPrice7d: c.rentPrice7d,
        rentPrice14d: c.rentPrice14d,
        rentPrice30d: c.rentPrice30d,
        rentEnabled: true,
        buyEnabled: false,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        totalRentals: Math.floor(Math.random() * 8),
        totalEarnings: Math.floor(Math.random() * 500),
        totalViews: Math.floor(Math.random() * 100),
        averageRating: 3.5 + Math.random() * 1.5, // 3.5 - 5.0
      },
    })
    console.log(`✓ Character + Listing: ${c.name} (tier=${c.tier})`)
  }

  // 3) Mehmet'e 2 kiracı (1 active + 1 ended)
  const mehmetListing = await db.marketplaceListing.findFirst({
    where: { ownerId: TALHA_USER_ID },
    select: { id: true, characterId: true, rentPrice7d: true },
  })
  if (!mehmetListing) {
    console.log("⚠️  Talha'nın listing'i bulunamadı, kiracı eklenmedi")
  } else {
    const renterEla = userMap.get('fake_user_001')!
    const renterBaris = userMap.get('fake_user_002')!

    const cost7d = mehmetListing.rentPrice7d ?? 50
    const ownerCut = Math.floor(cost7d * 0.7)

    // Kiracı 1: Ela (active, 5 gün önce başladı, 2 gün kaldı)
    await db.rentalAgreement.create({
      data: {
        listingId: mehmetListing.id,
        characterId: mehmetListing.characterId,
        renterId: renterEla,
        ownerId: TALHA_USER_ID,
        type: 'rent_7d',
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        costCredits: cost7d,
        ownerCredits: ownerCut,
        status: 'active',
      },
    })
    console.log(`✓ Active rental: Ela kiraladı Mehmet'i (5 gün önce, 2 gün kaldı)`)

    // Kiracı 2: Barış (ended, 14 gün önce başladı, 7 gün önce bitti, review verdi)
    await db.rentalAgreement.create({
      data: {
        listingId: mehmetListing.id,
        characterId: mehmetListing.characterId,
        renterId: renterBaris,
        ownerId: TALHA_USER_ID,
        type: 'rent_7d',
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        costCredits: cost7d,
        ownerCredits: ownerCut,
        status: 'expired',
        endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endReason: 'expired',
        ratingByRenter: 5,
        reviewByRenter: 'Çok eğlenceli karakter, samimi konuşuyor. Tavsiye ederim!',
      },
    })
    console.log(`✓ Ended rental: Barış kiraladı Mehmet'i (bitti, 5 yıldız review)`)

    // Listing'in totalRentals ve totalEarnings güncelle
    await db.marketplaceListing.update({
      where: { id: mehmetListing.id },
      data: {
        totalRentals: { increment: 2 },
        totalEarnings: { increment: ownerCut * 2 },
      },
    })
  }

  // Özet
  const totalListings = await db.marketplaceListing.count({ where: { publishedAt: { not: null } } })
  const totalRentals = await db.rentalAgreement.count()
  console.log(`\n=== Özet ===`)
  console.log(`Yayında listings: ${totalListings}`)
  console.log(`Toplam rental: ${totalRentals}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
