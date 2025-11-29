import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import GoogleAuthProvider
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNNWjs4aoGpEpHhHqtZ8uVCA86VPkxvYw",
  authDomain: "software-121340.firebaseapp.com",
  projectId: "software-121340",
  storageBucket: "software-121340.firebasestorage.app",
  messagingSenderId: "322241220296",
  appId: "1:322241220296:web:5194200d481c1ffa639ffd",
  measurementId: "G-VGWYDNDXW1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the Provider
export const googleProvider = new GoogleAuthProvider();