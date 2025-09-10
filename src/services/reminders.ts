import { LocalStorageService } from './localStorage';
import { NotificationsService } from './notifications';

export type Reminder = {
  id: string;
  title: string;
  date: string; // ISO
  is_done: boolean;
  notification_id?: string | null;
  created_at: string;
};

const STORAGE_KEY = 'reminders';

export class RemindersService {
  static async getReminders(): Promise<Reminder[]> {
    // Reuse LocalStorageService generic storage
    const reminders = await LocalStorageService.getReminders();
    return reminders as any;
  }

  static async addReminder(title: string, dateISO: string): Promise<Reminder> {
    const reminder: Reminder = {
      id: 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title,
      date: dateISO,
      is_done: false,
      notification_id: null,
      created_at: new Date().toISOString(),
    };

    // schedule local notification
    const notifId = await NotificationsService.schedule({
      id: reminder.id,
      title: reminder.title,
      date: new Date(dateISO),
      data: { type: 'reminder', id: reminder.id },
    });
    reminder.notification_id = notifId;

    const list = await this.getReminders();
    list.push(reminder);
    await LocalStorageService.saveReminders(list as any);
    return reminder;
  }

  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const list = await this.getReminders();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const current = list[idx];
    const next = { ...current, ...updates } as Reminder;
    list[idx] = next;
    await LocalStorageService.saveReminders(list as any);
    return next;
  }

  static async deleteReminder(id: string): Promise<boolean> {
    const list = await this.getReminders();
    const found = list.find(r => r.id === id);
    if (found?.notification_id) {
      await NotificationsService.cancel(found.notification_id);
    }
    const filtered = list.filter(r => r.id !== id);
    const ok = await LocalStorageService.saveReminders(filtered as any);
    return ok;
  }
}
