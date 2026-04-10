import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { clerkId: { not: null } },
      select: { id: true },
    });

    let syncedCount = 0;

    for (const user of users) {
      // Fetch connected wearables
      const wearables = await prisma.wearable.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      for (const wearable of wearables) {
        try {
          // Fetch sleep data from the previous night
          const yesterdayStart = new Date();
          yesterdayStart.setHours(0, 0, 0, 0);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);

          const yesterdayEnd = new Date();
          yesterdayEnd.setHours(23, 59, 59, 999);
          yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

          // Fetch sleep records
          const sleepRecords = await prisma.sleepRecord.findMany({
            where: {
              userId: user.id,
              recordedAt: {
                gte: yesterdayStart,
                lte: yesterdayEnd,
              },
            },
          });

          if (sleepRecords.length > 0) {
            // Calculate average sleep quality and duration
            const totalDuration = sleepRecords.reduce(
              (sum, s) => sum + (s.duration || 0),
              0
            );
            const avgQuality =
              sleepRecords.reduce((sum, s) => sum + (s.quality || 0), 0) /
              sleepRecords.length;

            // Update readiness score based on sleep
            const baseReadiness = 70;
            const sleepBonus = Math.min(30, (totalDuration / 480) * 30);
            const qualityBonus = avgQuality * 10;
            const calculatedReadiness = Math.min(
              100,
              baseReadiness + sleepBonus + qualityBonus
            );

            await prisma.readinessScore.create({
              data: {
                userId: user.id,
                score: Math.round(calculatedReadiness),
                source: "SLEEP_SYNC",
                recordedAt: new Date(),
              },
            });

            syncedCount++;
          }
        } catch (error) {
          console.error(
            `[Morning Sync] Error syncing wearable ${wearable.id} for user ${user.id}:`,
            error
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        syncedCount,
        message: `Synced sleep data for ${syncedCount} users`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Morning Sync Cron]", error);
    return NextResponse.json(
      { error: "Failed to sync sleep data" },
      { status: 500 }
    );
  }
}
