'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export function UserInitializer() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded || !user) return

    const init = async () => {
      const res = await fetch('/api/user/sync', { method: 'POST' })
      const data = await res.json()

      // Onboarding tamamlanmamışsa yönlendir
      if (!data.onboardingCompleted && window.location.pathname !== '/onboarding') {
        router.push('/onboarding')
      }
    }

    init()
  }, [isLoaded, user, router])

  return null
}
