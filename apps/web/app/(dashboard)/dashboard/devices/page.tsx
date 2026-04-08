'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { GlobePulse } from '@/components/ui/cobe-globe-pulse'
import {
  Watch,
  Smartphone,
  Headphones,
  Activity,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

const DEVICES = [
  {
    id: 1,
    name: 'Apple Watch Series 9',
    type: 'Smartwatch',
    icon: Watch,
    status: 'connected',
    battery: 85,
    lastSync: '2 minutes ago',
    data: ['Heart Rate', 'Steps', 'Calories'],
  },
  {
    id: 2,
    name: 'iPhone 15 Pro',
    type: 'Smartphone',
    icon: Smartphone,
    status: 'connected',
    battery: 92,
    lastSync: 'Just now',
    data: ['Workouts', 'Location', 'Accelerometer'],
  },
  {
    id: 3,
    name: 'AirPods Pro 2',
    type: 'Audio Device',
    icon: Headphones,
    status: 'connected',
    battery: 78,
    lastSync: '5 minutes ago',
    data: ['Heart Rate', 'Audio Feedback'],
  },
  {
    id: 4,
    name: 'Garmin Fenix 7',
    type: 'GPS Watch',
    icon: Activity,
    status: 'disconnected',
    battery: 45,
    lastSync: '3 hours ago',
    data: ['GPS Tracking', 'Training Load'],
  },
]

export default function DevicesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black mb-2">Connected Devices</h1>
        <p className="text-muted-foreground">
          Manage your fitness tracker connections
        </p>
      </motion.div>

      {/* Globe Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="my-12 p-8 rounded-xl bg-card/50 border border-border/30"
      >
        <h2 className="text-xl font-bold mb-6">Device Sync Status</h2>
        <div className="flex justify-center">
          <GlobePulse className="w-full max-w-md" />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Your devices syncing data across the globe
        </p>
      </motion.div>

      {/* Devices Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 mb-12"
      >
        <h2 className="text-2xl font-bold">Your Devices</h2>
        {DEVICES.map((device, idx) => {
          const Icon = device.icon
          const isConnected = device.status === 'connected'

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className={`p-6 rounded-xl border transition-colors ${
                isConnected
                  ? 'bg-card/50 border-border/30 hover:border-primary/20'
                  : 'bg-card/30 border-border/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isConnected ? 'bg-primary/10' : 'bg-muted/30'}`}>
                    <Icon
                      className={`w-6 h-6 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{device.name}</h3>
                    <p className="text-sm text-muted-foreground">{device.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {isConnected ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="text-sm font-semibold capitalize">
                      {device.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {device.lastSync}
                  </p>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Battery</span>
                  <span className="text-sm">{device.battery}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.battery}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className={`h-full ${
                      device.battery > 50
                        ? 'bg-green-500'
                        : device.battery > 20
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Synced Data</p>
                <div className="flex flex-wrap gap-2">
                  {device.data.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-1 bg-background rounded text-xs font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={isConnected ? 'outline' : 'default'}
                  size="sm"
                  className="flex-1"
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </Button>
                {isConnected && (
                  <Button variant="outline" size="sm" className="flex-1">
                    Sync Now
                  </Button>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Add Device */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-8 rounded-xl bg-card/50 border border-border/30 text-center"
      >
        <h3 className="text-lg font-bold mb-2">Don't see your device?</h3>
        <p className="text-muted-foreground mb-4">
          Connect a new fitness tracker or smartwatch
        </p>
        <Button>Add New Device</Button>
      </motion.div>
    </div>
  )
}
