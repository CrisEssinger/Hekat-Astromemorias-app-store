import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suporte para carregar credenciais dinâmicas em ambientes externos (como Vercel)
const resolvedConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || "ai-studio-fcf53257-735c-47bf-b827-d142cabebb63"
};

console.log("Portal Hekat: Iniciando módulos do Firebase com parâmetros de segurança da versão 2.1.0-fix...");

let app: any = null;
try {
  app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();
  console.log("Portal Hekat: Firebase App carregado de modo preventivo.");
} catch (e) {
  console.error("Portal Hekat: Erro crítico ao iniciar o Firebase App:", e);
}

export let auth: any = null;
try {
  if (app) {
    auth = getAuth(app);
    console.log("Portal Hekat: Firebase Auth estabelecido com segurança.");
  }
} catch (e) {
  console.error("Portal Hekat: Erro ao instanciar o Firebase Auth:", e);
}

export let db: any = null;
try {
  if (app) {
    db = getFirestore(app, resolvedConfig.firestoreDatabaseId);
    console.log("Portal Hekat: Firestore configurado para utilizar banco:", resolvedConfig.firestoreDatabaseId);
  }
} catch (e) {
  console.error("Portal Hekat: Erro ao instanciar a referência do Firestore:", e);
}

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("O mecanismo de Autenticação do Firebase não está ativo no portal neste instante.");
  }
  const googleProvider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    if (db) {
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
    }
    
    return user;
  } catch (error) {
    console.error("Erro ao autenticar com Google:", error);
    throw error;
  }
};

export const logout = () => {
  if (!auth) {
    return Promise.resolve();
  }
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn("Portal Hekat: Canal de Auth indisponível, invocando callback vazio.");
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Testar conexão inicial de forma passiva sem vazar erros assíncronos não capturados
async function testConnection() {
  if (!db) {
    console.warn("Portal Hekat: Teste de sincronização ignorado (banco inconsciente).");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Portal Hekat: O cliente encontra-se síncrono, mas operando offline.");
    }
  }
}

try {
  testConnection();
} catch (e) {
  console.error("Portal Hekat: Erro síncrono amortecido no teste de conexão:", e);
}
