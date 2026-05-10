/**
 * V4.6 M68+M69 — WhatsApp tarzı mesaj eylem modal'ı (birebir)
 *
 * Long-press → koyu blur arka plan + üstte yatay emoji bar (lite, kabarcık) +
 * mesaj orta-sağ veya orta-sol (rolüne göre) + altta menü.
 */

import React from 'react';
import { Modal, View, Pressable, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_W } = Dimensions.get('window');

const REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍'];

interface Props {
  visible: boolean;
  isUser: boolean;
  messageText: string;
  isStarred?: boolean;
  /** Basılı tutulan mesajın ekranda Y konumu (window) */
  anchorY?: number;
  /** Basılı tutulan mesajın yüksekliği */
  anchorHeight?: number;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onStarToggle: () => void;
}

const SCREEN_H = Dimensions.get('window').height;
const REACTION_BAR_H = 54;
const ACTION_MENU_H = 165;
const PREVIEW_GAP = 12;

export function MessageActionsModal({
  visible,
  isUser,
  messageText,
  isStarred,
  anchorY,
  anchorHeight,
  onClose,
  onReact,
  onReply,
  onCopy,
  onStarToggle,
}: Props) {
  const scaleAnim = React.useRef(new Animated.Value(0.92)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 220,
          friction: 14,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleReact = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReact(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      {(() => {
        // Mesajın ekrandaki konumuna göre modal yerleşimi
        const aY = anchorY ?? SCREEN_H * 0.3;
        const aH = anchorHeight ?? 60;
        // Tercih: reaksiyon bar mesajın üstünde, menü altında
        const wantTop = aY - REACTION_BAR_H - PREVIEW_GAP;
        const wantBottom = aY + aH + PREVIEW_GAP;
        // Üstte yer var mı?
        const fitsTop = wantTop > 60;
        // Altta yer var mı (menü dahil)?
        const fitsBottom = wantBottom + ACTION_MENU_H + 60 < SCREEN_H;

        let topPos: number;
        if (fitsTop && fitsBottom) {
          // İdeal — reaksiyon bar mesajın üstünde, menü altında
          topPos = wantTop;
        } else if (fitsTop) {
          // Sadece üstte yer var — modal'ı yukarı kaydır
          topPos = Math.max(80, aY - REACTION_BAR_H - PREVIEW_GAP);
        } else {
          // Sadece altta yer var — modal'ı mesajın altına yerleştir
          topPos = Math.min(SCREEN_H - 380, aY + aH + PREVIEW_GAP);
        }
        return (
          <Animated.View
            style={[
              styles.frame,
              { top: topPos, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
              isUser ? styles.frameUser : styles.frameAssistant,
            ]}
          >
            {/* Reaksiyon bar — yumuşak yuvarlak şerit */}
            <View style={styles.reactionBar}>
              {REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleReact(emoji)}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.reactionItem,
                    pressed && styles.reactionItemPressed,
                  ]}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Mesaj preview baloncuğu */}
            <View
              style={[
                styles.messagePreview,
                isUser ? styles.messagePreviewUser : styles.messagePreviewAssistant,
              ]}
            >
              <Text
                numberOfLines={8}
                style={[
                  styles.previewText,
                  isUser ? styles.previewTextUser : styles.previewTextAssistant,
                ]}
              >
                {messageText || '(boş)'}
              </Text>
            </View>

            {/* Aksiyon menüsü (WhatsApp tarzı, dikey kart) */}
            <View style={styles.actionMenu}>
              <Pressable
                onPress={() => {
                  onReply();
                  onClose();
                }}
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              >
                <Text style={styles.actionText}>Cevapla</Text>
                <Ionicons name="arrow-undo" size={20} color="#000" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                onPress={() => {
                  onCopy();
                  onClose();
                }}
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              >
                <Text style={styles.actionText}>Kopyala</Text>
                <Ionicons name="copy-outline" size={20} color="#000" />
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                onPress={() => {
                  onStarToggle();
                  onClose();
                }}
                style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
              >
                <Text style={styles.actionText}>{isStarred ? 'Yıldızı Kaldır' : 'Yıldızla'}</Text>
                <Ionicons
                  name={isStarred ? 'star' : 'star-outline'}
                  size={20}
                  color={isStarred ? '#F59E0B' : '#000'}
                />
              </Pressable>
            </View>
          </Animated.View>
        );
      })()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    paddingHorizontal: 14,
  },
  frameUser: { right: 0, alignItems: 'flex-end' },
  frameAssistant: { left: 0, alignItems: 'flex-start' },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  reactionItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionItemPressed: { backgroundColor: '#F0F0F5', transform: [{ scale: 1.18 }] },
  reactionEmoji: { fontSize: 24 },
  messagePreview: {
    maxWidth: SCREEN_W * 0.78,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 10,
  },
  messagePreviewUser: {
    backgroundColor: '#5B5DEF',
    borderTopRightRadius: 4,
  },
  messagePreviewAssistant: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  previewText: { fontSize: 16, lineHeight: 22 },
  previewTextUser: { color: '#FFFFFF' },
  previewTextAssistant: { color: '#0A0A0A' },
  actionMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: 240,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRowPressed: { backgroundColor: '#F0F0F5' },
  actionText: { fontSize: 17, color: '#000' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginLeft: 16 },
});
