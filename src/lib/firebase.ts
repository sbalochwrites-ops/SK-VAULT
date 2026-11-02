import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configData from '../../firebase-applet-config.json' with { type: 'json' };

const app = getApps().length === 0 ? initializeApp(configData) : getApps()[0];

const dbId = (configData as Record<string, string>).firestoreDatabaseId || 'ai-studio-skvault-dc5db536-5e14-4d44-b0e1-809cbc9a4386';

export const db = dbId
  ? getFirestore(app, dbId)
  : getFirestore(app);

export const auth = getAuth(app);
export const firebaseConfig = configData;
