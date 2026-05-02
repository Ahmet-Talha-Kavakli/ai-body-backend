import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai, AI_MODEL } from '@/lib/ai/client'
import { db } from '@/lib/db/client'
import { withAiRateLimit } from '@/lib/redis/ratelimit-middleware'
import { queryHistoryForDate } from '@/app/api/calendar/history/route'

const VALID_REGIONS = [
  'head',
  'hair',
  'neck',
  'trapezius',
  'chest',
  'deltoids',
  'biceps',
  'triceps',
  'forearm',
  'hands',
  'abs',
  'obliques',
  'upper-back',
  'lower-back',
  'gluteal',
  'adductors',
  'quadriceps',
  'hamstring',
  'knees',
  'calves',
  'tibialis',
  'ankles',
  'feet',
]

const VALID_MARK_TYPES = [
  'injury',
  'pain',
  'scar',
  'missing',
  'surgery',
  'tightness',
  'chronic_region',
]
const VALID_ALLERGY_CATEGORIES = ['drug', 'food', 'environmental', 'contact', 'insect', 'other']
const VALID_ALLERGY_SEVERITIES = ['mild', 'moderate', 'severe', 'anaphylactic']
const VALID_CHRONIC_CATEGORIES = [
  'metabolic',
  'cardiovascular',
  'respiratory',
  'digestive',
  'musculoskeletal',
  'neurological',
  'autoimmune',
  'hormonal',
  'blood',
  'mental',
  'other',
]
const VALID_CHRONIC_SEVERITIES = ['mild', 'moderate', 'severe']
const VALID_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const VALID_SUBSTANCE_TYPES = [
  'smoking',
  'alcohol',
  'caffeine',
  'vape',
  'chewing_tobacco',
  'cannabis',
  'other',
]
const VALID_SUBSTANCE_STATUS = ['active', 'quitting', 'quit']
const VALID_SUBSTANCE_FREQUENCY = ['daily', 'weekly', 'occasional', 'rarely']

const VALID_HEALTH_EVENT_TYPES = [
  'diarrhea',
  'constipation',
  'migraine',
  'headache',
  'nausea',
  'fever',
  'cough',
  'dizziness',
  'flu',
  'stomachache',
  'back_pain_episode',
  'allergic_reaction',
  'fatigue',
  'other',
]
const VALID_TRIGGERS = [
  'food',
  'stress',
  'sleep',
  'weather',
  'menstruation',
  'alcohol',
  'caffeine',
  'medication',
  'exercise',
  'unknown',
]
const VALID_TREATMENTS = [
  'paracetamol',
  'ibuprofen',
  'antibiotic',
  'rest',
  'water',
  'hot_compress',
  'cold_compress',
  'probiotic',
  'doctor',
  'other',
]

// ─────────────── Timeout sabitleri ───────────────
// Apple kalitesi için kullanıcı asla sonsuza dek beklemez.
const OPENAI_INITIAL_TIMEOUT_MS = 15_000 // ilk LLM çağrısı (tool seçimi)
const OPENAI_FOLLOWUP_TIMEOUT_MS = 10_000 // tool sonrası özetleme çağrısı
const TOTAL_REQUEST_TIMEOUT_MS = 35_000 // tüm endpoint için katı üst sınır

// Friendly graceful degradation cevapları (status 200 — mobile bunları
// "error" olarak işaretlemesin, normal bubble olarak göstersin).
const FRIENDLY_TIMEOUT_REPLY = 'Bağlantı biraz yavaş, tekrar dener misin?'
const FRIENDLY_OPENAI_ERROR_REPLY = 'Hmm, biraz takıldım. Tekrar dener misin?'
const FRIENDLY_DB_ERROR_REPLY = 'Kayıt sırasında bir sorun oluştu, tekrar dener misin?'
const FRIENDLY_GENERIC_REPLY = 'Bir hata oluştu, tekrar dener misin?'

