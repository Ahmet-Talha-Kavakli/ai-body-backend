// apps/web/lib/ai/gpt-coach.ts

import { OpenAI } from 'openai';
import { FormAnalysisResult } from './form-analyzer';
import { CoachContext } from '@/lib/coach/profile-context-builder';

export interface CoachFeedback {
  formScore: number;
  voiceFeedback: string;
  corrections: string[];
  encouragement: string;
  nextRepTip: string;
  injuryWarning: string | null;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite personal trainer AI with expertise from:
- Louie Simmons (Westside Barbell - Conjugate Method)
- Mike Israetel (Renaissance Periodization)
- Stronger by Science (Evidence-based training)

Your role: Analyze user's form and provide real-time coaching feedback.

Instructions:
1. Be concise and actionable (max 2 sentences for voice feedback)
2. Use Turkish language
3. Focus on ONE primary correction if there are multiple errors
4. Be encouraging but honest
5. Prioritize safety over ego
6. Consider user's health restrictions and injuries
7. Adapt recommendations based on recovery state (sleep, stress, nutrition)

Response format: JSON with fields: voiceFeedback, corrections, encouragement, nextRepTip, injuryWarning`;

export async function generateCoachFeedback(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: {
    historicalAvgScore?: number;
    activeInjuries?: string[];
    weaknessAreas?: string[];
    profile?: CoachContext;
  }
): Promise<CoachFeedback> {
  try {
    const prompt = buildCoachPrompt(
      exercise,
      formAnalysis,
      repNumber,
      userContext
    );

    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const responseText = message.choices[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      formScore: formAnalysis.formScore,
      voiceFeedback: parsed.voiceFeedback || 'Form check!',
      corrections: parsed.corrections || [],
      encouragement: parsed.encouragement || 'Harika!',
      nextRepTip: parsed.nextRepTip || 'Devam et!',
      injuryWarning: parsed.injuryWarning || null,
    };
  } catch (error) {
    console.error('Error generating coach feedback:', error);
    // Fallback response
    return {
      formScore: formAnalysis.formScore,
      voiceFeedback: `Form skoru: ${formAnalysis.formScore}. Devam et!`,
      corrections: formAnalysis.errors.map((e) => e.cue),
      encouragement: 'Güzel çalışıyor!',
      nextRepTip: 'Tekrar et',
      injuryWarning: null,
    };
  }
}

function buildCoachPrompt(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: any
): string {
  let prompt = `
Exercise: ${exercise}
Rep Number: ${repNumber}
Form Score: ${formAnalysis.formScore}/100

Form Errors Found:
${formAnalysis.errors.length > 0 ? formAnalysis.errors.map((e) => `- ${e.cue} (severity: ${e.severity})`).join('\n') : '- No major errors'}

Muscle Engagement:
${Object.entries(formAnalysis.muscleEngagement)
  .map(([muscle, score]) => `- ${muscle}: ${Math.round(score * 100)}%`)
  .join('\n')}

Depth Assessment: ${formAnalysis.depthAssessment}
Stability: ${Math.round(formAnalysis.stabilityScore * 100)}%
`;

  if (userContext?.profile) {
    const profile = userContext.profile;
    prompt += `\n=== USER PROFILE CONTEXT ===\n`;

    if (profile.basicProfile) {
      prompt += `Age: ${profile.basicProfile.age}\n`;
      prompt += `Goal: ${profile.basicProfile.primaryGoal}\n`;
      prompt += `Experience: ${profile.basicProfile.experienceYears} years\n`;
    }

    if (profile.healthMetrics?.activeInjuries) {
      try {
        const injuries = JSON.parse(profile.healthMetrics.activeInjuries);
        if (injuries.length > 0) {
          prompt += `ACTIVE INJURIES: ${injuries.map((i: any) => `${i.bodyPart} (${i.severity}/10)`).join(', ')}\n`;
        }
      } catch (e) {
        // Handle if already parsed
        if (Array.isArray(profile.healthMetrics.activeInjuries)) {
          prompt += `ACTIVE INJURIES: ${profile.healthMetrics.activeInjuries.map((i: any) => `${i.bodyPart} (${i.severity}/10)`).join(', ')}\n`;
        }
      }
    }

    prompt += `\nLast 7 Days:\n`;
    prompt += `- Avg Sleep: ${profile.averageMetrics.sleepHours}h\n`;
    prompt += `- Avg Stress: ${profile.averageMetrics.stressLevel}/10\n`;
    prompt += `- Protein Compliance: ${profile.averageMetrics.proteinCompliance}%\n`;

    if (profile.weaknesses.length > 0) {
      prompt += `\nIdentified Weaknesses:\n`;
      profile.weaknesses.forEach((w: any) => {
        prompt += `- ${w.muscleGroup} (${w.exerciseName}): Severity ${w.severity}/10\n`;
      });
    }
  } else if (userContext) {
    if (userContext.historicalAvgScore) {
      prompt += `\nUser's Historical Avg Score: ${userContext.historicalAvgScore}/100`;
    }
    if (userContext.activeInjuries?.length) {
      prompt += `\nActive Injuries: ${userContext.activeInjuries.join(', ')}`;
    }
    if (userContext.weaknessAreas?.length) {
      prompt += `\nWeak Areas: ${userContext.weaknessAreas.join(', ')}`;
    }
  }

  prompt += `

Provide feedback in JSON format:
{
  "voiceFeedback": "Concise coaching cue in Turkish (max 10 words)",
  "corrections": ["Specific correction 1", "Specific correction 2"],
  "encouragement": "Motivational comment in Turkish",
  "nextRepTip": "Tip for next rep in Turkish",
  "injuryWarning": null or "Warning if injury risk detected"
}`;

  return prompt;
}
