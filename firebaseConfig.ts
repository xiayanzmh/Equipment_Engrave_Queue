
import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDtm-13Eavq9c6zVy1qjB65WyY39SHO6zI",
  authDomain: "gen-lang-client-0550598157.firebaseapp.com",
  projectId: "gen-lang-client-0550598157",
  storageBucket: "gen-lang-client-0550598157.firebasestorage.app",
  messagingSenderId: "641579937846",
  appId: "1:641579937846:web:2fbc2859fd4a4ab9a3e897",
  measurementId: "G-9DCBN2E3S0"
};

// 1. Initialize the App (Namespaced Syntax)
// Check if apps are already initialized to avoid errors in strict mode
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Initialize Firestore
// Using the default database as v8 SDK does not standardly support named databases easily.
// If a specific named database is required, a newer SDK version (v9+) is recommended.
export const db = firebase.firestore();

console.log("Firebase initialized (Namespaced SDK) for default database");
