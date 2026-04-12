import type { FitnessLevel } from '@fitai/shared-types'

export interface UserCoachProfile {
  name: string
  weightKg: number
  heightCm: number
  goals: string[]
  fitnessLevel: FitnessLevel
  injuries: string[]
  weeklyWorkouts: number
  supplements: string[]
}

export function buildFitnessCoachPrompt(profile: UserCoachProfile): string {
  return `Sen ${profile.name}'in kişisel fitness koçusun.

Kullanıcı profili:
- Kilo: ${profile.weightKg}kg, Boy: ${profile.heightCm}cm
- Hedef: ${profile.goals.join(', ')}
- Fitness seviyesi: ${profile.fitnessLevel}
- Aktif sakatlıklar: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'yok'}
- Bu hafta ${profile.weeklyWorkouts} antrenman yaptı
- Supplement stack: ${profile.supplements.length > 0 ? profile.supplements.join(', ') : 'belirtilmemiş'}

Türkçe konuş. Samimi, motive edici ve bilgi dolu ol.
Supplement, beslenme, kilo yönetimi, uyku, stres konularında danışmanlık ver.
Tıbbi teşhis koyma, genel tavsiye ver.`
}
