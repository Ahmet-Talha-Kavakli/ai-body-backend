'use client';

import { useVapiCoach } from '@/hooks/useVapiCoach';

export default function SessionPage({ params }: { params: { id: string } }) {
  const { connect, disconnect, isConnected, isSpeaking } = useVapiCoach({
    persona: 'friendly',
    userContext: {
      name: 'Kullanıcı',
      fitnessLevel: 'intermediate',
      primaryGoal: 'muscle_gain',
      activeInjuries: [],
      readinessScore: 75,
      currentExercise: '--',
      sessionNumber: 1,
    },
  });

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <h1 className="text-3xl font-bold mb-6">Antrenman Seansı</h1>
      <div className="bg-bg-surface rounded-lg p-6 border border-border-default max-w-md">
        <div className={`w-24 h-24 rounded-full mx-auto mb-6 ${isSpeaking ? 'bg-accent-energy' : 'bg-accent-primary'} transition-colors`} />
        <p className="text-center text-text-secondary mb-6">
          {isConnected ? 'Koç bağlı' : 'Koç bağlı değil'}
        </p>
        <button
          onClick={isConnected ? disconnect : connect}
          className={`w-full py-3 rounded font-semibold ${
            isConnected
              ? 'bg-accent-danger hover:bg-red-600'
              : 'bg-accent-primary hover:bg-accent-primary-hover'
          }`}
        >
          {isConnected ? 'Bağlantıyı Kes' : 'Koçu Başlat'}
        </button>
      </div>
    </div>
  );
}
