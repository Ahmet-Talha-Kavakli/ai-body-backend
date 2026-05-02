import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@clerk/expo';

import { font, SLEEP, API_URL } from './_components/theme';
import { useSleepFonts } from './_components/useSleepFonts';
import StepHeader from './_components/StepHeader';
import NextButton from './_components/NextButton';
import AlarmPicker, { AlarmConfig } from './_components/AlarmPicker';
import MusicPicker, { MusicConfig } from './_components/MusicPicker';
import WearableStep from './_components/WearableStep';
import SummaryStep from './_components/SummaryStep';
import PPGMeasure, { PPGResult } from './_components/PPGMeasure';

const STEP_TITLES = ['Alarm', 'Müzik', 'Akıllı Saat', 'Hazırlık'];

export default function BaslatScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const pagerRef = useRef<PagerView>(null);

  const [step, setStep] = useState(0);
  const [alarm, setAlarm] = useState<AlarmConfig>({
    enabled: true,
    time: (() => {
      const t = new Date();
      t.setHours(7, 0, 0, 0);
      return t;
    })(),
    smartAlarm: true,
  });
  const [music, setMusic] = useState<MusicConfig>({ trackId: null, timerMinutes: 30 });
  const [wearableConnected, setWearableConnected] = useState(false);
  const [ppgOpen, setPpgOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!fontsLoaded) return <View style={st.root} />;

  const goNext = () => {
    if (step >= STEP_TITLES.length - 1) return;
    Haptics.selectionAsync();
    const next = step + 1;
    pagerRef.current?.setPage(next);
    setStep(next);
  };

  const goBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    Haptics.selectionAsync();
    const prev = step - 1;
    pagerRef.current?.setPage(prev);
    setStep(prev);
  };

  const startSession = async (ppg: PPGResult | null) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const body = {
        plannedAlarmAt:
          alarm.enabled && alarm.time ? computeNextAlarm(alarm.time).toISOString() : null,
        smartAlarm: alarm.smartAlarm,
        bedtimeBpm: ppg?.bpm ?? null,
        bedtimeHrv: ppg?.hrv ?? null,
        musicTrackId: null,
        sleepTimerMin: music.trackId ? music.timerMinutes : null,
        wearableSynced: wearableConnected,
      };
      const res = await fetch(`${API_URL}/api/tracking/sleep/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const session = await res.json();
      if (!res.ok) throw new Error(session?.error ?? 'session_failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: '/(app)/tracking/uyku-takip',
        params: {
          sessionId: session.id,
          alarmAt: body.plannedAlarmAt ?? '',
          smartAlarm: alarm.smartAlarm ? '1' : '0',
          musicTrackId: music.trackId ?? '',
          sleepTimerMin: String(music.timerMinutes),
        },
      });
    } catch (e) {
      console.error('[uyku/baslat]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Bir şey ters gitti', 'Tekrar dener misin?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StepHeader
        step={step}
        total={STEP_TITLES.length}
        title={STEP_TITLES[step] ?? ''}
        onBack={goBack}
        onClose={() => router.back()}
      />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        scrollEnabled={false}
        onPageSelected={(e) => setStep(e.nativeEvent.position)}
      >
        {/* Step 1 — Alarm */}
        <View key="alarm" style={st.page}>
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={st.intro}>
              <Text style={st.introTitle}>Seni ne zaman uyandırayım?</Text>
              <Text style={st.introSub}>
                Akıllı uyandırma ile 30 dakikalık pencerede en hafif uyku evrende uyandırırım.
              </Text>
            </View>
            <AlarmPicker value={alarm} onChange={setAlarm} />
            <View style={{ height: 20 }} />
            <NextButton label="İleri" onPress={goNext} icon="arrow.right" />
          </ScrollView>
        </View>

        {/* Step 2 — Müzik */}
        <View key="music" style={st.page}>
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={st.intro}>
              <Text style={st.introTitle}>Uyumana yardımcı bir ses?</Text>
              <Text style={st.introSub}>
                Yağmur, beyaz gürültü veya sakin piyano. Sleep timer ile belirlenen sürede otomatik
                kapanır.
              </Text>
            </View>
            <MusicPicker value={music} onChange={setMusic} />
            <View style={{ height: 20 }} />
            <NextButton
              label={music.trackId ? 'İleri' : 'Müziksiz Devam Et'}
              onPress={goNext}
              icon="arrow.right"
            />
          </ScrollView>
        </View>

        {/* Step 3 — Wearable */}
        <View key="wearable" style={st.page}>
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <WearableStep
              onConnected={(synced) => {
                setWearableConnected(synced);
                goNext();
              }}
            />
          </ScrollView>
        </View>

        {/* Step 4 — Özet + PPG */}
        <View key="summary" style={st.page}>
          <ScrollView
            contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <SummaryStep
              alarm={alarm}
              music={music}
              wearableConnected={wearableConnected}
              onStart={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPpgOpen(true);
              }}
            />
          </ScrollView>
        </View>
      </PagerView>

      {/* PPG Modal */}
      <Modal
        visible={ppgOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPpgOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: SLEEP.page }}>
          <View style={st.modalHeader}>
            <Pressable onPress={() => setPpgOpen(false)} hitSlop={12}>
              <Text style={st.modalCancel}>Vazgeç</Text>
            </Pressable>
            <Text style={st.modalTitle}>Nabız Ölçümü</Text>
            <View style={{ width: 60 }} />
          </View>
          <PPGMeasure
            label="bedtime"
            onComplete={(r) => {
              setPpgOpen(false);
              startSession(r);
            }}
            onSkip={() => {
              setPpgOpen(false);
              startSession(null);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function computeNextAlarm(time: Date): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(time.getHours(), time.getMinutes(), 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  page: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 12 },
  intro: { paddingHorizontal: 4, marginBottom: 18 },
  introTitle: { fontFamily: font.extrabold, fontSize: 24, color: SLEEP.text, letterSpacing: -0.5 },
  introSub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    marginTop: 8,
    lineHeight: 19,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  modalCancel: { fontFamily: font.medium, fontSize: 16, color: SLEEP.textMuted },
  modalTitle: { fontFamily: font.bold, fontSize: 16, color: SLEEP.text, letterSpacing: -0.2 },
});
