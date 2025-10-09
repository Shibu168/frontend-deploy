import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// ✅ ADD THIS: Export the app instance
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

// ... rest of your existing exports remain the same
export const registerWithEmailPassword = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmailPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const sendPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const sendVerificationEmail = (user) => {
  return sendEmailVerification(user);
};

export const verifyEmailAction = (oobCode) => {
  return checkActionCode(auth, oobCode);
};

export const applyEmailVerification = (oobCode) => {
  return applyActionCode(auth, oobCode);
};

export const linkEmailPasswordToGoogle = async (email, password) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user signed in');
  }
  
  const credential = EmailAuthProvider.credential(email, password);
  return await linkWithCredential(user, credential);
};

export const checkEmailExists = async (email) => {
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch (error) {
    console.log('[DEBUG] Error checking email methods:', error);
    return [];
  }
};

export const trySignInAndGetUserInfo = async (email, password) => {
  try {
    const result = await signInWithEmailPassword(email, password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error };
  }
};