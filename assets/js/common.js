// common.js – шапка, подвал, тема, аутентификация и настройки

// ===== КОНФИГУРАЦИЯ АНИМАЦИИ ТЕМЫ =====
const THEME_ANIMATION_CONFIG = {
    expandDuration: 700,
    pauseBeforeFade: 400,
    fadeDuration: 1000,
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
        applyTheme(saved, false, false);
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
    if (isThemeAnimating) return;
    if (animated) {
        isThemeAnimating = true;
        animateThemeChange(theme, () => {
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
}

function applySystemTheme(save = true) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    applyTheme(theme, false, false);
    if (save) localStorage.setItem('theme', 'system');
}

function animateThemeChange(theme, callback) {
    const { expandDuration, pauseBeforeFade, fadeDuration } = THEME_ANIMATION_CONFIG;
    const isLight = theme === 'light';
    const bgColor = isLight ? '#ffffff' : '#020408';

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
        const src = mode === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
        if (src) img.src = PAGE_ROOT + src;
    });
}

function updateHeroBackground(theme) {
    const root = document.documentElement;
    const isLight = theme === 'light';
    root.style.setProperty('--hero-bg', isLight ? 'var(--hero-bg-light)' : 'var(--hero-bg-dark)');
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
        circle.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/8188/8188349.png" alt="Гость" style="width:100%;height:100%;object-fit:cover;" />`;
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
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
               data-light-src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
               data-dark-src="https://abali.ru/wp-content/uploads/2012/09/logo_apple.png"
               alt="Apple" />
        </button>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    // ... (остальной код модалки без изменений)
}

// ===== МОДАЛЬНОЕ ОКНО НАСТРОЕК =====
function injectSettingsModal() {
    if (document.getElementById('settings-modal')) return;

    const currentTheme = localStorage.getItem('theme') || 'system';

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

      <!-- Тема -->
      <div style="margin: 1.2rem 0 0.8rem; border-top:1px solid var(--border); padding-top:1rem;">
        <div style="font-weight:600; font-size:0.9rem; margin-bottom:0.7rem; color:var(--text-secondary);">Тема</div>
        <div style="display:flex; gap:0.6rem; justify-content:center;" id="theme-selector">
          <button class="theme-option" data-theme="light" style="border:2px solid ${currentTheme === 'light' ? 'var(--accent)' : 'transparent'}; border-radius:0.8rem; background:${currentTheme === 'light' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; padding:0.3rem; transition: all 0.2s; width:50px; height:50px; display:flex; align-items:center; justify-content:center;">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cline x1='12' y1='1' x2='12' y2='3'/%3E%3Cline x1='12' y1='21' x2='12' y2='23'/%3E%3Cline x1='4.22' y1='4.22' x2='5.64' y2='5.64'/%3E%3Cline x1='18.36' y1='18.36' x2='19.78' y2='19.78'/%3E%3Cline x1='1' y1='12' x2='3' y2='12'/%3E%3Cline x1='21' y1='12' x2='23' y2='12'/%3E%3Cline x1='4.22' y1='19.78' x2='5.64' y2='18.36'/%3E%3Cline x1='18.36' y1='5.64' x2='19.78' y2='4.22'/%3E%3C/svg%3E" alt="Светлая" style="width:28px;height:28px;" />
          </button>
          <button class="theme-option" data-theme="dark" style="border:2px solid ${currentTheme === 'dark' ? 'var(--accent)' : 'transparent'}; border-radius:0.8rem; background:${currentTheme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; padding:0.3rem; transition: all 0.2s; width:50px; height:50px; display:flex; align-items:center; justify-content:center;">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/%3E%3C/svg%3E" alt="Тёмная" style="width:28px;height:28px;" />
          </button>
          <button class="theme-option" data-theme="system" style="border:2px solid ${currentTheme === 'system' ? 'var(--accent)' : 'transparent'}; border-radius:0.8rem; background:${currentTheme === 'system' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; padding:0.3rem; transition: all 0.2s; width:50px; height:50px; display:flex; align-items:center; justify-content:center;">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='3' width='20' height='14' rx='2' ry='2'/%3E%3Cline x1='8' y1='21' x2='16' y2='21'/%3E%3Cline x1='12' y1='17' x2='12' y2='21'/%3E%3C/svg%3E" alt="Системная" style="width:28px;height:28px;" />
          </button>
        </div>
      </div>

      <button class="btn small" id="change-password-btn" style="width:100%; margin:0.8rem 0;">Сменить пароль</button>

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

    // Выбор темы
    const themeOptions = modal.querySelectorAll('.theme-option');
    function updateThemeSelection(theme) {
        themeOptions.forEach(btn => {
            const isActive = btn.dataset.theme === theme;
            btn.style.borderColor = isActive ? 'var(--accent)' : 'transparent';
            btn.style.background = isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)';
            btn.classList.toggle('active', isActive);
        });
    }

    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            const currentTheme = localStorage.getItem('theme') || 'system';
            if (theme === currentTheme) return; // ничего не делаем

            if (theme === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const targetTheme = prefersDark ? 'dark' : 'light';
                if (targetTheme === currentTheme) {
                    applySystemTheme(true);
                    updateThemeSelection('system');
                    return;
                }
                // Применяем тему с анимацией
                applyTheme(targetTheme, true, true);
                setTimeout(() => {
                    localStorage.setItem('theme', 'system');
                    updateThemeSelection('system');
                }, 100);
            } else {
                applyTheme(theme, true, true);
                updateThemeSelection(theme);
            }
            if (currentUser) populateSettings(currentUser);
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

        const currentTheme = localStorage.getItem('theme') || 'system';
        updateThemeSelection(currentTheme);
    }
    populateSettingsRef = populateSettings;

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

    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';

    const navHTML = navLinks
        .map(link => {
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
