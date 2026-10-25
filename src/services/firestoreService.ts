import { 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VaultFile } from '../types';
import { INITIAL_FILES } from '../data/initialFiles';

const FILES_COLLECTION = 'files';

export const subscribeToVaultFiles = (
  onFilesUpdate: (files: VaultFile[]) => void,
  onError?: (err: Error) => void
) => {
  try {
    const colRef = collection(db, FILES_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed with INITIAL_FILES so the user has immediate data
          seedInitialFiles().catch(console.error);
          onFilesUpdate(INITIAL_FILES);
          return;
        }
        const loaded: VaultFile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as VaultFile;
          loaded.push({ ...data, id: docSnap.id });
        });
        // Sort by timestamp descending
        loaded.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onFilesUpdate(loaded);
      },
      (error) => {
        console.warn('Firestore snapshot error, falling back to local state:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Firestore subscription failed:', err);
    if (onError) onError(err);
    return () => {};
  }
};

export const seedInitialFiles = async () => {
  try {
    for (const file of INITIAL_FILES) {
      const fileRef = doc(db, FILES_COLLECTION, file.id);
      await setDoc(fileRef, file, { merge: true });
    }
  } catch (err) {
    console.warn('Could not seed initial files to Firestore:', err);
  }
};

export const saveVaultFile = async (file: VaultFile): Promise<void> => {
  try {
    const fileRef = doc(db, FILES_COLLECTION, file.id);
    await setDoc(fileRef, file, { merge: true });
  } catch (err) {
    console.error('Error saving file to Firestore:', err);
    throw err;
  }
};

export const deleteVaultFileFromFirestore = async (fileId: string): Promise<void> => {
  try {
    const fileRef = doc(db, FILES_COLLECTION, fileId);
    await deleteDoc(fileRef);
  } catch (err) {
    console.error('Error deleting file from Firestore:', err);
    throw err;
  }
};

export const deleteBatchVaultFilesFromFirestore = async (fileIds: string[]): Promise<void> => {
  try {
    await Promise.all(
      fileIds.map((id) => deleteDoc(doc(db, FILES_COLLECTION, id)))
    );
  } catch (err) {
    console.error('Error batch deleting files from Firestore:', err);
    throw err;
  }
};
