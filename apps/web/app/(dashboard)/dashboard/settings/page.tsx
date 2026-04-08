'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { MacbookLoader } from '@/components/ui/macbook-loader'
import { NewtonsCradle } from '@/components/ui/newtons-cradle'
import { AlertBoxes } from '@/components/ui/alert-boxes'
import { Error as ErrorComponent } from '@/components/ui/error'
import { Bell, Lock, Trash2, LogOut, User } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    icon: User,
    title: 'Account Settings',
    description: 'Manage your profile information',
    items: [
      { label: 'Full Name', value: 'John Doe', editable: true },
      { label: 'Email', value: 'john@example.com', editable: false },
      { label: 'Username', value: '@johndoe', editable: true },
    ],
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Manage your notification preferences',
    toggles: [
      { label: 'Workout Reminders', enabled: true },
      { label: 'Achievement Badges', enabled: true },
      { label: 'Weekly Reports', enabled: false },
      { label: 'Marketing Emails', enabled: false },
    ],
  },
  {
    icon: Lock,
    title: 'Privacy & Security',
    description: 'Control your privacy settings',
    items: [
      {
        label: 'Two-Factor Authentication',
        value: 'Enabled',
        action: 'Disable',
      },
      { label: 'Last Password Change', value: '30 days ago', action: 'Change' },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <MacbookLoader />
      </motion.div>

      {/* Loaders and Components Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-12 grid md:grid-cols-2 gap-6"
      >
        <div className="text-center p-6 rounded-xl bg-card/50 border border-border/30">
          <h3 className="text-lg font-bold mb-4">Loading Animation</h3>
          <NewtonsCradle />
        </div>
        <div className="text-center p-6 rounded-xl bg-card/50 border border-border/30">
          <h3 className="text-lg font-bold mb-4">System Alert</h3>
          <AlertBoxes />
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-8 my-12">
        {SETTINGS_SECTIONS.map((section, sectionIdx) => {
          const SectionIcon = section.icon
          return (
            <motion.div
              key={sectionIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIdx * 0.1 }}
              className="p-8 rounded-xl bg-card/50 border border-border/30"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-primary/10">
                  <SectionIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                  <p className="text-muted-foreground">{section.description}</p>
                </div>
              </div>

              {/* Settings Items */}
              {section.items && (
                <div className="space-y-4 mb-6">
                  {section.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="flex items-center justify-between py-4 border-b border-border/30 last:border-0"
                    >
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.value}
                        </p>
                      </div>
                      {item.editable && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                      {item.action && (
                        <Button variant="outline" size="sm">
                          {item.action}
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Notification Toggles */}
              {section.toggles && (
                <div className="space-y-4">
                  {section.toggles.map((toggle, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 bg-background rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <p className="font-semibold">{toggle.label}</p>
                      <label className="relative cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={toggle.enabled}
                          className="hidden"
                        />
                        <div
                          className={`w-12 h-6 rounded-full transition-colors ${
                            toggle.enabled ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            toggle.enabled ? 'translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-8 rounded-xl bg-red-500/10 border border-red-500/20 mb-12"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-red-500/20">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-500">Danger Zone</h2>
            <p className="text-muted-foreground">
              Irreversible actions related to your account
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-4 border-b border-red-500/20">
            <div>
              <p className="font-semibold">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your FitAI account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on all devices
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Saving State */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-xl bg-card/50 border border-border/30"
      >
        <div className="flex items-center gap-4">
          <Loader variant="terminal" />
          <div>
            <p className="font-semibold">Auto-saving changes</p>
            <p className="text-sm text-muted-foreground">
              Your settings are being updated...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
