import { describe, it, expect, afterEach } from 'vitest';
import { buildFormScoreModel, predictFormScore } from '../models/form-score-predictor';
import { buildRecoveryModel, classifyRecoveryState, generateRecoveryRecommendation } from '../models/recovery-classifier';
import { getModelMetadata, clearModelCache } from '../model-loader';

describe('ML Integration Tests', () => {
  afterEach(() => {
    clearModelCache();
  });

  describe('Form Score Predictor', () => {
    it('should build LSTM model', async () => {
      const model = await buildFormScoreModel();
      expect(model).toBeDefined();
      expect(model.layers).toHaveLength(6);
      model.dispose();
    });

    it('should make predictions with sufficient data', async () => {
      const historicalScores = Array(30).fill(75).map((v, i) => v + Math.random() * 10);
      const recoveryMetrics = Array(30).fill([7, 5, 100]);

      const predictions = await predictFormScore(historicalScores, recoveryMetrics);

      expect(predictions).toHaveLength(7);
      predictions.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('should return average for insufficient data', async () => {
      const historicalScores = Array(10).fill(75);
      const recoveryMetrics = Array(10).fill([7, 5, 100]);

      const predictions = await predictFormScore(historicalScores, recoveryMetrics);

      expect(predictions).toHaveLength(7);
      expect(predictions[0]).toBe(75); // Should be average
    });
  });

  describe('Recovery Classifier', () => {
    it('should build recovery model', async () => {
      const model = await buildRecoveryModel();
      expect(model).toBeDefined();
      expect(model.layers).toHaveLength(4);
      model.dispose();
    });

    it('should classify recovery state between 0-1', async () => {
      const lowRecoveryState = await classifyRecoveryState({
        sleepHours: 4,
        stressLevel: 9,
        proteinIntake: 50,
        soreness: 9,
      });

      expect(lowRecoveryState).toBeGreaterThanOrEqual(0);
      expect(lowRecoveryState).toBeLessThanOrEqual(1);

      const highRecoveryState = await classifyRecoveryState({
        sleepHours: 9,
        stressLevel: 2,
        proteinIntake: 150,
        soreness: 1,
      });

      expect(highRecoveryState).toBeGreaterThanOrEqual(0);
      expect(highRecoveryState).toBeLessThanOrEqual(1);
    });

    it('should generate appropriate recommendations', () => {
      const lowRecovery = generateRecoveryRecommendation(0.3);
      expect(lowRecovery).toContain('light');

      const mediumRecovery = generateRecoveryRecommendation(0.5);
      expect(mediumRecovery.toLowerCase()).toContain('normal');

      const highRecovery = generateRecoveryRecommendation(0.8);
      expect(highRecovery).toContain('intense');
    });
  });

  describe('Model Metadata', () => {
    it('should provide form score predictor metadata', () => {
      const metadata = getModelMetadata('form-score-predictor');
      expect(metadata.name).toBe('Form Score Predictor');
      expect(metadata.type).toBe('lstm');
      expect(metadata.inputShape).toEqual([30, 4]);
      expect(metadata.outputShape).toEqual([7]);
    });

    it('should provide recovery classifier metadata', () => {
      const metadata = getModelMetadata('recovery-classifier');
      expect(metadata.name).toBe('Recovery State Classifier');
      expect(metadata.type).toBe('neural_network');
      expect(metadata.inputShape).toEqual([4]);
    });
  });
});
