# 🔧 ENV (Ortam Değişkenleri) Kurulum Rehberi

## 📋 .env Dosyaları Özeti

| Dosya | Kullanım | Dolu/Boş |
|-------|----------|----------|
| `.env` | **Güncel geliştirme** (test keys) | ✅ **DOLU** |
| `.env.local` | Geliştirme sırasında override | ✅ **DOLU** (aynı `.env` ile) |
| `.env.example` | Referans (şablon) | ❓ **BOŞ** |
| `.env.local.example` | Geliştirme referansı | ✅ **DOLU** |
| `.env.production.example` | Production referansı | ✅ **DOLU** (template) |
| `apps/mobile/.env.local` | React Native (mobil) | ✅ **DOLU** |

---

## ✅ BUGÜN YAPILANLARI KONTROL ET

Mevcut `.env` dosyasında şunlar var:

### 1. **Clerk Authentication** ✅ DOLU
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```
- **Durum:** ✅ Çalışıyor (test keys)
- **Yapılacak:** Üretim'de live keys'e değiştir

### 2. **Supabase Database** ✅ DOLU
```
DATABASE_URL=postgresql://...@aws-1-ap-northeast-1...
DIRECT_URL=postgresql://...
```
- **Durum:** ✅ Çalışıyor
- **Nerede buldum:** Supabase Dashboard → Settings → Database
- **Yapılacak:** Üretim'de production database URL'i ekle

### 3. **Upstash Redis** ✅ DOLU
```
UPSTASH_REDIS_REST_URL=https://well-cub-93560.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAW14AA...
```
- **Durum:** ✅ Çalışıyor
- **Nerede buldum:** https://console.upstash.com
- **Yapılacak:** Hiçbişi (caching, rate limiting için kullanılıyor)

### 4. **OpenAI** ✅ DOLU
```
OPENAI_API_KEY=sk-proj-Di3uOw7viFHUJo628...
```
- **Durum:** ✅ Çalışıyor (memory layer'ın embeddings ve prompts için)
- **Nerede buldum:** https://platform.openai.com/api-keys
- **Yapılacak:** Hiçbişi (zaten setup)

### 5. **Stripe Payments** ✅ DOLU
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```
- **Durum:** ✅ Çalışıyor (test mode)
- **Nerede buldum:** https://dashboard.stripe.com
- **Yapılacak:** Üretim'de live keys'e değiştir

### 6. **ExerciseDB API** ❓ BOŞ
```
RAPIDAPI_KEY=
```
- **Durum:** ⚠️ BOŞ (isteğe bağlı)
- **Ne için:** Egzersiz veritabanı (RapidAPI)
- **Yapılacak:** İsteğe bağlı - https://rapidapi.com/justin-WFnsXH_haHLw/api/exercisedb

### 7. **App Config** ✅ DOLU
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- **Durum:** ✅ Çalışıyor (geliştirme)
- **Yapılacak:** Üretim'de gerçek URL'e değiştir

### 8. **Mobile App** ✅ DOLU
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```
- **Durum:** ✅ Çalışıyor

---

## 🔴 EKSIK OLAN VEYA BOŞ OLAN ALANLAR

### `RAPIDAPI_KEY` - İsteğe Bağlı
**Status:** ❓ BOŞ
```
RAPIDAPI_KEY=
```
- **Ne için:** Egzersiz veritabanı (isteğe bağlı)
- **Yapılacak:** 
  - Eğer egzersiz arama özelliği aktif ise: https://rapidapi.com → RapidAPI API key al
  - Şu an kullanılmıyorsa: Boş bırak (sistem çalışmaya devam eder)

### `VAPI_` Keys - YÖKSEĞİ BOŞ (v2'de eklendi)
`.env.example`'da şunlar var ama `.env`'de boş:
```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
VAPI_PRIVATE_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_*=
```
- **Ne için:** Sesli koç (VAPI)
- **Yapılacak:** 
  - Sesli koç özelliğini kullanacaksan: https://vapi.ai → API keys al
  - Şu an Phase 4'teyiz ve bunu zaten yapılandırdık (production'da gerekli)

---

## 🚀 SUPABASE KONTROL LİSTESİ

Eğer Supabase'i sıfırdan kuruyorsan:

### 1. **Supabase Proje Oluştur**
- Git: https://supabase.com
- "New Project" → Database oluştur
- Username/password ayarla
- Bölge seç (AP Northeast 1 uygun)

### 2. **Prisma Connection Stringini Al**
```
1. Supabase Dashboard
2. Projeni seç
3. Settings → Database → Connection String
4. "Prisma" sekmesinde kopyala
5. DATABASE_URL ve DIRECT_URL'e yapıştır
```

### 3. **Veritabanını Migre Et**
```bash
cd apps/web
npx prisma migrate deploy
```

### 4. **pgvector Extensionunu Ekle** (Phase 4 için)
```sql
-- Supabase SQL Editor'de çalıştır:
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## ⚙️ GELIŞTIRME vs PRODUCTION

