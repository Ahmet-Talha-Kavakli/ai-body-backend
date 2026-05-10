/**
 * V4.5 — Karakter Gerçekçilik Seed
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md
 *
 * Mevcut karakterlere (Mia, Kerem, Selin, Ayşe, Mehmet) gerçekçilik field'larını
 * + DigitalProfile + WritingStyle ekler. Mevcut conversation/relationship'i bozmaz.
 *
 * Çalıştırma: pnpm tsx prisma/seed-character-realism.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type DigitalProfileSeed = {
  emojiUsage: 'none' | 'light' | 'moderate' | 'heavy'
  emojiPreferred: string[]
  gifUsage: boolean
  stickerUsage: boolean
  voiceMessagePref: 'never' | 'rare' | 'often'
  platform: 'whatsapp' | 'instagram' | 'sms' | 'telegram'
  device: 'iphone' | 'android'
  digitalLiteracy: 'low' | 'medium' | 'high'
  linksOpenedRate: number
  shareMusicHabit: boolean
}

type WritingStyleSeed = {
  punctuationLevel: 'clean' | 'casual' | 'messy'
  capitalizationStyle: 'proper' | 'lowercase' | 'mixed'
  exclamationFreq: number
  ellipsisHabit: number
  baseTypoRate: number
  educationLevel: 'low' | 'medium' | 'high' | 'academic'
  slangSet: string[]
  avgSentenceLen: number
  preferredSignOff: string | null
}

type CharacterRealismSeed = {
  templateKey: string
  physicalCity: string
  physicalDistrict: string
  socialPersonality: 'introvert' | 'extrovert' | 'ambivert'
  forgetfulness: number
  responseLatencyProfile: 'instant' | 'normal' | 'delayed' | 'erratic'
  sleepSchedule: {
    weekdayBed: string
    weekdayWake: string
    weekendBed: string
    weekendWake: string
  }
  digitalProfile: DigitalProfileSeed
  writingStyle: WritingStyleSeed
}

const SEEDS: CharacterRealismSeed[] = [
  {
    templateKey: 'mia',
    physicalCity: 'İstanbul',
    physicalDistrict: 'Beşiktaş',
    socialPersonality: 'ambivert',
    forgetfulness: 0.05,
    responseLatencyProfile: 'normal',
    sleepSchedule: {
      weekdayBed: '00:30',
      weekdayWake: '08:00',
      weekendBed: '02:00',
      weekendWake: '11:00',
    },
    digitalProfile: {
      emojiUsage: 'moderate',
      emojiPreferred: ['🥲', '😅', '🙏', '☕', '🌙'],
      gifUsage: true,
      stickerUsage: false,
      voiceMessagePref: 'rare',
      platform: 'whatsapp',
      device: 'iphone',
      digitalLiteracy: 'high',
      linksOpenedRate: 0.6,
      shareMusicHabit: true,
    },
    writingStyle: {
      punctuationLevel: 'casual',
      capitalizationStyle: 'mixed',
      exclamationFreq: 0.15,
      ellipsisHabit: 0.2,
      baseTypoRate: 0.03,
      educationLevel: 'high',
      slangSet: ['valla', 'ya', 'aşkım', 'off', 'of'],
      avgSentenceLen: 11,
      preferredSignOff: null,
    },
  },
  {
    templateKey: 'kerem',
    physicalCity: 'İstanbul',
    physicalDistrict: 'Kadıköy',
    socialPersonality: 'extrovert',
    forgetfulness: 0.08,
    responseLatencyProfile: 'erratic',
    sleepSchedule: {
      weekdayBed: '03:00',
      weekdayWake: '11:00',
      weekendBed: '05:00',
      weekendWake: '13:00',
    },
    digitalProfile: {
      emojiUsage: 'light',
      emojiPreferred: ['😂', '🤙'],
      gifUsage: false,
      stickerUsage: false,
      voiceMessagePref: 'rare',
      platform: 'whatsapp',
      device: 'iphone',
      digitalLiteracy: 'medium',
      linksOpenedRate: 0.3,
      shareMusicHabit: true,
    },
    writingStyle: {
      punctuationLevel: 'messy',
      capitalizationStyle: 'lowercase',
      exclamationFreq: 0.05,
      ellipsisHabit: 0.05,
      baseTypoRate: 0.06,
      educationLevel: 'medium',
      slangSet: ['lan', 'abi', 'knk', 'ya', 'valla', 'of', 'off', 'boş ver', 'neyse'],
      avgSentenceLen: 7,
      preferredSignOff: null,
    },
  },
  {
    templateKey: 'selin',
    physicalCity: 'İzmir',
    physicalDistrict: 'Alsancak',
    socialPersonality: 'introvert',
    forgetfulness: 0.04,
    responseLatencyProfile: 'instant',
    sleepSchedule: {
      weekdayBed: '23:30',
      weekdayWake: '07:00',
      weekendBed: '00:30',
      weekendWake: '09:00',
    },
    digitalProfile: {
      emojiUsage: 'heavy',
      emojiPreferred: ['🌊', '✨', '🪞', '📖', '🌙', '☕'],
      gifUsage: true,
      stickerUsage: true,
      voiceMessagePref: 'often',
      platform: 'instagram',
      device: 'iphone',
      digitalLiteracy: 'high',
      linksOpenedRate: 0.7,
      shareMusicHabit: true,
    },
    writingStyle: {
      punctuationLevel: 'clean',
      capitalizationStyle: 'proper',
      exclamationFreq: 0.08,
      ellipsisHabit: 0.25,
      baseTypoRate: 0.01,
      educationLevel: 'academic',
      slangSet: ['yani', 'ya', 'sanki', 'belki'],
      avgSentenceLen: 16,
      preferredSignOff: null,
    },
  },
  {
    templateKey: 'ayse',
    physicalCity: 'Ankara',
    physicalDistrict: 'Çankaya',
    socialPersonality: 'introvert',
    forgetfulness: 0.06,
    responseLatencyProfile: 'delayed',
    sleepSchedule: {
      weekdayBed: '22:30',
      weekdayWake: '06:30',
      weekendBed: '23:30',
      weekendWake: '08:00',
    },
    digitalProfile: {
      emojiUsage: 'light',
      emojiPreferred: ['🙏', '☺️'],
      gifUsage: false,
      stickerUsage: false,
      voiceMessagePref: 'rare',
      platform: 'whatsapp',
      device: 'android',
      digitalLiteracy: 'medium',
      linksOpenedRate: 0.4,
      shareMusicHabit: false,
    },
    writingStyle: {
      punctuationLevel: 'clean',
      capitalizationStyle: 'proper',
      exclamationFreq: 0.04,
      ellipsisHabit: 0.1,
      baseTypoRate: 0.02,
      educationLevel: 'high',
      slangSet: ['evet', 'tamam', 'olabilir'],
      avgSentenceLen: 13,
      preferredSignOff: 'kib',
    },
  },
  {
    templateKey: 'mehmet',
    physicalCity: 'İstanbul',
    physicalDistrict: 'Üsküdar',
    socialPersonality: 'introvert',
    forgetfulness: 0.05,
    responseLatencyProfile: 'delayed',
    sleepSchedule: {
      weekdayBed: '23:00',
      weekdayWake: '07:00',
      weekendBed: '00:00',
      weekendWake: '08:30',
    },
    digitalProfile: {
      emojiUsage: 'none',
      emojiPreferred: [],
      gifUsage: false,
      stickerUsage: false,
      voiceMessagePref: 'never',
      platform: 'sms',
      device: 'android',
      digitalLiteracy: 'low',
      linksOpenedRate: 0.2,
      shareMusicHabit: false,
    },
    writingStyle: {
      punctuationLevel: 'clean',
      capitalizationStyle: 'proper',
      exclamationFreq: 0.02,
      ellipsisHabit: 0.05,
      baseTypoRate: 0.01,
      educationLevel: 'academic',
      slangSet: [],
      avgSentenceLen: 18,
      preferredSignOff: null,
    },
  },
]

async function main() {
  console.log('🌱 V4.5 Karakter Gerçekçilik seed başlıyor...\n')

  // Tüm Character kayıtlarını çek (her kullanıcı için ayrı kayıt olabilir)
  const allCharacters = await prisma.character.findMany({
    where: { name: { in: ['Mia', 'Kerem', 'Selin', 'Ayşe', 'Mehmet'] } },
    select: { id: true, name: true, userId: true },
  })

  console.log(`📋 ${allCharacters.length} karakter kaydı bulundu.\n`)

  let updatedCount = 0
  let digitalCreated = 0
  let writingCreated = 0

  for (const char of allCharacters) {
    const key = char.name.toLowerCase().replace('ı', 'i').replace('ş', 's') // ayşe → ayse
    const seed = SEEDS.find((s) => s.templateKey === key)
    if (!seed) {
      console.log(`⚠️  ${char.name} için seed bulunamadı, atlanıyor.`)
      continue
    }

    // Character'a gerçekçilik field'larını ekle
    await prisma.character.update({
      where: { id: char.id },
      data: {
        physicalCity: seed.physicalCity,
        physicalDistrict: seed.physicalDistrict,
        socialPersonality: seed.socialPersonality,
        forgetfulness: seed.forgetfulness,
        responseLatencyProfile: seed.responseLatencyProfile,
        sleepSchedule: seed.sleepSchedule as any,
      },
    })
    updatedCount++

    // DigitalProfile upsert
    await prisma.characterDigitalProfile.upsert({
      where: { characterId: char.id },
      create: { characterId: char.id, ...seed.digitalProfile },
      update: { ...seed.digitalProfile },
    })
    digitalCreated++

    // WritingStyle upsert
    await prisma.characterWritingStyle.upsert({
      where: { characterId: char.id },
      create: {
        characterId: char.id,
        ...seed.writingStyle,
        preferredSignOff: seed.writingStyle.preferredSignOff ?? undefined,
      },
      update: {
        ...seed.writingStyle,
        preferredSignOff: seed.writingStyle.preferredSignOff ?? undefined,
      },
    })
    writingCreated++

    console.log(
      `✓ ${char.name.padEnd(8)} → ${seed.physicalCity}/${seed.physicalDistrict} | ${seed.responseLatencyProfile.padEnd(8)} | emoji:${seed.digitalProfile.emojiUsage}`
    )
  }

  console.log(`\n✅ Tamamlandı:`)
  console.log(`   • ${updatedCount} Character güncellendi`)
  console.log(`   • ${digitalCreated} DigitalProfile upsert`)
  console.log(`   • ${writingCreated} WritingStyle upsert`)
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
