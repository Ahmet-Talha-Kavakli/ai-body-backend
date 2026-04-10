// apps/web/app/api/ai/analyze-form/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeForm } from '@/lib/ai/form-analyzer';
import { generateCoachFeedback } from '@/lib/ai/gpt-coach';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';
import { buildCoachContext } from '@/lib/coach/profile-context-builder';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      exercise,
      poseResult,
      repNumber,
      userContext,
    }: {
      exercise: string;
      poseResult: PoseDetectionResult;
      repNumber: number;
      userContext?: any;
    } = body;

    // Build enriched context with profile data
    const profileContext = await buildCoachContext(userId);

    // Analyze form
    const formAnalysis = analyzeForm(exercise, poseResult);

    // Generate coach feedback with profile context
    const coachFeedback = await generateCoachFeedback(
      exercise,
      formAnalysis,
      repNumber,
      { ...userContext, profile: profileContext }
    );

    return NextResponse.json({
      success: true,
      formAnalysis,
      coachFeedback,
    });
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
