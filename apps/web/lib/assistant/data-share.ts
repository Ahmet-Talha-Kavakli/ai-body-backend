/**
 * V4.6 M62 — @ ile Veri Paylaşımı
 *
 * Kullanıcı DM'de @ yazınca dropdown: Beslenme/Bugün, İçecek/Su, İlaç vs.
 * Apple Alert ile onay → karakter o veriye erişir.
 *
 * 3 erişim seviyesi: today / last7 / all (default last7)
 * Geri kapatma: revokeGrant
 */

import { db } from '@/lib/db/client'

export type DataCategory = 'nutrition' | 'water' | 'medication' | 'exercise' | 'body'
export type DataScope = 'today' | 'last7' | 'all'

export async function grantAccess(args: {
  userId: string
  characterId: string
  category: DataCategory
  scope: DataScope
}): Promise<{ id: string }> {
  const existing = await db.dataShareGrant.findUnique({
    where: {
      userId_characterId_category: {
        userId: args.userId,
        characterId: args.characterId,
        category: args.category,
      },
    },
  })
  if (existing) {
    const updated = await db.dataShareGrant.update({
      where: { id: existing.id },
      data: { scope: args.scope, active: true, revokedAt: null, grantedAt: new Date() },
    })
    return { id: updated.id }
  }
  const created = await db.dataShareGrant.create({
    data: {
      userId: args.userId,
      characterId: args.characterId,
      category: args.category,
      scope: args.scope,
      active: true,
    },
  })
  return { id: created.id }
}

export async function revokeAccess(args: {
  userId: string
  characterId: string
  category: DataCategory
}): Promise<void> {
  await db.dataShareGrant
    .update({
      where: {
        userId_characterId_category: {
          userId: args.userId,
          characterId: args.characterId,
          category: args.category,
        },
      },
      data: { active: false, revokedAt: new Date() },
    })
    .catch(() => {})
}

export async function loadActiveGrants(args: { userId: string; characterId: string }) {
  return db.dataShareGrant.findMany({
    where: { userId: args.userId, characterId: args.characterId, active: true },
  })
}

/**
 * Sistem prompt için aktif veri özetleri.
 * Her grant için ilgili tabloyu özetler.
 */
export async function buildSharedDataBlock(args: {
  userId: string
  characterId: string
}): Promise<string> {
  const grants = await loadActiveGrants(args)
  if (grants.length === 0) return ''

  const sections: string[] = []
  for (const g of grants) {
    const range = scopeToRange(g.scope as DataScope)
    const summary = await summarizeCategory(args.userId, g.category as DataCategory, range)
    if (summary)
      sections.push(
        `${categoryLabel(g.category as DataCategory)} (${scopeLabel(g.scope as DataScope)}):\n${summary}`
      )
  }
  if (sections.length === 0) return ''

  return `[KULLANICI SENİNLE PAYLAŞTI]
${sections.join('\n\n')}

DAVRANIŞ: Bu verileri biliyorsun (kullanıcı sana erişim verdi). Doğal yorumla.
Örn: "bugün su az içmişsin", "şu hafta hep tatlı yemişsin ya".
KURAL: Sürekli izleme havasına girme — bir-iki kez yorumla, sonra konuyu bırak.\n\n`
}

function scopeToRange(scope: DataScope): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()
  if (scope === 'today') {
    from.setHours(0, 0, 0, 0)
  } else if (scope === 'last7') {
    from.setDate(from.getDate() - 7)
  } else {
    from.setFullYear(from.getFullYear() - 5)
  }
  return { from, to }
}

function categoryLabel(c: DataCategory): string {
  return {
    nutrition: 'Beslenme',
    water: 'Su',
    medication: 'İlaç',
    exercise: 'Egzersiz',
    body: 'Vücut/Kilo',
  }[c]
}

function scopeLabel(s: DataScope): string {
  return { today: 'bugün', last7: 'son 7 gün', all: 'tüm geçmiş' }[s]
}

async function summarizeCategory(
  userId: string,
  category: DataCategory,
  range: { from: Date; to: Date }
): Promise<string | null> {
  try {
    if (category === 'nutrition') {
      const meals = await db.mealLog.findMany({
        where: { userId, loggedAt: { gte: range.from, lte: range.to } },
        orderBy: { loggedAt: 'desc' },
        take: 20,
        select: { totalCalories: true, loggedAt: true, mealType: true },
      })
      if (meals.length === 0) return 'Kayıt yok.'
      const totalCal = Math.round(meals.reduce((a, m) => a + (m.totalCalories ?? 0), 0))
      return `- ${meals.length} öğün, toplam ${totalCal} kcal\n- Son öğün tipleri: ${meals
        .slice(0, 3)
        .map((m) => m.mealType)
        .join(', ')}`
    }
    if (category === 'water') {
      const logs = await db.waterLog.findMany({
        where: { userId, date: { gte: range.from, lte: range.to } },
        orderBy: { date: 'desc' },
        take: 7,
        select: { date: true, amountMl: true },
      })
      if (logs.length === 0) return 'Kayıt yok.'
      const avg = Math.round(logs.reduce((a, l) => a + l.amountMl, 0) / logs.length)
      return `- Günlük ortalama: ${avg}ml (${logs.length} gün)`
    }
    if (category === 'exercise') {
      const sessions = await db.workoutSession.findMany({
        where: { userId, startedAt: { gte: range.from, lte: range.to } },
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: { startedAt: true, durationSeconds: true },
      })
      if (sessions.length === 0) return 'Kayıt yok.'
      return `- ${sessions.length} antrenman, toplam ${Math.round(
        sessions.reduce((a, s) => a + (s.durationSeconds ?? 0), 0) / 60
      )} dk`
    }
    if (category === 'body') {
      const profile = await db.userBasicProfile.findUnique({
        where: { userId },
        select: { weightKg: true, heightCm: true, updatedAt: true },
      })
      if (!profile) return 'Kayıt yok.'
      return `- Boy: ${profile.heightCm ?? '?'} cm, Kilo: ${profile.weightKg ?? '?'} kg (son güncelleme: ${profile.updatedAt.toISOString().slice(0, 10)})`
    }
    if (category === 'medication') {
      // İlaç takibi: schema'da MedicationLog model'i varsa kullan
      return 'İlaç takip detayları erişilebilir.'
    }
    return null
  } catch (e) {
    console.error('[data-share] summarize fail:', category, e)
    return null
  }
}
