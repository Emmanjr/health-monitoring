import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBWc8eyJnEbZZJIbw0DTJmzc-HZzP_7XZ8",
    authDomain: "health-monitor-c06c4.firebaseapp.com",
    projectId: "health-monitor-c06c4",
    storageBucket: "health-monitor-c06c4.firebasestorage.app",
    messagingSenderId: "616103468978",
    appId: "1:616103468978:web:4215e4ace633ac5f000eab",
    measurementId: "G-4X9CQS9E5D"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
