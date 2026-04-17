'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { ConfirmDialog } from './ConfirmDialog'

export function DangerZone() {
  const { signOut } = useClerk()
  const [deleteDataOpen, setDeleteDataOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeleteData = async () => {
    setLoading(true)
    try {
      await fetch('/api/user/data', { method: 'DELETE' })
      setDeleteDataOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      await fetch('/api/user/account', { method: 'DELETE' })
      await signOut({ redirectUrl: '/' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingsSectionCard
        icon={THIINGS.trashBin}
        title="Tehlikeli Alan"
        description="Geri alınamaz işlemler"
        delay={0.3}
        variant="danger"
      >
        <div className="flex items-center justify-between border-b border-red-500/20 py-3">
          <div>
            <p className="text-sm font-semibold">Tüm Verilerimi Sil</p>
            <p className="text-muted-foreground text-xs">
              Antrenman, beslenme ve sağlık verileri silinir
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDataOpen(true)}
            className="border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
          >
            Sil
          </Button>
        </div>

        <div className="flex items-center justify-between border-b border-red-500/20 py-3">
          <div>
            <p className="text-sm font-semibold">Hesabı Sil</p>
            <p className="text-muted-foreground text-xs">FitAI hesabın kalıcı olarak silinir</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteAccountOpen(true)}
            className="text-xs"
          >
            Hesabı Sil
          </Button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold">Çıkış Yap</p>
            <p className="text-muted-foreground text-xs">Tüm cihazlardan çıkış yap</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="gap-1.5 border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={12} /> Çıkış Yap
          </Button>
        </div>
      </SettingsSectionCard>

      <ConfirmDialog
        open={deleteDataOpen}
        onClose={() => setDeleteDataOpen(false)}
        onConfirm={handleDeleteData}
        title="Tüm Verilerini Sil"
        description="Antrenman geçmişi, beslenme günlüğü ve sağlık verilerin kalıcı olarak silinir. Hesabın korunur."
        confirmText="SİL"
        confirmLabel="Verileri Sil"
        loading={loading}
      />

      <ConfirmDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Hesabını Sil"
        description="FitAI hesabın ve tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz."
        confirmText="HESABIMI SİL"
        confirmLabel="Hesabı Sil"
        loading={loading}
      />
    </>
  )
}
