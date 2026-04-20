import { storage, typedStorage } from '../../../src/lib/storage';

describe('typedStorage', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('stores and retrieves a string', () => {
    typedStorage.set('testKey', 'hello');
    expect(typedStorage.getString('testKey')).toBe('hello');
  });

  it('stores and retrieves an object', () => {
    const obj = { id: '1', name: 'test' };
    typedStorage.setObject('obj', obj);
    expect(typedStorage.getObject('obj')).toEqual(obj);
  });

  it('deletes a key', () => {
    typedStorage.set('del', 'value');
    typedStorage.delete('del');
    expect(typedStorage.getString('del')).toBeUndefined();
  });

  it('returns undefined for missing key', () => {
    expect(typedStorage.getString('nonexistent')).toBeUndefined();
  });
});
