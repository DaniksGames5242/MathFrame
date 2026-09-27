// admin-core.js — общее ядро админ-панели (/admin/).
//
// Здесь всё, чем пользуются модули панели (admin.js, admin-forum.js,
// admin-ai.js, admin-site.js):
//   • MFAdmin.db / user / isSuper — Firestore и текущий администратор;
//   • загрузчики данных с кэшем (пользователи, форум, AI-чаты, посещения);
//   • диалоги подтверждения (все операции записи/удаления идут через них), тосты;
//   • форматирование, экспорт CSV/JSON;
//   • Chart.js в токенах «Плоскости» с перекраской при смене темы;
//   • вкладки панели (регистрация модулей и ленивая инициализация).
//
// Доступ к панели проверяет admin.js (владелец по e-mail или admins/{uid}.granted).
// Проверка на клиенте — только интерфейс: настоящая защита данных — правила
// Firestore (см. вкладку «Инструменты › Правила Firestore»).

(function () {
  'use strict';

  // Владельцы сайта. Тот же список, что в правилах Firestore (isSuper()), api/chat.js и common.js.
  const SUPER_ADMIN_EMAILS = ['iagniukovd@gmail.com', 'daniksgames5242@gmail.com', 'mathframe.ru@gmail.com', 'danil.iagniukov@gmail.com'];
  const isSuperEmail = e => SUPER_ADMIN_EMAILS.includes(String(e || '').toLowerCase());

  const A = {
    SUPER_ADMIN_EMAILS, isSuperEmail,
    db: null, user: null, isSuper: false,
    cache: {},
  };

  /* ------------------------------------------------------------------ события */
  const handlers = {};
  A.on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
  A.emit = (ev, data) => { (handlers[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------------------------------------------------------------- утилиты */
  A.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  A.fmtNum = n => Number(n || 0).toLocaleString('ru-RU');
  A.plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many; };
  // Timestamp Firestore | миллисекунды | Date | ISO-строка → Date (или null)
  A.toDate = v => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    if (typeof v.toDate === 'function') { try { return v.toDate(); } catch (e) { return null; } }
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') { const d = new Date(v); return isNaN(d) ? null : d; }
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    return null;
  };
  A.fmtDate = d => {
    d = A.toDate(d);
    if (!d) return '—';
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };
  A.timeAgo = d => {
    d = A.toDate(d);
    if (!d) return '—';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return 'только что';
    if (s < 3600) return Math.floor(s / 60) + ' мин назад';
    if (s < 86400) return Math.floor(s / 3600) + ' ч назад';
    if (s < 86400 * 30) return Math.floor(s / 86400) + ' дн назад';
    return d.toLocaleDateString('ru-RU');
  };
  A.stripHtml = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  A.dayKey = d => { d = A.toDate(d); if (!d) return ''; const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
  // Последние n дней (локальные даты), от старых к новым
  A.lastDays = n => {
    const out = [];
    for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); out.push(A.dayKey(d)); }
    return out;
  };
  A.dayLabel = k => k.slice(8) + '.' + k.slice(5, 7);
  A.daysAgo = n => Date.now() - n * 86400000;
  A.initials = name => {
    const parts = String(name || '?').replace(/@.*/, '').trim().split(/[\s._-]+/).filter(Boolean);
    return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };
  A.hue = s => { let h = 0; for (const ch of String(s || '?')) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 360; };
  A.avatar = (name, photo, cls) => {
    const img = photo && /^https:\/\//.test(photo) ? `<img src="${A.esc(photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<span class="adm-av ${cls || ''}" style="--h:${A.hue(name)}" aria-hidden="true">${A.esc(A.initials(name))}${img}</span>`;
  };
  A.debounce = (fn, ms) => { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 160); }; };

  // Понятный текст ошибки Firestore / сети
  A.errText = e => {
    const code = e && (e.code || '');
    if (code === 'permission-denied' || /permission/i.test(String(e && e.message))) {
      return 'Недостаточно прав по правилам Firestore. Нужные правила — во вкладке «Инструменты».';
    }
    if (code === 'unavailable') return 'Firestore недоступен — проверьте соединение.';
    if (code === 'failed-precondition') return 'Firestore требует индекс для этого запроса: ' + (e.message || '');
    return (e && e.message) || String(e);
  };

  /* ------------------------------------------------------------------ экспорт */
  A.download = (name, content, mime) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  // rows — массив объектов, cols — [{key, label, get?}]; BOM — чтобы Excel понял UTF-8
  A.toCsv = (rows, cols) => {
    const cell = v => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s; // защита от формул при открытии в Excel
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const head = cols.map(c => cell(c.label || c.key)).join(',');
    const body = rows.map(r => cols.map(c => cell(c.get ? c.get(r) : r[c.key])).join(',')).join('\r\n');
    return '﻿' + head + '\r\n' + body;
  };
  A.stamp = () => new Date().toISOString().slice(0, 10);
  // Firestore-значения → JSON (Timestamp → ISO)
  A.plain = v => {
    if (v == null) return v;
    if (typeof v.toDate === 'function') { try { return v.toDate().toISOString(); } catch (e) { return null; } }
    if (Array.isArray(v)) return v.map(A.plain);
    if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = A.plain(v[k]); return o; }
    return v;
  };

  /* ------------------------------------------------------------------- тосты */
  A.toast = (msg, kind) => {
    let host = document.getElementById('admToasts');
    if (!host) { host = document.createElement('div'); host.id = 'admToasts'; host.className = 'adm-toasts'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'adm-toast' + (kind ? ' ' + kind : '');
    t.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
    t.textContent = msg;
    host.appendChild(t);
    while (host.children.length > 4) host.firstElementChild.remove();
    setTimeout(() => t.classList.add('out'), kind === 'bad' ? 6000 : 3400);
    setTimeout(() => t.remove(), kind === 'bad' ? 6400 : 3800);
  };

  /* ----------------------------------------------------------------- диалоги
     A.dialog({ title, html, wide, actions:[{label, value, primary, danger}] })
       → Promise<{ value, root }>. Закрытие (Esc, фон, крестик) → value = null.
     onOpen(root) — навесить обработчики; validate(value, root) → строка ошибки или ''. */
  let dialogDepth = 0;
  A.dialog = opts => new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay adm-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal adm-modal' + (opts.wide ? ' wide' : '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const tid = 'admDlg' + Math.random().toString(36).slice(2, 8);
    modal.setAttribute('aria-labelledby', tid);
    const actions = opts.actions || [{ label: 'Закрыть', value: null }];
    modal.innerHTML = `
      <div class="modal-header"><h2 id="${tid}">${A.esc(opts.title || '')}</h2>
        <button type="button" class="modal-close" data-close aria-label="Закрыть">×</button></div>
      <div class="adm-dlg-body">${opts.html || ''}</div>
      <p class="adm-dlg-err" role="alert" hidden></p>
      <div class="adm-dlg-actions">${actions.map((a, i) => `<button type="button" class="btn small${a.primary ? ' primary' : ''}${a.danger ? ' danger' : ''}" data-i="${i}">${A.esc(a.label)}</button>`).join('')}</div>`;
    document.body.append(overlay, modal);
    dialogDepth++;
    document.body.classList.add('no-scroll');
    const prevFocus = document.activeElement;
    void modal.offsetWidth;
    overlay.classList.add('active'); modal.classList.add('active');
    const errEl = modal.querySelector('.adm-dlg-err');
    let done = false;
    const close = value => {
      if (done) return; done = true;
      document.removeEventListener('keydown', onKey, true);
      overlay.classList.remove('active'); modal.classList.remove('active');
      setTimeout(() => {
        overlay.remove(); modal.remove();
        if (--dialogDepth <= 0) { dialogDepth = 0; document.body.classList.remove('no-scroll'); }
        if (prevFocus && prevFocus.focus) try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }, 260);
      resolve({ value, root: modal });
    };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(null); }
      if (e.key === 'Tab') { // простая ловушка фокуса
        const f = [...modal.querySelectorAll('button, input, select, textarea, a[href]')].filter(x => !x.disabled && x.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    overlay.onclick = () => close(null);
    modal.querySelector('[data-close]').onclick = () => close(null);
    modal.querySelectorAll('.adm-dlg-actions [data-i]').forEach(b => {
      b.onclick = () => {
        const a = actions[+b.dataset.i];
        if (a.value != null && opts.validate) {
          const msg = opts.validate(a.value, modal);
          if (msg) { errEl.textContent = msg; errEl.hidden = false; return; }
        }
        close(a.value);
      };
    });
    if (opts.onOpen) opts.onOpen(modal, close);
    setTimeout(() => {
      const first = modal.querySelector('[autofocus]') || modal.querySelector('.adm-dlg-actions .primary, .adm-dlg-actions .danger') || modal.querySelector('.adm-dlg-actions button');
      if (first) try { first.focus({ preventScroll: true }); } catch (e) {}
    }, 60);
  });

  // Подтверждение операции. typeWord — слово, которое нужно ввести (для массовых удалений);
  // checkbox — {label, checked} дополнительная опция. → Promise<false | {checked}>
  A.confirm = async ({ title, text, confirmLabel, danger, typeWord, checkbox }) => {
    const html = `<p class="adm-dlg-text">${text || ''}</p>
      ${checkbox ? `<label class="adm-check"><input type="checkbox" id="admDlgChk"${checkbox.checked ? ' checked' : ''}> <span>${A.esc(checkbox.label)}</span></label>` : ''}
      ${typeWord ? `<label class="adm-field"><span>Для подтверждения введите <b>${A.esc(typeWord)}</b></span><input type="text" id="admDlgWord" autocomplete="off" autofocus></label>` : ''}`;
    const r = await A.dialog({
      title: title || 'Подтвердите действие', html,
      actions: [{ label: 'Отмена', value: null }, { label: confirmLabel || 'Подтвердить', value: 'ok', primary: !danger, danger: !!danger }],
      validate: (v, root) => {
        if (typeWord) {
          const w = root.querySelector('#admDlgWord').value.trim();
          if (w.toLowerCase() !== typeWord.toLowerCase()) return 'Введите «' + typeWord + '», чтобы подтвердить.';
        }
        return '';
      },
    });
    if (r.value !== 'ok') return false;
    const chk = r.root.querySelector('#admDlgChk');
    return { checked: !!(chk && chk.checked) };
  };

  // Выполнить запись с обработкой ошибок: A.run(btn, async () => {...}, 'Готово')
  A.run = async (btn, fn, okMsg) => {
    if (btn) btn.disabled = true;
    try {
      const r = await fn();
      if (okMsg) A.toast(okMsg, 'ok');
      return r;
    } catch (e) {
      console.error(e);
      A.toast('Ошибка: ' + A.errText(e), 'bad');
      return undefined;
    } finally {
      if (btn && btn.isConnected) btn.disabled = false;
    }
  };

  /* ---------------------------------------------------------- загрузка данных */
  // Загрузчик с кэшем. A.peek(key) синхронно отдаёт уже полученное значение (или null).
  const resolved = {};
  const once = (key, fn) => (force) => {
    if (force || !A.cache[key]) {
      const p = fn();
      A.cache[key] = p;
      p.then(v => { if (A.cache[key] === p) resolved[key] = { p, v }; },
             () => { if (A.cache[key] === p) delete A.cache[key]; });
    }
    return A.cache[key];
  };
  A.peek = key => {
    const p = A.cache[key], r = resolved[key];
    return p && r && r.p === p ? r.v : null;
  };

  A.loadTopics = once('topics', async () => {
    try {
      const res = await fetch('/data/topics/config.json', { cache: 'no-cache' });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) { console.error('config.json', e); return []; }
  });

  A.loadVisits = once('visits', async () => {
    try {
      const doc = await A.db.collection('stats').doc('visits').get();
      if (!doc.exists) return { total: 0, days: {} };
      const d = doc.data();
      return { total: d.total || 0, days: d.days || {} };
    } catch (e) { console.error('visits', e); return { total: 0, days: {}, error: e }; }
  });

  // → { users:[...], admins:Map(uid → data), banned:Map(uid → data) }
  A.loadUsers = once('users', async () => {
    const [usersSnap, adminsSnap, bannedSnap] = await Promise.all([
      A.db.collection('users').get(),
      A.db.collection('admins').get().catch(() => null),
      A.db.collection('bannedUsers').get().catch(() => null),
    ]);
    const admins = new Map(), banned = new Map();
    if (adminsSnap) adminsSnap.forEach(d => admins.set(d.id, d.data() || {}));
    if (bannedSnap) bannedSnap.forEach(d => banned.set(d.id, d.data() || {}));
    const users = usersSnap.docs.map(d => {
      const data = d.data() || {};
      const owner = isSuperEmail(data.email);
      const adm = admins.get(d.id);
      return {
        uid: d.id,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        provider: data.provider || '',
        createdAt: A.toDate(data.createdAt),
        lastLogin: A.toDate(data.lastLogin),
        role: owner ? 'owner' : (adm && adm.granted === true ? 'admin' : 'user'),
        isAdmin: owner || !!(adm && adm.granted === true),
        isOwner: owner,
        isBanned: banned.has(d.id),
        ban: banned.get(d.id) || null,
      };
    });
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { users, admins, banned };
  });

  // Форум: все статьи и все ответы (ответы — подколлекция replies каждой статьи;
  // запросы идут пачками по 8, как и на странице форума).
  A.loadForum = once('forum', async () => {
    const snap = await A.db.collection('forumArticles').get();
    const articles = snap.docs.map(d => ({ id: d.id, ...d.data(), replyCount: 0, liveReplies: 0 }));
    const replies = [];
    let replyErrors = 0;
    for (let i = 0; i < articles.length; i += 8) {
      await Promise.all(articles.slice(i, i + 8).map(a =>
        A.db.collection('forumArticles').doc(a.id).collection('replies').get().then(rs => {
          a.replyCount = rs.size;
          rs.forEach(r => {
            const rd = r.data() || {};
            if (!rd.deleted) a.liveReplies++;
            replies.push({ id: r.id, articleId: a.id, articleTitle: a.title || '', ...rd });
          });
        }).catch(() => { replyErrors++; })
      ));
    }
    return { articles, replies, replyErrors };
  });

  // AI-чаты: collection group «chats» (aiChats/{uid}/chats/{id}). Требует правило чтения
  // для администраторов — без него вернётся { ok:false }. Содержимое сообщений не
  // хранится: только счётчики и даты.
  A.loadAiChats = once('ai', async () => {
    try {
      const snap = await A.db.collectionGroup('chats').get();
      const chats = [];
      snap.forEach(d => {
        const parent = d.ref.parent && d.ref.parent.parent;
        if (!parent || !parent.parent || parent.parent.id !== 'aiChats') return;
        const x = d.data() || {};
        const msgs = Array.isArray(x.messages) ? x.messages : [];
        let userMsgs = 0, chars = 0;
        for (const m of msgs) { if (m && m.role === 'user') userMsgs++; if (m && typeof m.content === 'string') chars += m.content.length; }
        chats.push({
          id: d.id, uid: parent.id,
          createdAt: A.toDate(x.createdAt), updatedAt: A.toDate(x.updatedAt),
          messages: msgs.length, userMsgs, chars, topicId: x.topicId || null,
        });
      });
      return { ok: true, chats };
    } catch (e) {
      console.warn('[admin] aiChats:', e && (e.code || e.message));
      return { ok: false, error: e, chats: [] };
    }
  });

  A.invalidate = (...keys) => keys.forEach(k => { delete A.cache[k]; });

  // Запрос к нашим /api/* с токеном администратора
  A.api = async (path, init) => {
    const token = A.user ? await A.user.getIdToken() : '';
    const r = await fetch(path, Object.assign({}, init, {
      headers: Object.assign({ 'content-type': 'application/json' }, (init && init.headers) || {}, token ? { Authorization: 'Bearer ' + token } : {}),
    }));
    const ct = r.headers.get('content-type') || '';
    const body = ct.includes('json') ? await r.json().catch(() => null) : null;
    return { ok: r.ok, status: r.status, body };
  };

  /* ------------------------------------------------------------ графики */
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim();
  A.css = css;
  A.motionOff = () => (window.MathFrameUI ? window.MathFrameUI.motionOff() : false);
  A.withAlpha = (color, a) => {
    const c = String(color).trim();
    let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const n = parseInt(h, 16);
      return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
    }
    m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(',').map(s => s.trim()); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }
    return c;
  };
  A.theme = () => ({
    accent: css('--accent'), accent2: css('--accent-2'), accent3: css('--accent-3'),
    text1: css('--text-primary'), text2: css('--text-secondary'), text3: css('--text-tertiary'),
    border: css('--border'), borderStrong: css('--border-strong'), raised: css('--bg-raised'), sunken: css('--mf-ink-1'),
    sans: css('--font-sans'), mono: css('--font-mono'), display: css('--font-display'),
  });
  A.tooltipOpts = T => ({
    backgroundColor: T.raised, borderColor: T.borderStrong, borderWidth: 1,
    titleColor: T.text1, bodyColor: T.text2, cornerRadius: 6, padding: 10,
    titleFont: { family: T.mono, size: 11 }, bodyFont: { family: T.sans, size: 12 },
    displayColors: false,
  });
  A.anim = () => (A.motionOff() ? false : { duration: 700, easing: 'easeOutQuart' });

  const restylers = new Set();
  A.onRestyle = fn => restylers.add(fn);
  let lastThemeKey = null;
  A.restyleAll = force => {
    const key = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    if (!force && key === lastThemeKey) return;
    lastThemeKey = key;
    restylers.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  };
  new MutationObserver(() => A.restyleAll(false)).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => A.restyleAll(true));

  // Столбчатый график по дням. series: [{label, data, key:'accent'|'accent2'|'accent3'}]
  // stacked — сегменты одного дня складываются (у всех серий одна шкала).
  A.barChart = (canvas, labels, series, opts) => {
    if (!window.Chart || !canvas) return null;
    opts = opts || {};
    const build = () => {
      const T = A.theme();
      const surface = css('--mf-ink-1') || T.raised;
      return {
        datasets: series.map(s => ({
          label: s.label, data: s.data,
          backgroundColor: A.withAlpha(T[s.key || 'accent'], 0.85),
          hoverBackgroundColor: T[s.key || 'accent'],
          borderColor: surface, borderWidth: series.length > 1 ? { top: 2 } : 0,
          borderRadius: 4, borderSkipped: 'start', maxBarThickness: 18,
          stack: opts.stacked ? 's' : undefined,
        })),
        options: {
          maintainAspectRatio: false, animation: A.anim(),
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: series.length > 1
              ? { display: true, position: 'bottom', labels: { color: T.text2, font: { family: T.sans, size: 12 }, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 8, boxHeight: 8, padding: 12 } }
              : { display: false },
            tooltip: Object.assign(A.tooltipOpts(T), { displayColors: series.length > 1 }),
          },
          scales: {
            x: { stacked: !!opts.stacked, ticks: { color: T.text3, font: { family: T.mono, size: 10 }, maxRotation: 0, autoSkipPadding: 10 },
                 grid: { display: false }, border: { color: T.borderStrong } },
            y: { stacked: !!opts.stacked, beginAtZero: true, ticks: { color: T.text3, font: { family: T.mono, size: 10 }, precision: 0, maxTicksLimit: 5 },
                 grid: { color: T.border }, border: { display: false } },
          },
        },
      };
    };
    const b = build();
    const chart = new Chart(canvas, { type: 'bar', data: { labels, datasets: b.datasets }, options: b.options });
    chart.$mfSet = (newLabels, newSeries) => {
      if (newSeries) series = newSeries;
      const nb = build();
      chart.data.labels = newLabels || chart.data.labels;
      chart.data.datasets = nb.datasets;
      chart.options = nb.options;
      chart.update();
    };
    A.onRestyle(() => { const nb = build(); chart.data.datasets.forEach((ds, i) => { const n = nb.datasets[i]; if (n) { ds.backgroundColor = n.backgroundColor; ds.hoverBackgroundColor = n.hoverBackgroundColor; ds.borderColor = n.borderColor; } }); chart.options = nb.options; chart.update('none'); });
    return chart;
  };

  // Считает события по дням: items → {dayKey: count} для заданных ключей дней
  A.countByDay = (items, getDate, days) => {
    const idx = new Map(days.map((d, i) => [d, i]));
    const out = new Array(days.length).fill(0);
    for (const it of items) { const k = A.dayKey(getDate(it)); if (idx.has(k)) out[idx.get(k)]++; }
    return out;
  };

  /* ------------------------------------------------------------------ вкладки */
  const tabs = {};
  const inited = new Set();
  A.registerTab = (id, def) => { tabs[id] = def; if (A._active === id && A.user) initTab(id); };
  function initTab(id) {
    if (inited.has(id) || !tabs[id] || !A.user) return;
    inited.add(id);
    try { const r = tabs[id].init && tabs[id].init(); if (r && r.catch) r.catch(e => console.error(e)); } catch (e) { console.error(e); }
  }
  A.showTab = (id, opts) => {
    const btns = document.querySelectorAll('#admTabs [data-tab]');
    if (![...btns].some(b => b.dataset.tab === id)) id = 'overview';
    A._active = id;
    btns.forEach(b => {
      const on = b.dataset.tab === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-tabpanel]').forEach(p => { p.hidden = p.dataset.tabpanel !== id; });
    if (!(opts && opts.silent) && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    initTab(id);
    if (tabs[id] && tabs[id].show) try { tabs[id].show(); } catch (e) { console.error(e); }
    const active = [...btns].find(b => b.dataset.tab === id);
    if (active && active.scrollIntoView && !(opts && opts.noScroll)) {
      const nav = active.parentElement;
      nav.scrollTo({ left: active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2, behavior: A.motionOff() ? 'auto' : 'smooth' });
    }
  };
  A.bindTabs = () => {
    const nav = document.getElementById('admTabs');
    if (!nav) return;
    nav.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) A.showTab(b.dataset.tab); });
    nav.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const btns = [...nav.querySelectorAll('[data-tab]')];
      const i = btns.findIndex(b => b.classList.contains('active'));
      const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
      A.showTab(n.dataset.tab); n.focus();
    });
    window.addEventListener('hashchange', () => A.showTab(location.hash.slice(1) || 'overview', { silent: true }));
    document.addEventListener('click', e => {
      const l = e.target.closest('[data-goto-tab]');
      if (l) { e.preventDefault(); A.showTab(l.dataset.gotoTab); window.scrollTo({ top: 0, behavior: A.motionOff() ? 'auto' : 'smooth' }); }
    });
  };

  window.MFAdmin = A;
})();
