// signup_test.js - test signup flow and Firestore document creation
import { auth, db } from "./src/firebase/firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";

(async () => {
  const ts = Date.now();
  const email = `test_user_${ts}@example.com`;
  const password = "TestPass123!";
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User created UID:", user.uid);
    // Wait a moment for auth-context to write to Firestore (if needed)
    await new Promise(r => setTimeout(r, 2000));
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      console.log("Firestore document exists:", userDoc.data());
    } else {
      console.error("Firestore document NOT found");
    }
    // Cleanup test data
    await deleteDoc(doc(db, "users", user.uid));
    console.log("Test document cleaned up.");
  } catch (e) {
    console.error("Test failed:", e);
  }
})();
