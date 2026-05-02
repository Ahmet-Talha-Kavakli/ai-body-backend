/**
 * İlaç hatırlatıcıları için local notification yönetimi.
 *
 * Bir ilaç eklenince scheduleTimes'taki her saat için günlük tekrarlanan
 * local notification kuruyoruz. Notification ID'lerini AsyncStorage'da
 * `med_notif_<medicationId>` key'i altında saklıyoruz ki silerken/edit'lerken
 * eski schedule'ı temiz iptal edebilelim.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const STORAGE_PREFIX = 'med_notif_';

export interface MedicationNotificationInput {
  medicationId: string;
  medicationName: string;
  dosage: string; // "1 tablet", "5ml" vb.
  scheduleTimes: string[]; // ["08:00", "14:00", ...]
  scheduleDays?: number[]; // [1..7] — boş = her gün, 1=Pzt..7=Paz
}

function parseHourMinute(hhmm: string): { hour: number; minute: number } | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = parseInt(m[1]!, 10);
  const minute = parseInt(m[2]!, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

// Expo'nun day-of-week: 1=Sun, 7=Sat. Bizim app: 1=Mon..7=Sun. Çevir.
function appDayToExpoDay(appDay: number): number {
  // app: 1=Pzt, 7=Paz
  // expo: 1=Paz, 7=Cmt
  if (appDay === 7) return 1; // Pzr
  return appDay + 1; // Pzt(1)→2, Cmt(6)→7
}

export async function scheduleMedicationReminders(
  input: MedicationNotificationInput,
): Promise<string[]> {
  if (isWeb) return [];

  // Önce eski schedule'ı iptal et (idempotent)
  await cancelMedicationReminders(input.medicationId);

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') return [];
  }

  const ids: string[] = [];
  const everyDay =
    !input.scheduleDays || input.scheduleDays.length === 0 || input.scheduleDays.length === 7;

  for (const time of input.scheduleTimes) {
    const parsed = parseHourMinute(time);
    if (!parsed) continue;

    if (everyDay) {
      // Daily trigger
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${input.medicationName}`,
          body: `${input.dosage} alma vakti`,
          data: { medicationId: input.medicationId, scheduledTime: time },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsed.hour,
          minute: parsed.minute,
        },
      });
      ids.push(id);
    } else {
      // Belirli günler — her gün için ayrı weekly trigger
      for (const appDay of input.scheduleDays!) {
        const expoWeekday = appDayToExpoDay(appDay);
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 ${input.medicationName}`,
            body: `${input.dosage} alma vakti`,
            data: { medicationId: input.medicationId, scheduledTime: time },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday,
            hour: parsed.hour,
            minute: parsed.minute,
          },
        });
        ids.push(id);
      }
    }
  }

  await AsyncStorage.setItem(STORAGE_PREFIX + input.medicationId, JSON.stringify(ids));
  return ids;
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  if (isWeb) return;
  const key = STORAGE_PREFIX + medicationId;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;
  try {
    const ids = JSON.parse(raw) as string[];
    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
    );
  } catch {
    // bozuk JSON — sessizce geç
  }
  await AsyncStorage.removeItem(key);
}

export async function rescheduleMedicationReminders(
  input: MedicationNotificationInput,
): Promise<string[]> {
  // scheduleMedicationReminders zaten içinde cancel çağırıyor — direkt çağırılabilir
  return scheduleMedicationReminders(input);
}
