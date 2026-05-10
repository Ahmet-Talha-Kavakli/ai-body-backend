import { Shell } from '@/components/shell/Shell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  return (
    <Shell>
      <PageHeader
        title="Ayarlar"
        description="Hesap bilgilerin, bildirimler ve yaratıcı profilin."
      />

      <div className="grid max-w-3xl grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yaratıcı Profili</CardTitle>
            <CardDescription>Kullanıcıların seni nasıl gördüğü.</CardDescription>
          </CardHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-deep text-[24px] font-bold text-bg">
                T
              </div>
              <Button variant="secondary" size="sm">
                Resim Değiştir
              </Button>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Yaratıcı adı
              </label>
              <input
                type="text"
                defaultValue="Talha"
                className="h-10 w-full rounded-lg border border-border bg-white/5 px-3 text-[14px] transition-colors focus:border-border-strong focus:bg-white/10 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">
                Kullanıcı adı
              </label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-white/5 px-3 text-[14px] text-ink-muted">
                  fitai.com/@
                </span>
                <input
                  type="text"
                  defaultValue="talha"
                  className="h-10 flex-1 rounded-r-lg border border-border bg-white/5 px-3 text-[14px] transition-colors focus:border-border-strong focus:bg-white/10 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-muted">Bio</label>
              <textarea
                rows={3}
                defaultValue="Karakterler yazıyorum. Bazıları kalır, bazıları gider."
                className="w-full resize-none rounded-lg border border-border bg-white/5 px-3 py-2.5 text-[14px] transition-colors focus:border-border-strong focus:bg-white/10 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <Button variant="accent">Kaydet</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bildirimler</CardTitle>
            <CardDescription>Hangi olaylar için e-posta almak istersin?</CardDescription>
          </CardHeader>

          <div className="space-y-3">
            {[
              { label: 'Yeni kira / satın alma', enabled: true },
              { label: 'Çekim onaylandı', enabled: true },
              { label: 'Karakter onaylandı / reddedildi', enabled: true },
              { label: 'Haftalık özet', enabled: false },
              { label: 'Pazarlama e-postaları', enabled: false },
            ].map((n) => (
              <label
                key={n.label}
                className="flex cursor-pointer items-center justify-between py-2"
              >
                <span className="text-[14px]">{n.label}</span>
                <span
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    n.enabled ? 'bg-accent' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      n.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">Tehlikeli Bölge</CardTitle>
            <CardDescription>Geri alınamayan işlemler. Dikkatli ol.</CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="danger" size="md" className="sm:w-auto">
              Yaratıcılığı Bırak
            </Button>
            <Button variant="danger" size="md" className="sm:w-auto">
              Hesabı Sil
            </Button>
          </div>
        </Card>
      </div>
    </Shell>
  )
}
