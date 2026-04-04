import type { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth/server'
import { DashboardOverview } from '@/components/shared/dashboard-overview'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await getAuthUser()
  return <DashboardOverview user={user} />
}
