/**
 * WaterLogsList — Üst raftaki su şişelerine tıklayınca açılan modal.
 * Apple Health "veri noktaları" listesi tarzı.
 *
 * Her su log'u: saat + miktar + sil butonu.
 * Toplam su miktarı üstte gösterilir.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#32ADE6';
const { height: SH } = Dimensions.get('window');

export interface WaterLogItem {
  id: string;
  amountMl: number;
  createdAt: string;
}

interface Props {
  visible: boolean;
  logs: WaterLogItem[];
  totalMl: number;
  goalMl: number;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Apple-grade easing curves
const APPLE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
const APPLE_STANDARD = Easing.bezier(0.4, 0.0, 0.2, 1);
const APPLE_FADE = Easing.bezier(0.32, 0.72, 0, 1);

export function WaterLogsList({ visible, logs, totalMl, goalMl, onClose, onDelete }: Props) {
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SH)).current; // sheet translateY
  const opAnim = useRef(new Animated.Value(0)).current; // overlay (blur arka plan)
  const sheetOpAnim = useRef(new Animated.Value(0)).current; // sheet opacity (ayrı)

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(SH);
      opAnim.setValue(0);
      sheetOpAnim.setValue(0);
      requestAnimationFrame(() =>
        Animated.parallel([
          // Sheet aşağıdan yukarı — Apple critically-damped spring
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 26,
            mass: 1.1,
            stiffness: 220,
          }),
          // Overlay (blur) hızlıca belirsin
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
            easing: APPLE_OUT,
          }),
          // Sheet fade biraz geç
          Animated.timing(sheetOpAnim, {
            toValue: 1,
            duration: 380,
            delay: 40,
            useNativeDriver: true,
            easing: APPLE_OUT,
          }),
        ]).start(),
      );
    } else if (mounted) {
      // Apple kapanış — sheet aşağı kayar, overlay en son solar
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SH,
          duration: 480,
          useNativeDriver: true,
          easing: APPLE_STANDARD,
        }),
        Animated.timing(sheetOpAnim, {
          toValue: 0,
          duration: 360,
          delay: 100,
          useNativeDriver: true,
          easing: APPLE_FADE,
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 460,
          delay: 120,
          useNativeDriver: true,
          easing: APPLE_FADE,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  const pct = goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0;

  const handleDelete = (id: string, amount: number) => {
    Alert.alert('Su logu sil', `${amount} ml'lik su logu silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[s.sheet, { opacity: sheetOpAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.iconBox}>
              <Ionicons name="water" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Bugünkü Su</Text>
              <Text style={s.subtitle}>{logs.length} kayıt</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <Ionicons name="close" size={18} color="#8E8E93" />
            </Pressable>
          </View>

          {/* Toplam kart */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Toplam</Text>
              <Text style={s.summaryPct}>%{pct}</Text>
            </View>
            <View style={s.summaryValRow}>
              <Text style={s.summaryVal}>{totalMl.toLocaleString('tr-TR')}</Text>
              <Text style={s.summaryUnit}>/ {goalMl.toLocaleString('tr-TR')} ml</Text>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${pct}%` }]} />
            </View>
          </View>

          {/* Liste */}
          {logs.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="water-outline" size={36} color="#C7C7CC" />
              <Text style={s.emptyTxt}>Henüz su kaydı yok</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: SH * 0.45 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              {logs.map((log, i) => (
                <View
                  key={log.id}
                  style={[s.row, i === logs.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={s.timeBox}>
                    <Text style={s.timeTxt}>{formatTime(log.createdAt)}</Text>
                  </View>
                  <View style={s.rowMid}>
                    <Text style={s.rowMl}>{log.amountMl} ml</Text>
                    <Text style={s.rowHint}>Su</Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(log.id, log.amountMl)}
                    hitSlop={10}
                    style={({ pressed }) => [s.delBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF453A" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: SH * 0.85,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Summary
  summaryCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryPct: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '700',
  },
  summaryValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  summaryVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -1,
  },
  summaryUnit: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  barBg: {
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 3,
  },
  // List rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  timeBox: {
    width: 50,
  },
  timeTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  rowMid: { flex: 1 },
  rowMl: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  rowHint: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  delBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTxt: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
