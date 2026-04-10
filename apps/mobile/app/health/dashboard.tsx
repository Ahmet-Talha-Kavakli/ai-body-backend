import { syncHealthData, fetchSleepData, fetchHeartRate } from '@/lib/health-kit';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function HealthDashboard() {
  const [sleep, setSleep] = useState<any>(null);
  const [hr, setHr] = useState<any>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    setSleep(await fetchSleepData());
    setHr(await fetchHeartRate());
  };

  return (
    <View className="flex-1 bg-bg-primary p-4">
      <Text className="text-text-primary text-2xl font-bold mb-4">Sağlık Verileri</Text>
      {sleep && <Text className="text-text-secondary mb-2">Uyku: {sleep.sleepHours}h (Kalite: {(sleep.quality * 100).toFixed(0)}%)</Text>}
      {hr && <Text className="text-text-secondary mb-4">Kalp Atışı: {hr.bpm} bpm</Text>}
      <TouchableOpacity onPress={async () => await syncHealthData()} className="bg-accent-primary p-4 rounded">
        <Text className="text-white text-center font-bold">Senkronize Et</Text>
      </TouchableOpacity>
    </View>
  );
}
