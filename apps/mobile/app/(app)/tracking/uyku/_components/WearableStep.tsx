import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from './theme';
import NextButton from './NextButton';

interface WearableInfo {
  id: string;
  type: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
}

export default function WearableStep({ onConnected }: { onConnected: (synced: boolean) => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appleWatch, setAppleWatch] = useState<WearableInfo | null>(null);

  const fetchStatus = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/health/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list: WearableInfo[] = Array.isArray(data) ? data : [];
      setAppleWatch(list.find((d) => d.type === 'apple_watch') ?? null);
    } catch (e) {
      console.error('[WearableStep]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    Haptics.selectionAsync();
    // Web OAuth akışını aç
    Linking.openURL(`${API_URL}/api/wearables/apple/connect`).catch(() => {});
  };

  const isConnected = appleWatch?.isConnected ?? false;

  return (
    <View style={st.root}>
      <View style={st.iconHero}>
        <SymbolView
          name="applewatch"
          size={56}
          tintColor={isConnected ? SLEEP.success : SLEEP.accent}
          fallback={<Text style={{ fontSize: 48 }}>⌚</Text>}
        />
      </View>

      <Text style={st.title}>Akıllı Saatini Bağla</Text>
      <Text style={st.sub}>
        Apple Watch ile nabız, HRV ve uyku evrelerini daha hassas takip edebilirim. Opsiyonel —
        bağlamadan da çalışır.
      </Text>

      <View style={[st.card, isConnected && { borderColor: SLEEP.success }]}>
        <View style={st.cardRow}>
          <View
            style={[st.cardIcon, { backgroundColor: isConnected ? '#E5F8EB' : SLEEP.accentSoft }]}
          >
            <SymbolView
              name="applewatch"
              size={22}
              tintColor={isConnected ? SLEEP.success : SLEEP.accent}
              fallback={<Text>⌚</Text>}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.cardTitle}>Apple Watch</Text>
            <Text style={[st.cardSub, isConnected && { color: SLEEP.success }]}>
              {loading ? 'Kontrol ediliyor…' : isConnected ? 'Bağlı ve aktif' : 'Bağlı değil'}
            </Text>
          </View>
          {isConnected && (
            <SymbolView
              name="checkmark.circle.fill"
              size={22}
              tintColor={SLEEP.success}
              fallback={<Text style={{ color: SLEEP.success }}>✓</Text>}
            />
          )}
        </View>

        {!isConnected && !loading && (
          <View style={{ marginTop: 14 }}>
            <NextButton label="Bağlan" onPress={handleConnect} variant="ghost" />
          </View>
        )}
      </View>

      <View style={st.skipHint}>
        <SymbolView
          name="info.circle"
          size={14}
          tintColor={SLEEP.textDim}
          fallback={<Text style={{ color: SLEEP.textDim }}>i</Text>}
        />
        <Text style={st.skipTxt}>
          Akıllı saatin yoksa "Devam"a bas — telefonun mikrofon ve hareket sensörü yeterli.
        </Text>
      </View>

      <View style={{ height: 24 }} />

      <NextButton
        label={isConnected ? 'Devam Et' : 'Şimdilik Atla'}
        onPress={() => onConnected(isConnected)}
        icon="arrow.right"
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { paddingHorizontal: 22, paddingTop: 12 },
  iconHero: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 24,
    color: SLEEP.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 18,
    padding: 16,
    marginTop: 28,
    borderWidth: 1.5,
    borderColor: SLEEP.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: font.semibold, fontSize: 15, color: SLEEP.text },
  cardSub: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textDim, marginTop: 2 },
  skipHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  skipTxt: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textDim,
    lineHeight: 17,
  },
});
