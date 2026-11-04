// MathFrame — Доска (настольная версия): вход в аккаунт и связь с общими досками.
// Подключается copy-site.js вместо auth.js/common.js. Firebase-скрипты (app, auth, firestore) берутся с CDN —
// для совместной работы нужен интернет; личные доски по-прежнему работают офлайн.
(function () {
    'use strict';
    if (!window.firebase) {
        document.addEventListener('DOMContentLoaded', function () {
            const button = document.getElementById('bdProfile');
            if (button) button.addEventListener('click', function () {
                alert('Сервис входа недоступен. Проверьте подключение к интернету и перезапустите приложение.');
            });
        });
        return;
    }
    firebase.initializeApp({
        apiKey: 'AIzaSyBaxewKo6Aoi5nTOcjkZfvg0IyKssWR5us',
        authDomain: 'mathframe-ff436.firebaseapp.com',
        projectId: 'mathframe-ff436',
        storageBucket: 'mathframe-ff436.firebasestorage.app',
        messagingSenderId: '470778322895',
        appId: '1:470778322895:web:7180eccc946e907bcbbcba',
    });
    firebase.auth().languageCode = 'ru';

    // board.js ждёт эту функцию (на сайте её даёт common.js)
    window.ensureFirestore = function () {
        return window.firebase && firebase.firestore ? Promise.resolve() : Promise.reject(new Error('Firebase недоступен'));
    };

    const ERR = {
        'auth/invalid-email': 'Неверный адрес почты',
        'auth/user-not-found': 'Аккаунт не найден — нажмите «Регистрация»',
        'auth/wrong-password': 'Неверный пароль',
        'auth/invalid-credential': 'Неверная почта или пароль',
        'auth/email-already-in-use': 'Такая почта уже зарегистрирована — нажмите «Войти»',
        'auth/weak-password': 'Пароль слишком короткий (минимум 6 символов)',
        'auth/network-request-failed': 'Нет подключения к интернету',
        'auth/too-many-requests': 'Слишком много попыток — попробуйте позже',
    };

    let dlg = null;
    window.openAuthModal = function () {
        if (dlg) { dlg.hidden = false; return; }
        dlg = document.createElement('div');
        dlg.className = 'bd-dlg';
        dlg.innerHTML =
            '<div class="bd-dlg-card dc-auth" role="dialog" aria-modal="true" aria-labelledby="dcTtl">' +
            '<div class="modal-header"><h2 id="dcTtl">Вход</h2><button type="button" class="modal-close" data-close aria-label="Закрыть">✕</button></div>' +
            '<p>Войдите с почтой и паролем аккаунта MathFrame.</p>' +
            '<div class="login-form"><label class="auth-field"><span>Email</span><input id="dcMail" type="email" placeholder="you@mail.ru" autocomplete="email"></label>' +
            '<label class="auth-field"><span>Пароль</span><input id="dcPass" type="password" placeholder="••••••" autocomplete="current-password"></label>' +
            '<small id="dcErr" role="status" style="color:#e5484d"></small>' +
            '<button type="button" class="btn primary" id="dcLogin">Войти</button>' +
            '<button type="button" class="auth-link" id="dcReset">Забыли пароль?</button>' +
            '<button type="button" class="auth-link" id="dcReg">Создать аккаунт</button></div></div>';
        document.body.appendChild(dlg);
        const $ = (id) => dlg.querySelector('#' + id), err = (m) => { $('dcErr').textContent = m || ''; };
        const run = async (fn) => {
            err('');
            try {
                await fn($('dcMail').value.trim(), $('dcPass').value);
                dlg.hidden = true;
                location.reload();   // доска переподключается уже с аккаунтом
            } catch (e) { err(ERR[e && e.code] || (e && e.message) || 'Не удалось войти'); }
        };
        $('dcLogin').onclick = () => run((m, p) => firebase.auth().signInWithEmailAndPassword(m, p));
        $('dcReg').onclick = () => run((m, p) => firebase.auth().createUserWithEmailAndPassword(m, p));
        $('dcReset').onclick = async () => {
            try { await firebase.auth().sendPasswordResetEmail($('dcMail').value.trim()); err('Письмо для сброса пароля отправлено'); }
            catch (e) { err(ERR[e && e.code] || 'Введите почту'); }
        };
        dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.hidden = true; });
        dlg.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('dcLogin').click(); });
    };
    document.addEventListener('DOMContentLoaded', function () {
        const button = document.getElementById('bdProfile');
        if (!button) return;
        button.addEventListener('click', function () {
            const user = firebase.auth().currentUser;
            if (!user) { window.openAuthModal(); return; }
            const profile = document.createElement('div');
            profile.className = 'bd-dlg';
            profile.innerHTML = '<div class="bd-dlg-card" role="dialog" aria-modal="true" aria-labelledby="dcProfileTitle"><h2 id="dcProfileTitle">Профиль</h2><p id="dcProfileEmail"></p><div class="bd-dlg-act"><button class="mini-btn bd-ghost" data-close>Закрыть</button><button class="mini-btn" id="dcSignOut">Выйти</button></div></div>';
            profile.querySelector('#dcProfileEmail').textContent = user.email || user.displayName || 'Аккаунт MathFrame';
            profile.addEventListener('click', function (e) { if (e.target === profile || e.target.closest('[data-close]')) profile.remove(); });
            profile.querySelector('#dcSignOut').onclick = async function () {
                try { await firebase.auth().signOut(); location.reload(); }
                catch (e) { profile.querySelector('#dcProfileEmail').textContent = (e && e.message) || 'Не удалось выйти'; }
            };
            document.body.appendChild(profile);
        });
    });
})();
