
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/env';
import {
  randomHex,
  hmacSha256Hex,
  timingSafeEqual,
  encryptJson,
  decryptJson,
  isSealedEnvelope,
} from './crypto';

const isNative = Platform.OS !== 'web';
const WEB_SECRET_PREFIX = 'secure:';

let cachedDeviceKey: string | null = null;

async function readRawSecret(key: string): Promise<string | null> {
  if (isNative) return SecureStore.getItemAsync(key);
  return AsyncStorage.getItem(`${WEB_SECRET_PREFIX}${key}`);
}

async function writeRawSecret(key: string, value: string): Promise<void> {
  if (isNative) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
    return;
  }
  await AsyncStorage.setItem(`${WEB_SECRET_PREFIX}${key}`, value);
}

async function removeRawSecret(key: string): Promise<void> {
  if (isNative) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(`${WEB_SECRET_PREFIX}${key}`);
}

export async function getOrCreateDeviceKey(): Promise<string> {
  if (cachedDeviceKey) return cachedDeviceKey;

  const existing = await readRawSecret(STORAGE_KEYS.deviceKey);
  if (existing) {
    cachedDeviceKey = existing;
    return existing;
  }

  const created = await randomHex(32);
  await writeRawSecret(STORAGE_KEYS.deviceKey, created);
  cachedDeviceKey = created;
  return created;
}

export async function saveSecret(key: string, value: string): Promise<void> {
  await writeRawSecret(key, value);
}

export async function getSecret(key: string): Promise<string | null> {
  return readRawSecret(key);
}

export async function deleteSecret(key: string): Promise<void> {
  await removeRawSecret(key);
}

interface SealedRecordNative {
  payload: string;
  mac: string;
}

export async function saveSealed(key: string, value: unknown): Promise<void> {
  const deviceKey = await getOrCreateDeviceKey();

  if (isNative) {
    const payload = JSON.stringify(value);
    const mac = hmacSha256Hex(deviceKey, payload);
    const record: SealedRecordNative = { payload, mac };
    await AsyncStorage.setItem(key, JSON.stringify(record));
    return;
  }

  const envelope = await encryptJson(deviceKey, value);
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}


export async function getSealed<T = unknown>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  const deviceKey = await getOrCreateDeviceKey();

  try {
    const parsed = JSON.parse(raw);

    if (isSealedEnvelope(parsed)) {
      return decryptJson<T>(deviceKey, parsed);
    }

    if (parsed && typeof parsed.payload === 'string' && typeof parsed.mac === 'string') {
      const record = parsed as SealedRecordNative;
      const expectedMac = hmacSha256Hex(deviceKey, record.payload);
      if (!timingSafeEqual(expectedMac, record.mac)) {
        console.warn(`[secureStore] dados adulterados em "${key}", descartando.`);
        await AsyncStorage.removeItem(key);
        return null;
      }
      return JSON.parse(record.payload) as T;
    }

    console.warn(`[secureStore] formato desconhecido em "${key}", descartando.`);
    await AsyncStorage.removeItem(key);
    return null;
  } catch (e) {
    console.warn(`[secureStore] falha ao ler "${key}", descartando:`, e);
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function removeSealed(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * Migra o save antigo em texto puro (versões anteriores do app) para o
 * formato protegido, e remove o registro legado. Não sobrescreve um save
 * novo já existente.
 */
export async function migrateLegacyUserRecord<T = unknown>(newKey: string): Promise<T | null> {
  const legacyRaw = await AsyncStorage.getItem(STORAGE_KEYS.legacyUserRecord);
  if (!legacyRaw) return null;

  try {
    const legacyUser = JSON.parse(legacyRaw) as T;
    const alreadyMigrated = await AsyncStorage.getItem(newKey);
    if (!alreadyMigrated) {
      await saveSealed(newKey, legacyUser);
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.legacyUserRecord);
    console.warn('[secureStore] save antigo migrado para armazenamento protegido.');
    return legacyUser;
  } catch (e) {
    console.warn('[secureStore] falha ao migrar save antigo:', e);
    return null;
  }
}
