import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDtm-13Eavq9c6zVy1qjB65WyY39SHO6zI",
  authDomain: "gen-lang-client-0550598157.firebaseapp.com",
  projectId: "gen-lang-client-0550598157",
  storageBucket: "gen-lang-client-0550598157.firebasestorage.app",
  messagingSenderId: "641579937846",
  appId: "1:641579937846:web:2fbc2859fd4a4ab9a3e897",
  measurementId: "G-9DCBN2E3S0"
};

// 1. Initialize the App
const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore
// Explicitly connecting to the named database 'customer-orders' to prevent timeouts
export const db = getFirestore(app, 'customer-orders');

// 3. Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

console.log("Firebase initialized (Modular SDK) for 'customer-orders' database");