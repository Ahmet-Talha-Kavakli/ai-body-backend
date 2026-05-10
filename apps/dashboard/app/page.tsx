import { TrendingUp, Users, Wallet, MessageCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Shell } from '@/components/shell/Shell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat } from '@/components/ui/Stat'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const recentEvents = [
  {
    title: 'Mia kiralandı',
    user: '@ada_y',
    amount: '+200 kredi',
    when: '12 dk önce',
  },
  {
    title: 'Kerem satın alındı',
    user: '@melih.05',
    amount: '+2.000 kredi',
    when: '2 sa önce',
  },
  {
    title: 'Yeni takipçi',
    user: '@zeynep.demir',
    amount: '',
    when: 'Dün',
  },
  {
    title: 'Mia kiralandı',
    user: '@can42',
    amount: '+200 kredi',
    when: 'Dün',
  },
]

export default function OverviewPage() {
  return (
    <Shell>
      <PageHeader
        title="Hoş geldin, Talha."
        description="Karakterlerinin son 30 gündeki performansı."
        action={
          <Link href="/payout">
            <Button variant="accent" size="md">
              <Wallet className="h-4 w-4" />
              Para Çek
            </Button>
          </Link>
        }
      />

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Bu Ay Kazanç"
          value="$1.247"
          delta={{ value: '%18 geçen aya göre', positive: true }}
          icon={TrendingUp}
        />
        <Stat
          label="Aktif Kullanıcı"
          value="3.412"
          delta={{ value: '%6 geçen aya göre', positive: true }}
          icon={Users}
        />
        <Stat
          label="Toplam Mesaj"
          value="128K"
          delta={{ value: '%24 geçen aya göre', positive: true }}
          icon={MessageCircle}
        />
        <Stat label="Bekleyen Bakiye" value="$382" icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Son Hareketler</CardTitle>
                <CardDescription>Karakterlerinle ilgili son aktiviteler.</CardDescription>
              </div>
              <Link
                href="/earnings"
                className="flex items-center gap-1 text-[13px] text-ink-muted transition-colors hover:text-ink"
              >
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <ul className="-mx-6 divide-y divide-border">
            {recentEvents.map((e, idx) => (
              <li key={idx} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{e.title}</p>
                  <p className="text-[13px] text-ink-muted">{e.user}</p>
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  {e.amount && <p className="text-[14px] font-semibold text-accent">{e.amount}</p>}
                  <p className="text-[12px] text-ink-subtle">{e.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sıradaki Adım</CardTitle>
            <CardDescription>Para çekmeye başlamadan önce hesabını doğrula.</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-white/5 p-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
                ✓
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Profil tamamlandı</p>
                <p className="text-[12px] text-ink-muted">Bio, avatar yüklü</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-white/5 p-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
                ✓
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">İlk karakter yayınlandı</p>
                <p className="text-[12px] text-ink-muted">Mia, 2026-04-12</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border border-accent/40" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-ink">Stripe hesabını bağla</p>
                <p className="mb-3 text-[12px] text-ink-muted">Para çekmek için zorunlu</p>
                <Link href="/payout">
                  <Button size="sm" variant="accent" className="w-full">
                    Şimdi Bağla
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  )
}
