/* Раскрытие карточек «Пять инструментов» на главной прямо на месте раздела. */
(function () {
  'use strict';

  var ICONS = {
    'spravochnik': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'mini-services': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
    'forum': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    'ai-agent': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 3v5M9 14h.01M15 14h.01"/></svg>',
    'playground': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
  };

  var SPRAV_TOPICS = [
    { id: 'obschie-ponyatiya', glyph: '§', title: 'Общие понятия', sub: 'Базовые определения и обозначения' },
    { id: 'algebra', glyph: 'x²', title: 'Алгебра', sub: 'Уравнения, многочлены, функции' },
    { id: 'geometry', glyph: '△', title: 'Геометрия', sub: 'Планиметрия и стереометрия' },
    { id: 'arifmetika', glyph: '±', title: 'Арифметика', sub: 'Числа и действия над ними' },
    { id: 'matematicheskiy-analiz', glyph: '∫', title: 'Математический анализ', sub: 'Пределы, производные, интегралы' },
    { id: 'teoriya-veroyatnostey-i-statistics', glyph: 'P', title: 'Теория вероятностей и статистика', sub: 'Случайные события и данные' },
    { id: 'diskretnaya-matematika', glyph: '{ }', title: 'Дискретная математика', sub: 'Множества, графы, комбинаторика' },
    { id: 'topologiya', glyph: '∞', title: 'Топология', sub: 'Пространства и непрерывность' }
  ];

  var MINI_SERVICES = [
    { id: 'basic', glyph: '#', title: 'Обычный', sub: 'Как на любом устройстве' },
    { id: 'calc', glyph: '=', title: 'Алгебраический калькулятор', sub: 'Вычисление, упрощение, уравнения' },
    { id: 'plot', glyph: 'f', title: 'График функции', sub: 'Функции, уравнения, системы' },
    { id: 'geo', glyph: '△', title: 'Геометрический калькулятор', sub: 'Планиметрия, стереометрия, координаты' },
    { id: 'conv', glyph: '⇄', title: 'Конвертор', sub: 'Единицы, валюта, дата, финансы' },
    { id: 'more', glyph: '⋯', title: 'Ещё инструменты', sub: '35+ специализированных инструментов' }
  ];

  var AI_SUGGESTIONS = [
    'Объясни теорему Пифагора простыми словами',
    'Как решать квадратные уравнения? Покажи на примере',
    'В чём разница между производной и дифференциалом?',
    'Найди площадь треугольника со сторонами 13, 14 и 15'
  ];

  var PLAYGROUND_EXAMPLES = [
    { id: 'linear-function', glyph: 'y=kx', title: 'Линейная функция', sub: 'y = kx + b на координатной плоскости' },
    { id: 'pythagorean-theorem', glyph: '△', title: 'Теорема Пифагора', sub: 'Прямоугольный треугольник и квадраты катетов' },
    { id: 'quadratic-function', glyph: 'x²', title: 'Квадратичная функция', sub: 'Парабола y = ax² + bx + c' },
    { id: 'sine-cosine', glyph: 'sin', title: 'Синус и косинус', sub: 'Единичная окружность и графики' }
  ];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function itemNode(glyph, title, sub, href, onClick) {
    var a = el('a', 'tool-item');
    a.href = href;
    a.innerHTML =
      '<span class="tool-item-glyph">' + glyph + '</span>' +
      '<span class="tool-item-text"><b>' + title + '</b><span>' + (sub || '') + '</span></span>' +
      '<span class="tool-item-arrow">→</span>';
    if (onClick) a.addEventListener('click', onClick);
    return a;
  }

  function skeletonGrid(body, count) {
    var grid = el('div', 'tool-grid');
    for (var i = 0; i < count; i++) {
      var it = el('div', 'tool-item is-skeleton');
      it.innerHTML =
        '<span class="tool-item-glyph"></span>' +
        '<span class="tool-item-text"><b></b><span></span></span>';
      grid.appendChild(it);
    }
    body.innerHTML = '';
    body.appendChild(grid);
  }

  function renderGrid(body, items) {
    var grid = el('div', 'tool-grid');
    items.forEach(function (it) { grid.appendChild(it); });
    body.innerHTML = '';
    body.appendChild(grid);
  }

  var firestorePromise = null;
  function ensureFirestore() {
    if (firestorePromise) return firestorePromise;
    firestorePromise = new Promise(function (resolve, reject) {
      try {
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
          reject(new Error('firebase not initialized'));
          return;
        }
        if (firebase.firestore) { resolve(firebase.firestore()); return; }
        var s = document.createElement('script');
        s.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
        s.onload = function () { resolve(firebase.firestore()); };
        s.onerror = function () { reject(new Error('failed to load firestore')); };
        document.head.appendChild(s);
      } catch (e) { reject(e); }
    });
    return firestorePromise;
  }

  var TOOLS = {
    'spravochnik': {
      title: 'Справочник',
      desc: 'Все темы математики с интерактивными примерами и пошаговыми доказательствами.',
      href: '/spravochnik/',
      cta: 'Открыть справочник',
      build: function (body) {
        renderGrid(body, SPRAV_TOPICS.map(function (t) {
          return itemNode(t.glyph, t.title, t.sub, '/spravochnik/#' + t.id);
        }));
      }
    },
    'mini-services': {
      title: 'Мини-сервисы',
      desc: 'Калькуляторы, графики, решатели и конвертеры — с двумерным вводом формул.',
      href: '/mini-services/',
      cta: 'Открыть мини-сервисы',
      build: function (body) {
        renderGrid(body, MINI_SERVICES.map(function (s) {
          return itemNode(s.glyph, s.title, s.sub, '/mini-services/#' + s.id);
        }));
      }
    },
    'forum': {
      title: 'Форум',
      desc: 'Обсуждайте задачи, разбирайте решения, помогайте друг другу.',
      href: '/forum/',
      cta: 'Перейти на форум',
      build: function (body, onSettle, isCurrent) {
        skeletonGrid(body, 4);
        isCurrent = isCurrent || function () { return true; };
        ensureFirestore().then(function (db) {
          return db.collection('forumArticles').orderBy('views', 'desc').limit(12).get(); // с запасом: скрытые (hidden) ниже отбрасываются
        }).then(function (snap) {
          // пока грузились статьи, панель могли закрыть или открыть другой инструмент
          if (!isCurrent()) return;
          var docs = snap.docs.filter(function (d) { return !d.data().hidden; }).slice(0, 4);
          if (!docs.length) {
            body.innerHTML = '<p class="tool-empty">Пока нет статей — станьте первым, кто откроет обсуждение.</p>';
            onSettle && onSettle();
            return;
          }
          var items = [];
          docs.forEach(function (doc) {
            var a = doc.data();
            var views = a.views || 0;
            items.push(itemNode('👁', a.title || 'Без названия', views + (views === 1 ? ' просмотр' : ' просмотров'), '/forum/#article/' + doc.id));
          });
          renderGrid(body, items);
          onSettle && onSettle();
        }).catch(function () {
          if (!isCurrent()) return;
          body.innerHTML = '<p class="tool-empty">Не получилось загрузить статьи. <a href="/forum/">Открыть форум →</a></p>';
          onSettle && onSettle();
        });
      }
    },
    'ai-agent': {
      title: 'AI-агент',
      desc: 'Объяснение или решение от помощника, который понимает контекст темы.',
      href: '/ai-agent/',
      cta: 'Задать свой вопрос',
      build: function (body) {
        renderGrid(body, AI_SUGGESTIONS.map(function (q) {
          return itemNode('?', q, '', '/ai-agent/', function () {
            try { sessionStorage.setItem('mf_ai_agent_prompt', q); } catch (e) {}
          });
        }));
      }
    },
    'playground': {
      title: 'Песочница',
      desc: 'Программируйте интерактивные сцены на языке GMS — в 2D и 3D.',
      href: '/playground/',
      cta: 'Открыть редактор',
      build: function (body) {
        renderGrid(body, PLAYGROUND_EXAMPLES.map(function (p) {
          return itemNode(p.glyph, p.title, p.sub, '/playground/');
        }));
      }
    }
  };

  /* ==========================================================================
     Раскрытие / сворачивание (FLIP-морф)
     --------------------------------------------------------------------------
     Вся анимация — одна шкала t ∈ [0, 1]: 0 — карточка в сетке, 1 — открытая
     панель. Каждый кадр из t вычисляется ВСЁ сразу: прямоугольник «призрака»
     (SVG-подложка с настоящим скруглением и обводкой), затухание сетки,
     высота сцены и ступенчатое появление содержимого панели. Поэтому:
       • размеры First (карточка) и Last (панель) замеряются один раз ДО
         старта, в финальной раскладке — никаких промежуточных «на всю ширину»;
       • открытие можно прервать закрытием (и наоборот) в любой момент —
         анимация просто разворачивается от текущего t, без рывков;
       • layout меняется только на границах (t = 0 и t = 1), в середине
         анимируются лишь атрибуты SVG, opacity и transform.
     На телефоне (≤ 640px) панель раскрывается на весь экран (режим sheet):
     панель и призрак переносятся в <body>, т.к. <main> — отдельный контекст
     наложения (z-index: 2) и не может перекрыть фиксированную шапку.
     ======================================================================== */
  var OPEN_MS = 560;
  var CLOSE_MS = 440;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 4); }           // быстрый старт, мягкая посадка
  function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  document.addEventListener('DOMContentLoaded', function () {
    var stage = document.getElementById('toolsStage');
    var grid = document.getElementById('toolsGrid');
    var panel = document.getElementById('toolPanel');
    var ghost = document.getElementById('toolGhost');
    if (!stage || !grid || !panel || !ghost) return;

    var closeBtn = panel.querySelector('.tool-panel-close');
    var iconEl = panel.querySelector('.tool-panel-icon');
    var titleEl = panel.querySelector('.tool-panel-title');
    var descEl = panel.querySelector('.tool-panel-desc');
    var bodyEl = panel.querySelector('.tool-panel-body');
    var ctaEl = panel.querySelector('.tool-panel-cta');

    var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var mqSheet = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;
    function motionOff() {
      if (window.MathFrameUI && window.MathFrameUI.motionOff) return window.MathFrameUI.motionOff();
      return !!(mqReduce && mqReduce.matches);
    }

    /* --- призрак: SVG-прямоугольник + «лицо» карточки, которое тает --- */
    ghost.innerHTML = '';
    ghost.hidden = true;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'tool-ghost-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<defs><linearGradient id="toolGhostSheen" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" class="tool-ghost-s0"/><stop offset="1" class="tool-ghost-s1"/>' +
      '</linearGradient></defs>' +
      '<rect class="tool-ghost-fill"/><rect class="tool-ghost-sheen" fill="url(#toolGhostSheen)"/>' +
      '<rect class="tool-ghost-stroke"/>';
    ghost.appendChild(svg);
    var gFill = svg.querySelector('.tool-ghost-fill');
    var gSheen = svg.querySelector('.tool-ghost-sheen');
    var gStroke = svg.querySelector('.tool-ghost-stroke');
    var face = el('div', 'tool-ghost-face');
    ghost.appendChild(face);

    panel.setAttribute('role', 'region');
    if (titleEl) { titleEl.id = titleEl.id || 'toolPanelTitle'; panel.setAttribute('aria-labelledby', titleEl.id); }

    var S = {
      phase: 'closed',   // closed | moving | open
      t: 0, target: 0, raf: 0,
      card: null, toolId: null, mode: 'inline',
      from: null, to: null, rFrom: 16, rTo: 16, h0: 0, h1: 0,
      pending: null, token: 0, ghostTimer: 0, lastWasKey: false
    };

    /* ---------- геометрия ---------- */
    function rectIn(node, base) {
      var r = node.getBoundingClientRect();
      if (!base) return { left: r.left, top: r.top, width: r.width, height: r.height };
      var b = base.getBoundingClientRect();
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height };
    }
    function radiusOf(node) { return parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0; }
    function headerH() {
      var h = document.getElementById('app-header');
      return h ? h.getBoundingClientRect().bottom : 0;
    }

    /* ---------- содержимое панели ---------- */
    function fillPanel(toolId) {
      var tool = TOOLS[toolId];
      iconEl.innerHTML = ICONS[toolId] || '';
      titleEl.textContent = tool.title;
      descEl.textContent = tool.desc;
      ctaEl.textContent = tool.cta;
      ctaEl.href = tool.href;
      bodyEl.innerHTML = '';
      panel.setAttribute('data-tool', toolId);
      var token = ++S.token;
      tool.build(bodyEl, function () {
        // асинхронный контент (форум) поменял высоту — подстраиваем цель морфа
        if (token === S.token && S.phase === 'moving' && S.target === 1) measureTo();
      }, function () { return token === S.token && S.phase !== 'closed'; });
    }

    // Порядок, в котором «проявляется» содержимое: шапка, пункты, ссылка.
    function staggerNodes() {
      var list = [closeBtn, panel.querySelector('.tool-panel-head')];
      var items = bodyEl.querySelectorAll('.tool-item, .tool-empty');
      for (var i = 0; i < items.length; i++) list.push(items[i]);
      list.push(ctaEl);
      return list;
    }
    function clearStagger() {
      panel.style.clipPath = '';
      staggerNodes().forEach(function (n) { if (n) { n.style.opacity = ''; n.style.transform = ''; } });
    }

    function copyAccent(card) {
      var cs = getComputedStyle(card);
      ['--tool-accent', '--tool-accent-soft'].forEach(function (p) {
        var v = cs.getPropertyValue(p).trim();
        [ghost, panel].forEach(function (n) { if (v) n.style.setProperty(p, v); else n.style.removeProperty(p); });
      });
    }

    function buildFace(card) {
      face.innerHTML = '';
      var h3 = card.querySelector('h3'), p = card.querySelector('p');
      if (h3) face.appendChild(h3.cloneNode(true));
      if (p) face.appendChild(p.cloneNode(true));
    }

    /* ---------- режимы sheet/inline: куда поместить панель и призрак ---------- */
    function toBody() {
      if (panel.parentNode !== document.body) document.body.appendChild(panel);
      if (ghost.parentNode !== document.body) document.body.appendChild(ghost);
      ghost.classList.add('is-fixed');
    }
    function toStage() {
      if (panel.parentNode !== stage) stage.insertBefore(panel, ghost.parentNode === stage ? ghost : null);
      if (ghost.parentNode !== stage) stage.appendChild(ghost);
      ghost.classList.remove('is-fixed');
    }
    var savedPad = '';
    function lockScroll(on) {
      var root = document.documentElement;
      if (on) {
        var sbw = window.innerWidth - root.clientWidth;
        savedPad = document.body.style.paddingRight;
        if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
        root.classList.add('tool-sheet-lock');
      } else {
        root.classList.remove('tool-sheet-lock');
        document.body.style.paddingRight = savedPad;
      }
    }

    function showGhost() {
      clearTimeout(S.ghostTimer);
      ghost.hidden = false;
      ghost.classList.add('is-on');
    }
    function hideGhost() {
      ghost.classList.remove('is-on');     // CSS: плавное затухание (~.24s)
      clearTimeout(S.ghostTimer);
      S.ghostTimer = setTimeout(function () {
        ghost.hidden = true;
        face.innerHTML = '';
        if (S.phase === 'closed') toStage();
      }, motionOff() ? 0 : 280);
    }

    function measureTo() {
      if (S.mode === 'inline') {
        S.to = rectIn(panel, stage);
        S.h1 = panel.offsetHeight;
      } else {
        S.to = rectIn(panel, null);
      }
    }

    /* ---------- подготовка к движению из устойчивого состояния ---------- */
    function prepareFromClosed(card) {
      S.card = card;
      S.toolId = card.getAttribute('data-tool');
      S.mode = (mqSheet && mqSheet.matches) ? 'sheet' : 'inline';
      clearTimeout(S.ghostTimer);

      copyAccent(card);
      card.style.transform = '';           // снимаем 3D-наклон mfCards
      card.classList.add('is-source');     // сама карточка прячется под призраком
      card.setAttribute('aria-expanded', 'true');

      fillPanel(S.toolId);
      panel.hidden = false;
      panel.classList.add('is-morphing');
      panel.classList.remove('is-leaving');

      if (S.mode === 'sheet') {
        toBody();
        panel.classList.add('is-sheet');
        lockScroll(true);
        S.from = rectIn(card, null);
      } else {
        toStage();
        panel.classList.add('is-floating');
        S.h0 = stage.offsetHeight;
        S.from = rectIn(card, stage);
      }
      S.rFrom = radiusOf(card);
      S.rTo = radiusOf(panel);
      measureTo();
      buildFace(card);
      face.style.width = S.from.width + 'px';
      face.style.left = S.from.left + 'px';
      face.style.top = S.from.top + 'px';
      stage.classList.add('is-busy');
      showGhost();
      S.phase = 'moving';

      // Верх панели должен оказаться на экране: если сцена уехала выше шапки
      // (открыли карточку из второго ряда) — мягко подкручиваем страницу.
      if (S.mode === 'inline') {
        var top = stage.getBoundingClientRect().top, hh = headerH();
        if (top < hh + 8) {
          window.scrollTo({ top: window.pageYOffset + top - hh - 16, behavior: motionOff() ? 'auto' : 'smooth' });
        }
      }
    }

    function prepareFromOpen() {
      var card = S.card;
      clearTimeout(S.ghostTimer);
      panel.classList.add('is-morphing');
      if (S.mode === 'inline') {
        var hOpen = stage.offsetHeight;
        grid.classList.remove('is-hidden');
        panel.classList.add('is-floating');
        S.h0 = grid.offsetHeight;
        stage.style.height = hOpen + 'px';
        S.from = rectIn(card, stage);
      } else {
        S.from = rectIn(card, null);
      }
      S.rFrom = radiusOf(card);
      measureTo();
      buildFace(card);
      face.style.width = S.from.width + 'px';
      face.style.left = S.from.left + 'px';
      face.style.top = S.from.top + 'px';
      stage.classList.add('is-busy');
      showGhost();
      S.phase = 'moving';

      // карточка, в которую сворачиваемся, должна быть видна
      if (S.mode === 'inline') {
        var sr = stage.getBoundingClientRect(), hh = headerH();
        var cTop = sr.top + S.from.top, cBot = cTop + S.from.height;
        if (cTop < hh + 8 || cBot > window.innerHeight - 8) {
          window.scrollTo({
            top: window.pageYOffset + cTop - Math.max(hh + 16, (window.innerHeight - S.from.height) / 2),
            behavior: motionOff() ? 'auto' : 'smooth'
          });
        }
      }
    }

    /* ---------- кадр ---------- */
    function render(t) {
      var f = S.from, to = S.to;
      var x = lerp(f.left, to.left, t), y = lerp(f.top, to.top, t);
      var w = lerp(f.width, to.width, t), h = lerp(f.height, to.height, t);
      var r = Math.max(0, lerp(S.rFrom, S.rTo, t));
      var attrs = function (n, dx, dy, dw, dh, dr) {
        n.setAttribute('x', dx.toFixed(2)); n.setAttribute('y', dy.toFixed(2));
        n.setAttribute('width', Math.max(0, dw).toFixed(2)); n.setAttribute('height', Math.max(0, dh).toFixed(2));
        n.setAttribute('rx', Math.max(0, dr).toFixed(2));
      };
      attrs(gFill, x, y, w, h, r);
      attrs(gSheen, x, y, w, Math.min(h, 180), r);
      attrs(gStroke, x + .5, y + .5, w - 1, h - 1, r - .5);
      // в полноэкранном режиме рамка по краю экрана к концу не нужна
      gStroke.style.opacity = S.mode === 'sheet' ? (1 - clamp01((t - .55) / .45)).toFixed(3) : '';

      // содержимое панели видно только внутри растущей формы — ничего не
      // «вылезает» за её край, пока она ещё маленькая
      var ci = function (v) { return Math.max(0, v).toFixed(2) + 'px'; };
      panel.style.clipPath = 'inset(' + ci(y - to.top) + ' ' + ci(to.left + to.width - x - w) + ' ' +
        ci(to.top + to.height - y - h) + ' ' + ci(x - to.left) + ' round ' + r.toFixed(2) + 'px)';

      // «лицо» карточки едет вместе с левым верхним углом и быстро тает
      var fo = 1 - clamp01(t / .32);
      face.style.opacity = fo.toFixed(3);
      face.style.transform = 'translate(' + (x - f.left).toFixed(2) + 'px,' + (y - f.top).toFixed(2) + 'px)';

      // остальные карточки уходят в фон
      grid.style.opacity = (1 - (S.mode === 'sheet' ? .6 : 1) * clamp01(t / .45)).toFixed(3);

      if (S.mode === 'inline') stage.style.height = lerp(S.h0, S.h1, easeInOut(t)).toFixed(2) + 'px';

      // содержимое панели проявляется лесенкой, когда форма почти на месте
      var nodes = staggerNodes();
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!n) continue;
        var start = .58 + Math.min(i, 8) * .035;
        var p = easeOut(clamp01((t - start) / .28));
        n.style.opacity = p.toFixed(3);
        n.style.transform = p >= 1 ? '' : 'translate3d(0,' + ((1 - p) * 12).toFixed(2) + 'px,0)';
      }
    }

    /* ---------- устойчивые состояния ---------- */
    function settle() {
      stage.classList.remove('is-busy');
      if (S.target === 1) {
        S.phase = 'open';
        if (S.mode === 'inline') {
          grid.classList.add('is-hidden');
          panel.classList.remove('is-floating');
          stage.style.height = '';
        }
        panel.classList.remove('is-morphing');
        clearStagger();
        hideGhost();
        try { closeBtn.focus({ preventScroll: true }); } catch (e) {}
      } else {
        S.phase = 'closed';
        S.token++;
        var card = S.card;
        panel.hidden = true;
        panel.classList.remove('is-morphing', 'is-floating', 'is-leaving', 'is-sheet');
        clearStagger();
        grid.classList.remove('is-hidden');
        grid.style.opacity = '';
        stage.style.height = '';
        if (S.mode === 'sheet') lockScroll(false);
        if (card) {
          // карточка возвращается мгновенно (без своего transition opacity),
          // а призрак над ней плавно тает — без провала яркости
          card.style.transition = 'none';
          card.classList.remove('is-source');
          void card.offsetWidth;
          card.style.transition = '';
          card.removeAttribute('aria-expanded');
          if (S.lastWasKey) { try { card.focus({ preventScroll: true }); } catch (e) {} }
        }
        S.card = null;
        hideGhost();
        if (S.pending) {
          var next = S.pending; S.pending = null;
          requestAnimationFrame(function () { openTool(next); });
        }
      }
    }

    function animateTo(target) {
      S.target = target;
      panel.classList.toggle('is-leaving', target === 0);
      stage.classList.toggle('is-opening', target === 1);
      cancelAnimationFrame(S.raf);
      var t0 = S.t, dist = Math.abs(target - t0);
      var dur = motionOff() ? 0 : (target ? OPEN_MS : CLOSE_MS) * (.4 + .6 * dist);
      var start = 0;
      render(t0);
      function step(now) {
        if (!start) start = now;
        var k = dur ? clamp01((now - start) / dur) : 1;
        S.t = t0 + (target - t0) * easeOut(k);
        if (k >= 1) S.t = target;
        render(S.t);
        if (k < 1) S.raf = requestAnimationFrame(step);
        else { S.raf = 0; settle(); }
      }
      S.raf = requestAnimationFrame(step);
    }

    /* ---------- публичные действия ---------- */
    function openTool(card) {
      if (!TOOLS[card.getAttribute('data-tool')]) return;
      if (S.phase === 'closed') {
        prepareFromClosed(card);
        animateTo(1);
      } else if (S.phase === 'moving' && S.target === 0) {
        if (card === S.card) { S.pending = null; animateTo(1); }   // передумали закрывать
        else S.pending = card;                                    // откроем, как только свернётся
      }
    }

    function closeTool() {
      S.pending = null;
      if (S.phase === 'open') {
        prepareFromOpen();
        animateTo(0);
      } else if (S.phase === 'moving' && S.target === 1) {
        animateTo(0);                                             // передумали открывать
      }
    }

    grid.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var card = e.target.closest('.section-card[data-tool]');
      if (!card || !grid.contains(card)) return;
      e.preventDefault();
      S.lastWasKey = false;
      openTool(card);
    });

    grid.querySelectorAll('.section-card[data-tool]').forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target !== card) return;
          e.preventDefault();
          S.lastWasKey = true;
          openTool(card);
        }
      });
    });

    closeBtn.addEventListener('click', function (e) {
      S.lastWasKey = e.detail === 0;   // «клик» с клавиатуры — вернём фокус на карточку
      closeTool();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.phase !== 'closed' && S.target === 1) {
        S.lastWasKey = true;
        closeTool();
      }
    });

    // Клик мимо открытой панели (в режиме «на месте») — сворачиваем.
    // Не реагируем на ссылки/кнопки/поля и на шапку: у них своя работа.
    document.addEventListener('click', function (e) {
      if (S.phase === 'closed' || S.target !== 1 || S.mode !== 'inline') return;
      var t = e.target;
      if (!t || !t.closest || panel.contains(t) || grid.contains(t)) return;
      if (!document.documentElement.contains(t)) return;
      if (t.closest('a, button, input, textarea, select, label, [role="dialog"], .modal, #app-header')) return;
      S.lastWasKey = false;
      closeTool();
    });

    // Сменилась ширина окна, пока панель открыта: режим sheet/inline мог
    // перестать соответствовать экрану — тихо переключаем без анимации.
    if (mqSheet) {
      var onMq = function () {
        if (S.phase !== 'open') return;
        var want = mqSheet.matches ? 'sheet' : 'inline';
        if (want === S.mode) return;
        if (want === 'sheet') {
          grid.classList.remove('is-hidden');
          grid.style.opacity = '.4';
          toBody(); panel.classList.add('is-sheet'); lockScroll(true);
        } else {
          toStage(); panel.classList.remove('is-sheet'); lockScroll(false);
          grid.classList.add('is-hidden');
        }
        S.mode = want;
      };
      if (mqSheet.addEventListener) mqSheet.addEventListener('change', onMq);
      else if (mqSheet.addListener) mqSheet.addListener(onMq);
    }
  });
})();
