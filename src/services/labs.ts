import { supabase } from './supabase';

export type Lab = {
  id: string;
  user_id: string;
  date: string;
  type: string;
  value: string;
  unit: string;
  notes?: string;
};

export async function addLab(lab: {
  user_id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  norm_min: number;
  norm_max: number;
  lab_name?: string;
  photo_url?: string;
}) {
  return supabase
    .from('labs')
    .insert([lab]);
}

export async function getLabs(user_id: string) {
  return supabase
    .from('labs')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false });
}

export async function updateLab(id: string, updates: Partial<Lab>) {
  return await supabase.from('labs').update(updates).eq('id', id);
}

export async function deleteLab(id: string) {
  return await supabase.from('labs').delete().eq('id', id);
} 