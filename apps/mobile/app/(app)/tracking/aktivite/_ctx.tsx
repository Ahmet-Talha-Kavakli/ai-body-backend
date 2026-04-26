import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '@clerk/expo';
import { detectCombos } from '../../../../lib/activity-combos';
import {
  ActivityLog,
  AddModal,
  CalendarModal,
  CatalogItem,
  DetailSheet,
  FavoriteEntry,
  GoalModal,
  GoalType,
  PersonalRecord,
  AllRecord,
  ActivitySubType,
  WeatherData,
  API_URL,
  FAV_KEY,
  GOAL_TYPE_KEY,
  GOAL_CAL_KEY,
  getCatalogItem,
  isSameDay,
  toDateString,
} from './_shared';

// ─── Favorites Hook ───────────────────────────────────────────────────────────
function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY)
      .then((raw) => {
        if (raw) setFavorites(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggle = useCallback((entry: FavoriteEntry) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === entry.id);
      const next = exists ? prev.filter((f) => f.id !== entry.id) : [...prev, entry];
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favorites.some((f) => f.id === id), [favorites]);

  return { favorites, toggle, isFav, ready };
}

// ─── API Hook ─────────────────────────────────────────────────────────────────
function useActivityApi() {
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await session?.getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [session],
  );

  const fetchActivities = useCallback(
    async (date: string): Promise<ActivityLog[]> => {
      const r = await authFetch(`/api/tracking/activities?date=${date}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
    [authFetch],
  );
  const addActivity = useCallback(
    async (data: object): Promise<ActivityLog> => {
      const r = await authFetch('/api/tracking/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    [authFetch],
  );
  const deleteActivity = useCallback(
    async (id: string) => {
      const r = await authFetch(`/api/tracking/activities/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
    },
    [authFetch],
  );
  const toggleCompleted = useCallback(
    async (id: string, completed: boolean) => {
      const r = await authFetch(`/api/tracking/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      });
      if (!r.ok) throw new Error();
    },
    [authFetch],
  );
  const updateImages = useCallback(
    async (id: string, imageUrls: string[]) => {
      const r = await authFetch(`/api/tracking/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imageUrls }),
      });
      if (!r.ok) throw new Error();
      return r.json() as Promise<ActivityLog>;
    },
    [authFetch],
  );
  const updateNote = useCallback(
    async (id: string, note: string) => {
      const r = await authFetch(`/api/tracking/activities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: note.trim() || null }),
      });
      if (!r.ok) throw new Error();
      return r.json() as Promise<ActivityLog>;
    },
    [authFetch],
  );
  const fetchMonthly = useCallback(
    async (year: number, month: number) => {
      const r = await authFetch(`/api/tracking/activities/monthly?year=${year}&month=${month}`);
      if (!r.ok) throw new Error();
      return r.json() as Promise<{
        days: Record<
          string,
          { count: number; totalMinutes: number; imageUrl: string | null; imageCount: number }
        >;
        userCreatedAt: string;
      }>;
    },
    [authFetch],
  );
  const fetchCatalog = useCallback(async (): Promise<CatalogItem[]> => {
    const r = await authFetch('/api/activities/catalog');
    if (!r.ok) throw new Error();
    return r.json();
  }, [authFetch]);
  const fetchGoal = useCallback(async (): Promise<number> => {
    const r = await authFetch('/api/activities/goal');
    if (!r.ok) return 60;
    const d = (await r.json()) as { dailyMinutes: number };
    return d.dailyMinutes;
  }, [authFetch]);
  const saveGoal = useCallback(
    async (dailyMinutes: number) => {
      await authFetch('/api/activities/goal', {
        method: 'POST',
        body: JSON.stringify({ dailyMinutes }),
      });
    },
    [authFetch],
  );
  const fetchRecords = useCallback(
    async (activityType: string): Promise<PersonalRecord> => {
      const r = await authFetch(`/api/activities/personal-records?activityType=${activityType}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
    [authFetch],
  );
  const fetchAllRecords = useCallback(async (): Promise<AllRecord[]> => {
    const r = await authFetch('/api/activities/personal-records/all');
    if (!r.ok) return [];
    return r.json();
  }, [authFetch]);
  const fetchSocialProof = useCallback(
    async (activityType: string, date: string): Promise<number> => {
      const r = await authFetch(
        `/api/activities/social-proof?activityType=${activityType}&date=${date}`,
      );
      if (!r.ok) return 0;
      const d = (await r.json()) as { count: number };
      return d.count;
    },
    [authFetch],
  );
  const fetchWeather = useCallback(async (city: string): Promise<WeatherData | null> => {
    const r = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(city)}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { error?: string } & Partial<WeatherData>;
    return d.error ? null : (d as WeatherData);
  }, []);
  const fetchSubTypes = useCallback(
    async (activityType: string): Promise<ActivitySubType[]> => {
      const r = await authFetch(`/api/activities/subtypes?activityType=${activityType}`);
      if (!r.ok) return [];
      const d = (await r.json()) as { subtypes: ActivitySubType[] };
      return d.subtypes;
    },
    [authFetch],
  );

  return {
    fetchActivities,
    addActivity,
    deleteActivity,
    toggleCompleted,
    updateImages,
    updateNote,
    fetchMonthly,
    fetchCatalog,
    fetchGoal,
    saveGoal,
    fetchRecords,
    fetchAllRecords,
    fetchSocialProof,
    fetchWeather,
    fetchSubTypes,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────
type Api = ReturnType<typeof useActivityApi>;

interface AktiviteCtx {
  // Date
  date: Date;
  setDate: (d: Date) => void;
  goToPrev: () => void;
  goToNext: () => void;
  dateStr: string;
  readOnly: boolean;
  // Data
  logs: ActivityLog[];
  catalog: CatalogItem[];
  loading: boolean;
  error: string | null;
  // Goal / weather
  goal: number;
  goalType: GoalType;
  calGoal: number;
  weather: WeatherData | null;
  // Favorites
  favorites: FavoriteEntry[];
  isFav: (id: string) => boolean;
  toggleFav: (entry: FavoriteEntry) => void;
  favReady: boolean;
  // Modal triggers
  openCal: () => void;
  openAdd: (fav?: FavoriteEntry) => void;
  openGoal: () => void;
  openDetail: (log: ActivityLog) => void;
  // Actions
  handleAdd: (data: object) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  handleToggle: (id: string, completed: boolean) => Promise<void>;
  reloadLogs: () => Promise<void>;
  // Page-ready
  pageReady: boolean;
  catalogReady: boolean;
  // Api
  api: Api;
  // Page fade-in
  pageOpAnim: Animated.Value;
}

const Ctx = createContext<AktiviteCtx | null>(null);

export function useAktivite(): AktiviteCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAktivite must be used inside <AktiviteProvider>');
  return v;
}

export function AktiviteProvider({ children }: { children: React.ReactNode }) {
  const api = useActivityApi();

  const [date, setDate] = useState(new Date());
  const [calOpen, setCalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [detailLog, setDetailLog] = useState<ActivityLog | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState(60);
  const [goalType, setGoalType] = useState<GoalType>('minutes');
  const [calGoal, setCalGoal] = useState(500);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeFav, setActiveFav] = useState<FavoriteEntry | undefined>(undefined);
  const pageOpAnim = useRef(new Animated.Value(0)).current;

  const { favorites, toggle: toggleFav, isFav, ready: favReady } = useFavorites();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = toDateString(date);
  const readOnly = !isSameDay(date, new Date());

  // Catalog + goal load
  useEffect(() => {
    api
      .fetchCatalog()
      .then(setCatalog)
      .catch(() => {})
      .finally(() => setCatalogReady(true));
    api
      .fetchGoal()
      .then(setGoal)
      .catch(() => {});
    api
      .fetchWeather('Istanbul')
      .then(setWeather)
      .catch(() => {});
    AsyncStorage.getItem(GOAL_TYPE_KEY)
      .then((v) => {
        if (v === 'calories' || v === 'minutes') setGoalType(v);
      })
      .catch(() => {});
    AsyncStorage.getItem(GOAL_CAL_KEY)
      .then((v) => {
        if (v) setCalGoal(parseInt(v));
      })
      .catch(() => {});
  }, []);

  // Daily logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLogs(await api.fetchActivities(dateStr));
    } catch {
      setError('Aktiviteler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const goToPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };
  const goToNext = () => {
    const c = new Date(date);
    c.setHours(0, 0, 0, 0);
    if (c >= today) return;
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const handleAdd = useCallback(
    async (data: object) => {
      const existingTypes = logs.map((l) => l.activityType);
      const newType = (data as { activityType: string }).activityType;
      const afterTypes = [...existingTypes, newType];
      const newCombos = detectCombos(afterTypes).filter(
        (c) => !detectCombos(existingTypes).some((e) => e.id === c.id),
      );
      const comboTag = newCombos.length > 0 ? newCombos[0]!.id : undefined;
      const newLog = await api.addActivity({
        ...(data as object),
        ...(comboTag ? { comboTag } : {}),
      });
      setLogs((prev) => [...prev, newLog as ActivityLog]);
    },
    [dateStr, logs],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deleteActivity(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      Alert.alert('Hata', 'Aktivite silinemedi.');
    }
  }, []);

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, completed } : l)));
    try {
      await api.toggleCompleted(id, completed);
    } catch {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, completed: !completed } : l)));
    }
  }, []);

  const handleGoalSave = async (value: number, type: GoalType) => {
    setGoalType(type);
    AsyncStorage.setItem(GOAL_TYPE_KEY, type).catch(() => {});
    if (type === 'minutes') {
      setGoal(value);
      try {
        await api.saveGoal(value);
      } catch {}
    } else {
      setCalGoal(value);
      AsyncStorage.setItem(GOAL_CAL_KEY, String(value)).catch(() => {});
    }
  };

  const detailCatalogItem = detailLog
    ? (getCatalogItem(catalog, detailLog.activityType) ?? null)
    : null;

  const pageReady = !loading && favReady && catalogReady;

  useEffect(() => {
    if (!pageReady) return;
    Animated.timing(pageOpAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [pageReady]);

  const ctx: AktiviteCtx = {
    date,
    setDate,
    goToPrev,
    goToNext,
    dateStr,
    readOnly,
    logs,
    catalog,
    loading,
    error,
    goal,
    goalType,
    calGoal,
    weather,
    favorites,
    isFav,
    toggleFav,
    favReady,
    openCal: () => setCalOpen(true),
    openAdd: (fav) => {
      setActiveFav(fav);
      setAddOpen(true);
    },
    openGoal: () => setGoalOpen(true),
    openDetail: (log) => setDetailLog(log),
    handleAdd,
    handleDelete,
    handleToggle,
    reloadLogs: loadLogs,
    pageReady,
    catalogReady,
    api,
    pageOpAnim,
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}

      <CalendarModal
        visible={calOpen}
        current={date}
        onSelect={(d) => setDate(d)}
        onClose={() => setCalOpen(false)}
        fetchMonthly={api.fetchMonthly}
      />
      <AddModal
        visible={addOpen && !readOnly}
        onClose={() => {
          setAddOpen(false);
          setActiveFav(undefined);
        }}
        catalog={catalog}
        onAdd={handleAdd}
        date={dateStr}
        fetchSubTypes={api.fetchSubTypes}
        initialFav={activeFav}
        checkIsFav={isFav}
        toggleFav={toggleFav}
      />
      <GoalModal
        visible={goalOpen}
        currentGoal={goal}
        currentGoalType={goalType}
        currentCalGoal={calGoal}
        onClose={() => setGoalOpen(false)}
        onSave={handleGoalSave}
      />
      <DetailSheet
        log={detailLog}
        catalogItem={detailCatalogItem}
        visible={!!detailLog}
        onClose={() => setDetailLog(null)}
        onDelete={handleDelete}
        fetchSocialProof={api.fetchSocialProof}
        dateStr={dateStr}
        isFav={detailLog ? isFav(`${detailLog.activityType}:${detailLog.subType ?? ''}`) : false}
        onToggleFav={() => {
          if (!detailLog || !detailCatalogItem) return;
          toggleFav({
            id: `${detailLog.activityType}:${detailLog.subType ?? ''}`,
            activityType: detailLog.activityType,
            subType: detailLog.subType,
            nametr: detailCatalogItem.nametr,
            subTypeNametr: detailLog.subTypeNametr,
            color: detailCatalogItem.color,
            iconName: detailLog.subType ?? detailCatalogItem.iconName,
          });
        }}
        onUpdateImages={api.updateImages}
        onUpdateNote={api.updateNote}
      />
    </Ctx.Provider>
  );
}
