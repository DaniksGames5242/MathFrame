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
  function buildPayloadMessages(messages) {
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
    return out.slice(-12);
  }

  function friendlyError(status, data) {
    if (data && data.error) return data.error;
    if (status === 401) return 'Войдите в аккаунт, чтобы пользоваться AI-агентом.';
    if (status === 429) return 'Слишком много запросов. Попробуйте чуть позже.';
    if (status === 503) return 'AI-агент ещё не настроен администратором сайта.';
    return 'Не удалось получить ответ (код ' + status + '). Попробуйте ещё раз.';
  }

  /* ==========================================================================
     ИНТЕРФЕЙС
     ========================================================================== */

  function initPage() {
    const $ = id => document.getElementById(id);
    const el = {
      log: $('agentLog'), input: $('agentInput'), send: $('agentSend'), stop: $('agentStop'),
      form: $('agentForm'), banner: $('agentBanner'), ctxChip: $('agentCtx'), pickBtn: $('agentPick'),
      newBtn: $('agentNew'), picker: $('agentPicker'), pickInput: $('agentPickInput'), pickList: $('agentPickList'),
      login: $('agentLogin'), loginBtn: $('agentLoginBtn'),
    };

    const LS_KEY = 'mf-agent-chat-v1';
    const state = { messages: [], topicId: null };
    let index = null;
    let topicsById = new Map();
    let childrenOf = new Map();
    let user = null;
    let configured = true;
    let busy = false;
    let controller = null;

    /* ---- хранение ---- */
    function save() {
      try {
        const msgs = state.messages.slice(-40).map(m => ({ role: m.role, content: m.content, sources: m.sources || undefined, error: m.error || undefined }));
        localStorage.setItem(LS_KEY, JSON.stringify({ messages: msgs, topicId: state.topicId }));
      } catch (e) { /* приватный режим / переполнение — не критично */ }
    }
    function load() {
      try {
        const p = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
        if (p && Array.isArray(p.messages)) {
          state.messages = p.messages.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
          state.topicId = typeof p.topicId === 'string' ? p.topicId : null;
        }
      } catch (e) {}
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
          if (window.katex) hydrateMath(root);
        }
      }, 150);
    }

    /* ---- иконки ---- */
    const ICON = {
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
      redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
    };

    /* ---- отрисовка ---- */
    function buildMessage(m, i, isLast) {
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
        if (busy && isLast && !m.content) {
          const dots = document.createElement('div'); dots.className = 'typing';
          dots.innerHTML = '<span></span><span></span><span></span>';
          body.appendChild(dots);
        }
        if (m.error) {
          const err = document.createElement('div'); err.className = 'msg-err'; err.textContent = m.error;
          body.appendChild(err);
        }
        // Под ответом — только те темы справочника, на которые он реально сослался,
        // и выбранная пользователем. Всё, что поиск подтянул «на всякий случай», не
        // показываем: «Из справочника» должно означать, что ответ на это опирался.
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
        if (!busy || !isLast) {
          const acts = document.createElement('div'); acts.className = 'msg-acts';
          if (m.content) {
            const c = document.createElement('button'); c.type = 'button'; c.className = 'act'; c.innerHTML = ICON.copy + '<span>Копировать</span>';
            c.addEventListener('click', () => {
              (navigator.clipboard ? navigator.clipboard.writeText(m.content) : Promise.reject()).then(() => {
                c.querySelector('span').textContent = 'Скопировано';
                setTimeout(() => { c.querySelector('span').textContent = 'Копировать'; }, 1500);
              }).catch(() => {});
            });
            acts.appendChild(c);
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

    const SUGGESTIONS = [
      'Объясни теорему Пифагора простыми словами',
      'Как решать квадратные уравнения? Покажи на примере',
      'В чём разница между производной и дифференциалом?',
      'Найди площадь треугольника со сторонами 13, 14 и 15',
    ];

    function renderLog() {
      el.log.innerHTML = '';
      if (!state.messages.length) {
        const empty = document.createElement('div'); empty.className = 'agent-empty';
        empty.innerHTML = '<h2>Чем помочь?</h2><p>Задайте вопрос по математике — объясню тему или разберу решение. ' +
          'Если выбрать тему справочника, отвечу с опорой на неё.</p>';
        const chips = document.createElement('div'); chips.className = 'suggest';
        SUGGESTIONS.forEach(t => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'suggest-chip'; b.textContent = t;
          b.addEventListener('click', () => submit(t));
          chips.appendChild(b);
        });
        empty.appendChild(chips);
        el.log.appendChild(empty);
      } else {
        state.messages.forEach((m, i) => el.log.appendChild(buildMessage(m, i, i === state.messages.length - 1)));
        hydrateMath(el.log);
      }
      updateChrome();
    }

    // Во время стрима перерисовываем только последнее сообщение, и не чаще раза за кадр.
    let raf = 0;
    function renderStreaming() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const last = el.log.lastElementChild;
        const m = state.messages[state.messages.length - 1];
        if (!last || !m) return;
        const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
        last.replaceWith(buildMessage(m, state.messages.length - 1, true));
        hydrateMath(el.log.lastElementChild);
        if (nearBottom) window.scrollTo(0, document.documentElement.scrollHeight);
      });
    }

    function updateChrome() {
      const topic = state.topicId && topicsById.get(state.topicId);
      if (topic) {
        el.ctxChip.hidden = false;
        el.ctxChip.innerHTML = '';
        const label = document.createElement('span'); label.textContent = 'Тема: ' + topic.title;
        const x = document.createElement('button'); x.type = 'button'; x.title = 'Убрать тему'; x.setAttribute('aria-label', 'Убрать тему'); x.textContent = '×';
        x.addEventListener('click', () => { state.topicId = null; save(); updateChrome(); });
        el.ctxChip.append(label, x);
      } else {
        el.ctxChip.hidden = true;
      }
      const canWrite = !!user && configured;
      el.input.disabled = !canWrite;
      el.send.disabled = !canWrite || busy;
      el.send.hidden = busy;
      el.stop.hidden = !busy;
      el.login.hidden = !!user || !configured;
      el.input.placeholder = !configured ? 'AI‑агент пока недоступен'
        : (!user ? 'Войдите, чтобы задать вопрос' : 'Спросите что угодно о математике…');
      el.newBtn.disabled = busy || !state.messages.length;
    }

    function showBanner(text, kind) {
      if (!text) { el.banner.hidden = true; return; }
      el.banner.hidden = false;
      el.banner.className = 'agent-banner ' + (kind || 'info');
      el.banner.textContent = text;
    }

    /* ---- контекст из справочника ---- */
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

    function buildContext(question) {
      const out = [];
      const focus = state.topicId && topicsById.get(state.topicId);
      if (focus) out.push(topicContext(focus, true));
      if (index) {
        // (в этот момент последняя реплика — сам вопрос, ответа ещё нет)
        const prevUser = state.messages.slice(0, -1).reverse().find(m => m.role === 'user');
        // Короткий уточняющий вопрос («а для куба?») ищем вместе с предыдущим — иначе искать нечего.
        const query = question + (question.length < 50 && prevUser ? ' ' + prevUser.content : '');
        retrieve(index, query, { k: 4, exclude: new Set(focus ? [focus.id] : []) }).forEach(r => {
          const t = topicsById.get(r.id);
          if (t) out.push(topicContext(t, false));
        });
      }
      return out;
    }

    /* ---- отправка ---- */
    async function run() {
      // state.messages заканчивается репликой пользователя, на которую нужен ответ
      const question = state.messages[state.messages.length - 1].content;
      const ctx = buildContext(question);
      const msg = { role: 'assistant', content: '', sources: ctx.filter(c => c.text).map(c => ({ id: c.id, title: c.title, focus: c.id === state.topicId })) };
      state.messages.push(msg);
      busy = true; controller = new AbortController();
      showBanner('');
      renderLog();
      window.scrollTo(0, document.documentElement.scrollHeight);
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
          body: JSON.stringify({
            messages: buildPayloadMessages(state.messages.slice(0, -1)),
            context: ctx,
            focusId: state.topicId || undefined,
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
          msg.content += decoder.decode(value, { stream: true });
          renderStreaming();
        }
        msg.content += decoder.decode();
        msg.content = msg.content.trim();
        if (!msg.content) msg.error = 'Пустой ответ. Попробуйте ещё раз.';
      } catch (e) {
        if (e && e.name === 'AbortError') {
          // «Стоп»: оставляем то, что успело прийти
          if (!msg.content) state.messages.pop();
        } else {
          msg.error = (e && e.message) || 'Не удалось получить ответ.';
          if (e && e.status === 401) showBanner('Сессия входа истекла — войдите снова.', 'warn');
        }
      } finally {
        busy = false; controller = null;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        save();
        renderLog();
      }
    }

    function submit(text) {
      text = String(text || '').trim();
      if (!text || busy) return;
      if (!configured) return;
      if (!user) { if (window.openAuthModal) window.openAuthModal(); return; }
      state.messages.push({ role: 'user', content: text });
      el.input.value = ''; autosize();
      run();
    }

    function regenerate() {
      if (busy) return;
      // Убираем последний ответ (и всё после последней реплики пользователя) и спрашиваем заново.
      while (state.messages.length && state.messages[state.messages.length - 1].role !== 'user') state.messages.pop();
      if (!state.messages.length || !user) { renderLog(); return; }
      run();
    }

    /* ---- выбор темы ---- */
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
          state.topicId = f.id; save(); el.picker.hidden = true; el.pickInput.value = ''; updateChrome();
          el.input.focus();
        });
        li.appendChild(b); el.pickList.appendChild(li);
      });
    }

    /* ---- поле ввода ---- */
    function autosize() {
      el.input.style.height = 'auto';
      el.input.style.height = Math.min(el.input.scrollHeight, 180) + 'px';
    }

    /* ---- события ---- */
    el.form.addEventListener('submit', e => { e.preventDefault(); submit(el.input.value); });
    el.input.addEventListener('input', autosize);
    el.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(el.input.value); }
    });
    el.stop.addEventListener('click', () => { if (controller) controller.abort(); });
    el.newBtn.addEventListener('click', () => {
      if (busy || !state.messages.length) return;
      if (!confirm('Начать новый диалог? Текущий будет удалён.')) return;
      state.messages = []; save(); showBanner(''); renderLog();
    });
    el.pickBtn.addEventListener('click', () => {
      el.picker.hidden = !el.picker.hidden;
      if (!el.picker.hidden) { renderPicker(); el.pickInput.focus(); }
    });
    el.pickInput.addEventListener('input', renderPicker);
    el.pickInput.addEventListener('keydown', e => { if (e.key === 'Escape') el.picker.hidden = true; });
    el.loginBtn.addEventListener('click', () => { if (window.openAuthModal) window.openAuthModal(); });

    /* ---- запуск ---- */
    load();
    const urlTopic = new URLSearchParams(location.search).get('topic');
    renderLog();

    function onUser(u) { user = u; updateChrome(); }
    if (window.Auth) window.Auth.onAuthChange(onUser);
    else document.addEventListener('authReady', () => window.Auth.onAuthChange(onUser));

    fetch('/api/chat', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => {
      if (d && d.configured === false) {
        configured = false;
        showBanner('AI‑агент пока не настроен: администратору нужно задать ключ нейросети в настройках сайта.', 'warn');
        updateChrome();
      }
    }).catch(() => {});

    fetch('/data/topics/config.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(list => {
      if (!Array.isArray(list)) return;
      topicsById = new Map(); childrenOf = new Map();
      list.forEach(t => { if (t && t.id) topicsById.set(t.id, t); });
      list.forEach(t => { if (t && t.parent) { if (!childrenOf.has(t.parent)) childrenOf.set(t.parent, []); childrenOf.get(t.parent).push(t); } });
      index = buildIndex(list);
      if (urlTopic && topicsById.has(urlTopic)) { state.topicId = urlTopic; save(); }
      if (state.topicId && !topicsById.has(state.topicId)) state.topicId = null;
      updateChrome();
      if (!el.picker.hidden) renderPicker();
    }).catch(() => {
      // Без справочника агент работает как обычный чат — это не ошибка для пользователя.
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage);
    else initPage();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { stems, htmlToText, buildIndex, retrieve, searchTitles, mdToHtml, buildPayloadMessages, friendlyError, escapeHtml };
  }
})();
