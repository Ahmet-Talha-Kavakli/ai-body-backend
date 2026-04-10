const EXERCISE_DB_BASE = 'https://exercisedb.p.rapidapi.com';

const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
};

export async function fetchAllExercises() {
  const res = await fetch(`${EXERCISE_DB_BASE}/exercises?limit=1300&offset=0`, { headers });
  if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
  return res.json();
}

export async function fetchExercisesByBodyPart(bodyPart: string) {
  const res = await fetch(`${EXERCISE_DB_BASE}/exercises/bodyPart/${bodyPart}`, { headers });
  if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
  return res.json();
}
