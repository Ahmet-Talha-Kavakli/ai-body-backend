interface UserInjury {
  location: string;  // e.g., 'left_shoulder', 'lower_back'
  severity: 'mild' | 'moderate' | 'severe';
}

interface Exercise {
  id: string;
  name: string;
  target: string;      // Primary muscle: 'chest', 'back', 'shoulders', etc.
  bodyPart: string;    // Which part: 'upper_body', 'core', 'lower_body'
}

interface InjuryShieldResult {
  canPerform: boolean;
  reason?: string;
  suggestedModification?: string;
}

// Map body parts to muscle groups that load them
const BODY_PART_MUSCLES: Record<string, string[]> = {
  left_shoulder: ['shoulders', 'chest'],
  right_shoulder: ['shoulders', 'chest'],
  left_knee: ['legs', 'glutes'],
  right_knee: ['legs', 'glutes'],
  lower_back: ['back', 'core'],
  upper_back: ['back', 'shoulders'],
  left_hip: ['legs', 'glutes', 'core'],
  right_hip: ['legs', 'glutes', 'core'],
  neck: ['shoulders', 'back'],
  wrist: ['arms'],
  left_elbow: ['arms', 'chest'],
  right_elbow: ['arms', 'chest'],
};

export function checkInjuryShield(
  exercise: Exercise,
  injuries: UserInjury[]
): InjuryShieldResult {
  if (injuries.length === 0) {
    return { canPerform: true };
  }

  for (const injury of injuries) {
    const affectedMuscles = BODY_PART_MUSCLES[injury.location] ?? [];
    const targetMatches = affectedMuscles.some(m =>
      exercise.target.toLowerCase().includes(m)
    );

    if (!targetMatches) continue; // Exercise doesn't affect this injury

    // Exercise affects injured area
    if (injury.severity === 'severe') {
      return {
        canPerform: false,
        reason: `${injury.location} yaralanman ciddi, bu egzersiz yapma.`,
      };
    }

    if (injury.severity === 'moderate') {
      return {
        canPerform: false,
        reason: `${injury.location} yaralanman orta şiddette, bu egzersizi kısıtla.`,
      };
    }

    if (injury.severity === 'mild') {
      return {
        canPerform: true,
        reason: `Hafif ${injury.location} yaralanman var. Dikkatli ol.`,
        suggestedModification: 'Hareket aralığını sınırla, hafif yükle başla.',
      };
    }
  }

  return { canPerform: true };
}
