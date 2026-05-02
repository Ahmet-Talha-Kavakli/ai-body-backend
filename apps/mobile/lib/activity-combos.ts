export interface ActivityCombo {
  id: string;
  nametr: string;
  requiredTypes: string[];
  optionalTypes?: string[];
  icon: string;
  color: string;
  description: string;
  aiInsight: string;
  xpBonus: number;
  badge?: string;
}

export const ACTIVITY_COMBOS: ActivityCombo[] = [
  // ─── Toparlanma Protokolleri ───────────────────────────────────────────────
  {
    id: 'contrast_therapy',
    nametr: 'Kontrast Terapi',
    requiredTypes: ['sauna', 'cold_pool'],
    icon: 'thermometer-outline',
    color: '#FF6B35',
    description: 'Sauna ve şok havuzu ile kas iyileşmesini hızlandır.',
    aiInsight: 'Kontrast terapi inflamasyonu %30 azaltır ve lenfatik sistemi aktive eder.',
    xpBonus: 150,
    badge: '🔥❄️',
  },
  {
    id: 'elite_recovery',
    nametr: 'Elit Toparlanma',
    requiredTypes: ['sauna', 'cold_pool', 'massage'],
    icon: 'medal-outline',
    color: '#9B59B6',
    description: 'Profesyonel sporcu toparlanma protokolü.',
    aiInsight: 'Sauna + buz banyosu + masaj üçlüsü kas hasarını en hızlı iyileştiren protokoldür.',
    xpBonus: 250,
    badge: '👑',
  },
  {
    id: 'sauna_stretch',
    nametr: 'Sıcak Esneme',
    requiredTypes: ['sauna', 'stretching'],
    icon: 'body-outline',
    color: '#E67E22',
    description: 'Sauna sonrası esneme ile esnekliği maksimize et.',
    aiInsight: 'Yüksek vücut ısısında yapılan esneme, normal esnemeye göre %40 daha etkilidir.',
    xpBonus: 100,
    badge: '🧘',
  },
  {
    id: 'spa_warrior',
    nametr: 'Spa Savaşçısı',
    requiredTypes: ['sauna', 'cold_pool', 'massage', 'stretching'],
    icon: 'shield-checkmark-outline',
    color: '#1ABC9C',
    description: 'Tam toparlanma döngüsü: ısı, soğuk, masaj, esneme.',
    aiInsight: "Bu 4'lü protokol elit atletlerin kullandığı en kapsamlı recovery rutinidir.",
    xpBonus: 300,
    badge: '⚔️🛡️',
  },

  // ─── Kardiyo Zinciri ──────────────────────────────────────────────────────
  {
    id: 'cardio_double',
    nametr: 'Kardiyo İkili',
    requiredTypes: ['running', 'cycling'],
    icon: 'bicycle-outline',
    color: '#E74C3C',
    description: 'Koşu ve bisiklet ile çift kardiyo patlaması.',
    aiInsight: 'Farklı kas gruplarını kullanan iki kardiyo, VO2 max gelişimini hızlandırır.',
    xpBonus: 150,
    badge: '🏃🚴',
  },
  {
    id: 'cardio_triple',
    nametr: 'Kardiyo Üçlüsü',
    requiredTypes: ['running', 'cycling', 'rowing'],
    icon: 'fitness-outline',
    color: '#C0392B',
    description: 'Üç farklı kardiyo ile tüm vücudu çalıştır.',
    aiInsight:
      "Koşu, bisiklet ve kürek; bacak, üst vücut ve core'u eş zamanlı geliştiren nadir kombinasyondur.",
    xpBonus: 250,
    badge: '🔥🔥🔥',
  },
  {
    id: 'jump_run',
    nametr: 'Zıplayan Koşucu',
    requiredTypes: ['running', 'jump_rope'],
    icon: 'flash-outline',
    color: '#F39C12',
    description: 'Atlama ipi ve koşu ile patlayıcı kardiyo.',
    aiInsight: 'Atlama ipi ayak bileği stabilitesini geliştirirken koşu dayanıklılığını artırır.',
    xpBonus: 120,
    badge: '⚡',
  },
  {
    id: 'full_cardio_chain',
    nametr: 'Tam Kardiyo Zinciri',
    requiredTypes: ['running', 'cycling', 'jump_rope'],
    optionalTypes: ['rowing', 'swimming'],
    icon: 'infinite-outline',
    color: '#D35400',
    description: 'Koşu, bisiklet ve atlama ipi ile maksimal kardiyo.',
    aiInsight:
      'Bu zincirleme kardiyo protokolü saatte 800+ kalori yakar ve dayanıklılığı hızla artırır.',
    xpBonus: 200,
    badge: '🏆',
  },

  // ─── Su Sporları ──────────────────────────────────────────────────────────
  {
    id: 'water_combo',
    nametr: 'Su Atleti',
    requiredTypes: ['swimming', 'water_polo'],
    icon: 'water-outline',
    color: '#2980B9',
    description: 'Yüzme ve su topu ile su üstü egemenlik.',
    aiInsight:
      'Su sporlarının kombinasyonu eklem baskısı olmadan tüm kardiyovasküler sistemi geliştirir.',
    xpBonus: 180,
    badge: '🌊',
  },
  {
    id: 'aqua_recovery',
    nametr: 'Su Toparlanması',
    requiredTypes: ['swimming', 'cold_pool'],
    icon: 'snowflake-outline',
    color: '#3498DB',
    description: 'Yüzme sonrası soğuk havuz ile eksiksiz dinlenme.',
    aiInsight: 'Soğuk suda yüzme sonrası iyileşme, kara egzersizlerine göre 2x daha hızlıdır.',
    xpBonus: 130,
    badge: '🏊❄️',
  },
  {
    id: 'water_master',
    nametr: 'Su Ustası',
    requiredTypes: ['swimming', 'water_polo', 'cold_pool'],
    icon: 'trophy-outline',
    color: '#1A5276',
    description: 'Su sporlarında ustalaşma: yüzme, su topu, buz havuzu.',
    aiInsight: 'Su ortamında üç farklı aktivite; denge, güç ve dayanıklılığı aynı anda geliştirir.',
    xpBonus: 220,
    badge: '🌊🏆',
  },

  // ─── Zihin-Beden ──────────────────────────────────────────────────────────
  {
    id: 'mind_body',
    nametr: 'Zihin-Beden Dengesi',
    requiredTypes: ['yoga', 'meditation'],
    icon: 'leaf-outline',
    color: '#27AE60',
    description: 'Yoga ve meditasyon ile iç huzuru bul.',
    aiInsight:
      'Yoga + meditasyon kombinasyonu kortizol seviyesini %25 düşürür ve odaklanmayı artırır.',
    xpBonus: 120,
    badge: '🧘‍♂️',
  },
  {
    id: 'flow_state',
    nametr: 'Akış Hali',
    requiredTypes: ['yoga', 'pilates', 'meditation'],
    icon: 'infinite-outline',
    color: '#8E44AD',
    description: 'Yoga, pilates ve meditasyon ile zirvede zihin-beden.',
    aiInsight:
      'Bu üçlü kombinasyon nöromusküler koordinasyonu ve mental berraklığı en üst seviyeye taşır.',
    xpBonus: 200,
    badge: '✨',
  },
  {
    id: 'pilates_stretch',
    nametr: 'Esnek Güç',
    requiredTypes: ['pilates', 'stretching'],
    icon: 'body-outline',
    color: '#76448A',
    description: 'Pilates ve esneme ile core gücü ve esneklik.',
    aiInsight: 'Pilates core aktivasyonu esneme ile birleşince postür bozukluklarını düzeltir.',
    xpBonus: 110,
    badge: '💪',
  },
  {
    id: 'dance_yoga',
    nametr: 'Ritmik Denge',
    requiredTypes: ['dance', 'yoga'],
    icon: 'musical-notes-outline',
    color: '#E91E63',
    description: 'Dans ve yoga ile ritim ve denge bir arada.',
    aiInsight: 'Dans + yoga kombinasyonu koordinasyon ve propriosepsiyonu %35 geliştirir.',
    xpBonus: 130,
    badge: '💃🧘',
  },

  // ─── Spor + Toparlanma ────────────────────────────────────────────────────
  {
    id: 'tennis_recovery',
    nametr: 'Tenis Toparlanması',
    requiredTypes: ['tennis', 'stretching'],
    optionalTypes: ['sauna', 'massage'],
    icon: 'tennisball-outline',
    color: '#F1C40F',
    description: 'Tenis maçı sonrası özel toparlanma protokolü.',
    aiInsight: 'Tenis sonrası esneme, tekrarlayan omuz yaralanmalarını %60 oranında önler.',
    xpBonus: 100,
    badge: '🎾',
  },
  {
    id: 'padel_recovery',
    nametr: 'Padel Toparlanması',
    requiredTypes: ['padel', 'stretching'],
    optionalTypes: ['sauna', 'massage'],
    icon: 'tennisball-outline',
    color: '#F39C12',
    description: 'Padel sonrası kas gruplarını dinlendiren esneme.',
    aiInsight:
      "Padel'in yoğun lateral hareketleri sonrası hedefli esneme diz yaralanmalarını önler.",
    xpBonus: 100,
    badge: '🏓',
  },
  {
    id: 'boxing_recovery',
    nametr: 'Boksör Toparlanması',
    requiredTypes: ['boxing', 'stretching'],
    optionalTypes: ['cold_pool', 'massage'],
    icon: 'hand-left-outline',
    color: '#E74C3C',
    description: 'Boks antrenmanı sonrası optimal toparlanma.',
    aiInsight: 'Boks sonrası üst vücut esnemesi kas liflerinin mikro hasarını hızla onarır.',
    xpBonus: 110,
    badge: '🥊',
  },

  // ─── Doğa & Outdoor ───────────────────────────────────────────────────────
  {
    id: 'trail_warrior',
    nametr: 'Patika Savaşçısı',
    requiredTypes: ['hiking', 'running'],
    icon: 'trail-sign-outline',
    color: '#2ECC71',
    description: 'Doğa yürüyüşü ve koşu ile outdoor kardiyo.',
    aiInsight: 'Doğal zemin antrenmanı, düz zemine göre %20 daha fazla kas aktivasyonu sağlar.',
    xpBonus: 160,
    badge: '⛰️🏃',
  },
  {
    id: 'outdoor_zen',
    nametr: 'Dışarıda Huzur',
    requiredTypes: ['hiking', 'meditation'],
    icon: 'compass-outline',
    color: '#1E8449',
    description: 'Doğa yürüyüşü ve meditasyon ile ruhsal toparlanma.',
    aiInsight:
      'Doğada meditasyon, kapalı alanda yapılana göre stres azaltma etkisini 3 katına çıkarır.',
    xpBonus: 130,
    badge: '🌿🧘',
  },
  {
    id: 'nature_full',
    nametr: 'Tam Doğa Günü',
    requiredTypes: ['hiking', 'running', 'meditation'],
    icon: 'earth-outline',
    color: '#145A32',
    description: 'Yürüyüş, koşu ve meditasyon ile mükemmel outdoor günü.',
    aiInsight:
      'Açık havada fiziksel + mental aktivite kombinasyonu serotonin üretimini maksimize eder.',
    xpBonus: 220,
    badge: '🏔️✨',
  },

  // ─── Savaşçı Protokolü ────────────────────────────────────────────────────
  {
    id: 'warrior_cardio',
    nametr: 'Savaşçı Kardiyo',
    requiredTypes: ['boxing', 'running'],
    icon: 'flame-outline',
    color: '#C0392B',
    description: 'Boks ve koşu ile patlayıcı savaşçı kondisyonu.',
    aiInsight:
      'Boks + koşu kombinasyonu hem anaerobik hem aerobik kapasiteyi aynı anda geliştirir.',
    xpBonus: 170,
    badge: '🥊🏃',
  },
  {
    id: 'fighter_protocol',
    nametr: 'Dövüşçü Protokolü',
    requiredTypes: ['boxing', 'running', 'jump_rope'],
    icon: 'skull-outline',
    color: '#922B21',
    description: 'Profesyonel dövüşçü antrenman programı.',
    aiInsight:
      'Bu üçlü kombinasyon profesyonel boksörlerin maç hazırlığında kullandığı temel protokoldür.',
    xpBonus: 280,
    badge: '🥇🥊',
  },

  // ─── Sosyal Spor ──────────────────────────────────────────────────────────
  {
    id: 'team_sports',
    nametr: 'Takım Oyuncusu',
    requiredTypes: ['football', 'basketball'],
    icon: 'people-outline',
    color: '#2471A3',
    description: 'Futbol ve basketbol ile çift takım sporu.',
    aiInsight:
      'Birden fazla takım sporu oynamak sosyal bağları güçlendirir ve farklı beceri setleri geliştirir.',
    xpBonus: 150,
    badge: '⚽🏀',
  },
  {
    id: 'net_sports',
    nametr: 'File Sporları',
    requiredTypes: ['tennis', 'volleyball'],
    optionalTypes: ['padel'],
    icon: 'grid-outline',
    color: '#1ABC9C',
    description: 'Tenis ve voleybol ile file sporlarında çift servis.',
    aiInsight: 'File sporları üst vücut patlamalı gücü ve tepki süresini birlikte geliştirir.',
    xpBonus: 160,
    badge: '🎾🏐',
  },
  {
    id: 'racket_master',
    nametr: 'Raket Ustası',
    requiredTypes: ['tennis', 'padel'],
    icon: 'trophy-outline',
    color: '#F4D03F',
    description: 'Tenis ve padel ile raket sporlarında çift antrenman.',
    aiInsight: 'İki raket sporu aynı gün oynamak el-göz koordinasyonunu üst düzeyde pekiştirir.',
    xpBonus: 140,
    badge: '🎾🏓',
  },

  // ─── Yüksek Zorluk / Tam Gün ─────────────────────────────────────────────
  {
    id: 'iron_day',
    nametr: 'Demir Gün',
    requiredTypes: ['running', 'swimming', 'cycling'],
    icon: 'barbell-outline',
    color: '#717D7E',
    description: 'Triatlon hazırlığı: koşu, yüzme, bisiklet.',
    aiInsight:
      'Triatlon üçlüsü tüm kardiyovasküler sistemi aynı anda zorlayan elit antrenman formatıdır.',
    xpBonus: 300,
    badge: '🏅',
  },
  {
    id: 'sunrise_to_sunset',
    nametr: 'Günden Güne',
    requiredTypes: ['running', 'yoga'],
    optionalTypes: ['meditation', 'stretching'],
    icon: 'sunny-outline',
    color: '#F0B27A',
    description: 'Sabah koşusu, akşam yoga ile tam gün denge.',
    aiInsight: 'Sabah yüksek yoğunluk + akşam restoratif egzersiz, sirkadiyen ritmi optimize eder.',
    xpBonus: 130,
    badge: '🌅🌙',
  },
  {
    id: 'ultimate_athlete',
    nametr: 'Nihai Atlet',
    requiredTypes: ['running', 'swimming', 'boxing', 'yoga'],
    icon: 'star-outline',
    color: '#F1C40F',
    description: 'Dört farklı disiplin ile atletik mükemmellik.',
    aiInsight:
      'Güç, dayanıklılık, esneklik ve dövüş sanatlarını bir araya getiren nadir kombinasyon.',
    xpBonus: 300,
    badge: '🌟',
  },

  // ─── Golf & Zihin ─────────────────────────────────────────────────────────
  {
    id: 'golf_zen',
    nametr: 'Golf & Meditasyon',
    requiredTypes: ['golf', 'meditation'],
    icon: 'golf-outline',
    color: '#52BE80',
    description: 'Golf ve meditasyon ile odak ve hassasiyeti birleştir.',
    aiInsight:
      'Meditasyon golf performansını artırır; baskı altında vuruş tutarlılığı %20 iyileşir.',
    xpBonus: 120,
    badge: '⛳🧘',
  },
  {
    id: 'golf_walk',
    nametr: 'Yürüyen Golfçü',
    requiredTypes: ['golf', 'walking'],
    icon: 'walk-outline',
    color: '#58D68D',
    description: 'Golf sahası yürüyüşü ile aktif dinlenme günü.',
    aiInsight:
      "18 delik golf sahasında yürümek ortalama 8 km'ye eşdeğer düşük yoğunluklu kardiyo sağlar.",
    xpBonus: 80,
    badge: '⛳🚶',
  },

  // ─── Dans & Dinamik ───────────────────────────────────────────────────────
  {
    id: 'dance_cardio',
    nametr: 'Dans Kardiyo',
    requiredTypes: ['dance', 'jump_rope'],
    icon: 'musical-notes-outline',
    color: '#E91E63',
    description: 'Dans ve atlama ipi ile eğlenceli yoğun kardiyo.',
    aiInsight:
      'Ritmik hareketler + atlama ipi koordinasyon ve kardiyovasküler kapasiteyi birlikte geliştirir.',
    xpBonus: 140,
    badge: '💃⚡',
  },
  {
    id: 'mindful_movement',
    nametr: 'Bilinçli Hareket',
    requiredTypes: ['dance', 'yoga', 'meditation'],
    icon: 'sparkles-outline',
    color: '#A569BD',
    description: 'Dans, yoga ve meditasyon ile bütünsel hareket.',
    aiInsight:
      'Fiziksel ifade + esneklik + mindfulness üçlüsü emosyonel zekanın fiziksel yansımasıdır.',
    xpBonus: 190,
    badge: '🌸',
  },

  // ─── Hafif Aktif Toparlanma ───────────────────────────────────────────────
  {
    id: 'active_recovery',
    nametr: 'Aktif Dinlenme',
    requiredTypes: ['walking', 'stretching'],
    optionalTypes: ['meditation'],
    icon: 'walk-outline',
    color: '#85C1E9',
    description: 'Yürüyüş ve esneme ile aktif toparlanma günü.',
    aiInsight:
      'Düşük yoğunluklu aktif toparlanma, tam dinlenmeden daha hızlı kas iyileşmesi sağlar.',
    xpBonus: 80,
    badge: '🌿',
  },
  {
    id: 'massage_stretch',
    nametr: 'Derin Toparlanma',
    requiredTypes: ['massage', 'stretching'],
    optionalTypes: ['meditation'],
    icon: 'hand-right-outline',
    color: '#A9CCE3',
    description: 'Masaj ve esneme ile derin kas toparlanması.',
    aiInsight:
      'Masaj sonrası esneme, miyofasyal bağ dokusunu yumuşatarak hareket açıklığını artırır.',
    xpBonus: 90,
    badge: '💆',
  },
];

