# 🎯 Seçime Bağlı Özellikler - Detaylı Rehber

## 1️⃣ RapidAPI (Egzersiz Veritabanı Arama)

### 🤔 Ne İçin?
Kullanıcı "Squat nasıl yapılır?" diye arama yaptığında → RapidAPI'den **300.000+ egzersiz** bilgisi getir.

### Örnek Kullanım:
```
Kullanıcı: "Halter bench press detayları"
↓
RapidAPI'ye sor: "Bench press bulur musun?"
↓
API cevap: "Bench Press - Muscles: Chest, Triceps, Front Delts - Instructions: ..."
↓
Uygulamada göster
```

### 📊 Durumu

**Şu anki setup:**
```
RAPIDAPI_KEY=  (BOŞ)
```

**Yapılması gerekenler:**

#### Step 1: RapidAPI Hesabı Oluştur
```
1. Git: https://rapidapi.com
2. "Sign Up" tıkla
3. Email veya Google ile giriş yap
```

#### Step 2: ExerciseDB API'yi Bul
```
1. RapidAPI dashboard
2. Üst arama kutusunda: "ExerciseDB" yaz
3. "Justin - ExerciseDB API" seç
```

#### Step 3: API Key Al
```
1. API sayfasında: "Subscribe to this API" tıkla
2. "BASIC" plan (free) seç
3. Subscribe
4. Sağ tarafta "API Keys" seç
5. `X-RapidAPI-Key` değerini kopyala
```

#### Step 4: Env dosyasına ekle
```bash
# apps/web/.env
RAPIDAPI_KEY=your_key_here
```

### 💰 Maliyet
- **Free Plan:** 100 requests/day
- **Paid Plans:** Başlayan $5/month

### ⚠️ Ne Zaman Gerekli?
- ✅ Egzersiz search özelliğini açtıktan sonra
- ✅ Kullanıcılar egzersiz detayları görmek isterse
- ❌ Şu an kullanılmıyor (isteğe bağlı)

### 🎮 Kod Nasıl Kullanılıyor?
```typescript
// apps/web/lib/exercisedb.ts (örnek)
async function searchExercise(name: string) {
  const response = await fetch(
    `https://rapidapi.com/api/exercises?name=${name}`,
    {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    }
  )
  return response.json()
}
```

### ✅ Ya da Yapmasan Ne Olur?
- Egzersiz search çalışmaz
- Ama FitAI yine çalışır (Phase 4 hafıza sayesinde)
- Yapay zeka, geçmiş antrenmanlardan ögrenip tavısiye verir

---

## 2️⃣ VAPI (Sesli Antrenman Koçu)

### 🤔 Ne İçin?
Antrenman sırasında **telefon hoparlöründen canlı sesle koçluk**:
- "Harika, sonraki sete geç!"
- "Form biraz daha düzelt"
- "5 saniye dinlenme yap"

### Örnek Kullanım:
```
Antrenman başlıyor
↓
Kamera izliyor, form analiz ediyor
↓
VAPI: "Diz açısı biraz daha açık olmalı" (sesli)
↓
Kullanıcı dinliyor ve düzeltiyor
↓
VAPI: "Harika! Sonraki rep'e başla"
```

### 📊 Durumu

**Şu anki setup:**
```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=      (BOŞ)
VAPI_PRIVATE_KEY=                 (BOŞ)
NEXT_PUBLIC_VAPI_ASSISTANT_*=     (BOŞ)
```

**Yapılması gerekenler:**

#### Step 1: VAPI Hesabı Oluştur
```
1. Git: https://vapi.ai
2. "Sign Up" tıkla
3. Email ile kaydol
4. Verification'u tamamla
```

#### Step 2: API Key Al
```
1. VAPI Dashboard
2. Sağ üst: Profil → API Keys
3. "Create New Key" tıkla
4. "Public Key" ve "Private Key" kopyala
```

#### Step 3: Assistant Oluştur
```
1. Dashboard → Assistants
2. "Create New Assistant" tıkla
3. Adı: "Fitness Coach"
4. Voice: Türkçe (TR-TR) seç
5. Model: GPT-4 seç
6. Save
7. Assistant ID'sini kopyala
```

#### Step 4: Env dosyasına ekle
```bash
# apps/web/.env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_public_key
VAPI_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_MILITARY=assistant_id_1
NEXT_PUBLIC_VAPI_ASSISTANT_SCIENTIFIC=assistant_id_2
NEXT_PUBLIC_VAPI_ASSISTANT_SUPPORTIVE=assistant_id_3
NEXT_PUBLIC_VAPI_ASSISTANT_FRIENDLY=assistant_id_4
```

### 💰 Maliyet
- **Free Plan:** 10 minutes/month
- **Paid Plans:** Başlayan $10/month (~$0.30 per minute)

### 📊 Neden 4 Assistant?

**4 farklı kişilik:**

1. **MILITARY** 💪
   - "Hadi başla! Hiçbişi yapma yok, direkt gel!"
   - Agresif, motivasyon yoğun
   - Sporcu tipi insanlar için

2. **SCIENTIFIC** 🧬
   - "Biyomechanics açısından, glute activation önemli..."
   - Detaylı, teknik
   - Merak eden tipi insanlar için

3. **SUPPORTIVE** 🤝
   - "Harika yapıyorsun! Stres alma, yavaş yavaş gidelim"
   - Destek, teşvik
   - Başlangıç seviyesi insanlar için

4. **FRIENDLY** 😊
   - "Abi, form iyi gidiyor! Bi daha senin malının."
   - Arkadaş gibi, rahat
   - Sosyal tipi insanlar için

Kullanıcı ayarlarından tercih seçer.

### 🎮 Kod Nasıl Kullanılıyor?
```typescript
// apps/web/lib/vapi.ts (örnek)
const startVapiCall = async (assistantId: string) => {
  const call = await vapi.start({
    assistantId: assistantId,
    customerNumber: user.phone
  })
  return call
}

