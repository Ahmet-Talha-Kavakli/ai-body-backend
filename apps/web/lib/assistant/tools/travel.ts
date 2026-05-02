import { ToolDefinition, ToolExecutor } from './types'
import { db as prisma } from '@/lib/db/client'

const C = 'travel' as const

export const travelToolDefs: ToolDefinition[] = [
  {
    name: 'add_trip',
    category: C,
    description: 'Yeni bir seyahat/gezi planı oluştur',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Seyahat başlığı (ör. "İstanbul Haftasonu")' },
        destination: { type: 'string', description: 'Gidilecek yer' },
        country: { type: 'string', description: 'Ülke' },
        startDate: { type: 'string', description: 'Başlangıç tarihi YYYY-MM-DD' },
        endDate: { type: 'string', description: 'Bitiş tarihi YYYY-MM-DD' },
        budget: { type: 'number', description: 'Bütçe' },
        currency: { type: 'string', description: 'Para birimi (TRY/USD/EUR)', default: 'TRY' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'destination'],
    },
  },
  {
    name: 'list_trips',
    category: C,
    description: 'Seyahatleri listele',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['planned', 'ongoing', 'completed', 'cancelled', 'all'] },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'update_trip',
    category: C,
    description: 'Seyahat bilgilerini güncelle',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        title: { type: 'string' },
        destination: { type: 'string' },
        country: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        status: { type: 'string', enum: ['planned', 'ongoing', 'completed', 'cancelled'] },
        budget: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['tripId'],
    },
  },
  {
    name: 'delete_trip',
    category: C,
    description: 'Seyahati sil',
    destructive: true,
    parameters: {
      type: 'object',
      properties: { tripId: { type: 'string' } },
      required: ['tripId'],
    },
  },
  {
    name: 'add_flight',
    category: C,
    description: 'Uçuş bilgisi ekle',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Kalkış havalimanı/şehir' },
        destination: { type: 'string', description: 'Varış havalimanı/şehir' },
        tripId: { type: 'string' },
        flightNumber: { type: 'string' },
        airline: { type: 'string' },
        departureAt: { type: 'string', description: 'ISO 8601 kalkış zamanı' },
        arrivalAt: { type: 'string', description: 'ISO 8601 varış zamanı' },
        seatNumber: { type: 'string' },
        confirmCode: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'list_flights',
    category: C,
    description: 'Uçuş kayıtlarını listele',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'update_flight_status',
    category: C,
    description: 'Uçuş durumunu güncelle (iptal, gecikme vb.)',
    parameters: {
      type: 'object',
      properties: {
        flightId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['scheduled', 'departed', 'landed', 'cancelled', 'delayed'],
        },
        notes: { type: 'string' },
      },
      required: ['flightId', 'status'],
    },
  },
  {
    name: 'add_lodging',
    category: C,
    description: 'Konaklama yeri ekle (otel, Airbnb vb.)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Konaklama adı' },
        type: { type: 'string', enum: ['hotel', 'hostel', 'airbnb', 'villa', 'camping', 'other'] },
        tripId: { type: 'string' },
        city: { type: 'string' },
        address: { type: 'string' },
        checkIn: { type: 'string', description: 'Giriş tarihi ISO' },
        checkOut: { type: 'string', description: 'Çıkış tarihi ISO' },
        confirmCode: { type: 'string' },
        pricePerNight: { type: 'number' },
        currency: { type: 'string', default: 'TRY' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_lodgings',
    category: C,
    description: 'Konaklama kayıtlarını listele',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'log_place_visit',
    category: C,
    description: 'Ziyaret edilen yeri kaydet',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Mekan adı' },
        category: {
          type: 'string',
          description: 'restaurant | museum | park | beach | landmark | cafe | other',
        },
        tripId: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        rating: { type: 'number', description: '1-5 arası puan' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_visited_places',
    category: C,
    description: 'Ziyaret edilen yerleri listele',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        country: { type: 'string' },
        category: { type: 'string' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'rate_place',
    category: C,
    description: 'Ziyaret edilen yere puan ver / notunu güncelle',
    parameters: {
      type: 'object',
      properties: {
        placeId: { type: 'string' },
        rating: { type: 'number', description: '1-5' },
        notes: { type: 'string' },
      },
      required: ['placeId'],
    },
  },
  {
    name: 'add_packing_item',
    category: C,
    description: 'Bavul listesine eşya ekle',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        tripId: { type: 'string' },
        category: {
          type: 'string',
          description: 'clothing | electronics | toiletries | documents | medicine | other',
        },
        quantity: { type: 'number', default: 1 },
        essential: { type: 'boolean', default: false },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_packing',
    category: C,
    description: 'Bavul listesini göster',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        packedOnly: { type: 'boolean' },
        unpackedOnly: { type: 'boolean' },
      },
    },
  },
  {
    name: 'mark_packed',
    category: C,
    description: 'Eşyayı bavule koy / çıkar',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        packed: { type: 'boolean' },
      },
      required: ['itemId', 'packed'],
    },
  },
  {
    name: 'add_travel_document',
    category: C,
    description: 'Seyahat belgesi ekle (pasaport, vize, sigorta vb.)',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description:
            'passport | visa | id_card | drivers_license | insurance | vaccine_card | other',
        },
        country: { type: 'string' },
        documentNo: { type: 'string' },
        issuedAt: { type: 'string', description: 'YYYY-MM-DD' },
        expiresAt: { type: 'string', description: 'YYYY-MM-DD' },
        notes: { type: 'string' },
      },
      required: ['type'],
    },
  },
  {
    name: 'list_travel_documents',
    category: C,
    description: 'Seyahat belgelerini listele',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string' },
      },
    },
  },
  {
    name: 'check_expiring_documents',
    category: C,
    description: 'Süresi dolmak üzere olan belgeleri kontrol et',
    parameters: {
      type: 'object',
      properties: {
        withinDays: { type: 'number', default: 180 },
      },
    },
  },
  {
    name: 'get_trip_summary',
    category: C,
    description: 'Bir seyahatin özet bilgilerini getir (uçuşlar, konaklamalar, bütçe)',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
      },
      required: ['tripId'],
    },
  },
]

