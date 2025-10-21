// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  getRedirectResult, 
  signInWithRedirect,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { getMessaging as getFirebaseMessaging, getToken, isSupported } from "firebase/messaging";
import type { User } from "firebase/auth";

// Your web app's Firebase configuration
// This is where you pasted your configuration code
const firebaseConfig = {
  apiKey: "AIzaSyB1G6oWz0Zip_nz9_Aylr2HVuTNgl5bz7s",
  authDomain: "fresco-menu.web.app",
  projectId: "fresco-menu",
  storageBucket: "fresco-menu.appspot.com",
  messagingSenderId: "904925567549",
  appId: "1:904925567549:web:030fa370bc380d2fa2a854"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth instance
const auth = getAuth(app);

// We only export a getter for messaging that returns null if not supported
export const getMessaging = async () => {
    if (await isSupported()) {
        return getFirebaseMessaging(app);
    }
    console.log("Firebase Messaging is not supported in this browser.");
    return null;
};

// Make auth functions available to the app
export { 
    app,
    auth, 
    getToken,
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    getRedirectResult, 
    signInWithRedirect,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile,
    sendPasswordResetEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
};
// @FIX: Explicitly re-export the User type as FirebaseUser to resolve module error.
export type { User as FirebaseUser };
