import { db } from '../lib/db/client'

async function main() {
  // 1. Senin (mevcut) user'ını bul - en son login eden
  const me = await db.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, clerkId: true },
  })
  if (!me) throw new Error('No user found in DB')
  console.log('[seed] me =', me.email)

  // 2. Test yaratıcı user'ı (eğer yoksa oluştur)
  const TEST_CLERK_ID = 'seed_creator_test_001'
  let creator = await db.user.findUnique({ where: { clerkId: TEST_CLERK_ID } })
  if (!creator) {
    creator = await db.user.create({
      data: {
        clerkId: TEST_CLERK_ID,
        email: 'test-creator@seed.local',
        name: 'Aylin Yazar',
      },
    })
    console.log('[seed] creator user created')
  }

  // 3. CreatorProfile (yoksa oluştur)
  const TEST_HANDLE = 'aylinyazar'
  let profile = await db.creatorProfile.findUnique({ where: { userId: creator.id } })
  if (!profile) {
    profile = await db.creatorProfile.create({
      data: {
        userId: creator.id,
        handle: TEST_HANDLE,
        bio: "İstanbul'dan yazar. Karakterlerimde en çok küçük detayları severim — bir mahalle, bir sigara molası, çok geç gelen bir cevap.",
        avatar: null,
        tier: 'silver',
        followerCount: 0,
        totalCharacters: 0,
      },
    })
    console.log('[seed] creator profile @' + TEST_HANDLE + ' created')
  } else {
    console.log('[seed] creator profile already exists @' + profile.handle)
  }

  // 4. 3 karakter + 3 listing (gate için min 3)
  const sampleChars = [
    {
      name: 'Aylin',
      age: 28,
      hometown: 'İstanbul',
      bio: "Cihangir'de bir kafede yazar. Geç saatlere kadar uyuyamaz.",
      category: 'friend' as const,
    },
    {
      name: 'Burak',
      age: 32,
      hometown: 'Antalya',
      bio: 'Mimar. Hafta sonları motoruyla yollarda.',
      category: 'friend' as const,
    },
    {
      name: 'Selen',
      age: 25,
      hometown: 'Ankara',
      bio: 'Doktora öğrencisi, kitap kurdu, kediler için hassas.',
      category: 'mentor' as const,
    },
  ]

  for (const sc of sampleChars) {
    const existing = await db.character.findFirst({
      where: { userId: creator.id, creatorId: creator.id, name: sc.name },
    })
    if (existing) {
      console.log('[seed] char ' + sc.name + ' exists, skip')
      continue
    }
    const ch = await db.character.create({
      data: {
        userId: creator.id,
        creatorId: creator.id,
        name: sc.name,
        age: sc.age,
        gender: null,
        avatarUrl: null,
        bio: sc.bio,
        hometown: sc.hometown,
        category: sc.category,
        archetype: 'friend',
        tier: 'user_created',
        publishStatus: 'published',
        isRetired: false,
      },
    })
    await db.marketplaceListing.create({
      data: {
        characterId: ch.id,
        ownerId: creator.id,
        rentPrice7d: 25,
        rentPrice14d: 45,
        rentPrice30d: 80,
        buyEnabled: false,
        rentEnabled: true,
        publishedAt: new Date(),
      },
    })
    console.log('[seed] char + listing ' + sc.name + ' created')
  }

  // 5. totalCharacters sync
  const publishedCount = await db.marketplaceListing.count({
    where: { ownerId: creator.id, character: { publishStatus: 'published' } },
  })
  await db.creatorProfile.update({
    where: { userId: creator.id },
    data: { totalCharacters: publishedCount },
  })
  console.log('[seed] totalCharacters synced =', publishedCount)

  console.log('\n[seed] DONE — open mobile, listing detayında @' + TEST_HANDLE + ' linkine bas')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
