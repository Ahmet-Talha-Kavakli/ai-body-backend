/**
 * Meditasyon oturumları kataloğu — 5 kategori × 2 oturum = 10.
 * Her oturum: süre, ambient track id (sleep-sounds bucket'tan), zamanlanmış metin script'i.
 */

const SOUND_BASE = 'https://bollxgwrevnwjhnzdwcb.supabase.co/storage/v1/object/public/sleep-sounds';

export type MeditationCategory = 'sleep' | 'morning' | 'anxiety' | 'focus' | 'body';

export interface MeditationCue {
  /** Saniye cinsinden, oturumun başlangıcından itibaren */
  at: number;
  text: string;
}

export interface MeditationSession {
  id: string;
  title: string;
  description: string;
  category: MeditationCategory;
  durationMin: number;
  emoji: string;
  /** Arka plan ses URI (Sesler kütüphanesi) */
  soundUri: string;
  cues: MeditationCue[];
}

export const MEDITATION_CATEGORIES: Array<{
  key: MeditationCategory | 'all';
  label: string;
  emoji: string;
}> = [
  { key: 'all', label: 'Hepsi', emoji: '✨' },
  { key: 'sleep', label: 'Uyku Öncesi', emoji: '🌙' },
  { key: 'morning', label: 'Sabah', emoji: '☀️' },
  { key: 'anxiety', label: 'Anksiyete', emoji: '🌊' },
  { key: 'focus', label: 'Odaklanma', emoji: '🎯' },
  { key: 'body', label: 'Body Scan', emoji: '🧘' },
];

// Kısa cue üreten helper — eşit aralıklı dağıt
function evenCues(durationMin: number, lines: string[]): MeditationCue[] {
  const total = durationMin * 60;
  const interval = total / (lines.length + 1);
  return lines.map((text, i) => ({
    at: Math.round(interval * (i + 1)),
    text,
  }));
}

