/**
 * ShareSheet — Strava-style bottom panel that appears once the flyover MP4
 * is ready. Lets the user save the video to their Photos library, hand it
 * off to the system share sheet (Instagram / Messages / AirDrop / …) or
 * dismiss without saving.
 *
 * Animation follows the FitAI standard: smooth slide + fade in (520ms
 * SPRING) on mount, dismissed via parent unmount.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const ACCENT = '#FF6B35';
const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

export interface ShareSheetProps {
  uri: string;
  onClose: () => void;
  insetsBottom: number;
}

export function ShareSheet({ uri, onClose, insetsBottom }: ShareSheetProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
    ]).start();
  }, [fadeIn, slide]);

  const save = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Videoyu kaydedebilmek için Fotoğraflar izni gerekli.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Kaydedildi', 'Video Fotoğraflar uygulamasına eklendi.');
    } catch (e: any) {
      Alert.alert('Kaydedilemedi', e?.message ?? 'Bilinmeyen hata');
    }
  };

  const share = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Paylaşım yok', 'Bu cihazda paylaşım desteklenmiyor.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'video/mp4',
        dialogTitle: 'Antrenmanını paylaş',
        UTI: 'public.mpeg-4',
      });
    } catch {
      // User cancelled — silent.
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          paddingBottom: insetsBottom + 14,
          opacity: fadeIn,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <Text style={styles.title}>YOLCULUĞUNU PAYLAŞ</Text>
      <View style={styles.row}>
        <Pressable onPress={save} style={styles.btn} hitSlop={6}>
          <Ionicons name="download-outline" size={22} color="#fff" />
          <Text style={styles.btnTxt}>İndir</Text>
        </Pressable>
        <Pressable onPress={share} style={[styles.btn, styles.primaryBtn]} hitSlop={6}>
          <Ionicons name="share-outline" size={22} color="#fff" />
          <Text style={styles.btnTxt}>Paylaş</Text>
        </Pressable>
        <Pressable onPress={onClose} style={[styles.btn, styles.secondaryBtn]} hitSlop={6}>
          <Ionicons name="close" size={22} color="#fff" />
          <Text style={styles.btnTxt}>Kapat</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,20,0.97)',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
    marginBottom: 14,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderColor: 'transparent',
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  btnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.1,
  },
});

export default ShareSheet;
