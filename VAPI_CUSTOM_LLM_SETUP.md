# 🚀 VAPI Custom LLM Setup - Claude/OpenAI ile

## 🎯 Ne Yapacağız?

VAPI'de kendi LLM modelini (Claude, OpenAI, vs) kullanarak:
- ✅ Tam kontrol (system prompt, temperature, max tokens)
- ✅ Ucuz çalıştırma (Google TTS + Custom Claude = ideal fiyat)
- ✅ En iyi AI modeli (Claude 3.5 Sonnet)
- ✅ Türkçe konuşma mükemmel

---

## STEP 1: VAPI Dashboard'da Assistant Ayarlarını Aç

### 1.1 VAPI Dashboard'a git
```
https://vapi.ai/dashboard
```

### 1.2 "Assistants" bölümüne tıkla (sol menü)

### 1.3 Senin Assistant'ını bul
```
ID: 25ef33ad-0459-4057-841f-ea222bdfa126
```

### 1.4 Edit'e tıkla (kalem ikonu)

---

## STEP 2: Model Ayarlarını Yap

### 2.1 "Model" sekmesini bul
(İlk açıldığında "Basic Settings" sekmesi açık olabilir, aşağı scroll et)

### 2.2 "Model Provider" bölümünü aç
**Şu ayarları yap:**

```
Model Provider: Custom (OpenAI-compatible)
Base URL: https://api.anthropic.com/v1
```

### 2.3 Model Seç
```
Model: claude-3-5-sonnet-20241022
(En son Claude versiyonu)
```

### 2.4 API Key Ekle
```
API Key: paste senin Claude API key'ini
(https://console.anthropic.com/api-keys adresinden al)
```

**Eğer Claude key'in yoksa:**
```
1. https://console.anthropic.com
2. Sign Up veya Log In
3. API Keys bölümü
4. "Create Key" tıkla
5. Key'i kopyala
```

### 2.5 Advanced Settings (optional ama iyi)
```
Temperature: 0.7 (yaratıcılık vs consistency dengesi)
Max Tokens: 200 (sesli konuşma için yeterli)
Top P: 0.9
```

---

## STEP 3: Voice (Ses) Ayarlarını Yap

### 3.1 "Voice" sekmesini bul (aşağı scroll)

### 3.2 Voice Provider Seç
```
Voice Provider: Google Cloud Text-to-Speech
(Türkçe en iyi burada)
```

### 3.3 Voice Ayarları
```
Language: Turkish (tr-TR)
Voice: Erkek (tr-TR-Neural2-C) 
(veya deneyerek seç)
Pitch: 0 (normal)
Speed: 1.0 (normal hız)
```

### 3.4 Google Cloud API Key (Gerekli)

**Eğer Google Cloud key'in yoksa:**
```
1. https://console.cloud.google.com
2. "Create Project" → "fitai-voice"
3. "Enable APIs & Services"
4. "Text-to-Speech API" ara + Enable
5. "Create Credentials" → Service Account
6. JSON key indir
7. VAPI'de "Google Cloud API Key" alanına ekle
```

**Eğer zaten var ise:**
```
Google Cloud TTS API Key: paste et
```

---

## STEP 4: System Prompt Ekle

### 4.1 "System Prompt" sekmesini bul (aşağı scroll)

### 4.2 Tüm metni sil (varsa)

### 4.3 Bu prompt'u yapıştır:

```
Siz FitAI'ın akıllı sesli antrenman koçusunuz. 
Kullanıcının antrenman sırasında form hataları, motivasyon ihtiyaçları ve teknik iyileştirmeler konusunda rehberlik yapıyorsunuz.

## Görevleriniz:
1. Form Analizi: Kullanıcının hareket kalitesini izleyin, form hataları tespit edin
2. Gerçek Zamanlı Rehberlik: Form hatasını gördüğünüzde hemen uyarın
3. Motivasyon: Kullanıcıyı cesaretlendir, başarılarını kutla
4. Teknik Bilgi: Kas grupları, biyomechanics, egzersiz anatomisini açıkla
5. Güvenlik: Yanlış form nedeniyle yaralanma riskini minimize et

## Konuşma Tarzı:
- Professional ama yakın, koç gibi konuş
- Kısa cümleler (sesli, çok uzun yapma - max 2 cümle)
- Motivasyonlu ve destekleyici
- Hata tespit ettiğinde ANINDA söyle
- Başarı göstergelerini takdir et
- SADECE Türkçe konuş!

## Örnek Cevaplar:

**Form Doğru Olduğunda:**
"Harika! Form çok iyi gidiyor. Devam et!"

**Form Hatası Olduğunda:**
"Dikkat, diz biraz daha açık tutmalısın. Kalçalarını daha aşağı indir. Tekrar dene!"

**Motivasyon İçin:**
"Yapabilirsin! Her rep'i sayarak çalış, kaslarını hissedeceksin."

**Teknik Bilgi İçin:**
"Glute activation çok önemli. Kalça kasını daha çok çalıştır."

**Dinlenme Süresi:**
"Güzel! 30 saniye dinlen, sonra sonraki set'e geç."

## Kurallar:
- Tek bir hatayı söyle, en kritik olanı
- Herşey olumlu tutun
- Uzun açıklamalar yapma (sesli, hızlı konuş)
- Form hataları = güvenlik = en yüksek öncelik
- Kullanıcıyı dinle, cevap ver
```

