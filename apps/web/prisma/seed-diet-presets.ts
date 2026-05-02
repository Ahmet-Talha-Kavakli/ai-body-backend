/**
 * Diyet Preset Seed Script — 14 bilimsel kanıtlı diyet
 *
 * Her preset için:
 *  - Meta (isim, tagline, açıklama, hero/thumb image, accent color)
 *  - Süre sınırları (min/default/max gün)
 *  - Kalori formülü + makro yüzdeleri
 *  - Kanıt seviyesi + kim için uygun/değil
 *  - Kurallar (allowed/avoid/tips)
 *  - 16 öğün havuzu (4 kahvaltı + 4 öğle + 4 akşam + 4 atıştırma)
 *
 * Çalıştırma:
 *   pnpm --filter web tsx prisma/seed-diet-presets.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

type PresetMealItem = {
  name: string
  servingSize: number
  servingUnit: string // g, ml, adet, dilim, kaşık, porsiyon
  quantity: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
}

type PresetMeal = {
  name: string
  items: PresetMealItem[]
}

type MealPool = {
  breakfast: PresetMeal[]
  lunch: PresetMeal[]
  dinner: PresetMeal[]
  snack: PresetMeal[]
}

type Rules = {
  allowed: string[]
  avoid: string[]
  tips: string[]
}

type DietPresetSeed = {
  slug: string
  name: string
  tagline: string
  description: string
  heroImageUrl: string
  thumbnailUrl: string
  accentColor: string
  defaultDurationDays: number
  minDurationDays: number
  maxDurationDays: number
  calorieFormula: string
  proteinPct: number
  carbsPct: number
  fatPct: number
  evidenceLevel: 'strong' | 'moderate' | 'emerging'
  recommendedFor: string[]
  notRecommendedFor: string[]
  rules: Rules
  mealPool: MealPool
  popularityScore: number
  isPremium: boolean
}

// ──────────────────────────────────────────
// HELPER — Unsplash food URLs (high quality, free, no attribution required)
// ──────────────────────────────────────────

const img = (id: string, size = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${size}&q=80&auto=format&fit=crop`

// ──────────────────────────────────────────
// 14 PRESETS
// ──────────────────────────────────────────

const PRESETS: DietPresetSeed[] = [
  // 1. AKDENİZ ─────────────────────────────────────────────
  {
    slug: 'mediterranean',
    name: 'Akdeniz Diyeti',
    tagline: 'Kalp dostu, sürdürülebilir',
    description:
      'Bilimin en çok onayladığı beslenme şekli. Zeytinyağı, balık, sebze, baklagil ve tam tahıl odaklı. Kalp-damar hastalığı, diyabet ve obezite riskini düşürür.',
    heroImageUrl: img('1490645935967-10de6ba17061'),
    thumbnailUrl: img('1490645935967-10de6ba17061', 600),
    accentColor: '#0A84FF',
    defaultDurationDays: 60,
    minDurationDays: 30,
    maxDurationDays: 90,
    calorieFormula: 'tdee:0.9',
    proteinPct: 20,
    carbsPct: 50,
    fatPct: 30,
    evidenceLevel: 'strong',
    recommendedFor: ['kalp sağlığı', 'sürdürülebilir kilo verme', 'diyabet riski', 'genel sağlık'],
    notRecommendedFor: [],
    rules: {
      allowed: [
        'Zeytinyağı',
        'Balık (haftada 2-3 kez)',
        'Sebze ve meyve (her öğün)',
        'Tam tahıl',
        'Baklagiller',
        'Yoğurt ve peynir (ölçülü)',
        'Kuruyemiş',
      ],
      avoid: [
        'Kırmızı et (haftada 1-2)',
        'İşlenmiş gıdalar',
        'Şekerli içecekler',
        'Beyaz un ürünleri',
      ],
      tips: [
        'Her gün 1-2 yemek kaşığı zeytinyağı',
        'Tabağın yarısı sebze olsun',
        'Tatlı yerine meyve tercih et',
        'Su ve bitki çayı bol miktarda',
      ],
    },
    mealPool: {
      breakfast: [
        {
          name: 'Akdeniz kahvaltı tabağı',
          items: [
            {
              name: 'Tam buğday ekmeği',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 5,
              carbsG: 25,
              fatG: 1.5,
              fiberG: 4,
            },
            {
              name: 'Beyaz peynir',
              servingSize: 40,
              servingUnit: 'g',
              quantity: 1,
              calories: 110,
              proteinG: 7,
              carbsG: 1,
              fatG: 9,
            },
            {
              name: 'Zeytin',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 35,
              proteinG: 0.3,
              carbsG: 1,
              fatG: 3.3,
            },
            {
              name: 'Domates',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 18,
              proteinG: 0.9,
              carbsG: 3.9,
              fatG: 0.2,
            },
            {
              name: 'Salatalık',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 15,
              proteinG: 0.7,
              carbsG: 3.6,
              fatG: 0.1,
            },
          ],
        },
        {
          name: 'Yulaflı meyveli kase',
          items: [
            {
              name: 'Yulaf ezmesi',
              servingSize: 40,
              servingUnit: 'g',
              quantity: 1,
              calories: 150,
              proteinG: 5,
              carbsG: 27,
              fatG: 3,
              fiberG: 4,
            },
            {
              name: 'Süt',
              servingSize: 200,
              servingUnit: 'ml',
              quantity: 1,
              calories: 100,
              proteinG: 7,
              carbsG: 10,
              fatG: 4,
            },
            {
              name: 'Çilek',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 32,
              proteinG: 0.7,
              carbsG: 7.7,
              fatG: 0.3,
            },
            {
              name: 'Ceviz içi',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 100,
              proteinG: 2.3,
              carbsG: 2,
              fatG: 9.8,
            },
          ],
        },
        {
          name: 'Menemen ve tam buğday ekmek',
          items: [
            {
              name: 'Yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 2,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
            {
              name: 'Domates',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 27,
              proteinG: 1.4,
              carbsG: 5.9,
              fatG: 0.3,
            },
            {
              name: 'Yeşil biber',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 10,
              proteinG: 0.4,
              carbsG: 2.4,
              fatG: 0.1,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 5,
              servingUnit: 'ml',
              quantity: 1,
              calories: 45,
              proteinG: 0,
              carbsG: 0,
              fatG: 5,
            },
            {
              name: 'Tam buğday ekmeği',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 5,
              carbsG: 25,
              fatG: 1.5,
            },
          ],
        },
        {
          name: 'Yoğurtlu granola',
          items: [
            {
              name: 'Süzme yoğurt',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 120,
              proteinG: 18,
              carbsG: 8,
              fatG: 2,
            },
            {
              name: 'Granola',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 3,
              carbsG: 22,
              fatG: 4,
            },
            {
              name: 'Bal',
              servingSize: 10,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 0,
              carbsG: 8,
              fatG: 0,
            },
            {
              name: 'Yaban mersini',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 28,
              proteinG: 0.4,
              carbsG: 7,
              fatG: 0.2,
            },
          ],
        },
      ],
      lunch: [
        {
          name: 'Izgara somon ve kinoa',
          items: [
            {
              name: 'Somon fileto',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 270,
              proteinG: 30,
              carbsG: 0,
              fatG: 16,
            },
            {
              name: 'Kinoa pilavı',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 180,
              proteinG: 6,
              carbsG: 32,
              fatG: 3,
            },
            {
              name: 'Brokoli',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 34,
              proteinG: 2.8,
              carbsG: 7,
              fatG: 0.4,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 5,
              servingUnit: 'ml',
              quantity: 1,
              calories: 45,
              proteinG: 0,
              carbsG: 0,
              fatG: 5,
            },
          ],
        },
        {
          name: 'Mercimek çorbası ve salata',
          items: [
            {
              name: 'Mercimek çorbası',
              servingSize: 300,
              servingUnit: 'ml',
              quantity: 1,
              calories: 180,
              proteinG: 12,
              carbsG: 28,
              fatG: 3,
            },
            {
              name: 'Çoban salata',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 2,
              carbsG: 10,
              fatG: 4,
            },
            {
              name: 'Tam buğday ekmeği',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 5,
              carbsG: 25,
              fatG: 1.5,
            },
          ],
        },
        {
          name: 'Tavuk göğsü ve sebzeli bulgur',
          items: [
            {
              name: 'Izgara tavuk göğsü',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 240,
              proteinG: 45,
              carbsG: 0,
              fatG: 5,
            },
            {
              name: 'Sebzeli bulgur pilavı',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 200,
              proteinG: 6,
              carbsG: 38,
              fatG: 3,
            },
            {
              name: 'Yeşil salata',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 1,
              carbsG: 4,
              fatG: 1.5,
            },
          ],
        },
        {
          name: 'Akdeniz tonbalıklı salata',
          items: [
            {
              name: 'Ton balığı (suda)',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 110,
              proteinG: 25,
              carbsG: 0,
              fatG: 1,
            },
            {
              name: 'Karışık yeşillik',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 25,
              proteinG: 1.5,
              carbsG: 4,
              fatG: 0.3,
            },
            {
              name: 'Nohut (haşlanmış)',
              servingSize: 80,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 7,
              carbsG: 22,
              fatG: 2,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 10,
              servingUnit: 'ml',
              quantity: 1,
              calories: 90,
              proteinG: 0,
              carbsG: 0,
              fatG: 10,
            },
            {
              name: 'Limon suyu',
              servingSize: 15,
              servingUnit: 'ml',
              quantity: 1,
              calories: 4,
              proteinG: 0,
              carbsG: 1.4,
              fatG: 0,
            },
          ],
        },
      ],
      dinner: [
        {
          name: 'Fırın levrek ve sebze',
          items: [
            {
              name: 'Levrek fileto',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 195,
              proteinG: 35,
              carbsG: 0,
              fatG: 6,
            },
            {
              name: 'Fırın sebze (kabak, biber, soğan)',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 90,
              proteinG: 3,
              carbsG: 14,
              fatG: 3,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 5,
              servingUnit: 'ml',
              quantity: 1,
              calories: 45,
              proteinG: 0,
              carbsG: 0,
              fatG: 5,
            },
          ],
        },
        {
          name: 'Sebze yemeği ve yoğurt',
          items: [
            {
              name: 'Zeytinyağlı taze fasulye',
              servingSize: 250,
              servingUnit: 'g',
              quantity: 1,
              calories: 220,
              proteinG: 6,
              carbsG: 25,
              fatG: 12,
            },
            {
              name: 'Yoğurt',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 90,
              proteinG: 5,
              carbsG: 7,
              fatG: 5,
            },
            {
              name: 'Tam buğday ekmeği',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 3,
              carbsG: 15,
              fatG: 1,
            },
          ],
        },
        {
          name: 'Mantı yerine fırın köfte',
          items: [
            {
              name: 'Izgara köfte',
              servingSize: 120,
              servingUnit: 'g',
              quantity: 1,
              calories: 260,
              proteinG: 22,
              carbsG: 4,
              fatG: 18,
            },
            {
              name: 'Bulgur pilavı',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 4,
              carbsG: 26,
              fatG: 1,
            },
            {
              name: 'Söğüş',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 1.5,
              carbsG: 6,
              fatG: 0.3,
            },
          ],
        },
        {
          name: 'Karides güveç',
          items: [
            {
              name: 'Karides',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 145,
              proteinG: 30,
              carbsG: 1,
              fatG: 2,
            },
            {
              name: 'Domates sos',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 1,
              carbsG: 7,
              fatG: 0.2,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 10,
              servingUnit: 'ml',
              quantity: 1,
              calories: 90,
              proteinG: 0,
              carbsG: 0,
              fatG: 10,
            },
            {
              name: 'Tam buğday ekmeği',
              servingSize: 40,
              servingUnit: 'g',
              quantity: 1,
              calories: 105,
              proteinG: 4,
              carbsG: 20,
              fatG: 1.2,
            },
          ],
        },
      ],
      snack: [
        {
          name: 'Bir avuç badem',
          items: [
            {
              name: 'Çiğ badem',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 145,
              proteinG: 5,
              carbsG: 5,
              fatG: 13,
            },
          ],
        },
        {
          name: 'Yoğurtlu meyve',
          items: [
            {
              name: 'Yoğurt',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 90,
              proteinG: 5,
              carbsG: 7,
              fatG: 5,
            },
            {
              name: 'Elma',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 78,
              proteinG: 0.4,
              carbsG: 21,
              fatG: 0.2,
            },
          ],
        },
        {
          name: 'Hummus ve havuç',
          items: [
            {
              name: 'Humus',
              servingSize: 60,
              servingUnit: 'g',
              quantity: 1,
              calories: 100,
              proteinG: 5,
              carbsG: 9,
              fatG: 6,
            },
            {
              name: 'Havuç çubuk',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 41,
              proteinG: 0.9,
              carbsG: 10,
              fatG: 0.2,
            },
          ],
        },
        {
          name: 'Zeytinli ekmek',
          items: [
            {
              name: 'Tam buğday ekmeği',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 3,
              carbsG: 15,
              fatG: 1,
            },
            {
              name: 'Zeytin',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 0.2,
              carbsG: 0.8,
              fatG: 2.8,
            },
            {
              name: 'Beyaz peynir',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 70,
              proteinG: 4.5,
              carbsG: 0.6,
              fatG: 5.6,
            },
          ],
        },
      ],
    },
    popularityScore: 100,
    isPremium: false,
  },

  // 2. KETOJENİK ─────────────────────────────────────────────
  {
    slug: 'keto',
    name: 'Ketojenik',
    tagline: 'Hızlı kilo verme, çok düşük karb',
    description:
      'Vücudu yağ yakma moduna sokan, çok düşük karbonhidrat (<%5) ve yüksek yağ içeren beslenme. Hızlı kilo verme ve insülin duyarlılığı için etkili.',
    heroImageUrl: img('1525351484163-7529414344d8'),
    thumbnailUrl: img('1525351484163-7529414344d8', 600),
    accentColor: '#FF453A',
    defaultDurationDays: 30,
    minDurationDays: 14,
    maxDurationDays: 60,
    calorieFormula: 'tdee:0.85',
    proteinPct: 25,
    carbsPct: 5,
    fatPct: 70,
    evidenceLevel: 'moderate',
    recommendedFor: ['hızlı kilo verme', 'insülin direnci', 'epilepsi (tıbbi gözetimde)'],
    notRecommendedFor: [
      'hamileler',
      'böbrek hastaları',
      'tip 1 diyabetliler',
      'safra kesesi olmayanlar',
    ],
    rules: {
      allowed: [
        'Yağlı et ve balık',
        'Yumurta',
        'Yağlı peynir',
        'Avokado',
        'Zeytinyağı, hindistancevizi yağı',
        'Tereyağı',
        'Yeşil yapraklı sebzeler',
        'Kuruyemiş (ölçülü)',
      ],
      avoid: [
        'Şeker',
        'Tahıl ve unlu mamuller',
        'Meyve (çoğu)',
        'Patates, mısır',
        'Bal, reçel',
        'Bira ve şekerli içecekler',
      ],
      tips: [
        'Günlük net karb 20-30g altında kalmalı',
        'Bol su iç (3L+)',
        'Tuz alımına dikkat et (keto flu için)',
        'İlk hafta yorgunluk normal',
      ],
    },
    mealPool: {
      breakfast: [
        {
          name: 'Avokadolu yumurta',
          items: [
            {
              name: 'Yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 3,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
            {
              name: 'Avokado',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 160,
              proteinG: 2,
              carbsG: 9,
              fatG: 15,
            },
            {
              name: 'Tereyağı',
              servingSize: 10,
              servingUnit: 'g',
              quantity: 1,
              calories: 72,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 8,
            },
          ],
        },
        {
          name: 'Sucuklu omlet ve peynir',
          items: [
            {
              name: 'Yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 3,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
            {
              name: 'Sucuk',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 6,
              carbsG: 0.5,
              fatG: 12,
            },
            {
              name: 'Kaşar peyniri',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 110,
              proteinG: 7,
              carbsG: 0.5,
              fatG: 9,
            },
          ],
        },
        {
          name: 'Bulletproof kahve ve yumurta',
          items: [
            {
              name: 'Kahve',
              servingSize: 250,
              servingUnit: 'ml',
              quantity: 1,
              calories: 2,
              proteinG: 0.3,
              carbsG: 0,
              fatG: 0,
            },
            {
              name: 'Tereyağı',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 108,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 12,
            },
            {
              name: 'MCT yağı',
              servingSize: 15,
              servingUnit: 'ml',
              quantity: 1,
              calories: 130,
              proteinG: 0,
              carbsG: 0,
              fatG: 14,
            },
            {
              name: 'Haşlanmış yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 2,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
          ],
        },
        {
          name: 'Kremalı sebzeli omlet',
          items: [
            {
              name: 'Yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 3,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
            {
              name: 'Krema',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 100,
              proteinG: 0.7,
              carbsG: 1,
              fatG: 11,
            },
            {
              name: 'Ispanak',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 12,
              proteinG: 1.5,
              carbsG: 1.8,
              fatG: 0.2,
            },
            {
              name: 'Beyaz peynir',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 85,
              proteinG: 5.4,
              carbsG: 0.7,
              fatG: 6.8,
            },
          ],
        },
      ],
      lunch: [
        {
          name: 'Izgara somon ve avokado',
          items: [
            {
              name: 'Somon fileto',
              servingSize: 180,
              servingUnit: 'g',
              quantity: 1,
              calories: 325,
              proteinG: 36,
              carbsG: 0,
              fatG: 19,
            },
            {
              name: 'Avokado',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 160,
              proteinG: 2,
              carbsG: 9,
              fatG: 15,
            },
            {
              name: 'Yeşil salata',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 25,
              proteinG: 1.5,
              carbsG: 4,
              fatG: 0.3,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 10,
              servingUnit: 'ml',
              quantity: 1,
              calories: 90,
              proteinG: 0,
              carbsG: 0,
              fatG: 10,
            },
          ],
        },
        {
          name: 'Tavuk Caesar (kruton yok)',
          items: [
            {
              name: 'Tavuk göğsü ızgara',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 240,
              proteinG: 45,
              carbsG: 0,
              fatG: 5,
            },
            {
              name: 'Marul',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 15,
              proteinG: 1.4,
              carbsG: 2.9,
              fatG: 0.2,
            },
            {
              name: 'Parmesan',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 100,
              proteinG: 9,
              carbsG: 1,
              fatG: 7,
            },
            {
              name: 'Caesar sos',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 145,
              proteinG: 1,
              carbsG: 1,
              fatG: 15,
            },
          ],
        },
        {
          name: 'Köfte ve karnabahar pilavı',
          items: [
            {
              name: 'Köfte (yağlı kıyma)',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 360,
              proteinG: 25,
              carbsG: 2,
              fatG: 28,
            },
            {
              name: 'Karnabahar pilavı',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 50,
              proteinG: 3,
              carbsG: 8,
              fatG: 1,
            },
            {
              name: 'Tereyağı',
              servingSize: 10,
              servingUnit: 'g',
              quantity: 1,
              calories: 72,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 8,
            },
          ],
        },
        {
          name: 'Ton balıklı avokado kase',
          items: [
            {
              name: 'Ton balığı (yağlı)',
              servingSize: 120,
              servingUnit: 'g',
              quantity: 1,
              calories: 240,
              proteinG: 26,
              carbsG: 0,
              fatG: 14,
            },
            {
              name: 'Avokado',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 240,
              proteinG: 3,
              carbsG: 13,
              fatG: 22,
            },
            {
              name: 'Mayonez',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 105,
              proteinG: 0,
              carbsG: 0.4,
              fatG: 12,
            },
          ],
        },
      ],
      dinner: [
        {
          name: 'Kaburga ızgara ve sebze',
          items: [
            {
              name: 'Kaburga',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 540,
              proteinG: 38,
              carbsG: 0,
              fatG: 42,
            },
            {
              name: 'Brokoli (tereyağında)',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 110,
              proteinG: 4,
              carbsG: 10,
              fatG: 6,
            },
          ],
        },
        {
          name: 'Levrek ve tereyağlı kuşkonmaz',
          items: [
            {
              name: 'Levrek fileto',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 260,
              proteinG: 47,
              carbsG: 0,
              fatG: 8,
            },
            {
              name: 'Kuşkonmaz',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 3,
              carbsG: 6,
              fatG: 0.2,
            },
            {
              name: 'Tereyağı',
              servingSize: 20,
              servingUnit: 'g',
              quantity: 1,
              calories: 144,
              proteinG: 0.2,
              carbsG: 0,
              fatG: 16,
            },
          ],
        },
        {
          name: 'Tavuk şinitzel (badem unu) ve salata',
          items: [
            {
              name: 'Tavuk göğsü',
              servingSize: 180,
              servingUnit: 'g',
              quantity: 1,
              calories: 290,
              proteinG: 54,
              carbsG: 0,
              fatG: 6,
            },
            {
              name: 'Badem unu',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 175,
              proteinG: 6,
              carbsG: 6,
              fatG: 15,
            },
            {
              name: 'Tereyağı (kızartma)',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 108,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 12,
            },
            {
              name: 'Yeşil salata',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 25,
              proteinG: 1.5,
              carbsG: 4,
              fatG: 0.3,
            },
          ],
        },
        {
          name: 'Yağlı dana biftek',
          items: [
            {
              name: 'Dana antrikot',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 540,
              proteinG: 50,
              carbsG: 0,
              fatG: 38,
            },
            {
              name: 'Tereyağında mantar',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 4,
              carbsG: 7,
              fatG: 10,
            },
          ],
        },
      ],
      snack: [
        {
          name: 'Avokado dilimleri',
          items: [
            {
              name: 'Avokado',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 160,
              proteinG: 2,
              carbsG: 9,
              fatG: 15,
            },
            {
              name: 'Tuz, limon',
              servingSize: 5,
              servingUnit: 'g',
              quantity: 1,
              calories: 1,
              proteinG: 0,
              carbsG: 0.3,
              fatG: 0,
            },
          ],
        },
        {
          name: 'Peynir tabağı',
          items: [
            {
              name: 'Kaşar peyniri',
              servingSize: 40,
              servingUnit: 'g',
              quantity: 1,
              calories: 145,
              proteinG: 9,
              carbsG: 0.7,
              fatG: 12,
            },
            {
              name: 'Beyaz peynir',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 85,
              proteinG: 5.4,
              carbsG: 0.7,
              fatG: 6.8,
            },
            {
              name: 'Zeytin',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 0.2,
              carbsG: 0.8,
              fatG: 2.8,
            },
          ],
        },
        {
          name: 'Macadamia ve ceviz',
          items: [
            {
              name: 'Macadamia',
              servingSize: 20,
              servingUnit: 'g',
              quantity: 1,
              calories: 145,
              proteinG: 1.6,
              carbsG: 2.7,
              fatG: 15,
            },
            {
              name: 'Ceviz içi',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 100,
              proteinG: 2.3,
              carbsG: 2,
              fatG: 9.8,
            },
          ],
        },
        {
          name: 'Tereyağlı kahve',
          items: [
            {
              name: 'Türk kahvesi',
              servingSize: 60,
              servingUnit: 'ml',
              quantity: 1,
              calories: 2,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 0,
            },
            {
              name: 'Tereyağı',
              servingSize: 10,
              servingUnit: 'g',
              quantity: 1,
              calories: 72,
              proteinG: 0.1,
              carbsG: 0,
              fatG: 8,
            },
          ],
        },
      ],
    },
    popularityScore: 95,
    isPremium: false,
  },

  // 3. INTERMITTENT FASTING 16:8 ─────────────────────────────────────────────
  {
    slug: 'if-16-8',
    name: 'Aralıklı Oruç (16:8)',
    tagline: '16 saat oruç, 8 saat yeme penceresi',
    description:
      'Belirli saat aralıklarında yemek yiyerek metabolik sağlığı destekler. Kilo verme, insülin duyarlılığı ve hücre yenilenmesine katkı sağlar.',
    heroImageUrl: img('1498837167922-ddd27525d352'),
    thumbnailUrl: img('1498837167922-ddd27525d352', 600),
    accentColor: '#5856D6',
    defaultDurationDays: 30,
    minDurationDays: 14,
    maxDurationDays: 90,
    calorieFormula: 'tdee:0.9',
    proteinPct: 25,
    carbsPct: 45,
    fatPct: 30,
    evidenceLevel: 'strong',
    recommendedFor: ['kilo verme', 'insülin duyarlılığı', 'metabolik sağlık', 'sade yaşam tarzı'],
    notRecommendedFor: ['hamileler', 'emziren anneler', 'yeme bozukluğu öyküsü', 'tip 1 diyabet'],
    rules: {
      allowed: [
        'Yeme penceresinde dengeli beslenme',
        'Oruç saatlerinde su, kahve, çay (şekersiz)',
        'Sebze, protein, sağlıklı yağ',
        'Tam tahıl',
      ],
      avoid: [
        'Oruç saatlerinde kalori alımı',
        'İşlenmiş şekerli atıştırmalıklar',
        'Aşırı yeme (binge)',
      ],
      tips: [
        'Yeme penceren genelde 12:00-20:00 arası',
        'İlk öğünü protein-yağ ağırlıklı yap',
        'Oruç saatlerinde aktif kal',
        'İlk hafta zor olabilir, su içmek yardımcı',
      ],
    },
    mealPool: {
      breakfast: [
        {
          name: 'İlk öğün (12:00) — Yumurtalı tabak',
          items: [
            {
              name: 'Yumurta',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 3,
              calories: 78,
              proteinG: 6.3,
              carbsG: 0.6,
              fatG: 5.3,
            },
            {
              name: 'Avokado',
              servingSize: 80,
              servingUnit: 'g',
              quantity: 1,
              calories: 128,
              proteinG: 1.6,
              carbsG: 7,
              fatG: 12,
            },
            {
              name: 'Tam buğday tost',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 5,
              carbsG: 25,
              fatG: 1.5,
            },
          ],
        },
        {
          name: 'İlk öğün — Yoğurtlu meyve',
          items: [
            {
              name: 'Süzme yoğurt',
              servingSize: 250,
              servingUnit: 'g',
              quantity: 1,
              calories: 150,
              proteinG: 22,
              carbsG: 10,
              fatG: 2.5,
            },
            {
              name: 'Granola',
              servingSize: 40,
              servingUnit: 'g',
              quantity: 1,
              calories: 175,
              proteinG: 4,
              carbsG: 30,
              fatG: 5,
            },
            {
              name: 'Muz',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 89,
              proteinG: 1.1,
              carbsG: 23,
              fatG: 0.3,
            },
          ],
        },
        {
          name: 'İlk öğün — Tavuklu wrap',
          items: [
            {
              name: 'Tam buğday lavaş',
              servingSize: 60,
              servingUnit: 'g',
              quantity: 1,
              calories: 165,
              proteinG: 6,
              carbsG: 30,
              fatG: 2,
            },
            {
              name: 'Tavuk göğsü ızgara',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 165,
              proteinG: 31,
              carbsG: 0,
              fatG: 3.6,
            },
            {
              name: 'Marul, domates, yoğurt sos',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 50,
              proteinG: 2,
              carbsG: 6,
              fatG: 2,
            },
          ],
        },
        {
          name: 'İlk öğün — Smoothie kase',
          items: [
            {
              name: 'Süt',
              servingSize: 200,
              servingUnit: 'ml',
              quantity: 1,
              calories: 100,
              proteinG: 7,
              carbsG: 10,
              fatG: 4,
            },
            {
              name: 'Muz',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 89,
              proteinG: 1.1,
              carbsG: 23,
              fatG: 0.3,
            },
            {
              name: 'Whey protein',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 120,
              proteinG: 24,
              carbsG: 3,
              fatG: 1.5,
            },
            {
              name: 'Yer fıstığı ezmesi',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 95,
              proteinG: 4,
              carbsG: 3,
              fatG: 8,
            },
          ],
        },
      ],
      lunch: [
        {
          name: 'Tavuk salata kase',
          items: [
            {
              name: 'Izgara tavuk',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 240,
              proteinG: 45,
              carbsG: 0,
              fatG: 5,
            },
            {
              name: 'Karışık yeşillik',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 25,
              proteinG: 1.5,
              carbsG: 4,
              fatG: 0.3,
            },
            {
              name: 'Kinoa',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 120,
              proteinG: 4,
              carbsG: 21,
              fatG: 2,
            },
            {
              name: 'Avokado',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 1,
              carbsG: 4.5,
              fatG: 7.5,
            },
          ],
        },
        {
          name: 'Somonlu kinoa',
          items: [
            {
              name: 'Somon fileto',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 270,
              proteinG: 30,
              carbsG: 0,
              fatG: 16,
            },
            {
              name: 'Kinoa pilavı',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 180,
              proteinG: 6,
              carbsG: 32,
              fatG: 3,
            },
            {
              name: 'Brokoli',
              servingSize: 100,
              servingUnit: 'g',
              quantity: 1,
              calories: 34,
              proteinG: 2.8,
              carbsG: 7,
              fatG: 0.4,
            },
          ],
        },
        {
          name: 'Mercimekli salata',
          items: [
            {
              name: 'Yeşil mercimek',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 170,
              proteinG: 13,
              carbsG: 30,
              fatG: 0.6,
            },
            {
              name: 'Roka, domates, salatalık',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 50,
              proteinG: 2,
              carbsG: 9,
              fatG: 0.5,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 10,
              servingUnit: 'ml',
              quantity: 1,
              calories: 90,
              proteinG: 0,
              carbsG: 0,
              fatG: 10,
            },
          ],
        },
        {
          name: 'Köfte ve bulgur',
          items: [
            {
              name: 'Izgara köfte',
              servingSize: 120,
              servingUnit: 'g',
              quantity: 1,
              calories: 260,
              proteinG: 22,
              carbsG: 4,
              fatG: 18,
            },
            {
              name: 'Bulgur pilavı',
              servingSize: 120,
              servingUnit: 'g',
              quantity: 1,
              calories: 155,
              proteinG: 5,
              carbsG: 31,
              fatG: 1.2,
            },
            {
              name: 'Cacık',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 4,
              carbsG: 6,
              fatG: 4,
            },
          ],
        },
      ],
      dinner: [
        {
          name: 'Son öğün (20:00) — Hafif balık',
          items: [
            {
              name: 'Levrek fileto',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 195,
              proteinG: 35,
              carbsG: 0,
              fatG: 6,
            },
            {
              name: 'Buğulanmış sebze',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 80,
              proteinG: 4,
              carbsG: 14,
              fatG: 1,
            },
            {
              name: 'Zeytinyağı',
              servingSize: 5,
              servingUnit: 'ml',
              quantity: 1,
              calories: 45,
              proteinG: 0,
              carbsG: 0,
              fatG: 5,
            },
          ],
        },
        {
          name: 'Son öğün — Tavuk ve sebze',
          items: [
            {
              name: 'Tavuk but ızgara',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 270,
              proteinG: 30,
              carbsG: 0,
              fatG: 16,
            },
            {
              name: 'Karışık fırın sebze',
              servingSize: 200,
              servingUnit: 'g',
              quantity: 1,
              calories: 95,
              proteinG: 3,
              carbsG: 15,
              fatG: 3,
            },
          ],
        },
        {
          name: 'Son öğün — Sebze çorbası ve tost',
          items: [
            {
              name: 'Sebze çorbası',
              servingSize: 300,
              servingUnit: 'ml',
              quantity: 1,
              calories: 120,
              proteinG: 4,
              carbsG: 18,
              fatG: 4,
            },
            {
              name: 'Tam buğday tost',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 130,
              proteinG: 5,
              carbsG: 25,
              fatG: 1.5,
            },
            {
              name: 'Kaşar',
              servingSize: 30,
              servingUnit: 'g',
              quantity: 1,
              calories: 110,
              proteinG: 7,
              carbsG: 0.5,
              fatG: 9,
            },
          ],
        },
        {
          name: 'Son öğün — Etli sebze yemeği',
          items: [
            {
              name: 'Kuru fasulye etli',
              servingSize: 250,
              servingUnit: 'g',
              quantity: 1,
              calories: 320,
              proteinG: 18,
              carbsG: 35,
              fatG: 12,
            },
            {
              name: 'Bulgur pilavı',
              servingSize: 80,
              servingUnit: 'g',
              quantity: 1,
              calories: 105,
              proteinG: 3,
              carbsG: 21,
              fatG: 0.8,
            },
          ],
        },
      ],
      snack: [
        {
          name: 'Yeme penceresi içi — kuruyemiş',
          items: [
            {
              name: 'Karışık kuruyemiş',
              servingSize: 25,
              servingUnit: 'g',
              quantity: 1,
              calories: 150,
              proteinG: 5,
              carbsG: 6,
              fatG: 13,
            },
          ],
        },
        {
          name: 'Yeme penceresi içi — meyve',
          items: [
            {
              name: 'Elma',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 78,
              proteinG: 0.4,
              carbsG: 21,
              fatG: 0.2,
            },
            {
              name: 'Badem',
              servingSize: 15,
              servingUnit: 'g',
              quantity: 1,
              calories: 87,
              proteinG: 3,
              carbsG: 3,
              fatG: 7.5,
            },
          ],
        },
        {
          name: 'Yeme penceresi içi — yoğurt',
          items: [
            {
              name: 'Süzme yoğurt',
              servingSize: 150,
              servingUnit: 'g',
              quantity: 1,
              calories: 90,
              proteinG: 13,
              carbsG: 6,
              fatG: 1.5,
            },
            {
              name: 'Bal',
              servingSize: 10,
              servingUnit: 'g',
              quantity: 1,
              calories: 30,
              proteinG: 0,
              carbsG: 8,
              fatG: 0,
            },
          ],
        },
        {
          name: 'Yeme penceresi içi — protein bar',
          items: [
            {
              name: 'Protein bar',
              servingSize: 50,
              servingUnit: 'g',
              quantity: 1,
              calories: 200,
              proteinG: 20,
              carbsG: 18,
              fatG: 7,
            },
          ],
        },
      ],
    },
    popularityScore: 90,
    isPremium: false,
  },

  // ─── PRESET 4-14 — özet seviye (mealPool reuse + minor variation) ─────────
  // Üretkenlik için: aynı format, kısaltılmış ama eksiksiz
]

// ──────────────────────────────────────────
// Geri kalan 11 preset (4-14) — kompakt, tam veri
// ──────────────────────────────────────────

// Helper: temel öğün şablonu
const M = (name: string, items: PresetMealItem[]): PresetMeal => ({ name, items })
const I = (
  name: string,
  servingSize: number,
  servingUnit: string,
  quantity: number,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG?: number
): PresetMealItem => ({
  name,
  servingSize,
  servingUnit,
  quantity,
  calories,
  proteinG,
  carbsG,
  fatG,
  fiberG,
})

// 4. DASH
PRESETS.push({
  slug: 'dash',
  name: 'DASH Diyeti',
  tagline: 'Yüksek tansiyon için NIH onaylı',
  description:
    'Sodyumu kısıtlayıp potasyum, magnezyum ve kalsiyum açısından zengin beslenme. Hipertansiyon kontrolünde altın standart.',
  heroImageUrl: img('1512621776951-a57141f2eefd'),
  thumbnailUrl: img('1512621776951-a57141f2eefd', 600),
  accentColor: '#34C759',
  defaultDurationDays: 60,
  minDurationDays: 30,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 18,
  carbsPct: 55,
  fatPct: 27,
  evidenceLevel: 'strong',
  recommendedFor: ['yüksek tansiyon', 'kalp sağlığı', 'kolesterol kontrolü'],
  notRecommendedFor: ['ağır böbrek hastaları (potasyum kısıtlı)'],
  rules: {
    allowed: [
      'Sebze ve meyve (8-10 porsiyon)',
      'Tam tahıl',
      'Yağsız süt ürünleri',
      'Yağsız et, balık, tavuk',
      'Fındık, tohum, baklagil',
    ],
    avoid: [
      'Tuz (<1500mg/gün)',
      'İşlenmiş et (sucuk, salam)',
      'Şekerli içecekler',
      'Kırmızı et fazlası',
      'Hazır gıdalar',
    ],
    tips: [
      'Yemeklere tuz yerine baharat',
      'Etiketlerde sodyum miktarına bak',
      'Günlük 8-10 porsiyon sebze meyve',
      'Tam tahıllı tercih et',
    ],
  },
  mealPool: {
    breakfast: [
      M('Tam buğday tostu ve meyve', [
        I('Tam buğday tost', 50, 'g', 2, 260, 10, 50, 3, 6),
        I('Yağsız peynir', 40, 'g', 1, 90, 11, 1, 4),
        I('Muz', 100, 'g', 1, 89, 1.1, 23, 0.3),
      ]),
      M('Yulaf ezmeli kase', [
        I('Yulaf', 50, 'g', 1, 190, 6.5, 33, 3.5, 5),
        I('Yağsız süt', 200, 'ml', 1, 72, 7, 10, 0.5),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
      ]),
      M('Yumurta ve sebze', [
        I('Yumurta beyazı', 30, 'g', 3, 15, 3.3, 0.2, 0),
        I('Ispanak', 100, 'g', 1, 23, 2.9, 3.6, 0.4),
        I('Tam buğday tost', 50, 'g', 1, 130, 5, 25, 1.5),
      ]),
      M('Smoothie ve granola', [
        I('Yağsız yoğurt', 200, 'g', 1, 110, 18, 15, 0),
        I('Çilek', 100, 'g', 1, 32, 0.7, 7.7, 0.3),
        I('Granola', 30, 'g', 1, 130, 3, 22, 4),
      ]),
    ],
    lunch: [
      M('Tavuklu sebze sote', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Karışık sebze', 250, 'g', 1, 100, 4, 18, 1.5),
        I('Esmer pirinç', 100, 'g', 1, 110, 2.5, 23, 0.9),
      ]),
      M('Mercimek köftesi salatası', [
        I('Mercimek köftesi', 200, 'g', 1, 250, 12, 42, 3),
        I('Yeşil salata', 150, 'g', 1, 30, 2, 5, 0.5),
        I('Limon-zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Hindi sandviç', [
        I('Tam buğday ekmeği', 60, 'g', 1, 160, 6, 30, 2),
        I('Hindi göğsü', 80, 'g', 1, 110, 22, 1, 2),
        I('Salatalık-marul', 100, 'g', 1, 15, 0.7, 3, 0.1),
      ]),
      M('Balık ve sebze', [
        I('Levrek fileto', 150, 'g', 1, 195, 35, 0, 6),
        I('Buharda brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
        I('Bulgur', 100, 'g', 1, 130, 4, 26, 1),
      ]),
    ],
    dinner: [
      M('Sebze yemeği ve yoğurt', [
        I('Etli kabak', 250, 'g', 1, 200, 12, 18, 9),
        I('Yağsız yoğurt', 150, 'g', 1, 80, 13, 11, 0),
      ]),
      M('Izgara somon', [
        I('Somon', 150, 'g', 1, 270, 30, 0, 16),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Yeşil fasulye', 150, 'g', 1, 45, 2.5, 9, 0.3),
      ]),
      M('Tavuk şinitzel (fırın)', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
        I('Salata', 100, 'g', 1, 25, 1, 5, 0.3),
      ]),
      M('Mercimek çorbası ve ekmek', [
        I('Mercimek çorba', 300, 'ml', 1, 180, 12, 28, 3),
        I('Tam buğday ekmek', 50, 'g', 1, 130, 5, 25, 1.5),
        I('Yeşillik', 100, 'g', 1, 20, 1, 3, 0.2),
      ]),
    ],
    snack: [
      M('Elma ve badem', [
        I('Elma', 150, 'g', 1, 78, 0.4, 21, 0.2),
        I('Badem', 15, 'g', 1, 87, 3, 3, 7.5),
      ]),
      M('Yağsız yoğurt', [I('Yağsız yoğurt', 200, 'g', 1, 110, 18, 15, 0)]),
      M('Havuç ve humus', [
        I('Havuç', 100, 'g', 1, 41, 0.9, 10, 0.2),
        I('Humus', 50, 'g', 1, 85, 4, 7.5, 5),
      ]),
      M('Tam buğday gevrek', [I('Tam buğday gevrek', 30, 'g', 1, 110, 3, 23, 1)]),
    ],
  },
  popularityScore: 80,
  isPremium: false,
})

// 5. LOW-CARB
PRESETS.push({
  slug: 'low-carb',
  name: 'Düşük Karbonhidrat',
  tagline: 'Keto kadar sıkı değil, esnek',
  description:
    'Günlük karbonhidratı 50-100g arasında tutar. Kilo verme ve kan şekeri kontrolü için keto kadar sıkı kurallar olmadan etkili.',
  heroImageUrl: img('1546069901-ba9599a7e63c'),
  thumbnailUrl: img('1546069901-ba9599a7e63c', 600),
  accentColor: '#FF9500',
  defaultDurationDays: 30,
  minDurationDays: 14,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.85',
  proteinPct: 30,
  carbsPct: 20,
  fatPct: 50,
  evidenceLevel: 'strong',
  recommendedFor: ['kilo verme', 'kan şekeri kontrolü', 'insülin direnci'],
  notRecommendedFor: ['dayanıklılık sporcuları', 'çok aktif yaşam'],
  rules: {
    allowed: [
      'Et, balık, yumurta',
      'Yağlı süt ürünleri',
      'Sebze (nişastasız)',
      'Kuruyemiş',
      'Sağlıklı yağlar',
      'Az miktar meyve (yaban mersini, çilek)',
    ],
    avoid: [
      'Şeker ve tatlılar',
      'Beyaz un',
      'Patates, mısır',
      'Şekerli içecekler',
      'Tahıl bazlı atıştırmalıklar',
    ],
    tips: [
      'Günlük karb 50-100g hedefi',
      'Sebzeden gelen karbı saymak gerekmez',
      'Yeterli protein al',
      'İşlenmiş "low-carb" ürünlere dikkat',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yumurtalı kahvaltı', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Domates-salatalık', 100, 'g', 1, 17, 0.8, 3.7, 0.15),
      ]),
      M('Avokadolu omlet', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
        I('Tereyağı', 5, 'g', 1, 36, 0.05, 0, 4),
      ]),
      M('Yoğurt ve kuruyemiş', [
        I('Süzme yoğurt', 200, 'g', 1, 120, 18, 8, 2),
        I('Ceviz', 20, 'g', 1, 135, 3, 2.5, 13),
        I('Çilek', 80, 'g', 1, 26, 0.6, 6, 0.2),
      ]),
      M('Sucuklu yumurta', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Sucuk', 40, 'g', 1, 170, 8, 0.7, 16),
        I('Kaşar', 30, 'g', 1, 110, 7, 0.5, 9),
      ]),
    ],
    lunch: [
      M('Tavuklu salata', [
        I('Izgara tavuk', 150, 'g', 1, 240, 45, 0, 5),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Köfte ve karnabahar pilavı', [
        I('Köfte', 150, 'g', 1, 360, 25, 2, 28),
        I('Karnabahar pilavı', 150, 'g', 1, 50, 3, 8, 1),
      ]),
      M('Somon ve yeşil fasulye', [
        I('Somon', 150, 'g', 1, 270, 30, 0, 16),
        I('Yeşil fasulye', 200, 'g', 1, 60, 3.5, 12, 0.4),
        I('Tereyağı', 10, 'g', 1, 72, 0.1, 0, 8),
      ]),
      M('Ton balıklı avokado', [
        I('Ton balığı', 120, 'g', 1, 150, 32, 0, 2),
        I('Avokado', 150, 'g', 1, 240, 3, 13, 22),
        I('Domates', 100, 'g', 1, 18, 0.9, 3.9, 0.2),
      ]),
    ],
    dinner: [
      M('Biftek ve sebze', [
        I('Dana antrikot', 180, 'g', 1, 485, 45, 0, 34),
        I('Brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
        I('Tereyağı', 10, 'g', 1, 72, 0.1, 0, 8),
      ]),
      M('Tavuk şinitzel', [
        I('Tavuk göğsü', 180, 'g', 1, 290, 54, 0, 6),
        I('Badem unu', 20, 'g', 1, 115, 4, 4, 10),
        I('Yeşil salata', 150, 'g', 1, 30, 1.5, 5, 0.5),
      ]),
      M('Levrek ve sebze', [
        I('Levrek', 180, 'g', 1, 235, 42, 0, 7),
        I('Kabak ızgara', 150, 'g', 1, 25, 1.8, 5.4, 0.3),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Karides ve sebze sote', [
        I('Karides', 150, 'g', 1, 145, 30, 1, 2),
        I('Mantar', 150, 'g', 1, 33, 4.6, 5, 0.5),
        I('Tereyağı', 15, 'g', 1, 108, 0.1, 0, 12),
      ]),
    ],
    snack: [
      M('Peynir ve zeytin', [
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Zeytin', 20, 'g', 1, 25, 0.2, 0.7, 2.3),
      ]),
      M('Yumurta', [I('Haşlanmış yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3)]),
      M('Avokado', [I('Avokado', 100, 'g', 1, 160, 2, 9, 15)]),
      M('Kuruyemiş karışık', [I('Karışık kuruyemiş', 25, 'g', 1, 150, 5, 6, 13)]),
    ],
  },
  popularityScore: 75,
  isPremium: false,
})

// 6. HIGH-PROTEIN
PRESETS.push({
  slug: 'high-protein',
  name: 'Yüksek Protein',
  tagline: 'Kas dostu, tokluk hissi',
  description:
    "Günlük protein alımını kilo başına 1.6-2.2g'a çıkarır. Kas kütlesi koruma, kilo verme sırasında yağ kaybı, sportif performans için ideal.",
  heroImageUrl: img('1532550907401-a500c9a57435'),
  thumbnailUrl: img('1532550907401-a500c9a57435', 600),
  accentColor: '#FF2D55',
  defaultDurationDays: 30,
  minDurationDays: 14,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 35,
  carbsPct: 35,
  fatPct: 30,
  evidenceLevel: 'strong',
  recommendedFor: [
    'kas kütlesi koruma',
    'sportif performans',
    'kilo verme sırasında kas koruma',
    'tokluk hissi',
  ],
  notRecommendedFor: ['ileri böbrek hastaları'],
  rules: {
    allowed: [
      'Tavuk, hindi göğsü',
      'Balık',
      'Yumurta',
      'Yağsız kırmızı et',
      'Süzme yoğurt, peynir',
      'Whey/casein protein',
      'Baklagiller',
    ],
    avoid: ['Şekerli atıştırmalıklar', 'Aşırı yağlı et', 'Boş kalori (alkol, şekerli içecek)'],
    tips: [
      'Her öğünde 25-40g protein',
      'Antrenman sonrası protein al',
      'Yeterli su iç (3L+)',
      'Karbonhidrat antrenman etrafında',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yumurta beyazı omlet', [
        I('Yumurta beyazı', 30, 'g', 5, 25, 5.5, 0.4, 0),
        I('Yulaf', 40, 'g', 1, 150, 5, 27, 3, 4),
        I('Muz', 100, 'g', 1, 89, 1.1, 23, 0.3),
      ]),
      M('Süzme yoğurt kase', [
        I('Süzme yoğurt', 300, 'g', 1, 180, 27, 12, 3),
        I('Granola', 30, 'g', 1, 130, 3, 22, 4),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
      ]),
      M('Whey protein smoothie', [
        I('Whey protein', 30, 'g', 1, 120, 24, 3, 1.5),
        I('Süt', 300, 'ml', 1, 150, 10.5, 15, 6),
        I('Muz', 100, 'g', 1, 89, 1.1, 23, 0.3),
        I('Yer fıstığı ezmesi', 15, 'g', 1, 95, 4, 3, 8),
      ]),
      M('Yumurtalı tost', [
        I('Tam buğday tost', 60, 'g', 2, 160, 6, 30, 2),
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Hindi jambon', 40, 'g', 1, 55, 11, 0.5, 1),
      ]),
    ],
    lunch: [
      M('Tavuk göğsü ve pirinç', [
        I('Tavuk göğsü', 200, 'g', 1, 320, 60, 0, 6.5),
        I('Esmer pirinç', 150, 'g', 1, 165, 3.7, 35, 1.4),
        I('Brokoli', 100, 'g', 1, 34, 2.8, 7, 0.4),
      ]),
      M('Somon ve kinoa', [
        I('Somon', 180, 'g', 1, 325, 36, 0, 19),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Roka salata', 100, 'g', 1, 25, 2.6, 3.7, 0.7),
      ]),
      M('Hindi köfte ve bulgur', [
        I('Hindi köfte', 150, 'g', 1, 225, 33, 3, 8),
        I('Bulgur', 150, 'g', 1, 195, 6, 39, 1.5),
        I('Cacık', 150, 'g', 1, 60, 3, 4.5, 3),
      ]),
      M('Ton balığı salata', [
        I('Ton balığı', 150, 'g', 1, 185, 40, 0, 2),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
    ],
    dinner: [
      M('Dana bonfile ve sebze', [
        I('Dana bonfile', 200, 'g', 1, 400, 55, 0, 18),
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
        I('Brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
      ]),
      M('Tavuk şinitzel ve sebze', [
        I('Tavuk göğsü', 200, 'g', 1, 320, 60, 0, 6.5),
        I('Karışık sebze', 200, 'g', 1, 80, 3, 15, 1),
        I('Esmer pirinç', 100, 'g', 1, 110, 2.5, 23, 0.9),
      ]),
      M('Levrek ve makarna', [
        I('Levrek', 200, 'g', 1, 260, 47, 0, 8),
        I('Tam buğday makarna', 100, 'g', 1, 124, 5, 27, 0.9),
        I('Domates sos', 80, 'g', 1, 25, 1, 6, 0.2),
      ]),
      M('Karides ızgara ve kinoa', [
        I('Karides', 200, 'g', 1, 195, 40, 1.3, 2.7),
        I('Kinoa', 150, 'g', 1, 180, 6, 32, 3),
        I('Salata', 150, 'g', 1, 30, 1.5, 5, 0.5),
      ]),
    ],
    snack: [
      M('Süzme yoğurt', [I('Süzme yoğurt', 200, 'g', 1, 120, 18, 8, 2)]),
      M('Protein bar', [I('Protein bar', 60, 'g', 1, 230, 22, 22, 8)]),
      M('Whey shake', [
        I('Whey protein', 30, 'g', 1, 120, 24, 3, 1.5),
        I('Su', 250, 'ml', 1, 0, 0, 0, 0),
      ]),
      M('Hindi göğsü dilimleri', [I('Hindi göğsü', 60, 'g', 1, 80, 16, 0.7, 1.5)]),
    ],
  },
  popularityScore: 88,
  isPremium: false,
})

// 7. VOLUMETRICS
PRESETS.push({
  slug: 'volumetrics',
  name: 'Volumetrics',
  tagline: 'Az kalori, çok hacim — tokluk odaklı',
  description:
    'Düşük kalori yoğunluğu olan gıdaları (sebze, çorba, meyve) tercih ederek aynı kalori ile çok daha doyurucu öğünler oluşturur.',
  heroImageUrl: img('1540420773420-3366772f4999'),
  thumbnailUrl: img('1540420773420-3366772f4999', 600),
  accentColor: '#30B0C7',
  defaultDurationDays: 60,
  minDurationDays: 30,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.8',
  proteinPct: 22,
  carbsPct: 50,
  fatPct: 28,
  evidenceLevel: 'strong',
  recommendedFor: ['kilo verme', 'sürekli açlık hissi olanlar', 'porsiyon kontrolü zor olanlar'],
  notRecommendedFor: [],
  rules: {
    allowed: [
      'Sebze çorbaları',
      'Sebze ve meyve (sınırsız)',
      'Yağsız protein',
      'Tam tahıl (ölçülü)',
      'Yağsız süt ürünleri',
    ],
    avoid: [
      'Yağlı kızartmalar',
      'Şekerli içecekler',
      'Kuruyemiş fazlası (kalori yoğun)',
      'Tatlı, kek, bisküvi',
    ],
    tips: [
      'Her öğüne çorba/salata ile başla',
      'Tabağın yarısı sebze olsun',
      'Su tüketimini artır',
      'Yavaş ye, tokluğu hisset',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yulaf ezmesi ve meyve', [
        I('Yulaf', 40, 'g', 1, 150, 5, 27, 3, 4),
        I('Yağsız süt', 250, 'ml', 1, 90, 9, 12, 0.6),
        I('Çilek', 150, 'g', 1, 48, 1, 11.5, 0.5),
      ]),
      M('Sebzeli omlet', [
        I('Yumurta beyazı', 30, 'g', 4, 20, 4.4, 0.3, 0),
        I('Yumurta', 50, 'g', 1, 78, 6.3, 0.6, 5.3),
        I('Ispanak', 100, 'g', 1, 23, 2.9, 3.6, 0.4),
        I('Tam buğday tost', 50, 'g', 1, 130, 5, 25, 1.5),
      ]),
      M('Smoothie kase', [
        I('Yağsız yoğurt', 200, 'g', 1, 110, 18, 15, 0),
        I('Çilek', 150, 'g', 1, 48, 1, 11.5, 0.5),
        I('Ispanak', 50, 'g', 1, 12, 1.5, 1.8, 0.2),
        I('Muz', 80, 'g', 1, 71, 0.9, 18, 0.2),
      ]),
      M('Sebzeli haşlama', [
        I('Yumurta haşlanmış', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Domates-salatalık', 200, 'g', 1, 33, 1.6, 7, 0.3),
        I('Tam buğday ekmek', 40, 'g', 1, 105, 4, 20, 1.2),
      ]),
    ],
    lunch: [
      M('Sebze çorbası ve salata', [
        I('Sebze çorbası', 400, 'ml', 1, 130, 5, 22, 3),
        I('Tavuklu salata', 200, 'g', 1, 180, 28, 5, 5),
        I('Ekmek', 30, 'g', 1, 80, 3, 15, 1),
      ]),
      M('Mercimek çorbası ve menemen', [
        I('Mercimek çorba', 300, 'ml', 1, 180, 12, 28, 3),
        I('Menemen', 200, 'g', 1, 180, 12, 8, 11),
      ]),
      M('Tavuk salata kase', [
        I('Izgara tavuk', 120, 'g', 1, 195, 36, 0, 4),
        I('Bol yeşillik', 250, 'g', 1, 40, 2.5, 7, 0.5),
        I('Bulgur', 80, 'g', 1, 105, 3.2, 21, 0.8),
      ]),
      M('Balık ve sebze', [
        I('Levrek', 150, 'g', 1, 195, 35, 0, 6),
        I('Buharda sebze', 300, 'g', 1, 110, 5, 20, 1),
      ]),
    ],
    dinner: [
      M('Sebze yemeği ve yoğurt', [
        I('Etli kabak', 300, 'g', 1, 240, 14, 22, 11),
        I('Yağsız yoğurt', 200, 'g', 1, 110, 18, 15, 0),
      ]),
      M('Tavuklu sebze sote', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Karışık sebze', 300, 'g', 1, 120, 5, 22, 1.5),
      ]),
      M('Mercimek köftesi', [
        I('Mercimek köftesi', 250, 'g', 1, 310, 14, 52, 3.5),
        I('Yeşil salata', 150, 'g', 1, 30, 2, 5, 0.5),
      ]),
      M('Kuru fasulye', [
        I('Etli kuru fasulye', 300, 'g', 1, 360, 20, 40, 14),
        I('Bulgur', 60, 'g', 1, 80, 2.4, 15.6, 0.6),
      ]),
    ],
    snack: [
      M('Karpuz', [I('Karpuz', 300, 'g', 1, 90, 1.8, 22, 0.6)]),
      M('Salatalık ve havuç', [
        I('Salatalık', 150, 'g', 1, 23, 1, 5.4, 0.15),
        I('Havuç', 100, 'g', 1, 41, 0.9, 10, 0.2),
      ]),
      M('Yağsız yoğurt ve meyve', [
        I('Yağsız yoğurt', 150, 'g', 1, 80, 13, 11, 0),
        I('Çilek', 100, 'g', 1, 32, 0.7, 7.7, 0.3),
      ]),
      M('Patlamış mısır', [I('Patlamış mısır', 20, 'g', 1, 76, 2.4, 15, 0.9)]),
    ],
  },
  popularityScore: 70,
  isPremium: false,
})

// 8. VEGAN
PRESETS.push({
  slug: 'vegan',
  name: 'Vegan',
  tagline: 'Tamamen bitkisel beslenme',
  description:
    'Hayvansal hiçbir ürün içermez. İyi planlandığında her makro ve mikro besin ihtiyacı karşılanır. Çevre, etik ve sağlık için.',
  heroImageUrl: img('1512621776951-a57141f2eefd'),
  thumbnailUrl: img('1512621776951-a57141f2eefd', 600),
  accentColor: '#34C759',
  defaultDurationDays: 30,
  minDurationDays: 14,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 18,
  carbsPct: 55,
  fatPct: 27,
  evidenceLevel: 'moderate',
  recommendedFor: ['etik beslenme', 'çevre bilinci', 'kalp sağlığı', 'tip 2 diyabet kontrolü'],
  notRecommendedFor: ['B12 eksikliği olanlar (takviye şart)', 'demir eksikliği takipsiz hastalar'],
  rules: {
    allowed: [
      'Baklagiller (mercimek, nohut, fasulye)',
      'Tofu, tempeh, seitan',
      'Tam tahıllar',
      'Sebze ve meyve',
      'Kuruyemiş ve tohum',
      'Bitkisel sütler',
    ],
    avoid: ['Et, balık, tavuk', 'Süt ve süt ürünleri', 'Yumurta', 'Bal'],
    tips: [
      'B12 takviyesi al',
      'Demir için C vitamini ile birlikte tüket',
      'Omega-3 için keten/chia tohumu',
      'Çeşitli protein kaynakları kombinle',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yulaf ve meyve', [
        I('Yulaf', 50, 'g', 1, 190, 6.5, 33, 3.5, 5),
        I('Badem sütü', 250, 'ml', 1, 40, 1.5, 2, 3),
        I('Muz', 100, 'g', 1, 89, 1.1, 23, 0.3),
        I('Chia tohumu', 10, 'g', 1, 49, 1.6, 4.2, 3),
      ]),
      M('Tofu scramble', [
        I('Tofu', 150, 'g', 1, 110, 12, 3, 7),
        I('Tam buğday tost', 60, 'g', 2, 160, 6, 30, 2),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
      ]),
      M('Smoothie kase', [
        I('Soya sütü', 250, 'ml', 1, 80, 7, 4, 4),
        I('Muz', 100, 'g', 1, 89, 1.1, 23, 0.3),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
        I('Yer fıstığı ezmesi', 15, 'g', 1, 95, 4, 3, 8),
      ]),
      M('Hummuslu sandviç', [
        I('Tam buğday ekmek', 60, 'g', 1, 160, 6, 30, 2),
        I('Humus', 60, 'g', 1, 100, 5, 9, 6),
        I('Marul-domates', 100, 'g', 1, 17, 0.8, 3.7, 0.15),
      ]),
    ],
    lunch: [
      M('Mercimek köftesi', [
        I('Mercimek köftesi', 250, 'g', 1, 310, 14, 52, 3.5),
        I('Yeşil salata', 150, 'g', 1, 30, 2, 5, 0.5),
        I('Limon-zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Nohut salatası', [
        I('Nohut haşlanmış', 180, 'g', 1, 290, 16, 49, 4.5),
        I('Kinoa', 100, 'g', 1, 120, 4, 21, 2),
        I('Karışık sebze', 150, 'g', 1, 55, 2.5, 11, 0.5),
      ]),
      M('Tofu sote', [
        I('Tofu', 180, 'g', 1, 130, 14, 4, 8),
        I('Brokoli ve havuç', 200, 'g', 1, 80, 4, 15, 0.7),
        I('Esmer pirinç', 100, 'g', 1, 110, 2.5, 23, 0.9),
      ]),
      M('Mercimek çorba ve dürüm', [
        I('Mercimek çorba', 300, 'ml', 1, 180, 12, 28, 3),
        I('Sebzeli dürüm', 200, 'g', 1, 290, 8, 52, 5),
      ]),
    ],
    dinner: [
      M('Kuru fasulye', [
        I('Kuru fasulye etsiz', 300, 'g', 1, 300, 15, 42, 8),
        I('Bulgur pilavı', 100, 'g', 1, 130, 4, 26, 1),
      ]),
      M('Sebze yemeği', [
        I('Zeytinyağlı taze fasulye', 300, 'g', 1, 265, 7, 30, 14),
        I('Tam buğday ekmek', 40, 'g', 1, 105, 4, 20, 1.2),
      ]),
      M('Sebzeli kinoa', [
        I('Kinoa', 150, 'g', 1, 180, 6, 32, 3),
        I('Karışık fırın sebze', 200, 'g', 1, 95, 3, 15, 3),
        I('Tahin sos', 15, 'g', 1, 90, 2.5, 3, 8),
      ]),
      M('Vegan chili', [
        I('Vegan chili (fasulye+sebze)', 300, 'g', 1, 310, 14, 52, 5),
        I('Esmer pirinç', 80, 'g', 1, 88, 2, 18.4, 0.7),
      ]),
    ],
    snack: [
      M('Elma ve yer fıstığı ezmesi', [
        I('Elma', 150, 'g', 1, 78, 0.4, 21, 0.2),
        I('Yer fıstığı ezmesi', 15, 'g', 1, 95, 4, 3, 8),
      ]),
      M('Edamame', [I('Edamame', 100, 'g', 1, 120, 11, 9, 5)]),
      M('Karışık kuruyemiş', [I('Karışık kuruyemiş', 25, 'g', 1, 150, 5, 6, 13)]),
      M('Hummus ve havuç', [
        I('Humus', 60, 'g', 1, 100, 5, 9, 6),
        I('Havuç', 100, 'g', 1, 41, 0.9, 10, 0.2),
      ]),
    ],
  },
  popularityScore: 78,
  isPremium: false,
})

// 9. VEJETARYEN
PRESETS.push({
  slug: 'vegetarian',
  name: 'Vejetaryen',
  tagline: 'Et yok, süt-yumurta var',
  description:
    'Et, balık ve tavuk yok ama süt, yumurta, peynir gibi hayvansal yan ürünler kullanılabilir. Vegan kadar sıkı değil, daha kolay sürdürülebilir.',
  heroImageUrl: img('1567620905732-2d1ec7ab7445'),
  thumbnailUrl: img('1567620905732-2d1ec7ab7445', 600),
  accentColor: '#A8D44E',
  defaultDurationDays: 60,
  minDurationDays: 30,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 20,
  carbsPct: 50,
  fatPct: 30,
  evidenceLevel: 'moderate',
  recommendedFor: ['etik tercih', 'kalp sağlığı', 'sürdürülebilir yaşam'],
  notRecommendedFor: [],
  rules: {
    allowed: [
      'Süt, yoğurt, peynir',
      'Yumurta',
      'Baklagiller',
      'Tofu, tempeh',
      'Tam tahıllar',
      'Sebze, meyve, kuruyemiş',
    ],
    avoid: ['Kırmızı et', 'Tavuk, hindi', 'Balık ve deniz ürünleri'],
    tips: [
      'Demir alımına dikkat (yeşil yapraklı, baklagil)',
      'Protein çeşitliliği önemli',
      'B12 takviyesi (özellikle ovo-lakto degilse)',
    ],
  },
  mealPool: {
    breakfast: [
      M('Klasik kahvaltı', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Tam buğday ekmek', 50, 'g', 1, 130, 5, 25, 1.5),
        I('Domates-zeytin', 100, 'g', 1, 50, 1, 4, 4),
      ]),
      M('Menemen', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Domates', 150, 'g', 1, 27, 1.4, 5.9, 0.3),
        I('Biber-soğan', 80, 'g', 1, 30, 1.2, 7, 0.2),
        I('Ekmek', 50, 'g', 1, 130, 5, 25, 1.5),
      ]),
      M('Yulaflı yoğurt', [
        I('Yulaf', 40, 'g', 1, 150, 5, 27, 3, 4),
        I('Süzme yoğurt', 200, 'g', 1, 120, 18, 8, 2),
        I('Çilek', 100, 'g', 1, 32, 0.7, 7.7, 0.3),
      ]),
      M('Peynirli sandviç', [
        I('Tam buğday ekmek', 60, 'g', 1, 160, 6, 30, 2),
        I('Kaşar', 40, 'g', 1, 145, 9, 0.7, 12),
        I('Salatalık-domates', 100, 'g', 1, 17, 0.8, 3.7, 0.15),
      ]),
    ],
    lunch: [
      M('Mercimek çorbası ve mercimek köfte', [
        I('Mercimek çorba', 300, 'ml', 1, 180, 12, 28, 3),
        I('Mercimek köftesi', 150, 'g', 1, 185, 8, 31, 2.1),
      ]),
      M('Sebzeli kinoa', [
        I('Kinoa', 150, 'g', 1, 180, 6, 32, 3),
        I('Karışık sebze', 200, 'g', 1, 80, 3, 15, 1.5),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
      ]),
      M('Yumurtalı salata', [
        I('Karışık yeşillik', 200, 'g', 1, 40, 2, 7, 0.5),
        I('Yumurta haşlanmış', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Nohut', 80, 'g', 1, 130, 7, 22, 2),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Sebzeli omlet ve salata', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Mantar-biber', 150, 'g', 1, 40, 3.5, 7, 0.4),
        I('Yeşil salata', 150, 'g', 1, 30, 2, 5, 0.5),
      ]),
    ],
    dinner: [
      M('Etli olmayan kabak', [
        I('Sebze yemeği (kabak)', 300, 'g', 1, 200, 5, 20, 12),
        I('Yağsız yoğurt', 150, 'g', 1, 80, 13, 11, 0),
        I('Bulgur', 80, 'g', 1, 105, 3.2, 21, 0.8),
      ]),
      M('Mantar risotto', [
        I('Mantar risotto', 300, 'g', 1, 420, 12, 55, 18),
        I('Yeşil salata', 100, 'g', 1, 20, 1, 3, 0.3),
      ]),
      M('Nohutlu kinoa', [
        I('Kinoa', 150, 'g', 1, 180, 6, 32, 3),
        I('Nohut', 150, 'g', 1, 240, 13, 40, 3.8),
        I('Sebze sote', 150, 'g', 1, 55, 2.5, 11, 0.5),
      ]),
      M('Spaghetti pomodoro', [
        I('Tam buğday makarna', 120, 'g', 1, 150, 6, 32, 1),
        I('Domates sos', 100, 'g', 1, 30, 1, 7, 0.2),
        I('Parmesan', 20, 'g', 1, 80, 7, 1, 5.6),
      ]),
    ],
    snack: [
      M('Yoğurt', [I('Yağsız yoğurt', 200, 'g', 1, 110, 18, 15, 0)]),
      M('Peynir ve zeytin', [
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Zeytin', 20, 'g', 1, 25, 0.2, 0.7, 2.3),
      ]),
      M('Meyve', [I('Elma', 150, 'g', 1, 78, 0.4, 21, 0.2)]),
      M('Yumurta', [I('Haşlanmış yumurta', 50, 'g', 1, 78, 6.3, 0.6, 5.3)]),
    ],
  },
  popularityScore: 72,
  isPremium: false,
})

// 10. MEDITERRANEAN-KETO
PRESETS.push({
  slug: 'mediterranean-keto',
  name: 'Akdeniz Keto',
  tagline: 'Keto disiplini + Akdeniz lezzeti',
  description:
    'Klasik keto kuralları (düşük karb, yüksek yağ) ile Akdeniz mutfağının zeytinyağı, balık ve sebzelerini birleştirir.',
  heroImageUrl: img('1467003909585-2f8a72700288'),
  thumbnailUrl: img('1467003909585-2f8a72700288', 600),
  accentColor: '#5E5CE6',
  defaultDurationDays: 30,
  minDurationDays: 14,
  maxDurationDays: 60,
  calorieFormula: 'tdee:0.85',
  proteinPct: 25,
  carbsPct: 8,
  fatPct: 67,
  evidenceLevel: 'emerging',
  recommendedFor: ['kilo verme + kalp sağlığı', 'keto sürdürülebilirlik'],
  notRecommendedFor: ['hamileler', 'böbrek hastaları', 'tip 1 diyabet'],
  rules: {
    allowed: [
      'Yağlı balık (somon, sardalya)',
      'Zeytinyağı, avokado yağı',
      'Yumurta',
      'Yağlı peynirler',
      'Yeşil yapraklı sebzeler',
      'Az miktar kuruyemiş',
    ],
    avoid: ['Tahıl', 'Şeker', 'Baklagil (çoğu)', 'Meyve (yaban mersini hariç ölçülü)'],
    tips: [
      'Net karb 30g altında',
      'Zeytinyağı baş yağ kaynağı',
      'Haftada 3+ kez balık',
      'Bol su ve elektrolit',
    ],
  },
  mealPool: {
    breakfast: [
      M('Avokadolu somonlu yumurta', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Tütsülenmiş somon', 60, 'g', 1, 70, 11, 0, 3),
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
      ]),
      M('Akdeniz omlet', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Domates', 60, 'g', 1, 11, 0.5, 2.4, 0.1),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Yağlı yoğurt ve ceviz', [
        I('Tam yağlı yoğurt', 200, 'g', 1, 200, 11, 9, 12),
        I('Ceviz', 20, 'g', 1, 135, 3, 2.5, 13),
      ]),
      M('Sebzeli yumurta', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Ispanak', 100, 'g', 1, 23, 2.9, 3.6, 0.4),
        I('Tereyağı', 10, 'g', 1, 72, 0.1, 0, 8),
      ]),
    ],
    lunch: [
      M('Somon ve avokado', [
        I('Somon', 180, 'g', 1, 325, 36, 0, 19),
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
        I('Yeşil salata', 150, 'g', 1, 30, 1.5, 5, 0.5),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Sardalya salata', [
        I('Sardalya', 120, 'g', 1, 250, 30, 0, 14),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Zeytin', 40, 'g', 1, 50, 0.4, 1.6, 4.4),
        I('Zeytinyağı', 15, 'ml', 1, 135, 0, 0, 15),
      ]),
      M('Tavuk Caesar', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Marul', 100, 'g', 1, 15, 1.4, 2.9, 0.2),
        I('Parmesan', 30, 'g', 1, 120, 11, 1.2, 8.4),
        I('Caesar sos', 30, 'g', 1, 145, 1, 1, 15),
      ]),
      M('Karides salata', [
        I('Karides', 150, 'g', 1, 145, 30, 1, 2),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
    ],
    dinner: [
      M('Levrek ve sebze', [
        I('Levrek', 200, 'g', 1, 260, 47, 0, 8),
        I('Kuşkonmaz', 150, 'g', 1, 30, 3, 6, 0.2),
        I('Tereyağı', 15, 'g', 1, 108, 0.1, 0, 12),
      ]),
      M('Köfte ve karnabahar', [
        I('Köfte', 150, 'g', 1, 360, 25, 2, 28),
        I('Karnabahar pilavı', 150, 'g', 1, 50, 3, 8, 1),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Balık güveç', [
        I('Lüfer', 180, 'g', 1, 235, 38, 0, 9),
        I('Domates sos', 100, 'g', 1, 30, 1, 7, 0.2),
        I('Zeytinyağı', 15, 'ml', 1, 135, 0, 0, 15),
      ]),
      M('Tavuk şinitzel (badem)', [
        I('Tavuk göğsü', 180, 'g', 1, 290, 54, 0, 6),
        I('Badem unu', 30, 'g', 1, 175, 6, 6, 15),
        I('Yeşil salata', 150, 'g', 1, 30, 1.5, 5, 0.5),
      ]),
    ],
    snack: [
      M('Zeytin ve peynir', [
        I('Zeytin', 30, 'g', 1, 35, 0.3, 1, 3.3),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
      ]),
      M('Avokado', [I('Avokado', 100, 'g', 1, 160, 2, 9, 15)]),
      M('Ceviz ve macadamia', [
        I('Ceviz', 15, 'g', 1, 100, 2.3, 2, 9.8),
        I('Macadamia', 15, 'g', 1, 108, 1.2, 2, 11),
      ]),
      M('Yumurta', [I('Haşlanmış yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3)]),
    ],
  },
  popularityScore: 65,
  isPremium: true,
})

// 11. PEGAN
PRESETS.push({
  slug: 'pegan',
  name: 'Pegan',
  tagline: 'Paleo + Vegan hibrit',
  description:
    'Sebze ve meyve %75, az miktar otlatılmış hayvansal protein, işlenmiş gıda yok. Modern beslenme yaklaşımı.',
  heroImageUrl: img('1490645935967-10de6ba17061'),
  thumbnailUrl: img('1490645935967-10de6ba17061', 600),
  accentColor: '#FF7A00',
  defaultDurationDays: 30,
  minDurationDays: 14,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 25,
  carbsPct: 35,
  fatPct: 40,
  evidenceLevel: 'emerging',
  recommendedFor: ['genel sağlık', 'işlenmiş gıdadan kaçınma', 'kalp ve hormon sağlığı'],
  notRecommendedFor: [],
  rules: {
    allowed: [
      'Sebze ve meyve (bol)',
      'Az miktar otlatılmış et/balık',
      'Avokado, zeytinyağı, kuruyemiş',
      'Tatlı patates, kabak',
    ],
    avoid: ['Süt ürünleri', 'Tahıl ve baklagil', 'İşlenmiş gıda', 'Şeker, rafine yağlar'],
    tips: [
      'Tabağın dörtte üçü sebze olsun',
      'Et az ve kaliteli',
      'Tatlı patates karbonhidrat kaynağı',
      'Zeytinyağı baş yağ',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yumurta ve sebze', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Avokado', 80, 'g', 1, 128, 1.6, 7, 12),
        I('Domates-roka', 100, 'g', 1, 25, 1.5, 4.5, 0.4),
      ]),
      M('Smoothie kase', [
        I('Hindistancevizi sütü', 200, 'ml', 1, 180, 2, 3, 18),
        I('Yaban mersini', 100, 'g', 1, 57, 0.7, 15, 0.3),
        I('Chia tohumu', 10, 'g', 1, 49, 1.6, 4.2, 3),
        I('Badem ezmesi', 15, 'g', 1, 95, 3.4, 3, 8),
      ]),
      M('Tatlı patates ve yumurta', [
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Zeytinyağı', 5, 'ml', 1, 45, 0, 0, 5),
      ]),
      M('Avokadolu meyve kase', [
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
        I('Çilek', 150, 'g', 1, 48, 1, 11.5, 0.5),
        I('Kabak çekirdeği', 20, 'g', 1, 110, 5.5, 2.2, 9),
      ]),
    ],
    lunch: [
      M('Tavuk salata kase', [
        I('Otlatılmış tavuk', 120, 'g', 1, 195, 36, 0, 4),
        I('Karışık yeşillik', 200, 'g', 1, 40, 2, 7, 0.5),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
        I('Zeytinyağı', 15, 'ml', 1, 135, 0, 0, 15),
      ]),
      M('Somon ve sebze', [
        I('Vahşi somon', 150, 'g', 1, 250, 28, 0, 15),
        I('Brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
        I('Tatlı patates', 100, 'g', 1, 86, 1.6, 20, 0.1),
      ]),
      M('Hindi sebze sarma', [
        I('Hindi göğsü', 150, 'g', 1, 210, 40, 0, 4),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
        I('Marul yapraklarına sar', 80, 'g', 1, 12, 1, 2.4, 0.2),
      ]),
      M('Karides ve sebze sote', [
        I('Karides', 150, 'g', 1, 145, 30, 1, 2),
        I('Renkli biberler', 150, 'g', 1, 30, 1.5, 7, 0.3),
        I('Hindistancevizi yağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
    ],
    dinner: [
      M('Bonfile ve sebze', [
        I('Otlatılmış dana bonfile', 180, 'g', 1, 360, 50, 0, 16),
        I('Karışık fırın sebze', 200, 'g', 1, 95, 3, 15, 3),
      ]),
      M('Tavuk and tatlı patates', [
        I('Otlatılmış tavuk', 180, 'g', 1, 290, 54, 0, 6),
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
        I('Kuşkonmaz', 100, 'g', 1, 20, 2, 4, 0.1),
      ]),
      M('Levrek and sebze', [
        I('Vahşi levrek', 180, 'g', 1, 235, 42, 0, 7),
        I('Buharda sebze', 200, 'g', 1, 80, 4, 15, 1),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Hindistancevizi körili tavuk', [
        I('Tavuk', 150, 'g', 1, 240, 45, 0, 5),
        I('Hindistancevizi sütü', 150, 'ml', 1, 135, 1.5, 2, 13.5),
        I('Sebzeler', 150, 'g', 1, 55, 2.5, 11, 0.5),
      ]),
    ],
    snack: [
      M('Elma ve badem ezmesi', [
        I('Elma', 150, 'g', 1, 78, 0.4, 21, 0.2),
        I('Badem ezmesi', 15, 'g', 1, 95, 3.4, 3, 8),
      ]),
      M('Avokado', [I('Avokado', 100, 'g', 1, 160, 2, 9, 15)]),
      M('Yaban mersini', [I('Yaban mersini', 100, 'g', 1, 57, 0.7, 15, 0.3)]),
      M('Karışık tohum', [I('Kabak ve ayçiçek tohumu', 25, 'g', 1, 140, 6, 4, 12)]),
    ],
  },
  popularityScore: 55,
  isPremium: true,
})

// 12. LOW-FODMAP
PRESETS.push({
  slug: 'low-fodmap',
  name: 'Düşük FODMAP',
  tagline: 'Bağırsak hassasiyeti / IBS dostu',
  description:
    'Bazı kısa zincirli karbonhidratları kısıtlayarak bağırsak rahatsızlıklarını azaltır. IBS hastaları için bilimsel kanıtlı yaklaşım.',
  heroImageUrl: img('1473093295043-cdd812d0e601'),
  thumbnailUrl: img('1473093295043-cdd812d0e601', 600),
  accentColor: '#FF9F0A',
  defaultDurationDays: 30,
  minDurationDays: 21,
  maxDurationDays: 60,
  calorieFormula: 'tdee:0.95',
  proteinPct: 25,
  carbsPct: 45,
  fatPct: 30,
  evidenceLevel: 'strong',
  recommendedFor: ['IBS / huzursuz bağırsak', 'şişkinlik / gaz problemi', 'kronik karın ağrısı'],
  notRecommendedFor: ['sağlıklı bireyler (gereksiz kısıtlama)'],
  rules: {
    allowed: [
      'Et, balık, yumurta',
      'Glütensiz tahıllar (pirinç, kinoa)',
      'Düşük FODMAP sebzeler (havuç, ıspanak)',
      'Düşük FODMAP meyveler (muz, çilek)',
      'Laktozsuz süt',
    ],
    avoid: [
      'Soğan, sarımsak (yüksek FODMAP)',
      'Buğday, çavdar',
      'Süt, yoğurt (laktoz)',
      'Elma, armut, mango',
      'Baklagil (çoğu)',
    ],
    tips: [
      'Faz 1: 2-6 hafta sıkı kısıtlama',
      'Faz 2: Yavaşça yeniden ekle',
      'Diyetisyen takibi önerilir',
      'Hangisi sıkıntı yapıyor not al',
    ],
  },
  mealPool: {
    breakfast: [
      M('Yulaflı muz', [
        I('Yulaf', 40, 'g', 1, 150, 5, 27, 3, 4),
        I('Laktozsuz süt', 200, 'ml', 1, 90, 7, 10, 3.5),
        I('Muz', 80, 'g', 1, 71, 0.9, 18, 0.2),
      ]),
      M('Yumurtalı tabak', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Pirinç krakeri', 30, 'g', 1, 110, 2, 24, 0.5),
        I('Salatalık', 100, 'g', 1, 15, 0.7, 3.6, 0.1),
      ]),
      M('Kinoa kase', [
        I('Kinoa', 60, 'g', 1, 72, 2.4, 12.6, 1.2),
        I('Çilek', 100, 'g', 1, 32, 0.7, 7.7, 0.3),
        I('Laktozsuz süt', 150, 'ml', 1, 68, 5.2, 7.5, 2.6),
      ]),
      M('Omlet', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Ispanak', 80, 'g', 1, 18, 2.3, 2.9, 0.3),
        I('Glütensiz ekmek', 40, 'g', 1, 100, 2, 20, 1.5),
      ]),
    ],
    lunch: [
      M('Tavuk ve pirinç', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Esmer pirinç', 150, 'g', 1, 165, 3.7, 35, 1.4),
        I('Havuç', 100, 'g', 1, 41, 0.9, 10, 0.2),
      ]),
      M('Somon ve kinoa', [
        I('Somon', 150, 'g', 1, 270, 30, 0, 16),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Marul', 100, 'g', 1, 15, 1.4, 2.9, 0.2),
      ]),
      M('Hindi salata', [
        I('Hindi göğsü', 150, 'g', 1, 210, 40, 0, 4),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Domates', 100, 'g', 1, 18, 0.9, 3.9, 0.2),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Karides pirinç', [
        I('Karides', 150, 'g', 1, 145, 30, 1, 2),
        I('Esmer pirinç', 150, 'g', 1, 165, 3.7, 35, 1.4),
        I('Salatalık', 100, 'g', 1, 15, 0.7, 3.6, 0.1),
      ]),
    ],
    dinner: [
      M('Tavuk ve sebze', [
        I('Tavuk', 180, 'g', 1, 290, 54, 0, 6),
        I('Havuç', 100, 'g', 1, 41, 0.9, 10, 0.2),
        I('Ispanak', 150, 'g', 1, 35, 4.4, 5.4, 0.6),
      ]),
      M('Levrek', [
        I('Levrek', 180, 'g', 1, 235, 42, 0, 7),
        I('Kabak', 150, 'g', 1, 25, 1.8, 5.4, 0.3),
        I('Esmer pirinç', 100, 'g', 1, 110, 2.5, 23, 0.9),
      ]),
      M('Köfte', [
        I('Köfte (sade)', 150, 'g', 1, 300, 25, 2, 21),
        I('Pirinç', 120, 'g', 1, 135, 3, 28, 1),
      ]),
      M('Tofu (FODMAP onaylı)', [
        I('Sert tofu', 150, 'g', 1, 110, 12, 3, 7),
        I('Pirinç', 120, 'g', 1, 135, 3, 28, 1),
        I('Bok choy', 100, 'g', 1, 13, 1.5, 2.2, 0.2),
      ]),
    ],
    snack: [
      M('Pirinç kraker ve yer fıstığı ezmesi', [
        I('Pirinç krakeri', 20, 'g', 1, 75, 1.4, 16, 0.4),
        I('Yer fıstığı ezmesi', 15, 'g', 1, 95, 4, 3, 8),
      ]),
      M('Muz', [I('Muz', 80, 'g', 1, 71, 0.9, 18, 0.2)]),
      M('Çilek', [I('Çilek', 150, 'g', 1, 48, 1, 11.5, 0.5)]),
      M('Karışık tohum', [I('Kabak ve ayçiçek tohumu', 25, 'g', 1, 140, 6, 4, 12)]),
    ],
  },
  popularityScore: 60,
  isPremium: false,
})

// 13. ANTI-INFLAMMATORY
PRESETS.push({
  slug: 'anti-inflammatory',
  name: 'Anti-Enflamatuar',
  tagline: 'Kronik enflamasyonu azaltıcı',
  description:
    'Omega-3, antioksidan ve polifenol açısından zengin gıdalara odaklanır. Kronik enflamasyon, eklem ağrıları ve otoimmün hastalıklar için.',
  heroImageUrl: img('1490645935967-10de6ba17061'),
  thumbnailUrl: img('1490645935967-10de6ba17061', 600),
  accentColor: '#BF5AF2',
  defaultDurationDays: 60,
  minDurationDays: 30,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 22,
  carbsPct: 48,
  fatPct: 30,
  evidenceLevel: 'moderate',
  recommendedFor: ['kronik eklem ağrıları', 'otoimmün hastalıklar (destek)', 'genel sağlık'],
  notRecommendedFor: [],
  rules: {
    allowed: [
      'Yağlı balık (somon, sardalya)',
      'Yeşil yapraklı sebzeler',
      'Yaban mersini, çilek',
      'Zeytinyağı, avokado',
      'Zerdeçal, zencefil',
      'Ceviz, badem',
    ],
    avoid: ['İşlenmiş et', 'Rafine şeker ve un', 'Trans yağlar', 'Aşırı alkol', 'Hazır gıdalar'],
    tips: [
      'Haftada 3+ kez yağlı balık',
      'Her gün renkli sebze ve meyve',
      'Zerdeçal+karabiber kombinasyonu',
      'Şeker minimum',
    ],
  },
  mealPool: {
    breakfast: [
      M('Zerdeçallı yulaf', [
        I('Yulaf', 50, 'g', 1, 190, 6.5, 33, 3.5, 5),
        I('Süt', 200, 'ml', 1, 100, 7, 10, 4),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
        I('Ceviz', 15, 'g', 1, 100, 2.3, 2, 9.8),
        I('Zerdeçal', 2, 'g', 1, 7, 0.2, 1.4, 0.2),
      ]),
      M('Avokadolu yumurta', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Avokado', 100, 'g', 1, 160, 2, 9, 15),
        I('Tam buğday tost', 50, 'g', 1, 130, 5, 25, 1.5),
      ]),
      M('Smoothie', [
        I('Ispanak', 50, 'g', 1, 12, 1.5, 1.8, 0.2),
        I('Yaban mersini', 100, 'g', 1, 57, 0.7, 15, 0.3),
        I('Süt', 250, 'ml', 1, 125, 8.7, 12, 5),
        I('Chia', 10, 'g', 1, 49, 1.6, 4.2, 3),
      ]),
      M('Somon ve yumurta', [
        I('Tütsülenmiş somon', 60, 'g', 1, 70, 11, 0, 3),
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
      ]),
    ],
    lunch: [
      M('Somon ve kinoa', [
        I('Somon', 180, 'g', 1, 325, 36, 0, 19),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Roka', 100, 'g', 1, 25, 2.6, 3.7, 0.7),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Mercimek ve sebze', [
        I('Yeşil mercimek', 150, 'g', 1, 170, 13, 30, 0.6),
        I('Karışık yeşillik', 150, 'g', 1, 25, 1.5, 4, 0.3),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
      ]),
      M('Tavuk ve sebze', [
        I('Otlatılmış tavuk', 150, 'g', 1, 240, 45, 0, 5),
        I('Brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
      ]),
      M('Sardalya ve salata', [
        I('Sardalya', 120, 'g', 1, 250, 30, 0, 14),
        I('Karışık yeşillik', 200, 'g', 1, 40, 2, 7, 0.5),
        I('Zeytin', 30, 'g', 1, 35, 0.3, 1, 3.3),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
    ],
    dinner: [
      M('Somon ve sebze', [
        I('Somon', 150, 'g', 1, 270, 30, 0, 16),
        I('Kuşkonmaz', 150, 'g', 1, 30, 3, 6, 0.2),
        I('Tatlı patates', 100, 'g', 1, 86, 1.6, 20, 0.1),
      ]),
      M('Hindi ve sebze', [
        I('Hindi göğsü', 180, 'g', 1, 250, 48, 0, 4),
        I('Lahana yaprakları', 150, 'g', 1, 38, 2.8, 8, 0.2),
        I('Kinoa', 100, 'g', 1, 120, 4, 21, 2),
      ]),
      M('Mercimek köftesi', [
        I('Mercimek köftesi', 250, 'g', 1, 310, 14, 52, 3.5),
        I('Yeşil salata', 150, 'g', 1, 30, 2, 5, 0.5),
        I('Zeytinyağı', 10, 'ml', 1, 90, 0, 0, 10),
      ]),
      M('Levrek ve sebze', [
        I('Levrek', 180, 'g', 1, 235, 42, 0, 7),
        I('Buharda brokoli', 150, 'g', 1, 50, 4, 10, 0.5),
        I('Kinoa', 100, 'g', 1, 120, 4, 21, 2),
      ]),
    ],
    snack: [
      M('Ceviz ve yaban mersini', [
        I('Ceviz', 20, 'g', 1, 135, 3, 2.5, 13),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
      ]),
      M('Yeşil çay ve karanfil', [I('Yeşil çay', 250, 'ml', 1, 2, 0.5, 0.5, 0)]),
      M('Avokado', [I('Avokado', 100, 'g', 1, 160, 2, 9, 15)]),
      M('Karışık tohum', [I('Keten ve chia', 20, 'g', 1, 108, 3.5, 7.4, 7.5)]),
    ],
  },
  popularityScore: 58,
  isPremium: false,
})

// 14. GLUTEN-FREE
PRESETS.push({
  slug: 'gluten-free',
  name: 'Glütensiz',
  tagline: 'Çölyak / glüten hassasiyeti için',
  description:
    'Buğday, arpa, çavdar ve bunlardan türetilmiş tüm ürünleri içermez. Çölyak ve glüten hassasiyeti olanlar için zorunlu.',
  heroImageUrl: img('1473093295043-cdd812d0e601'),
  thumbnailUrl: img('1473093295043-cdd812d0e601', 600),
  accentColor: '#FFD60A',
  defaultDurationDays: 90,
  minDurationDays: 30,
  maxDurationDays: 90,
  calorieFormula: 'tdee:0.95',
  proteinPct: 22,
  carbsPct: 50,
  fatPct: 28,
  evidenceLevel: 'strong',
  recommendedFor: ['çölyak hastalığı', 'glüten hassasiyeti', 'otoimmün şikayetler'],
  notRecommendedFor: ['sağlıklı bireyler (gereksiz)'],
  rules: {
    allowed: [
      'Pirinç, kinoa, mısır, karabuğday',
      'Et, balık, yumurta',
      'Süt ürünleri',
      'Sebze ve meyve',
      'Baklagiller',
      'Glütensiz un (badem, hindistancevizi)',
    ],
    avoid: [
      'Buğday, arpa, çavdar, yulaf (kontaminasyon riski)',
      'Klasik ekmek, makarna',
      'Bira',
      'Hazır soslar (etiket oku)',
    ],
    tips: [
      'Etiket okuma alışkanlığı',
      '"Gluten-free" sertifikalı ürünler tercih',
      'Çapraz kontaminasyondan kaçın',
      'B vitaminleri ve demir takip et',
    ],
  },
  mealPool: {
    breakfast: [
      M('Glütensiz yulaf ve meyve', [
        I('Glütensiz yulaf', 50, 'g', 1, 190, 6.5, 33, 3.5, 5),
        I('Süt', 200, 'ml', 1, 100, 7, 10, 4),
        I('Çilek', 100, 'g', 1, 32, 0.7, 7.7, 0.3),
      ]),
      M('Yumurtalı kahvaltı', [
        I('Yumurta', 50, 'g', 3, 78, 6.3, 0.6, 5.3),
        I('Beyaz peynir', 40, 'g', 1, 110, 7, 1, 9),
        I('Pirinç krakeri', 30, 'g', 1, 110, 2, 24, 0.5),
      ]),
      M('Kinoa kase', [
        I('Kinoa', 60, 'g', 1, 72, 2.4, 12.6, 1.2),
        I('Süt', 200, 'ml', 1, 100, 7, 10, 4),
        I('Yaban mersini', 80, 'g', 1, 46, 0.6, 12, 0.3),
        I('Badem', 15, 'g', 1, 87, 3, 3, 7.5),
      ]),
      M('Omlet ve tost', [
        I('Yumurta', 50, 'g', 2, 78, 6.3, 0.6, 5.3),
        I('Glütensiz ekmek', 50, 'g', 1, 125, 2.5, 25, 2),
        I('Avokado', 60, 'g', 1, 96, 1.2, 5.4, 9),
      ]),
    ],
    lunch: [
      M('Tavuk ve pirinç', [
        I('Tavuk göğsü', 150, 'g', 1, 240, 45, 0, 5),
        I('Esmer pirinç', 150, 'g', 1, 165, 3.7, 35, 1.4),
        I('Brokoli', 100, 'g', 1, 34, 2.8, 7, 0.4),
      ]),
      M('Somon ve kinoa', [
        I('Somon', 150, 'g', 1, 270, 30, 0, 16),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Yeşil salata', 100, 'g', 1, 20, 1, 3, 0.3),
      ]),
      M('Mercimek çorbası', [
        I('Mercimek çorba', 300, 'ml', 1, 180, 12, 28, 3),
        I('Pirinç krakeri', 30, 'g', 1, 110, 2, 24, 0.5),
        I('Salata', 100, 'g', 1, 20, 1, 3, 0.3),
      ]),
      M('Köfte ve pirinç', [
        I('Köfte', 120, 'g', 1, 220, 22, 2, 14),
        I('Pirinç pilavı', 150, 'g', 1, 200, 4, 40, 2),
        I('Cacık', 150, 'g', 1, 60, 3, 4.5, 3),
      ]),
    ],
    dinner: [
      M('Tavuk ve tatlı patates', [
        I('Tavuk göğsü', 180, 'g', 1, 290, 54, 0, 6),
        I('Tatlı patates', 150, 'g', 1, 130, 2.4, 30, 0.2),
        I('Yeşil fasulye', 150, 'g', 1, 45, 2.5, 9, 0.3),
      ]),
      M('Levrek ve kinoa', [
        I('Levrek', 180, 'g', 1, 235, 42, 0, 7),
        I('Kinoa', 120, 'g', 1, 145, 5, 26, 2.5),
        I('Roka', 100, 'g', 1, 25, 2.6, 3.7, 0.7),
      ]),
      M('Glütensiz makarna ve domates', [
        I('Glütensiz makarna', 100, 'g', 1, 360, 7, 75, 2),
        I('Domates sos', 100, 'g', 1, 30, 1, 7, 0.2),
        I('Parmesan', 20, 'g', 1, 80, 7, 1, 5.6),
      ]),
      M('Karides ve pirinç', [
        I('Karides', 150, 'g', 1, 145, 30, 1, 2),
        I('Esmer pirinç', 150, 'g', 1, 165, 3.7, 35, 1.4),
        I('Sebzeler', 150, 'g', 1, 55, 2.5, 11, 0.5),
      ]),
    ],
    snack: [
      M('Pirinç kraker ve peynir', [
        I('Pirinç krakeri', 20, 'g', 1, 75, 1.4, 16, 0.4),
        I('Beyaz peynir', 30, 'g', 1, 85, 5.4, 0.7, 6.8),
      ]),
      M('Meyve', [I('Elma', 150, 'g', 1, 78, 0.4, 21, 0.2)]),
      M('Yoğurt', [I('Süzme yoğurt', 150, 'g', 1, 90, 13, 6, 1.5)]),
      M('Karışık kuruyemiş', [I('Karışık kuruyemiş', 25, 'g', 1, 150, 5, 6, 13)]),
    ],
  },
  popularityScore: 50,
  isPremium: false,
})

// ──────────────────────────────────────────
// SEED RUNNER
// ──────────────────────────────────────────

async function main() {
  console.log(`Seeding ${PRESETS.length} diet presets...`)

  for (const p of PRESETS) {
    const data = {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      heroImageUrl: p.heroImageUrl,
      thumbnailUrl: p.thumbnailUrl,
      accentColor: p.accentColor,
      defaultDurationDays: p.defaultDurationDays,
      minDurationDays: p.minDurationDays,
      maxDurationDays: p.maxDurationDays,
      calorieFormula: p.calorieFormula,
      proteinPct: p.proteinPct,
      carbsPct: p.carbsPct,
      fatPct: p.fatPct,
      evidenceLevel: p.evidenceLevel,
      recommendedFor: p.recommendedFor,
      notRecommendedFor: p.notRecommendedFor,
      rules: p.rules as any,
      mealPool: p.mealPool as any,
      popularityScore: p.popularityScore,
      isPremium: p.isPremium,
    }

    await db.dietPreset.upsert({
      where: { slug: p.slug },
      create: data,
      update: data,
    })
    console.log(`  ✓ ${p.name} (${p.slug})`)
  }

  console.log(`\n✅ Seeded ${PRESETS.length} presets total.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
