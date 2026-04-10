// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seedUsers = [
  { clerkId: 'user_seed_alice', email: 'alice@fitai.dev', name: 'Alice Johnson' },
  { clerkId: 'user_seed_bob', email: 'bob@fitai.dev', name: 'Bob Martinez' },
  { clerkId: 'user_seed_carol', email: 'carol@fitai.dev', name: 'Carol Zhang' },
  { clerkId: 'user_seed_dave', email: 'dave@fitai.dev', name: 'Dave Kim' },
  { clerkId: 'user_seed_eve', email: 'eve@fitai.dev', name: 'Eve Okafor' },
]

async function main() {
  console.log('🌱 Starting database seed...')

  try {
    console.log('🗑️ Cleaning up existing seed data...')

    await prisma.workoutAnalytics.deleteMany({ where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } } })
    await prisma.formRepData.deleteMany({ where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } } })
    await prisma.completedSet.deleteMany({ where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } } })
    await prisma.workoutSession.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userActivity.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userFriend.deleteMany({
      where: { OR: [{ user: { clerkId: { startsWith: 'user_seed_' } } }, { friend: { clerkId: { startsWith: 'user_seed_' } } }] },
    })
    await prisma.dailyMetrics.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userWeakness.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userNutritionMetrics.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userTrainingHistory.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userHealthMetrics.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.userBasicProfile.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.aIMessage.deleteMany({ where: { conversation: { user: { clerkId: { startsWith: 'user_seed_' } } } } })
    await prisma.aIConversation.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.subscription.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.nutritionGoal.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.mealLog.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.wearableReading.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.wearableDevice.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.injury.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.healthProfile.deleteMany({ where: { user: { clerkId: { startsWith: 'user_seed_' } } } })
    await prisma.user.deleteMany({ where: { clerkId: { startsWith: 'user_seed_' } } })

    console.log('👥 Creating seed users...')
    const users = await Promise.all(
      seedUsers.map(seedUser =>
        prisma.user.create({
          data: { clerkId: seedUser.clerkId, email: seedUser.email, name: seedUser.name, profilePublic: true },
        })
      )
    )

    console.log('📋 Creating user profiles...')
    for (const user of users) {
      await prisma.userBasicProfile.create({
        data: {
          userId: user.id,
          age: Math.floor(Math.random() * 20) + 25,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          height: Math.floor(Math.random() * 20) + 165,
          weight: Math.floor(Math.random() * 40) + 70,
          fitnessLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
          primaryGoal: ['Strength', 'Hypertrophy', 'Endurance'][Math.floor(Math.random() * 3)],
          experienceYears: Math.floor(Math.random() * 10),
        },
      })

      await prisma.userHealthMetrics.create({
        data: {
          userId: user.id,
          activeInjuries: [],
          pastInjuries: [],
          medicalRestrictions: [],
          currentPainPoints: [],
          doctorNotes: 'No known conditions',
        },
      })

      await prisma.userTrainingHistory.create({
        data: {
          userId: user.id,
          trainingDaysPerWeek: Math.floor(Math.random() * 3) + 4,
          preferredExercises: ['squat', 'bench', 'deadlift'],
          dislikedExercises: [],
          personalRecords: { squat: Math.floor(Math.random() * 100) + 100, bench: Math.floor(Math.random() * 80) + 60, deadlift: Math.floor(Math.random() * 120) + 140 },
          startingStats: { weight: Math.floor(Math.random() * 40) + 70, bodyFat: Math.floor(Math.random() * 15) + 10 },
          trainingStyle: 'Push/Pull/Legs',
          preferredDuration: 60,
        },
      })

      await prisma.userNutritionMetrics.create({
        data: {
          userId: user.id,
          proteinTarget: 150,
          calorieTarget: 2500,
          dietType: 'Omnivore',
          avgSleepHours: 7.5,
          stressLevel: 5,
          alcoholConsumption: 'Occasional',
          smoking: false,
          waterIntakeTarget: 3.0,
          supplementStack: ['whey', 'creatine'],
        },
      })
    }

    console.log('📊 Creating daily metrics...')
    for (const user of users) {
      const metricsData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        metricsData.push({
          userId: user.id,
          date,
          sleepHours: Math.random() * 3 + 6.5,
          sleepQuality: Math.floor(Math.random() * 4) + 6,
          stressLevel: Math.floor(Math.random() * 5) + 2,
          proteinIntake: Math.floor(Math.random() * 80) + 120,
          calorieIntake: Math.floor(Math.random() * 800) + 2100,
          waterIntake: Math.random() * 1.5 + 2.0,
          mood: ['Excellent', 'Good', 'Neutral', 'Poor'][Math.floor(Math.random() * 4)],
          energyLevel: Math.floor(Math.random() * 4) + 5,
          soreness: Math.floor(Math.random() * 5) + 1,
          injuryPain: Math.floor(Math.random() * 2),
        })
      }
      await prisma.dailyMetrics.createMany({ data: metricsData })
    }

    console.log('🏋️ Creating form rep data...')
    for (const user of users) {
      const session = await prisma.workoutSession.create({
        data: { userId: user.id, durationSeconds: 3600, overallFormScore: Math.floor(Math.random() * 30) + 70 },
      })

      for (const exercise of ['squat', 'bench', 'deadlift']) {
        for (let set = 1; set <= 3; set++) {
          await prisma.formRepData.create({
            data: {
              sessionId: session.id,
              exerciseName: exercise,
              repNumber: Math.floor(Math.random() * 8) + 3,
              setNumber: set,
              keypoints: { hip: { x: 0.5, y: 0.5, z: 0 }, knee: { x: 0.5, y: 0.6, z: 0 }, ankle: { x: 0.5, y: 0.7, z: 0 } },
              angles: { kneeAngle: Math.floor(Math.random() * 30) + 70, hipAngle: Math.floor(Math.random() * 30) + 70 },
              formScore: Math.floor(Math.random() * 30) + 70,
              technicalCorrectness: Math.floor(Math.random() * 30) + 70,
              errors: [{ message: 'Minor form deviation', severity: 1 }],
              muscleEngagement: { quadriceps: 0.85, glutes: 0.9, hamstrings: 0.8 },
              injuryRisk: Math.floor(Math.random() * 20) + 10,
              voiceFeedback: 'Great form! Keep it up!',
              corrections: ['Keep chest up', 'Wider stance'],
              encouragement: 'Excellent execution on that set!',
            },
          })
        }
      }
    }

    console.log('👯 Creating friend relationships...')
    const friendPairs = [
      [0, 1], [1, 0], [0, 2], [2, 0], [3, 0], [0, 3],
    ]
    for (const [a, b] of friendPairs) {
      await prisma.userFriend.create({
        data: { userId: users[a].id, friendId: users[b].id, status: 'accepted', acceptedAt: new Date() },
      })
    }

    console.log('🎯 Creating user activities...')
    for (const user of users) {
      await prisma.userActivity.create({
        data: { userId: user.id, activityType: 'workout_completed', description: 'Completed intense upper body session', metadata: { duration: 60, exercises: 8 }, visibility: 'friends_only' },
      })
      await prisma.userActivity.create({
        data: { userId: user.id, activityType: 'pr_achieved', description: `New PR: Bench ${Math.floor(Math.random() * 50) + 100}kg x 5`, metadata: { exercise: 'bench', weight: 120, reps: 5 }, visibility: 'public' },
      })
      await prisma.userActivity.create({
        data: { userId: user.id, activityType: 'streak_milestone', description: '7 day workout streak achieved!', metadata: { streakDays: 7 }, visibility: 'friends_only' },
      })
    }

    console.log('🏆 Creating leaderboard entries...')
    for (const type of ['form_score', 'most_consistent', 'strongest', 'best_recovery']) {
      for (const period of ['weekly', 'monthly', 'all_time']) {
        const entries = users.map((user, idx) => ({
          userId: user.id, username: user.name, score: Math.floor(Math.random() * 30) + 70, rank: idx + 1,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        }))
        await prisma.leaderboard.upsert({
          where: { leaderboardType_period: { leaderboardType: type, period } },
          create: { leaderboardType: type, period, entries: JSON.stringify(entries) },
          update: { entries: JSON.stringify(entries) },
        })
      }
    }

    console.log('✅ Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
