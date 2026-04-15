export type PersonaId = 'fitness' | 'dietitian' | 'health' | 'motivation' | 'pt' | 'general'

export interface Persona {
  id: PersonaId
  name: string
  role: string
  description: string
  personality: string
  emoji: string
  gradient: string
  accentColor: string
  borderColor: string
  bgColor: string
  vapiPromptKey: string
}

export const PERSONAS: Record<PersonaId, Persona> = {
  fitness: {
    id: 'fitness',
    name: 'Alex',
    role: 'AI Fitness Antrenörü',
    description: 'Egzersiz programları, antrenman teknikleri ve performans optimizasyonu.',
    personality: 'Motive edici, sert ama destekleyici, sonuç odaklı.',
    emoji: '💪',
    gradient: 'from-orange-500 to-red-500',
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    vapiPromptKey: 'fitness',
  },
  dietitian: {
    id: 'dietitian',
    name: 'Dr. Ayşe',
    role: 'AI Diyetisyen',
    description:
      'Beslenme planları, kalori takibi, diyet stratejileri ve sağlıklı tarif önerileri.',
    personality: 'Bilimsel, sakin, pratik çözümler sunan.',
    emoji: '🥗',
    gradient: 'from-green-500 to-emerald-500',
    accentColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    vapiPromptKey: 'dietitian',
  },
  health: {
    id: 'health',
    name: 'Dr. Can',
    role: 'AI Sağlık Koçu',
    description: 'Genel sağlık değerlendirmesi, uyku kalitesi, stres yönetimi ve wellness.',
    personality: 'Dinleyici, empatik, bütünsel yaklaşım.',
    emoji: '❤️',
    gradient: 'from-pink-500 to-rose-500',
    accentColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    bgColor: 'bg-pink-500/10',
    vapiPromptKey: 'health',
  },
  motivation: {
    id: 'motivation',
    name: 'Max',
    role: 'Motivasyon Koçu',
    description: 'Hedef belirleme, zihinsel güç, motivasyon artırma ve alışkanlık geliştirme.',
    personality: 'Enerjik, ilham verici, pozitif.',
    emoji: '⚡',
    gradient: 'from-yellow-500 to-amber-500',
    accentColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    vapiPromptKey: 'motivation',
  },
  pt: {
    id: 'pt',
    name: 'Coach Mert',
    role: 'Personal Trainer',
    description: 'Egzersiz formu, kişisel antrenman planı, güç ve kondisyon programları.',
    personality: 'Teknik, detay odaklı, disiplinli.',
    emoji: '🏋️',
    gradient: 'from-blue-500 to-indigo-500',
    accentColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    vapiPromptKey: 'pt',
  },
  general: {
    id: 'general',
    name: 'Aria',
    role: 'Genel Asistan',
    description: 'Her konuda yardım — antrenman, beslenme, sağlık, motivasyon ve daha fazlası.',
    personality: 'Çok yönlü, akıllı, her soruya cevap verebilen.',
    emoji: '✨',
    gradient: 'from-indigo-500 to-purple-500',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    vapiPromptKey: 'general',
  },
}
