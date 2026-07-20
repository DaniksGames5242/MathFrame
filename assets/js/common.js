// common.js – общая шапка, подвал, управление темой и аккаунтом (Firebase)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof PAGE_ROOT === 'undefined') {
    console.error('PAGE_ROOT не задана! Вставьте перед common.js: <script>var PAGE_ROOT = "./";</script>');
  }
  renderHeader();
  renderFooter();
  initTheme();
  injectSettingsModal();
  injectLoginModal();

  // Инициализация аутентификации после готовности Auth
  function initAuthWhenReady() {
    if (window.Auth) {
      window.Auth.onAuthChange((user) => {
        updateUIForAuth(user);
      });
    } else {
      // Ждём событие authReady
      document.addEventListener('authReady', () => {
        window.Auth.onAuthChange((user) => {
          updateUIForAuth(user);
        });
      });
    }
  }

  initAuthWhenReady();
});

// ===== ТЕМА (без изменений) =====
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved, false);
  } else {
    applySystemTheme(false);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
        applySystemTheme(true);
      }
    });
  }
}

function applyTheme(theme, save = true) {
  const html = document.documentElement;
  html.classList.toggle('light', theme === 'light');
  if (save) localStorage.setItem('theme', theme);
  updateThemeImages(theme === 'light' ? 'light' : 'dark');
  updateHeroBackground(theme);
  highlightThemeButtons(theme);
}

function applySystemTheme(save = true) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = prefersDark ? 'dark' : 'light';
  applyTheme(theme, false);
  if (save) localStorage.setItem('theme', 'system');
  highlightThemeButtons('system');
}

function updateThemeImages(mode) {
  document.querySelectorAll('img[data-light-src][data-dark-src]').forEach(img => {
    const src = mode === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (src) img.src = PAGE_ROOT + src;
  });
}

function updateHeroBackground(theme) {
  const root = document.documentElement;
  root.style.setProperty('--hero-bg', theme === 'light' ? 'var(--hero-bg-light)' : 'var(--hero-bg-dark)');
}

function highlightThemeButtons(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.theme === theme) btn.classList.add('active');
  });
}

// ===== АУТЕНТИФИКАЦИЯ И UI =====
let currentUser = null;

function updateUIForAuth(user) {
  currentUser = user;
  updateAccountCircle(user);
  updateHeroButtons(user);
  if (document.getElementById('settings-modal')?.classList.contains('active')) {
    populateSettingsModal(user);
  }
}

function updateAccountCircle(user) {
  const circle = document.getElementById('account-circle');
  if (!circle) return;
  if (user) {
    const name = user.displayName || user.email || user.phoneNumber || 'User';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    circle.textContent = initials;
    circle.title = name;
    circle.onclick = () => openSettings();
  } else {
    circle.textContent = '?';
    circle.title = 'Войти';
    circle.onclick = () => openLoginForm();
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
    loginBtn.onclick = (e) => { e.preventDefault(); openLoginForm(); };
    registerBtn.onclick = (e) => { e.preventDefault(); openLoginForm(); };
  }
}

