import { useState, useCallback, useEffect } from 'react';

interface BasicProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  fitnessLevel: string;
  primaryGoal: string;
  experienceYears: number;
  targetWeight?: number;
}

interface HealthMetrics {
  activeInjuries: any[];
  pastInjuries: any[];
  medicalRestrictions: string[];
  currentPainPoints: any[];
  doctorNotes?: string;
}

interface TrainingHistory {
  trainingDaysPerWeek: number;
  preferredExercises: string[];
  dislikedExercises: string[];
  personalRecords: any[];
  trainingStyle: string;
  preferredDuration: number;
}

interface NutritionMetrics {
  proteinTarget: number;
  calorieTarget?: number;
  dietType: string;
  avgSleepHours: number;
  stressLevel: number;
  waterIntakeTarget: number;
  supplementStack: string[];
}

export function useUserProfile() {
  const [basicProfile, setBasicProfile] = useState<BasicProfile | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory | null>(null);
  const [nutritionMetrics, setNutritionMetrics] = useState<NutritionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all profile data
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [basic, health, training, nutrition] = await Promise.all([
        fetch('/api/user/profile/basic').then(r => r.json()),
        fetch('/api/user/profile/health').then(r => r.json()),
        fetch('/api/user/profile/training').then(r => r.json()),
        fetch('/api/user/profile/nutrition').then(r => r.json()),
      ]);

      setBasicProfile(basic.data);
      setHealthMetrics(health.data);
      setTrainingHistory(training.data);
      setNutritionMetrics(nutrition.data);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update individual profile sections
  const updateBasicProfile = useCallback(
    async (data: Partial<BasicProfile>) => {
      try {
        const response = await fetch('/api/user/profile/basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        setBasicProfile(updated.data);
        return updated.data;
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    []
  );

  const updateHealthMetrics = useCallback(
    async (data: Partial<HealthMetrics>) => {
      try {
        const response = await fetch('/api/user/profile/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        setHealthMetrics(updated.data);
        return updated.data;
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    []
  );

  const updateTrainingHistory = useCallback(
    async (data: Partial<TrainingHistory>) => {
      try {
        const response = await fetch('/api/user/profile/training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        setTrainingHistory(updated.data);
        return updated.data;
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    []
  );

  const updateNutritionMetrics = useCallback(
    async (data: Partial<NutritionMetrics>) => {
      try {
        const response = await fetch('/api/user/profile/nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update');

        const updated = await response.json();
        setNutritionMetrics(updated.data);
        return updated.data;
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    []
  );

  return {
    basicProfile,
    healthMetrics,
    trainingHistory,
    nutritionMetrics,
    isLoading,
    error,
    fetchProfile,
    updateBasicProfile,
    updateHealthMetrics,
    updateTrainingHistory,
    updateNutritionMetrics,
  };
}
