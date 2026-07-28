// common.js – шапка, подвал, тема, аутентификация и настройки

// ===== АДМИН / FIRESTORE (пользователи, посещения, доступ к панели) =====
const SUPER_ADMIN_EMAIL = 'mathframe.ru@gmail.com';
let _firestoreLoadingPromise = null;
function ensureFirestore() {
    if (window.firebase && firebase.firestore) return Promise.resolve();
    if (_firestoreLoadingPromise) return _firestoreLoadingPromise;
    _firestoreLoadingPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    return _firestoreLoadingPromise;
}

function trackVisit() {
    if (sessionStorage.getItem('mf_visit_tracked')) return;
    ensureFirestore().then(() => {
        const db = firebase.firestore();
        const today = new Date().toISOString().slice(0, 10);
        return db.collection('stats').doc('visits').set({
            total: firebase.firestore.FieldValue.increment(1),
            days: { [today]: firebase.firestore.FieldValue.increment(1) }
        }, { merge: true });
    }).then(() => sessionStorage.setItem('mf_visit_tracked', '1')).catch(() => {});
}

function syncUserProfile(user) {
    if (!user) return;
    ensureFirestore().then(() => {
        const db = firebase.firestore();
        const ref = db.collection('users').doc(user.uid);
        const payload = {
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            provider: (user.providerData[0] && user.providerData[0].providerId) || 'password',
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };
        return ref.get().then(doc => {
            if (!doc.exists) payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return ref.set(payload, { merge: true });
        });
    }).catch(() => {});
}

function updateAdminNavLink(user) {
    const link = document.getElementById('admin-nav-link');
    if (!link) return;
    if (!user) { link.style.display = 'none'; return; }
    if (user.email === SUPER_ADMIN_EMAIL) { link.style.display = ''; return; }
    ensureFirestore().then(() => {
        return firebase.firestore().collection('admins').doc(user.uid).get();
    }).then(doc => {
        link.style.display = (doc.exists && doc.data().granted) ? '' : 'none';
    }).catch(() => { link.style.display = 'none'; });
}

// ===== КОНФИГУРАЦИЯ АНИМАЦИИ ТЕМЫ =====
const THEME_ANIMATION_CONFIG = {
    expandDuration: 700,
    pauseBeforeFade: 400,
    fadeDuration: 1000,
};

