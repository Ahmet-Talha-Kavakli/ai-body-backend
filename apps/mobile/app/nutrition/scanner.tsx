import { searchFoodByBarcode } from '@/lib/nutrition-api';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function NutritionScanner() {
  const [scanned, setScanned] = useState(false);
  const [food, setFood] = useState<any>(null);

  const handleBarCodeScanned = async ({ data }: any) => {
    setScanned(true);
    const result = await searchFoodByBarcode(data);
    setFood(result);
  };

  return (
    <View className="flex-1 bg-bg-primary">
      {!scanned ? (
        <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ flex: 1 }} />
      ) : (
        <View className="flex-1 items-center justify-center">
          {food ? (
            <View className="bg-bg-surface p-6 rounded">
              <Text className="text-text-primary text-lg font-bold">{food.name}</Text>
              <Text className="text-text-secondary">{food.calories} kcal</Text>
              <Text className="text-text-secondary">P:{food.protein}g C:{food.carbs}g F:{food.fat}g</Text>
            </View>
          ) : (
            <Text className="text-text-secondary">Ürün bulunamadı</Text>
          )}
          <TouchableOpacity onPress={() => setScanned(false)} className="bg-accent-primary p-4 rounded mt-4">
            <Text className="text-white font-bold">Tekrar Tara</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
