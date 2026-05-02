/**
 * OpenFoodFacts arama — Neon DB üzerinden (lokal dump).
 * Önce TR ürünleri (countries 'turkey' içerir), sonra global, alfabetik kalmaz — name benzerliğine göre sıralanır.
 */

import { PrismaClient as OffPrismaClient } from '../../node_modules/.prisma/off-client'

declare global {
  // eslint-disable-next-line no-var
  var __offPrisma: OffPrismaClient | undefined
}

const offDb =
  globalThis.__offPrisma ??
  new OffPrismaClient({
    datasources: { db: { url: process.env.OFF_DATABASE_URL! } },
  })

if (process.env.NODE_ENV !== 'production') globalThis.__offPrisma = offDb

export type OffNormalized = {
  source: 'openfoodfacts'
  offCode: string
  name: string
  brand?: string
  photoUrl?: string
  servingSize: number
  servingUnit: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sugarG: number
  saturatedFatG: number
  transFatG: number
  cholesterolMg: number
  sodiumMg: number
  saltMg: number
}

export async function searchOpenFoodFacts(query: string, limit = 15): Promise<OffNormalized[]> {
  const trim = query.trim()
  if (trim.length < 2) return []

  // pg_trgm benzerlik araması: önce TR'de satılan ürünler, sonra global.
  // similarity() 0..1, ne kadar yüksek o kadar yakın
  const rows = await offDb.$queryRawUnsafe<Array<any>>(
    `
    SELECT
      code, name, "nameTr", brand, "imageUrl",
      "servingSize", "servingUnit",
      calories, "proteinG", "carbsG", "fatG", "fiberG", "sugarG",
      "saturatedFatG", "transFatG", "cholesterolMg", "sodiumMg", "saltMg",
      GREATEST(
        similarity(name, $1),
        COALESCE(similarity("nameTr", $1), 0),
        COALESCE(similarity(brand, $1), 0)
      ) AS sim,
      CASE WHEN countries LIKE '%turkey%' THEN 1 ELSE 0 END AS tr_boost
    FROM off_foods
    WHERE
      name % $1
      OR "nameTr" % $1
      OR brand % $1
    ORDER BY tr_boost DESC, sim DESC
    LIMIT $2
    `,
    trim,
    limit
  )

  return rows.map((r) => ({
    source: 'openfoodfacts' as const,
    offCode: r.code,
    name: r.nameTr || r.name,
    brand: r.brand ?? undefined,
    photoUrl: r.imageUrl ?? undefined,
    servingSize: Number(r.servingSize),
    servingUnit: r.servingUnit,
    calories: Number(r.calories),
    proteinG: Number(r.proteinG),
    carbsG: Number(r.carbsG),
    fatG: Number(r.fatG),
    fiberG: Number(r.fiberG),
    sugarG: Number(r.sugarG),
    saturatedFatG: Number(r.saturatedFatG),
    transFatG: Number(r.transFatG),
    cholesterolMg: Number(r.cholesterolMg),
    sodiumMg: Number(r.sodiumMg),
    saltMg: Number(r.saltMg),
  }))
}

export async function getOpenFoodFactsByCode(code: string): Promise<OffNormalized | null> {
  const r = await offDb.offFood.findUnique({ where: { code } })
  if (!r) return null
  return {
    source: 'openfoodfacts',
    offCode: r.code,
    name: r.nameTr || r.name,
    brand: r.brand ?? undefined,
    photoUrl: r.imageUrl ?? undefined,
    servingSize: r.servingSize,
    servingUnit: r.servingUnit,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    fiberG: r.fiberG,
    sugarG: r.sugarG,
    saturatedFatG: r.saturatedFatG,
    transFatG: r.transFatG,
    cholesterolMg: r.cholesterolMg,
    sodiumMg: r.sodiumMg,
    saltMg: r.saltMg,
  }
}
