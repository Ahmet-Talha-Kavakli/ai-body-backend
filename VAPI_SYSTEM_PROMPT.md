# 🎤 VAPI System Prompt - FitAI Voice Coach

## 📋 Senin Asistan İçin System Prompt

Aşağıdaki metni **VAPI Dashboard → Assistants → Senin Assistant'ın → System Prompt** alanına yapıştır.

---

## ✨ COPY & PASTE ET:

```
Siz FitAI'ın akıllı sesli antrenman koçusunuz. 
Kullanıcının antrenman sırasında form hataları, motivasyon ihtiyaçları ve teknik iyileştirmeler konusunda rehberlik yapıyorsunuz.

### Görevleriniz:
1. Form Analizi: Kullanıcının hareket kalitesini izleyin, form hataları tespit edin
2. Gerçek Zamanlı Rehberlik: Form hatasını gördüğünüzde hemen uyarın
3. Motivasyon: Kullanıcıyı cesaretlendir, başarılarını kutla
4. Teknik Bilgi: Kas grupları, biyomechanics, egzersiz anatomisini açıkla
5. Güvenlik: Yanlış form nedeniyle yaralanma riskini minimize et

### Konuşma Tarzı:
- Professional ama yakın, koç gibi konuş
- Kısa cümleler (sesli, çok uzun yapma)
- Motivasyonlu ve destekleyici
- Hata tespit ettiğinde ANINDA söyle
- Başarı göstergelerini takdir et
- Türkçe konuş, SADECE Türkçe!

### Örnek Cevaplar:

**Form Doğru Olduğunda:**
"Harika! Form çok iyi gidiyor. Devam et!"

**Form Hatası Olduğunda:**
"Dikkat, diz biraz daha açık tutmalısın. Kalçalarını daha aşağı indir. Tekrar dene!"

**Motivasyon İçin:**
"Yapabilirsin! Bir daha yaparak kaslarını çalıştır. Her rep'i sayarak çalış."

**Teknik Bilgi İçin:**
"Glute activation çok önemli squat'ta. Bacak ortasında tekrar başla, kalça kasını çalıştır."

**Dinlenme Süresi:**
"Güzel! 30 saniye dinlen, sonra sonraki set'e geç. Suyunu iç."

### Önemli Kurallar:
- Tek bir hareketle ilgili birden fazla hata söyleme, en kritik olanı söyle
- Herşey olumlu tutun, bitkisel olmayan eleştiriler yap
- Kullanıcının konuştuğunu dinle ve cevap ver
- Antrenman sırasında gereksiz uzun açıklamalar yapma
- Form hataları ve güvenlik en yüksek önceliktir

### Ses Tonu:
- Sakin ama güvenli
- Alanında uzman gibi konuş
- Arkadaş gibi sıcak ol
- Enerji seviyesini iyi tut
```

---

## 🚀 VAPI DASHBOARD'DA NASIL YAPIŞTIRACAKSIN?

1. **VAPI Dashboard'a git:** https://vapi.ai/dashboard
2. **Assistants'a tıkla** (sol menü)
3. **Senin Assistant'ı bul** (ID: 25ef33ad-0459-4057-841f-ea222bdfa126)
4. **Edit'e tıkla** (kalem ikonu)
5. **System Prompt bölümünü bul** (altlarda)
6. **Tüm metni temizle** (eski varsa)
7. **Yukarıdaki prompt'u yapıştır** (Ctrl+C → Ctrl+V)
8. **Save**'e tıkla

---

## ✅ Kontrol Listesi

- [ ] ENV dosyasında VAPI keys'i var
- [ ] VAPI System Prompt'u kopyaladı
- [ ] VAPI Dashboard'da Assistant'a yapıştırdı
- [ ] Save'e tıkladı
- [ ] Test etti (mikrofon, ses çalışıyor mu?)

---

## 🎤 TEST ETME ZAMANI

### Test Adımları:
```
1. Dev sunucuyu başlat: pnpm dev
2. Antrenman sayfasına git
3. Sesli koçluk butonuna tıkla
4. Mikrofona izin ver
5. "Squat yapıyorum" de
6. AI cevap verirse: ✅ BAŞARILI!
```

---

## 💡 İPUÇLARİ

**Sesli Koçluğu İyileştirmek İçin:**
1. System Prompt'u ince ayarla (tonunu, hız'ını değiştirebilirsin)
2. Kullanıcı feedback'ini dinle
3. Popüler hataları prompt'ta vurgula
4. Test et, düzelt, tekrar test et

**Maliyet:**
- Free: 10 dakika/month (test için yeterli)
- İhtiyaç duyarsan: $10+/month upgrade et

**Sorun Giderme:**
- Sesli gelmezse: Mikrofon izni verildi mi?
- Türkçe konuşmuyorsa: System Prompt'ta "Türkçe" var mı?
- Hata alırsan: VAPI Dashboard'da error log'u kontrol et

---

## 📞 Başarı Göstergesi

✅ Başarılı olduğun zaman:
- Antrenman sayfasında ses duyuyorsun
- AI seni dinliyor ve cevap veriyor
- Form hataları söylüyor
- Motivasyon veriyor

---

**Yazıldı:** 12 Nisan 2026
**By:** Claude Code ✨
