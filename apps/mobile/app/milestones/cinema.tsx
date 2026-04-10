import { generateMilestoneVideo } from '@/lib/milestone-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export default function MilestoneCinema() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateMilestone();
  }, []);

  const generateMilestone = async () => {
    setLoading(true);
    const url = await generateMilestoneVideo({});
    setVideoUrl(url);
    setLoading(false);
  };

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center">
      {loading ? <ActivityIndicator color="#6366F1" /> : <Text className="text-text-primary text-xl">{videoUrl ? 'Video Hazır' : 'Video Oluştur'}</Text>}
      <TouchableOpacity onPress={generateMilestone} className="bg-accent-primary p-4 rounded mt-4">
        <Text className="text-white font-bold">Yeni Video</Text>
      </TouchableOpacity>
    </View>
  );
}
