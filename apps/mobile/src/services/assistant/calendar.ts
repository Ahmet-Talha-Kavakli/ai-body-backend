/**
 * Calendar (iOS) — read + write.
 * expo-calendar kullanır.
 */

import * as Calendar from 'expo-calendar';

export async function requestCalendarAuth(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function requestRemindersAuth(): Promise<boolean> {
  const { status } = await Calendar.requestRemindersPermissionsAsync();
  return status === 'granted';
}

export async function getUpcomingEvents(daysForward = 7) {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const ids = calendars.map((c) => c.id);
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysForward);
  const events = await Calendar.getEventsAsync(ids, start, end);
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    notes: e.notes ?? null,
    location: e.location ?? null,
    startDate: typeof e.startDate === 'string' ? e.startDate : new Date(e.startDate).toISOString(),
    endDate: typeof e.endDate === 'string' ? e.endDate : new Date(e.endDate).toISOString(),
    allDay: e.allDay,
    calendarId: e.calendarId,
  }));
}

export async function createEvent(args: {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
  alarmMinutes?: number;
}): Promise<string | null> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const def = calendars.find((c) => c.allowsModifications) ?? calendars[0];
  if (!def) return null;
  const id = await Calendar.createEventAsync(def.id, {
    title: args.title,
    startDate: args.startDate,
    endDate: args.endDate,
    notes: args.notes,
    location: args.location,
    alarms: args.alarmMinutes ? [{ relativeOffset: -args.alarmMinutes }] : undefined,
  });
  return id;
}

export async function getActiveReminders() {
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
  if (cals.length === 0) return [];
  const reminders = await Calendar.getRemindersAsync(
    cals.map((c) => c.id),
    Calendar.ReminderStatus.INCOMPLETE,
    null,
    null,
  );
  return reminders.map((r) => ({
    id: r.id,
    title: r.title,
    notes: r.notes ?? null,
    dueDate: r.dueDate
      ? typeof r.dueDate === 'string'
        ? r.dueDate
        : new Date(r.dueDate).toISOString()
      : null,
    completed: r.completed,
  }));
}

export async function createReminder(args: {
  title: string;
  notes?: string;
  dueDate?: Date;
}): Promise<string | null> {
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
  const def = cals.find((c) => c.allowsModifications) ?? cals[0];
  if (!def) return null;
  const id = await Calendar.createReminderAsync(def.id, {
    title: args.title,
    notes: args.notes,
    dueDate: args.dueDate,
  });
  return id;
}