// ===== МОДАЛЬНОЕ ОКНО ВХОДА =====
function injectLoginModal() {
  if (document.getElementById('login-modal')) return;

  const modalHTML = `
    <div class="login-overlay" id="login-overlay"></div>
    <div class="login-modal" id="login-modal">
      <div class="login-header">
        <h2>Войти</h2>
        <button class="login-close" id="login-close">✕</button>
      </div>
      <button class="auth-provider-btn" id="google-login-btn">Google</button>
      <button class="auth-provider-btn" id="apple-login-btn">Apple</button>
      <button class="auth-provider-btn" id="phone-login-btn">📱 Телефон</button>
      <div class="divider-text"><span>или</span></div>
      <div class="login-form" id="login-form">
        <input type="email" id="login-email" placeholder="Email" />
        <input type="password" id="login-password" placeholder="Пароль" />
        <button class="btn primary" id="login-submit">Войти</button>
        <button class="toggle-form" id="switch-to-register">Создать аккаунт</button>
      </div>
      <div class="login-form" id="register-form" style="display:none;">
        <input type="email" id="register-email" placeholder="Email" />
        <input type="password" id="register-password" placeholder="Пароль" />
        <button class="btn primary" id="register-submit">Зарегистрироваться</button>
        <button class="toggle-form" id="switch-to-login">Уже есть аккаунт? Войти</button>
      </div>
      <div class="login-form" id="phone-form" style="display:none;">
        <input type="tel" id="phone-number" placeholder="+7XXXXXXXXXX" />
        <div id="recaptcha-container"></div>
        <button class="btn primary" id="send-code-btn">Отправить код</button>
        <button class="toggle-form" id="switch-from-phone">Назад</button>
      </div>
      <div class="login-form" id="phone-verification-form" style="display:none;">
        <input type="text" id="verification-code" placeholder="Код из SMS" />
        <button class="btn primary" id="verify-code-btn">Подтвердить</button>
        <button class="toggle-form" id="cancel-phone-verify">Назад</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay = document.getElementById('login-overlay');
  const modal = document.getElementById('login-modal');
  const closeBtn = document.getElementById('login-close');
  const googleBtn = document.getElementById('google-login-btn');
  const appleBtn = document.getElementById('apple-login-btn');
  const phoneBtn = document.getElementById('phone-login-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const phoneForm = document.getElementById('phone-form');
  const phoneVerificationForm = document.getElementById('phone-verification-form');

  let recaptchaVerifier = null;
  let confirmationResult = null;

  function showForm(formId) {
    [loginForm, registerForm, phoneForm, phoneVerificationForm].forEach(f => f.style.display = 'none');
    document.getElementById(formId).style.display = 'flex';
  }

  window.openLoginForm = () => {
    document.body.classList.add('no-scroll');
    overlay.classList.add('active');
    modal.classList.add('active');
    showForm('login-form');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('phone-number').value = '';
    document.getElementById('verification-code').value = '';
    confirmationResult = null;
    // reCAPTCHA будет создана при открытии телефонной формы
  };

  function closeLogin() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  overlay.addEventListener('click', closeLogin);
  closeBtn.addEventListener('click', closeLogin);

  document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('register-form');
  });
  document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login-form');
  });
  phoneBtn.addEventListener('click', () => {
    showForm('phone-form');
    // Создаём reCAPTCHA при первом переходе
    if (!recaptchaVerifier && window.Auth) {
      try {
        recaptchaVerifier = window.Auth.createRecaptchaVerifier('recaptcha-container');
      } catch (e) {
        console.warn('reCAPTCHA error', e);
      }
    }
  });
  document.getElementById('switch-from-phone').addEventListener('click', () => showForm('login-form'));
  document.getElementById('cancel-phone-verify').addEventListener('click', () => {
    showForm('phone-form');
    confirmationResult = null;
  });

  // Универсальная проверка перед вызовом Auth
  function ensureAuth() {
    if (!window.Auth) {
      alert('Сервис аутентификации ещё загружается, попробуйте через секунду.');
      return false;
    }
    return true;
  }

  googleBtn.addEventListener('click', async () => {
    if (!ensureAuth()) return;
    try {
      await window.Auth.loginWithGoogle();
      closeLogin();
    } catch (error) {
      alert('Ошибка входа: ' + error.message);
    }
  });

  appleBtn.addEventListener('click', async () => {
    if (!ensureAuth()) return;
    try {
      await window.Auth.loginWithApple();
      closeLogin();
    } catch (error) {
      alert('Ошибка входа: ' + error.message);
    }
  });

  document.getElementById('login-submit').addEventListener('click', async () => {
    if (!ensureAuth()) return;
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return alert('Введите email и пароль');
    try {
      await window.Auth.loginWithEmail(email, password);
      closeLogin();
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  });

  document.getElementById('register-submit').addEventListener('click', async () => {
    if (!ensureAuth()) return;
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    if (!email || !password) return alert('Введите email и пароль');
    try {
      await window.Auth.registerWithEmail(email, password);
      closeLogin();
    } catch (error) {
      alert('Ошибка регистрации: ' + error.message);
    }
  });

  document.getElementById('send-code-btn').addEventListener('click', async () => {
    if (!ensureAuth()) return;
    const phone = document.getElementById('phone-number').value.trim();
    if (!phone) return alert('Введите номер телефона');
    try {
      if (!recaptchaVerifier) {
        recaptchaVerifier = window.Auth.createRecaptchaVerifier('recaptcha-container');
      }
      confirmationResult = await window.Auth.loginWithPhoneNumber(phone, recaptchaVerifier);
      showForm('phone-verification-form');
    } catch (error) {
      alert('Ошибка отправки кода: ' + error.message);
      recaptchaVerifier = null;
    }
  });

  document.getElementById('verify-code-btn').addEventListener('click', async () => {
    if (!ensureAuth()) return;
    const code = document.getElementById('verification-code').value.trim();
    if (!code) return alert('Введите код');
    if (!confirmationResult) return alert('Сначала отправьте код');
    try {
      await confirmationResult.confirm(code);
      closeLogin();
    } catch (error) {
      alert('Неверный код: ' + error.message);
    }
  });
}

// ===== МОДАЛЬНОЕ ОКНО НАСТРОЕК (без изменений, только добавлена проверка Auth при выходе) =====
function injectSettingsModal() {
  if (document.getElementById('settings-modal')) return;

  const modalHTML = `
    <div class="settings-overlay" id="settings-overlay"></div>
    <div class="settings-modal" id="settings-modal">
      <div class="settings-header">
        <h2>Настройки</h2>
        <div class="theme-row">
          <span class="theme-label">Тема</span>
          <button class="theme-btn" data-theme="light">☀️</button>
          <button class="theme-btn" data-theme="dark">🌙</button>
          <button class="theme-btn" data-theme="system">💻</button>
        </div>
        <button class="settings-close" id="settings-close">✕</button>
      </div>

      <div class="avatar-section">
        <div class="avatar-big" id="avatar-big"></div>
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

      <button class="btn small" style="width:100%; margin-bottom:0.8rem;" id="change-password-btn">Сменить пароль</button>

      <div class="settings-actions">
        <button class="btn danger" id="logout-btn">Выйти из аккаунта</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay = document.getElementById('settings-overlay');
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('settings-close');
  const logoutBtn = document.getElementById('logout-btn');
  const editBtn = document.getElementById('edit-username-btn');
  const usernameText = document.getElementById('username-text');
  const avatarBig = document.getElementById('avatar-big');
  const emailDisplay = document.getElementById('email-display');
  const usernameEditField = document.getElementById('username-edit-field');
  const usernameInput = document.getElementById('username-input');
  const saveUsernameBtn = document.getElementById('save-username-btn');
  const cancelUsernameBtn = document.getElementById('cancel-username-btn');
  const changePasswordBtn = document.getElementById('change-password-btn');
  const themeBtns = document.querySelectorAll('.theme-btn');

  function closeSettings() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  function populateSettingsModal(user) {
    if (!user) {
      usernameText.textContent = 'Гость';
      avatarBig.textContent = '?';
      emailDisplay.textContent = '';
      return;
    }
    const name = user.displayName || user.email || user.phoneNumber || 'User';
    usernameText.textContent = name;
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    avatarBig.textContent = initials;
    emailDisplay.textContent = user.email || user.phoneNumber || '';
  }

  window.openSettings = () => {
    if (!currentUser) {
      openLoginForm();
      return;
    }
    populateSettingsModal(currentUser);
    usernameEditField.style.display = 'none';

    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'system') {
      highlightThemeButtons('system');
    } else {
      highlightThemeButtons(savedTheme);
    }

    document.body.classList.add('no-scroll');
    overlay.classList.add('active');
    modal.classList.add('active');
  };

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
        await window.Auth.updateUserProfile(newName);
        if (currentUser) {
          currentUser.displayName = newName;
          updateAccountCircle(currentUser);
          populateSettingsModal(currentUser);
        }
      } catch (e) {
        alert('Ошибка обновления имени: ' + e.message);
      }
    }
    usernameEditField.style.display = 'none';
  });

  changePasswordBtn.addEventListener('click', async () => {
    if (!currentUser || !currentUser.email) return alert('Email не найден. Сброс пароля доступен только для email-аккаунтов.');
    if (!window.Auth) return alert('Сервис недоступен');
    try {
      await window.Auth.resetPassword(currentUser.email);
      alert('Письмо для сброса пароля отправлено на ' + currentUser.email);
    } catch (e) {
      alert('Ошибка: ' + e.message);
    }
  });

  logoutBtn.addEventListener('click', async () => {
    if (!window.Auth) return alert('Сервис недоступен');
    try {
      await window.Auth.logout();
      closeSettings();
    } catch (e) {
      alert('Ошибка выхода: ' + e.message);
    }
  });

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      if (theme === 'system') {
        applySystemTheme(true);
      } else {
        applyTheme(theme, true);
      }
    });
  });
}

