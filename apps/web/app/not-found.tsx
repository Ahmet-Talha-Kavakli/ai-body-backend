import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-black">404</h1>
        <p className="text-muted-foreground">Sayfa bulunamadı</p>
        <p className="text-sm text-muted-foreground">Aradığın sayfa mevcut değil</p>
        <Link href="/">
          <Button>Ana Sayfaya Git</Button>
        </Link>
      </div>
    </div>
  )
}
