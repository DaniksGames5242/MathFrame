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

    // Язык блока (```python) — в data-lang: подпись рисует CSS, без лишних текстовых узлов.
    s = s.replace(/```([^\n]*)\n([\s\S]*?)(```|$)/g, (m, lang, code) => {
      const l = String(lang || '').trim().split(/\s+/)[0].replace(/[^\w+#.\-]/g, '').slice(0, 20);
      return hold('<pre data-lang="' + escapeHtml(l) + '"><code>' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>');
    });
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

    // Таблица GFM: строка с «|», за ней — строка-разделитель |---|:---:|.
    const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
    const cells = row => {
      let r = row.trim();
      if (r.startsWith('|')) r = r.slice(1);
      if (r.endsWith('|')) r = r.slice(0, -1);
      return r.split('|').map(x => x.trim());
    };
    const lines = s.split('\n');
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      let m;
      if (!line.trim()) { flushAll(); continue; }
      if (line.indexOf('|') !== -1 && li + 1 < lines.length && lines[li + 1].indexOf('-') !== -1 && TABLE_SEP.test(lines[li + 1]) && lines[li + 1].indexOf('|') !== -1) {
        flushAll();
        const head = cells(line);
        const align = cells(lines[li + 1]).map(c => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : ''));
        const td = (tag, c, i) => '<' + tag + (align[i] ? ' style="text-align:' + align[i] + '"' : '') + '>' + inline(c) + '</' + tag + '>';
        let t = '<div class="md-table"><table><thead><tr>' + head.map((c, i) => td('th', c, i)).join('') + '</tr></thead><tbody>';
        li += 2;
        while (li < lines.length && lines[li].trim() && lines[li].indexOf('|') !== -1) {
          const row = cells(lines[li]);
          t += '<tr>' + head.map((x, i) => td('td', row[i] || '', i)).join('') + '</tr>';
          li++;
        }
        li--;
        html += t + '</tbody></table></div>';
        continue;
      }
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

  // Группа в списке чатов по дате последнего изменения (как в ChatGPT / Claude).
  const DAY_GROUPS = ['Сегодня', 'Вчера', 'Последние 7 дней', 'Последние 30 дней', 'Ранее'];
  function dayGroup(ts, now) {
    if (!ts) return 0;
    const d = new Date(ts), n = new Date(now || Date.now());
    const day = x => Math.floor((x.getTime() - x.getTimezoneOffset() * 60000) / 86400000);
    const diff = day(n) - day(d);
    if (diff <= 0) return 0;
    if (diff === 1) return 1;
    if (diff < 7) return 2;
    if (diff < 30) return 3;
    return 4;
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
      collapse: $('agentCollapse'), newTop: $('agentNewTop'),
    };
    let stuck = true;   // лента «прилипла» к низу — см. scrollBottom()

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
    let webSearch = false;                 // сервер умеет искать в интернете (для подписи «думает»)
    let modelId = null;                    // выбранная модель (id уровня: small | medium | large)

    /* ---- движение ----
       Лента и список чатов перерисовываются целиком, поэтому «новизна» хранится не в DOM, а
       при самих объектах: когда что-то впервые показано. Возраст уходит в --mfa-age, и CSS
       продолжает анимацию с того же места, а не запускает её на каждой перерисовке. */
    const motionOff = () => (window.MathFrameUI && window.MathFrameUI.motionOff ? window.MathFrameUI.motionOff()
      : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches));
    const now = () => performance.now();
    const seen = new WeakMap();
    const markOld = obj => seen.set(obj, { old: true });
    function ageOf(obj, key) {
      let r = seen.get(obj);
      if (!r) seen.set(obj, r = {});
      if (r.old) return Infinity;
      if (!(key in r)) r[key] = now();
      return now() - r[key];
    }
    // Класс анимации — только если с первого показа прошло меньше win мс.
    function fresh(node, obj, key, cls, win) {
      const age = ageOf(obj, key);
      if (age >= win || motionOff()) return;
      node.classList.add(cls);
      node.style.setProperty('--mfa-age', Math.round(age) + 'ms');
    }
    function replay(node, cls) {
      if (motionOff()) return;
      node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
    }

    // Хвост потока: символы, пришедшие за последние TOK_MS, проявляются. Отрезки помнятся в
    // координатах видимого текста и на каждой перерисовке оборачиваются заново с отрицательной
    // задержкой — поэтому не мигают, хотя разметка ответа каждый раз строится с нуля.
    const TOK_MS = 360;
    const tails = new WeakMap();
    function textNodes(root) {
      const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
      return out;
    }
    function fadeTail(md, m) {
      if (!md || motionOff()) return;
      // один обход за кадр: узлы с их смещениями
      let total = 0;
      const list = textNodes(md).map(n => { const a = total; total += n.data.length; return { n, a }; });
      const t = now();
      let st = tails.get(m);
      if (!st) tails.set(m, st = { len: 0, marks: [] });
      if (total > st.len) st.marks.push({ from: st.len, to: total, t });
      st.len = total;
      st.marks = st.marks.filter(k => t - k.t < TOK_MS && k.from < total);
      // с конца: splitText оставляет в узле начало, поэтому смещения более ранних кусков не меняются
      st.marks.slice().sort((x, y) => y.from - x.from).forEach(k => {
        for (let j = list.length - 1; j >= 0; j--) {
          const n = list[j].n, a = list[j].a, b = a + n.data.length;
          if (b <= k.from) break;
          const s = Math.max(a, k.from), e = Math.min(b, k.to);
          if (e <= s || !n.data.slice(s - a, e - a).trim()) continue;
          let mid = n;
          if (s > a) mid = mid.splitText(s - a);
          if (e < b) mid.splitText(e - s);
          const span = document.createElement('span');
          span.className = 'mfa-tok';
          span.style.animationDelay = -Math.round(t - k.t) + 'ms';
          mid.parentNode.insertBefore(span, mid);
          span.appendChild(mid);
        }
      });
    }

    // Курсор — в конец последнего текстового блока ответа.
    function appendCaret(md) {
      let t = md.lastElementChild;
      while (t && /^(UL|OL|BLOCKQUOTE)$/.test(t.tagName) && t.lastElementChild) t = t.lastElementChild;
      if (t && t.tagName === 'PRE') t = t.querySelector('code') || t;
      if (t && /^(HR|BR|IMG)$/.test(t.tagName)) t = md;
      if (!t || t.classList.contains('mfa-math')) t = md;
      const caret = document.createElement('span');
      caret.className = 'mfa-caret'; caret.setAttribute('aria-hidden', 'true');
      t.appendChild(caret);
    }

    // Индикатор «думает»: самописец + подпись. Подпись честная: справочник — только если
    // темы действительно ушли с вопросом, интернет — только если сервер умеет искать.
    const WAVE_D = (() => {
      let d = '';
      for (let x = 0; x <= 60; x++) d += (x ? 'L' : 'M') + x + ' ' + (8 - 4.5 * Math.sin(2 * Math.PI * x / 16)).toFixed(2);
      return d;
    })();
    function typingEl(m) {
      const box = document.createElement('div'); box.className = 'typing';
      box.innerHTML = '<span class="tp-plot" aria-hidden="true"><span class="tp-trace"><svg viewBox="0 0 60 16"><path d="' +
        WAVE_D + '"/></svg></span><i class="tp-pen"></i></span><span class="tp-label"></span>';
      const label = box.querySelector('.tp-label');
      const steps = [[0, 'Думает…']];
      if ((m.sources || []).length) steps.push([1400, 'Сверяется со справочником…']);
      steps.push([4200, webSearch ? 'Ищет источники…' : 'Формулирует ответ…']);
      const age = ageOf(m, 'in');
      let i = 0;
      while (i + 1 < steps.length && steps[i + 1][0] <= age) i++;
      label.textContent = steps[i][1];
      steps.slice(i + 1).forEach(([at, text]) => setTimeout(() => {
        if (!box.isConnected) return;
        label.textContent = text;
        replay(label, 'mfa-lbl');
      }, at - age));
      return box;
    }

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
      pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
      // аватар агента: ось, кривая и точка касания — тот же мотив, что у эмблемы пустого чата
      agent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19h18"/><path d="M5 17C9 17 10 6 19 5"/><circle cx="11.2" cy="11.6" r="1.6" fill="currentColor" stroke="none"/></svg>',
    };

    // Кнопка «копировать» на блоках кода (только у готового ответа — во время потока
    // разметка перестраивается каждый кадр). В кнопке нет текста — подпись даёт CSS.
    // Кнопка-иконка «копировать» под сообщением: после копирования на секунду — галочка.
    function copyBtn(getText, label) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'act'; b.title = label; b.setAttribute('aria-label', label);
      b.innerHTML = ICON.copy;
      b.addEventListener('click', () => {
        (navigator.clipboard ? navigator.clipboard.writeText(getText()) : Promise.reject()).then(() => {
          b.classList.add('done'); b.innerHTML = ICON.check; b.setAttribute('aria-label', 'Скопировано'); b.title = 'Скопировано';
          setTimeout(() => { b.classList.remove('done'); b.innerHTML = ICON.copy; b.setAttribute('aria-label', label); b.title = label; }, 1500);
        }).catch(() => {});
      });
      return b;
    }

    function decorateCode(md) {
      md.querySelectorAll('pre').forEach(pre => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'code-copy'; b.title = 'Копировать код'; b.setAttribute('aria-label', 'Копировать код');
        b.innerHTML = ICON.copy;
        b.addEventListener('click', () => {
          const code = pre.querySelector('code');
          (navigator.clipboard ? navigator.clipboard.writeText(code ? code.textContent : pre.textContent) : Promise.reject()).then(() => {
            b.classList.add('done');
            setTimeout(() => b.classList.remove('done'), 1500);
          }).catch(() => {});
        });
        pre.appendChild(b);
      });
    }

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
      if (force || s.scrollHeight - s.scrollTop - s.clientHeight < 160) {
        s.scrollTop = s.scrollHeight;
        stuck = true;
      }
    }

    // «Прилипание» к низу ленты. KaTeX, шрифты и картинки догружаются ПОСЛЕ
    // renderLog()/scrollBottom(true) и увеличивают высоту — без этого длинный
    // чат открывался не на последнем сообщении. Пока пользователь сам не ушёл
    // вверх (stuck), любое изменение размеров ленты или окна возвращает её к
    // низу. Программная прокрутка тоже шлёт scroll, но у самого низа — stuck
    // остаётся true. (Сам флаг stuck объявлен сразу после el — scrollBottom
    // может вызываться раньше, чем исполнится этот блок.)
    el.scroll.addEventListener('scroll', () => {
      const s = el.scroll;
      stuck = s.scrollHeight - s.scrollTop - s.clientHeight < 48;
    }, { passive: true });
    if (window.ResizeObserver) {
      // Экран-приветствие (.agent-empty) не «дотягиваем» — его поведение
      // прокрутки остаётся прежним (только явные scrollBottom).
      const ro = new ResizeObserver(() => {
        if (stuck && !el.log.querySelector('.agent-empty')) el.scroll.scrollTop = el.scroll.scrollHeight;
      });
      ro.observe(el.log);
      ro.observe(el.scroll);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (stuck && !el.log.querySelector('.agent-empty')) el.scroll.scrollTop = el.scroll.scrollHeight; });
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

    // Чаты, впервые увиденные в первые секунды после входа, — это загрузка списка, а не новые.
    const chatSeen = new Map();
    let primeUntil = 0, sideActive = null;
    function collapseThen(li, fn) {
      let done = false;
      const go = () => { if (!done) { done = true; fn(); } };
      if (motionOff() || !li.animate) { go(); return; }
      const h = li.offsetHeight + 'px';
      li.style.overflow = 'hidden'; li.style.pointerEvents = 'none';
      const a = li.animate([
        { opacity: 1, transform: 'none', height: h, marginBottom: '2px' },
        { opacity: 0, transform: 'translateX(-16px)', height: h, marginBottom: '2px', offset: 0.5 },
        { opacity: 0, transform: 'translateX(-16px)', height: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px' },
      ], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      a.onfinish = go;
      setTimeout(go, 450);
    }

    // Название чата: пустое — берётся из первого вопроса. Общая логика для шапки и списка.
    function commitTitle(c, value) {
      c.title = String(value || '').trim().slice(0, 80) || (c.messages.length ? deriveTitle((c.messages.find(m => m.role === 'user') || {}).content) : '');
      if (c.messages.length) { c.updatedAt = Date.now(); pushChat(c); }
    }

    // Переименование прямо в списке (карандаш, двойной щелчок или F2). Если список
    // перерисуется во время ввода (снимок из аккаунта), поле восстановится с тем же текстом.
    let renaming = null;
    function startRename(li, c, titleEl, value) {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'ci-input'; inp.maxLength = 80;
      inp.setAttribute('aria-label', 'Новое название чата');
      inp.value = value != null ? value : (c.title || titleEl.textContent || '');
      renaming = { id: c.id, value: inp.value };
      titleEl.replaceWith(inp);
      li.classList.add('renaming');
      let done = false;
      const finish = save => {
        if (done) return;
        done = true; renaming = null;
        if (save && chats.has(c.id)) { commitTitle(c, inp.value); renderTop(); }
        renderSidebar();
        const again = el.chatList.querySelector('.chat-item[data-id="' + c.id + '"]');
        if (again && document.activeElement === document.body) again.focus();
      };
      inp.addEventListener('input', () => { if (renaming) renaming.value = inp.value; });
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('dblclick', e => e.stopPropagation());
      inp.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      inp.addEventListener('blur', () => { if (inp.isConnected) finish(true); });
      requestAnimationFrame(() => { inp.focus(); if (value == null) inp.select(); });
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
      const nowTs = Date.now();
      let group = -1;
      list.forEach(c => {
        // заголовки групп по датам; пустой черновик — всегда в «Сегодня»
        const g = c.messages.length ? dayGroup(c.updatedAt, nowTs) : 0;
        if (g !== group) {
          group = g;
          const gh = document.createElement('li'); gh.className = 'chats-group'; gh.setAttribute('role', 'presentation');
          gh.textContent = DAY_GROUPS[g];
          el.chatList.appendChild(gh);
        }
        const li = document.createElement('li');
        li.className = 'chat-item' + (c.id === activeId ? ' on' : '');
        li.tabIndex = 0; li.setAttribute('role', 'button'); li.dataset.id = c.id;
        if (c.id === activeId) li.setAttribute('aria-current', 'true');
        if (c.messages.length) li.title = (c.title || '') + ' · ' + fmtWhen(c.updatedAt);
        if (!chatSeen.has(c.id)) chatSeen.set(c.id, now() < primeUntil ? -Infinity : now());
        const age = now() - chatSeen.get(c.id);
        if (age < 400 && !motionOff()) { li.classList.add('mfa-ci-in'); li.style.setProperty('--mfa-age', Math.round(age) + 'ms'); }
        else if (c.id === activeId && sideActive !== activeId && sideActive !== null && !motionOff()) li.classList.add('mfa-on-in');
        const main = document.createElement('div'); main.className = 'ci-main';
        const t = document.createElement('div'); t.className = 'ci-title' + (c.title || c.messages.length ? '' : ' empty');
        t.textContent = c.title || (c.messages.length ? deriveTitle((c.messages.find(m => m.role === 'user') || {}).content) : 'Новый чат');
        const meta = document.createElement('div'); meta.className = 'ci-meta';
        if (c.busy) { const dot = document.createElement('span'); dot.className = 'ci-dot'; meta.appendChild(dot); meta.appendChild(document.createTextNode('отвечает…')); }
        main.append(t);
        if (c.busy) main.append(meta);
        li.appendChild(main);
        const tools = document.createElement('div'); tools.className = 'ci-tools';
        if (c.messages.length) {
          const ren = document.createElement('button'); ren.type = 'button'; ren.className = 'ci-btn ci-ren'; ren.title = 'Переименовать'; ren.setAttribute('aria-label', 'Переименовать чат');
          ren.innerHTML = ICON.pen;
          ren.addEventListener('click', e => { e.stopPropagation(); startRename(li, c, t); });
          tools.appendChild(ren);
        }
        const del = document.createElement('button'); del.type = 'button'; del.className = 'ci-btn ci-del'; del.title = 'Удалить чат'; del.setAttribute('aria-label', 'Удалить чат');
        del.innerHTML = ICON.trash;
        del.addEventListener('click', e => {
          e.stopPropagation();
          if (!c.messages.length || confirm('Удалить чат «' + (t.textContent || 'Новый чат') + '»?')) collapseThen(li, () => removeChat(c.id));
        });
        tools.appendChild(del);
        li.appendChild(tools);
        li.addEventListener('click', () => openChat(c.id));
        li.addEventListener('dblclick', e => { if (c.messages.length && !e.target.closest('button,input')) startRename(li, c, t); });
        li.addEventListener('keydown', e => {
          if (e.target !== li) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(c.id); }
          else if (e.key === 'F2' && c.messages.length) { e.preventDefault(); startRename(li, c, t); }
        });
        el.chatList.appendChild(li);
        if (renaming && renaming.id === c.id) startRename(li, c, t, renaming.value);
      });
      sideActive = activeId;
      renderSyncNote();
    }

    let topChat = null, topTopic = null;
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
        if (c.id === topChat && topic.id !== topTopic) replay(el.ctx, 'mfa-chip-pop');
      } else {
        el.ctx.hidden = true;
      }
      topChat = c ? c.id : null; topTopic = topic ? topic.id : null;
      el.pick.textContent = topic ? 'Сменить тему' : 'Выбрать тему';
    }

    const SUGGEST_ICONS = ['c²', 'x²', 'dy', '△'];
    const SUGGESTIONS = [
      'Объясни теорему Пифагора простыми словами',
      'Как решать квадратные уравнения? Покажи на примере',
      'В чём разница между производной и дифференциалом?',
      'Найди площадь треугольника со сторонами 13, 14 и 15',
    ];

    function buildMessage(c, m, isLast) {
      const wrap = document.createElement('div');
      wrap.className = 'msg msg-' + m.role;
      fresh(wrap, m, 'in', m.role === 'user' ? 'mfa-in-user' : 'mfa-in-bot', 600);
      const body = document.createElement('div');
      body.className = 'msg-body';
      if (m.role === 'user') {
        body.textContent = m.content;
        wrap.appendChild(body);
        // под вопросом — «копировать» (появляется при наведении)
        const ua = document.createElement('div'); ua.className = 'msg-acts msg-acts-user';
        ua.appendChild(copyBtn(() => m.content, 'Копировать вопрос'));
        wrap.appendChild(ua);
        return wrap;
      } else {
        const md = document.createElement('div');
        md.className = 'md';
        md.innerHTML = m.content ? mdToHtml(m.content) : '';
        body.appendChild(md);
        const streaming = c.busy && isLast;
        if (streaming && m.content) appendCaret(md);
        if (streaming && !m.content) { body.appendChild(typingEl(m)); wrap.classList.add('is-thinking'); }
        if (!streaming && m.content) decorateCode(md);
        if (m.error) {
          const err = document.createElement('div'); err.className = 'msg-err'; err.setAttribute('role', 'alert');
          const et = document.createElement('span'); et.className = 'msg-err-t'; et.textContent = m.error;
          err.appendChild(et);
          if (isLast && !c.busy && uid) {
            const rb = document.createElement('button'); rb.type = 'button'; rb.className = 'msg-retry';
            rb.innerHTML = ICON.redo + '<span>Повторить</span>';
            rb.addEventListener('click', regenerate);
            err.appendChild(rb);
          }
          fresh(err, m, 'err', 'mfa-fresh', 500);
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
          fresh(src, m, 'src', 'mfa-fresh', 500);
          body.appendChild(src);
        }
        if (!c.busy || !isLast) {
          const acts = document.createElement('div'); acts.className = 'msg-acts';
          if (m.content) acts.appendChild(copyBtn(() => m.content, 'Копировать ответ'));
          if (isLast && !m.error) {
            const r = document.createElement('button'); r.type = 'button'; r.className = 'act';
            r.title = 'Ответить заново'; r.setAttribute('aria-label', 'Ответить заново');
            r.innerHTML = ICON.redo;
            r.addEventListener('click', regenerate);
            acts.appendChild(r);
          }
          if (acts.children.length) { fresh(acts, m, 'acts', 'mfa-fresh', 500); body.appendChild(acts); }
        }
      }
      wrap.appendChild(body);
      return wrap;
    }

    // Эмблема: оси, кривая, касательная в точке перегиба (t = ½ кривой Безье), точка касания.
    const EMBLEM = '<svg class="agent-emblem" viewBox="0 0 120 72" aria-hidden="true">' +
      '<path class="ae-axis ae-draw" pathLength="1" style="--d:.05s;--dur:.7s" d="M10 62H114"/>' +
      '<path class="ae-axis ae-draw" pathLength="1" style="--d:.15s;--dur:.6s" d="M18 70V6"/>' +
      '<path class="ae-tick ae-draw" pathLength="1" style="--d:.45s;--dur:.3s" d="M58.25 59V65M15 34.75H21"/>' +
      '<path class="ae-curve ae-draw" pathLength="1" style="--d:.4s;--dur:1.1s" d="M22 56C52 56 60 14 108 12"/>' +
      '<path class="ae-tan ae-draw" pathLength="1" style="--d:1.05s;--dur:.6s" d="M32.25 58.54L84.25 10.96"/>' +
      '<circle class="ae-halo" style="--d:1.35s" cx="58.25" cy="34.75" r="3.5"/>' +
      '<circle class="ae-pt ae-pop" style="--d:1.3s" cx="58.25" cy="34.75" r="3.5"/></svg>';

    let logChatId = null, logChatObj = null;
    function renderLog() {
      const c = cur();
      // Другой чат (или история целиком пришла заново) — это не «новые сообщения»:
      // всё помечается показанным, лента только мягко проявляется.
      const unseen = c ? c.messages.filter(m => !seen.has(m)).length : 0;
      const switched = !c || c.id !== logChatId;
      // тот же чат, но объект заменён снимком из аккаунта — это не новые сообщения
      if (c && (switched || unseen > 2 || c !== logChatObj)) {
        c.messages.forEach(m => { if (!seen.has(m)) markOld(m); });
        if (switched && logChatId !== null && c.messages.length) replay(el.log, 'mfa-swap');
      }
      logChatId = c ? c.id : null; logChatObj = c;
      el.log.innerHTML = '';
      if (!c || !c.messages.length) {
        const empty = document.createElement('div'); empty.className = 'agent-empty';
        const age = c ? ageOf(c, 'empty') : Infinity;
        if (age > 2600 || motionOff()) empty.classList.add('mfa-static');
        else empty.style.setProperty('--mfa-age', Math.round(age) + 'ms');
        const h = new Date().getHours();
        const hello = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
        const name = user && user.displayName ? String(user.displayName).trim().split(/\s+/)[0] : '';
        empty.innerHTML = EMBLEM + '<h2 class="ae-in" style="--d:.2s"></h2><p class="ae-in" style="--d:.3s">Спросите о любой теме — агент опирается на справочник MathFrame, ' +
          'записывает формулы и разбирает решения по шагам. Тему можно закрепить кнопкой «Выбрать тему».</p>';
        empty.querySelector('h2').textContent = uid ? hello + (name ? ', ' + name : '') : 'Чем помочь с математикой?';
        const chips = document.createElement('div'); chips.className = 'suggest';
        SUGGESTIONS.forEach(t => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'suggest-chip ae-in';
          const ico = document.createElement('span'); ico.className = 'sg-ico'; ico.setAttribute('aria-hidden', 'true');
          ico.textContent = SUGGEST_ICONS[chips.children.length % SUGGEST_ICONS.length];
          const lbl = document.createElement('span'); lbl.className = 'sg-t'; lbl.textContent = t;
          b.append(ico, lbl);
          b.style.setProperty('--d', (0.42 + chips.children.length * 0.06).toFixed(2) + 's');
          b.addEventListener('click', () => submit(t));
          chips.appendChild(b);
        });
        empty.appendChild(chips);
        el.log.appendChild(empty);
      } else {
        c.messages.forEach((m, i) => el.log.appendChild(buildMessage(c, m, i === c.messages.length - 1)));
        // последний ответ только что дописан — его хвост догорает, а не выскакивает
        const lm = c.messages[c.messages.length - 1];
        if (tails.has(lm)) fadeTail(el.log.lastElementChild.querySelector('.md'), lm);
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
        const next = buildMessage(c, m, true);
        fadeTail(next.querySelector('.md'), m);
        last.replaceWith(next);
        hydrateMath(next);
        if (near) el.scroll.scrollTop = el.scroll.scrollHeight;
      });
    }

    let prevBusy = null, prevBusyChat = null;
    function updateChrome() {
      const c = cur();
      const busy = !!(c && c.busy);
      const cid = c ? c.id : null;
      if (cid === prevBusyChat && prevBusy !== null && busy !== prevBusy) replay(busy ? el.stop : el.send, 'mfa-swap-in');
      prevBusy = busy; prevBusyChat = cid;
      const canWrite = !!uid && configured && !!c;
      el.input.disabled = !canWrite;
      el.send.disabled = !canWrite || busy;
      el.send.hidden = busy;
      el.stop.hidden = !busy;
      el.login.hidden = !!uid || !configured;
      el.newBtn.disabled = !uid;
      if (el.newTop) el.newTop.disabled = !uid;
      el.input.placeholder = !configured ? 'AI‑агент пока недоступен'
        : (!uid ? 'Войдите, чтобы задать вопрос' : 'Спросите что угодно о математике…');
    }

    // Баннер бывает постоянным (хранилище недоступно, агент не настроен — пока причина есть) и
    // временным (лимит чатов, истёкший вход) — временный сам гаснет и не затирает постоянный.
    const NOT_CONF_TEXT = 'AI‑агент пока не настроен: администратору нужно задать ключ нейросети в настройках сайта.';
    let bannerTimer = null;
    function showBanner(text, kind, sticky) {
      clearTimeout(bannerTimer); bannerTimer = null;
      if (!text) { el.banner.hidden = true; el.banner.classList.remove('mfa-re'); return; }
      if (!el.banner.hidden && el.banner.textContent !== text) replay(el.banner, 'mfa-re');
      el.banner.hidden = false;
      el.banner.classList.remove('info', 'warn'); el.banner.classList.add(kind || 'info');
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
            model: modelId || undefined,
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
      if (window.MathFrameUI && window.MathFrameUI.burst) window.MathFrameUI.burst(el.send, { count: 9, spread: 24 });
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
    // Открытие анимирует CSS (при снятии hidden); закрытие — короткий уход, потом hidden.
    let pickerOpen = false, pickerTimer = 0;
    function openPicker() {
      clearTimeout(pickerTimer);
      pickerOpen = true;
      el.picker.classList.remove('mfa-closing');
      el.picker.hidden = false; el.pick.setAttribute('aria-expanded', 'true');
      renderPicker(); el.pickInput.focus();
    }
    function closePicker() {
      if (!pickerOpen) return;
      pickerOpen = false;
      el.pick.setAttribute('aria-expanded', 'false');
      if (motionOff()) { el.picker.hidden = true; return; }
      el.picker.classList.add('mfa-closing');
      pickerTimer = setTimeout(() => { el.picker.hidden = true; el.picker.classList.remove('mfa-closing'); }, 170);
    }
    function openDrawer() { el.card.classList.add('drawer-open'); el.scrim.hidden = false; el.menu.setAttribute('aria-expanded', 'true'); }
    function closeDrawer() { el.card.classList.remove('drawer-open'); el.scrim.hidden = true; el.menu.setAttribute('aria-expanded', 'false'); }

    const countEl = $('agentCount'), downBtn = $('agentDown'), composeRow = el.input.closest('.compose-row');
    function autosize() {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 200) + 'px';
      // вид кнопки отправки (пустое поле — приглушена) и счётчик, когда до лимита недалеко
      const len = el.input.value.length, max = el.input.maxLength > 0 ? el.input.maxLength : 0;
      if (composeRow) composeRow.classList.toggle('has-text', !!el.input.value.trim());
      if (countEl) {
        const near = max && len > max * 0.8;
        countEl.hidden = !near;
        if (near) { countEl.textContent = len + ' / ' + max; countEl.classList.toggle('warn', len >= max * 0.95); }
      }
    }

    // «Вниз»: появляется, когда пользователь ушёл вверх по ленте
    function updateDown() {
      if (!downBtn) return;
      const s = el.scroll;
      downBtn.classList.toggle('show', s.scrollHeight - s.scrollTop - s.clientHeight > 320);
    }
    el.scroll.addEventListener('scroll', updateDown, { passive: true });
    if (downBtn) downBtn.addEventListener('click', () => {
      el.scroll.scrollTo({ top: el.scroll.scrollHeight, behavior: motionOff() ? 'auto' : 'smooth' });
    });

    // Экранная клавиатура на телефоне: высота «приложения» = видимая область
    // (visualViewport), иначе поле ввода уезжает под клавиатуру.
    if (window.visualViewport && window.matchMedia && matchMedia("(pointer: coarse)").matches) {
      const vv = window.visualViewport, root = document.documentElement;
      let vvRaf = 0;
      const fit = () => {
        vvRaf = 0;
        const near = el.scroll.scrollHeight - el.scroll.scrollTop - el.scroll.clientHeight < 160;
        root.style.setProperty('--agent-vvh', Math.round(vv.height) + 'px');
        root.classList.add('agent-vv');
        // iOS прокручивает страницу, чтобы показать поле; сама страница прокручиваться не должна
        if (window.scrollY) window.scrollTo(0, 0);
        if (near) el.scroll.scrollTop = el.scroll.scrollHeight;
        updateDown();
      };
      const schedule = () => { if (!vvRaf) vvRaf = requestAnimationFrame(fit); };
      vv.addEventListener('resize', schedule);
      vv.addEventListener('scroll', schedule);
      fit();
    }

    el.form.addEventListener('submit', e => { e.preventDefault(); submit(el.input.value); });
    el.input.addEventListener('input', autosize);
    el.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(el.input.value); }
    });
    el.stop.addEventListener('click', () => { const c = cur(); const ctl = c && runs.get(c.id); if (ctl) ctl.abort(); });
    el.newBtn.addEventListener('click', () => { newChat(); });
    // Панель чатов: на широком экране её можно свернуть (запоминается), на узком — выезжает поверх.
    const narrow = () => !!(window.matchMedia && matchMedia('(max-width:820px)').matches);
    const LS_SIDE = 'mf-agent-side';
    function setCollapsed(on, save) {
      el.card.classList.toggle('side-collapsed', on);
      if (save) { try { localStorage.setItem(LS_SIDE, on ? 'collapsed' : 'open'); } catch (e) {} }
    }
    try { if (localStorage.getItem(LS_SIDE) === 'collapsed') setCollapsed(true, false); } catch (e) {}
    el.menu.addEventListener('click', () => {
      if (narrow()) (el.card.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
      else { setCollapsed(false, true); el.newBtn.focus(); }
    });
    if (el.collapse) el.collapse.addEventListener('click', () => {
      if (narrow()) closeDrawer();
      else { setCollapsed(true, true); el.menu.focus(); }
    });
    if (el.newTop) el.newTop.addEventListener('click', () => { newChat(); });
    el.scrim.addEventListener('click', closeDrawer);
    el.pick.addEventListener('click', () => (pickerOpen ? closePicker() : openPicker()));
    el.pickInput.addEventListener('input', renderPicker);
    el.title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.title.blur(); } });
    el.title.addEventListener('change', () => {
      const c = cur();
      if (!c || !uid) return;
      commitTitle(c, el.title.value);
      el.title.value = c.title;
      renderSidebar();
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (pickerOpen && el.picker.contains(document.activeElement)) el.pick.focus();   // фокус не теряется вместе с панелью
      closePicker(); closeDrawer();
    });
    document.addEventListener('click', e => {
      if (!pickerOpen) return;
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
      chatSeen.clear(); primeUntil = now() + 2500; sideActive = null;
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

    /* ==================================================================
       МОДЕЛЬ: «Маленькая» / «Средняя» / «Большая» (сервер — api/_ai.js).
       Большая модель тратит больше часового лимита — стоимость видна в подсказке.
       ================================================================== */
    function setupModels(models, def, limit) {
      const box = document.getElementById('agentModels');
      if (!box) return;
      let saved = null;
      try { saved = localStorage.getItem('mf-ai-model'); } catch (e) {}
      modelId = models.some(m => m.id === saved) ? saved : (def || models[0].id);
      box.innerHTML = '';
      const lbl = document.createElement('span');
      lbl.className = 'model-lbl'; lbl.textContent = 'Модель';
      box.appendChild(lbl);
      models.forEach(m => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'model-chip'; b.dataset.id = m.id;
        b.setAttribute('role', 'radio');
        b.textContent = m.label;
        const per = limit ? Math.floor(limit / m.cost) : null;
        b.title = m.label + ' — ' + m.hint + '. Один вопрос расходует ' + m.cost + ' ед. лимита' + (per ? ' (около ' + per + ' вопросов в час)' : '') + '.';
        b.addEventListener('click', () => {
          modelId = m.id;
          try { localStorage.setItem('mf-ai-model', m.id); } catch (e) {}
          sync();
        });
        box.appendChild(b);
      });
      function sync() {
        box.querySelectorAll('.model-chip').forEach(b => {
          const on = b.dataset.id === modelId;
          b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
      }
      sync();
      box.hidden = false;
    }

    renderAll();
    if (window.Auth) window.Auth.onAuthChange(onUser);
    else document.addEventListener('authReady', () => window.Auth.onAuthChange(onUser));

    fetch('/api/chat', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.webSearch) webSearch = true;
      if (d && Array.isArray(d.models) && d.models.length) setupModels(d.models, d.defaultModel, d.rateLimit);
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
      if (pickerOpen) renderPicker();
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
    module.exports = { stems, htmlToText, buildIndex, retrieve, searchTitles, mdToHtml, buildPayloadMessages, friendlyError, escapeHtml, deriveTitle, fmtWhen, dayGroup, DAY_GROUPS, cleanMessages, applyResetMark, RESET_MARK };
  }
})();
