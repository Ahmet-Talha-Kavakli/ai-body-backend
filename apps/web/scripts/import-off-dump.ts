/**
 * OpenFoodFacts JSONL dump → Neon Postgres import.
 *
 * Çalıştırma:
 *   pnpm --filter web tsx scripts/import-off-dump.ts
 *
 * Akış:
 *   1. https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz indir (~10 GB)
 *   2. gunzip stream
 *   3. Her satırı parse + filtrele (geçerli isim + en az bir makro)
 *   4. 1000'lik batch'lerle Neon'a upsert
 *   5. pg_trgm extension + GIN indexleri kur
 *
 * Disk: dump ~10 GB, /tmp'a indirilir, import bitince silinir.
 * Süre: ~30-60 dk (network'e bağlı).
 */

import { createReadStream, createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { createGunzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { execSync } from 'node:child_process'
import { PrismaClient } from '../node_modules/.prisma/off-client'

const DUMP_URL = 'https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz'
const DUMP_PATH = '/tmp/off-products.jsonl.gz'
const BATCH_SIZE = 1000

const prisma = new PrismaClient()

type OffRaw = {
  code?: string
  product_name?: string
  product_name_tr?: string
  generic_name?: string
  brands?: string
  image_small_url?: string
  image_url?: string
  serving_size?: string
  countries_tags?: string[]
  nutriments?: Record<string, any>
}

function parseServing(s?: string): { size: number; unit: string } {
  if (!s) return { size: 100, unit: 'g' }
  const m = s.match(/([\d.,]+)\s*(g|ml|oz)?/i)
  if (!m) return { size: 100, unit: 'g' }
  const size = Number(m[1].replace(',', '.')) || 100
  const unit = (m[2] || 'g').toLowerCase()
  return { size, unit }
}

// Sadece Türkiye filtresi (Neon free 0.5 GB için)
// Daha sonra Pro'ya geçince COUNTRY_ALLOW genişletilebilir.
const COUNTRY_ALLOW = new Set(['en:turkey'])

function normalize(p: OffRaw) {
  if (!p.code) return null
  const name = (p.product_name || p.generic_name || '').trim()
  if (!name || name.length > 500) return null
  const n = p.nutriments ?? {}
  const cal = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0)
  const prot = Number(n.proteins_100g) || 0
  const carb = Number(n.carbohydrates_100g) || 0
  const fat = Number(n.fat_100g) || 0
  if (!cal && !prot && !carb && !fat) return null

  // Ülke filtresi
  const tags = p.countries_tags ?? []
  const matched = tags.some((t) => COUNTRY_ALLOW.has(t))
  if (!matched) return null

  const serving = parseServing(p.serving_size)
  const countries = tags.join(',').toLowerCase()

  return {
    code: p.code,
    name,
    nameTr: (p.product_name_tr || '').trim() || null,
    brand: p.brands?.split(',')[0]?.trim() || null,
    imageUrl: p.image_small_url || p.image_url || null,
    servingSize: serving.size,
    servingUnit: serving.unit,
    calories: cal,
    proteinG: prot,
    carbsG: carb,
    fatG: fat,
    fiberG: Number(n.fiber_100g) || 0,
    sugarG: Number(n.sugars_100g) || 0,
    saturatedFatG: Number(n['saturated-fat_100g']) || 0,
    transFatG: Number(n['trans-fat_100g']) || 0,
    cholesterolMg: (Number(n.cholesterol_100g) || 0) * 1000,
    sodiumMg: (Number(n.sodium_100g) || 0) * 1000,
    saltMg: (Number(n.salt_100g) || 0) * 1000,
    countries: countries || null,
  }
}

async function downloadDump() {
  if (existsSync(DUMP_PATH)) {
    const size = statSync(DUMP_PATH).size
    if (size > 1_000_000_000) {
      console.log(
        `[off-import] dump already exists (${(size / 1e9).toFixed(2)} GB), skipping download`
      )
      return
    }
    unlinkSync(DUMP_PATH)
  }
  console.log(`[off-import] downloading ${DUMP_URL} → ${DUMP_PATH}`)
  execSync(`curl -L --fail --silent --show-error -o ${DUMP_PATH} ${DUMP_URL}`, { stdio: 'inherit' })
  const size = statSync(DUMP_PATH).size
  console.log(`[off-import] downloaded ${(size / 1e9).toFixed(2)} GB`)
}

async function setupExtensions() {
  console.log('[off-import] creating pg_trgm extension + GIN indexes')
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm')
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS off_foods_name_trgm ON off_foods USING gin (name gin_trgm_ops)'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS off_foods_nametr_trgm ON off_foods USING gin ("nameTr" gin_trgm_ops)'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS off_foods_brand_trgm ON off_foods USING gin (brand gin_trgm_ops)'
  )
}

async function flushBatch(rows: ReturnType<typeof normalize>[]) {
  const valid = rows.filter(Boolean) as NonNullable<ReturnType<typeof normalize>>[]
  if (!valid.length) return
  await prisma.offFood.createMany({ data: valid, skipDuplicates: true })
}

async function importDump() {
  const startedAt = Date.now()
  let total = 0
  let valid = 0
  let batch: ReturnType<typeof normalize>[] = []

  console.log('[off-import] streaming dump → Neon')
  const stream = createReadStream(DUMP_PATH).pipe(createGunzip())
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    total++
    let obj: OffRaw
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    const n = normalize(obj)
    if (!n) continue
    valid++
    batch.push(n)

    if (batch.length >= BATCH_SIZE) {
      await flushBatch(batch).catch((e) => console.warn('[off-import] batch err:', e.message))
      batch = []
      if (valid % 10000 === 0) {
        const dt = (Date.now() - startedAt) / 1000
        console.log(
          `[off-import] ${valid.toLocaleString()} valid / ${total.toLocaleString()} read · ${dt.toFixed(0)}s · ${Math.round(valid / dt)} rec/s`
        )
      }
    }
  }

  if (batch.length)
    await flushBatch(batch).catch((e) => console.warn('[off-import] final batch err:', e.message))

  const dt = (Date.now() - startedAt) / 1000
  console.log(
    `[off-import] DONE. ${valid.toLocaleString()} imported / ${total.toLocaleString()} total · ${(dt / 60).toFixed(1)} min`
  )
}

async function main() {
  await setupExtensions()
  await downloadDump()
  await importDump()
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('[off-import] FATAL:', e)
  await prisma.$disconnect()
  process.exit(1)
})
