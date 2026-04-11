import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

interface WeeklySummary {
  userId: string;
  totalWorkouts: number;
  totalVolume: number;
  averageFormScore: number;
  averageReadiness: number;
  topExercises: string[];
  weekStartDate: Date;
  weekEndDate: Date;
}

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const now = new Date();

    const summaries: WeeklySummary[] = [];

    for (const user of users) {
      // Fetch workout sessions for the week
      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId: user.id,
          startedAt: {
            gte: weekStartDate,
            lte: now,
          },
        },
        include: {
          completedSets: {
            include: {
              exercise: true,
            },
          },
          workoutAnalytics: true,
        },
      });

      // Calculate aggregates
      let totalVolume = 0;
      const exerciseCount = new Map<string, number>();

      for (const session of sessions) {
        if (session.workoutAnalytics.length > 0) {
          // Volume from completed sets
          for (const set of session.completedSets) {
            const weight = set.weightKg || 0;
            const reps = set.reps || 0;
            totalVolume += weight * reps;

            // Track exercise frequency
            exerciseCount.set(
              set.exercise.name,
              (exerciseCount.get(set.exercise.name) || 0) + 1
            );
          }
        }
      }

      // Get average form score from session analytics
      const avgForm =
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.overallFormScore || 0), 0) /
            sessions.length
          : 0;

      // Get top exercises
      const topExercises = Array.from(exerciseCount.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name]) => name);

      const summary: WeeklySummary = {
        userId: user.id,
        totalWorkouts: sessions.length,
        totalVolume,
        averageFormScore: Math.round(avgForm * 10) / 10,
        averageReadiness: 75, // Placeholder: would need ReadinessScore model
        topExercises,
        weekStartDate,
        weekEndDate: now,
      };

      // DB'ye kaydet
      await prisma.weeklySummary.upsert({
        where: { userId_weekStartDate: { userId: user.id, weekStartDate } },
        update: {
          totalWorkouts: summary.totalWorkouts,
          totalVolume: summary.totalVolume,
          averageFormScore: summary.averageFormScore,
          averageReadiness: summary.averageReadiness,
          topExercises: summary.topExercises,
          weekEndDate: summary.weekEndDate,
        },
        create: {
          userId: user.id,
          totalWorkouts: summary.totalWorkouts,
          totalVolume: summary.totalVolume,
          averageFormScore: summary.averageFormScore,
          averageReadiness: summary.averageReadiness,
          topExercises: summary.topExercises,
          weekStartDate,
          weekEndDate: summary.weekEndDate,
        },
      });

      summaries.push(summary);
    }

    return NextResponse.json(
      {
        success: true,
        summariesGenerated: summaries.length,
        message: `Generated and saved ${summaries.length} weekly summaries`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Weekly Summary Cron]", error);
    return NextResponse.json(
      { error: "Failed to generate weekly summaries" },
      { status: 500 }
    );
  }
}
