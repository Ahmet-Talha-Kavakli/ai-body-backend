import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from './_components/theme';
import { useSleepFonts } from './_components/useSleepFonts';

interface MonthlySession {
  id: string;
  endedAt: string;
  totalMinutes: number | null;
  sleepScore: number | null;
  deepMinutes: number;
  remMinutes: number;
  lightMinutes: number;
  awakeMinutes: number;
  snoreCount: number;
}

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
const DAYS_S = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

export default function TakvimScreen() {
  const fontsLoaded = useSleepFonts();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [sessions, setSessions] = useState<MonthlySession[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchMonth = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_URL}/api/tracking/sleep/monthly?year=${cursor.year}&month=${cursor.month + 1}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (e) {
      console.error('[uyku/takvim]', e);
    }
  }, [cursor.year, cursor.month, getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchMonth();
    }, [fetchMonth]),
  );

  const sessionByDay = useMemo(() => {
    const map: Record<number, MonthlySession> = {};
    for (const s of sessions) {
      const d = new Date(s.endedAt);
      map[d.getDate()] = s;
    }
    return map;
  }, [sessions]);

  if (!fontsLoaded) return <View style={st.root} />;

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const firstDow = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7; // Mon=0
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === cursor.year && today.getMonth() === cursor.month;

  const goPrev = () => {
    Haptics.selectionAsync();
    setCursor((c) => {
      const m = c.month - 1;
      if (m < 0) return { year: c.year - 1, month: 11 };
      return { year: c.year, month: m };
    });
    setSelectedDay(null);
  };
  const goNext = () => {
    Haptics.selectionAsync();
    setCursor((c) => {
      const m = c.month + 1;
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
    setSelectedDay(null);
  };

  const monthAvgScore = sessions.length
    ? Math.round(sessions.reduce((s, x) => s + (x.sleepScore ?? 0), 0) / sessions.length)
    : 0;
  const monthSessionCount = sessions.length;

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  const selectedSession = selectedDay !== null ? (sessionByDay[selectedDay] ?? null) : null;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={st.title}>Takvim</Text>
      <Text style={st.sub}>Ay boyunca uyku düzenin</Text>

      {/* Ay özet kart */}
      <View style={summarySt.card}>
        <View style={summarySt.row}>
          <View style={summarySt.col}>
            <Text style={summarySt.value}>{monthSessionCount}</Text>
            <Text style={summarySt.label}>Kaydedilen Gece</Text>
          </View>
          <View style={summarySt.divider} />
          <View style={summarySt.col}>
            <Text style={[summarySt.value, { color: scoreColor(monthAvgScore) }]}>
              {monthSessionCount ? monthAvgScore : '—'}
            </Text>
            <Text style={summarySt.label}>Ortalama Skor</Text>
          </View>
        </View>
      </View>

      {/* Ay başlığı + ok */}
      <View style={navSt.wrap}>
        <Pressable onPress={goPrev} hitSlop={14} style={navSt.btn}>
          <SymbolView
            name="chevron.left"
            size={18}
            tintColor={SLEEP.text}
            fallback={<Text>‹</Text>}
          />
        </Pressable>
        <Text style={navSt.title}>
          {MONTHS[cursor.month]} {cursor.year}
        </Text>
        <Pressable onPress={goNext} hitSlop={14} style={navSt.btn} disabled={isCurrentMonth}>
          <SymbolView
            name="chevron.right"
            size={18}
            tintColor={isCurrentMonth ? SLEEP.textDim : SLEEP.text}
            fallback={<Text>›</Text>}
          />
        </Pressable>
      </View>

      {/* Gün başlıkları */}
      <View style={gridSt.headerRow}>
        {DAYS_S.map((d) => (
          <Text key={d} style={gridSt.headerTxt}>
            {d}
          </Text>
        ))}
      </View>

      {/* Günler grid */}
      <View style={gridSt.grid}>
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <View key={`empty-${idx}`} style={gridSt.cell} />;
          }
          const session = sessionByDay[cell.day];
          const isToday = isCurrentMonth && today.getDate() === cell.day;
          const isFuture = isCurrentMonth && today.getDate() < cell.day;
          const isSelected = selectedDay === cell.day;

          return (
            <Pressable
              key={cell.day}
              style={gridSt.cell}
              onPress={() => {
                if (isFuture) return;
                Haptics.selectionAsync();
                setSelectedDay(cell.day);
              }}
              disabled={isFuture}
            >
              <View
                style={[
                  gridSt.dayWrap,
                  isSelected && { borderColor: SLEEP.accent, borderWidth: 2 },
                  isToday && !isSelected && { borderColor: SLEEP.accent, borderWidth: 1 },
                ]}
              >
                <Text style={[gridSt.dayTxt, isFuture && { color: SLEEP.textDim }]}>
                  {cell.day}
                </Text>
                {session ? (
                  <View
                    style={[gridSt.dot, { backgroundColor: scoreColor(session.sleepScore ?? 0) }]}
                  />
                ) : (
                  <View style={[gridSt.dot, { backgroundColor: 'transparent' }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Seçili gün detay */}
      {selectedDay !== null && (
        <DayDetail
          day={selectedDay}
          month={cursor.month}
          year={cursor.year}
          session={selectedSession}
        />
      )}

      {/* Legend */}
      <View style={legendSt.wrap}>
        <Text style={legendSt.title}>Skor Renkleri</Text>
        <View style={legendSt.row}>
          <LegendDot color="#30D158" label="85+" />
          <LegendDot color="#8CD64A" label="70-84" />
          <LegendDot color="#FFCC00" label="55-69" />
          <LegendDot color="#FF9F0A" label="40-54" />
          <LegendDot color="#FF3B30" label="<40" />
        </View>
      </View>
    </ScrollView>
  );
}

function DayDetail({
  day,
  month,
  year,
  session,
}: {
  day: number;
  month: number;
  year: number;
  session: MonthlySession | null;
}) {
  const date = new Date(year, month, day);
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const label = `${days[date.getDay()]}, ${day} ${MONTHS[month]}`;

  return (
    <View style={detailSt.wrap}>
      <Text style={detailSt.dateLabel}>{label}</Text>
      {session ? (
        <>
          <View style={detailSt.scoreRow}>
            <Text style={[detailSt.score, { color: scoreColor(session.sleepScore ?? 0) }]}>
              {session.sleepScore}
            </Text>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={detailSt.scoreLabel}>Uyku Skoru</Text>
              <Text style={detailSt.duration}>
                {session.totalMinutes ? fmtDuration(session.totalMinutes) : '—'}
              </Text>
            </View>
          </View>

          <View style={detailSt.stagesRow}>
            <StageChip label="Derin" minutes={session.deepMinutes} color="#0A84FF" />
            <StageChip label="REM" minutes={session.remMinutes} color="#BF5AF2" />
            <StageChip label="Hafif" minutes={session.lightMinutes} color={SLEEP.accent} />
          </View>
        </>
      ) : (
        <View style={detailSt.empty}>
          <SymbolView
            name="moon.zzz"
            size={32}
            tintColor={SLEEP.textDim}
            fallback={<Text>🌙</Text>}
          />
          <Text style={detailSt.emptyTxt}>Bu gece için kayıt yok</Text>
        </View>
      )}
    </View>
  );
}

function StageChip({ label, minutes, color }: { label: string; minutes: number; color: string }) {
  return (
    <View style={[chipSt.wrap, { borderColor: color + '40' }]}>
      <View style={[chipSt.dot, { backgroundColor: color }]} />
      <Text style={chipSt.label}>{label}</Text>
      <Text style={chipSt.value}>{fmtMinutes(minutes)}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendSt.item}>
      <View style={[legendSt.dot, { backgroundColor: color }]} />
      <Text style={legendSt.label}>{label}</Text>
    </View>
  );
}

function scoreColor(score: number) {
  if (score >= 85) return '#30D158';
  if (score >= 70) return '#8CD64A';
  if (score >= 55) return '#FFCC00';
  if (score >= 40) return '#FF9F0A';
  if (score > 0) return '#FF3B30';
  return SLEEP.textDim;
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}s ${m}d uyudun`;
}

function fmtMinutes(min: number) {
  if (!min || min < 1) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}d`;
  return `${h}s${m}d`;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  scroll: { paddingHorizontal: 18 },
  title: { fontFamily: font.extrabold, fontSize: 28, color: SLEEP.text, letterSpacing: -0.6 },
  sub: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
});

