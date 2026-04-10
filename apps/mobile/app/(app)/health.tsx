import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HealthScreen() {
  const [sleep, setSleep] = useState<any>(null);
  const [hr, setHr] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setSleep(data.sleep);
      setHr(data.heartRate);
    } catch (err) {
      console.error(err);
      setSleep({ sleepHours: 7.5, quality: 0.85 });
      setHr({ bpm: 62, trend: 'down' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg-primary">
      <View className="p-6">
        <Text className="text-text-primary text-3xl font-bold mb-6">Sağlık Verileri</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : (
          <View>
            {/* Sleep Card */}
            <View className="bg-bg-surface rounded-2xl p-6 mb-4 border border-border-default">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-text-primary font-bold text-lg">😴 Uyku</Text>
                <Text className="text-text-secondary text-sm">Son gece</Text>
              </View>
              <Text className="text-text-primary text-4xl font-bold mb-3">
                {sleep?.sleepHours}h
              </Text>
              <View className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden mb-2">
                <View
                  className="h-full bg-accent-recovery rounded-full"
                  style={{ width: `${(sleep?.sleepHours / 10) * 100}%` }}
                />
              </View>
              <Text className="text-text-secondary text-sm">
                Kalite: {(sleep?.quality * 100).toFixed(0)}%
              </Text>
            </View>

            {/* Heart Rate Card */}
            <View className="bg-bg-surface rounded-2xl p-6 mb-4 border border-border-default">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-text-primary font-bold text-lg">❤️ Kalp Atışı</Text>
                <Text className="text-text-secondary text-sm">Dinlenme</Text>
              </View>
              <Text className="text-text-primary text-4xl font-bold mb-3">
                {hr?.bpm}
              </Text>
              <Text className="text-text-secondary text-sm">
                BPM • {hr?.trend === 'down' ? '📉 İyi' : hr?.trend === 'up' ? '📈 Yüksek' : '➡️ Stabil'}
              </Text>
            </View>

            {/* HRV Card */}
            <View className="bg-bg-surface rounded-2xl p-6 mb-6 border border-border-default">
              <Text className="text-text-primary font-bold text-lg mb-3">📊 HRV (Kalp Hızı Değişkenliği)</Text>
              <Text className="text-text-primary text-3xl font-bold mb-1">42 ms</Text>
              <Text className="text-text-secondary text-sm">Recovery göstergesi - Yüksek değer daha iyi</Text>
              <View className="mt-4 pt-4 border-t border-border-default">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-text-secondary text-xs">Hafta Ortalaması</Text>
                  <Text className="text-text-primary font-bold">38 ms</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-secondary text-xs">Ay Ortalaması</Text>
                  <Text className="text-text-primary font-bold">35 ms</Text>
                </View>
              </View>
            </View>

            {/* Additional Stats */}
            <View className="bg-bg-surface rounded-2xl p-6 mb-6 border border-border-default">
              <Text className="text-text-primary font-bold text-lg mb-4">📈 Günlük Aktivite</Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-secondary text-sm">Adım</Text>
                  <Text className="text-text-primary font-bold">8.432</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-secondary text-sm">Kalori Yakıldı</Text>
                  <Text className="text-text-primary font-bold">542 kcal</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-secondary text-sm">Aktif Dakika</Text>
                  <Text className="text-text-primary font-bold">47 dk</Text>
                </View>
              </View>
            </View>

            {/* Sync Button */}
            <TouchableOpacity
              onPress={loadHealth}
              className="bg-accent-primary rounded-xl py-4 px-6 mb-6"
            >
              <Text className="text-white text-center font-bold text-base">🔄 Sinkronize Et</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
