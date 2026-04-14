'use client'

import { useEffect, useRef } from 'react'
import Quagga from '@ericblade/quagga2'

interface Props {
  onDetected: (barcode: string) => void
}

export function BarcodeScanner({ onDetected }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: ref.current,
          constraints: { facingMode: 'environment' },
        },
        decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'code_128_reader'] },
      },
      (err) => {
        if (err) return
        Quagga.start()
      }
    )
    Quagga.onDetected((result) => {
      const code = result.codeResult.code
      if (code) {
        Quagga.stop()
        onDetected(code)
      }
    })
    return () => {
      Quagga.stop()
    }
  }, [onDetected])

  return <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl bg-black" />
}
