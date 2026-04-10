import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '56'); // 8 weeks

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all analytics for user's sessions in timeframe
    const analytics = await prisma.workoutAnalytics.findMany({
      where: {
        session: {
          userId,
          startedAt: { gte: startDate },
        },
      },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get daily metrics
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate aggregates
    const avgFormScore = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.avgFormScore, 0) / analytics.length
      : 0;

    const formTrend = analytics.length > 2
      ? analytics[0].avgFormScore > analytics[analytics.length - 1].avgFormScore
        ? 'improving'
        : analytics[0].avgFormScore < analytics[analytics.length - 1].avgFormScore
        ? 'declining'
        : 'stable'
      : 'stable';

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        dailyMetrics,
        aggregates: { avgFormScore, formTrend },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
