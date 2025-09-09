import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

const SESSION_KEY = 'SUPABASE_SESSION';

export async function saveSession(session: Session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function getSession() {
  const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

export async function deleteSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function restoreSession() {
  const session = await getSession();
  if (session) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    return true;
  }
  return false;
} 