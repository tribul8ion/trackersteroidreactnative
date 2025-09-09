import { supabase } from './supabase';

export async function sendFeedback(user_id: string | null, message: string) {
  return await supabase.from('feedback').insert([{ user_id, message }]);
} 