---

## STEP 5: Diğer Önemli Ayarlar

### 5.1 "Settings" sekmesini bul

### 5.2 Şu ayarları kontrol et:
```
Interruption Threshold: 0.5 (sonu konuşmada kesmesini durdur)
End Call Reason: Explicit (sadece kullanıcı söylerse kapatsın)
```

### 5.3 "Advanced" (varsa)
```
First Message: "Merhaba! Antrenman koçun buradayım. Nasıl yapıyorsun?"
Backchannel: ON (umm, tamam vs. doğal conversation)
```

---

## STEP 6: SAVE ET

### 6.1 Sayfanın altında "Save" butonu
**TIKLA!**

### 6.2 "Saving..." mesajını bekle
→ "Saved" gösterilene kadar bekle

### 6.3 Başarı mesajı
```
✅ Assistant successfully updated!
```

---

## STEP 7: TEST ET

### 7.1 Dashboard'da "Test" butonu
(Sağ üst köşede)

### 7.2 Test call'ı başlat
- Mikrofona izin ver
- "Squat yapıyorum, formum nasıl?" de
- AI'nin Türkçe sesle cevap verip vermediğini kontrol et

### 7.3 Sorun varsa:
```
Eğer çalışmazsa:
1. API Keys'i tekrar kontrol et
2. Google Cloud API aktif mi?
3. Claude API key geçerli mi?
4. Sayfayı refresh et (F5)
5. Yeniden test et
```

---

## 📋 CHECKLIST

- [ ] VAPI Dashboard'a gittim
- [ ] Assistant'ı açtım (Edit)
- [ ] Model Provider: Custom (OpenAI-compatible) seçtim
- [ ] Base URL: https://api.anthropic.com/v1 ekledim
- [ ] Model: claude-3-5-sonnet-20241022 seçtim
- [ ] Claude API Key ekledim
- [ ] Voice Provider: Google Cloud TTS seçtim
- [ ] Language: Turkish (tr-TR) seçtim
- [ ] Google Cloud TTS API Key ekledim
- [ ] System Prompt yapıştırdım
- [ ] SAVE'e tıkladım
- [ ] Test ettim (Türkçe ses çıktı mı?)

---

## 🆘 SORUN GIDERME

### Problem: "API Key Invalid"
**Çözüm:**
- Claude API Key'i kontrol et (https://console.anthropic.com/api-keys)
- Boşluk var mı başında/sonunda? Sil
- Copy-paste'i tekrar yap

### Problem: "Google Cloud API Error"
**Çözüm:**
- Google Cloud console'da Text-to-Speech API aktif mi?
- Service Account key doğru mu?
- Billing enabled mi?

### Problem: "Ses gelmez"
**Çözüm:**
- Mikrofon izni verdim mi?
- Browser'da ses açık mı?
- Test call'ı yeniden başlat

### Problem: "Türkçe konuşmuyor"
**Çözüm:**
- Voice Language: Turkish (tr-TR) mi?
- System Prompt'ta "Türkçe" var mı?
- Claude'un Türkçe konuşması normaldir

### Problem: "Cevaplar çok uzun"
**Çözüm:**
- System Prompt'ta "max 2 cümle" var mı?
- Max Tokens: 200 oldu mu?
- Temperature: 0.7 civarında mı?

---

## 💡 İPUÇLARİ

1. **Cost:** Claude + Google TTS = ~$0.002/dakika (çok ucuz!)
2. **Quality:** Claude 3.5 Sonnet'in Türkçesi mükemmel
3. **Speed:** Google TTS çok hızlı (~100ms)
4. **Test:** Değişiklik yaptıktan sonra "Test" et
5. **Iteration:** Prompt'u fine-tune et, kullanıcı feedback alıp düzelt

---

## ✨ BAŞARILI OLDUĞUNDA

✅ VAPI'de Custom LLM yapılandırması tamamlandı
✅ Claude 3.5 Sonnet çalışıyor
✅ Google Cloud TTS Türkçe konuşuyor
✅ Sesli antrenman koçu aktif

🎉 Hazırsın! Artık dev sunucuyu başlatıp test edebilirsin.

---

**Yazıldı:** 12 Nisan 2026
**By:** Claude Code ✨

**Sonraki Step:** `pnpm dev` → Antrenman sayfasında sesli koçluğu test et
