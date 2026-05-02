import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { MenuView } from '@react-native-menu/menu';

import { N, font } from '../theme';
import {
  searchFoods,
  createMeal,
  listFavorites,
  listMealTemplates,
  deleteMealTemplate,
  type SearchTab,
  type MealTemplate,
} from '../api/client';
import type { MealType, MealItem, CustomFood, FatSecretFood } from '../api/types';
import { FoodDetailSheet, type FoodDetailRow } from '../sheets/FoodDetailSheet';
import { MealTemplateSheet } from '../sheets/MealTemplateSheet';
import { CreateMealTemplateSheet } from '../sheets/CreateMealTemplateSheet';

type Props = {
  mealType: MealType;
  onClose: () => void;
  onAdded: () => void;
  onOpenAiCamera: () => void;
  onOpenBarcode: () => void;
};

type Row = {
  key: string;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'fatsecret' | 'custom' | 'cached' | 'recent' | 'off' | 'usda';
  brandLogo?: string;
  raw: any;
};

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırma',
};

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: '☕',
  lunch: '🍝',
  dinner: '🥘',
  snack: '🍎',
};

const SOURCE_LABEL: Record<string, string> = {
  custom: 'Senin',
  recent: 'Son',
  off: 'Markalı',
  usda: 'USDA',
  fatsecret: 'Doğrulanmış',
  cached: 'Veritabanı',
};

const TAB_LABELS: Record<SearchTab, string> = {
  frequent: 'Sık',
  recent: 'Son',
  favorites: 'Favori',
  all: 'Tümü',
};

type FoodKind = 'foods' | 'meals';

const KIND_LABELS: Record<FoodKind, string> = {
  foods: 'Yiyecekler',
  meals: 'Öğünler',
};

const SORT_LABELS: Record<Exclude<SearchTab, 'all'>, string> = {
  frequent: 'Sık tüketilen',
  recent: 'Yakın zamanda',
  favorites: 'Favoriler',
};

