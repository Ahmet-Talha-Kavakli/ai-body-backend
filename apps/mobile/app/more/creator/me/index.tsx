/**
 * V4.8 Faz F — /more/creator/me → kullanıcının kendi yaratıcı profiline yönlendirir
 */

import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { C, font } from '../../../../lib/theme';
import { useCreatorsApi } from '../../../../lib/marketplace/creatorsApi';

export default function CreatorMeRedirect() {
  const api = useCreatorsApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [handle, setHandle] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await apiRef.current.getMyProfile();
      if (me?.handle) setHandle(me.handle);
      else setNotFound(true);
    })();
  }, []);

  if (notFound) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.page,
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ fontFamily: font.bold, fontSize: 17, color: C.text, textAlign: 'center' }}>
          Yaratıcı profili yok
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 14,
            color: C.textMuted,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          İlk karakterini yayınladığında otomatik açılır.
        </Text>
      </View>
    );
  }

  if (!handle) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return <Redirect href={`/more/creator/${handle}` as any} />;
}
