import * as tf from '@tensorflow/tfjs';

export interface ModelMetadata {
  name: string;
  version: string;
  type: 'lstm' | 'neural_network' | 'classifier';
  inputShape: number[];
  outputShape: number[];
}

const modelCache = new Map<string, tf.LayersModel>();

/**
 * Load TensorFlow.js model from public/models/
 * Models should be in JSON format with weights file
 */
export async function loadModel(modelPath: string): Promise<tf.LayersModel | null> {
  // Check cache first
  if (modelCache.has(modelPath)) {
    return modelCache.get(modelPath)!;
  }

  try {
    const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
    modelCache.set(modelPath, model);
    return model;
  } catch (error) {
    console.error(`Failed to load model from ${modelPath}:`, error);
    return null;
  }
}

/**
 * Save trained model to IndexedDB
 */
export async function saveModel(
  model: tf.LayersModel,
  modelName: string
): Promise<void> {
  try {
    await model.save(`indexeddb://${modelName}`);
    console.log(`Model ${modelName} saved to IndexedDB`);
  } catch (error) {
    console.error(`Failed to save model ${modelName}:`, error);
  }
}

/**
 * Load model from IndexedDB
 */
export async function loadModelFromIndexedDB(modelName: string): Promise<tf.LayersModel | null> {
  // Check cache first
  if (modelCache.has(modelName)) {
    return modelCache.get(modelName)!;
  }

  try {
    const model = await tf.loadLayersModel(`indexeddb://${modelName}`);
    modelCache.set(modelName, model);
    return model;
  } catch (error) {
    console.error(`Failed to load model from IndexedDB: ${modelName}`, error);
    return null;
  }
}

/**
 * Clear model cache
 */
export function clearModelCache(): void {
  modelCache.forEach(model => model.dispose());
  modelCache.clear();
}

/**
 * Get model metadata
 */
export function getModelMetadata(modelName: string): ModelMetadata {
  const metadata: Record<string, ModelMetadata> = {
    'form-score-predictor': {
      name: 'Form Score Predictor',
      version: '1.0',
      type: 'lstm',
      inputShape: [30, 4],
      outputShape: [7],
    },
    'recovery-classifier': {
      name: 'Recovery State Classifier',
      version: '1.0',
      type: 'neural_network',
      inputShape: [4],
      outputShape: [1],
    },
  };

  return metadata[modelName] || { name: 'Unknown', version: '0.0', type: 'classifier', inputShape: [], outputShape: [] };
}
