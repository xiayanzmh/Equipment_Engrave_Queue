
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
// Connect explicitly to the 'customer-orders' database ID to fix timeout/connection hanging issues.
export const db = getFirestore(app, 'customer-orders');

console.log("Firebase initialized (Modular SDK) for 'customer-orders' database");