const summarySt = StyleSheet.create({
  card: {
    marginTop: 18,
    backgroundColor: SLEEP.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: SLEEP.border },
  value: { fontFamily: font.extrabold, fontSize: 28, color: SLEEP.text, letterSpacing: -0.5 },
  label: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim, letterSpacing: 0.4 },
});

const navSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingHorizontal: 4,
  },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 18, color: SLEEP.text, letterSpacing: -0.3 },
});

const gridSt = StyleSheet.create({
  headerRow: { flexDirection: 'row', marginTop: 14 },
  headerTxt: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 11,
    color: SLEEP.textDim,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 3,
  },
  dayTxt: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

const detailSt = StyleSheet.create({
  wrap: {
    marginTop: 18,
    backgroundColor: SLEEP.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  dateLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: SLEEP.textMuted,
    letterSpacing: 0.2,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  score: { fontFamily: font.extrabold, fontSize: 56, letterSpacing: -2 },
  scoreLabel: { fontFamily: font.semibold, fontSize: 12, color: SLEEP.textDim, letterSpacing: 0.5 },
  duration: {
    fontFamily: font.bold,
    fontSize: 16,
    color: SLEEP.text,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  stagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  empty: { alignItems: 'center', paddingVertical: 22, gap: 8 },
  emptyTxt: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textDim },
});

const chipSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: SLEEP.card,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: font.medium, fontSize: 12, color: SLEEP.textMuted },
  value: { fontFamily: font.bold, fontSize: 12, color: SLEEP.text },
});

const legendSt = StyleSheet.create({
  wrap: { marginTop: 22, padding: 14, backgroundColor: SLEEP.card, borderRadius: 14 },
  title: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: SLEEP.textMuted,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flexDirection: 'column', alignItems: 'center', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontFamily: font.regular, fontSize: 10, color: SLEEP.textDim },
});
