import { db } from '@/lib/db';
import { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';

export default function OfflineSession() {
  const [exercise, setExercise] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const saveOffline = async () => {
    const session = await db.get('offline_sessions').create((s: any) => {
      s.exercise_name = exercise;
      s.reps = parseInt(reps);
      s.weight = parseFloat(weight);
      s.synced = false;
      s.created_at = Date.now();
    });
    alert('Çevrimdışı kaydedildi');
  };

  return (
    <View className="flex-1 bg-bg-primary p-4">
      <Text className="text-text-primary text-xl font-bold mb-4">Çevrimdışı Seans</Text>
      <TextInput placeholder="Egzersiz" value={exercise} onChangeText={setExercise} className="bg-bg-surface text-text-primary p-3 mb-3 rounded" />
      <TextInput placeholder="Tekrar" value={reps} onChangeText={setReps} keyboardType="numeric" className="bg-bg-surface text-text-primary p-3 mb-3 rounded" />
      <TextInput placeholder="Ağırlık (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" className="bg-bg-surface text-text-primary p-3 mb-3 rounded" />
      <TouchableOpacity onPress={saveOffline} className="bg-accent-primary p-4 rounded">
        <Text className="text-white text-center font-bold">Kaydet</Text>
      </TouchableOpacity>
    </View>
  );
}
