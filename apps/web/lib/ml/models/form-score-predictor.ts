import * as tf from '@tensorflow/tfjs';

export interface FormScoreTrainingData {
  historicalScores: number[]; // Last 30 days of form scores
  recoveryMetrics: number[]; // Sleep, stress, protein (3 features)
  timestamp: number;
}

export interface FormScorePrediction {
  nextDayPredictions: number[]; // 7 days of predicted scores
  confidence: number;
  model: tf.LayersModel;
}

/**
 * Build LSTM model for form score prediction
 * Input: 30-day history of form scores + recovery metrics
 * Output: 7-day forecast
 */
export async function buildFormScoreModel(): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.lstm({
        units: 64,
        returnSequences: true,
        inputShape: [30, 4], // 30 days, 4 features per day
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 7, activation: 'sigmoid' }), // 7-day output
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae'],
  });

  return model;
}

/**
 * Predict form scores for next 7 days
 */
export async function predictFormScore(
  historicalScores: number[],
  recoveryMetrics: number[][]
): Promise<number[]> {
  if (historicalScores.length < 30 || recoveryMetrics.length < 30) {
    // Not enough data - return simple average
    const avgScore = historicalScores.reduce((a, b) => a + b) / historicalScores.length;
    return Array(7).fill(avgScore);
  }

  try {
    // Prepare input tensor (30 days, 4 features: score + 3 recovery metrics)
    const inputData: number[][] = [];
    for (let i = 0; i < 30; i++) {
      inputData.push([
        historicalScores[i],
        recoveryMetrics[i][0], // sleep hours
        recoveryMetrics[i][1], // stress level
        recoveryMetrics[i][2], // protein intake
      ]);
    }

    const input = tf.tensor3d([inputData]);
    const model = await buildFormScoreModel();
    const predictions = model.predict(input) as tf.Tensor;
    const values = await predictions.data();

    // Cleanup
    input.dispose();
    predictions.dispose();
    model.dispose();

    return Array.from(values).slice(0, 7);
  } catch (error) {
    console.error('Form score prediction error:', error);
    return Array(7).fill(0);
  }
}
