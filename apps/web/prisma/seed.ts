import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedUser {
  clerkId: string
  email: string
  name: string
}

const seedUsers: SeedUser[] = [
  { clerkId: 'user_seed_alice', email: 'alice@fitai.dev', name: 'Alice Johnson' },
  { clerkId: 'user_seed_bob', email: 'bob@fitai.dev', name: 'Bob Martinez' },
  { clerkId: 'user_seed_carol', email: 'carol@fitai.dev', name: 'Carol Zhang' },
  { clerkId: 'user_seed_dave', email: 'dave@fitai.dev', name: 'Dave Kim' },
  { clerkId: 'user_seed_eve', email: 'eve@fitai.dev', name: 'Eve Okafor' },
]

async function main() {
  console.log('🌱 Starting database seed...')

  try {
    // Clean up existing seed data
    console.log('🗑️ Cleaning up existing seed data...')

    // Delete in order of dependencies
    await prisma.workoutAnalytics.deleteMany({
      where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } },
    })

    await prisma.formRepData.deleteMany({
      where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } },
    })

    await prisma.completedSet.deleteMany({
      where: { session: { user: { clerkId: { startsWith: 'user_seed_' } } } },
    })

    await prisma.workoutSession.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userActivity.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userFriend.deleteMany({
      where: {
        OR: [
          { user: { clerkId: { startsWith: 'user_seed_' } } },
          { friend: { clerkId: { startsWith: 'user_seed_' } } },
        ],
      },
    })

    await prisma.dailyMetrics.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userWeakness.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userNutritionMetrics.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userTrainingHistory.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userHealthMetrics.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.userBasicProfile.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.aIMessage.deleteMany({
      where: { conversation: { user: { clerkId: { startsWith: 'user_seed_' } } } },
    })

    await prisma.aIConversation.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.subscription.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.nutritionGoal.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.mealLog.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.wearableReading.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.wearableDevice.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.injury.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.healthProfile.deleteMany({
      where: { user: { clerkId: { startsWith: 'user_seed_' } } },
    })

    await prisma.user.deleteMany({
      where: { clerkId: { startsWith: 'user_seed_' } },
    })

    // Create users
    console.log('👥 Creating seed users...')
    const users = await Promise.all(
      seedUsers.map(seedUser =>
        prisma.user.create({
          data: {
            clerkId: seedUser.clerkId,
            email: seedUser.email,
            name: seedUser.name,
            profilePublic: true,
          },
        })
      )
    )

    // Create basic profiles
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
          activeInjuries: [] as any,
          pastInjuries: [] as any,
          medicalRestrictions: [],
          currentPainPoints: [] as any,
          doctorNotes: 'No known conditions',
        },
      })

      await prisma.userTrainingHistory.create({
        data: {
          userId: user.id,
          trainingDaysPerWeek: Math.floor(Math.random() * 3) + 4,
          preferredExercises: ['squat', 'bench', 'deadlift'],
          dislikedExercises: [],
          personalRecords: {
            squat: Math.floor(Math.random() * 100) + 100,
            bench: Math.floor(Math.random() * 80) + 60,
            deadlift: Math.floor(Math.random() * 120) + 140,
          } as any,
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

    // Create 30 days of DailyMetrics per user
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

    // Create FormRepData entries
    console.log('🏋️ Creating form rep data...')
    for (const user of users) {
      // First create a workout session for each user
      const session = await prisma.workoutSession.create({
        data: {
          userId: user.id,
          durationSeconds: 3600,
          overallFormScore: Math.floor(Math.random() * 30) + 70,
        },
      })

      for (const exercise of ['squat', 'bench', 'deadlift']) {
        for (let set = 1; set <= 3; set++) {
          await prisma.formRepData.create({
            data: {
              sessionId: session.id,
              exerciseName: exercise,
              repNumber: Math.floor(Math.random() * 8) + 3,
              setNumber: set,
              keypoints: { hip: { x: 0.5, y: 0.5, z: 0 }, knee: { x: 0.5, y: 0.6, z: 0 }, ankle: { x: 0.5, y: 0.7, z: 0 } } as any,
              angles: { kneeAngle: Math.floor(Math.random() * 30) + 70, hipAngle: Math.floor(Math.random() * 30) + 70 } as any,
              formScore: Math.floor(Math.random() * 30) + 70,
              technicalCorrectness: Math.floor(Math.random() * 30) + 70,
              errors: ['Minor form deviation'] as any,
              muscleEngagement: { quadriceps: 0.85, glutes: 0.9, hamstrings: 0.8 } as any,
              injuryRisk: Math.floor(Math.random() * 20) + 10,
              voiceFeedback: 'Great form! Keep it up!',
              corrections: ['Keep chest up', 'Wider stance'],
              encouragement: 'Excellent execution on that set!',
            },
          })
        }
      }
    }

    // Create friend relationships
    console.log('👯 Creating friend relationships...')
    // alice <-> bob
    await prisma.userFriend.create({
      data: {
        userId: users[0].id,
        friendId: users[1].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })
    await prisma.userFriend.create({
      data: {
        userId: users[1].id,
        friendId: users[0].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    // alice <-> carol
    await prisma.userFriend.create({
      data: {
        userId: users[0].id,
        friendId: users[2].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })
    await prisma.userFriend.create({
      data: {
        userId: users[2].id,
        friendId: users[0].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    // dave <-> alice
    await prisma.userFriend.create({
      data: {
        userId: users[3].id,
        friendId: users[0].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })
    await prisma.userFriend.create({
      data: {
        userId: users[0].id,
        friendId: users[3].id,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    // Create activities
    console.log('🎯 Creating user activities...')
    for (const user of users) {
      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'workout_completed',
          description: 'Completed intense upper body session',
          metadata: { duration: 60, exercises: 8 } as any,
          visibility: 'friends_only',
        },
      })

      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'pr_achieved',
          description: `New PR: Bench ${Math.floor(Math.random() * 50) + 100}kg x 5`,
          metadata: { exercise: 'bench', weight: 120, reps: 5 } as any,
          visibility: 'public',
        },
      })

      await prisma.userActivity.create({
        data: {
          userId: user.id,
          activityType: 'streak_milestone',
          description: '7 day workout streak achieved!',
          metadata: { streakDays: 7 } as any,
          visibility: 'friends_only',
        },
      })
    }

    // Create leaderboard entries
    console.log('🏆 Creating leaderboard entries...')
    const leaderboardTypes = ['form_score', 'most_consistent', 'strongest', 'best_recovery']
    const periods = ['weekly', 'monthly', 'all_time']

    for (const type of leaderboardTypes) {
      for (const period of periods) {
        const entries = users.map((user, idx) => ({
          userId: user.id,
          username: user.name,
          score: Math.floor(Math.random() * 30) + 70,
          rank: idx + 1,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        }))

        await prisma.leaderboard.upsert({
          where: { leaderboardType_period: { leaderboardType: type, period } },
          create: {
            leaderboardType: type,
            period,
            entries: JSON.stringify(entries),
          },
          update: {
            entries: JSON.stringify(entries),
          },
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
