/* ============================================================================
   MathFrame — движок интерфейса и анимаций
   ----------------------------------------------------------------------------
   Автономный модуль: подключается ОДНОЙ строкой на любой странице и сам
   находит нужные элементы. Ничего не требует от разметки, ничего не ломает,
   если чего-то нет. Не зависит от common.js и порядка загрузки.

   Что делает:
     1. mfPlane      — вставляет слои подложки (сетка + WebGL-фон + виньетка)
     2. mfFlowField  — процедурный фон: изолинии скалярного поля, своё поле у
                       каждого раздела (uMode, см. PAGE_MOTIF). Интерактив общий
                       для всех разделов: «линза» у курсора/пальца (линии гуще
                       и ярче) и кольцевая волна от клика/тапа по пустому фону.
                       Плавное проявление (uFade), палитра раздела из
                       --page-color-*, отдельная «чернильная» палитра светлой
                       темы и перелив при смене темы на лету (stepPalette).
                       Поверх — 2D-слой раздела из mf-backgrounds.js (формулы
                       и фигуры главной, построения, графики, граф, нейросеть);
                       грузится сам, через MathFrameUI.bg.
     3. mfTracers    — частицы в hero главной: плывут вдоль тех же линий тока
                       (скорость = conj f′(z)), цвет и яркость — как у изолиний,
                       волна от клика их расталкивает (Canvas2D)
     4. mfCards      — курсорная подсветка + мягкий 3D-наклон карточек
     5. mfRipple     — «локус» от клика по кнопкам
     6. mfNav        — скользящий индикатор активного раздела в шапке
     7. mfReveal     — появление блоков при прокрутке (со сдвигом по очереди)
     8. mfPerf       — авто-деградация на слабых устройствах (html.mf-lite)

   Все анимации уважают prefers-reduced-motion и останавливаются, когда вкладка
   не видна (никакого фонового расхода батареи).
   ========================================================================== */
