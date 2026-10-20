// src/utils/idb.js
// High-capacity browser storage using IndexedDB (no 5MB LocalStorage quota limit)

const DB_NAME = 'nbc_stock_db';
const STORE_NAME = 'cache_store';
const DB_VERSION = 1;

let dbPromise = null;

const getDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => {
        console.warn("IndexedDB open warning:", e.target?.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("IndexedDB initialization failed:", err);
      resolve(null);
    }
  });
  return dbPromise;
};

export const idbGet = async (key) => {
  try {
    const db = await getDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch (e) {
        console.warn("idbGet transaction error:", e);
        resolve(null);
      }
    });
  } catch (err) {
    console.warn("idbGet error:", err);
    return null;
  }
};

export const idbSet = async (key, val) => {
  try {
    const db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(val, key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => {
          console.warn("idbSet transaction error:", e.target?.error);
          resolve();
        };
      } catch (e) {
        console.warn("idbSet transaction error:", e);
        resolve();
      }
    });
  } catch (err) {
    console.warn("idbSet error:", err);
  }
};

export const idbDel = async (key) => {
  try {
    const db = await getDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        console.warn("idbDel transaction error:", e);
        resolve();
      }
    });
  } catch (err) {
    console.warn("idbDel error:", err);
  }
};
