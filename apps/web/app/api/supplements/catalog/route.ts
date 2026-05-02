import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

// Hardcoded global supplement kataloğu — DB'de kayıt yoksa seed olarak kullanılır
const SEED_CATALOG = [
  {
    name: 'Vitamin D3',
    brand: 'Now Foods',
    category: 'Vitamin',
    type: 'vitamin',
    country: 'global',
    doseInfo: '2000-5000 IU/gün',
    benefit: 'Bağışıklık & kemik sağlığı',
  },
  {
    name: 'Omega-3',
    brand: 'Ocean Grizzone',
    category: 'Yağ Asidi',
    type: 'omega',
    country: 'global',
    doseInfo: '1-3g/gün',
    benefit: 'Kalp & beyin sağlığı',
  },
  {
    name: 'Whey Protein',
    brand: 'Protein Ocean',
    category: 'Protein',
    type: 'protein',
    country: 'global',
    doseInfo: '25-50g/gün',
    benefit: 'Kas gelişimi & toparlanma',
  },
  {
    name: 'Magnesium',
    brand: 'Doctors Best',
    category: 'Mineral',
    type: 'magnezyum',
    country: 'global',
    doseInfo: '300-400mg/gün',
    benefit: 'Uyku & kas rahatlaması',
  },
  {
    name: 'Creatine',
    brand: 'Dymatize',
    category: 'Performans',
    type: 'kreatin',
    country: 'global',
    doseInfo: '5g/gün',
    benefit: 'Güç & dayanıklılık',
  },
  {
    name: 'Ashwagandha',
    brand: 'KSM-66',
    category: 'Bitki',
    type: 'probiyotik',
    country: 'global',
    doseInfo: '300-600mg/gün',
    benefit: 'Stres azaltma & testosteron',
  },
  {
    name: 'Vitamin C',
    brand: 'Ester-C',
    category: 'Vitamin',
    type: 'vitamin',
    country: 'global',
    doseInfo: '500-1000mg/gün',
    benefit: 'Bağışıklık & antioksidan',
  },
  {
    name: 'Zinc',
    brand: 'Now Foods',
    category: 'Mineral',
    type: 'genel',
    country: 'global',
    doseInfo: '15-30mg/gün',
    benefit: 'Bağışıklık & testosteron',
  },
  {
    name: 'Vitamin B12',
    brand: 'Solgar',
    category: 'Vitamin',
    type: 'vitamin',
    country: 'global',
    doseInfo: '500-1000mcg/gün',
    benefit: 'Enerji & sinir sistemi',
  },
  {
    name: 'Probiyotik',
    brand: 'Garden of Life',
    category: 'Probiyotik',
    type: 'probiyotik',
    country: 'global',
    doseInfo: '10-50 Milyar CFU',
    benefit: 'Bağırsak sağlığı',
  },
  {
    name: 'Pre-Workout',
    brand: 'C4 Original',
    category: 'Performans',
    type: 'genel',
    country: 'global',
    doseInfo: '1 porsiyon',
    benefit: 'Enerji & odaklanma',
  },
  {
    name: 'Yohimbine',
    brand: 'Primaforce',
    category: 'Yağ Yakıcı',
    type: 'genel',
    country: 'global',
    doseInfo: '2.5-20mg/gün',
    benefit: 'Yağ yakımı',
  },
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country') ?? 'global'
    const category = searchParams.get('category') ?? ''
    const q = searchParams.get('q') ?? ''

    // DB'den çek — global + seçilen ülke
    const dbItems = await db.supplementCatalog.findMany({
      where: {
        AND: [
          { OR: [{ country: 'global' }, { country: country }] },
          category ? { category: { contains: category, mode: 'insensitive' } } : {},
          q
            ? {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { brand: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      orderBy: { name: 'asc' },
      take: 100,
    })

    // DB boşsa seed datayı döndür
    if (dbItems.length === 0) {
      const filtered = SEED_CATALOG.filter((i) => {
        const qMatch =
          !q ||
          i.name.toLowerCase().includes(q.toLowerCase()) ||
          i.brand.toLowerCase().includes(q.toLowerCase())
        const cMatch = !category || i.category.toLowerCase().includes(category.toLowerCase())
        return qMatch && cMatch
      })
      return NextResponse.json(filtered.map((i, idx) => ({ id: `seed-${idx}`, ...i })))
    }

    return NextResponse.json(dbItems)
  } catch (error) {
    console.error('[supplements/catalog GET]', error)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
