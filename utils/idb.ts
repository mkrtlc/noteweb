/** Tiny IndexedDB key/value store for things localStorage can't hold (CryptoKeys, file handles). */
const DB_NAME = 'noteweb';
const STORE = 'kv';

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
};

export const idbGet = <T,>(key: string) => tx<T | undefined>('readonly', s => s.get(key)).catch(() => undefined);
export const idbSet = (key: string, value: unknown) => tx('readwrite', s => s.put(value, key));
export const idbDel = (key: string) => tx('readwrite', s => s.delete(key));
