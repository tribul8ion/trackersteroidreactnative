import { supabase as _supabase } from './supabase';
import { saveSession, deleteSession } from './session';

export const supabase = _supabase;

export async function signUp(email: string, password: string) {
  const result = await supabase.auth.signUp({ email, password });
  if (result.data.session) {
    await saveSession(result.data.session);
  }
  return result;
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.data.session) {
    await saveSession(result.data.session);
  }
  return result;
}

export async function signOut() {
  await deleteSession();
  return await supabase.auth.signOut();
}

export function getUser() {
  return supabase.auth.getUser();
} 