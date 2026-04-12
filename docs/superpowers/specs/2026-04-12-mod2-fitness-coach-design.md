# Mod 2: Fitness Koçu / Sesli Danışmanlık — Design Spec

## Özet

"Zoom toplantısı" tarzı sesli ve görüntülü AI danışmanlık modu. Kullanıcı kameraya geçer, sol tarafta 3D PT karakteri konuşma animasyonuyla tepki verir, VAPI ile gerçek zamanlı iki yönlü sesli sohbet kurulur. Supplement, beslenme, kilo yönetimi, motivasyon gibi konular konuşulabilir. Mod 1 ile aynı karakter kullanılır — tutarlı bir deneyim.

---

## Kararlar

| Konu               | Karar                                                             |
| ------------------ | ----------------------------------------------------------------- |
| AI ses             | VAPI (zaten kurulu)                                               |
| Karakter görsel    | Mod 1 ile aynı low-poly 3D karakter                               |
| Konuşma animasyonu | Three.js morph target ile dudak sync (basit) + jest animasyonları |
| Video              | Kullanıcı kamerası sağda, AI karakter solda                       |
| Transkript         | Gerçek zamanlı, ekranın altında akıyor                            |
| Konu önerileri     | Kullanıcı profiline göre dinamik chip'ler                         |

---

## 1. UI Layout

### 1.1 Web

```
┌─────────────────────────────────────────────────────┐
│  HEADER: "Fitness Koçu" | Süre | Ses seviyesi | Kapat│
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   3D PT KARAKTERİ   │     KULLANICI KAMERASI       │
│   (Konuşma animasyonu│     (Canlı video)            │
│    jest'ler)         │                              │
│                      │                              │
│   Ses dalgası        │   [Mikrofon aktif göstergesi]│
│   animasyonu altında │                              │
│        45%           │           55%                │
├──────────────────────┴──────────────────────────────┤
│  KONU ÖNERİLERİ: [Supplement] [Kilo] [Beslenme]... │
├─────────────────────────────────────────────────────┤
│  TRANSKRİPT: "Bugün protein alımın nasıldı?" ▌      │
└─────────────────────────────────────────────────────┘
```

### 1.2 Mobil

```
┌─────────────────────────┐
│  Fitness Koçu | Süre    │
├─────────────────────────┤
│   3D KARAKTERİ          │
│   Konuşma animasyonu    │
│         40%             │
├─────────────────────────┤
│   KULLANICI KAMERASI    │
│         40%             │
├─────────────────────────┤
│  [Supplement][Kilo]...  │
│  Transkript metni       │
└─────────────────────────┘
```

---

## 2. Karakter Konuşma Animasyonu

### 2.1 Ses Bazlı Animasyon

VAPI'nin audio stream'i analiz edilerek karakter animasyonu tetiklenir:

```typescript
interface SpeechAnimationController {
  // VAPI konuşurken
  onSpeechStart(): void // Konuşma animasyonu başlat
  onSpeechEnd(): void // Idle'a dön
  onAudioLevel(level: number): void // Ses seviyesine göre jest yoğunluğu
}
```

**Animasyon tipleri:**

| Durum        | Animasyon                  |
| ------------ | -------------------------- |
| Dinliyor     | Hafif baş sallama, idle    |
| Konuşuyor    | Jest hareketleri (el, baş) |
| Güçlendirme  | Başparmak yukarı jesti     |
| Soru soruyor | Baş eğme                   |
| Uyarı        | Ciddi duruş                |

### 2.2 Ses Dalgası Göstergesi

Karakterin altında VAPI konuşurken animated ses dalgası (waveform) gösterilir. Kullanıcı konuşurken farklı renkte dalgalanır.

---

## 3. VAPI Entegrasyonu

### 3.1 Mevcut Altyapı

`apps/web/lib/vapi/session.ts` ve `apps/web/lib/vapi/prompt-builder.ts` zaten kurulu. Mod 2 bunları genişletir.

### 3.2 Fitness Koçu System Prompt

```typescript
// apps/web/lib/vapi/fitness-coach-prompt.ts (YENİ)
export function buildFitnessCoachPrompt(profile: UserCoachProfile): string {
  return `Sen ${profile.name}'in kişisel fitness koçusun.

Kullanıcı profili:
- Kilo: ${profile.weightKg}kg, Boy: ${profile.heightCm}cm
- Hedef: ${profile.goals.join(', ')}
- Fitness seviyesi: ${profile.fitnessLevel}
- Aktif sakatlıklar: ${profile.injuries.join(', ') || 'yok'}
- Bu hafta ${profile.weeklyWorkouts} antrenman yaptı
- Supplement stack: ${profile.supplements.join(', ') || 'belirtilmemiş'}

Türkçe konuş. Samimi, motive edici ve bilgi dolu ol.
Supplement, beslenme, kilo yönetimi, uyku, stres konularında danışmanlık ver.
Tıbbi teşhis koyma, genel tavsiye ver.`
}
```

### 3.3 Oturum Yönetimi

```typescript
// VAPI oturumu başlat
await vapiClient.start({
  assistant: {
    model: { provider: 'openai', model: 'gpt-4o-mini' },
    voice: { provider: 'elevenlabs', voiceId: 'turkish-coach-voice' },
    systemPrompt: buildFitnessCoachPrompt(userProfile),
  },
})
```

---

## 4. Konu Önerileri

Kullanıcı profiline göre dinamik chip'ler gösterilir:

