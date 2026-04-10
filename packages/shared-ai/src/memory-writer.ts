export interface SessionSummaryInput {
  exercises: string[];
  avgFormScore: number;
  totalVolume: number;
  duration: number;
  personalRecords: string[];
  readinessAtStart: number;
}

export function buildSessionSummary(input: SessionSummaryInput): string {
  const parts = [
    `Seans: ${input.exercises.slice(0, 3).join(', ')}${input.exercises.length > 3 ? ` +${input.exercises.length - 3}` : ''}`,
    `${input.duration} dakika`,
    `Form: ${input.avgFormScore}/100`,
    `Hacim: ${input.totalVolume}kg`,
    `Hazırlık: ${input.readinessAtStart}/100`,
  ];

  if (input.personalRecords.length > 0) {
    parts.push(`kişisel rekor: ${input.personalRecords[0]}`);
  }

  return parts.join(' | ').slice(0, 480);
}

export interface WeeklySummaryInput {
  sessionsCompleted: number;
  avgFormScore: number;
  avgReadiness: number;
  totalVolume: number;
  muscleGroupsWorked: string[];
  weekNumber: number;
}

export function buildWeeklySummary(input: WeeklySummaryInput): string {
  return [
    `Hafta ${input.weekNumber}:`,
    `${input.sessionsCompleted} seans`,
    `ort. form ${input.avgFormScore}/100`,
    `ort. hazırlık ${input.avgReadiness}/100`,
    `toplam hacim ${input.totalVolume}kg`,
    `çalışılan kaslar: ${input.muscleGroupsWorked.slice(0, 4).join(', ')}`,
  ].join(' | ').slice(0, 480);
}
