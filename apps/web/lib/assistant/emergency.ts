/**
 * Acil durum tespiti — kullanıcı mesajı geldiğinde keyword + pattern taraması.
 * Eşleşirse AI çağırmadan acil yanıt döner (hızlı, deterministik).
 */

export type EmergencyType = 'mental_crisis' | 'physical_critical' | 'medical_urgent' | null

interface EmergencyResult {
  type: Exclude<EmergencyType, null>
  response: string
  hotline: string // Türkiye için
}

const MENTAL_CRISIS_PATTERNS = [
  /intihar/i,
  /ölmek\s*ist/i,
  /hayatıma\s*son/i,
  /yaşamak\s*istemiyor/i,
  /kendime\s*zarar/i,
  /kendimi\s*öldür/i,
  /artık\s*dayanamı/i,
  /son\s*kez\s*yazıyor/i,
]

const PHYSICAL_CRITICAL_PATTERNS = [
  /göğüs\s*ağrısı?/i,
  /göğsüm\s*(sıkışı|ağrı)/i,
  /kalbim\s*duruyor/i,
  /nefes\s*alamı/i,
  /soluk\s*alamı/i,
  /felç\s*oldum/i,
  /yüzüm\s*uyuş/i,
  /konuşamıyor/i,
  /yarısı\s*hareket\s*etmiy/i, // tek taraf hareketsizlik
  /şuurum?\s*(kayıp|kaybedi)/i,
  /bayılı?(yor)?um/i,
  /zehirlend/i,
  /kan\s*kusuy/i,
  /şiddetli\s*kan/i,
]

const MEDICAL_URGENT_PATTERNS = [
  /yüksek\s*ateş\s*40/i,
  /korkunç\s*baş\s*ağrı/i,
  /sürekli\s*kus(uy|m)/i,
]

export function detectEmergency(userMessage: string): EmergencyResult | null {
  const text = userMessage.toLowerCase()

  if (MENTAL_CRISIS_PATTERNS.some((p) => p.test(text))) {
    return {
      type: 'mental_crisis',
      hotline: '182',
      response: `Sana ulaşmamı sağladığın için minnettarım. Şu anda yanındayım.

Bu duyguyu paylaşman çok cesur. Tek başına olmadığını bilmeni istiyorum. Türkiye'de **İntihar Önleme Hattı: 182** — 7/24 ulaşabilirsin, isminle aramak zorunda değilsin. Ücretsiz, gizli, kararını destekleyecekler.

Şu an yanımda olduğunu hissediyorum. Bana biraz daha anlatır mısın — neler yaşadın bugün? Acele etme, sadece hazır olduğunda yaz.

Acil durumdaysan veya kendine zarar verme hissin yoğunsa, lütfen **112'yi ara** veya en yakındaki bir kişiye söyle. Bu cümleyi sana uzak hissettirmek istemiyorum, sadece güvende olmanı istiyorum.`,
    }
  }

  if (PHYSICAL_CRITICAL_PATTERNS.some((p) => p.test(text))) {
    return {
      type: 'physical_critical',
      hotline: '112',
      response: `Bu yazdıkların ciddi olabilir. **Lütfen şimdi 112'yi ara** — gecikme.

Eğer yalnızsan ve arayabiliyorsan: 112 → "Acil tıbbi yardım" de, adresi söyle, başında kal.
Yalnız değilsen: yanındakine durumunu hemen söyle.

Beklerken:
- Sırtüstü uzan, başını hafif yükselt
- Sıkı kıyafetlerini gevşet
- Sakin nefes almaya çalış (zorlama, sadece yumuşak)
- Telefonu yakınında tut

Buradayım, ama şu an benim yerime **gerçek tıbbi yardım gerekiyor**. 112'yi arattırdığında bana yaz, beraber bekleyelim.`,
    }
  }

  if (MEDICAL_URGENT_PATTERNS.some((p) => p.test(text))) {
    return {
      type: 'medical_urgent',
      hotline: '184',
      response: `Bu belirtiler ciddi olabilir. Birkaç saat içinde doktoruna ulaşmanı öneriyorum.

- **Sağlık Bakanlığı MHRS: 184** — randevu için
- **Acil ise 112**
- En yakın acil servise gitmeyi düşün

Bu süreçte kendini takip et: kötüleşirse 112'yi aramaktan çekinme. Bana yazmaya devam et, yanındayım.`,
    }
  }

  return null
}
