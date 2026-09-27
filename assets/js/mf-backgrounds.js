/* ============================================================================
   MathFrame — 2D-слои процедурного фона разделов
   ----------------------------------------------------------------------------
   Дополнение к mathframe-ui.js (грузится им самим асинхронно, страницы
   подключать ничего не должны). Рисует поверх WebGL-изолиний лёгкий
   Canvas2D-слой со своей темой у каждого раздела:

     home      — «небо математики»: плавающие формулы (мини-вёрстка шрифтами
                 KaTeX), крупные символы, каркасные многогранники, окружности с
                 построениями, единичная окружность, графики, фрагменты
                 координатной сетки, золотая спираль.
     reference — «чертёжная доска»: построения циркулем и линейкой (треугольник,
                 серединные перпендикуляры, описанная окружность) проявляются
                 шаг за шагом; покачиваются полупрозрачные «страницы знаний».
     services  — «графопостроитель»: панели с осями, кривая чертится и
                 перетекает в следующую функцию, точка с касательной бежит по
                 графику (под курсором — следует за ним); подписи y = f(x).
     forum     — «граф связей»: узлы и рёбра, по рёбрам бегут сообщения-сигналы,
                 идеи расходятся цепочкой; курсор — ещё один участник.
     ai-agent  — «нейросеть»: слои нейронов, прямые проходы сигналов, из выхода
                 вылетают «токены»-символы.

   Всё закреплено на странице (см. «МИР СТРАНИЦЫ»): якорь элемента неподвижен
   относительно контента и прокручивается вместе с ним (глубже — чуть
   медленнее, в пределах 14%), вокруг якоря — ограниченное покачивание и
   пружина; ничего не уплывает со временем.
   Общий интерактив с полем: состояние курсора/тача (I.sx, I.sy, I.pres) и
   кольца от кликов (I.pulses) берутся из mathframe-ui.js, поэтому элементы
   мягко расступаются у курсора и подпрыгивают на той же волне, что и линии.
   Читаемость: яркость элемента зависит от положения — за колонкой контента
   тихо, на полях ярче (readMask). Телефон: меньше элементов, DPR ≤ 1.75.
   Светлая тема: те же элементы «чернилами» (palette.ink) с оттенком акцента;
   смена темы на лету — цвета переливаются вместе с палитрой (stepPalette).
   ========================================================================== */
