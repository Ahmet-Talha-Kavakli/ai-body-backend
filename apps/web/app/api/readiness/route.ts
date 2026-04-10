import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';
import { calculateReadinessScore } from '@fitai/shared-utils';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get today's DailyMetrics
  const today = await prisma.dailyMetrics.findFirst({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  // Calculate load from last 48 hours
  const recentSessions = await prisma.workoutSession.findMany({
    where: {
      userId: user.id,
      endedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    include: { completedSets: true },
  });

  const sessionVolume = recentSessions.reduce((sum, s) => {
    const setVolume = s.completedSets.reduce((sv, set) => {
      const reps = set.reps ?? 0;
      const weight = set.weightKg ?? 0;
      return sv + (reps * weight);
    }, 0);
    return sum + setVolume;
  }, 0);

  // Count active injuries
  const activeInjuries = await prisma.injury.count({
    where: { userId: user.id, isActive: true },
  });

  // Get nutrition goal
  const nutritionGoal = await prisma.nutritionGoal.findUnique({
    where: { userId: user.id },
  });

  // Calculate readiness score
  const score = calculateReadinessScore({
    sleepHours: today?.sleepHours ?? 7,
    hrvDelta: null, // Will be integrated in Phase 2 with wearable data
    sessionFatigue: Math.min(1, sessionVolume / 5000), // Simple normalization
    stressLevel: today?.stressLevel ?? 5,
    proteinRatio: today?.proteinIntake && nutritionGoal?.proteinG
      ? today.proteinIntake / nutritionGoal.proteinG
      : 0.7,
    activeInjuries,
  });

  const reason = buildReadinessReason(score, today, activeInjuries);

  return NextResponse.json({
    score,
    reason,
    updatedAt: new Date(),
  });
}

function buildReadinessReason(
  score: number,
  metrics: any,
  injuries: number
): string {
  if (score >= 80) {
    return 'Great condition! Time for an intense workout.';
  }
  if (score >= 60) {
    return 'Good condition. You can do your regular workout.';
  }
  if (score >= 40) {
    if (injuries > 0) {
      return 'Active injury detected. Be careful during workout.';
    }
    if (metrics?.sleepHours && metrics.sleepHours < 6) {
      return 'Low sleep. Consider a lighter workout today.';
    }
    return 'Moderate readiness. Reduce intensity slightly.';
  }
  return 'Recovery day recommended. Rest is better than training.';
}