/**
 * O günün activityType listesini alır, tetiklenen combo'ları döner.
 * Daha yüksek XP bonusu olan combo'lar önce gelir.
 */
export function detectCombos(activityTypes: string[]): ActivityCombo[] {
  const typeSet = new Set(activityTypes);

  const triggered = ACTIVITY_COMBOS.filter((combo) => {
    const allRequired = combo.requiredTypes.every((t) => typeSet.has(t));
    return allRequired;
  });

  // XP bonusuna göre büyükten küçüğe sırala
  return triggered.sort((a, b) => b.xpBonus - a.xpBonus);
}

/**
 * Tetiklenen combo'ların toplam XP bonusunu hesaplar.
 */
export function calculateComboXP(activityTypes: string[]): number {
  return detectCombos(activityTypes).reduce((total, combo) => total + combo.xpBonus, 0);
}

/**
 * Belirli bir aktivite tipinin dahil olduğu potansiyel combo'ları listeler.
 * Kullanıcıya "şunu da yap, combo aç" önerisi için kullanılır.
 */
export function getSuggestedCombos(
  currentTypes: string[],
): Array<{ combo: ActivityCombo; missingTypes: string[] }> {
  const typeSet = new Set(currentTypes);

  return ACTIVITY_COMBOS.filter((combo) => {
    // Zaten tetiklenmiş combo'ları atla
    const alreadyTriggered = combo.requiredTypes.every((t) => typeSet.has(t));
    if (alreadyTriggered) return false;

    // En az 1 required tipi mevcut olan combo'ları öner
    const hasAtLeastOne = combo.requiredTypes.some((t) => typeSet.has(t));
    return hasAtLeastOne;
  })
    .map((combo) => ({
      combo,
      missingTypes: combo.requiredTypes.filter((t) => !typeSet.has(t)),
    }))
    .sort((a, b) => a.missingTypes.length - b.missingTypes.length);
}
