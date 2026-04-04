// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbm9nfgwgtYTgYJZnZt2pxUB6RolGYjsg",
  authDomain: "mievento-1679a.firebaseapp.com",
  projectId: "mievento-1679a",
  storageBucket: "mievento-1679a.firebasestorage.app",
  messagingSenderId: "752321842488",
  appId: "1:752321842488:web:f66277e02ffe2df44b05cd",
  measurementId: "G-XTTJVQ1Y38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);