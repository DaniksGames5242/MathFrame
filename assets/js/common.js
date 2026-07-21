// common.js – шапка, подвал, тема, аутентификация и настройки

// ===== КОНФИГУРАЦИЯ АНИМАЦИИ ТЕМЫ =====
const THEME_ANIMATION_CONFIG = {
    expandDuration: 700,   // длительность раскрытия маски (мс)
    pauseBeforeFade: 400,  // пауза после раскрытия перед исчезновением (мс)
    fadeDuration: 1000,     // длительность исчезновения маски (мс)
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof PAGE_ROOT === 'undefined') {
        console.error('Задайте PAGE_ROOT перед common.js');
    }
    renderHeader();
    renderFooter();
    initTheme();
    injectAuthModal();
    injectSettingsModal();

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
        applyTheme(saved, false, false); // без анимации при загрузке
    } else {
        applySystemTheme(false);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
                applySystemTheme(true);
            }
        });
    }
}

function applyTheme(theme, save = true, animated = true) {
    if (isThemeAnimating) return; // предотвращаем повторные анимации

    if (animated) {
        isThemeAnimating = true;
        animateThemeChange(theme, () => {
            // После завершения анимации применяем тему (если не была применена ранее)
            applyThemeImmediate(theme, save);
            isThemeAnimating = false;
        });
    } else {
        applyThemeImmediate(theme, save);
    }
}

function applyThemeImmediate(theme, save = true) {
    const isLight = theme === 'light';
    const html = document.documentElement;
    html.classList.toggle('light', isLight);
    if (save) localStorage.setItem('theme', theme);
    updateThemeImages(isLight ? 'light' : 'dark');
    updateHeroBackground(theme);
    highlightThemeButtons(theme);
    updateThemeToggleIcon(theme);
}

function applySystemTheme(save = true) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    // При автоматической смене системы – без анимации
    applyTheme(theme, false, false);
    if (save) localStorage.setItem('theme', 'system');
    highlightThemeButtons('system');
    updateThemeToggleIcon('system');
}

function animateThemeChange(theme, callback) {
    const { expandDuration, pauseBeforeFade, fadeDuration } = THEME_ANIMATION_CONFIG;

    // Определяем цвет фона новой темы
    const isLight = theme === 'light';
    const bgColor = isLight ? '#ffffff' : '#020408';

    // Создаём маску
    const mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.top = '0';
    mask.style.left = '0';
    mask.style.width = '100%';
    mask.style.height = '100%';
    mask.style.zIndex = '9999';
    mask.style.pointerEvents = 'none';
    mask.style.backgroundColor = bgColor;
    mask.style.opacity = '1';
    mask.style.transition = `clip-path ${expandDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${fadeDuration}ms ease`;
    // Начальное состояние – диагональная линия (почти невидима)
    mask.style.clipPath = 'polygon(0 0, 0 0, 100% 100%, 100% 100%)';
    document.body.appendChild(mask);

    // Принудительный reflow для запуска анимации
    mask.offsetHeight;

    // 1) Раскрываем маску на весь экран
    mask.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

    // Обработчик окончания раскрытия
    const onExpandEnd = () => {
        mask.removeEventListener('transitionend', onExpandEnd);

        // Применяем тему сразу после раскрытия маски (чтобы фон уже был новой темы)
        applyThemeImmediate(theme, true);

        // 2) Ждём паузу, чтобы картинки подгрузились
        setTimeout(() => {
            // 3) Плавно убираем маску (opacity -> 0)
            mask.style.opacity = '0';
            // По окончании исчезновения удаляем маску и вызываем callback
            const onFadeOutEnd = () => {
                mask.removeEventListener('transitionend', onFadeOutEnd);
                if (callback) callback();
                mask.remove();
            };
            mask.addEventListener('transitionend', onFadeOutEnd);
            // Запасной таймер
            setTimeout(() => {
                if (mask.parentNode) {
                    mask.removeEventListener('transitionend', onFadeOutEnd);
                    if (callback) callback();
                    mask.remove();
                }
            }, fadeDuration + 100); // небольшой запас
        }, pauseBeforeFade);
    };
    mask.addEventListener('transitionend', onExpandEnd);

    // Запасной таймер на случай, если transitionend не сработает
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
    }, expandDuration + 300); // запас
}

function updateThemeImages(mode) {
    document.querySelectorAll('img[data-light-src][data-dark-src]').forEach(img => {
        const src = mode === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
        if (src) img.src = PAGE_ROOT + src;
    });
}

