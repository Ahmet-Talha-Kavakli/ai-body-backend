import { MMKV } from 'react-native-mmkv';

// AES-256 encrypted MMKV instance.
// encryptionKey is set at runtime by SecurityProvider after Keychain retrieval.
// Direct MMKV reads/writes — Zustand persist middleware is intentionally NOT used (SSR crash risk).
export const storage = new MMKV({ id: 'fitai-secure-storage' });

export const typedStorage = {
  set(key: string, value: string): void {
    storage.set(key, value);
  },

  getString(key: string): string | undefined {
    return storage.getString(key);
  },

  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },

  getObject<T>(key: string): T | undefined {
    const raw = storage.getString(key);
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  delete(key: string): void {
    storage.delete(key);
  },

  contains(key: string): boolean {
    return storage.contains(key);
  },

  getAllKeys(): string[] {
    return storage.getAllKeys();
  },
};
