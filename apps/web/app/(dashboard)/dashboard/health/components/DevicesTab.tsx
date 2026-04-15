'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Watch, CheckCircle, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { ManualEntryModal } from '@/components/health/ManualEntryModal'

const PROVIDERS = [
  {
    id: 'google_fit',
    name: 'Google Fit',
    description: 'Android ve Wear OS cihazları',
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    description: 'Garmin Connect platformu',
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Fitbit & Versa saatler',
    color: 'from-cyan-500/20 to-teal-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
  },
]

interface Device {
  id: string
  type: string
  brand: string
  model: string
  isConnected: boolean
  lastSyncedAt: string | null
}

interface DevicesTabProps {
  devices: Device[]
  onConnect: (provider: string) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
  onManualEntry: (type: string, value: number) => Promise<void>
  onSync: () => Promise<void>
}

export function DevicesTab({
  devices,
  onConnect,
  onDisconnect,
  onManualEntry,
  onSync,
}: DevicesTabProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  const connectedTypes = new Set(devices.filter((d) => d.isConnected).map((d) => d.type))

  async function handleConnect(provider: string) {
    setConnecting(provider)
    await onConnect(provider)
    setConnecting(null)
  }

  async function handleSync() {
    setSyncing(true)
    // Sync real devices first, then refresh all data
    const realDevices = devices.filter(
      (d) => d.isConnected && d.type !== 'manual' && !d.id.startsWith('mock-')
    )
    await Promise.all(
      realDevices.map((d) =>
        fetch('/api/health/devices/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: d.id }),
        }).catch(() => {})
      )
    )
    await onSync()
    setSyncing(false)
  }

  const connectedDevices = devices.filter((d) => d.isConnected && d.type !== 'manual')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Cihazlar & Bağlantılar</h2>
        <button
          onClick={handleSync}
          disabled={syncing || devices.length === 0}
          className="bg-muted/30 border-border/30 hover:border-border/60 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all disabled:opacity-50"
        >
          <motion.div
            animate={syncing ? { rotate: 360 } : { rotate: 0 }}
            transition={syncing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <RefreshCw size={12} />
          </motion.div>
          {syncing ? 'Senkronize Ediliyor...' : 'Sync Et'}
        </button>
      </div>

      {/* Connected devices */}
      {connectedDevices.length > 0 && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Bağlı Cihazlar
          </p>
          {connectedDevices.map((device) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <Watch size={18} className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {device.brand} {device.model}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle size={10} />
                  Bağlı
                  {device.lastSyncedAt &&
                    ` · ${new Date(device.lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
              <button
                onClick={() => onDisconnect(device.id)}
                className="text-muted-foreground cursor-pointer rounded-xl p-2 transition-all hover:bg-red-500/10 hover:text-red-400"
                aria-label="Bağlantıyı kes"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Providers */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Platform Bağla
        </p>
        {PROVIDERS.map((provider, i) => {
          const isConnected = connectedTypes.has(provider.id)
          const isLoading = connecting === provider.id
          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !isConnected && handleConnect(provider.id)}
              disabled={isConnected || isLoading}
              className={`flex w-full items-center gap-4 bg-gradient-to-r p-4 ${provider.color} border ${provider.border} cursor-pointer rounded-2xl text-left transition-all hover:opacity-90 disabled:cursor-default`}
            >
              <Watch size={20} className={provider.text} />
              <div className="flex-1">
                <p className="text-sm font-bold">{provider.name}</p>
                <p className="text-muted-foreground text-xs">{provider.description}</p>
              </div>
              {isConnected ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <RefreshCw size={14} className={provider.text} />
                </motion.div>
              ) : (
                <ExternalLink size={14} className={provider.text} />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Manual entry */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
          Cihazın Yoksa
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Adım, nabız, uyku ve diğer verileri manuel olarak girebilirsin.
        </p>
        <button
          onClick={() => setManualOpen(true)}
          className="bg-muted/30 border-border/50 hover:border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all"
        >
          <Plus size={14} />
          Manuel Veri Gir
        </button>
      </div>

      <ManualEntryModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSave={onManualEntry}
      />
    </div>
  )
}
