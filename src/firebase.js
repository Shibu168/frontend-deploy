// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification, // Add this
  applyActionCode, // Add this for email verification
  checkActionCode // Add this for email verification
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const registerWithEmailPassword = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmailPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const sendPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

// New email verification functions
export const sendVerificationEmail = (user) => {
  return sendEmailVerification(user);
};

export const verifyEmailAction = (oobCode) => {
  return checkActionCode(auth, oobCode);
};

export const applyEmailVerification = (oobCode) => {
  return applyActionCode(auth, oobCode);
};