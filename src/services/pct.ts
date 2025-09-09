import { supabase } from './supabase';

export type Pct = {
  id: string;
  user_id: string;
  course_id: string;
  name: string;
  dose: string;
  duration: string;
  unit: string;
  notes?: string;
};

export async function addPct(pct: Omit<Pct, 'id'>) {
  return await supabase.from('pct').insert([pct]);
}

export async function getPct(course_id: string) {
  return await supabase.from('pct').select('*').eq('course_id', course_id);
}

export async function updatePct(id: string, updates: Partial<Pct>) {
  return await supabase.from('pct').update(updates).eq('id', id);
}

export async function deletePct(id: string) {
  return await supabase.from('pct').delete().eq('id', id);
} 