/**
 * İçeceklerim — kullanıcının içecek kütüphanesi.
 * - Liste: ikon + isim + boyut + hidrasyon + toggle (göster/gizle)
 * - Yeni içecek ekle (custom drink)
 * - İçeceği düzenle (catalog: sınırlı, custom: tam)
 * - Sıralamayı değiştir → ayrı sayfa (drag & drop)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useDrinksApi, type UserDrink } from '../../../../components/tracking/water/drinksApi';
import {
  DrinkIcon,
  DRINK_ICON_NAMES,
  type DrinkIconName,
} from '../../../../components/tracking/water/DrinkIcons';
import {
  DrinkEditModal,
  type DrinkFormValues,
} from '../../../../components/tracking/water/DrinkEditModal';
import { DrinkReorderModal } from '../../../../components/tracking/water/DrinkReorderModal';

const ACCENT = '#32ADE6';
const TEXT = '#1C1C1E';
const SUBTLE = '#8E8E93';
const BORDER = '#E5E5EA';
const BG = '#F2F2F7';

const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

// Liste kolonları — başlık ve satırlar bu sabitleri paylaşır
// Yapı: [pad][icon][gap][NAME flex:1][gap][BOYUT][gap][HİDR.%][gap][SWITCH][pad]
// Name flex:1 kalan alanı emer; metric kolonları sabit width + gap ile dengeli durur
const COL_SIZE_W = 64;
const COL_HYDRA_W = 56;
const COL_SWITCH_W = 52;
const COL_GAP = 18;
// İsim ile boyut sütunu arasına nefes payı — name flex:1 olunca kalanı yutmasın
const NAME_TRAIL_GAP = 16;
const ROW_PAD_L = 16;
const ROW_PAD_R = 20;
const ICON_SIZE = 36;
const ICON_GAP = 12;

// Toggle kapalı satır opacity'si — okunurluk için 0.55
const ROW_DIMMED = 0.55;

function pickIconName(name: string, category: string): DrinkIconName {
  if (DRINK_ICON_NAMES.includes(name as DrinkIconName)) return name as DrinkIconName;
  // Catalog'dan gelen iconName Ionicons string'i olabilir; kategori → drink icon fallback
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

// Mount-time entrance — h1, button, hint, chip, header sırayla belirir
function useEntrance(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export default function KaplarRoute() {
  const insets = useSafeAreaInsets();
  const api = useDrinksApi();

  const [drinks, setDrinks] = useState<UserDrink[]>([]);
  const [loading, setLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [editMode, setEditMode] = useState<'new' | 'edit'>('new');
  const [editTarget, setEditTarget] = useState<UserDrink | null>(null);

  const [reorderVisible, setReorderVisible] = useState(false);

  // Görüntülenecek liste — visible drink'ler önce, hidden olanlar (toggle off) en altta.
  // Her grup içinde sortOrder asc, eşitse Türkçe alfabetik.
  const displayDrinks = useMemo(() => {
    const sorted = [...drinks].sort((a, b) => {
      // Visible olan üstte
      if (a.isVisible !== b.isVisible) return a.isVisible ? -1 : 1;
      // SortOrder asc
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      // Türkçe alfabetik
      return a.nametr.localeCompare(b.nametr, 'tr');
    });
    return sorted;
  }, [drinks]);

  // Race condition guard — in-flight toggle mutations + ilk mount kontrolü
  const pendingMutationsRef = useRef<Set<string>>(new Set());
  const firstMountRef = useRef(true);

  // Silinmekte olan drink ID'leri — DrinkRow bu set'e dahilse Apple Mail tarzı
  // collapse + fade animasyonu oynatır, animation bittiğinde parent state'inden çıkar.
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const drinkKey = (d: UserDrink) => `${d.type}-${d.id}`;

  // useDrinksApi her render'da yeni referans dönebiliyor; ref'e alıp callback'leri stabil tut
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  // Mount entrance — staggered 50ms
  const h1Style = useEntrance(0);
  const btnStyle = useEntrance(50);
  const hintStyle = useEntrance(100);
  const chipStyle = useEntrance(150);
  const headerStyle = useEntrance(200);

  // YENİ İÇECEK EKLE — press feedback (scale + opacity)
  const btnScale = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(1)).current;

  const pressInBtn = () => {
    Animated.parallel([
      Animated.timing(btnScale, {
        toValue: 0.98,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(btnOpacity, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };
  const pressOutBtn = () => {
    Animated.parallel([
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };

  // Reorder chip — press feedback
  const chipScale = useRef(new Animated.Value(1)).current;
  const chipOpacity = useRef(new Animated.Value(1)).current;
  const pressInChip = () => {
    Animated.parallel([
      Animated.timing(chipScale, {
        toValue: 0.97,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(chipOpacity, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };
  const pressOutChip = () => {
    Animated.parallel([
      Animated.timing(chipScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(chipOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };

  const load = useCallback(async () => {
    // Pending mutation varken refresh'i atla — server eski değeri dönerse flicker olur
    if (pendingMutationsRef.current.size > 0) return;
    const list = await apiRef.current.listDrinks();
    setDrinks((prev) => {
      const pending = pendingMutationsRef.current;
      if (pending.size === 0) return list;
      const prevById = new Map(prev.map((d) => [d.id, d]));
      return list.map((d) => (pending.has(d.id) && prevById.has(d.id) ? prevById.get(d.id)! : d));
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // İlk mount'ta useEffect zaten yükledi → redundant fire'ı atla
      if (firstMountRef.current) {
        firstMountRef.current = false;
        return;
      }
      // Reorder sayfasından dönüşte tekrar yükle
      load();
    }, [load]),
  );

  const handleDelete = useCallback(async (drink: UserDrink) => {
    // Frontend savunma — backend response gelmeden önce protected drink'i koru
    if (drink.isProtected) {
      Alert.alert(
        'Silinemez',
        'Bu ana içecek silinemez. Listeden gizlemek için yandaki butonu kapatabilirsin.',
      );
      return;
    }
    Alert.alert('Sil', `"${drink.nametr}" içeceğini silmek istediğinden emin misin?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          // Pessimistic — API cevabı gelene kadar UI değişmez.
          // Backend başarılıysa DrinkRow'a animasyon sinyali gider, animation bittikten sonra
          // gerçek state filter olur (Apple Mail tarzı collapse + fade).
          const ok = await apiRef.current.deleteDrink(drink.id, drink.type);
          if (ok) {
            setDeletingKeys((prev) => {
              const next = new Set(prev);
              next.add(drinkKey(drink));
              return next;
            });
          } else {
            Alert.alert(
              'Silinemedi',
              'Bu içecek silinemiyor. Ana içecek olabilir veya bağlantı hatası vardır.',
            );
          }
        },
      },
    ]);
  }, []);

  // DrinkRow animasyonu bittiğinde (collapse + fade), state'ten gerçekten kaldır.
  const handleDeleteAnimationDone = useCallback((drink: UserDrink) => {
    const key = drinkKey(drink);
    setDrinks((prev) => prev.filter((d) => drinkKey(d) !== key));
    setDeletingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleToggleVisibility = useCallback(async (drink: UserDrink, value: boolean) => {
    // In-flight tracking — load() bu satırı server cevabıyla ezmesin
    pendingMutationsRef.current.add(drink.id);
    // Optimistic
    setDrinks((prev) => prev.map((d) => (d.id === drink.id ? { ...d, isVisible: value } : d)));
    try {
      const ok = await apiRef.current.updateDrink(drink.id, drink.type, { isVisible: value });
      if (!ok) {
        // Revert
        setDrinks((prev) => prev.map((d) => (d.id === drink.id ? { ...d, isVisible: !value } : d)));
        Alert.alert('Hata', 'Durum güncellenemedi.');
      }
    } finally {
      pendingMutationsRef.current.delete(drink.id);
    }
  }, []);

  const openNew = () => {
    setEditMode('new');
    setEditTarget(null);
    setEditVisible(true);
  };

  const openEdit = (drink: UserDrink) => {
    setEditMode('edit');
    setEditTarget(drink);
    setEditVisible(true);
  };

  const handleEditSubmit = useCallback(
    async (values: DrinkFormValues, deleteRequested?: boolean) => {
      // apiRef sayesinde callback stabil — re-render'da yeniden oluşmuyor
      if (deleteRequested && editTarget?.type === 'custom') {
        const ok = await apiRef.current.deleteDrink(editTarget.id);
        if (ok) {
          setDrinks((prev) => prev.filter((d) => d.id !== editTarget.id));
          setEditVisible(false);
        } else {
          Alert.alert('Hata', 'Silinemedi.');
        }
        return;
      }

      if (editMode === 'new') {
        const created = await apiRef.current.createDrink({
          nametr: values.nametr,
          category: values.category,
          hydrationValue: values.hydrationValue,
          caffeinePerServing: values.caffeinePerServing,
          defaultServingMl: values.defaultServingMl,
          iconName: values.iconName,
          color: values.color,
        });
        if (created) {
          setDrinks((prev) => [...prev, created]);
          setEditVisible(false);
        } else {
          Alert.alert('Hata', 'İçecek oluşturulamadı.');
        }
      } else if (editTarget) {
        const isCatalog = editTarget.type === 'catalog';
        const payload = isCatalog
          ? {
              customSizeMl: values.defaultServingMl,
            }
          : {
              nametr: values.nametr,
              category: values.category,
              hydrationValue: values.hydrationValue,
              caffeinePerServing: values.caffeinePerServing,
              defaultServingMl: values.defaultServingMl,
              iconName: values.iconName,
              color: values.color,
            };
        const ok = await apiRef.current.updateDrink(editTarget.id, editTarget.type, payload);
        if (ok) {
          setDrinks((prev) =>
            prev.map((d) =>
              d.id === editTarget.id
                ? {
                    ...d,
                    ...(isCatalog
                      ? { defaultServingMl: values.defaultServingMl }
                      : {
                          nametr: values.nametr,
                          category: values.category,
                          hydrationValue: values.hydrationValue,
                          caffeinePerServing: values.caffeinePerServing,
                          defaultServingMl: values.defaultServingMl,
                          iconName: values.iconName,
                          color: values.color,
                        }),
                  }
                : d,
            ),
          );
          setEditVisible(false);
        } else {
          Alert.alert('Hata', 'Güncellenemedi.');
        }
      }
    },
    [editMode, editTarget],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.Text style={[s.h1, h1Style]}>İçeceklerim</Animated.Text>

      <Animated.View
        style={[
          s.bigBtnShadow,
          btnStyle,
          {
            transform: [...btnStyle.transform, { scale: btnScale }],
            opacity: Animated.multiply(btnStyle.opacity, btnOpacity),
          },
        ]}
      >
        <Pressable
          onPress={openNew}
          onPressIn={pressInBtn}
          onPressOut={pressOutBtn}
          style={s.bigBtnInner}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={s.bigBtnText}>YENİ İÇECEK EKLE</Text>
        </Pressable>
      </Animated.View>

      <Animated.Text style={[s.hint, hintStyle]}>
        Ana ekranda görünmesini istediğin içecekleri açık tut. Boyutu değiştirmek için içeceğe
        dokun.
      </Animated.Text>

      {/* Sıralamayı değiştir */}
      <Animated.View style={[s.reorderWrap, chipStyle]}>
        <Animated.View style={{ transform: [{ scale: chipScale }], opacity: chipOpacity }}>
          <Pressable
            onPress={() => setReorderVisible(true)}
            onPressIn={pressInChip}
            onPressOut={pressOutChip}
            style={s.reorderChip}
          >
            <Ionicons name="swap-vertical" size={14} color={ACCENT} />
            <Text style={s.reorderChipText}>SIRALAMAYI DEĞİŞTİR</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Liste başlık satırı — satır yapısıyla birebir aynı kolon hizası */}
      {/* iOS'ta letter-spacing son karaktere de uygulanır → header text sağa yaslandığında ~1ch trail kalır */}
      {/* Header letter-spacing'ini sıfırlıyoruz; tracking görsel etkisi azalsa da sayılarla pixel-perfect hizalı duruyor */}
      <Animated.View style={[s.listHeader, headerStyle]}>
        <View style={{ width: ICON_SIZE + ICON_GAP }} />
        <Text style={[s.listHeaderText, { flex: 1, paddingRight: NAME_TRAIL_GAP }]}>İÇECEK</Text>
        <Text style={[s.listHeaderText, s.headerCol, { width: COL_SIZE_W }]}>BOYUT</Text>
        <Text
          style={[s.listHeaderText, s.headerCol, { width: COL_HYDRA_W, marginLeft: COL_GAP }]}
          numberOfLines={1}
        >
          HİDR.
        </Text>
        <View style={{ width: COL_SWITCH_W, marginLeft: COL_GAP }} />
      </Animated.View>

      {/* Liste — virtualized FlatList ile performans (50+ row için kritik) */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 180 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <SkeletonRow key={idx} delay={idx * 60} isLast={idx === 7} />
            ))}
          </ScrollView>
        ) : displayDrinks.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="water-outline" size={48} color="#C7C7CC" />
            <Text style={s.emptyText}>Henüz içecek yok</Text>
            <Text style={s.emptySub}>"Yeni İçecek Ekle" ile başla.</Text>
          </View>
        ) : (
          <FlatList
            data={displayDrinks}
            keyExtractor={(d) => drinkKey(d)}
            renderItem={({ item, index }) => (
              <DrinkRow
                drink={item}
                onPress={() => openEdit(item)}
                onToggle={(v) => handleToggleVisibility(item, v)}
                onDelete={() => handleDelete(item)}
                pendingDelete={deletingKeys.has(drinkKey(item))}
                onDeleteAnimationDone={() => handleDeleteAnimationDone(item)}
                isLast={index === displayDrinks.length - 1}
                index={index}
              />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 180 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews
          />
        )}
      </View>

      {/* Modal */}
      <DrinkEditModal
        visible={editVisible}
        mode={editMode}
        initial={editTarget}
        onClose={() => setEditVisible(false)}
        onSubmit={handleEditSubmit}
      />

      <DrinkReorderModal
        visible={reorderVisible}
        drinks={drinks}
        onClose={() => setReorderVisible(false)}
        onSave={async (ordered) => {
          const orders = ordered.map((d, idx) => ({
            id: d.id,
            type: d.type,
            sortOrder: idx,
          }));
          const ok = await api.reorderDrinks({ orders });
          if (ok) {
            setDrinks(ordered.map((d, idx) => ({ ...d, sortOrder: idx })));
            setReorderVisible(false);
          } else {
            Alert.alert('Hata', 'Sıralama kaydedilemedi.');
          }
        }}
      />
    </View>
  );
}

