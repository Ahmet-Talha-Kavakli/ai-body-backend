export interface ReminderSettings {
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
}
