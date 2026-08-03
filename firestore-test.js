// Firestore test script
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
const db = getFirestore(app);

async function listUsers() {
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(usersCol);
    console.log("Firestore users collection documents:");
    snapshot.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (err) {
    console.error("Error reading Firestore:", err);
  }
}

listUsers();
