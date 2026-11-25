import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from "firebase/auth";

let app = null;
let db = null;
let auth = null;

export const initFirebase = (config) => {
  if (!config || !config.apiKey || !config.projectId) {
    app = null;
    db = null;
    auth = null;
    return null;
  }
  try {
    const apps = getApps();
    if (apps.length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    
    // Initialize Firebase Auth
    try {
      auth = getAuth(app);
    } catch (authErr) {
      console.warn("Auth initialization warning:", authErr);
      auth = null;
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

    return { app, db, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = null;
    db = null;
    auth = null;
    return null;
  }
};

export const getFirebaseDB = () => db;
export const getFirebaseAuth = () => auth;

export const loginWithGoogle = async () => {
  if (!auth) {
    throw new Error("ยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาตั้งค่า Firebase ในเมนูตั้งค่าก่อน");
  }
  const provider = new GoogleAuthProvider();
  // Prompt user to select an account each time
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logoutFirebase = async () => {
  if (!auth) return;
  await fbSignOut(auth);
};

export const subscribeAuthState = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
