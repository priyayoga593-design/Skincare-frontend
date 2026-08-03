// Script to delete the demo document// delete-demo-doc.js
import firebaseModule from "../src/firebase/firebase.js";
const { db } = firebaseModule;

import { doc, deleteDoc } from "firebase/firestore";

async function deleteDemoDoc() {
  try {
    const docRef = doc(db, "demoCollection", "TsGwJvWS9uVIiIjJU2iV");
    await deleteDoc(docRef);
    console.log("Document deleted successfully");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}

deleteDemoDoc();
