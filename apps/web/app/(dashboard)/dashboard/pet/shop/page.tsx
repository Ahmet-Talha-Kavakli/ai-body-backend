'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const ITEMS = [
  { id: 'wizard_hat', name: 'Sihirbaz Şapkası', type: 'accessory', cost: 150, emoji: '🎩' },
  { id: 'santa_hat', name: 'Noel Şapkası', type: 'accessory', cost: 200, emoji: '🎅' },
  { id: 'superhero', name: 'Süper Kahraman', type: 'outfit', cost: 300, emoji: '🦸' },
  { id: 'astronaut', name: 'Astronot', type: 'outfit', cost: 400, emoji: '👨‍🚀' },
  { id: 'crown', name: 'Taç', type: 'accessory', cost: 500, emoji: '👑' },
  { id: 'rainbow', name: 'Gökkuşağı Kıyafeti', type: 'outfit', cost: 600, emoji: '🌈' },
]

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pet">
          <ArrowLeft size={20} className="text-white/60" />
        </Link>
        <h1 className="text-xl font-black text-white">Kozmetik Mağaza 🛍️</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.95 }}
            className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <div className="text-4xl">{item.emoji}</div>
            <p className="text-sm font-bold text-white">{item.name}</p>
            <p className="text-xs capitalize text-white/40">
              {item.type === 'outfit' ? 'Kıyafet' : 'Aksesuar'}
            </p>
            <button className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 py-2 text-xs font-bold text-amber-400">
              🪙 {item.cost}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
