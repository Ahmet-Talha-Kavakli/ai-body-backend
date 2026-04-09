'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-black">Oops!</h1>
        <p className="text-muted-foreground">Bir şeyler yanlış gitti</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={() => reset()}>Tekrar Dene</Button>
      </div>
    </div>
  )
}