// ===== ЗАГЛУШКА АККАУНТА (если Auth не загрузился) =====
function initAccount() {
  const circle = document.getElementById('account-circle');
  if (circle) {
    circle.textContent = '?';
    circle.title = 'Войти';
    circle.onclick = () => {
      if (window.openLoginForm) openLoginForm();
    };
  }
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

  const navHTML = navLinks
    .map(link => `<a href="${PAGE_ROOT}${link.href}">${link.text}</a>`)
    .join('');

  header.innerHTML = `
    <a href="${PAGE_ROOT}" class="logo-container">
      <img src="${PAGE_ROOT}assets/img/logo.png" alt="MathFrame" class="logo-icon"
           data-light-src="assets/img/logo-light.png" data-dark-src="assets/img/logo.png" />
    </a>
    <nav>
      ${navHTML}
    </nav>
    <div class="account-section">
      <div class="account-circle" id="account-circle" title="Аккаунт"></div>
    </div>
  `;

  const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  updateThemeImages(currentTheme);
}

// ===== ПОДВАЛ =====
function renderFooter() {
  const footer = document.getElementById('app-footer');
  if (!footer) return;
  footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} MathFrame. Учись математике интерактивно.</p>`;
}

window.applyTheme = applyTheme;
window.applySystemTheme = applySystemTheme;