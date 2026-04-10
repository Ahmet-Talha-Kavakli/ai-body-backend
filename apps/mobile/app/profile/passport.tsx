import { generateBiomechanicalPassport } from '@/lib/pdf-export';
import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function BiomechanicalPassport() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center p-4">
      <Text className="text-text-primary text-2xl font-bold mb-4">Biyomechanical Passport</Text>
      {loading ? (
        <ActivityIndicator color="#6366F1" />
      ) : pdfUrl ? (
        <Text className="text-accent-success mb-4">PDF Hazır</Text>
      ) : null}
      <TouchableOpacity onPress={generatePDF} className="bg-accent-primary p-4 rounded">
        <Text className="text-white font-bold">PDF Oluştur</Text>
      </TouchableOpacity>
    </View>
  );
}
