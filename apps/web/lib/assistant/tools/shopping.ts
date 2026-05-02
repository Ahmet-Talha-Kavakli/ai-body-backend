import { ToolDefinition, ToolExecutor } from './types'
import { db as prisma } from '@/lib/db/client'

const C = 'shopping' as const

export const shoppingToolDefs: ToolDefinition[] = [
  {
    name: 'add_wishlist_item',
    category: C,
    description: 'İstek listesine ürün ekle',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: {
          type: 'string',
          description: 'electronics | clothing | home | book | sport | food | other',
        },
        estimatedPrice: { type: 'number' },
        currency: { type: 'string', default: 'TRY' },
        url: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_wishlist',
    category: C,
    description: 'İstek listesini göster',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        priority: { type: 'string' },
        boughtOnly: { type: 'boolean' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'mark_wishlist_bought',
    category: C,
    description: 'İstek listesindeki ürünü satın alındı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        actualPrice: { type: 'number' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'delete_wishlist_item',
    category: C,
    description: 'İstek listesinden ürün sil',
    destructive: true,
    parameters: {
      type: 'object',
      properties: { itemId: { type: 'string' } },
      required: ['itemId'],
    },
  },
  {
    name: 'add_grocery_item',
    category: C,
    description: 'Market listesine ürün ekle',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        quantity: { type: 'number', default: 1 },
        unit: { type: 'string', description: 'adet | kg | litre | paket | kutu | çift | diğer' },
        listName: {
          type: 'string',
          description: 'Liste adı (boş = varsayılan)',
          default: 'Market',
        },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_grocery',
    category: C,
    description: 'Market listesini göster',
    parameters: {
      type: 'object',
      properties: {
        listName: { type: 'string', default: 'Market' },
        uncheckedOnly: { type: 'boolean' },
      },
    },
  },
  {
    name: 'check_grocery_item',
    category: C,
    description: 'Market ürününü sepete atıldı / alındı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        checked: { type: 'boolean' },
      },
      required: ['itemId', 'checked'],
    },
  },
  {
    name: 'clear_grocery_list',
    category: C,
    description: 'Market listesindeki tüm alınan ürünleri temizle',
    destructive: true,
    parameters: {
      type: 'object',
      properties: {
        listName: { type: 'string', default: 'Market' },
      },
    },
  },
  {
    name: 'add_price_watch',
    category: C,
    description: 'Bir ürün için hedef fiyat takibi ekle',
    parameters: {
      type: 'object',
      properties: {
        productName: { type: 'string' },
        targetPrice: { type: 'number' },
        currency: { type: 'string', default: 'TRY' },
        notes: { type: 'string' },
      },
      required: ['productName', 'targetPrice'],
    },
  },
  {
    name: 'list_price_watches',
    category: C,
    description: 'Fiyat takibindeki ürünleri listele',
    parameters: {
      type: 'object',
      properties: {
        activeOnly: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'log_purchase',
    category: C,
    description: 'Yapılan alışverişi kaydet',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        currency: { type: 'string', default: 'TRY' },
        store: { type: 'string' },
        category: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name', 'price'],
    },
  },
  {
    name: 'list_recent_purchases',
    category: C,
    description: 'Son alışverişleri listele',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 },
        category: { type: 'string' },
      },
    },
  },
]

