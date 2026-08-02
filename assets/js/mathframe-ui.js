/* ============================================================================
   MathFrame — движок интерфейса и анимаций
   ----------------------------------------------------------------------------
   Автономный модуль: подключается ОДНОЙ строкой на любой странице и сам
   находит нужные элементы. Ничего не требует от разметки, ничего не ломает,
   если чего-то нет. Не зависит от common.js и порядка загрузки.

   Что делает:
     1. mfPlane      — вставляет слои подложки (сетка + WebGL-фон + виньетка)
     2. mfFlowField  — процедурный фон: линии тока потенциального течения
                       (комплексный анализ: f(z) = z + Σ aₖ/(z − pₖ), рисуем
                       изолинии Im f — это буквально линии тока). Курсор — вихрь.
     3. mfTracers    — частицы-трассеры, сносимые тем же полем (Canvas2D)
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

  /* ---------------------------------------------------------------- helpers */
  function el(tag, cls, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
     Im f — функция тока; её изолинии и есть линии тока. */
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
    }
  };

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
       0 — линии тока потенциального течения      (главная)
       1 — конформное отображение w = z² + c      (справочник): рисуем ОБА
           семейства изолиний, получается ортогональная криволинейная сетка
       2 — интерференция волн от нескольких точек (форум)
       3 — динамическая решётка / ячейки          (мини-сервисы, админка)
       4 — фигуры Хладни                          (песочница)
     uDraw = (вес семейства Re, вес семейства Im). */
  var FRAG = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uMouse;',
    'uniform vec3  uColA;',
    'uniform vec3  uColB;',
    'uniform vec3  uColC;',
    'uniform float uDark;',
    'uniform int   uMode;',
    'uniform vec2  uDraw;',
    '',
    'vec2 cdiv(vec2 a, vec2 b){ float d = dot(b,b) + 1e-6;',
    '  return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / d; }',
    'vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }',
    '',
    'vec2 FIELD(vec2 p){',
    '  float t = uTime * 0.055;',
    '  if (uMode == 0) {',
    '    vec2 s1 = vec2(cos(t*0.90), sin(t*0.70)) * 0.95;',
    '    vec2 s2 = vec2(cos(t*0.60+2.1), sin(t*1.10+1.3)) * 1.15;',
    '    vec2 f = p;',
    '    f += cdiv(vec2( 0.30,  0.11), p - s1);',
    '    f += cdiv(vec2(-0.24,  0.15), p - s2);',
    '    f += cdiv(vec2( 0.18,  0.22), p - uMouse);',
    '    return f;',
    '  } else if (uMode == 1) {',
    '    vec2 c = vec2(cos(t*0.50), sin(t*0.40)) * 0.45 + uMouse * 0.25;',
    '    return cmul(p, p) * 0.6 + c;',
    '  } else if (uMode == 2) {',
    '    vec2 s1 = vec2(cos(t*0.80), sin(t*0.60)) * 1.20;',
    '    vec2 s2 = vec2(cos(t*0.50+2.4), sin(t*0.90+1.1)) * 1.30;',
    '    float w = sin(length(p - s1) * 6.0 - uTime * 1.1)',
    '            + sin(length(p - s2) * 6.0 - uTime * 0.9)',
    '            + sin(length(p - uMouse) * 7.0 - uTime * 1.4);',
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
    '    float m = d * 1.6 - length(p - uMouse) * 0.06;',
    '    return vec2(m, m);',
    '  }',
    '  float n  = 3.0 + 1.5 * sin(t * 0.35);',
    '  float m2 = 2.0 + 1.5 * cos(t * 0.27);',
    '  float s  = 1.1;',
    '  float ch = sin(n*3.14159*p.x*s) * sin(m2*3.14159*p.y*s)',
    '           - sin(m2*3.14159*p.x*s) * sin(n*3.14159*p.y*s);',
    '  ch += 0.25 * sin(length(p - uMouse) * 5.0);',
    '  return vec2(ch, ch);',
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
    '  vec2  f0 = FIELD(p);',
    '  vec2  fx = FIELD(p + vec2(e, 0.0)) - f0;',
    '  vec2  fy = FIELD(p + vec2(0.0, e)) - f0;',
    '',
    '  float k = 7.0;',
    '  float dx = abs(fract(f0.x * k + 0.5) - 0.5);',
    '  float gx = length(vec2(fx.x, fy.x)) * k;',
    '  float lx = 1.0 - smoothstep(0.0, gx * 1.35 + 1e-5, dx);',
    '  float dy = abs(fract(f0.y * k + 0.5) - 0.5);',
    '  float gy = length(vec2(fx.y, fy.y)) * k;',
    '  float ly = 1.0 - smoothstep(0.0, gy * 1.35 + 1e-5, dy);',
    '  float line = max(lx * uDraw.x, ly * uDraw.y);',
    '',
    '  float spd = clamp(length(f0) * 0.42, 0.0, 1.0);',
    '  vec3  col = mix(uColA, uColB, spd);',
    '  col = mix(col, uColC, smoothstep(0.55, 1.0, spd) * 0.55);',
    '',
    '  float r    = length((gl_FragCoord.xy - 0.5*uRes) / mn);',
    '  float edge = 1.0 - smoothstep(0.28, 0.86, r);',
    '  float puls = 0.88 + 0.12 * sin(uTime * 0.5 + f0.y * 2.0);',
    '',
    '  float a = line * edge * puls * (uDark > 0.5 ? 0.30 : 0.20);',
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
    playground: { mode: 4, draw: [0, 1] }
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
    ['uRes','uTime','uMouse','uColA','uColB','uColC','uDark','uMode','uDraw'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

    var colors = { a: [0,0,0], b: [0,0,0], c: [0,0,0] };
    function readColors() {
      var fa = isLight() ? [0.18,0.37,0.88] : [0.36,0.55,1.00];
      colors.a = toRGB(cssVar('--accent',   ''), fa);
      colors.b = toRGB(cssVar('--accent-2', ''), [0.34,0.86,0.78]);
      colors.c = toRGB(cssVar('--accent-3', ''), [0.95,0.71,0.36]);
    }
    readColors();

    return {
      gl: gl, canvas: cv, U: U, colors: colors,
      resize: resize, readColors: readColors,
      draw: function (time, mx, my) {
        resize();
        var mo = currentMotif();
        gl.uniform2f(U.uRes, cv.width, cv.height);
        gl.uniform1f(U.uTime, time);
        gl.uniform2f(U.uMouse, mx, my);
        gl.uniform3fv(U.uColA, colors.a);
        gl.uniform3fv(U.uColB, colors.b);
        gl.uniform3fv(U.uColC, colors.c);
        gl.uniform1f(U.uDark, isLight() ? 0.0 : 1.0);
        gl.uniform1i(U.uMode, mo.mode);
        gl.uniform2f(U.uDraw, mo.draw[0], mo.draw[1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  /* ------------------------------------------------------------- 3. mfTracers
     Частицы, которые действительно сносятся тем же полем f(z). Живут только
     внутри контейнера [data-mf-tracers] (обычно hero), поэтому не мешают
     чтению остального контента. */
  function initTracers(host, lite) {
    if (!host || reduced) return null;
    var cv = el('canvas', 'mf-tracers-canvas', host);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    var ctx = cv.getContext('2d');
    if (!ctx) return null;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var N = lite ? 90 : (window.innerWidth < 900 ? 150 : 260);
    var P = [];
    var SCALE = 2.7;

    // Границы засева в координатах поля.
    // Отображение p -> пиксели масштабируется по МЕНЬШЕЙ стороне (чтобы поток
    // не искажался), поэтому на широком блоке квадрат [-SCALE, SCALE]² покрывает
    // лишь центральную часть, и по краям частиц не было. Считаем видимую область
    // честно, отдельно по каждой оси.
    var BX = SCALE, BY = SCALE;
    function updateBounds(w, h) {
      var mn = Math.min(w, h) || 1;
      BX = SCALE * w / mn;
      BY = SCALE * h / mn;
    }

    function spawn(p) {
      p.x = (Math.random() * 2 - 1) * BX;
      p.y = (Math.random() * 2 - 1) * BY;
      p.life = 0;
      p.max = 90 + Math.random() * 190;
      p.w = 0.5 + Math.random() * 1.1;
    }
    updateBounds(host.clientWidth * dpr, host.clientHeight * dpr);
    for (var i = 0; i < N; i++) { var p = {}; spawn(p); p.life = Math.random() * p.max; P.push(p); }

    function resize() {
      var w = Math.max(1, Math.floor(host.clientWidth * dpr));
      var h = Math.max(1, Math.floor(host.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; updateBounds(w, h); }
    }

    var out = [0, 0];
    return {
      resize: resize,
      draw: function (time, mx, my, dt) {
        resize();
        var w = cv.width, h = cv.height, mn = Math.min(w, h);
        // лёгкое затухание вместо полной очистки — получаются короткие шлейфы
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,0.13)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        var t = time * 0.055;
        var S = FlowMath.sing(t, mx, my);
        var acc = toRGB(cssVar('--accent', ''), [0.36,0.55,1.0]);
        var ac2 = toRGB(cssVar('--accent-2', ''), [0.34,0.86,0.78]);
        var step = Math.min(dt, 0.05) * 0.30;

        for (var i = 0; i < P.length; i++) {
          var p = P[i];
          FlowMath.eval(p.x, p.y, S, out);
          var vx = out[0], vy = out[1];
          var sp = Math.sqrt(vx * vx + vy * vy) || 1e-6;
          // нормируем скорость: около особенностей поле взрывается, иначе частицы «телепортируются»
          var nx = vx / sp, ny = vy / sp;
          var sx = p.x, sy = p.y;
          p.x += nx * step; p.y += ny * step;
          p.life += 1;

          if (p.life > p.max || Math.abs(p.x) > BX * 1.15 || Math.abs(p.y) > BY * 1.15) {
            spawn(p); continue;
          }
          // p-пространство -> пиксели
          var X0 = sx / SCALE * 0.5 * mn + w * 0.5, Y0 = h * 0.5 - sy / SCALE * 0.5 * mn;
          var X1 = p.x / SCALE * 0.5 * mn + w * 0.5, Y1 = h * 0.5 - p.y / SCALE * 0.5 * mn;

          var f = p.life / p.max;
          var alpha = Math.sin(f * Math.PI) * (isLight() ? 0.5 : 0.66);
          var mixv = Math.min(1, sp * 0.30);
          var cr = Math.round((acc[0] * (1 - mixv) + ac2[0] * mixv) * 255);
          var cg = Math.round((acc[1] * (1 - mixv) + ac2[1] * mixv) * 255);
          var cb = Math.round((acc[2] * (1 - mixv) + ac2[2] * mixv) * 255);

          ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = p.w * dpr;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(X0, Y0);
          ctx.lineTo(X1, Y1);
          ctx.stroke();
        }
      }
    };
  }

  /* ----------------------------------------------- единый кадровый цикл */
  function startLoop(field, tracers) {
    if (!field && !tracers) return;
    var mx = 0.6, my = 0.35, tmx = 0.6, tmy = 0.35;
    var t0 = performance.now(), last = t0, raf = null, visible = true;

    window.addEventListener('pointermove', function (e) {
      var mn = Math.min(window.innerWidth, window.innerHeight);
      tmx = (e.clientX - window.innerWidth  * 0.5) / mn * 2.7;
      tmy = (window.innerHeight * 0.5 - e.clientY) / mn * 2.7;
    }, { passive: true });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      // курсор догоняем с инерцией — резкие рывки мыши не дёргают картинку
      mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
      var time = (now - t0) / 1000;
      if (field)   { try { field.draw(time, mx, my); } catch (e) {} }
      if (tracers) { try { tracers.draw(time, mx, my, dt); } catch (e) {} }
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
      new MutationObserver(function () {
        if (field) field.readColors();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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
        if (reduced) return;
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
      if (!b || reduced) return;
      var r = b.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2.1;
      var s = el('span', 'mf-ripple', b);
      s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left) + 'px';
      s.style.top  = (e.clientY - r.top)  + 'px';
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 640);
    }, { passive: true });
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

    var targets = document.querySelectorAll('.mf-reveal');
    if (!targets.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
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
    nav: initNav
  };
})();