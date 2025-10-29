// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIgwHL2_oAbcTr9jpGcURnTseIaAkica4",
  authDomain: "ai-edu-graduates.firebaseapp.com",
  projectId: "ai-edu-graduates",
  storageBucket: "ai-edu-graduates.firebasestorage.app",
  messagingSenderId: "745004327373",
  appId: "1:745004327373:web:3fa580fdda4cc48080e484",
  measurementId: "G-2FDRK3JRBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { db, auth, analytics, googleProvider, storage };
