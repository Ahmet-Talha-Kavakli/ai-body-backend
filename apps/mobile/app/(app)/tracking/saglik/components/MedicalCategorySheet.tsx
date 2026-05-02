import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { SheetShell, SHEET_TOKENS } from './SheetShell';

const { ACCENT, TEXT, SUBTEXT } = SHEET_TOKENS;

const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);
const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

const ICON_TINT_BG = 'rgba(120,120,128,0.10)';
const ICON_STROKE = 'rgba(60,60,67,0.55)';
const CELL_BG = '#FFFFFF';
const CELL_HIGHLIGHT = 'rgba(60,60,67,0.06)';
const HAIRLINE = 'rgba(60,60,67,0.12)';
const CHEVRON = 'rgba(60,60,67,0.28)';
const SECTION_BG = '#F2F2F7';
const SECTION_CAPTION = 'rgba(60,60,67,0.6)';

export type CategoryRow = {
  id: string;
  title: string;
  subtitle?: string;
};

type Props = {
  visible: boolean;
  title: string;
  /** @deprecated kept for backward compatibility */
  icon?: string;
  rows: CategoryRow[];
  emptyLabel: string;
  /** Bu kategori için form henüz hazır değilse — "Yakında" görünür, CTA disabled */
  comingSoon?: boolean;
  onClose: () => void;
  onAdd: () => void;
  onPressRow?: (id: string) => void;
};

function singularize(s: string): string {
  const map: Record<string, string> = {
    Alerjiler: 'Alerji',
    Aşılar: 'Aşı',
    'Kronik Rahatsızlıklar': 'Rahatsızlık',
    Bağımlılıklar: 'Bağımlılık',
  };
  if (map[s]) return map[s];
  if (s.endsWith('lar')) return s.slice(0, -3);
  if (s.endsWith('ler')) return s.slice(0, -3);
  return s;
}

/* ---------------- Icons ---------------- */
function PlusIcon({ size = 30, color = ICON_STROKE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 30, color = ICON_STROKE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4h10M7 20h10M8 4v3.5c0 1.5 1 2.5 2 3.5l2 1 2-1c1-1 2-2 2-3.5V4M8 20v-3.5c0-1.5 1-2.5 2-3.5l2-1 2 1c1 1 2 2 2 3.5V20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ---------------- Primary CTA Button (iOS filled, full-width) ---------------- */
function CTAButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };
  const onPressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[s.ctaWrap, { transform: [{ scale }], opacity: disabled ? 0.4 : opacity }]}
    >
      <Pressable
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={s.cta}
      >
        <Text allowFontScaling={false} style={s.ctaText}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ---------------- Cell ---------------- */
function Cell({
  row,
  isFirst,
  isLast,
  onPress,
}: {
  row: CategoryRow;
  isFirst: boolean;
  isLast: boolean;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bg = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.99,
        duration: 80,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(bg, { toValue: 1, duration: 80, useNativeDriver: false, easing: EASE_MICRO }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
      Animated.timing(bg, {
        toValue: 0,
        duration: 130,
        useNativeDriver: false,
        easing: EASE_SPRING,
      }),
    ]).start();
  };

  const backgroundColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [CELL_BG, CELL_HIGHLIGHT],
  });

  return (
    <Animated.View
      style={{
        backgroundColor,
        borderTopLeftRadius: isFirst ? 12 : 0,
        borderTopRightRadius: isFirst ? 12 : 0,
        borderBottomLeftRadius: isLast ? 12 : 0,
        borderBottomRightRadius: isLast ? 12 : 0,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => {
          Haptics.selectionAsync();
          onPress?.();
        }}
      >
        <Animated.View style={[s.cell, { transform: [{ scale }] }]}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={s.cellTitle} numberOfLines={1}>
              {row.title}
            </Text>
            {row.subtitle ? (
              <Text allowFontScaling={false} style={s.cellSub} numberOfLines={1}>
                {row.subtitle}
              </Text>
            ) : null}
          </View>
          <Text allowFontScaling={false} style={s.chev}>
            ›
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ---------------- Empty State (animated entrance) ---------------- */
function EmptyState({
  comingSoon,
  singular,
  emptyLabel,
}: {
  comingSoon?: boolean;
  singular: string;
  emptyLabel: string;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
    ]).start();
  }, [fade, lift]);

  return (
    <Animated.View style={[s.emptyContainer, { opacity: fade, transform: [{ translateY: lift }] }]}>
      <View style={s.emptyIconWrap}>{comingSoon ? <HourglassIcon /> : <PlusIcon />}</View>
      <Text allowFontScaling={false} style={s.emptyTitle}>
        {comingSoon ? `${singular} yakında geliyor` : `Henüz ${emptyLabel} eklenmedi`}
      </Text>
      <Text allowFontScaling={false} style={s.emptySub}>
        {comingSoon
          ? 'Bu bölüm yapım aşamasında. Diğer kategorileri kullanmaya devam edebilirsin.'
          : 'İlk kaydını ekleyerek başla.'}
      </Text>
    </Animated.View>
  );
}

