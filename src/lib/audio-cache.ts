"use client";

const DB_NAME = "english-climb-audio";
const STORE_NAME = "tts-cache";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedCloudAudio(cacheKey: string) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  const db = await openDb();

  return new Promise<Blob | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(cacheKey);

    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedCloudAudio(cacheKey: string, blob: Blob) {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const db = await openDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).put(blob, cacheKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCloudAudioCacheStats() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return { entries: 0, bytes: 0 };
  }

  const db = await openDb();

  return new Promise<{ entries: number; bytes: number }>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const blobs = (request.result as Blob[]) ?? [];
      resolve({
        entries: blobs.length,
        bytes: blobs.reduce((total, blob) => total + blob.size, 0)
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearCachedCloudAudio() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Audio cache database is blocked."));
  });
}
