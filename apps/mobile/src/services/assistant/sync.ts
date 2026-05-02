/**
 * Sync orchestrator — uygulama açıldığında veya periyodik olarak
 * tüm native data'yı backend'e push eder. Asistan'ın "eli kolu"nu güncel tutar.
 */

import { Platform } from 'react-native';
import { runFullHealthKitSync } from './healthkit';
import {
  getUpcomingEvents,
  getActiveReminders,
  requestCalendarAuth,
  requestRemindersAuth,
} from './calendar';

interface SyncArgs {
  apiUrl: string;
  getToken: () => Promise<string | null>;
}

export async function syncCalendarToBackend(
  args: SyncArgs,
): Promise<{ ok: boolean; count?: number }> {
  try {
    const events = await getUpcomingEvents(30);
    const token = await args.getToken();
    if (!token) return { ok: false };
    const res = await fetch(`${args.apiUrl}/api/assistant/calendar/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        events: events.map((e) => ({
          externalId: e.id,
          title: e.title,
          notes: e.notes,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          allDay: e.allDay,
        })),
      }),
    });
    if (!res.ok) return { ok: false };
    return { ok: true, count: events.length };
  } catch (e) {
    console.error('[sync/calendar]', e);
    return { ok: false };
  }
}

export async function syncRemindersToBackend(
  args: SyncArgs,
): Promise<{ ok: boolean; count?: number }> {
  try {
    const reminders = await getActiveReminders();
    const token = await args.getToken();
    if (!token) return { ok: false };
    const res = await fetch(`${args.apiUrl}/api/assistant/reminders/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        reminders: reminders.map((r) => ({
          externalId: r.id,
          title: r.title,
          notes: r.notes,
          dueDate: r.dueDate,
          completed: r.completed,
        })),
      }),
    });
    if (!res.ok) return { ok: false };
    return { ok: true, count: reminders.length };
  } catch (e) {
    console.error('[sync/reminders]', e);
    return { ok: false };
  }
}

/**
 * İzni granted olan tüm sistemleri sync et. Her açılışta çağrılır.
 * İzin yoksa sessizce atlar.
 */
export async function runAllAssistantSyncs(args: SyncArgs): Promise<void> {
  if (Platform.OS !== 'ios') return;

  // Permission durumlarını backend'den çek (ya da localde tut — şimdilik backend'i kaynak alıyoruz)
  let permsRes: Record<string, string> = {};
  try {
    const token = await args.getToken();
    if (!token) return;
    const res = await fetch(`${args.apiUrl}/api/assistant/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permsRes = Object.fromEntries(
        (data.permissions ?? []).map((p: any) => [p.capability, p.status]),
      );
    }
  } catch {}

  // HealthKit
  if (permsRes.healthkit === 'granted') {
    runFullHealthKitSync(args).catch(() => {});
  }
  // Calendar
  if (permsRes.calendar_read === 'granted') {
    syncCalendarToBackend(args).catch(() => {});
  }
  // Reminders
  if (permsRes.reminders_read === 'granted') {
    syncRemindersToBackend(args).catch(() => {});
  }
}

/**
 * Bir capability için izin iste (just-in-time). Granted ise backend'e bildir.
 */
export async function requestAndStorePermission(args: {
  apiUrl: string;
  getToken: () => Promise<string | null>;
  capability: string;
  request: () => Promise<boolean>;
}): Promise<boolean> {
  const granted = await args.request();
  try {
    const token = await args.getToken();
    if (token) {
      await fetch(`${args.apiUrl}/api/assistant/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          capability: args.capability,
          status: granted ? 'granted' : 'denied',
        }),
      });
    }
  } catch {}
  return granted;
}
