/**
 * V4.6 M75 — CreateStatusSheet
 *
 * Status oluşturma modal'ı:
 * - Mode toggle: Foto / Yazı
 * - Foto: galeriden seç (expo-image-picker), upload, önizleme
 * - Yazı: TextInput + bg renk seçimi (9 renk)
 * - "Gizle" satırı: karakter çoklu seçim (chip)
 * - "Paylaş" → POST /api/assistant/status → onCreated
 *
 * Foto upload: /api/upload (mevcut blob upload endpoint'i kullanılır).
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';
import { font, C, API_URL } from '../../../lib/theme';
import { createStatus } from '../../services/assistant/status';

const BG_COLORS = [
  '#1F2937',
  '#7C3AED',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#EF4444',
  '#6366F1',
  '#14B8A6',
];

interface CharacterLite {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  characters: CharacterLite[];
}

async function uploadPhoto(token: string, uri: string): Promise<string | null> {
  try {
    const form = new FormData();
    const filename = uri.split('/').pop() || `status_${Date.now()}.jpg`;
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    // @ts-ignore RN FormData file
    form.append('file', { uri, name: filename, type: mime });
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.url || json.mediaUrl || null;
  } catch {
    return null;
  }
}

export function CreateStatusSheet({ visible, onClose, onCreated, characters }: Props) {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<'photo' | 'text'>('text');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setMode('text');
    setText('');
    setBgColor(BG_COLORS[0]);
    setPhotoUri(null);
    setHidden(new Set());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setMode('photo');
    }
  };

  const toggleHidden = (id: string) => {
    Haptics.selectionAsync();
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
  };

  const canSubmit = (mode === 'text' && text.trim().length > 0) || (mode === 'photo' && !!photoUri);

  const handleSubmit = async () => {
    if (!canSubmit || posting) return;
    setPosting(true);
    try {
      const token = await getToken();
      if (!token) return;

      let mediaUrl: string | undefined;
      if (mode === 'photo' && photoUri) {
        setUploading(true);
        const url = await uploadPhoto(token, photoUri);
        setUploading(false);
        if (!url) return;
        mediaUrl = url;
      }

      await createStatus(token, {
        contentType: mode,
        mediaUrl,
        caption: mode === 'text' ? text.trim() : undefined,
        bgColor: mode === 'text' ? bgColor : undefined,
        hiddenFromCharacterIds: Array.from(hidden),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onCreated();
    } catch (e) {
      console.error('createStatus failed', e);
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.container}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={s.headerCancel}>İptal</Text>
          </Pressable>
          <Text style={s.headerTitle}>Status Ekle</Text>
          <Pressable
            onPress={handleSubmit}
            hitSlop={12}
            disabled={!canSubmit || posting}
            style={{ opacity: canSubmit && !posting ? 1 : 0.4 }}
          >
            {posting ? (
              <ActivityIndicator size="small" color={C.accent} />
            ) : (
              <Text style={s.headerDone}>Paylaş</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mode toggle */}
          <View style={s.modeRow}>
            <Pressable
              style={[s.modeBtn, mode === 'text' && s.modeBtnActive]}
              onPress={() => setMode('text')}
            >
              <Text style={[s.modeText, mode === 'text' && s.modeTextActive]}>Yazı</Text>
            </Pressable>
            <Pressable
              style={[s.modeBtn, mode === 'photo' && s.modeBtnActive]}
              onPress={() => {
                if (!photoUri) handlePickPhoto();
                else setMode('photo');
              }}
            >
              <Text style={[s.modeText, mode === 'photo' && s.modeTextActive]}>Foto</Text>
            </Pressable>
          </View>

          {/* Preview / editor */}
          {mode === 'text' ? (
            <View style={[s.preview, { backgroundColor: bgColor }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Aklındaki..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={s.textInput}
                multiline
                maxLength={200}
                autoFocus
              />
            </View>
          ) : (
            <Pressable onPress={handlePickPhoto} style={s.previewPhoto}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={{ flex: 1, width: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={s.photoPlaceholder}>
                  <Text style={{ fontSize: 48 }}>🖼</Text>
                  <Text style={s.photoPlaceholderText}>Galeriden seç</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Bg renk seçimi (sadece text mode) */}
          {mode === 'text' && (
            <View style={s.colorRow}>
              {BG_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBgColor(c);
                  }}
                  style={[s.colorDot, { backgroundColor: c }, bgColor === c && s.colorDotActive]}
                />
              ))}
            </View>
          )}

          {/* Gizleme listesi */}
          {characters.length > 0 && (
            <View style={s.hideSection}>
              <Text style={s.hideTitle}>Şu kişilerden gizle</Text>
              <Text style={s.hideHint}>Seçilen karakterler bu status'ü göremez</Text>
              <View style={s.chipWrap}>
                {characters.map((c) => {
                  const active = hidden.has(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleHidden(c.id)}
                      style={[s.chip, active && s.chipActive]}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {uploading && (
          <View style={s.uploadingOverlay}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={{ marginTop: 12, color: '#FFFFFF', fontFamily: font.medium }}>
              Yükleniyor...
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerCancel: { fontSize: 17, color: '#3C3C43', fontFamily: font.regular },
  headerTitle: { fontSize: 17, color: '#000', fontFamily: font.semibold },
  headerDone: { fontSize: 17, color: C.accent, fontFamily: font.semibold },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    margin: 16,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeText: { fontSize: 14, color: '#8E8E93', fontFamily: font.medium },
  modeTextActive: { color: '#000', fontFamily: font.semibold },
  preview: {
    marginHorizontal: 16,
    height: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: font.semibold,
    textAlign: 'center',
    minHeight: 60,
    width: '100%',
  },
  previewPhoto: {
    marginHorizontal: 16,
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: font.medium,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#000',
  },
  hideSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  hideTitle: {
    fontSize: 15,
    color: '#000',
    fontFamily: font.semibold,
    marginBottom: 4,
  },
  hideHint: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: font.regular,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#FFE5E5',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    color: '#3C3C43',
    fontFamily: font.medium,
  },
  chipTextActive: {
    color: '#EF4444',
    fontFamily: font.semibold,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
