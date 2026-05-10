/**
 * V4.6 M72 — WhatsApp tarzı foto/video viewer (tam ekran)
 *
 * - Üstte header: kapat + senderName + tarih + paylaş ikonu
 * - Pinch-zoom + swipe-down kapatma
 * - Status bar gizli, siyah arka plan
 */

import React from 'react';
import { Modal, View, Pressable, StyleSheet, Dimensions, Text, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  uri: string | null;
  senderName?: string;
  sentAt?: string;
  onClose: () => void;
}

function formatViewerTimestamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (86400 * 1000));
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (diffDays === 0) return `Bugün ${hh}:${mm}`;
  if (diffDays === 1) return `Dün ${hh}:${mm}`;
  if (diffDays < 7) {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return `${days[d.getDay()]} ${hh}:${mm}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1} ${hh}:${mm}`;
}

export function MediaViewer({ visible, uri, senderName, sentAt, onClose }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const reset = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        runOnJS(reset)();
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd((e) => {
      // Eğer zoom 1 ise + aşağı doğru hızlı kayma → kapat
      if (savedScale.value <= 1.05 && e.translationY > 100 && e.velocityY > 200) {
        runOnJS(onClose)();
        runOnJS(reset)();
        return;
      }
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!uri) return null;

  const handleShare = async () => {
    if (!uri) return;
    try {
      const can = await Sharing.isAvailableAsync();
      if (can) await Sharing.shareAsync(uri);
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        reset();
        onClose();
      }}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.backdrop}>
        {/* WhatsApp header: kapat + isim/tarih + paylaş */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
            hitSlop={12}
            style={styles.headerBtn}
          >
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            {senderName && <Text style={styles.headerName}>{senderName}</Text>}
            {sentAt && <Text style={styles.headerTime}>{formatViewerTimestamp(sentAt)}</Text>}
          </View>
          <Pressable onPress={handleShare} hitSlop={12} style={styles.headerBtn}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.imgWrap, animatedStyle]}>
            <Image
              source={{ uri }}
              style={{ width: SCREEN_W, height: SCREEN_H }}
              contentFit="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'flex-start', paddingLeft: 8 },
  headerName: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  headerTime: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  imgWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
