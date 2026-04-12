'use client'

import { useRouter } from 'next/navigation'
import { OnboardingForm } from '@/components/profile/OnboardingForm'

export default function OnboardingPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="bg-bg-primary text-text-primary flex min-h-screen items-center justify-center p-4">
      <OnboardingForm onComplete={handleComplete} />
    </div>
  )
}
