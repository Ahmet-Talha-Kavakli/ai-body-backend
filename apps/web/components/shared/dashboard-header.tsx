'use client'

import { motion } from 'framer-motion'
import { Search, Bell } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { useState } from 'react'

export function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, title: 'New workout available', time: '5m ago' },
    { id: 2, title: 'Workout form improved 5%', time: '1h ago' },
    { id: 3, title: 'Time to log your nutrition', time: '2h ago' },
  ]

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border/50 bg-background/40 backdrop-blur sticky top-0 z-40"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workouts, nutrition..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border/50 bg-background/50 text-sm placeholder-muted-foreground focus:outline-none focus:border-green-500/30"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg border border-border/50 hover:bg-accent transition-colors relative"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-80 bg-background border border-border/50 rounded-lg shadow-lg"
              >
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="divide-y divide-border/30">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-foreground">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notif.time}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* User */}
          <div className="border-l border-border/30 pl-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
