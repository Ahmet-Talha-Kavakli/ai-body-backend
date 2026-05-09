/**
 * V4.8 — Daha Fazla (Apple Action Sheet stili)
 * Tab'a basınca alttan sheet açılır. Apple kalitesinde row layout, hairline ayraç.
 */

import { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native-reanimated';
import { C, font } from '../../lib/theme';

type Item = {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: string;
};

const ITEMS: Item[] = [
  {
    icon: 'person.2.fill',
    iconColor: '#5E5CE6',
    title: 'Karakterlerim',
    subtitle: 'Kendi karakterini yarat',
    href: '/more/characters',
    badge: 'YENİ',
  },
  {
    icon: 'storefront',
    iconColor: '#FF9F0A',
    title: 'Market',
    subtitle: 'Karakter kirala veya satın al',
    href: '/more/market',
    badge: 'YENİ',
  },
  { icon: 'person.crop.circle', iconColor: '#0A84FF', title: 'Profil', href: '/profile' },
  { icon: 'creditcard', iconColor: '#30D158', title: 'Abonelik', href: '/profile/subscription' },
  {
    icon: 'bell.badge',
    iconColor: '#FF3B30',
    title: 'Bildirimler',
    href: '/profile/notifications',
  },
];

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

function Row({ item, isLast, onPress }: { item: Item; isLast: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: 60,
            backgroundColor: pressed ? C.surface : 'transparent',
            borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: C.hairline,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              backgroundColor: item.iconColor,
            }}
          >
            <SymbolView name={item.icon as any} tintColor="#FFFFFF" size={17} />
          </View>

          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: font.semibold,
                  fontSize: 16,
                  color: C.text,
                  flexShrink: 1,
                }}
              >
                {item.title}
              </Text>
              {item.badge && (
                <View
                  style={{
                    backgroundColor: C.accent,
                    borderRadius: 5,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    marginLeft: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.bold,
                      fontSize: 9,
                      color: '#FFFFFF',
                      letterSpacing: 0.3,
                    }}
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
            </View>
            {item.subtitle && (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: font.regular,
                  fontSize: 13,
                  color: C.textMuted,
                  marginTop: 2,
                }}
              >
                {item.subtitle}
              </Text>
            )}
          </View>

          <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
        </View>
      )}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 60,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.hairline,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: C.text,
    flexShrink: 1,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: C.accent,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  badgeText: {
    fontFamily: font.bold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default function MoreSheetScreen() {
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();

  const snapPoints = useMemo(() => [Math.min(460, Math.max(400, height * 0.55))], [height]);

  useFocusEffect(
    useCallback(() => {
      sheetRef.current?.snapToIndex(0);
    }, []),
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    [],
  );

  const navigatedRef = useRef(false);

  const onItemPress = (item: Item) => {
    Haptics.selectionAsync();
    navigatedRef.current = true;
    sheetRef.current?.close();
    setTimeout(() => router.push(item.href as any), 280);
  };

  const onSheetClose = () => {
    // Eğer item'a tıklandıysa zaten push edildi, replace yapma
    if (navigatedRef.current) {
      navigatedRef.current = false;
      return;
    }
    // Sheet swipe-down ile kapatıldı, önceki tab'a dön
    router.replace('/(tabs)/sessions' as any);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        onClose={onSheetClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        animationConfigs={{ duration: 480, easing: EASE_OUT_SPRING }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Daha Fazla</Text>
          <View style={styles.list}>
            {ITEMS.map((item, i) => (
              <Row
                key={item.title}
                item={item}
                isLast={i === ITEMS.length - 1}
                onPress={() => onItemPress(item)}
              />
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  sheetBg: {
    backgroundColor: C.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    backgroundColor: C.borderStrong,
    width: 36,
    height: 5,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontFamily: font.bold,
    fontSize: 22,
    color: C.text,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 14,
    letterSpacing: -0.3,
  },
  list: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.hairline,
  },
});