function updateHeroBackground(theme) {
    const root = document.documentElement;
    const isLight = theme === 'light';
    root.style.setProperty('--hero-bg', isLight ? 'var(--hero-bg-light)' : 'var(--hero-bg-dark)');
}

function highlightThemeButtons(theme) {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) btn.classList.add('active');
    });
}

function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const icons = { light: '☀️', dark: '🌙', system: '💻' };
    btn.textContent = icons[theme] || '🌙';
}

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ АУТЕНТИФИКАЦИИ =====
let currentUser = null;
let populateSettingsRef = null;

function updateUIForAuth(user) {
    currentUser = user;
    updateAccountCircle(user);
    updateHeroButtons(user);
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
        circle.innerHTML = '';
        circle.textContent = '?';
        circle.title = 'Войти';
        circle.onclick = () => openAuthModal();
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
        loginBtn.onclick = (e) => { e.preventDefault(); openAuthModal(); };
        registerBtn.onclick = (e) => { e.preventDefault(); openAuthModal(); };
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
      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login">Войти</button>
        <button class="auth-tab" id="tab-register">Создать аккаунт</button>
      </div>

      <div class="login-form" id="login-section">
        <input type="text" id="login-email-phone" placeholder="Email или телефон" />
        <input type="password" id="login-password" placeholder="Пароль" />
        <button class="btn primary" id="login-submit">Войти</button>
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
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" />
        </button>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('auth-overlay');
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-close');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const phoneVerifySection = document.getElementById('phone-verify-section');

    function showLoginTab() {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginSection.style.display = 'flex';
        registerSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
    }

    function showRegisterTab() {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerSection.style.display = 'flex';
        loginSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
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

    async function handleAuth(isRegister) {
        if (!window.Auth) { alert('Сервис аутентификации ещё загружается'); return; }

        const emailPhone = isRegister ?
            document.getElementById('reg-email-phone').value.trim() :
            document.getElementById('login-email-phone').value.trim();
        const password = isRegister ?
            document.getElementById('reg-password').value :
            document.getElementById('login-password').value;

        if (!emailPhone) return alert('Введите email или телефон');
        if (isEmail(emailPhone)) {
            if (!password) return alert('Введите пароль');
            try {
                if (isRegister) {
                    const nickname = document.getElementById('reg-nickname').value.trim();
                    const result = await window.Auth.registerWithEmail(emailPhone, password);
                    if (nickname) await window.Auth.updateUserProfile({ displayName: nickname });
                    closeAuth();
                } else {
                    await window.Auth.loginWithEmail(emailPhone, password);
                    closeAuth();
                }
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        } else {
            if (!recaptchaVerifier) {
                try { recaptchaVerifier = window.Auth.createRecaptchaVerifier('recaptcha-container'); } catch (e) { console.warn(e); }
            }
            try {
                confirmationResult = await window.Auth.loginWithPhoneNumber(emailPhone, recaptchaVerifier);
                loginSection.style.display = 'none';
                registerSection.style.display = 'none';
                phoneVerifySection.classList.add('active');
            } catch (error) {
                alert('Ошибка отправки кода: ' + error.message);
                recaptchaVerifier = null;
            }
        }
    }

    document.getElementById('login-submit').addEventListener('click', () => handleAuth(false));
    document.getElementById('register-submit').addEventListener('click', () => handleAuth(true));

    document.getElementById('verify-code-btn').addEventListener('click', async () => {
        const code = document.getElementById('verification-code').value.trim();
        if (!code) return alert('Введите код');
        if (!confirmationResult) return alert('Сначала отправьте код');
        try {
            await confirmationResult.confirm(code);
            closeAuth();
        } catch (error) {
            alert('Неверный код: ' + error.message);
        }
    });

    document.getElementById('cancel-phone-verify').addEventListener('click', () => {
        phoneVerifySection.classList.remove('active');
        loginSection.style.display = 'flex';
        registerSection.style.display = 'none';
        confirmationResult = null;
    });

    document.getElementById('google-login-btn').addEventListener('click', async () => {
        if (!window.Auth) return;
        try { await window.Auth.loginWithGoogle(); closeAuth(); } catch (e) { alert('Ошибка: ' + e.message); }
    });

    document.getElementById('apple-login-btn').addEventListener('click', async () => {
        if (!window.Auth) return;
        try { await window.Auth.loginWithApple(); closeAuth(); } catch (e) { alert('Ошибка: ' + e.message); }
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
          <div class="avatar-overlay">
            <span>✎</span>
          </div>
          <input type="file" id="avatar-input" accept="image/*" />
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

      <button class="btn small" id="change-password-btn" style="width:100%; margin-bottom:0.8rem;">Сменить пароль</button>

      <div style="display:flex; justify-content:center; margin-top:1.5rem;">
        <button class="btn danger" id="logout-btn">Выйти из аккаунта</button>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById('settings-overlay');
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-close');
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const avatarImg = document.getElementById('avatar-img');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const avatarInput = document.getElementById('avatar-input');
    const usernameText = document.getElementById('username-text');
    const emailDisplay = document.getElementById('email-display');
    const editBtn = document.getElementById('edit-username-btn');
    const usernameEditField = document.getElementById('username-edit-field');
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const cancelUsernameBtn = document.getElementById('cancel-username-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const logoutBtn = document.getElementById('logout-btn');

    function populateSettings(user) {
        if (!user) {
            usernameText.textContent = 'Гость';
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarPlaceholder.textContent = '?';
            emailDisplay.textContent = '';
            changePasswordBtn.style.display = 'none';
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
    }
    populateSettingsRef = populateSettings;

    async function handleAvatarUpload(file) {
        if (!file) return;
        if (!window.Auth) {
            alert('Сервис аутентификации недоступен');
            return;
        }
        try {
            console.log('Загрузка аватара...', file.name);
            const url = await window.Auth.uploadAvatar(file);
            console.log('Аватар загружен, URL:', url);
            await window.Auth.updateUserProfile({ photoURL: url });
            const user = window.Auth.getCurrentUser();
            if (user) {
                currentUser = user;
                updateAccountCircle(currentUser);
                populateSettings(currentUser);
            }
        } catch (err) {
            console.error('Ошибка загрузки аватара:', err);
            alert('Ошибка загрузки: ' + err.message);
        }
    }

    avatarWrapper.addEventListener('click', (e) => {
        if (e.target === avatarInput) return;
        avatarInput.click();
    });
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleAvatarUpload(file);
        avatarInput.value = '';
    });

    function openSettings() {
        if (!currentUser) {
            openAuthModal();
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
            } catch (e) { alert('Ошибка: ' + e.message); }
        }
        usernameEditField.style.display = 'none';
    });

    changePasswordBtn.addEventListener('click', async () => {
        if (!currentUser || !currentUser.email) return alert('Email не найден');
        try {
            await window.Auth.resetPassword(currentUser.email);
            alert('Письмо для сброса пароля отправлено');
        } catch (e) { alert('Ошибка: ' + e.message); }
    });

    logoutBtn.addEventListener('click', async () => {
        if (!window.Auth) return;
        try { await window.Auth.logout(); closeSettings(); } catch (e) { alert('Ошибка: ' + e.message); }
    });

    window.openSettings = openSettings;
}

// ===== ШАПКА =====
function renderHeader() {
    const header = document.getElementById('app-header');
    if (!header) return;

    const navLinks = [
        { href: 'pages/spravochnik.html', text: 'Справочник' },
        { href: 'pages/mini-services.html', text: 'Мини‑сервисы' },
        { href: 'pages/forum.html', text: 'Форум' },
        { href: 'pages/ai-agent.html', text: 'AI‑агент' },
        { href: 'pages/playground.html', text: 'Песочница' },
    ];

    // Определяем текущую страницу
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    const navHTML = navLinks
        .map(link => {
            // Проверяем, является ли ссылка активной
            const isActive = link.href === currentFile || 
                            (currentFile === '' && link.href === 'index.html') ||
                            currentPath.endsWith(link.href);
            const activeClass = isActive ? ' active' : '';
            return `<a href="${PAGE_ROOT}${link.href}" class="nav-link${activeClass}">${link.text}</a>`;
        })
        .join('');

    header.innerHTML = `
    <a href="${PAGE_ROOT}" class="logo-container">
      <img src="${PAGE_ROOT}assets/img/logo.png" alt="MathFrame" class="logo-icon"
           data-light-src="assets/img/logo-light.png" data-dark-src="assets/img/logo.png" />
    </a>
    <nav id="app-nav">${navHTML}</nav>
    <div class="header-right">
      <button class="theme-toggle-btn" id="theme-toggle" title="Сменить тему"></button>
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

    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'system';
    updateThemeToggleIcon(savedTheme === 'system' ? (document.documentElement.classList.contains('light') ? 'light' : 'dark') : savedTheme);
    themeBtn.addEventListener('click', () => {
        if (isThemeAnimating) return;
        const current = localStorage.getItem('theme') || 'system';
        if (current === 'system') {
            applyTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light', true);
        } else if (current === 'light') {
            applyTheme('dark', true);
        } else if (current === 'dark') {
            applySystemTheme(true);
        }
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