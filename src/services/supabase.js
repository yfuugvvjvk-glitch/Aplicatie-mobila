import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_SESSION_KEY = '@TaskManager:demo-session';
export const DEMO_USER_ID = 'demo-device';

const secureStorage = {
  async getItem(key) {
    const count = await SecureStore.getItemAsync(`${key}:chunk-count`);
    if (count === null) return SecureStore.getItemAsync(key);
    const chunkCount = Number(count);
    if (!Number.isInteger(chunkCount) || chunkCount < 0 || chunkCount > 100) {
      throw new Error('Sesiunea securizată are un format invalid. Autentifică-te din nou.');
    }
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.getItemAsync(`${key}:chunk:${index}`)
      )
    );
    if (chunks.some((chunk) => chunk === null)) {
      throw new Error('Sesiunea securizată este incompletă. Autentifică-te din nou.');
    }
    return chunks.join('');
  },
  async setItem(key, value) {
    const codePoints = Array.from(value);
    const chunks = [];
    for (let index = 0; index < codePoints.length; index += 350) {
      chunks.push(codePoints.slice(index, index + 350).join(''));
    }
    const previousCount = Number(await SecureStore.getItemAsync(`${key}:chunk-count`) || 0);
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(`${key}:chunk:${index}`, chunk)
      )
    );
    await SecureStore.setItemAsync(`${key}:chunk-count`, String(chunks.length));
    await Promise.all(
      Array.from({ length: Math.max(0, previousCount - chunks.length) }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:chunk:${chunks.length + index}`)
      )
    );
    await SecureStore.deleteItemAsync(key);
  },
  async removeItem(key) {
    const count = Number(await SecureStore.getItemAsync(`${key}:chunk-count`) || 0);
    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(`${key}:chunk-count`),
      ...Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}:chunk:${index}`)
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
