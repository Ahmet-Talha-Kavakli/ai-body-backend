'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel = 'Onayla',
  loading,
}: Props) {
  const [typed, setTyped] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border-border/30 w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold">{title}</h3>
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
        <p className="mb-2 text-xs font-semibold">
          Devam etmek için <span className="text-red-400">"{confirmText}"</span> yazın:
        </p>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="border-border/30 bg-background mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500"
          placeholder={confirmText}
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setTyped('')
              onClose()
            }}
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={typed !== confirmText || loading}
            onClick={onConfirm}
          >
            {loading ? 'İşleniyor...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