export default function SearchScreen({
  mealType,
  onClose,
  onAdded,
  onOpenAiCamera,
  onOpenBarcode,
}: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [q, setQ] = useState('');
  const [tab, setTab] = useState<SearchTab>('frequent');
  const [kind, setKind] = useState<FoodKind>('foods');
  const [rows, setRows] = useState<Row[]>([]);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<MealItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [detailRow, setDetailRow] = useState<FoodDetailRow | null>(null);
  const [templateDetail, setTemplateDetail] = useState<MealTemplate | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [favoritedKeys, setFavoritedKeys] = useState<Set<string>>(new Set());
  const [showSuggestedHeader, setShowSuggestedHeader] = useState(false);
  const reqIdRef = useRef(0);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async (query: string, currentTab: SearchTab) => {
    const reqId = ++reqIdRef.current;
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = await getTokenRef.current();
      if (!token) {
        setErrorMsg('Oturum bulunamadı');
        setRows([]);
        return;
      }
      const data = await searchFoods(token, query, currentTab);
      if (reqId !== reqIdRef.current) return;

      const out: Row[] = [];

      if (currentTab === 'frequent') {
        const r = data.results as any;
        for (const f of (r?.foods ?? []) as CustomFood[]) {
          out.push({
            key: `c-${f.id}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'custom',
            raw: f,
          });
        }
        // Sık kullanılan boşsa → tek istekte popüler yemekler (all tab, sabit sorgu)
        if (out.length === 0) {
          setShowSuggestedHeader(true);
          const POPULAR_QUERY = 'yumurta tavuk ekmek pirinç yoğurt elma muz peynir salata makarna';
          const defaultData = await searchFoods(token, POPULAR_QUERY, 'all').catch(() => null);
          if (defaultData && reqId === reqIdRef.current) {
            const dr = defaultData.results as any;
            const allFoods: Row[] = [];
            for (const f of (dr?.custom ?? []) as CustomFood[])
              allFoods.push({
                key: `c-${f.id}`,
                name: f.name,
                brand: f.brand ?? undefined,
                servingLabel: `${f.servingSize} ${f.servingUnit}`,
                calories: f.calories,
                proteinG: f.proteinG,
                carbsG: f.carbsG,
                fatG: f.fatG,
                source: 'custom',
                raw: f,
              });
            for (const f of (dr?.fatsecret ?? []) as FatSecretFood[])
              allFoods.push({
                key: `fs-${f.fatSecretId}`,
                name: f.name,
                servingLabel: `${f.servingSize} ${f.servingUnit}`,
                calories: f.calories,
                proteinG: f.proteinG,
                carbsG: f.carbsG,
                fatG: f.fatG,
                source: 'fatsecret',
                raw: f,
              });
            for (const f of (dr?.openfoodfacts ?? []) as any[])
              allFoods.push({
                key: `off-${f.offCode}`,
                name: f.name,
                brand: f.brand ?? undefined,
                servingLabel: `${f.servingSize} ${f.servingUnit}`,
                calories: f.calories,
                proteinG: f.proteinG,
                carbsG: f.carbsG,
                fatG: f.fatG,
                source: 'off',
                raw: f,
              });
            for (const f of (dr?.usda ?? []) as any[])
              allFoods.push({
                key: `usda-${f.fdcId}`,
                name: f.name,
                brand: f.brand ?? undefined,
                servingLabel: `${f.servingSize} ${f.servingUnit}`,
                calories: f.calories,
                proteinG: f.proteinG,
                carbsG: f.carbsG,
                fatG: f.fatG,
                source: 'usda',
                raw: f,
              });
            out.push(...allFoods.slice(0, 20));
          }
        } else {
          setShowSuggestedHeader(false);
        }
      } else if (currentTab === 'recent') {
        for (const item of (data.results as any[]) ?? []) {
          out.push({
            key: `r-${item.name}-${item.lastLoggedAt}`,
            name: item.name,
            brand: item.brand,
            servingLabel: `${item.servingSize ?? 100} ${item.servingUnit ?? 'g'}`,
            calories: item.calories ?? 0,
            proteinG: item.proteinG ?? 0,
            carbsG: item.carbsG ?? 0,
            fatG: item.fatG ?? 0,
            source: 'recent',
            raw: item,
          });
        }
      } else if (currentTab === 'all') {
        const r = data.results as any;
        for (const f of (r?.custom ?? []) as CustomFood[])
          out.push({
            key: `c-${f.id}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'custom',
            raw: f,
          });
        for (const f of (r?.fatsecret ?? []) as FatSecretFood[])
          out.push({
            key: `fs-${f.fatSecretId}`,
            name: f.name,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'fatsecret',
            raw: f,
          });
        for (const f of (r?.cached ?? []) as any[])
          out.push({
            key: `ch-${f.id}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'cached',
            raw: f,
          });
        for (const f of (r?.openfoodfacts ?? []) as any[])
          out.push({
            key: `off-${f.offCode}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'off',
            brandLogo: f.photoUrl,
            raw: f,
          });
        for (const f of (r?.usda ?? []) as any[])
          out.push({
            key: `usda-${f.fdcId}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingLabel: `${f.servingSize} ${f.servingUnit}`,
            calories: f.calories,
            proteinG: f.proteinG,
            carbsG: f.carbsG,
            fatG: f.fatG,
            source: 'usda',
            raw: f,
          });
      }

      setRows(out);
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      const msg =
        err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
          ? 'Bağlantı yavaş, tekrar dene'
          : (err?.message ?? 'Yükleme başarısız');
      setErrorMsg(msg);
      setRows([]);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  // Foods listesini yükle (kind='foods' iken)
  useEffect(() => {
    if (kind !== 'foods') return;
    if (q.length === 0) load('', tab);
  }, [tab, q, load, kind]);

  useEffect(() => {
    if (kind !== 'foods') return;
    if (q.length < 2) return;
    const t = setTimeout(() => load(q, 'all'), 300);
    return () => clearTimeout(t);
  }, [q, load, kind]);

  // Templates yükle (kind='meals' iken)
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getTokenRef.current();
      if (!token) return;
      const data = await listMealTemplates(token);
      let list = data.templates ?? [];
      if (tab === 'frequent')
        list = [...list].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
      else if (tab === 'recent') {
        list = [...list].sort((a, b) => {
          const at = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const bt = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          return bt - at;
        });
      }
      // basit q filtresi
      const ql = q.trim().toLowerCase();
      if (ql) list = list.filter((t) => t.name.toLowerCase().includes(ql));
      setTemplates(list);
    } catch (e) {
      console.warn('[load templates]', e);
    } finally {
      setLoading(false);
    }
  }, [tab, q]);

  useEffect(() => {
    if (kind === 'meals') loadTemplates();
  }, [kind, loadTemplates]);

  // Bir Row'u FoodDetailRow'a dönüştür
  const toFoodDetail = (r: Row): FoodDetailRow => {
    const raw = r.raw ?? {};
    let source: FoodDetailRow['source'] = 'food';
    let sourceId = String(r.key);
    if (r.source === 'off') {
      source = 'off';
      sourceId = String(raw.offCode ?? r.key);
    } else if (r.source === 'usda') {
      source = 'usda';
      sourceId = String(raw.fdcId ?? r.key);
    } else if (r.source === 'fatsecret') {
      source = 'fatsecret';
      sourceId = String(raw.fatSecretId ?? r.key);
    } else if (r.source === 'custom') {
      source = 'custom';
      sourceId = String(raw.id ?? r.key);
    } else if (r.source === 'cached') {
      source = 'food';
      sourceId = String(raw.id ?? r.key);
    }
    return {
      source,
      sourceId,
      name: r.name,
      brand: r.brand,
      photoUrl: raw.photoUrl,
      servingSize: Number(raw.servingSize ?? 100),
      servingUnit: String(raw.servingUnit ?? 'g'),
      calories: r.calories,
      proteinG: r.proteinG,
      carbsG: r.carbsG,
      fatG: r.fatG,
      fiberG: raw.fiberG,
      sugarG: raw.sugarG,
      saturatedFatG: raw.saturatedFatG,
      transFatG: raw.transFatG,
      cholesterolMg: raw.cholesterolMg,
      sodiumMg: raw.sodiumMg,
      isFavorite: favoritedKeys.has(`${source}:${sourceId}`),
    };
  };

  const onRowPress = (row: Row) => {
    Haptics.selectionAsync();
    setDetailRow(toFoodDetail(row));
  };

  // + butonuna basılınca kartı açmadan direkt ekle (varsayılan 1 porsiyon)
  const onQuickAddRow = (row: Row) => {
    const raw = row.raw ?? {};
    const detail = toFoodDetail(row);
    const item: MealItem = {
      foodId: detail.source === 'food' ? detail.sourceId : detail.foodItemId,
      customFoodId: detail.source === 'custom' ? detail.sourceId : detail.customFoodId,
      offCode: detail.source === 'off' ? detail.sourceId : undefined,
      usdaFdcId: detail.source === 'usda' ? detail.sourceId : undefined,
      fatSecretFoodId: detail.source === 'fatsecret' ? detail.sourceId : undefined,
      name: row.name,
      brand: row.brand,
      photoUrl: raw.photoUrl,
      servingSize: Number(raw.servingSize ?? 100),
      servingUnit: String(raw.servingUnit ?? 'g'),
      quantity: 1,
      calories: row.calories,
      proteinG: row.proteinG,
      carbsG: row.carbsG,
      fatG: row.fatG,
      fiberG: raw.fiberG,
      sugarG: raw.sugarG,
      saturatedFatG: raw.saturatedFatG,
      transFatG: raw.transFatG,
      cholesterolMg: raw.cholesterolMg,
      sodiumMg: raw.sodiumMg,
      source:
        row.source === 'fatsecret'
          ? 'fatsecret'
          : row.source === 'custom'
            ? 'custom'
            : row.source === 'off'
              ? 'barcode'
              : 'fatsecret',
    };
    setSelected((curr) => [...curr, item]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onSheetAdd = (item: MealItem) => {
    setSelected((curr) => [...curr, item]);
    setDetailRow(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const refreshFavorites = useCallback(async () => {
    try {
      const token = await getTokenRef.current();
      if (!token) return;
      const { favorites } = await listFavorites(token);
      const keys = new Set<string>();
      for (const f of favorites) {
        if (f.offCode) keys.add(`off:${f.offCode}`);
        if (f.usdaFdcId) keys.add(`usda:${f.usdaFdcId}`);
        if (f.fatSecretFoodId) keys.add(`fatsecret:${f.fatSecretFoodId}`);
        if (f.customFoodId) keys.add(`custom:${f.customFoodId}`);
        if (f.foodId) keys.add(`food:${f.foodId}`);
      }
      setFavoritedKeys(keys);
    } catch {}
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const submit = async () => {
    if (selected.length === 0) return;
    try {
      setSubmitting(true);
      const token = await getTokenRef.current();
      if (!token) {
        console.warn('[submit] token yok');
        return;
      }
      await createMeal(token, { mealType, items: selected, source: 'manual' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded();
    } catch (err: any) {
      console.warn('[search submit]', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.response?.data?.error ?? err?.message ?? 'Bilinmeyen hata';
      Alert.alert('Eklenemedi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderEmpty = () => {
    if (loading)
      return (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={N.accent.primary} size="large" />
          <Text style={styles.emptyText}>Yükleniyor…</Text>
        </View>
      );
    if (errorMsg)
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={28} color={N.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>Bağlantı hatası</Text>
          <Text style={styles.emptyText}>{errorMsg}</Text>
          <Pressable onPress={() => load(q, q.length === 0 ? tab : 'all')} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      );
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Ionicons
            name={q ? 'search-outline' : 'restaurant-outline'}
            size={28}
            color={N.text.tertiary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {q
            ? 'Sonuç bulunamadı'
            : tab === 'favorites'
              ? 'Favori yok'
              : tab === 'recent'
                ? 'Geçmiş yok'
                : 'Henüz yok'}
        </Text>
        <Text style={styles.emptyText}>{q ? `"${q}" için eşleşme yok` : 'Aramaya başla'}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* iOS nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.navSide}>
          <Text style={styles.cancelText}>İptal</Text>
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.navEmoji}>{MEAL_EMOJI[mealType]}</Text>
          <Text style={styles.navTitle}>{MEAL_LABEL[mealType]}</Text>
        </View>
        <View
          style={[
            styles.navSide,
            { alignItems: 'flex-end', flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
          ]}
        >
          {selected.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCreateSheetOpen(true);
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.saveTemplateBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="bookmark-outline" size={18} color={N.text.primary} />
            </Pressable>
          )}
          {selected.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selected.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={N.text.tertiary} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={q}
          onChangeText={setQ}
          placeholder="Yemek ara…"
          placeholderTextColor={N.text.tertiary}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <Pressable
          hitSlop={16}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenAiCamera();
          }}
          style={styles.searchActionBtn}
        >
          <Ionicons name="camera-outline" size={20} color={N.ai.fg} />
        </Pressable>
        <View style={styles.searchSep} />
        <Pressable
          hitSlop={16}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenBarcode();
          }}
          style={styles.searchActionBtn}
        >
          <Ionicons name="barcode-outline" size={20} color={N.text.secondary} />
        </Pressable>
      </View>

      {/* Native iOS UIMenu pull-down menüleri */}
      {q.length === 0 && (
        <View style={styles.dropdownRow}>
          <MenuView
            style={[styles.dropdown, { flex: 1 }]}
            onPressAction={({ nativeEvent }) => {
              Haptics.selectionAsync();
              setKind(nativeEvent.event === 'foods' ? 'foods' : 'meals');
            }}
            actions={[
              { id: 'foods', title: 'Yiyecekler', state: kind === 'foods' ? 'on' : 'off' },
              { id: 'meals', title: 'Öğünler', state: kind === 'meals' ? 'on' : 'off' },
            ]}
            shouldOpenOnLongPress={false}
          >
            <Text style={styles.dropdownText}>{KIND_LABELS[kind]}</Text>
            <Ionicons name="chevron-down" size={14} color={N.text.secondary} />
          </MenuView>

          <MenuView
            style={[styles.dropdown, { flex: 1 }]}
            onPressAction={({ nativeEvent }) => {
              Haptics.selectionAsync();
              setTab(nativeEvent.event as Exclude<SearchTab, 'all'>);
            }}
            actions={[
              { id: 'frequent', title: 'Sık tüketilen', state: tab === 'frequent' ? 'on' : 'off' },
              { id: 'recent', title: 'Yakın zamanda', state: tab === 'recent' ? 'on' : 'off' },
              { id: 'favorites', title: 'Favoriler', state: tab === 'favorites' ? 'on' : 'off' },
            ]}
            shouldOpenOnLongPress={false}
          >
            <Text style={styles.dropdownText}>
              {SORT_LABELS[tab as Exclude<SearchTab, 'all'>] ?? SORT_LABELS.frequent}
            </Text>
            <Ionicons name="chevron-down" size={14} color={N.text.secondary} />
          </MenuView>
        </View>
      )}

      {/* List — kind === 'foods' ise yemekler, 'meals' ise şablonlar */}
      <FlatList
        data={kind === 'foods' ? rows : (templates as any[])}
        keyExtractor={(item: any) => item.key ?? item.id}
        renderItem={({ item, index }) => {
          if (kind === 'meals') {
            const tpl = item as MealTemplate;
            const isLast = index === templates.length - 1;
            return (
              <TemplateRow
                template={tpl}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTemplateDetail(tpl);
                }}
                isFirst={index === 0}
                isLast={isLast}
              />
            );
          }
          const r = item as Row;
          const detail = toFoodDetail(r);
          const addedCount = selected.filter(
            (s) =>
              (detail.source === 'off' && s.offCode === detail.sourceId) ||
              (detail.source === 'usda' && s.usdaFdcId === detail.sourceId) ||
              (detail.source === 'fatsecret' && s.fatSecretFoodId === detail.sourceId) ||
              (detail.source === 'custom' && s.customFoodId === detail.sourceId) ||
              (detail.source === 'food' && s.foodId === detail.sourceId),
          ).length;
          return (
            <FoodRow
              row={r}
              addedCount={addedCount}
              onPress={() => onRowPress(r)}
              onQuickAdd={() => onQuickAddRow(r)}
              isFirst={index === 0}
              isLast={index === rows.length - 1}
            />
          );
        }}
        ListHeaderComponent={
          rows.length > 0 && q.length === 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                {showSuggestedHeader && tab === 'frequent'
                  ? 'Önerilen yemekler'
                  : tab === 'recent'
                    ? 'Son yediklerim'
                    : tab === 'favorites'
                      ? 'Favorilerim'
                      : 'Sık kullanılanlar'}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <CtaButton
        visible={selected.length > 0}
        count={selected.length}
        submitting={submitting}
        onPress={submit}
        bottomInset={insets.bottom}
      />

      <FoodDetailSheet
        visible={!!detailRow}
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onAdd={onSheetAdd}
        onFavoriteChanged={refreshFavorites}
      />

      <MealTemplateSheet
        visible={!!templateDetail}
        template={templateDetail}
        onClose={() => setTemplateDetail(null)}
        onAddAll={(items) => {
          setSelected((curr) => [...curr, ...items]);
          setTemplateDetail(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onDelete={async (id) => {
          try {
            const token = await getTokenRef.current();
            if (!token) return;
            await deleteMealTemplate(token, id);
            setTemplateDetail(null);
            loadTemplates();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        }}
      />

      <CreateMealTemplateSheet
        visible={createSheetOpen}
        defaultMealType={mealType}
        items={selected}
        onClose={() => setCreateSheetOpen(false)}
        onSaved={() => {
          setCreateSheetOpen(false);
          if (kind === 'meals') loadTemplates();
        }}
      />
    </View>
  );
}

function FoodRow({
  row,
  addedCount,
  onPress,
  onQuickAdd,
  isFirst,
  isLast,
}: {
  row: Row;
  addedCount: number;
  onPress: () => void;
  onQuickAdd: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(addedCount > 0 ? 1 : 0)).current;
  const selected = addedCount > 0;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: addedCount > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 15,
    }).start();
  }, [addedCount, checkAnim]);

  const onPressIn = () =>
    Animated.timing(scaleAnim, {
      toValue: 0.985,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  const onPressOut = () =>
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();

  const sourceLabel = SOURCE_LABEL[row.source] ?? row.source;

  const radiusStyle = {
    borderTopLeftRadius: isFirst ? 16 : 0,
    borderTopRightRadius: isFirst ? 16 : 0,
    borderBottomLeftRadius: isLast ? 16 : 0,
    borderBottomRightRadius: isLast ? 16 : 0,
  };

  return (
    <Animated.View style={[styles.rowOuter, radiusStyle, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.rowInner}>
        {/* Sol: detay sheet açan tıklama alanı */}
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rowName} numberOfLines={1}>
              {row.name}
            </Text>
            <Text style={styles.rowMeta} numberOfLines={1}>
              {row.brand ? `${row.brand} · ` : ''}
              {row.servingLabel}
              {' · '}
              <Text style={styles.rowSource}>{sourceLabel}</Text>
            </Text>
          </View>

          <View style={styles.rowRight}>
            <Text style={styles.rowKcal}>{Math.round(row.calories)}</Text>
            <Text style={styles.rowKcalUnit}>kcal</Text>
          </View>
        </Pressable>

        {/* Sağ: + butonu — kart açmadan direkt ekler */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onQuickAdd();
          }}
          hitSlop={10}
          style={({ pressed }) => [{ marginLeft: 10 }, pressed && { opacity: 0.6 }]}
        >
          <Animated.View
            style={[
              styles.addCircle,
              selected && styles.addCircleOn,
              {
                transform: [
                  {
                    scale: checkAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0.85, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {addedCount > 0 ? (
              <Text style={{ fontSize: 13, fontFamily: font.bold, color: '#FFF' }}>
                +{addedCount}
              </Text>
            ) : (
              <Ionicons name="add" size={17} color={N.text.primary} />
            )}
          </Animated.View>
        </Pressable>
      </View>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
}

function TemplateRow({
  template,
  onPress,
  isFirst,
  isLast,
}: {
  template: MealTemplate;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(scaleAnim, {
      toValue: 0.985,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  const onPressOut = () =>
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();

  const radiusStyle = {
    borderTopLeftRadius: isFirst ? 16 : 0,
    borderTopRightRadius: isFirst ? 16 : 0,
    borderBottomLeftRadius: isLast ? 16 : 0,
    borderBottomRightRadius: isLast ? 16 : 0,
  };

  const itemCount = (template.items ?? []).length;

  return (
    <Animated.View style={[styles.rowOuter, radiusStyle, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.rowInner}>
        <View style={styles.templateIcon}>
          <Ionicons name="restaurant-outline" size={18} color={N.accent.primaryDim} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowName} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {itemCount} öğe · {Math.round(template.totalCalories)} kcal
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={N.text.tertiary} />
      </View>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
}

function CtaButton({
  visible,
  count,
  submitting,
  onPress,
  bottomInset,
}: {
  visible: boolean;
  count: number;
  submitting: boolean;
  onPress: () => void;
  bottomInset: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, anim]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.ctaOuter,
        { paddingBottom: bottomInset - 14, opacity: anim, transform: [{ translateY }] },
      ]}
    >
      {/* outer View: görsel (bg, radius, shadow) */}
      <View style={styles.ctaBtn}>
        {/* Pressable: sadece touch — absoluteFill */}
        <Pressable onPress={onPress} disabled={submitting} style={StyleSheet.absoluteFillObject} />
        {/* İçerik: pointerEvents none */}
        <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={styles.ctaCountWrap}>
            <View style={styles.ctaCount}>
              <Text style={styles.ctaCountText}>{count}</Text>
            </View>
          </View>
          <Text style={styles.ctaLabel}>{submitting ? 'Ekleniyor…' : 'Yemeği Ekle'}</Text>
          <View style={styles.ctaArrow}>
            <Ionicons
              name={submitting ? 'ellipsis-horizontal' : 'arrow-forward'}
              size={16}
              color="rgba(255,255,255,0.65)"
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg.page },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    minHeight: 44,
  },
  navSide: { width: 64 },
  navCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navEmoji: { fontSize: 18 },
  navTitle: { fontSize: 17, color: N.text.primary, fontFamily: font.bold, letterSpacing: -0.3 },
  cancelText: { fontSize: 16, color: N.accent.primary, fontFamily: font.medium },
  countBadge: {
    backgroundColor: N.text.primary,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { fontSize: 12, fontFamily: font.bold, color: '#FFF' },

  // Search
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    height: 48,
    borderRadius: 14,
    backgroundColor: N.bg.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    ...N.shadow.card,
  },
  searchInput: { flex: 1, fontSize: 16, color: N.text.primary, fontFamily: font.regular },
  searchActionBtn: { padding: 4 },
  searchSep: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: N.border.strong },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: N.bg.card,
    borderRadius: 13,
    padding: 4,
    gap: 2,
    ...N.shadow.card,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: N.text.primary },
  tabText: { fontSize: 13, color: N.text.tertiary, fontFamily: font.medium },
  tabTextActive: { color: '#FFF', fontFamily: font.semibold },

  // Dropdowns (Yiyecekler/Öğünler + Sık/Yakın/Favoriler)
  dropdownRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
    justifyContent: 'space-between',
  },
  dropdown: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: N.bg.card,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...N.shadow.card,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },

  // Save template button (nav bar)
  saveTemplateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: N.bg.well,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Template row icon
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: N.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List header
  listHeader: { paddingTop: 4, paddingBottom: 10 },
  listHeaderTitle: {
    fontSize: 13,
    fontFamily: font.semibold,
    color: N.text.tertiary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  // Food row
  rowOuter: { backgroundColor: N.bg.card, position: 'relative', overflow: 'hidden' },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    minHeight: 66,
  },
  rowName: { fontSize: 15, color: N.text.primary, fontFamily: font.semibold, letterSpacing: -0.2 },
  rowMeta: { fontSize: 12, color: N.text.tertiary, fontFamily: font.regular, marginTop: 2 },
  rowSource: { color: N.accent.primaryDim, fontFamily: font.medium },
  rowRight: { alignItems: 'flex-end', minWidth: 50 },
  rowKcal: {
    fontSize: 16,
    color: N.text.primary,
    fontFamily: font.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  rowKcalUnit: { fontSize: 10, color: N.text.tertiary, fontFamily: font.regular, marginTop: 1 },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: N.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: N.bg.page,
  },
  addCircleOn: { backgroundColor: N.text.primary, borderColor: N.text.primary },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 16,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: N.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...N.shadow.card,
  },
  emptyTitle: {
    fontSize: 16,
    color: N.text.primary,
    fontFamily: font.semibold,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 13,
    color: N.text.tertiary,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: N.text.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: { fontSize: 14, color: '#FFF', fontFamily: font.semibold },

  // CTA
  ctaOuter: { position: 'absolute', left: 16, right: 16, bottom: 0, zIndex: 100 },
  ctaBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#000000',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaCountWrap: { width: 52, alignItems: 'flex-start', paddingLeft: 10 },
  ctaCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  ctaCountText: { fontSize: 13, fontFamily: font.bold, color: '#FFF' },
  ctaLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: font.semibold,
    color: '#FFF',
    letterSpacing: -0.4,
  },
  ctaArrow: { width: 52, alignItems: 'flex-end', paddingRight: 14 },
});
