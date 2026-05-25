import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
      // Return existing initialized db or re-initialize if needed
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    db = getFirestore(app);
    return { app, db };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = null;
    db = null;
    return null;
  }
};

export const getFirebaseDB = () => db;
