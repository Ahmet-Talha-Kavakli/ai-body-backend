import { generateBiomechanicalPassport } from '@/lib/pdf-export';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';

export default function BiomechanicalPassport() {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const url = await generateBiomechanicalPassport({
        name: 'Kullanıcı',
        avgFormScore: 75,
        bestExercise: 'Squat',
        weakestExercise: 'Bench Press',
        deadliftPR: 180,
        benchPR: 100,
        squatPR: 160,
        injuries: [],
      });
      setPdfUrl(url);
    } catch (err: any) {
      console.log('[passport] PDF generation failed', err);
      Alert.alert('Hata', err?.message ?? 'PDF oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center p-4">
      <Text className="text-text-primary text-2xl font-bold mb-4">Biyomechanical Passport</Text>
      {loading ? (
        <ActivityIndicator color="#6366F1" />
      ) : pdfUrl ? (
        <Text className="text-accent-success mb-4">PDF Hazır: {pdfUrl}</Text>
      ) : null}
      <TouchableOpacity
        onPress={generatePDF}
        disabled={loading}
        className={`p-4 rounded ${loading ? 'bg-gray-600' : 'bg-accent-primary'}`}
      >
        <Text className="text-white font-bold">PDF Oluştur</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="mt-6 p-3">
        <Text className="text-text-secondary">← Geri</Text>
      </TouchableOpacity>
    </View>
  );
}
