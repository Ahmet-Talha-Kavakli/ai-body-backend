import { analyzePose } from '@/lib/pose-detection';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function CameraSession() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [formScore, setFormScore] = useState<number | null>(null);

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <TouchableOpacity onPress={requestPermission} className="bg-accent-primary p-4 rounded">
          <Text className="text-white">Kamera İzni Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureAndAnalyze = async () => {
    const photo = await (cameraRef.current as any)?.takePictureAsync();
    const result = await analyzePose(photo);
    setFormScore(result.formScore);
  };

  return (
    <View className="flex-1 bg-bg-primary">
      <CameraView ref={cameraRef} className="flex-1" />
      <View className="absolute bottom-0 w-full bg-black/50 p-4">
        {formScore && <Text className="text-text-primary text-center text-xl font-bold mb-4">Form: {formScore.toFixed(0)}/100</Text>}
        <TouchableOpacity onPress={captureAndAnalyze} className="bg-accent-primary p-4 rounded">
          <Text className="text-white text-center font-bold">Analiz Et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
