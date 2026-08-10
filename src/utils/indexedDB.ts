/**
 * IndexedDB helper for local binary storage of Pet Profile Images.
 * This completely avoids bloating LocalStorage and Cloud Firestore documents,
 * supporting high-performance offline-first binary asset management.
 */

const DB_NAME = 'PigtownPetImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'profileImages';

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported by this browser.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB.'));
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Saves a pet's profile image as a Blob in IndexedDB.
 */
export async function savePetImage(petId: string, imageBlob: Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(imageBlob, petId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error(`Failed to save image for ${petId}`));
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error(`savePetImage failed for ${petId}:`, error);
  }
}

/**
 * Retrieves a pet's profile image Blob from IndexedDB.
 */
export async function getPetImage(petId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(petId);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.error(`Error fetching image for pet ${petId}:`, request.error);
          resolve(null); // Resolve with null on error to avoid breaking UI flows
        };
      } catch (error) {
        console.error(`IndexedDB exception for pet ${petId}:`, error);
        resolve(null);
      }
    });
  } catch (err) {
    console.error(`getPetImage failed for pet ${petId}:`, err);
    return null;
  }
}

/**
 * Deletes a pet's profile image from IndexedDB.
 */
export async function deletePetImage(petId: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(petId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error(`Failed to delete image for ${petId}`));
      } catch (error) {
        reject(error);
      }
    });
  } catch (err) {
    console.error(`deletePetImage failed for pet ${petId}:`, err);
  }
}

/**
 * Retrieves all locally stored pet images.
 * Useful for future migrations (e.g., uploading to Firebase Storage).
 */
export async function getAllLocalPetImages(): Promise<Record<string, Blob>> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const results: Record<string, Blob> = {};
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          results[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => {
        console.error('Error fetching all images for migration:', request.error);
        resolve(results); // return what we have so far
      };
    } catch (error) {
      console.error('IndexedDB exception fetching all images:', error);
      resolve({});
    }
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Failed to convert dataUrl to Blob:', err);
    return null;
  }
}

export async function getAllPetImagesAsDataUrls(): Promise<Record<string, string>> {
  try {
    const blobs = await getAllLocalPetImages();
    const result: Record<string, string> = {};
    for (const [petId, blob] of Object.entries(blobs)) {
      if (blob && blob instanceof Blob) {
        try {
          const dataUrl = await blobToDataUrl(blob);
          result[petId] = dataUrl;
        } catch (e) {
          console.error(`Failed to convert image blob for ${petId}:`, e);
        }
      }
    }
    return result;
  } catch (err) {
    console.error('getAllPetImagesAsDataUrls failed:', err);
    return {};
  }
}

export async function savePetImagesFromDataUrls(dataUrls: Record<string, string>): Promise<void> {
  if (!dataUrls || typeof dataUrls !== 'object') return;
  for (const [petId, dataUrl] of Object.entries(dataUrls)) {
    if (petId && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      const blob = dataUrlToBlob(dataUrl);
      if (blob) {
        await savePetImage(petId, blob);
      }
    }
  }
}

