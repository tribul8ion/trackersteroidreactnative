import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string;
  created_at: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  city?: string;
  bio?: string;
  gender?: string;
};

export async function getProfile(user_id: string) {
  return await supabase.from('profile').select('*').eq('id', user_id).single();
}

export async function updateProfile(user_id: string, updates: Partial<Profile>) {
  return await supabase.from('profile').update(updates).eq('id', user_id);
} 