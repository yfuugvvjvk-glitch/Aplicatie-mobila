import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const CACHE_PREFIX = '@TaskManager:v2';
const QUEUE_PREFIX = '@TaskManager:sync:v1';
const ENCRYPTION_KEY = '@TaskManager:offline-encryption-key';
const LEGACY_MIGRATION_KEY = '@TaskManager:encrypted-migration-complete';
const LEGACY_KEYS = ['@TaskManager:tasks', '@TaskManager:categories', '@TaskManager:user'];
let encryptionKeyPromise;

export const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Muncă', color: '#4A90E2', icon: '💼' },
  { id: '2', name: 'Personal', color: '#7ED321', icon: '🏠' },
  { id: '3', name: 'Sănătate', color: '#F5A623', icon: '💪' },
  { id: '4', name: 'Studiu', color: '#9B59B6', icon: '📚' },
  { id: '5', name: 'Cumpărături', color: '#E74C3C', icon: '🛒' },
];

const cacheKey = (userId) => `${CACHE_PREFIX}:${userId}`;
const queueKey = (userId) => `${QUEUE_PREFIX}:${userId}`;

function utf8Bytes(value) {
  const encoded = encodeURIComponent(value);
  const bytes = [];
  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === '%') {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(encoded.charCodeAt(index));
    }
  }
  return new Uint8Array(bytes);
}

function bytesToUtf8(bytes) {
  const encoded = Array.from(bytes, (byte) => `%${byte.toString(16).padStart(2, '0')}`).join('');
  return decodeURIComponent(encoded);
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error('Datele locale criptate sunt corupte.');
  }
  return new Uint8Array(hex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
}

function parseLegacyArray(json, label) {
  if (!json) return [];
  const data = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error(`Datele locale vechi (${label}) au un format invalid.`);
  return data;
}

async function migrateLegacyData(userId, currentData) {
  if (await AsyncStorage.getItem(LEGACY_MIGRATION_KEY)) return currentData;

  const legacyValues = await AsyncStorage.multiGet(LEGACY_KEYS);
  const legacyTasks = parseLegacyArray(legacyValues[0][1], 'task-uri');
  const legacyCategories = parseLegacyArray(legacyValues[1][1], 'categorii');
  const tasksById = new Map(legacyTasks.map((task) => [task.id, task]));
  const categoriesById = new Map(legacyCategories.map((category) => [category.id, category]));
  for (const task of currentData.tasks) tasksById.set(task.id, task);
  for (const category of currentData.categories) categoriesById.set(category.id, category);
  const migrated = {
    tasks: [...tasksById.values()],
    categories: [...categoriesById.values()],
  };

  const changes = await getPendingChanges(userId);
  const pendingIds = new Set(changes.map((change) => change.id));
  for (const task of legacyTasks) {
    const id = `legacy-task:${task.id}`;
    if (!pendingIds.has(id)) {
      changes.push({ id, entity: 'task', operation: 'upsert', record: task });
      pendingIds.add(id);
    }
  }
  for (const category of legacyCategories) {
    const id = `legacy-category:${category.id}`;
    if (!pendingIds.has(id)) {
      changes.push({ id, entity: 'category', operation: 'upsert', record: category });
      pendingIds.add(id);
    }
  }

  if (legacyValues.some(([, value]) => value !== null)) {
    await writeEncrypted(queueKey(userId), changes);
    await saveCachedData(userId, migrated);
  }
  await AsyncStorage.multiRemove(LEGACY_KEYS);
  await AsyncStorage.setItem(LEGACY_MIGRATION_KEY, 'true');
  return migrated;
}

async function getEncryptionKey() {
  if (!encryptionKeyPromise) {
    encryptionKeyPromise = (async () => {
      let keyHex = await SecureStore.getItemAsync(ENCRYPTION_KEY);
      if (!keyHex) {
        const key = await AESEncryptionKey.generate(256);
        keyHex = await key.encoded('hex');
        await SecureStore.setItemAsync(ENCRYPTION_KEY, keyHex);
      }
      return AESEncryptionKey.import(keyHex, 'hex');
    })();
  }
  try {
    return await encryptionKeyPromise;
  } catch (error) {
    encryptionKeyPromise = undefined;
    throw error;
  }
}

async function readEncrypted(key) {
  const encryptedHex = await AsyncStorage.getItem(key);
  if (!encryptedHex) return null;
  const encryptionKey = await getEncryptionKey();
  const sealedData = AESSealedData.fromCombined(hexToBytes(encryptedHex));
  const plaintext = await aesDecryptAsync(sealedData, encryptionKey, { output: 'bytes' });
  return JSON.parse(bytesToUtf8(plaintext));
}

async function writeEncrypted(key, value) {
  const encryptionKey = await getEncryptionKey();
  const sealedData = await aesEncryptAsync(utf8Bytes(JSON.stringify(value)), encryptionKey);
  await AsyncStorage.setItem(key, bytesToHex(await sealedData.combined()));
}

export async function getCachedData(userId) {
  const data = await readEncrypted(cacheKey(userId));
  const currentData = data ? {
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
  } : { tasks: [], categories: [] };
  return migrateLegacyData(userId, currentData);
}

export async function saveCachedData(userId, data) {
  await writeEncrypted(cacheKey(userId), data);
}

export async function getPendingChanges(userId) {
  const changes = await readEncrypted(queueKey(userId));
  if (!changes) return [];
  if (!Array.isArray(changes)) {
    throw new Error('Coada de sincronizare locală este invalidă.');
  }
  return changes;
}

export async function queueChange(userId, entity, operation, record) {
  const changes = await getPendingChanges(userId);
  changes.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    entity,
    operation,
    record,
  });
  await writeEncrypted(queueKey(userId), changes);
}

export async function removePendingChange(userId, changeId) {
  const changes = await getPendingChanges(userId);
  await writeEncrypted(queueKey(userId), changes.filter((change) => change.id !== changeId));
}
