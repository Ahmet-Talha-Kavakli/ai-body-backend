import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP, API_URL } from './_components/theme';
import { useSleepFonts } from './_components/useSleepFonts';

const RANGES = [
  { key: '7', label: 'Son 7 Gün', icon: 'calendar' },
  { key: '30', label: 'Son 30 Gün', icon: 'calendar.badge.clock' },
  { key: '90', label: 'Son 90 Gün', icon: 'calendar.circle' },
  { key: 'all', label: 'Tüm Zamanlar', icon: 'archivebox.fill' },
];

export default function IndirScreen() {
  const fontsLoaded = useSleepFonts();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);

  if (!fontsLoaded) return <View style={st.root} />;

  const handleExport = async (range: string, label: string) => {
    if (exporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExporting(range);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/tracking/sleep/export?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('export_failed');
      const csv = await res.text();
      const filename = `uyku-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: `Uyku Verileri — ${label}`,
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Kaydedildi', `Dosya: ${path}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[uyku/indir]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Bir şey ters gitti', 'Tekrar dener misin?');
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: 40 }]}
    >
      <Text style={st.title}>İndir</Text>
      <Text style={st.sub}>Uyku verilerini CSV olarak dışa aktar</Text>

      <View style={st.intro}>
        <View style={st.introIcon}>
          <SymbolView
            name="square.and.arrow.down.fill"
            size={28}
            tintColor={SLEEP.accent}
            fallback={<Text>⬇</Text>}
          />
        </View>
        <Text style={st.introTitle}>Verilerin Senin</Text>
        <Text style={st.introTxt}>
          Tüm uyku oturumlarını CSV formatında indir. Excel, Numbers veya doktoruna paylaş.
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 24 }}>
        {RANGES.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => handleExport(r.key, r.label)}
            disabled={!!exporting}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              backgroundColor: SLEEP.card,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              opacity: exporting && exporting !== r.key ? 0.4 : 1,
            }}
          >
            <View style={st.iconWrap}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <SymbolView
                name={r.icon as any}
                size={20}
                tintColor={SLEEP.accent}
                fallback={<Text>•</Text>}
              />
            </View>
            <Text style={st.itemLabel}>{r.label}</Text>
            {exporting === r.key ? (
              <ActivityIndicator size="small" color={SLEEP.accent} />
            ) : (
              <SymbolView
                name="square.and.arrow.up"
                size={18}
                tintColor={SLEEP.textMuted}
                fallback={<Text>↗</Text>}
              />
            )}
          </Pressable>
        ))}
      </View>

      <View style={st.infoCard}>
        <SymbolView
          name="info.circle.fill"
          size={16}
          tintColor={SLEEP.accent}
          fallback={<Text>i</Text>}
        />
        <Text style={st.infoTxt}>
          CSV içeriği: tarih, yatış/uyanış zamanı, uyku skoru, evre dakikaları
          (derin/REM/hafif/uyanık), horlama sayısı, hareket sayısı, yatış/sabah BPM ve HRV.
        </Text>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  scroll: { paddingHorizontal: 18 },
  title: { fontFamily: font.extrabold, fontSize: 28, color: SLEEP.text, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
  intro: { alignItems: 'center', marginTop: 24, paddingHorizontal: 16 },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: { fontFamily: font.bold, fontSize: 18, color: SLEEP.text, letterSpacing: -0.3 },
  introTxt: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 15,
    color: SLEEP.text,
    letterSpacing: -0.2,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    marginTop: 24,
    backgroundColor: SLEEP.accentSoft,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoTxt: { flex: 1, fontFamily: font.regular, fontSize: 12, color: SLEEP.text, lineHeight: 17 },
});
