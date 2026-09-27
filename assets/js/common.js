// common.js – шапка, подвал, тема, аутентификация и настройки

// ===== АДМИН / FIRESTORE (пользователи, посещения, доступ к панели) =====
// Владельцы сайта — те, кто может назначать администраторов. Тот же список, что в правилах Firestore (isSuper()) и в api/chat.js.
const MF_SUPER_ADMIN_EMAILS = ['iagniukovd@gmail.com', 'daniksgames5242@gmail.com', 'mathframe.ru@gmail.com', 'danil.iagniukov@gmail.com'];
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

// Администратор ли пользователь: владелец (MF_SUPER_ADMIN_EMAILS) или admins/{uid}.granted.
// Результат запоминается на время жизни страницы (ошибку — нет, чтобы повторить позже).
const _mfAdminChecks = new Map(); // uid -> Promise<boolean>
function mfIsAdmin(user) {
    if (!user) return Promise.resolve(false);
    if (MF_SUPER_ADMIN_EMAILS.includes(String(user.email || '').toLowerCase())) return Promise.resolve(true);
    if (!_mfAdminChecks.has(user.uid)) {
        _mfAdminChecks.set(user.uid, ensureFirestore().then(() => {
            return firebase.firestore().collection('admins').doc(user.uid).get();
        }).then(doc => !!(doc.exists && doc.data().granted)).catch(() => {
            _mfAdminChecks.delete(user.uid);
            return false;
        }));
    }
    return _mfAdminChecks.get(user.uid);
}

let _mfAdminNavSeq = 0;
function updateAdminNavLink(user) {
    const link = document.getElementById('admin-nav-link');
    const seq = ++_mfAdminNavSeq;
    if (link && !user) link.style.display = 'none';
    mfIsAdmin(user).then(ok => {
        if (seq !== _mfAdminNavSeq) return; // пока проверяли, пользователь сменился
        if (link) link.style.display = ok ? '' : 'none';
        mfSiteNoticesOnAuth(user, ok);
    });
}

// ===== SITE NOTICES: баннер-объявление и режим техработ =====
// Источник — Firestore settings/site (пишет админ-панель, вкладка «Сайт»,
// assets/js/admin-site.js):
//   banner:      { enabled, text, kind:'info'|'warn'|'success', linkUrl, linkText,
//                  dismissible, version, expiresAt: Timestamp|null }
//   maintenance: { enabled, message, until: Timestamp|null }
// Чтение не блокирует рендер: страница рисуется как обычно, баннер/заглушка
// появляются, когда придёт ответ. Документ кэшируется в sessionStorage на
// MF_SITE_CACHE_TTL, чтобы не читать Firestore на каждом переходе. Весь текст
// из документа выводится только через textContent. Заглушка техработ — это
// удобство, а не защита: данные закрывают правила Firestore, а не этот код.
const MF_SITE_CACHE_KEY = 'mf-site-settings';
const MF_SITE_CACHE_TTL = 90 * 1000;
const MF_BANNER_CLOSED_KEY = 'mf-banner-closed';
const MF_ADMIN_HINT_KEY = 'mf-admin-hint';      // uid последнего подтверждённого админа (только чтобы не мигать заглушкой)
const _mfSite = { data: null, authKnown: false, user: null, isAdmin: false, timer: 0 };

function mfTimeMs(v) { // Firestore Timestamp | {seconds} | Date | число | строка → мс или null
    if (v === null || v === undefined || v === '') return null;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (typeof v.seconds === 'number') return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    if (v instanceof Date) return v.getTime();
    const n = typeof v === 'number' ? v : Date.parse(v);
    return Number.isFinite(n) ? n : null;
}

function mfNormalizeSiteSettings(raw) {
    const b = (raw && raw.banner) || {};
    const m = (raw && raw.maintenance) || {};
    const kind = ['info', 'warn', 'success'].includes(b.kind) ? b.kind : 'info';
    return {
        banner: {
            enabled: b.enabled === true,
            text: typeof b.text === 'string' ? b.text.trim().slice(0, 300) : '',
            kind,
            linkUrl: typeof b.linkUrl === 'string' ? b.linkUrl.trim() : '',
            linkText: typeof b.linkText === 'string' ? b.linkText.trim().slice(0, 60) : '',
            dismissible: b.dismissible === true || b.closable === true,
            version: String(b.version === undefined || b.version === null ? 0 : b.version),
            expiresAt: mfTimeMs(b.expiresAt),
        },
        maintenance: {
            enabled: m.enabled === true,
            message: typeof m.message === 'string' ? m.message.trim().slice(0, 500) : '',
            until: mfTimeMs(m.until),
        },
    };
}

