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
      build: function (body, onSettle) {
        skeletonGrid(body, 4);
        ensureFirestore().then(function (db) {
          return db.collection('forumArticles').orderBy('views', 'desc').limit(4).get();
        }).then(function (snap) {
          if (snap.empty) {
            body.innerHTML = '<p class="tool-empty">Пока нет статей — станьте первым, кто откроет обсуждение.</p>';
            onSettle && onSettle();
            return;
          }
          var items = [];
          snap.forEach(function (doc) {
            var a = doc.data();
            var views = a.views || 0;
            items.push(itemNode('👁', a.title || 'Без названия', views + (views === 1 ? ' просмотр' : ' просмотров'), '/forum/#article/' + doc.id));
          });
          renderGrid(body, items);
          onSettle && onSettle();
        }).catch(function () {
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

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var activeCard = null;
    var busy = false;

    function rectRelativeTo(node, base) {
      var r = node.getBoundingClientRect();
      var b = base.getBoundingClientRect();
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height };
    }

    function setGhostRect(r) {
      ghost.style.left = r.left + 'px';
      ghost.style.top = r.top + 'px';
      ghost.style.width = r.width + 'px';
      ghost.style.height = r.height + 'px';
    }

    function openTool(card) {
      if (busy || activeCard) return;
      var toolId = card.getAttribute('data-tool');
      var tool = TOOLS[toolId];
      if (!tool) return;
      busy = true;
      activeCard = card;

      var startRect = rectRelativeTo(card, stage);
      var accent = getComputedStyle(card).getPropertyValue('--tool-accent').trim();
      if (accent) { ghost.style.setProperty('--tool-accent', accent); panel.style.setProperty('--tool-accent', accent); }
      var accentSoft = getComputedStyle(card).getPropertyValue('--tool-accent-soft').trim();
      if (accentSoft) { ghost.style.setProperty('--tool-accent-soft', accentSoft); panel.style.setProperty('--tool-accent-soft', accentSoft); }

      setGhostRect(startRect);
      ghost.classList.add('is-on');
      card.setAttribute('aria-expanded', 'true');

      function finishExpand() {
        grid.classList.add('is-hidden');

        iconEl.innerHTML = ICONS[toolId] || '';
        titleEl.textContent = tool.title;
        descEl.textContent = tool.desc;
        ctaEl.textContent = tool.cta;
        ctaEl.href = tool.href;
        bodyEl.innerHTML = '';
        panel.hidden = false;
        panel.setAttribute('data-tool', toolId);

        tool.build(bodyEl, function () { matchGhostToPanel(); });

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            panel.classList.add('is-visible');
            matchGhostToPanel();
          });
        });

        function matchGhostToPanel() {
          var panelRect = rectRelativeTo(panel, stage);
          setGhostRect(panelRect);
        }

        setTimeout(function () {
          ghost.classList.remove('is-on');
          busy = false;
        }, reduceMotion ? 60 : 260);
      }

      if (reduceMotion) {
        setTimeout(finishExpand, 30);
      } else {
        requestAnimationFrame(function () {
          var fullRect = { left: 0, top: 0, width: stage.getBoundingClientRect().width, height: rectRelativeTo(grid, stage).height };
          setGhostRect(fullRect);
        });
        setTimeout(finishExpand, 500);
      }
    }

    function closeTool() {
      if (busy || !activeCard) return;
      busy = true;
      var card = activeCard;
      var toolId = panel.getAttribute('data-tool');

      var panelRect = rectRelativeTo(panel, stage);
      setGhostRect(panelRect);
      ghost.classList.add('is-on');

      panel.classList.remove('is-visible');
      panel.hidden = true;
      grid.classList.remove('is-hidden');
      card.removeAttribute('aria-expanded');

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var endRect = rectRelativeTo(card, stage);
          if (reduceMotion) {
            setGhostRect(endRect);
          } else {
            requestAnimationFrame(function () { setGhostRect(endRect); });
          }
        });
      });

      setTimeout(function () {
        ghost.classList.remove('is-on');
        activeCard = null;
        busy = false;
      }, reduceMotion ? 80 : 520);
    }

    grid.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var card = e.target.closest('.section-card[data-tool]');
      if (!card || !grid.contains(card)) return;
      e.preventDefault();
      openTool(card);
    });

    grid.querySelectorAll('.section-card[data-tool]').forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target !== card) return;
          e.preventDefault();
          openTool(card);
        }
      });
    });

    closeBtn.addEventListener('click', closeTool);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeCard) closeTool();
    });
  });
})();
