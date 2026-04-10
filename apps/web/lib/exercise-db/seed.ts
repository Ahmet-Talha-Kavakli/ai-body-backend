// @ts-nocheck
import { fetchAllExercises } from './client';
import { prisma } from '../db';

async function seedExercises() {
  console.log('ExerciseDB\'den egzersizler çekiliyor...');
  const exercises = await fetchAllExercises();
  console.log(`${exercises.length} egzersiz bulundu`);

  let count = 0;
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { externalId: ex.id },
      update: {
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target,
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        gifUrl: ex.gifUrl,
      },
      create: {
        externalId: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target,
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        gifUrl: ex.gifUrl,
        slug: ex.name.toLowerCase().replace(/\s+/g, '-') + `-${ex.id?.substring(0, 8)}`,
        description: `Exercise: ${ex.name}`,
        muscleGroups: [ex.target].filter(Boolean),
        equipment: ex.equipment ? [ex.equipment] : [],
        difficultyLevel: 'intermediate',
        animationKey: ex.name.toLowerCase().replace(/\s+/g, '_'),
        cues: [],
        commonMistakes: [],
      },
    });
    count++;
    if (count % 100 === 0) console.log(`${count}/${exercises.length}`);
  }
  console.log('Seed tamamlandı.');
}

seedExercises().catch(console.error).finally(() => prisma.$disconnect());
