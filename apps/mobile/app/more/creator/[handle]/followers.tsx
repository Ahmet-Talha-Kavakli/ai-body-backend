/**
 * V4.8 Faz F — Yaratıcı takipçi listesi (sadece sahibi görür)
 */

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useCreatorsApi, type CreatorFollower } from '../../../../lib/marketplace/creatorsApi';

export default function FollowersScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const api = useCreatorsApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [followers, setFollowers] = useState<CreatorFollower[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!handle) return;
    const data = await apiRef.current.getFollowers(handle);
    setFollowers(data?.followers ?? []);
    setLoading(false);
  }, [handle]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Takipçiler',
          headerBackTitle: 'Geri',
          headerTitleStyle: { fontFamily: font.bold, fontSize: 17, color: C.text } as any,
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
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: C.page }}
          data={followers}
          keyExtractor={(f, i) => `${f.handle ?? 'anon'}-${i}`}
          ListEmptyComponent={
            <View style={{ paddingTop: 80, paddingHorizontal: 32, alignItems: 'center' }}>
              <SymbolView name="person.2" tintColor={C.textMuted} size={36} />
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: 17,
                  color: C.text,
                  marginTop: 12,
                  textAlign: 'center',
                }}
              >
                Henüz takipçi yok
              </Text>
              <Text
                style={{
                  fontFamily: font.regular,
                  fontSize: 14,
                  color: C.textMuted,
                  marginTop: 6,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                Yeni karakter yayınladıkça takipçilerin artar.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.handle) return;
                Haptics.selectionAsync();
                router.push(`/more/creator/${item.handle}` as any);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                gap: 14,
                backgroundColor: pressed ? C.surface : 'transparent',
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={{ width: 44, height: 44 }}
                    contentFit="cover"
                  />
                ) : (
                  <SymbolView name="person.fill" tintColor={C.textMuted} size={20} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
                  {item.handle ? `@${item.handle}` : 'Anonim'}
                </Text>
                <Text
                  style={{
                    fontFamily: font.regular,
                    fontSize: 12,
                    color: C.textMuted,
                    marginTop: 1,
                  }}
                >
                  {item.notifyOnNew ? 'Bildirimleri açık' : 'Sessiz'}
                </Text>
              </View>
              {item.handle && <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />}
            </Pressable>
          )}
        />
      )}
    </>
  );
}
