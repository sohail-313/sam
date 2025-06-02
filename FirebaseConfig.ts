import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDU8-jW1y5Wz8lFCfa28y4NRs_3KxeF-z0",
  authDomain: "fyi-expo.firebaseapp.com",
  projectId: "fyi-expo",
  storageBucket: "fyi-expo.firebasestorage.app",
  messagingSenderId: "143008470145",
  appId: "1:143008470145:web:0fba04e54a9b1f9b09a980",
  measurementId: "G-ZSEWM32NC6",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };


