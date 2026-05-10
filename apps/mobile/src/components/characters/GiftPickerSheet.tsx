/**
 * V4.5 Faz 15B — Hediye Seçici Bottom Sheet
 *
 * Sembolik hediyeler — kullanıcı karaktere kahve/çiçek/kitap/müzik vs gönderir.
 * Trust/love etkisi var, sohbette özel bubble.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface GiftType {
  giftType: string;
  label: string;
  emoji: string;
  description: string;
}

const GIFTS: GiftType[] = [
  { giftType: 'coffee', label: 'Kahve', emoji: '☕', description: 'Sıcak bir gün için' },
  { giftType: 'flower', label: 'Çiçek', emoji: '🌷', description: 'Küçük bir sürpriz' },
  { giftType: 'book', label: 'Kitap', emoji: '📚', description: 'Düşündürür' },
  { giftType: 'music', label: 'Şarkı', emoji: '🎵', description: 'Senin için bu şarkı' },
  { giftType: 'note', label: 'Not', emoji: '💌', description: 'Kısa bir mesaj' },
  { giftType: 'gift_other', label: 'Sürpriz', emoji: '🎁', description: 'Bir şey...' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (gift: GiftType, message: string) => Promise<void>;
  accentColor: string;
}

export const GiftPickerSheet: React.FC<Props> = ({ visible, onClose, onSend, accentColor }) => {
  const [selected, setSelected] = useState<GiftType | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setSelected(null);
    setMessage('');
    setSending(false);
  };

  const handleClose = () => {
    if (sending) return;
    reset();
    onClose();
  };

  const handleSend = async () => {
    if (!selected || sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await onSend(selected, message.trim());
      reset();
      onClose();
    } catch {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Hediye gönder</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.giftList}
          >
            {GIFTS.map((g) => {
              const isSelected = selected?.giftType === g.giftType;
              return (
                <Pressable
                  key={g.giftType}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelected(g);
                  }}
                  style={[
                    styles.giftCard,
                    isSelected && { borderColor: accentColor, borderWidth: 2 },
                  ]}
                >
                  <Text style={styles.giftEmoji}>{g.emoji}</Text>
                  <Text style={styles.giftLabel}>{g.label}</Text>
                  <Text style={styles.giftDesc}>{g.description}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selected && (
            <View style={styles.messageBox}>
              <TextInput
                placeholder="Bir not eklemek ister misin? (isteğe bağlı)"
                placeholderTextColor="#9CA3AF"
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={200}
              />
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
            <Pressable
              onPress={handleSend}
              disabled={!selected || sending}
              style={{
                flex: 1,
                paddingVertical: 14,
                backgroundColor: accentColor,
                borderRadius: 14,
                alignItems: 'center',
                opacity: !selected || sending ? 0.4 : 1,
              }}
            >
              <Text style={styles.sendText}>
                {sending ? 'Gönderiliyor…' : selected ? `${selected.emoji} Gönder` : 'Hediye seç'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    marginBottom: 16,
    color: '#0A0A0A',
  },
  giftList: {
    gap: 10,
    paddingBottom: 4,
  },
  giftCard: {
    width: 110,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  giftEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  giftLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#0A0A0A',
  },
  giftDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  messageBox: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageInput: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: '#0A0A0A',
    minHeight: 50,
    maxHeight: 100,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  sendText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});

export default GiftPickerSheet;
