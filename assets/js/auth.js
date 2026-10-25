// auth.js – инициализация Firebase и экспорт API

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
appleProvider.setCustomParameters({ locale: 'ru_RU' });
googleProvider.setCustomParameters({ prompt: 'select_account' });
auth.languageCode = 'ru';

// Всплывающее окно не работает в установленном на экран «Домой» PWA, во
// встроенных браузерах (Telegram, Instagram, VK) и при блокировке попапов —
// там переходим на redirect-поток. Результат redirect подбирается после
// возврата на сайт через consumeRedirectResult().
const POPUP_FALLBACK_CODES = [
    'auth/popup-blocked',
    'auth/operation-not-supported-in-this-environment',
    'auth/web-storage-unsupported',
];
function popupUnsupported() {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    const inApp = /FBAN|FBAV|Instagram|Line\/|Telegram|VKClient|; wv\)/i.test(navigator.userAgent || '');
    return standalone || inApp;
}
async function socialSignIn(provider) {
    if (popupUnsupported()) {
        await auth.signInWithRedirect(provider);
        return null;
    }
    try {
        return await auth.signInWithPopup(provider);
    } catch (e) {
        if (POPUP_FALLBACK_CODES.includes(e.code)) {
            await auth.signInWithRedirect(provider);
            return null;
        }
        throw e;
    }
}

const AuthAPI = {
    loginWithGoogle: () => socialSignIn(googleProvider),
    loginWithApple: () => socialSignIn(appleProvider),
    consumeRedirectResult: () => auth.getRedirectResult(),
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
    updateUserProfile: (profile) => {
        const user = auth.currentUser;
        if (user) {
            return user.updateProfile(profile);
        }
        return Promise.resolve();
    },
    // Отправка письма подтверждения
    sendEmailVerification: () => {
        const user = auth.currentUser;
        if (user) {
            return user.sendEmailVerification();
        }
        return Promise.reject(new Error('Нет авторизованного пользователя'));
    },
    // Перезагрузка пользователя (чтобы обновить статус emailVerified)
    reloadUser: () => {
        const user = auth.currentUser;
        if (user) {
            return user.reload();
        }
        return Promise.reject(new Error('Нет авторизованного пользователя'));
    },
    deleteAccount: () => {
        const user = auth.currentUser;
        if (user) {
            return user.delete();
        }
        return Promise.reject(new Error('Нет авторизованного пользователя'));
    },
    onAuthChange: (callback) => auth.onAuthStateChanged(callback),
    getCurrentUser: () => auth.currentUser,
    // Заголовок Authorization для админских вызовов /api/* (config, example, file, examples):
    // ждёт, пока Firebase определит вход, и отдаёт свежий ID-токен ({} — если не вошли).
    authHeader: () => new Promise((resolve) => {
        const done = async (u) => {
            try { resolve(u ? { Authorization: 'Bearer ' + await u.getIdToken() } : {}); } catch (e) { resolve({}); }
        };
        if (auth.currentUser) return done(auth.currentUser);
        const off = auth.onAuthStateChanged((u) => { off(); done(u); });
        setTimeout(() => { off(); done(auth.currentUser); }, 5000);
    }),
};

window.Auth = AuthAPI;
document.dispatchEvent(new Event('authReady'));