const SYSTEM_PROMPT = `Sen FitAI uygulamasının kişisel sağlık asistanısın. Adın "FitAI Asistan". Kullanıcının kendi sağlık partneri olarak yanındasın — onun yaralanmalarını, alerjilerini, kronik hastalıklarını, kan grubunu ve genel sağlık durumunu birlikte takip edersiniz.

KİMLİĞİN:
- FitAI uygulamasının tıbbi asistanısın, bağımsız bir AI değil. "FitAI'da senin sağlık partnerinim" gibi konuşabilirsin.
- Kullanıcı seni vücut/sağlık sayfasından çağırıyor — görevin, onun tıbbi profilini birlikte yönetmek.
- Tıbbi tanı koymazsın, doktor değilsin. Ama kullanıcının verilerini saygıyla, samimiyetle ve dikkatle tutarsın.
- Kullanıcının sağlık geçmişine "senin profilinde", "kayıtlarında" diye atıfta bulun — bu veriler ona ait, sen sadece tutuyorsun.
- SADECE Türkçe konuşursun. Samimi, sıcak, ama gereksiz uzatmadan. Sen onun sağlık günlüğünü tutan akıllı bir partnersin.

Kullanabileceğin araçlar (function calling):
- add_body_mark: Vücut işareti (yaralanma, ağrı, sızı, iz, ameliyat) ekler
- add_allergy: Alerji ekler
- add_chronic_condition: Kronik hastalık ekler
- set_blood_type: Kan grubunu kaydeder (EmergencyInfo)
- update_body_mark: Mevcut bir işareti günceller (örn. "iyileşti")
- delete_body_mark: Mevcut bir işareti siler
- add_substance: Bağımlılık / madde kullanımı ekler (sigara, alkol, kafein, vape, esrar, vb.). Kullanıcı "günde 1 paket sigara içiyorum" derse → type=smoking, status=active, amountPerDay=1, unit=pack. "Bıraktım" → status=quit.
- add_health_event: Geçici/akut hastalık ekler (ishal, kabızlık, migren, ateş, üşütme, vb.). Kullanıcı "bugün başım ağrıyor" derse → type=headache, severity (kullanıcının söylediğine göre), startDate=şimdi.
- resolve_health_event: Mevcut bir hastalığı "geçti" olarak işaretler — endDate ekler ve isActive=false yapar. Doğru ID'yi PROFİL bölümünden bul.
- query_history: Belirli bir tarihte kullanıcının sağlık durumunu sorgular. "24 ocakta neyim vardı", "geçen hafta neredeydim", "Mart başında migrenim var mıydı" gibi sorularda kullan. Tarihi YYYY-MM-DD formatında ver.

TARİH SORULARI (geçmiş):
- Kullanıcı "24 ocakta neyim vardı", "geçen hafta", "3 gün önce" gibi belirli bir tarih sorduğunda query_history tool'unu çağır.
- BUGÜNÜN TARİHİ sistem mesajının başında verilir — relatif tarihleri (dün, geçen hafta, 3 gün önce) buna göre hesapla.
- Tool sonucunu doğal cümlelerle özetle: "24 ocakta migren atağın vardı, 2 gün sürdü. Aktif ilacın Parol'dü."
- Veri yoksa: "O tarihte kayıtlı bir şey göremiyorum."

ZAMAN KISITI (kayıt eklerken — KESİN KURAL):
- add_body_mark, add_allergy, add_chronic_condition, add_substance, add_health_event tool'larını SADECE şu an / bugün için kullan.
- GEÇMİŞ kayıt isteği ("geçen hafta migren oldum", "dün başım ağrıdı", "3 ay önce ameliyat oldum") → reddet: "Geçmişe dönük kayıt ekleyemem — sadece şu an için kayıt tutabiliyorum."
- GELECEK kayıt isteği ("yarın doktora gideceğim", "haftaya başım ağrıyacak") → reddet: "Gelecek için kayıt ekleyemem — sadece şu an için kayıt tutabiliyorum."
- "Dün/yarın" gibi açık tarihli ifadelerde tool ÇAĞIRMA, sohbette nazikçe açıkla.
- İstisna: tarih BELİRTİLMEMİŞSE direkt bugün için ekle (zaten varsayılan davranış).
- Geçmişe dair sadece query_history (okuma) yapabilirsin, yazma yapamazsın.

Geçerli vücut bölgeleri (region slug'ları):
${VALID_REGIONS.join(', ')}

Vücut işareti type değerleri: ${VALID_MARK_TYPES.join(', ')}
Severity (şiddet): 1 (hafif) - 4 (çok şiddetli) arası tam sayı.
Side (taraf): "left", "right" veya null.

Alerji kategorileri: ${VALID_ALLERGY_CATEGORIES.join(', ')}
Alerji şiddet: ${VALID_ALLERGY_SEVERITIES.join(', ')}

Kronik hastalık kategorileri: ${VALID_CHRONIC_CATEGORIES.join(', ')}
Kronik şiddet: ${VALID_CHRONIC_SEVERITIES.join(', ')}

Kan grupları: ${VALID_BLOOD_TYPES.join(', ')}

Bağımlılık türleri: ${VALID_SUBSTANCE_TYPES.join(', ')}
Bağımlılık durumu: ${VALID_SUBSTANCE_STATUS.join(', ')} (active=devam, quitting=bırakıyor, quit=bıraktı)
Bağımlılık sıklığı: ${VALID_SUBSTANCE_FREQUENCY.join(', ')}

KRİTİK KURALLAR:
1. Eksik bilgi varsa ASLA varsayım yapma — Türkçe açık net soru sor. Örn: kullanıcı "alerjim var" derse → neye alerjisi olduğunu, kategorisini ve şiddetini sor.
2. Tek mesajda tüm bilgi varsa direkt tool çağır.
3. Kayıt sonrası kısa, sıcak bir onay mesajı ver. Örn: "Biceps yaralanmanı profilinde kaydettim. Geçmiş olsun, iyileşince haber ver."
4. Birden fazla kayıt isteniyorsa tek tek tool çağrısı yap.
5. Kullanıcı "iyileşti", "geçti", "düzeldi" dediyse update_body_mark ile isActive=false ve endDate=bugün ekle. Doğru kayıt ID'sini PROFİL bölümünden bul — eşleşme şüpheli ise kullanıcıya "şu kaydı mı kapatayım?" diye sor.
6. Sen kim olduğunu sorulursa: "FitAI'daki sağlık asistanınım, profilini birlikte tutuyoruz" gibi cevapla.
7. Tehlikeli/acil bir şey duyarsan (ciddi göğüs ağrısı, anaflaktik şok belirtileri, vb.) önce kullanıcıyı 112'yi aramaya yönlendir, sonra kayıt al.
8. Ciddi sağlık şikayetlerinde "doktoruna danışmanı öneririm" diyebilirsin — ama bunu her seferinde tekrarlama, sadece gerçekten ciddi durumlarda.

OKUMA VE HAFIZA:
- Sistem mesajı olarak sana kullanıcının MEVCUT SAĞLIK PROFİLİ verilir (aktif vücut işaretleri, alerjiler, kronik hastalıklar, ilaçlar, bağımlılıklar, kan grubu, son kan tahlili).
- "Başım hâlâ ağrıyor mu?", "Hangi alerjilerim vardı?", "Son kan tahlilim nasıldı?" gibi soruları SADECE bu profile bakarak cevapla — varsayım yapma, uydurma.
- Profilde olmayan bir şey sorulursa "Profilinde böyle bir kayıt göremiyorum, eklemek ister misin?" de.
- Profil ID'leri ([id:xxx] formatında) sadece sana gösterilir — kullanıcıya ID gösterme. Update/delete tool çağrılarında bu ID'leri kullan.`

