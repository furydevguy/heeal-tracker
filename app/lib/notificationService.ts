// app/lib/notificationService.ts
import * as Notifications from 'expo-notifications'
import { areNotificationsEnabled, scheduleLocalNotification } from './notifications'

type NotificationService = {
  scheduleHabitReminders: () => Promise<void>
}

let instance: NotificationService | null = null

export function getNext8AmTrigger(): Notifications.NotificationTriggerInput {
  // Use calendar-based repeating trigger at 08:00 local time
  return {
    hour: 8,
    minute: 0,
    repeats: true,
  } as Notifications.CalendarTriggerInput
}

export function getNotificationService(): NotificationService {
  if (instance) return instance

  instance = {
    async scheduleHabitReminders() {
      const enabled = await areNotificationsEnabled()
      if (!enabled) return

      const trigger = getNext8AmTrigger()
      await scheduleLocalNotification(
        {
          title: 'Aura Daily',
          body: "It's 8:00 — check today’s plan and stay on track!",
          channelId: 'aura-daily',
        },
        trigger
      )
    },
  }

  return instance
}

export default getNotificationService


