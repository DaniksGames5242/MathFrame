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
                       для всех разделов: «линза» у курсора (линии гуще и ярче)
                       и кольцевая волна от клика/тапа по пустому фону.
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
  function isLight() { return document.documentElement.classList.contains('light'); }

  /* Палитра фона — общая для шейдера и трассеров. Перечитывается при смене
     темы, а не на каждом кадре (getComputedStyle в цикле дорог). */
  var palette = { a: [0.36,0.55,1.00], b: [0.34,0.86,0.78], c: [0.95,0.71,0.36], light: false };
  function readPalette() {
    palette.light = isLight();
    palette.a = toRGB(cssVar('--accent',   ''), palette.light ? [0.18,0.37,0.88] : [0.36,0.55,1.00]);
    palette.b = toRGB(cssVar('--accent-2', ''), [0.34,0.86,0.78]);
    palette.c = toRGB(cssVar('--accent-3', ''), [0.95,0.71,0.36]);
  }
  // Тот же цвет, что у изолинии в этой точке (см. col в шейдере)
  function fieldColor(spd, out) {
    var A = palette.a, B = palette.b, C = palette.c;
    var s = Math.max(0, Math.min(1, spd));
    var u = s < 0.55 ? 0 : (s - 0.55) / 0.45; u = u * u * (3 - 2 * u) * 0.55;
    for (var i = 0; i < 3; i++) {
      var v = A[i] + (B[i] - A[i]) * s;
      out[i] = Math.round((v + (C[i] - v) * u) * 255);
    }
    return out;
  }

  /* --------------------------------------------------------------- 8. mfPerf
     Грубая, но надёжная оценка: мало ядер / мало памяти / мобильный —
     отключаем самое дорогое (WebGL-фон, backdrop-filter). */
  function detectLite() {
    var lite = false;
    try {
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3) lite = true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 2) lite = true;
      if (window.innerWidth < 620) lite = true;
      if (navigator.connection && navigator.connection.saveData) lite = true;
    } catch (e) {}
    if (lite) document.documentElement.classList.add('mf-lite');
    return lite;
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
     Это и даёт «узнаваемо, но по-своему»: приём рисования одинаков везде
     (изолинии скалярного поля), а само поле у каждого раздела своё.
       0 — линии тока потенциального течения      (главная); курсор — диполь
       1 — конформное отображение w = z² + c      (справочник): рисуем ОБА
           семейства изолиний, получается ортогональная криволинейная сетка;
           курсор — маленький полюс (сетка остаётся ортогональной)
       2 — интерференция волн от нескольких точек (форум); курсор — источник
       3 — динамическая решётка / ячейки          (мини-сервисы, админка);
           курсор — локальная впадина
       4 — фигуры Хладни                          (песочница); курсор — рябь
       5 — рельеф функции потерь: дрейфующие ямы и холмы (AI-агент);
           курсор — «зонд», продавливающий локальный минимум
     uDraw = (вес семейства Re, вес семейства Im).
     Общее для всех режимов (warp + яркость в main):
       uPtr.z  — присутствие мыши/пера 0..1: «линза» у курсора сжимает поле
                 (линии гуще) и подсвечивает их;
       uPulse  — до 4 колец от кликов: xy — центр, z — возраст в секундах
                 (<0 — слот пуст). Кольцо расходится и сдвигает поле радиально. */
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
    'uniform float uDark;',
    'uniform int   uMode;',
    'uniform vec2  uDraw;',
    '',
    'const float PLIFE = ' + PULSE_LIFE.toFixed(2) + ';',
    'const float PSPD  = ' + PULSE_SPEED.toFixed(2) + ';',
    '',
    'vec2 cdiv(vec2 a, vec2 b){ float d = dot(b,b) + 1e-6;',
    '  return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / d; }',
    'vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }',
    'float gs(vec2 d, float k){ return exp(-dot(d,d) * k); }',
    '',
    'vec2 FIELD(vec2 p){',
    '  float t = uTime * 0.055;',
    '  vec2 dm = p - uMouse;',
    '  if (uMode == 0) {',
    '    vec2 s1 = vec2(cos(t*0.90), sin(t*0.70)) * 0.95;',
    '    vec2 s2 = vec2(cos(t*0.60+2.1), sin(t*1.10+1.3)) * 1.15;',
    '    vec2 f = p;',
    '    f += cdiv(vec2( 0.30,  0.11), p - s1);',
    '    f += cdiv(vec2(-0.24,  0.15), p - s2);',
    '    f += cdiv(vec2( 0.18,  0.22), dm);',
    '    return f;',
    '  } else if (uMode == 1) {',
    '    vec2 c = vec2(cos(t*0.50), sin(t*0.40)) * 0.45 + uMouse * 0.25;',
    '    return cmul(p, p) * 0.6 + c + cdiv(vec2(0.05, 0.0), dm) * uPtr.z;',
    '  } else if (uMode == 2) {',
    '    vec2 s1 = vec2(cos(t*0.80), sin(t*0.60)) * 1.20;',
    '    vec2 s2 = vec2(cos(t*0.50+2.4), sin(t*0.90+1.1)) * 1.30;',
    '    float w = sin(length(p - s1) * 6.0 - uTime * 1.1)',
    '            + sin(length(p - s2) * 6.0 - uTime * 0.9)',
    '            + sin(length(dm) * 7.0 - uTime * 1.4);',
    '    return vec2(w * 0.9, w * 0.55);',
    '  } else if (uMode == 3) {',
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
    '    return vec2(m, m);',
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
    '    return vec2(L, L) * 1.15;',
    '  }',
    '  float n  = 3.0 + 1.5 * sin(t * 0.35);',
    '  float m2 = 2.0 + 1.5 * cos(t * 0.27);',
    '  float s  = 1.1;',
    '  float ch = sin(n*3.14159*p.x*s) * sin(m2*3.14159*p.y*s)',
    '           - sin(m2*3.14159*p.x*s) * sin(n*3.14159*p.y*s);',
    '  ch += 0.45 * gs(dm, 1.4) * sin(length(dm) * 9.0 - uTime * 1.2);',
    '  return vec2(ch, ch);',
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
    'void main(){',
    '  float mn = min(uRes.x, uRes.y);',
    '  vec2 p = (gl_FragCoord.xy - 0.5*uRes) / mn * 2.7;',
    '',
    // Толщина изолиний держится постоянной в ПИКСЕЛЯХ за счёт численной оценки
    // градиента (две доп. выборки). Поэтому не нужен OES_standard_derivatives —
    // шейдер одинаково работает в WebGL1 и WebGL2.
    '  float e  = 2.7 / mn;',
    '  vec2  f0 = FIELD(warp(p));',
    '  vec2  fx = FIELD(warp(p + vec2(e, 0.0))) - f0;',
    '  vec2  fy = FIELD(warp(p + vec2(0.0, e))) - f0;',
    '',
    '  float k = 7.0;',
    '  float dx = abs(fract(f0.x * k + 0.5) - 0.5);',
    '  float gx = length(vec2(fx.x, fy.x)) * k;',
    '  float lx = 1.0 - smoothstep(0.0, gx * 1.4 + 1e-5, dx);',
    '  float dy = abs(fract(f0.y * k + 0.5) - 0.5);',
    '  float gy = length(vec2(fx.y, fy.y)) * k;',
    '  float ly = 1.0 - smoothstep(0.0, gy * 1.4 + 1e-5, dy);',
    // линии гуще ~3 px сливаются в муар/пятно (у особенностей поля) — гасим
    '  lx *= 1.0 - smoothstep(0.12, 0.30, gx);',
    '  ly *= 1.0 - smoothstep(0.12, 0.30, gy);',
    '  float line = max(lx * uDraw.x, ly * uDraw.y);',
    '',
    '  float spd = clamp(length(f0) * 0.42, 0.0, 1.0);',
    '  vec3  col = mix(uColA, uColB, spd);',
    '  col = mix(col, uColC, smoothstep(0.55, 1.0, spd) * 0.55);',
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
    '  col = mix(col, uColB, ring * 0.45);',
    '',
    '  float r    = length((gl_FragCoord.xy - 0.5*uRes) / mn);',
    '  float edge = 1.0 - smoothstep(0.30, 1.05, r);',
    '  edge = max(edge, max(lens, ring) * 0.85);',
    '  float puls = 0.88 + 0.12 * sin(uTime * 0.5 + f0.y * 2.0);',
    '',
    // волны и ячейки гуще остальных мотивов — чуть приглушаем, чтобы
    // общая «плотность» фона была ровной по разделам
    '  float gain = (uMode == 2 || uMode == 3) ? 0.82 : 1.0;',
    '  float a = line * edge * puls * gain * (uDark > 0.5 ? 0.34 : 0.26)',
    '          * (1.0 + 1.0 * lens + 2.2 * ring);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  /* Соответствие «раздел сайта → мотив фона».
     Раздел берётся из <body data-page="..."> (или html), режим можно
     переопределить вручную через data-mf-mode. */
  var PAGE_MOTIF = {
    home:       { mode: 0, draw: [0, 1] },
    reference:  { mode: 1, draw: [1, 1] },
    forum:      { mode: 2, draw: [0, 1] },
    services:   { mode: 3, draw: [0, 1] },
    admin:      { mode: 3, draw: [0, 1] },
    playground: { mode: 4, draw: [0, 1] },
    'ai-agent': { mode: 5, draw: [0, 1] }
  };
  function currentMotif() {
    var b = document.body, h = document.documentElement;
    var name = (b && b.dataset.page) || (h && h.dataset.page) || 'home';
    var m = PAGE_MOTIF[name] || PAGE_MOTIF.home;
    var forced = (b && b.dataset.mfMode) || (h && h.dataset.mfMode);
    if (forced !== undefined && forced !== '') {
      var n = parseInt(forced, 10);
      if (!isNaN(n)) return { mode: n, draw: n === 1 ? [1, 1] : [0, 1] };
    }
    return m;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
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
    ['uRes','uTime','uMouse','uPtr','uColA','uColB','uColC','uDark','uMode','uDraw'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    U.uPulse = gl.getUniformLocation(prog, 'uPulse[0]');

    // Смешивание НЕ нужно: один полноэкранный проход по прозрачному буферу.
    // С blendFunc(SRC_ALPHA, …) в буфер ложились rgb·a и a², а композитор
    // (premultipliedAlpha:false) показывал ≈ a³ — линии были почти невидимы.
    gl.disable(gl.BLEND);

    // Пиксельная плотность ограничена: на retina хватает 1.5, экономим GPU
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var w = Math.max(1, Math.floor(cv.clientWidth  * dpr));
      var h = Math.max(1, Math.floor(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w; cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    return {
      gl: gl, canvas: cv, U: U, colors: palette,
      resize: resize, readColors: readPalette,
      // I — состояние взаимодействия из startLoop: mx, my, pres, pulses (Float32Array(16))
      draw: function (time, I) {
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
        gl.uniform1f(U.uDark, palette.light ? 0.0 : 1.0);
        gl.uniform1i(U.uMode, mo.mode);
        gl.uniform2f(U.uDraw, mo.draw[0], mo.draw[1]);
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

  /* ------------------------------------------------------------- 3. mfTracers
     Частицы, плывущие вдоль тех же линий тока, что рисует шейдер режима 0.
     Живут только внутри контейнера [data-mf-tracers] (обычно hero), но
     координаты считают в системе ОКНА — как фиксированный WebGL-фон, — поэтому
     лежат ровно на изолиниях даже при прокрутке. Цвет — тот же, что у изолинии
     в этой точке; яркость лишь чуть выше, без неонового свечения. */
  function initTracers(host, lite) {
    if (!host || reduced) return null;
    var cv = el('canvas', 'mf-tracers-canvas', host);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    var ctx = cv.getContext('2d');
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var N = lite ? 80 : (window.innerWidth < 900 ? 120 : 190);
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
      B.y0 = (H * 0.5 - bot) / mn * SCALE;
      B.y1 = (H * 0.5 - top) / mn * SCALE;
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

        var S = FlowMath.sing(time * 0.055, I.mx, I.my);
        var step = Math.min(dt, 0.05) * 0.32;
        var peak = palette.light ? 0.34 : 0.40;
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
            var qx = p.x - pl[j * 4], qy = p.y - pl[j * 4 + 1];
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
          var rr = Math.sqrt(p.x * p.x + p.y * p.y) / SCALE;
          var edge = 1 - Math.max(0, Math.min(1, (rr - 0.30) / 0.75));
          var alpha = Math.sin(p.life / p.max * Math.PI) * peak * (0.35 + 0.65 * edge);

          ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = p.w * dpr;
          ctx.beginPath();
          ctx.moveTo(ox + sx * k, oy - sy * k);
          ctx.lineTo(ox + p.x * k, oy - p.y * k);
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

  function startLoop(field, tracers) {
    if (!field && !tracers) return;
    var t0 = performance.now(), last = t0, raf = null, visible = true;
    // точка покоя «курсора» — правее и ниже фигуры в hero, чтобы диполь
    // режима 0 не рисовал плотные кольца прямо за контентом
    var tmx = 2.3, tmy = -0.95, lastMove = -1e9, inside = false;
    var I = { mx: tmx, my: tmy, pres: 0, pulses: new Float32Array(PULSE_MAX * 4) };
    var pulses = [];   // { x, y, t } — t в секундах от t0
    var tmp = [0, 0];

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      toField(e.clientX, e.clientY, tmp);
      tmx = tmp[0]; tmy = tmp[1];
      lastMove = performance.now(); inside = true;
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) inside = false; });
    window.addEventListener('blur', function () { inside = false; });

    document.addEventListener('pointerdown', function (e) {
      if (motionOff() || (e.button && e.button !== 0)) return;
      var tg = e.target;
      if (tg && tg.closest && tg.closest(IGNORE_TAP)) return;
      toField(e.clientX, e.clientY, tmp);
      pulses.push({ x: tmp[0], y: tmp[1], t: (performance.now() - t0) / 1000 });
      if (pulses.length > PULSE_MAX) pulses.shift();
    }, { passive: true });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      // курсор догоняем с инерцией — резкие рывки мыши не дёргают картинку
      I.mx += (tmx - I.mx) * 0.06; I.my += (tmy - I.my) * 0.06;
      var want = inside && now - lastMove < 4000 ? 1 : 0;
      I.pres += (want - I.pres) * (want ? 0.05 : 0.02);
      var time = (now - t0) / 1000;
      for (var i = 0; i < PULSE_MAX; i++) {
        var q = pulses[i], age = q ? time - q.t : -1;
        if (age > PULSE_LIFE) age = -1;
        I.pulses[i * 4] = q ? q.x : 0; I.pulses[i * 4 + 1] = q ? q.y : 0;
        I.pulses[i * 4 + 2] = age; I.pulses[i * 4 + 3] = 0;
      }
      // Переключатель «Анимации» может щёлкнуться в любой момент (см.
      // common.js) — гасим/включаем фон и трассеры на лету, без пересборки
      // WebGL-контекста. Канвас плавно растворяется через уже существующий
      // CSS-переход у .mf-ready (opacity), трассеры просто один раз чистим.
      var off = motionOff();
      if (field && field.canvas) field.canvas.classList.toggle('mf-ready', !off);
      if (off) {
        pulses.length = 0;
        if (tracers && !tracers.__mfCleared) { try { tracers.clear(); } catch (e) {} tracers.__mfCleared = true; }
        return;
      }
      if (tracers) tracers.__mfCleared = false;
      if (field)   { try { field.draw(time, I); } catch (e) {} }
      if (tracers) { try { tracers.draw(time, I, dt); } catch (e) {} }
    }
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      last = performance.now();
    });
    raf = requestAnimationFrame(frame);

    if (field && field.canvas) {
      requestAnimationFrame(function () { field.canvas.classList.add('mf-ready'); });
    }
    // при смене темы перечитываем цвета из CSS-переменных
    try {
      new MutationObserver(readPalette)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
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
      ind.classList.add('mf-on');
    }
    function hide() { ind.classList.remove('mf-on'); }

    // Индикатор — реакция на наведение. Текущий раздел помечает статическое
    // подчёркивание в CSS (a.active::after), поэтому полоска есть всегда, даже
    // если JS не отработал, и не зависит от того, нашла ли шапка активную
    // ссылку. Раньше индикатор в покое вставал под .active, и на главной, где
    // common.js не помечает активной ни одну ссылку (её просто нет в меню),
    // не было видно вообще ничего.
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
      targets.forEach(function (n) { n.classList.add('mf-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('mf-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (n) { io.observe(n); });
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    var lite = detectLite();
    buildPlane();
    readPalette();

    var field = null, tracers = null;
    try { field = initFlowField(lite); } catch (e) {}
    var host = document.querySelector('[data-mf-tracers]');
    if (host) {
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      try { tracers = initTracers(host, lite); } catch (e) {}
    }
    startLoop(field, tracers);

    initCards();
    initRipple();
    initNav();
    initReveal();

    document.body.classList.add('mf-page-enter');
    setTimeout(function () { document.body.classList.remove('mf-page-enter'); }, 700);
  }

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
    motionOff: motionOff
  };
})();