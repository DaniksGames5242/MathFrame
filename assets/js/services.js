/* ============================================================================
   MathFrame — реестр мини-сервисов
   ----------------------------------------------------------------------------
   Каждый сервис — объект { id, glyph, title, sub, mount(el) }.
   Чтобы добавить новый, достаточно дописать его в массив SERVICES:
   оболочка, маршрут в адресе (#id) и карточка в списке появятся сами.
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  function el(tag, cls, parent, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }
  function panel(host, title, hint) {
    var p = el('div', 'panel', host);
    var h = el('div', 'panel-h', p);
    el('h2', null, h, title);
    if (hint) el('span', 'hint', h, hint);
    return p;
  }
  var fmt = function (v, d) {
    if (!isFinite(v)) return '—';
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(d || 10)));
  };

  /* Поле формулы + клавиатура — общий блок для нескольких сервисов. */
  function makeField(host, opts) {
    opts = opts || {};
    var wrap = el('div', null, host);
    var fieldEl = el('div', null, wrap);
    var kbEl = el('div', null, wrap);
    kbEl.style.marginTop = '.7rem';
    var f = new MathField(fieldEl, { label: opts.label || 'Формула', onChange: opts.onChange });
    var touch = false;
    try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
    var kb = new MFKeyboard(kbEl, f, { collapsed: !touch, onEnter: opts.onChange });
    if (opts.initial) f.setExpr(opts.initial);
    return { field: f, kb: kb };
  }

  /* ======================================================================
     1. СИМВОЛЬНЫЙ КАЛЬКУЛЯТОР
     Считает, если переменных нет; иначе показывает производную и упрощение.
     ====================================================================== */
  var svcCalc = {
    id: 'calc', glyph: '=', title: 'Символьный калькулятор',
    sub: 'Вычисление, упрощение, производная',
    mount: function (host) {
      var p = panel(host, 'Выражение', 'Enter — посчитать');
      var out;
      var mf = makeField(p, { initial: 'x^2+2x+1', onChange: recompute });
      out = el('div', 'out', p);

      function recompute() {
        var lin = mf.field.expr();
        out.innerHTML = '';
        if (!lin.trim()) return;
        var c = MFMath.compile(lin);
        if (!c) { el('div', 'err', out, 'не удалось разобрать выражение'); return; }

        var free = c.vars.filter(function (v) { return MFMath.CONSTS[v] === undefined; });
        if (!free.length) {
          var val = c.value({});
          if (!isFinite(val)) { el('div', 'err', out, 'не определено'); return; }
          el('div', 'big', out, fmt(val, 12));
          var fr = MFMath.toFraction(val);
          var sub = 'LaTeX: ' + mf.field.latex();
          if (fr && fr.d !== 1) sub = 'точно: ' + fr.n + '/' + fr.d + '   ·   ' + sub;
          el('div', 'sub', out, sub);
          return;
        }

        var dl = el('dl', 'kv', out);
        el('dt', null, dl, 'упрощение');
        el('dd', null, dl, MFMath.tex(MFMath.simplify(c.ast)));
        free.forEach(function (v) {
          var dd = MFMath.d(c.ast, v);
          if (!dd) return;
          el('dt', null, dl, 'd/d' + v);
          el('dd', null, dl, MFMath.tex(MFMath.simplify(dd)));
        });
        el('div', 'sub', out, 'переменные: ' + free.join(', ') +
          ' — подставьте значения в сервисе «График функции»');
      }
      recompute();
    }
  };

  /* ======================================================================
     2. ГРАФИК ФУНКЦИИ
     Canvas + жесты: перетаскивание, колесо, щипок двумя пальцами.
     ====================================================================== */
  var svcPlot = {
    id: 'plot', glyph: 'f', title: 'График функции',
    sub: 'Жесты, корни, экстремумы',
    mount: function (host) {
      var p = panel(host, 'Функция', 'тяните и щипайте график');
      var mf = makeField(p, { initial: 'x^2-2', onChange: redraw });

      var wrap = el('div', 'plot-wrap', p);
      wrap.style.marginTop = '.8rem';
      var cv = el('canvas', null, wrap); cv.id = 'plot';
      var readout = el('div', 'readout', wrap, 'x = —');

      var bar = el('div', 'plot-bar', p);
      [['−', zoomOut], ['+', zoomIn], ['сброс', reset]].forEach(function (b) {
        var btn = el('button', 'mini', bar, b[0]);
        btn.type = 'button';
        btn.addEventListener('click', b[1]);
      });
      var info = el('div', 'out', p);

      // видимая область в математических координатах
      var view = { cx: 0, cy: 0, scale: 60 };  // пикселей на единицу
      function reset() { view = { cx: 0, cy: 0, scale: 60 }; redraw(); }
      function zoomIn() { view.scale *= 1.35; redraw(); }
      function zoomOut() { view.scale /= 1.35; redraw(); }

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      function sizeCanvas() {
        var w = Math.max(1, Math.floor(cv.clientWidth * dpr));
        var h = Math.max(1, Math.floor(cv.clientHeight * dpr));
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      }
      function X(x) { return cv.width / 2 + (x - view.cx) * view.scale * dpr; }
      function Y(y) { return cv.height / 2 - (y - view.cy) * view.scale * dpr; }
      function invX(px) { return view.cx + (px - cv.width / 2) / (view.scale * dpr); }

      function css(name, fb) {
        try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb; }
        catch (e) { return fb; }
      }

      function redraw() {
        sizeCanvas();
        var ctx = cv.getContext('2d');
        var W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);

        var cGrid = css('--mf-grid-minor', 'rgba(120,150,210,.06)');
        var cAxis = css('--border-strong', '#888');
        var cTxt = css('--text-tertiary', '#888');
        var cFn = css('--accent', '#3ec2a4');

        // шаг сетки — «красивое» число: 1, 2, 5 × 10ⁿ
        var raw = 70 / view.scale;
        var mag = Math.pow(10, Math.floor(Math.log10(raw)));
        var norm = raw / mag;
        var step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;

        var x0 = invX(0), x1 = invX(W);
        ctx.lineWidth = 1;
        ctx.strokeStyle = cGrid;
        ctx.beginPath();
        for (var gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step) {
          ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), H);
        }
        var yTop = view.cy + (H / 2) / (view.scale * dpr);
        var yBot = view.cy - (H / 2) / (view.scale * dpr);
        for (var gy = Math.ceil(yBot / step) * step; gy <= yTop; gy += step) {
          ctx.moveTo(0, Y(gy)); ctx.lineTo(W, Y(gy));
        }
        ctx.stroke();

        // оси
        ctx.strokeStyle = cAxis; ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0));
        ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H);
        ctx.stroke();

        // подписи делений
        ctx.fillStyle = cTxt;
        ctx.font = (11 * dpr) + 'px ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (var tx = Math.ceil(x0 / step) * step; tx <= x1; tx += step) {
          if (Math.abs(tx) < step / 2) continue;
          ctx.fillText(fmt(tx, 4), X(tx), Y(0) + 4 * dpr);
        }

        // сама функция
        var lin = mf.field.expr();
        info.innerHTML = '';
        if (!lin.trim()) return;
        var c = MFMath.compile(lin, 'x');
        if (!c) { el('div', 'err', info, 'не удалось разобрать'); return; }

        ctx.strokeStyle = cFn; ctx.lineWidth = 2.2 * dpr;
        ctx.beginPath();
        var pen = false, prevY = null;
        for (var px = 0; px <= W; px += Math.max(1, dpr)) {
          var xv = invX(px), yv = c.at(xv);
          if (!isFinite(yv)) { pen = false; prevY = null; continue; }
          var py = Y(yv);
          // разрыв (например, tan) — не соединяем ветви
          if (prevY !== null && Math.abs(py - prevY) > H * 1.4) { pen = false; }
          if (!pen) { ctx.moveTo(px, py); pen = true; } else { ctx.lineTo(px, py); }
          prevY = py;
        }
        ctx.stroke();

        // корни в видимом окне
        var rs = MFMath.roots(function (x) { return c.at(x); }, x0, x1, 1200);
        ctx.fillStyle = cFn;
        rs.slice(0, 40).forEach(function (r) {
          ctx.beginPath(); ctx.arc(X(r), Y(0), 3.5 * dpr, 0, 6.2832); ctx.fill();
        });

        var dl = el('dl', 'kv', info);
        el('dt', null, dl, 'корни');
        el('dd', null, dl, rs.length ? rs.slice(0, 8).map(function (r) { return fmt(r, 6); }).join(',  ') : 'нет в окне');
        var dd = MFMath.d(c.ast, 'x');
        if (dd) {
          var dfn = { at: function (x) { return MFMath.evalAst(dd, { x: x }); } };
          var ex = MFMath.roots(function (x) { return dfn.at(x); }, x0, x1, 900);
          el('dt', null, dl, 'экстремумы');
          el('dd', null, dl, ex.length
            ? ex.slice(0, 6).map(function (r) { return '(' + fmt(r, 5) + '; ' + fmt(c.at(r), 5) + ')'; }).join('  ')
            : 'нет в окне');
        }
      }

      /* --- жесты: одним пальцем тянем, двумя щипаем, колесом масштабируем --- */
      var drag = null, pts = {}, pinch = null;
      cv.addEventListener('pointerdown', function (e) {
        cv.setPointerCapture(e.pointerId);
        pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        var ids = Object.keys(pts);
        if (ids.length === 1) drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
        else if (ids.length === 2) {
          drag = null;
          var a = pts[ids[0]], b = pts[ids[1]];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
        }
      });
      cv.addEventListener('pointermove', function (e) {
        if (pts[e.pointerId]) { pts[e.pointerId].x = e.clientX; pts[e.pointerId].y = e.clientY; }
        var ids = Object.keys(pts);
        if (pinch && ids.length === 2) {
          var a = pts[ids[0]], b = pts[ids[1]];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch.d > 4) { view.scale = Math.max(2, Math.min(4000, pinch.scale * d / pinch.d)); redraw(); }
          return;
        }
        if (drag) {
          view.cx = drag.cx - (e.clientX - drag.x) / view.scale;
          view.cy = drag.cy + (e.clientY - drag.y) / view.scale;
          redraw();
        }
        // показания под курсором
        var r = cv.getBoundingClientRect();
        var xv = view.cx + ((e.clientX - r.left) * dpr - cv.width / 2) / (view.scale * dpr);
        var lin = mf.field.expr();
        var c = lin.trim() ? MFMath.compile(lin, 'x') : null;
        readout.textContent = 'x = ' + fmt(xv, 6) + (c ? '    f(x) = ' + fmt(c.at(xv), 6) : '');
      });
      function up(e) {
        delete pts[e.pointerId];
        if (Object.keys(pts).length < 2) pinch = null;
        if (!Object.keys(pts).length) drag = null;
      }
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', function (e) {
        e.preventDefault();
        view.scale = Math.max(2, Math.min(4000, view.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        redraw();
      }, { passive: false });

      window.addEventListener('resize', redraw);
      new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      requestAnimationFrame(redraw);
    }
  };

  /* ======================================================================
     3. РЕШЕНИЕ ТРЕУГОЛЬНИКА
     Заполните любые три элемента (хотя бы одну сторону) — найдётся остальное.
     ====================================================================== */
  var svcTri = {
    id: 'tri', glyph: '\u25B3', title: 'Решение треугольника',
    sub: 'По любым трём элементам',
    mount: function (host) {
      var p = panel(host, 'Треугольник', 'заполните любые три поля');
      var g = el('div', 'grid2', p);
      var F = {};
      [['a', 'сторона a'], ['b', 'сторона b'], ['c', 'сторона c'],
       ['A', 'угол A, °'], ['B', 'угол B, °'], ['C', 'угол C, °']].forEach(function (d) {
        var lab = el('label', 'f', g);
        el('span', null, lab, d[1]);
        var i = el('input', null, lab);
        i.type = 'text'; i.inputMode = 'decimal'; i.placeholder = '—';
        i.addEventListener('input', solve);
        F[d[0]] = i;
      });
      var out = el('div', 'out', p);

      var D = Math.PI / 180;
      function num(k) {
        var v = parseFloat(String(F[k].value).replace(',', '.'));
        return isFinite(v) && v > 0 ? v : null;
      }
      function solve() {
        var a = num('a'), b = num('b'), c = num('c');
        var A = num('A'), B = num('B'), C = num('C');
        out.innerHTML = '';
        var given = [a, b, c, A, B, C].filter(function (v) { return v !== null; }).length;
        if (given < 3) { el('div', 'sub', out, 'нужно ещё ' + (3 - given) + ' знач.'); return; }
        if (a === null && b === null && c === null) {
          el('div', 'err', out, 'нужна хотя бы одна сторона — по трём углам треугольник определён лишь с точностью до подобия');
          return;
        }
        // достраиваем третий угол
        if (A && B && !C) C = 180 - A - B;
        if (A && C && !B) B = 180 - A - C;
        if (B && C && !A) A = 180 - B - C;

        for (var iter = 0; iter < 6; iter++) {
          // теорема синусов
          var k = (a && A) ? a / Math.sin(A * D) : (b && B) ? b / Math.sin(B * D) : (c && C) ? c / Math.sin(C * D) : null;
          if (k) {
            if (!a && A) a = k * Math.sin(A * D);
            if (!b && B) b = k * Math.sin(B * D);
            if (!c && C) c = k * Math.sin(C * D);
            if (!A && a) A = Math.asin(Math.min(1, a / k)) / D;
            if (!B && b) B = Math.asin(Math.min(1, b / k)) / D;
            if (!C && c) C = Math.asin(Math.min(1, c / k)) / D;
          }
          // теорема косинусов
          if (a && b && C && !c) c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * D));
          if (a && c && B && !b) b = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(B * D));
          if (b && c && A && !a) a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A * D));
          if (a && b && c) {
            if (!A) A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) / D;
            if (!B) B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) / D;
            if (!C) C = Math.acos((a * a + b * b - c * c) / (2 * a * b)) / D;
          }
          if (A && B && !C) C = 180 - A - B;
          if (A && C && !B) B = 180 - A - C;
          if (B && C && !A) A = 180 - B - C;
        }

        if (!(a && b && c && A && B && C)) { el('div', 'err', out, 'этих данных не хватает'); return; }
        if (a + b <= c || a + c <= b || b + c <= a) {
          el('div', 'err', out, 'такого треугольника не существует: нарушено неравенство треугольника');
          return;
        }
        var s = (a + b + c) / 2;
        var S = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        var dl = el('dl', 'kv', out);
        [['a', a], ['b', b], ['c', c], ['A°', A], ['B°', B], ['C°', C],
         ['периметр', a + b + c], ['площадь', S],
         ['R описанной', a / (2 * Math.sin(A * D))], ['r вписанной', S / s]].forEach(function (r) {
          el('dt', null, dl, r[0]);
          el('dd', null, dl, fmt(r[1], 8));
        });
      }
      solve();
    }
  };

  /* ======================================================================
     4. ДЕСЯТИЧНОЕ -> ТОЧНОЕ ЗНАЧЕНИЕ
     Обратный символьный поиск: узнаёт дробь, а также вид √n, n/π и т.п.
     Такого почти нигде нет, а нужно постоянно.
     ====================================================================== */
  var svcExact = {
    id: 'exact', glyph: '\u2248', title: 'Точное значение',
    sub: 'Узнаёт дробь, корень, доли π',
    mount: function (host) {
      var p = panel(host, 'Число', 'например 1.4142136 или 0.7853982');
      var lab = el('label', 'f', p);
      el('span', null, lab, 'десятичное значение');
      var inp = el('input', null, lab);
      inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = '1.4142136';
      var out = el('div', 'out', p);

      function guess() {
        var x = parseFloat(String(inp.value).replace(',', '.'));
        out.innerHTML = '';
        if (!isFinite(x)) { el('div', 'sub', out, 'введите число'); return; }
        var eps = 2e-6, found = [];

        var fr = MFMath.toFraction(x, 100000);
        if (fr) found.push(['дробь', fr.n + '/' + fr.d]);

        // √n
        var sq = x * x;
        if (Math.abs(sq - Math.round(sq)) < eps * Math.max(1, sq) && Math.round(sq) > 1)
          found.push(['корень', '\u221A' + Math.round(sq)]);

        // доли π
        var op = x / Math.PI, fp = MFMath.toFraction(op, 400);
        if (fp && Math.abs(op - fp.n / fp.d) < eps)
          found.push(['через \u03C0', (fp.n === 1 ? '' : fp.n) + '\u03C0' + (fp.d === 1 ? '' : '/' + fp.d)]);

        // доли e
        var oe = x / Math.E, fe = MFMath.toFraction(oe, 400);
        if (fe && Math.abs(oe - fe.n / fe.d) < eps)
          found.push(['через e', (fe.n === 1 ? '' : fe.n) + 'e' + (fe.d === 1 ? '' : '/' + fe.d)]);

        // (1+√5)/2 и подобные квадратичные иррациональности: ищем целые p,q,r
        for (var q = 2; q <= 12 && found.length < 6; q++) {
          for (var r = 2; r <= 40; r++) {
            var v = (1 + Math.sqrt(r)) / q;
            if (Math.abs(v - x) < eps) { found.push(['вид (1+\u221An)/m', '(1+\u221A' + r + ')/' + q]); q = 99; break; }
          }
        }

        if (!found.length) { el('div', 'sub', out, 'точного вида не нашлось'); return; }
        var dl = el('dl', 'kv', out);
        found.forEach(function (f) { el('dt', null, dl, f[0]); el('dd', null, dl, f[1]); });
      }
      inp.addEventListener('input', guess);
      guess();
    }
  };

  /* ======================================================================
     5. СИСТЕМЫ СЧИСЛЕНИЯ
     ====================================================================== */
  var svcBase = {
    id: 'base', glyph: '2', title: 'Системы счисления',
    sub: 'Перевод между основаниями 2–36',
    mount: function (host) {
      var p = panel(host, 'Перевод', 'основания от 2 до 36');
      var g = el('div', 'grid2', p);
      function mk(txt, val) {
        var l = el('label', 'f', g); el('span', null, l, txt);
        var i = el('input', null, l); i.type = 'text'; i.value = val || '';
        i.addEventListener('input', conv);
        return i;
      }
      var iVal = mk('число', '255');
      var iFrom = mk('из основания', '10');
      var iTo = mk('в основание', '16');
      var out = el('div', 'out', p);

      function conv() {
        out.innerHTML = '';
        var from = parseInt(iFrom.value, 10), to = parseInt(iTo.value, 10);
        if (!(from >= 2 && from <= 36) || !(to >= 2 && to <= 36)) {
          el('div', 'err', out, 'основание должно быть от 2 до 36'); return;
        }
        var raw = String(iVal.value).trim().toLowerCase();
        if (!raw) return;
        var n = parseInt(raw, from);
        if (isNaN(n)) { el('div', 'err', out, 'в основании ' + from + ' такой записи нет'); return; }
        el('div', 'big', out, n.toString(to).toUpperCase());
        var dl = el('dl', 'kv', out);
        [[2, 'двоичная'], [8, 'восьмеричная'], [10, 'десятичная'], [16, 'шестнадцат.']].forEach(function (b) {
          el('dt', null, dl, b[1]);
          el('dd', null, dl, n.toString(b[0]).toUpperCase());
        });
      }
      conv();
    }
  };

  /* ======================================================================
     РЕЕСТР — сюда дописывать новые сервисы
     ====================================================================== */
  var SERVICES = [svcCalc, svcPlot, svcTri, svcExact, svcBase];

  /* --------------------------------------------------------- оболочка */
  function boot() {
    var grid = $('#svcGrid'), work = $('#work');
    if (!grid || !work) return;
    var current = null;

    SERVICES.forEach(function (s) {
      var b = el('button', 'svc', grid);
      b.type = 'button';
      b.dataset.id = s.id;
      var t = el('div', 'svc-ttl', b);
      el('span', 'gl', t, s.glyph);
      el('span', null, t, s.title);
      el('div', 'svc-sub', b, s.sub);
      b.addEventListener('click', function () { open(s.id, true); });
    });

    function open(id, push) {
      var s = SERVICES.filter(function (x) { return x.id === id; })[0];
      if (!s) s = SERVICES[0];
      if (current === s.id) return;
      current = s.id;
      grid.querySelectorAll('.svc').forEach(function (b) {
        b.classList.toggle('on', b.dataset.id === s.id);
      });
      work.innerHTML = '';
      try { s.mount(work); }
      catch (e) {
        work.innerHTML = '';
        el('div', 'panel', work, '<div class="err">Сервис не запустился: ' + e.message + '</div>');
      }
      if (push && location.hash !== '#' + s.id) history.replaceState(null, '', '#' + s.id);
      if (window.MathFrameUI) window.MathFrameUI.reveal();
    }

    window.addEventListener('hashchange', function () { open(location.hash.slice(1)); });
    open(location.hash.slice(1) || SERVICES[0].id);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
