import { prisma } from '@/lib/db/client';
import { classifyRecoveryState, generateRecoveryRecommendation } from './models/recovery-classifier';
import { predictFormScore } from './models/form-score-predictor';

export interface Recommendation {
  type: 'recovery' | 'form' | 'weakness' | 'intensity' | 'nutrition';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

/**
 * Generate personalized recommendations for user
 */
export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  try {
    // Get user's daily metrics (last 30 days)
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    if (dailyMetrics.length < 7) {
      return []; // Not enough data
    }

    // Recovery recommendation
    const latestMetrics = dailyMetrics[0];
    const recoveryState = await classifyRecoveryState({
      sleepHours: latestMetrics.sleepHours || 7,
      stressLevel: latestMetrics.stressLevel || 5,
      proteinIntake: latestMetrics.proteinIntake || 100,
      soreness: latestMetrics.soreness || 3,
    });

    recommendations.push({
      type: 'recovery',
      title: 'Recovery Status',
      description: generateRecoveryRecommendation(recoveryState),
      priority: recoveryState < 0.4 ? 'high' : 'medium',
      actionItems: [
        recoveryState < 0.4 ? 'Reduce workout volume by 40%' : 'Maintain current intensity',
        `Current recovery state: ${(recoveryState * 100).toFixed(0)}%`,
        latestMetrics.sleepHours < 7 ? 'Try to get 8+ hours of sleep tonight' : 'Sleep schedule is good',
      ],
    });

    // Form score trend recommendation (from FormRepData via WorkoutSession)
    const formRepData = await prisma.formRepData.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 14,
      select: { formScore: true },
    });
    const formScores = formRepData.map(m => m.formScore || 70).reverse();
    const recentAvg = formScores.length >= 7 ? formScores.slice(-7).reduce((a, b) => a + b) / 7 : 70;
    const olderAvg = formScores.length >= 14 ? formScores.slice(-14, -7).reduce((a, b) => a + b) / 7 : recentAvg;
    const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    if (trend < -10) {
      recommendations.push({
        type: 'form',
        title: 'Form Score Declining',
        description: `Your form score has declined ${Math.abs(trend).toFixed(1)}% in the last 2 weeks. Focus on technique and lighter weights.`,
        priority: 'high',
        actionItems: [
          'Reduce weight by 10-15%',
          'Record videos to check form',
          'Add 2 extra recovery days this week',
        ],
      });
    } else if (trend > 15) {
      recommendations.push({
        type: 'form',
        title: 'Form Score Improving!',
        description: `Excellent progress! Your form has improved ${trend.toFixed(1)}% in 2 weeks.`,
        priority: 'low',
        actionItems: [
          'Time to increase weight by 5-10%',
          'Try new exercises',
          'Consider filming your PRs',
        ],
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Get all active recommendations for user
 */
export async function getUserRecommendations(userId: string): Promise<Recommendation[]> {
  return generateRecommendations(userId);
}