(function () {
  'use strict';

  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* ------------------------------------------------------- переключатель
     анимаций из настроек (см. common.js — «Анимации» в модалке настроек).
     Отдельно от system prefers-reduced-motion: пользователь мог явно
     выключить украшательство на сайте, даже если ОС ничего не просит.
     Применяем класс максимально рано (здесь, а не в common.js), потому что
     mathframe-ui.js — самый первый подключаемый скрипт и сам решает, крутить
     ли WebGL-фон/трассеры/наклон карточек. */
  try {
    if (localStorage.getItem('mf-motion') === 'off') {
      document.documentElement.classList.add('mf-no-motion');
    }
  } catch (e) {}
  function motionOff() {
    return reduced || document.documentElement.classList.contains('mf-no-motion');
  }

  /* ---------------------------------------------------------------- helpers */
  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  // Токены читаем с body: палитра раздела задана на <body data-page>, не на <html>
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.body || document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  // '#rrggbb' | 'rgb(...)' -> [r,g,b] в 0..1
  function toRGB(str, fallback) {
    if (!str) return fallback;
    str = String(str).trim();
    var m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    m = str.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      var p = m[1].split(',').map(parseFloat);
      if (p.length >= 3) return [p[0] / 255, p[1] / 255, p[2] / 255];
    }
    return fallback;
  }
  // Тема сайта: класс .light на <html> (ставит common.js; без класса — тёмная)
  function isLight() { return document.documentElement.classList.contains('light'); }
  function pageName() {
    var b = document.body, h = document.documentElement;
    return (b && b.dataset.page) || (h && h.dataset.page) || 'home';
  }

  /* ------------------------------------------------------- прокрутка фона
     Фон «нарисован на странице»: canvas остаётся fixed размером с окно, но
     шейдер и 2D-слои получают текущую прокрутку и сдвигают свои мировые
     координаты. Обычно прокручивается окно; на страницах-приложениях (AI-агент:
     лента чата) окно не скроллится — тогда фон привязывается к самому
     крупному прокручиваемому контейнеру (узнаём о нём по событию scroll, в
     фазе перехвата). Узкие панели (дерево тем, список чатов) не считаются.
     PF_FIELD — скорость поля относительно контента (лёгкий параллакс глубины). */
  var PF_FIELD = 0.9;
  var SCR = { el: null, area: 0, y: 0, h: 1, vh: 1 };
  function winScrollable() {
    var de = document.scrollingElement || document.documentElement;
    return de.scrollHeight > (window.innerHeight || 0) + 2;
  }
  try {
    document.addEventListener('scroll', function (e) {
      var t = e.target;
      if (!t || t === document || t === document.documentElement || t === document.body ||
          !t.getBoundingClientRect) return;
      var r = t.getBoundingClientRect(), a = r.width * r.height;
      if (a < (window.innerWidth || 1) * (window.innerHeight || 1) * 0.2) return;
      if (winScrollable()) return;
      if (!SCR.el || !SCR.el.isConnected || a > SCR.area * 0.9) { SCR.el = t; SCR.area = a; }
    }, { capture: true, passive: true });
  } catch (e) {}
  function readScroll() {
    var vh = window.innerHeight || 1, de = document.scrollingElement || document.documentElement;
    var el = SCR.el;
    if (el && (!el.isConnected || winScrollable())) { el = SCR.el = null; }
    if (el) {
      SCR.y = el.scrollTop || 0;
      SCR.h = Math.max(vh, el.scrollHeight - el.clientHeight + vh);
    } else {
      SCR.y = window.scrollY || de.scrollTop || 0;
      SCR.h = Math.max(vh, de.scrollHeight || vh);
    }
    SCR.vh = vh;
    return SCR;
  }

  /* Палитра фона — общая для шейдера, трассеров и 2D-слоёв (mf-backgrounds.js).
       tgt — целевые цвета текущей темы: перечитываются при смене темы, а не на
             каждом кадре (getComputedStyle в цикле дорог);
       a/b/c/ink/dark — то, что рисуется сейчас: плавно догоняет tgt (stepPalette),
             поэтому смена темы на лету — мягкий перелив без скачка.
     a   — цвет раздела (--page-color-<раздел>, тот же, что в топбаре);
     b,c — вторичный и акцентный тона раздела (PAGE_MOTIF.pal, иначе --accent-2/3);
     ink — «чернила» светлой темы: тонкие тёмные линии вместо светящихся;
     dark — 1 тёмная тема, 0 светлая (промежуточные значения — во время перехода). */
  var palette = { a: [0.36,0.55,1.00], b: [0.34,0.86,0.78], c: [0.95,0.71,0.36],
                  ink: [0.10,0.14,0.25], dark: 1, light: false, tgt: null, ver: 0 };
  function readPalette() {
    var light = isLight(), name = pageName();
    var m = (typeof PAGE_MOTIF !== 'undefined' && (PAGE_MOTIF[name] || PAGE_MOTIF.home)) || {};
    var pal = (m.pal && (light ? m.pal.light : m.pal.dark)) || {};
    palette.light = light;
    palette.tgt = {
      a:   toRGB(cssVar('--page-color-' + name, '') || cssVar('--accent', ''),
                 light ? [0.18,0.37,0.88] : [0.36,0.55,1.00]),
      b:   toRGB(pal.b || cssVar('--accent-2', ''), [0.34,0.86,0.78]),
      c:   toRGB(pal.c || cssVar('--accent-3', ''), [0.95,0.71,0.36]),
      ink: toRGB(pal.ink || '', light ? [0.10,0.14,0.25] : [0.82,0.87,0.96]),
      dark: light ? 0 : 1
    };
    palette.ver++;
  }
  function snapPalette() {
    var t = palette.tgt; if (!t) return;
    palette.a = t.a.slice(); palette.b = t.b.slice(); palette.c = t.c.slice();
    palette.ink = t.ink.slice(); palette.dark = t.dark;
  }
  // экспоненциальное догоняние: ~0.7 с на полный переход темы
  function stepPalette(dt) {
    var t = palette.tgt; if (!t) return;
    var k = 1 - Math.exp(-dt * 5.0), keys = ['a', 'b', 'c', 'ink'];
    for (var j = 0; j < 4; j++) {
      var cur = palette[keys[j]], to = t[keys[j]];
      for (var i = 0; i < 3; i++) cur[i] += (to[i] - cur[i]) * k;
    }
    palette.dark += (t.dark - palette.dark) * k;
    if (Math.abs(t.dark - palette.dark) < 0.002) palette.dark = t.dark;
  }
  // Тот же цвет, что у изолинии в этой точке (см. col в шейдере):
  // тёмная тема — светящийся акцент, светлая — «чернила» с оттенком акцента
  function fieldColor(spd, out) {
    var A = palette.a, B = palette.b, C = palette.c, K = palette.ink, D = palette.dark;
    var s = Math.max(0, Math.min(1, spd));
    var u = s < 0.55 ? 0 : (s - 0.55) / 0.45; u = u * u * (3 - 2 * u) * 0.55;
    for (var i = 0; i < 3; i++) {
      var v = A[i] + (B[i] - A[i]) * s;
      var dk = v + (C[i] - v) * u, lt = K[i] + (v - K[i]) * 0.40;
      out[i] = Math.round((lt + (dk - lt) * D) * 255);
    }
    return out;
  }

  /* --------------------------------------------------------------- 8. mfPerf
     Два уровня:
       • статический (detectLite): мало ядер / мало памяти / экономия трафика —
         html.mf-lite, WebGL-фон не запускаем вовсе. Телефон сам по себе больше
         НЕ lite: он получает фон с пониженным разрешением (MOBILE) и класс
         html.mf-mobile (без backdrop-filter);
       • динамический (perfTick): считаем реальный FPS фона и ступенчато
         снижаем качество — разрешение WebGL 1 → 0.75 → 0.55, затем кадр через
         кадр, и лишь в крайнем случае плавно гасим WebGL (html.mf-lite). */
  var MOBILE = false;
  try {
    MOBILE = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
  } catch (e) {}
  function detectLite() {
    var lite = false;
    try {
      var cores = navigator.hardwareConcurrency || 8;
      if (cores <= 3) lite = true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 2) lite = true;
      if (MOBILE && cores <= 4 && window.innerWidth < 620) lite = true;
      if (navigator.connection && navigator.connection.saveData) lite = true;
    } catch (e) {}
    if (lite) document.documentElement.classList.add('mf-lite');
    if (MOBILE) document.documentElement.classList.add('mf-mobile');
    return lite;
  }

  var perf = { level: 0, scale: 1, skip: false, acc: 0, n: 0, since: 0, off: false };
  // dtRaw — реальный интервал кадра в мс; now — performance.now()
  function perfTick(dtRaw, now, onOff) {
    if (perf.off) return;
    if (!perf.since) perf.since = now + 3000;        // первые 3 с — загрузка, не судим
    if (now < perf.since || dtRaw > 250) return;     // скрытая вкладка/разовый фриз
    perf.acc += dtRaw; perf.n++;
    if (perf.n < 90) return;
    var avg = perf.acc / perf.n;
    perf.acc = 0; perf.n = 0;
    // 30 Гц-режим (энергосбережение iOS) — не повод гасить всё: крайний шаг
    // только при реальных ~20 fps и хуже
    var slow = perf.level < 3 ? avg > 22 : avg > 45;
    if (!slow) return;
    perf.level++;
    perf.since = now + 1500;                          // дать новому режиму устояться
    if (perf.level === 1) perf.scale = 0.75;
    else if (perf.level === 2) perf.scale = 0.55;
    else if (perf.level === 3) perf.skip = true;
    else { perf.off = true; if (onOff) onOff(); }
  }

  /* ------------------------------------------------------- общее поле потока
     Одна и та же математика используется и в шейдере, и в JS-трассерах,
     поэтому картинка на обоих слоях согласована.
       f(z) = z + Σ aₖ / (z − pₖ)
     Im f — функция тока; её изолинии и есть линии тока, а скорость течения
     вдоль них — conj f′(z). По ней и двигаются трассеры. */
  var FlowMath = {
    // комплексное деление a/b
    cdiv: function (ax, ay, bx, by, out) {
      var d = bx * bx + by * by + 1e-6;
      out[0] = (ax * bx + ay * by) / d;
      out[1] = (ay * bx - ax * by) / d;
      return out;
    },
    sing: function (t, mx, my) {
      return [
        { x: Math.cos(t * 0.90) * 0.95, y: Math.sin(t * 0.70) * 0.95, ax: 0.30, ay: 0.11 },
        { x: Math.cos(t * 0.60 + 2.1) * 1.15, y: Math.sin(t * 1.10 + 1.3) * 1.15, ax: -0.24, ay: 0.15 },
        { x: mx, y: my, ax: 0.18, ay: 0.22 }
      ];
    },
    // возвращает [fx, fy]
    eval: function (px, py, S, out) {
      var fx = px, fy = py, tmp = [0, 0];
      for (var i = 0; i < S.length; i++) {
        var s = S[i];
        FlowMath.cdiv(s.ax, s.ay, px - s.x, py - s.y, tmp);
        fx += tmp[0]; fy += tmp[1];
      }
      out[0] = fx; out[1] = fy;
      return out;
    },
    // скорость (Re f′, −Im f′), f′(z) = 1 − Σ aₖ/(z − pₖ)²;
    // out[2] — квадрат расстояния до ближайшей особенности
    vel: function (px, py, S, out) {
      var gx = 1, gy = 0, tmp = [0, 0], near = 1e9;
      for (var i = 0; i < S.length; i++) {
        var s = S[i], wx = px - s.x, wy = py - s.y;
        near = Math.min(near, wx * wx + wy * wy);
        FlowMath.cdiv(s.ax, s.ay, wx * wx - wy * wy, 2 * wx * wy, tmp);
        gx -= tmp[0]; gy -= tmp[1];
      }
      out[0] = gx; out[1] = -gy; out[2] = near;
      return out;
    }
  };

  // Время жизни и скорость кольца от клика — общие для шейдера и трассеров
  var PULSE_LIFE = 1.8, PULSE_SPEED = 1.7, PULSE_MAX = 4;

  /* ---------------------------------------------------------------- 1. слои */
  function buildPlane() {
    if (document.querySelector('.mf-plane')) return;
    var frag = document.createDocumentFragment();
    el('div', 'mf-plane', frag);
    var cv = el('canvas', null, frag);
    cv.id = 'mf-canvas';
    el('div', 'mf-vignette', frag);
    // вставляем самым первым, чтобы всё остальное было выше по z-index
    document.body.insertBefore(frag, document.body.firstChild);
  }

  /* ----------------------------------------------------------- 2. mfFlowField
     WebGL-фон. Полноэкранный квад, один фрагментный шейдер, без геометрии —
     стоит дёшево даже на встроенной графике. Толщина изолиний удерживается
     постоянной в пикселях через численную оценку |∇ψ| (по двум доп. выборкам),
     поэтому НЕ требуется расширение OES_standard_derivatives — работает
     одинаково и в WebGL1, и в WebGL2. */
  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  /* Фрагментный шейдер.
     ОДИН движок — РАЗНАЯ математика на разных разделах сайта (uMode).
     Приём рисования одинаков везде (изолинии скалярного поля постоянной
     толщины), а само поле у каждого раздела своё. FIELD возвращает ТРИ
     скалярных поля (x, y, z — три семейства линий) и их веса w (где семейство
     видно). z-семейство рисуется акцентным цветом C.
       0 — линии тока потенциального течения (главная); курсор — диполь.
           Поверх — плавающие формулы и фигуры (mf-backgrounds.js)
       1 — «чертёж» (справочник): у нескольких центров-построений концентрические
           дуги циркуля (x) и лучи транспортира (y), через весь экран — длинные
           линии линейки (z). Курсор — ещё один циркуль, «раскрывающийся» при
           наведении
       2 — «связи» (форум): биполярные координаты пар узлов — дуги-окружности,
           соединяющие узлы (y, z), и ореолы Аполлония вокруг них (x). Курсор
           притягивает средний узел — «подключается к разговору»
       3 — «графики» (мини-сервисы): два пучка кривых y = f(x) (y, z) и
           вертикальная штриховка суммы Римана под первой кривой (x). Кривая
           тянется пройти через курсор
       4 — фигуры Хладни (песочница); курсор — рябь
       5 — рельеф функции потерь (AI-агент); курсор — «зонд», продавливающий
           локальный минимум. Поверх — нейросеть с сигналами (mf-backgrounds.js)
       6 — динамическая решётка ячеек (админка); курсор — впадина
     Общее для всех режимов (warp + яркость в main):
       uPtr.z  — присутствие мыши/пальца 0..1: «линза» у курсора сжимает поле
                 (линии гуще) и подсвечивает их;
       uPulse  — до 4 колец от кликов: xy — центр, z — возраст в секундах
                 (<0 — слот пуст). Кольцо расходится и сдвигает поле радиально;
       uFade   — проявление при загрузке 0..1: яркость, толщина и лёгкий «наезд»
                 масштаба нарастают вместе — без скачка;
       uDark   — 1 тёмная тема, 0 светлая (плавно во время смены темы). В светлой
                 линии — тонкие «чернила» uInk с оттенком акцента, без свечения. */
  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform vec3  uPtr;',
    'uniform vec4  uPulse[4];',
    'uniform vec3  uColA;',
    'uniform vec3  uColB;',
    'uniform vec3  uColC;',
    'uniform vec3  uInk;',
    'uniform float uDark;',
    'uniform float uFade;',
    'uniform float uGain;',
    'uniform int   uMode;',
    'uniform vec3  uDraw;',
    'uniform float uScroll;',   // прокрутка в единицах поля (× PF_FIELD)
    'uniform vec4  uCalm;',     // «тихий» прямоугольник (колонка текста), px холста
    'uniform vec2  uCalmK;',    // x — яркость внутри него, y — мягкость края, px
    '',
    'const float PLIFE = ' + PULSE_LIFE.toFixed(2) + ';',
    'const float PSPD  = ' + PULSE_SPEED.toFixed(2) + ';',
    'const float TAU   = 6.2831853;',
    'vec2 EXT;',   // полуразмеры экрана в единицах поля (задаётся в main)
    'float gT;',   // время ячейки мира (см. LINES)
    'vec2  gM;',   // курсор в локальных координатах ячейки
    '',
    'vec2 cdiv(vec2 a, vec2 b){ float d = dot(b,b) + 1e-6;',
    '  return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / d; }',
    'vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }',
    'float gs(vec2 d, float k){ return exp(-dot(d,d) * k); }',
    'float ang(vec2 v){ return atan(v.y, v.x + 1e-6); }',
    '',
    'vec3 FIELD(vec2 p, out vec3 w){',
    '  float t = gT * 0.055;',
    '  vec2 dm = p - gM;',
    '  w = vec3(1.0);',
    '  if (uMode == 0) {',
    '    vec2 s1 = vec2(cos(t*0.90), sin(t*0.70)) * 0.95;',
    '    vec2 s2 = vec2(cos(t*0.60+2.1), sin(t*1.10+1.3)) * 1.15;',
    '    vec2 f = p;',
    '    f += cdiv(vec2( 0.30,  0.11), p - s1);',
    '    f += cdiv(vec2(-0.24,  0.15), p - s2);',
    '    f += cdiv(vec2( 0.18,  0.22), dm);',
    '    return vec3(f, 0.0);',
    '  } else if (uMode == 1) {',
    '    vec2 c1 = EXT * vec2(-0.62 + 0.10*sin(t*0.8),     0.32 + 0.12*cos(t*0.6));',
    '    vec2 c2 = EXT * vec2( 0.64 + 0.08*cos(t*0.7+1.0), -0.30 + 0.14*sin(t*0.5+2.0));',
    '    vec2 c3 = EXT * vec2( 0.08 + 0.30*sin(t*0.35+4.0), -0.88 + 0.05*cos(t*0.3));',
    '    vec2 v = p - c1; float d = length(v);',
    '    vec2 v2 = p - c2; float d2 = length(v2);',
    '    if (d2 < d) { v = v2; d = d2; }',
    '    v2 = p - c3; d2 = length(v2);',
    '    if (d2 < d) { v = v2; d = d2; }',
    '    float dc = length(dm) * (1.0 + 2.5 * (1.0 - uPtr.z));',
    '    if (uPtr.z > 0.03 && dc < d) { v = dm; d = dc; }',
    '    float a = 0.55 + t * 0.35;',
    '    w = vec3(1.0 - smoothstep(0.45, 1.9, d),',
    '             (1.0 - smoothstep(0.25, 1.15, d)) * 0.55,',
    '             0.50);',
    '    return vec3(d * 0.55 - gT * 0.010,',
    '                ang(v) * (24.0 / TAU) / 7.0 + t * 0.15,',
    '                dot(p, vec2(cos(a), sin(a))) * 0.16);',
    '  } else if (uMode == 2) {',
    '    vec2 s1 = EXT * vec2(-0.55 + 0.14*sin(t*0.9),     0.30 + 0.16*cos(t*0.7));',
    '    vec2 s2 = EXT * vec2( 0.52 + 0.12*cos(t*0.6+1.0), 0.18 + 0.20*sin(t*0.8+2.0));',
    '    vec2 s3 = EXT * vec2( 0.06 + 0.26*sin(t*0.5+3.0), -0.62 + 0.10*cos(t*0.9));',
    '    s2 = mix(s2, gM, 0.35 * uPtr.z);',
    '    vec2 v1 = p - s1, v2 = p - s2, v3 = p - s3;',
    '    float d1 = length(v1), d2 = length(v2), d3 = length(v3);',
    '    float m12 = min(d1, d2);',
    '    w = vec3(0.45 * exp(-m12 * m12 * 0.9),',
    '             exp(-(d1 + d2 - length(s1 - s2)) * 0.9),',
    '             exp(-(d2 + d3 - length(s2 - s3)) * 0.9) * 0.85);',
    '    return vec3(log((d1 + 1e-3) / (d2 + 1e-3)) * 0.30,',
    '                (ang(v1) - ang(v2)) * (12.0 / TAU) / 7.0,',
    '                (ang(v2) - ang(v3)) * (10.0 / TAU) / 7.0);',
    '  } else if (uMode == 3) {',
    '    float T = gT * 0.10;',
    '    float b1 = 0.28 * EXT.y;',
    '    float h1 = 0.42*sin(0.85*p.x + T) + 0.16*sin(2.2*p.x - 1.3*T) + b1;',
    '    float hm = 0.42*sin(0.85*gM.x + T) + 0.16*sin(2.2*gM.x - 1.3*T) + b1;',
    '    h1 += (gM.y - hm) * 0.9 * uPtr.z * gs(vec2(p.x - gM.x, 0.0), 1.6)',
    '        * gs(vec2(0.0, gM.y - hm), 0.9);',
    '    float h2 = -0.42*EXT.y + 0.55*cos(0.62*p.x - 0.8*T) * exp(-0.045*p.x*p.x)',
    '             + 0.10*sin(3.1*p.x + 1.7*T);',
    '    float lo = min(0.0, h1), hi = max(0.0, h1);',
    '    float inR = smoothstep(lo, lo + 0.05, p.y) * (1.0 - smoothstep(hi - 0.05, hi, p.y));',
    '    float e1 = p.y - h1, e2 = p.y - h2;',
    '    w = vec3(0.42 * inR, exp(-e1*e1*9.0), exp(-e2*e2*9.0) * 0.9);',
    '    return vec3(p.x * 0.55, e1 * 0.8, e2 * 0.8);',
    '  } else if (uMode == 5) {',
    '    float u = t * 1.6;',
    '    vec2 c1 = vec2(cos(u*0.70), sin(u*0.50)) * 1.15;',
    '    vec2 c2 = vec2(cos(u*0.45+2.2), sin(u*0.65+0.9)) * 1.35;',
    '    vec2 c3 = vec2(cos(u*0.55+4.1), sin(u*0.40+2.7)) * 1.05;',
    '    vec2 c4 = vec2(cos(u*0.35+1.0), sin(u*0.75+4.4)) * 1.70;',
    '    float L = 0.045 * dot(p, p)',
    '            - 0.95 * gs(p - c1, 1.1) - 0.70 * gs(p - c2, 1.6)',
    '            + 0.60 * gs(p - c3, 1.3) + 0.45 * gs(p - c4, 2.0)',
    '            + 0.10 * sin(p.x * 1.3 + u) * cos(p.y * 1.1 - u * 0.7)',
    '            - 0.50 * gs(dm, 3.0) * (0.3 + 0.7 * uPtr.z);',
    '    return vec3(L, L, 0.0) * 1.15;',
    '  } else if (uMode == 6) {',
    '    vec2 g = p * 1.6;',
    '    vec2 id = floor(g); vec2 fr = fract(g) - 0.5;',
    '    float d = 1e9;',
    '    for (int j = -1; j <= 1; j++) {',
    '      for (int i = -1; i <= 1; i++) {',
    '        vec2 o = vec2(float(i), float(j));',
    '        vec2 q = id + o;',
    '        vec2 jt = 0.35 * vec2(sin(t*1.3 + q.x*2.1 + q.y*1.7),',
    '                              cos(t*1.1 + q.x*1.3 - q.y*2.3));',
    '        d = min(d, length(fr - o - jt));',
    '      }',
    '    }',
    '    float m = d * 1.6 - 0.40 * gs(dm, 2.2);',
    '    return vec3(m, m, 0.0);',
    '  }',
    '  float n  = 3.0 + 1.5 * sin(t * 0.35);',
    '  float m2 = 2.0 + 1.5 * cos(t * 0.27);',
    '  float s  = 1.1;',
    '  float ch = sin(n*3.14159*p.x*s) * sin(m2*3.14159*p.y*s)',
    '           - sin(m2*3.14159*p.x*s) * sin(n*3.14159*p.y*s);',
    '  ch += 0.45 * gs(dm, 1.4) * sin(length(dm) * 9.0 - gT * 1.2);',
    '  return vec3(ch, ch, 0.0);',
    '}',
    '',
    // Общий для всех режимов сдвиг координат: линза у курсора (раздвигает
    // окрестность — в неё попадает больше линий) и кольца от кликов.
    'vec2 warp(vec2 p){',
    '  vec2 d = p - uMouse;',
    '  vec2 q = p + d * gs(d, 1.6) * 0.38 * uPtr.z;',
    '  for (int i = 0; i < 4; i++) {',
    '    vec4 P = uPulse[i];',
    '    if (P.z < 0.0) continue;',
    '    float env = 1.0 - P.z / PLIFE; env *= env;',
    '    vec2 v = p - P.xy; float r = length(v) + 1e-4;',
    '    float x = (r - P.z * PSPD) / 0.24;',
    '    q += v / r * exp(-x*x) * env * 0.20;',
    '  }',
    '  return q;',
    '}',
    '',
    // Изолинии одной «ячейки мира». Фон прокручивается вместе со страницей:
    // мировая плоскость по вертикали разбита на ячейки высотой P (~1.25 экрана),
    // у каждой — своё время (gT) и зеркальное отражение через одну, поэтому
    // поле не повторяется и не «кончается» внизу длинной страницы. a, ax, ay —
    // точка и две соседние (для оценки градиента) в мировых координатах.
    // Возвращает (линии x/y, линии z, «скорость» для цвета, f.y для пульсации).
    'vec4 LINES(vec2 a, vec2 ax, vec2 ay, float k, float P, float lw){',
    '  float fl = mod(k, 2.0) > 0.5 ? -1.0 : 1.0;',
    '  vec2 o = vec2(0.0, k * P), m = vec2(fl, 1.0);',
    '  gT = uTime + k * 53.0;',
    '  gM = (uMouse - vec2(0.0, uScroll) - o) * m;',
    '  vec3 W, Wd;',
    '  vec3 f0 = FIELD((a - o) * m, W);',
    '  vec3 fx = FIELD((ax - o) * m, Wd) - f0;',
    '  vec3 fy = FIELD((ay - o) * m, Wd) - f0;',
    '  float kk = 7.0;',
    '  vec3 g  = vec3(length(vec2(fx.x, fy.x)), length(vec2(fx.y, fy.y)),',
    '                 length(vec2(fx.z, fy.z))) * kk;',
    '  vec3 dd = abs(fract(f0 * kk + 0.5) - 0.5);',
    '  vec3 l = vec3(1.0) - smoothstep(vec3(0.0), g * lw + 1e-5, dd);',
    // линии гуще ~3 px сливаются в муар/пятно (у особенностей поля) — гасим
    '  l *= vec3(1.0) - smoothstep(vec3(0.12), vec3(0.30), g);',
    '  l *= uDraw * W;',
    '  return vec4(max(l.x, l.y), l.z, clamp(length(f0.xy) * 0.42, 0.0, 1.0), f0.y);',
    '}',
    '',
    'void main(){',
    '  float mn = min(uRes.x, uRes.y);',
    '  EXT = 0.5 * uRes / mn * 2.7;',
    '  float fe = uFade;',
    // проявление: поле «собирается» из чуть большего масштаба
    '  float zoom = 1.0 + 0.08 * (1.0 - fe);',
    '  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / mn * 2.7 * zoom;',
    '',
    // Толщина изолиний держится постоянной в ПИКСЕЛЯХ за счёт численной оценки
    // градиента (две доп. выборки). Поэтому не нужен OES_standard_derivatives —
    // шейдер одинаково работает в WebGL1 и WebGL2.
    // Линза и кольца — в координатах экрана (warp), затем сдвиг на прокрутку:
    // дальше всё считается в мировых координатах страницы.
    '  float e  = 2.7 * zoom / mn;',
    '  vec2 sc = vec2(0.0, uScroll);',
    '  vec2 w0 = warp(p) - sc;',
    '  vec2 wx = warp(p + vec2(e, 0.0)) - sc;',
    '  vec2 wy = warp(p + vec2(0.0, e)) - sc;',
    // в светлой теме линии тоньше: тёмная линия на белом читается сильнее
    '  float lw = mix(1.05, 1.4, uDark) * (0.6 + 0.4 * fe);',
    '  vec4 L;',
    // решётка (6) и Хладни (4) и так бесконечны и однородны — без ячеек
    '  if (uMode == 4 || uMode == 6) {',
    '    L = LINES(w0, wx, wy, 0.0, 1.0, lw);',
    '  } else {',
    // на стыке ячеек — плавный перелив двух соседних (с обеих сторон
    // границы вес ровно 0.5, поэтому шва нет)
    '    float P = 2.5 * EXT.y;',
    '    float k = floor(w0.y / P + 0.5);',
    '    float ly = w0.y - k * P;',
    '    float tb = smoothstep(0.34 * P, 0.5 * P, abs(ly)) * 0.5;',
    '    L = LINES(w0, wx, wy, k, P, lw);',
    '    if (tb > 0.002) L = mix(L, LINES(w0, wx, wy, k + (ly > 0.0 ? 1.0 : -1.0), P, lw), tb);',
    '  }',
    '  float line = L.x;',
    '  float lz = L.y;',
    '',
    '  float spd = L.z;',
    '  vec3 acc = mix(uColA, uColB, spd);',
    '  vec3 cDk = mix(acc, uColC, smoothstep(0.55, 1.0, spd) * 0.55);',
    '  vec3 cLt = mix(uInk, acc, 0.40);',
    '  vec3 col = mix(cLt, cDk, uDark);',
    '  vec3 zc  = mix(mix(uInk, uColC, 0.55), uColC, uDark);',
    '  col = mix(col, zc, lz / (line + lz + 1e-4));',
    '  float a0 = max(line, lz);',
    '',
    '  vec2  dm   = p - uMouse;',
    '  float lens = gs(dm, 1.6) * uPtr.z;',
    '  float ring = 0.0;',
    '  for (int i = 0; i < 4; i++) {',
    '    vec4 P = uPulse[i];',
    '    if (P.z < 0.0) continue;',
    '    float env = 1.0 - P.z / PLIFE; env *= env;',
    '    float x = (length(p - P.xy) - P.z * PSPD) / 0.30;',
    '    ring = max(ring, exp(-x*x) * env);',
    '  }',
    '  col = mix(col, mix(mix(uInk, uColB, 0.6), uColB, uDark), ring * 0.45);',
    '',
    '  float r    = length((gl_FragCoord.xy - 0.5*uRes) / mn);',
    '  float edge = 1.0 - 0.8 * smoothstep(0.35, 1.2, r);',
    '  edge = max(edge, max(lens, ring) * 0.85);',
    '  float puls = 0.88 + 0.12 * sin(uTime * 0.5 + L.w * 2.0);',
    '',
    '  float base = mix(0.22, 0.34, uDark) * uGain;',
    '  float a = a0 * edge * puls * base',
    '          * (1.0 + mix(0.7, 1.0, uDark) * lens + mix(1.3, 2.2, uDark) * ring);',
    // «тихая» зона за колонкой текста (справочник): поле там заметно слабее
    '  if (uCalm.z > uCalm.x) {',
    '    vec2 fc = gl_FragCoord.xy; float s = uCalmK.y;',
    '    float cm = smoothstep(uCalm.x - s, uCalm.x + s, fc.x) * (1.0 - smoothstep(uCalm.z - s, uCalm.z + s, fc.x))',
    '             * smoothstep(uCalm.y - s, uCalm.y + s, fc.y) * (1.0 - smoothstep(uCalm.w - s, uCalm.w + s, fc.y));',
    '    a *= mix(1.0, uCalmK.x, cm);',
    '  }',
    '  gl_FragColor = vec4(col, a * fe);',
    '}'
  ].join('\n');

  /* Соответствие «раздел сайта → мотив фона».
     Раздел берётся из <body data-page="..."> (или html), режим можно
     переопределить вручную через data-mf-mode.
       draw — веса трёх семейств линий (x, y, z), gain — общая яркость (мотивы
       с плотной сеткой приглушены, чтобы «плотность» фона была ровной);
       pal  — вторичный (b) и акцентный (c) тона раздела и «чернила» (ink)
       светлой темы. Основной цвет (a) — всегда --page-color-<раздел> из
       common.css, тот же, что у раздела в топбаре. Если захочется сменить
       палитру раздела — править здесь (b/c/ink) и --page-color-* в common.css;
       overlay — есть ли у раздела 2D-слой поверх (mf-backgrounds.js). */
  var PAGE_MOTIF = {
    home:       { mode: 0, draw: [0, 1, 0], gain: 1.0, overlay: true,
                  pal: { dark:  { b: '#56dcc8', c: '#f2b45c' },
                         light: { b: '#0f8f80', c: '#b86e0e', ink: '#172340' } } },
    // справочник — страница для чтения: поле тише в целом, а за колонкой
    // темы (calm.sel) — ещё в calm.k раз; то же и для 2D-слоя (api.calmAt)
    reference:  { mode: 1, draw: [1, 1, 1], gain: 0.62, overlay: true,
                  calm: { sel: '#sprContent, .spr-content', k: 0.38 },
                  pal: { dark:  { b: '#59c8ff', c: '#f2b45c' },
                         light: { b: '#1a6fb0', c: '#a8620c', ink: '#1c1d48' } } },
    forum:      { mode: 2, draw: [1, 1, 1], gain: 0.9, overlay: true,
                  pal: { dark:  { b: '#7ee3b0', c: '#ffb066' },
                         light: { b: '#128a60', c: '#b35d12', ink: '#0f2738' } } },
    services:   { mode: 3, draw: [1, 1, 1], gain: 0.95, overlay: true,
                  pal: { dark:  { b: '#7cd2ff', c: '#f2c05c' },
                         light: { b: '#1a6fb0', c: '#a2670a', ink: '#10302a' } } },
    admin:      { mode: 6, draw: [0, 1, 0], gain: 0.82 },
    playground: { mode: 4, draw: [0, 1, 0], gain: 1.0 },
    'ai-agent': { mode: 5, draw: [0, 1, 0], gain: 1.0, overlay: true,
                  pal: { dark:  { b: '#5cc8ff', c: '#e98cff' },
                         light: { b: '#1672b8', c: '#9a2f98', ink: '#211a40' } } }
  };
  function currentMotif() {
    var b = document.body, h = document.documentElement;
    var m = PAGE_MOTIF[pageName()] || PAGE_MOTIF.home;
    var forced = (b && b.dataset.mfMode) || (h && h.dataset.mfMode);
    if (forced !== undefined && forced !== '') {
      var n = parseInt(forced, 10);
      if (!isNaN(n)) return { mode: n, draw: (n === 1 || n === 2 || n === 3) ? [1, 1, 1] : [0, 1, 0], gain: 1 };
    }
    return m;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      try { console.warn('[MathFrame] shader:', gl.getShaderInfoLog(s)); } catch (e) {}
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initFlowField(lite) {
    var cv = document.getElementById('mf-canvas');
    if (!cv || reduced || lite) return null;

    var gl = null;
    try {
      var opts = { alpha: true, antialias: false, depth: false, stencil: false,
                   premultipliedAlpha: false, powerPreference: 'low-power' };
      gl = cv.getContext('webgl2', opts) || cv.getContext('webgl', opts) ||
           cv.getContext('experimental-webgl', opts);
    } catch (e) {}
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes','uTime','uMouse','uPtr','uColA','uColB','uColC','uInk','uDark','uFade','uGain',
     'uMode','uDraw','uScroll','uCalm','uCalmK'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    U.uPulse = gl.getUniformLocation(prog, 'uPulse[0]');

    // Смешивание НЕ нужно: один полноэкранный проход по прозрачному буферу.
    // С blendFunc(SRC_ALPHA, …) в буфер ложились rgb·a и a², а композитор
    // (premultipliedAlpha:false) показывал ≈ a³ — линии были почти невидимы.
    gl.disable(gl.BLEND);

    // Пиксельная плотность ограничена: на retina хватает 1.5, на телефоне 1.25
    // (линии и так тонкие, а пикселей втрое меньше). perf.scale — динамическое
    // понижение разрешения на медленном железе (см. mfPerf).
    var dpr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.25 : 1.5);
    function resize() {
      var k = dpr * perf.scale;
      var w = Math.max(1, Math.floor(cv.clientWidth  * k));
      var h = Math.max(1, Math.floor(cv.clientHeight * k));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w; cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    return {
      gl: gl, canvas: cv, U: U, colors: palette,
      resize: resize, readColors: readPalette,
      // I — состояние взаимодействия из startLoop: mx, my, pres, pulses (Float32Array(16));
      // fade — проявление 0..1 (см. startLoop)
      draw: function (time, I, fade) {
        resize();
        var mo = currentMotif();
        gl.uniform2f(U.uRes, cv.width, cv.height);
        gl.uniform1f(U.uTime, time);
        gl.uniform2f(U.uMouse, I.mx, I.my);
        gl.uniform3f(U.uPtr, I.mx, I.my, I.pres);
        gl.uniform4fv(U.uPulse, I.pulses);
        gl.uniform3fv(U.uColA, palette.a);
        gl.uniform3fv(U.uColB, palette.b);
        gl.uniform3fv(U.uColC, palette.c);
        gl.uniform3fv(U.uInk, palette.ink);
        gl.uniform1f(U.uDark, palette.dark);
        gl.uniform1f(U.uFade, fade == null ? 1 : fade);
        gl.uniform1f(U.uGain, mo.gain || 1);
        gl.uniform1i(U.uMode, mo.mode);
        gl.uniform3f(U.uDraw, mo.draw[0], mo.draw[1], mo.draw[2] || 0);
        gl.uniform1f(U.uScroll, I.scrollF || 0);
        // тихая зона: CSS-пиксели окна -> пиксели холста (ось y у GL снизу вверх)
        var cz = I.calm, kx = cv.width / (window.innerWidth || 1), ky = cv.height / (window.innerHeight || 1);
        if (cz) {
          gl.uniform4f(U.uCalm, cz.x0 * kx, (window.innerHeight - cz.y1) * ky, cz.x1 * kx, (window.innerHeight - cz.y0) * ky);
          gl.uniform2f(U.uCalmK, cz.k, 70 * kx);
        } else gl.uniform4f(U.uCalm, 0, 0, 0, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  /* Экран -> координаты поля (как в шейдере: масштаб по меньшей стороне окна) */
  var SCALE = 2.7;
  function toField(cx, cy, out) {
    var W = window.innerWidth, H = window.innerHeight, mn = Math.min(W, H) || 1;
    out[0] = (cx - W * 0.5) / mn * SCALE;
    out[1] = (H * 0.5 - cy) / mn * SCALE;
    return out;
  }
  /* Координаты поля -> экран (для 2D-слоёв фона: кольца кликов и т.п.) */
  function fromField(fx, fy, out) {
    var W = window.innerWidth, H = window.innerHeight, mn = Math.min(W, H) || 1;
    out[0] = W * 0.5 + fx * mn / SCALE;
    out[1] = H * 0.5 - fy * mn / SCALE;
    return out;
  }

  /* ------------------------------------------------------------- 3. mfTracers
     Частицы, плывущие вдоль тех же линий тока, что рисует шейдер режима 0.
     Живут только внутри контейнера [data-mf-tracers] (обычно hero), но
     координаты частиц — МИРОВЫЕ координаты поля (как в шейдере: экран минус
     прокрутка I.scrollF), поэтому они лежат ровно на изолиниях и при прокрутке. Цвет — тот же, что у изолинии
     в этой точке; яркость лишь чуть выше, без неонового свечения. */
  function initTracers(host, lite) {
    if (!host || reduced) return null;
    var cv = el('canvas', 'mf-tracers-canvas', host);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    var ctx = cv.getContext('2d');
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, MOBILE ? 1.25 : 1.5);
    // телефон: частиц меньше — hero там узкий, а шлейфы и так видны
    var N = lite ? 60 : MOBILE ? 80 : (window.innerWidth < 900 ? 120 : 190);
    var P = [];
    // видимая часть hero в координатах поля (обновляется каждый кадр)
    var B = { x0: -SCALE, x1: SCALE, y0: -SCALE, y1: SCALE, vis: true };

    function updateBounds() {
      var r = host.getBoundingClientRect();
      var W = window.innerWidth, H = window.innerHeight, mn = Math.min(W, H) || 1;
      var top = Math.max(r.top, 0), bot = Math.min(r.bottom, H);
      B.vis = bot > top + 4 && r.width > 4;
      B.x0 = (Math.max(r.left, 0) - W * 0.5) / mn * SCALE;
      B.x1 = (Math.min(r.right, W) - W * 0.5) / mn * SCALE;
      var sc = BG.I.scrollF || 0;
      B.y0 = (H * 0.5 - bot) / mn * SCALE - sc;
      B.y1 = (H * 0.5 - top) / mn * SCALE - sc;
      B.sc = sc;
      B.left = r.left; B.top = r.top; B.W = W; B.H = H; B.mn = mn;
    }
    function spawn(p) {
      p.x = B.x0 + Math.random() * (B.x1 - B.x0);
      p.y = B.y0 + Math.random() * (B.y1 - B.y0);
      p.life = 0;
      p.max = 90 + Math.random() * 190;
      p.w = 0.7 + Math.random() * 0.6;
    }
    updateBounds();
    for (var i = 0; i < N; i++) { var p = {}; spawn(p); p.life = Math.random() * p.max; P.push(p); }

    function resize() {
      var w = Math.max(1, Math.floor(host.clientWidth * dpr));
      var h = Math.max(1, Math.floor(host.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }

    var fv = [0, 0], vv = [0, 0, 0], rgb = [0, 0, 0];
    return {
      resize: resize,
      clear: function () { resize(); ctx.clearRect(0, 0, cv.width, cv.height); },
      draw: function (time, I, dt) {
        resize();
        updateBounds();
        // hero ушёл за экран: пара десятков кадров дотушить шлейфы — и простаиваем
        B.idle = B.vis ? 0 : (B.idle || 0) + 1;
        if (B.idle > 40) return;
        // лёгкое затухание вместо полной очистки — короткие шлейфы вдоль линий тока
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.globalCompositeOperation = 'source-over';
        if (!B.vis) return;

        // особенности — в мировых координатах (ячейка 0 шейдера: hero вверху страницы)
        var S = FlowMath.sing(time * 0.055, I.mx, I.my - B.sc), sc = B.sc;
        var step = Math.min(dt, 0.05) * 0.32;
        // светлая тема: тёмные «чернильные» штрихи, тише светящихся тёмной;
        // I.fade — общее проявление фона при загрузке
        var peak = (0.26 + 0.14 * palette.dark) * (I.fade == null ? 1 : I.fade);
        var k = B.mn / SCALE * dpr;                // единица поля -> пиксели холста
        var ox = (B.W * 0.5 - B.left) * dpr, oy = (B.H * 0.5 - B.top) * dpr;
        var pl = I.pulses, spdR = PULSE_SPEED;
        ctx.lineCap = 'round';

        for (var i = 0; i < P.length; i++) {
          var p = P[i];
          FlowMath.vel(p.x, p.y, S, vv);
          var vx = vv[0], vy = vv[1];
          var sp = Math.sqrt(vx * vx + vy * vy) || 1e-6;
          // у особенностей скорость взрывается — ограничиваем, иначе «телепорт»
          var sc = Math.min(sp, 2.2) / sp * step;
          var sx = p.x, sy = p.y;
          p.x += vx * sc; p.y += vy * sc;
          // кольца от кликов расталкивают частицы, как и изолинии
          for (var j = 0; j < PULSE_MAX; j++) {
            var age = pl[j * 4 + 2];
            if (age < 0) continue;
            var qx = p.x - pl[j * 4], qy = p.y + sc - pl[j * 4 + 1];
            var r = Math.sqrt(qx * qx + qy * qy) + 1e-4;
            var x = (r - age * spdR) / 0.3, env = 1 - age / PULSE_LIFE;
            var push = Math.exp(-x * x) * env * env * 0.6 * Math.min(dt, 0.05);
            p.x += qx / r * push; p.y += qy / r * push;
          }
          p.life += 1;

          // у самой особенности частица лишь дрожит на месте — перезасеваем
          if (p.life > p.max || vv[2] < 0.012 || p.x < B.x0 - 0.2 || p.x > B.x1 + 0.2 ||
              p.y < B.y0 - 0.2 || p.y > B.y1 + 0.2) {
            spawn(p); continue;
          }
          FlowMath.eval(p.x, p.y, S, fv);
          fieldColor(Math.sqrt(fv[0] * fv[0] + fv[1] * fv[1]) * 0.42, rgb);
          // то же краевое затухание, что у изолиний, но с полом — hero живой
          var rr = Math.sqrt(p.x * p.x + (p.y + sc) * (p.y + sc)) / SCALE;
          var edge = 1 - Math.max(0, Math.min(1, (rr - 0.30) / 0.75));
          var alpha = Math.sin(p.life / p.max * Math.PI) * peak * (0.35 + 0.65 * edge);

          ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = p.w * dpr;
          ctx.beginPath();
          ctx.moveTo(ox + sx * k, oy - (sy + sc) * k);
          ctx.lineTo(ox + p.x * k, oy - (p.y + sc) * k);
          ctx.stroke();
        }
      }
    };
  }

  /* ----------------------------------------------- единый кадровый цикл
     Взаимодействие одинаково для всех разделов:
       • мышь/перо (не палец) — курсор поля; «присутствие» плавно гаснет,
         когда указатель ушёл из окна или стоит без движения;
       • клик/тап по пустому фону — кольцо (до PULSE_MAX одновременно). */
  var IGNORE_TAP = 'a, button, input, textarea, select, label, summary, [contenteditable],' +
                   ' [role=button], [role=dialog], dialog, #app-header, .modal,' +
                   ' [class*="modal"], [class*="overlay"]';

  /* 2D-слои фона (mf-backgrounds.js) регистрируются через MathFrameUI.bg.add.
     Цикл один на всё: WebGL-поле, трассеры и слои рисуются в одном rAF, с
     общим состоянием взаимодействия I и общим проявлением. */
  var BG = { layers: [], queue: [], booted: false, loop: false, field: null, tracers: null,
             I: { mx: 2.3, my: -0.95, pres: 0, sx: -1e4, sy: -1e4, touch: false, fade: 0,
                  pulses: new Float32Array(PULSE_MAX * 4),
                  // прокрутка: scrollY — px основного скролла, docH — его полная
                  // высота, vh — окно; scrollF — сдвиг поля (ед. поля × PF_FIELD)
                  scrollY: 0, docH: 1, vh: 1, scrollF: 0,
                  calm: null } };   // тихая зона {x0,y0,x1,y1,k} в px окна или null
  /* Тихая зона раздела (PAGE_MOTIF.calm): прямоугольник колонки текста,
     обрезанный окном. Элемент ищем редко, прямоугольник читаем каждый кадр
     (один getBoundingClientRect — дёшево). */
  var calmEl = null, calmSeek = 0;
  function readCalm(now) {
    var m = PAGE_MOTIF[pageName()], cfg = m && m.calm;
    if (!cfg) return null;
    if ((!calmEl || !calmEl.isConnected) && now >= calmSeek) {
      calmSeek = now + 1000;
      try { calmEl = document.querySelector(cfg.sel); } catch (e) { calmEl = null; }
    }
    if (!calmEl) return null;
    var r = calmEl.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    var x0 = Math.max(0, r.left), x1 = Math.min(W, r.right), y0 = Math.max(0, r.top), y1 = Math.min(H, r.bottom);
    if (x1 - x0 < 8 || y1 - y0 < 8) return null;
    var c = BG.I.calm || {};
    c.x0 = x0; c.x1 = x1; c.y0 = y0; c.y1 = y1; c.k = cfg.k;
    return c;
  }
  /* Миллиметровая сетка (.mf-plane) тоже «нарисована на странице»: сдвигаем
     слой на прокрутку по модулю крупного шага сетки (слой в CSS длиннее окна
     на этот шаг), поэтому хватает transform, без перерисовки. */
  var planeEl = null, planeStep = 0, planeLast = null;
  function movePlane(y) {
    if (!planeEl) {
      planeEl = document.querySelector('.mf-plane');
      if (!planeEl) return;
      planeStep = (parseFloat(getComputedStyle(planeEl).getPropertyValue('--mf-grid-step')) || 24) * 5;
    }
    var off = -(((y * PF_FIELD) % planeStep) + planeStep) % planeStep;
    off = Math.round(off * 10) / 10;
    if (off === planeLast) return;
    planeLast = off;
    planeEl.style.transform = 'translate3d(0,' + off + 'px,0)';
  }
  // плавная кривая проявления: быстрый старт без рывка, долгий мягкий хвост
  function easeFade(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
  var FADE_IN = 1.8; // сек

  function startLoop(field, tracers) {
    BG.field = field; BG.tracers = tracers;
    if (BG.loop || reduced) return;
    if (!field && !tracers && !BG.layers.length) return;   // запустится при первом слое
    BG.loop = true;
    var t0 = performance.now(), last = t0, raf = null, visible = !document.hidden;
    // точка покоя «курсора» — правее и ниже фигуры в hero, чтобы диполь
    // режима 0 не рисовал плотные кольца прямо за контентом
    var tmx = 2.3, tmy = -0.95, lastMove = -1e9, inside = false, touch = false;
    var tsx = -1e4, tsy = -1e4;
    var I = BG.I;
    var pulses = [];   // { x, y, t } — t в секундах от t0
    var tmp = [0, 0];
    var fieldStart = -1, frameNo = 0, fadeAcc = 0;
    // была ли настоящая мышь: без неё (телефон, до первого движения) «курсор»
    // поля — точка покоя, и она закреплена на странице, а не на экране
    var mouseSeen = false, lastSF = null;
    window.addEventListener('resize', function () { planeEl = null; planeLast = null; }, { passive: true });

    function aim(x, y, isTouch) {
      toField(x, y, tmp);
      tmx = tmp[0]; tmy = tmp[1]; tsx = x; tsy = y;
      if (I.sx < -1e3) { I.sx = x; I.sy = y; }
      lastMove = performance.now(); inside = true; touch = !!isTouch;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'touch') mouseSeen = true;
      aim(e.clientX, e.clientY, e.pointerType === 'touch');
    }, { passive: true });
    // Тач вместо курсора: палец ведёт «линзу», пока касается экрана; после
    // отпускания она гаснет за ~1 с. touchmove приходит и во время прокрутки —
    // линза едет за пальцем, ничего не блокируя (passive).
    function onTouch(e) {
      var t = e.touches && e.touches[0];
      if (t) aim(t.clientX, t.clientY, true);
    }
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) inside = false; });
    window.addEventListener('blur', function () { inside = false; });

    document.addEventListener('pointerdown', function (e) {
      if (motionOff() || (e.button && e.button !== 0)) return;
      var tg = e.target;
      if (tg && tg.closest && tg.closest(IGNORE_TAP)) return;
      toField(e.clientX, e.clientY, tmp);
      // кольцо живёт в мировых координатах: при прокрутке уезжает вместе со страницей
      pulses.push({ x: tmp[0], y: tmp[1] - I.scrollF, t: (performance.now() - t0) / 1000 });
      if (pulses.length > PULSE_MAX) pulses.shift();
    }, { passive: true });

    // Крайняя ступень mfPerf: плавно гасим WebGL (CSS-переход opacity) и
    // только потом перестаём его рисовать
    function fieldOff() {
      var f = BG.field; if (!f) return;
      f.canvas.classList.remove('mf-ready');
      f.__dying = true;
      setTimeout(function () {
        BG.field = null;
        document.documentElement.classList.add('mf-lite');
      }, 1300);
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      var dtRaw = now - last;
      var dt = Math.min(0.05, dtRaw / 1000); last = now;
      var field = BG.field, tracers = BG.tracers, layers = BG.layers;
      // прокрутка основного контента -> мировой сдвиг фона
      readScroll();
      var mnW = Math.min(window.innerWidth, window.innerHeight) || 1;
      I.scrollY = SCR.y; I.docH = SCR.h; I.vh = SCR.vh;
      I.scrollF = SCR.y / mnW * SCALE * PF_FIELD;
      if (lastSF !== null && (!mouseSeen || touch)) {
        var dS = I.scrollF - lastSF;
        tmy += dS; I.my += dS;
      }
      lastSF = I.scrollF;
      I.calm = readCalm(now);
      movePlane(SCR.y);
      // курсор догоняем с инерцией — резкие рывки мыши не дёргают картинку
      I.mx += (tmx - I.mx) * 0.06; I.my += (tmy - I.my) * 0.06;
      I.sx += (tsx - I.sx) * 0.08; I.sy += (tsy - I.sy) * 0.08;
      var want = inside && now - lastMove < (touch ? 1100 : 4000) ? 1 : 0;
      I.pres += (want - I.pres) * (want ? 0.05 : 0.02);
      I.touch = touch;
      var time = (now - t0) / 1000;
      for (var i = 0; i < PULSE_MAX; i++) {
        var q = pulses[i], age = q ? time - q.t : -1;
        if (age > PULSE_LIFE) age = -1;
        I.pulses[i * 4] = q ? q.x : 0; I.pulses[i * 4 + 1] = q ? q.y + I.scrollF : 0;
        I.pulses[i * 4 + 2] = age; I.pulses[i * 4 + 3] = 0;
      }
      stepPalette(dt);
      // Переключатель «Анимации» может щёлкнуться в любой момент (см.
      // common.js) — гасим/включаем фон, трассеры и слои на лету, без
      // пересборки WebGL-контекста. Канвас плавно растворяется через
      // CSS-переход у .mf-ready (opacity), 2D-слои один раз чистим.
      var off = motionOff();
      if (field && field.canvas && !field.__dying && fieldStart >= 0) {
        field.canvas.classList.toggle('mf-ready', !off);
      }
      if (off) {
        pulses.length = 0;
        if (tracers && !tracers.__mfCleared) { try { tracers.clear(); } catch (e) {} tracers.__mfCleared = true; }
        for (var c = 0; c < layers.length; c++) {
          if (!layers[c].__mfCleared) { try { layers[c].clear(); } catch (e) {} layers[c].__mfCleared = true; }
        }
        return;
      }
      perfTick(dtRaw, now, fieldOff);
      // ступень «кадр через кадр»: тяжёлое рисуем на чётных кадрах
      frameNo++;
      if (perf.skip && (frameNo & 1)) return;
      var dtS = perf.skip ? Math.min(0.1, dt * 2) : dt;

      // Проявление. Отсчёт идёт от ПЕРВОГО реально нарисованного кадра, а не
      // от загрузки: если WebGL инициализировался с задержкой, поле всё равно
      // начинает с нуля (прозрачный кадр), затем canvas получает .mf-ready и
      // яркость/толщина/масштаб линий мягко нарастают за FADE_IN секунд.
      // Копим именно время КАДРОВ (dt ограничен 50 мс): если страница после
      // первого кадра надолго заняла поток (тяжёлая инициализация), яркость
      // не «перепрыгнет» — продолжит нарастать с того же места.
      if (fieldStart >= 0) fadeAcc += dtS;
      if (field) {
        if (fieldStart < 0) fieldStart = time;
        I.fade = easeFade(fadeAcc / FADE_IN);
        try { field.draw(time, I, I.fade); } catch (e) {}
        if (!field.__shown) {
          field.__shown = true;
          // класс — только ПОСЛЕ первого (прозрачного) кадра: нечему «мигнуть»
          requestAnimationFrame(function () { if (!motionOff()) field.canvas.classList.add('mf-ready'); });
        }
      } else {
        if (fieldStart < 0) fieldStart = time;
        I.fade = easeFade(fadeAcc / FADE_IN);
      }
      if (tracers) { tracers.__mfCleared = false; try { tracers.draw(time, I, dtS); } catch (e) {} }
      for (var L = 0; L < layers.length; L++) {
        layers[L].__mfCleared = false;
        try { layers[L].draw(time, I, dtS); } catch (e) {}
      }
    }
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      last = performance.now();
    });
    raf = requestAnimationFrame(frame);

    // При смене темы перечитываем цвета из CSS-переменных; сами цвета
    // переливаются к новым плавно (stepPalette). Пока фон ещё не проявился —
    // без перелива, сразу нужная палитра (никакой «тёмной вспышки»).
    var wasLight = isLight();
    try {
      new MutationObserver(function () {
        var l = isLight();
        if (l === wasLight) return;
        wasLight = l;
        readPalette();
        if (I.fade < 0.25) snapPalette();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }

  /* Публичный вход для 2D-слоёв фона. factory(api) -> { draw(time, I, dt), clear() }
     или null. До boot() слои копятся в очереди. */
  var BG_API = {
    I: BG.I, palette: palette, perf: perf, mobile: MOBILE, lite: false,
    SCALE: SCALE, PULSE_SPEED: PULSE_SPEED, PULSE_LIFE: PULSE_LIFE, PULSE_MAX: PULSE_MAX,
    toField: toField, fromField: fromField, motionOff: motionOff, page: pageName,
    motif: function () { return currentMotif(); },
    PF_FIELD: PF_FIELD,
    // множитель яркости 2D-слоя в точке окна: внутри тихой зоны — calm.k
    // (с мягким краем 70 px, как в шейдере), вне — 1
    calmAt: function (x, y) {
      var c = BG.I.calm;
      if (!c) return 1;
      var s = 70;
      function st(a, b, v) { v = (v - a) / (b - a); v = v < 0 ? 0 : v > 1 ? 1 : v; return v * v * (3 - 2 * v); }
      var m = st(c.x0 - s, c.x0 + s, x) * (1 - st(c.x1 - s, c.x1 + s, x)) *
              st(c.y0 - s, c.y0 + s, y) * (1 - st(c.y1 - s, c.y1 + s, y));
      return 1 + (c.k - 1) * m;
    },
    add: function (factory) {
      if (reduced || typeof factory !== 'function') return;
      if (!BG.booted) { BG.queue.push(factory); return; }
      var layer = null;
      try { layer = factory(BG_API); } catch (e) { try { console.warn('[MathFrame] bg layer:', e); } catch (x) {} }
      if (!layer) return;
      BG.layers.push(layer);
      startLoop(BG.field, BG.tracers);
    }
  };

  // Скрипт 2D-слоёв грузим асинхронно рядом с этим файлом — страницы править
  // не нужно, а загрузка не задерживает первый кадр.
  var BG_SRC = '';
  try {
    var me = document.currentScript && document.currentScript.src;
    BG_SRC = me ? me.replace(/mathframe-ui\.js([?#].*)?$/, 'mf-backgrounds.js') : '/assets/js/mf-backgrounds.js';
  } catch (e) { BG_SRC = '/assets/js/mf-backgrounds.js'; }
  function loadBgLayers() {
    if (reduced || !BG_SRC) return;
    var m = PAGE_MOTIF[pageName()];
    var b = document.body;
    if (!m || !m.overlay || (b && b.dataset.mfOverlay === 'off')) return;
    if (document.querySelector('script[data-mf-bg]')) return;
    var s = document.createElement('script');
    s.src = BG_SRC; s.async = true; s.setAttribute('data-mf-bg', '');
    (document.head || document.documentElement).appendChild(s);
  }

  /* ---------------------------------------------------------------- 4. карточки
     ВАЖНО про мобильные: наклон и подсветка включаются ТОЛЬКО если у устройства
     есть настоящий hover (мышь/трекпад). На тач-экранах :hover «залипает» после
     тапа — карточка осталась бы наклонённой и подсвеченной навсегда. Поэтому на
     телефонах вся эта механика просто не подключается. */
  var canHover = false;
  try { canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) {}

  var TILT = 5; // максимальный наклон в градусах — намеренно мягкий
  function initCards() {
    if (!canHover) return;
    function bind(card) {
      if (card.__mfBound) return;
      card.__mfBound = true;
      var raf = null, tx = 0, ty = 0;

      card.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(2) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(2) + '%');
        if (motionOff()) return;
        tx = (py - 0.5) * -2 * TILT;
        ty = (px - 0.5) *  2 * TILT;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = null;
          card.style.transform = 'perspective(900px) rotateX(' + tx.toFixed(2) +
                                'deg) rotateY(' + ty.toFixed(2) + 'deg) translateY(-4px)';
        });
      }, { passive: true });

      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
      // страховка: если палец всё-таки дошёл сюда — снимаем трансформацию
      card.addEventListener('pointercancel', function () { card.style.transform = ''; });
    }
    // .svc — плитки инструментов на странице мини-сервисов: тот же тактильный
    // наклон-к-курсору, что и у карточек разделов, только чуть мягче (см. CSS —
    // сама плитка компактнее, поэтому амплитуда наклона там приглушена).
    document.querySelectorAll('.section-card, .mf-card, .svc').forEach(bind);
    // карточки могут появиться позже (форум, справочник, мини-сервисы рендерят их из JS)
    try {
      new MutationObserver(function () {
        document.querySelectorAll('.section-card, .mf-card, .svc').forEach(bind);
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  /* ----------------------------------------------------------------- 5. ripple */
  function initRipple() {
    document.addEventListener('pointerdown', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.btn, .social-btn, .theme-option, .svc, .conv-chip, .geo-subchip, .calc-key') : null;
      if (!b || motionOff()) return;
      var r = b.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2.1;
      var s = el('span', 'mf-ripple', b);
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left) + 'px';
      s.style.top  = (e.clientY - r.top)  + 'px';
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 640);
    }, { passive: true });
  }

  /* ------------------------------------------------------------- частицы
     Короткая вспышка искр от точки/элемента — для КОНКРЕТНЫХ подтверждающих
     действий (страницы вызывают сами, см. services.js «=», forum.html
     отправка поста), не генерик-эффект на все клики. */
  function burst(target, opts) {
    if (motionOff() || !target) return;
    opts = opts || {};
    var n = Math.max(1, opts.count || 10);
    var cx, cy;
    if (typeof opts.x === 'number' && typeof opts.y === 'number') { cx = opts.x; cy = opts.y; }
    else {
      var r = (target.getBoundingClientRect ? target.getBoundingClientRect() : null);
      if (!r) return;
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    }
    var colors = opts.colors || [
      cssVar('--accent', '#5b8cff'), cssVar('--accent-2', '#56dcc8'), cssVar('--accent-3', '#f2b45c')
    ];
    var spread = opts.spread || 30;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i / n) + (Math.random() - 0.5) * 0.7;
      var dist = spread * 0.6 + Math.random() * spread;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      var size = 3 + Math.random() * 3;
      var s = el('span', 'mf-burst-p');
      s.style.cssText =
        'left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;' +
        'background:' + colors[i % colors.length] + ';color:' + colors[i % colors.length] + ';' +
        '--mfdx:' + dx.toFixed(1) + 'px;--mfdy:' + dy.toFixed(1) + 'px;';
      document.body.appendChild(s);
      (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 700); })(s);
    }
  }

  /* --------------------------------------------------------- смена панели
     «Контейнер поменял содержимое» — вызывающий код сам решает, когда: уже
     положил новую разметку в el и хочет короткий 3D+маска въезд вместо
     резкой подмены. Ничего не трогает в el, кроме класса анимации. */
  function panelIn(elm) {
    if (!elm) return;
    elm.classList.remove('mf-panel-3d');
    void elm.offsetWidth;
    elm.classList.add('mf-panel-3d');
  }

  /* -------------------------------------------------------------------- 6. nav
     Шапку рисует common.js, причём иногда ПОЗЖЕ, чем отрабатывает boot()
     (например, после ответа Firebase). Раньше initNav в этом случае просто
     выходил и больше не возвращался — поэтому на сайте индикатор не появлялся,
     хотя в автономном превью со статической шапкой всё работало.
     Теперь ждём появления шапки в DOM. */
  function initNav() {
    var nav = document.getElementById('app-nav');
    if (!nav) { waitForNav(); return; }
    if (nav.__mfNav) return;
    nav.__mfNav = true;
    var ind = el('span', 'mf-nav-indicator', nav);

    function moveTo(a) {
      var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
      if (!ar.width) return;
      ind.style.width = ar.width + 'px';
      ind.style.transform = 'translateX(' + (ar.left - nr.left) + 'px)';
      // Индикатор окрашивается в фирменный цвет раздела под курсором —
      // «намёк», куда ведёт пункт (токены --page-color-* в common.css § 21;
      // ключ раздела в data-nav-page ставит common.js). Ссылка на var(), а не
      // вычисленный цвет — чтобы смена темы перекрашивала и индикатор.
      var pg = a.getAttribute('data-nav-page');
      if (pg) ind.style.setProperty('--mf-ind-c', 'var(--page-color-' + pg + ')');
      else ind.style.removeProperty('--mf-ind-c');
      ind.classList.add('mf-on');
    }
    function hide() { ind.classList.remove('mf-on'); }

    // Индикатор — реакция на наведение. Текущий раздел помечает статическое
    // подчёркивание в CSS (a.active::after), поэтому полоска есть всегда, даже
    // если JS не отработал. Активный пункт (включая «Главную») помечает
    // common.js — по пути и по <body data-page>; здесь индикатор его не
    // дублирует и в покое скрыт.
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        moveTo(a);
      });
    });
    nav.addEventListener('pointerleave', hide);
    window.addEventListener('resize', hide);

    // Рядом с логотипом ставим словесный знак, если его нет в разметке:
    // common.js рисует только картинку, а «Math⁠Frame» — часть фирменного стиля.
    var logo = document.querySelector('#app-header .logo-container');
    if (logo && !logo.querySelector('.logo-wordmark')) {
      var wm = document.createElement('span');
      wm.className = 'logo-wordmark';
      wm.innerHTML = 'Math<em>Frame</em>';
      logo.appendChild(wm);
    }
  }

  var navWatcher = null;
  function waitForNav() {
    if (navWatcher || !window.MutationObserver) return;
    navWatcher = new MutationObserver(function () {
      if (document.getElementById('app-nav')) {
        navWatcher.disconnect(); navWatcher = null;
        initNav();
      }
    });
    navWatcher.observe(document.body, { childList: true, subtree: true });
    // страховка на случай, если шапка так и не появится
    setTimeout(function () {
      if (navWatcher) { navWatcher.disconnect(); navWatcher = null; }
    }, 15000);
  }

  /* ----------------------------------------------------------------- 7. reveal */
  function initReveal() {
    // Помечаем «сами собой» очевидные блоки, чтобы не править разметку страниц
    var auto = document.querySelectorAll('.section-card, [data-mf-reveal]');
    auto.forEach(function (n, i) {
      if (n.classList.contains('mf-reveal')) return;
      n.classList.add('mf-reveal');
      n.style.setProperty('--mf-delay', Math.min(i, 8) * 55 + 'ms');
    });

    var targets = document.querySelectorAll('.mf-reveal, .mf-reveal-3d');
    if (!targets.length) return;
    if (motionOff() || !('IntersectionObserver' in window)) {
      targets.forEach(function (n) { n.classList.add('mf-in'); settleReveal(n, true); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('mf-in');
          settleReveal(en.target);
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (n) { if (!n.classList.contains('mf-revealed')) io.observe(n); });
  }

  /* После появления блок помечается .mf-revealed (см. common.css › 14):
     с него снимается ступенчатая задержка --mf-delay и возвращаются «родные»
     переходы карточки. Иначе transition-delay 55…440 мс продолжал действовать
     и на наклон mfCards: каждый pointermove перезапускал переход с задержкой,
     и крутилась только первая карточка ряда (у неё задержка 0). */
  function settleReveal(n, now) {
    if (n.__mfSettle || n.classList.contains('mf-revealed')) return;
    var d = parseFloat(n.style.getPropertyValue('--mf-delay')) || 0;
    n.__mfSettle = setTimeout(function () {
      n.__mfSettle = null;
      n.classList.add('mf-revealed');
      n.style.removeProperty('--mf-delay');
    }, now ? 0 : d + 680);
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    var lite = detectLite();
    BG_API.lite = lite;
    buildPlane();
    readPalette();
    snapPalette();

    var field = null, tracers = null;
    try { field = initFlowField(lite); } catch (e) {}
    var host = document.querySelector('[data-mf-tracers]');
    if (host) {
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      try { tracers = initTracers(host, lite); } catch (e) {}
    }
    startLoop(field, tracers);
    // 2D-слои фона: те, что успели загрузиться раньше boot, — из очереди
    BG.booted = true;
    loadBgLayers();
    BG.queue.splice(0).forEach(BG_API.add);

    initCards();
    initRipple();
    initNav();
    initReveal();

    // Пришли через маску перехода (common.js › PAGE TRANSITIONS): страницу
    // «открывает» сама маска, а фон проявляется своим uFade. Собственное
    // появление body (opacity + transform) тогда лишнее: оно шло бы под маской
    // третьим слоем и на полсекунды сдвигало fixed-шапку и слои фона.
    var viaVeil = !!window.__mfVeil ||
      document.documentElement.classList.contains('mf-veil-on') ||
      !!document.querySelector('.mf-veil-in');
    if (!viaVeil) {
      document.body.classList.add('mf-page-enter');
      setTimeout(function () { document.body.classList.remove('mf-page-enter'); }, 700);
    }
  }

  // 2D-слои начинаем качать сразу, параллельно разбору страницы
  try { if (document.body) loadBgLayers(); } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // публичный минимум — чтобы страницы могли дорегистрировать свои блоки
  window.MathFrameUI = {
    reveal: initReveal,
    cards: initCards,
    nav: initNav,
    burst: burst,
    panelIn: panelIn,
    motionOff: motionOff,
    bg: BG_API          // процедурный фон: 2D-слои (mf-backgrounds.js), палитра, состояние
  };
})();