// antrenman sırasında:
if (formError) {
  await startVapiCall(
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_SUPPORTIVE
  )
}
```

### ✅ Ya da Yapmasan Ne Olur?
- Sesli koçluk çalışmaz
- Ama yazılı feedback hala gösterilir
- Phase 3 FeedbackUI ekrandaki animasyonlar çalışır

### ⚠️ Ne Zaman Gerekli?
- ✅ Sesli antrenman özelliğini açtıktan sonra
- ✅ Premium kullanıcılarına sunacaksan
- ❌ Şu an temel özellik değil (isteğe bağlı)

---

## 📊 SEÇIME BAĞLI ÖZELLIKLER - ÖZET TABLOSU

| Özellik | Amaç | Malı | Zorunlu mu? | Status |
|---------|------|------|------------|--------|
| **RapidAPI** | Egzersiz search | $5-50/month | ❌ Hayır | ℹ️ Hazır |
| **VAPI** | Sesli koç | $10-100/month | ❌ Hayır | ℹ️ Hazır |

---

## 🚦 KARAR VER

### Seçenek 1: İkisini de Yap (Full Experience)
```
✅ Egzersiz search (RapidAPI)
✅ Sesli koçluk (VAPI)
💰 Toplam maliyet: $20-50/month
⏱️ Kurulum süresi: 30 dakika
```

### Seçenek 2: Sadece VAPI Yap (Sesli öncelikli)
```
❌ Egzersiz search yok
✅ Sesli koçluk (VAPI)
💰 Toplam maliyet: $10-20/month
⏱️ Kurulum süresi: 15 dakika
```

### Seçenek 3: Sadece RapidAPI Yap (Bilgi öncelikli)
```
✅ Egzersiz search (RapidAPI)
❌ Sesli koçluk yok
💰 Toplam maliyet: $5-10/month
⏱️ Kurulum süresi: 10 dakika
```

### Seçenek 4: Hiçbirini Yapma (Minimal)
```
❌ Egzersiz search yok
❌ Sesli koçluk yok
💰 Toplam maliyet: $0
⏱️ Kurulum süresi: 0 dakika
✅ Yine de çalışır! (Phase 4 hafıza sayesinde)
```

---

## 🎁 BONUS: SİMDİ NE YAPAYIM?

### Eğer henüz hiçbirini yapmadıysan:
**Şu anki durum:** ✅ %100 çalışıyor (isteğe bağlı özellikler olmadan)

**İleri okuma:**
1. Kullanıcılardan feedback al
2. "Sesli koçluk istiyoruz" derlerse → VAPI yap
3. "Egzersiz detayları istiyoruz" derlerse → RapidAPI yap

### Eğer şu an üretim'e gidiyorsan:
1. İlk 2 ay: isteğe bağlı özellikler olmadan
2. Kullanıcı feedback alıp: para yatır
3. Popüler olanı önce implement et

---

## 🤔 SORA SOR CEVAPLAR

**S: RapidAPI bedeli gerçekten $5 mi?**
Cevap: Free plan var! 100 request/gün. Test etmek için yeterli.

**S: VAPI kurulumu zor mu?**
Cevap: ❌ Hayır! 15 dakika. Assistant oluştur, key kopyala, env'ye yapıştır.

**S: İkisini birden yapmam lazım mı?**
Cevap: ❌ Hayır! Kullanıcılar isterse yap. Şu an isteğe bağlı.

**S: Daha sonra ekleyebilir miyim?**
Cevap: ✅ EVET! Kod zaten hazır, sadece env dosyasına key ekle.

**S: Free plan yeterli mi?**
Cevap: Evet, 100 kişi test etmek için. Production'da paid plan gerekir.

---

## ✨ SON

**Kısaca:**
- 🟢 RapidAPI = Egzersiz search (isteğe bağlı)
- 🟢 VAPI = Sesli koçluk (isteğe bağlı)
- 🟢 İkisiz de çalışır (Phase 4 hafıza sayesinde)

Yapayım desen step-by-step rehberi var dosyada!

---

**Yazıldı:** 12 Nisan 2026
**By:** Claude Code ✨
