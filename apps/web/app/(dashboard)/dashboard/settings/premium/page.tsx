'use client'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import { PLANS } from '@/lib/premium/features'

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">Premium</h1>
        <p className="text-sm text-white/50">Tüm özelliklere erişin</p>
      </div>

      <div className="space-y-4">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl border p-5 ${
              'popular' in plan && plan.popular
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            {'popular' in plan && plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white">
                  <Star size={10} /> Popüler
                </span>
              </div>
            )}

            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">
                    {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-white/40">/{plan.period}</span>}
                </div>
              </div>
              <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${plan.color}`} />
            </div>

            <ul className="mb-5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check size={14} className="shrink-0 text-green-400" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled={plan.id === 'free'}
              className={`w-full rounded-2xl py-3 text-sm font-bold transition-all ${
                plan.id === 'free'
                  ? 'cursor-not-allowed bg-white/5 text-white/30'
                  : `bg-gradient-to-r ${plan.color} text-white shadow-lg`
              }`}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
