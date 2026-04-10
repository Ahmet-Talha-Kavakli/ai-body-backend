const INJURY_LOCATION_TR: Record<string, string> = {
  left_shoulder: 'sol omuz', right_shoulder: 'sağ omuz',
  left_knee: 'sol diz', right_knee: 'sağ diz',
  lower_back: 'bel', upper_back: 'sırt üstü',
  left_hip: 'sol kalça', right_hip: 'sağ kalça',
};

interface BodyContext {
  fitnessLevel: string;
  primaryGoal: string;
  weight: number;
  height: number;
}

interface WeeklyContext {
  avgFormScore: number;
  sessionsCompleted: number;
  avgReadiness: number;
}

interface SessionContext {
  currentExercise: string;
  repCount: number;
  formScore: number;
}

interface AssembleOptions {
  body: BodyContext;
  weekly: WeeklyContext;
  session: SessionContext | null;
  injuries: Array<{ location: string; severity: string }>;
}

export function buildContextString(opts: AssembleOptions): string {
  const parts: string[] = [];

  parts.push(`[KULLANICI PROFİLİ]
Seviye: ${opts.body.fitnessLevel} | Hedef: ${opts.body.primaryGoal}
Kilo: ${opts.body.weight}kg | Boy: ${opts.body.height}cm`);

  if (opts.injuries.length > 0) {
    const injuryList = opts.injuries
      .map(i => `${INJURY_LOCATION_TR[i.location] ?? i.location} (${i.severity})`)
      .join(', ');
    parts.push(`[YARALANMALAR] ${injuryList} — bu bölgelere yüklenme!`);
  }

  parts.push(`[HAFTALIK ÖZET]
Bu hafta ${opts.weekly.sessionsCompleted} seans | Ort. form skoru: ${opts.weekly.avgFormScore}/100
Ort. hazırlık: ${opts.weekly.avgReadiness}/100`);

  if (opts.session) {
    parts.push(`[AKTİF SEANS]
Egzersiz: ${opts.session.currentExercise} | Rep: ${opts.session.repCount} | Form: ${opts.session.formScore}/100`);
  }

  return parts.join('\n\n');
}
