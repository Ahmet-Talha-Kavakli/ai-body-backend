import { Download, TrendingUp, DollarSign, Coins } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat } from '@/components/ui/Stat'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const transactions = [
  {
    date: '2026-05-08',
    character: 'Mia',
    type: 'Kira',
    user: '@ada_y',
    gross: '$5.99',
    net: '$3.59',
  },
  {
    date: '2026-05-08',
    character: 'Mia',
    type: 'Kira',
    user: '@cem.42',
    gross: '$5.99',
    net: '$3.59',
  },
  {
    date: '2026-05-07',
    character: 'Kerem',
    type: 'Satın Alma',
    user: '@melih.05',
    gross: '$59.99',
    net: '$35.99',
  },
  {
    date: '2026-05-07',
    character: 'Mia',
    type: 'Kira',
    user: '@dilara_xx',
    gross: '$5.99',
    net: '$3.59',
  },
  {
    date: '2026-05-06',
    character: 'Mia',
    type: 'Hediye Kira',
    user: '@yigit',
    gross: '$5.99',
    net: '$3.59',
  },
]

export default function EarningsPage() {
  return (
    <Shell>
      <PageHeader
        title="Kazanç"
        description="Karakterlerinden gelen tüm gelirler ve dönemsel özeti."
        action={
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            CSV İndir
          </Button>
        }
      />

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Bu Ay (Brüt)"
          value="$2.078"
          delta={{ value: '%12 geçen aya göre', positive: true }}
          icon={DollarSign}
        />
        <Stat
          label="Bu Ay (Net %60)"
          value="$1.247"
          delta={{ value: '%12 geçen aya göre', positive: true }}
          icon={TrendingUp}
        />
        <Stat label="Toplam Kira" value="284" icon={Coins} />
        <Stat label="Ort. Kira/Gün" value="9.4" delta={{ value: '%4 düşüş', positive: false }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
          <CardDescription>
            Brüt — kullanıcı ödemesi. Net — Apple/Stripe kesintisi sonrası senin payın (%60).
          </CardDescription>
        </CardHeader>

        <div className="-mx-6 overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] uppercase tracking-wider text-ink-subtle">
                <th className="px-6 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Karakter</th>
                <th className="px-4 py-3 font-medium">Tip</th>
                <th className="px-4 py-3 font-medium">Kullanıcı</th>
                <th className="px-4 py-3 text-right font-medium">Brüt</th>
                <th className="px-6 py-3 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t, idx) => (
                <tr key={idx} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-ink-muted">{t.date}</td>
                  <td className="px-4 py-4 font-medium">{t.character}</td>
                  <td className="px-4 py-4 text-ink-muted">{t.type}</td>
                  <td className="px-4 py-4 text-ink-muted">{t.user}</td>
                  <td className="px-4 py-4 text-right text-ink-muted">{t.gross}</td>
                  <td className="px-6 py-4 text-right font-semibold text-accent">{t.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  )
}
