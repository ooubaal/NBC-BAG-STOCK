import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

let app = null;
let db = null;

export const initFirebase = (config) => {
  if (!config || !config.apiKey || !config.projectId) {
    app = null;
    db = null;
    return null;
  }
  try {
    const apps = getApps();
    if (apps.length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    
    // Enable persistent local cache with multi-tab support
    // This serves existing docs from IndexedDB and avoids burning Firestore reads on page reloads!
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // Fallback if already initialized (e.g. HMR or multiple calls)
      db = getFirestore(app);
    }

    return { app, db };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = null;
    db = null;
    return null;
  }
};

export const getFirebaseDB = () => db;
