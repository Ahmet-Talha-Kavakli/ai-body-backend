/**
 * Silinemeyen ana içecekler — kullanıcının yanlışlıkla silmesini istemeyeceğimiz temel içecekler.
 * Bu drinkType'lar için DELETE engellenir, swipe ile sadece "Gizle" gösterilir.
 */
export const PROTECTED_DRINK_TYPES: ReadonlySet<string> = new Set([
  'water_still',
  'water_sparkling',
  'tea_green',
  'coffee_filter',
  'coffee_espresso',
  'dairy_milk',
  'juice_orange',
  'soda_cola',
])

export function isProtectedDrinkType(drinkType: string | null | undefined): boolean {
  if (!drinkType) return false
  return PROTECTED_DRINK_TYPES.has(drinkType)
}
