import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqsnfXd3Q9kbAaqMRoOECdJY2m36EngAA",
  authDomain: "personal-chatbot-a5c1f.firebaseapp.com",
  projectId: "personal-chatbot-a5c1f",
  storageBucket: "personal-chatbot-a5c1f.firebasestorage.app",
  messagingSenderId: "116403394849",
  appId: "1:116403394849:web:3cdc3194063d27f314c660",
  measurementId: "G-D3P60Q34BR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
