// Firebase initialization for Skincare app
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBkt4W64w_VijMH4pAuac8P3nn3OpvkQe4",
  authDomain: "skincare-69db1.firebaseapp.com",
  projectId: "skincare-69db1",
  storageBucket: "skincare-69db1.firebasestorage.app",
  messagingSenderId: "372980749945",
  appId: "1:372980749945:web:2f624b9ea2708ff5ae26a8",
  measurementId: "G-CX3DZF4ZYG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut, onAuthStateChanged };
