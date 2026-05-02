import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { font, palette as N } from '../../nutrition/theme';
import { fetchPresetDetail, startPresetPlan } from '../api/client';
import type { DietPreset, DietPresetDetail, DietPresetPreview } from '../api/types';

type Props = {
  preset: DietPreset | null;
  visible: boolean;
  onClose: () => void;
  onStarted: () => void;
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırmalık',
};

export function PresetDetailScreen({ preset, visible, onClose, onStarted }: Props) {
  const { getToken } = useAuth();
  const [detail, setDetail] = useState<DietPresetDetail | null>(null);
  const [preview, setPreview] = useState<DietPresetPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [duration, setDuration] = useState(30);
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !preset) return;
    setDuration(preset.defaultDurationDays);
    setDetail(null);
    setPreview(null);
    proteinAnim.setValue(0);
    carbsAnim.setValue(0);
    fatAnim.setValue(0);
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const data = await fetchPresetDetail(token, preset.slug);
        setDetail(data.preset as DietPresetDetail);
        setPreview(data.preview);
        Animated.stagger(100, [
          Animated.timing(proteinAnim, {
            toValue: preset.proteinPct / 100,
            duration: 900,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(carbsAnim, {
            toValue: preset.carbsPct / 100,
            duration: 900,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(fatAnim, {
            toValue: preset.fatPct / 100,
            duration: 900,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
        ]).start();
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, preset]);

  const handleStart = async () => {
    if (!preset) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStarting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await startPresetPlan(token, preset.slug, duration);
      onStarted();
      onClose();
    } catch {
      Alert.alert('Hata', 'Plan başlatılamadı, tekrar dene.');
    } finally {
      setStarting(false);
    }
  };

  if (!preset) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={['bottom']}>
        {/* Nav */}
        <View style={s.nav}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={s.navCancel}>İptal</Text>
          </Pressable>
          <Text style={s.navTitle} numberOfLines={1}>
            {preset.name}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Scroll content */}
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[s.hero, { backgroundColor: preset.accentColor }]}>
            <View style={{ flex: 1 }}>
              <View style={s.heroPill}>
                <Text style={s.heroPillText}>
                  {preset.evidenceLevel === 'strong' || preset.evidenceLevel === 'high'
                    ? '✓ Bilimsel'
                    : preset.evidenceLevel === 'moderate' || preset.evidenceLevel === 'medium'
                      ? '~ Orta Kanıt'
                      : 'Deneysel'}
                </Text>
              </View>
              <Text style={s.heroName}>{preset.name}</Text>
              <Text style={s.heroTagline}>{preset.tagline}</Text>
            </View>
            <View style={s.heroEmoji}>
              <Text style={{ fontSize: 40 }}>🥗</Text>
            </View>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator color={preset.accentColor} size="large" />
            </View>
          ) : (
            <View style={s.body}>
              {detail?.description && <Text style={s.desc}>{detail.description}</Text>}

              {/* Kalori + makro */}
              {preview && (
                <>
                  <View
                    style={[
                      s.calorieCard,
                      {
                        backgroundColor: preset.accentColor + '14',
                        borderColor: preset.accentColor + '30',
                      },
                    ]}
                  >
                    <View style={s.calorieLeft}>
                      <Text style={s.calorieLabel}>Günlük Kalori</Text>
                      <Text style={[s.calorieNum, { color: preset.accentColor }]}>
                        {preview.dailyCalories}
                      </Text>
                      <Text style={s.calorieUnit}>kcal</Text>
                    </View>
                    <View style={s.divider} />
                    <View style={{ flex: 1 }}>
                      <MiniMacro label="Protein" value={preview.proteinG} color="#EC4899" />
                      <MiniMacro label="Karbonhidrat" value={preview.carbsG} color="#F59E0B" />
                      <MiniMacro label="Yağ" value={preview.fatG} color="#8B5CF6" />
                    </View>
                  </View>

                  <View style={s.card}>
                    <Text style={s.cardTitle}>Makro Dağılımı</Text>
                    <MacroBar
                      label="Protein"
                      pct={preset.proteinPct}
                      color="#EC4899"
                      anim={proteinAnim}
                    />
                    <MacroBar
                      label="Karbonhidrat"
                      pct={preset.carbsPct}
                      color="#F59E0B"
                      anim={carbsAnim}
                    />
                    <MacroBar label="Yağ" pct={preset.fatPct} color="#8B5CF6" anim={fatAnim} />
                  </View>
                </>
              )}

              {/* Örnek menü */}
              {preview && (
                <View style={s.card}>
                  <Text style={s.cardTitle}>Bugünün Örnek Menüsü</Text>
                  {preview.sampleMenu.map((m, i) => (
                    <View
                      key={i}
                      style={[s.menuRow, i < preview.sampleMenu.length - 1 && s.menuRowBorder]}
                    >
                      <View style={[s.menuDot, { backgroundColor: preset.accentColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.menuType}>{MEAL_LABELS[m.mealType] ?? m.mealType}</Text>
                        <Text style={s.menuName} numberOfLines={1}>
                          {m.name}
                        </Text>
                      </View>
                      <Text style={[s.menuCal, { color: preset.accentColor }]}>
                        {m.totalCalories} kal
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Kurallar */}
              {detail?.rules && (
                <>
                  <View style={[s.card, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[s.cardTitle, { color: '#059669' }]}>✓ İzin Verilenler</Text>
                    {detail.rules.allowed.map((r, i) => (
                      <Text key={i} style={[s.ruleLine, { color: '#065F46' }]}>
                        · {r}
                      </Text>
                    ))}
                  </View>
                  <View style={[s.card, { backgroundColor: '#FFF5F5' }]}>
                    <Text style={[s.cardTitle, { color: '#DC2626' }]}>✕ Kaçınılacaklar</Text>
                    {detail.rules.avoid.map((r, i) => (
                      <Text key={i} style={[s.ruleLine, { color: '#7F1D1D' }]}>
                        · {r}
                      </Text>
                    ))}
                  </View>
                  {detail.rules.tips.length > 0 && (
                    <View style={[s.card, { backgroundColor: '#FFFBEB' }]}>
                      <Text style={[s.cardTitle, { color: '#D97706' }]}>💡 İpuçları</Text>
                      {detail.rules.tips.map((t, i) => (
                        <Text key={i} style={[s.ruleLine, { color: '#78350F' }]}>
                          · {t}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Süre picker */}
              <View style={s.card}>
                <View style={s.durHeader}>
                  <Text style={s.cardTitle}>Plan Süresi</Text>
                  <Text style={[s.durSelected, { color: preset.accentColor }]}>{duration} gün</Text>
                </View>
                <Picker
                  selectedValue={duration}
                  onValueChange={(val) => {
                    Haptics.selectionAsync();
                    setDuration(val as number);
                  }}
                  itemStyle={s.pickerItem}
                >
                  {Array.from(
                    { length: preset.maxDurationDays - preset.minDurationDays + 1 },
                    (_, i) => preset.minDurationDays + i,
                  ).map((d) => (
                    <Picker.Item key={d} label={`${d} gün`} value={d} />
                  ))}
                </Picker>
              </View>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: N.bg.page,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: N.border.hairline,
          }}
        >
          <Pressable
            onPress={handleStart}
            disabled={starting || loading}
            style={{
              backgroundColor: preset.accentColor,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 56,
            }}
          >
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: font.bold, fontSize: 17, color: '#fff' }}>
                Planı Başlat — {duration} Gün
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function MiniMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={mm.row}>
      <View style={[mm.dot, { backgroundColor: color }]} />
      <Text style={mm.label}>{label}</Text>
      <Text style={[mm.val, { color }]}>{value}g</Text>
    </View>
  );
}

function MacroBar({
  label,
  pct,
  color,
  anim,
}: {
  label: string;
  pct: number;
  color: string;
  anim: Animated.Value;
}) {
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={mb.row}>
      <Text style={mb.label}>{label}</Text>
      <View style={mb.track}>
        <Animated.View style={[mb.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[mb.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const mm = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 6 },
  label: { fontFamily: font.regular, fontSize: 12, color: N.text.tertiary, flex: 1 },
  val: { fontFamily: font.bold, fontSize: 13 },
});

const mb = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontFamily: font.medium, fontSize: 13, color: N.text.secondary, width: 108 },
  track: {
    flex: 1,
    height: 7,
    backgroundColor: N.bg.well,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  fill: { height: 7, borderRadius: 4 },
  pct: { fontFamily: font.bold, fontSize: 13, width: 36, textAlign: 'right' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.bg.page },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: N.bg.page,
  },
  navCancel: { fontFamily: font.regular, fontSize: 17, color: '#007AFF' },
  navTitle: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: N.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  scroll: { flex: 1 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 14,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  heroPillText: { fontFamily: font.semibold, fontSize: 11, color: '#fff' },
  heroName: {
    fontFamily: font.extrabold,
    fontSize: 22,
    color: '#fff',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroTagline: {
    fontFamily: font.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  heroEmoji: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: 16, gap: 12 },
  desc: {
    fontFamily: font.regular,
    fontSize: 15,
    color: N.text.secondary,
    lineHeight: 22,
    paddingHorizontal: 4,
  },

  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  calorieLeft: { alignItems: 'center', paddingRight: 18 },
  calorieLabel: { fontFamily: font.medium, fontSize: 11, color: N.text.tertiary, marginBottom: 2 },
  calorieNum: { fontFamily: font.extrabold, fontSize: 38, letterSpacing: -1, lineHeight: 44 },
  calorieUnit: { fontFamily: font.medium, fontSize: 12, color: N.text.tertiary },
  divider: { width: 1, height: 60, backgroundColor: N.border.hairline, marginRight: 18 },

  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, ...N.shadow.card },
  cardTitle: {
    fontFamily: font.bold,
    fontSize: 15,
    color: N.text.primary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: N.border.hairline,
  },
  menuDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  menuType: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: N.text.tertiary,
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  menuName: { fontFamily: font.medium, fontSize: 14, color: N.text.primary },
  menuCal: { fontFamily: font.bold, fontSize: 14 },

  ruleLine: { fontFamily: font.regular, fontSize: 13, lineHeight: 21, marginBottom: 3 },

  durHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durSelected: { fontFamily: font.bold, fontSize: 17 },
  pickerItem: { fontFamily: font.medium, fontSize: 20, color: N.text.primary, height: 160 },

  ctaWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: N.bg.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
  },
  ctaBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  ctaBtnText: { fontFamily: font.bold, fontSize: 17, color: '#fff' },
});
