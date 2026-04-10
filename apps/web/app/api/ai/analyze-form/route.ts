// apps/web/app/api/ai/analyze-form/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { analyzeForm } from '@/lib/ai/form-analyzer';
import { generateCoachFeedback } from '@/lib/ai/gpt-coach';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';

export async function POST(request: NextRequest) {
  try {
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

    // Analyze form
    const formAnalysis = analyzeForm(exercise, poseResult);

    // Generate coach feedback
    const coachFeedback = await generateCoachFeedback(
      exercise,
      formAnalysis,
      repNumber,
      userContext
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
