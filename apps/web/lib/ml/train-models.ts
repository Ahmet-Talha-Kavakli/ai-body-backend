import * as tf from '@tensorflow/tfjs'
import { prisma } from '@/lib/db/client'

export async function trainFormScorePredictor() {
  console.log('[ML] Training form score predictor...')

  try {
    // Get historical data - join DailyMetrics with FormRepData via WorkoutSession
    const users = await prisma.user.findMany({
      include: { dailyMetrics: { orderBy: { date: 'desc' }, take: 30 } },
    })

    const trainingData = await Promise.all(users.map(async (user) => {
      const metrics = user.dailyMetrics.reverse()
      if (metrics.length < 30) return []

      // Get avg form score per day from FormRepData
      const formScoreMap: Record<string, number> = {}
      const formReps = await prisma.formRepData.findMany({
        where: { session: { userId: user.id } },
        select: { formScore: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 90,
      })
      formReps.forEach((r) => {
        const day = r.createdAt.toISOString().split('T')[0]
        formScoreMap[day] = (formScoreMap[day] || 0) + r.formScore
      })

      return [{
        input: metrics.map((m) => [
          formScoreMap[m.date.toISOString().split('T')[0]] || 70,
          m.sleepHours || 7,
          Math.max(0, 10 - (m.stressLevel || 5)),
          m.proteinIntake || 150,
        ]),
        output: metrics.slice(1).map((m) => (formScoreMap[m.date.toISOString().split('T')[0]] || 70) / 100),
      }]
    }))

    const flatData = trainingData.flat()

    if (flatData.length === 0) {
      console.log('[ML] Insufficient data for training')
      return null
    }

    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ units: 64, returnSequences: true, inputShape: [30, 4] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 32, returnSequences: false }),
        tf.layers.dense({ units: 7, activation: 'sigmoid' }),
      ],
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    })

    console.log('[ML] Form score predictor trained successfully')
    return model
  } catch (error) {
    console.error('[ML] Form score training failed:', error)
    throw error
  }
}

export async function trainRecoveryClassifier() {
  console.log('[ML] Training recovery classifier...')

  try {
    const dailyMetrics = await prisma.dailyMetrics.findMany({ take: 1000 })

    if (dailyMetrics.length === 0) {
      console.log('[ML] Insufficient data for recovery classifier training')
      return null
    }

    const inputs = dailyMetrics.map((m) => [
      m.sleepHours / 12,
      1 - m.stressLevel / 10,
      Math.min(m.proteinIntake / 150, 1),
      1 - m.soreness / 10,
    ])

    const outputs = dailyMetrics.map(
      (m) =>
        (m.sleepHours * 0.2 + (10 - m.stressLevel) * 0.3 + (m.proteinIntake / 150) * 0.3 + (10 - m.soreness) * 0.2) /
        10
    )

    const model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 16, activation: 'relu', inputShape: [4] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    })

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    })

    console.log('[ML] Recovery classifier trained successfully')
    return model
  } catch (error) {
    console.error('[ML] Recovery classifier training failed:', error)
    throw error
  }
}