// ===== ДОБАВЛЯЕМ СТИЛИ =====
(function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #theme-selector-auth, #theme-selector-settings {
            display: flex; 
            justify-content: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .theme-option {
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 50%;
            padding: 4px;
            transition: border-color 0.2s;
            background: none;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .theme-option.active {
            border-color: var(--accent, #007bff);
        }
        .theme-option img {
            width: 24px;
            height: 24px;
            display: block;
        }

        .auth-message {
            padding: 0.8rem 1rem;
            border-radius: 0.5rem;
            margin-bottom: 0.8rem;
            font-size: 0.9rem;
            display: none;
        }
        .auth-message.error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            display: block;
        }
        .auth-message.success {
            background: rgba(34, 197, 94, 0.15);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
            display: block;
        }
        .auth-message.info {
            background: rgba(59, 130, 246, 0.15);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #3b82f6;
            display: block;
        }
        .auth-message .resend-link {
            color: var(--accent);
            cursor: pointer;
            text-decoration: underline;
            margin-left: 0.3rem;
        }
        .auth-message .resend-link:hover {
            text-decoration: none;
        }
    `;
    document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', () => {
    if (typeof PAGE_ROOT === 'undefined') {
        console.error('Задайте PAGE_ROOT перед common.js');
    }
    renderHeader();
    renderFooter();
    initTheme();
    injectAuthModal();
    injectSettingsModal();
    trackVisit();

    function initAuthWhenReady() {
        if (window.Auth) {
            window.Auth.onAuthChange(user => updateUIForAuth(user));
        } else {
            document.addEventListener('authReady', () => {
                window.Auth.onAuthChange(user => updateUIForAuth(user));
            });
        }
    }
    initAuthWhenReady();
});

// ===== ГЛОБАЛЬНЫЕ ФЛАГИ =====
let isThemeAnimating = false;

// ===== ТЕМА =====
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        applyTheme(saved, false, false);
        updateAllThemeSelections(saved);
    } else {
        applySystemTheme(false, false);
        updateAllThemeSelections('system');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
                applySystemTheme(true, false);
            }
        });
    }
}

function applyTheme(theme, save = true, animated = true) {
    if (isThemeAnimating) return;
    const currentActual = document.documentElement.classList.contains('light') ? 'light' : 'dark';

    if (theme === currentActual) {
        if (save) localStorage.setItem('theme', theme);
        updateAllThemeSelections(theme);
        return;
    }

    if (animated) {
        isThemeAnimating = true;
        updateAllThemeSelections(theme);
        animateThemeChange(theme, () => {
            applyThemeImmediate(theme, save);
            isThemeAnimating = false;
            updateAllThemeSelections(theme);
        });
    } else {
        applyThemeImmediate(theme, save);
        updateAllThemeSelections(theme);
    }
}

function applyThemeImmediate(theme, save = true) {
    const isLight = theme === 'light';
    const html = document.documentElement;
    html.classList.toggle('light', isLight);
    if (save) localStorage.setItem('theme', theme);
    updateThemeImages(isLight ? 'light' : 'dark');
    updateHeroBackground(theme);
}

function applySystemTheme(save = true, animated = true) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const targetTheme = prefersDark ? 'dark' : 'light';
    const currentActual = document.documentElement.classList.contains('light') ? 'light' : 'dark';

    if (targetTheme === currentActual) {
        if (save) localStorage.setItem('theme', 'system');
        updateAllThemeSelections('system');
        return;
    }

    if (animated) {
        isThemeAnimating = true;
        updateAllThemeSelections('system');
        animateThemeChange(targetTheme, () => {
            applyThemeImmediate(targetTheme, false);
            if (save) localStorage.setItem('theme', 'system');
            isThemeAnimating = false;
            updateAllThemeSelections('system');
        });
    } else {
        applyThemeImmediate(targetTheme, false);
        if (save) localStorage.setItem('theme', 'system');
        updateAllThemeSelections('system');
    }
}

function animateThemeChange(theme, callback) {
    const { expandDuration, pauseBeforeFade, fadeDuration } = THEME_ANIMATION_CONFIG;
    const isLight = theme === 'light';
    const bgColor = isLight ? '#ffffff' : '#020408';

    const mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.top = '0';
    mask.style.width = '100%';
    mask.style.height = '100%';
    mask.style.zIndex = '9999';
    mask.style.pointerEvents = 'none';
    mask.style.backgroundColor = bgColor;
    mask.style.opacity = '1';
    mask.style.transition = `clip-path ${expandDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${fadeDuration}ms ease`;
    mask.style.clipPath = 'polygon(0 0, 0 0, 100% 100%, 100% 100%)';
    document.body.appendChild(mask);
    mask.offsetHeight;
    mask.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

    const onExpandEnd = () => {
        mask.removeEventListener('transitionend', onExpandEnd);
        applyThemeImmediate(theme, true);
        setTimeout(() => {
            mask.style.opacity = '0';
            const onFadeOutEnd = () => {
                mask.removeEventListener('transitionend', onFadeOutEnd);
                if (callback) callback();
                mask.remove();
            };
            mask.addEventListener('transitionend', onFadeOutEnd);
            setTimeout(() => {
                if (mask.parentNode) {
                    mask.removeEventListener('transitionend', onFadeOutEnd);
                    if (callback) callback();
                    mask.remove();
                }
            }, fadeDuration + 100);
        }, pauseBeforeFade);
    };
    mask.addEventListener('transitionend', onExpandEnd);

    setTimeout(() => {
        if (mask.parentNode) {
            mask.removeEventListener('transitionend', onExpandEnd);
            applyThemeImmediate(theme, true);
            mask.style.opacity = '0';
            setTimeout(() => {
                if (mask.parentNode) {
                    if (callback) callback();
                    mask.remove();
                }
            }, fadeDuration + 100);
        }
    }, expandDuration + 300);
}

function updateThemeImages(mode) {
    document.querySelectorAll('img[data-light-src][data-dark-src]').forEach(img => {
        let src = mode === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
        if (src) {
            if (!src.startsWith('http://') && !src.startsWith('https://')) {
                // Если путь не абсолютный и не начинается с '/', то он относительный.
                // Мы используем абсолютные пути, поэтому добавляем '/', если его нет.
                if (!src.startsWith('/')) {
                    src = '/' + src;
                }
            }
            img.src = src;
        }
    });
}

function updateHeroBackground(theme) {
    const root = document.documentElement;
    const isLight = theme === 'light';
    root.style.setProperty('--hero-bg', isLight ? 'var(--hero-bg-light)' : 'var(--hero-bg-dark)');
}

function updateAllThemeSelections(theme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
        const isActive = btn.dataset.theme === theme;
        btn.classList.toggle('active', isActive);
    });
}

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let populateSettingsRef = null;

// ===== ФУНКЦИЯ ПРЕОБРАЗОВАНИЯ ОШИБОК FIREBASE (расширенная) =====
function getFirebaseErrorMessage(error) {
    const code = error.code;
    switch (code) {
        // Email/пароль
        case 'auth/email-already-in-use': return 'Почта уже используется в существующем аккаунте.';
        case 'auth/invalid-email': return 'Некорректный формат email.';
        case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).';
        case 'auth/user-not-found': return 'Пользователь с таким email не найден.';
        case 'auth/wrong-password': return 'Неверный пароль.';
        case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже.';
        case 'auth/network-request-failed': return 'Ошибка сети. Проверьте подключение.';
        case 'auth/internal-error': return 'Внутренняя ошибка сервера. Попробуйте позже.';
        case 'auth/user-disabled': return 'Аккаунт отключён. Обратитесь к администратору.';
        case 'auth/operation-not-allowed': return 'Вход через email/пароль отключён.';
        case 'auth/requires-recent-login': return 'Требуется повторная авторизация.';

        // Телефон
        case 'auth/invalid-verification-code': return 'Неверный код подтверждения.';
        case 'auth/code-expired': return 'Код подтверждения истёк. Запросите новый.';
        case 'auth/invalid-phone-number': return 'Неверный формат номера телефона.';
        case 'auth/missing-phone-number': return 'Введите номер телефона.';
        case 'auth/quota-exceeded': return 'Превышен лимит отправки SMS. Попробуйте позже.';

        // Общие
        case 'auth/popup-closed-by-user': return 'Окно входа было закрыто. Попробуйте снова.';
        case 'auth/cancelled-popup-request': return 'Запрос входа был отменён.';
        case 'auth/account-exists-with-different-credential': return 'Аккаунт уже существует с другим способом входа.';

        default: return error.message || 'Неизвестная ошибка.';
    }
}

// ===== ПРОВЕРКА БЛОКИРОВКИ =====
async function checkUserBanned(user) {
    if (!user) return false;
    try {
        await ensureFirestore();
        const doc = await firebase.firestore().collection('bannedUsers').doc(user.uid).get();
        return doc.exists;
    } catch (e) {
        return false;
    }
}

// ===== ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ =====
async function updateUIForAuth(user) {
    if (user) {
        // Проверка email только для парольных аккаунтов
        if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
            await window.Auth.logout();
            user = null;
            const msgEl = document.getElementById('auth-message');
            if (msgEl) {
                msgEl.className = 'auth-message info';
                msgEl.innerHTML = `Пожалуйста, подтвердите email, перейдя по ссылке в письме. 
                    Если письмо не пришло, проверьте папку «Спам» или нажмите 
                    <span class="resend-link" id="resend-verification-link">Отправить повторно</span>.`;
                msgEl.style.display = 'block';
                const resendLink = document.getElementById('resend-verification-link');
                if (resendLink) {
                    resendLink.onclick = async () => {
                        try {
                            await window.Auth.sendEmailVerification();
                            msgEl.className = 'auth-message success';
                            msgEl.innerHTML = 'Письмо отправлено повторно. Проверьте почту (и папку «Спам»).';
                        } catch (e) {
                            msgEl.className = 'auth-message error';
                            msgEl.textContent = 'Ошибка: ' + getFirebaseErrorMessage(e);
                        }
                    };
                }
            }
            if (!document.getElementById('auth-modal')?.classList.contains('active')) {
                window.openAuthModal();
            }
            return;
        }

        const banned = await checkUserBanned(user);
        if (banned) {
            const msgEl = document.getElementById('auth-message');
            if (msgEl) {
                msgEl.className = 'auth-message error';
                msgEl.textContent = 'Ваш аккаунт заблокирован. Обратитесь к администратору.';
                msgEl.style.display = 'block';
            }
            await window.Auth.logout();
            user = null;
            if (!document.getElementById('auth-modal')?.classList.contains('active')) {
                window.openAuthModal();
            }
            return;
        }
        syncUserProfile(user);
    }
    currentUser = user;
    updateAccountCircle(user);
    updateHeroButtons(user);
    updateAdminNavLink(user);
    if (document.getElementById('settings-modal')?.classList.contains('active')) {
        populateSettingsRef?.(user);
    }
}

function updateAccountCircle(user) {
    const circle = document.getElementById('account-circle');
    if (!circle) return;
    if (user) {
        const name = user.displayName || user.email || user.phoneNumber || 'User';
        if (user.photoURL) {
            circle.innerHTML = `<img src="${user.photoURL}" alt="avatar" />`;
        } else {
            const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
            circle.innerHTML = '';
            circle.textContent = initials;
        }
        circle.title = name;
        circle.onclick = () => openSettings();
    } else {
        circle.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/8188/8188349.png" alt="Гость" style="width:100%;height:100%;object-fit:cover;" />`;
        circle.title = 'Войти';
        circle.onclick = () => window.openAuthModal();
    }
}

function updateHeroButtons(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    if (!loginBtn || !registerBtn) return;
    if (user) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
    } else {
        loginBtn.style.display = '';
        registerBtn.style.display = '';
        loginBtn.onclick = (e) => { e.preventDefault(); window.openAuthModal(); };
        registerBtn.onclick = (e) => { e.preventDefault(); window.openAuthModal(); };
    }
}

