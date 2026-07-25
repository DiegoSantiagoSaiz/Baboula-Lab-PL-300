const DB_NAME = 'dexel_mascot_db';
const STORE_NAME = 'media_assets';
const DB_VERSION = 1;

export function getDexelDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveMascotMedia(mood: string, blob: Blob | File): Promise<void> {
    const db = await getDexelDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, mood);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getMascotMedia(mood: string): Promise<Blob | null> {
    try {
        const db = await getDexelDb();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(mood);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB not accessible, falling back:", e);
        return null;
    }
}

export async function deleteMascotMedia(mood: string): Promise<void> {
    const db = await getDexelDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(mood);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
