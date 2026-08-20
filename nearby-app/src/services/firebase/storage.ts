import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firestore';
import { compressImage } from '../../utils/imageCompressor';

export const storage = getStorage(app);

export async function uploadToStorage(path: string, fileOrDataUrl: File | Blob | string): Promise<string> {
  try {
    let blob: Blob;
    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:')) {
        const res = await fetch(fileOrDataUrl);
        blob = await res.blob();
      } else {
        return fileOrDataUrl;
      }
    } else {
      blob = fileOrDataUrl;
    }

    const storageRef = sRef(storage, `${path}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, blob);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn("Storage upload failed, returning data as fallback:", err);
    if (typeof fileOrDataUrl === 'string') return fileOrDataUrl;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileOrDataUrl as Blob);
    });
  }
}

export async function compressAndUploadImage(file: File, pathPrefix: string, maxWidth = 1080): Promise<string> {
  const compressed = await compressImage(file, maxWidth);
  return uploadToStorage(pathPrefix, compressed);
}
