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
// @FIX: Import getMessaging and getToken from firebase/messaging to re-enable push notifications.
import { getMessaging as getFirebaseMessaging, getToken } from "firebase/messaging";
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
    // @FIX: Restore Firebase Messaging functionality if supported by the browser.
    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window) {
            return getFirebaseMessaging(app);
        }
    } catch (e) {
        console.error("Firebase Messaging is not supported in this environment.", e);
    }
    return null;
};

// Make auth functions available to the app
export { 
    app,
    auth, 
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
    // @FIX: Export getToken to be used in the NotificationBell component.
    getToken,
};
// @FIX: Explicitly re-export the User type as FirebaseUser to resolve module error.
export type { User as FirebaseUser };
