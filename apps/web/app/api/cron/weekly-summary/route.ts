import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    // Get all active users
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, email: true },
    });

    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 7);

    const summaries: WeeklySummary[] = [];

    for (const user of users) {
      // Fetch workouts for the week
      const workouts = await prisma.workout.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: weekStartDate,
            lte: new Date(),
          },
        },
        include: {
          exercises: true,
        },
      });

      // Fetch form scores for the week
      const formScores = await prisma.formScore.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: weekStartDate,
            lte: new Date(),
          },
        },
        select: { score: true },
      });

      // Fetch readiness scores for the week
      const readinessScores = await prisma.readinessScore.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: weekStartDate,
            lte: new Date(),
          },
        },
        select: { score: true },
      });

      // Calculate aggregates
      const totalVolume = workouts.reduce((sum, w) => {
        const volume = w.exercises.reduce(
          (ex, e) => ex + (e.sets * e.reps * (e.weight || 0)),
          0
        );
        return sum + volume;
      }, 0);

      const avgForm =
        formScores.length > 0
          ? formScores.reduce((sum, f) => sum + f.score, 0) / formScores.length
          : 0;

      const avgReadiness =
        readinessScores.length > 0
          ? readinessScores.reduce((sum, r) => sum + r.score, 0) /
            readinessScores.length
          : 0;

      const topExercises = Array.from(
        workouts
          .flatMap((w) => w.exercises)
          .reduce((map, ex) => {
            map.set(ex.name, (map.get(ex.name) || 0) + 1);
            return map;
          }, new Map<string, number>())
          .entries()
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name]) => name);

      const summary: WeeklySummary = {
        userId: user.id,
        totalWorkouts: workouts.length,
        totalVolume,
        averageFormScore: Math.round(avgForm * 10) / 10,
        averageReadiness: Math.round(avgReadiness * 10) / 10,
        topExercises,
        weekStartDate,
        weekEndDate: new Date(),
      };

      summaries.push(summary);

      // Store summary in database
      await prisma.weeklySummary.create({
        data: {
          userId: user.id,
          totalWorkouts: summary.totalWorkouts,
          totalVolume: summary.totalVolume,
          averageFormScore: summary.averageFormScore,
          averageReadiness: summary.averageReadiness,
          topExercises: summary.topExercises,
          weekStartDate: summary.weekStartDate,
          weekEndDate: summary.weekEndDate,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        summariesGenerated: summaries.length,
        message: `Generated ${summaries.length} weekly summaries`,
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
