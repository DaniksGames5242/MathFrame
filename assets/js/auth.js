import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBaxewKo6Aoi5nTOcjkZfvg0IyKssWR5us",
  authDomain: "mathframe-ff436.firebaseapp.com",
  projectId: "mathframe-ff436",
  storageBucket: "mathframe-ff436.firebasestorage.app",
  messagingSenderId: "470778322895",
  appId: "1:470778322895:web:7180eccc946e907bcbbcba",
  measurementId: "G-NQ0NFKH0N1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Функции
async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

async function loginWithApple() {
  return signInWithPopup(auth, appleProvider);
}

async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

async function loginWithPhoneNumber(phoneNumber, recaptchaVerifier) {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

function createRecaptchaVerifier(containerId) {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {}
  });
}

async function logout() {
  return signOut(auth);
}

async function updateUserProfile(displayName) {
  const user = auth.currentUser;
  if (user) {
    return updateProfile(user, { displayName });
  }
}

// Глобальный объект
window.Auth = {
  loginWithGoogle,
  loginWithApple,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  loginWithPhoneNumber,
  createRecaptchaVerifier,
  logout,
  updateUserProfile,
  onAuthChange: (callback) => onAuthStateChanged(auth, callback),
  getCurrentUser: () => auth.currentUser
};

// Оповещаем, что Auth готов
document.dispatchEvent(new Event('authReady'));