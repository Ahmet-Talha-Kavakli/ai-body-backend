import * as tf from '@tensorflow/tfjs';

export interface RecoveryInput {
  sleepHours: number;
  stressLevel: number; // 0-10
  proteinIntake: number; // grams
  soreness: number; // 0-10
}

/**
 * Build neural network for recovery state classification
 * Input: 4 recovery metrics
 * Output: Recovery state (0-1)
 */
export async function buildRecoveryModel(): Promise<tf.LayersModel> {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [4],
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({
        units: 8,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid', // Output between 0-1
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Calculate recovery state (0-1 scale)
 * 0.0-0.4: Low recovery - recommend light activity
 * 0.4-0.7: Medium recovery - normal intensity
 * 0.7-1.0: High recovery - intense training recommended
 */
export async function classifyRecoveryState(
  input: RecoveryInput
): Promise<number> {
  try {
    // Normalize inputs to 0-1 range
    const normalized = [
      input.sleepHours / 12, // 0-12 hours
      1 - input.stressLevel / 10, // Invert: lower stress = better
      Math.min(input.proteinIntake / 150, 1), // 0-150g target
      1 - input.soreness / 10, // Invert: lower soreness = better
    ];

    const input_tensor = tf.tensor2d([normalized]);
    const model = await buildRecoveryModel();
    const prediction = model.predict(input_tensor) as tf.Tensor;
    const value = await prediction.data();

    input_tensor.dispose();
    prediction.dispose();
    model.dispose();

    return value[0];
  } catch (error) {
    console.error('Recovery classification error:', error);
    return 0.5; // Default to medium
  }
}

/**
 * Generate recovery recommendation based on state
 */
export function generateRecoveryRecommendation(recoveryState: number): string {
  if (recoveryState < 0.4) {
    return 'Your body needs rest. Try light cardio, yoga, or stretching instead of heavy lifting.';
  } else if (recoveryState < 0.7) {
    return 'You are recovering well. Normal training intensity is recommended. Focus on form.';
  } else {
    return 'Excellent recovery! This is a great time for intense training and progressive overload.';
  }
}