export const travelExecutors: Record<string, ToolExecutor> = {
  add_trip: {
    name: 'add_trip',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        destination: string
        country?: string
        startDate?: string
        endDate?: string
        budget?: number
        currency?: string
        notes?: string
        tags?: string[]
      }
      const trip = await prisma.trip.create({
        data: {
          userId,
          title: p.title,
          destination: p.destination,
          country: p.country,
          startDate: p.startDate ? new Date(p.startDate) : undefined,
          endDate: p.endDate ? new Date(p.endDate) : undefined,
          budget: p.budget,
          currency: p.currency ?? 'TRY',
          notes: p.notes,
          tags: p.tags ?? [],
        },
      })
      return { ok: true, data: trip }
    },
  },
  list_trips: {
    name: 'list_trips',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string; limit?: number }
      const where: Record<string, unknown> = { userId }
      if (p.status && p.status !== 'all') where.status = p.status
      const trips = await prisma.trip.findMany({
        where,
        orderBy: { startDate: 'desc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: trips }
    },
  },
  update_trip: {
    name: 'update_trip',
    execute: async ({ userId, params }) => {
      const p = params as {
        tripId: string
        title?: string
        destination?: string
        country?: string
        startDate?: string
        endDate?: string
        status?: string
        budget?: number
        notes?: string
      }
      const trip = await prisma.trip.updateMany({
        where: { id: p.tripId, userId },
        data: {
          ...(p.title && { title: p.title }),
          ...(p.destination && { destination: p.destination }),
          ...(p.country !== undefined && { country: p.country }),
          ...(p.startDate && { startDate: new Date(p.startDate) }),
          ...(p.endDate && { endDate: new Date(p.endDate) }),
          ...(p.status && { status: p.status }),
          ...(p.budget !== undefined && { budget: p.budget }),
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true, data: trip }
    },
  },
  delete_trip: {
    name: 'delete_trip',
    execute: async ({ userId, params }) => {
      const p = params as { tripId: string }
      await prisma.trip.deleteMany({ where: { id: p.tripId, userId } })
      return { ok: true }
    },
  },
  add_flight: {
    name: 'add_flight',
    execute: async ({ userId, params }) => {
      const p = params as {
        origin: string
        destination: string
        tripId?: string
        flightNumber?: string
        airline?: string
        departureAt?: string
        arrivalAt?: string
        seatNumber?: string
        confirmCode?: string
        notes?: string
      }
      const flight = await prisma.flight.create({
        data: {
          userId,
          origin: p.origin,
          destination: p.destination,
          tripId: p.tripId,
          flightNumber: p.flightNumber,
          airline: p.airline,
          departureAt: p.departureAt ? new Date(p.departureAt) : undefined,
          arrivalAt: p.arrivalAt ? new Date(p.arrivalAt) : undefined,
          seatNumber: p.seatNumber,
          confirmCode: p.confirmCode,
          notes: p.notes,
        },
      })
      return { ok: true, data: flight }
    },
  },
  list_flights: {
    name: 'list_flights',
    execute: async ({ userId, params }) => {
      const p = params as { tripId?: string; limit?: number }
      const flights = await prisma.flight.findMany({
        where: { userId, ...(p.tripId && { tripId: p.tripId }) },
        orderBy: { departureAt: 'desc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: flights }
    },
  },
  update_flight_status: {
    name: 'update_flight_status',
    execute: async ({ userId, params }) => {
      const p = params as { flightId: string; status: string; notes?: string }
      const flight = await prisma.flight.updateMany({
        where: { id: p.flightId, userId },
        data: { status: p.status, ...(p.notes !== undefined && { notes: p.notes }) },
      })
      return { ok: true, data: flight }
    },
  },
  add_lodging: {
    name: 'add_lodging',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        type?: string
        tripId?: string
        city?: string
        address?: string
        checkIn?: string
        checkOut?: string
        confirmCode?: string
        pricePerNight?: number
        currency?: string
        notes?: string
      }
      const lodging = await prisma.lodging.create({
        data: {
          userId,
          name: p.name,
          type: p.type ?? 'hotel',
          tripId: p.tripId,
          city: p.city,
          address: p.address,
          checkIn: p.checkIn ? new Date(p.checkIn) : undefined,
          checkOut: p.checkOut ? new Date(p.checkOut) : undefined,
          confirmCode: p.confirmCode,
          pricePerNight: p.pricePerNight,
          currency: p.currency ?? 'TRY',
          notes: p.notes,
        },
      })
      return { ok: true, data: lodging }
    },
  },
  list_lodgings: {
    name: 'list_lodgings',
    execute: async ({ userId, params }) => {
      const p = params as { tripId?: string; limit?: number }
      const lodgings = await prisma.lodging.findMany({
        where: { userId, ...(p.tripId && { tripId: p.tripId }) },
        orderBy: { checkIn: 'desc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: lodgings }
    },
  },
  log_place_visit: {
    name: 'log_place_visit',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        category?: string
        tripId?: string
        city?: string
        country?: string
        rating?: number
        notes?: string
        tags?: string[]
      }
      const place = await prisma.placeVisited.create({
        data: {
          userId,
          name: p.name,
          category: p.category,
          tripId: p.tripId,
          city: p.city,
          country: p.country,
          rating: p.rating,
          notes: p.notes,
          tags: p.tags ?? [],
        },
      })
      return { ok: true, data: place }
    },
  },
  list_visited_places: {
    name: 'list_visited_places',
    execute: async ({ userId, params }) => {
      const p = params as { tripId?: string; country?: string; category?: string; limit?: number }
      const places = await prisma.placeVisited.findMany({
        where: {
          userId,
          ...(p.tripId && { tripId: p.tripId }),
          ...(p.country && { country: p.country }),
          ...(p.category && { category: p.category }),
        },
        orderBy: { visitedAt: 'desc' },
        take: p.limit ?? 20,
      })
      return { ok: true, data: places }
    },
  },
  rate_place: {
    name: 'rate_place',
    execute: async ({ userId, params }) => {
      const p = params as { placeId: string; rating?: number; notes?: string }
      const place = await prisma.placeVisited.updateMany({
        where: { id: p.placeId, userId },
        data: {
          ...(p.rating !== undefined && { rating: p.rating }),
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true, data: place }
    },
  },
  add_packing_item: {
    name: 'add_packing_item',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        tripId?: string
        category?: string
        quantity?: number
        essential?: boolean
      }
      const item = await prisma.packingItem.create({
        data: {
          userId,
          name: p.name,
          tripId: p.tripId,
          category: p.category,
          quantity: p.quantity ?? 1,
          essential: p.essential ?? false,
        },
      })
      return { ok: true, data: item }
    },
  },
  list_packing: {
    name: 'list_packing',
    execute: async ({ userId, params }) => {
      const p = params as { tripId?: string; packedOnly?: boolean; unpackedOnly?: boolean }
      const where: Record<string, unknown> = { userId }
      if (p.tripId) where.tripId = p.tripId
      if (p.packedOnly) where.packed = true
      if (p.unpackedOnly) where.packed = false
      const items = await prisma.packingItem.findMany({ where, orderBy: { createdAt: 'asc' } })
      return { ok: true, data: items }
    },
  },
  mark_packed: {
    name: 'mark_packed',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string; packed: boolean }
      await prisma.packingItem.updateMany({
        where: { id: p.itemId, userId },
        data: { packed: p.packed },
      })
      return { ok: true }
    },
  },
  add_travel_document: {
    name: 'add_travel_document',
    execute: async ({ userId, params }) => {
      const p = params as {
        type: string
        country?: string
        documentNo?: string
        issuedAt?: string
        expiresAt?: string
        notes?: string
      }
      const doc = await prisma.travelDocument.create({
        data: {
          userId,
          type: p.type,
          country: p.country,
          documentNo: p.documentNo,
          issuedAt: p.issuedAt ? new Date(p.issuedAt) : undefined,
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
          notes: p.notes,
        },
      })
      return { ok: true, data: doc }
    },
  },
  list_travel_documents: {
    name: 'list_travel_documents',
    execute: async ({ userId, params }) => {
      const p = params as { type?: string }
      const docs = await prisma.travelDocument.findMany({
        where: { userId, ...(p.type && { type: p.type }) },
        orderBy: { expiresAt: 'asc' },
      })
      return { ok: true, data: docs }
    },
  },
  check_expiring_documents: {
    name: 'check_expiring_documents',
    execute: async ({ userId, params }) => {
      const p = params as { withinDays?: number }
      const days = p.withinDays ?? 180
      const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      const docs = await prisma.travelDocument.findMany({
        where: { userId, expiresAt: { lte: cutoff } },
        orderBy: { expiresAt: 'asc' },
      })
      return { ok: true, data: docs }
    },
  },
  get_trip_summary: {
    name: 'get_trip_summary',
    execute: async ({ userId, params }) => {
      const p = params as { tripId: string }
      const [trip, flights, lodgings, places, packing] = await Promise.all([
        prisma.trip.findFirst({ where: { id: p.tripId, userId } }),
        prisma.flight.findMany({ where: { userId, tripId: p.tripId } }),
        prisma.lodging.findMany({ where: { userId, tripId: p.tripId } }),
        prisma.placeVisited.findMany({ where: { userId, tripId: p.tripId } }),
        prisma.packingItem.findMany({ where: { userId, tripId: p.tripId } }),
      ])
      if (!trip) return { ok: false, error: 'trip_not_found' }
      const packedCount = packing.filter((i) => i.packed).length
      return {
        ok: true,
        data: {
          trip,
          flights,
          lodgings,
          visitedPlaces: places,
          packing: {
            total: packing.length,
            packed: packedCount,
            remaining: packing.length - packedCount,
          },
        },
      }
    },
  },
}