const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_body_mark',
      description: 'Vücut işareti (yaralanma, ağrı, iz, ameliyat) ekler.',
      parameters: {
        type: 'object',
        properties: {
          region: { type: 'string', enum: VALID_REGIONS },
          side: { type: ['string', 'null'], enum: ['left', 'right', null] },
          type: { type: 'string', enum: VALID_MARK_TYPES },
          severity: { type: 'integer', minimum: 1, maximum: 4 },
          note: { type: 'string' },
        },
        required: ['region', 'type', 'severity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_allergy',
      description: 'Alerji ekler.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: VALID_ALLERGY_CATEGORIES },
          severity: { type: 'string', enum: VALID_ALLERGY_SEVERITIES },
          note: { type: 'string' },
        },
        required: ['name', 'category', 'severity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_chronic_condition',
      description: 'Kronik hastalık ekler.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: VALID_CHRONIC_CATEGORIES },
          severity: { type: 'string', enum: VALID_CHRONIC_SEVERITIES },
          region: { type: 'string', enum: VALID_REGIONS },
          note: { type: 'string' },
        },
        required: ['name', 'category', 'severity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_blood_type',
      description: 'Kullanıcının kan grubunu kaydeder.',
      parameters: {
        type: 'object',
        properties: {
          bloodType: { type: 'string', enum: VALID_BLOOD_TYPES },
        },
        required: ['bloodType'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_body_mark',
      description:
        'Mevcut vücut işaretini günceller. fields ile isActive, endDate, note, severity değiştirilebilir.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fields: {
            type: 'object',
            properties: {
              isActive: { type: 'boolean' },
              endDate: { type: 'string' },
              note: { type: 'string' },
              severity: { type: 'integer' },
            },
          },
        },
        required: ['id', 'fields'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_body_mark',
      description: 'Vücut işaretini soft-delete eder (isActive=false).',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_substance',
      description: 'Bağımlılık / madde kullanımı ekler (sigara, alkol, kafein, vape, vb).',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: VALID_SUBSTANCE_TYPES },
          status: {
            type: 'string',
            enum: VALID_SUBSTANCE_STATUS,
            description: 'active=hâlâ kullanıyor, quitting=bırakıyor, quit=bıraktı',
          },
          frequency: { type: 'string', enum: VALID_SUBSTANCE_FREQUENCY },
          amountPerDay: {
            type: 'number',
            description: 'Sigara: paket/gün, alkol: birim/gün, kafein: bardak/gün',
          },
          unit: { type: 'string', description: 'pack, drink, cup, ml, g, shot' },
          note: { type: 'string' },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_health_event',
      description:
        'Geçici/akut hastalık ekler (ishal, kabızlık, migren, ateş, üşütme vb). startDate verilmezse şu an kabul edilir.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: VALID_HEALTH_EVENT_TYPES },
          customName: {
            type: 'string',
            description: 'type=other olduğunda kullanıcının söylediği hastalık adı',
          },
          severity: { type: 'integer', minimum: 1, maximum: 4 },
          startDate: { type: 'string', description: 'ISO datetime, verilmezse şu an' },
          triggers: { type: 'array', items: { type: 'string', enum: VALID_TRIGGERS } },
          treatments: { type: 'array', items: { type: 'string', enum: VALID_TREATMENTS } },
          note: { type: 'string' },
        },
        required: ['type', 'severity'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'resolve_health_event',
      description:
        'Mevcut bir hastalığı "geçti" olarak işaretler. endDate ekler, isActive=false yapar. id PROFİL\'den bulunur.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          endDate: { type: 'string', description: 'ISO datetime, verilmezse şu an' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_history',
      description:
        'Belirli bir tarihte kullanıcının sağlık durumunu sorgular. "24 ocakta neyim vardı", "geçen hafta hangi ilaçları alıyordum", "Mart başında migren var mıydı" gibi sorularda kullan. date YYYY-MM-DD formatında olmalı.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['date'],
      },
    },
  },
]

