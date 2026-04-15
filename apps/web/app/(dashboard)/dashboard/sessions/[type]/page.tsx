import { notFound } from 'next/navigation'
import { VoiceSessionRoom } from '@/components/session/VoiceSessionRoom'
import { PERSONAS } from '@/lib/sessions/personas'
import type { PersonaId } from '@/lib/sessions/personas'

interface Props {
  params: Promise<{ type: string }>
}

export default async function SessionRoomPage({ params }: Props) {
  const { type } = await params

  if (!Object.keys(PERSONAS).includes(type)) {
    notFound()
  }

  return <VoiceSessionRoom personaId={type as PersonaId} />
}

export function generateStaticParams() {
  return Object.keys(PERSONAS).map((type) => ({ type }))
}
