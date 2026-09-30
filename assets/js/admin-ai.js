// admin-ai.js — вкладка «AI»: состояние сервисов (/api/chat, /api/simplify),
// статистика использования AI-агента и лимиты.
//
// Источники:
//   • GET /api/admin-ai — настройки сервера (провайдер, модель, число ключей, лимиты),
//     только для администраторов; ключи не раскрываются;
//   • Firestore aiChats/{uid}/chats/{id} (collection group «chats») — счётчики чатов и
//     вопросов. Нужно правило чтения для администраторов, иначе блок покажет подсказку.
//     Содержимое переписки панель не показывает;
//   • Firestore settings/ai — лимиты, которые задаёт владелец из панели
//     (api/chat.js и api/simplify.js читают settings/ai, кэш 2 мин; при ошибке — env).

(function () {
  'use strict';
  const A = window.MFAdmin;
  const esc = A.esc;
  let aiPeriod = 30;
  let chart = null;

  A.registerTab('ai', {
    init() {
      document.querySelectorAll('#aiPeriod [data-days]').forEach(ch => ch.addEventListener('click', () => {
        document.querySelectorAll('#aiPeriod [data-days]').forEach(c => { c.classList.toggle('active', c === ch); c.setAttribute('aria-pressed', c === ch); });
        aiPeriod = +ch.dataset.days;
        renderUsage();
      }));
      document.getElementById('aiRefresh').onclick = () => { A.invalidate('ai'); loadAll(); };
      document.getElementById('aiLimitsForm').addEventListener('submit', saveLimits);
      document.getElementById('exportAiCsv').onclick = exportCsv;
      if (!A.isSuper) document.querySelectorAll('#aiLimitsForm input, #aiLimitsForm select, #aiLimitsForm button, #aiLimitsForm textarea').forEach(x => { x.disabled = true; });
      addClearCacheButton();
      loadAll();
    },
  });

  async function loadAll() {
    loadStatus();
    loadLimits();
    await Promise.all([A.loadAiChats(), A.loadUsers().catch(() => null)]);
    renderUsage();
  }

  /* ------------------------------------------------------ состояние сервисов */
  let serverCfg = null;
  async function loadStatus() {
    const box = document.getElementById('aiStatus');
    box.innerHTML = '<p class="empty-hint">Проверка…</p>';
    const [adm, chatR, simpR] = await Promise.all([
      A.api('/api/admin-ai').catch(() => null),
      fetch('/api/chat', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/simplify', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const c = adm && adm.ok && adm.body ? adm.body : null;
    serverCfg = c;
    const yes = (ok, t, f) => `<span class="badge ${ok ? 'yes' : 'no'}">${ok ? (t || 'да') : (f || 'нет')}</span>`;
    const rows = [];
    rows.push(['AI-агент (/api/chat)', chatR ? yes(chatR.configured, 'настроен', 'не настроен') : '<span class="badge banned">нет ответа</span>']);
    rows.push(['«Упростить» (/api/simplify)', simpR ? yes(simpR.configured, 'настроен', 'не настроен') : '<span class="badge banned">нет ответа</span>']);
    if (c) {
      rows.push(['Провайдер', `<code>${esc(c.provider)}</code>${c.providerKnown ? '' : ' <span class="badge banned">неизвестный</span>'}`]);
      if (c.tiers) rows.push(['Модели агента', c.tiers.map(t => `${esc(t.label)} — <code>${esc(t.model)}</code> (${t.cost} ед.)`).join('<br>')]);
      else rows.push(['Модель агента', `<code>${esc(c.model || '—')}</code>`]);
      if (c.taskModels) rows.push(['Авто-функции', `разбор задач — <code>${esc(c.taskModels.geometry)}</code><br>фото — <code>${esc(c.taskModels.vision)}</code>`]);
      if (c.provider === 'ngrok') rows.push(['Запасной провайдер', c.fallback ? `<code>${esc(c.fallback.provider)}</code> · <code>${esc(c.fallback.model)}</code> · ключей: ${c.fallback.keys}` : yes(false, '', 'не настроен')]);
      rows.push(['Модель «Упростить»', `<code>${esc(c.simplifyModel || '—')}</code>`]);
      rows.push(['Ключей API', `${c.keys} ${c.keys ? '' : yes(false, '', 'нет ключей')}`]);
      rows.push(['Поиск в интернете', yes(c.webSearch, 'включён', 'выключен')]);
      rows.push(['Лимит агента', `${c.chatRateLimit} ${c.tiers ? 'ед.' : 'запросов'}/час на пользователя · админы без лимита`]);
      rows.push(['Лимит «Упростить»', `${c.simplifyRateLimit.anonymous}/час гость · ${c.simplifyRateLimit.signedIn}/час с входом`]);
      rows.push(['Джарвис для владельцев', yes(c.jarvis.configured, 'подключён', 'не подключён')]);
      rows.push(['GitHub (редактор тем)', yes(c.github.configured, esc(c.github.repo + ' · ' + c.github.branch), 'нет GITHUB_TOKEN')]);
    } else {
      const why = adm ? (adm.status === 404 ? 'функция /api/admin-ai ещё не задеплоена' : adm.status === 403 ? 'сервер не признал вас администратором' : 'ошибка ' + adm.status) : 'нет ответа';
      rows.push(['Настройки сервера', `<span class="muted">недоступны: ${esc(why)}</span>`]);
      if (chatR) rows.push(['Провайдер', `<code>${esc(chatR.provider || '—')}</code> · поиск ${chatR.webSearch ? 'вкл.' : 'выкл.'}`]);
    }
    box.innerHTML = `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    renderLimitsNote();
  }

  /* ------------------------------------------------------ использование */
  function renderUsage() {
    const ai = A.peek('ai');
    const u = A.peek('users');
    const note = document.getElementById('aiUsageNote');
    const cards = document.getElementById('aiCards');
    if (!ai) { cards.innerHTML = ''; return; }
    if (!ai.ok) {
      note.hidden = false;
      note.innerHTML = `Статистика недоступна: ${esc(A.errText(ai.error))}<br>Чаты хранятся в <code>aiChats/{uid}/chats</code>, и сейчас правила Firestore разрешают читать их только владельцу. Добавьте правило чтения для администраторов (вкладка «Инструменты › Правила Firestore»).`;
      cards.innerHTML = '';
      document.getElementById('aiTopTbody').innerHTML = '';
      return;
    }
    note.hidden = true;
    const chats = ai.chats;
    const now = Date.now();
    const active = days => new Set(chats.filter(c => c.updatedAt && now - c.updatedAt < days * 864e5).map(c => c.uid)).size;
    const questions = chats.reduce((s, c) => s + c.userMsgs, 0);
    const users = new Set(chats.map(c => c.uid)).size;
    const stat = [
      ['Чатов всего', A.fmtNum(chats.length)],
      ['Вопросов всего', A.fmtNum(questions)],
      ['Пользователей AI', A.fmtNum(users)],
      ['Активны за 7 дней', A.fmtNum(active(7))],
      ['Активны за 30 дней', A.fmtNum(active(30))],
      ['Вопросов на чат', chats.length ? (questions / chats.length).toFixed(1).replace('.', ',') : '0'],
    ];
    cards.innerHTML = stat.map(([l, n]) => `<div class="mini-stat"><b>${n}</b><span>${l}</span></div>`).join('');

    const days = A.lastDays(aiPeriod);
    const created = A.countByDay(chats, c => c.createdAt, days);
    const touched = A.countByDay(chats, c => c.updatedAt, days);
    const series = [{ label: 'Новые чаты', data: created, key: 'accent' }, { label: 'Чаты с активностью', data: touched, key: 'accent2' }];
    const labels = days.map(A.dayLabel);
    if (chart) chart.$mfSet(labels, series);
    else chart = A.barChart(document.getElementById('aiChart'), labels, series);

    // Топ пользователей
    const byUid = new Map();
    chats.forEach(c => {
      const x = byUid.get(c.uid) || { uid: c.uid, chats: 0, questions: 0, last: null };
      x.chats++; x.questions += c.userMsgs;
      if (c.updatedAt && (!x.last || c.updatedAt > x.last)) x.last = c.updatedAt;
      byUid.set(c.uid, x);
    });
    const users2 = new Map(u ? u.users.map(x => [x.uid, x]) : []);
    const top = [...byUid.values()].sort((a, b) => b.questions - a.questions).slice(0, 15);
    document.getElementById('aiTopTbody').innerHTML = top.map(x => {
      const p = users2.get(x.uid);
      return `<tr>
        <td><button type="button" class="link-btn" data-user="${esc(x.uid)}">${esc(p ? (p.displayName || p.email) : x.uid)}</button>${p && p.isAdmin ? ' <span class="badge admin">без лимита</span>' : ''}</td>
        <td class="num-cell">${x.chats}</td><td class="num-cell">${x.questions}</td>
        <td class="date">${A.fmtDate(x.last)}</td></tr>`;
    }).join('') || '<tr><td colspan="4" class="muted">Чатов пока нет</td></tr>';
    document.querySelectorAll('#aiTopTbody [data-user]').forEach(b => b.onclick = () => A.openUserCard(b.dataset.user));
  }

  function exportCsv() {
    const ai = A.peek('ai');
    if (!ai || !ai.ok) { A.toast('Статистика AI недоступна', 'bad'); return; }
    const u = A.peek('users');
    const users = new Map(u ? u.users.map(x => [x.uid, x]) : []);
    A.download(`mathframe-ai-usage-${A.stamp()}.csv`, A.toCsv(ai.chats, [
      { key: 'uid', label: 'UID' }, { label: 'Email', get: c => (users.get(c.uid) || {}).email || '' },
      { key: 'id', label: 'ID чата' },
      { label: 'Создан', get: c => c.createdAt ? c.createdAt.toISOString() : '' },
      { label: 'Обновлён', get: c => c.updatedAt ? c.updatedAt.toISOString() : '' },
      { key: 'userMsgs', label: 'Вопросов' }, { key: 'messages', label: 'Сообщений' }, { key: 'chars', label: 'Символов' },
      { key: 'topicId', label: 'Тема справочника' },
    ]), 'text/csv;charset=utf-8');
  }

  /* ------------------------------------------------------ лимиты (settings/ai) */
  let limitsDoc = null;
  async function loadLimits() {
    try {
      const d = await A.db.collection('settings').doc('ai').get();
      limitsDoc = d.exists ? d.data() : {};
    } catch (e) {
      limitsDoc = null;
      document.getElementById('aiLimitsMeta').textContent = 'Не удалось прочитать settings/ai: ' + A.errText(e);
    }
    const f = document.getElementById('aiLimitsForm');
    const v = limitsDoc || {};
    f.chatEnabled.checked = v.chatEnabled !== false;
    f.simplifyEnabled.checked = v.simplifyEnabled !== false;
    f.chatRateLimit.value = v.chatRateLimit || '';
    f.simplifyRateLimit.value = v.simplifyRateLimit || '';
    f.disabledMessage.value = v.disabledMessage || '';
    if (limitsDoc) document.getElementById('aiLimitsMeta').textContent = v.updatedAt ? `Изменено ${A.fmtDate(v.updatedAt)}${v.updatedBy ? ' · ' + v.updatedBy : ''}` : 'Ещё не задавались — действуют значения из переменных окружения.';
    renderLimitsNote();
  }
  function renderLimitsNote() {
    const n = document.getElementById('aiLimitsNote');
    if (!n) return;
    if (serverCfg && serverCfg.overridesSupported) {
      n.className = 'adm-note ok';
      n.textContent = 'Сервер читает эти настройки: изменения вступают в силу в течение нескольких минут.';
    } else {
      n.className = 'adm-note';
      n.innerHTML = 'Значения сохраняются в Firestore <code>settings/ai</code>. Сервер начнёт их учитывать после подключения чтения этого документа в <code>api/chat.js</code> и <code>api/simplify.js</code>; до тех пор действуют переменные окружения <code>AI_AGENT_RATE_LIMIT</code> / <code>SIMPLIFY_RATE_LIMIT</code>. Кэш «Упростить» хранится в памяти функции и очищается при каждом деплое.';
    }
  }
  // Очистка кэша ответов «Упростить» (POST /api/simplify {action:'clearCache'}, только админы).
  // Кэш живёт в памяти одного экземпляра функции — очищается тот, что ответил.
  function addClearCacheButton() {
    const foot = document.querySelector('#aiLimitsForm .form-foot');
    if (!foot || document.getElementById('aiClearCacheBtn')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'aiClearCacheBtn';
    b.className = 'btn small';
    b.textContent = 'Очистить кэш «Упростить»';
    b.title = 'Сбросить сохранённые пересказы тем — следующие запросы уйдут в нейросеть заново';
    b.onclick = async () => {
      const ok = await A.confirm({
        title: 'Очистить кэш «Упростить»',
        text: 'Сохранённые пересказы тем будут удалены, следующие нажатия «Упростить» снова обратятся к нейросети (и расходуют лимит ключа).<br><br>Кэш хранится в памяти функции: очищается экземпляр, который обработает запрос.',
        confirmLabel: 'Очистить',
      });
      if (!ok) return;
      const r = await A.run(b, async () => {
        const res = await A.api('/api/simplify', { method: 'POST', body: JSON.stringify({ action: 'clearCache' }) });
        if (!res.ok) throw new Error((res.body && res.body.error) || 'ошибка ' + res.status);
        return res.body;
      });
      if (r) A.toast(`Кэш очищен: ${r.cleared || 0} ${r.cleared === 1 ? 'запись' : 'записей'}`, 'ok');
    };
    const submit = foot.querySelector('button[type="submit"]');
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;gap:.5rem;flex-wrap:wrap;margin-left:auto';
    foot.insertBefore(wrap, submit);
    wrap.append(b);
    if (submit) wrap.append(submit);
  }

  async function saveLimits(e) {
    e.preventDefault();
    if (!A.isSuper) return;
    const f = e.currentTarget;
    const num = (el, min, max) => { const s = el.value.trim(); if (!s) return null; const n = parseInt(s, 10); return Number.isFinite(n) && n >= min && n <= max ? n : NaN; };
    const chatRate = num(f.chatRateLimit, 1, 10000), simpRate = num(f.simplifyRateLimit, 1, 10000);
    if (Number.isNaN(chatRate) || Number.isNaN(simpRate)) { A.toast('Лимиты — целые числа от 1 до 10000 (или пусто)', 'bad'); return; }
    const data = {
      chatEnabled: f.chatEnabled.checked,
      simplifyEnabled: f.simplifyEnabled.checked,
      chatRateLimit: chatRate,
      simplifyRateLimit: simpRate,
      disabledMessage: f.disabledMessage.value.trim().slice(0, 300) || null,
    };
    const off = [!data.chatEnabled && 'AI-агент', !data.simplifyEnabled && '«Упростить»'].filter(Boolean);
    const ok = await A.confirm({
      title: 'Сохранить настройки AI',
      text: `Лимит агента: <b>${data.chatRateLimit || 'по умолчанию'}</b>/час, «Упростить»: <b>${data.simplifyRateLimit || 'по умолчанию'}</b>/час.${off.length ? `<br>Будут <b>выключены</b> для пользователей: ${off.join(', ')}.` : ''}`,
      confirmLabel: 'Сохранить', danger: off.length > 0,
    });
    if (!ok) return;
    const btn = f.querySelector('button[type="submit"]');
    const res = await A.run(btn, () => A.db.collection('settings').doc('ai').set(Object.assign({}, data, {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: A.user.email,
    }), { merge: true }).then(() => true), 'Настройки AI сохранены');
    if (res) loadLimits();
  }
})();
