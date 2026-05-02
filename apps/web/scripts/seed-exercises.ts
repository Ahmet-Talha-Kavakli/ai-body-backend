/**
 * Fitness Exercise Seed Script
 * Fetches exercises from ExerciseDB (via RapidAPI) and seeds the database.
 *
 * Usage:
 *   RAPIDAPI_KEY=your_key npx ts-node --project tsconfig.json scripts/seed-exercises.ts
 *
 * If no RAPIDAPI_KEY, falls back to built-in curated list.
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// ─── Turkish name + category mapping ─────────────────────────────────────────
// key = ExerciseDB "name" (lowercase)
const TR_NAMES: Record<string, { nametr: string; fitnessCategory: string }> = {
  // ── Chest ──────────────────────────────────────────────────────────────────
  'barbell bench press': { nametr: 'Barbel Bench Press', fitnessCategory: 'salonda' },
  'barbell incline bench press': { nametr: 'Eğik Barbel Bench Press', fitnessCategory: 'salonda' },
  'barbell decline bench press': {
    nametr: 'Negatif Barbel Bench Press',
    fitnessCategory: 'salonda',
  },
  'dumbbell bench press': { nametr: 'Dumbbell Bench Press', fitnessCategory: 'salonda' },
  'dumbbell incline bench press': {
    nametr: 'Eğik Dumbbell Bench Press',
    fitnessCategory: 'salonda',
  },
  'dumbbell fly': { nametr: 'Dumbbell Fly', fitnessCategory: 'salonda' },
  'cable fly': { nametr: 'Kablo Fly', fitnessCategory: 'salonda' },
  'pec deck machine': { nametr: 'Pec Deck Makinesi', fitnessCategory: 'salonda' },
  'push-up': { nametr: 'Şınav', fitnessCategory: 'evde' },
  'wide-grip push-up': { nametr: 'Geniş Tutuşlu Şınav', fitnessCategory: 'evde' },
  'diamond push-up': { nametr: 'Elmas Şınav', fitnessCategory: 'evde' },
  'decline push-up': { nametr: 'Negatif Şınav', fitnessCategory: 'evde' },

  // ── Back ───────────────────────────────────────────────────────────────────
  'barbell bent over row': { nametr: 'Barbel Bent-Over Row', fitnessCategory: 'salonda' },
  'seated cable row': { nametr: 'Oturarak Kablo Row', fitnessCategory: 'salonda' },
  'lat pulldown': { nametr: 'Lat Pulldown', fitnessCategory: 'salonda' },
  'wide-grip lat pulldown': { nametr: 'Geniş Tutuşlu Lat Pulldown', fitnessCategory: 'salonda' },
  'close-grip lat pulldown': { nametr: 'Dar Tutuşlu Lat Pulldown', fitnessCategory: 'salonda' },
  'single-arm dumbbell row': { nametr: 'Tek Kol Dumbbell Row', fitnessCategory: 'salonda' },
  deadlift: { nametr: 'Deadlift', fitnessCategory: 'salonda' },
  'romanian deadlift': { nametr: 'Romen Deadlift', fitnessCategory: 'salonda' },
  'sumo deadlift': { nametr: 'Sumo Deadlift', fitnessCategory: 'salonda' },
  'pull-up': { nametr: 'Barfiks', fitnessCategory: 'outdoor' },
  'chin-up': { nametr: 'Dar Tutuşlu Barfiks', fitnessCategory: 'outdoor' },
  'wide-grip pull-up': { nametr: 'Geniş Tutuşlu Barfiks', fitnessCategory: 'outdoor' },
  'inverted row': { nametr: 'Yatay Row', fitnessCategory: 'evde' },

  // ── Shoulders ──────────────────────────────────────────────────────────────
  'barbell overhead press': { nametr: 'Barbel Omuz Press', fitnessCategory: 'salonda' },
  'dumbbell shoulder press': { nametr: 'Dumbbell Omuz Press', fitnessCategory: 'salonda' },
  'dumbbell lateral raise': { nametr: 'Yan Kaldırma', fitnessCategory: 'salonda' },
  'dumbbell front raise': { nametr: 'Öne Kaldırma', fitnessCategory: 'salonda' },
  'cable lateral raise': { nametr: 'Kablo Yan Kaldırma', fitnessCategory: 'salonda' },
  'reverse pec deck': { nametr: 'Arka Deltoid Pec Deck', fitnessCategory: 'salonda' },
  'arnold press': { nametr: 'Arnold Press', fitnessCategory: 'salonda' },
  'pike push-up': { nametr: 'Pike Şınav', fitnessCategory: 'evde' },
  'handstand push-up': { nametr: 'El Üstü Şınav', fitnessCategory: 'evde' },

  // ── Biceps ─────────────────────────────────────────────────────────────────
  'barbell curl': { nametr: 'Barbel Curl', fitnessCategory: 'salonda' },
  'dumbbell curl': { nametr: 'Dumbbell Curl', fitnessCategory: 'salonda' },
  'hammer curl': { nametr: 'Çekiç Curl', fitnessCategory: 'salonda' },
  'incline dumbbell curl': { nametr: 'Eğik Dumbbell Curl', fitnessCategory: 'salonda' },
  'concentration curl': { nametr: 'Konsantrasyon Curl', fitnessCategory: 'salonda' },
  'cable curl': { nametr: 'Kablo Curl', fitnessCategory: 'salonda' },
  'preacher curl': { nametr: 'Preacher Curl', fitnessCategory: 'salonda' },
  'ez-bar curl': { nametr: 'EZ Bar Curl', fitnessCategory: 'salonda' },

  // ── Triceps ────────────────────────────────────────────────────────────────
  'tricep dips': { nametr: 'Paralel Bar Dips', fitnessCategory: 'outdoor' },
  'bench dip': { nametr: 'Bench Dips', fitnessCategory: 'evde' },
  'close-grip bench press': { nametr: 'Dar Tutuşlu Bench Press', fitnessCategory: 'salonda' },
  'tricep pushdown': { nametr: 'Kablo Triceps Pushdown', fitnessCategory: 'salonda' },
  'skull crusher': { nametr: 'Skull Crusher', fitnessCategory: 'salonda' },
  'overhead tricep extension': { nametr: 'Üst Triceps Uzatma', fitnessCategory: 'salonda' },
  'cable overhead tricep extension': { nametr: 'Kablo Üst Triceps', fitnessCategory: 'salonda' },
  'diamond push-up (triceps)': { nametr: 'Elmas Şınav (Triceps)', fitnessCategory: 'evde' },

  // ── Legs: Quads ────────────────────────────────────────────────────────────
  'barbell squat': { nametr: 'Barbel Squat', fitnessCategory: 'salonda' },
  'front squat': { nametr: 'Öne Squat', fitnessCategory: 'salonda' },
  'hack squat': { nametr: 'Hack Squat', fitnessCategory: 'salonda' },
  'leg press': { nametr: 'Bacak Press', fitnessCategory: 'salonda' },
  'leg extension': { nametr: 'Bacak Uzatma', fitnessCategory: 'salonda' },
  'walking lunge': { nametr: 'Yürüyüş Lunge', fitnessCategory: 'evde' },
  'dumbbell lunge': { nametr: 'Dumbbell Lunge', fitnessCategory: 'salonda' },
  'bulgarian split squat': { nametr: 'Bulgar Split Squat', fitnessCategory: 'evde' },
  'bodyweight squat': { nametr: 'Vücut Ağırlığı Squat', fitnessCategory: 'evde' },
  'jump squat': { nametr: 'Sıçramalı Squat', fitnessCategory: 'evde' },
  'sissy squat': { nametr: 'Sissy Squat', fitnessCategory: 'evde' },

  // ── Legs: Hamstrings ───────────────────────────────────────────────────────
  'leg curl': { nametr: 'Bacak Curl (Yatay)', fitnessCategory: 'salonda' },
  'seated leg curl': { nametr: 'Oturarak Bacak Curl', fitnessCategory: 'salonda' },
  'stiff-leg deadlift': { nametr: 'Stiff Leg Deadlift', fitnessCategory: 'salonda' },
  'glute ham raise': { nametr: 'Glute Ham Raise', fitnessCategory: 'salonda' },

  // ── Legs: Glutes ───────────────────────────────────────────────────────────
  'barbell hip thrust': { nametr: 'Barbel Hip Thrust', fitnessCategory: 'salonda' },
  'dumbbell hip thrust': { nametr: 'Dumbbell Hip Thrust', fitnessCategory: 'evde' },
  'glute bridge': { nametr: 'Glute Bridge', fitnessCategory: 'evde' },
  'cable kickback': { nametr: 'Kablo Kickback', fitnessCategory: 'salonda' },
  'donkey kick': { nametr: 'Eşek Tekmesi', fitnessCategory: 'evde' },
  'fire hydrant': { nametr: 'Fire Hydrant', fitnessCategory: 'evde' },

  // ── Legs: Calves ───────────────────────────────────────────────────────────
  'standing calf raise': { nametr: 'Ayakta Baldır Kaldırma', fitnessCategory: 'salonda' },
  'seated calf raise': { nametr: 'Oturarak Baldır Kaldırma', fitnessCategory: 'salonda' },
  'donkey calf raise': { nametr: 'Eşek Baldır Kaldırma', fitnessCategory: 'salonda' },

  // ── Core / Abs ─────────────────────────────────────────────────────────────
  plank: { nametr: 'Plank', fitnessCategory: 'evde' },
  'side plank': { nametr: 'Yan Plank', fitnessCategory: 'evde' },
  crunch: { nametr: 'Mekik', fitnessCategory: 'evde' },
  'bicycle crunch': { nametr: 'Bisiklet Mekik', fitnessCategory: 'evde' },
  'leg raise': { nametr: 'Bacak Kaldırma', fitnessCategory: 'evde' },
  'hanging leg raise': { nametr: 'Asılı Bacak Kaldırma', fitnessCategory: 'outdoor' },
  'russian twist': { nametr: 'Rus Büküm', fitnessCategory: 'evde' },
  'ab wheel rollout': { nametr: 'Ab Tekerlek', fitnessCategory: 'evde' },
  'mountain climber': { nametr: 'Dağ Tırmanıcı', fitnessCategory: 'evde' },
  'v-up': { nametr: 'V-Up', fitnessCategory: 'evde' },
  'toe touch': { nametr: 'Ayak Parmağı Dokunma', fitnessCategory: 'evde' },
  'cable crunch': { nametr: 'Kablo Mekik', fitnessCategory: 'salonda' },

  // ── Full Body / Compound ───────────────────────────────────────────────────
  burpee: { nametr: 'Burpee', fitnessCategory: 'evde' },
  'box jump': { nametr: 'Kutu Sıçraması', fitnessCategory: 'outdoor' },
  'kettlebell swing': { nametr: 'Kettlebell Swing', fitnessCategory: 'salonda' },
  'kettlebell goblet squat': { nametr: 'Kettlebell Goblet Squat', fitnessCategory: 'salonda' },
  'power clean': { nametr: 'Power Clean', fitnessCategory: 'salonda' },
  thruster: { nametr: 'Thruster', fitnessCategory: 'salonda' },
  'clean and jerk': { nametr: 'Clean and Jerk', fitnessCategory: 'salonda' },
  snatch: { nametr: 'Snatch', fitnessCategory: 'salonda' },

  // ── Outdoor ────────────────────────────────────────────────────────────────
  sprint: { nametr: 'Sprint', fitnessCategory: 'outdoor' },
  'hill sprint': { nametr: 'Yokuş Sprint', fitnessCategory: 'outdoor' },
  'stair climbing': { nametr: 'Merdiven Çıkma', fitnessCategory: 'outdoor' },
  'farmer walk': { nametr: 'Çiftçi Yürüyüşü', fitnessCategory: 'outdoor' },
  'sled push': { nametr: 'Kızak İtme', fitnessCategory: 'outdoor' },
  'tire flip': { nametr: 'Lastik Çevirme', fitnessCategory: 'outdoor' },
  'battle rope': { nametr: 'Savaş İpi', fitnessCategory: 'outdoor' },
  'jump rope': { nametr: 'Atlama İpi', fitnessCategory: 'outdoor' },
  'agility ladder': { nametr: 'Çeviklik Merdiveni', fitnessCategory: 'outdoor' },
  'medicine ball slam': { nametr: 'Medikal Top Atma', fitnessCategory: 'outdoor' },

  // ── Evde (Home) ────────────────────────────────────────────────────────────
  'jumping jack': { nametr: 'Jumping Jack', fitnessCategory: 'evde' },
  'high knees': { nametr: 'Yüksek Diz', fitnessCategory: 'evde' },
  'butt kick': { nametr: 'Topuk Vurma', fitnessCategory: 'evde' },
  'bear crawl': { nametr: 'Ayı Yürüyüşü', fitnessCategory: 'evde' },
  inchworm: { nametr: 'İnchworm', fitnessCategory: 'evde' },
  superman: { nametr: 'Superman', fitnessCategory: 'evde' },
  'bird dog': { nametr: 'Kuş-Köpek', fitnessCategory: 'evde' },
  'dead bug': { nametr: 'Ölü Böcek', fitnessCategory: 'evde' },
  'wall sit': { nametr: 'Duvar Oturması', fitnessCategory: 'evde' },
  'step up': { nametr: 'Adım Çıkma', fitnessCategory: 'evde' },
}

// ─── Muscle group Turkish mapping ─────────────────────────────────────────────
const MUSCLE_TR: Record<string, string> = {
  chest: 'Göğüs',
  back: 'Sırt',
  shoulders: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Ön Kol',
  core: 'Karın',
  abs: 'Karın',
  glutes: 'Kalça',
  quads: 'Quadriceps',
  hamstrings: 'Hamstring',
  calves: 'Baldır',
  'upper back': 'Üst Sırt',
  'lower back': 'Alt Sırt',
  lats: 'Lat',
  traps: 'Trapezius',
  delts: 'Deltoid',
  neck: 'Boyun',
  'hip flexors': 'Kalça Fleksörü',
  adductors: 'İç Bacak',
  abductors: 'Dış Bacak',
}

function mapMuscle(m: string): string {
  return MUSCLE_TR[m.toLowerCase()] ?? m
}

// ─── ExerciseDB fetch ─────────────────────────────────────────────────────────
interface ExDBExercise {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gifUrl: string
  secondaryMuscles: string[]
  instructions: string[]
}

async function fetchAllExercises(apiKey: string): Promise<ExDBExercise[]> {
  const limit = 1500
  const url = `https://exercisedb.p.rapidapi.com/exercises?limit=${limit}&offset=0`
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
      'x-rapidapi-key': apiKey,
    },
  })
  if (!res.ok) throw new Error(`ExerciseDB HTTP ${res.status}`)
  return res.json() as Promise<ExDBExercise[]>
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.RAPIDAPI_KEY

  let exercises: ExDBExercise[] = []

  if (apiKey) {
    console.log('Fetching from ExerciseDB...')
    exercises = await fetchAllExercises(apiKey)
    console.log(`Fetched ${exercises.length} exercises from ExerciseDB`)
  } else {
    console.log('No RAPIDAPI_KEY — using curated list only')
  }

  let created = 0
  let skipped = 0

  for (const ex of exercises) {
    const lower = ex.name.toLowerCase()
    const meta = TR_NAMES[lower]

    const slug = ex.id // ExerciseDB uses numeric IDs

    const data = {
      name: ex.name,
      nametr: meta?.nametr ?? ex.name,
      slug,
      muscleGroups: [mapMuscle(ex.target)],
      equipment: [ex.equipment],
      bodyPart: ex.bodyPart,
      target: ex.target,
      secondaryMuscles: ex.secondaryMuscles.map(mapMuscle),
      instructions: ex.instructions,
      gifUrl: ex.gifUrl,
      externalId: ex.id,
      fitnessCategory: meta?.fitnessCategory ?? inferCategory(ex.equipment),
    }

    try {
      await db.exercise.upsert({
        where: { slug },
        update: data,
        create: data,
      })
      created++
    } catch {
      skipped++
    }
  }

  // Also ensure curated list entries exist (with gifUrl = null if not in ExerciseDB)
  for (const [name, meta] of Object.entries(TR_NAMES)) {
    const slug = name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const exists = await db.exercise.findFirst({ where: { slug } })
    if (exists) continue
    await db.exercise
      .create({
        data: {
          name,
          nametr: meta.nametr,
          slug,
          muscleGroups: [],
          equipment: [],
          secondaryMuscles: [],
          instructions: [],
          cues: [],
          commonMistakes: [],
          fitnessCategory: meta.fitnessCategory,
        },
      })
      .catch(() => null)
  }

  console.log(`Done. Created/updated: ${created}, Skipped (duplicate): ${skipped}`)
}

function inferCategory(equipment: string): string {
  const eq = equipment.toLowerCase()
  if (['body weight', 'band', 'stability ball', 'foam roll'].some((e) => eq.includes(e)))
    return 'evde'
  if (['outdoor', 'tire', 'sled'].some((e) => eq.includes(e))) return 'outdoor'
  return 'salonda'
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
