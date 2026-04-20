export class MMKV {
  private store: Record<string, string> = {};
  set(key: string, value: string) {
    this.store[key] = value;
  }
  getString(key: string) {
    return this.store[key];
  }
  delete(key: string) {
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