export const MEDITATION_SESSIONS: MeditationSession[] = [
  // ── SLEEP (2)
  {
    id: 'sleep_drift',
    title: 'Uykuya Yumuşak Geçiş',
    description: 'Vücudunu rahatlat, zihni boşalt',
    category: 'sleep',
    durationMin: 10,
    emoji: '🌙',
    soundUri: `${SOUND_BASE}/rain_light.mp3`,
    cues: evenCues(10, [
      'Sırtüstü uzan, ellerini yana bırak.',
      'Yavaşça gözlerini kapat.',
      'Burnundan derin nefes al, ağzından bırak.',
      'Omuzlarını yatak yüzüne bırak, gergin değilsin.',
      'Düşüncelerin gelip gitsin, takılma.',
      'Ayak parmaklarından başlayarak gevşet.',
      'Bacakların ağırlaşıyor.',
      'Karın bölgen yumuşadı, nefesin sakin.',
      'Yüzünün kasları çözüldü.',
      'Uykuya bırak kendini, hazırsın.',
    ]),
  },
  {
    id: 'sleep_count',
    title: 'Sayarak Uykuya',
    description: "Klasik 10'a kadar sayarak gevşeme",
    category: 'sleep',
    durationMin: 5,
    emoji: '🌜',
    soundUri: `${SOUND_BASE}/wind.mp3`,
    cues: evenCues(5, [
      'Rahat bir pozisyon bul.',
      'Derin bir nefes al ve "1" diye düşün.',
      'Nefesini ver ve "2" de.',
      'Her sayıda bir adım daha derine.',
      'Sayılar yavaşlasın, beden ağırlaşsın.',
    ]),
  },

  // ── MORNING (2)
  {
    id: 'morning_intention',
    title: 'Güne Niyet Belirle',
    description: 'Sabah enerjini yönlendir',
    category: 'morning',
    durationMin: 5,
    emoji: '☀️',
    soundUri: `${SOUND_BASE}/birds.mp3`,
    cues: evenCues(5, [
      'Gözlerini aç ve bir nefes al.',
      'Bugün için bir niyet düşün.',
      'Kendine "ben hazırım" de.',
      'Üç yavaş nefesle bedeni uyandır.',
      'Güne sakince başlıyorsun.',
    ]),
  },
  {
    id: 'morning_energy',
    title: 'Enerji Yükselten Nefes',
    description: 'Hızlı uyanma, zihin açıklığı',
    category: 'morning',
    durationMin: 5,
    emoji: '🌅',
    soundUri: `${SOUND_BASE}/forest.mp3`,
    cues: evenCues(5, [
      'Otur, sırtın dik olsun.',
      'Hızlıca burundan al, ağızdan ver.',
      'Bedenine sıcaklık yayılıyor.',
      'Şimdi yavaşla, derin al.',
      'Hazırsın, güne başla.',
    ]),
  },

  // ── ANXIETY (2)
  {
    id: 'anxiety_5_4_3_2_1',
    title: 'Şu Ana Dön',
    description: '5-4-3-2-1 grounding tekniği',
    category: 'anxiety',
    durationMin: 5,
    emoji: '🌊',
    soundUri: `${SOUND_BASE}/ocean.mp3`,
    cues: evenCues(5, [
      'Etrafına bak — gördüğün 5 şeyi say.',
      'Dokunabildiğin 4 şeyi fark et.',
      '3 farklı sesi dinle.',
      '2 koku al — yoksa hayal et.',
      '1 tat — kendi tükürüğünü bile fark et.',
    ]),
  },
  {
    id: 'anxiety_release',
    title: 'Endişeyi Bırak',
    description: 'Düşünceleri bulut gibi geçir',
    category: 'anxiety',
    durationMin: 10,
    emoji: '☁️',
    soundUri: `${SOUND_BASE}/stream.mp3`,
    cues: evenCues(10, [
      'Düşüncelerini bir bulut olarak hayal et.',
      'Bulut göğünde yavaşça akıyor.',
      'Tutmaya çalışma, bırak gitsin.',
      'Yeni bir bulut geliyor — onu da bırak.',
      'Sen gökyüzüsün, bulutlar gelir geçer.',
      'Nefes al, gökyüzü daha geniş.',
      'Endişen bir buluttu sadece.',
      'Şu an buradasın, güvendesin.',
      'Bedenin hafifledi.',
      'Sakinliğe kucak aç.',
    ]),
  },

  // ── FOCUS (2)
  {
    id: 'focus_breath',
    title: 'Odaklanma Nefesi',
    description: 'Zihni keskinleştir',
    category: 'focus',
    durationMin: 5,
    emoji: '🎯',
    soundUri: `${SOUND_BASE}/white.mp3`,
    cues: evenCues(5, [
      'Otur, ayakların yere bassın.',
      'Nefesini sayarak takip et: 1...2...3...',
      'Düşünce gelirse "düşünüyorum" deyip nefese dön.',
      'Zihin yavaş yavaş dağılmıyor.',
      'Odaklı ve hazır hissediyorsun.',
    ]),
  },
  {
    id: 'focus_pomodoro',
    title: 'Çalışma Öncesi Sıfırla',
    description: 'Zihni temizle, yeni başla',
    category: 'focus',
    durationMin: 5,
    emoji: '⚡',
    soundUri: `${SOUND_BASE}/brown.mp3`,
    cues: evenCues(5, [
      'Telefonunu kenara koy.',
      'Üç derin nefes al.',
      'Önündeki tek görevi düşün.',
      '"Şimdi sadece bunu yapacağım" de.',
      'Hazırsın — başlamak için tek bir adım kaldı.',
    ]),
  },

  // ── BODY SCAN (2)
  {
    id: 'body_scan_full',
    title: 'Tam Vücut Taraması',
    description: 'Baştan ayağa farkındalık',
    category: 'body',
    durationMin: 15,
    emoji: '🧘',
    soundUri: `${SOUND_BASE}/ambient.mp3`,
    cues: evenCues(15, [
      'Sırtüstü yat, kollarını yana bırak.',
      'Başının üstünde duran enerjiyi fark et.',
      'Gözlerine, çenene dikkat et — gevşet.',
      'Boynuna in, omuzlarını yumuşat.',
      'Kollarının ağırlığını hisset.',
      'Ellerin, parmakların — her biri serbest.',
      'Göğsünün yükselip alçalışını izle.',
      'Karın bölgen rahatladı.',
      'Belin yatağa yaslandı.',
      'Kalçaların geri çekildi.',
      'Bacakların ağırlaştı.',
      'Dizlerin esnek hissettin.',
      'Ayak bileklerin ve topuklarına in.',
      'Ayak parmakların — son nokta.',
      'Tüm bedenini bir bütün olarak hisset.',
    ]),
  },
  {
    id: 'body_quick',
    title: 'Hızlı Body Scan',
    description: 'Kısa stres atma',
    category: 'body',
    durationMin: 5,
    emoji: '✋',
    soundUri: `${SOUND_BASE}/heartbeat.mp3`,
    cues: evenCues(5, [
      'Otur veya yat.',
      'Yüzünü gevşet.',
      'Omuzlarını bırak.',
      'Karnını yumuşat.',
      'Bedeni tamamen sakin.',
    ]),
  },
];