```typescript
function generateTopicSuggestions(profile: HealthProfile): TopicChip[] {
  const chips: TopicChip[] = [
    { label: 'Bugün ne yedim?', prompt: 'Bugünkü beslenme düzenimi değerlendir' },
    { label: 'Supplement öneri', prompt: 'Hedeflerime göre supplement öner' },
    { label: 'Kilo durumu', prompt: 'Bu haftaki kilo değişimimi analiz et' },
    { label: 'Uyku & toparlanma', prompt: 'Toparlanma sürecimi nasıl optimize ederim?' },
  ]

  // Sakatlık varsa ekle
  if (profile.activeInjuries?.length > 0) {
    chips.push({ label: 'Sakatlık ile spor', prompt: 'Sakatken nasıl antrenman yapabilirim?' })
  }

  // Hedef bazlı
  if (profile.goals.includes('weight_loss')) {
    chips.push({ label: 'Kalori açığı', prompt: 'Bu hafta kalori açığım yeterli mi?' })
  }

  return chips
}
```

Chip'e tıklayınca VAPI'ye o prompt gönderilir, koç konuyu açar.

---

## 5. Transkript

Gerçek zamanlı transkript VAPI'nin `transcript` event'inden gelir:

```typescript
vapi.on('message', (msg) => {
  if (msg.type === 'transcript') {
    setTranscript((prev) => [
      ...prev,
      {
        speaker: msg.role, // 'assistant' | 'user'
        text: msg.transcript,
        timestamp: Date.now(),
      },
    ])
  }
})
```

Sohbet geçmişi session sonunda DB'ye kaydedilir (opsiyonel, kullanıcı onayıyla).

---

## 6. Dosya Yapısı

### Web (apps/web)

```
components/
  fitness-coach/
    FitnessCoachPage.tsx         ← Ana sayfa bileşeni
    panels/
      CoachCharacterPanel.tsx    ← Sol: 3D karakter + ses animasyonu
      UserCameraPanel.tsx        ← Sağ: kullanıcı kamerası
    ui/
      TopicChips.tsx             ← Konu önerisi chip'leri
      TranscriptScroller.tsx     ← Gerçek zamanlı transkript
      VoiceWaveform.tsx          ← Ses dalgası animasyonu
    hooks/
      useFitnessCoachSession.ts  ← VAPI oturum yönetimi
      useSpeechAnimation.ts      ← Ses → karakter animasyon sync
lib/
  vapi/
    fitness-coach-prompt.ts      ← YENİ: Koç system prompt builder
    topic-suggestions.ts         ← YENİ: Dinamik konu önerileri
app/
  (dashboard)/dashboard/
    fitness-coach/
      page.tsx                   ← YENİ: /dashboard/fitness-coach route
  api/
    fitness-coach/
      session/route.ts           ← POST: Oturum başlat/bitir, transkript kaydet
```

### Mobil (apps/mobile)

```
app/(app)/
  fitness-coach.tsx              ← YENİ: Mobil fitness koç ekranı
lib/
  vapi/
    fitness-coach-session.ts     ← YENİ: Mobil VAPI wrapper
```

---

## 7. Veri Akışı

```
Kullanıcı Mod 2'yi açar
        ↓
GET /api/character/morph → PTCharacter3D yükle (Mod 1 ile aynı)
GET /api/user/profile → UserCoachProfile oluştur
        ↓
buildFitnessCoachPrompt(profile) → VAPI.start()
        ↓
generateTopicSuggestions(profile) → TopicChips render
        ↓
[Sohbet döngüsü]
VAPI audio out → useSpeechAnimation → karakter jest animasyonu
VAPI transcript → TranscriptScroller
TopicChip click → VAPI.send(prompt)
        ↓
Oturum biter → POST /api/fitness-coach/session (transkript kaydet)
```

---

## 8. Seans Seçim Ekranı (Ana Girdi Noktası)

`/dashboard/session` route'unda iki mod seçimi:

```
┌─────────────────────────────────────────────────────┐
│                   SEANS BAŞLAT                      │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   🏋️ AI PT ile Spor  │   💬 Fitness Koçu           │
│                      │                              │
│   Egzersiz yap,      │   Supplement, beslenme,      │
│   form analizi,      │   kilo, motivasyon           │
│   3D koç rehberliği  │   sesli danışmanlık          │
│                      │                              │
│   [Başla →]          │   [Başla →]                  │
└──────────────────────┴──────────────────────────────┘
```

Bu ekran mevcut `session/page.tsx`'in önüne geçer.

---

## 9. Hata Yönetimi

- **Mikrofon izni yok:** Açıklayıcı hata, izin isteme akışı
- **VAPI bağlantı hatası:** Retry + kullanıcıya bildirim
- **Kamera yok:** Sadece ses modunda devam
- **WebGL yok:** 2D avatar fallback (Mod 1 ile aynı)

---

## 10. Test Kapsamı

- `buildFitnessCoachPrompt` unit testi (profil → prompt doğruluğu)
- `generateTopicSuggestions` unit testi (injury/goal bazlı chip'ler)
- `useFitnessCoachSession` hook testi (VAPI mock)
- `FitnessCoachPage` render testi
- `/api/fitness-coach/session` route testi

---

## Kapsam Dışı (Bu Spec)

- Mod 1 (AI PT + Egzersiz)
- Gerçek video stream AI (Tavus/HeyGen)
- Sohbet geçmişi arama/filtreleme
- Grup koçluk seansları
