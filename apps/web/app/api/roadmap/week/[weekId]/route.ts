import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface RouteContext {
  params: Promise<{ weekId: string }>
}

// PATCH — görevi tamamla veya haftayı tamamla
export const PATCH = withAuth(
  async (req: NextRequest, { user, ...ctx }: { user: { id: string } } & RouteContext) => {
    const { weekId } = await (ctx as RouteContext).params
    const body = await req.json().catch(() => ({}))

    // Hafta bu kullanıcıya ait mi?
    const week = await db.roadmapWeek.findFirst({
      where: { id: weekId, roadmap: { userId: user.id } },
      include: { tasks: true },
    })
    if (!week) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Görev tamamla
    if (body.taskId) {
      await db.roadmapTask.update({
        where: { id: body.taskId },
        data: { isDone: true, doneAt: new Date() },
      })

      // Tüm görevler tamamlandıysa haftayı tamamla + sonraki haftayı aç
      const allTasks = await db.roadmapTask.findMany({ where: { weekId } })
      const allDone = allTasks.every((t) => t.isDone)
      if (allDone) {
        await db.roadmapWeek.update({
          where: { id: weekId },
          data: { isComplete: true, completedAt: new Date() },
        })
        // Sonraki haftayı aç
        const nextWeek = await db.roadmapWeek.findFirst({
          where: { roadmapId: week.roadmapId, weekNumber: week.weekNumber + 1 },
        })
        if (nextWeek) {
          await db.roadmapWeek.update({ where: { id: nextWeek.id }, data: { isUnlocked: true } })
        }
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'No action' }, { status: 400 })
  }
)
