'use client'

import { useRouter } from 'next/navigation'
import { Bell, Trophy, Zap, Flame, Droplets, Pill, Moon, Cat, Map, Utensils } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { motion, AnimatePresence } from 'framer-motion'
import { relativeTime } from '@/lib/notifications/relative-time'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import type { InAppNotification } from '@/hooks/useInAppNotifications'
import type { NotificationType } from '@prisma/client'
import { useState } from 'react'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  achievement: { icon: Trophy, color: 'text-yellow-400' },
  workout: { icon: Zap, color: 'text-green-400' },
  streak: { icon: Flame, color: 'text-orange-400' },
  water: { icon: Droplets, color: 'text-blue-400' },
  medication: { icon: Pill, color: 'text-red-400' },
  sleep: { icon: Moon, color: 'text-purple-400' },
  pet: { icon: Cat, color: 'text-amber-400' },
  roadmap: { icon: Map, color: 'text-indigo-400' },
  meal: { icon: Utensils, color: 'text-emerald-400' },
  system: { icon: Bell, color: 'text-white/70' },
}

function NotificationItem({ notif, onRead }: { notif: InAppNotification; onRead: () => void }) {
  const router = useRouter()
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
  const Icon = cfg.icon

  const handleClick = () => {
    onRead()
    if (notif.link) router.push(notif.link)
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${!notif.read ? 'bg-white/[0.03]' : ''}`}
    >
      <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`truncate text-sm font-semibold ${notif.read ? 'text-white/60' : 'text-white'}`}
          >
            {notif.title}
          </p>
          <span className="shrink-0 text-[10px] text-white/30">
            {relativeTime(new Date(notif.createdAt))}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/40">{notif.body}</p>
      </div>
      {!notif.read && <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />}
    </motion.button>
  )
}

export function NotificationPopover() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useInAppNotifications()
  const [open, setOpen] = useState(false)

  const handleRead = async (id: string) => {
    await markRead(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/5">
          <Bell size={20} className="text-white/70" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 border-white/10 bg-black/90 p-0 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-bold text-white">Bildirimler</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Hepsini okundu işaretle
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell size={24} className="text-white/20" />
              <p className="text-sm text-white/40">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={() => handleRead(notif.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
