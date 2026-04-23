import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed the login popup before completion.");
      // We don't necessarily want to re-throw this as a critical error if it's user-initiated,
      // but if the user requested a fix, they might be seeing this unexpectedly.
    }
    console.error("Error signing in with Google", error);
    throw error;
  }
}

export async function logout() {
  await signOut(auth);
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  preferredLanguage: 'en' | 'hi';
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile) {
  const docRef = doc(db, 'users', profile.uid);
  await setDoc(docRef, {
    ...profile,
    createdAt: serverTimestamp()
  }, { merge: true });
}

export interface ScanRecord {
  userId: string;
  timestamp: any;
  cropImage: string;
  analysisResult: string;
  cropType: string;
  diseaseDetected: string;
  confidence: number;
}

export async function saveScan(scan: Omit<ScanRecord, 'timestamp'>) {
  await addDoc(collection(db, 'scans'), {
    ...scan,
    timestamp: serverTimestamp()
  });
}

export async function getUserScans(userId: string) {
  const q = query(collection(db, 'scans'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
