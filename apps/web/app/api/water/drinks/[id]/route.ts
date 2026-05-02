import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { isProtectedDrinkType } from '@/lib/drinks/protected'

type DrinkType = 'catalog' | 'custom'

type PatchBody = {
  type?: DrinkType
  nametr?: string
  nameen?: string | null
  category?: string
  hydrationValue?: number
  caffeinePerServing?: number | null
  defaultServingMl?: number
  customSizeMl?: number | null
  iconName?: string
  color?: string
  isVisible?: boolean
}

function getType(req: NextRequest, body: PatchBody): DrinkType | null {
  const queryType = req.nextUrl.searchParams.get('type')
  const t = queryType ?? body.type
  if (t === 'catalog' || t === 'custom') return t
  return null
}

export const PATCH = withAuth<{ params: Promise<{ id: string }> }>(
  async (req, { user, params }) => {
    try {
      const resolved = await params
      const id = resolved?.id
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

      const body = (await req.json().catch(() => ({}))) as PatchBody
      const type = getType(req, body)
      if (!type) {
        return NextResponse.json(
          { error: 'type query param or body field is required (catalog | custom)' },
          { status: 400 }
        )
      }

      if (type === 'catalog') {
        const catalog = await db.drinkCatalog.findUnique({ where: { id } })
        if (!catalog) {
          return NextResponse.json({ error: 'Catalog drink not found' }, { status: 404 })
        }

        const updateData: { isVisible?: boolean; customSizeMl?: number | null } = {}
        if (typeof body.isVisible === 'boolean') updateData.isVisible = body.isVisible
        if (body.customSizeMl === null) updateData.customSizeMl = null
        else if (typeof body.customSizeMl === 'number') updateData.customSizeMl = body.customSizeMl
        else if (typeof body.defaultServingMl === 'number')
          updateData.customSizeMl = body.defaultServingMl

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(
            { error: 'No updatable fields provided for catalog drink' },
            { status: 400 }
          )
        }

        const pref = await db.userDrinkPreference.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: id } },
          create: {
            userId: user.id,
            catalogId: id,
            isVisible: updateData.isVisible ?? true,
            customSizeMl: updateData.customSizeMl ?? null,
          },
          update: updateData,
        })

        return NextResponse.json({
          drink: {
            id: catalog.id,
            type: 'catalog' as const,
            nametr: catalog.nametr,
            nameen: catalog.nameen,
            category: catalog.category,
            hydrationValue: catalog.hydrationValue,
            caffeinePerServing: catalog.caffeinePerServing,
            defaultServingMl: pref.customSizeMl ?? catalog.defaultServingMl,
            iconName: catalog.iconName,
            color: catalog.color,
            isVisible: pref.isVisible,
            sortOrder: pref.sortOrder,
          },
        })
      }

      const existing = await db.userCustomDrink.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: 'Custom drink not found' }, { status: 404 })
      }

      const updateData: {
        nametr?: string
        nameen?: string | null
        category?: string
        hydrationValue?: number
        caffeinePerServing?: number | null
        defaultServingMl?: number
        iconName?: string
        color?: string
        isVisible?: boolean
      } = {}

      if (typeof body.nametr === 'string') updateData.nametr = body.nametr
      if (body.nameen === null || typeof body.nameen === 'string') updateData.nameen = body.nameen
      if (typeof body.category === 'string') updateData.category = body.category
      if (typeof body.hydrationValue === 'number') updateData.hydrationValue = body.hydrationValue
      if (body.caffeinePerServing === null || typeof body.caffeinePerServing === 'number')
        updateData.caffeinePerServing = body.caffeinePerServing
      if (typeof body.defaultServingMl === 'number')
        updateData.defaultServingMl = body.defaultServingMl
      if (typeof body.iconName === 'string') updateData.iconName = body.iconName
      if (typeof body.color === 'string') updateData.color = body.color
      if (typeof body.isVisible === 'boolean') updateData.isVisible = body.isVisible

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      }

      const updated = await db.userCustomDrink.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({
        drink: {
          id: updated.id,
          type: 'custom' as const,
          nametr: updated.nametr,
          nameen: updated.nameen,
          category: updated.category,
          hydrationValue: updated.hydrationValue,
          caffeinePerServing: updated.caffeinePerServing,
          defaultServingMl: updated.defaultServingMl,
          iconName: updated.iconName,
          color: updated.color,
          isVisible: updated.isVisible,
          sortOrder: updated.sortOrder,
        },
      })
    } catch (err) {
      console.error('[water/drinks/:id PATCH]', err)
      return NextResponse.json({ error: 'Failed to update drink' }, { status: 500 })
    }
  }
)

export const DELETE = withAuth<{ params: Promise<{ id: string }> }>(
  async (req, { user, params }) => {
    try {
      const resolved = await params
      const id = resolved?.id
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

      const type = req.nextUrl.searchParams.get('type')

      // Catalog drink: PROTECTED ise hata, değilse UserDrinkPreference.isHidden=true
      if (type === 'catalog') {
        const catalog = await db.drinkCatalog.findUnique({ where: { id } })
        if (!catalog) {
          return NextResponse.json({ error: 'Catalog drink not found' }, { status: 404 })
        }
        if (isProtectedDrinkType(catalog.drinkType)) {
          return NextResponse.json(
            { error: 'Bu ana içecek silinemez. Listeden gizlemek için kapat butonunu kullan.' },
            { status: 403 }
          )
        }
        await db.userDrinkPreference.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: id } },
          create: { userId: user.id, catalogId: id, isHidden: true },
          update: { isHidden: true },
        })
        return NextResponse.json({ success: true })
      }

      if (type !== 'custom') {
        return NextResponse.json(
          { error: 'type query param is required (catalog | custom)' },
          { status: 400 }
        )
      }

      const existing = await db.userCustomDrink.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: 'Custom drink not found' }, { status: 404 })
      }

      await db.userCustomDrink.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error('[water/drinks/:id DELETE]', err)
      return NextResponse.json({ error: 'Failed to delete drink' }, { status: 500 })
    }
  }
)
