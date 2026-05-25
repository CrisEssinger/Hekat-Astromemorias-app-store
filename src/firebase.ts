import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Garantir que o perfil do usuário exista no Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDocFromServer(userRef).catch(() => null);
    
    if (!userDoc?.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });
    }
    
    return user;
  } catch (error) {
    console.error("Erro ao autenticar com Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Testar conexão inicial conforme diretrizes
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Por favor, verifique sua configuração do Firebase.");
    }
  }
}
testConnection();
