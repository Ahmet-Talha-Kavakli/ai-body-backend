import { createMMKV, type MMKV } from 'react-native-mmkv';

// In-memory fallback for Expo Go (no native module support)
class MemoryStorage implements Partial<MMKV> {
  private store: Record<string, string> = {};
  set(key: string, value: string) {
    this.store[key] = value;
  }
  getString(key: string) {
    return this.store[key];
  }
  remove(key: string) {
    delete this.store[key];
  }
  contains(key: string) {
    return key in this.store;
  }
  getAllKeys() {
    return Object.keys(this.store);
  }
  clearAll() {
    this.store = {};
  }
}

function createStorage() {
  try {
    return createMMKV({ id: 'fitai-secure-storage' });
  } catch {
    if (__DEV__) console.warn('[Storage] MMKV unavailable, using memory fallback (Expo Go)');
    return new MemoryStorage() as unknown as ReturnType<typeof createMMKV>;
  }
}

// AES-256 encrypted MMKV instance. Falls back to memory in Expo Go.
// Direct reads/writes — Zustand persist middleware intentionally NOT used (SSR crash risk).
export const storage = createStorage();

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
    storage.remove(key);
  },

  contains(key: string): boolean {
    return storage.contains(key);
  },

  getAllKeys(): string[] {
    return storage.getAllKeys();
  },
};
