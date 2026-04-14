'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { BarcodeScanner } from '../explore/BarcodeScanner'
import { lookupBarcode } from '@/lib/nutrition/openfoodfacts'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  open: boolean
  onClose: () => void
  onFound: (food: SearchResult) => void
}

export function BarcodeModal({ open, onClose, onFound }: Props) {
  const [status, setStatus] = useState<'scanning' | 'loading' | 'notfound'>('scanning')

  const handleDetected = async (barcode: string) => {
    setStatus('loading')
    const result = await lookupBarcode(barcode)
    if (result) {
      onFound(result)
      onClose()
    } else setStatus('notfound')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.34 }}
            className="w-full max-w-sm rounded-[1.5rem] border border-white/[0.06] p-[1px]"
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Barkod Tara</h3>
                <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.08]">
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>

              {status === 'scanning' && <BarcodeScanner onDetected={handleDetected} />}

              {status === 'loading' && (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-[#6366F1]" />
                </div>
              )}

              {status === 'notfound' && (
                <div className="flex h-64 flex-col items-center justify-center gap-3">
                  <p className="text-sm text-[#64748B]">Ürün bulunamadı</p>
                  <button
                    onClick={() => setStatus('scanning')}
                    className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
