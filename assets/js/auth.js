// Firebase compat SDK должна быть подключена в index.html до этого скрипта

const firebaseConfig = {
  apiKey: "AIzaSyBaxewKo6Aoi5nTOcjkZfvg0IyKssWR5us",
  authDomain: "mathframe-ff436.firebaseapp.com",
  projectId: "mathframe-ff436",
  storageBucket: "mathframe-ff436.firebasestorage.app",
  messagingSenderId: "470778322895",
  appId: "1:470778322895:web:7180eccc946e907bcbbcba"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const storage = firebase.storage();

const googleProvider = new firebase.auth.GoogleAuthProvider();
const appleProvider = new firebase.auth.OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

const AuthAPI = {
  loginWithGoogle: () => auth.signInWithPopup(googleProvider),
  loginWithApple: () => auth.signInWithPopup(appleProvider),
  loginWithEmail: (email, password) => auth.signInWithEmailAndPassword(email, password),
  registerWithEmail: (email, password) => auth.createUserWithEmailAndPassword(email, password),
  resetPassword: (email) => auth.sendPasswordResetEmail(email),
  loginWithPhoneNumber: (phoneNumber, recaptchaVerifier) =>
    auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier),
  createRecaptchaVerifier: (containerId) =>
    new firebase.auth.RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: () => {}
    }),
  logout: () => auth.signOut(),
  updateUserProfile: (displayName, photoURL) => {
    const user = auth.currentUser;
    if (user) {
      const profile = { displayName };
      if (photoURL) profile.photoURL = photoURL;
      return user.updateProfile(profile);
    }
    return Promise.resolve();
  },
  onAuthChange: (callback) => auth.onAuthStateChanged(callback),
  getCurrentUser: () => auth.currentUser,

  // Загрузка аватара в Firebase Storage и получение URL
  uploadAvatar: (file) => {
    const user = auth.currentUser;
    if (!user) return Promise.reject('Не авторизован');
    const storageRef = storage.ref(`avatars/${user.uid}/${file.name}`);
    return storageRef.put(file).then(() => storageRef.getDownloadURL());
  }
};

window.Auth = AuthAPI;
document.dispatchEvent(new Event('authReady'));