/**
 * V4.8 Faz F — Kendi yaratıcı profilimi düzenle
 *
 * iOS native modal paterni:
 *   - Sol başta "İptal", sağ başta "Kaydet" (accent renk)
 *   - TextInput çoklu satır bio
 */

import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useSession } from '@clerk/expo';
import { C, font } from '../../../../lib/theme';
import { useCreatorsApi } from '../../../../lib/marketplace/creatorsApi';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const MAX_BIO = 280;

export default function EditMyProfileScreen() {
  const router = useRouter();
  const api = useCreatorsApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const { session } = useSession();

  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await apiRef.current.getMyProfile();
      if (me) {
        setBio(me.bio ?? '');
        setOriginalBio(me.bio ?? '');
        setAvatar(me.avatar);
        setOriginalAvatar(me.avatar);
      }
      setLoading(false);
    })();
  }, []);

  const dirty = bio.trim() !== originalBio.trim() || avatar !== originalAvatar;

  const onPickAvatar = async () => {
    Haptics.selectionAsync();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('İzin gerekli', 'Avatar seçmek için galeri erişimi gerekli.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];

    setUploading(true);
    try {
      const token = await session?.getToken();
      const fd = new FormData();
      // @ts-expect-error — RN FormData file paterni
      fd.append('file', {
        uri: asset.uri,
        name: `avatar.${asset.uri.split('.').pop() ?? 'jpg'}`,
        type: asset.mimeType ?? 'image/jpeg',
      });
      const r = await fetch(`${API_URL}/api/upload/creator-avatar`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      const data = await r.json();
      if (r.ok && data.url) {
        setAvatar(data.url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Yükleme başarısız', data.error ?? 'Tekrar dene.');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Yükleme başarısız', 'Ağ hatası, tekrar dene.');
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const patch: { bio?: string; avatar?: string } = {};
    if (bio.trim() !== originalBio.trim()) patch.bio = bio.trim();
    if (avatar !== originalAvatar) patch.avatar = avatar ?? '';
    const r = await apiRef.current.updateMyProfile(patch);
    setSaving(false);
    if (r) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOriginalBio(bio.trim());
      setOriginalAvatar(avatar);
      router.back();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profili Düzenle',
          headerTitleStyle: { fontFamily: font.semibold } as any,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={{ fontFamily: font.regular, fontSize: 17, color: C.accent }}>İptal</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={onSave} hitSlop={12} disabled={!dirty || saving}>
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 17,
                  color: dirty && !saving ? C.accent : C.textDim,
                }}
              >
                Kaydet
              </Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.page,
          }}
        >
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: C.page }}
          contentContainerStyle={{ padding: 20 }}
          keyboardDismissMode="interactive"
        >
          {/* Avatar yükleme */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Pressable onPress={onPickAvatar} disabled={uploading}>
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 104, height: 104 }}
                    contentFit="cover"
                  />
                ) : (
                  <SymbolView name="person.fill" tintColor={C.textMuted} size={48} />
                )}
                {uploading && (
                  <View
                    style={{
                      position: 'absolute',
                      inset: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#00000044',
                    }}
                  >
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: C.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: C.page,
                }}
              >
                <SymbolView name="camera.fill" tintColor="#FFFFFF" size={14} />
              </View>
            </Pressable>
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 13,
                color: C.textMuted,
                marginTop: 10,
              }}
            >
              {uploading ? 'Yükleniyor…' : 'Avatar değiştir'}
            </Text>
          </View>

          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 12,
              color: C.textMuted,
              letterSpacing: 0.4,
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Hakkında
          </Text>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <TextInput
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, MAX_BIO))}
              placeholder="Yarattığın karakterleri ve vizyonunu kısaca anlat."
              placeholderTextColor={C.textMuted}
              multiline
              textAlignVertical="top"
              style={{
                fontFamily: font.regular,
                fontSize: 16,
                color: C.text,
                minHeight: 120,
                paddingVertical: 0,
                lineHeight: 22,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 12,
              color: C.textMuted,
              textAlign: 'right',
              marginTop: 6,
            }}
          >
            {bio.length}/{MAX_BIO}
          </Text>
        </ScrollView>
      )}
    </>
  );
}
