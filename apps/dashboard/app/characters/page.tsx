import { Plus, MoreHorizontal, Eye, MessageSquare } from 'lucide-react'
import { Shell } from '@/components/shell/Shell'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'

const characters = [
  {
    name: 'Mia',
    status: 'Yayında',
    rentals: 124,
    messages: '42K',
    earnings: '$642',
    gradient: 'from-emerald-400/40 via-green-500/25 to-lime-500/30',
  },
  {
    name: 'Berk',
    status: 'Yayında',
    rentals: 38,
    messages: '11K',
    earnings: '$184',
    gradient: 'from-teal-500/40 via-emerald-600/25 to-green-700/30',
  },
  {
    name: 'Defne',
    status: 'Onayda',
    rentals: 0,
    messages: '0',
    earnings: '—',
    gradient: 'from-lime-400/40 via-emerald-500/25 to-teal-600/30',
  },
]

export default function CharactersPage() {
  return (
    <Shell>
      <PageHeader
        title="Karakterlerim"
        description="Yarattığın karakterleri buradan yönet."
        action={
          <Button variant="accent">
            <Plus className="h-4 w-4" />
            Yeni Karakter
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((char) => (
          <div
            key={char.name}
            className="group overflow-hidden rounded-2xl border border-border bg-bg-elevated transition-all hover:border-border-strong"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${char.gradient} transition-transform duration-700 ease-out group-hover:scale-105`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated/80 to-transparent" />
              <div className="absolute left-3 top-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    char.status === 'Yayında'
                      ? 'border border-accent/30 bg-accent/20 text-accent'
                      : 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {char.status}
                </span>
              </div>
              <button
                aria-label="Daha fazla"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg/60 text-ink-muted backdrop-blur transition-all hover:bg-bg/80 hover:text-ink"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <h3 className="mb-4 text-[18px] font-semibold tracking-tight">{char.name}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-subtle">Kira</p>
                  <p className="text-[15px] font-semibold">{char.rentals}</p>
                </div>
                <div className="border-x border-border">
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-subtle">Mesaj</p>
                  <p className="text-[15px] font-semibold">{char.messages}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-ink-subtle">
                    Kazanç
                  </p>
                  <p className="text-[15px] font-semibold text-accent">{char.earnings}</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Eye className="h-3.5 w-3.5" />
                  Önizle
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Düzenle
                </Button>
              </div>
            </div>
          </div>
        ))}

        <button className="group flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border text-ink-muted transition-all hover:border-accent/40 hover:bg-accent/5 hover:text-accent">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white/5 transition-all group-hover:border-accent/40 group-hover:bg-accent/10">
            <Plus className="h-5 w-5" />
          </div>
          <p className="text-[14px] font-medium">Yeni Karakter Yarat</p>
          <p className="text-[12px] text-ink-subtle">Onaydan sonra yayınlanır</p>
        </button>
      </div>
    </Shell>
  )
}
