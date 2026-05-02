import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import { N, font } from '../theme';
import { saveGoal } from '../api/client';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'goalEditAccessory';

type Props = {
  visible: boolean;
  currentGoal: { calories: number; protein: number; carbs: number; fat: number } | null;
  onClose: () => void;
  onSaved: () => void;
};

export function GoalEditSheet({ visible, currentGoal, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCalories(String(currentGoal?.calories ?? 2000));
      setProtein(String(currentGoal?.protein ?? 150));
      setCarbs(String(currentGoal?.carbs ?? 250));
      setFat(String(currentGoal?.fat ?? 70));
      setError(null);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 1,
          duration: 520,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 1,
          duration: 380,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 460,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 0,
          duration: 320,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const handleSave = async () => {
    const cal = Number(calories);
    const prot = Number(protein);
    const carb = Number(carbs);
    const f = Number(fat);

    if (!cal || !prot || !carb || !f) {
      setError('Tüm alanları doldur');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');
      await saveGoal(token, { dailyCalories: cal, proteinG: prot, carbsG: carb, fatG: f });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch {
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const fromMacros = Number(protein) * 4 + Number(carbs) * 4 + Number(fat) * 9;
  const diff = Math.abs(Number(calories) - fromMacros);
  const match = diff <= 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {/* Overlay — sheet'in arkasında, üstüne tıklayınca kapanır */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]}
          pointerEvents="none"
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet — ekranın altına yapışık */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kvRoot}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom }]}
          >
            <View style={s.handle} />

            <View style={s.navBar}>
              <Pressable
                onPress={onClose}
                hitSlop={14}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-start' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={s.navCancel}>İptal</Text>
              </Pressable>
              <Text style={s.navTitle}>Günlük Hedef</Text>
              <Pressable
                onPress={handleSave}
                hitSlop={14}
                disabled={saving}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-end' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={[s.navSave, saving && { opacity: 0.4 }]}>
                  {saving ? 'Kaydediliyor…' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.body}
              bounces={false}
            >
              {error && (
                <View style={s.errorBanner}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              <GoalField
                label="Kalori"
                unit="kcal"
                value={calories}
                onChange={setCalories}
                color={N.accent.primary}
                description="Günlük toplam enerji hedefi"
              />
              <GoalField
                label="Protein"
                unit="g"
                value={protein}
                onChange={setProtein}
                color={N.macro.protein}
                description="Kas koruma ve onarım için"
              />
              <GoalField
                label="Karbonhidrat"
                unit="g"
                value={carbs}
                onChange={setCarbs}
                color={N.macro.carbs}
                description="Enerji ve beyin fonksiyonu için"
              />
              <GoalField
                label="Yağ"
                unit="g"
                value={fat}
                onChange={setFat}
                color={N.macro.fat}
                description="Hormon üretimi ve vitamin emilimi için"
              />

              <View style={s.summaryCard}>
                <Text style={s.summaryTitle}>Makro kontrolü</Text>
                <Text style={s.summaryLine}>
                  <Text style={s.summaryBold}>{Math.round(fromMacros)} kcal</Text>
                  <Text style={s.summaryMuted}> makrolardan hesaplandı</Text>
                </Text>
                <Text
                  style={[
                    s.summaryStatus,
                    { color: match ? N.semantic.success : N.semantic.warning },
                  ]}
                >
                  {match
                    ? '✓ Hedefle uyumlu'
                    : `${Number(calories) - fromMacros > 0 ? '+' : ''}${Math.round(Number(calories) - fromMacros)} kcal fark var`}
                </Text>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={ACCESSORY_ID}>
          <View style={s.accessory} />
        </InputAccessoryView>
      )}
    </Modal>
  );
}

function GoalField({
  label,
  unit,
  value,
  onChange,
  color,
  description,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  description: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={f.row}>
      <View style={[f.dot, { backgroundColor: color }]} />
      <View style={f.middle}>
        <Text style={f.label}>{label}</Text>
        <Text style={f.desc}>{description}</Text>
      </View>
      <View style={[f.inputWrap, focused && { borderColor: color, borderWidth: 1.5 }]}>
        <TextInput
          style={f.input}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectTextOnFocus
          maxLength={5}
        />
        <Text style={f.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kvRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.hairline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  navSide: { minWidth: 72 },
  navTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
  },
  navCancel: {
    fontSize: 17,
    fontFamily: font.regular,
    color: N.text.secondary,
  },
  navSave: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.accent.primary,
    textAlign: 'right',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },
  errorBanner: {
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.semantic.danger,
  },
  summaryCard: {
    backgroundColor: N.bg.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryLine: { fontSize: 15, fontFamily: font.regular },
  summaryBold: { fontFamily: font.bold, color: N.text.primary },
  summaryMuted: { color: N.text.secondary },
  summaryStatus: { fontSize: 13, fontFamily: font.medium, marginTop: 4 },
  accessory: {
    height: 0,
    backgroundColor: 'transparent',
  },
});

const f = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    flexShrink: 0,
  },
  middle: { flex: 1 },
  label: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: N.border.hairline,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 88,
    justifyContent: 'flex-end',
  },
  input: {
    fontSize: 18,
    fontFamily: font.bold,
    color: N.text.primary,
    minWidth: 50,
    textAlign: 'right',
    padding: 0,
    margin: 0,
  },
  unit: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.text.tertiary,
    marginLeft: 4,
  },
});
