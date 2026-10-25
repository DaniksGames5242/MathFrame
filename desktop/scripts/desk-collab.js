// MathFrame — Доска (настольная версия): вход в аккаунт и связь с общими досками.
// Подключается copy-site.js вместо auth.js/common.js. Firebase-скрипты (app, auth, firestore) берутся с CDN —
// для совместной работы нужен интернет; личные доски по-прежнему работают офлайн.
(function () {
    'use strict';
    if (!window.firebase) return;   // нет сети — совместные доски недоступны, остальное работает
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
            '<div class="bd-dlg-card" role="dialog" aria-modal="true" aria-labelledby="dcTtl">' +
            '<h2 id="dcTtl">Вход в аккаунт MathFrame</h2>' +
            '<p>Общие доски хранятся на сервере — войдите с той же почтой, что и на сайте (или зарегистрируйтесь).</p>' +
            '<div style="display:grid;gap:8px;margin:10px 0">' +
            '<input id="dcMail" type="email" placeholder="Почта" autocomplete="email" style="padding:8px 10px">' +
            '<input id="dcPass" type="password" placeholder="Пароль" autocomplete="current-password" style="padding:8px 10px">' +
            '<small id="dcErr" style="color:#e5484d;min-height:1.2em"></small></div>' +
            '<div class="bd-dlg-act"><button class="mini-btn bd-ghost" id="dcReg">Регистрация</button>' +
            '<button class="mini-btn bd-ghost" id="dcReset">Забыли пароль</button>' +
            '<button class="mini-btn" id="dcLogin">Войти</button><button class="mini-btn bd-ghost" data-close>Закрыть</button></div></div>';
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
})();