/* ---------------- Sheet ---------------- */
export function MedicalCategorySheet({
  visible,
  title,
  rows,
  emptyLabel,
  comingSoon,
  onClose,
  onAdd,
  onPressRow,
}: Props) {
  const insets = useSafeAreaInsets();
  const singular = singularize(title);
  const ctaLabel = comingSoon ? 'Yakında' : `${singular} Ekle`;
  const isEmpty = rows.length === 0;

  const bottomPad = Math.max(insets.bottom, 12) + 16;

  return (
    <SheetShell visible={visible} title={title} onClose={onClose} hideSave>
      <View style={[s.body, { backgroundColor: isEmpty ? '#FFFFFF' : SECTION_BG }]}>
        {isEmpty ? (
          <View style={s.emptyFlex}>
            <EmptyState comingSoon={comingSoon} singular={singular} emptyLabel={emptyLabel} />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.listScroll, { paddingBottom: bottomPad + 80 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text allowFontScaling={false} style={s.sectionCaption}>
              {`${rows.length} KAYIT`}
            </Text>
            <View style={s.group}>
              {rows.map((row, idx) => (
                <React.Fragment key={row.id}>
                  <Cell
                    row={row}
                    isFirst={idx === 0}
                    isLast={idx === rows.length - 1}
                    onPress={onPressRow ? () => onPressRow(row.id) : undefined}
                  />
                  {idx < rows.length - 1 ? <View style={s.hairline} /> : null}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Sticky bottom CTA — Apple paterni */}
        <View
          style={[
            s.ctaBar,
            {
              paddingBottom: bottomPad,
              backgroundColor: isEmpty ? '#FFFFFF' : SECTION_BG,
              borderTopColor: isEmpty ? 'transparent' : HAIRLINE,
              borderTopWidth: isEmpty ? 0 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <CTAButton label={ctaLabel} onPress={onAdd} disabled={comingSoon} />
        </View>
      </View>
    </SheetShell>
  );
}

/* ---------------- Styles ---------------- */
const s = StyleSheet.create({
  body: { flex: 1 },

  // Empty state
  emptyFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ICON_TINT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: SUBTEXT,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },

  // CTA bar (sticky)
  ctaBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaWrap: {
    width: '100%',
  },
  cta: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // List
  listScroll: {
    paddingTop: 16,
  },
  sectionCaption: {
    fontSize: 13,
    fontWeight: '400',
    color: SECTION_CAPTION,
    letterSpacing: -0.08,
    marginLeft: 32,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: CELL_BG,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  cellTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.24,
  },
  cellSub: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
  },
  chev: {
    fontSize: 22,
    color: CHEVRON,
    fontWeight: '300',
    marginLeft: 8,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginLeft: 16,
  },
});