// ─────────────── Profile Snapshot ───────────────
// AI'nın "okuma" yapabilmesi için kullanıcının aktif sağlık verilerini
// system prompt'a ekleriz. ID'lerle birlikte gönderilir ki AI "geçti" dediğinde
// doğru kaydı bulup update_body_mark çağırabilsin.

const REGION_TR_MAP: Record<string, string> = {
  head: 'Baş',
  hair: 'Saç',
  neck: 'Boyun',
  trapezius: 'Trapez',
  chest: 'Göğüs',
  deltoids: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Önkol',
  hands: 'Eller',
  abs: 'Karın',
  obliques: 'Yan karın',
  'upper-back': 'Üst sırt',
  'lower-back': 'Bel',
  gluteal: 'Kalça',
  adductors: 'İç bacak',
  quadriceps: 'Quadriceps',
  hamstring: 'Hamstring',
  knees: 'Diz',
  calves: 'Baldır',
  tibialis: 'Ön baldır',
  ankles: 'Ayak bileği',
  feet: 'Ayaklar',
}
const MARK_TYPE_TR: Record<string, string> = {
  injury: 'yaralanma',
  pain: 'ağrı',
  scar: 'iz',
  missing: 'eksik',
  surgery: 'ameliyat',
  tightness: 'kas tutulması',
  chronic_region: 'kronik bölge',
}
const SUB_TYPE_TR: Record<string, string> = {
  smoking: 'sigara',
  alcohol: 'alkol',
  caffeine: 'kafein',
  vape: 'vape',
  chewing_tobacco: 'çiğneme tütünü',
  cannabis: 'esrar',
  other: 'diğer',
}
const SUB_STATUS_TR: Record<string, string> = {
  active: 'aktif',
  quitting: 'bırakıyor',
  quit: 'bıraktı',
}
const ILLNESS_TR: Record<string, string> = {
  diarrhea: 'ishal',
  constipation: 'kabızlık',
  migraine: 'migren',
  headache: 'baş ağrısı',
  nausea: 'mide bulantısı',
  fever: 'ateş',
  cough: 'öksürük',
  dizziness: 'baş dönmesi',
  flu: 'üşütme/grip',
  stomachache: 'mide ağrısı',
  back_pain_episode: 'bel ağrısı krizi',
  allergic_reaction: 'alerjik reaksiyon',
  fatigue: 'halsizlik',
  other: 'diğer',
}
const TRIGGER_TR: Record<string, string> = {
  food: 'yemek',
  stress: 'stres',
  sleep: 'uyku eksikliği',
  weather: 'hava',
  menstruation: 'regl',
  alcohol: 'alkol',
  caffeine: 'kafein',
  medication: 'ilaç',
  exercise: 'egzersiz',
  unknown: 'bilinmiyor',
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '—'
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${dt.getFullYear()}`
}

async function buildProfileSnapshot(userId: string): Promise<string> {
  const [
    marks,
    allergies,
    conditions,
    substances,
    emergency,
    medications,
    latestBlood,
    activeIllnesses,
    recentIllnesses,
  ] = await Promise.all([
    db.bodyMark.findMany({
      where: { userId, isActive: true },
      orderBy: { startDate: 'desc' },
      take: 30,
    }),
    db.allergy.findMany({ where: { userId, isActive: true }, take: 30 }),
    db.chronicCondition.findMany({
      where: { userId, isActive: true, status: { not: 'resolved' } },
      take: 30,
    }),
    db.substance.findMany({ where: { userId, isActive: true }, take: 20 }),
    db.emergencyInfo.findUnique({ where: { userId } }),
    db.medication.findMany({
      where: { userId, OR: [{ endDate: null }, { endDate: { gt: new Date() } }] },
      take: 20,
    }),
    db.bloodWorkRecord.findFirst({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    }),
    db.healthEvent.findMany({
      where: { userId, isActive: true, endDate: null },
      orderBy: { startDate: 'desc' },
      take: 20,
    }),
    db.healthEvent.findMany({
      where: { userId, OR: [{ isActive: false }, { endDate: { not: null } }] },
      orderBy: { startDate: 'desc' },
      take: 10,
    }),
  ])

  const lines: string[] = []
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayTR = fmtDate(new Date())
  lines.push(`BUGÜNÜN TARİHİ: ${todayISO} (${todayTR})`)
  lines.push('')
  lines.push('=== KULLANICININ MEVCUT SAĞLIK PROFİLİ ===')
  lines.push(
    '(Bu veriler senin hafızandır. Kullanıcı "başım geçti" gibi bir şey dediğinde, doğru ID\'yi buradan bulup update_body_mark çağır. "Neyim vardı?" gibi sorularda buradan cevapla.)'
  )
  lines.push('')

  // Kan grubu / Acil
  if (emergency?.bloodType) {
    lines.push(`KAN GRUBU: ${emergency.bloodType}`)
  }

  // Aktif vücut işaretleri
  if (marks.length > 0) {
    lines.push('')
    lines.push('AKTİF VÜCUT İŞARETLERİ:')
    for (const m of marks) {
      const region = REGION_TR_MAP[m.region] ?? m.region
      const type = MARK_TYPE_TR[m.type] ?? m.type
      const side = m.side === 'left' ? ' (sol)' : m.side === 'right' ? ' (sağ)' : ''
      const note = m.note ? ` — "${m.note}"` : ''
      lines.push(
        `- [id:${m.id}] ${region}${side}: ${type}, şiddet ${m.severity}/4, başlangıç ${fmtDate(m.startDate)}${note}`
      )
    }
  } else {
    lines.push('')
    lines.push('AKTİF VÜCUT İŞARETLERİ: yok')
  }

  // Alerjiler
  if (allergies.length > 0) {
    lines.push('')
    lines.push('ALERJİLER:')
    for (const a of allergies) {
      const epi = a.hasEpiPen ? ', EpiPen var' : ''
      lines.push(`- [id:${a.id}] ${a.name} (${a.category}, ${a.severity}${epi})`)
    }
  }

  // Kronik
  if (conditions.length > 0) {
    lines.push('')
    lines.push('KRONİK RAHATSIZLIKLAR:')
    for (const c of conditions) {
      lines.push(`- [id:${c.id}] ${c.name} (${c.category}, ${c.severity}, ${c.status})`)
    }
  }

  // İlaçlar
  if (medications.length > 0) {
    lines.push('')
    lines.push('AKTİF İLAÇLAR:')
    for (const m of medications) {
      const sched = m.scheduleTimes?.length
        ? m.scheduleTimes.join(', ')
        : m.intervalHours
          ? `her ${m.intervalHours} saat`
          : 'gerektikçe'
      lines.push(`- [id:${m.id}] ${m.name} ${m.dosage} — ${sched}`)
    }
  }

  // Bağımlılıklar
  if (substances.length > 0) {
    lines.push('')
    lines.push('BAĞIMLILIKLAR:')
    for (const su of substances) {
      const type = SUB_TYPE_TR[su.type] ?? su.type
      const status = SUB_STATUS_TR[su.status] ?? su.status
      const amt = su.amountPerDay ? `, ${su.amountPerDay} ${su.unit ?? ''}/gün` : ''
      lines.push(`- [id:${su.id}] ${type} (${status}${amt})`)
    }
  }

  // Son kan tahlili
  if (latestBlood) {
    const analysis = (latestBlood.analysis as { healthScore?: number; alerts?: string[] }) ?? {}
    lines.push('')
    lines.push(`SON KAN TAHLİLİ (${fmtDate(latestBlood.uploadedAt)}):`)
    lines.push(`- Sağlık skoru: ${analysis.healthScore ?? '—'}/100`)
    if (analysis.alerts && analysis.alerts.length > 0) {
      lines.push(`- Uyarılar: ${analysis.alerts.join('; ')}`)
    }
  }

  // Aktif (devam eden) hastalıklar
  if (activeIllnesses.length > 0) {
    lines.push('')
    lines.push('AKTİF HASTALIKLAR (devam ediyor):')
    for (const e of activeIllnesses) {
      const name =
        e.type === 'other' && e.customName ? e.customName : (ILLNESS_TR[e.type] ?? e.type)
      const triggers = e.triggers.map((t) => TRIGGER_TR[t] ?? t).join(', ')
      const trigStr = triggers ? `, tetikleyici: ${triggers}` : ''
      const noteStr = e.note ? ` — "${e.note}"` : ''
      lines.push(
        `- [id:${e.id}] ${name} (şiddet ${e.severity}/4, başlangıç ${fmtDate(e.startDate)}${trigStr}${noteStr})`
      )
    }
  }

  // Son geçmiş hastalıklar (pattern detection için)
  if (recentIllnesses.length > 0) {
    lines.push('')
    lines.push('SON GEÇMİŞ HASTALIKLAR (referans):')
    for (const e of recentIllnesses) {
      const name =
        e.type === 'other' && e.customName ? e.customName : (ILLNESS_TR[e.type] ?? e.type)
      const dur = e.endDate
        ? `${fmtDate(e.startDate)}–${fmtDate(e.endDate)}`
        : `${fmtDate(e.startDate)} (sonu yok)`
      lines.push(`- ${name} (${dur}, şiddet ${e.severity}/4)`)
    }
  }

  lines.push('')
  lines.push('=== PROFİL SONU ===')

  return lines.join('\n')
}

type ToolResult = {
  action: 'added' | 'updated' | 'deleted' | 'asked'
  summary: string
  recordId?: string
  // query_history gibi read-only tool'ların follow-up LLM'e geçirdiği veri.
  // Tool result JSON'a eklenir, LLM bu veriden Türkçe özet çıkarır.
  data?: any
}

async function executeTool(
  name: string,
  args: any,
  userId: string,
  reqId: string
): Promise<ToolResult | { error: string }> {
  const t0 = Date.now()
  try {
    switch (name) {
      case 'add_body_mark': {
        const mark = await db.bodyMark.create({
          data: {
            userId,
            region: args.region,
            side: args.side ?? null,
            type: args.type,
            severity: Number(args.severity),
            startDate: new Date(),
            note: args.note ?? '',
          },
        })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'added',
          summary: `${args.region} bölgesine ${args.type} kaydedildi`,
          recordId: mark.id,
        }
      }
      case 'add_allergy': {
        const allergy = await db.allergy.create({
          data: {
            userId,
            name: args.name,
            category: args.category,
            severity: args.severity,
            note: args.note ?? '',
          },
        })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'added',
          summary: `${args.name} alerjisi kaydedildi`,
          recordId: allergy.id,
        }
      }
      case 'add_chronic_condition': {
        const condition = await db.chronicCondition.create({
          data: {
            userId,
            name: args.name,
            category: args.category,
            severity: args.severity,
            status: 'active',
            region: args.region ?? null,
            diagnosedAt: new Date(),
            doctorNote: args.note ?? '',
          },
        })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'added',
          summary: `${args.name} kronik durumu kaydedildi`,
          recordId: condition.id,
        }
      }
      case 'set_blood_type': {
        const info = await db.emergencyInfo.upsert({
          where: { userId },
          create: { userId, bloodType: args.bloodType },
          update: { bloodType: args.bloodType },
        })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'updated',
          summary: `Kan grubu ${args.bloodType} olarak kaydedildi`,
          recordId: info.id,
        }
      }
      case 'update_body_mark': {
        const existing = await db.bodyMark.findUnique({ where: { id: args.id } })
        if (!existing || existing.userId !== userId) return { error: 'Kayıt bulunamadı' }
        const data: any = {}
        if (args.fields.isActive !== undefined) data.isActive = args.fields.isActive
        if (args.fields.endDate !== undefined)
          data.endDate = args.fields.endDate ? new Date(args.fields.endDate) : null
        if (args.fields.note !== undefined) data.note = args.fields.note
        if (args.fields.severity !== undefined) data.severity = Number(args.fields.severity)
        const mark = await db.bodyMark.update({ where: { id: args.id }, data })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return { action: 'updated', summary: `İşaret güncellendi`, recordId: mark.id }
      }
      case 'delete_body_mark': {
        const existing = await db.bodyMark.findUnique({ where: { id: args.id } })
        if (!existing || existing.userId !== userId) return { error: 'Kayıt bulunamadı' }
        await db.bodyMark.update({ where: { id: args.id }, data: { isActive: false } })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return { action: 'deleted', summary: `İşaret silindi`, recordId: args.id }
      }
      case 'add_substance': {
        const sub = await db.substance.create({
          data: {
            userId,
            type: args.type,
            status: args.status ?? 'active',
            frequency: args.frequency ?? null,
            amountPerDay: args.amountPerDay ?? null,
            unit: args.unit ?? null,
            note: args.note ?? '',
          },
        })
        const labels: Record<string, string> = {
          smoking: 'sigara',
          alcohol: 'alkol',
          caffeine: 'kafein',
          vape: 'vape',
          chewing_tobacco: 'çiğneme tütünü',
          cannabis: 'esrar',
          other: 'diğer',
        }
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'added',
          summary: `${labels[args.type] ?? args.type} kaydedildi`,
          recordId: sub.id,
        }
      }
      case 'add_health_event': {
        const evt = await db.healthEvent.create({
          data: {
            userId,
            type: args.type,
            customName: args.type === 'other' ? (args.customName ?? null) : null,
            severity: Number(args.severity),
            startDate: args.startDate ? new Date(args.startDate) : new Date(),
            triggers: Array.isArray(args.triggers) ? args.triggers : [],
            treatments: Array.isArray(args.treatments) ? args.treatments : [],
            note: args.note ?? '',
          },
        })
        const labels: Record<string, string> = {
          diarrhea: 'ishal',
          constipation: 'kabızlık',
          migraine: 'migren',
          headache: 'baş ağrısı',
          nausea: 'mide bulantısı',
          fever: 'ateş',
          cough: 'öksürük',
          dizziness: 'baş dönmesi',
          flu: 'üşütme',
          stomachache: 'mide ağrısı',
          back_pain_episode: 'bel ağrısı',
          allergic_reaction: 'alerjik reaksiyon',
          fatigue: 'halsizlik',
          other: 'hastalık',
        }
        const name2 =
          args.type === 'other' && args.customName
            ? args.customName
            : (labels[args.type] ?? args.type)
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return { action: 'added', summary: `${name2} kaydedildi`, recordId: evt.id }
      }
      case 'resolve_health_event': {
        const existing = await db.healthEvent.findUnique({ where: { id: args.id } })
        if (!existing || existing.userId !== userId) return { error: 'Kayıt bulunamadı' }
        const evt = await db.healthEvent.update({
          where: { id: args.id },
          data: {
            endDate: args.endDate ? new Date(args.endDate) : new Date(),
            isActive: false,
          },
        })
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return { action: 'updated', summary: 'Hastalık kapatıldı', recordId: evt.id }
      }
      case 'query_history': {
        const dateStr = String(args.date ?? '')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return { error: 'date YYYY-MM-DD olmalı' }
        }
        const data = await queryHistoryForDate(userId, dateStr)
        console.log(`[body-command ${reqId}] tool=${name} ok ${Date.now() - t0}ms`)
        return {
          action: 'asked',
          summary: `${dateStr} sorgulandı`,
          data,
        }
      }
      default:
        return { error: `Bilinmeyen araç: ${name}` }
    }
  } catch (e) {
    console.error(`[body-command ${reqId}] tool=${name} FAILED ${Date.now() - t0}ms`, e)
    // Tool hatası akışı kesmemeli — error nesnesi dönüp follow-up reply'a "kaydedemedim" dedirtelim.
    return { error: 'Tool çağrısı başarısız oldu' }
  }
}

// Friendly graceful response builder — status 200 ile döner ki mobile
// React Query bunu error olarak işaretlemesin.
function gracefulReply(reply: string, errorTag: string) {
  return NextResponse.json(
    {
      reply,
      action: { type: 'asked' as const, summary: 'error' },
      error: errorTag,
    },
    { status: 200 }
  )
}

export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8)
  const tStart = Date.now()
  console.log(`[body-command ${reqId}] start`)

  // Total request timeout — 35s aşılırsa kullanıcıya graceful cevap dön.
  // AbortController ile alt OpenAI çağrılarına da yayılır.
  const ac = new AbortController()
  let totalTimedOut = false
  const totalTimer = setTimeout(() => {
    totalTimedOut = true
    ac.abort()
    console.warn(`[body-command ${reqId}] TOTAL TIMEOUT ${TOTAL_REQUEST_TIMEOUT_MS}ms`)
  }, TOTAL_REQUEST_TIMEOUT_MS)

  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      clearTimeout(totalTimer)
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const rateLimitResponse = await withAiRateLimit(clerkId)
    if (rateLimitResponse) {
      clearTimeout(totalTimer)
      console.log(`[body-command ${reqId}] rate-limited`)
      return rateLimitResponse
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      clearTimeout(totalTimer)
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const body = await req.json()
    const { message, conversationHistory } = body as {
      message: string
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message || typeof message !== 'string') {
      clearTimeout(totalTimer)
      return NextResponse.json({ error: 'message gerekli' }, { status: 400 })
    }

    // Profil snapshot'ı çek — AI artık mevcut kayıtları "okuyabilir".
    // Hata olursa snapshot boş gönderilir, ana akış kesilmez.
    const tSnap = Date.now()
    let profileSnapshot = ''
    try {
      profileSnapshot = await buildProfileSnapshot(user.id)
      console.log(
        `[body-command ${reqId}] snapshot built ${Date.now() - tSnap}ms (${profileSnapshot.length} chars)`
      )
    } catch (e) {
      console.error(`[body-command ${reqId}] snapshot FAILED ${Date.now() - tSnap}ms`, e)
    }

    // Cache-friendly mesaj sıralaması:
    // 1. Sabit system prompt (OpenAI prefix cache hit)
    // 2. Profil snapshot (kullanıcı bazında değişir ama 5dk içinde sabit)
    // 3. Konuşma geçmişi
    // 4. Yeni kullanıcı mesajı
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(profileSnapshot ? [{ role: 'system' as const, content: profileSnapshot }] : []),
      ...(conversationHistory ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    // ─── 1. OpenAI çağrısı (tool seçimi) — 15s timeout ───
    const t1 = Date.now()
    let completion
    try {
      completion = await openai.chat.completions.create(
        {
          model: AI_MODEL,
          messages,
          tools,
          tool_choice: 'auto',
          temperature: 0.4,
          max_tokens: 500,
        },
        {
          timeout: OPENAI_INITIAL_TIMEOUT_MS,
          signal: ac.signal,
        }
      )
      console.log(`[body-command ${reqId}] openai-1 ok ${Date.now() - t1}ms`)
    } catch (e: any) {
      console.error(`[body-command ${reqId}] openai-1 FAILED ${Date.now() - t1}ms`, e?.message ?? e)
      clearTimeout(totalTimer)
      if (totalTimedOut || e?.name === 'AbortError' || /timeout/i.test(e?.message ?? '')) {
        return gracefulReply(FRIENDLY_TIMEOUT_REPLY, 'timeout')
      }
      return gracefulReply(FRIENDLY_OPENAI_ERROR_REPLY, 'openai_error')
    }

    const choice = completion.choices[0]?.message
    const toolCalls = choice?.tool_calls ?? []

    if (toolCalls.length > 0) {
      const results: Array<{ name: string; result: ToolResult | { error: string } }> = []
      let anyDbError = false
      for (const call of toolCalls) {
        if (call.type !== 'function') continue
        if (totalTimedOut) break
        let args: any = {}
        try {
          args = JSON.parse(call.function.arguments)
        } catch {
          args = {}
        }
        const result = await executeTool(call.function.name, args, user.id, reqId)
        if ('error' in result) anyDbError = true
        results.push({ name: call.function.name, result })
      }

      // Eğer total timeout zaten aştıysa, follow-up'a girmeden graceful dön.
      if (totalTimedOut) {
        clearTimeout(totalTimer)
        return gracefulReply(FRIENDLY_TIMEOUT_REPLY, 'timeout')
      }

      // ─── 2. OpenAI follow-up (özet/onay) — 10s timeout ───
      // Tool sonucu DB'de var; follow-up başarısız olsa bile kullanıcıya
      // hardcoded onay mesajı dönmek tercih sebebidir (hiç cevap vermemekten iyi).
      const toolMessages = toolCalls.map((c, i) => ({
        role: 'tool' as const,
        tool_call_id: c.id,
        content: JSON.stringify(results[i].result),
      }))

      const t2 = Date.now()
      let followUp
      try {
        followUp = await openai.chat.completions.create(
          {
            model: AI_MODEL,
            messages: [...messages, choice as any, ...toolMessages],
            temperature: 0.6,
            max_tokens: 200,
          },
          {
            timeout: OPENAI_FOLLOWUP_TIMEOUT_MS,
            signal: ac.signal,
          }
        )
        console.log(`[body-command ${reqId}] openai-2 ok ${Date.now() - t2}ms`)
      } catch (e: any) {
        console.error(
          `[body-command ${reqId}] openai-2 FAILED ${Date.now() - t2}ms`,
          e?.message ?? e
        )
        // Follow-up çöktü — yine de tool çalıştıysa onay mesajı dön.
        clearTimeout(totalTimer)
        const first = results[0]?.result
        const action =
          first && !('error' in first)
            ? { type: first.action, summary: first.summary, recordId: first.recordId }
            : { type: 'asked' as const, summary: 'error' }
        const fallbackReply = anyDbError
          ? FRIENDLY_DB_ERROR_REPLY
          : 'Kaydettim, ama özetleme servisi yavaşladı. Profilinde göreceksin.'
        return NextResponse.json({ reply: fallbackReply, action }, { status: 200 })
      }

      const reply = followUp.choices[0]?.message?.content ?? 'Kaydettim.'
      const first = results[0]?.result
      const action =
        first && !('error' in first)
          ? { type: first.action, summary: first.summary, recordId: first.recordId }
          : undefined

      clearTimeout(totalTimer)
      console.log(`[body-command ${reqId}] end total=${Date.now() - tStart}ms`)
      return NextResponse.json({ reply, action })
    }

    // No tool call → assistant is asking a clarifying question.
    const reply = choice?.content ?? 'Daha fazla bilgi verir misin?'
    clearTimeout(totalTimer)
    console.log(`[body-command ${reqId}] end (asked) total=${Date.now() - tStart}ms`)
    return NextResponse.json({ reply, action: { type: 'asked', summary: 'Soru soruldu' } })
  } catch (error: any) {
    clearTimeout(totalTimer)
    console.error(`[body-command ${reqId}] FATAL total=${Date.now() - tStart}ms`, error)
    if (totalTimedOut || error?.name === 'AbortError') {
      return gracefulReply(FRIENDLY_TIMEOUT_REPLY, 'timeout')
    }
    // Bilinmeyen hata: graceful 200 dön ki mobile bubble normal görünsün.
    return gracefulReply(FRIENDLY_GENERIC_REPLY, 'unknown')
  }
}
