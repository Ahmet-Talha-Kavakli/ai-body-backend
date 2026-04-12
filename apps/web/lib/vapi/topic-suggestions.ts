export interface TopicChip {
  label: string
  prompt: string
}

interface TopicProfile {
  goals: string[]
  activeInjuries: string[]
  supplements: string[]
}

export function generateTopicSuggestions(profile: TopicProfile): TopicChip[] {
  const chips: TopicChip[] = [
    { label: 'Bugün ne yedim?', prompt: 'Bugünkü beslenme düzenimi değerlendir' },
    { label: 'Supplement öneri', prompt: 'Hedeflerime göre supplement öner' },
    { label: 'Kilo durumu', prompt: 'Bu haftaki kilo değişimimi analiz et' },
    { label: 'Uyku & toparlanma', prompt: 'Toparlanma sürecimi nasıl optimize ederim?' },
  ]

  if (profile.activeInjuries.length > 0) {
    chips.push({ label: 'Sakatlık ile spor', prompt: 'Sakatken nasıl antrenman yapabilirim?' })
  }

  if (profile.goals.includes('weight_loss')) {
    chips.push({ label: 'Kalori açığı', prompt: 'Bu hafta kalori açığım yeterli mi?' })
  }

  if (profile.goals.includes('muscle_gain')) {
    chips.push({
      label: 'Protein hedefi',
      prompt: 'Kas yapımı için günlük protein alımım yeterli mi?',
    })
  }

  return chips
}
