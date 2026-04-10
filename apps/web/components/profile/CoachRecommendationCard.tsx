'use client'

import { motion } from 'framer-motion'
import { Apple, Zap, Dumbbell, AlertTriangle, Sparkles, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Recommendation {
  nutrition?: string[]
  recovery?: string[]
  training?: string[]
  injury?: string[]
}

interface CoachRecommendationCardProps {
  recommendations?: Recommendation | null
  isLoading?: boolean
  className?: string
}

const SECTIONS = [
  {
    key: 'nutrition' as const,
    label: 'Beslenme',
    icon: Apple,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    key: 'recovery' as const,
    label: 'Toparlanma',
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    key: 'training' as const,
    label: 'Antrenman',
    icon: Dumbbell,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    key: 'injury' as const,
    label: 'Sakatlık',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
]

const MOCK_RECOMMENDATIONS: Recommendation = {
  nutrition: [
    'Antrenman öncesi karbonhidrat alımını artır.',
    'Günlük protein hedefini karşıladığından emin ol.',
    'Seans sonrası 30 dakika içinde whey protein tüket.',
  ],
  recovery: [
    'Uyku süresini 7-8 saate çıkarmaya çalış.',
    'Aktif toparlanma için hafif yürüyüş ve esneme yap.',
    'Foam roller ile kas gevşetmeyi ihmal etme.',
  ],
  training: [
    'Bu hafta ağırlıkları %5 artırabilirsin.',
    'Squat formuna özellikle dikkat et.',
    'Haftalık hacmini kademeli artır.',
  ],
  injury: [
    'Diz ağrısı için leg press yerine goblet squat tercih et.',
    'Antrenman öncesi ve sonrası diz bölgesini ısıt.',
  ],
}

export function CoachRecommendationCard({ recommendations, isLoading, className }: CoachRecommendationCardProps) {
  const data = recommendations ?? MOCK_RECOMMENDATIONS

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn('bg-card/50 border-border/30 backdrop-blur-sm', className)}>
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Koç Önerileri</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Profiline göre kişiselleştirildi</p>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 size={18} className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Öneriler yükleniyor...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {SECTIONS.map(section => {
                const items = data[section.key]
                if (!items?.length) return null
                const Icon = section.icon
                return (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: SECTIONS.indexOf(section) * 0.08 }}
                    className={cn('p-4 rounded-xl border', section.bg, section.border)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={15} className={section.color} />
                      <p className={cn('text-xs font-bold uppercase tracking-wider', section.color)}>{section.label}</p>
                    </div>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', section.color.replace('text-', 'bg-'))} />
                          <span className="text-foreground/80 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
