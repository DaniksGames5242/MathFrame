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
    document.querySelectorAll('.theme-option, .st-theme').forEach(btn => {
        const isActive = btn.dataset.theme === theme;
        btn.classList.toggle('active', isActive);
        if (btn.classList.contains('st-theme')) btn.setAttribute('aria-checked', isActive);
    });
}

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let populateSettingsRef = null;

// ===== ФУНКЦИЯ ПРЕОБРАЗОВАНИЯ ОШИБОК FIREBASE (расширенная) =====
function getFirebaseErrorMessage(error, provider) {
    const code = error && error.code;
    switch (code) {
        // Email/пароль
        case 'auth/email-already-in-use': return 'Почта уже используется в существующем аккаунте.';
        case 'auth/invalid-email': return 'Некорректный формат email.';
        case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).';
        case 'auth/user-not-found': return 'Пользователь с таким email не найден.';
        case 'auth/wrong-password': return 'Неверный пароль.';
        case 'auth/invalid-credential':
        case 'auth/invalid-login-credentials':
            return provider
                ? `${provider} вернул некорректный ответ. Попробуйте ещё раз; если повторяется — вход через ${provider} временно недоступен.`
                : 'Неверный email или пароль.';
        case 'auth/missing-password': return 'Введите пароль.';
        case 'auth/missing-email': return 'Введите email.';
        case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже.';
        case 'auth/network-request-failed': return 'Ошибка сети. Проверьте подключение.';
        case 'auth/internal-error': return 'Внутренняя ошибка сервера. Попробуйте позже.';
        case 'auth/user-disabled': return 'Аккаунт отключён. Обратитесь к администратору.';
        case 'auth/operation-not-allowed':
            return provider ? `Вход через ${provider} пока не включён на сайте.` : 'Этот способ входа отключён.';
        case 'auth/requires-recent-login': return 'Требуется повторная авторизация.';

        // Телефон
        case 'auth/invalid-verification-code': return 'Неверный код подтверждения.';
        case 'auth/code-expired': return 'Код подтверждения истёк. Запросите новый.';
        case 'auth/invalid-phone-number': return 'Неверный формат номера телефона.';
        case 'auth/missing-phone-number': return 'Введите номер телефона.';
        case 'auth/quota-exceeded': return 'Превышен лимит отправки SMS. Попробуйте позже.';

        // Общие
        case 'auth/popup-closed-by-user': return 'Окно входа было закрыто. Попробуйте снова.';
        case 'auth/popup-blocked': return 'Браузер заблокировал окно входа. Разрешите всплывающие окна для сайта.';
        case 'auth/unauthorized-domain': return 'Этот адрес сайта не разрешён для входа. Откройте сайт по основному адресу.';
        case 'auth/web-storage-unsupported': return 'Браузер блокирует хранилище (приватный режим?). Попробуйте обычное окно.';
        case 'auth/invalid-oauth-client-id':
        case 'auth/invalid-oauth-provider': return 'Вход через этого провайдера настроен неверно.';
        case 'auth/user-token-expired': return 'Сессия устарела. Войдите снова.';
        case 'auth/captcha-check-failed': return 'Проверка reCAPTCHA не пройдена. Обновите страницу и попробуйте снова.';
        case 'auth/credential-already-in-use': return 'Этот аккаунт уже привязан к другому пользователю.';
        case 'auth/cancelled-popup-request': return 'Запрос входа был отменён.';
        case 'auth/account-exists-with-different-credential':
            return 'Аккаунт с этой почтой уже создан другим способом. Войдите так же, как в первый раз (email или другая соцсеть).';

        default: return (error && error.message ? error.message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '') : '') || 'Неизвестная ошибка.';
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
            // Вход/регистрация из модалки сами показывают своё сообщение и
            // выходят из аккаунта — не перебиваем их здесь.
            if (window.__mfAuthFlow) return;
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
        registerBtn.onclick = (e) => { e.preventDefault(); window.openAuthModal('register'); };
    }
}

// ===== МОДАЛЬНОЕ ОКНО ВХОДА =====
let recaptchaVerifier = null;
let confirmationResult = null;

const AUTH_THEME_SELECTOR_HTML = `<div id="theme-selector-auth">
          <button class="theme-option" data-theme="light" title="Светлая">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cline x1='12' y1='1' x2='12' y2='3'/%3E%3Cline x1='12' y1='21' x2='12' y2='23'/%3E%3Cline x1='4.22' y1='4.22' x2='5.64' y2='5.64'/%3E%3Cline x1='18.36' y1='18.36' x2='19.78' y2='19.78'/%3E%3Cline x1='1' y1='12' x2='3' y2='12'/%3E%3Cline x1='21' y1='12' x2='23' y2='12'/%3E%3Cline x1='4.22' y1='19.78' x2='5.64' y2='18.36'/%3E%3Cline x1='18.36' y1='5.64' x2='19.78' y2='4.22'/%3E%3C/svg%3E" alt="Светлая" />
          </button>
          <button class="theme-option" data-theme="dark" title="Тёмная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/%3E%3C/svg%3E" alt="Тёмная" />
          </button>
          <button class="theme-option" data-theme="system" title="Системная">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='3' width='20' height='14' rx='2' ry='2'/%3E%3Cline x1='8' y1='21' x2='16' y2='21'/%3E%3Cline x1='12' y1='17' x2='12' y2='21'/%3E%3C/svg%3E" alt="Системная" />
          </button>
        </div>`;

