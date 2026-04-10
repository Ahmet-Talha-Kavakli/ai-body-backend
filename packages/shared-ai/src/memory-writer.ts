export interface SessionSummaryInput {
  exercises: string[];
  avgFormScore: number;
  totalVolume: number;
  duration: number;
  personalRecords: string[];
  readinessAtStart: number;
}

export function buildSessionSummary(input: SessionSummaryInput): string {
  const lines = [
    `Seansda ${input.exercises.join(', ')} yaptı`,
    `Form skoru ortalama: ${input.avgFormScore}/100`,
    `Toplam yük: ${input.totalVolume}kg`,
    `Süre: ${input.duration} dakika`,
    `Hazırlık skoru başta: ${input.readinessAtStart}/100`,
  ];

  if (input.personalRecords.length > 0) {
    lines.push(`Kişisel rekorlar: ${input.personalRecords.join(', ')}`);
  }

  return lines.join('. ');
}
