import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configData from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(configData) : getApps()[0];

export const db = configData.firestoreDatabaseId
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const firebaseConfig = configData;