// Режим производительности (ключ mf-perf читает и mathframe-ui.js до запуска фона).
// Отдельная галочка (не тема): в окне входа — для гостей, и в настройках аккаунта.
// Включение гасит анимации и эффекты сразу (CSS html.mf-perf + пауза фона в mathframe-ui.js).
function perfModeOn() { try { return localStorage.getItem('mf-perf') === 'on'; } catch (e) { return false; } }
function setPerfMode(on) {
    try { if (on) localStorage.setItem('mf-perf', 'on'); else localStorage.removeItem('mf-perf'); } catch (e) {}
    document.documentElement.classList.toggle('mf-perf', on);
    if (on) document.documentElement.classList.add('mf-lite');
    document.querySelectorAll('#perf-toggle-settings, #perf-toggle-auth').forEach(i => { i.checked = on; });
}

function injectAuthModal() {
    if (document.getElementById('auth-modal')) return;

    const themeHTML = AUTH_THEME_SELECTOR_HTML;
    const eye = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const html = `
    <div class="overlay" id="auth-overlay"></div>
    <div class="modal auth-modal" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div class="modal-header">
        <h2 id="auth-title">Вход</h2>
        <button type="button" class="modal-close" id="auth-close" aria-label="Закрыть">✕</button>
      </div>
      <div class="auth-tabs" role="tablist">
        <button type="button" class="auth-tab active" id="tab-login" role="tab">Войти</button>
        <button type="button" class="auth-tab" id="tab-register" role="tab">Создать аккаунт</button>
      </div>
      <div class="auth-message" id="auth-message" role="status" aria-live="polite"></div>

      <form class="login-form" id="login-section" novalidate>
        <label class="auth-field">
          <span>Email или телефон</span>
          <input type="text" id="login-email-phone" autocomplete="username" inputmode="email"
                 autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="you@mail.ru или +7…" />
        </label>
        <label class="auth-field" id="login-password-field">
          <span>Пароль</span>
          <div class="pw-wrap">
            <input type="password" id="login-password" autocomplete="current-password" placeholder="••••••" />
            <button type="button" class="pw-toggle" aria-label="Показать пароль" tabindex="-1">${eye}</button>
          </div>
        </label>
        <button type="submit" class="btn primary" id="login-submit">Войти</button>
        <button type="button" class="auth-link" id="forgot-password-btn">Забыли пароль?</button>
      </form>

      <form class="login-form" id="register-section" style="display:none;" novalidate>
        <label class="auth-field">
          <span>Email</span>
          <input type="email" id="reg-email-phone" autocomplete="email" inputmode="email"
                 autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="you@mail.ru" />
        </label>
        <label class="auth-field">
          <span>Никнейм <em>необязательно</em></span>
          <input type="text" id="reg-nickname" autocomplete="nickname" maxlength="40" placeholder="Как к вам обращаться" />
        </label>
        <label class="auth-field">
          <span>Пароль</span>
          <div class="pw-wrap">
            <input type="password" id="reg-password" autocomplete="new-password" placeholder="Не меньше 6 символов" />
            <button type="button" class="pw-toggle" aria-label="Показать пароль" tabindex="-1">${eye}</button>
          </div>
        </label>
        <button type="submit" class="btn primary" id="register-submit">Зарегистрироваться</button>
      </form>

      <form id="phone-verify-section" novalidate>
        <label class="auth-field">
          <span>Код из SMS</span>
          <input type="text" id="verification-code" autocomplete="one-time-code" inputmode="numeric" maxlength="6" placeholder="123456" />
        </label>
        <button type="submit" class="btn primary" id="verify-code-btn">Подтвердить</button>
        <button type="button" class="auth-link" id="cancel-phone-verify">← Назад</button>
      </form>

      <div class="divider" id="auth-divider"><span>или</span></div>
      <div class="social-icons" id="auth-social">
        <button type="button" class="social-btn" id="google-login-btn">
          <img src="${ICON_GOOGLE}" alt="" /><span>Продолжить с Google</span>
        </button>
        <button type="button" class="social-btn" id="apple-login-btn">
          <img src="${ICON_APPLE_DARK}" alt=""
               data-light-src="${ICON_APPLE_LIGHT}"
               data-dark-src="${ICON_APPLE_DARK}" /><span>Продолжить с Apple</span>
        </button>
      </div>
      <div id="recaptcha-container"></div>

      <div class="auth-theme">
        <div class="auth-theme-title">Тема</div>
        ${themeHTML}
        <label class="auth-perf">
          <input type="checkbox" id="perf-toggle-auth" />
          <span><b>Режим производительности</b><small>Для слабых устройств: без анимаций, живого фона и эффектов</small></span>
        </label>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const currentMode = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    updateThemeImages(currentMode);

    const $ = (id) => document.getElementById(id);
    const overlay = $('auth-overlay');
    const modal = $('auth-modal');
    const titleEl = $('auth-title');
    const tabLogin = $('tab-login');
    const tabRegister = $('tab-register');
    const loginSection = $('login-section');
    const registerSection = $('register-section');
    const phoneVerifySection = $('phone-verify-section');
    const socialBlock = [$('auth-divider'), $('auth-social')];
    const messageEl = $('auth-message');
    let isOpen = false;

    const perfAuth = $('perf-toggle-auth');
    perfAuth.checked = perfModeOn();
    perfAuth.addEventListener('change', () => setPerfMode(perfAuth.checked));
    modal.querySelectorAll('#theme-selector-auth .theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme === 'system') applySystemTheme(true, true);
            else applyTheme(theme, true, true);
        });
    });

    modal.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.classList.toggle('on', show);
            btn.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
        });
    });

    // Поле входа: если ввели не email, а телефон — пароль не нужен
    const loginId = $('login-email-phone');
    loginId.addEventListener('input', () => {
        const v = loginId.value.trim();
        const phone = /^\+?[\d\s()-]{5,}$/.test(v) && !v.includes('@');
        $('login-password-field').style.display = phone ? 'none' : '';
        $('login-submit').textContent = phone ? 'Получить код' : 'Войти';
        $('forgot-password-btn').style.display = phone ? 'none' : '';
    });

    function setSocialVisible(v) { socialBlock.forEach(el => el.style.display = v ? '' : 'none'); }

    function showLoginTab(keepMessage) {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'true');
        tabRegister.setAttribute('aria-selected', 'false');
        titleEl.textContent = 'Вход';
        loginSection.style.display = 'flex';
        registerSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
        setSocialVisible(true);
        if (!keepMessage) clearMessage();
    }

    function showRegisterTab() {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        tabRegister.setAttribute('aria-selected', 'true');
        tabLogin.setAttribute('aria-selected', 'false');
        titleEl.textContent = 'Регистрация';
        registerSection.style.display = 'flex';
        loginSection.style.display = 'none';
        phoneVerifySection.classList.remove('active');
        setSocialVisible(true);
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

    function showVerifyNotice() {
        messageEl.className = 'auth-message info';
        messageEl.innerHTML = `Подтвердите email по ссылке из письма. Не пришло — проверьте «Спам» или
            <span class="resend-link" id="resend-verification-link">отправьте повторно</span>.`;
        messageEl.style.display = 'block';
    }

    // Кнопка в состоянии «идёт запрос»: блокируем повторные нажатия, пока
    // предыдущий запрос не завершился (раньше двойной тап слал два запроса).
    let busy = false;
    async function withBusy(btn, fn) {
        if (busy) return;
        busy = true;
        modal.classList.add('auth-busy');
        btn?.classList.add('loading');
        try { await fn(); }
        finally {
            busy = false;
            modal.classList.remove('auth-busy');
            btn?.classList.remove('loading');
        }
    }

    function resetFields() {
        ['login-email-phone', 'login-password', 'reg-email-phone', 'reg-nickname', 'reg-password', 'verification-code']
            .forEach(id => { $(id).value = ''; });
        modal.querySelectorAll('.pw-wrap input').forEach(i => { i.type = 'password'; });
        modal.querySelectorAll('.pw-toggle').forEach(b => b.classList.remove('on'));
        loginId.dispatchEvent(new Event('input'));
    }

    function openAuth(tab) {
        const keepMessage = messageEl.style.display === 'block' && !isOpen;
        isOpen = true;
        document.body.classList.add('no-scroll');
        overlay.style.visibility = 'visible';
        modal.style.visibility = 'visible';
        modal.classList.remove('sheet-full');
        modal.scrollTop = 0;
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
        });
        resetFields();
        confirmationResult = null;
        if (tab === 'register') showRegisterTab();
        else showLoginTab(keepMessage);

        const currentTheme = localStorage.getItem('theme') || 'system';
        updateAllThemeSelections(currentTheme);
        updateThemeImages(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    }

    window.openAuthModal = openAuth;

    function closeAuth() {
        if (!isOpen) return;
        isOpen = false;
        overlay.classList.remove('active');
        modal.classList.remove('active');
        modal.style.transform = '';
        setTimeout(() => {
            if (isOpen) return;
            overlay.style.visibility = 'hidden';
            modal.style.visibility = 'hidden';
            modal.classList.remove('sheet-full');
            document.body.classList.remove('no-scroll');
            clearMessage();
        }, 300);
    }
    window.closeAuthModal = closeAuth;

    overlay.addEventListener('click', closeAuth);
    $('auth-close').addEventListener('click', closeAuth);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeAuth(); });
    tabLogin.addEventListener('click', () => showLoginTab());
    tabRegister.addEventListener('click', showRegisterTab);
    enableSheetDrag(modal, closeAuth);

    const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

    // ===== ВХОД ПО EMAIL =====
    async function handleLoginEmail(email, password) {
        try {
            window.__mfAuthFlow = 'login';
            const result = await window.Auth.loginWithEmail(email, password);
            if (!result.user.emailVerified) {
                // Письмо повторно отправляем, пока пользователь ещё авторизован
                const user = result.user;
                showVerifyNotice();
                $('resend-verification-link').onclick = async () => {
                    try {
                        await user.sendEmailVerification();
                        setMessage('Письмо отправлено повторно. Проверьте почту (и папку «Спам»).', 'success');
                    } catch (e) {
                        setMessage(getFirebaseErrorMessage(e), 'error');
                    }
                };
                await window.Auth.logout();
                return;
            }
            closeAuth();
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        } finally {
            window.__mfAuthFlow = null;
        }
    }

    // ===== РЕГИСТРАЦИЯ =====
    async function handleRegister(email, password, nickname) {
        try {
            window.__mfAuthFlow = 'register';
            const result = await window.Auth.registerWithEmail(email, password);
            if (nickname) {
                try { await result.user.updateProfile({ displayName: nickname }); } catch (e) { console.warn(e); }
            }
            let verifyError = null;
            try { await result.user.sendEmailVerification(); } catch (e) { verifyError = e; }
            await window.Auth.logout();
            showLoginTab();
            $('login-email-phone').value = email;
            loginId.dispatchEvent(new Event('input'));
            if (verifyError) {
                setMessage('Аккаунт создан, но письмо подтверждения не отправилось: ' + getFirebaseErrorMessage(verifyError) + ' Попробуйте войти — мы предложим отправить его ещё раз.', 'error');
            } else {
                setMessage(`Готово! Мы отправили письмо на ${email}. Подтвердите адрес по ссылке и войдите. Не видите письма — проверьте «Спам».`, 'success');
            }
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        } finally {
            window.__mfAuthFlow = null;
        }
    }

    // ===== СБРОС ПАРОЛЯ =====
    async function handleForgotPassword(email) {
        if (!isEmail(email)) {
            setMessage('Введите email в поле выше — пришлём ссылку для сброса пароля.', 'error');
            $('login-email-phone').focus();
            return;
        }
        try {
            await window.Auth.resetPassword(email);
            setMessage('Если такой аккаунт есть, письмо для сброса пароля уже в пути. Проверьте почту (и «Спам»).', 'success');
        } catch (error) {
            setMessage(getFirebaseErrorMessage(error), 'error');
        }
    }

    // ===== ОБРАБОТЧИКИ =====
    loginSection.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = $('login-submit');
        withBusy(btn, async () => {
            const emailPhone = loginId.value.trim();
            const password = $('login-password').value;
            if (!emailPhone) { setMessage('Введите email или телефон', 'error'); return; }
            if (emailPhone.includes('@')) {
                if (!isEmail(emailPhone)) { setMessage('Некорректный формат email.', 'error'); return; }
                if (!password) { setMessage('Введите пароль', 'error'); $('login-password').focus(); return; }
                await handleLoginEmail(emailPhone, password);
                return;
            }
            // Телефон: приводим к формату +7XXXXXXXXXX
            let phone = emailPhone.replace(/[^\d+]/g, '');
            if (/^8\d{10}$/.test(phone)) phone = '+7' + phone.slice(1);
            else if (/^\d{10,15}$/.test(phone)) phone = '+' + phone;
            if (!recaptchaVerifier) {
                try { recaptchaVerifier = window.Auth.createRecaptchaVerifier('recaptcha-container'); } catch (err) { console.warn(err); }
            }
            try {
                confirmationResult = await window.Auth.loginWithPhoneNumber(phone, recaptchaVerifier);
                loginSection.style.display = 'none';
                registerSection.style.display = 'none';
                setSocialVisible(false);
                phoneVerifySection.classList.add('active');
                setMessage(`Код отправлен на ${phone}.`, 'info');
                setTimeout(() => $('verification-code').focus(), 50);
            } catch (error) {
                setMessage('Не удалось отправить код: ' + getFirebaseErrorMessage(error), 'error');
                try { recaptchaVerifier?.clear(); } catch (_) {}
                recaptchaVerifier = null;
            }
        });
    });

    registerSection.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = $('register-submit');
        withBusy(btn, async () => {
            const email = $('reg-email-phone').value.trim();
            const password = $('reg-password').value;
            const nickname = $('reg-nickname').value.trim();
            if (!email) { setMessage('Введите email', 'error'); return; }
            if (!isEmail(email)) { setMessage('Некорректный формат email. Регистрация по телефону не поддерживается — войдите по номеру на вкладке «Войти».', 'error'); return; }
            if (password.length < 6) { setMessage('Пароль должен быть не короче 6 символов.', 'error'); $('reg-password').focus(); return; }
            await handleRegister(email, password, nickname);
        });
    });

    phoneVerifySection.addEventListener('submit', (e) => {
        e.preventDefault();
        withBusy($('verify-code-btn'), async () => {
            const code = $('verification-code').value.trim();
            if (!code) { setMessage('Введите код', 'error'); return; }
            if (!confirmationResult) { setMessage('Сначала запросите код', 'error'); return; }
            try {
                await confirmationResult.confirm(code);
                closeAuth();
            } catch (error) {
                setMessage(getFirebaseErrorMessage(error), 'error');
            }
        });
    });

    $('cancel-phone-verify').addEventListener('click', () => {
        confirmationResult = null;
        showLoginTab();
    });

    $('forgot-password-btn').addEventListener('click', () => {
        withBusy(null, () => handleForgotPassword(loginId.value.trim()));
    });

    function socialHandler(btnId, providerName, login) {
        const btn = $(btnId);
        btn.addEventListener('click', () => {
            if (!window.Auth) { setMessage('Сервис входа ещё загружается. Попробуйте через секунду.', 'error'); return; }
            // Без await до вызова popup — иначе Safari посчитает окно не
            // вызванным пользователем и заблокирует его.
            withBusy(btn, async () => {
                clearMessage();
                try {
                    const result = await login();
                    if (result) closeAuth();
                } catch (e) {
                    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request' || e.code === 'auth/user-cancelled') return;
                    console.error(`[auth] ${providerName}:`, e);
                    setMessage(`Не удалось войти через ${providerName}: ` + getFirebaseErrorMessage(e, providerName), 'error');
                }
            });
        });
    }
    socialHandler('google-login-btn', 'Google', () => window.Auth.loginWithGoogle());
    socialHandler('apple-login-btn', 'Apple', () => window.Auth.loginWithApple());

    // Возврат после redirect-входа (PWA, встроенные браузеры, заблокированные попапы)
    const consumeRedirect = () => {
        window.Auth?.consumeRedirectResult?.().catch(e => {
            console.error('[auth] redirect:', e);
            openAuth();
            setMessage('Не удалось завершить вход: ' + getFirebaseErrorMessage(e), 'error');
        });
    };
    if (window.Auth) consumeRedirect();
    else document.addEventListener('authReady', consumeRedirect, { once: true });
}

// ===== ШТОРКА НА ТЕЛЕФОНЕ =====
// Ручка сверху — настоящая: тянем вниз — закрыть (из полноэкранного режима —
// сначала свернуть), тянем вверх — развернуть на весь экран, тап — переключить.
// Тянуть можно за ручку/заголовок, а за остальную часть — только когда
// содержимое прокручено к самому верху и жест идёт вниз.
function enableSheetDrag(modal, onClose) {
    const mq = window.matchMedia('(max-width: 560px)');
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'sheet-handle';
    handle.setAttribute('aria-label', 'Развернуть или свернуть');
    modal.prepend(handle);
    handle.addEventListener('click', () => {
        if (mq.matches) modal.classList.toggle('sheet-full');
    });

    let startY = 0, lastY = 0, lastT = 0, velocity = 0, dy = 0;
    let tracking = false, dragging = false, fromTop = false;

    modal.addEventListener('touchstart', (e) => {
        if (!mq.matches || e.touches.length !== 1 || !modal.classList.contains('active')) return;
        const t = e.target;
        if (t.closest('input, textarea, select, .modal-close')) return;
        fromTop = !!t.closest('.sheet-handle, .modal-header');
        if (!fromTop && modal.scrollTop > 0) return;
        tracking = true; dragging = false; dy = 0; velocity = 0;
        startY = lastY = e.touches[0].clientY;
        lastT = performance.now();
    }, { passive: true });

    modal.addEventListener('touchmove', (e) => {
        if (!tracking) return;
        const y = e.touches[0].clientY;
        const now = performance.now();
        velocity = (y - lastY) / Math.max(1, now - lastT);
        lastY = y; lastT = now;
        dy = y - startY;
        if (!dragging) {
            if (Math.abs(dy) < 6) return;
            // Жест вверх по содержимому — это обычная прокрутка
            if (dy < 0 && !fromTop) { tracking = false; return; }
            dragging = true;
            modal.classList.add('sheet-dragging');
        }
        e.preventDefault();
        // Вниз — 1:1, вверх — с «резиной»
        const offset = dy > 0 ? dy : -Math.min(40, Math.sqrt(-dy) * 3);
        modal.style.transform = `translateY(${offset}px)`;
    }, { passive: false });

    const end = () => {
        if (!tracking) return;
        tracking = false;
        if (!dragging) return;
        dragging = false;
        modal.classList.remove('sheet-dragging');
        modal.style.transform = '';
        const full = modal.classList.contains('sheet-full');
        if (dy < -50 || velocity < -0.5) {
            modal.classList.add('sheet-full');
        } else if (dy > 90 || velocity > 0.6) {
            if (full && dy < modal.offsetHeight * 0.45) modal.classList.remove('sheet-full');
            else onClose();
        }
    };
    modal.addEventListener('touchend', end);
    modal.addEventListener('touchcancel', end);
}

// ===== МОДАЛЬНОЕ ОКНО НАСТРОЕК =====
function injectSettingsModal() {
    if (document.getElementById('settings-modal')) return;

    // Иконки окна — одна обводка, как в шапке сайта.
    const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const I = {
        close: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
        pencil: ic('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
        check: ic('<path d="M20 6 9 17l-5-5"/>'),
        sparkle: ic('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'),
        mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
        key: ic('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>'),
        logout: ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>'),
        trash: ic('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
        chevron: ic('<path d="m9 18 6-6-6-6"/>'),
    };
    // Мини-превью темы: окошко со «шапкой» и строками текста в цветах этой темы.
    const preview = (cls) => `<span class="st-prev ${cls}" aria-hidden="true"><i class="st-prev-bar"></i><i class="st-prev-l1"></i><i class="st-prev-l2"></i><i class="st-prev-dot"></i></span>`;

    const html = `
    <div class="overlay" id="settings-overlay"></div>
    <div class="modal st-modal" id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="st-title" tabindex="-1">
      <div class="st-head">
        <h2 id="st-title">Настройки</h2>
        <button class="modal-close" id="settings-close" type="button" aria-label="Закрыть">${I.close}</button>
      </div>

      <section class="st-profile" aria-label="Профиль">
        <div class="st-avatar">
          <!-- без пустого src="": браузер трактует его как ссылку на саму страницу
               и повторно скачивает HTML (лишний запрос + ошибка в консоли);
               настоящий src проставляет populateSettings(), если есть аватар -->
          <img id="avatar-img" alt="" style="display:none" />
          <div class="avatar-placeholder" id="avatar-placeholder">?</div>
        </div>
        <div class="st-id">
          <div class="st-name-row" id="st-name-row">
            <span class="st-name" id="username-text"></span>
            <button class="st-icon-btn" id="edit-username-btn" type="button" aria-label="Изменить имя" title="Изменить имя">${I.pencil}</button>
          </div>
          <form class="st-name-edit" id="username-edit-field" hidden>
            <input type="text" id="username-input" maxlength="40" autocomplete="nickname" aria-label="Новое имя" placeholder="Как вас называть" />
            <button class="st-icon-btn ok" id="save-username-btn" type="submit" aria-label="Сохранить имя" title="Сохранить">${I.check}</button>
            <button class="st-icon-btn" id="cancel-username-btn" type="button" aria-label="Отменить" title="Отмена">${I.close}</button>
          </form>
          <div class="st-email"><span id="email-display"></span><span class="st-badge" id="st-verified" hidden></span></div>
          <div class="st-meta" id="st-meta"></div>
        </div>
      </section>

      <section class="st-section" aria-labelledby="st-look">
        <h3 class="st-label" id="st-look">Внешний вид</h3>
        <div class="st-themes" id="theme-selector-settings" role="radiogroup" aria-label="Тема">
          <button class="st-theme" type="button" role="radio" data-theme="light">${preview('is-light')}<span>Светлая</span></button>
          <button class="st-theme" type="button" role="radio" data-theme="dark">${preview('is-dark')}<span>Тёмная</span></button>
          <button class="st-theme" type="button" role="radio" data-theme="system">${preview('is-system')}<span>Как в системе</span></button>
        </div>
        <label class="st-row st-row-switch">
          <span class="st-row-ico">${I.sparkle}</span>
          <span class="st-row-text"><b>Анимации</b><small>Живой фон, переходы между страницами и появление блоков</small></span>
          <input type="checkbox" class="st-switch-input" id="anim-toggle-settings" />
          <span class="st-switch" aria-hidden="true"></span>
        </label>
        <label class="st-row st-row-switch">
          <span class="st-row-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></span>
          <span class="st-row-text"><b>Режим производительности</b><small>Для слабых устройств: без живого фона, размытия, теней и анимаций</small></span>
          <input type="checkbox" class="st-switch-input" id="perf-toggle-settings" />
          <span class="st-switch" aria-hidden="true"></span>
        </label>
        <div class="st-row st-row-lang">
          <span class="st-row-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg></span>
          <span class="st-row-text"><b>Язык</b><small>Пока влияет на запись чисел в интерактивных примерах: 2,5 (русский) или 2.5 (английский)</small></span>
          <span class="st-seg" id="st-lang" role="radiogroup" aria-label="Язык">
            <button type="button" role="radio" data-lang="ru">Русский</button><button type="button" role="radio" data-lang="en">English</button>
          </span>
        </div>
      </section>

      <section class="st-section" aria-labelledby="st-acc">
        <h3 class="st-label" id="st-acc">Аккаунт</h3>
        <div class="st-list">
          <button class="st-row" id="st-verify-btn" type="button" hidden>
            <span class="st-row-ico">${I.mail}</span>
            <span class="st-row-text"><b>Подтвердить почту</b><small>Пришлём письмо со ссылкой</small></span>
            <span class="st-chev">${I.chevron}</span>
          </button>
          <button class="st-row" id="change-password-btn" type="button">
            <span class="st-row-ico">${I.key}</span>
            <span class="st-row-text"><b>Сменить пароль</b><small>Пришлём ссылку для смены на почту</small></span>
            <span class="st-chev">${I.chevron}</span>
          </button>
          <button class="st-row" id="logout-btn" type="button">
            <span class="st-row-ico">${I.logout}</span>
            <span class="st-row-text"><b>Выйти из аккаунта</b><small>На этом устройстве</small></span>
            <span class="st-chev">${I.chevron}</span>
          </button>
        </div>
      </section>

      <details class="st-danger" id="st-danger">
        <summary><span class="st-row-ico">${I.trash}</span><span>Удалить аккаунт</span><span class="st-chev">${I.chevron}</span></summary>
        <div class="st-danger-body">
          <p>Аккаунт и данные профиля удалятся безвозвратно. Чтобы подтвердить, введите слово <b>удалить</b>.</p>
          <div class="st-danger-row">
            <input type="text" id="st-delete-confirm" autocomplete="off" aria-label="Подтверждение удаления" placeholder="удалить" />
            <button class="btn danger small" id="delete-account-btn" type="button" disabled>Удалить навсегда</button>
          </div>
        </div>
      </details>

      <div class="st-status" id="st-status" role="status" aria-live="polite"></div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', html);

    const $ = (id) => document.getElementById(id);
    const overlay = $('settings-overlay');
    const modal = $('settings-modal');
    const closeBtn = $('settings-close');
    const avatarImg = $('avatar-img');
    const avatarPlaceholder = $('avatar-placeholder');
    const usernameText = $('username-text');
    const emailDisplay = $('email-display');
    const verifiedBadge = $('st-verified');
    const metaEl = $('st-meta');
    const nameRow = $('st-name-row');
    const editBtn = $('edit-username-btn');
    const usernameEditField = $('username-edit-field');
    const usernameInput = $('username-input');
    const cancelUsernameBtn = $('cancel-username-btn');
    const verifyBtn = $('st-verify-btn');
    const changePasswordBtn = $('change-password-btn');
    const logoutBtn = $('logout-btn');
    const danger = $('st-danger');
    const deleteConfirm = $('st-delete-confirm');
    const deleteAccountBtn = $('delete-account-btn');
    const statusEl = $('st-status');
    const animInput = $('anim-toggle-settings');

    // Сообщения — строкой внизу окна, а не системными alert().
    let statusTimer = 0;
    function say(text, kind) {
        clearTimeout(statusTimer);
        statusEl.textContent = text;
        statusEl.className = 'st-status show' + (kind ? ' ' + kind : '');
        statusTimer = setTimeout(() => statusEl.classList.remove('show'), kind === 'err' ? 7000 : 4000);
    }
    async function busy(btn, fn) {
        btn.disabled = true; btn.classList.add('is-busy');
        try { await fn(); } finally { btn.disabled = false; btn.classList.remove('is-busy'); }
    }

    // ===== Язык (mf-lang): пока — десятичный разделитель в сценах GMS =====
    const langBox = $('st-lang');
    const getLang = () => { try { return localStorage.getItem('mf-lang') === 'en' ? 'en' : 'ru'; } catch (e) { return 'ru'; } };
    const paintLang = () => langBox.querySelectorAll('[data-lang]').forEach(b => { const on = b.dataset.lang === getLang(); b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    paintLang();
    langBox.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lang]'); if (!b || b.dataset.lang === getLang()) return;
        try { localStorage.setItem('mf-lang', b.dataset.lang); } catch (er) {}
        document.documentElement.lang = b.dataset.lang;
        paintLang();
        say(b.dataset.lang === 'en' ? 'Числа в примерах — с точкой (2.5). Откройте пример заново, чтобы увидеть.' : 'Числа в примерах — с запятой (2,5). Откройте пример заново, чтобы увидеть.', 'ok');
    });

    // ===== Тема =====
    modal.querySelectorAll('#theme-selector-settings .st-theme').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (theme === 'system') applySystemTheme(true, true);
            else applyTheme(theme, true, true);
        });
    });

    // ===== Анимации =====
    // Независимы от prefers-reduced-motion: пользователь мог явно выключить
    // украшательство на самом сайте. mathframe-ui.js читает тот же ключ до
    // первой отрисовки; здесь переключаем класс на <html> вживую.
    function updateAnimToggle() { animInput.checked = localStorage.getItem('mf-motion') !== 'off'; }
    animInput.addEventListener('change', () => {
        if (animInput.checked) {
            localStorage.removeItem('mf-motion');
            document.documentElement.classList.remove('mf-no-motion');
        } else {
            localStorage.setItem('mf-motion', 'off');
            document.documentElement.classList.add('mf-no-motion');
        }
    });
    updateAnimToggle();

    // ===== Режим производительности =====
    // Тот же ключ читает mathframe-ui.js до запуска фона (принудительный lite);
    // CSS (html.mf-perf) гасит фон и эффекты сразу, без перезагрузки.
    const perfInput = $('perf-toggle-settings');
    if (perfInput) {
        perfInput.checked = perfModeOn();
        perfInput.addEventListener('change', () => setPerfMode(perfInput.checked));
    }

    const PROVIDER_RU = { 'google.com': 'Google', 'apple.com': 'Apple', 'github.com': 'GitHub', password: 'почта и пароль', phone: 'телефон' };
    function sinceText(user) {
        const t = user.metadata && user.metadata.creationTime && new Date(user.metadata.creationTime);
        if (!t || isNaN(t)) return '';
        return 'с нами с ' + t.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(/\s*г\.?$/, '');
    }

    function populateSettings(user) {
        if (!user) {
            usernameText.textContent = 'Гость';
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarPlaceholder.textContent = '?';
            emailDisplay.textContent = '';
            verifiedBadge.hidden = true;
            metaEl.textContent = '';
            verifyBtn.hidden = true;
            changePasswordBtn.hidden = true;
            danger.hidden = true;
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

        const providers = (user.providerData || []).map(p => p.providerId);
        const isPassword = providers.includes('password');
        // Почта от Google/Apple подтверждена провайдером; спрашиваем только у входа по паролю.
        const unverified = !!user.email && isPassword && !user.emailVerified;
        verifiedBadge.hidden = !user.email;
        verifiedBadge.textContent = unverified ? 'не подтверждена' : 'подтверждена';
        verifiedBadge.classList.toggle('warn', unverified);
        verifyBtn.hidden = !unverified;
        changePasswordBtn.hidden = !isPassword;
        danger.hidden = false;

        const how = providers.map(id => PROVIDER_RU[id]).filter(Boolean);
        metaEl.textContent = [how.length ? 'Вход: ' + how.join(', ') : '', sinceText(user)].filter(Boolean).join(' · ');

        updateAllThemeSelections(localStorage.getItem('theme') || 'system');
        updateAnimToggle();
    }
    populateSettingsRef = populateSettings;

    function stopNameEdit() { usernameEditField.hidden = true; nameRow.hidden = false; }
    function resetDanger() { danger.open = false; deleteConfirm.value = ''; deleteAccountBtn.disabled = true; }

    let lastFocus = null;
    function openSettings() {
        if (!currentUser) {
            window.openAuthModal();
            return;
        }
        populateSettings(currentUser);
        stopNameEdit(); resetDanger();
        statusEl.className = 'st-status';
        lastFocus = document.activeElement;
        document.body.classList.add('no-scroll');
        overlay.style.visibility = 'visible';
        modal.style.visibility = 'visible';
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            modal.classList.add('active');
            modal.focus({ preventScroll: true });   // фокус в окне — Esc и Tab работают, без кольца на кнопке
        });
    }

    function closeSettings() {
        overlay.classList.remove('active');
        modal.classList.remove('active');
        setTimeout(() => {
            overlay.style.visibility = 'hidden';
            modal.style.visibility = 'hidden';
            modal.classList.remove('sheet-full');
            document.body.classList.remove('no-scroll');
        }, 300);
        if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }

    overlay.addEventListener('click', closeSettings);
    enableSheetDrag(modal, closeSettings);
    closeBtn.addEventListener('click', closeSettings);
    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!usernameEditField.hidden) { stopNameEdit(); editBtn.focus(); }
        else closeSettings();
    });

    // ===== Имя — правится прямо на месте =====
    editBtn.addEventListener('click', () => {
        usernameInput.value = currentUser?.displayName || '';
        nameRow.hidden = true;
        usernameEditField.hidden = false;
        usernameInput.focus(); usernameInput.select();
    });
    cancelUsernameBtn.addEventListener('click', stopNameEdit);
    usernameEditField.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = usernameInput.value.trim();
        if (!newName) { usernameInput.focus(); return; }
        if (!window.Auth || newName === (currentUser?.displayName || '')) { stopNameEdit(); return; }
        try {
            await window.Auth.updateUserProfile({ displayName: newName });
            const user = window.Auth.getCurrentUser();
            if (user) { currentUser = user; updateAccountCircle(currentUser); populateSettings(currentUser); }
            say('Имя сохранено', 'ok');
        } catch (err) { say('Не удалось сохранить имя: ' + getFirebaseErrorMessage(err), 'err'); }
        stopNameEdit();
    });

    // ===== Аккаунт =====
    verifyBtn.addEventListener('click', () => busy(verifyBtn, async () => {
        try { await window.Auth.sendEmailVerification(); say('Письмо отправлено на ' + (currentUser?.email || 'почту') + '. Проверьте и папку «Спам».', 'ok'); }
        catch (err) { say('Не удалось отправить письмо: ' + getFirebaseErrorMessage(err), 'err'); }
    }));
    changePasswordBtn.addEventListener('click', () => busy(changePasswordBtn, async () => {
        if (!currentUser || !currentUser.email) { say('У аккаунта нет почты для сброса пароля', 'err'); return; }
        try { await window.Auth.resetPassword(currentUser.email); say('Ссылка для смены пароля отправлена на ' + currentUser.email + '. Проверьте и папку «Спам».', 'ok'); }
        catch (err) { say('Не удалось отправить письмо: ' + getFirebaseErrorMessage(err), 'err'); }
    }));
    logoutBtn.addEventListener('click', () => busy(logoutBtn, async () => {
        if (!window.Auth) return;
        try { await window.Auth.logout(); closeSettings(); }
        catch (err) { say('Не удалось выйти: ' + getFirebaseErrorMessage(err), 'err'); }
    }));

    // ===== Удаление: подтверждение словом вместо системного confirm() =====
    deleteConfirm.addEventListener('input', () => {
        deleteAccountBtn.disabled = deleteConfirm.value.trim().toLowerCase() !== 'удалить';
    });
    danger.addEventListener('toggle', () => { if (danger.open) deleteConfirm.focus(); });
    deleteAccountBtn.addEventListener('click', () => busy(deleteAccountBtn, async () => {
        if (!currentUser) return;
        const uid = currentUser.uid;
        try {
            await window.Auth.deleteAccount();
            try {
                await ensureFirestore();
                await firebase.firestore().collection('users').doc(uid).delete();
                await firebase.firestore().collection('bannedUsers').doc(uid).delete();
            } catch (e) { /* данные профиля могли уже отсутствовать */ }
            closeSettings();
        } catch (err) {
            say(err && err.code === 'auth/requires-recent-login'
                ? 'Для удаления войдите в аккаунт заново и сразу повторите.'
                : 'Не удалось удалить аккаунт: ' + getFirebaseErrorMessage(err), 'err');
        }
    }));

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
        { href: '/board/', text: 'Доска', page: 'board' },
    ];

    const currentPath = window.location.pathname;
    const currentPage = (document.body && document.body.dataset.page) || '';

    const navHTML = navLinks
        .map(link => {
            // Для корня — только точное совпадение, иначе '/' считался бы
            // префиксом любого пути и «Главная» подсвечивалась бы везде.
            // Запасной признак — <body data-page>: работает и при открытии
            // файла по «сырому» пути (/pages/home.html, локальный сервер).
            // На странице 404 адрес — ошибочный (например, /spravochnik/опечатка):
            // по нему раздел не подсвечиваем.
            const isActive = (currentPage !== '404' && (link.href === '/'
                ? (currentPath === '/' || currentPath === '')
                : (currentPath === link.href || currentPath.startsWith(link.href))))
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
    return document.documentElement.classList.contains('mf-no-motion') || document.documentElement.classList.contains('mf-perf');
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

// Раздел сайта по адресу ссылки — для ссылок без data-nav-page (карточки, подвал,
// ссылки в тексте, страница 404). Раньше переход анимировался только у ссылок с
// data-nav-page (шапка и часть карточек главной), остальные уводили резко.
const MF_PATH_PAGES = [
    [/^\/(index\.html|pages\/home\.html)?$/, 'home'],
    [/^\/(spravochnik\/|pages\/spravochnik\.html)/, 'reference'],
    [/^\/(mini-services\/|pages\/mini-services\.html)/, 'services'],
    [/^\/(forum\/|pages\/forum\.html)/, 'forum'],
    [/^\/(ai-agent\/|pages\/ai-agent\.html)/, 'ai-agent'],
    [/^\/(playground\/|pages\/playground\.html)/, 'playground'],
    [/^\/(board\/|pages\/board\.html)/, 'board'],
    [/^\/(admin\/|pages\/admin\/)/, 'admin'],
];
function mfPageFromUrl(url) {
    for (const [re, page] of MF_PATH_PAGES) if (re.test(url.pathname)) return page;
    return null;
}

function mfOnNavClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('data-no-transition')) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    // Та же страница (в т.ч. с другим ?query или #якорем): справочник и другие
    // разделы переключают содержимое без перезагрузки — не мешаем им.
    if (url.pathname === location.pathname) return;
    // Файлы и API — не страницы
    if (/^\/api\//.test(url.pathname) || /\.(?!html?$)[a-z0-9]{1,5}$/i.test(url.pathname)) return;
    const page = a.dataset.navPage || mfPageFromUrl(url) || 'home';
    if (mfLeaving) { e.preventDefault(); return; }       // двойной клик во время перехода
    if (mfMotionOff()) return;
    if (mfStartPageLeave(a, e, page)) e.preventDefault();
}

// Переход по адресу из кода (кнопки, «Назад» на 404 и т.п.) — с той же анимацией.
window.mfNavigate = function (href, ev) {
    const a = document.createElement('a');
    a.href = href;
    const e = ev || { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, detail: 1 };
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { location.href = href; return; }
    if (mfLeaving) return;
    if (url.origin !== location.origin || url.pathname === location.pathname || mfMotionOff() ||
        !mfStartPageLeave(a, e, mfPageFromUrl(url) || 'home')) location.href = href;
};

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