/**
 * DrinkReorderModal — içecek sıralamasını sürükle-bırakla değiştiren bottom sheet.
 * Apple-tarzı: kullanıcı satıra uzun basıp sürükler, satır kaldırılır gibi yükselir,
 * diğer satırlar yer açar. Bırakınca yeni pozisyona snap eder.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { DrinkIcon, DRINK_ICON_NAMES, type DrinkIconName } from './DrinkIcons';
import type { UserDrink } from './drinksApi';

const { height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#32ADE6';
const TEXT = '#1C1C1E';
const SUBTLE = '#8E8E93';
const BORDER = '#E5E5EA';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);

function pickIconName(name: string, category: string): DrinkIconName {
  if (DRINK_ICON_NAMES.includes(name as DrinkIconName)) return name as DrinkIconName;
  const fallback: Record<string, DrinkIconName> = {
    water: 'bottle',
    tea: 'cup',
    coffee: 'mug',
    herbal: 'cup',
    juice: 'glass',
    sports: 'bottle',
    dairy: 'glass',
    smoothie: 'smoothie',
    soda: 'canister',
    alcohol: 'wineGlass',
  };
  return fallback[category] ?? 'glass';
}

interface DrinkReorderModalProps {
  visible: boolean;
  drinks: UserDrink[];
  onClose: () => void;
  onSave: (ordered: UserDrink[]) => Promise<void>;
}

export function DrinkReorderModal({
  visible,
  drinks: initialDrinks,
  onClose,
  onSave,
}: DrinkReorderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<UserDrink[]>([]);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setList(initialDrinks);
      setSaving(false);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: EASE_OUT_SPRING,
          }),
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: EASE_OUT_SPRING,
          }),
        ]).start(),
      );
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: EASE_IN_CLOSE,
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: EASE_IN_CLOSE,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(list);
    setSaving(false);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<UserDrink>) => {
    const iconName = pickIconName(item.iconName, item.category);
    return (
      <ScaleDecorator activeScale={1.04}>
        <Pressable onLongPress={drag} delayLongPress={120} style={[s.row, isActive && s.rowActive]}>
          <View style={[s.iconBox, { backgroundColor: `${item.color}1A` }]}>
            <DrinkIcon name={iconName} size={22} color={item.color} />
          </View>
          <Text style={s.name} numberOfLines={1}>
            {item.nametr}
          </Text>
          <View style={s.handle}>
            <Ionicons name="reorder-three" size={26} color="#C7C7CC" />
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  if (!mounted) return null;

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={s.handleBar} />
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.headerCancel}>İptal</Text>
          </Pressable>
          <Text style={s.headerTitle}>Sıralama</Text>
          <Pressable onPress={handleSave} disabled={saving} hitSlop={12}>
            <Text style={[s.headerDone, saving && { opacity: 0.5 }]}>Bitti</Text>
          </Pressable>
        </View>

        <Text style={s.hint}>Sürükleyerek sırayı değiştir.</Text>

        <DraggableFlatList
          data={list}
          onDragEnd={({ data }) => setList(data)}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          activationDistance={8}
        />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_H * 0.92,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handleBar: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: SUBTLE,
  },
  headerDone: {
    fontSize: 15,
    fontWeight: '700',
    color: ACCENT,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
  },
  hint: {
    fontSize: 13,
    color: SUBTLE,
    textAlign: 'center',
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    gap: 12,
  },
  rowActive: {
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderBottomColor: 'transparent',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.1,
  },
  handle: {
    width: 32,
    alignItems: 'flex-end',
  },
});
