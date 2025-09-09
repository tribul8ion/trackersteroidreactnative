import { supabase } from './supabase';

export type Reminder = {
  id: string;
  user_id: string;
  title: string;
  date: string; // ISO string
  created_at: string;
  is_done: boolean;
};

export async function getReminders(user_id: string) {
  return await supabase.from('reminders').select('*').eq('user_id', user_id).order('date', { ascending: true });
}

export async function addReminder(user_id: string, title: string, date: string) {
  return await supabase.from('reminders').insert([{ user_id, title, date, is_done: false }]);
}

export async function deleteReminder(id: string) {
  return await supabase.from('reminders').delete().eq('id', id);
}

export async function updateReminder(id: string, updates: Partial<Reminder>) {
  return await supabase.from('reminders').update(updates).eq('id', id);
} 