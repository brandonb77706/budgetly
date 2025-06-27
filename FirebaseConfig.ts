import { initializeApp } from "@firebase/app";
import { initializeAuth, getReactNativePersistence } from "@firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTlsWizTEYJ6fMD87MKMTU-uHFTFLXZEA",
  authDomain: "budgetly-two.firebaseapp.com",
  projectId: "budgetly-two",
  storageBucket: "budgetly-two.firebasestorage.app",
  messagingSenderId: "725769040409",
  appId: "1:725769040409:web:2c1411e8b734f39e5c7088",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
