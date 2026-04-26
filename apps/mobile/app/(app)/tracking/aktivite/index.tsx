import React from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { detectCombos } from '../../../../lib/activity-combos';
import { getActivitySubIcon, getMainActivityIcon } from '../../../../lib/activity-icons';
import {
  ACCENT,
  ActivityCard,
  ComboBanner,
  DateHeader,
  LoadingOverlay,
  PamukSection,
  SummaryCard,
  WeatherWidget,
  getCatalogItem,
} from './_shared';
import { useAktivite } from './_ctx';

export default function AktivitelerIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    date,
    goToPrev,
    goToNext,
    openCal,
    openAdd,
    openGoal,
    openDetail,
    logs,
    catalog,
    error,
    goal,
    goalType,
    calGoal,
    weather,
    favorites,
    readOnly,
    pageReady,
    handleDelete,
    handleToggle,
    pageOpAnim,
  } = useAktivite();

  const activityTypes = logs.map((l) => l.activityType);
  const activeCombos = detectCombos(activityTypes);

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      {pageReady && (
        <DateHeader
          date={date}
          onPrev={goToPrev}
          onNext={goToNext}
          onOpenCal={openCal}
          onBack={() => router.back()}
        />
      )}

      {!pageReady && <LoadingOverlay />}

      <Animated.View style={{ flex: 1, opacity: pageOpAnim }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Pamuk maskot */}
          <PamukSection
            logs={logs}
            goal={goalType === 'minutes' ? goal : calGoal}
            goalType={goalType}
          />

          {/* Hava durumu */}
          {weather && <WeatherWidget weather={weather} />}

          {/* Özet kart */}
          {logs.length > 0 && (
            <SummaryCard
              logs={logs}
              goal={goalType === 'minutes' ? goal : calGoal}
              goalType={goalType}
              onGoalPress={openGoal}
            />
          )}

          {/* Combo banner */}
          {activeCombos.length > 0 && <ComboBanner combos={activeCombos} />}

          {/* ReadOnly banner */}
          {readOnly && (
            <View style={s.readOnlyBanner}>
              <Ionicons name="lock-closed-outline" size={14} color="#8E8E93" />
              <Text style={s.readOnlyTxt}>Geçmiş tarihlerde değişiklik yapılamaz</Text>
            </View>
          )}

          {error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF453A" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Favoriler */}
          {!readOnly && pageReady && favorites.length > 0 && (
            <View style={s.favSection}>
              <View style={s.favHeader}>
                <Ionicons name="heart" size={14} color="#FF2D55" />
                <Text style={s.favHeaderTxt}>Favoriler</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {favorites.map((fav) => {
                  const icon = fav.subType
                    ? getActivitySubIcon(fav.subType)
                    : getMainActivityIcon(fav.activityType);
                  return (
                    <Pressable
                      key={fav.id}
                      style={({ pressed }) => [s.favCard, { opacity: pressed ? 0.75 : 1 }]}
                      onPress={() => openAdd(fav)}
                    >
                      <View style={[s.favCardIcon, { backgroundColor: fav.color + '18' }]}>
                        {icon ? (
                          <Image
                            source={icon}
                            style={{ width: 52, height: 52 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Ionicons name={fav.iconName as any} size={28} color={fav.color} />
                        )}
                      </View>
                      <Text style={[s.favCardName, { color: fav.color }]} numberOfLines={1}>
                        {fav.nametr}
                      </Text>
                      {fav.subTypeNametr && (
                        <Text style={s.favCardSub} numberOfLines={1}>
                          {fav.subTypeNametr}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {!error && logs.length === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="walk-outline" size={48} color="#C7C7CC" />
              <Text style={s.emptyTitle}>Aktivite yok</Text>
              <Text style={s.emptyTxt}>Bugün ne yaptın? + ile ekle</Text>
              {favorites.length === 0 && (
                <View style={s.quickRow}>
                  {(['walking', 'running', 'swimming'] as const).map((type) => {
                    const item = getCatalogItem(catalog, type);
                    if (!item) return null;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => {
                          if (!readOnly) openAdd();
                        }}
                        style={[s.quickBtn, { borderColor: item.color + '40' }]}
                      >
                        <Ionicons name={item.iconName as any} size={20} color={item.color} />
                        <Text style={[s.quickTxt, { color: item.color }]}>{item.nametr}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {logs.map((log, idx) => (
            <ActivityCard
              key={log.id}
              log={log}
              catalogItem={getCatalogItem(catalog, log.activityType)}
              onPress={() => openDetail(log)}
              onDelete={() => handleDelete(log.id)}
              onToggle={handleToggle}
              index={idx}
            />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      {/* Floating + FAB (replaces center FAB from old custom nav) */}
      {!readOnly && (
        <Pressable
          onPress={() => openAdd()}
          style={[s.fab, { bottom: insets.bottom + 70 }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  discoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  discoverIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  discoverSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  readOnlyTxt: { color: '#8E8E93', fontSize: 13 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorTxt: { color: '#FF453A', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  emptyTxt: { fontSize: 13, color: '#8E8E93' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  quickTxt: { fontSize: 13, fontWeight: '700' },
  favSection: { marginBottom: 16 },
  favHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  favHeaderTxt: { fontSize: 13, fontWeight: '700', color: '#FF2D55' },
  favCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: 88,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  favCardIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  favCardName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  favCardSub: { fontSize: 10, color: '#8E8E93', marginTop: 2, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    zIndex: 100,
  },
});