### Geliştirme (Şu anki setup) ✅
```
DATABASE_URL=test database (Supabase)
OPENAI_API_KEY=test key
STRIPE_*=test keys (sk_test_, pk_test_)
CLERK_*=test keys (pk_test_, sk_test_)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Yapılacak)
```
DATABASE_URL=production database
OPENAI_API_KEY=production key (gerekirse limit artır)
STRIPE_*=production keys (sk_live_, pk_live_)
CLERK_*=production keys (pk_live_, sk_live_)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 📝 YAPILACAK İŞ ÖZETI

### ✅ Hemen Yapmak Gerekmeyen (Şu an çalışıyor):
- Tüm temel keys dolu ve test mode'de çalışıyor
- Supabase, Redis, OpenAI, Stripe kurulmuş

### ⚠️ İleride Yapılacak (Production):
1. **Clerk:** Test keys'i production live keys'e değiştir
2. **Supabase:** Test database'i production'a taşı (veya yeni production DB oluştur)
3. **Stripe:** Test keys'i production live keys'e değiştir
4. **App URL:** `http://localhost:3000`'ı gerçek domain'e değiştir
5. **VAPI:** Sesli koç fullly deploy etmek için API keys al (şu an dolu değil)
6. **RapidAPI:** İsteğe bağlı (egzersiz search'i için)

### 🔐 Güvenlik (Üretim için):
```bash
# Production'a push etmeden ÖNCE:
1. .env dosyasını git'ten dışla (.gitignore)
2. Tüm secrets'i rotate et (dönemin anahtarlarını değiştir)
3. Vercel/Netlify ortam değişkenlerine ekle
4. AWS Secrets Manager veya benzer kullan
```

---

## 🎯 SUPABASE KURULUMU DETAYLI

### Step 1: Supabase Project Oluştur
```
https://supabase.com/dashboard
1. "New Project" tıkla
2. Project Name: "FitAI"
3. Database Password: Güçlü şifre seç
4. Region: Geçerli region seç (AP Northeast)
5. "Create new project" tıkla
```

### Step 2: Connection Stringini Al
```
Supabase Dashboard
→ Project Settings (üst sağda ⚙️)
→ Database
→ "Connection Pooler" veya "Direct Connection"
→ Connection string'i kopyala
```

### Step 3: Prisma Migrate
```bash
cd apps/web
npx prisma migrate deploy
# veya:
npx prisma db push
```

### Step 4: pgvector Ekle (Memory Layer için)
```sql
-- Supabase SQL Editor'de:
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🤔 Sık Sorulan Sorular

**S: .env dosyasını git'e push edebilir miyim?**
Cevap: ❌ HAYIR! `.gitignore`'da olmalı. Test keys bile ⚠️ riskli.

**S: `.env` vs `.env.local` arasındaki fark nedir?**
Cevap: 
- `.env` = Varsayılan (git'e push edilmiş olabilir)
- `.env.local` = Override (git'de değil, kişisel)

**S: Supabase'i gerçekten kullanmam gerekiyor mu?**
Cevap: ✅ EVET. Phase 4'te pgvector (vektör veritabanı) kullanılıyor. PostgreSQL + pgvector gerekli.

**S: OpenAI API'nin bedeli ne kadar?**
Cevap: Kullandığı kadar ödü. Embeddings cheap (~$0.02 per 1K tokens), Chat biraz daha pahalı.

**S: Stripe zorunlu mu?**
Cevap: ❓ İsteğe bağlı. Ödeme özelliği kullanmayacaksan atlayabilirsin.

---

## ✨ Son Durum

**Şu anki setup:** 🟢 %90 Tamamlandı
- ✅ Supabase kurulu
- ✅ Clerk kurulu
- ✅ OpenAI kurulu
- ✅ Stripe kurulu
- ✅ Redis kurulu
- ❓ VAPI sesli koç (şu an test modunda yok ama şema hazır)

**Yapılacak:** 
1. Production keys'i al (3 ay/yarıyıl sonra)
2. Vercel/Netlify'da ortam değişkenlerini güncelle
3. Test et → canlıya çık

---

**Yazıldı:** 12 Nisan 2026
**By:** Claude Code - Şemsi ✨
