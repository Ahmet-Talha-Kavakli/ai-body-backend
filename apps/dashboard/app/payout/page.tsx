import { Banknote, Shield, Globe, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'

const benefits = [
  {
    icon: Globe,
    title: '46+ ülkede payout',
    body: 'Banka hesabına direkt çekim. Türkiye dahil dünyanın çoğu yerinde.',
  },
  {
    icon: Shield,
    title: "KYC ve güvenlik Stripe'ta",
    body: 'Kimlik doğrulama, vergi formu, fraud koruma — Stripe halleder.',
  },
  {
    icon: Banknote,
    title: "Min. $20'dan itibaren",
    body: 'Haftalık otomatik veya manuel çekim. Komisyon yok.',
  },
]

const history = [
  {
    date: '2026-04-30',
    amount: '$847.20',
    status: 'Tamamlandı',
    method: 'Banka hesabı ····4821',
  },
  {
    date: '2026-03-31',
    amount: '$623.40',
    status: 'Tamamlandı',
    method: 'Banka hesabı ····4821',
  },
  {
    date: '2026-02-28',
    amount: '$412.10',
    status: 'Tamamlandı',
    method: 'Banka hesabı ····4821',
  },
]

const STRIPE_CONNECTED = false

export default function PayoutPage() {
  return (
    <Shell>
      <PageHeader
        title="Çekim"
        description="Kazandığın parayı banka hesabına çek. Stripe Connect ile güvenli ödeme."
      />

      {!STRIPE_CONNECTED && (
        <Card className="mb-8 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-accent/40 bg-accent/20">
              <Banknote className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="mb-2 text-[20px] font-bold tracking-tight">Para çekmeye hazırlan</h2>
              <p className="max-w-2xl text-[14px] leading-relaxed text-ink-muted">
                Stripe ile bağlantı kur, kimliğini doğrula, banka hesabını ekle. ~5 dakika sürer.
                Tek seferlik işlem.
              </p>
            </div>
            <Button variant="accent" size="lg" className="flex-shrink-0">
              Stripe ile Bağlan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-border pt-8 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/5">
                  <b.icon className="h-4 w-4 text-accent" />
                </div>
                <h3 className="mb-1 text-[15px] font-semibold tracking-tight">{b.title}</h3>
                <p className="text-[13px] leading-relaxed text-ink-muted">{b.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Stat label="Çekilebilir Bakiye" value="$382" icon={Banknote} />
        <Stat label="Bekleyen (Onay)" value="$148" />
        <Stat label="Toplam Çekilen" value="$1.882" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Çekim Geçmişi</CardTitle>
            <CardDescription>Yaptığın tüm payout talepleri ve durumları.</CardDescription>
          </CardHeader>

          {history.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-ink-muted">Henüz çekim yapmadın.</p>
            </div>
          ) : (
            <ul className="-mx-6 divide-y divide-border">
              {history.map((h, idx) => (
                <li key={idx} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-[14px] font-medium">{h.amount}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{h.method}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      <CheckCircle2 className="h-3 w-3" />
                      {h.status}
                    </span>
                    <p className="mt-1 text-[12px] text-ink-subtle">{h.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sıkça Sorulanlar</CardTitle>
          </CardHeader>
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-[13px] font-medium">Para ne zaman gelir?</p>
              <p className="text-[12px] leading-relaxed text-ink-muted">
                Çekim onaylandıktan sonra 1-3 iş günü içinde banka hesabına geçer.
              </p>
            </div>
            <div>
              <p className="mb-1 text-[13px] font-medium">Komisyon var mı?</p>
              <p className="text-[12px] leading-relaxed text-ink-muted">
                FitAI komisyon almaz. Stripe banka transferi ücreti varsa ($0.25 civarı) bakiyeden
                düşer.
              </p>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-[13px] font-medium">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Vergi sorumluluğu
              </p>
              <p className="text-[12px] leading-relaxed text-ink-muted">
                Yıllık gelir vergisi senin sorumluluğunda. Stripe yıllık rapor sağlar.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  )
}
