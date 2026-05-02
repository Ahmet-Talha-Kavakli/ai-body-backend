import { ToolDefinition, ToolExecutor } from './types'
import { db as prisma } from '@/lib/db/client'

const C = 'home' as const

export const homeToolDefs: ToolDefinition[] = [
  {
    name: 'add_household_item',
    category: C,
    description: 'Ev eşyası / ürün kaydı ekle (elektronik, mobilya, beyaz eşya vb.)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: {
          type: 'string',
          description: 'appliance | furniture | electronics | cleaning | kitchen | bedroom | other',
        },
        room: { type: 'string', description: 'Hangi oda (salon, mutfak, yatak odası vb.)' },
        brand: { type: 'string' },
        model: { type: 'string' },
        purchaseDate: { type: 'string', description: 'YYYY-MM-DD' },
        warrantyExpires: { type: 'string', description: 'Garanti bitiş YYYY-MM-DD' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_household_items',
    category: C,
    description: 'Ev eşyalarını listele',
    parameters: {
      type: 'object',
      properties: {
        room: { type: 'string' },
        category: { type: 'string' },
        needsReplacement: { type: 'boolean' },
      },
    },
  },
  {
    name: 'mark_item_needs_replacement',
    category: C,
    description: 'Bir eşyayı "değiştirilmesi gerekiyor" olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        needsReplacement: { type: 'boolean' },
        notes: { type: 'string' },
      },
      required: ['itemId', 'needsReplacement'],
    },
  },
  {
    name: 'add_chore',
    category: C,
    description: 'Ev işi / temizlik görevi ekle',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Görev adı (ör. "Buzdolabı Temizliği")' },
        room: { type: 'string' },
        frequency: {
          type: 'string',
          description: 'daily | weekly | biweekly | monthly | quarterly | yearly | once',
        },
        nextDueAt: { type: 'string', description: 'ISO tarih' },
        assignedTo: { type: 'string', description: 'Kim yapacak' },
        estimateMins: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'complete_chore',
    category: C,
    description: 'Ev işini tamamlandı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        choreId: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['choreId'],
    },
  },
  {
    name: 'list_chores',
    category: C,
    description: 'Ev işlerini listele',
    parameters: {
      type: 'object',
      properties: {
        room: { type: 'string' },
        activeOnly: { type: 'boolean' },
        limit: { type: 'number', default: 20 },
      },
    },
  },
  {
    name: 'get_overdue_chores',
    category: C,
    description: 'Süresi geçmiş / yapılmamış ev işlerini getir',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_maintenance_item',
    category: C,
    description: 'Periyodik bakım gerektiren öğe ekle (kombi, klima vb.)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: {
          type: 'string',
          description: 'hvac | plumbing | electrical | appliance | roof | garden | other',
        },
        lastServiceAt: { type: 'string', description: 'Son bakım tarihi YYYY-MM-DD' },
        intervalMonths: { type: 'number', description: 'Bakım aralığı (ay)' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'log_maintenance',
    category: C,
    description: 'Bakım yapıldı olarak kaydet ve bir sonraki tarihi hesapla',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
        serviceDate: { type: 'string', description: 'Bakım tarihi YYYY-MM-DD (boş = bugün)' },
        notes: { type: 'string' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'get_upcoming_maintenance',
    category: C,
    description: 'Yakında yapılması gereken bakımları getir',
    parameters: {
      type: 'object',
      properties: {
        withinDays: { type: 'number', default: 90 },
      },
    },
  },
  {
    name: 'add_vehicle',
    category: C,
    description: 'Araç ekle (araba, motorsiklet vb.)',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Takma ad (ör. "Benim Arabam")' },
        make: { type: 'string', description: 'Marka' },
        vehicleModel: { type: 'string', description: 'Model' },
        year: { type: 'number' },
        plate: { type: 'string', description: 'Plaka' },
        fuelType: { type: 'string', description: 'gasoline | diesel | electric | hybrid | lpg' },
        currentKm: { type: 'number' },
        insuranceExpires: { type: 'string', description: 'Sigorta bitiş YYYY-MM-DD' },
        inspectionExpires: { type: 'string', description: 'Muayene bitiş YYYY-MM-DD' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'log_vehicle_km',
    category: C,
    description: "Araç km'sini güncelle",
    parameters: {
      type: 'object',
      properties: {
        vehicleId: { type: 'string' },
        currentKm: { type: 'number' },
      },
      required: ['vehicleId', 'currentKm'],
    },
  },
  {
    name: 'log_vehicle_service',
    category: C,
    description: 'Araç bakımı / servis kaydı yap',
    parameters: {
      type: 'object',
      properties: {
        vehicleId: { type: 'string' },
        serviceKm: { type: 'number' },
        nextServiceKm: { type: 'number' },
        nextServiceAt: { type: 'string', description: 'YYYY-MM-DD' },
        notes: { type: 'string' },
      },
      required: ['vehicleId'],
    },
  },
  {
    name: 'list_vehicles',
    category: C,
    description: 'Kayıtlı araçları listele',
    parameters: {
      type: 'object',
      properties: {
        activeOnly: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'check_vehicle_service_due',
    category: C,
    description: 'Araçların bakım / sigorta / muayene durumunu kontrol et',
    parameters: {
      type: 'object',
      properties: {
        vehicleId: { type: 'string', description: 'Boş bırakılırsa tüm araçlar' },
      },
    },
  },
  {
    name: 'add_pet',
    category: C,
    description: 'Evcil hayvan ekle',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        species: { type: 'string', description: 'dog | cat | bird | fish | rabbit | other' },
        breed: { type: 'string' },
        birthDate: { type: 'string', description: 'YYYY-MM-DD' },
        weightKg: { type: 'number' },
        color: { type: 'string' },
        vetName: { type: 'string' },
        vetPhone: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name', 'species'],
    },
  },
  {
    name: 'log_pet_event',
    category: C,
    description: 'Evcil hayvana ait olay kaydet (aşı, vet ziyareti, tımar, ilaç, kilo)',
    parameters: {
      type: 'object',
      properties: {
        petId: { type: 'string' },
        type: {
          type: 'string',
          description: 'vaccine | vet_visit | grooming | medication | weight | note',
        },
        title: { type: 'string' },
        date: { type: 'string', description: 'ISO tarih (boş = şimdi)' },
        nextDueAt: { type: 'string', description: 'Sonraki tarih ISO' },
        notes: { type: 'string' },
      },
      required: ['petId', 'type', 'title'],
    },
  },
  {
    name: 'list_pets',
    category: C,
    description: 'Evcil hayvanları listele',
    parameters: {
      type: 'object',
      properties: {
        activeOnly: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'get_pet_upcoming_care',
    category: C,
    description: 'Evcil hayvanlara yakın zamanda yapılması gereken bakımları getir',
    parameters: {
      type: 'object',
      properties: {
        withinDays: { type: 'number', default: 60 },
      },
    },
  },
  {
    name: 'add_home_appointment',
    category: C,
    description: 'Randevu ekle (doktor, dişçi, servis, devlet kurumu vb.)',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        category: {
          type: 'string',
          description: 'doctor | dentist | vet | service | government | other',
        },
        scheduledAt: { type: 'string', description: 'ISO tarih-saat' },
        location: { type: 'string' },
        durationMins: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['title', 'scheduledAt'],
    },
  },
  {
    name: 'list_home_appointments',
    category: C,
    description: 'Randevuları listele',
    parameters: {
      type: 'object',
      properties: {
        upcoming: { type: 'boolean', description: 'Sadece gelecektekiler' },
        category: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'complete_home_appointment',
    category: C,
    description: 'Randevuyu tamamlandı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'get_upcoming_home_appointments',
    category: C,
    description:
      'Yaklaşan randevuları, araç muayenelerini ve evcil hayvan bakımlarını tek listede getir',
    parameters: {
      type: 'object',
      properties: {
        withinDays: { type: 'number', default: 30 },
      },
    },
  },
]

export const homeExecutors: Record<string, ToolExecutor> = {
  add_household_item: {
    name: 'add_household_item',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        category?: string
        room?: string
        brand?: string
        model?: string
        purchaseDate?: string
        warrantyExpires?: string
        notes?: string
      }
      const item = await prisma.householdItem.create({
        data: {
          userId,
          name: p.name,
          category: p.category,
          room: p.room,
          brand: p.brand,
          model: p.model,
          purchaseDate: p.purchaseDate ? new Date(p.purchaseDate) : undefined,
          warrantyExpires: p.warrantyExpires ? new Date(p.warrantyExpires) : undefined,
          notes: p.notes,
        },
      })
      return { ok: true, data: item }
    },
  },
  list_household_items: {
    name: 'list_household_items',
    execute: async ({ userId, params }) => {
      const p = params as { room?: string; category?: string; needsReplacement?: boolean }
      const items = await prisma.householdItem.findMany({
        where: {
          userId,
          ...(p.room && { room: p.room }),
          ...(p.category && { category: p.category }),
          ...(p.needsReplacement !== undefined && { needsReplacement: p.needsReplacement }),
        },
        orderBy: { name: 'asc' },
      })
      return { ok: true, data: items }
    },
  },
  mark_item_needs_replacement: {
    name: 'mark_item_needs_replacement',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string; needsReplacement: boolean; notes?: string }
      await prisma.householdItem.updateMany({
        where: { id: p.itemId, userId },
        data: {
          needsReplacement: p.needsReplacement,
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true }
    },
  },
  add_chore: {
    name: 'add_chore',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        room?: string
        frequency?: string
        nextDueAt?: string
        assignedTo?: string
        estimateMins?: number
        notes?: string
      }
      const chore = await prisma.chore.create({
        data: {
          userId,
          name: p.name,
          room: p.room,
          frequency: p.frequency,
          nextDueAt: p.nextDueAt ? new Date(p.nextDueAt) : undefined,
          assignedTo: p.assignedTo,
          estimateMins: p.estimateMins,
          notes: p.notes,
        },
      })
      return { ok: true, data: chore }
    },
  },
  complete_chore: {
    name: 'complete_chore',
    execute: async ({ userId, params }) => {
      const p = params as { choreId: string; notes?: string }
      const chore = await prisma.chore.findFirst({ where: { id: p.choreId, userId } })
      if (!chore) return { ok: false, error: 'chore_not_found' }
      const now = new Date()
      let nextDueAt: Date | undefined
      if (chore.frequency) {
        const map: Record<string, number> = {
          daily: 1,
          weekly: 7,
          biweekly: 14,
          monthly: 30,
          quarterly: 90,
          yearly: 365,
        }
        const days = map[chore.frequency]
        if (days) {
          nextDueAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        }
      }
      await prisma.chore.update({
        where: { id: p.choreId },
        data: {
          lastDoneAt: now,
          ...(nextDueAt && { nextDueAt }),
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true }
    },
  },
  list_chores: {
    name: 'list_chores',
    execute: async ({ userId, params }) => {
      const p = params as { room?: string; activeOnly?: boolean; limit?: number }
      const chores = await prisma.chore.findMany({
        where: {
          userId,
          ...(p.room && { room: p.room }),
          ...(p.activeOnly !== false && { active: true }),
        },
        orderBy: { nextDueAt: 'asc' },
        take: p.limit ?? 20,
      })
      return { ok: true, data: chores }
    },
  },
  get_overdue_chores: {
    name: 'get_overdue_chores',
    execute: async ({ userId }) => {
      const now = new Date()
      const chores = await prisma.chore.findMany({
        where: { userId, active: true, nextDueAt: { lt: now } },
        orderBy: { nextDueAt: 'asc' },
      })
      return { ok: true, data: chores }
    },
  },
  add_maintenance_item: {
    name: 'add_maintenance_item',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        category?: string
        lastServiceAt?: string
        intervalMonths?: number
        notes?: string
      }
      const lastAt = p.lastServiceAt ? new Date(p.lastServiceAt) : undefined
      let nextAt: Date | undefined
      if (lastAt && p.intervalMonths) {
        nextAt = new Date(lastAt)
        nextAt.setMonth(nextAt.getMonth() + p.intervalMonths)
      }
      const item = await prisma.maintenanceItem.create({
        data: {
          userId,
          name: p.name,
          category: p.category,
          lastServiceAt: lastAt,
          nextServiceAt: nextAt,
          intervalMonths: p.intervalMonths,
          notes: p.notes,
        },
      })
      return { ok: true, data: item }
    },
  },
  log_maintenance: {
    name: 'log_maintenance',
    execute: async ({ userId, params }) => {
      const p = params as { itemId: string; serviceDate?: string; notes?: string }
      const item = await prisma.maintenanceItem.findFirst({ where: { id: p.itemId, userId } })
      if (!item) return { ok: false, error: 'item_not_found' }
      const serviceAt = p.serviceDate ? new Date(p.serviceDate) : new Date()
      let nextAt: Date | undefined
      if (item.intervalMonths) {
        nextAt = new Date(serviceAt)
        nextAt.setMonth(nextAt.getMonth() + item.intervalMonths)
      }
      await prisma.maintenanceItem.update({
        where: { id: p.itemId },
        data: {
          lastServiceAt: serviceAt,
          ...(nextAt && { nextServiceAt: nextAt }),
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true }
    },
  },
  get_upcoming_maintenance: {
    name: 'get_upcoming_maintenance',
    execute: async ({ userId, params }) => {
      const p = params as { withinDays?: number }
      const cutoff = new Date(Date.now() + (p.withinDays ?? 90) * 24 * 60 * 60 * 1000)
      const items = await prisma.maintenanceItem.findMany({
        where: { userId, nextServiceAt: { lte: cutoff } },
        orderBy: { nextServiceAt: 'asc' },
      })
      return { ok: true, data: items }
    },
  },
  add_vehicle: {
    name: 'add_vehicle',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        make?: string
        vehicleModel?: string
        year?: number
        plate?: string
        fuelType?: string
        currentKm?: number
        insuranceExpires?: string
        inspectionExpires?: string
        notes?: string
      }
      const vehicle = await prisma.userVehicle.create({
        data: {
          userId,
          name: p.name,
          make: p.make,
          vehicleModel: p.vehicleModel,
          year: p.year,
          plate: p.plate,
          fuelType: p.fuelType,
          currentKm: p.currentKm ?? 0,
          insuranceExpires: p.insuranceExpires ? new Date(p.insuranceExpires) : undefined,
          inspectionExpires: p.inspectionExpires ? new Date(p.inspectionExpires) : undefined,
          notes: p.notes,
        },
      })
      return { ok: true, data: vehicle }
    },
  },
  log_vehicle_km: {
    name: 'log_vehicle_km',
    execute: async ({ userId, params }) => {
      const p = params as { vehicleId: string; currentKm: number }
      await prisma.userVehicle.updateMany({
        where: { id: p.vehicleId, userId },
        data: { currentKm: p.currentKm },
      })
      return { ok: true }
    },
  },
  log_vehicle_service: {
    name: 'log_vehicle_service',
    execute: async ({ userId, params }) => {
      const p = params as {
        vehicleId: string
        serviceKm?: number
        nextServiceKm?: number
        nextServiceAt?: string
        notes?: string
      }
      await prisma.userVehicle.updateMany({
        where: { id: p.vehicleId, userId },
        data: {
          lastServiceAt: new Date(),
          ...(p.serviceKm !== undefined && { lastServiceKm: p.serviceKm }),
          ...(p.nextServiceKm !== undefined && { nextServiceKm: p.nextServiceKm }),
          ...(p.nextServiceAt && { nextServiceAt: new Date(p.nextServiceAt) }),
          ...(p.notes !== undefined && { notes: p.notes }),
        },
      })
      return { ok: true }
    },
  },
  list_vehicles: {
    name: 'list_vehicles',
    execute: async ({ userId, params }) => {
      const p = params as { activeOnly?: boolean }
      const vehicles = await prisma.userVehicle.findMany({
        where: { userId, ...(p.activeOnly !== false && { active: true }) },
        orderBy: { name: 'asc' },
      })
      return { ok: true, data: vehicles }
    },
  },
  check_vehicle_service_due: {
    name: 'check_vehicle_service_due',
    execute: async ({ userId, params }) => {
      const p = params as { vehicleId?: string }
      const now = new Date()
      const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const vehicles = await prisma.userVehicle.findMany({
        where: { userId, ...(p.vehicleId && { id: p.vehicleId }), active: true },
      })
      const results = vehicles.map((v) => ({
        ...v,
        alerts: [
          v.nextServiceAt && v.nextServiceAt <= cutoff ? 'Bakım yaklaşıyor' : null,
          v.nextServiceKm && v.currentKm >= v.nextServiceKm - 500 ? 'Km sınırı yaklaşıyor' : null,
          v.insuranceExpires && v.insuranceExpires <= cutoff ? 'Sigorta bitiyor' : null,
          v.inspectionExpires && v.inspectionExpires <= cutoff ? 'Muayene bitiyor' : null,
        ].filter((x): x is string => x !== null),
      }))
      return { ok: true, data: results }
    },
  },
  add_pet: {
    name: 'add_pet',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        species: string
        breed?: string
        birthDate?: string
        weightKg?: number
        color?: string
        vetName?: string
        vetPhone?: string
        notes?: string
      }
      const pet = await prisma.userPet.create({
        data: {
          userId,
          name: p.name,
          species: p.species,
          breed: p.breed,
          birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
          weightKg: p.weightKg,
          color: p.color,
          vetName: p.vetName,
          vetPhone: p.vetPhone,
          notes: p.notes,
        },
      })
      return { ok: true, data: pet }
    },
  },
  log_pet_event: {
    name: 'log_pet_event',
    execute: async ({ userId, params }) => {
      const p = params as {
        petId: string
        type: string
        title: string
        date?: string
        nextDueAt?: string
        notes?: string
      }
      const event = await prisma.userPetEvent.create({
        data: {
          userId,
          petId: p.petId,
          type: p.type,
          title: p.title,
          date: p.date ? new Date(p.date) : new Date(),
          nextDueAt: p.nextDueAt ? new Date(p.nextDueAt) : undefined,
          notes: p.notes,
        },
      })
      return { ok: true, data: event }
    },
  },
  list_pets: {
    name: 'list_pets',
    execute: async ({ userId, params }) => {
      const p = params as { activeOnly?: boolean }
      const pets = await prisma.userPet.findMany({
        where: { userId, ...(p.activeOnly !== false && { active: true }) },
        orderBy: { name: 'asc' },
      })
      return { ok: true, data: pets }
    },
  },
  get_pet_upcoming_care: {
    name: 'get_pet_upcoming_care',
    execute: async ({ userId, params }) => {
      const p = params as { withinDays?: number }
      const cutoff = new Date(Date.now() + (p.withinDays ?? 60) * 24 * 60 * 60 * 1000)
      const events = await prisma.userPetEvent.findMany({
        where: { userId, nextDueAt: { lte: cutoff } },
        orderBy: { nextDueAt: 'asc' },
        take: 20,
      })
      return { ok: true, data: events }
    },
  },
  add_home_appointment: {
    name: 'add_home_appointment',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        scheduledAt: string
        category?: string
        location?: string
        durationMins?: number
        notes?: string
      }
      const appt = await prisma.homeAppointment.create({
        data: {
          userId,
          title: p.title,
          scheduledAt: new Date(p.scheduledAt),
          category: p.category,
          location: p.location,
          durationMins: p.durationMins,
          notes: p.notes,
        },
      })
      return { ok: true, data: appt }
    },
  },
  list_home_appointments: {
    name: 'list_home_appointments',
    execute: async ({ userId, params }) => {
      const p = params as { upcoming?: boolean; category?: string; limit?: number }
      const now = new Date()
      const appts = await prisma.homeAppointment.findMany({
        where: {
          userId,
          ...(p.category && { category: p.category }),
          ...(p.upcoming && { scheduledAt: { gte: now }, completed: false }),
        },
        orderBy: { scheduledAt: 'asc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: appts }
    },
  },
  complete_home_appointment: {
    name: 'complete_home_appointment',
    execute: async ({ userId, params }) => {
      const p = params as { appointmentId: string; notes?: string }
      await prisma.homeAppointment.updateMany({
        where: { id: p.appointmentId, userId },
        data: { completed: true, ...(p.notes !== undefined && { notes: p.notes }) },
      })
      return { ok: true }
    },
  },
  get_upcoming_home_appointments: {
    name: 'get_upcoming_home_appointments',
    execute: async ({ userId, params }) => {
      const p = params as { withinDays?: number }
      const now = new Date()
      const cutoff = new Date(Date.now() + (p.withinDays ?? 30) * 24 * 60 * 60 * 1000)
      const [appts, maintenance, petCare, vehicles] = await Promise.all([
        prisma.homeAppointment.findMany({
          where: { userId, scheduledAt: { gte: now, lte: cutoff }, completed: false },
          orderBy: { scheduledAt: 'asc' },
          take: 10,
        }),
        prisma.maintenanceItem.findMany({
          where: { userId, nextServiceAt: { lte: cutoff } },
          orderBy: { nextServiceAt: 'asc' },
          take: 5,
        }),
        prisma.userPetEvent.findMany({
          where: { userId, nextDueAt: { lte: cutoff } },
          orderBy: { nextDueAt: 'asc' },
          take: 5,
        }),
        prisma.userVehicle.findMany({
          where: { userId, active: true, nextServiceAt: { lte: cutoff } },
          take: 3,
        }),
      ])
      return {
        ok: true,
        data: { appointments: appts, maintenance, petCare, vehicles },
      }
    },
  },
}
