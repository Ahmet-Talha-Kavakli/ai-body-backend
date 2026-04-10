import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function SessionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  return (
    <ScrollView className="flex-1 bg-bg-primary">
      <View className="p-6">
        <Text className="text-text-primary text-3xl font-bold mb-6">Seanslar</Text>

        {/* Tabs */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('live')}
            className={`flex-1 py-3 px-4 rounded-lg ${activeTab === 'live' ? 'bg-accent-primary' : 'bg-bg-surface border border-border-default'}`}
          >
            <Text className={`text-center font-bold ${activeTab === 'live' ? 'text-white' : 'text-text-secondary'}`}>
              🔴 Canlı Seans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-lg ${activeTab === 'history' ? 'bg-accent-primary' : 'bg-bg-surface border border-border-default'}`}
          >
            <Text className={`text-center font-bold ${activeTab === 'history' ? 'text-white' : 'text-text-secondary'}`}>
              📜 Geçmiş
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'live' ? (
          <View className="gap-4">
            <TouchableOpacity
              onPress={() => router.push('/session/camera')}
              className="bg-accent-primary rounded-2xl p-8 items-center"
            >
              <Text className="text-white text-5xl mb-3">📷</Text>
              <Text className="text-white text-xl font-bold">Form Analizi ile Başla</Text>
              <Text className="text-white text-sm opacity-90 mt-1">Kameradan form kontrol</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/session/offline')}
              className="bg-bg-surface rounded-2xl p-8 border border-border-default items-center"
            >
              <Text className="text-text-primary text-5xl mb-3">📵</Text>
              <Text className="text-text-primary text-xl font-bold">Çevrimdışı Seans</Text>
              <Text className="text-text-secondary text-sm">İnternet olmadan antrenman</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-bg-surface rounded-2xl p-8 border border-border-default items-center pb-20">
              <Text className="text-text-primary text-5xl mb-3">🗣️</Text>
              <Text className="text-text-primary text-xl font-bold">Sesli Koç</Text>
              <Text className="text-text-secondary text-sm">VAPI koçunuzla konuş</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3 pb-20">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                className="bg-bg-surface rounded-xl p-4 border border-border-default flex-row items-center justify-between active:bg-bg-elevated"
              >
                <View>
                  <Text className="text-text-primary font-bold text-base">Seans {i} - {i % 2 === 0 ? 'Chest/Triceps' : 'Push/Pull'}</Text>
                  <Text className="text-text-secondary text-sm mt-1">{i * 2} saat önce • {40 + i * 2} dakika</Text>
                </View>
                <View className="items-center">
                  <Text className="text-accent-success font-bold text-lg">{72 + i}</Text>
                  <Text className="text-text-secondary text-xs">/100</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
