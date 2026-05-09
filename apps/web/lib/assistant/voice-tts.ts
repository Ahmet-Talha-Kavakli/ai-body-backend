/**
 * V4.5 Madde 3 — ElevenLabs TTS wrapper (duygu yüklü)
 *
 * Karakterin metnini sese çevirir. Multilingual v2 (TR destekli).
 * voice_settings karakterin currentMood'una göre DİNAMİK ayarlanır —
 * robot gibi değil, duyguyu yansıtır.
 */

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1'

// Türkçe-uyumlu sesler — ElevenLabs free tier default voices
export const DEFAULT_FEMALE_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku' // Lily — genç, sıcak, TR'de doğal
export const DEFAULT_MALE_VOICE_ID = 'TxGEqnHWrfWFTfGW9XjX' // Josh — derin, sakin

export interface TTSResult {
  audioBuffer: Buffer
  contentType: 'audio/mpeg'
  characterCount: number
}

export type CharacterMood =
  | 'happy'
  | 'excited'
  | 'sad'
  | 'tired'
  | 'angry'
  | 'anxious'
  | 'calm'
  | 'neutral'
  | string

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

/**
 * Mood → voice_settings mapping.
 *
 * stability:  düşük = daha duygusal/değişken; yüksek = monoton/sakin
 * style:      düşük = doğal; yüksek = abartılı/expresif
 * similarity: 0.7-0.85 arası ses kimliğini korur
 */
function moodToVoiceSettings(mood: CharacterMood): VoiceSettings {
  switch (mood) {
    case 'happy':
      return { stability: 0.35, similarity_boost: 0.75, style: 0.55, use_speaker_boost: true }
    case 'excited':
      return { stability: 0.25, similarity_boost: 0.75, style: 0.7, use_speaker_boost: true }
    case 'sad':
      return { stability: 0.7, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true }
    case 'tired':
      return { stability: 0.75, similarity_boost: 0.8, style: 0.15, use_speaker_boost: false }
    case 'angry':
      return { stability: 0.3, similarity_boost: 0.75, style: 0.65, use_speaker_boost: true }
    case 'anxious':
      return { stability: 0.4, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true }
    case 'calm':
      return { stability: 0.6, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true }
    case 'neutral':
    default:
      return { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true }
  }
}

export async function synthesizeSpeech(
  text: string,
  options?: {
    voiceId?: string
    mood?: CharacterMood
    overrideSettings?: Partial<VoiceSettings>
  }
): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing')

  const voiceId = options?.voiceId || DEFAULT_FEMALE_VOICE_ID
  const baseSettings = moodToVoiceSettings(options?.mood || 'neutral')
  const voice_settings = { ...baseSettings, ...(options?.overrideSettings || {}) }

  const res = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${err}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    contentType: 'audio/mpeg',
    characterCount: text.length,
  }
}