// ===== МОДАЛЬНОЕ ОКНО ВХОДА =====
let recaptchaVerifier = null;
let confirmationResult = null;

function injectAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const html = `
    <div class="overlay" id="auth-overlay"></div>
    <div class="modal" id="auth-modal">
      <div class="modal-header">
        <h2>Вход</h2>
        <button class="modal-close" id="auth-close">✕</button>
      </div>
      <div class="auth-message" id="auth-message"></div>
      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login">Войти</button>
        <button class="auth-tab" id="tab-register">Создать аккаунт</button>
      </div>

      <div class="login-form" id="login-section">
        <input type="text" id="login-email-phone" placeholder="Email или телефон" />
        <input type="password" id="login-password" placeholder="Пароль" />
        <button class="btn primary" id="login-submit">Войти</button>
        <button class="btn small" id="forgot-password-btn" style="background:transparent;border:none;color:var(--text-secondary);font-size:0.8rem;margin-top:-0.2rem;">Забыли пароль?</button>
      </div>

      <div class="login-form" id="register-section" style="display:none;">
        <input type="text" id="reg-email-phone" placeholder="Email или телефон" />
        <input type="text" id="reg-nickname" placeholder="Никнейм" />
        <input type="password" id="reg-password" placeholder="Пароль" />
        <button class="btn primary" id="register-submit">Зарегистрироваться</button>
      </div>

      <div id="phone-verify-section">
        <input type="text" id="verification-code" placeholder="Код из SMS" />
        <button class="btn primary" id="verify-code-btn">Подтвердить</button>
        <button class="btn small" id="cancel-phone-verify" style="margin-top:0.5rem;">Назад</button>
      </div>

      <div class="divider"><span>или</span></div>
      <div class="social-icons">
        <button class="social-btn" id="google-login-btn">
          <img src="https://logo-teka.com/wp-content/uploads/2025/06/google-logo.svg" alt="Google" />
        </button>
        <button class="social-btn" id="apple-login-btn">
          <img src="https://abali.ru/wp-content/uploads/2012/09/logo_apple.png" alt="Apple"
               data-light-src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
               data-dark-src="https://abali.ru/wp-content/uploads/2012/09/logo_apple.png" />
        </button>
      </div>
      <div id="recaptcha-container"></div>

      <div style="margin: 1.2rem 0 0; border-top:1px solid var(--border); padding-top:0.8rem;">
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.6rem; color:var(--text-secondary); text-align:center;">Тема</div>
        <div id="theme-selector-auth">
          <button class="theme-option" data-theme="light" title="Светлая">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cline x1='12' y1='1' x2='12' y2='3'/%3E%3Cline x1='12' y1='21' x2='12' y2='23'/%3E%3Cline x1='4.22' y1='4.22' x2='5.64' y2='5.64'/%3E%3Cline x1='18.36' y1='18.36' x2='19.78' y2='19.78'/%3E%3Cline x1='1' y1='12' x2='3' y2='12'/%3E%3Cline x1='21' y1='12' x2='23' y2='12'/%3E%3Cline x1='4.22' y1='19.78' x2='5.64' y2='18.36'/%3E%3Cline x1='18.36' y1='5.64' x2='19.78' y2='4.22'/%3E%3C/svg%3E" alt="Светлая" />
          </button>
          <button class="theme-option" data-theme="dark" title="Тёмная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/%3E%3C/svg%3E" alt="Тёмная" />
          </button>
          <button class="theme-option" data-theme="system" title="Системная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='3' width='20' height='14' rx='2' ry='2'/%3E%3Cline x1='8' y1='21' x2='16' y2='21'/%3E%3Cline x1='12' y1='17' x2='12' y2='21'/%3E%3C/svg%3E" alt="Системная" />
          </button>
        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const currentMode = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    updateThemeImages(currentMode);

    const overlay = document.getElementById('auth-overlay');
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-close');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const phoneVerifySection = document.getElementById('phone-verify-section');
    const messageEl = document.getElementById('auth-message');

    const themeOptionsAuth = modal.querySelectorAll('#theme-selector-auth .theme-option');
    themeOptionsAuth.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme === 'system') {
                applySystemTheme(true, true);
            } else {
                applyTheme(theme, true, true);
            }
        });
    });

    function showLoginTab() {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginSection.style.display = 'flex';
        registerSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
        clearMessage();
    }

    function showRegisterTab() {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerSection.style.display = 'flex';
        loginSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
        clearMessage();
    }

    function clearMessage() {
        messageEl.className = 'auth-message';
        messageEl.style.display = 'none';
        messageEl.innerHTML = '';
    }

    function setMessage(text, type = 'error') {
        messageEl.className = 'auth-message ' + type;
        messageEl.textContent = text;
        messageEl.style.display = 'block';
    }

    function setMessageHTML(html, type = 'info') {
        messageEl.className = 'auth-message ' + type;
        messageEl.innerHTML = html;
        messageEl.style.display = 'block';
    }

    function openAuth() {
        document.body.classList.add('no-scroll');
        overlay.style.visibility = 'visible';
        modal.style.visibility = 'visible';
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        });
        showLoginTab();
        document.getElementById('login-email-phone').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('reg-email-phone').value = '';
        document.getElementById('reg-nickname').value = '';
        document.getElementById('reg-password').value = '';
        document.getElementById('verification-code').value = '';
        confirmationResult = null;
        clearMessage();

        const currentTheme = localStorage.getItem('theme') || 'system';
        updateAllThemeSelections(currentTheme);
        updateThemeImages(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    }

    window.openAuthModal = openAuth;

    function closeAuth() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
            modal.style.visibility = 'hidden';
            document.body.classList.remove('no-scroll');
        }, 300);
    }

    overlay.addEventListener('click', closeAuth);
    closeBtn.addEventListener('click', closeAuth);
    tabLogin.addEventListener('click', showLoginTab);
    tabRegister.addEventListener('click', showRegisterTab);

    function isEmail(str) { return str.includes('@'); }

    // ===== ВХОД ПО EMAIL =====
    async function handleLoginEmail(email, password) {
        try {
            const result = await window.Auth.loginWithEmail(email, password);
            if (!result.user.emailVerified) {
                await window.Auth.logout();
                setMessageHTML(
                    `Пожалуйста, подтвердите email, перейдя по ссылке в письме. 
                    Если письмо не пришло, проверьте папку «Спам» или нажмите 
                    <span class="resend-link" id="resend-verification-link">Отправить повторно</span>.`,
                    'info'
                );
                const resendLink = document.getElementById('resend-verification-link');
                if (resendLink) {
                    resendLink.onclick = async () => {
                        try {
                            await window.Auth.sendEmailVerification();
                            setMessage('Письмо отправлено повторно. Проверьте почту (и папку «Спам»).', 'success');
                        } catch (e) {
                            setMessage('Ошибка: ' + getFirebaseErrorMessage(e), 'error');
                        }
                    };
                }
                return;
            }
            closeAuth();
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        }
    }

    // ===== РЕГИСТРАЦИЯ =====
    async function handleRegister(email, password, nickname) {
        try {
            const result = await window.Auth.registerWithEmail(email, password);
            if (nickname) {
                await result.user.updateProfile({ displayName: nickname });
            }
            try {
                await result.user.sendEmailVerification();
                setMessage('Регистрация успешна! На вашу почту отправлено письмо для подтверждения. Проверьте также папку «Спам».', 'success');
                showLoginTab();
            } catch (verifyError) {
                setMessage('Аккаунт создан, но не удалось отправить письмо подтверждения: ' + getFirebaseErrorMessage(verifyError), 'error');
                showLoginTab();
            }
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        }
    }

    // ===== СБРОС ПАРОЛЯ =====
    async function handleForgotPassword(email) {
        if (!email) {
            setMessage('Введите email для сброса пароля.', 'error');
            return;
        }
        try {
            await window.Auth.resetPassword(email);
            setMessage('Письмо для сброса пароля отправлено. Проверьте почту (и папку «Спам»).', 'success');
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        }
    }

    // ===== ОБРАБОТЧИКИ КНОПОК =====
    document.getElementById('login-submit').addEventListener('click', async () => {
        const emailPhone = document.getElementById('login-email-phone').value.trim();
        const password = document.getElementById('login-password').value;
        if (!emailPhone) { setMessage('Введите email или телефон', 'error'); return; }
        if (isEmail(emailPhone)) {
            if (!password) { setMessage('Введите пароль', 'error'); return; }
            await handleLoginEmail(emailPhone, password);
        } else {
            // Телефон
            if (!recaptchaVerifier) {
                try { recaptchaVerifier = window.Auth.createRecaptchaVerifier('recaptcha-container'); } catch (e) { console.warn(e); }
            }
            try {
                confirmationResult = await window.Auth.loginWithPhoneNumber(emailPhone, recaptchaVerifier);
                loginSection.style.display = 'none';
                registerSection.style.display = 'none';
                phoneVerifySection.classList.add('active');
                clearMessage();
            } catch (error) {
                setMessage('Ошибка отправки кода: ' + getFirebaseErrorMessage(error), 'error');
                recaptchaVerifier = null;
            }
        }
    });

    document.getElementById('register-submit').addEventListener('click', async () => {
        const emailPhone = document.getElementById('reg-email-phone').value.trim();
        const password = document.getElementById('reg-password').value;
        const nickname = document.getElementById('reg-nickname').value.trim();
        if (!emailPhone) { setMessage('Введите email или телефон', 'error'); return; }
        if (isEmail(emailPhone)) {
            if (!password) { setMessage('Введите пароль', 'error'); return; }
            await handleRegister(emailPhone, password, nickname);
        } else {
            setMessage('Регистрация по телефону не поддерживается. Используйте email.', 'error');
        }
    });

    document.getElementById('verify-code-btn').addEventListener('click', async () => {
        const code = document.getElementById('verification-code').value.trim();
        if (!code) { setMessage('Введите код', 'error'); return; }
        if (!confirmationResult) { setMessage('Сначала отправьте код', 'error'); return; }
        try {
            await confirmationResult.confirm(code);
            closeAuth();
        } catch (error) {
            setMessage('Неверный код: ' + getFirebaseErrorMessage(error), 'error');
        }
    });

    document.getElementById('cancel-phone-verify').addEventListener('click', () => {
        phoneVerifySection.classList.remove('active');
        loginSection.style.display = 'flex';
        registerSection.style.display = 'none';
        confirmationResult = null;
        clearMessage();
    });

    document.getElementById('forgot-password-btn').addEventListener('click', () => {
        const email = document.getElementById('login-email-phone').value.trim();
        handleForgotPassword(email);
    });

    document.getElementById('google-login-btn').addEventListener('click', async () => {
        if (!window.Auth) return;
        try {
            await window.Auth.loginWithGoogle();
            closeAuth();
        } catch (e) {
            setMessage('Ошибка входа через Google: ' + getFirebaseErrorMessage(e), 'error');
        }
    });

    document.getElementById('apple-login-btn').addEventListener('click', async () => {
        if (!window.Auth) return;
        try {
            await window.Auth.loginWithApple();
            closeAuth();
        } catch (e) {
            setMessage('Ошибка входа через Apple: ' + getFirebaseErrorMessage(e), 'error');
        }
    });
}

// ===== МОДАЛЬНОЕ ОКНО НАСТРОЕК =====
function injectSettingsModal() {
    if (document.getElementById('settings-modal')) return;

    const html = `
    <div class="overlay" id="settings-overlay"></div>
    <div class="modal" id="settings-modal">
      <div class="modal-header">
        <h2>Настройки</h2>
        <button class="modal-close" id="settings-close">✕</button>
      </div>

      <div class="avatar-section">
        <div class="avatar-wrapper" id="avatar-wrapper">
          <img id="avatar-img" src="" alt="" style="display:none" />
          <div class="avatar-placeholder" id="avatar-placeholder">?</div>
        </div>
        <div class="username-display">
          <span id="username-text"></span>
          <span class="edit-icon" id="edit-username-btn">✎</span>
        </div>
        <div class="email-display" id="email-display"></div>
      </div>

      <div class="settings-field" id="username-edit-field" style="display:none;">
        <input type="text" id="username-input" placeholder="Новое имя" />
        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <button class="btn primary small" id="save-username-btn">Сохранить</button>
          <button class="btn small" id="cancel-username-btn">Отмена</button>
        </div>
      </div>

      <div style="margin: 1.2rem 0 0.8rem; border-top:1px solid var(--border); padding-top:1rem;">
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.6rem; color:var(--text-secondary); text-align:center;">Тема</div>
        <div id="theme-selector-settings">
          <button class="theme-option" data-theme="light" title="Светлая">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cline x1='12' y1='1' x2='12' y2='3'/%3E%3Cline x1='12' y1='21' x2='12' y2='23'/%3E%3Cline x1='4.22' y1='4.22' x2='5.64' y2='5.64'/%3E%3Cline x1='18.36' y1='18.36' x2='19.78' y2='19.78'/%3E%3Cline x1='1' y1='12' x2='3' y2='12'/%3E%3Cline x1='21' y1='12' x2='23' y2='12'/%3E%3Cline x1='4.22' y1='19.78' x2='5.64' y2='18.36'/%3E%3Cline x1='18.36' y1='5.64' x2='19.78' y2='4.22'/%3E%3C/svg%3E" alt="Светлая" />
          </button>
          <button class="theme-option" data-theme="dark" title="Тёмная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/%3E%3C/svg%3E" alt="Тёмная" />
          </button>
          <button class="theme-option" data-theme="system" title="Системная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='3' width='20' height='14' rx='2' ry='2'/%3E%3Cline x1='8' y1='21' x2='16' y2='21'/%3E%3Cline x1='12' y1='17' x2='12' y2='21'/%3E%3C/svg%3E" alt="Системная" />
          </button>
        </div>
      </div>

      <button class="btn small" id="change-password-btn" style="width:100%; margin:0.8rem 0;">Сменить пароль</button>
      <button class="btn danger" id="delete-account-btn" style="width:100%; margin:0.5rem 0;">Удалить аккаунт</button>

      <div style="display:flex; justify-content:center; margin-top:0.5rem;">
        <button class="btn danger" id="logout-btn">Выйти из аккаунта</button>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('settings-overlay');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-close');
    const avatarImg = document.getElementById('avatar-img');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const usernameText = document.getElementById('username-text');
    const emailDisplay = document.getElementById('email-display');
    const editBtn = document.getElementById('edit-username-btn');
    const usernameEditField = document.getElementById('username-edit-field');
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const cancelUsernameBtn = document.getElementById('cancel-username-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    deleteAccountBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        if (!confirm('Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.')) return;
        try {
            await window.Auth.deleteAccount();
            await ensureFirestore();
            await firebase.firestore().collection('users').doc(currentUser.uid).delete();
            await firebase.firestore().collection('bannedUsers').doc(currentUser.uid).delete();
            alert('Аккаунт удалён.');
            closeSettings();
        } catch (e) {
            alert('Ошибка при удалении аккаунта: ' + getFirebaseErrorMessage(e));
        }
    });

    const themeOptionsSettings = modal.querySelectorAll('#theme-selector-settings .theme-option');
    themeOptionsSettings.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme === 'system') {
                applySystemTheme(true, true);
            } else {
                applyTheme(theme, true, true);
            }
        });
    });

    function populateSettings(user) {
        if (!user) {
            usernameText.textContent = 'Гость';
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarPlaceholder.textContent = '?';
            emailDisplay.textContent = '';
            changePasswordBtn.style.display = 'none';
            deleteAccountBtn.style.display = 'none';
            return;
        }
        const name = user.displayName || user.email || user.phoneNumber || 'User';
        usernameText.textContent = name;
        emailDisplay.textContent = user.email || user.phoneNumber || '';

        if (user.photoURL) {
            avatarImg.src = user.photoURL;
            avatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarPlaceholder.textContent = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
        }

        const isPasswordProvider = user.providerData.some(p => p.providerId === 'password');
        changePasswordBtn.style.display = isPasswordProvider ? '' : 'none';
        deleteAccountBtn.style.display = '';

        const currentTheme = localStorage.getItem('theme') || 'system';
        updateAllThemeSelections(currentTheme);
    }
    populateSettingsRef = populateSettings;

    function openSettings() {
        if (!currentUser) {
            window.openAuthModal();
            return;
        }
        populateSettings(currentUser);
        usernameEditField.style.display = 'none';
        document.body.classList.add('no-scroll');
        overlay.style.visibility = 'visible';
        modal.style.visibility = 'visible';
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        });
    }

    function closeSettings() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
            modal.style.visibility = 'hidden';
            document.body.classList.remove('no-scroll');
        }, 300);
    }

    overlay.addEventListener('click', closeSettings);
    closeBtn.addEventListener('click', closeSettings);

    editBtn.addEventListener('click', () => {
        usernameInput.value = currentUser?.displayName || '';
        usernameEditField.style.display = 'block';
    });

    cancelUsernameBtn.addEventListener('click', () => {
        usernameEditField.style.display = 'none';
    });

    saveUsernameBtn.addEventListener('click', async () => {
        const newName = usernameInput.value.trim();
        if (newName && window.Auth) {
            try {
                await window.Auth.updateUserProfile({ displayName: newName });
                const user = window.Auth.getCurrentUser();
                if (user) {
                    currentUser = user;
                    updateAccountCircle(currentUser);
                    populateSettings(currentUser);
                }
            } catch (e) { alert('Ошибка: ' + getFirebaseErrorMessage(e)); }
        }
        usernameEditField.style.display = 'none';
    });

    changePasswordBtn.addEventListener('click', async () => {
        if (!currentUser || !currentUser.email) return alert('Email не найден');
        try {
            await window.Auth.resetPassword(currentUser.email);
            alert('Письмо для сброса пароля отправлено. Проверьте почту (и папку «Спам»).');
        } catch (e) { alert('Ошибка: ' + getFirebaseErrorMessage(e)); }
    });

    logoutBtn.addEventListener('click', async () => {
        if (!window.Auth) return;
        try { await window.Auth.logout(); closeSettings(); } catch (e) { alert('Ошибка: ' + getFirebaseErrorMessage(e)); }
    });

    window.openSettings = openSettings;
}

