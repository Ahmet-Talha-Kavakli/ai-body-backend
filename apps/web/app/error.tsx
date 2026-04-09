'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-black">Oops!</h1>
        <p className="text-muted-foreground">Bir şeyler yanlış gitti</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
