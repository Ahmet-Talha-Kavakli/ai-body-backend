class MMKVInstance {
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
  getAllKeys() {
    return Object.keys(this.store);
  }
  clearAll() {
    this.store = {};
  }
  contains(key: string) {
    return key in this.store;
  }
}

// v4 API: createMMKV factory function
export function createMMKV(_config?: { id?: string }) {
  return new MMKVInstance();
}

// Keep MMKV type export for backwards compat
export type MMKV = MMKVInstance;
