// apps/web/hooks/useFormAnalysis.ts

import { useState, useCallback } from 'react';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';
import { FormAnalysisResult } from '@/lib/ai/form-analyzer';
import { CoachFeedback } from '@/lib/ai/gpt-coach';

export function useFormAnalysis() {
  const [formAnalysis, setFormAnalysis] =
    useState<FormAnalysisResult | null>(null);
  const [coachFeedback, setCoachFeedback] =
    useState<CoachFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (
      exercise: string,
      poseResult: PoseDetectionResult,
      repNumber: number,
      userContext?: any
    ) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/analyze-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise,
            poseResult,
            repNumber,
            userContext,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setFormAnalysis(data.formAnalysis);
        setCoachFeedback(data.coachFeedback);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return {
    formAnalysis,
    coachFeedback,
    isAnalyzing,
    error,
    analyze,
  };
}
