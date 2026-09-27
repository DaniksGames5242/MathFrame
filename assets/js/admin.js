// admin.js — админ-панель: проверка доступа, «Обзор», «Пользователи»,
// «Справочник» и «Инструменты». Форум, AI и настройки сайта — в admin-forum.js,
// admin-ai.js и admin-site.js. Общие функции — admin-core.js (window.MFAdmin).

(function () {
  'use strict';
  const A = window.MFAdmin;
  const esc = A.esc;
  A.db = firebase.firestore();
  const db = A.db;
  const FV = firebase.firestore.FieldValue;

  /* =====================================================================
     ПРОВЕРКА ДОСТУПА
     ===================================================================== */
  let started = false;
  function initAuthCheck() {
    window.Auth.onAuthChange(user => checkAccess(user));
  }
  if (window.Auth) initAuthCheck(); else document.addEventListener('authReady', initAuthCheck);

  function checkAccess(user) {
    if (!user) return denyAccess();
    if (A.isSuperEmail(user.email)) { A.isSuper = true; return grantAccess(user); }
    db.collection('admins').doc(user.uid).get().then(doc => {
      if (doc.exists && doc.data().granted) grantAccess(user);
      else denyAccess();
    }).catch(() => denyAccess());
  }
  function denyAccess() { window.location.replace('/'); }
  function grantAccess(user) {
    if (started) return;
    started = true;
    A.user = user;
    document.getElementById('admin-gate').style.display = 'none';
    document.getElementById('admin-root').style.display = 'block';
    const who = document.getElementById('admWho');
    if (who) who.innerHTML = `${A.avatar(user.displayName || user.email, user.photoURL, 'sm')} <span>${esc(user.displayName || user.email || '')}</span> <span class="badge ${A.isSuper ? 'owner' : 'admin'}">${A.isSuper ? 'владелец' : 'админ'}</span>`;
    A.bindTabs();
    A.showTab(location.hash.slice(1) || 'overview', { silent: true, noScroll: true });
  }

  /* =====================================================================
     ОБЗОР
     ===================================================================== */
  let period = 30;
  const charts = {};

  A.registerTab('overview', {
    async init() {
      document.querySelectorAll('#ovPeriod [data-days]').forEach(ch => ch.addEventListener('click', () => {
        document.querySelectorAll('#ovPeriod [data-days]').forEach(c => { c.classList.toggle('active', c === ch); c.setAttribute('aria-pressed', c === ch); });
        period = +ch.dataset.days;
        renderActivity();
      }));
      document.getElementById('ovRefresh').onclick = () => refreshOverview(true);
      await refreshOverview(false);
    },
  });

  async function refreshOverview(force) {
    if (force) A.invalidate('users', 'visits', 'forum', 'ai', 'topics');
    const [topics, visits, u] = await Promise.all([A.loadTopics(), A.loadVisits(), A.loadUsers().catch(e => { A.toast('Пользователи: ' + A.errText(e), 'bad'); return { users: [], admins: new Map(), banned: new Map() }; })]);
    renderCards();
    renderVisitsChart(visits);
    renderTopicsCharts(topics);
    renderActivity();
    renderEvents();
    // Форум и AI — дольше; дорисовываем, когда придут
    A.loadForum().then(() => { renderCards(); renderActivity(); renderEvents(); }).catch(e => { A.toast('Форум: ' + A.errText(e), 'bad'); });
    A.loadAiChats().then(() => { renderCards(); renderActivity(); renderEvents(); });
    return u;
  }

  const peek = A.peek;
  // После любого изменения данных — перерисовать обзор, если он уже открыт
  A.on('data-changed', () => { if (A.cache.users || A.cache.forum) setTimeout(() => { renderCards(); renderActivity(); renderEvents(); }, 0); });

  function renderCards() {
    const now = Date.now();
    const u = peek('users'), v = peek('visits'), f = peek('forum'), ai = peek('ai'), topics = peek('topics');
    const today = new Date().toISOString().slice(0, 10);
    const pend = '<span class="pend">…</span>';
    const users = u ? u.users : null;
    const new7 = users ? users.filter(x => x.createdAt && now - x.createdAt < 7 * 864e5).length : null;
    const active7 = users ? users.filter(x => x.lastLogin && now - x.lastLogin < 7 * 864e5).length : null;
    const replies = f ? f.replies.filter(r => !r.deleted) : null;
    const nonFolder = topics ? topics.filter(t => t.type !== 'folder') : [];
    const withDesc = nonFolder.filter(t => t.description && String(t.description).trim()).length;
    const cards = [
      { num: users ? users.length : null, label: 'Пользователей', sub: new7 != null ? `+${new7} за 7 дней` : '', tab: 'users' },
      { num: active7, label: 'Активны за 7 дней', sub: users && users.length ? Math.round(active7 / users.length * 100) + '% от всех' : '', tab: 'users' },
      { num: v ? (v.days[today] || 0) : null, label: 'Посещений сегодня', sub: v ? 'всего ' + A.fmtNum(v.total) : '' },
      { num: f ? f.articles.length : null, label: 'Статей на форуме', sub: f ? f.articles.filter(a => a.hidden).length + ' скрыто' : '', tab: 'forum' },
      { num: replies ? replies.length : null, label: 'Ответов на форуме', sub: f ? A.fmtNum(f.articles.reduce((s, a) => s + (a.views || 0), 0)) + ' просмотров' : '', tab: 'forum' },
      { num: ai ? (ai.ok ? ai.chats.length : '—') : null, label: 'Чатов с AI', sub: ai ? (ai.ok ? A.fmtNum(ai.chats.reduce((s, c) => s + c.userMsgs, 0)) + ' вопросов' : 'нет доступа') : '', tab: 'ai' },
      { num: u ? u.banned.size : null, label: 'Заблокировано', sub: u ? users.filter(x => x.isAdmin).length + ' админ.' : '', tab: 'users' },
      { num: topics ? nonFolder.length : null, label: 'Тем справочника', sub: topics && nonFolder.length ? Math.round(withDesc / nonFolder.length * 100) + '% с описанием' : '', tab: 'topics' },
    ];
    const grid = document.getElementById('cardsGrid');
    const first = !grid.children.length;
    grid.innerHTML = cards.map((c, i) => `
      <${c.tab ? `button type="button" data-goto-tab="${c.tab}"` : 'div'} class="stat-card mf-card mf-ticks${first ? '' : ' mf-reveal mf-in'}"${first ? ' data-mf-reveal' : ''}>
        <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        <b class="num">${c.num == null ? pend : (typeof c.num === 'number' ? A.fmtNum(c.num) : esc(c.num))}</b>
        <span class="label">${c.label}</span>
        ${c.sub ? `<span class="sub">${esc(c.sub)}</span>` : ''}
      </${c.tab ? 'button' : 'div'}>`).join('');
    if (first && window.MathFrameUI) window.MathFrameUI.reveal();
  }

  /* ----- трафик (как было) ----- */
  function visitsOptions(T) {
    return {
      maintainAspectRatio: false, animation: A.anim(),
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: A.tooltipOpts(T) },
      scales: {
        x: { ticks: { color: T.text3, font: { family: T.mono, size: 10 }, maxRotation: 0, autoSkipPadding: 10 }, grid: { display: false }, border: { color: T.borderStrong } },
        y: { beginAtZero: true, ticks: { color: T.text3, font: { family: T.mono, size: 10 }, precision: 0, maxTicksLimit: 5 }, grid: { color: T.border }, border: { display: false } },
      },
    };
  }
  function styleVisitsDataset(ds, T) {
    ds.borderColor = T.accent; ds.pointBackgroundColor = T.accent; ds.pointHoverBackgroundColor = T.accent;
    ds.backgroundColor = ctx => {
      const area = ctx.chart.chartArea;
      if (!area) return A.withAlpha(T.accent, 0.15);
      const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, A.withAlpha(T.accent, 0.30)); g.addColorStop(1, A.withAlpha(T.accent, 0));
      return g;
    };
  }
  function renderVisitsChart(visits) {
    if (!window.Chart) return;
    const days = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)); }
    document.getElementById('visitsRangeLabel').textContent = 'последние 14 дней';
    const T = A.theme();
    const data = days.map(d => visits.days[d] || 0);
    if (charts.visits) { charts.visits.data.datasets[0].data = data; charts.visits.update(); return; }
    const ds = { label: 'Посещения', data, fill: true, tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, pointHitRadius: 12 };
    styleVisitsDataset(ds, T);
    charts.visits = new Chart(document.getElementById('visitsChart'), {
      type: 'line', data: { labels: days.map(d => d.slice(8) + '.' + d.slice(5, 7)), datasets: [ds] }, options: visitsOptions(T),
    });
    A.onRestyle(() => { const T2 = A.theme(); styleVisitsDataset(charts.visits.data.datasets[0], T2); charts.visits.options = visitsOptions(T2); charts.visits.update('none'); });
  }

  const centerLabel = {
    id: 'mfCenter',
    afterDraw(chart, _args, o) {
      if (!o || o.text == null) return;
      const a = chart.chartArea, ctx = chart.ctx;
      const x = (a.left + a.right) / 2, y = (a.top + a.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = o.color; ctx.font = `700 26px ${o.display}`; ctx.fillText(o.text, x, y - 5);
      ctx.fillStyle = o.subColor; ctx.font = `10px ${o.mono}`; ctx.fillText(o.sub, x, y + 17);
      ctx.restore();
    },
  };
  function donutOptions(T, pct, sub) {
    return {
      maintainAspectRatio: false, animation: A.anim(), cutout: '74%',
      plugins: {
        legend: { position: 'bottom', labels: { color: T.text2, font: { family: T.sans, size: 12 }, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7, padding: 12 } },
        tooltip: Object.assign(A.tooltipOpts(T), { displayColors: true, usePointStyle: true }),
        mfCenter: { text: pct + '%', sub, color: T.text1, subColor: T.text3, display: T.display, mono: T.mono },
      },
    };
  }
  function renderTopicsCharts(topics) {
    if (!window.Chart || charts.desc) return;
    const nonFolder = topics.filter(t => t.type !== 'folder');
    const withDesc = nonFolder.filter(t => t.description && String(t.description).trim().length > 0).length;
    const withExample = nonFolder.filter(t => !!t.example).length;
    const pct = n => nonFolder.length ? Math.round(n / nonFolder.length * 100) : 0;
    const T = A.theme();
    const donut = (id, labels, values, key, sub) => {
      const ch = new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: { labels, datasets: [{ data: values, backgroundColor: [T[key], A.withAlpha(T.text3, 0.28)], borderWidth: 0, spacing: 2, hoverOffset: 3 }] },
        options: donutOptions(T, pct(values[0]), sub), plugins: [centerLabel],
      });
      A.onRestyle(() => {
        const T2 = A.theme(), c = ch.options.plugins.mfCenter;
        ch.data.datasets[0].backgroundColor = [T2[key], A.withAlpha(T2.text3, 0.28)];
        ch.options = donutOptions(T2, parseInt(c.text, 10), c.sub);
        ch.update('none');
      });
      return ch;
    };
    charts.desc = donut('descChart', ['С описанием', 'Без описания'], [withDesc, nonFolder.length - withDesc], 'accent', 'С ОПИСАНИЕМ');
    charts.example = donut('exampleChart', ['С примером', 'Без примера'], [withExample, nonFolder.length - withExample], 'accent2', 'С ПРИМЕРОМ');
  }

  /* ----- активность за период ----- */
  function renderActivity() {
    const days = A.lastDays(period);
    const labels = days.map(A.dayLabel);
    const u = peek('users'), f = peek('forum'), ai = peek('ai');
    document.getElementById('actRangeLabel').textContent = `последние ${period} ${A.plural(period, 'день', 'дня', 'дней')}`;

    const regs = u ? A.countByDay(u.users, x => x.createdAt, days) : days.map(() => 0);
    const arts = f ? A.countByDay(f.articles, x => x.createdAt, days) : days.map(() => 0);
    const reps = f ? A.countByDay(f.replies, x => x.createdAt, days) : days.map(() => 0);
    const chats = ai && ai.ok ? A.countByDay(ai.chats, x => x.createdAt, days) : days.map(() => 0);
    const sum = a => a.reduce((s, x) => s + x, 0);

    const set = (key, canvasId, series, opts) => {
      if (charts[key]) charts[key].$mfSet(labels, series);
      else charts[key] = A.barChart(document.getElementById(canvasId), labels, series, opts);
    };
    set('regs', 'regsChart', [{ label: 'Регистрации', data: regs, key: 'accent' }]);
    set('forumAct', 'forumActChart', [{ label: 'Статьи', data: arts, key: 'accent' }, { label: 'Ответы', data: reps, key: 'accent2' }], { stacked: true });
    set('aiAct', 'aiActChart', [{ label: 'Новые чаты', data: chats, key: 'accent' }]);

    document.getElementById('regsTotal').textContent = u ? A.fmtNum(sum(regs)) : '…';
    document.getElementById('forumActTotal').textContent = f ? `${A.fmtNum(sum(arts))} / ${A.fmtNum(sum(reps))}` : '…';
    const aiT = document.getElementById('aiActTotal');
    aiT.textContent = ai ? (ai.ok ? A.fmtNum(sum(chats)) : 'нет доступа') : '…';
    aiT.title = ai && !ai.ok ? A.errText(ai.error) : '';
  }

  /* ----- лента событий ----- */
  function renderEvents() {
    const u = peek('users'), f = peek('forum'), ai = peek('ai');
    const ev = [];
    const byUid = new Map(u ? u.users.map(x => [x.uid, x]) : []);
    const nameOf = uid => { const x = byUid.get(uid); return x ? (x.displayName || x.email || uid) : uid; };
    if (u) {
      u.users.forEach(x => x.createdAt && ev.push({ t: x.createdAt, kind: 'user', text: `<b>${esc(x.displayName || x.email || x.uid)}</b> зарегистрировался`, uid: x.uid }));
      u.banned.forEach((b, uid) => { const t = A.toDate(b.bannedAt); if (t) ev.push({ t, kind: 'ban', text: `<b>${esc(nameOf(uid))}</b> заблокирован${b.bannedBy ? ' · ' + esc(b.bannedBy) : ''}`, uid }); });
      u.admins.forEach((a, uid) => { const t = A.toDate(a.grantedAt); if (t) ev.push({ t, kind: 'admin', text: `<b>${esc(nameOf(uid))}</b>: ${a.granted ? 'выдан' : 'отозван'} доступ к панели${a.grantedBy ? ' · ' + esc(a.grantedBy) : ''}`, uid }); });
    }
    if (f) {
      f.articles.forEach(a => { const t = A.toDate(a.createdAt); if (t) ev.push({ t, kind: 'article', text: `<b>${esc(a.authorName || 'Аноним')}</b> опубликовал статью «<a href="/forum/#article/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">${esc(a.title || 'без названия')}</a>»` }); });
      f.replies.forEach(r => { const t = A.toDate(r.createdAt); if (t && !r.deleted) ev.push({ t, kind: 'reply', text: `<b>${esc(r.authorName || 'Аноним')}</b> ответил в «<a href="/forum/#article/${encodeURIComponent(r.articleId)}" target="_blank" rel="noopener">${esc(r.articleTitle || 'статья')}</a>»` }); });
    }
    if (ai && ai.ok) ai.chats.forEach(c => c.createdAt && ev.push({ t: c.createdAt, kind: 'ai', text: `<b>${esc(nameOf(c.uid))}</b> начал чат с AI-агентом`, uid: c.uid }));
    ev.sort((a, b) => b.t - a.t);
    const LABEL = { user: 'регистрация', ban: 'блокировка', admin: 'доступ', article: 'статья', reply: 'ответ', ai: 'AI' };
    const list = document.getElementById('eventsList');
    const top = ev.slice(0, 25);
    list.innerHTML = top.length ? top.map(e => `
      <li class="ev ev-${e.kind}">
        <span class="ev-kind">${LABEL[e.kind]}</span>
        <span class="ev-text">${e.text}${e.uid && byUid.has(e.uid) ? ` <button type="button" class="link-btn" data-user="${esc(e.uid)}">профиль</button>` : ''}</span>
        <time class="ev-time" datetime="${e.t.toISOString()}" title="${A.fmtDate(e.t)}">${A.timeAgo(e.t)}</time>
      </li>`).join('') : `<li class="empty-hint">${u ? 'Событий пока нет' : 'Загрузка…'}</li>`;
    list.querySelectorAll('[data-user]').forEach(b => b.onclick = () => openUserCard(b.dataset.user));
  }

  /* =====================================================================
     ПОЛЬЗОВАТЕЛИ
     ===================================================================== */
  let userFilter = 'all';
  A.registerTab('users', {
    init() {
      const s = document.getElementById('userSearch');
      s.addEventListener('input', A.debounce(renderUsersTable, 120));
      document.querySelectorAll('#userChips [data-ufilter]').forEach(ch => ch.addEventListener('click', () => {
        document.querySelectorAll('#userChips [data-ufilter]').forEach(c => { c.classList.toggle('active', c === ch); c.setAttribute('aria-pressed', c === ch); });
        userFilter = ch.dataset.ufilter;
        renderUsersTable();
      }));
      document.getElementById('exportUsersBtn').onclick = exportUsersCsv;
      document.getElementById('usersRefresh').onclick = () => { A.invalidate('users'); reloadUsers(); };
      document.getElementById('usersTbody').addEventListener('click', onUsersClick);
      reloadUsers();
      // счётчики статей/ответов появятся, когда загрузится форум
      A.loadForum().then(renderUsersTable).catch(() => {});
      A.loadAiChats().then(renderUsersTable);
    },
  });

  async function reloadUsers() {
    try { await A.loadUsers(); }
    catch (e) { A.toast('Не удалось загрузить пользователей: ' + A.errText(e), 'bad'); }
    renderUsersTable();
  }

  function activityOf(uid) {
    const f = peek('forum'), ai = peek('ai');
    return {
      articles: f ? f.articles.filter(a => a.authorUid === uid) : null,
      replies: f ? f.replies.filter(r => r.authorUid === uid && !r.deleted) : null,
      chats: ai && ai.ok ? ai.chats.filter(c => c.uid === uid) : null,
    };
  }

  function roleBadge(u) {
    if (u.isOwner) return '<span class="badge owner">владелец</span>';
    if (u.isAdmin) return '<span class="badge admin">админ</span>';
    return '<span class="badge no neutral">пользователь</span>';
  }

  function filteredUsers() {
    const u = peek('users');
    if (!u) return [];
    const q = document.getElementById('userSearch').value.trim().toLowerCase();
    const now = Date.now();
    return u.users.filter(x => {
      if (q && !(`${x.displayName} ${x.email} ${x.uid}`.toLowerCase().includes(q))) return false;
      if (userFilter === 'admins') return x.isAdmin;
      if (userFilter === 'banned') return x.isBanned;
      if (userFilter === 'new') return x.createdAt && now - x.createdAt < 7 * 864e5;
      if (userFilter === 'inactive') return !x.lastLogin || now - x.lastLogin > 30 * 864e5;
      return true;
    });
  }

  function renderUsersTable() {
    const u = peek('users');
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;
    const rows = filteredUsers();
    document.getElementById('usersCount').textContent = u ? (rows.length === u.users.length ? rows.length : `${rows.length} / ${u.users.length}`) : '…';
    document.getElementById('usersEmpty').style.display = u && !rows.length ? 'block' : 'none';
    const me = A.user.uid;
    tbody.innerHTML = rows.slice(0, 500).map(x => {
      const act = activityOf(x.uid);
      const cnt = act.articles ? `${act.articles.length} / ${act.replies.length}` : '…';
      let actions = `<button class="btn small" data-act="card" data-uid="${esc(x.uid)}">Профиль</button>`;
      if (A.isSuper && x.uid !== me && !x.isOwner) {
        actions += ` <button class="btn small" data-act="${x.isAdmin ? 'revoke' : 'grant'}" data-uid="${esc(x.uid)}">${x.isAdmin ? 'Отозвать админа' : 'Сделать админом'}</button>`;
        actions += x.isBanned
          ? ` <button class="btn small" data-act="unban" data-uid="${esc(x.uid)}">Разблокировать</button>`
          : ` <button class="btn small danger" data-act="ban" data-uid="${esc(x.uid)}">Заблокировать</button>`;
        actions += ` <button class="btn small danger" data-act="delete" data-uid="${esc(x.uid)}">Удалить</button>`;
      }
      return `<tr>
        <td><span class="user-cell">${A.avatar(x.displayName || x.email, x.photoURL, 'sm')}<span><b>${esc(x.displayName || '—')}</b>${x.provider ? `<small>${esc(x.provider.replace('.com', ''))}</small>` : ''}</span></span></td>
        <td class="muted">${esc(x.email || '—')}</td>
        <td class="date">${A.fmtDate(x.createdAt)}</td>
        <td class="date">${A.fmtDate(x.lastLogin)}</td>
        <td class="num-cell" title="статьи / ответы">${cnt}</td>
        <td>${roleBadge(x)}</td>
        <td>${x.isBanned ? '<span class="badge banned">заблокирован</span>' : '<span class="badge yes">активен</span>'}</td>
        <td class="actions-cell">${actions}</td>
      </tr>`;
    }).join('');
  }

  function onUsersClick(e) {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const uid = b.dataset.uid;
    const act = b.dataset.act;
    if (act === 'card') openUserCard(uid);
    else if (act === 'grant' || act === 'revoke') setAdmin(uid, act === 'grant', b);
    else if (act === 'ban' || act === 'unban') setBan(uid, act === 'ban', b);
    else if (act === 'delete') deleteUser(uid, b);
  }

  function findUser(uid) { const u = peek('users'); return u ? u.users.find(x => x.uid === uid) : null; }
  const label = x => esc(x ? (x.displayName || x.email || x.uid) : '');

  async function afterUserChange() {
    A.invalidate('users');
    await A.loadUsers().catch(() => {});
    renderUsersTable();
    A.emit('data-changed');
  }

  async function setAdmin(uid, grant, btn) {
    if (!A.isSuper) return;
    const x = findUser(uid);
    const ok = await A.confirm({
      title: grant ? 'Выдать доступ к панели' : 'Отозвать доступ к панели',
      text: grant
        ? `<b>${label(x)}</b> получит доступ к админ-панели, модерации форума и AI-агенту без лимитов.`
        : `<b>${label(x)}</b> потеряет доступ к админ-панели.`,
      confirmLabel: grant ? 'Выдать' : 'Отозвать', danger: !grant,
    });
    if (!ok) return;
    await A.run(btn, () => db.collection('admins').doc(uid).set({
      granted: grant, grantedBy: A.user.email, grantedAt: FV.serverTimestamp(),
    }, { merge: true }), grant ? 'Доступ выдан' : 'Доступ отозван');
    await afterUserChange();
  }

  async function setBan(uid, ban, btn) {
    if (!A.isSuper) return;
    const x = findUser(uid);
    let reason = '';
    if (ban) {
      const r = await A.dialog({
        title: 'Заблокировать пользователя',
        html: `<p class="adm-dlg-text"><b>${label(x)}</b> не сможет входить на сайт (проверка при входе в common.js).</p>
          <label class="adm-field"><span>Причина (видна только в админке)</span><input type="text" id="banReason" maxlength="200" autofocus placeholder="спам, оскорбления…"></label>`,
        actions: [{ label: 'Отмена', value: null }, { label: 'Заблокировать', value: 'ok', danger: true }],
      });
      if (r.value !== 'ok') return;
      reason = r.root.querySelector('#banReason').value.trim();
    } else {
      const ok = await A.confirm({ title: 'Разблокировать', text: `Снять блокировку с <b>${label(x)}</b>?`, confirmLabel: 'Разблокировать' });
      if (!ok) return;
    }
    await A.run(btn, () => ban
      ? db.collection('bannedUsers').doc(uid).set({ bannedAt: FV.serverTimestamp(), bannedBy: A.user.email, reason: reason || null })
      : db.collection('bannedUsers').doc(uid).delete(), ban ? 'Пользователь заблокирован' : 'Блокировка снята');
    await afterUserChange();
  }

  // Удаление контента пользователя на форуме: статьи — целиком (вместе с ответами),
  // его ответы в чужих статьях — мягко, как на самом форуме (deleted:true).
  A.purgeUserContent = async uid => {
    const f = await A.loadForum();
    const arts = f.articles.filter(a => a.authorUid === uid);
    const reps = f.replies.filter(r => r.authorUid === uid && !r.deleted && !arts.some(a => a.id === r.articleId));
    for (const a of arts) await A.deleteArticleDeep(a.id);
    for (let i = 0; i < reps.length; i += 400) {
      const batch = db.batch();
      reps.slice(i, i + 400).forEach(r => batch.update(db.collection('forumArticles').doc(r.articleId).collection('replies').doc(r.id), { deleted: true, bodyHTML: '' }));
      await batch.commit();
    }
    A.invalidate('forum');
    return { articles: arts.length, replies: reps.length };
  };

  // Статья + все её ответы (подколлекция сама не удаляется)
  A.deleteArticleDeep = async id => {
    const ref = db.collection('forumArticles').doc(id);
    const rs = await ref.collection('replies').get();
    const docs = rs.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await ref.delete();
  };

  async function deleteUser(uid, btn) {
    if (!A.isSuper) return;
    const x = findUser(uid);
    const act = activityOf(uid);
    const ok = await A.confirm({
      title: 'Удалить пользователя',
      text: `Будут удалены профиль <b>${label(x)}</b>, его права и отметка о блокировке. Сам аккаунт входа (Firebase Auth) останется — при следующем входе профиль создастся заново; чтобы не пускать человека, лучше заблокировать.`,
      checkbox: { label: `Удалить также его контент на форуме${act.articles ? ` (статей: ${act.articles.length}, ответов: ${act.replies.length})` : ''}`, checked: false },
      typeWord: 'удалить', confirmLabel: 'Удалить', danger: true,
    });
    if (!ok) return;
    await A.run(btn, async () => {
      if (ok.checked) await A.purgeUserContent(uid);
      await db.collection('users').doc(uid).delete();
      await db.collection('admins').doc(uid).delete().catch(() => {});
      await db.collection('bannedUsers').doc(uid).delete().catch(() => {});
    }, 'Пользователь удалён');
    await afterUserChange();
  }

  // Карточка пользователя: сведения, активность, действия
  async function openUserCard(uid) {
    await A.loadUsers().catch(() => {});
    const x = findUser(uid);
    if (!x) { A.toast('Пользователь не найден', 'bad'); return; }
    const [f, ai] = await Promise.all([A.loadForum().catch(() => null), A.loadAiChats()]);
    const act = activityOf(uid);
    const lastArts = (act.articles || []).slice().sort((a, b) => (A.toDate(b.createdAt) || 0) - (A.toDate(a.createdAt) || 0)).slice(0, 5);
    const lastReps = (act.replies || []).slice().sort((a, b) => (A.toDate(b.createdAt) || 0) - (A.toDate(a.createdAt) || 0)).slice(0, 5);
    const likes = (act.replies || []).reduce((s, r) => s + (r.likes || 0), 0);
    const views = (act.articles || []).reduce((s, a) => s + (a.views || 0), 0);
    const chats = act.chats;
    const me = A.user.uid;
    const canManage = A.isSuper && x.uid !== me && !x.isOwner;
    const html = `
      <div class="ucard-head">${A.avatar(x.displayName || x.email, x.photoURL, 'lg')}
        <div><b>${esc(x.displayName || '—')}</b><span>${esc(x.email || '')}</span><span class="ucard-badges">${roleBadge(x)} ${x.isBanned ? '<span class="badge banned">заблокирован</span>' : ''}</span></div></div>
      <dl class="ucard-dl">
        <dt>UID</dt><dd><code>${esc(x.uid)}</code> <button type="button" class="link-btn" data-copy="${esc(x.uid)}">копировать</button></dd>
        <dt>Вход через</dt><dd>${esc(x.provider || '—')}</dd>
        <dt>Регистрация</dt><dd>${A.fmtDate(x.createdAt)}</dd>
        <dt>Последний вход</dt><dd>${A.fmtDate(x.lastLogin)} <small>(${A.timeAgo(x.lastLogin)})</small></dd>
        ${x.isBanned ? `<dt>Блокировка</dt><dd>${A.fmtDate(x.ban && x.ban.bannedAt)}${x.ban && x.ban.bannedBy ? ' · ' + esc(x.ban.bannedBy) : ''}${x.ban && x.ban.reason ? '<br>Причина: ' + esc(x.ban.reason) : ''}</dd>` : ''}
      </dl>
      <div class="ucard-stats">
        <div><b>${act.articles ? act.articles.length : '—'}</b><span>статей</span></div>
        <div><b>${act.replies ? act.replies.length : '—'}</b><span>ответов</span></div>
        <div><b>${f ? A.fmtNum(views) : '—'}</b><span>просмотров</span></div>
        <div><b>${f ? A.fmtNum(likes) : '—'}</b><span>лайков</span></div>
        <div><b>${chats ? chats.length : '—'}</b><span>чатов AI</span></div>
        <div><b>${chats ? A.fmtNum(chats.reduce((s, c) => s + c.userMsgs, 0)) : '—'}</b><span>вопросов AI</span></div>
      </div>
      ${lastArts.length ? `<h3 class="ucard-h">Статьи</h3><ul class="ucard-list">${lastArts.map(a => `<li><a href="/forum/#article/${encodeURIComponent(a.id)}" target="_blank" rel="noopener">${esc(a.title || 'без названия')}</a><time>${A.timeAgo(a.createdAt)}</time></li>`).join('')}</ul>` : ''}
      ${lastReps.length ? `<h3 class="ucard-h">Последние ответы</h3><ul class="ucard-list">${lastReps.map(r => `<li><span>${esc(A.stripHtml(r.bodyHTML).slice(0, 110) || '(вложение)')}</span><time>${A.timeAgo(r.createdAt)}</time></li>`).join('')}</ul>` : ''}
      ${!ai.ok ? '<p class="adm-note">Статистика AI недоступна: нет правила чтения aiChats для администраторов.</p>' : ''}`;
    const actions = [{ label: 'Закрыть', value: null }];
    if (canManage) {
      actions.unshift({ label: x.isAdmin ? 'Отозвать админа' : 'Сделать админом', value: x.isAdmin ? 'revoke' : 'grant' });
      actions.unshift({ label: x.isBanned ? 'Разблокировать' : 'Заблокировать', value: x.isBanned ? 'unban' : 'ban', danger: !x.isBanned });
      if ((act.articles && act.articles.length) || (act.replies && act.replies.length)) actions.unshift({ label: 'Удалить контент', value: 'purge', danger: true });
    }
    const r = await A.dialog({
      title: 'Пользователь', html, wide: true, actions,
      onOpen: root => root.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => {
        navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(() => A.toast('UID скопирован'));
      }),
    });
    if (r.value === 'grant' || r.value === 'revoke') setAdmin(uid, r.value === 'grant');
    else if (r.value === 'ban' || r.value === 'unban') setBan(uid, r.value === 'ban');
    else if (r.value === 'purge') {
      const ok = await A.confirm({
        title: 'Удалить контент пользователя',
        text: `Статьи <b>${label(x)}</b> (${act.articles.length}) будут удалены вместе с ответами к ним, его ответы в чужих статьях (${act.replies.length}) — помечены удалёнными.`,
        typeWord: 'удалить', confirmLabel: 'Удалить контент', danger: true,
      });
      if (!ok) return;
      const res = await A.run(null, () => A.purgeUserContent(uid));
      if (res) A.toast(`Удалено статей: ${res.articles}, ответов: ${res.replies}`, 'ok');
      A.emit('forum-changed'); A.emit('data-changed');
    }
  }
  A.openUserCard = openUserCard;

  function exportUsersCsv() {
    const u = peek('users');
    if (!u) return;
    const rows = filteredUsers();
    A.download(`mathframe-users-${A.stamp()}.csv`, A.toCsv(rows, [
      { key: 'uid', label: 'UID' }, { key: 'displayName', label: 'Имя' }, { key: 'email', label: 'Email' },
      { key: 'provider', label: 'Вход через' },
      { label: 'Регистрация', get: r => r.createdAt ? r.createdAt.toISOString() : '' },
      { label: 'Последний вход', get: r => r.lastLogin ? r.lastLogin.toISOString() : '' },
      { label: 'Роль', get: r => r.role },
      { label: 'Заблокирован', get: r => r.isBanned ? 'да' : 'нет' },
      { label: 'Статей', get: r => { const a = activityOf(r.uid); return a.articles ? a.articles.length : ''; } },
      { label: 'Ответов', get: r => { const a = activityOf(r.uid); return a.replies ? a.replies.length : ''; } },
      { label: 'Чатов AI', get: r => { const a = activityOf(r.uid); return a.chats ? a.chats.length : ''; } },
    ]), 'text/csv;charset=utf-8');
  }

  /* =====================================================================
     СПРАВОЧНИК (таблица тем — как было)
     ===================================================================== */
  A.registerTab('topics', {
    async init() {
      document.getElementById('goEditorBtn').onclick = () => { window.location.href = '/admin/hierarchy-editor/'; };
      const topics = await A.loadTopics();
      document.getElementById('topicSearch').addEventListener('input', () => renderTopicsTable(topics));
      document.querySelectorAll('#topicChips .chip').forEach(chip => chip.addEventListener('click', () => {
        document.querySelectorAll('#topicChips .chip').forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', c === chip); });
        renderTopicsTable(topics);
      }));
      document.getElementById('exportTopicsBtn').onclick = () => {
        const q = filterTopics(topics);
        A.download(`mathframe-topics-${A.stamp()}.csv`, A.toCsv(q, [
          { key: 'id', label: 'ID' }, { key: 'title', label: 'Название' }, { label: 'Тип', get: t => t.type || 'topic' },
          { label: 'Родитель', get: t => t.parentId || t.parent || '' },
          { label: 'Длина описания', get: t => String(t.description || '').length },
          { label: 'Пример', get: t => t.example ? 'да' : 'нет' },
        ]), 'text/csv;charset=utf-8');
      };
      renderTopicsTable(topics);
    },
  });
  function filterTopics(topics) {
    const query = document.getElementById('topicSearch').value.trim().toLowerCase();
    const filter = (document.querySelector('#topicChips .chip.active') || {}).dataset?.filter || 'all';
    return topics.filter(t => {
      if (query && !String(t.title || '').toLowerCase().includes(query)) return false;
      if (filter === 'no-desc') return t.type !== 'folder' && !(t.description && String(t.description).trim());
      if (filter === 'no-example') return t.type !== 'folder' && !t.example;
      if (filter === 'folder') return t.type === 'folder';
      return true;
    });
  }
  function renderTopicsTable(topics) {
    const rows = filterTopics(topics);
    document.getElementById('topicsCount').textContent = rows.length;
    document.getElementById('topicsEmpty').style.display = rows.length ? 'none' : 'block';
    document.getElementById('topicsTbody').innerHTML = rows.slice(0, 300).map(t => {
      const isFolder = t.type === 'folder';
      const hasDesc = t.description && String(t.description).trim();
      return `<tr>
        <td>${isFolder ? esc(t.title || t.id || '—') : `<a href="/spravochnik/#${encodeURIComponent(t.id)}" target="_blank" rel="noopener">${esc(t.title || t.id || '—')}</a>`}</td>
        <td class="muted">${isFolder ? 'Папка' : 'Тема'}</td>
        <td${isFolder ? ' class="muted"' : ''}>${isFolder ? '—' : `<span class="badge ${hasDesc ? 'yes' : 'no'}">${hasDesc ? 'есть' : 'нет'}</span>`}</td>
        <td${isFolder ? ' class="muted"' : ''}>${isFolder ? '—' : `<span class="badge ${t.example ? 'yes' : 'no'}">${t.example ? 'есть' : 'нет'}</span>`}</td>
      </tr>`;
    }).join('') + (rows.length > 300 ? `<tr><td colspan="4" class="muted">…и ещё ${rows.length - 300}. Уточните поиск.</td></tr>` : '');
  }

  /* =====================================================================
     ИНСТРУМЕНТЫ: экспорт, резервная копия, правила
     ===================================================================== */
  A.registerTab('tools', {
    init() {
      document.getElementById('exportStatsBtn').onclick = exportStatsJson;
      document.getElementById('exportBackupBtn').onclick = exportBackup;
      const copy = document.getElementById('copyRulesBtn');
      if (copy) copy.onclick = () => {
        const text = document.getElementById('rulesText').textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => A.toast('Правила скопированы', 'ok')).catch(() => A.toast('Не удалось скопировать — выделите текст вручную', 'bad'));
      };
    },
  });

  async function exportStatsJson() {
    const [topics, visits, u] = await Promise.all([A.loadTopics(), A.loadVisits(), A.loadUsers().catch(() => null)]);
    const f = await A.loadForum().catch(() => null);
    const ai = await A.loadAiChats();
    const nonFolder = topics.filter(t => t.type !== 'folder');
    const stats = {
      exportedAt: new Date().toISOString(),
      users: u ? u.users.length : null,
      admins: u ? u.users.filter(x => x.isAdmin).length : null,
      banned: u ? u.banned.size : null,
      visitsTotal: visits.total || 0,
      visitsByDay: visits.days || {},
      topics: nonFolder.length,
      folders: topics.length - nonFolder.length,
      withDescription: nonFolder.filter(t => t.description && String(t.description).trim()).length,
      withExample: nonFolder.filter(t => !!t.example).length,
      forumArticles: f ? f.articles.length : null,
      forumReplies: f ? f.replies.filter(r => !r.deleted).length : null,
      forumViews: f ? f.articles.reduce((s, a) => s + (a.views || 0), 0) : null,
      aiChats: ai.ok ? ai.chats.length : null,
      aiQuestions: ai.ok ? ai.chats.reduce((s, c) => s + c.userMsgs, 0) : null,
    };
    A.download(`mathframe-stats-${A.stamp()}.json`, JSON.stringify(stats, null, 2), 'application/json');
  }

  // Резервная копия того, что панель может прочитать (без содержимого AI-чатов)
  async function exportBackup(e) {
    const btn = e && e.currentTarget;
    await A.run(btn, async () => {
      A.invalidate('users', 'forum');
      const [u, f, visits] = await Promise.all([A.loadUsers(), A.loadForum(), A.loadVisits()]);
      const settings = {};
      try { (await db.collection('settings').get()).forEach(d => settings[d.id] = A.plain(d.data())); } catch (err) { settings._error = A.errText(err); }
      const backup = {
        exportedAt: new Date().toISOString(), exportedBy: A.user.email,
        users: u.users.map(x => ({ ...x, createdAt: x.createdAt && x.createdAt.toISOString(), lastLogin: x.lastLogin && x.lastLogin.toISOString(), ban: A.plain(x.ban) })),
        admins: Object.fromEntries([...u.admins].map(([k, v]) => [k, A.plain(v)])),
        bannedUsers: Object.fromEntries([...u.banned].map(([k, v]) => [k, A.plain(v)])),
        forumArticles: f.articles.map(a => A.plain({ ...a, replies: f.replies.filter(r => r.articleId === a.id).map(r => { const { articleId, articleTitle, ...rest } = r; return rest; }) })),
        stats: { visits: A.plain(visits) },
        settings,
      };
      A.download(`mathframe-backup-${A.stamp()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    }, 'Резервная копия сохранена');
  }
})();
