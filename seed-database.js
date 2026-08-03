// Script to explicitly create Firestore collections ('users', 'scans') by inserting a dummy document.
// Run this with: node seed-database.js

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function seedDatabase() {
  console.log("Seeding Firestore database...");
  
  try {
    const dummyUid = "system_dummy_user";
    const dummyScanId = "system_dummy_scan_1";

    // 1. Create a document in the 'users' collection
    console.log("Creating document in 'users' collection...");
    await setDoc(doc(db, "users", dummyUid), {
      email: "dummy@skincare360.local",
      profile: {
        name: "Dummy User",
        age: 25,
        gender: "Female",
        goals: ["Hydration"],
        allergies: [],
        lastScan: "Just now"
      },
      registrationDate: new Date().toLocaleDateString(),
      lastLogin: new Date().toLocaleString(),
      isDummy: true
    });
    console.log("✅ 'users' collection created (or updated).");

    // 2. Create a document in the 'scans' sub-collection
    console.log("Creating document in 'scans' sub-collection...");
    await setDoc(doc(db, "users", dummyUid, "scans", dummyScanId), {
      id: dummyScanId,
      date: new Date().toLocaleString(),
      method: "system_seed",
      imageQuality: "good",
      skinType: "Normal",
      healthScore: 100,
      isDummy: true
    });
    console.log("✅ 'scans' collection created (or updated) under user:", dummyUid);

    console.log("\nDatabase seeded successfully! You can now view 'users' and their 'scans' in the Firebase Console.");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error seeding database:", error.message);
    if (error.code === 'permission-denied') {
      console.log("--> Your Firestore rules are currently blocking writes from unauthenticated sources.");
      console.log("--> To fix this during development, go to Firebase Console -> Firestore Database -> Rules, and set:");
      console.log("    allow read, write: if true;");
    }
    process.exit(1);
  }
}

seedDatabase();
