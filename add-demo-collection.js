// Script to create a new Firestore collection and add a sample document
// This script creates its own Firebase app instance so it works independently.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkt4W64w_VijMH4pAuac8P3nn3OpvkQe4",
  authDomain: "skincare-69db1.firebaseapp.com",
  projectId: "skincare-69db1",
  storageBucket: "skincare-69db1.firebasestorage.app",
  messagingSenderId: "372980749945",
  appId: "1:372980749945:web:2f624b9ea2708ff5ae26a8",
  measurementId: "G-CX3DZF4ZYG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createDemoCollection() {
  try {
    const collRef = collection(db, "demoCollection");
    const docRef = await addDoc(collRef, {
      title: "Demo Document",
      description: "This is a test document created by the Antigravity assistant.",
      createdAt: serverTimestamp(),
    });
    console.log("Document created with ID:", docRef.id);
  } catch (error) {
    console.error("Error creating collection/document:", error);
  }
}

createDemoCollection();
