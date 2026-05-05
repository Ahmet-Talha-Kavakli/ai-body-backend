/**
 * V4 Test — Maliyet Dashboard
 *
 * Aylık AI maliyetini özetler. Sadece admin için.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { font, C, API_URL } from '../../../lib/theme';

interface CostData {
  days: number;
  total: {
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    callCount: number;
    durationMs: number;
  };
  byModel: Array<{ model: string; costUsd: number; calls: number }>;
  byPurpose: Array<{ purpose: string; costUsd: number; calls: number }>;
  byProvider: Array<{ provider: string; costUsd: number; calls: number }>;
  dailySeries: Array<{ day: string; cost: number; calls: number }>;
  recent: Array<{
    id: string;
    model: string;
    purpose: string;
    provider: string;
    costUsd: number;
    durationMs: number;
    createdAt: string;
  }>;
}

const PURPOSE_LABEL: Record<string, string> = {
  chat: 'Sohbet',
  decision_deep: 'Karar (derin)',
  decision_fast: 'Karar (hızlı)',
  extractor: 'Hafıza çıkarımı',
  life_engine: 'Yaşam motoru',
  pattern: 'Örüntü/öz',
  inner_thought: 'İç ses',
  avatar: 'Avatar',
};

function fmt$(n: number): string {
  if (n < 0.001) return `$${(n * 1000).toFixed(2)}m`; // milidolar
  return `$${n.toFixed(3)}`;
}

export default function CostDashboardScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/assistant/admin/cost-dashboard?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`load fail: ${res.status}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error('[cost-dashboard]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.muted}>Veri yüklenemedi</Text>
      </View>
    );
  }

  const projectedMonthly = (data.total.costUsd / Math.max(1, data.days)) * 30;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={C.accent} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={C.accent}
          />
        }
      >
        <Text style={styles.title}>AI Maliyeti</Text>
        <Text style={styles.subtitle}>Son {data.days} gün</Text>

        {/* Toplam kart */}
        <View style={styles.bigCard}>
          <Text style={styles.bigCardLabel}>Toplam harcama</Text>
          <Text style={styles.bigCardValue}>${data.total.costUsd.toFixed(2)}</Text>
          <Text style={styles.bigCardHint}>
            {data.total.callCount} çağrı • {(data.total.inputTokens / 1000).toFixed(0)}k giriş +{' '}
            {(data.total.outputTokens / 1000).toFixed(0)}k çıkış token
          </Text>
          <View style={styles.divider} />
          <Text style={styles.bigCardLabel}>Aylık projeksiyon</Text>
          <Text style={[styles.bigCardValue, { fontSize: 22, color: '#374151' }]}>
            ${projectedMonthly.toFixed(2)}
          </Text>
          <Text style={styles.bigCardHint}>Plan hedefi: $0.45/kullanıcı/ay</Text>
        </View>

        {/* Purpose bazında */}
        <Text style={styles.sectionTitle}>Amaç bazında</Text>
        {data.byPurpose.map((p) => (
          <View key={p.purpose} style={styles.row}>
            <Text style={styles.rowLabel}>{PURPOSE_LABEL[p.purpose] ?? p.purpose}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{fmt$(p.costUsd)}</Text>
            <Text style={styles.rowMeta}>{p.calls}×</Text>
          </View>
        ))}

        {/* Model bazında */}
        <Text style={styles.sectionTitle}>Model bazında</Text>
        {data.byModel.slice(0, 8).map((m) => (
          <View key={m.model} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {m.model}
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{fmt$(m.costUsd)}</Text>
            <Text style={styles.rowMeta}>{m.calls}×</Text>
          </View>
        ))}

        {/* Provider bazında */}
        <Text style={styles.sectionTitle}>Sağlayıcı</Text>
        {data.byProvider.map((p) => (
          <View key={p.provider} style={styles.row}>
            <Text style={styles.rowLabel}>{p.provider}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{fmt$(p.costUsd)}</Text>
            <Text style={styles.rowMeta}>{p.calls}×</Text>
          </View>
        ))}

        {/* Günlük trend */}
        <Text style={styles.sectionTitle}>Günlük trend</Text>
        {data.dailySeries.slice(0, 14).map((d) => (
          <View key={d.day} style={styles.row}>
            <Text style={styles.rowLabel}>{d.day}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.rowValue}>{fmt$(d.cost)}</Text>
            <Text style={styles.rowMeta}>{d.calls}×</Text>
          </View>
        ))}

        {/* Son 20 çağrı */}
        <Text style={styles.sectionTitle}>Son çağrılar</Text>
        {data.recent.slice(0, 10).map((r) => (
          <View key={r.id} style={styles.recentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentPurpose}>{PURPOSE_LABEL[r.purpose] ?? r.purpose}</Text>
              <Text style={styles.recentMeta}>
                {r.model} • {r.durationMs}ms
              </Text>
            </View>
            <Text style={styles.rowValue}>{fmt$(r.costUsd)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 28, color: '#0A0A0A' },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: '#6B7280', marginBottom: 16 },
  muted: { fontFamily: font.regular, fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  bigCard: {
    backgroundColor: C.accentSofter,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  bigCardLabel: {
    fontFamily: font.medium,
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigCardValue: {
    fontFamily: font.bold,
    fontSize: 36,
    color: C.accent,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  bigCardHint: {
    fontFamily: font.regular,
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },

  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  rowLabel: { fontFamily: font.regular, fontSize: 14, color: '#374151', maxWidth: '50%' },
  rowValue: { fontFamily: font.semibold, fontSize: 14, color: '#0A0A0A' },
  rowMeta: {
    fontFamily: font.regular,
    fontSize: 12,
    color: '#9CA3AF',
    minWidth: 32,
    textAlign: 'right',
  },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentPurpose: { fontFamily: font.medium, fontSize: 14, color: '#0A0A0A' },
  recentMeta: { fontFamily: font.regular, fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
