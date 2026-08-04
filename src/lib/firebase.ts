import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, writeBatch, runTransaction } from 'firebase/firestore';

// Your custom Firebase configuration provided
const firebaseConfig = {
  apiKey: "AIzaSyDkV1L6NmMbdyWsWumy_5yzQjYBDBh1EPE",
  authDomain: "dudu-6e819.firebaseapp.com",
  projectId: "dudu-6e819",
  storageBucket: "dudu-6e819.firebasestorage.app",
  messagingSenderId: "29999650326",
  appId: "1:29999650326:web:a5e78c696bd53770e6c737"
};

// Initialize App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Standardize Google login prompt
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Wrapped version of writeBatch that logs when commit() is executed
 */
export function loggedWriteBatch(dbInstance: any) {
  const batch = writeBatch(dbInstance);
  const originalCommit = batch.commit.bind(batch);
  batch.commit = async function() {
    console.count("[WRITE] writeBatch.commit");
    console.log({
      function: "writeBatch.commit",
      reason: "batchWrite",
      time: new Date().toISOString()
    });
    return await originalCommit();
  };
  return batch;
}

/**
 * Wrapped version of runTransaction that logs when executed
 */
export async function loggedRunTransaction(dbInstance: any, updateFunction: any) {
  console.count("[WRITE] runTransaction");
  console.log({
    function: "runTransaction",
    reason: "transactionWrite",
    time: new Date().toISOString()
  });
  return await runTransaction(dbInstance, updateFunction);
}