// ─── Drink Row ────────────────────────────────────────────────────────────────
function DrinkRow({
  drink,
  onPress,
  onToggle,
  onDelete,
  pendingDelete,
  onDeleteAnimationDone,
  isLast,
  index,
}: {
  drink: UserDrink;
  onPress: () => void;
  onToggle: (value: boolean) => void;
  onDelete: () => void;
  pendingDelete: boolean;
  onDeleteAnimationDone: () => void;
  isLast?: boolean;
  index: number;
}) {
  const fade = useRef(new Animated.Value(drink.isVisible ? 1 : ROW_DIMMED)).current;

  // Mount entrance — 40ms stagger, 6px translate-up
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterTranslate = useRef(new Animated.Value(6)).current;

  // Press feedback
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressOpacity = useRef(new Animated.Value(1)).current;

  // Apple Mail tarzı silme animasyonu — height collapse (JS driver) + opacity fade (JS).
  // pendingDelete true olunca: scale + opacity sönümlenir, satır height: 0'a iner.
  // Animation bittikten sonra parent state'ten gerçekten silinir.
  const deleteScale = useRef(new Animated.Value(1)).current;
  const deleteOpacity = useRef(new Animated.Value(1)).current;
  const deleteHeight = useRef(new Animated.Value(1)).current; // 1 = doğal yükseklik, 0 = collapsed

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 340,
        delay: index * 40,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(enterTranslate, {
        toValue: 0,
        duration: 340,
        delay: index * 40,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: drink.isVisible ? 1 : ROW_DIMMED,
      duration: 220,
      useNativeDriver: true,
      easing: EASE_SMOOTH,
    }).start();
  }, [drink.isVisible]);

  // Silme animasyonu — pendingDelete sinyali gelince Apple Mail tarzı:
  //   1) İçerik scale 0.96'ya iner + opacity 0'a (240ms, MICRO).
  //   2) Satır height (maxHeight interp) 0'a iner (200ms, IN_CLOSE).
  //   3) Bittiğinde parent'a sinyal → state filter → DOM'dan çıkar.
  // Native driver scale+opacity için (smooth), JS driver maxHeight için (zorunlu).
  useEffect(() => {
    if (!pendingDelete) return;
    Animated.parallel([
      Animated.timing(deleteScale, {
        toValue: 0.96,
        duration: 200,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(deleteHeight, {
        toValue: 0,
        duration: 320,
        delay: 60, // İçerik fade'i biraz başlasın, sonra height collapse
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(({ finished }) => {
      if (finished) onDeleteAnimationDone();
    });
  }, [pendingDelete]);

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 0.98,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(pressOpacity, {
        toValue: 0.92,
        duration: 120,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
      Animated.timing(pressOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: EASE_MICRO,
      }),
    ]).start();
  };

  const iconName = pickIconName(drink.iconName, drink.category);
  const swipeRef = useRef<React.ElementRef<typeof Swipeable>>(null);

  // Sağa kaydırınca açılan kırmızı sil butonu
  const renderRightActions = () => (
    <Pressable
      style={s.deleteAction}
      onPress={() => {
        swipeRef.current?.close();
        onDelete();
      }}
    >
      <Ionicons name="trash" size={22} color="#fff" />
      <Text style={s.deleteActionText}>Sil</Text>
    </Pressable>
  );

  const rowContent = (
    <Animated.View
      style={[
        s.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
        { opacity: enterOpacity, transform: [{ translateY: enterTranslate }] },
      ]}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: pressScale }], opacity: pressOpacity }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={s.rowMain}
        >
          <Animated.View
            style={{ opacity: fade, flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <View style={[s.iconBox, { backgroundColor: `${drink.color}1A` }]}>
              <DrinkIcon name={iconName} size={22} color={drink.color} />
            </View>

            <View
              style={{ flex: 1, marginLeft: ICON_GAP, paddingRight: NAME_TRAIL_GAP, minWidth: 0 }}
            >
              <Text style={s.name} numberOfLines={1}>
                {drink.nametr}
              </Text>
              {drink.caffeinePerServing && drink.caffeinePerServing > 0 ? (
                <Text style={s.caffeine} numberOfLines={1}>
                  {drink.caffeinePerServing}mg kafein
                </Text>
              ) : null}
            </View>

            <Text
              style={[s.metricSize, { width: COL_SIZE_W, textAlign: 'right' }]}
              numberOfLines={1}
            >
              {drink.defaultServingMl}ml
            </Text>
            <Text
              style={[s.metric, { width: COL_HYDRA_W, textAlign: 'right', marginLeft: COL_GAP }]}
              numberOfLines={1}
            >
              {Math.round(drink.hydrationValue * 100)}%
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={{ width: COL_SWITCH_W, alignItems: 'flex-end', marginLeft: COL_GAP }}>
        <Switch
          value={drink.isVisible}
          onValueChange={onToggle}
          trackColor={{ false: '#E5E5EA', true: ACCENT }}
          thumbColor="#fff"
          ios_backgroundColor="#E5E5EA"
        />
      </View>
    </Animated.View>
  );

  // Apple Mail tarzı silme animasyonu — outer wrapper:
  //   maxHeight interpolate (200 → 0) + scale + opacity.
  // Protected drink ise swipe disable; ama silinemez sayılır, animasyon yok.
  const outerStyle = {
    maxHeight: deleteHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
    opacity: deleteOpacity,
    transform: [{ scale: deleteScale }],
    overflow: 'hidden' as const,
  };

  if (drink.isProtected) {
    return <Animated.View style={outerStyle}>{rowContent}</Animated.View>;
  }

  return (
    <Animated.View style={outerStyle}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        friction={2}
        overshootRight={false}
      >
        {rowContent}
      </Swipeable>
    </Animated.View>
  );
}

// ─── Skeleton Row (yüklenirken iskelet) ────────────────────────────────────────
function SkeletonRow({ delay, isLast }: { delay: number; isLast?: boolean }) {
  const fade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 340,
      delay,
      useNativeDriver: true,
      easing: EASE_OUT_SPRING,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
          easing: EASE_SMOOTH,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
          easing: EASE_SMOOTH,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  return (
    <Animated.View
      style={[
        s.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
        { opacity: fade },
      ]}
    >
      <View style={s.rowMain}>
        <Animated.View style={[s.skelIcon, { opacity: shimmerOpacity }]} />
        <View
          style={{
            flex: 1,
            marginLeft: ICON_GAP,
            paddingRight: NAME_TRAIL_GAP,
            gap: 6,
            minWidth: 0,
          }}
        >
          <Animated.View style={[s.skelBar, { width: '70%', opacity: shimmerOpacity }]} />
          <Animated.View
            style={[s.skelBar, { width: '40%', height: 9, opacity: shimmerOpacity }]}
          />
        </View>
        <Animated.View
          style={[
            s.skelMetric,
            { width: COL_SIZE_W - 12, alignSelf: 'center', opacity: shimmerOpacity },
          ]}
        />
        <Animated.View
          style={[
            s.skelMetric,
            {
              width: COL_HYDRA_W - 8,
              marginLeft: COL_GAP,
              alignSelf: 'center',
              opacity: shimmerOpacity,
            },
          ]}
        />
      </View>
      <View style={{ width: COL_SWITCH_W, alignItems: 'flex-end', marginLeft: COL_GAP }}>
        <Animated.View style={[s.skelSwitch, { opacity: shimmerOpacity }]} />
      </View>
    </Animated.View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: -0.5,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  bigBtnShadow: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: 'transparent',
  },
  bigBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    paddingVertical: 13,
    borderRadius: 18,
    overflow: 'hidden',
  },
  bigBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 13,
    color: SUBTLE,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    paddingHorizontal: 28,
  },
  reorderWrap: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  reorderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: 'rgba(50,173,230,0.12)',
  },
  reorderChipText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: ROW_PAD_L,
    paddingRight: ROW_PAD_R,
    paddingVertical: 12,
    marginTop: 8,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTLE,
    letterSpacing: 0.7,
  },
  // iOS letter-spacing son karaktere de trail ekler → sayılara göre sola kayar görünür
  // Sayı kolonlarının başlığı için tracking'i azaltıp sağa yasladığımızda satırla aynı kenara oturur
  headerCol: {
    textAlign: 'right',
    letterSpacing: 0.4,
    paddingRight: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: ROW_PAD_L,
    paddingRight: ROW_PAD_R,
    backgroundColor: 'transparent',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.1,
  },
  caffeine: {
    fontSize: 11,
    fontWeight: '500',
    color: SUBTLE,
    marginTop: 1,
  },
  metric: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTLE,
  },
  metricSize: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: -0.1,
  },
  // Swipe-to-delete sağ aksiyon — Apple Mail tarzı kırmızı arka plan + ikon + label
  deleteAction: {
    width: 90,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: SUBTLE,
  },
  // Skeleton
  skelIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 11,
    backgroundColor: '#E5E5EA',
  },
  skelBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
  },
  skelMetric: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
  },
  skelSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E5EA',
  },
});
