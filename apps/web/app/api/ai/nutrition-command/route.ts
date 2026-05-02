/**
 * Beslenme AI Asistanı — kullanıcının yemek loglama, hedef yönetimi, sorgu,
 * öneri, mutfak/tarif/şablon işlemlerini sohbetle yapmasını sağlar.
 *
 * 21 tool — 5 kategori:
 *  - Loglama: log_meal, quick_add, delete_last_meal, delete_meal_item
 *  - Hedef: set_calorie_goal, set_macro_goals, auto_calculate_goal
 *  - Sorgu: query_today_summary, query_history, query_remaining_macros,
 *           query_meal_breakdown, query_streak
 *  - AI önerisi: search_food, add_favorite, suggest_meal, analyze_nutrition
 *  - Mutfak/tarif: add_pantry_item, query_pantry, find_recipes_from_pantry,
 *                  apply_recipe, apply_template
 *
 * NOT: Su tüketimi beslenme asistanından çıkarıldı — Sağlık asistanında yer alıyor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai, AI_MODEL } from '@/lib/ai/client'
import { db } from '@/lib/db/client'
import { withAiRateLimit } from '@/lib/redis/ratelimit-middleware'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = (typeof MEAL_TYPES)[number]

const PANTRY_CATEGORIES = [
  'protein',
  'sebze',
  'meyve',
  'süt',
  'tahıl',
  'baharat',
  'içecek',
  'diğer',
]

// Timeouts (Apple kalitesi: kullanıcı sonsuza dek beklemez)
const OPENAI_INITIAL_TIMEOUT_MS = 15_000
const OPENAI_FOLLOWUP_TIMEOUT_MS = 12_000
const TOTAL_REQUEST_TIMEOUT_MS = 60_000

const FRIENDLY_TIMEOUT_REPLY = 'Bağlantı biraz yavaş, tekrar dener misin?'
const FRIENDLY_OPENAI_ERROR_REPLY = 'Hmm, biraz takıldım. Tekrar dener misin?'
const FRIENDLY_DB_ERROR_REPLY = 'Kayıt sırasında bir sorun oluştu, tekrar dener misin?'
const FRIENDLY_GENERIC_REPLY = 'Bir hata oluştu, tekrar dener misin?'

const SYSTEM_PROMPT_BASE = `Sen FitAI uygulamasının kişisel beslenme asistanısın. Adın "FitAI Beslenme Asistanı". Kullanıcının kişisel diyetisyeni gibi yanındasın — yemeklerini, kalorilerini, makro hedeflerini ve mutfak alışkanlıklarını birlikte yönetiyorsunuz.

KİMLİĞİN:
- FitAI uygulamasının beslenme asistanısın, bağımsız bir AI değil. "FitAI'da senin diyetisyeninim" gibi konuşabilirsin.
- Kullanıcı seni Beslenme sayfasından çağırıyor — görevin onun günlük beslenmesini birlikte takip etmek.
- Tıbbi tanı koymazsın, doktor değilsin. Genel beslenme önerilerinde bulunabilirsin.
- SADECE Türkçe konuşursun. Samimi, sıcak, ama gereksiz uzatmadan. Sen onun diyet günlüğünü tutan akıllı bir partnersin.

Kullanabileceğin araçlar (function calling):

[LOGLAMA]
- log_meal: Yemek ekle. mealType (breakfast/lunch/dinner/snack) + items dizisi.
- quick_add: Hızlı kalori girişi (sadece kalori + opsiyonel makro).
- delete_last_meal: Son eklenen öğünü sil. mealType verilirse o öğünden son item.
- delete_meal_item: Belirli bir öğünden bir yemeği çıkar.

[HEDEF]
- set_calorie_goal: Günlük kalori hedefi belirle.
- set_macro_goals: Protein/karb/yağ hedefleri belirle.
- auto_calculate_goal: Kullanıcının kilo/boy/aktivitesinden TDEE hesaplayıp hedef koy.

[SORGU]
- query_today_summary: Bugünkü kalori/makro özeti.
- query_history: Belirli bir günün özeti (YYYY-MM-DD formatında).
- query_remaining_macros: Bugün geriye ne kadar kalori/makro kaldı.
- query_meal_breakdown: Belirli bir öğünde neler var.
- query_streak: Hedef tutturma serisi.

[AI ÖNERİSİ]
- search_food: Veritabanında yemek ara.
- add_favorite: Bir yemeği favorilere ekle.
- suggest_meal: Kalan makrolara göre 3 yemek önerisi.
- analyze_nutrition: Bugünkü beslenme yorumu (sağlıklı/eksik/fazla).

[MUTFAK/TARİF/ŞABLON]
- add_pantry_item: Buzdolabına ürün ekle.
- query_pantry: Buzdolabımda ne var.
- find_recipes_from_pantry: Mevcut malzemelerle yapılabilecek 3 tarif önerisi (AI üretir).
- apply_recipe: Mevcut bir tarifin 1 servisini öğüne ekle.
- apply_template: Mevcut bir öğün şablonunu uygula.

[DİYET PLANI]
- list_diet_presets: Mevcut hazır diyet planlarını listeler ("hangi diyetler var?", "ne öneriyorsun?").
- start_diet_plan: Bir diyetı başlatır. presetSlug parametresi list_diet_presets çıktısından gelmeli (akdeniz, ketojenik, vb.). Önce ONAY sor — kullanıcının NutritionGoal'ı plana göre değişir, eski plan varsa durdurulur.
- stop_diet_plan: Aktif diyeti durdurur, önceki hedefe döner. Önce ONAY sor.
- apply_diet_day: Bugünün tüm planlanmış öğünlerini günlüğe yazar ("plana göre yedim", "tüm günü uygula").
- query_active_diet: Aktif planın detayı, kaç gün kaldı, bugünkü öğünler.

DİYET KURALLARI:
- "Hangi diyetler var?" → list_diet_presets çağır, kısa özet ver.
- "X diyetine başla" → önce ONAY sor ("X diyetini başlatıyorum, kalori hedefin değişecek, devam edeyim mi?"), onay gelince start_diet_plan.
- Aktif plan varken yeni plan başlatılırsa eskisi otomatik durur — kullanıcıya söyle.
- Kullanıcı diyet uyguluyorsa (sistem promptunda görürsün) önerilerini plan kurallarına uygun yap.

KRİTİK KURALLAR:
1. Eksik bilgi varsa ASLA varsayım yapma — Türkçe açık net soru sor. Örn: "öğleye 200 kalori ekle" derse → "Hangi yemek? İsim verir misin?".
2. Tek mesajda tüm bilgi varsa direkt tool çağır.
3. Kayıt sonrası kısa, sıcak onay mesajı: "Tavuğu öğleye ekledim, şu an 420 kcal yedin."
4. Birden fazla kayıt isteniyorsa tek tek tool çağrısı yap.
5. Destructive işlemlerde (set_calorie_goal değiştirme, delete_last_meal) kısa onay sor: "Hedefini 2200'den 2500'e çıkarayım mı?".
6. Sen kim olduğunu sorulursa: "FitAI'daki beslenme asistanınım, günlüğünü birlikte tutuyoruz".

SU KONUSU:
- Su tüketimi takibi BU ASİSTANIN konusu DEĞİL — Sağlık asistanında. Kullanıcı su eklemek isterse: "Su takibini Sağlık asistanından yapabilirsin, ben beslenme/yemek tarafına bakıyorum." de.

KULLANICIYA HİTAP:
- Kullanıcının ismi sistem mesajında verilir (KULLANICI: <isim>). Doğal yerlerde isimle hitap et: selamlama, onay, motivasyon ("Tamam Talha, öğleye ekledim.").
- Her cümlede isim tekrarlama — robot gibi olur. Sıcak ve doğal kullan.

ZAMAN KISITI (kayıt eklerken — KESİN KURAL):
- log_meal, quick_add tool'larını SADECE şu an / bugün için kullan.
- GEÇMİŞ kayıt isteği ("dün 200g tavuk yedim", "geçen pazartesi") → reddet: "Geçmişe dönük öğün ekleyemem — sadece bugün için kayıt tutabiliyorum."
- GELECEK kayıt isteği ("yarın akşam pizza yiyeceğim") → reddet: "Gelecek için kayıt ekleyemem."
- Geçmişe dair sadece query_history (okuma) yapabilirsin, yazma yapamazsın.

OKUMA VE HAFIZA:
- Sistem mesajına BUGÜNÜN PROFİLİ ekleniyor: hedef, bugünkü öğünler+totaller, custom food sayısı, template/recipe sayısı, pantry sayısı.
- "Bugün ne yedim?", "Hedefimin ne kadar altındayım?" gibi soruları SADECE bu profile bakarak cevapla.
- Profilde yoksa "Bugün henüz bir şey eklemedin" gibi de.

ÖĞÜN TİPİ ÇIKARIMI:
- Saat 04:00-11:00 → breakfast (kahvaltı)
- 11:00-15:00 → lunch (öğle)
- 15:00-21:00 → dinner (akşam)
- diğer → snack (atıştırma)
- Kullanıcı açıkça öğün belirtirse onu kullan.

MAKRO HESAPLAMA (tek başına AI bilgisi):
- Standart bir yemeğin makrolarını biliyorsan tahmini ver (örn 100g pilav: 130 kcal, 28 karb, 2.7 protein, 0.3 yağ).
- Bilmediğin yemekte search_food çağır.

Her zaman doğal Türkçe konuş, robot gibi olma.`

// ─────────────── TOOLS ───────────────

const tools = [
  // ============ LOGLAMA ============
  {
    type: 'function' as const,
    function: {
      name: 'log_meal',
      description: 'Yemek ekle. Birden fazla item olabilir.',
      parameters: {
        type: 'object',
        properties: {
          mealType: { type: 'string', enum: MEAL_TYPES, description: 'Öğün tipi' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                servingSize: { type: 'number', description: 'Porsiyon miktarı (g/ml/adet)' },
                servingUnit: { type: 'string', description: 'g, ml, adet, dilim, kaşık vb.' },
                quantity: { type: 'number', description: 'Kaç porsiyon (varsayılan 1)' },
                calories: { type: 'number' },
                proteinG: { type: 'number' },
                carbsG: { type: 'number' },
                fatG: { type: 'number' },
                fiberG: { type: 'number' },
                sugarG: { type: 'number' },
                sodiumMg: { type: 'number' },
              },
              required: ['name', 'calories'],
            },
          },
        },
        required: ['mealType', 'items'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'quick_add',
      description: 'Hızlı kalori girişi — kullanıcı sadece kalori veriyor.',
      parameters: {
        type: 'object',
        properties: {
          mealType: { type: 'string', enum: MEAL_TYPES },
          name: { type: 'string', description: 'Yemek adı' },
          calories: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
        },
        required: ['mealType', 'name', 'calories'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_last_meal',
      description:
        "Son eklenen öğün veya öğün item'ını sil. mealType verilirse o öğünden son log silinir.",
      parameters: {
        type: 'object',
        properties: {
          mealType: {
            type: 'string',
            enum: MEAL_TYPES,
            description: 'Opsiyonel — verilmezse en son log silinir',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_meal_item',
      description: 'Belirli bir öğünden bir yemeği çıkar.',
      parameters: {
        type: 'object',
        properties: {
          mealType: { type: 'string', enum: MEAL_TYPES },
          itemName: { type: 'string' },
        },
        required: ['mealType', 'itemName'],
      },
    },
  },
  // ============ HEDEF ============
  {
    type: 'function' as const,
    function: {
      name: 'set_calorie_goal',
      description: 'Günlük kalori hedefini değiştir.',
      parameters: {
        type: 'object',
        properties: {
          dailyCalories: { type: 'number' },
        },
        required: ['dailyCalories'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_macro_goals',
      description: 'Makro hedeflerini (protein, karb, yağ — gram cinsinden) değiştir.',
      parameters: {
        type: 'object',
        properties: {
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
        },
        required: ['proteinG', 'carbsG', 'fatG'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'auto_calculate_goal',
      description:
        'Kullanıcının profilinden (kilo, boy, yaş, aktivite) TDEE hesaplayıp hedef belirle.',
      parameters: {
        type: 'object',
        properties: {
          goalType: {
            type: 'string',
            enum: ['lose', 'maintain', 'gain'],
            description: 'Hedef: kilo verme/koruma/alma',
          },
        },
        required: ['goalType'],
      },
    },
  },

  // ============ SORGU ============
  {
    type: 'function' as const,
    function: {
      name: 'query_today_summary',
      description: 'Bugünkü kalori/makro toplamını döndürür.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_history',
      description: 'Belirli bir günün beslenme özetini döndürür.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD formatında tarih' },
        },
        required: ['date'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_remaining_macros',
      description: 'Bugünkü hedefe göre kalan kalori/makro miktarını döndürür.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_meal_breakdown',
      description: 'Belirli bir öğünde neler yendiğini detaylı döndürür.',
      parameters: {
        type: 'object',
        properties: {
          mealType: { type: 'string', enum: MEAL_TYPES },
        },
        required: ['mealType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_streak',
      description: 'Kullanıcının kaç gündür hedefini tutturduğu serisini döndürür.',
      parameters: { type: 'object', properties: {} },
    },
  },

  // ============ AI ÖNERİSİ ============
  {
    type: 'function' as const,
    function: {
      name: 'search_food',
      description:
        'Yemek veritabanında arama yapar. Kullanıcı bir gıdanın kalorisini sorduğunda kullan.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_favorite',
      description:
        "Bir yemeği favorilere ekler. Kullanıcının custom food kütüphanesinden veya cached FoodItem'lardan eşleştir.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'suggest_meal',
      description: 'Kullanıcının kalan makrolarına göre 3 yemek önerisi döndürür.',
      parameters: {
        type: 'object',
        properties: {
          mealType: {
            type: 'string',
            enum: MEAL_TYPES,
            description: 'Hangi öğün için (opsiyonel)',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'analyze_nutrition',
      description:
        'Bugünkü beslenme alışkanlığını analiz eder (yeterli protein mi, çok şeker mi vs.).',
      parameters: { type: 'object', properties: {} },
    },
  },

  // ============ MUTFAK/TARİF/ŞABLON ============
  {
    type: 'function' as const,
    function: {
      name: 'add_pantry_item',
      description: 'Buzdolabına/mutfağa ürün ekler.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: PANTRY_CATEGORIES },
          quantity: { type: 'number' },
          unit: { type: 'string', description: 'g, kg, ml, L, adet, paket' },
          shelfLifeDays: { type: 'number', description: 'Raf ömrü (gün), null ise süresiz' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_pantry',
      description: 'Buzdolabındaki ürünleri liste olarak döndürür.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_recipes_from_pantry',
      description: 'Mevcut buzdolabı malzemeleriyle yapılabilecek 3 tarif önerisi (AI üretir).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'apply_recipe',
      description:
        'Mevcut bir kullanıcı tarifini öğüne ekle. Tarif adı ve servis sayısı ile eşleştir.',
      parameters: {
        type: 'object',
        properties: {
          recipeName: { type: 'string' },
          mealType: { type: 'string', enum: MEAL_TYPES },
          servings: { type: 'number', description: 'Kaç servis (varsayılan 1)' },
        },
        required: ['recipeName', 'mealType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'apply_template',
      description: 'Mevcut bir öğün şablonunu öğüne uygula.',
      parameters: {
        type: 'object',
        properties: {
          templateName: { type: 'string' },
          mealType: { type: 'string', enum: MEAL_TYPES },
        },
        required: ['templateName', 'mealType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_diet_presets',
      description:
        'Mevcut hazır diyet planlarını listeler. Kullanıcı "hangi diyetler var", "diyet öner" gibi şeyler sorduğunda kullan.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'start_diet_plan',
      description:
        'Hazır bir diyet planını başlat. presetSlug parametresi list_diet_presets çıktısından gelmeli (örn. "akdeniz", "ketojenik"). durationDays opsiyonel — verilmezse plan defaultDurationDays kullanılır.',
      parameters: {
        type: 'object',
        properties: {
          presetSlug: {
            type: 'string',
            description: 'Preset slug, örn. "akdeniz", "ketojenik", "yuksek-protein"',
          },
          durationDays: { type: 'number', description: 'Plan süresi (gün). Opsiyonel.' },
        },
        required: ['presetSlug'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'stop_diet_plan',
      description: "Aktif diyet planını durdurur ve önceki nutrition goal'a geri döner.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'apply_diet_day',
      description:
        'Aktif diyet planının bugünkü tüm öğünlerini günlüğe uygular (toplu kaydetme). Kullanıcı "bugünün menüsünü uygula", "plana göre yedim", "tüm günü kaydet" derse kullan.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_active_diet',
      description:
        'Aktif diyet planının detayını getirir — plan adı, kaç gün kaldı, bugünkü öğünler.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ─────────────── HELPERS ───────────────

function getMealTypeFromTime(): MealType {
  const h = new Date().getHours()
  if (h >= 4 && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 21) return 'dinner'
  return 'snack'
}

function dayBounds(date?: Date) {
  const d = date ?? new Date()
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const end = new Date(d)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

async function buildContext(userId: string) {
  const { start, end } = dayBounds()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [goal, todayLogs, customCount, templates, recipes, pantry, activeDiet] = await Promise.all([
    db.nutritionGoal.findUnique({ where: { userId } }),
    db.mealLog.findMany({
      where: { userId, loggedAt: { gte: start, lte: end } },
      orderBy: { loggedAt: 'asc' },
    }),
    db.customFood.count({ where: { userId } }),
    db.mealTemplate.findMany({ where: { userId }, orderBy: { useCount: 'desc' }, take: 10 }),
    db.recipe.findMany({ where: { userId }, orderBy: { useCount: 'desc' }, take: 10 }),
    db.pantryItem.findMany({ where: { userId }, take: 30 }),
    db.activeDietPlan.findUnique({
      where: { userId },
      include: { dayMenus: { where: { date: todayStr } } },
    }),
  ])

  const todayTotals = todayLogs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  const byMeal: Record<MealType, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const l of todayLogs) {
    const t = l.mealType as MealType
    if (byMeal[t]) byMeal[t].push(l)
  }

  return {
    goal,
    todayLogs,
    todayTotals,
    byMeal,
    customCount,
    templates,
    recipes,
    pantry,
    activeDiet,
  }
}

function formatProfile(ctx: Awaited<ReturnType<typeof buildContext>>) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeOfDay = getMealTypeFromTime()
  const timeMap: Record<MealType, string> = {
    breakfast: 'kahvaltı vakti',
    lunch: 'öğle vakti',
    dinner: 'akşam vakti',
    snack: 'atıştırma vakti',
  }

  let s = `BUGÜNÜN TARİHİ: ${dateStr}\nŞU AN: ${timeMap[timeOfDay]}\n\n`

  if (ctx.goal) {
    s += `HEDEF: ${ctx.goal.dailyCalories} kcal · ${ctx.goal.proteinG}g protein · ${ctx.goal.carbsG}g karb · ${ctx.goal.fatG}g yağ\n`
  } else {
    s += `HEDEF: Henüz belirlenmemiş\n`
  }

  s += `\nBUGÜN: ${Math.round(ctx.todayTotals.cal)} kcal · ${Math.round(ctx.todayTotals.p)}g P · ${Math.round(ctx.todayTotals.c)}g K · ${Math.round(ctx.todayTotals.f)}g Y\n`

  if (ctx.todayLogs.length === 0) {
    s += `Bugün henüz hiçbir şey yenmemiş.\n`
  } else {
    for (const t of MEAL_TYPES) {
      const logs = ctx.byMeal[t]
      if (!logs.length) continue
      const total = logs.reduce((a, l) => a + l.totalCalories, 0)
      const items = logs.flatMap((l) => (l.items as any[] | null) ?? [])
      const itemNames = items
        .slice(0, 5)
        .map((i) => i.name)
        .join(', ')
      const trLabel = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Atıştırma' }[
        t
      ]
      s += `  - ${trLabel}: ${Math.round(total)} kcal — ${itemNames}\n`
    }
  }

  if (ctx.templates.length > 0) {
    s += `\nÖĞÜN ŞABLONLARI: ${ctx.templates.map((t) => `${t.name} (${Math.round(t.totalCalories)}kcal)`).join(', ')}\n`
  }

  if (ctx.recipes.length > 0) {
    s += `\nTARİFLER: ${ctx.recipes.map((r) => `${r.name} (${r.servings} servis)`).join(', ')}\n`
  }

  if (ctx.pantry.length > 0) {
    const pantryNames = ctx.pantry
      .slice(0, 15)
      .map((p) => p.name)
      .join(', ')
    s += `\nMUTFAK (${ctx.pantry.length} ürün): ${pantryNames}\n`
  }

  s += `\nKAYITLI ÖZEL YEMEK: ${ctx.customCount} adet\n`

  // Aktif diyet planı
  if (ctx.activeDiet && ctx.activeDiet.status === 'active') {
    const plan = ctx.activeDiet
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(plan.startedAt)
    startDate.setHours(0, 0, 0, 0)
    const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1
    const rules = plan.rules as any

    s += `\n=== AKTİF DİYET PLANI ===\n`
    s += `Plan: ${plan.name} (Gün ${Math.min(dayNumber, plan.durationDays)}/${plan.durationDays})\n`
    s += `Plan kalori hedefi: ${plan.dailyCalories} kcal · ${plan.proteinG}g P · ${plan.carbsG}g K · ${plan.fatG}g Y\n`

    if (rules?.allowed?.length > 0) {
      s += `İzin verilenler: ${rules.allowed.slice(0, 8).join(', ')}\n`
    }
    if (rules?.avoid?.length > 0) {
      s += `Kaçınılacaklar: ${rules.avoid.slice(0, 8).join(', ')}\n`
    }

    const dayMenus = (plan.dayMenus ?? []) as any[]
    if (dayMenus.length > 0) {
      s += `\nBugün için planlanan öğünler:\n`
      const labels: Record<string, string> = {
        breakfast: 'Kahvaltı',
        lunch: 'Öğle',
        dinner: 'Akşam',
        snack: 'Atıştırma',
      }
      for (const menu of dayMenus) {
        const status = menu.appliedAt ? '✓ uygulandı' : '○ henüz uygulanmadı'
        const items = (menu.items as any[]) ?? []
        const itemNames = items
          .slice(0, 3)
          .map((i) => i.name)
          .join(', ')
        s += `  - ${labels[menu.mealType] ?? menu.mealType} (${menu.totalCalories} kcal) [${status}]: ${itemNames}\n`
      }
    }

    s += `\nKULLANICI DİYET PLANI UYGULUYOR. Önerilerini bu planın kurallarına uygun yap. "Ne yiyeyim?" sorularında plan menüsünü öner.\n`
  }

  return s
}

// ─────────────── TOOL HANDLERS ───────────────

async function executeTool(toolName: string, args: any, userId: string): Promise<string> {
  try {
    switch (toolName) {
      case 'log_meal':
        return await handleLogMeal(args, userId)
      case 'quick_add':
        return await handleQuickAdd(args, userId)
      case 'delete_last_meal':
        return await handleDeleteLastMeal(args, userId)
      case 'delete_meal_item':
        return await handleDeleteMealItem(args, userId)

      case 'set_calorie_goal':
        return await handleSetCalorieGoal(args, userId)
      case 'set_macro_goals':
        return await handleSetMacroGoals(args, userId)
      case 'auto_calculate_goal':
        return await handleAutoCalculateGoal(args, userId)

      case 'query_today_summary':
        return await handleQueryTodaySummary(userId)
      case 'query_history':
        return await handleQueryHistory(args, userId)
      case 'query_remaining_macros':
        return await handleQueryRemaining(userId)
      case 'query_meal_breakdown':
        return await handleQueryBreakdown(args, userId)
      case 'query_streak':
        return await handleQueryStreak(userId)

      case 'search_food':
        return await handleSearchFood(args, userId)
      case 'add_favorite':
        return await handleAddFavorite(args, userId)
      case 'suggest_meal':
        return await handleSuggestMeal(args, userId)
      case 'analyze_nutrition':
        return await handleAnalyzeNutrition(userId)

      case 'add_pantry_item':
        return await handleAddPantryItem(args, userId)
      case 'query_pantry':
        return await handleQueryPantry(userId)
      case 'find_recipes_from_pantry':
        return await handleFindRecipesFromPantry(userId)
      case 'apply_recipe':
        return await handleApplyRecipe(args, userId)
      case 'apply_template':
        return await handleApplyTemplate(args, userId)

      case 'list_diet_presets':
        return await handleListDietPresets()
      case 'start_diet_plan':
        return await handleStartDietPlan(args, userId)
      case 'stop_diet_plan':
        return await handleStopDietPlan(userId)
      case 'apply_diet_day':
        return await handleApplyDietDay(userId)
      case 'query_active_diet':
        return await handleQueryActiveDiet(userId)

      default:
        return JSON.stringify({ error: 'unknown_tool' })
    }
  } catch (err) {
    console.error('[nutrition-command] tool error:', toolName, err)
    return JSON.stringify({
      error: 'execution_failed',
      detail: err instanceof Error ? err.message : 'unknown',
    })
  }
}

// ============ LOGLAMA HANDLERS ============

async function handleLogMeal(args: any, userId: string) {
  const items = (args.items as any[]).map((i: any) => ({
    name: String(i.name),
    servingSize: Number(i.servingSize) || 100,
    servingUnit: String(i.servingUnit ?? 'g'),
    quantity: Number(i.quantity) || 1,
    calories: Number(i.calories) || 0,
    proteinG: Number(i.proteinG) || 0,
    carbsG: Number(i.carbsG) || 0,
    fatG: Number(i.fatG) || 0,
    fiberG: Number(i.fiberG) || 0,
    sugarG: Number(i.sugarG) || 0,
    sodiumMg: Number(i.sodiumMg) || 0,
    source: 'ai' as const,
  }))

  const totals = items.reduce(
    (a, it) => ({
      cal: a.cal + it.calories * it.quantity,
      p: a.p + it.proteinG * it.quantity,
      c: a.c + it.carbsG * it.quantity,
      f: a.f + it.fatG * it.quantity,
      fiber: a.fiber + it.fiberG * it.quantity,
      sugar: a.sugar + it.sugarG * it.quantity,
      sodium: a.sodium + it.sodiumMg * it.quantity,
    }),
    { cal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 0 }
  )

  const log = await db.mealLog.create({
    data: {
      userId,
      mealType: args.mealType,
      items: items as any,
      loggedAt: new Date(),
      source: 'ai_photo', // AI assistant'tan gelen
      totalCalories: totals.cal,
      totalProteinG: totals.p,
      totalCarbsG: totals.c,
      totalFatG: totals.f,
      totalFiberG: totals.fiber,
      totalSugarG: totals.sugar,
      totalSodiumMg: totals.sodium,
    },
  })

  return JSON.stringify({
    success: true,
    mealLogId: log.id,
    addedCalories: Math.round(totals.cal),
    items: items.map((i) => i.name),
  })
}

async function handleQuickAdd(args: any, userId: string) {
  const cal = Number(args.calories) || 0
  const p = Number(args.proteinG) || 0
  const c = Number(args.carbsG) || 0
  const f = Number(args.fatG) || 0

  const item = {
    name: String(args.name),
    servingSize: 1,
    servingUnit: 'porsiyon',
    quantity: 1,
    calories: cal,
    proteinG: p,
    carbsG: c,
    fatG: f,
    source: 'quick' as const,
  }

  const log = await db.mealLog.create({
    data: {
      userId,
      mealType: args.mealType,
      items: [item] as any,
      loggedAt: new Date(),
      source: 'quick_add',
      totalCalories: cal,
      totalProteinG: p,
      totalCarbsG: c,
      totalFatG: f,
    },
  })

  return JSON.stringify({ success: true, mealLogId: log.id, addedCalories: cal })
}

async function handleDeleteLastMeal(args: any, userId: string) {
  const where: any = { userId }
  if (args?.mealType) where.mealType = args.mealType

  const last = await db.mealLog.findFirst({ where, orderBy: { loggedAt: 'desc' } })
  if (!last) return JSON.stringify({ success: false, error: 'no_meal_to_delete' })

  await db.mealLog.delete({ where: { id: last.id } })
  return JSON.stringify({
    success: true,
    deleted: { id: last.id, mealType: last.mealType, calories: Math.round(last.totalCalories) },
  })
}

async function handleDeleteMealItem(args: any, userId: string) {
  const { start, end } = dayBounds()
  const logs = await db.mealLog.findMany({
    where: { userId, mealType: args.mealType, loggedAt: { gte: start, lte: end } },
    orderBy: { loggedAt: 'desc' },
  })

  for (const log of logs) {
    const items = (log.items as any[]) ?? []
    const matchIdx = items.findIndex((i: any) =>
      String(i.name).toLowerCase().includes(String(args.itemName).toLowerCase())
    )
    if (matchIdx >= 0) {
      const removedItem = items[matchIdx]
      const newItems = items.filter((_, i) => i !== matchIdx)
      if (newItems.length === 0) {
        await db.mealLog.delete({ where: { id: log.id } })
      } else {
        const totals = newItems.reduce(
          (a, it) => ({
            cal: a.cal + (Number(it.calories) || 0) * (Number(it.quantity) || 1),
            p: a.p + (Number(it.proteinG) || 0) * (Number(it.quantity) || 1),
            c: a.c + (Number(it.carbsG) || 0) * (Number(it.quantity) || 1),
            f: a.f + (Number(it.fatG) || 0) * (Number(it.quantity) || 1),
          }),
          { cal: 0, p: 0, c: 0, f: 0 }
        )
        await db.mealLog.update({
          where: { id: log.id },
          data: {
            items: newItems as any,
            totalCalories: totals.cal,
            totalProteinG: totals.p,
            totalCarbsG: totals.c,
            totalFatG: totals.f,
          },
        })
      }
      return JSON.stringify({ success: true, removed: removedItem.name })
    }
  }

  return JSON.stringify({ success: false, error: 'item_not_found' })
}

// ============ HEDEF HANDLERS ============

async function handleSetCalorieGoal(args: any, userId: string) {
  const cal = Math.round(Number(args.dailyCalories) || 0)
  if (cal < 800 || cal > 8000) return JSON.stringify({ success: false, error: 'out_of_range' })

  const existing = await db.nutritionGoal.findUnique({ where: { userId } })
  if (existing) {
    await db.nutritionGoal.update({ where: { userId }, data: { dailyCalories: cal } })
  } else {
    // İlk kez hedef koyuyor — varsayılan makro dağılımı
    await db.nutritionGoal.create({
      data: {
        userId,
        dailyCalories: cal,
        proteinG: Math.round((cal * 0.3) / 4),
        carbsG: Math.round((cal * 0.4) / 4),
        fatG: Math.round((cal * 0.3) / 9),
      },
    })
  }
  return JSON.stringify({ success: true, dailyCalories: cal })
}

async function handleSetMacroGoals(args: any, userId: string) {
  const p = Math.round(Number(args.proteinG) || 0)
  const c = Math.round(Number(args.carbsG) || 0)
  const f = Math.round(Number(args.fatG) || 0)

  const existing = await db.nutritionGoal.findUnique({ where: { userId } })
  if (!existing) return JSON.stringify({ success: false, error: 'no_goal_yet' })

  await db.nutritionGoal.update({
    where: { userId },
    data: { proteinG: p, carbsG: c, fatG: f },
  })
  return JSON.stringify({ success: true, proteinG: p, carbsG: c, fatG: f })
}

async function handleAutoCalculateGoal(args: any, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return JSON.stringify({ success: false, error: 'user_not_found' })

  // Onboarding'den weight/height/age/sex/activity al — User modelinde varsa
  const weight = (user as any).weightKg ?? null
  const height = (user as any).heightCm ?? null
  const age = (user as any).age ?? null
  const sex = (user as any).sex ?? 'male'

  if (!weight || !height || !age) {
    return JSON.stringify({
      success: false,
      error: 'missing_profile_data',
      message: 'Profil bilgilerin eksik (kilo, boy, yaş gerekli). Önce profilinden bunları ekle.',
    })
  }

  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5

  const tdee = Math.round(bmr * 1.55) // moderate activity

  let dailyCalories = tdee
  if (args.goalType === 'lose') dailyCalories = tdee - 500
  if (args.goalType === 'gain') dailyCalories = tdee + 300

  const protein = Math.round((dailyCalories * 0.3) / 4)
  const carbs = Math.round((dailyCalories * 0.4) / 4)
  const fat = Math.round((dailyCalories * 0.3) / 9)

  await db.nutritionGoal.upsert({
    where: { userId },
    create: {
      userId,
      dailyCalories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      goalType: args.goalType,
      bmr,
      tdee,
    },
    update: {
      dailyCalories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      goalType: args.goalType,
      bmr,
      tdee,
    },
  })

  return JSON.stringify({
    success: true,
    dailyCalories,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    bmr: Math.round(bmr),
    tdee,
  })
}

// ============ SORGU HANDLERS ============

async function handleQueryTodaySummary(userId: string) {
  const { start, end } = dayBounds()
  const [logs, goal] = await Promise.all([
    db.mealLog.findMany({ where: { userId, loggedAt: { gte: start, lte: end } } }),
    db.nutritionGoal.findUnique({ where: { userId } }),
  ])

  const totals = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  return JSON.stringify({
    success: true,
    totalCalories: Math.round(totals.cal),
    totalProteinG: Math.round(totals.p),
    totalCarbsG: Math.round(totals.c),
    totalFatG: Math.round(totals.f),
    mealCount: logs.length,
    goal: goal
      ? {
          dailyCalories: goal.dailyCalories,
          proteinG: goal.proteinG,
          carbsG: goal.carbsG,
          fatG: goal.fatG,
        }
      : null,
  })
}

async function handleQueryHistory(args: any, userId: string) {
  const date = new Date(args.date)
  if (isNaN(date.getTime())) return JSON.stringify({ success: false, error: 'invalid_date' })

  const { start, end } = dayBounds(date)
  const logs = await db.mealLog.findMany({ where: { userId, loggedAt: { gte: start, lte: end } } })

  const totals = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  const byMeal: Record<string, any[]> = {}
  for (const l of logs) {
    const t = l.mealType
    if (!byMeal[t]) byMeal[t] = []
    const items = (l.items as any[]) ?? []
    byMeal[t].push(...items.map((i) => i.name))
  }

  return JSON.stringify({
    success: true,
    date: args.date,
    totalCalories: Math.round(totals.cal),
    totalProteinG: Math.round(totals.p),
    totalCarbsG: Math.round(totals.c),
    totalFatG: Math.round(totals.f),
    meals: byMeal,
  })
}

async function handleQueryRemaining(userId: string) {
  const { start, end } = dayBounds()
  const [logs, goal] = await Promise.all([
    db.mealLog.findMany({ where: { userId, loggedAt: { gte: start, lte: end } } }),
    db.nutritionGoal.findUnique({ where: { userId } }),
  ])

  if (!goal) return JSON.stringify({ success: false, error: 'no_goal_set' })

  const totals = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  return JSON.stringify({
    success: true,
    remainingCalories: Math.round(goal.dailyCalories - totals.cal),
    remainingProteinG: Math.round(goal.proteinG - totals.p),
    remainingCarbsG: Math.round(goal.carbsG - totals.c),
    remainingFatG: Math.round(goal.fatG - totals.f),
  })
}

async function handleQueryBreakdown(args: any, userId: string) {
  const { start, end } = dayBounds()
  const logs = await db.mealLog.findMany({
    where: { userId, mealType: args.mealType, loggedAt: { gte: start, lte: end } },
  })

  const allItems = logs.flatMap((l) =>
    ((l.items as any[]) ?? []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity ?? 1,
      servingSize: i.servingSize,
      servingUnit: i.servingUnit,
      calories: Math.round((i.calories ?? 0) * (i.quantity ?? 1)),
    }))
  )

  const totalCal = logs.reduce((s, l) => s + l.totalCalories, 0)

  return JSON.stringify({
    success: true,
    mealType: args.mealType,
    items: allItems,
    totalCalories: Math.round(totalCal),
  })
}

async function handleQueryStreak(userId: string) {
  // Son 30 günlük log'lara bakıp hedefin %80-120 arasında olanları sayar
  const goal = await db.nutritionGoal.findUnique({ where: { userId } })
  if (!goal) return JSON.stringify({ success: false, error: 'no_goal_set' })

  const since = new Date()
  since.setDate(since.getDate() - 30)
  since.setHours(0, 0, 0, 0)
  const logs = await db.mealLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: 'desc' },
  })

  // Günlük gruplama
  const dayMap = new Map<string, number>()
  for (const l of logs) {
    const key = l.loggedAt.toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) ?? 0) + l.totalCalories)
  }

  // Bugünden geriye dönük streak say
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const cal = dayMap.get(key) ?? 0
    const ratio = cal / goal.dailyCalories
    if (ratio >= 0.8 && ratio <= 1.2) streak++
    else if (i > 0) break // Bugün hariç ilk başarısızlıkta bitir
  }

  return JSON.stringify({ success: true, streakDays: streak })
}

// ============ AI ÖNERİSİ HANDLERS ============

async function handleSearchFood(args: any, userId: string) {
  const q = String(args.query).trim()
  if (q.length < 2) return JSON.stringify({ success: false, error: 'query_too_short' })

  const customs = await db.customFood.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 5,
  })

  const results = customs.map((c) => ({
    source: 'custom',
    name: c.name,
    brand: c.brand,
    servingSize: c.servingSize,
    servingUnit: c.servingUnit,
    calories: c.calories,
    proteinG: c.proteinG,
    carbsG: c.carbsG,
    fatG: c.fatG,
  }))

  return JSON.stringify({ success: true, query: q, results })
}

async function handleAddFavorite(args: any, userId: string) {
  const name = String(args.name).trim()

  // Kullanıcının custom food'larında ara
  const custom = await db.customFood.findFirst({
    where: { userId, name: { contains: name, mode: 'insensitive' } },
  })

  if (!custom) return JSON.stringify({ success: false, error: 'food_not_found' })

  const existing = await db.favoriteFood.findFirst({
    where: { userId, customFoodId: custom.id },
  })
  if (existing) return JSON.stringify({ success: true, alreadyFavorited: true })

  await db.favoriteFood.create({
    data: {
      userId,
      customFoodId: custom.id,
      name: custom.name,
      brand: custom.brand,
      photoUrl: custom.photoUrl,
      servingSize: custom.servingSize,
      servingUnit: custom.servingUnit,
      calories: custom.calories,
      proteinG: custom.proteinG,
      carbsG: custom.carbsG,
      fatG: custom.fatG,
    },
  })

  return JSON.stringify({ success: true, favorited: custom.name })
}

async function handleSuggestMeal(args: any, userId: string) {
  const { start, end } = dayBounds()
  const [logs, goal] = await Promise.all([
    db.mealLog.findMany({ where: { userId, loggedAt: { gte: start, lte: end } } }),
    db.nutritionGoal.findUnique({ where: { userId } }),
  ])

  const totals = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  if (!goal) return JSON.stringify({ success: false, error: 'no_goal_set' })

  const remCal = goal.dailyCalories - totals.cal
  const remP = goal.proteinG - totals.p
  const remC = goal.carbsG - totals.c
  const remF = goal.fatG - totals.f

  // AI'ya öneri istetmek yerine kalan makrolara göre programatik öneri
  // (LLM zaten ana cevabı verirken bu veriyi tool sonucu olarak alıp önerebilir)
  return JSON.stringify({
    success: true,
    remainingCalories: Math.round(remCal),
    remainingProteinG: Math.round(remP),
    remainingCarbsG: Math.round(remC),
    remainingFatG: Math.round(remF),
    mealType: args.mealType ?? getMealTypeFromTime(),
    suggestion: 'AI bu verilere göre 3 yemek önerebilir',
  })
}

async function handleAnalyzeNutrition(userId: string) {
  const { start, end } = dayBounds()
  const [logs, goal] = await Promise.all([
    db.mealLog.findMany({ where: { userId, loggedAt: { gte: start, lte: end } } }),
    db.nutritionGoal.findUnique({ where: { userId } }),
  ])

  const totals = logs.reduce(
    (a, l) => ({
      cal: a.cal + l.totalCalories,
      p: a.p + l.totalProteinG,
      c: a.c + l.totalCarbsG,
      f: a.f + l.totalFatG,
      fiber: a.fiber + l.totalFiberG,
      sugar: a.sugar + l.totalSugarG,
      sodium: a.sodium + l.totalSodiumMg,
    }),
    { cal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sodium: 0 }
  )

  const observations: string[] = []
  if (goal) {
    const calRatio = totals.cal / goal.dailyCalories
    if (calRatio < 0.5) observations.push('kalori_düşük')
    else if (calRatio > 1.1) observations.push('kalori_yüksek')

    if (totals.p < goal.proteinG * 0.7) observations.push('protein_düşük')
    if (totals.f < goal.fatG * 0.5) observations.push('yağ_düşük')
  }

  if (totals.sugar > 50) observations.push('şeker_yüksek')
  if (totals.sodium > 2300) observations.push('sodyum_yüksek')
  if (totals.fiber < 15 && logs.length >= 2) observations.push('lif_düşük')

  return JSON.stringify({
    success: true,
    totals: {
      cal: Math.round(totals.cal),
      protein: Math.round(totals.p),
      carbs: Math.round(totals.c),
      fat: Math.round(totals.f),
      fiber: Math.round(totals.fiber),
      sugar: Math.round(totals.sugar),
      sodium: Math.round(totals.sodium),
    },
    observations,
    mealCount: logs.length,
  })
}

// ============ MUTFAK/TARİF/ŞABLON HANDLERS ============

async function handleAddPantryItem(args: any, userId: string) {
  const days = args.shelfLifeDays ? Number(args.shelfLifeDays) : null
  const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null

  const item = await db.pantryItem.create({
    data: {
      userId,
      name: String(args.name),
      category: args.category ?? 'diğer',
      quantity: Number(args.quantity) || 1,
      unit: args.unit ?? 'adet',
      expiresAt,
      source: 'manual',
    },
  })

  return JSON.stringify({ success: true, itemId: item.id, name: item.name })
}

async function handleQueryPantry(userId: string) {
  const items = await db.pantryItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return JSON.stringify({
    success: true,
    count: items.length,
    items: items.slice(0, 20).map((i) => ({
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      expiresInDays: i.expiresAt
        ? Math.ceil((new Date(i.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : null,
    })),
  })
}

async function handleFindRecipesFromPantry(userId: string) {
  const items = await db.pantryItem.findMany({ where: { userId }, take: 20 })
  return JSON.stringify({
    success: true,
    pantryItems: items.map((i) => i.name),
    suggestion: 'AI bu malzemelerle 3 tarif önerebilir',
  })
}

async function handleApplyRecipe(args: any, userId: string) {
  const recipe = await db.recipe.findFirst({
    where: { userId, name: { contains: String(args.recipeName), mode: 'insensitive' } },
    include: { ingredients: true },
  })
  if (!recipe) return JSON.stringify({ success: false, error: 'recipe_not_found' })

  const servings = Number(args.servings) || 1
  const items = recipe.ingredients.map((ing) => ({
    name: ing.name,
    servingSize: (ing.quantity / recipe.servings) * servings,
    servingUnit: ing.unit,
    quantity: 1,
    calories: (ing.calories / recipe.servings) * servings,
    proteinG: (ing.proteinG / recipe.servings) * servings,
    carbsG: (ing.carbsG / recipe.servings) * servings,
    fatG: (ing.fatG / recipe.servings) * servings,
    source: 'recipe' as const,
  }))

  const totals = items.reduce(
    (a, i) => ({
      cal: a.cal + i.calories,
      p: a.p + i.proteinG,
      c: a.c + i.carbsG,
      f: a.f + i.fatG,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )

  await db.mealLog.create({
    data: {
      userId,
      mealType: args.mealType,
      items: items as any,
      loggedAt: new Date(),
      source: 'manual',
      totalCalories: totals.cal,
      totalProteinG: totals.p,
      totalCarbsG: totals.c,
      totalFatG: totals.f,
    },
  })

  await db.recipe.update({
    where: { id: recipe.id },
    data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
  })

  return JSON.stringify({
    success: true,
    recipeName: recipe.name,
    servingsApplied: servings,
    totalCalories: Math.round(totals.cal),
  })
}

async function handleApplyTemplate(args: any, userId: string) {
  const tpl = await db.mealTemplate.findFirst({
    where: { userId, name: { contains: String(args.templateName), mode: 'insensitive' } },
  })
  if (!tpl) return JSON.stringify({ success: false, error: 'template_not_found' })

  await db.mealLog.create({
    data: {
      userId,
      mealType: args.mealType,
      items: tpl.items as any,
      loggedAt: new Date(),
      source: 'template',
      totalCalories: tpl.totalCalories,
      totalProteinG: tpl.totalProteinG,
      totalCarbsG: tpl.totalCarbsG,
      totalFatG: tpl.totalFatG,
    },
  })

  await db.mealTemplate.update({
    where: { id: tpl.id },
    data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
  })

  return JSON.stringify({ success: true, templateName: tpl.name, totalCalories: tpl.totalCalories })
}

// ─────────────── DIET HANDLERS ───────────────

async function handleListDietPresets() {
  const presets = await db.dietPreset.findMany({
    orderBy: [{ popularityScore: 'desc' }, { name: 'asc' }],
    select: {
      slug: true,
      name: true,
      tagline: true,
      defaultDurationDays: true,
      proteinPct: true,
      carbsPct: true,
      fatPct: true,
      evidenceLevel: true,
    },
  })
  return JSON.stringify({
    success: true,
    presets: presets.map((p) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      defaultDays: p.defaultDurationDays,
      macros: `${p.proteinPct}P / ${p.carbsPct}K / ${p.fatPct}Y`,
      evidence: p.evidenceLevel,
    })),
  })
}

async function handleStartDietPlan(args: any, userId: string) {
  const slug = String(args.presetSlug || '')
    .toLowerCase()
    .trim()
  if (!slug) return JSON.stringify({ success: false, error: 'presetSlug_required' })

  // Internal start endpoint'i çağırmak yerine direkt /api/diet/start path'inde olduğu gibi yap
  const preset = await db.dietPreset.findUnique({ where: { slug } })
  if (!preset) return JSON.stringify({ success: false, error: 'preset_not_found', slug })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const durationDays = Number(args.durationDays) || preset.defaultDurationDays
  const endsAt = new Date(today)
  endsAt.setDate(endsAt.getDate() + durationDays)

  // Kalori hesabı — sadece formula tipine göre, ek query yapma
  const [type, valStr] = preset.calorieFormula.split(':')
  const val = Number(valStr)
  let dailyCalories = 2000
  if (type === 'fixed') {
    dailyCalories = Math.round(val)
  } else {
    // perKg / tdee için profile gerekli ama paralel çek
    const [profile, metrics] = await Promise.all([
      db.userBasicProfile.findUnique({ where: { userId } }).catch(() => null),
      db.userHealthMetrics.findUnique({ where: { userId } }).catch(() => null),
    ])
    const weight = metrics?.weightKg ?? 75
    const height = metrics?.heightCm ?? 170
    const age = profile?.birthDate
      ? Math.max(
          18,
          Math.floor(
            (Date.now() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          )
        )
      : 28
    const sex = profile?.gender ?? 'male'
    if (type === 'perKg') dailyCalories = Math.round(weight * val)
    else {
      const bmr =
        sex === 'female'
          ? 10 * weight + 6.25 * height - 5 * age - 161
          : 10 * weight + 6.25 * height - 5 * age + 5
      dailyCalories = Math.round(bmr * 1.55 * val)
    }
  }

  const proteinG = Math.round((dailyCalories * preset.proteinPct) / 100 / 4)
  const carbsG = Math.round((dailyCalories * preset.carbsPct) / 100 / 4)
  const fatG = Math.round((dailyCalories * preset.fatPct) / 100 / 9)

  // Eski planı sil + plan snapshot al — paralel
  const [, prevGoal] = await Promise.all([
    db.activeDietPlan.deleteMany({ where: { userId } }),
    db.nutritionGoal.findUnique({ where: { userId } }),
  ])

  const plan = await db.activeDietPlan.create({
    data: {
      userId,
      presetId: preset.id,
      name: preset.name,
      accentColor: preset.accentColor,
      heroImageUrl: preset.heroImageUrl,
      startedAt: today,
      durationDays,
      endsAt,
      status: 'active',
      dailyCalories,
      proteinG,
      carbsG,
      fatG,
      rules: preset.rules as any,
      mealPool: preset.mealPool as any,
      aiGenerated: false,
      previousGoalSnapshot: (prevGoal as any) ?? {},
    },
  })

  // Day menus + nutrition goal upsert paralel
  const mealPool = preset.mealPool as any
  const MEAL_TYPES_LIST = ['breakfast', 'lunch', 'dinner', 'snack'] as const
  const rows: any[] = []
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    for (const mealType of MEAL_TYPES_LIST) {
      const pool = (mealPool[mealType] ?? []) as any[]
      if (pool.length === 0) continue
      const key = `${dateStr}-${mealType}`
      let hash = 0
      for (let j = 0; j < key.length; j++) hash = (hash * 31 + key.charCodeAt(j)) & 0xffffffff
      const meal = pool[Math.abs(hash) % pool.length]
      const items = meal.items
      rows.push({
        planId: plan.id,
        date: dateStr,
        mealType,
        items,
        totalCalories: items.reduce((a: number, it: any) => a + it.calories * it.quantity, 0),
        totalProteinG: items.reduce((a: number, it: any) => a + it.proteinG * it.quantity, 0),
        totalCarbsG: items.reduce((a: number, it: any) => a + it.carbsG * it.quantity, 0),
        totalFatG: items.reduce((a: number, it: any) => a + it.fatG * it.quantity, 0),
      })
    }
  }

  await Promise.all([
    db.dietDayMenu.createMany({ data: rows, skipDuplicates: true }),
    db.nutritionGoal.upsert({
      where: { userId },
      update: { dailyCalories, proteinG, carbsG, fatG },
      create: { userId, dailyCalories, proteinG, carbsG, fatG },
    }),
  ])

  return JSON.stringify({
    success: true,
    planName: preset.name,
    durationDays,
    dailyCalories,
    macros: { proteinG, carbsG, fatG },
  })
}

async function handleStopDietPlan(userId: string) {
  const plan = await db.activeDietPlan.findUnique({ where: { userId } })
  if (!plan) return JSON.stringify({ success: false, error: 'no_active_plan' })

  await db.activeDietPlan.update({
    where: { userId },
    data: { status: 'stopped' },
  })

  if (plan.previousGoalSnapshot && typeof plan.previousGoalSnapshot === 'object') {
    const snap = plan.previousGoalSnapshot as any
    if (snap.dailyCalories) {
      await db.nutritionGoal.upsert({
        where: { userId },
        update: {
          dailyCalories: snap.dailyCalories,
          proteinG: snap.proteinG,
          carbsG: snap.carbsG,
          fatG: snap.fatG,
        },
        create: {
          userId,
          dailyCalories: snap.dailyCalories,
          proteinG: snap.proteinG ?? 0,
          carbsG: snap.carbsG ?? 0,
          fatG: snap.fatG ?? 0,
        },
      })
    }
  }

  return JSON.stringify({ success: true, planName: plan.name })
}

async function handleApplyDietDay(userId: string) {
  const plan = await db.activeDietPlan.findUnique({ where: { userId } })
  if (!plan) return JSON.stringify({ success: false, error: 'no_active_plan' })

  const today = new Date().toISOString().slice(0, 10)
  const menus = await db.dietDayMenu.findMany({
    where: { planId: plan.id, date: today, appliedAt: null },
  })
  if (menus.length === 0)
    return JSON.stringify({
      success: true,
      applied: 0,
      message: 'Bugünün öğünleri zaten uygulanmış.',
    })

  const loggedAt = new Date()
  const results = await Promise.all(
    menus.map(async (menu) => {
      const items = menu.items as any[]
      const totalCalories = items.reduce((s, it) => s + it.calories * it.quantity, 0)
      const totalProteinG = items.reduce((s, it) => s + it.proteinG * it.quantity, 0)
      const totalCarbsG = items.reduce((s, it) => s + it.carbsG * it.quantity, 0)
      const totalFatG = items.reduce((s, it) => s + it.fatG * it.quantity, 0)

      const mealLog = await db.mealLog.create({
        data: {
          userId,
          loggedAt,
          mealType: menu.mealType,
          source: 'diet_plan',
          items: items.map((it) => ({
            name: it.name,
            servingSize: it.servingSize,
            servingUnit: it.servingUnit,
            quantity: it.quantity,
            calories: it.calories,
            proteinG: it.proteinG,
            carbsG: it.carbsG,
            fatG: it.fatG,
            source: 'diet_plan' as const,
          })),
          totalCalories,
          totalProteinG,
          totalCarbsG,
          totalFatG,
        },
      })
      await db.dietDayMenu.update({
        where: { id: menu.id },
        data: { appliedAt: loggedAt, appliedMealLogId: mealLog.id },
      })
      return mealLog.id
    })
  )

  return JSON.stringify({ success: true, applied: results.length })
}

async function handleQueryActiveDiet(userId: string) {
  const plan = await db.activeDietPlan.findUnique({
    where: { userId },
    include: { dayMenus: { where: { date: new Date().toISOString().slice(0, 10) } } },
  })
  if (!plan) return JSON.stringify({ active: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(plan.startedAt)
  start.setHours(0, 0, 0, 0)
  const dayNumber = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1

  return JSON.stringify({
    active: true,
    name: plan.name,
    dayNumber: Math.min(dayNumber, plan.durationDays),
    totalDays: plan.durationDays,
    dailyCalories: plan.dailyCalories,
    macros: { proteinG: plan.proteinG, carbsG: plan.carbsG, fatG: plan.fatG },
    todayMenus: plan.dayMenus.map((m: any) => ({
      mealType: m.mealType,
      mealName: (m.items as any[])?.[0]?.name,
      kcal: m.totalCalories,
      applied: !!m.appliedAt,
    })),
  })
}

// ─────────────── ENDPOINT ───────────────

export async function POST(req: NextRequest) {
  const totalTimeoutSignal = AbortSignal.timeout(TOTAL_REQUEST_TIMEOUT_MS)

  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitResponse = await withAiRateLimit(clerkId)
    if (rateLimitResponse) return rateLimitResponse

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { message, conversationHistory = [] } = body as {
      message: string
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message?.trim()) return NextResponse.json({ error: 'message gerekli' }, { status: 400 })

    // Context oluştur
    const ctx = await buildContext(user.id)
    const profileText = formatProfile(ctx)

    const firstName = (user.name || '').trim().split(/\s+/)[0] || ''
    const namePart = firstName ? `KULLANICI: ${firstName}\n\n` : ''

    // İlk LLM çağrısı: tool seçimi
    const messages: any[] = [
      {
        role: 'system',
        content:
          SYSTEM_PROMPT_BASE + '\n\n' + namePart + '=== KULLANICI PROFİLİ ===\n' + profileText,
      },
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    let response
    try {
      response = await openai.chat.completions.create(
        {
          model: AI_MODEL,
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.6,
        },
        { signal: AbortSignal.timeout(OPENAI_INITIAL_TIMEOUT_MS) }
      )
    } catch (err: any) {
      if (totalTimeoutSignal.aborted || err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT') {
        return NextResponse.json({ reply: FRIENDLY_TIMEOUT_REPLY, action: { type: 'asked' } })
      }
      console.error('[nutrition-command] OpenAI initial error:', err)
      return NextResponse.json({ reply: FRIENDLY_OPENAI_ERROR_REPLY, action: { type: 'asked' } })
    }

    const choice = response.choices[0]
    const toolCalls = choice.message.tool_calls

    // Tool çağrısı yoksa direkt cevap
    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({
        reply: choice.message.content ?? '',
        action: { type: 'asked' },
      })
    }

    // Tool'ları çalıştır
    messages.push(choice.message)

    let firstActionType: string = 'asked'
    for (const tc of toolCalls) {
      if (tc.type !== 'function') continue
      const args = (() => {
        try {
          return JSON.parse(tc.function.arguments || '{}')
        } catch {
          return {}
        }
      })()

      const result = await executeTool(tc.function.name, args, user.id)
      const parsed = (() => {
        try {
          return JSON.parse(result)
        } catch {
          return {}
        }
      })() as any
      if (parsed.success) firstActionType = tc.function.name

      messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
    }

    // İkinci LLM çağrısı: tool sonuçlarını özetle
    let followup
    try {
      followup = await openai.chat.completions.create(
        {
          model: AI_MODEL,
          messages,
          temperature: 0.6,
        },
        { signal: AbortSignal.timeout(OPENAI_FOLLOWUP_TIMEOUT_MS) }
      )
    } catch (err: any) {
      if (totalTimeoutSignal.aborted || err?.name === 'TimeoutError') {
        return NextResponse.json({
          reply: 'İşlem yapıldı ama özetleme yavaş kaldı.',
          action: { type: firstActionType },
        })
      }
      console.error('[nutrition-command] OpenAI followup error:', err)
      return NextResponse.json({ reply: 'Tamamdır.', action: { type: firstActionType } })
    }

    const finalText = followup.choices[0]?.message?.content ?? 'Tamamdır.'
    return NextResponse.json({
      reply: finalText,
      action: { type: firstActionType },
    })
  } catch (err: any) {
    console.error('[nutrition-command] FATAL:', err?.message, err?.stack)
    return NextResponse.json({ reply: FRIENDLY_GENERIC_REPLY, action: { type: 'asked' } })
  }
}
