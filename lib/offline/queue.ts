/** IndexedDB queue for kaza actions taken while offline. */

const DB_NAME = 'salat-offline';
const STORE = 'kaza-queue';

export interface QueuedKazaAction {
  id: string;
  prayer: string;
  action: 'increment' | 'decrement';
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueKazaAction(
  prayer: string,
  action: 'increment' | 'decrement',
): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      id: crypto.randomUUID(),
      prayer,
      action,
      timestamp: Date.now(),
    } satisfies QueuedKazaAction);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getKazaQueue(): Promise<QueuedKazaAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedKazaAction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeKazaAction(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearKazaQueue(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Cancel the most recent unsynced increment for a prayer (offline undo). */
export async function cancelLastIncrement(prayer: string): Promise<boolean> {
  const queue = await getKazaQueue();
  const increments = queue
    .filter(a => a.prayer === prayer && a.action === 'increment')
    .sort((a, b) => b.timestamp - a.timestamp);
  if (!increments.length) return false;
  await removeKazaAction(increments[0].id);
  return true;
}
