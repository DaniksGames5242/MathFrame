// ai-agent.js — страница «AI‑агент» (/ai-agent/).
//
// Что здесь происходит:
//   1. Справочник (/data/topics/config.json) грузится один раз и индексируется:
//      на каждый вопрос из него подбираются самые подходящие темы, их описания
//      уходят на сервер вместе с вопросом — агент отвечает «с оглядкой» на
//      справочник и может сослаться на его темы.
//   2. Запрос идёт на /api/chat (там лежит ключ сайта). Ответ приходит
//      потоком обычного текста и по мере поступления перерисовывается.
//   3. Ответ — Markdown с формулами $…$ / $$…$$: собственный небольшой
//      разборщик (без библиотек) + KaTeX, который уже есть на сайте.
//   4. Чаты привязаны к аккаунту: каждый — документ Firestore
//      aiChats/{uid}/chats/{id}; копия лежит в localStorage — для мгновенного
//      старта и на случай, если хранилище аккаунта недоступно. Чтобы синхронизация
//      работала, в правилах Firestore должно быть (только владелец):
//        match /aiChats/{uid}/chats/{chatId} {
//          allow read, write: if request.auth != null && request.auth.uid == uid;
//        }
//
// Чистые функции (поиск, разбор Markdown) не трогают DOM и вынесены наверх —
// в конце файла они экспортируются для проверки в Node.

