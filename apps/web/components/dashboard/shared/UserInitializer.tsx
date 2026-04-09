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
      try {
        const res = await fetch('/api/user/sync', { method: 'POST' })
        if (!res.ok) return

        const data = await res.json()

        // Onboarding tamamlanmamışsa yönlendir
        if (!data.onboardingCompleted && typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('UserInitializer error:', error)
      }
    }

    init()
  }, [isLoaded, user, router])

  return null
}
