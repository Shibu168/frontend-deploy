// firebase.js
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
  EmailAuthProvider
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

// FIXED: Enhanced registration function that properly handles existing accounts
export const registerWithEmailPassword = async (email, password) => {
  try {
    // First check if email exists and how it's registered
    const methods = await fetchSignInMethodsForEmail(auth, email);
    
    console.log('[DEBUG] Sign-in methods for', email, ':', methods);
    
    if (methods.length > 0) {
      // If user exists with Google but not password
      if (methods.includes('google.com') && !methods.includes('password')) {
        const error = new Error('EMAIL_EXISTS_WITH_GOOGLE');
        error.code = 'auth/email-already-in-use';
        throw error;
      }
      // If email exists with password provider
      else if (methods.includes('password')) {
        const error = new Error('EMAIL_ALREADY_IN_USE');
        error.code = 'auth/email-already-in-use';
        throw error;
      }
    }
    
    // If email doesn't exist or has no password, create new account
    console.log('[DEBUG] Creating new account for:', email);
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.log('[DEBUG] registerWithEmailPassword error:', error);
    
    // If Firebase throws email-already-in-use, check the actual methods
    if (error.code === 'auth/email-already-in-use') {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        console.log('[DEBUG] Re-checking methods after error:', methods);
        
        if (methods.includes('google.com') && !methods.includes('password')) {
          const newError = new Error('EMAIL_EXISTS_WITH_GOOGLE');
          newError.code = 'auth/email-already-in-use';
          throw newError;
        } else if (methods.includes('password')) {
          const newError = new Error('EMAIL_ALREADY_IN_USE');
          newError.code = 'auth/email-already-in-use';
          throw newError;
        }
      } catch (methodsError) {
        console.log('[DEBUG] Error checking methods:', methodsError);
      }
    }
    
    throw error;
  }
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

// Link email/password to existing Google account
export const linkEmailPasswordToGoogle = async (email, password) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user signed in');
  }
  
  const credential = EmailAuthProvider.credential(email, password);
  return await linkWithCredential(user, credential);
};

// Check email sign-in methods
export const checkEmailExists = async (email) => {
  return await fetchSignInMethodsForEmail(auth, email);
};