// ===== ШАПКА =====
function renderHeader() {
    const header = document.getElementById('app-header');
    if (!header) return;

    // Массив ссылок с абсолютными путями от корня
    const navLinks = [
        { href: '/spravochnik/', text: 'Справочник' },
        { href: '/mini-services/', text: 'Мини‑сервисы' },
        { href: '/forum/', text: 'Форум' },
        { href: '/ai-agent/', text: 'AI‑агент' },
        { href: '/playground/', text: 'Песочница' },
    ];

    const currentPath = window.location.pathname;

    const navHTML = navLinks
        .map(link => {
            // Простая проверка активности: если текущий путь начинается с link.href (кроме случая, когда link.href == '/')
            const isActive = currentPath === link.href || currentPath.startsWith(link.href);
            const activeClass = isActive ? ' active' : '';
            return `<a href="${link.href}" class="nav-link${activeClass}">${link.text}</a>`;
        })
        .join('');

    header.innerHTML = `
    <a href="/" class="logo-container">
      <img src="/assets/img/logo.png" alt="MathFrame" class="logo-icon"
           data-light-src="/assets/img/logo-light.png" data-dark-src="/assets/img/logo.png" />
    </a>
    <nav id="app-nav">${navHTML}<a href="/admin/" id="admin-nav-link" class="nav-link" style="display:none;">Админ панель</a></nav>
    <div class="header-right">
      <div class="account-circle" id="account-circle" title="Аккаунт"></div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Меню" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

    const nav = document.getElementById('app-nav');
    const navToggle = document.getElementById('nav-toggle');
    function closeNav() {
        nav.classList.remove('nav-open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    }
    navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeNav();
    });

    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    updateThemeImages(currentTheme);
}

function renderFooter() {
    const footer = document.getElementById('app-footer');
    if (!footer) return;
    footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} MathFrame. Учись математике интерактивно.</p>`;
}

window.applyTheme = applyTheme;
window.applySystemTheme = applySystemTheme;