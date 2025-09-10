import * as Notifications from 'expo-notifications';

export type LocalReminder = {
  id: string;
  title: string;
  body?: string;
  date: Date; // trigger time
  data?: Record<string, any>;
};

export class NotificationsService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      return req.status === 'granted';
    }
    return true;
  }

  static async schedule(reminder: LocalReminder): Promise<string | null> {
    const granted = await this.requestPermissions();
    if (!granted) return null;
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body || '',
        data: reminder.data || {},
        sound: 'default',
      },
      trigger: reminder.date,
    });
    return identifier;
  }

  static async cancel(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  static async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async listScheduled(): Promise<Notifications.ScheduledNotification[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
