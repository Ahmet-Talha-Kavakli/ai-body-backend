import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { font, palette as N } from '../../nutrition/theme';
import { useDietPresets } from '../hooks/useDietPresets';
import { PresetCard } from '../components/PresetCard';
import type { DietPreset } from '../api/types';

type Props = {
  onSelectPreset: (preset: DietPreset) => void;
  onAiGenerate: () => void;
};

export function DietOnboardingScreen({ onSelectPreset, onAiGenerate }: Props) {
  const { presets, loading } = useDietPresets();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Diyet Planı</Text>
        <Text style={styles.subtitle}>
          14 bilimsel tabanlı hazır plan veya sana özel yapay zeka planı
        </Text>
      </View>

      <Pressable
        onPress={onAiGenerate}
        style={({ pressed }) => [
          styles.aiBtn,
          { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <Text style={styles.aiBtnIcon}>✦</Text>
        <View style={styles.aiBtnText}>
          <Text style={styles.aiBtnTitle}>Yapay Zeka ile Oluştur</Text>
          <Text style={styles.aiBtnSub}>Sana özel kişiselleştirilmiş plan</Text>
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Hazır Planlar</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#007AFF" />
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PresetCard preset={item} onPress={() => onSelectPreset(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.bg.page },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontFamily: font.bold, fontSize: 24, color: N.text.primary, marginBottom: 6 },
  subtitle: { fontFamily: font.regular, fontSize: 13, color: N.text.tertiary, lineHeight: 18 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 16,
  },
  aiBtnIcon: { fontSize: 24, color: '#fff' },
  aiBtnText: { flex: 1 },
  aiBtnTitle: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  aiBtnSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: N.text.tertiary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
