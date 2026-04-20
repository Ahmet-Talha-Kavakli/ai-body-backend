import { useSyncQueueStore, SyncOperation } from '../../../src/stores/syncQueue';
import { storage, typedStorage } from '../../../src/lib/storage';

const op: SyncOperation = {
  id: 'op-1',
  type: 'meal_log',
  payload: { mealId: '123' },
  createdAt: Date.now(),
  retries: 0,
};

describe('syncQueue', () => {
  beforeEach(() => {
    storage.clearAll();
    useSyncQueueStore.setState({ queue: [], isSyncing: false });
  });

  it('adds operation to queue', () => {
    useSyncQueueStore.getState().enqueue(op);
    expect(useSyncQueueStore.getState().queue).toHaveLength(1);
  });

  it('removes operation after dequeue', () => {
    useSyncQueueStore.getState().enqueue(op);
    useSyncQueueStore.getState().dequeue(op.id);
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it('persists queue to MMKV on enqueue', () => {
    useSyncQueueStore.getState().enqueue(op);
    const saved = typedStorage.getObject<SyncOperation[]>('sync_queue');
    expect(saved).toHaveLength(1);
  });
});
