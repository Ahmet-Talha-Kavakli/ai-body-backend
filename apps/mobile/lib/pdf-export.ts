import * as FileSystem from 'expo-file-system';

export async function generateBiomechanicalPassport(userProfile: any): Promise<string> {
  const content = `
    BIOMECHANICAL PASSPORT - ${userProfile.name}

    Form Analysis:
    - Average Form Score: ${userProfile.avgFormScore}/100
    - Best Exercise: ${userProfile.bestExercise}
    - Weakest Link: ${userProfile.weakestExercise}

    Progression:
    - Deadlift: ${userProfile.deadliftPR}kg
    - Bench: ${userProfile.benchPR}kg
    - Squat: ${userProfile.squatPR}kg

    Injuries:
    ${userProfile.injuries.map((i: any) => `- ${i.location}: ${i.severity}`).join('\n')}
  `;

  const pdfPath = `${FileSystem.documentDirectory}passport-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(pdfPath, content);
  return pdfPath;
}
