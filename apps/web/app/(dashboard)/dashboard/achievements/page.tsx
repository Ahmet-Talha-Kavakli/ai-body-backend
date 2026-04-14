import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'
import { XPProgressBar } from '@/components/achievements/XPProgressBar'
import { AchievementCard } from '@/components/achievements/AchievementCard'

export default async function AchievementsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect('/sign-in')

  const [userAchievements, xp] = await Promise.all([
    db.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { earnedAt: 'desc' },
    }),
    db.userXP.findUnique({ where: { userId: user.id } }),
  ])

  const earnedMap = new Map(userAchievements.map((a) => [a.achievementId, a]))
  const allDefs = Object.values(ACHIEVEMENTS)

  const sorted = allDefs.sort((a, b) => {
    const aEarned = earnedMap.has(a.id) ? 1 : 0
    const bEarned = earnedMap.has(b.id) ? 1 : 0
    return bEarned - aEarned
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-white">Başarımlarım</h1>

      <div className="mb-6">
        <XPProgressBar total={xp?.total ?? 0} level={xp?.level ?? 1} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#64748B]">
          {userAchievements.length} / {allDefs.length} kazanıldı
        </p>
      </div>

      <div className="space-y-2">
        {sorted.map((def) => {
          const ua = earnedMap.get(def.id)
          return (
            <AchievementCard
              key={def.id}
              def={def}
              earned={!!ua}
              earnedAt={ua?.earnedAt?.toString()}
            />
          )
        })}
      </div>
    </div>
  )
}
