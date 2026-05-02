import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);

const ACCENT = '#FF2D55';
const TEXT = '#1C1C1E';
const SUBTEXT = '#8E8E93';
const SEPARATOR = 'rgba(60,60,67,0.18)';
const CARD = '#FFFFFF';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  rightAccent?: string;
  /** override right slot completely (e.g. with a "+" button) */
  rightSlot?: React.ReactNode;
  hideSave?: boolean;
  children: React.ReactNode;
};

export function SheetShell({
  visible,
  title,
  onClose,
  onSave,
  saveLabel = 'Kaydet',
  saveDisabled,
  rightAccent = ACCENT,
  rightSlot,
  hideSave,
  children,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [visible, slideAnim, opAnim]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <View style={styles.navBar}>
            <Pressable
              onPress={close}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Text style={styles.navCancel}>İptal</Text>
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>
              {title}
            </Text>
            {rightSlot ? (
              rightSlot
            ) : hideSave ? (
              <View style={{ width: 44 }} />
            ) : (
              <Pressable
                onPress={onSave}
                disabled={saveDisabled}
                hitSlop={12}
                style={({ pressed }) => ({ opacity: saveDisabled ? 0.4 : pressed ? 0.5 : 1 })}
              >
                <Text style={[styles.navSave, { color: rightAccent }]}>{saveLabel}</Text>
              </Pressable>
            )}
          </View>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CARD,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.92,
    paddingBottom: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(60,60,67,0.18)',
    marginTop: 8,
    marginBottom: 4,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  navCancel: { fontSize: 17, color: SUBTEXT, fontWeight: '400' },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navSave: { fontSize: 17, fontWeight: '600' },
});

export const SHEET_TOKENS = {
  ACCENT,
  TEXT,
  SUBTEXT,
  CARD,
  SEPARATOR,
  BG: '#F2F2F7',
  SEVERITY_COLORS: ['#FFD60A', '#FF9F0A', '#FF3B30', '#FF1744'] as const,
};
