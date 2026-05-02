import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from './theme';

export default function StepHeader({
  step,
  total,
  title,
  onBack,
  onClose,
}: {
  step: number; // 0-indexed
  total: number;
  title: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  const progAnim = useRef(new Animated.Value((step + 1) / total)).current;
  const prevStep = useRef(step);

  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    Animated.timing(progAnim, {
      toValue: (step + 1) / total,
      duration: 480,
      useNativeDriver: false,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, [step, total]);

  return (
    <View style={st.wrap}>
      <View style={st.row}>
        <Pressable onPress={onBack} hitSlop={14} style={st.sideBtn} disabled={!onBack}>
          {onBack && (
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={SLEEP.text}
              fallback={<Text>‹</Text>}
            />
          )}
        </Pressable>

        <Text style={st.title} numberOfLines={1}>
          {title}
        </Text>

        <Pressable onPress={onClose} hitSlop={14} style={st.sideBtn} disabled={!onClose}>
          {onClose && (
            <SymbolView
              name="xmark"
              size={18}
              tintColor={SLEEP.textMuted}
              fallback={<Text>×</Text>}
            />
          )}
        </Pressable>
      </View>

      <View style={st.progressTrack}>
        <Animated.View
          style={[
            st.progressFill,
            {
              width: progAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={st.stepTxt}>
        Adım {step + 1} / {total}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingBottom: 12, backgroundColor: SLEEP.page },
  row: { flexDirection: 'row', alignItems: 'center', height: 44 },
  sideBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: SLEEP.accentSoft,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: SLEEP.accent },
  stepTxt: {
    fontFamily: font.medium,
    fontSize: 11,
    color: SLEEP.textDim,
    marginTop: 6,
    letterSpacing: 0.4,
  },
});