export const shoppingExecutors: Record<string, ToolExecutor> = {
  add_wishlist_item: {
    name: 'add_wishlist_item',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        category?: string
        estimatedPrice?: number
        currency?: string
        url?: string
        priority?: string
        notes?: string
      }
      const item = await prisma.wishlistItem.create({
        data: {
          userId,
          name: p.name,
          category: p.category,
          estimatedPrice: p.estimatedPrice,
          currency: p.currency ?? 'TRY',
          url: p.url,
          priority: p.priority ?? 'medium',
          notes: p.notes,
        },
      })
      return { ok: true, data: item }
    },
  },
  list_wishlist: {
    name: 'list_wishlist',
    execute: async ({ userId, params }) => {
      const p = params as {
        category?: string
        priority?: string
        boughtOnly?: boolean
        limit?: number
      }
      const items = await prisma.wishlistItem.findMany({
        where: {
          userId,
          ...(p.category && { category: p.category }),
          ...(p.priority && { priority: p.priority }),
          ...(p.boughtOnly !== undefined && { bought: p.boughtOnly }),
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: p.limit ?? 20,
      })
      return { ok: true, data: items }
    },
  },
  mark_wishlist_bought: {
    name: 'mark_wishlist_bought',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string; actualPrice?: number }
      await prisma.wishlistItem.updateMany({
        where: { id: p.itemId, userId },
        data: { bought: true, ...(p.actualPrice !== undefined && { actualPrice: p.actualPrice }) },
      })
      return { ok: true }
    },
  },
  delete_wishlist_item: {
    name: 'delete_wishlist_item',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string }
      await prisma.wishlistItem.deleteMany({ where: { id: p.itemId, userId } })
      return { ok: true }
    },
  },
  add_grocery_item: {
    name: 'add_grocery_item',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        quantity?: number
        unit?: string
        listName?: string
        notes?: string
      }
      const item = await prisma.groceryItem.create({
        data: {
          userId,
          name: p.name,
          quantity: p.quantity ?? 1,
          unit: p.unit,
          listName: p.listName ?? 'Market',
          notes: p.notes,
        },
      })
      return { ok: true, data: item }
    },
  },
  list_grocery: {
    name: 'list_grocery',
    execute: async ({ userId, params }) => {
      const p = params as { listName?: string; uncheckedOnly?: boolean }
      const items = await prisma.groceryItem.findMany({
        where: {
          userId,
          listName: p.listName ?? 'Market',
          ...(p.uncheckedOnly && { checked: false }),
        },
        orderBy: { createdAt: 'asc' },
      })
      return { ok: true, data: items }
    },
  },
  check_grocery_item: {
    name: 'check_grocery_item',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string; checked: boolean }
      await prisma.groceryItem.updateMany({
        where: { id: p.itemId, userId },
        data: { checked: p.checked },
      })
      return { ok: true }
    },
  },
  clear_grocery_list: {
    name: 'clear_grocery_list',
    execute: async ({ userId, params }) => {
      const p = params as { listName?: string }
      await prisma.groceryItem.deleteMany({
        where: { userId, listName: p.listName ?? 'Market', checked: true },
      })
      return { ok: true }
    },
  },
  add_price_watch: {
    name: 'add_price_watch',
    execute: async ({ userId, params }) => {
      const p = params as {
        productName: string
        targetPrice: number
        currency?: string
        notes?: string
      }
      const pw = await prisma.priceWatch.create({
        data: {
          userId,
          productName: p.productName,
          targetPrice: p.targetPrice,
          currency: p.currency ?? 'TRY',
          notes: p.notes,
        },
      })
      return { ok: true, data: pw }
    },
  },
  list_price_watches: {
    name: 'list_price_watches',
    execute: async ({ userId, params }) => {
      const p = params as { activeOnly?: boolean }
      const items = await prisma.priceWatch.findMany({
        where: { userId, ...(p.activeOnly !== false && { active: true }) },
        orderBy: { createdAt: 'desc' },
      })
      return { ok: true, data: items }
    },
  },
  log_purchase: {
    name: 'log_purchase',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        price: number
        currency?: string
        store?: string
        category?: string
        notes?: string
      }
      const purchase = await prisma.purchase.create({
        data: {
          userId,
          name: p.name,
          price: p.price,
          currency: p.currency ?? 'TRY',
          store: p.store,
          category: p.category,
          notes: p.notes,
        },
      })
      return { ok: true, data: purchase }
    },
  },
  list_recent_purchases: {
    name: 'list_recent_purchases',
    execute: async ({ userId, params }) => {
      const p = params as { limit?: number; category?: string }
      const purchases = await prisma.purchase.findMany({
        where: { userId, ...(p.category && { category: p.category }) },
        orderBy: { createdAt: 'desc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: purchases }
    },
  },
}