(function () {
  'use strict';

  /* ==========================================================================
     ПОИСК ПО СПРАВОЧНИКУ
     ========================================================================== */

  // Лёгкий срезатель окончаний — этого достаточно, чтобы «трапеции» нашла
  // «трапеция». Не лемматизатор: цель — просто не промахиваться мимо форм слова.
  const STEM_ENDINGS = ['иями', 'иях', 'ями', 'ами', 'его', 'ому', 'ему', 'ыми', 'ими',
    'ое', 'ее', 'ая', 'яя', 'ые', 'ие', 'ов', 'ев', 'ей', 'ий', 'ый', 'ой', 'юю', 'ою', 'ею',
    'ии', 'ия', 'ию', 'ям', 'ам', 'ах', 'ях', 'ы', 'и', 'а', 'я', 'у', 'ю', 'о', 'е', 'ь', 'й'
  ].sort((a, b) => b.length - a.length);

  // Служебные слова и глаголы-просьбы: по ним ничего искать не нужно.
  const STOP = new Set(('что как это для или при про его она они мне где чем так все еще ещё вот быть есть ' +
    'нужно можно какой какая какие какое который которая которые почему зачем когда если чтобы между ' +
    'объясни объяснить расскажи рассказать покажи показать найди найти реши решить помоги помочь ' +
    'простыми словами пример примере пожалуйста спасибо благодарю привет здравствуйте ясно понятно хорошо').split(/\s+/));

  function stemWord(w) {
    if (w.length <= 3) return w;
    for (const end of STEM_ENDINGS) {
      if (w.length - end.length >= 3 && w.endsWith(end)) return w.slice(0, -end.length);
    }
    return w;
  }

  // Слова текста → основы. Латиница и цифры остаются как есть (sin, cos, 45).
  function stems(text) {
    const words = String(text || '').toLowerCase().match(/[а-яёa-z0-9]+/g) || [];
    const out = [];
    for (const w of words) {
      if (STOP.has(w)) continue;
      if (/[а-яё]/.test(w)) { if (w.length >= 3) out.push(stemWord(w)); }
      else if (w.length >= 2) out.push(w);
    }
    return out;
  }

  function normalizeTitle(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/g, ' ').trim();
  }

  function decodeEntities(s) {
    return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }

  // HTML описания темы → обычный текст. Формулы ($…$, $$…$$) сохраняются как
  // есть — модель читает LaTeX без проблем. Их прячем на время вырезания тегов,
  // иначе «$a<b$» принялось бы за начало тега.
  function htmlToText(html) {
    const held = [];
    let s = String(html || '').replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => { held.push(m); return '\u0000' + (held.length - 1) + '\u0000'; });
    s = s.replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
    s = decodeEntities(s).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => held[+i]);
  }

  // Индекс: для каждой темы — множества основ из названия, ключевых слов и
  // начала описания; по числу тем с этой основой считается «редкость» слова.
  function buildIndex(topics) {
    const items = [];
    const byId = new Map();
    const df = new Map();
    for (const t of topics) {
      if (!t || !t.id) continue;
      const text = htmlToText(t.description || '');
      const it = {
        id: t.id,
        title: t.title || '',
        type: t.type || 'topic',
        titleNorm: normalizeTitle(t.title),
        titleS: new Set(stems(t.title)),
        kwS: new Set(stems(t.keywords)),
        descS: new Set(stems(text.slice(0, 1500))),
        hasText: text.length >= 20,
      };
      new Set([...it.titleS, ...it.kwS, ...it.descS]).forEach(s => df.set(s, (df.get(s) || 0) + 1));
      items.push(it);
      byId.set(it.id, it);
    }
    return { items, byId, df, n: items.length };
  }

  function scoreItem(index, it, qStems, qNorm) {
    let s = 0;
    for (const q of qStems) {
      const idf = Math.log(1 + index.n / (1 + (index.df.get(q) || 0)));
      if (it.titleS.has(q)) s += 3 * idf;
      else if (it.kwS.has(q)) s += 2 * idf;
      else if (it.descS.has(q)) s += 0.7 * idf;
    }
    // Название темы прямо названо в вопросе («теорема Пифагора») — самый сильный сигнал.
    if (it.titleNorm.length >= 4 && (' ' + qNorm + ' ').includes(' ' + it.titleNorm + ' ')) s += 6;
    if (!it.hasText) s *= 0.5;          // у темы нет описания — рассказывать нечего
    if (it.type === 'folder') s *= 0.6; // раздел — только обзор
    return s;
  }

  // Самые подходящие темы к вопросу: не больше k штук, и только те, что не
  // намного слабее лучшей — лучше промолчать, чем подсунуть случайное.
  function retrieve(index, query, opts) {
    opts = opts || {};
    const k = opts.k || 4;
    const exclude = opts.exclude || new Set();
    const qStems = [...new Set(stems(query))];
    if (!qStems.length) return [];
    const qNorm = normalizeTitle(query);
    const scored = [];
    for (const it of index.items) {
      if (exclude.has(it.id)) continue;
      let s = scoreItem(index, it, qStems, qNorm);
      // Слово, встретившееся только где-то в тексте описания, — слабый повод
      // тащить тему в ответ («привет, как дела?» иначе находит леммы и ортоцентры).
      // Без совпадения по названию или ключевым словам нужно очень сильное совпадение по тексту.
      const anchored = qStems.some(q => it.titleS.has(q) || it.kwS.has(q)) || s >= 6;
      if (!anchored) s = 0;
      if (s > 0) scored.push({ id: it.id, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    if (!scored.length) return [];
    const floor = Math.max(2, scored[0].score * 0.4);
    return scored.filter(r => r.score >= floor).slice(0, k);
  }

  // Подсказки для выбора темы вручную: только по названию.
  function searchTitles(index, query, limit) {
    const q = normalizeTitle(query);
    if (!q) return [];
    const qS = stems(query);
    const out = [];
    for (const it of index.items) {
      let s = 0;
      if (it.titleNorm === q) s = 100;
      else if (it.titleNorm.startsWith(q)) s = 60;
      else if (it.titleNorm.includes(q)) s = 40;
      else if (qS.length && qS.every(x => it.titleS.has(x))) s = 20;
      if (s) out.push({ id: it.id, title: it.title, type: it.type, s: s - it.titleNorm.length * 0.01 });
    }
    out.sort((a, b) => b.s - a.s);
    return out.slice(0, limit || 8);
  }

  /* ==========================================================================
     MARKDOWN → HTML
     ========================================================================== */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function mathSpan(tex, display) {
    const shown = (display ? '$$' : '$') + tex + (display ? '$$' : '$');
    return '<span class="mfa-math" data-display="' + (display ? 1 : 0) + '" data-tex="' + escapeHtml(tex) + '">' + escapeHtml(shown) + '</span>';
  }

  // Ссылки: только на темы справочника и на http(s) — никаких javascript: и прочего.
  function safeHref(href) {
    if (/^\/spravochnik\/#[\w.\-%]+$/.test(href)) return { href, external: false };
    if (/^https?:\/\/[^\s"<>]+$/.test(href)) return { href, external: true };
    return null;
  }

  // Порядок важен: сначала прячем то, внутри чего разметка не действует (код,
  // формулы), потом экранируем всё остальное, потом разбираем блоки и строчные
  // выделения, и в конце возвращаем спрятанное на места.
  function mdToHtml(src) {
    const store = [];
    const hold = html => { store.push(html); return '\u0000' + (store.length - 1) + '\u0000'; };
    let s = String(src || '').replace(/\r\n/g, '\n');

    s = s.replace(/```[^\n]*\n([\s\S]*?)(```|$)/g, (m, code) => hold('<pre><code>' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>'));
    s = s.replace(/`([^`\n]+)`/g, (m, c) => hold('<code>' + escapeHtml(c) + '</code>'));
    // Модели нередко пишут \( \) и \[ \] несмотря на просьбу — приводим к $ и $$.
    s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, t) => '$$' + t + '$$').replace(/\\\(([\s\S]+?)\\\)/g, (m, t) => '$' + t + '$');
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => hold(mathSpan(t.trim(), true)));
    // Строчная формула не начинается и не кончается пробелом — так «$5 и $10» не склеится в формулу.
    s = s.replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$/g, (m, t) => hold(mathSpan(t, false)));

    s = escapeHtml(s);

    const inline = text => text
      .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
        const ok = safeHref(url.replace(/&amp;/g, '&'));
        if (!ok) return label;
        return '<a href="' + escapeHtml(ok.href) + '"' + (ok.external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + label + '</a>';
      });

    // Абзац, состоящий из одной блочной формулы или блока кода, не оборачиваем в <p>.
    const wrapPara = text => {
      const only = text.trim().match(/^\u0000(\d+)\u0000$/);
      if (only) {
        const payload = store[+only[1]];
        if (payload.startsWith('<pre') || payload.indexOf('data-display="1"') !== -1) return payload;
      }
      return '<p>' + inline(text).replace(/\n/g, '<br>') + '</p>';
    };

    let html = '';
    let para = [], list = null, quote = [];
    const flushPara = () => { if (para.length) { html += wrapPara(para.join('\n')); para = []; } };
    const flushList = () => {
      if (!list) return;
      html += '<' + list.type + '>' + list.items.map(t => '<li>' + inline(t).replace(/\n/g, '<br>') + '</li>').join('') + '</' + list.type + '>';
      list = null;
    };
    const flushQuote = () => { if (quote.length) { html += '<blockquote>' + inline(quote.join('\n')).replace(/\n/g, '<br>') + '</blockquote>'; quote = []; } };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };

    for (const line of s.split('\n')) {
      let m;
      if (!line.trim()) { flushAll(); continue; }
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flushAll();
        const tag = m[1].length <= 2 ? 'h3' : 'h4';
        html += '<' + tag + '>' + inline(m[2]) + '</' + tag + '>';
      } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        flushAll(); html += '<hr>';
      } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
        flushPara(); flushList();
        quote.push(m[1]);
      } else if (list && /^\s{2,}\S/.test(line)) {
        list.items[list.items.length - 1] += '\n' + line.trim();  // продолжение пункта списка
      } else {
        flushList(); flushQuote();
        para.push(line);
      }
    }
    flushAll();
    return html.replace(/\u0000(\d+)\u0000/g, (m, i) => store[+i]);
  }

  /* ==========================================================================
     ЧИСТАЯ ЛОГИКА ЧАТА
     ========================================================================== */

  // Сообщения → то, что уходит на сервер: без пустых и упавших, подряд идущие
  // реплики одного автора склеены (после сбоя в истории бывают два «user» подряд,
  // а провайдеры такое переваривают по-разному), в конце — не больше 12.
  function buildPayloadMessages(messages, max) {
    const out = [];
    for (const m of messages) {
      if (!m || !m.content || m.error) continue;
      // Список «Источники из интернета», который сервер дописывает к ответу, — это
      // оформление для читателя; обратно в историю он не нужен.
      const content = m.content.replace(/\n*\*\*Источники из интернета:\*\*[\s\S]*$/, '').trim();
      if (!content) continue;
      const last = out[out.length - 1];
      if (last && last.role === m.role) last.content += '\n\n' + content;
      else out.push({ role: m.role, content });
    }
    return out.slice(-(max || 12));
  }

  // Джарвис умеет «начать ответ заново» (например, после сбоя сети посреди фразы) — сервер
  // сообщает об этом служебной меткой прямо в потоке текста; всё, что было до неё, отбрасывается.
  const RESET_MARK = '\u001eRESET\u001e';
  function applyResetMark(text) {
    const i = text.lastIndexOf(RESET_MARK);
    return i === -1 ? text : text.slice(i + RESET_MARK.length);
  }

  function friendlyError(status, data) {
    if (data && data.error) return data.error;
    if (status === 401) return 'Войдите в аккаунт, чтобы пользоваться AI-агентом.';
    if (status === 429) return 'Слишком много запросов. Попробуйте чуть позже.';
    if (status === 503) return 'AI-агент ещё не настроен администратором сайта.';
    return 'Не удалось получить ответ (код ' + status + '). Попробуйте ещё раз.';
  }

  /* ==========================================================================
     ЧАТЫ: ЧИСТЫЕ ФУНКЦИИ
     ========================================================================== */

  // Название чата по первому вопросу: первая строка без разметки, не длиннее 48 знаков.
  function deriveTitle(text) {
    let t = String(text || '').split('\n').map(s => s.trim()).find(Boolean) || '';
    t = t.replace(/[*_`#>]+/g, '').replace(/\s+/g, ' ').trim();
    if (t.length > 48) t = t.slice(0, 47).replace(/\s+\S*$/, '') + '…';
    return t || 'Новый чат';
  }

  // Подпись времени в списке: сегодня — «14:05», за последнюю неделю — день недели, иначе дата.
  function fmtWhen(ts, now) {
    if (!ts) return '';
    const d = new Date(ts), n = new Date(now || Date.now());
    const day = x => Math.floor((x.getTime() - x.getTimezoneOffset() * 60000) / 86400000);
    const diff = day(n) - day(d);
    const p2 = v => (v < 10 ? '0' : '') + v;
    if (diff <= 0) return p2(d.getHours()) + ':' + p2(d.getMinutes());
    if (diff === 1) return 'вчера';
    if (diff < 7) return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()];
    return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2);
  }

  // Что реально хранится: без пустых «ошибочных» ответов и служебных полей, не больше
  // 80 сообщений (документ Firestore ограничен 1 МБ), без undefined (Firestore их не принимает).
  const MAX_STORED_MESSAGES = 80;
  function cleanMessages(msgs) {
    const out = [];
    for (const m of msgs || []) {
      if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') continue;
      if (m.role === 'assistant' && !m.content) continue;
      const o = { role: m.role, content: m.content.slice(0, 20000) };
      if (m.sources && m.sources.length) o.sources = m.sources.slice(0, 8).map(s => ({ id: String(s.id), title: String(s.title || s.id), focus: !!s.focus }));
      out.push(o);
    }
    return out.slice(-MAX_STORED_MESSAGES);
  }

  /* ==========================================================================
     ИНТЕРФЕЙС
     ========================================================================== */

  function initPage() {
    const $ = id => document.getElementById(id);
    const el = {
      card: $('agentCard'), scrim: $('agentScrim'), chatList: $('agentChatList'), sync: $('agentSync'),
      newBtn: $('agentNew'), menu: $('agentMenu'), title: $('agentTitle'),
      ctx: $('agentCtx'), pick: $('agentPick'), picker: $('agentPicker'), pickInput: $('agentPickInput'), pickList: $('agentPickList'),
      scroll: $('agentScroll'), log: $('agentLog'), banner: $('agentBanner'),
      form: $('agentForm'), input: $('agentInput'), send: $('agentSend'), stop: $('agentStop'),
      login: $('agentLogin'), loginBtn: $('agentLoginBtn'), badge: $('agentBadge'),
    };

    // Обычный пользователь: до 50 чатов (сверх — самый старый удаляется), сообщение до 4000 знаков,
    // 12 последних реплик в запросе. У администраторов этих ограничений нет — роль сообщает сервер.
    const USER_MAX_CHATS = 50, ADMIN_MAX_CHATS = 500;
    let maxChats = USER_MAX_CHATS;
    let role = 'user', assistant = 'mistral', unlimited = false;
    const MAX_MIRROR = 30;        // сколько чатов дублируется в localStorage
    const LS_OLD = 'mf-agent-chat-v1';           // прежний единственный диалог
    const lsChats = u => 'mf-agent-chats-v2:' + u;
    const lsActive = u => 'mf-agent-active-v2:' + u;
    const uuid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    function makeChat() {
      const t = Date.now();
      return { id: uuid(), title: '', topicId: null, messages: [], createdAt: t, updatedAt: t, dirty: false, busy: false };
    }

    let user = null, uid = null;
    let chats = new Map();
    let activeId = null;
    let anon = makeChat();                 // то, что показано, пока пользователь не вошёл
    let topicsById = new Map(), childrenOf = new Map(), index = null;
    let configured = true;
    let baseConfigured = true;             // настроена ли модель вообще (ответ на запрос без входа)
    let syncState = 'connecting';          // connecting | ok | error | off
    let col = null, unsub = null, migrated = false;
    let autoDraftId = null;                // пустой чат, созданный автоматически, пока чатов ещё не было видно
    let urlTopic = new URLSearchParams(location.search).get('topic');
    const runs = new Map();                // id чата -> AbortController идущего ответа

    const byUpdated = (a, b) => b.updatedAt - a.updatedAt;
    const cur = () => (uid ? chats.get(activeId) : anon) || null;

    /* ---- формулы ---- */
    const mathCache = new Map();
    function hydrateMath(root) {
      const pending = root.querySelectorAll('.mfa-math:not([data-done])');
      if (!pending.length) return;
      if (!window.katex) { waitForKatex(root); return; }
      pending.forEach(node => {
        const tex = node.dataset.tex, display = node.dataset.display === '1';
        const key = (display ? 'D' : 'I') + tex;
        let html = mathCache.get(key);
        if (html === undefined) {
          try { html = window.katex.renderToString(tex, { throwOnError: false, displayMode: display }); }
          catch (e) { html = null; }
          if (mathCache.size > 500) mathCache.clear();
          mathCache.set(key, html);
        }
        if (html) node.innerHTML = html;   // если не вышло — остаётся исходный текст формулы
        node.dataset.done = '1';
      });
    }
    let katexWait = null;
    function waitForKatex(root) {
      if (katexWait) return;
      let tries = 0;
      katexWait = setInterval(() => {
        tries++;
        if (window.katex || tries > 60) {
          clearInterval(katexWait); katexWait = null;
          if (window.katex) hydrateMath(el.log);
        }
      }, 150);
    }

    /* ---- иконки ---- */
    const ICON = {
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
      redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    };

    /* ==================================================================
       ХРАНЕНИЕ: Firestore (аккаунт) + копия в localStorage (мгновенный старт, офлайн)
       ================================================================== */
    function serialize(c) {
      return { id: c.id, title: c.title, topicId: c.topicId || null, messages: cleanMessages(c.messages), createdAt: c.createdAt, updatedAt: c.updatedAt, dirty: !!c.dirty };
    }
    function fromData(id, d) {
      return {
        id, title: typeof d.title === 'string' ? d.title : '', topicId: typeof d.topicId === 'string' ? d.topicId : null,
        messages: Array.isArray(d.messages) ? d.messages.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [],
        createdAt: +d.createdAt || 0, updatedAt: +d.updatedAt || 0, dirty: !!d.dirty, busy: false,
      };
    }
    function localRead() {
      try {
        const arr = JSON.parse(localStorage.getItem(lsChats(uid)) || '[]');
        return Array.isArray(arr) ? arr.filter(x => x && x.id).map(x => fromData(x.id, x)) : [];
      } catch (e) { return []; }
    }
    function localWrite() {
      if (!uid) return;
      const list = [...chats.values()].filter(c => c.messages.length).sort(byUpdated).slice(0, MAX_MIRROR).map(serialize);
      // при переполнении хранилища оставляем сколько влезет — самые свежие
      for (let n = list.length; ; n = Math.floor(n / 2)) {
        try { localStorage.setItem(lsChats(uid), JSON.stringify(list.slice(0, n))); return; }
        catch (e) { if (n === 0) return; }
      }
    }

    const SYNC_ERR_TEXT = 'Чаты не удаётся сохранить в аккаунте (нет доступа к хранилищу). Они остаются только в этом браузере.';
    function setSync(state) {
      syncState = state;
      renderSyncNote();
      if (state === 'error') showBanner(SYNC_ERR_TEXT, 'warn', true);
    }
    function onSyncError(err) {
      if (typeof console !== 'undefined') console.warn('[ai-agent] sync error:', err && (err.code || err.message));
      setSync('error');
      if (migrateOld()) { renderAll(); scrollBottom(true); }
    }

    // Запись чата в аккаунт. dirty = «ещё не подтверждено» — по нему после сбоя или
    // перезагрузки понятно, что чат нужно отправить повторно.
    function pushChat(c) {
      if (!uid) return;
      c.dirty = true;
      localWrite();
      if (!col || syncState === 'error' || syncState === 'off') return;
      const stamp = c.updatedAt;
      col.doc(c.id).set({
        title: c.title, topicId: c.topicId || null, messages: cleanMessages(c.messages), createdAt: c.createdAt, updatedAt: c.updatedAt,
      }).then(() => {
        if (c.updatedAt === stamp && c.dirty) { c.dirty = false; localWrite(); }
      }).catch(onSyncError);
    }

    function stopSync() {
      if (unsub) { try { unsub(); } catch (e) {} }
      unsub = null; col = null;
    }
    function startSync() {
      stopSync();
      if (!(window.firebase && firebase.firestore)) { setSync('off'); if (migrateOld()) { renderAll(); scrollBottom(true); } return; }
      try {
        col = firebase.firestore().collection('aiChats').doc(uid).collection('chats');
        syncState = 'connecting'; renderSyncNote();
        unsub = col.orderBy('updatedAt', 'desc').limit(maxChats + 10).onSnapshot(onSnapshot, onSyncError);
      } catch (e) { onSyncError(e); }
    }

    function onSnapshot(snap) {
      if (syncState !== 'ok') {
        syncState = 'ok';
        if (!el.banner.hidden && el.banner.textContent === SYNC_ERR_TEXT) restoreBanner();
      }
      const remote = new Map();
      const pending = new Set();
      snap.docs.forEach(d => {
        if (d.metadata && d.metadata.hasPendingWrites) { pending.add(d.id); return; }
        remote.set(d.id, fromData(d.id, d.data()));
      });
      let activeTouched = false;

      remote.forEach((rc, id) => {
        const lc = chats.get(id);
        if (lc && (lc.busy || pending.has(id))) return;
        if (lc && lc.dirty) {
          // Локальная версия новее аккаунтной — отправляем. Такая же — значит, запись уже
          // подтверждена (снимок мог прийти раньше, чем сработал .then у set): повторно не шлём,
          // иначе каждый снимок порождал бы новую запись.
          if (lc.updatedAt > rc.updatedAt) { pushChat(lc); return; }
          if (lc.updatedAt === rc.updatedAt) { lc.dirty = false; return; }
        }
        if (!lc || lc.updatedAt < rc.updatedAt) {
          chats.set(id, rc);
          if (id === activeId) activeTouched = true;
        }
      });
      // Есть у нас, но нет в аккаунте: не отправленный ещё чат — отправляем, иначе его удалили с другого устройства.
      [...chats.values()].forEach(lc => {
        if (remote.has(lc.id) || pending.has(lc.id) || !lc.messages.length || lc.busy) return;
        if (lc.dirty) { pushChat(lc); return; }
        chats.delete(lc.id);
        if (lc.id === activeId) { activeId = null; activeTouched = true; }
      });

      if (migrateOld()) activeTouched = true;
      // Открыли страницу на устройстве, где чатов ещё не знали, а в аккаунте они есть: вместо
      // пустого чата открываем последний из тех, что были (пустой остаётся, только если человек
      // уже успел в нём что-то сделать).
      if (autoDraftId && activeId === autoDraftId) {
        const dr = chats.get(autoDraftId);
        const filled = [...chats.values()].filter(c => c.messages.length).sort(byUpdated);
        if (dr && !dr.messages.length && !dr.topicId && !el.input.value && filled.length) {
          chats.delete(autoDraftId);
          let pref = null;
          try { pref = localStorage.getItem(lsActive(uid)); } catch (e) {}
          activeId = (pref && chats.has(pref)) ? pref : filled[0].id;
          activeTouched = true;
        }
      }
      autoDraftId = null;
      localWrite();
      ensureActive();
      renderSidebar();
      renderTop();
      if (activeTouched) { renderLog(); scrollBottom(true); }
      updateChrome();
      applyUrlTopic();
    }

    // Прежняя версия хранила один диалог в браузере — переносим его в первый чат.
    function migrateOld() {
      if (migrated || !uid) return false;
      migrated = true;
      let old = null;
      try { old = JSON.parse(localStorage.getItem(LS_OLD) || 'null'); } catch (e) {}
      if (!old || !Array.isArray(old.messages) || ![...chats.values()].every(c => !c.messages.length)) return false;
      const msgs = cleanMessages(old.messages);
      if (!msgs.length) { try { localStorage.removeItem(LS_OLD); } catch (e) {} return false; }
      const c = [...chats.values()].find(x => !x.messages.length) || makeChat();
      c.messages = msgs; c.topicId = typeof old.topicId === 'string' ? old.topicId : null;
      c.title = deriveTitle((msgs.find(m => m.role === 'user') || {}).content);
      c.updatedAt = Date.now();
      chats.set(c.id, c);
      activeId = c.id;
      pushChat(c);
      try { localStorage.removeItem(LS_OLD); } catch (e) {}
      return true;      // показанный чат изменился — нужно перерисовать ленту
    }

    /* ==================================================================
       УПРАВЛЕНИЕ ЧАТАМИ
       ================================================================== */
    function ensureActive() {
      if (!uid) return;
      if (chats.has(activeId)) return;
      const best = [...chats.values()].filter(c => c.messages.length).sort(byUpdated)[0];
      if (best) { activeId = best.id; return; }
      const empty = [...chats.values()].find(c => !c.messages.length) || makeChat();
      chats.set(empty.id, empty);
      activeId = empty.id;
      autoDraftId = empty.id;
    }

    function openChat(id) {
      if (!chats.has(id)) return;
      activeId = id;
      try { localStorage.setItem(lsActive(uid), id); } catch (e) {}
      closeDrawer(); closePicker();
      renderAll(); scrollBottom(true);
      if (!(window.matchMedia && matchMedia('(max-width:820px)').matches)) el.input.focus();
    }

    function newChat() {
      if (!uid) { if (window.openAuthModal) window.openAuthModal(); return null; }
      let c = [...chats.values()].find(x => !x.messages.length);
      if (!c) { c = makeChat(); chats.set(c.id, c); }
      openChat(c.id);
      return c;
    }

    function removeChat(id) {
      const c = chats.get(id);
      if (!c) return;
      const ctl = runs.get(id);
      if (ctl) ctl.abort();
      chats.delete(id);
      if (c.messages.length) {
        localWrite();
        if (col && syncState !== 'error' && syncState !== 'off') col.doc(id).delete().catch(onSyncError);
      }
      if (activeId === id) activeId = null;
      ensureActive();
      renderAll(); scrollBottom(true);
    }

    // Не больше MAX_CHATS: сверх лимита уходят самые старые (кроме идущего и открытого).
    function pruneOld() {
      const list = [...chats.values()].filter(c => c.messages.length).sort(byUpdated);
      let dropped = 0;
      for (let i = list.length - 1; i >= 0 && list.length - dropped > maxChats; i--) {
        const c = list[i];
        if (c.id === activeId || c.busy) continue;
        chats.delete(c.id); dropped++;
        if (col && syncState !== 'error' && syncState !== 'off') col.doc(c.id).delete().catch(onSyncError);
      }
      if (dropped) showBanner('Достигнут лимит в ' + maxChats + ' чатов — самые старые удалены (' + dropped + ').', 'info');
    }

    /* ==================================================================
       ОТРИСОВКА
       ================================================================== */
    function scrollBottom(force) {
      const s = el.scroll;
      if (force || s.scrollHeight - s.scrollTop - s.clientHeight < 160) s.scrollTop = s.scrollHeight;
    }

    function renderSyncNote() {
      const map = {
        ok: ['Чаты сохранены в вашем аккаунте и доступны на других устройствах.', false],
        connecting: ['Подключаем аккаунт…', false],
        error: ['Хранилище аккаунта недоступно — чаты только в этом браузере.', true],
        off: ['Чаты хранятся только в этом браузере.', true],
      };
      const [text, isErr] = uid ? map[syncState] : ['Войдите, чтобы чаты сохранялись в аккаунте.', false];
      el.sync.textContent = text;
      el.sync.classList.toggle('err', !!isErr);
    }

    function renderSidebar() {
      el.chatList.innerHTML = '';
      if (!uid) {
        const li = document.createElement('li'); li.className = 'chats-hint';
        li.textContent = 'После входа здесь появятся ваши чаты.';
        el.chatList.appendChild(li);
        renderSyncNote();
        return;
      }
      const list = [...chats.values()].sort((a, b) => ((a.messages.length ? 1 : 0) - (b.messages.length ? 1 : 0)) || byUpdated(a, b));
      list.forEach(c => {
        const li = document.createElement('li');
        li.className = 'chat-item' + (c.id === activeId ? ' on' : '');
        li.tabIndex = 0; li.setAttribute('role', 'button'); li.dataset.id = c.id;
        const main = document.createElement('div'); main.className = 'ci-main';
        const t = document.createElement('div'); t.className = 'ci-title' + (c.title || c.messages.length ? '' : ' empty');
        t.textContent = c.title || (c.messages.length ? deriveTitle((c.messages.find(m => m.role === 'user') || {}).content) : 'Новый чат');
        const meta = document.createElement('div'); meta.className = 'ci-meta';
        if (c.busy) { const dot = document.createElement('span'); dot.className = 'ci-dot'; meta.appendChild(dot); meta.appendChild(document.createTextNode('отвечает…')); }
        else if (c.messages.length) meta.textContent = fmtWhen(c.updatedAt);
        main.append(t, meta);
        li.appendChild(main);
        const del = document.createElement('button'); del.type = 'button'; del.className = 'ci-del'; del.title = 'Удалить чат'; del.setAttribute('aria-label', 'Удалить чат');
        del.innerHTML = ICON.trash;
        del.addEventListener('click', e => {
          e.stopPropagation();
          if (!c.messages.length || confirm('Удалить чат «' + (t.textContent || 'Новый чат') + '»?')) removeChat(c.id);
        });
        li.appendChild(del);
        li.addEventListener('click', () => openChat(c.id));
        li.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === li) { e.preventDefault(); openChat(c.id); } });
        el.chatList.appendChild(li);
      });
      renderSyncNote();
    }

    function renderTop() {
      const c = cur();
      if (document.activeElement !== el.title) el.title.value = c ? c.title : '';
      el.title.disabled = !uid || !c;
      const topic = c && c.topicId && topicsById.get(c.topicId);
      if (topic) {
        el.ctx.hidden = false;
        el.ctx.innerHTML = '';
        const label = document.createElement('span'); label.textContent = 'Тема: ' + topic.title; label.title = topic.title;
        const x = document.createElement('button'); x.type = 'button'; x.title = 'Убрать тему'; x.setAttribute('aria-label', 'Убрать тему'); x.textContent = '×';
        x.addEventListener('click', () => setTopic(null));
        el.ctx.append(label, x);
      } else {
        el.ctx.hidden = true;
      }
      el.pick.textContent = topic ? 'Сменить тему' : 'Выбрать тему';
    }

    const SUGGESTIONS = [
      'Объясни теорему Пифагора простыми словами',
      'Как решать квадратные уравнения? Покажи на примере',
      'В чём разница между производной и дифференциалом?',
      'Найди площадь треугольника со сторонами 13, 14 и 15',
    ];

    function buildMessage(c, m, isLast) {
      const wrap = document.createElement('div');
      wrap.className = 'msg msg-' + m.role;
      const body = document.createElement('div');
      body.className = 'msg-body';
      if (m.role === 'user') {
        body.textContent = m.content;
      } else {
        const md = document.createElement('div');
        md.className = 'md';
        md.innerHTML = m.content ? mdToHtml(m.content) : '';
        body.appendChild(md);
        if (c.busy && isLast && !m.content) {
          const dots = document.createElement('div'); dots.className = 'typing';
          dots.innerHTML = '<span></span><span></span><span></span>';
          body.appendChild(dots);
        }
        if (m.error) {
          const err = document.createElement('div'); err.className = 'msg-err'; err.textContent = m.error;
          body.appendChild(err);
        }
        // Под ответом — только те темы справочника, на которые он реально сослался,
        // и выбранная пользователем. «Из справочника» должно означать, что ответ на это опирался.
        const shown = (m.sources || []).filter(s => s.focus || (m.content && m.content.indexOf('/spravochnik/#' + s.id) !== -1));
        if (shown.length && m.content) {
          const src = document.createElement('div'); src.className = 'msg-src';
          src.appendChild(Object.assign(document.createElement('span'), { textContent: 'Из справочника:' }));
          shown.forEach(s => {
            const a = document.createElement('a');
            a.href = '/spravochnik/#' + encodeURIComponent(s.id); a.textContent = s.title; a.className = 'src-chip';
            src.appendChild(a);
          });
          body.appendChild(src);
        }
        if (!c.busy || !isLast) {
          const acts = document.createElement('div'); acts.className = 'msg-acts';
          if (m.content) {
            const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'act'; cp.innerHTML = ICON.copy + '<span>Копировать</span>';
            cp.addEventListener('click', () => {
              (navigator.clipboard ? navigator.clipboard.writeText(m.content) : Promise.reject()).then(() => {
                cp.querySelector('span').textContent = 'Скопировано';
                setTimeout(() => { cp.querySelector('span').textContent = 'Копировать'; }, 1500);
              }).catch(() => {});
            });
            acts.appendChild(cp);
          }
          if (isLast) {
            const r = document.createElement('button'); r.type = 'button'; r.className = 'act'; r.innerHTML = ICON.redo + '<span>Ещё раз</span>';
            r.addEventListener('click', regenerate);
            acts.appendChild(r);
          }
          if (acts.children.length) body.appendChild(acts);
        }
      }
      wrap.appendChild(body);
      return wrap;
    }

    function renderLog() {
      const c = cur();
      el.log.innerHTML = '';
      if (!c || !c.messages.length) {
        const empty = document.createElement('div'); empty.className = 'agent-empty';
        empty.innerHTML = '<h2>AI‑агент MathFrame</h2><p>Помощник по математике, который знает справочник: подбирает нужные темы и опирается на их описания, ' +
          'при необходимости ищет сведения в интернете и записывает формулы. Выберите тему вверху, чтобы задать вопрос в её контексте, ' +
          'или просто спросите.</p>';
        const chips = document.createElement('div'); chips.className = 'suggest';
        SUGGESTIONS.forEach(t => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'suggest-chip'; b.textContent = t;
          b.addEventListener('click', () => submit(t));
          chips.appendChild(b);
        });
        empty.appendChild(chips);
        el.log.appendChild(empty);
      } else {
        c.messages.forEach((m, i) => el.log.appendChild(buildMessage(c, m, i === c.messages.length - 1)));
        hydrateMath(el.log);
      }
    }

    // Во время ответа перерисовываем только последнее сообщение, и не чаще раза за кадр.
    let raf = 0;
    function renderStreaming(c) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (cur() !== c) return;
        const last = el.log.lastElementChild;
        const m = c.messages[c.messages.length - 1];
        if (!last || !m) return;
        const near = el.scroll.scrollHeight - el.scroll.scrollTop - el.scroll.clientHeight < 160;
        last.replaceWith(buildMessage(c, m, true));
        hydrateMath(el.log.lastElementChild);
        if (near) el.scroll.scrollTop = el.scroll.scrollHeight;
      });
    }

    function updateChrome() {
      const c = cur();
      const busy = !!(c && c.busy);
      const canWrite = !!uid && configured && !!c;
      el.input.disabled = !canWrite;
      el.send.disabled = !canWrite || busy;
      el.send.hidden = busy;
      el.stop.hidden = !busy;
      el.login.hidden = !!uid || !configured;
      el.newBtn.disabled = !uid;
      el.input.placeholder = !configured ? 'AI‑агент пока недоступен'
        : (!uid ? 'Войдите, чтобы задать вопрос' : 'Спросите что угодно о математике…');
    }

    // Баннер бывает постоянным (хранилище недоступно, агент не настроен — пока причина есть) и
    // временным (лимит чатов, истёкший вход) — временный сам гаснет и не затирает постоянный.
    const NOT_CONF_TEXT = 'AI‑агент пока не настроен: администратору нужно задать ключ нейросети в настройках сайта.';
    let bannerTimer = null;
    function showBanner(text, kind, sticky) {
      clearTimeout(bannerTimer); bannerTimer = null;
      if (!text) { el.banner.hidden = true; return; }
      el.banner.hidden = false;
      el.banner.className = 'agent-banner ' + (kind || 'info');
      el.banner.textContent = text;
      if (!sticky) bannerTimer = setTimeout(restoreBanner, 9000);
    }
    function restoreBanner() {
      if (syncState === 'error') showBanner(SYNC_ERR_TEXT, 'warn', true);
      else if (!configured) showBanner(NOT_CONF_TEXT, 'warn', true);
      else showBanner('');
    }

    function renderAll() { renderSidebar(); renderTop(); renderLog(); updateChrome(); }

    /* ==================================================================
       РОЛЬ: обычный пользователь / администратор / главный администратор
       ================================================================== */
    function applyRole(info) {
      info = info || {};
      role = info.role === 'owner' || info.role === 'admin' ? info.role : 'user';
      assistant = info.assistant === 'jarvis' ? 'jarvis' : 'mistral';
      unlimited = role !== 'user';
      const nextMax = unlimited ? ADMIN_MAX_CHATS : USER_MAX_CHATS;
      const changed = nextMax !== maxChats;
      maxChats = nextMax;
      el.input.maxLength = unlimited ? 30000 : 4000;
      // Владельцу отвечает Джарвис и без ключа модели — для него «настроено», даже если для всех остальных нет.
      const nowConfigured = baseConfigured || info.configured === true;
      if (nowConfigured !== configured) { configured = nowConfigured; restoreBanner(); updateChrome(); }
      if (unlimited) {
        el.badge.hidden = false;
        el.badge.textContent = assistant === 'jarvis' ? 'Джарвис' : 'Админ · без ограничений';
        el.badge.title = assistant === 'jarvis'
          ? 'Вам отвечает Джарвис, без ограничений. Ваши сообщения попадают в его общий разговор с вами.'
          : 'Режим администратора: без лимитов на запросы, длину и темы вопросов.';
      } else {
        el.badge.hidden = true;
      }
      updateChrome();
      if (changed && uid) startSync();      // подписка на чаты зависит от лимита
    }
    // Роль определяет сервер (по токену входа) — страница только показывает и не навязывает.
    function loadRole(u) {
      const forUid = u.uid;
      u.getIdToken().then(t => fetch('/api/chat', { headers: { authorization: 'Bearer ' + t }, cache: 'no-store' }))
        .then(r => (r.ok ? r.json() : null))
        .then(d => { if (d && uid === forUid) applyRole(d); })
        .catch(() => {});
    }

    /* ==================================================================
       ТЕМА СПРАВОЧНИКА
       ================================================================== */
    function setTopic(id) {
      const c = cur();
      if (!c) return;
      c.topicId = id || null;
      if (uid && c.messages.length) { c.updatedAt = Date.now(); pushChat(c); }
      renderTop(); renderSidebar();
    }

    function applyUrlTopic() {
      if (!urlTopic || !topicsById.size) return;
      const id = urlTopic;
      if (!topicsById.has(id)) { urlTopic = null; return; }
      if (uid && syncState === 'connecting' && !migrated) return;   // дождёмся загрузки чатов
      urlTopic = null;
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      const c = uid ? newChat() : anon;
      if (c) { c.topicId = id; renderTop(); }
    }

    function topicContext(t, full) {
      let text = htmlToText(t.description || '');
      text = text.slice(0, full ? 3000 : 1500);
      if (full) {
        const parent = t.parent && topicsById.get(t.parent);
        const kids = (childrenOf.get(t.id) || []).slice(0, 15).map(k => k.title);
        const rel = [];
        if (parent) rel.push('Родительская тема: ' + parent.title + '.');
        if (kids.length) rel.push('Дочерние темы: ' + kids.join(', ') + '.');
        if (rel.length) text = (text ? text + '\n\n' : '') + rel.join(' ');
      }
      return { id: t.id, title: t.title || t.id, type: t.type || 'topic', text };
    }

    function buildContext(question, chat) {
      const out = [];
      const focus = chat.topicId && topicsById.get(chat.topicId);
      if (focus) out.push(topicContext(focus, true));
      if (index) {
        // (в этот момент последняя реплика — сам вопрос, ответа ещё нет)
        const prevUser = chat.messages.slice(0, -1).reverse().find(m => m.role === 'user');
        // Короткий уточняющий вопрос («а для куба?») ищем вместе с предыдущим — иначе искать нечего.
        const query = question + (question.length < 50 && prevUser ? ' ' + prevUser.content : '');
        retrieve(index, query, { k: 4, exclude: new Set(focus ? [focus.id] : []) }).forEach(r => {
          const t = topicsById.get(r.id);
          if (t) out.push(topicContext(t, false));
        });
      }
      return out;
    }

    /* ==================================================================
       ОТПРАВКА
       ================================================================== */
    async function run(chat) {
      // chat.messages заканчивается репликой пользователя, на которую нужен ответ
      const question = chat.messages[chat.messages.length - 1].content;
      const ctx = buildContext(question, chat);
      const msg = { role: 'assistant', content: '', sources: ctx.filter(c => c.text || c.id === chat.topicId).map(c => ({ id: c.id, title: c.title, focus: c.id === chat.topicId })) };
      chat.messages.push(msg);
      chat.busy = true;
      const controller = new AbortController();
      runs.set(chat.id, controller);
      renderSidebar(); updateChrome();
      if (cur() === chat) { renderLog(); scrollBottom(true); }
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
          body: JSON.stringify({
            messages: buildPayloadMessages(chat.messages.slice(0, -1), unlimited ? 60 : 12),
            context: ctx,
            focusId: chat.topicId || undefined,
          }),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => null);
          const err = new Error(friendlyError(resp.status, data));
          err.status = resp.status;
          throw err;
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          msg.content = applyResetMark(msg.content + decoder.decode(value, { stream: true }));
          if (cur() === chat) renderStreaming(chat);
        }
        msg.content = applyResetMark(msg.content + decoder.decode()).trim();
        if (!msg.content) msg.error = 'Пустой ответ. Попробуйте ещё раз.';
      } catch (e) {
        if (e && e.name === 'AbortError') {
          // «Стоп» (или чат удалён): оставляем то, что успело прийти
          if (!msg.content) chat.messages.pop();
        } else {
          msg.error = (e && e.message) || 'Не удалось получить ответ.';
          if (e && e.status === 401) showBanner('Сессия входа истекла — войдите снова.', 'warn');
        }
      } finally {
        chat.busy = false; runs.delete(chat.id);
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (chats.has(chat.id)) { chat.updatedAt = Date.now(); pushChat(chat); }
        renderSidebar(); updateChrome();
        if (cur() === chat) { renderLog(); scrollBottom(false); }
      }
    }

    function submit(text) {
      text = String(text || '').trim();
      if (!text || !configured) return;
      if (!uid) { if (window.openAuthModal) window.openAuthModal(); return; }
      const c = cur();
      if (!c || c.busy) return;
      restoreBanner();      // старое временное сообщение больше не нужно
      c.messages.push({ role: 'user', content: text });
      if (!c.title) c.title = deriveTitle(text);
      c.updatedAt = Date.now();
      pruneOld();
      pushChat(c);          // вопрос сохраняется сразу, не дожидаясь ответа
      el.input.value = ''; autosize();
      renderTop();
      run(c);
    }

    function regenerate() {
      const c = cur();
      if (!c || c.busy || !uid) return;
      // Убираем последний ответ (и всё после последней реплики пользователя) и спрашиваем заново.
      while (c.messages.length && c.messages[c.messages.length - 1].role !== 'user') c.messages.pop();
      if (!c.messages.length) { renderLog(); return; }
      run(c);
    }

    /* ==================================================================
       ВЫБОР ТЕМЫ · ПАНЕЛЬ ЧАТОВ · СОБЫТИЯ
       ================================================================== */
    function renderPicker() {
      el.pickList.innerHTML = '';
      const q = el.pickInput.value;
      if (!index) { el.pickList.innerHTML = '<li class="pick-empty">Справочник ещё загружается…</li>'; return; }
      const found = q.trim() ? searchTitles(index, q, 8) : [];
      if (!found.length) {
        el.pickList.innerHTML = '<li class="pick-empty">' + (q.trim() ? 'Ничего не найдено' : 'Начните вводить название темы') + '</li>';
        return;
      }
      found.forEach(f => {
        const li = document.createElement('li');
        const b = document.createElement('button'); b.type = 'button'; b.textContent = f.title;
        b.addEventListener('click', () => {
          setTopic(f.id); closePicker(); el.pickInput.value = '';
          el.input.focus();
        });
        li.appendChild(b); el.pickList.appendChild(li);
      });
    }
    function openPicker() {
      el.picker.hidden = false; el.pick.setAttribute('aria-expanded', 'true');
      renderPicker(); el.pickInput.focus();
    }
    function closePicker() { el.picker.hidden = true; el.pick.setAttribute('aria-expanded', 'false'); }
    function openDrawer() { el.card.classList.add('drawer-open'); el.scrim.hidden = false; }
    function closeDrawer() { el.card.classList.remove('drawer-open'); el.scrim.hidden = true; }

    function autosize() {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 180) + 'px';
    }

    el.form.addEventListener('submit', e => { e.preventDefault(); submit(el.input.value); });
    el.input.addEventListener('input', autosize);
    el.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(el.input.value); }
    });
    el.stop.addEventListener('click', () => { const c = cur(); const ctl = c && runs.get(c.id); if (ctl) ctl.abort(); });
    el.newBtn.addEventListener('click', () => { newChat(); });
    el.menu.addEventListener('click', () => (el.card.classList.contains('drawer-open') ? closeDrawer() : openDrawer()));
    el.scrim.addEventListener('click', closeDrawer);
    el.pick.addEventListener('click', () => (el.picker.hidden ? openPicker() : closePicker()));
    el.pickInput.addEventListener('input', renderPicker);
    el.title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.title.blur(); } });
    el.title.addEventListener('change', () => {
      const c = cur();
      if (!c || !uid) return;
      c.title = el.title.value.trim().slice(0, 80) || (c.messages.length ? deriveTitle((c.messages.find(m => m.role === 'user') || {}).content) : '');
      el.title.value = c.title;
      if (c.messages.length) { c.updatedAt = Date.now(); pushChat(c); }
      renderSidebar();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePicker(); closeDrawer(); } });
    document.addEventListener('click', e => {
      if (el.picker.hidden) return;
      if (el.picker.contains(e.target) || el.pick.contains(e.target)) return;
      closePicker();
    });
    el.loginBtn.addEventListener('click', () => { if (window.openAuthModal) window.openAuthModal(); });

    /* ==================================================================
       ЗАПУСК
       ================================================================== */
    function onUser(u) {
      const nextUid = u ? u.uid : null;
      if (nextUid === uid) { user = u; return; }   // тот же пользователь (обновление токена и т.п.) — ничего не меняем
      stopSync();
      user = u; uid = nextUid;
      chats = new Map(); activeId = null; migrated = false;
      applyRole(null);            // пока сервер не ответил (и после выхода) — как у обычного пользователя
      if (uid) {
        localRead().forEach(c => chats.set(c.id, c));
        try { const a = localStorage.getItem(lsActive(uid)); if (a && chats.has(a)) activeId = a; } catch (e) {}
        const carried = anon.topicId; anon = makeChat();
        ensureActive();
        if (carried) { const c = [...chats.values()].find(x => !x.messages.length); if (c) c.topicId = carried; }
        renderAll(); scrollBottom(true);
        startSync();
        loadRole(u);
      } else {
        restoreBanner();
        renderAll();
      }
    }

    renderAll();
    if (window.Auth) window.Auth.onAuthChange(onUser);
    else document.addEventListener('authReady', () => window.Auth.onAuthChange(onUser));

    fetch('/api/chat', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.configured === false) {
        configured = false; baseConfigured = false;
        showBanner(NOT_CONF_TEXT, 'warn', true);
        updateChrome();
      }
    }).catch(() => {});

    fetch('/data/topics/config.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(list => {
      if (!Array.isArray(list)) return;
      topicsById = new Map(); childrenOf = new Map();
      list.forEach(t => { if (t && t.id) topicsById.set(t.id, t); });
      list.forEach(t => { if (t && t.parent) { if (!childrenOf.has(t.parent)) childrenOf.set(t.parent, []); childrenOf.get(t.parent).push(t); } });
      index = buildIndex(list);
      // Тема, которой больше нет в справочнике, из чата убирается
      chats.forEach(c => { if (c.topicId && !topicsById.has(c.topicId)) c.topicId = null; });
      if (anon.topicId && !topicsById.has(anon.topicId)) anon.topicId = null;
      renderTop(); renderSidebar();
      if (!el.picker.hidden) renderPicker();
      applyUrlTopic();
    }).catch(() => {
      // Без справочника агент работает как обычный чат — это не ошибка для пользователя.
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage);
    else initPage();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { stems, htmlToText, buildIndex, retrieve, searchTitles, mdToHtml, buildPayloadMessages, friendlyError, escapeHtml, deriveTitle, fmtWhen, cleanMessages, applyResetMark, RESET_MARK };
  }
})();
