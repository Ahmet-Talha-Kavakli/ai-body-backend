/**
 * Yeni kullanıcı için default açık (isVisible: true) gelen 20 temel içecek.
 * Geri kalan catalog drink'ler default kapalı — kullanıcı listesinde görünür ama
 * toggle off olarak gelir ve ana ekrandaki seçicide görünmez. İsteyen kullanıcı
 * "İçeceklerim" sekmesinden toggle ile açabilir.
 *
 * Kullanıcının kendi tercihi (UserDrinkPreference.isVisible) varsa o öncelikli;
 * bu liste yalnızca preference yokken devreye girer.
 */
export const ESSENTIAL_DRINK_TYPES: ReadonlySet<string> = new Set([
  // Su (3)
  'water_still',
  'water_sparkling',
  'water_coconut',

  // Çay (4)
  'tea_black',
  'tea_green',
  'tea_white',
  'tea_matcha',

  // Kahve (5)
  'coffee_espresso',
  'coffee_filter',
  'coffee_turkish',
  'coffee_latte',
  'coffee_cappuccino',

  // Bitki çayı (3)
  'herbal_chamomile',
  'herbal_mint',
  'herbal_sage',

  // Meyve suyu (2)
  'juice_orange',
  'juice_lemon',

  // Spor (1)
  'water_electrolyte',

  // Süt (2)
  'dairy_milk',
  'dairy_ayran',
])

export function isEssentialDrinkType(drinkType: string | null | undefined): boolean {
  if (!drinkType) return false
  return ESSENTIAL_DRINK_TYPES.has(drinkType)
}
