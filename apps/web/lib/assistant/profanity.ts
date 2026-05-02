/**
 * Türkçe + İngilizce küfür filtresi (kısa liste, hassas değil — sadece bariz olanları engelle).
 */

const BLOCKED = [
  // tr
  'amk',
  'aq',
  'orospu',
  'piç',
  'sik',
  'sikim',
  'sikik',
  'gavat',
  'göt',
  'siktir',
  'amına',
  'ananı',
  'pezo',
  'pezevenk',
  'ibne',
  'top',
  // en
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'pussy',
  'whore',
]

export function isProfane(name: string): boolean {
  const lower = name.toLowerCase().trim()
  return BLOCKED.some((b) => lower === b || lower.includes(b))
}

export function validateAssistantName(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'İsim boş olamaz' }
  if (value.length > 20) return { ok: false, error: 'En fazla 20 karakter' }
  if (value.length < 2) return { ok: false, error: 'En az 2 karakter' }
  if (isProfane(value)) return { ok: false, error: 'Bu ismi kullanamayız' }
  return { ok: true, value }
}
