/**
 * Mobile araç ekranlarını açan tool'lar.
 * Backend tarafında bir "navigation intent" döner — mobile UI bunu yakalayıp ekrana geçer.
 */

import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const toolsActionDefs: ToolDefinition[] = [
  {
    name: 'start_breath_exercise',
    category: 'tools',
    description: 'Nefes egzersizi ekranını açar. Pattern: 478, box, resonance, triangle, deep.',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', enum: ['478', 'box', 'resonance', 'triangle', 'deep'] },
        durationMin: { type: 'number', default: 5 },
      },
    },
  },
  {
    name: 'start_meditation',
    category: 'tools',
    description: 'Meditasyon oturumunu başlatır. Kategori: sleep, morning, anxiety, focus, body.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['sleep', 'morning', 'anxiety', 'focus', 'body'] },
      },
    },
  },
  {
    name: 'play_sleep_sound',
    category: 'tools',
    description: 'Uyku/odaklanma sesi çalar (yağmur, beyaz gürültü, doğa vb).',
    parameters: {
      type: 'object',
      properties: {
        soundId: {
          type: 'string',
          description:
            'rain_light | rain_storm | forest | ocean | white | brown | piano | lofi | heartbeat',
        },
        timerMinutes: { type: 'number', description: '0=manuel, -1=sabaha', default: 30 },
      },
      required: ['soundId'],
    },
  },
  {
    name: 'measure_pulse',
    category: 'tools',
    description: 'Anlık nabız ölçüm ekranını açar (telefon kamerası ile).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'open_dream_journal',
    category: 'tools',
    description: 'Rüya yorumlama sohbetini açar.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'start_sleep_session',
    category: 'tools',
    description: 'Uyku takibi oturumu başlatma ekranını açar.',
    parameters: { type: 'object', properties: {} },
  },
]

export const toolsActionExecutors: Record<string, ToolExecutor> = {
  start_breath_exercise: {
    name: 'start_breath_exercise',
    execute: async ({ params }) => {
      const p = params as { pattern?: string; durationMin?: number }
      return {
        ok: true,
        data: {
          navigate: 'breath',
          patternId: p.pattern ?? '478',
          durationMin: p.durationMin ?? 5,
        },
        display: {
          title: 'Nefes egzersizi açılıyor',
          subtitle: `${labelPattern(p.pattern ?? '478')} • ${p.durationMin ?? 5} dk`,
          icon: 'lungs.fill',
          color: '#0A84FF',
        },
      } satisfies ToolResult
    },
  },
  start_meditation: {
    name: 'start_meditation',
    execute: async ({ params }) => {
      const p = params as { category?: string }
      return {
        ok: true,
        data: { navigate: 'meditation', category: p.category },
        display: {
          title: 'Meditasyon açılıyor',
          subtitle: labelMeditation(p.category),
          icon: 'leaf.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },
  play_sleep_sound: {
    name: 'play_sleep_sound',
    execute: async ({ params }) => {
      const p = params as { soundId: string; timerMinutes?: number }
      return {
        ok: true,
        data: { navigate: 'sounds', soundId: p.soundId, timerMinutes: p.timerMinutes ?? 30 },
        display: {
          title: 'Ses çalıyor',
          subtitle: `${labelSound(p.soundId)} • ${p.timerMinutes && p.timerMinutes > 0 ? p.timerMinutes + ' dk' : 'Manuel'}`,
          icon: 'speaker.wave.2.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
  measure_pulse: {
    name: 'measure_pulse',
    execute: async () => {
      return {
        ok: true,
        data: { navigate: 'pulse' },
        display: {
          title: 'Nabız ölçümü açılıyor',
          subtitle: 'Parmağını arka kameraya yerleştir',
          icon: 'heart.fill',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },
  open_dream_journal: {
    name: 'open_dream_journal',
    execute: async () => {
      return {
        ok: true,
        data: { navigate: 'dream' },
        display: {
          title: 'Rüya yorumlayıcısı açılıyor',
          icon: 'cloud.moon.fill',
          color: '#BF5AF2',
        },
      } satisfies ToolResult
    },
  },
  start_sleep_session: {
    name: 'start_sleep_session',
    execute: async () => {
      return {
        ok: true,
        data: { navigate: 'sleep_start' },
        display: {
          title: 'Uyku takibi açılıyor',
          icon: 'moon.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
}

function labelPattern(p: string) {
  return (
    (
      {
        '478': '4-7-8',
        box: 'Kutu',
        resonance: 'Rezonans',
        triangle: 'Üçgen',
        deep: 'Derin',
      } as Record<string, string>
    )[p] ?? p
  )
}
function labelMeditation(c?: string) {
  return (
    (
      {
        sleep: 'Uyku öncesi',
        morning: 'Sabah',
        anxiety: 'Anksiyete',
        focus: 'Odaklanma',
        body: 'Body scan',
      } as Record<string, string>
    )[c ?? ''] ?? 'Genel'
  )
}
function labelSound(s: string) {
  return (
    (
      {
        rain_light: 'Hafif yağmur',
        rain_storm: 'Fırtına',
        forest: 'Orman',
        ocean: 'Okyanus',
        white: 'Beyaz gürültü',
        brown: 'Kahverengi gürültü',
        piano: 'Piyano',
        lofi: 'Lo-fi',
        heartbeat: 'Kalp atışı',
      } as Record<string, string>
    )[s] ?? s
  )
}
