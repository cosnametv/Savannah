// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAH0tLjd1bOMxv-ez7QC3VkZ1-_hqQjWXM",
  authDomain: "savannah-herds.firebaseapp.com",
  projectId: "savannah-herds",
  storageBucket: "savannah-herds.firebasestorage.app",
  messagingSenderId: "64373822353",
  appId: "1:64373822353:web:a2f5aeab168bfd7cf08030"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const database = getDatabase(app);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export services
export { database, auth, db };