// Только внутренние ссылки ('/…', но не '//…') и https://
function mfSafeBannerUrl(u) {
    u = String(u || '').trim();
    if (/^\/(?!\/)/.test(u)) return u;
    if (/^https:\/\/[^\s"<>]+$/i.test(u)) return u;
    return '';
}

function mfLoadSiteSettings() {
    try {
        const c = JSON.parse(sessionStorage.getItem(MF_SITE_CACHE_KEY) || 'null');
        if (c && c.data && Date.now() - c.t < MF_SITE_CACHE_TTL && Date.now() >= c.t) return Promise.resolve(c.data);
    } catch (e) {}
    if (!window.firebase || !firebase.apps || !firebase.apps.length) return Promise.resolve(null);
    return ensureFirestore()
        .then(() => firebase.firestore().collection('settings').doc('site').get())
        .then(doc => {
            const data = mfNormalizeSiteSettings(doc.exists ? doc.data() : {});
            try { sessionStorage.setItem(MF_SITE_CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch (e) {}
            return data;
        })
        .catch(() => null); // нет доступа/сети — сайт работает как обычно
}

function mfIsAdminPage() {
    const b = document.body;
    if (b && b.dataset && b.dataset.page === 'admin') return true;
    return /^\/(pages\/)?admin(\/|\.html|$)/.test(location.pathname);
}

// Полоса уведомлений под шапкой (#mf-notices, position: fixed — common.css,
// раздел 22). Её высота уходит в CSS-переменную --mf-notice-h на <html>: на неё
// опираются отступ body под шапкой, сайдбар справочника, высота чата AI-агента
// и липкие панели. ResizeObserver обновляет переменную каждый кадр анимации
// появления/закрытия, поэтому контент сдвигается плавно, без прыжка.
function mfNoticesHost() {
    let host = document.getElementById('mf-notices');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'mf-notices';
    host.className = 'mf-notices';
    const header = document.getElementById('app-header');
    if (header && header.parentNode) header.insertAdjacentElement('afterend', host);
    else document.body.insertBefore(host, document.body.firstChild);
    const root = document.documentElement;
    const sync = () => {
        // Дробная высота как есть (с точностью до сотых): без зазора и нахлёста в 1px
        const h = host.isConnected ? Math.round(host.getBoundingClientRect().height * 100) / 100 : 0;
        root.style.setProperty('--mf-notice-h', h + 'px');
        root.classList.toggle('mf-has-notice', h > 0);
    };
    if (window.ResizeObserver) new ResizeObserver(sync).observe(host);
    else window.addEventListener('resize', sync);
    host._mfSync = sync;
    return host;
}

function mfNoticeSync() {
    const host = document.getElementById('mf-notices');
    if (host && host._mfSync) host._mfSync();
}

// Появление/уход элемента полосы: анимируется высота (вместе с ней — отступ
// контента через --mf-notice-h). Без анимации — при reduced motion.
function mfNoticeSlide(el, show, done) {
    const fin = () => { el.style.overflow = ''; mfNoticeSync(); if (done) done(); };
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce || typeof el.animate !== 'function') { fin(); return; }
    const h = el.getBoundingClientRect().height;
    if (!h) { fin(); return; }
    el.style.overflow = 'hidden';
    const kf = [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }];
    const a = el.animate(show ? kf : [kf[1], kf[0]], {
        duration: show ? 380 : 260,
        easing: show ? 'cubic-bezier(.2,.8,.2,1)' : 'cubic-bezier(.4,0,1,1)',
        fill: show ? 'none' : 'forwards',
    });
    let ended = false;
    const end = () => { if (!ended) { ended = true; fin(); } };
    a.onfinish = end; a.oncancel = end;
    setTimeout(end, (show ? 380 : 260) + 200);
}

function mfNoticeRemove(el) {
    if (!el || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    mfNoticeSlide(el, false, () => { el.remove(); mfNoticeSync(); });
}

function mfRenderSiteBanner(b) {
    const old = document.getElementById('mf-site-banner');
    const now = Date.now();
    let closed = null;
    try { closed = localStorage.getItem(MF_BANNER_CLOSED_KEY); } catch (e) {}
    const live = b && b.enabled && b.text && !(b.expiresAt && b.expiresAt <= now) && closed !== b.version;
    if (!live) { if (old) mfNoticeRemove(old); return; }
    const url = mfSafeBannerUrl(b.linkUrl);
    const sig = JSON.stringify([b.text, b.kind, url, b.linkText, b.dismissible, b.version]);
    if (old && old.dataset.sig === sig) return;

    const el = document.createElement('div');
    el.id = 'mf-site-banner';
    el.className = 'mf-site-banner kind-' + b.kind;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Объявление');
    el.dataset.sig = sig;
    // .msb-inner — отступы и рамка строки; у самой полосы их нет, чтобы её
    // высоту можно было плавно свести к нулю
    const inner = document.createElement('div');
    inner.className = 'msb-inner';
    const text = document.createElement('span');
    text.className = 'msb-text';
    text.textContent = b.text;
    inner.appendChild(text);
    if (url) {
        const a = document.createElement('a');
        a.className = 'msb-link';
        a.href = url;
        a.textContent = b.linkText || 'Подробнее';
        if (/^https:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        inner.appendChild(a);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'msb-close' + (b.dismissible ? '' : ' is-temp');
    close.setAttribute('aria-label', 'Закрыть объявление');
    close.textContent = '×';
    close.addEventListener('click', () => {
        if (b.dismissible) { try { localStorage.setItem(MF_BANNER_CLOSED_KEY, b.version); } catch (e) {} }
        mfNoticeRemove(el);
    });
    inner.appendChild(close);
    el.appendChild(inner);

    if (old && !old.classList.contains('is-leaving')) { old.replaceWith(el); mfNoticeSync(); return; }
    if (old) old.remove();
    mfNoticesHost().appendChild(el);
    mfNoticeSync();
    mfNoticeSlide(el, true);
}

function mfRemoveMaintenance() {
    const o = document.getElementById('mf-maint');
    if (o) o.remove();
    document.documentElement.classList.remove('mf-maint-on');
}

function mfShowMaintenance(m) {
    const sig = JSON.stringify([m.message, m.until, !!_mfSite.user]);
    const old = document.getElementById('mf-maint');
    if (old && old.dataset.sig === sig) return;
    const wrap = document.createElement('div');
    wrap.id = 'mf-maint';
    wrap.className = 'mf-maint';
    wrap.dataset.sig = sig;
    wrap.setAttribute('role', 'alertdialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'mf-maint-title');
    const card = document.createElement('div');
    card.className = 'mf-maint-card';
    // Статичная иконка-шестерёнка (без пользовательских данных)
    card.innerHTML = '<div class="mf-maint-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>';
    const h = document.createElement('h1');
    h.id = 'mf-maint-title';
    h.textContent = 'Идут технические работы';
    const p = document.createElement('p');
    p.className = 'mf-maint-msg';
    p.textContent = m.message || 'Сайт временно недоступен — мы скоро вернёмся. Загляните чуть позже.';
    card.append(h, p);
    if (m.until) {
        const u = document.createElement('p');
        u.className = 'mf-maint-until';
        let when = '';
        try { when = new Date(m.until).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) {}
        if (when) { u.textContent = 'Планируем закончить: ' + when; card.appendChild(u); }
    }
    if (!_mfSite.user && typeof window.openAuthModal === 'function') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline mf-maint-login';
        btn.textContent = 'Вход для администраторов';
        btn.addEventListener('click', () => window.openAuthModal());
        card.appendChild(btn);
    }
    wrap.appendChild(card);
    if (old) old.replaceWith(wrap); else document.body.appendChild(wrap);
    document.documentElement.classList.add('mf-maint-on');
}

function mfShowMaintenanceBadge(show) {
    let el = document.getElementById('mf-maint-badge');
    if (!show) { if (el) mfNoticeRemove(el); return; }
    if (el && !el.classList.contains('is-leaving')) return;
    if (el) el.remove();
    // Строка в полосе уведомлений под шапкой, над баннером
    el = document.createElement('div');
    el.id = 'mf-maint-badge';
    el.className = 'mf-maint-badge';
    el.setAttribute('role', 'status');
    const inner = document.createElement(mfIsAdminPage() ? 'span' : 'a');
    inner.className = 'mmb-inner';
    inner.textContent = 'Включён режим техработ';
    if (inner.tagName === 'A') { inner.href = '/admin/#site'; inner.title = 'Посетители видят заглушку. Выключить — в админ-панели, вкладка «Сайт»'; }
    el.appendChild(inner);
    const host = mfNoticesHost();
    host.insertBefore(el, host.firstChild);
    mfNoticeSync();
    mfNoticeSlide(el, true);
}

function mfApplySiteNotices() {
    const d = _mfSite.data;
    if (!d || !document.body) return;
    const now = Date.now();
    mfRenderSiteBanner(d.banner);

    const m = d.maintenance;
    const active = m.enabled && !(m.until && m.until <= now);
    if (!active) { mfRemoveMaintenance(); mfShowMaintenanceBadge(false); }
    else if (_mfSite.authKnown && _mfSite.isAdmin) { mfRemoveMaintenance(); mfShowMaintenanceBadge(true); }
    else if (mfIsAdminPage()) { mfRemoveMaintenance(); mfShowMaintenanceBadge(false); } // у панели свой вход и своя проверка
    else {
        mfShowMaintenanceBadge(false);
        let hint = false;
        try { hint = !!sessionStorage.getItem(MF_ADMIN_HINT_KEY); } catch (e) {}
        // Пока вход не определён, а в этой вкладке уже подтверждался админ — не мигаем заглушкой
        if (_mfSite.authKnown || !hint) mfShowMaintenance(m);
    }

    // Когда истечёт срок баннера или техработ — перерисовать без перезагрузки
    clearTimeout(_mfSite.timer);
    const next = [d.banner.enabled ? d.banner.expiresAt : null, m.enabled ? m.until : null]
        .filter(t => t && t > now).sort((a, b) => a - b)[0];
    if (next && next - now < 864e5) _mfSite.timer = setTimeout(mfApplySiteNotices, next - now + 500);
}

function mfSiteNoticesOnAuth(user, isAdmin) {
    _mfSite.authKnown = true;
    _mfSite.user = user || null;
    _mfSite.isAdmin = !!isAdmin;
    try {
        if (isAdmin && user) sessionStorage.setItem(MF_ADMIN_HINT_KEY, user.uid);
        else sessionStorage.removeItem(MF_ADMIN_HINT_KEY);
    } catch (e) {}
    mfApplySiteNotices();
}

function mfInitSiteNotices() {
    // Если вход так и не определился (ошибка, нет auth.js) — решаем как для гостя
    setTimeout(() => { if (!_mfSite.authKnown) { _mfSite.authKnown = true; mfApplySiteNotices(); } }, 5000);
    mfLoadSiteSettings().then(data => {
        if (!data) return;
        _mfSite.data = data;
        mfApplySiteNotices();
    });
}

// ===== КОНФИГУРАЦИЯ АНИМАЦИИ ТЕМЫ =====
const THEME_ANIMATION_CONFIG = {
    expandDuration: 700,
    pauseBeforeFade: 400,
    fadeDuration: 1000,
};

/* ===== ИКОНКИ ВХОДА (встроенные, без внешних запросов) =====
   Раньше логотипы Google/Apple и аватар гостя грузились по прямым ссылкам с
   чужих сайтов (logo-teka.com, abali.ru, flaticon). Два из них уже перестали
   отвечать — и, поскольку это окно входа вставляется на КАЖДОЙ странице,
   пользователи видели «битые» картинки на кнопках входа везде. Теперь иконки
   инлайновые (тем же приёмом data:image/svg+xml, что и переключатель темы
   ниже): не зависят от чужих доменов, не создают лишних запросов и не могут
   отвалиться. Apple-логотип — две версии под тему (на светлой чёрный, на
   тёмной белый), их подменяет updateThemeImages(). */
const ICON_GOOGLE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%23FFC107' d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'/%3E%3Cpath fill='%23FF3D00' d='M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z'/%3E%3Cpath fill='%234CAF50' d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'/%3E%3Cpath fill='%231976D2' d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'/%3E%3C/svg%3E";
const APPLE_PATH = "M16.365 1.43c0 1.14-.42 2.2-1.12 3.01-.85.98-2.24 1.74-3.38 1.65-.14-1.1.42-2.27 1.09-3.01.77-.87 2.15-1.55 3.41-1.65zM20.5 17.1c-.6 1.36-.89 1.97-1.66 3.17-1.07 1.68-2.58 3.77-4.45 3.79-1.66.02-2.09-1.08-4.34-1.07-2.25.01-2.72 1.09-4.38 1.07-1.87-.02-3.3-1.91-4.37-3.58-2.99-4.66-3.3-10.13-1.46-13.04 1.31-2.07 3.38-3.28 5.32-3.28 1.98 0 3.22 1.09 4.86 1.09 1.59 0 2.56-1.09 4.85-1.09 1.73 0 3.56.94 4.87 2.57-4.28 2.34-3.59 8.45.76 10.37z";
const ICON_APPLE_LIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23111111' d='" + APPLE_PATH + "'/%3E%3C/svg%3E";
const ICON_APPLE_DARK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='" + APPLE_PATH + "'/%3E%3C/svg%3E";
const ICON_GUEST = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393a3c0' stroke-width='1.7' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8.5' r='3.75'/%3E%3Cpath d='M4.5 20.5c0-4.15 3.36-7 7.5-7s7.5 2.85 7.5 7'/%3E%3C/svg%3E";

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
    try { mfRevealPage(); } catch (e) { document.documentElement.classList.remove('mf-veil-on'); } // маска перехода (PAGE TRANSITIONS)
    injectAuthModal();
    injectSettingsModal();
    trackVisit();
    try { mfInitSiteNotices(); } catch (e) {} // баннер и техработы (SITE NOTICES), не блокирует рендер

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
    // Класс html.light может быть уже выставлен inline-скриптом в <head>
    // (чтобы не мигала тёмная тема при загрузке). Поэтому при инициализации
    // применяем тему безусловно, а не через applyTheme(): та при совпадении
    // класса выходит рано и не обновляет картинки/фон hero.
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        applyThemeImmediate(saved, false);
        updateAllThemeSelections(saved);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyThemeImmediate(prefersDark ? 'dark' : 'light', false);
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
            // Дописывать ведущий «/» можно ТОЛЬКО настоящему пути к файлу.
            // Раньше условие проверяло лишь http:// и https://, поэтому
            // встроенная картинка «data:image/svg+xml,…» превращалась в
            // «/data:image/svg+xml,…» — браузер шёл за ней на сервер и,
            // естественно, получал 404 (иконка входа Apple пропадала при
            // первой же смене темы). Проверяем наличие любой схемы «xxx:»
            // и протокол-относительный «//…», а не два конкретных префикса.
            const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//');
            if (!hasScheme && !src.startsWith('/')) {
                src = '/' + src;
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
        circle.innerHTML = `<img src="${ICON_GUEST}" alt="Гость" style="width:100%;height:100%;object-fit:cover;" />`;
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
          <img src="${ICON_GOOGLE}" alt="Google" />
        </button>
        <button class="social-btn" id="apple-login-btn">
          <img src="${ICON_APPLE_DARK}" alt="Apple"
               data-light-src="${ICON_APPLE_LIGHT}"
               data-dark-src="${ICON_APPLE_DARK}" />
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
          <!-- без пустого src="": браузер трактует его как ссылку на саму
               страницу и повторно скачивает весь HTML-документ (лишний запрос
               + ошибка загрузки в консоли). Настоящий src проставляет
               populateSettings(), когда у пользователя есть аватар. -->
          <img id="avatar-img" alt="" style="display:none" />
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

      <div style="margin: 1.2rem 0 0.8rem; border-top:1px solid var(--border); padding-top:1rem;">
        <div style="font-weight:600; font-size:0.85rem; margin-bottom:0.6rem; color:var(--text-secondary); text-align:center;">Анимации</div>
        <div id="anim-toggle-settings" style="display:flex; gap:.5rem; justify-content:center;">
          <button class="btn small" type="button" data-anim="on">Включены</button>
          <button class="btn small" type="button" data-anim="off">Выключены</button>
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

    // ===== Переключатель анимаций =====
    // Независим от prefers-reduced-motion: пользователь мог явно захотеть
    // выключить украшательство на самом сайте. mathframe-ui.js читает тот же
    // ключ localStorage максимально рано (до DOMContentLoaded), поэтому
    // класс на <html> уже стоит корректно при первой отрисовке — здесь
    // только переключаем его вживую и подсвечиваем активную кнопку.
    const animToggleSettings = document.getElementById('anim-toggle-settings');
    function updateAnimToggle() {
        const off = localStorage.getItem('mf-motion') === 'off';
        animToggleSettings.querySelectorAll('button').forEach(b => {
            b.classList.toggle('primary', (b.dataset.anim === 'off') === off);
        });
    }
    animToggleSettings.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const off = b.dataset.anim === 'off';
            if (off) {
                localStorage.setItem('mf-motion', 'off');
                document.documentElement.classList.add('mf-no-motion');
            } else {
                localStorage.removeItem('mf-motion');
                document.documentElement.classList.remove('mf-no-motion');
            }
            updateAnimToggle();
        });
    });
    updateAnimToggle();

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
    // page — ключ раздела: совпадает с <body data-page> и с токенами
    // --page-color-<page> в common.css (цвет подсветки и маски перехода).
    const navLinks = [
        { href: '/', text: 'Главная', page: 'home' },
        { href: '/spravochnik/', text: 'Справочник', page: 'reference' },
        { href: '/mini-services/', text: 'Мини‑сервисы', page: 'services' },
        { href: '/forum/', text: 'Форум', page: 'forum' },
        { href: '/ai-agent/', text: 'AI‑агент', page: 'ai-agent' },
        { href: '/playground/', text: 'Песочница', page: 'playground' },
    ];

    const currentPath = window.location.pathname;
    const currentPage = (document.body && document.body.dataset.page) || '';

    const navHTML = navLinks
        .map(link => {
            // Для корня — только точное совпадение, иначе '/' считался бы
            // префиксом любого пути и «Главная» подсвечивалась бы везде.
            // Запасной признак — <body data-page>: работает и при открытии
            // файла по «сырому» пути (/pages/home.html, локальный сервер).
            const isActive = (link.href === '/'
                ? (currentPath === '/' || currentPath === '')
                : (currentPath === link.href || currentPath.startsWith(link.href)))
                || currentPage === link.page;
            const activeClass = isActive ? ' active' : '';
            const aria = isActive ? ' aria-current="page"' : '';
            return `<a href="${link.href}" class="nav-link${activeClass}" data-nav-page="${link.page}"${aria}>${link.text}</a>`;
        })
        .join('');

    header.innerHTML = `
    <a href="/" class="logo-container" data-nav-page="home">
      <img src="/assets/img/logo.png" alt="MathFrame" class="logo-icon"
           data-light-src="/assets/img/logo-light.png" data-dark-src="/assets/img/logo.png" />
    </a>
    <nav id="app-nav">${navHTML}<a href="/admin/" id="admin-nav-link" class="nav-link${currentPage === 'admin' ? ' active' : ''}" data-nav-page="admin" style="display:none;">Админ панель</a></nav>
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
    footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} MathFrame. Учись математике интерактивно.</p>` +
        mfContactHTML('mf-contact--footer');
    // Другие места с контактами (например, боковая панель AI-агента, где подвала нет)
    document.querySelectorAll('[data-mf-contact]').forEach(slot => {
        slot.innerHTML = mfContactHTML('mf-contact--compact');
    });
}

/* Контакты разработчика — один источник для подвала и страницы AI-агента */
const MF_CONTACT = {
    email: 'mathframe.ru@gmail.com',
    telegram: 'danik101011'
};
function mfContactHTML(mod) {
    const iconMail = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>';
    const iconTg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.2 4.3 2.9 11.4c-.9.35-.85 1.64.07 1.9l4.53 1.3 1.73 5.3c.24.74 1.18.95 1.72.38l2.47-2.6 4.6 3.4c.66.48 1.6.12 1.77-.68L22.6 5.6c.2-.93-.6-1.63-1.4-1.3Z"/><path d="m7.5 14.6 10.4-7.1"/></svg>';
    return `<div class="mf-contact ${mod || ''}">` +
        `<span class="mf-contact-title">Связаться с разработчиком:</span>` +
        `<a class="mf-contact-link" href="mailto:${MF_CONTACT.email}">${iconMail}<span>${MF_CONTACT.email}</span></a>` +
        `<a class="mf-contact-link" href="https://t.me/${MF_CONTACT.telegram}" target="_blank" rel="noopener noreferrer" aria-label="Telegram @${MF_CONTACT.telegram} (откроется в новой вкладке)">${iconTg}<span>@${MF_CONTACT.telegram}</span></a>` +
        `</div>`;
}

/* ===== ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ (PAGE TRANSITIONS) =====
   Та же идея, что у animateThemeChange: маска расширяется из точки клика.
   1) Уход (эта страница): по клику на пункт шапки/логотип поверх страницы
      раскрываются два круга — «волна» чистого цвета целевого раздела
      (--page-color-<раздел>) и следом за ней заливка того же цвета,
      смешанного с фоном темы. Когда заливка закрыла экран — навигация.
   2) Состояние (цвета, координаты, время) кладётся в sessionStorage.
   3) Приход (новая страница): inline-скрипт в <head> ещё ДО первого кадра
      ставит html.mf-veil-on — экран залит тем же цветом (см. common.css
      § 21.2), поэтому загрузка не видна. mfRevealPage() заменяет его на
      .mf-veil и открывает страницу расширяющимся «окном» из той же точки.
   Обычное поведение (без анимации): Ctrl/Cmd/Shift/Alt/средний клик,
   target=_blank, download, чужой домен, та же страница, reduced motion /
   «Анимации: выкл». Страховки: таймеры на обеих сторонах, pageshow(bfcache),
   проверка типа навигации (Назад/Вперёд/перезагрузка — без маски). */
const MF_VEIL_KEY = 'mf-veil';
const PAGE_TRANSITION_CONFIG = {
    expandDuration: 520,   // раскрытие маски на уходе
    ringLead: 90,          // на сколько «волна» цвета опережает заливку
    revealDuration: 680,   // раскрытие новой страницы
    revealMaxWait: 420,    // сколько максимум ждать window.load перед раскрытием
    leaveTimeout: 6000,    // если навигация так и не случилась — снять маску
};
let mfLeaving = false;
let mfLeaveTimer = 0;

function mfMotionOff() {
    if (window.MathFrameUI && typeof window.MathFrameUI.motionOff === 'function') {
        try { return window.MathFrameUI.motionOff(); } catch (e) {}
    }
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch (e) {}
    return document.documentElement.classList.contains('mf-no-motion');
}

function mfParseHex(s) {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(s || '').trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Цвета перехода в раздел page для текущей темы: чистый цвет раздела и
// «заливка» — он же, растворённый в фоне темы (ей закрывается экран).
function mfPageColors(page) {
    const html = document.documentElement;
    const cs = getComputedStyle(html);
    const light = html.classList.contains('light');
    const color = cs.getPropertyValue('--page-color-' + page).trim()
        || cs.getPropertyValue('--page-color-home').trim()
        || (light ? '#2f5fe0' : '#5b8cff');
    const bg = cs.getPropertyValue('--mf-ink-0').trim() || (light ? '#fbfcfe' : '#04060c');
    const c = mfParseHex(color), b = mfParseHex(bg);
    let fill = bg, ring = color;
    if (c && b) {
        const mix = k => 'rgb(' + [0, 1, 2].map(i => Math.round(b[i] + (c[i] - b[i]) * k)).join(',') + ')';
        fill = mix(light ? 0.13 : 0.2);
        // Светлая тема: чистый насыщенный цвет раздела во всю ширину кольца
        // выглядит на светлом фоне тяжёлой тёмной полосой — слегка
        // растворяем его в фоне (тёмная тема без изменений).
        if (light) ring = mix(0.62);
    }
    return { color: ring, fill, light };
}

function mfMakeVeil(bg) {
    const v = document.createElement('div');
    v.className = 'mf-veil';
    v.style.background = bg;
    return v;
}

function mfCancelLeave() {
    clearTimeout(mfLeaveTimer);
    mfLeaving = false;
    document.documentElement.classList.remove('mf-veil-leaving');
    document.querySelectorAll('.mf-veil-out').forEach(n => n.remove());
}

function mfStartPageLeave(a, e, page) {
    const cfg = PAGE_TRANSITION_CONFIG;
    const { color, fill, light } = mfPageColors(page);
    const W = window.innerWidth, H = window.innerHeight;
    let x = e.clientX, y = e.clientY;
    // Enter с клавиатуры: у события нет координат — берём центр ссылки
    if (!e.detail || (!x && !y)) {
        const r = a.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    const R = Math.ceil(Math.hypot(Math.max(x, W - x), Math.max(y, H - y))) + 4;

    try {
        sessionStorage.setItem(MF_VEIL_KEY, JSON.stringify({
            page, color, fill, light, x: Math.round(x), y: Math.round(y), w: W, h: H, t: Date.now()
        }));
    } catch (err) { return false; } // без sessionStorage переход был бы с «морганием» — не анимируем

    // Страница начинает грузиться, пока идёт анимация
    try {
        const pf = document.createElement('link');
        pf.rel = 'prefetch'; pf.href = a.href;
        document.head.appendChild(pf);
    } catch (err) {}

    mfLeaving = true;
    document.documentElement.classList.add('mf-veil-leaving');
    const from = `circle(0px at ${x}px ${y}px)`, to = `circle(${R}px at ${x}px ${y}px)`;
    const ease = 'cubic-bezier(0.65, 0, 0.35, 1)';
    const ring = mfMakeVeil(color), cover = mfMakeVeil(fill);
    ring.classList.add('mf-veil-out'); cover.classList.add('mf-veil-out');
    ring.style.clipPath = cover.style.clipPath = from;
    // В <html>, а не в <body>: у body бывает transform (анимация mf-page-enter),
    // и тогда position:fixed считался бы от body, а не от окна.
    document.documentElement.appendChild(ring);
    document.documentElement.appendChild(cover);
    ring.offsetHeight; // reflow — чтобы transition стартовал с нулевого круга
    ring.style.transition = `clip-path ${cfg.expandDuration}ms ${ease}`;
    cover.style.transition = `clip-path ${cfg.expandDuration}ms ${ease} ${cfg.ringLead}ms`;
    ring.style.clipPath = to;
    cover.style.clipPath = to;

    let gone = false;
    const go = () => {
        if (gone) return;
        gone = true;
        window.location.assign(a.href);
    };
    cover.addEventListener('transitionend', go, { once: true });
    setTimeout(go, cfg.expandDuration + cfg.ringLead + 80);
    clearTimeout(mfLeaveTimer);
    mfLeaveTimer = setTimeout(mfCancelLeave, cfg.leaveTimeout);
    return true;
}

function mfOnNavClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href][data-nav-page]');
    if (!a) return;
    if (mfLeaving) { e.preventDefault(); return; }       // двойной клик во время перехода
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // та же страница
    if (mfMotionOff()) return;
    if (mfStartPageLeave(a, e, a.dataset.navPage || 'home')) e.preventDefault();
}

function mfRevealPage() {
    const v = window.__mfVeil;
    const html = document.documentElement;
    window.__mfVeil = null;
    if (!v) { html.classList.remove('mf-veil-on'); return; }
    if (!html.classList.contains('mf-veil-on') || mfMotionOff()) {
        html.classList.remove('mf-veil-on');
        return;
    }
    const cfg = PAGE_TRANSITION_CONFIG;
    const veil = mfMakeVeil(v.fill);
    veil.classList.add('mf-veil-in');
    document.documentElement.appendChild(veil);
    // В том же кадре, что и вставка .mf-veil — подмена незаметна
    html.classList.remove('mf-veil-on');
    html.style.removeProperty('--mf-veil-fill');

    const W = window.innerWidth, H = window.innerHeight;
    // Точка клика с прошлой страницы (если окно успело изменить размер — масштабируем)
    const x = Math.max(0, Math.min(W, v.w ? v.x * W / v.w : v.x));
    const y = Math.max(0, Math.min(H, v.h && Math.abs(v.h - H) > 80 ? v.y * H / v.h : v.y));
    const band = Math.max(120, Math.min(W, H) * 0.22);  // цветная кромка у края «окна»
    const feather = 28;
    const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + feather + 4;
    const at = `circle at ${x}px ${y}px`;
    const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

    let done = false, started = false;
    const finish = () => { if (done) return; done = true; veil.remove(); };
    const frame = t0 => function step(t) {
        if (done) return;
        const p = Math.min(1, Math.max(0, (t - t0) / cfg.revealDuration));
        const r = easeInOut(p) * R;
        veil.style.background = `radial-gradient(${at}, ${v.color} ${r.toFixed(1)}px, ${v.fill} ${(r + band).toFixed(1)}px)`;
        const m = `radial-gradient(${at}, transparent ${r.toFixed(1)}px, #000 ${(r + feather).toFixed(1)}px)`;
        veil.style.webkitMaskImage = m;
        veil.style.maskImage = m;
        veil.style.opacity = p > 0.55 ? String(1 - (p - 0.55) / 0.45) : '1';
        if (p < 1) requestAnimationFrame(step); else finish();
    };
    const start = () => {
        if (started) return;
        started = true;
        requestAnimationFrame(t => requestAnimationFrame(frame(t)));
    };
    // Даём странице дорисоваться (шрифты, KaTeX, шапка), но недолго
    if (document.readyState === 'complete') setTimeout(start, 40);
    else {
        window.addEventListener('load', () => setTimeout(start, 20), { once: true });
        setTimeout(start, cfg.revealMaxWait);
    }
    // rAF замирает во фоновой вкладке — маска не должна «зависнуть»
    setTimeout(finish, cfg.revealMaxWait + cfg.revealDuration + 1200);
}

(function initPageTransitions() {
    document.addEventListener('click', mfOnNavClick);
    // Возврат кнопкой «Назад» из bfcache: страница восстановлена вместе с
    // маской ухода — снимаем её.
    window.addEventListener('pageshow', ev => {
        if (ev.persisted) {
            mfCancelLeave();
            document.documentElement.classList.remove('mf-veil-on');
            document.querySelectorAll('.mf-veil').forEach(n => n.remove());
        }
    });
})();

window.applyTheme = applyTheme;
window.applySystemTheme = applySystemTheme;