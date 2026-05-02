import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { isProtectedDrinkType } from '@/lib/drinks/protected'
import { isEssentialDrinkType } from '@/lib/drinks/essential'

type DrinkResponse = {
  id: string
  type: 'catalog' | 'custom'
  nametr: string
  nameen: string | null
  category: string
  hydrationValue: number
  caffeinePerServing: number | null
  defaultServingMl: number
  iconName: string
  color: string
  isVisible: boolean
  sortOrder: number
  isProtected: boolean // ana içecek mi (silinemez)
}

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const [catalog, preferences, customDrinks] = await Promise.all([
      db.drinkCatalog.findMany(),
      db.userDrinkPreference.findMany({ where: { userId: user.id } }),
      db.userCustomDrink.findMany({ where: { userId: user.id } }),
    ])

    const prefMap = new Map(preferences.map((p) => [p.catalogId, p]))

    const catalogDrinks: DrinkResponse[] = catalog
      // isHidden olan catalog drink'leri kullanıcının listesinde HİÇ görünmesin
      .filter((c) => !prefMap.get(c.id)?.isHidden)
      .map((c) => {
        const pref = prefMap.get(c.id)
        return {
          id: c.id,
          type: 'catalog',
          nametr: c.nametr,
          nameen: c.nameen,
          category: c.category,
          hydrationValue: c.hydrationValue,
          caffeinePerServing: c.caffeinePerServing,
          defaultServingMl: pref?.customSizeMl ?? c.defaultServingMl,
          iconName: c.iconName,
          color: c.color,
          // Kullanıcı tercihi varsa o öncelikli; yoksa sadece "temel 20" listesindeki
          // içecekler default açık gelir, geri kalanı kapalı (toggle ile açılabilir).
          isVisible: pref?.isVisible ?? isEssentialDrinkType(c.drinkType),
          sortOrder: pref?.sortOrder ?? 0,
          isProtected: isProtectedDrinkType(c.drinkType),
        }
      })

    const customs: DrinkResponse[] = customDrinks.map((c) => ({
      id: c.id,
      type: 'custom',
      nametr: c.nametr,
      nameen: c.nameen,
      category: c.category,
      hydrationValue: c.hydrationValue,
      caffeinePerServing: c.caffeinePerServing,
      defaultServingMl: c.defaultServingMl,
      iconName: c.iconName,
      color: c.color,
      isVisible: c.isVisible,
      sortOrder: c.sortOrder,
      isProtected: false, // custom drink'ler hep silinebilir
    }))

    const drinks = [...catalogDrinks, ...customs].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.nametr.localeCompare(b.nametr, 'tr')
    })

    return NextResponse.json({ drinks })
  } catch (err) {
    console.error('[water/drinks GET]', err)
    return NextResponse.json({ error: 'Failed to fetch drinks' }, { status: 500 })
  }
})

type CreateBody = {
  nametr?: string
  nameen?: string
  category?: string
  hydrationValue?: number
  caffeinePerServing?: number
  defaultServingMl?: number
  iconName?: string
  color?: string
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = (await req.json()) as CreateBody

    if (!body.nametr || typeof body.nametr !== 'string') {
      return NextResponse.json({ error: 'nametr is required' }, { status: 400 })
    }
    if (!body.iconName || typeof body.iconName !== 'string') {
      return NextResponse.json({ error: 'iconName is required' }, { status: 400 })
    }
    if (!body.color || typeof body.color !== 'string') {
      return NextResponse.json({ error: 'color is required' }, { status: 400 })
    }

    const maxCustom = await db.userCustomDrink.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const maxPref = await db.userDrinkPreference.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const nextOrder = Math.max(maxCustom?.sortOrder ?? 0, maxPref?.sortOrder ?? 0) + 1

    const drink = await db.userCustomDrink.create({
      data: {
        userId: user.id,
        nametr: body.nametr,
        nameen: body.nameen ?? null,
        category: body.category ?? 'other',
        hydrationValue: typeof body.hydrationValue === 'number' ? body.hydrationValue : 1.0,
        caffeinePerServing:
          typeof body.caffeinePerServing === 'number' ? body.caffeinePerServing : 0,
        defaultServingMl: typeof body.defaultServingMl === 'number' ? body.defaultServingMl : 250,
        iconName: body.iconName,
        color: body.color,
        sortOrder: nextOrder,
      },
    })

    const response: DrinkResponse = {
      id: drink.id,
      type: 'custom',
      nametr: drink.nametr,
      nameen: drink.nameen,
      category: drink.category,
      hydrationValue: drink.hydrationValue,
      caffeinePerServing: drink.caffeinePerServing,
      defaultServingMl: drink.defaultServingMl,
      iconName: drink.iconName,
      color: drink.color,
      isVisible: drink.isVisible,
      sortOrder: drink.sortOrder,
      isProtected: false,
    }

    return NextResponse.json({ drink: response }, { status: 201 })
  } catch (err) {
    console.error('[water/drinks POST]', err)
    return NextResponse.json({ error: 'Failed to create drink' }, { status: 500 })
  }
})
