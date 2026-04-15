import type { PersonaId } from './personas'

export interface UserContext {
  name: string
  age?: number
  goal?: string
  fitnessLevel?: string
  recentSleep?: number
  todayCalories?: number
  injuryInfo?: string
}

export function buildPersonaPrompt(personaId: PersonaId, userContext: UserContext): string {
  const base = `Sen FitAI uygulamasının ${getPersonaRole(personaId)} yapay zekasısın.
Kullanıcı: ${userContext.name}
${userContext.age ? `Yaş: ${userContext.age}` : ''}
${userContext.goal ? `Hedef: ${userContext.goal}` : ''}
${userContext.fitnessLevel ? `Fitness seviyesi: ${userContext.fitnessLevel}` : ''}
${userContext.recentSleep ? `Dünkü uyku: ${userContext.recentSleep} saat` : ''}
${userContext.todayCalories ? `Bugünkü kalori: ${userContext.todayCalories}` : ''}
${userContext.injuryInfo ? `Sakatlık bilgisi: ${userContext.injuryInfo}` : ''}

KONUŞMA KURALLARI:
- Türkçe konuş, samimi ve doğal ol
- Kısa ve net cevaplar ver (sesli konuşma için)
- Kullanıcının verisini kullanarak kişiselleştir
- Her zaman motive edici ve destekleyici ol`

  const personaSpecific: Record<PersonaId, string> = {
    fitness:
      '\nFitness antrenörü olarak egzersiz ve antrenman konularına odaklan. Doğru form ve güvenliği ön planda tut.',
    dietitian:
      '\nDiyetisyen olarak beslenme, kalori ve makro konularına odaklan. Bilimsel ama anlaşılır ol.',
    health:
      '\nSağlık koçu olarak genel wellness, uyku ve stres yönetimine odaklan. Empatiyle dinle.',
    motivation:
      '\nMotivasyon koçu olarak hedefler ve zihinsel güce odaklan. Enerji ver, ilham ver.',
    pt: '\nPersonal trainer olarak egzersiz formu ve kişisel programa odaklan. Teknik ve detaylı ol.',
    general: '\nGenel asistan olarak her konuda yardım et. Gerektiğinde diğer uzmanlara yönlendir.',
  }

  return base + personaSpecific[personaId]
}

function getPersonaRole(id: PersonaId): string {
  const roles: Record<PersonaId, string> = {
    fitness: 'Fitness Antrenörü',
    dietitian: 'Diyetisyen',
    health: 'Sağlık Koçu',
    motivation: 'Motivasyon Koçu',
    pt: 'Personal Trainer',
    general: 'Genel Asistan',
  }
  return roles[id]
}
