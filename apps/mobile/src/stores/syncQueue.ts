// Zustand in-memory store — NO persist middleware (SSR crash risk).
// MMKV persistence is manual: hydrate() on app start, write on every mutation.
import { create } from 'zustand';
import { typedStorage } from '../lib/storage';

export type SyncOperation = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
  retries: number;
};

const STORAGE_KEY = 'sync_queue';

type SyncQueueState = {
  queue: SyncOperation[];
  isSyncing: boolean;
  enqueue: (op: SyncOperation) => void;
  dequeue: (id: string) => void;
  incrementRetry: (id: string) => void;
  hydrate: () => void;
};

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  queue: [],
  isSyncing: false,

  enqueue(op) {
    const next = [...get().queue, op];
    set({ queue: next });
    typedStorage.setObject(STORAGE_KEY, next);
  },

  dequeue(id) {
    const next = get().queue.filter((o) => o.id !== id);
    set({ queue: next });
    typedStorage.setObject(STORAGE_KEY, next);
  },

  incrementRetry(id) {
    const next = get().queue.map((o) => (o.id === id ? { ...o, retries: o.retries + 1 } : o));
    set({ queue: next });
    typedStorage.setObject(STORAGE_KEY, next);
  },

  hydrate() {
    const saved = typedStorage.getObject<SyncOperation[]>(STORAGE_KEY);
    if (saved) set({ queue: saved });
  },
}));
