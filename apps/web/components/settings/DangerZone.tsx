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
  const [dataLoading, setDataLoading] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleDeleteData = async () => {
    setDataLoading(true)
    try {
      const res = await fetch('/api/user/data', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setDeleteDataOpen(false)
    } catch (err) {
      console.error('Delete data error:', err)
      showToast('Veriler silinemedi, tekrar dene')
    } finally {
      setDataLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setAccountLoading(true)
    try {
      const res = await fetch('/api/user/account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Account delete failed')
      await signOut({ redirectUrl: '/' })
    } catch (err) {
      console.error('Delete account error:', err)
      showToast('Hesap silinemedi, tekrar dene')
    } finally {
      setAccountLoading(false)
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
        {toast && <p className="mb-3 text-xs text-red-400">{toast}</p>}

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
        loading={dataLoading}
      />

      <ConfirmDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Hesabını Sil"
        description="FitAI hesabın ve tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz."
        confirmText="HESABIMI SİL"
        confirmLabel="Hesabı Sil"
        loading={accountLoading}
      />
    </>
  )
}
