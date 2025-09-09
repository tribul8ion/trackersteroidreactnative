import { supabase } from './supabase';

export type UserAction = {
  id: string;
  user_id: string;
  course_id: string;
  type: string;
  timestamp: string;
  details?: string;
};

export async function addAction(action: Omit<UserAction, 'id'>) {
  return await supabase.from('actions').insert([action]);
}

export async function getActions(user_id: string, course_id?: string) {
  let query = supabase.from('actions').select('*').eq('user_id', user_id);
  if (course_id) query = query.eq('course_id', course_id);
  return await query.order('timestamp', { ascending: false });
} 