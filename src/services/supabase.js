import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_SESSION_KEY = 'TaskManager_demo_session';
export const DEMO_USER_ID = 'demo-device';

// SecureStore acceptă doar [a-zA-Z0-9._-] — sanitizăm orice altă cheie
function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

const secureStorage = {
  async getItem(key) {
    const safeKey = sanitizeKey(key);
    const count = await SecureStore.getItemAsync(`${safeKey}_chunk_count`);
    if (count === null) return SecureStore.getItemAsync(safeKey);
    const chunkCount = Number(count);
    if (!Number.isInteger(chunkCount) || chunkCount < 0 || chunkCount > 100) {
      throw new Error('Sesiunea securizată are un format invalid. Autentifică-te din nou.');
    }
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(`${safeKey}_chunk_${index}`)
      )
    );
    if (chunks.some((chunk) => chunk === null)) {
      throw new Error('Sesiunea securizată este incompletă. Autentifică-te din nou.');
    }
    return chunks.join('');
  },
  async setItem(key, value) {
    const safeKey = sanitizeKey(key);
    const codePoints = Array.from(value);
    const chunks = [];
    for (let index = 0; index < codePoints.length; index += 350) {
      chunks.push(codePoints.slice(index, index + 350).join(''));
    }
    const previousCount = Number(await SecureStore.getItemAsync(`${safeKey}_chunk_count`) || 0);
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(`${safeKey}_chunk_${index}`, chunk)
      )
    );
    await SecureStore.setItemAsync(`${safeKey}_chunk_count`, String(chunks.length));
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - chunks.length) }, (_, index) =>
        SecureStore.deleteItemAsync(`${safeKey}_chunk_${chunks.length + index}`)
      )
    );
    await SecureStore.deleteItemAsync(safeKey);
  },
  async removeItem(key) {
    const safeKey = sanitizeKey(key);
    const count = Number(await SecureStore.getItemAsync(`${safeKey}_chunk_count`) || 0);
    await Promise.all([
      SecureStore.deleteItemAsync(safeKey),
      SecureStore.deleteItemAsync(`${safeKey}_chunk_count`),
      ...Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(`${safeKey}_chunk_${index}`)
      ),
    ]);
  },
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const hasDemoSession = () => SecureStore.getItemAsync(DEMO_SESSION_KEY);

export const startDemoSession = () =>
  SecureStore.setItemAsync(DEMO_SESSION_KEY, 'active');

export const endDemoSession = () => SecureStore.deleteItemAsync(DEMO_SESSION_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const requireSupabase = () => {
  if (!supabase) {
    throw new Error(
      'Supabase nu este configurat. Completează EXPO_PUBLIC_SUPABASE_URL și EXPO_PUBLIC_SUPABASE_ANON_KEY în fișierul .env.'
    );
  }
  return supabase;
};