(function () {
  'use strict';
  var UI = window.MathFrameUI;
  if (!UI || !UI.bg || window.__mfBgLayers) return;
  window.__mfBgLayers = true;

  var api = UI.bg, I = api.I, PAL = api.palette;
  var PAGE = api.page();
  var MOBILE = api.mobile, LITE = api.lite;

  var MAINF = "MFDisplay, KaTeX_Main, 'Cambria Math', 'Times New Roman', serif";
  var MATHF = "MFMath, KaTeX_Math, 'Cambria Math', 'Times New Roman', serif";

  /* ------------------------------------------------------------ утилиты */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sstep(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function ease(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  function easeIO(x) { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ------------------------------------------------------------ цвета
     kind: 'a' (цвет раздела), 'b', 'c' (акцент), 'ink' (нейтральные линии).
     Тёмная тема — мягко светящийся тон; светлая — «чернила» с оттенком тона.
     Смешение по PAL.dark (0..1), поэтому во время смены темы — перелив. */
  var WHITE = [0.86, 0.90, 0.98];
  var TONES = { a: [0, 0, 0], b: [0, 0, 0], c: [0, 0, 0], ink: [0, 0, 0] };
  var TKEY = { a: '', b: '', c: '', ink: '' };
  function updateTones() {
    var d = PAL.dark, K = PAL.ink;
    for (var kind in TONES) {
      var src = kind === 'ink' ? null : PAL[kind], out = TONES[kind];
      for (var i = 0; i < 3; i++) {
        var dk = src ? src[i] + (WHITE[i] - src[i]) * 0.18 : PAL.a[i] + (WHITE[i] - PAL.a[i]) * 0.55;
        var lt = src ? K[i] + (src[i] - K[i]) * 0.62 : K[i];
        out[i] = Math.round((lt + (dk - lt) * d) * 255);
      }
      // ключ для перекраски спрайтов: квантуем, чтобы перелив темы не
      // перекрашивал их на каждом кадре
      TKEY[kind] = (out[0] >> 2) + ',' + (out[1] >> 2) + ',' + (out[2] >> 2);
    }
  }
  function rgba(kind, a) {
    var c = TONES[kind] || TONES.ink;
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a > 0 ? (a > 1 ? 1 : a) : 0).toFixed(3) + ')';
  }
  // Светлая тема тише: тёмное на белом читается сильнее светлого на тёмном
  function themeGain() { return 0.88 + 0.12 * PAL.dark; }

  /* Читаемость: за колонкой контента элементы приглушены, на полях — ярче.
     На узком экране контент занимает всю ширину — ровно и тихо везде. */
  function readMask(x, y, W, H) {
    // тихая зона раздела (справочник: колонка темы) — см. PAGE_MOTIF.calm
    var k = api.calmAt ? api.calmAt(x, y) : 1;
    if (W < 700) return 0.5 * k;
    var cw = Math.min(W, 1180) * 0.5, dx = Math.abs(x - W * 0.5);
    return (0.24 + 0.76 * sstep(cw * 0.6, cw * 1.08, dx)) * k;
  }

  /* Над контентом ли точка: редкий hit-test (раз в ~0.4 с на элемент).
     Небольшой блок (текст, кнопка, картинка, карточка) под элементом — элемент
     гаснет до ~30%; крупные контейнеры (main, hero целиком) — не считаются.
     Наши канвасы pointer-events:none, поэтому в hit-test не попадают. */
  function overContent(x, y, W, H) {
    if (x < 0 || y < 0 || x > W || y > H) return false;
    var el = document.elementFromPoint(x, y);
    if (!el || el === document.body || el === document.documentElement) return false;
    if (!el.closest || !el.closest('main, #app-header, #app-footer, header, footer')) return false;
    var r = el.getBoundingClientRect();
    return r.width * r.height < W * H * 0.35;
  }
  // e.occ — плавный множитель яркости 0.3..1; e.occT — когда перепроверять
  function occlusion(e, x, y, W, H, time) {
    if (e.occ == null) { e.occ = 1; e.occT = time + Math.random() * 0.4; e.occW = 1; }
    if (time >= e.occT) {
      e.occT = time + 0.35 + Math.random() * 0.15;
      e.occW = overContent(x, y, W, H) ? 0.3 : 1;
    }
    e.occ += (e.occW - e.occ) * 0.06;
    return e.occ;
  }

  /* Кольца от кликов в экранных координатах */
  var _p = [0, 0];
  function rings(W, H) {
    var out = [], pl = I.pulses, mn = Math.min(W, H) || 1;
    for (var j = 0; j < api.PULSE_MAX; j++) {
      var age = pl[j * 4 + 2];
      if (age < 0) continue;
      api.fromField(pl[j * 4], pl[j * 4 + 1], _p);
      var env = 1 - age / api.PULSE_LIFE;
      out.push({ x: _p[0], y: _p[1], r: age * api.PULSE_SPEED * mn / api.SCALE, e: env * env });
    }
    return out;
  }
  function cursorOn() { return I.pres > 0.01 && I.sx > -1e3; }

  /* ------------------------------------------------------------ холст слоя
     fixed-канвас над виньеткой, под контентом. Проявление: прозрачный первый
     кадр -> .mf-ready (CSS opacity) и собственная кривая яркости L.fade. */
  function Layer() {
    var cv = document.createElement('canvas');
    cv.className = 'mf-bg-layer';
    cv.setAttribute('aria-hidden', 'true');
    var ref = document.querySelector('.mf-vignette');
    if (ref && ref.parentNode) ref.parentNode.insertBefore(cv, ref.nextSibling);
    else document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    var L = { cv: cv, ctx: ctx, W: 1, H: 1, dpr: 1, t0: -1, fade: 0, shown: false };
    var maxDpr = MOBILE ? 1.75 : 1.5;
    L.resize = function () {
      var W = cv.clientWidth || window.innerWidth, H = cv.clientHeight || window.innerHeight;
      var d = Math.min(window.devicePixelRatio || 1, maxDpr);
      if (api.perf.scale < 1) d = Math.max(1, d * 0.8);
      var w = Math.max(1, Math.round(W * d)), h = Math.max(1, Math.round(H * d));
      var changed = W !== L.W || H !== L.H;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      L.W = W; L.H = H; L.dpr = d;
      return changed;
    };
    L.begin = function (time) {
      var ch = L.resize();
      // проявление копит время кадров (шаг ≤ 50 мс), а не настенное:
      // подвисание страницы не превращается в скачок яркости
      if (L.t0 < 0) { L.t0 = time; L.acc = 0; }
      else L.acc += Math.min(0.05, Math.max(0, time - L.last));
      L.last = time;
      L.fade = ease(L.acc / 1.6);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      if (!L.shown) {
        L.shown = true;
        requestAnimationFrame(function () { cv.classList.add('mf-ready'); });
      }
      updateTones();
      return ch;
    };
    L.clear = function () {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    };
    L.resize();
    return L;
  }

  /* =====================================================================
     МИНИ-ВЁРСТКА ФОРМУЛ
     Узлы: 'текст' (прямой, KaTeX_Main), V('x') (курсив, KaTeX_Math),
     [..] — строка, SUP/SUB/SS — индексы, FR — дробь, SQ — корень,
     OP — большой оператор с пределами, MAT — матрица/определитель, SP — отступ.
     Вёрстка идёт один раз в оффскрин-канвас (белая маска), дальше спрайт
     лишь перекрашивается под тему (source-in) и рисуется drawImage. */
  var TS = (function () {
    var mc = document.createElement('canvas').getContext('2d');
    function font(s, it) { return (it ? 'italic ' : '') + s.toFixed(1) + 'px ' + (it ? MATHF : MAINF); }
    function txt(str, s, it) {
      mc.font = font(s, it);
      var w = mc.measureText(str).width;
      return { w: w + (it ? s * 0.04 : 0), a: s * 0.72, d: s * 0.22,
               draw: function (c, x, y) { c.font = font(s, it); c.fillText(str, x, y); } };
    }
    function row(bs) {
      var w = 0, a = 0, d = 0;
      for (var i = 0; i < bs.length; i++) { w += bs[i].w; a = Math.max(a, bs[i].a); d = Math.max(d, bs[i].d); }
      return { w: w, a: a, d: d, draw: function (c, x, y) {
        for (var i = 0; i < bs.length; i++) { bs[i].draw(c, x, y); x += bs[i].w; }
      } };
    }
    function lay(n, s) {
      if (n == null) return { w: 0, a: 0, d: 0, draw: function () {} };
      if (typeof n === 'string') return txt(n, s, false);
      if (Array.isArray(n)) return row(n.map(function (c) { return lay(c, s); }));
      if (n.v) return txt(n.v, s, true);
      if (n.sp != null) return { w: n.sp * s, a: 0, d: 0, draw: function () {} };
      if (n.sup != null || n.sub != null) {
        var b = lay(n.b, s), p = n.sup != null ? lay(n.sup, s * 0.66) : null,
            q = n.sub != null ? lay(n.sub, s * 0.66) : null;
        var up = s * 0.42, dn = s * 0.20;
        return { w: b.w + Math.max(p ? p.w : 0, q ? q.w : 0) + s * 0.06,
                 a: Math.max(b.a, p ? p.a + up : 0), d: Math.max(b.d, q ? q.d + dn : 0),
                 draw: function (c, x, y) {
                   b.draw(c, x, y);
                   if (p) p.draw(c, x + b.w + s * 0.03, y - up);
                   if (q) q.draw(c, x + b.w + s * 0.01, y + dn);
                 } };
      }
      if (n.fr) {
        var nu = lay(n.fr[0], s * 0.8), de = lay(n.fr[1], s * 0.8);
        var ax = s * 0.26, g = s * 0.14, w = Math.max(nu.w, de.w) + s * 0.24;
        return { w: w + s * 0.16, a: ax + g + nu.d + nu.a, d: de.a + g - ax + de.d,
                 draw: function (c, x, y) {
                   var x0 = x + s * 0.08;
                   nu.draw(c, x0 + (w - nu.w) / 2, y - ax - g - nu.d);
                   de.draw(c, x0 + (w - de.w) / 2, y - ax + g + de.a);
                   c.fillRect(x0, y - ax - s * 0.03, w, Math.max(1, s * 0.055));
                 } };
      }
      if (n.sq != null) {
        var inn = lay(n.sq, s), pad = s * 0.12, hw = s * 0.52;
        return { w: hw + inn.w + s * 0.1, a: inn.a + pad + s * 0.08, d: inn.d + s * 0.05,
                 draw: function (c, x, y) {
                   var top = y - inn.a - pad;
                   c.save(); c.lineWidth = Math.max(1, s * 0.055); c.strokeStyle = c.fillStyle;
                   c.lineJoin = 'round'; c.beginPath();
                   c.moveTo(x + hw * 0.05, y - s * 0.22); c.lineTo(x + hw * 0.28, y - s * 0.30);
                   c.lineTo(x + hw * 0.55, y + inn.d); c.lineTo(x + hw, top);
                   c.lineTo(x + hw + inn.w + s * 0.06, top); c.stroke(); c.restore();
                   inn.draw(c, x + hw + s * 0.03, y);
                 } };
      }
      if (n.op) {
        var k = n.k || 1.5, o = txt(n.op, s * k, false);
        var lo = n.lo != null ? lay(n.lo, s * 0.6) : null, hi = n.hi != null ? lay(n.hi, s * 0.6) : null;
        if (n.side) {           // пределы справа (интеграл)
          var ww = o.w + Math.max(lo ? lo.w : 0, hi ? hi.w : 0) + s * 0.2;
          return { w: ww, a: s * 1.0 + (hi ? s * 0.2 : 0), d: s * 0.5 + (lo ? s * 0.2 : 0),
                   draw: function (c, x, y) {
                     o.draw(c, x, y + s * 0.30);
                     if (hi) hi.draw(c, x + o.w + s * 0.02, y - s * 0.78);
                     if (lo) lo.draw(c, x + o.w - s * 0.18, y + s * 0.58);
                   } };
        }
        var w2 = Math.max(o.w, lo ? lo.w : 0, hi ? hi.w : 0) + s * 0.16;
        var oa = k > 1.2 ? s * 0.98 : s * 0.72, od = k > 1.2 ? s * 0.42 : s * 0.22, oy = k > 1.2 ? s * 0.30 : 0;
        return { w: w2, a: oa + (hi ? hi.a + hi.d + s * 0.06 : 0), d: od + (lo ? lo.a + lo.d + s * 0.02 : 0),
                 draw: function (c, x, y) {
                   o.draw(c, x + (w2 - o.w) / 2, y + oy);
                   if (hi) hi.draw(c, x + (w2 - hi.w) / 2, y - oa - hi.d - s * 0.04);
                   if (lo) lo.draw(c, x + (w2 - lo.w) / 2, y + od + lo.a);
                 } };
      }
      if (n.mat) {
        var R = n.mat.map(function (r) { return r.map(function (c) { return lay(c, s * 0.9); }); });
        var cols = R[0].length, cw = [], j, i;
        for (j = 0; j < cols; j++) { cw[j] = 0; for (i = 0; i < R.length; i++) cw[j] = Math.max(cw[j], R[i][j].w); }
        var rh = s * 1.12, gap = s * 0.6, padm = s * 0.34, H = rh * R.length, axm = s * 0.26;
        var inner = cw.reduce(function (a, b) { return a + b; }, 0) + gap * (cols - 1);
        var tw = inner + padm * 2;
        return { w: tw + s * 0.1, a: H / 2 + axm + s * 0.05, d: H / 2 - axm + s * 0.05,
                 draw: function (c, x, y) {
                   var top = y - axm - H / 2, bot = top + H;
                   c.save(); c.lineWidth = Math.max(1, s * 0.06); c.strokeStyle = c.fillStyle; c.beginPath();
                   if (n.bars) {
                     c.moveTo(x + padm * 0.4, top); c.lineTo(x + padm * 0.4, bot);
                     c.moveTo(x + tw - padm * 0.4, top); c.lineTo(x + tw - padm * 0.4, bot);
                   } else {
                     var bw = s * 0.18;
                     c.moveTo(x + padm * 0.4 + bw, top); c.lineTo(x + padm * 0.4, top);
                     c.lineTo(x + padm * 0.4, bot); c.lineTo(x + padm * 0.4 + bw, bot);
                     c.moveTo(x + tw - padm * 0.4 - bw, top); c.lineTo(x + tw - padm * 0.4, top);
                     c.lineTo(x + tw - padm * 0.4, bot); c.lineTo(x + tw - padm * 0.4 - bw, bot);
                   }
                   c.stroke(); c.restore();
                   for (var i = 0; i < R.length; i++) {
                     var cx = x + padm, by = top + rh * (i + 0.74);
                     for (var j = 0; j < cols; j++) {
                       R[i][j].draw(c, cx + (cw[j] - R[i][j].w) / 2, by);
                       cx += cw[j] + gap;
                     }
                   }
                 } };
      }
      return lay(String(n), s);
    }
    // спрайт: белая маска формулы + кеш перекрашенных копий по тонам
    function sprite(node, size) {
      var b = lay(node, size), pad = Math.ceil(size * 0.35);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.ceil(b.w + pad * 2), h = Math.ceil(b.a + b.d + pad * 2);
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
      var c = cv.getContext('2d');
      c.scale(dpr, dpr); c.fillStyle = '#fff'; c.textBaseline = 'alphabetic';
      b.draw(c, pad, pad + b.a);
      return { mask: cv, w: w, h: h, tint: {} };
    }
    function tinted(sp, kind) {
      var t = sp.tint[kind];
      if (!t) {
        var cv = document.createElement('canvas');
        cv.width = sp.mask.width; cv.height = sp.mask.height;
        t = sp.tint[kind] = { cv: cv, key: '' };
      }
      if (t.key !== TKEY[kind]) {
        var c = t.cv.getContext('2d'), col = TONES[kind];
        c.globalCompositeOperation = 'source-over';
        c.clearRect(0, 0, t.cv.width, t.cv.height);
        c.drawImage(sp.mask, 0, 0);
        c.globalCompositeOperation = 'source-in';
        c.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
        c.fillRect(0, 0, t.cv.width, t.cv.height);
        c.globalCompositeOperation = 'source-over';
        t.key = TKEY[kind];
      }
      return t.cv;
    }
    return { lay: lay, sprite: sprite, tinted: tinted, font: font };
  })();

  function V(x) { return { v: x }; }
  function SUP(b, p) { return { b: b, sup: p }; }
  function SUB(b, q) { return { b: b, sub: q }; }
  function FR(a, b) { return { fr: [a, b] }; }
  function SQ(x) { return { sq: x }; }
  function OP(o, lo, hi, side, k) { return { op: o, lo: lo, hi: hi, side: side, k: k }; }
  function MAT(m, bars) { return { mat: m, bars: bars }; }
  function SP(w) { return { sp: w }; }

  // Шрифты KaTeX подключены через @font-face в common.css; спрайты верстаем,
  // когда они реально загружены (иначе в маску «запечётся» запасной шрифт)
  function whenFonts(cb) {
    var done = false;
    function go() { if (done) return; done = true; cb(); }
    try {
      if (document.fonts && document.fonts.load) {
        Promise.all([document.fonts.load('20px MFDisplay'), document.fonts.load('italic 20px MFMath')])
          .then(go, go);
        setTimeout(go, 2500);
        return;
      }
    } catch (e) {}
    go();
  }

  /* =====================================================================
     ГЕОМЕТРИЧЕСКИЕ ЭЛЕМЕНТЫ (рисуются вживую, центр в 0,0; R — «радиус»)
     ===================================================================== */
  var PHI = (1 + Math.sqrt(5)) / 2;
  function solid(verts, edgeLen) {
    var n = 0, v = verts.map(function (p) { var l = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]); n = l; return p; });
    var e = [];
    for (var i = 0; i < v.length; i++) for (var j = i + 1; j < v.length; j++) {
      var dx = v[i][0] - v[j][0], dy = v[i][1] - v[j][1], dz = v[i][2] - v[j][2];
      if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - edgeLen) < 1e-3) e.push([i, j]);
    }
    return { v: v.map(function (p) { return [p[0] / n, p[1] / n, p[2] / n]; }), e: e };
  }
  var SOLIDS = {
    cube: solid([[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], 2),
    octa: solid([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], Math.SQRT2),
    tetra: solid([[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]], 2 * Math.SQRT2),
    icosa: solid([[0,1,PHI],[0,-1,PHI],[0,1,-PHI],[0,-1,-PHI],[1,PHI,0],[-1,PHI,0],[1,-PHI,0],[-1,-PHI,0],
                  [PHI,0,1],[-PHI,0,1],[PHI,0,-1],[-PHI,0,-1]], 2)
  };
  var _pv = [];
  function drawSolid(c, R, t, A, e) {
    var S = SOLIDS[e.solid], ax = t * e.w1 + e.ph, ay = t * e.w2 + e.ph * 1.7;
    var ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay);
    for (var i = 0; i < S.v.length; i++) {
      var p = S.v[i], x = p[0], y = p[1] * ca - p[2] * sa, z = p[1] * sa + p[2] * ca;
      var x2 = x * cb + z * sb, z2 = -x * sb + z * cb, f = 1 / (1 + z2 * 0.28);
      _pv[i] = [x2 * R * f, y * R * f, z2];
    }
    c.lineWidth = 1;
    for (var k = 0; k < S.e.length; k++) {
      var a = _pv[S.e[k][0]], b = _pv[S.e[k][1]];
      var front = 0.5 - (a[2] + b[2]) * 0.25;      // дальние рёбра тусклее
      c.strokeStyle = rgba(e.col, A * (0.35 + 0.65 * front));
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    c.fillStyle = rgba(e.col, A * 0.9);
    for (var m = 0; m < S.v.length; m++) {
      if (_pv[m][2] > 0.3) continue;
      c.beginPath(); c.arc(_pv[m][0], _pv[m][1], 1.4, 0, 6.2832); c.fill();
    }
  }
  // окружность с вписанным треугольником и серединными перпендикулярами
  function drawCircleConstr(c, R, t, A, e) {
    var th = [e.ph, e.ph + 2.1 + 0.25 * Math.sin(t * 0.21), e.ph + 4.2 + 0.3 * Math.sin(t * 0.17 + 1)];
    var P = th.map(function (q) { return [Math.cos(q + t * 0.05) * R, Math.sin(q + t * 0.05) * R]; });
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.8);
    c.beginPath(); c.arc(0, 0, R, 0, 6.2832); c.stroke();
    c.strokeStyle = rgba(e.col, A);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]); c.lineTo(P[2][0], P[2][1]); c.closePath(); c.stroke();
    c.setLineDash([3, 4]);
    c.strokeStyle = rgba('b', A * 0.7);
    for (var i = 0; i < 3; i++) {
      var a = P[i], b = P[(i + 1) % 3], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var l = Math.sqrt(mx * mx + my * my) || 1;
      c.beginPath(); c.moveTo(mx * 1.25, my * 1.25); c.lineTo(-mx / l * R * 0.25, -my / l * R * 0.25); c.stroke();
    }
    c.setLineDash([]);
    c.fillStyle = rgba('c', A);
    c.beginPath(); c.arc(0, 0, 2.2, 0, 6.2832); c.fill();
    c.fillStyle = rgba(e.col, A);
    for (var j = 0; j < 3; j++) { c.beginPath(); c.arc(P[j][0], P[j][1], 2, 0, 6.2832); c.fill(); }
  }
  // единичная окружность: угол, sin и cos как проекции
  function drawUnit(c, R, t, A, e) {
    var q = t * 0.32 + e.ph, px = Math.cos(q) * R, py = -Math.sin(q) * R;
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.7);
    c.beginPath(); c.moveTo(-R * 1.25, 0); c.lineTo(R * 1.25, 0); c.moveTo(0, -R * 1.25); c.lineTo(0, R * 1.25); c.stroke();
    c.strokeStyle = rgba(e.col, A);
    c.beginPath(); c.arc(0, 0, R, 0, 6.2832); c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.lineTo(px, py); c.stroke();
    c.lineWidth = 1.6;
    c.strokeStyle = rgba('c', A);           // sin
    c.beginPath(); c.moveTo(px, 0); c.lineTo(px, py); c.stroke();
    c.strokeStyle = rgba('b', A);           // cos
    c.beginPath(); c.moveTo(0, 0); c.lineTo(px, 0); c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = rgba(e.col, A * 0.8);
    var qq = ((q % 6.2832) + 6.2832) % 6.2832;
    c.beginPath(); c.arc(0, 0, R * 0.22, 0, -qq, true); c.stroke();
    c.fillStyle = rgba(e.col, A);
    c.beginPath(); c.arc(px, py, 2.3, 0, 6.2832); c.fill();
  }
  function arrow(c, x0, y0, x1, y1, h) {
    var a = Math.atan2(y1 - y0, x1 - x0);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.moveTo(x1 - Math.cos(a - 0.45) * h, y1 - Math.sin(a - 0.45) * h); c.lineTo(x1, y1);
    c.lineTo(x1 - Math.cos(a + 0.45) * h, y1 - Math.sin(a + 0.45) * h);
    c.stroke();
  }
  var PLOTF = [
    function (x, t) { return Math.sin(x * 2.2 - t * 0.7) * 0.55; },
    function (x) { return x * x * 1.1 - 0.5; },
    function (x) { return (x * x * x * 1.6 - x * 0.9); },
    function (x) { return Math.exp(-x * x * 6) * 0.8 - 0.2; }
  ];
  // мини-график: оси со стрелками, засечки, кривая, бегущая точка
  function drawPlot(c, R, t, A, e) {
    var w = R * 1.25, h = R * 0.85;
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.8);
    arrow(c, -w, 0, w, 0, 5); arrow(c, 0, h, 0, -h, 5);
    c.beginPath();
    for (var k = -3; k <= 3; k++) { if (!k) continue; var tx = k * w / 4; c.moveTo(tx, -2.5); c.lineTo(tx, 2.5); }
    c.stroke();
    var f = PLOTF[e.fn], s = w * 0.9;
    c.strokeStyle = rgba(e.col, A);
    c.lineWidth = 1.4;
    c.beginPath();
    for (var i = 0; i <= 48; i++) {
      var x = -1 + i / 24, y = clamp(f(x, t), -1.1, 1.1);
      if (i) c.lineTo(x * s, -y * h * 0.9); else c.moveTo(x * s, -y * h * 0.9);
    }
    c.stroke();
    var xm = Math.sin(t * 0.4 + e.ph) * 0.85, ym = clamp(f(xm, t), -1.1, 1.1);
    c.setLineDash([2, 3]); c.lineWidth = 1;
    c.strokeStyle = rgba('b', A * 0.7);
    c.beginPath(); c.moveTo(xm * s, 0); c.lineTo(xm * s, -ym * h * 0.9); c.stroke();
    c.setLineDash([]);
    c.fillStyle = rgba('c', A);
    c.beginPath(); c.arc(xm * s, -ym * h * 0.9, 2.4, 0, 6.2832); c.fill();
  }
  // фрагмент координатной сетки в перспективе с вектором
  function drawGrid(c, R, t, A, e) {
    c.save();
    c.transform(1, 0, -0.35, 0.62, 0, 0);
    var st = R / 3;
    c.lineWidth = 1;
    for (var k = -3; k <= 3; k++) {
      var o = k * st, len = Math.sqrt(Math.max(0, R * R - o * o)), fa = 1 - Math.abs(k) / 3.6;
      c.strokeStyle = rgba(k ? 'ink' : e.col, A * (k ? 0.45 : 0.95) * fa);
      c.beginPath(); c.moveTo(-len, o); c.lineTo(len, o); c.moveTo(o, -len); c.lineTo(o, len); c.stroke();
    }
    var q = t * 0.25 + e.ph;
    c.strokeStyle = rgba('c', A);
    c.lineWidth = 1.5;
    arrow(c, 0, 0, Math.cos(q) * R * 0.8, Math.sin(q) * R * 0.8, 6);
    c.restore();
  }
  // прямоугольный треугольник: отметка прямого угла, дуга угла, подписи
  function drawTri(c, R, t, A, e) {
    var a = R * 1.3, b = R * 0.9, x0 = -a / 2, y0 = b / 2;
    c.lineWidth = 1.1;
    c.strokeStyle = rgba(e.col, A);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + a, y0); c.lineTo(x0, y0 - b); c.closePath(); c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.8);
    var m = R * 0.14;
    c.beginPath(); c.moveTo(x0 + m, y0); c.lineTo(x0 + m, y0 - m); c.lineTo(x0, y0 - m); c.stroke();
    var ang = Math.atan2(b, a);
    c.strokeStyle = rgba('c', A);
    c.beginPath(); c.arc(x0 + a, y0, R * 0.3, Math.PI, Math.PI + ang); c.stroke();
    // высота на гипотенузу — пунктиром
    var hx = x0 + (b * b * a) / (a * a + b * b), hy = y0 - (a * a * b) / (a * a + b * b);
    c.setLineDash([3, 3]); c.strokeStyle = rgba('b', A * 0.7);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(hx, hy); c.stroke(); c.setLineDash([]);
    c.fillStyle = rgba(e.col, A);
    c.font = TS.font(R * 0.3, true);
    c.textAlign = 'center';
    c.fillText('a', x0 + a / 2, y0 + R * 0.32);
    c.fillText('b', x0 - R * 0.2, y0 - b / 2 + R * 0.1);
    c.fillText('c', x0 + a / 2 + R * 0.18, y0 - b / 2 - R * 0.1);
    c.textAlign = 'start';
  }
  // золотая (логарифмическая) спираль r = e^{bθ}, b = ln φ / (π/2)
  function drawSpiral(c, R, t, A, e) {
    var bb = Math.log(PHI) / (Math.PI / 2), th0 = 4 * Math.PI, sc = R / Math.exp(bb * th0);
    c.lineWidth = 1.2;
    c.strokeStyle = rgba(e.col, A);
    c.beginPath();
    for (var i = 0; i <= 160; i++) {
      var th = i / 160 * th0, r = Math.exp(bb * th) * sc, q = th + t * 0.08;
      var x = Math.cos(q) * r, y = Math.sin(q) * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.5);
    c.setLineDash([2, 4]);
    for (var k = 0; k < 4; k++) {
      var qa = k * Math.PI / 2 + t * 0.08;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(qa) * R, Math.sin(qa) * R); c.stroke();
    }
    c.setLineDash([]);
  }
  // «страница знаний»: лист с заголовком, строками и мини-формулой
  function drawPage(c, R, t, A, e) {
    var w = R * 1.3, h = R * 1.75, x = -w / 2, y = -h / 2;
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.9);
    c.beginPath();
    c.moveTo(x, y); c.lineTo(x + w - R * 0.22, y); c.lineTo(x + w, y + R * 0.22); c.lineTo(x + w, y + h);
    c.lineTo(x, y + h); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(x + w - R * 0.22, y); c.lineTo(x + w - R * 0.22, y + R * 0.22); c.lineTo(x + w, y + R * 0.22); c.stroke();
    c.strokeStyle = rgba(e.col, A);
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + R * 0.14, y + R * 0.28); c.lineTo(x + w * 0.62, y + R * 0.28); c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = rgba('ink', A * 0.55);
    var L = e.lines;
    for (var i = 0; i < L.length; i++) {
      var ly = y + R * 0.55 + i * R * 0.17;
      if (ly > y + h - R * 0.15) break;
      c.beginPath(); c.moveTo(x + R * 0.14, ly); c.lineTo(x + R * 0.14 + (w - R * 0.28) * L[i], ly); c.stroke();
    }
    // маленький чертёж на странице
    c.strokeStyle = rgba('b', A * 0.8);
    c.beginPath(); c.arc(x + w * 0.7, y + h * 0.78, R * 0.16, 0, 6.2832); c.stroke();
    c.beginPath(); c.moveTo(x + w * 0.7 - R * 0.28, y + h * 0.78 + R * 0.16); c.lineTo(x + w * 0.7 + R * 0.28, y + h * 0.78 + R * 0.16); c.stroke();
  }

  /* =====================================================================
     МИР СТРАНИЦЫ — общая модель положения для всех 2D-сцен
       • фон «нарисован на странице»: у элемента неподвижный ЯКОРЬ в
         координатах страницы; экранная y = якорь − pf·scrollY, где pf —
         скорость слоя 0.86..1 (глубже — чуть медленнее: лёгкий параллакс);
       • якоря раскладываются равномерно (jittered-сетка со сдвигом рядов) по
         полосе высотой Hp = 3 экрана, и раскладка повторяется с этим периодом:
         длинная страница заполнена на всю высоту, а число элементов ограничено;
       • x-якорь — доля ширины с отступом на размер элемента и амплитуду
         покачивания: ничего не вылезает за левый/правый край; при ресайзе якорь
         плавно переезжает на новое место;
       • движение — только ограниченное покачивание вокруг якоря плюс пружина
         (курсор, волна клика), которая всегда возвращает к якорю. Ничего не
         накапливается: через час элемент там же, где был.
     ===================================================================== */
  var SCREENS = 3;
  function scrollY() { return I.scrollY || 0; }
  function periodOf(L) { return Math.max(200, L.H) * SCREENS; }
  // экранная y первой копии (с периодом Hp) якоря ay, видимой с запасом m
  function firstCopy(ay, pf, Hp, m) {
    var b = ay - pf * scrollY();
    return b + Math.ceil((-m - b) / Hp) * Hp;
  }
  // равномерная раскладка: jittered-сетка cols × rows, ряды через один
  // сдвинуты на четверть клетки (меньше «колонок»); нормированные [u, v]
  function gridAnchors(cols, rows, jit) {
    var pts = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var sh = (r & 1) ? 0.25 : -0.25;
      pts.push([(c + 0.5 + sh + (Math.random() - 0.5) * jit) / cols,
                (r + 0.5 + (Math.random() - 0.5) * jit) / rows]);
    }
    return pts;
  }
  // сетка для count элементов на экран при ширине W
  function gridFor(W, perScreen) {
    var cols = W >= 1200 ? 6 : W >= 900 ? 5 : W >= 600 ? 4 : 2;
    var rps = Math.max(2, Math.round(perScreen / cols));
    return { cols: cols, rows: rps * SCREENS };
  }
  // пружина к нулю с целью (tx, ty): полукритическое затухание, без дрейфа
  function spring(e, tx, ty, dt, lim) {
    e.vx += ((tx - e.dx) * 22 - e.vx * 7.5) * dt;
    e.vy += ((ty - e.dy) * 22 - e.vy * 7.5) * dt;
    e.dx = clamp(e.dx + e.vx * dt, -lim, lim);
    e.dy = clamp(e.dy + e.vy * dt, -lim, lim);
  }

  /* =====================================================================
     ПЛАВАЮЩИЕ ЭЛЕМЕНТЫ — общая механика (главная, справочник, мини-сервисы)
       • глубина z: размер, яркость, скорость слоя (pf) и параллакс мыши;
       • мягко расступаются у курсора и подсвечиваются;
       • волна от клика толкает их и слегка раскачивает;
       • readMask — за контентом тихо, на полях ярче.
     ===================================================================== */
  function Floaters(L, items, opt) {
    var alpha = opt.alpha || 0.3, Hp = opt.period || periodOf(L);
    items.sort(function (a, b) { return a.z - b.z; });
    items.forEach(function (e) {
      e.dx = 0; e.dy = 0; e.vx = 0; e.vy = 0; e.hl = 0; e.sp = 0; e.spv = 0; e.ax = null;
      e.pf = 0.86 + 0.14 * clamp((e.z - 0.4) / 0.6, 0, 1);
      e.amp = rnd(8, 16) * (0.6 + 0.4 * e.z);
      e.w1 = rnd(0.10, 0.20); e.w2 = rnd(0.06, 0.13); e.p1 = rnd(0, 6.2832); e.p2 = rnd(0, 6.2832);
      if (e.appear == null) e.appear = 0;
    });
    var api_ = {
      items: items, period: Hp,
      draw: function (time, dt) {
        var W = L.W, H = L.H, c = L.ctx;
        var mx = 0, my = 0;
        if (I.sx > -1e3 && !I.touch) { mx = (I.sx - W / 2) / W; my = (I.sy - H / 2) / H; }
        var R = rings(W, H), on = cursorOn(), ke = 1 - Math.exp(-dt * 3);
        for (var i = 0; i < items.length; i++) {
          var e = items[i], z = e.z;
          if (e.ready) e.appear = Math.min(1, e.appear + dt / 1.4);
          var hw = e.spr ? e.spr.w / 2 : e.size * 1.4, hh = e.spr ? e.spr.h / 2 : e.size * 1.3;
          // якорь по x с отступом: элемент со всем покачиванием остаётся в окне
          var mg = hw + e.amp + 24 * z + 10;
          var txa = mg * 2 >= W ? W / 2 : clamp(e.u * W, mg, W - mg);
          e.ax = e.ax == null ? txa : e.ax + (txa - e.ax) * ke;
          // ограниченное покачивание вокруг якоря + параллакс мыши
          var bx = e.ax + e.amp * (0.65 * Math.sin(time * e.w1 + e.p1) + 0.35 * Math.sin(time * e.w2 * 1.7 + e.p2)) - mx * 46 * z;
          var by = e.v * Hp + e.amp * (0.6 * Math.cos(time * e.w2 + e.p2) + 0.4 * Math.sin(time * e.w1 * 1.3 + e.p1)) - my * 30 * z;
          var m = hh + e.amp + 140, y0 = firstCopy(by, e.pf, Hp, m), vis = y0 < H + m;
          var tx = 0, ty = 0, hl = 0;
          if (vis) {
            if (on) {
              var dx = bx - I.sx, dy = y0 - I.sy, d = Math.sqrt(dx * dx + dy * dy) + 1e-3, Rr = 140 + e.size;
              if (d < Rr) { var q = 1 - d / Rr; tx = dx / d * q * q * 70 * I.pres; ty = dy / d * q * q * 70 * I.pres; hl = q * I.pres; }
            }
            for (var r = 0; r < R.length; r++) {
              var rx = bx + e.dx - R[r].x, ry = y0 + e.dy - R[r].y, rd = Math.sqrt(rx * rx + ry * ry) + 1e-3;
              var wv = (rd - R[r].r) / (60 + e.size * 0.5), w = Math.exp(-wv * wv) * R[r].e;
              if (w > 0.01) {
                e.vx += rx / rd * w * 900 * dt; e.vy += ry / rd * w * 900 * dt;
                e.spv += (e.p1 > 3 ? 1 : -1) * w * 5 * dt;
                hl = Math.max(hl, w * 0.8);
              }
            }
          }
          spring(e, tx, ty, dt, 110);
          // раскачка от волны — затухающая пружина угла
          e.spv += (-e.sp * 7 - e.spv * 2.6) * dt; e.sp = clamp(e.sp + e.spv * dt, -0.6, 0.6);
          e.hl += (hl - e.hl) * 0.08;
          if (!vis) continue;
          var x = bx + e.dx;
          if (W > hw * 2 + 8) x = clamp(x, hw + 4, W - hw - 4);
          var A = alpha * e.a * (0.38 + 0.62 * z) * readMask(x, y0, W, H) * L.fade * e.appear *
                  themeGain() * (1 + 0.9 * e.hl) * occlusion(e, x, y0, W, H, time);
          if (A < 0.004) continue;
          var rot = e.rot + e.ra * Math.sin(time * e.rw + e.ph) + e.sp, s = 1 + 0.06 * e.hl;
          for (var y = y0 + e.dy; y < H + m; y += Hp) {
            c.save();
            c.translate(x, y);
            c.rotate(rot);
            if (s !== 1) c.scale(s, s);
            if (e.spr) {
              c.globalAlpha = Math.min(1, A);
              c.drawImage(TS.tinted(e.spr, e.col), -e.spr.w / 2, -e.spr.h / 2, e.spr.w, e.spr.h);
            } else if (e.geo) {
              e.geo(c, e.size, time, Math.min(1, A * 1.15), e);
            }
            c.restore();
          }
        }
      }
    };
    return api_;
  }

  function mkItem(z, u, v, extra) {
    var e = { z: z, u: u, v: v,
              rot: rnd(-0.18, 0.18), ra: rnd(0.04, 0.10), rw: rnd(0.08, 0.2), ph: rnd(0, 6.2832),
              a: 1, col: 'a', ready: true };
    for (var k in extra) e[k] = extra[k];
    return e;
  }
  function unitScale(W, H) { return clamp(Math.min(W, H) / 900, 0.66, 1.12); }

  /* =====================================================================
     ГЛАВНАЯ — «небо математики»
     ===================================================================== */
  var FORMULAS = [
    [SUP(V('e'), [V('i'), V('π')]), ' + 1 = 0'],
    [OP('∫', V('a'), V('b'), true, 1.5), V('f'), '(', V('x'), ')', SP(0.12), 'd', V('x'), ' = ', V('F'), '(', V('b'), ') − ', V('F'), '(', V('a'), ')'],
    [OP('∑', [V('n'), '=1'], '∞'), FR('1', SUP(V('n'), '2')), ' = ', FR(SUP(V('π'), '2'), '6')],
    [V('f'), '′(', V('x'), ') = ', OP('lim', [V('h'), '→0'], null, false, 1), SP(0.1),
      FR([V('f'), '(', V('x'), '+', V('h'), ') − ', V('f'), '(', V('x'), ')'], V('h'))],
    [SUP(V('a'), '2'), ' + ', SUP(V('b'), '2'), ' = ', SUP(V('c'), '2')],
    [V('x'), ' = ', FR(['−', V('b'), ' ± ', SQ([SUP(V('b'), '2'), ' − 4', V('a'), V('c')])], ['2', V('a')])],
    [MAT([[V('a'), V('b')], [V('c'), V('d')]], true), ' = ', V('a'), V('d'), ' − ', V('b'), V('c')],
    [SUP(V('e'), V('x')), ' = ', OP('∑', [V('n'), '=0'], '∞'), FR(SUP(V('x'), V('n')), [V('n'), '!'])],
    [FR(['∂', V('u')], ['∂', V('t')]), ' = Δ', V('u')],
    [FR('d', ['d', V('x')]), ' sin ', V('x'), ' = cos ', V('x')],
    [OP('lim', [V('n'), '→∞'], null, false, 1), SUP(['(1 + ', FR('1', V('n')), ')'], V('n')), ' = ', V('e')],
    [SUP('sin', '2'), V('α'), ' + ', SUP('cos', '2'), V('α'), ' = 1'],
    [V('φ'), ' = ', FR(['1 + ', SQ('5')], '2')],
    [MAT([[['cos ', V('θ')], ['−sin ', V('θ')]], [['sin ', V('θ')], ['cos ', V('θ')]]])],
    [V('V'), ' − ', V('E'), ' + ', V('F'), ' = 2'],
    [OP('∮', V('C'), null, true, 1.5), V('f'), '(', V('z'), ')', SP(0.12), 'd', V('z'), ' = 0'],
    [SUB(V('a'), V('n')), ' = ', SUB(V('a'), [V('n'), '−1']), ' + ', SUB(V('a'), [V('n'), '−2'])]
  ];
  var GLYPHS = [['∫', 0], ['∑', 0], [V('π'), 1], ['√', 0], ['∞', 0], ['∂', 0], ['∇', 0], ['Δ', 0],
                [V('φ'), 1], [V('λ'), 1], ['∈', 0], ['≈', 0]];
  var GEOS = [
    function () { return { geo: drawSolid, solid: 'cube', w1: rnd(0.12, 0.2), w2: rnd(0.15, 0.25) }; },
    function () { return { geo: drawSolid, solid: 'icosa', w1: rnd(0.08, 0.15), w2: rnd(0.1, 0.18) }; },
    function () { return { geo: drawSolid, solid: 'octa', w1: rnd(0.1, 0.18), w2: rnd(0.12, 0.2) }; },
    function () { return { geo: drawSolid, solid: 'tetra', w1: rnd(0.12, 0.22), w2: rnd(0.1, 0.2) }; },
    function () { return { geo: drawCircleConstr }; },
    function () { return { geo: drawUnit }; },
    function () { return { geo: drawPlot, fn: (Math.random() * PLOTF.length) | 0 }; },
    function () { return { geo: drawGrid }; },
    function () { return { geo: drawTri }; },
    function () { return { geo: drawSpiral }; }
  ];

  // спрайты формул делим между элементами (одна формула одного кегля — один спрайт)
  var SPR_CACHE = {};
  function sharedSprite(node, fs) {
    var key = (node.__mfId || (node.__mfId = 's' + Math.random().toString(36).slice(2))) + '@' + Math.round(fs);
    return SPR_CACHE[key] || (SPR_CACHE[key] = TS.sprite(node, Math.round(fs)));
  }

  function sceneHome(L) {
    var W = L.W, H = L.H, us = unitScale(W, H);
    var n = W >= 1200 ? 24 : W >= 900 ? 19 : W >= 600 ? 14 : 10;
    if (LITE) n = Math.round(n * 0.65);
    var G = gridFor(W, n), pts = gridAnchors(G.cols, G.rows, 0.45), total = pts.length;
    // доли видов как раньше: формулы 44%, символы 18%, фигуры — остальное
    var kindsOf = [];
    for (var q = 0; q < total; q++) kindsOf.push(q < total * 0.44 ? 'f' : q < total * 0.62 ? 'g' : 'G');
    shuffle(kindsOf);
    var items = [], kinds = ['a', 'a', 'b', 'ink', 'c'];
    var fl = shuffle(FORMULAS.slice()), gl = shuffle(GLYPHS.slice()), gs = shuffle(GEOS.slice());
    var cf = 0, cg = 0, cG = 0;
    for (var i = 0; i < total; i++) {
      var pt = pts[i], k = kindsOf[i], e;
      if (k === 'f') {
        e = mkItem(rnd(0.45, 1), pt[0], pt[1],
          { kind: 'f', node: fl[cf++ % fl.length], fs: rnd(15, 22) * us, col: pick(kinds), ready: false });
      } else if (k === 'g') {
        e = mkItem(rnd(0.4, 0.9), pt[0], pt[1],
          { kind: 'g', node: gl[cg++ % gl.length][0], fs: rnd(44, 78) * us, col: pick(['a', 'b', 'ink']), a: 0.7, ready: false });
      } else {
        e = mkItem(rnd(0.45, 1), pt[0], pt[1], gs[cG++ % gs.length]());
        e.size = rnd(34, 62) * us * (0.7 + 0.3 * e.z);
        e.col = pick(['a', 'a', 'b', 'ink']);
        e.a = 0.95;
      }
      if (e.kind) e.size = e.fs * (e.kind === 'g' ? 0.5 : 2.2) * (0.75 + 0.25 * e.z);
      items.push(e);
    }
    // спрайты — когда подгрузятся шрифты; размер закладываем с учётом глубины
    whenFonts(function () {
      items.forEach(function (e) {
        if (!e.kind) return;
        try {
          e.spr = sharedSprite(e.node, e.fs * (0.75 + 0.25 * e.z));
          e.size = Math.max(e.spr.w, e.spr.h) * 0.5;
          e.ready = true;
        } catch (x) {}
      });
    });
    var F = Floaters(L, items, { alpha: 0.5 });
    return { draw: F.draw, dbg: F };
  }

  /* =====================================================================
     СПРАВОЧНИК — построения циркулем и линейкой + «страницы знаний»
     ===================================================================== */
  function sceneReference(L) {
    var W = L.W, H = L.H, us = unitScale(W, H);
    // страницы-листы
    // Справочник — страница для чтения: весь 2D-слой заметно тише (плюс
    // тихая зона за колонкой темы, см. readMask/PAGE_MOTIF.calm)
    var pts = gridAnchors(W >= 700 ? 2 : 1, 2 * SCREENS, 0.5), items = [];
    for (var i = 0; i < pts.length; i++) {
      var ln = []; for (var k = 0; k < 9; k++) ln.push(k === 4 ? 0.4 : rnd(0.55, 1));
      var e = mkItem(rnd(0.5, 1), pts[i][0], pts[i][1],
        { geo: drawPage, lines: ln, col: pick(['a', 'b']), a: 0.75, ra: rnd(0.03, 0.06) });
      e.size = rnd(46, 64) * us;
      items.push(e);
    }
    var pagesF = Floaters(L, items, { alpha: 0.3 }), pages = pagesF.draw;

    // построения: шаги по времени, затем растворение и новое место
    // Каждое построение закреплено на странице: место выбирается в видимой
    // сейчас части (своя полоса по высоте — без наложений), дальше оно
    // прокручивается вместе с контентом; ушло за экран — вскоре пересоздаётся.
    var nc = W >= 1100 ? 3 : W >= 700 ? 2 : 1, C = [], PFc = 0.95;
    function spawn(cst, time, first) {
      var side = Math.random() < 0.5;
      var u = L.W > 700 ? (side ? rnd(0.06, 0.24) : rnd(0.76, 0.94)) : rnd(0.25, 0.75);
      cst.u = u;
      cst.wy = scrollY() * PFc + L.H * (0.16 + 0.68 * (cst.slot + rnd(0.2, 0.8)) / nc);
      cst.off = 0;
      cst.R = rnd(60, 105) * us;
      var a0 = rnd(0, 6.28);
      cst.th = [a0, a0 + rnd(1.6, 2.4), a0 + rnd(3.7, 4.6)];
      cst.rot = rnd(-0.3, 0.3);
      cst.t0 = time + (first ? rnd(0, 5) : rnd(0.5, 2.5));
      cst.dur = 17;
    }
    for (var j = 0; j < nc; j++) { var cc = { slot: j }; spawn(cc, 0, true); C.push(cc); }
    var LBL = ['A', 'B', 'C'];

    function seg(c, ax, ay, bx, by, p) { c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); c.stroke(); }
    function drawConstr(c, cst, time) {
      var t = time - cst.t0;
      if (t < 0) return;
      if (t > cst.dur) { spawn(cst, time, false); return; }
      var W = L.W, H = L.H, mg = cst.R * 1.35 + 12;
      var x = mg * 2 >= W ? W / 2 : clamp(cst.u * W, mg, W - mg), y = cst.wy - scrollY() * PFc;
      // прокрутили прочь: через ~1.5 с за экраном — новое построение на виду
      if (y < -mg || y > H + mg) {
        cst.off += 1 / 60;
        if (cst.off > 1.5) { spawn(cst, time, false); cst.t0 = time + rnd(0.3, 1.2); }
        return;
      }
      cst.off = 0;
      var A = 0.4 * readMask(x, y, W, H) * L.fade * themeGain() * (1 - sstep(cst.dur - 2.2, cst.dur, t)) *
              sstep(0, 0.6, t) * occlusion(cst, x, y, W, H, time);
      if (cursorOn()) { var dx = x - I.sx, dy = y - I.sy; A *= 1 + 0.8 * I.pres * Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 260); }
      if (A < 0.004) return;
      var R = cst.R, P = cst.th.map(function (q) { return [Math.cos(q) * R, Math.sin(q) * R]; });
      c.save(); c.translate(x, y); c.rotate(cst.rot);
      c.lineWidth = 1; c.lineCap = 'round';
      // 1) стороны треугольника (с «перебегом» линейки)
      for (var i = 0; i < 3; i++) {
        var p = ease((t - i * 0.7) / 0.8);
        if (p <= 0) continue;
        var a = P[i], b = P[(i + 1) % 3];
        c.strokeStyle = rgba('ink', A * 0.35);
        seg(c, a[0] - (b[0] - a[0]) * 0.18, a[1] - (b[1] - a[1]) * 0.18, b[0] + (b[0] - a[0]) * 0.18, b[1] + (b[1] - a[1]) * 0.18, p);
        c.strokeStyle = rgba('a', A);
        seg(c, a[0], a[1], b[0], b[1], p);
        c.fillStyle = rgba('a', A);
        c.beginPath(); c.arc(a[0], a[1], 2.2, 0, 6.2832); c.fill();
      }
      // 2) засечки циркуля и серединные перпендикуляры
      for (var s = 0; s < 3; s++) {
        var ts = t - 2.6 - s * 0.9;
        if (ts <= 0) continue;
        var A1 = P[s], B1 = P[(s + 1) % 3];
        var mx = (A1[0] + B1[0]) / 2, my = (A1[1] + B1[1]) / 2;
        var dxs = B1[0] - A1[0], dys = B1[1] - A1[1], len = Math.sqrt(dxs * dxs + dys * dys);
        var nx = -dys / len, ny = dxs / len, rr = len * 0.62;
        var base = Math.atan2(dys, dxs), off = Math.acos(clamp(0.5 * len / rr, -1, 1));
        var pa = ease(ts / 0.7);
        c.strokeStyle = rgba('b', A * 0.75);
        c.beginPath(); c.arc(A1[0], A1[1], rr, base + off - 0.25, base + off - 0.25 + 0.5 * pa); c.stroke();
        c.beginPath(); c.arc(A1[0], A1[1], rr, base - off + 0.25, base - off + 0.25 - 0.5 * pa, true); c.stroke();
        c.beginPath(); c.arc(B1[0], B1[1], rr, base + Math.PI - off + 0.25, base + Math.PI - off + 0.25 - 0.5 * pa, true); c.stroke();
        c.beginPath(); c.arc(B1[0], B1[1], rr, base + Math.PI + off - 0.25, base + Math.PI + off - 0.25 + 0.5 * pa); c.stroke();
        var pl = ease((ts - 0.6) / 0.8);
        if (pl > 0) {
          // перпендикуляр тянем через засечки и дальше центра O (он в 0,0)
          var h = Math.max(Math.sqrt(Math.max(0, rr * rr - len * len / 4)) * 1.25,
                           Math.sqrt(mx * mx + my * my) * 1.25);
          var sgn = (-mx * nx - my * ny) >= 0 ? 1 : -1;
          nx *= sgn; ny *= sgn;
          c.setLineDash([4, 4]);
          c.strokeStyle = rgba('b', A * 0.8);
          seg(c, mx - nx * h, my - ny * h, mx + nx * h, my + ny * h, pl);
          c.setLineDash([]);
          c.strokeStyle = rgba('ink', A * 0.7);
          var mk = 4;
          c.beginPath(); c.moveTo(mx + nx * mk, my + ny * mk); c.lineTo(mx + nx * mk + dxs / len * mk, my + ny * mk + dys / len * mk);
          c.lineTo(mx + dxs / len * mk, my + dys / len * mk); c.stroke();
        }
      }
      // 3) центр O и описанная окружность
      var to = t - 6.2;
      if (to > 0) {
        c.fillStyle = rgba('c', A * ease(to / 0.4));
        c.beginPath(); c.arc(0, 0, 2.6, 0, 6.2832); c.fill();
        var pc = ease((to - 0.4) / 1.8);
        if (pc > 0) {
          c.strokeStyle = rgba('c', A * 0.9);
          c.lineWidth = 1.3;
          c.beginPath(); c.arc(0, 0, R, cst.th[0], cst.th[0] + 6.2832 * pc); c.stroke();
          c.lineWidth = 1;
        }
      }
      // подписи
      var tl = sstep(1.5, 2.3, t);
      if (tl > 0) {
        c.fillStyle = rgba('ink', A * tl);
        c.font = TS.font(13 * us + 2, true);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        for (var q = 0; q < 3; q++) c.fillText(LBL[q], P[q][0] * 1.16, P[q][1] * 1.16);
        if (to > 0.3) c.fillText('O', 9, -9);
        c.textAlign = 'start'; c.textBaseline = 'alphabetic';
      }
      c.restore();
    }
    return function (time, dt) {
      pages(time, dt);
      for (var i = 0; i < C.length; i++) drawConstr(L.ctx, C[i], time);
    };
  }

  /* =====================================================================
     МИНИ-СЕРВИСЫ — графопостроитель
     ===================================================================== */
  var FUNCS = [
    { f: function (x) { return Math.sin(x); },            l: [V('y'), ' = sin ', V('x')] },
    { f: function (x) { return x * x / 2 - 1.5; },       l: [V('y'), ' = ', FR(SUP(V('x'), '2'), '2'), ' − 1.5'] },
    { f: function (x) { return x * x * x / 3 - x; },     l: [V('y'), ' = ', FR(SUP(V('x'), '3'), '3'), ' − ', V('x')] },
    { f: function (x) { return 1.6 * Math.exp(-x * x); }, l: [V('y'), ' = 1.6', SUP(V('e'), ['−', SUP(V('x'), '2')])] },
    { f: function (x) { return Math.cos(2 * x); },        l: [V('y'), ' = cos 2', V('x')] },
    { f: function (x) { return Math.abs(x) - 1; },        l: [V('y'), ' = |', V('x'), '| − 1'] },
    { f: function (x) { return x > 0 ? Math.sqrt(x) * 1.1 : NaN; }, l: [V('y'), ' = 1.1', SQ(V('x'))] },
    { f: function (x) { return Math.abs(x) < 0.05 ? NaN : 1 / x; }, l: [V('y'), ' = ', FR('1', V('x'))] }
  ];
  var XR = 3.2, YR = 2.1;
  function sceneServices(L) {
    var W = L.W, H = L.H, us = unitScale(W, H), P = [];
    var cfg = W >= 1100 ? [[0.13, 0.34], [0.87, 0.66]] : W >= 700 ? [[0.16, 0.3], [0.84, 0.72]] : [[0.5, 0.8]];
    if (W >= 1500) cfg.push([0.86, 0.2]);
    var order = shuffle(FUNCS.map(function (_, i) { return i; }));
    // панели закреплены на странице: раскладка экрана повторяется на каждом из
    // SCREENS экранов полосы (через один — зеркально), период Hp
    var Hp = periodOf(L), idx = 0;
    for (var sc = 0; sc < SCREENS; sc++) {
      cfg.forEach(function (c) {
        var i = idx++;
        P.push({ u: sc & 1 ? 1 - c[0] : c[0], v: (sc + c[1]) / SCREENS,
                 w: W < 700 ? Math.min(W * 0.8, 320) : clamp(W * 0.17, 200, 290),
                 fi: order[i % order.length], nx: order[(i + 1) % order.length], k: i, t0: 1 + i * 2.2,
                 m: 0, px: 0, ph: rnd(0, 6), spr: {}, dx: 0, dy: 0, vx: 0, vy: 0, ax: null });
      });
    }
    var ordPos = P.length;
    function nextFn(p) { ordPos++; var n = order[ordPos % order.length]; if (n === p.fi) n = order[(ordPos + 1) % order.length]; return n; }
    var fontsOk = false;
    whenFonts(function () { fontsOk = true; });
    function label(p, fi) {
      if (!fontsOk) return null;
      if (!p.spr[fi]) p.spr[fi] = TS.sprite(FUNCS[fi].l, 14 * us + 2);
      return p.spr[fi];
    }
    function Y(p, x) {
      var a = FUNCS[p.fi].f(x), b = FUNCS[p.nx].f(x), m = easeIO(p.m);
      if (m <= 0) return a;
      if (m >= 1) return b;
      if (isNaN(a) || isNaN(b)) return m < 0.5 ? a : b;
      return a + (b - a) * m;
    }
    // небольшие формулы-«спутники», дрейфуют как на главной
    var small = [[V('f'), '′(', V('x'), ')'], [OP('∫', null, null, true, 1.4), V('f'), SP(0.1), 'd', V('x')],
                 [V('y'), ' = ', V('k'), V('x'), ' + ', V('b')], [FR(['Δ', V('y')], ['Δ', V('x')])],
                 [V('x'), ' ↦ ', V('f'), '(', V('x'), ')'], ['(', V('x'), SUB('', '0'), ', ', V('y'), SUB('', '0'), ')']];
    var pts = gridAnchors(W >= 1100 ? 3 : W >= 700 ? 2 : 1, (W >= 700 ? 2 : 3) * SCREENS, 0.5), items = [];
    shuffle(small);
    for (var s = 0; s < pts.length; s++) {
      items.push(mkItem(rnd(0.5, 1), pts[s][0], pts[s][1],
        { kind: 'f', node: small[s % small.length], fs: rnd(15, 20) * us, col: pick(['a', 'b', 'ink']), ready: false, a: 0.8 }));
    }
    items.forEach(function (e) { e.size = e.fs * 2; });
    whenFonts(function () {
      items.forEach(function (e) {
        try { e.spr = TS.sprite(e.node, e.fs); e.size = Math.max(e.spr.w, e.spr.h) * 0.5; e.ready = true; } catch (x) {}
      });
    });
    var floaters = Floaters(L, items, { alpha: 0.42, period: Hp }).draw;

    function drawPanel(c, p, time, dt, R) {
      var W = L.W, H = L.H, w = p.w, h = w * 0.64;
      var t = time - p.t0;
      if (t < 0) return;
      // жизненный цикл: чертим кривую -> держим (точка с касательной) -> перетекаем
      var cyc = 9.5, lt = t % cyc, n = Math.floor(t / cyc);
      if (n !== p.cycle) {
        if (p.cycle != null) { p.fi = p.nx; p.nx = nextFn(p); }
        p.cycle = n;
      }
      p.m = lt > cyc - 1.6 ? (lt - (cyc - 1.6)) / 1.6 : 0;
      var draw = n === 0 ? ease(lt / 1.8) : 1;
      // якорь на странице: x с отступом на ширину панели, лёгкое покачивание,
      // волна клика толкает панель пружиной, которая возвращает её на место
      var mg = w / 2 + 16, tx0 = mg * 2 >= W ? W / 2 : clamp(p.u * W, mg, W - mg);
      p.ax = p.ax == null ? tx0 : p.ax + (tx0 - p.ax) * (1 - Math.exp(-dt * 3));
      var bob = Math.sin(time * 0.3 + p.ph) * 6;
      var cx = p.ax, cy = firstCopy(p.v * Hp + bob, 0.97, Hp, h + 40);
      if (cy > H + h + 40) { spring(p, 0, 0, dt, 60); return; }
      for (var r = 0; r < R.length; r++) {
        var rx = cx + p.dx - R[r].x, ry = cy + p.dy - R[r].y, rd = Math.sqrt(rx * rx + ry * ry) + 1e-3;
        var wv = (rd - R[r].r) / 120, ww = Math.exp(-wv * wv) * R[r].e;
        p.vx += rx / rd * ww * 500 * dt; p.vy += ry / rd * ww * 500 * dt;
      }
      spring(p, 0, 0, dt, 60);
      cx += p.dx; cy += p.dy;
      var A = 0.62 * readMask(cx, cy, W, H) * L.fade * themeGain() * sstep(0, 0.8, t) *
              occlusion(p, cx, cy, W, H, time);
      // курсор над панелью: точка графика следует за ним, панель ярче
      var hover = 0, hx = null;
      if (cursorOn() && Math.abs(I.sx - cx) < w * 0.55 && Math.abs(I.sy - cy) < h * 0.6) {
        hover = I.pres; hx = clamp((I.sx - cx) / (w / 2) * XR, -XR * 0.95, XR * 0.95);
      }
      p.hv = (p.hv || 0) + (hover - (p.hv || 0)) * 0.08;
      A *= 1 + 0.9 * p.hv;
      if (A < 0.004) return;
      var sx = (w / 2) / XR, sy = (h / 2) / YR;
      c.save(); c.translate(cx, cy);
      c.lineWidth = 1;
      c.strokeStyle = rgba('ink', A * 0.75);
      arrow(c, -w / 2, 0, w / 2 + 6, 0, 6); arrow(c, 0, h / 2, 0, -h / 2 - 6, 6);
      c.beginPath();
      for (var k = -3; k <= 3; k++) {
        if (!k) continue;
        c.moveTo(k * sx, -3); c.lineTo(k * sx, 3);
        if (Math.abs(k) <= 2) { c.moveTo(-3, -k * sy); c.lineTo(3, -k * sy); }
      }
      c.stroke();
      c.fillStyle = rgba('ink', A * 0.8);
      c.font = TS.font(12 * us + 1, true);
      c.fillText('x', w / 2 - 2, 15); c.fillText('y', 8, -h / 2 + 2);
      // кривая (с обрывами у разрывов и за пределами окна)
      c.save();
      c.beginPath(); c.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4); c.clip();
      c.strokeStyle = rgba('a', A);
      c.lineWidth = 1.6; c.lineJoin = 'round';
      c.beginPath();
      var N = 110, pen = false, lastY = 0;
      for (var i = 0; i <= N * draw; i++) {
        var x = -XR + 2 * XR * i / N, y = Y(p, x);
        if (isNaN(y) || Math.abs(y) > YR * 2.5 || (pen && Math.abs(y - lastY) > YR * 1.5)) { pen = false; continue; }
        if (pen) c.lineTo(x * sx, -y * sy); else c.moveTo(x * sx, -y * sy);
        pen = true; lastY = y;
      }
      c.stroke();
      c.restore();
      // точка с касательной
      if (draw >= 1 && p.m === 0) {
        var auto = Math.sin(time * 0.45 + p.ph) * XR * 0.8;
        p.px += ((hx != null ? hx : auto) - p.px) * (hx != null ? 0.15 : 0.05);
        var x0 = p.px, y0 = Y(p, x0);
        if (!isNaN(y0) && Math.abs(y0) < YR) {
          var dd = 0.01, k2 = (Y(p, x0 + dd) - Y(p, x0 - dd)) / (2 * dd);
          if (isFinite(k2)) {
            var len = 1.1 / Math.sqrt(1 + k2 * k2);
            c.strokeStyle = rgba('c', A * 0.9); c.lineWidth = 1.2;
            c.beginPath(); c.moveTo((x0 - len) * sx, -(y0 - k2 * len) * sy); c.lineTo((x0 + len) * sx, -(y0 + k2 * len) * sy); c.stroke();
          }
          c.setLineDash([2, 3]); c.lineWidth = 1;
          c.strokeStyle = rgba('b', A * 0.7);
          c.beginPath(); c.moveTo(x0 * sx, 0); c.lineTo(x0 * sx, -y0 * sy); c.lineTo(0, -y0 * sy); c.stroke();
          c.setLineDash([]);
          c.fillStyle = rgba('c', A);
          c.beginPath(); c.arc(x0 * sx, -y0 * sy, 2.8, 0, 6.2832); c.fill();
        }
      }
      // подпись y = f(x), с перетеканием
      var s1 = label(p, p.fi), s2 = p.m > 0 ? label(p, p.nx) : null;
      if (s1) {
        c.globalAlpha = Math.min(1, A * 1.2 * (1 - easeIO(p.m)) * sstep(1.2, 2, t));
        c.drawImage(TS.tinted(s1, 'a'), -w / 2, -h / 2 - s1.h * 0.55, s1.w, s1.h);
      }
      if (s2) {
        c.globalAlpha = Math.min(1, A * 1.2 * easeIO(p.m));
        c.drawImage(TS.tinted(s2, 'a'), -w / 2, -h / 2 - s2.h * 0.55, s2.w, s2.h);
      }
      c.globalAlpha = 1;
      c.restore();
    }
    return function (time, dt) {
      floaters(time, dt);
      var R = rings(L.W, L.H);
      for (var i = 0; i < P.length; i++) drawPanel(L.ctx, P[i], time, dt, R);
    };
  }

  /* =====================================================================
     ФОРУМ — граф связей: узлы, рёбра, сообщения-сигналы, идеи-символы
     ===================================================================== */
  function sceneForum(L) {
    var W = L.W, H = L.H, us = unitScale(W, H), Hp = periodOf(L), PFn = 0.95;
    var nps = W >= 1200 ? 30 : W >= 900 ? 24 : W >= 600 ? 17 : 12;
    if (LITE) nps = Math.round(nps * 0.7);
    var cols = W >= 1200 ? 7 : W >= 900 ? 6 : W >= 600 ? 5 : 4;
    // узлы — на jittered-сетке по всей полосе страницы; у каждого свой якорь
    var pts = gridAnchors(cols, Math.max(2, Math.round(nps / cols)) * SCREENS, 0.6);
    var N = [], M = [], S = [], sinceMsg = 0, vis = [];
    for (var i = 0; i < pts.length; i++) {
      N.push({ u: pts[i][0], v: pts[i][1], r: rnd(1.6, 3.2) * (Math.random() < 0.18 ? 1.7 : 1),
               z: rnd(0.55, 1), glow: 0, amp: rnd(8, 16), w1: rnd(0.12, 0.24), w2: rnd(0.09, 0.19),
               p1: rnd(0, 6.28), p2: rnd(0, 6.28), dx: 0, dy: 0, vx: 0, vy: 0, ax: null, bx: 0, by: 0 });
    }
    var link = (W < 700 ? 140 : 215) * Math.max(0.85, us);
    var IDEAS = ['?', '!', 'π', '∑', '√', '∞', '≈', '∫', 'Δ', '∂'];
    // экземпляр узла = узел + номер копии k (раскладка повторяется с периодом Hp)
    function posY(n, k) { return n.by + n.dy + k * Hp - PFn * scrollY(); }
    function posX(n) { return n.bx + n.dx; }
    function findInst(n, k) {
      for (var i = 0; i < vis.length; i++) if (vis[i].n === n && vis[i].k === k) return vis[i];
      return null;
    }
    function send(a, hops) {
      if (!a || !a.nb.length || M.length > (MOBILE ? 10 : 18)) return;
      var b = pick(a.nb);
      M.push({ a: a.n, ka: a.k, b: b.n, kb: b.k, t: 0, d: rnd(0.9, 1.6), hops: hops });
    }
    function nearest(x, y) {
      var best = null, bd = 1e12;
      for (var i = 0; i < vis.length; i++) { var dx = vis[i].x - x, dy = vis[i].y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = vis[i]; } }
      return best;
    }
    var lastPulseCount = 0;
    var draw = function (time, dt) {
      var W = L.W, H = L.H, c = L.ctx, sy = scrollY(), on = cursorOn();
      var R = rings(W, H), ke = 1 - Math.exp(-dt * 3), mY = 40;
      vis.length = 0;
      // движение: покачивание у якоря + пружина (курсор притягивает, волна толкает)
      for (var i = 0; i < N.length; i++) {
        var a = N[i], mg = 14 + a.amp;
        var txa = clamp(a.u * W, mg, W - mg);
        a.ax = a.ax == null ? txa : a.ax + (txa - a.ax) * ke;
        a.bx = a.ax + a.amp * Math.sin(time * a.w1 + a.p1);
        a.by = a.v * Hp + a.amp * Math.cos(time * a.w2 + a.p2);
        var y0 = firstCopy(a.by, PFn, Hp, mY), tx = 0, ty = 0;
        if (y0 < H + mY) {
          if (on) {
            var dx = I.sx - a.bx, dy = I.sy - y0, d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
            if (d < link * 1.4 && d > 40) { var q = (1 - d / (link * 1.4)) * 34 * I.pres; tx = dx / d * q; ty = dy / d * q; }
          }
          for (var r = 0; r < R.length; r++) {
            var rx = a.bx + a.dx - R[r].x, ry = y0 + a.dy - R[r].y, rd = Math.sqrt(rx * rx + ry * ry) + 1e-3;
            var wv = (rd - R[r].r) / 60, w = Math.exp(-wv * wv) * R[r].e;
            if (w > 0.01) { a.vx += rx / rd * w * 700 * dt; a.vy += ry / rd * w * 700 * dt; a.glow = Math.max(a.glow, w); }
          }
        }
        spring(a, tx, ty, dt, 70);
        a.glow *= Math.exp(-dt * 1.6);
        var k0 = Math.round((y0 - (a.by - PFn * sy)) / Hp);
        for (var yy = y0, k = k0; yy < H + mY; yy += Hp, k++) {
          vis.push({ n: a, k: k, x: a.bx + a.dx, y: yy + a.dy, nb: [] });
        }
      }
      // рёбра — между видимыми экземплярами
      var base = 0.42 * L.fade * themeGain(), l2 = link * link;
      c.lineWidth = 1;
      for (var p = 0; p < vis.length; p++) {
        var A = vis[p];
        for (var q2 = p + 1; q2 < vis.length; q2++) {
          var B = vis[q2], ex = A.x - B.x, ey = A.y - B.y, dd = ex * ex + ey * ey;
          if (dd > l2) continue;
          A.nb.push(B); B.nb.push(A);
          var kk = 1 - Math.sqrt(dd) / link;
          var al = base * kk * (0.35 + 0.65 * kk) * readMask((A.x + B.x) / 2, (A.y + B.y) / 2, W, H) * (1 + A.n.glow + B.n.glow);
          if (al < 0.004) continue;
          c.strokeStyle = rgba('ink', al);
          c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
        }
      }
      // курсор — ещё один участник: связи к ближайшим узлам
      if (on) {
        for (var m2 = 0; m2 < vis.length; m2++) {
          var Cn = vis[m2], cx = Cn.x - I.sx, cy = Cn.y - I.sy, cd = Math.sqrt(cx * cx + cy * cy);
          if (cd > link * 1.2) continue;
          var ck = 1 - cd / (link * 1.2);
          c.strokeStyle = rgba('b', base * ck * I.pres * 0.9);
          c.beginPath(); c.moveTo(I.sx, I.sy); c.lineTo(Cn.x, Cn.y); c.stroke();
          Cn.n.glow = Math.max(Cn.n.glow, ck * I.pres * 0.5);
        }
      }
      // сообщения: спокойный фон + всплеск от клика
      sinceMsg += dt;
      if (sinceMsg > (MOBILE ? 1.1 : 0.6) && vis.length) { sinceMsg = 0; send(pick(vis), 2 + ((Math.random() * 3) | 0)); }
      if (R.length > lastPulseCount) {
        var rn = R[R.length - 1], nn = nearest(rn.x, rn.y);
        if (nn) { nn.n.glow = 1; for (var z = 0; z < 3; z++) send(nn, 3); }
      }
      lastPulseCount = R.length;
      for (var mi = M.length - 1; mi >= 0; mi--) {
        var ms = M[mi];
        ms.t += dt / ms.d;
        var ax = posX(ms.a), ay = posY(ms.a, ms.ka), bx = posX(ms.b), by = posY(ms.b, ms.kb);
        if (ms.t >= 1) {
          ms.b.glow = Math.max(ms.b.glow, 0.9);
          // идея всплывает над узлом: хранится в координатах страницы
          if (Math.random() < 0.35 && S.length < 12) S.push({ x: bx, yl: by + PFn * sy, t: 0, ch: pick(IDEAS) });
          if (ms.hops > 0) send(findInst(ms.b, ms.kb), ms.hops - 1);
          M.splice(mi, 1); continue;
        }
        var e = easeIO(ms.t), mxp = ax + (bx - ax) * e, myp = ay + (by - ay) * e;
        var tb = Math.max(0, e - 0.12), txp = ax + (bx - ax) * tb, typ = ay + (by - ay) * tb;
        var am = base * 1.6 * readMask(mxp, myp, W, H) * Math.sin(ms.t * Math.PI);
        c.strokeStyle = rgba('c', am * 0.8); c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(txp, typ); c.lineTo(mxp, myp); c.stroke();
        c.fillStyle = rgba('c', am);
        c.beginPath(); c.arc(mxp, myp, 2.2, 0, 6.2832); c.fill();
      }
      c.lineWidth = 1;
      // узлы
      for (var ni = 0; ni < vis.length; ni++) {
        var vi = vis[ni], nd = vi.n, an = base * (0.9 + 0.3 * nd.z) * readMask(vi.x, vi.y, W, H) * (1 + 1.3 * nd.glow);
        c.fillStyle = rgba(nd.r > 3.5 ? 'a' : 'b', an);
        c.beginPath(); c.arc(vi.x, vi.y, nd.r * (1 + 0.35 * nd.glow), 0, 6.2832); c.fill();
        if (nd.glow > 0.05) {
          c.strokeStyle = rgba('a', an * nd.glow * 0.6);
          c.beginPath(); c.arc(vi.x, vi.y, nd.r + 4 + (1 - nd.glow) * 14, 0, 6.2832); c.stroke();
        }
      }
      // идеи-символы всплывают над узлом и тают
      c.font = TS.font(13 * us + 2, true);
      c.textAlign = 'center';
      for (var si = S.length - 1; si >= 0; si--) {
        var sb = S[si]; sb.t += dt / 2.6;
        if (sb.t >= 1) { S.splice(si, 1); continue; }
        var sx = clamp(sb.x + 6, 12, W - 12), syy = sb.yl - PFn * sy - 10 - sb.t * 26;
        c.fillStyle = rgba('a', base * 1.5 * readMask(sx, syy, W, H) * Math.sin(sb.t * Math.PI));
        c.fillText(sb.ch, sx, syy);
      }
      c.textAlign = 'start';
    };
    return { draw: draw, dbg: { nodes: N, period: Hp, vis: vis } };
  }

  /* =====================================================================
     AI-АГЕНТ — нейросеть: слои нейронов, прямые проходы сигналов, токены
     ===================================================================== */
  function sceneAI(L) {
    var us0 = unitScale(L.W, L.H);
    var sizes = L.W >= 1100 ? [4, 6, 7, 6, 3] : L.W >= 700 ? [4, 5, 6, 3] : [3, 4, 4, 2];
    var layers = [], edges = [], sig = [], toks = [], since = 1.2;
    sizes.forEach(function (n, li) {
      var col = [];
      for (var i = 0; i < n; i++) col.push({ li: li, i: i, n: n, act: 0, ph: rnd(0, 6.28), x: 0, y: 0, out: [] });
      layers.push(col);
    });
    for (var li = 0; li < layers.length - 1; li++) {
      layers[li].forEach(function (a) {
        layers[li + 1].forEach(function (b) {
          var e = { a: a, b: b, w: rnd(-1, 1) };
          edges.push(e); a.out.push(e);
        });
      });
    }
    var TOK = ['x²', 'π', '∫', '=', '42', 'dx', '∑', '√2', 'f(x)', 'e', '∞', 'Δ'];
    function layout(time) {
      // крайние слои — у самых краёв: на AI-странице контент почти во всю
      // ширину, и вход/выход сети остаются видны на полях
      var W = L.W, H = L.H, mx = W < 700 ? 0.08 : 0.04, top = H * (W < 700 ? 0.22 : 0.16), hh = H * (W < 700 ? 0.56 : 0.70);
      for (var li = 0; li < layers.length; li++) {
        var col = layers[li], x = W * (mx + (1 - 2 * mx) * li / (layers.length - 1));
        for (var i = 0; i < col.length; i++) {
          var nd = col[i], y = top + hh * (i + 0.5) / col.length;
          nd.x = x + Math.sin(time * 0.23 + nd.ph) * 7;
          nd.y = y + Math.sin(time * 0.31 + nd.ph * 1.3) * 9;
        }
      }
    }
    function fire(nd, strength) {
      nd.act = Math.max(nd.act, strength);
      // рефрактерность: только что сработавший нейрон лишь светится —
      // иначе сигналы размножались бы лавиной
      if (nd.rf > 0) return;
      nd.rf = 0.9;
      if (!nd.out.length) {
        if (toks.length < 8) toks.push({ x: nd.x, y: nd.y, t: 0, s: pick(TOK), vy: rnd(-14, 14) });
        return;
      }
      // сигнал идёт по самым «весомым» связям (плюс немного случайности)
      var cand = nd.out.slice().sort(function (p, q) { return Math.abs(q.w) - Math.abs(p.w) + rnd(-0.4, 0.4); });
      var k = Math.min(cand.length, 2 + ((Math.random() * 2) | 0));
      for (var i = 0; i < k; i++) {
        if (sig.length > (MOBILE ? 26 : 60)) break;
        sig.push({ e: cand[i], t: 0, d: rnd(0.7, 1.1), s: strength * (0.6 + 0.4 * Math.abs(cand[i].w)) });
      }
    }
    // Сеть закреплена на странице: раскладка в координатах «полосы» высотой
    // Hp = 1.25 экрана, копии идут друг за другом вниз по странице (у всех
    // копий общее состояние — сигналы и токены). Взаимодействие считаем в
    // координатах полосы для копии, ближайшей к центру экрана.
    var lastPulse = 0, cursorCd = 0, PFa = 0.95;
    function paint(c, o, W, H, base) {
      // связи: цвет по знаку веса, яркость по модулю
      c.lineWidth = 1;
      for (var ei = 0; ei < edges.length; ei++) {
        var e = edges[ei], aw = Math.abs(e.w);
        var mxp = (e.a.x + e.b.x) / 2, myp = (e.a.y + e.b.y) / 2;
        var al = base * (0.12 + 0.35 * aw) * readMask(mxp, myp + o, W, H) * (1 + 1.2 * Math.max(e.a.act, e.b.act));
        if (al < 0.004) continue;
        c.strokeStyle = rgba(e.w > 0 ? 'a' : 'b', al);
        c.beginPath(); c.moveTo(e.a.x, e.a.y); c.lineTo(e.b.x, e.b.y); c.stroke();
      }
      // сигналы
      for (var si = 0; si < sig.length; si++) {
        var s = sig[si];
        var p = easeIO(s.t), x = s.e.a.x + (s.e.b.x - s.e.a.x) * p, y = s.e.a.y + (s.e.b.y - s.e.a.y) * p;
        var pt = Math.max(0, p - 0.1), tx = s.e.a.x + (s.e.b.x - s.e.a.x) * pt, ty = s.e.a.y + (s.e.b.y - s.e.a.y) * pt;
        var am = base * 1.7 * s.s * readMask(x, y + o, W, H);
        c.strokeStyle = rgba('c', am * 0.7); c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(x, y); c.stroke();
        c.fillStyle = rgba('c', am);
        c.beginPath(); c.arc(x, y, 2, 0, 6.2832); c.fill();
      }
      c.lineWidth = 1;
      // нейроны
      for (var lk = 0; lk < layers.length; lk++) for (var k = 0; k < layers[lk].length; k++) {
        var nn = layers[lk][k];
        var an = base * readMask(nn.x, nn.y + o, W, H) * (1 + 1.4 * nn.act), rr = (3.4 + 2.2 * nn.act) * Math.max(0.8, us0);
        c.fillStyle = rgba('a', an * 0.35);
        c.beginPath(); c.arc(nn.x, nn.y, rr, 0, 6.2832); c.fill();
        c.strokeStyle = rgba('a', an);
        c.beginPath(); c.arc(nn.x, nn.y, rr, 0, 6.2832); c.stroke();
        if (nn.act > 0.05) {
          c.strokeStyle = rgba('c', an * nn.act * 0.5);
          c.beginPath(); c.arc(nn.x, nn.y, rr + 3 + (1 - nn.act) * 10, 0, 6.2832); c.stroke();
        }
      }
      // токены: выход «печатает» математику, она отплывает ВНУТРЬ экрана
      // (выходной слой у правого края — вправо ей некуда)
      c.font = TS.font(14 * us0 + 2, true);
      c.textAlign = 'right';
      for (var ti = 0; ti < toks.length; ti++) {
        var tk = toks[ti];
        var tx2 = tk.x - 12 - ease(tk.t) * (W < 700 ? 26 : 56), ty2 = tk.y + tk.vy * tk.t;
        c.fillStyle = rgba('b', base * 1.6 * readMask(tx2, ty2 + o, W, H) * Math.sin(tk.t * Math.PI));
        c.fillText(tk.s, tx2, ty2 + 4);
      }
      c.textAlign = 'start';
    }
    var draw = function (time, dt) {
      var W = L.W, H = L.H, c = L.ctx, R = rings(W, H), base = 0.44 * L.fade * themeGain();
      var Hp = H * 1.25, sy = scrollY() * PFa;
      layout(time);
      // смещение копии, ближайшей к центру экрана (центр сети ≈ 0.5 H полосы)
      var kP = Math.round(sy / Hp), off = kP * Hp - sy;
      // прямой проход: раз в ~2.4 с зажигаются входы
      since -= dt;
      if (since <= 0) {
        since = rnd(2.0, 3.0);
        layers[0].forEach(function (nd) { if (Math.random() < 0.7) fire(nd, rnd(0.6, 1)); });
      }
      // курсор «щекочет» ближайшие нейроны
      cursorCd -= dt;
      if (cursorOn() && cursorCd <= 0) {
        for (var li = 0; li < layers.length; li++) for (var i = 0; i < layers[li].length; i++) {
          var nd = layers[li][i], dx = nd.x - I.sx, dy = nd.y + off - I.sy;
          if (dx * dx + dy * dy < 110 * 110 * I.pres) { fire(nd, 0.7); cursorCd = 0.5; }
        }
      }
      // клик: волна будит нейроны на своём фронте
      for (var r = 0; r < R.length; r++) {
        for (var lj = 0; lj < layers.length; lj++) for (var j = 0; j < layers[lj].length; j++) {
          var n2 = layers[lj][j], rx = n2.x - R[r].x, ry = n2.y + off - R[r].y, rd = Math.sqrt(rx * rx + ry * ry);
          var wv = (rd - R[r].r) / 50, w = Math.exp(-wv * wv) * R[r].e;
          if (w > 0.5 && n2.act < 0.4) fire(n2, 0.9);
        }
      }
      // шаг состояния (общий для всех копий)
      for (var si = sig.length - 1; si >= 0; si--) {
        var s = sig[si];
        s.t += dt / s.d;
        if (s.t >= 1) { fire(s.e.b, Math.min(1, s.s * 1.05)); sig.splice(si, 1); }
      }
      for (var lk = 0; lk < layers.length; lk++) for (var k = 0; k < layers[lk].length; k++) {
        var nn = layers[lk][k];
        nn.act *= Math.exp(-dt * 1.4);
        if (nn.rf > 0) nn.rf -= dt;
      }
      for (var ti = toks.length - 1; ti >= 0; ti--) {
        toks[ti].t += dt / 3.2;
        if (toks[ti].t >= 1) toks.splice(ti, 1);
      }
      // рисуем видимые копии
      for (var o = off - Hp; o <= off + Hp; o += Hp) {
        if (o + H * 0.9 < 0 || o + H * 0.1 > H) continue;
        c.save(); c.translate(0, o);
        paint(c, o, W, H, base);
        c.restore();
      }
    };
    return { draw: draw, dbg: { layers: layers } };
  }

  /* ------------------------------------------------------------ запуск */
  var SCENES = { home: sceneHome, reference: sceneReference, services: sceneServices,
                 forum: sceneForum, 'ai-agent': sceneAI };
  var make = SCENES[PAGE];
  if (!make) return;

  api.add(function () {
    var L = Layer();
    if (!L) return null;
    var draw = null, builtW = 0, builtH = 0, rebuildAt = 0;
    // сцена возвращает draw(time, dt) или { draw, dbg } (dbg — состояние для
    // отладки/проверок: MathFrameUI.bg.scene)
    function build() {
      var sc = make(L);
      draw = typeof sc === 'function' ? sc : sc.draw;
      api.scene = sc.dbg || null;
      builtW = L.W; builtH = L.H;
    }
    build();
    return {
      draw: function (time, I_, dt) {
        L.begin(time);
        // заметная смена размеров (поворот телефона, окно) — пересобираем сцену;
        // мелкие колебания высоты (адресная строка мобильного браузера) — нет
        if (Math.abs(L.W - builtW) > 120 || Math.abs(L.H - builtH) > 260) {
          if (!rebuildAt) rebuildAt = time + 0.4;
          else if (time >= rebuildAt) { rebuildAt = 0; build(); }
        } else rebuildAt = 0;
        L.ctx.lineCap = 'round';
        draw(time, dt);
      },
      clear: L.clear
    };
  });
})();
