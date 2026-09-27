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

  /* ======================================================================
     АНИМАЦИИ СТРАНИЦЫ — маленькие помощники (стили — mini-services.css).
     Всё движение выключается целиком при prefers-reduced-motion и при
     настройке сайта «Анимации: выкл.» (html.mf-no-motion) — проверяем
     каждый раз заново, т.к. пользователь может переключить её вживую.
     ====================================================================== */
  var mqReduce = null;
  try { mqReduce = matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) {}
  function motionOK() {
    return !(mqReduce && mqReduce.matches) && !document.documentElement.classList.contains('mf-no-motion');
  }
  // Перезапуск CSS-анимации: снять класс → reflow → поставить снова.
  function replay(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    if (!motionOK()) return;
    void node.offsetWidth;
    node.classList.add(cls);
  }
  function shake(node) { if (node) node.classList.remove('mf-field-glow', 'mf-field-submit'); replay(node, 'mf-shake'); }
  var easeOut3 = function (t) { return 1 - Math.pow(1 - t, 3); };

  // Плавный счётчик: число «набегает» к итоговому значению, в конце ставится
  // ровно finalText (форматирование итога не меняется). prefix/suffix — для
  // строк вида «2+3 = 5». Работает только для обычных конечных чисел.
  function countUp(node, to, finalText, opts) {
    opts = opts || {};
    var prefix = opts.prefix || '', from = opts.from || 0, dur = opts.dur || 460;
    if (!node || !motionOK() || !isFinite(to) || Math.abs(to) > 1e12 || to === from) { if (node) node.textContent = prefix + finalText; return; }
    var dec = (/[.,](\d+)/.exec(finalText) || [0, ''])[1].length;
    dec = Math.min(dec, 8);
    var t0 = performance.now(), token = {};
    node.__mfCount = token;
    function frame(now) {
      if (node.__mfCount !== token) return;
      var k = Math.min(1, (now - t0) / dur);
      if (k >= 1) { node.textContent = prefix + finalText; node.__mfCount = null; return; }
      var v = from + (to - from) * easeOut3(k);
      node.textContent = prefix + v.toFixed(dec).replace('-', '−');
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // «Барабан»: несколько кадров случайных значений, потом итог + приземление.
  function rollText(node, randomText, finalText, dur) {
    if (!node) return;
    if (!motionOK()) { node.textContent = finalText; return; }
    dur = dur || 520;
    var t0 = performance.now(), last = 0, token = {};
    node.__mfRoll = token;
    node.classList.add('mf-rolling');
    function frame(now) {
      if (node.__mfRoll !== token) return;
      if (now - t0 >= dur) {
        node.classList.remove('mf-rolling');
        node.textContent = finalText;
        replay(node, 'mf-roll-land');
        return;
      }
      // кадры реже к концу — «барабан» замедляется
      var gap = 40 + 120 * easeOut3((now - t0) / dur);
      if (now - last >= gap) { node.textContent = randomText(); last = now; }
      requestAnimationFrame(frame);
    }
    node.textContent = randomText();
    requestAnimationFrame(frame);
  }

  // TeX → читаемый текст (для копирования ответа в буфер).
  function plainTex(str) {
    return latexToPlainText(String(str))
      .replace(/\\left|\\right/g, '')
      .replace(/\\cdot/g, '·').replace(/\\times/g, '×')
      .replace(/\\le(?![a-z])/g, '≤').replace(/\\ge(?![a-z])/g, '≥').replace(/\\ne(?![a-z])/g, '≠')
      .replace(/\\pm/g, '±').replace(/\\infty/g, '∞').replace(/\\in(?![a-z])/g, '∈')
      .replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\pi/g, 'π')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\Rightarrow/g, '⇒').replace(/\\cup/g, '∪').replace(/\\varnothing|\\emptyset/g, '∅')
      .replace(/\\quad/g, '   ').replace(/\\,|\\;|\\ /g, ' ')
      .replace(/\\([a-zA-Z]+)/g, '$1')
      .replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }
  // Текст узла с формулами KaTeX: берём исходный TeX из аннотации MathML.
  function nodePlainText(node) {
    var clone = node.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.katex'), function (k) {
      var ann = k.querySelector('annotation[encoding="application/x-tex"]');
      k.replaceWith(document.createTextNode(ann ? plainTex(ann.textContent) : k.textContent));
    });
    Array.prototype.forEach.call(clone.querySelectorAll('.mf-copy'), function (b) { b.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }
  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return Promise.resolve(fallback());
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e) { return false; }
    }
  }
  var ICO_COPY = '<svg class="ic-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>' +
                 '<svg class="ic-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5 10-11"/></svg>';
  // Кнопка «Копировать» с микро-анимацией подтверждения (галочка рисуется,
  // всплывает подпись «Скопировано»). getText вызывается в момент нажатия.
  function copyButton(host, getText, title) {
    var b = el('button', 'mf-copy', host, ICO_COPY + '<span class="mf-copy-tip">Скопировано</span>');
    b.type = 'button';
    b.title = title || 'Копировать ответ';
    b.setAttribute('aria-label', b.title);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var text = getText();
      if (!text) { shake(b); return; }
      writeClipboard(text).then(function (ok) {
        if (!ok) { shake(b); return; }
        b.classList.remove('done'); void b.offsetWidth; b.classList.add('done');
        clearTimeout(b.__t);
        b.__t = setTimeout(function () { b.classList.remove('done'); }, 1500);
        if (window.MathFrameUI && motionOK()) window.MathFrameUI.burst(b, { count: 8, spread: 22 });
      });
    });
    return b;
  }

  // Каскад шагов решения: элементы получают --i и появляются лесенкой,
  // соединительная линия «прорастает» сверху вниз.
  function cascadeSteps(wrap) {
    if (!wrap) return 0;
    wrap.classList.remove('mf-steps-cascade');
    var items = wrap.querySelectorAll('.alg-step, .alg-group-h, .alg-brief > *');
    if (!motionOK() || !items.length) return 0;
    var n = Math.min(items.length, 14);
    Array.prototype.forEach.call(items, function (it, i) {
      it.classList.add('mf-step-in');
      it.style.setProperty('--i', Math.min(i, 14));
    });
    wrap.style.setProperty('--mf-steps', n);
    void wrap.offsetWidth;
    wrap.classList.add('mf-steps-cascade');
    return n;
  }
  // «Вывод» ответа: формула проявляется слева направо, по блику — после шагов.
  function revealAnswer(wrap, delayMs) {
    if (!wrap) return;
    wrap.classList.remove('mf-answer-reveal');
    if (!motionOK() || !wrap.querySelector('.alg-answer-big')) return;
    Array.prototype.forEach.call(wrap.querySelectorAll('.alg-answer-big'), function (b, j) { b.style.setProperty('--j', Math.min(j, 8)); });
    wrap.style.setProperty('--mf-ans-delay', (delayMs || 0) + 'ms');
    void wrap.offsetWidth;
    wrap.classList.add('mf-answer-reveal');
  }

  /* Поле формулы + клавиатура — общий блок для нескольких сервисов.
     onChange(field, isEnter): второй аргумент true, когда пользователь явно
     нажал Enter (физически или на экранной клавиатуре) — по нему сервисы
     проигрывают «решающие» анимации, а обычный ввод остаётся спокойным. */
  function makeField(host, opts) {
    opts = opts || {};
    var wrap = el('div', null, host);
    var fieldEl = el('div', null, wrap);
    var kbEl = el('div', null, wrap);
    kbEl.style.marginTop = '.7rem';
    var f = new MathField(fieldEl, { label: opts.label || 'Формула', onChange: opts.onChange });
    var touch = false;
    try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
    var kb = new MFKeyboard(kbEl, f, {
      collapsed: !touch, allowComplex: !!opts.allowComplex,
      onEnter: opts.onChange ? function (fld) { opts.onChange(fld, true); } : null
    });
    if (opts.initial) f.setExpr(opts.initial);
    fieldEl.__mfField = f;   // доступ к инстансу из DOM — для отладки и тестов
    // Фокус — одна мягкая волна свечения; Enter — короткий «вдох» поля.
    fieldEl.addEventListener('focus', function () { replay(fieldEl, 'mf-field-glow'); });
    fieldEl.addEventListener('animationend', function (e) {
      if (e.target === fieldEl) fieldEl.classList.remove('mf-field-glow', 'mf-field-submit', 'mf-shake');
    });
    return { field: f, kb: kb };
  }
  // Общая реакция поля на результат: подсветка ошибки, тряска по Enter.
  function fieldFeedback(field, hasErr, isEnter, errNode) {
    var host = field && field.host;
    if (!host) return;
    var was = host.classList.contains('mf-field-err');
    host.classList.toggle('mf-field-err', !!hasErr);
    if (isEnter) {
      if (hasErr) { shake(host); if (errNode) shake(errNode); }
      else { host.classList.remove('mf-shake', 'mf-field-glow'); replay(host, 'mf-field-submit'); }
    } else if (hasErr && !was && errNode) {
      replay(errNode, 'mf-err-in');
    }
  }

  /* ======================================================================
     ЧИСТАЯ ЛОГИКА ОБЫЧНОГО КАЛЬКУЛЯТОРА (строковые преобразования)
     Вынесена в отдельные функции без побочных эффектов — так их можно
     проверить в node независимо от DOM (см. историю разработки). Работают
     над «хвостовым операндом» строки: числом ИЛИ сбалансированной скобочной
     группой (с именем функции перед ней, если есть) — поэтому ±/1/x/x²
     одинаково применяются что к «34», что к «(3+4)», что к «sqrt(9)».
     ====================================================================== */
  function trailingOperand(raw) {
    var i = raw.length;
    if (i === 0) return null;
    if (raw[i - 1] === ')') {
      var depth = 0, j = i;
      while (j > 0) {
        j--;
        if (raw[j] === ')') depth++;
        else if (raw[j] === '(') { depth--; if (depth === 0) break; }
      }
      if (depth !== 0) return null;
      var start = j;
      var fnMatch = raw.slice(0, start).match(/(sin|cos|tan|sqrt|ln|log)$/);
      if (fnMatch) start -= fnMatch[0].length;
      return [start, i];
    }
    var m = raw.match(/[0-9]*\.?[0-9]+$/);
    if (m && m[0]) return [i - m[0].length, i];
    if (raw[i - 1] === 'π' || raw[i - 1] === 'e') return [i - 1, i];
    return null;
  }
  function toggleSign(raw) {
    var r = trailingOperand(raw);
    if (!r) return raw;
    var seg = raw.slice(r[0], r[1]);
    if (seg[0] === '(' && seg[1] === '-' && seg[seg.length - 1] === ')') {
      return raw.slice(0, r[0]) + seg.slice(2, -1) + raw.slice(r[1]);
    }
    return raw.slice(0, r[0]) + '(-' + seg + ')' + raw.slice(r[1]);
  }
  function reciprocal(raw) {
    var r = trailingOperand(raw);
    if (!r) return raw;
    var seg = raw.slice(r[0], r[1]);
    return raw.slice(0, r[0]) + '(1/(' + seg + '))' + raw.slice(r[1]);
  }
  function square(raw) {
    var r = trailingOperand(raw);
    if (!r) return raw;
    var seg = raw.slice(r[0], r[1]);
    return raw.slice(0, r[0]) + '(' + seg + ')^2' + raw.slice(r[1]);
  }
  function factorial(raw) {
    var r = trailingOperand(raw);
    if (!r) return raw;
    return raw + '!';
  }
  // Проценты — ТОЛЬКО на этапе вычисления, экран показывает литеральный '%'.
  //   A + B%  ->  A + (A*B/100)   (200+10% = 220 — привычная «аддитивная» семантика)
  //   A − B%  ->  A − (A*B/100)
  //   иначе (после ×, ÷, ^, ( либо B% в самом начале) -> (B/100)
  function preprocessPercent(raw) {
    var out = raw, m, guard = 0;
    var addSub = /([0-9]*\.?[0-9]+)([+\-])([0-9]*\.?[0-9]+)%/;
    while ((m = out.match(addSub)) && guard++ < 30) {
      var A = m[1], op = m[2], B = m[3];
      var repl = '(' + A + op + '(' + A + '*' + B + '/100))';
      out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    }
    var lone = /([0-9]*\.?[0-9]+)%/;
    guard = 0;
    while ((m = out.match(lone)) && guard++ < 30) {
      out = out.slice(0, m.index) + '(' + m[1] + '/100)' + out.slice(m.index + m[0].length);
    }
    return out;
  }

  /* ======================================================================
     ОБЩАЯ ИСТОРИЯ ВЫЧИСЛЕНИЙ
     Одна лента на все калькуляторы (пока ей пользуется только «Обычный», но
     остальные могут дописывать сюда через History.push). Хранится в
     localStorage, чтобы не терялась между визитами.
     ====================================================================== */
  var History = (function () {
    var KEY = 'mf-calc-history', MAX = 200, items = null;
    function load() {
      if (items) return items;
      try { items = JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { items = []; }
      return items;
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))); } catch (e) {}
    }
    var listeners = [];
    return {
      all: function () { return load().slice(); },
      push: function (entry) {
        load().unshift(Object.assign({ t: Date.now() }, entry));
        save();
        listeners.forEach(function (fn) { try { fn(); } catch (e) {} });
      },
      clear: function () { items = []; save(); listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); },
      onChange: function (fn) { listeners.push(fn); }
    };
  })();

  /* ======================================================================
     0. ОБЫЧНЫЙ КАЛЬКУЛЯТОР
     Строка выражения строится дописыванием в конец (как на любом реальном
     калькуляторе — без произвольного курсора внутри строки; произвольный
     2D-курсор нужен алгебраическому калькулятору, а не этому).

     Два независимых переключателя:
       • «Ещё действия»  — показывает/прячет строку научных функций;
       • «Развернуть»    — меняет РЕЖИМ ОТОБРАЖЕНИЯ поля:
           compact  — два слоя (см. ниже), после «=» жмут ещё раз, чтобы
                      продолжить с ответа;
           inline   — одна строка: после «=» к вводу дописывается «=ответ»
                      («2+3=5»), ничего не подменяется.
     Оба переключателя не мешают друг другу и не стирают текущий ввод/ответ
     при переходе между режимами — состояние (raw-строка, посчитан ли ответ)
     общее для обоих видов отображения.

     В compact-режиме два текстовых слоя всегда на одних и тех же местах
     (верхний — маленький серый, нижний — крупный), но их СМЫСЛ переключается:
       пока вводим (ещё не нажали «=»):  низ — ввод (крупно, редактируется),
                                          верх — живой предпросмотр ответа (мелко);
       после «=»:                        верх — тот ввод, что дал ответ (мелко),
                                          низ — сам ответ (крупно).
     ====================================================================== */
  var svcBasic = {
    id: 'basic', glyph: '#', title: 'Обычный',
    sub: 'Как на любом устройстве',
    mount: function (host) {
      var p = panel(host, 'Калькулятор');
      var panelHead = p.querySelector('.panel-h');

      // --- переключатели в шапке панели ---
      var headBtns = el('div', 'row calc-head-btns', panelHead);
      var advBtn = el('button', 'mini', headBtns, 'Ещё действия');
      advBtn.type = 'button';
      var expandBtn = el('button', 'mini calc-expand-btn', headBtns);
      expandBtn.type = 'button';
      expandBtn.innerHTML = ICO_EXPAND;
      expandBtn.title = 'Развернуть поле ввода';

      // --- дисплей ---
      var disp = el('div', 'calc-display', p);
      var traceEl = el('div', 'calc-trace', disp);   // маленькая серая строка
      var mainEl = el('div', 'calc-main', disp);      // крупная строка
      disp.addEventListener('animationend', function (e) { if (e.target === disp) disp.classList.remove('mf-disp-err'); });
      // Копировать: готовый ответ, а пока он не посчитан — живой предпросмотр.
      copyButton(disp, function () {
        if (state.computed) return String(state.resultDisp || '');
        var pv = safeEval(state.raw);
        if (pv === null) return '';
        return isComplexVal(pv) ? fmtComplex(pv) : fmtNum(pv);
      }, 'Копировать результат');

      // --- сетка кнопок ---
      var padWrap = el('div', 'calc-pad-wrap', p);
      var basicPad = el('div', 'calc-pad', padWrap);
      var advPad = el('div', 'calc-pad calc-pad-adv', padWrap);

      // --- история ---
      var histWrap = el('div', 'calc-hist', p);
      var histHead = el('div', 'calc-hist-head', histWrap);
      el('span', null, histHead, 'История');
      var histClear = el('button', 'mini', histHead, 'Очистить');
      histClear.type = 'button';
      var histList = el('div', 'calc-hist-list', histWrap);

      /* ----------------------------------------------------------- состояние */
      var state = { raw: '', computed: false, resultRaw: null, resultDisp: null };
      var mode = 'compact';       // compact | inline
      var advOpen = false;

      function fmtNum(v) {
        if (!isFinite(v)) return v > 0 ? '∞' : (v < 0 ? '−∞' : '—');
        if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
        var s = Number(v.toPrecision(11));
        return String(s).replace('-', '−');
      }
      // ---- комплексный режим: если в выражении встретилась «i», результат
      // вычисления может оказаться {re,im} вместо числа, тогда его нужно
      // отдельно форматировать и отдельно сериализовать обратно в строку для
      // продолжения цепочки вычислений.
      function fmtComplex(c) {
        return MFComplex.complexToTex(c).replace(/-/g, '−');
      }
      function numLiteral(n) {
        n = Number(n.toPrecision(11));
        return n < 0 ? '(-' + (-n) + ')' : String(n);
      }
      function complexRawStr(c) {
        var re = Math.abs(c.re) < 1e-9 ? 0 : c.re, im = Math.abs(c.im) < 1e-9 ? 0 : c.im;
        if (im === 0) return numLiteral(re);
        if (re === 0) return (im === 1 ? 'i' : (im === -1 ? '-i' : numLiteral(im) + '*i'));
        var absIm = Math.abs(im);
        var imPart = (absIm === 1 ? 'i' : numLiteral(absIm) + '*i');
        return numLiteral(re) + (im > 0 ? '+' : '-') + imPart;
      }
      function pretty(raw) {
        // косметика ТОЛЬКО для отображения — вычисляется всегда заново,
        // никогда не сохраняется как состояние.
        return raw
          // ±  оборачивает голое число в "(-N)" для корректного разбора, но
          // визуально это должно выглядеть как обычное "-34", а не "(−34)" —
          // скобки нужны только когда внутри составное выражение.
          .replace(/\(-([0-9]+\.?[0-9]*)\)/g, '-$1')
          .replace(/sqrt\(/g, '√(')
          .replace(/\*/g, '×')
          .replace(/\//g, '÷')
          .replace(/-/g, '−');
      }
      // Возвращает число ИЛИ {re,im} (комплексный результат) — только когда в
      // выражении встретилась «i» (клавиша есть в «Ещё действия»). Степень с
      // комплексным основанием/показателем и корень n-й степени с комплексным
      // n (как x^(1/n)) отдельных кнопок не получают — уже выражаются через
      // существующие xʸ/(/÷/), а z^w = exp(w·Log z) считает любой показатель.
      function safeEval(raw) {
        if (!raw || !/[0-9]/.test(raw)) return null;
        try {
          var expr = preprocessPercent(raw);
          var c = MFMath.compile(expr);
          if (!c) return null;
          if (MFComplex.hasImaginary(c.ast)) return MFComplex.evalComplex(c.ast, {});
          var v = c.value({});
          return isFinite(v) || v === Infinity || v === -Infinity ? v : null;
        } catch (e) { return null; }
      }
      function isComplexVal(v) { return v !== null && typeof v === 'object'; }

      function render() {
        disp.classList.toggle('calc-mode-inline', mode === 'inline');
        expandBtn.classList.toggle('on', mode === 'inline');
        expandBtn.title = mode === 'inline' ? 'Свернуть поле ввода' : 'Развернуть поле ввода';

        if (mode === 'inline') {
          traceEl.textContent = '';
          mainEl.textContent = state.computed
            ? pretty(state.raw) + ' = ' + state.resultDisp
            : (pretty(state.raw) || '0');
          mainEl.classList.remove('calc-dim');
          return;
        }
        // compact
        if (state.computed) {
          traceEl.textContent = pretty(state.raw);
          mainEl.textContent = state.resultDisp;
          mainEl.classList.remove('calc-dim');
        } else {
          traceEl.textContent = (function () {
            var v = safeEval(state.raw);
            if (v === null || pretty(state.raw) === '') return '';
            return '= ' + (isComplexVal(v) ? fmtComplex(v) : fmtNum(v));
          })();
          mainEl.textContent = pretty(state.raw) || '0';
          mainEl.classList.toggle('calc-dim', !state.raw);
        }
      }

      function pushHistory() {
        History.push({ expr: state.raw, exprDisp: pretty(state.raw), result: state.resultDisp });
      }
      function renderHistory() {
        histList.innerHTML = '';
        var items = History.all();
        if (!items.length) { el('div', 'calc-hist-empty', histList, 'Пока пусто'); return; }
        items.slice(0, 50).forEach(function (it, i) {
          var row = el('button', 'calc-hist-item mf-hist-in', histList);
          row.style.setProperty('--i', i);
          row.type = 'button';
          el('span', 'calc-hist-expr', row, it.exprDisp || it.expr);
          el('span', 'calc-hist-res', row, '= ' + it.result);
          row.addEventListener('click', function () {
            state = { raw: it.expr, computed: true, resultRaw: null, resultDisp: it.result };
            render();
          });
        });
      }
      History.onChange(renderHistory);

      /* --------------------------------------------------------- действия */
      function startFreshIfComputed() {
        if (state.computed) { state.raw = ''; state.computed = false; }
      }
      function continueFromResultIfComputed() {
        if (state.computed) { state.raw = state.resultRaw; state.computed = false; }
      }
      function appendDigit(d) {
        startFreshIfComputed();
        // не даём вставить вторую точку в то же число
        if (d === '.') {
          var r = trailingDigitsRun(state.raw);
          if (r && r.indexOf('.') >= 0) return;
          if (!r) state.raw += '0';
        }
        state.raw += d;
        render();
      }
      function trailingDigitsRun(raw) {
        var m = raw.match(/[0-9]*\.?[0-9]*$/);
        return m ? m[0] : '';
      }
      function appendOp(op) {
        continueFromResultIfComputed();
        if (!state.raw) {
          if (op === '-') { state.raw = '-'; render(); }  // ведущий минус — разрешаем
          return;
        }
        if (/[+\-*/^]$/.test(state.raw)) state.raw = state.raw.slice(0, -1) + op;
        else state.raw += op;
        render();
      }
      function appendFn(token) {
        startFreshIfComputed();
        state.raw += token;
        render();
      }
      function appendParen(ch) {
        if (ch === '(') startFreshIfComputed();
        else continueFromResultIfComputed();
        state.raw += ch;
        render();
      }
      function appendPercent() {
        continueFromResultIfComputed();
        if (!state.raw || !/[0-9)]$/.test(state.raw)) return;
        state.raw += '%';
        render();
      }
      function backspace() {
        if (state.computed) { state.raw = state.resultRaw; state.computed = false; }
        state.raw = state.raw.slice(0, -1);
        render();
      }
      function clearAll() {
        state = { raw: '', computed: false, resultRaw: null, resultDisp: null };
        render();
      }
      // ±, 1/x, x², ! — если ответ уже посчитан, применяем к самому ответу и
      // сразу пересчитываем (остаёмся в «посчитанном» состоянии, чтобы можно
      // было продолжить цепочку операций от нового значения).
      function applyTransform(fn) {
        if (state.computed) {
          // Комплексный результат — не «голый операнд» для trailingOperand()
          // (тот распознаёт число или сбалансированную группу в скобках), —
          // оборачиваем в скобки сами, чтобы ±/1/x/x²/! применялись к нему
          // как к единому целому, а не молча ничего не делали.
          var src = /i/.test(state.resultRaw) ? '(' + state.resultRaw + ')' : state.resultRaw;
          var t = fn(src);
          var v = safeEval(t);
          if (v === null) return;
          state.raw = t;
          state.resultRaw = isComplexVal(v) ? complexRawStr(v) : String(v);
          state.resultDisp = isComplexVal(v) ? fmtComplex(v) : fmtNum(v);
          render();
          return;
        }
        state.raw = fn(state.raw);
        render();
      }
      // Клик мышью/тапом передаёт сюда сам MouseEvent (это стандартный
      // addEventListener-параметр — equals подключена как обработчик клика
      // напрямую), физическая клавиатура (Enter) вызывает equals() без
      // аргумента — тогда частицы летят от самого дисплея.
      function equals(srcEvt) {
        // Повторное «=» без единого нового символа в вводе — состояние уже
        // computed (любой ввод его сбрасывает через startFreshIfComputed/
        // continueFromResultIfComputed) — не должно плодить дубль в истории:
        // результат и так уже показан, второй нажатием ничего не меняется.
        if (state.computed) return;
        var v = safeEval(state.raw);
        if (v === null) {
          // Нечего/нельзя посчитать — дисплей коротко «мотает головой».
          if (state.raw) { replay(disp, 'mf-disp-err'); }
          return;
        }
        if (srcEvt && srcEvt.currentTarget) replay(srcEvt.currentTarget, 'mf-eq-fire');
        state.resultRaw = isComplexVal(v) ? complexRawStr(v) : String(v);
        state.resultDisp = isComplexVal(v) ? fmtComplex(v) : fmtNum(v);
        state.computed = true;
        pushHistory();
        render();
        // «=» — единственное подтверждающее действие калькулятора, поэтому
        // именно оно (а не каждая нажатая цифра) получает частицы и 3D-подброс
        // результата. Остальные клавиши обходятся уже имеющимся мягким
        // «поп»-эффектом дисплея (общий механизм в boot(), см. POP_SELECTOR).
        if (window.MathFrameUI) {
          window.MathFrameUI.burst((srcEvt && srcEvt.currentTarget) || disp, { count: 12, spread: 34 });
        }
        mainEl.classList.remove('calc-result-pop');
        void mainEl.offsetWidth;
        mainEl.classList.add('calc-result-pop');
        // Числовой ответ «набегает» плавным счётчиком к итоговому значению.
        if (typeof v === 'number' && /^−?[0-9]+(\.[0-9]+)?$/.test(state.resultDisp)) {
          countUp(mainEl, v, state.resultDisp, { prefix: mode === 'inline' ? pretty(state.raw) + ' = ' : '', dur: 480 });
        }
      }

      /* ------------------------------------------------------------ кнопки */
      function key(label, cls, action) {
        var b = el('button', 'calc-key' + (cls ? ' ' + cls : ''), null, label);
        b.type = 'button';
        b.addEventListener('click', action);
        return b;
      }
      var BASIC_ROWS = [
        [['C', 'calc-op', clearAll], ['⌫', 'calc-op', backspace], ['%', 'calc-op', appendPercent], ['÷', 'calc-op', function () { appendOp('/'); }]],
        [['7', '', function () { appendDigit('7'); }], ['8', '', function () { appendDigit('8'); }], ['9', '', function () { appendDigit('9'); }], ['×', 'calc-op', function () { appendOp('*'); }]],
        [['4', '', function () { appendDigit('4'); }], ['5', '', function () { appendDigit('5'); }], ['6', '', function () { appendDigit('6'); }], ['−', 'calc-op', function () { appendOp('-'); }]],
        [['1', '', function () { appendDigit('1'); }], ['2', '', function () { appendDigit('2'); }], ['3', '', function () { appendDigit('3'); }], ['+', 'calc-op', function () { appendOp('+'); }]],
        [['±', 'calc-op', function () { applyTransform(toggleSign); }], ['0', '', function () { appendDigit('0'); }], ['.', '', function () { appendDigit('.'); }], ['=', 'calc-eq', equals]]
      ];
      var ADV_ROWS = [
        [['(', '', function () { appendParen('('); }], [')', '', function () { appendParen(')'); }], ['√', '', function () { appendFn('sqrt('); }], ['x²', '', function () { applyTransform(square); }]],
        [['xʸ', 'calc-op', function () { appendOp('^'); }], ['1/x', '', function () { applyTransform(reciprocal); }], ['n!', '', function () { applyTransform(factorial); }], ['π', '', function () { appendFn('π'); }]],
        [['sin', '', function () { appendFn('sin('); }], ['cos', '', function () { appendFn('cos('); }], ['tan', '', function () { appendFn('tan('); }], ['e', '', function () { appendFn('e'); }]],
        [['ln', '', function () { appendFn('ln('); }], ['log', '', function () { appendFn('log('); }], ['10ˣ', '', function () { appendFn('10^('); }], ['|x|', '', function () { appendFn('abs('); }]],
        // «i» — мнимая единица. Единственная НОВАЯ клавиша: без неё комплексное
        // число вообще нечем набрать. Степень с комплексным основанием/
        // показателем и корень n-й степени (в т.ч. с комплексным n) отдельных
        // кнопок не получают — они и так полностью выражаются уже существующими
        // клавишами xʸ/(/÷/) (например, «8», xʸ, «(», «1», ÷, «3», «)» → 8^(1/3)).
        [['i', '', function () { appendFn('i'); }]]
      ];
      function buildPad(container, rows) {
        rows.forEach(function (rowDef) {
          var r = el('div', 'calc-row', container);
          rowDef.forEach(function (kd) { r.appendChild(key(kd[0], kd[1], kd[2])); });
        });
      }
      buildPad(basicPad, BASIC_ROWS);
      buildPad(advPad, ADV_ROWS);

      advBtn.addEventListener('click', function () {
        advOpen = !advOpen;
        advPad.classList.toggle('open', advOpen);
        advBtn.classList.toggle('on', advOpen);
        advBtn.textContent = advOpen ? 'Скрыть действия' : 'Ещё действия';
      });
      expandBtn.addEventListener('click', function () {
        mode = mode === 'compact' ? 'inline' : 'compact';
        render();
      });
      histClear.addEventListener('click', function () { History.clear(); });

      // клавиатура ПК: цифры/операторы — напрямую, без экранных кнопок
      var kbHandler = function (e) {
        if (e.target && /input|textarea/i.test(e.target.tagName)) return;
        if (/^[0-9]$/.test(e.key)) { appendDigit(e.key); e.preventDefault(); }
        else if (e.key === '.') { appendDigit('.'); e.preventDefault(); }
        else if (e.key === '+') { appendOp('+'); e.preventDefault(); }
        else if (e.key === '-') { appendOp('-'); e.preventDefault(); }
        else if (e.key === '*') { appendOp('*'); e.preventDefault(); }
        else if (e.key === '/') { appendOp('/'); e.preventDefault(); }
        else if (e.key === '^') { appendOp('^'); e.preventDefault(); }
        else if (e.key === '(' || e.key === ')') { appendParen(e.key); e.preventDefault(); }
        else if (e.key === '%') { appendPercent(); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === '=') { equals(); e.preventDefault(); }
        else if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
        else if (e.key === 'Escape') { clearAll(); e.preventDefault(); }
      };
      document.addEventListener('keydown', kbHandler);
      // снимаем обработчик, если ушли с этого сервиса (следующий mount вызовет новый)
      host.__mfCleanup = function () { document.removeEventListener('keydown', kbHandler); };

      renderHistory();
      render();
    }
  };
  var ICO_EXPAND = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>' +
    '<line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';

  /* Рендер TeX-строки: если загружен KaTeX (как на реальном сайте — он уже
     используется в справочнике) — через него; если нет — гуманизированный
     текстовый фолбэк, чтобы вывод не выглядел «сырым LaTeX с бэкслэшами». */
  function texToHtml(str) {
    if (window.katex) {
      try { return window.katex.renderToString(str, { throwOnError: false }); } catch (e) {}
    }
    return escapeHtml(latexToPlainText(String(str)))
      .replace(/\\left|\\right/g, '')
      .replace(/\\cdot/g, '·')
      .replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\ne/g, '≠')
      .replace(/\\pm/g, '±').replace(/\\infty/g, '∞').replace(/\\in/g, '∈')
      .replace(/\\mathbb\{R\}/g, 'ℝ')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\Rightarrow/g, '⇒').replace(/\\cup/g, '∪')
      .replace(/\\quad/g, '   ').replace(/\\,/g, ' ').replace(/\\ /g, ' ')
      .replace(/[{}]/g, '');
  }
  // Находит текст внутри {...}, начиная с s[openIdx]==='{', считая глубину
  // вложенности — а не наивным регэкспом, который ломается на «\frac{...\sqrt{..}...}».
  function extractBalanced(s, openIdx) {
    var depth = 0;
    for (var i = openIdx; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') { depth--; if (depth === 0) return [s.slice(openIdx + 1, i), i + 1]; }
    }
    return null;
  }
  // Рекурсивно разворачивает \frac{A}{B} -> (A)/(B) и \sqrt{A} -> √(A) на ЛЮБОЙ
  // глубине вложенности (дробь с корнем в числителе, корень из дроби и т.п.) —
  // раньше здесь стоял простой regex «без вложенных скобок внутри», который
  // молча портил вывод на первом же составном выражении вроде формулы корней
  // квадратного уравнения (дробь, а в числителе — корень).
  function latexToPlainText(s) {
    var out = '', i = 0;
    while (i < s.length) {
      if (s.startsWith('\\frac{', i)) {
        var num = extractBalanced(s, i + 5);
        if (num && s[num[1]] === '{') {
          var den = extractBalanced(s, num[1]);
          if (den) {
            out += '(' + latexToPlainText(num[0]) + ')/(' + latexToPlainText(den[0]) + ')';
            i = den[1]; continue;
          }
        }
      }
      if (s.startsWith('\\sqrt{', i)) {
        var rad = extractBalanced(s, i + 5);
        if (rad) { out += '√(' + latexToPlainText(rad[0]) + ')'; i = rad[1]; continue; }
      }
      out += s[i]; i++;
    }
    return out;
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function renderSteps(container, steps) {
    renderSolution(container, steps, { detail: 'normal', explain: false, columns: false });
  }
  // Текст пояснения: обычный текст + формулы внутри $…$.
  function richText(str) {
    return String(str).split(/(\$[^$]+\$)/).map(function (part) {
      return /^\$[^$]+\$$/.test(part) ? texToHtml(part.slice(1, -1)) : escapeHtml(part);
    }).join('');
  }
  function renderColumn(col) {
    var box = el('div', 'alg-col');
    var grid = el('div', 'alg-col-grid', box);
    col.rows.forEach(function (r) {
      var row = el('div', 'alg-col-row' + (r.cls ? ' ' + r.cls : ''), grid);
      if (col.kind === 'grid' && !col.side) el('span', 'sg', row, r.sign || '');
      r.cells.forEach(function (ch, i) {
        var c = el('span', 'c' + (ch === '.' || ch === '' ? ' pt' : '') + (r.u && i >= r.u[0] && i <= r.u[1] ? ' u' : ''), row);
        c.textContent = ch === '.' ? ',' : ch;
      });
    });
    if (col.side) {
      var side = el('div', 'alg-col-side', box);
      el('div', null, side, col.side[0]);
      el('div', null, side, col.side[1].replace('.', ','));
    }
    if (col.note) el('div', 'alg-col-note', box, col.note);
    return box;
  }
  // Показ решения с учётом настроек: detail = brief | normal | full,
  // explain — пояснения словами, columns — вычисления в столбик.
  function renderSolution(container, steps, set) {
    container.innerHTML = '';
    var maxLvl = set.detail === 'brief' ? 0 : set.detail === 'full' ? 2 : 1;
    if (set.detail === 'brief') {
      var line = el('div', 'alg-brief', container), first = true;
      (function walk(list) {
        list.forEach(function (s) {
          if (s.group) { walk(s.steps); return; }
          if (s.lvl > 0) return;
          var tex = s.briefTex || s.tex;
          if (!tex) {
            // короткие «вердикты» без формулы (посторонний корень и т.п.) — мелким текстом
            if (/посторонн|не подходит|решений нет|отбрасываем|не входит/.test(s.text)) el('span', 'btext', line).innerHTML = richText(s.text.replace(/\s*[—(].*$/, ''));
            return;
          }
          if (!first) el('span', 'arrow', line, '⇒');
          el('span', 'alg-step-tex', line).innerHTML = texToHtml(tex);
          first = false;
        });
      })(steps);
      return;
    }
    var n = 0;
    (function walk(list, host) {
      list.forEach(function (s) {
        if (s.lvl > maxLvl) return;
        if (s.group) {
          var g = el('div', 'alg-group', host);
          el('div', 'alg-group-h', g).innerHTML = richText(s.group);
          walk(s.steps, g);
          if (!g.querySelector('.alg-step')) g.remove();
          return;
        }
        var text = (set.detail === 'full' && s.textFull) ? s.textFull : s.text;
        if (!s.tex && (!set.explain || !text)) return;
        var row = el('div', 'alg-step' + (s.tex ? '' : ' note'), host);
        el('span', 'alg-step-num', row, s.tex ? String(++n) : '•');
        var body = el('div', 'alg-step-body', row);
        if (s.tex) el('div', 'alg-step-tex', body).innerHTML = texToHtml(s.tex);
        if (set.explain && text) el('div', 'alg-step-text', body).innerHTML = richText(text);
        if (set.columns && s.cols && s.cols.length) {
          var cw = el('div', 'alg-cols', body);
          s.cols.forEach(function (c) { if (c) cw.appendChild(renderColumn(c)); });
        }
      });
    })(steps, container);
  }

  /* ======================================================================
     1. АЛГЕБРАИЧЕСКИЙ КАЛЬКУЛЯТОР
     Один вход — сам определяет, что перед ним: пример для вычисления,
     выражение с переменными для упрощения, уравнение, неравенство или
     система (уравнений либо неравенств, вводится через клавишу «{ }»).
     Всегда показывает решение по шагам; итог зависит от типа ввода.
     ====================================================================== */
  var svcCalc = {
    id: 'calc', glyph: '=', title: 'Алгебраический калькулятор',
    sub: 'Вычисление, упрощение, уравнения, системы',
    mount: function (host) {
      var p = panel(host, 'Ввод', 'Enter — решить');
      // allowComplex: true — «i» доступна прямо здесь (комплексный калькулятор
      // объединён с этим, отдельного больше нет — см. recompute()/
      // analyzeComplex*). Вектор (□⃗) не требует опции — он на клавиатуре уже
      // и раньше, просто раньше ничего не считал (см. analyzeVector).
      var mf = makeField(p, { initial: 'x^2-5x+6=0', onChange: recompute, allowComplex: true });
      // В отличие от построителя графиков, здесь система ДОЛЖНА быть доступна —
      // клавиатура создаётся с allowSystem по умолчанию (true), просто убеждаемся,
      // что makeField не выключил её.
      if (mf.kb) mf.kb.allowSystem = true;
      // Взаимоисключающие конструкции: «i» несовместима со знаками порядка
      // (у ℂ нет «больше/меньше»), вектор — с lim (см. пример из ТЗ). Клавиши
      // не пропадают — становятся серыми и неактивными, пока конфликтующее
      // не убрано из поля (см. MFKeyboard._refreshConflictKeys).
      if (mf.kb) {
        mf.kb.conflictRules = [
          { test: function (f) { return f.hasNode(function (n) { return n.t === 'ch' && n.v === 'i'; }); },
            disable: ['ch:<', 'ch:>', 'ch:≤', 'ch:≥', 'ch:≠'] },
          { test: function (f) { return f.hasNode(function (n) { return n.t === 'ch' && ['<', '>', '≤', '≥', '≠'].indexOf(n.v) >= 0; }); },
            disable: ['ch:i'] },
          { test: function (f) { return f.hasNode(function (n) { return n.t === 'lim'; }); },
            disable: ['cmd:vec'] },
          { test: function (f) { return f.hasNode(function (n) { return n.t === 'accent' && n.kind === 'vec'; }); },
            disable: ['cmd:lim'] }
        ];
        mf.kb._refreshConflictKeys();
      }

      var badge = el('div', 'alg-badge', p);
      var methodRow = el('div', 'geo-subchips alg-method-row', p); methodRow.hidden = true;
      var stepsWrap = el('div', 'alg-steps', p);
      var answerWrap = el('div', 'alg-answer', p);
      var errWrap = el('div', 'alg-err', p);
      // Выбранный способ решения системы — держим между перерисовками (пока
      // не сменили вкладку калькулятора), иначе выбор слетал бы на каждый
      // символ, введённый в поле.
      var systemMethod = 'gauss';
      var equationMethod = 'discriminant';

      /* ---- настройки решения (запоминаются в браузере) ---- */
      var SET_KEY = 'mf-alg-settings';
      var set = { detail: 'normal', explain: true, columns: false, check: true, dec: false };
      try { var saved = JSON.parse(localStorage.getItem(SET_KEY) || 'null'); if (saved) for (var sk in saved) if (sk in set) set[sk] = saved[sk]; } catch (e) {}
      function saveSet() { try { localStorage.setItem(SET_KEY, JSON.stringify(set)); } catch (e) {} }
      var optsBox = el('div', 'alg-opts');
      p.insertBefore(optsBox, badge);
      function seg(label, key, items) {
        var w = el('div', 'alg-opt', optsBox);
        el('span', 'alg-opt-lbl', w, label);
        var sg = el('div', 'alg-seg', w);
        items.forEach(function (it) {
          var b = el('button', null, sg, it[1]); b.type = 'button';
          b.addEventListener('click', function () {
            set[key] = it[0];
            if (key === 'detail') set.columns = it[0] === 'full' ? true : (it[0] === 'brief' ? false : set.columns);
            saveSet(); syncOpts(); recompute();
          });
          b.dataset.v = String(it[0]);
        });
        return sg;
      }
      function tog(label, key, title) {
        var l = el('label', 'alg-opt alg-tog', optsBox); l.title = title || '';
        var i = el('input', null, l); i.type = 'checkbox';
        el('span', null, l, label);
        i.addEventListener('change', function () { set[key] = i.checked; saveSet(); recompute(); });
        return i;
      }
      var segDetail = seg('Решение', 'detail', [['brief', 'Кратко'], ['normal', 'Обычно'], ['full', 'Подробно']]);
      var segNum = seg('Числа', 'dec', [[false, 'Дроби'], [true, 'Десятичные']]);
      var tExplain = tog('Пояснения словами', 'explain', 'Под каждой формулой — что и почему сделано');
      var tCols = tog('Столбиком', 'columns', 'Показывать вычисления в столбик и деление уголком');
      var tCheck = tog('Проверка', 'check', 'Подставлять найденные корни в исходное уравнение');
      function syncOpts() {
        [segDetail, segNum].forEach(function (sg, i) {
          var key = i ? 'dec' : 'detail';
          Array.prototype.forEach.call(sg.children, function (b) { b.classList.toggle('on', b.dataset.v === String(set[key])); });
        });
        tExplain.checked = set.explain; tCols.checked = set.columns; tCheck.checked = set.check;
        var brief = set.detail === 'brief';
        [tExplain, tCols, tCheck].forEach(function (i) { i.disabled = brief; i.parentNode.style.opacity = brief ? .45 : ''; });
      }
      syncOpts();
      var checkWrap = el('div', 'alg-check');
      p.insertBefore(checkWrap, answerWrap.nextSibling);

      function renderSolverResult(res) {
        checkWrap.hidden = true; checkWrap.innerHTML = '';
        if (res.error) { setBadge(res.internal ? 'Ошибка' : 'Не получилось решить'); showError(res.error.replace(/\$([^$]+)\$/g, function (_, t) { return latexToPlainText(t).replace(/\\[a-z]+\s?/g, ''); })); errWrap.innerHTML = richText('Не получилось: ' + res.error); return; }
        setBadge(res.badge, res.kind);
        methodRow.hidden = true; methodRow.innerHTML = '';
        if (res.methods && res.methods.list.length > 1 && set.detail !== 'brief') {
          methodRow.hidden = false;
          res.methods.list.forEach(function (m) {
            var b = el('button', 'geo-subchip', methodRow, m.label); b.type = 'button';
            b.classList.toggle('on', m.id === res.methods.current);
            b.addEventListener('click', function () {
              if (res.methods.key === 'quad') equationMethod = m.id; else systemMethod = m.id;
              recompute();
            });
          });
        }
        renderSolution(stepsWrap, res.steps, set);
        answerWrap.innerHTML = '';
        var a = res.answer;
        el('div', 'alg-answer-label', answerWrap, a.label || 'Ответ');
        a.items.forEach(function (it) {
          var row = el('div', 'alg-answer-root', answerWrap);
          el('span', 'alg-answer-big', row).innerHTML = texToHtml(it.tex);
          if (it.approx) el('span', 'alg-answer-approx', row, (it.approxExact ? '= ' : '≈ ') + it.approx);
        });
        (a.extra || []).forEach(function (x) { el('div', 'alg-answer-approx', answerWrap).innerHTML = richText(x); });
        if (a.note) el('div', 'alg-answer-note', answerWrap).innerHTML = richText(a.note);
        if (set.check && set.detail !== 'brief' && res.check && res.check.length) {
          checkWrap.hidden = false;
          el('div', 'alg-check-h', checkWrap, 'Проверка');
          res.check.forEach(function (c) {
            var ok = isFinite(c.l) && isFinite(c.rr) && Math.abs(c.l - c.rr) < 1e-7 * Math.max(1, Math.abs(c.l));
            var fmtV = function (x) { return MFSolver._t.numTex(x).tex; };
            el('div', null, checkWrap).innerHTML = richText('$' + c.v + ' = ' + c.r.tex + '$: левая часть $= ' + fmtV(c.l) + '$, правая $= ' + fmtV(c.rr) + '$ ' + (ok ? '— верно ✓' : '— не совпадает ✗'));
          });
        }
      }

      var aboutBtn = el('button', 'mini alg-about-btn', p, 'Что умеет этот калькулятор');
      aboutBtn.type = 'button';
      var aboutBox = el('div', 'alg-about', p);
      aboutBox.hidden = true;
      aboutBox.innerHTML =
        '<p><b>Точно и по шагам решает:</b> вычисления с дробями, корнями и огромными целыми (2^100, 30!); ' +
        'линейные, квадратные (6 способов на выбор) и уравнения высших степеней (вынесение множителя, замена, ' +
        'подбор рационального корня со схемой Горнера); дробно-рациональные (с ОДЗ и отсевом посторонних корней); ' +
        'иррациональные (уединение корня, возведение в степень, проверка); с модулем; показательные и ' +
        'логарифмические (одно основание, замена, свойства логарифмов, log_2(x) через «_»); тригонометрические ' +
        '(серии решений, замена, тождества, двойной угол, однородные, вспомогательный угол); неравенства методом ' +
        'интервалов; системы линейных уравнений (подстановка, сложение, Гаусс, Крамер) и нелинейные (подстановка, ' +
        'замена степеней, вычитание); системы с условиями-неравенствами; упрощение и разложение на множители.</p>' +
        '<p><b>Настройки решения:</b> «Кратко» — только цепочка ключевых преобразований; «Обычно» — шаги с ' +
        'пояснениями; «Подробно» — ещё и промежуточная арифметика, вычисления в столбик и деление уголком. ' +
        'Пояснения, столбики, проверку и формат чисел можно включать отдельно.</p>' +
        '<p><b>Численно</b> (с честным объяснением, почему формулы нет) — только то, что точно не решается: ' +
        'например x = cos x или 2^x = x + 2. Периодические корни выписываются серией.</p>' +
        '<p><b>Комплексные числа:</b> как только в поле появляется «i» (клавиша есть ' +
        'на клавиатуре), калькулятор целиком переключается на арифметику в ℂ — ' +
        'вычисление, упрощение, линейные и квадратные уравнения (здесь они <b>всегда</b> ' +
        'имеют решение — ℂ алгебраически замкнуто) и линейные системы с комплексными ' +
        'коэффициентами, а также произвольная комплексная степень/корень (в т.ч. ' +
        'с комплексным показателем, например <code>i^i</code>). Без «i» квадратное ' +
        'уравнение с D&lt;0, как и раньше, просто сообщает, что действительных корней нет.</p>' +
        '<p><b>Векторы:</b> клавиша «□⃗» — сложение/вычитание, умножение на число, модуль ' +
        '|·|, а для пары векторов — сразу и скалярное, и (для 3D) векторное произведение ' +
        'с углом между ними.</p>' +
        '<p><b>Пока не поддерживает:</b> нелинейные системы больше чем из ' +
        '2 уравнений/переменных; системы неравенств с разными переменными в разных строках; ' +
        'совместные выражения с одновременно «i» и вектором или lim — эти клавиши гасятся, ' +
        'пока в поле есть конфликтующее.</p>' +
        '<p>Знак системы «{ }» на клавиатуре открывает сразу два поля, Enter ' +
        'внутри неё добавляет ещё одну строку.</p>';
      aboutBtn.addEventListener('click', function () {
        aboutBox.hidden = !aboutBox.hidden;
        aboutBtn.textContent = aboutBox.hidden ? 'Что умеет этот калькулятор' : 'Скрыть';
      });

      function setBadge(text, kind) {
        badge.textContent = text;
        badge.className = 'alg-badge' + (kind ? ' alg-badge-' + kind : '');
      }
      function showError(msg) {
        stepsWrap.innerHTML = ''; answerWrap.innerHTML = '';
        errWrap.textContent = msg; errWrap.hidden = false;
      }
      function clearError() { errWrap.hidden = true; errWrap.textContent = ''; }

      function bigAnswer(exactTex, approxStr, isExactDecimal) {
        answerWrap.innerHTML = '';
        el('div', 'alg-answer-label', answerWrap, 'Ответ');
        el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(exactTex);
        if (approxStr) el('div', 'alg-answer-approx', answerWrap, (isExactDecimal ? '= ' : '≈ ') + approxStr);
      }

      /* ------------------------------------------------- форматирование числа
         В ОДНО «ядро». Порядок попыток:
           1) SurdNum — честно вычисляет ТОЧНУЮ форму по самому дереву
              выражения (сумма рациональных кратных корней), а не угадывает её
              по готовому double. Только так корректно берётся, например,
              «1/(√5−2) → 2+√5» — результат и его квадрат оба иррациональны,
              под старый шаблон «одна дробь ИЛИ один корень» такое не подходит
              в принципе, нужно само выражение, а не только его значение.
           2) exactAnswerTex — прежний угадыватель по значению (дробь/корень),
              как запасной путь для всего, что вне surd-системы (переменные,
              sin/log, π/e, разные корни в одном знаменателе и т.п.).
         «=» вместо «≈», когда десятичная запись точна (конечна), а не
         бесконечна/периодична. */
      function numAnswer(value, ast) {
        if (Number.isInteger(value)) { bigAnswer(String(value), null); return; }
        if (ast) {
          var surd = MFAlgebra.evalSurd(ast);
          if (surd) {
            var isRat = MFAlgebra.surdIsRational(surd);
            var tex = MFAlgebra.surdToTex(surd);
            var approxStr = MFMath.fmtNum(MFAlgebra.surdToNumber(surd), 10);
            // Для рациональной ветки дробь уже есть точно внутри surd (整 n/d,
            // без прохода через double) — берём её напрямую, а не переоткрываем
            // через toFraction от приближённого числа.
            var exactFrac = isRat ? (surd.length ? surd[0].coef : { n: 0, d: 1 }) : null;
            var isExact = isRat && MFAlgebra.decimalTerminates(exactFrac);
            bigAnswer(tex, approxStr, isExact);
            return;
          }
        }
        var e = MFAlgebra.exactAnswerTex(value);
        bigAnswer(e.exact, e.approx || MFMath.fmtNum(value, 10), e.isExactDecimal);
      }


      /* ---------------------------------------------------------- анализ входа
         recompute(field, isEnter) — обёртка: сам расчёт (recomputeCore) +
         анимации. Обычный набор символов остаётся «тихим» (только мягкий поп
         контейнеров из общего механизма в boot()); лесенка шагов и «вывод»
         ответа — на явные действия: Enter, смена настроек/способа решения и
         первое открытие сервиса (вызов без аргументов). */
      function recompute(fld, isEnter) {
        var explicit = isEnter === true || !fld;
        recomputeCore();
        var hasErr = !errWrap.hidden;
        fieldFeedback(mf.field, hasErr, isEnter === true, errWrap);
        if (!hasErr && answerWrap.querySelector('.alg-answer-big')) {
          copyButton(answerWrap, function () {
            var parts = [];
            Array.prototype.forEach.call(answerWrap.querySelectorAll('.alg-answer-root, :scope > .alg-answer-big, :scope > .alg-answer-approx'), function (n) {
              var t = nodePlainText(n); if (t) parts.push(t);
            });
            return parts.join('; ');
          });
        }
        if (!explicit || hasErr) return;
        var n = cascadeSteps(stepsWrap);
        revealAnswer(answerWrap, n ? Math.min(n, 8) * 55 + 120 : 0);
        if (isEnter === true && window.MathFrameUI && motionOK() && answerWrap.querySelector('.alg-answer-big')) {
          setTimeout(function () { window.MathFrameUI.burst(answerWrap.querySelector('.alg-answer-big') || answerWrap, { count: 12, spread: 36 }); }, n ? Math.min(n, 8) * 55 + 320 : 200);
        }
      }
      function recomputeCore() {
        clearError();
        var sysRows = mf.field.systemRows();
        // «i» где-либо в поле — считаем комплексным движком целиком, а не
        // только для одного узла: раз пользователь ввёл мнимую единицу, вся
        // строка (или вся система) читается в ℂ, иначе получилась бы мешанина
        // из двух разных числовых систем в одном ответе.
        var isComplex = mf.field.hasNode(function (n) { return n.t === 'ch' && n.v === 'i'; });

        checkWrap.hidden = true;
        if (sysRows !== null) {
          if (isComplex) { analyzeComplexSystem(sysRows); return; }
          stepsWrap.innerHTML = ''; answerWrap.innerHTML = ''; methodRow.hidden = true;
          renderSolverResult(MFSolver.solve({ rows: sysRows }, { dec: set.dec, pref: { quad: equationMethod, sys: systemMethod } }));
          return;
        }

        var linear = mf.field.expr();
        stepsWrap.innerHTML = ''; answerWrap.innerHTML = ''; methodRow.hidden = true;
        if (!linear || !linear.trim()) { setBadge('Введите пример или уравнение'); return; }

        if (isComplex) { analyzeComplexInput(linear); return; }
        var isVector = mf.field.hasNode(function (n) { return n.t === 'accent' && n.kind === 'vec'; });
        if (isVector) { analyzeVector(linear); return; }

        renderSolverResult(MFSolver.solve({ linear: linear }, { dec: set.dec, pref: { quad: equationMethod, sys: systemMethod } }));
      }

      /* ======================================================================
         КОМПЛЕКСНЫЕ ЧИСЛА — та же арифметика/уравнения/системы, что и выше,
         только на движке MFComplex вместо вещественного MFAlgebra/MFMath.
         Включается автоматически, как только в поле появляется «i» (см.
         recompute()) — отдельного калькулятора для этого больше нет, он был
         объединён сюда (клавиша «i» доступна прямо здесь, allowComplex).
         В отличие от вещественной ветки, шагов решения не показывает —
         только итог: для комплексных чисел они пока не такие показательные.
         ====================================================================== */
      function nonImagVars(asts) {
        var set = {};
        asts.forEach(function (a) { MFMath.varsIn(a).forEach(function (v) { if (v !== 'i' && MFMath.CONSTS[v] === undefined) set[v] = true; }); });
        return Object.keys(set);
      }
      function complexAnswer(c) {
        answerWrap.innerHTML = '';
        el('div', 'alg-answer-label', answerWrap, 'Ответ');
        el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(MFComplex.complexToTex(c));
      }
      function analyzeComplexSystem(sysRows) {
        stepsWrap.innerHTML = ''; answerWrap.innerHTML = ''; methodRow.hidden = true;
        if (sysRows.length < 2) { showError('в системе нужно хотя бы 2 уравнения'); return; }
        var rels = sysRows.map(function (r) { return MFAlgebra.splitRelation(r); });
        if (rels.some(function (r) { return !r || r.op !== '='; })) { showError('каждая строка системы должна быть уравнением (со знаком =)'); return; }
        var diffAsts;
        try { diffAsts = rels.map(function (r) { return { t: '-', a: MFMath.parse(r.lhs), b: MFMath.parse(r.rhs) }; }); }
        catch (e) { showError('не удалось разобрать систему'); return; }
        var vars = nonImagVars(diffAsts);
        if (vars.length !== sysRows.length) { showError('для однозначного решения нужно столько же переменных, сколько уравнений (сейчас: ' + sysRows.length + ' уравнени' + (sysRows.length === 1 ? 'е' : 'я') + ', ' + vars.length + ' переменн' + (vars.length === 1 ? 'ая' : 'ых') + ')'); return; }
        var affRows = diffAsts.map(function (d) { return MFComplex.complexAffineOf(d, vars); });
        if (affRows.some(function (a) { return !a; })) { showError('система нелинейна — с комплексными коэффициентами решаются только линейные системы'); return; }
        setBadge('Система уравнений (ℂ)', 'eq');
        var res = MFComplex.solveComplexLinearSystem(affRows, vars);
        if (res.kind === 'none') { el('div', 'alg-answer-big', answerWrap, 'Решений нет'); return; }
        if (res.kind === 'infinite') { el('div', 'alg-answer-big', answerWrap, 'Бесконечно много решений'); return; }
        el('div', 'alg-answer-label', answerWrap, 'Ответ');
        vars.forEach(function (v) {
          el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(v + ' = ' + MFComplex.complexToTex(res.values[v]));
        });
      }
      function analyzeComplexInput(linear) {
        var rel;
        try { rel = MFAlgebra.splitRelation(linear); } catch (e) { rel = null; }

        if (!rel) {
          var ast;
          try { ast = MFMath.parse(linear); } catch (e) { showError('не удалось разобрать выражение'); return; }
          var vars2 = nonImagVars([ast]);
          if (vars2.length === 0) {
            var val = MFComplex.evalComplex(ast, {});
            if (!val) { showError('это выражение выходит за рамки поддерживаемых комплексных операций'); return; }
            setBadge('Вычисление (ℂ)', 'calc');
            complexAnswer(val);
            return;
          }
          if (vars2.length === 1) {
            var coeffs = MFComplex.complexPolyOf(ast, vars2[0]);
            if (!coeffs) { showError('это выражение выходит за рамки поддерживаемых операций для упрощения'); return; }
            setBadge('Упрощение (ℂ)', 'simplify');
            var simplified = MFComplex.complexPolyToTex(coeffs, vars2[0]);
            el('div', 'alg-answer-label', answerWrap, 'Упрощённый вид');
            el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(simplified);
            return;
          }
          showError('больше одной переменной (кроме i) — вне поддерживаемого для упрощения');
          return;
        }

        if (rel.op !== '=') { showError('неравенства не определены для комплексных чисел — у ℂ нет отношения порядка'); return; }
        var lhsAst, rhsAst;
        try { lhsAst = MFMath.parse(rel.lhs); rhsAst = MFMath.parse(rel.rhs); }
        catch (e) { showError('не удалось разобрать уравнение'); return; }
        var vars3 = nonImagVars([lhsAst, rhsAst]);
        var diffAst = { t: '-', a: lhsAst, b: rhsAst };
        if (vars3.length === 0) {
          setBadge('Проверка равенства (ℂ)', 'calc');
          var lv = MFComplex.evalComplex(lhsAst, {}), rv = MFComplex.evalComplex(rhsAst, {});
          if (!lv || !rv) { showError('не удалось вычислить обе стороны'); return; }
          var holds = Math.abs(lv.re - rv.re) < 1e-9 && Math.abs(lv.im - rv.im) < 1e-9;
          el('div', 'alg-answer-big', answerWrap, holds ? 'Верно' : 'Неверно');
          return;
        }
        if (vars3.length === 1) {
          var coeffs2 = MFComplex.complexPolyOf(diffAst, vars3[0]);
          if (!coeffs2) { showError('это уравнение выходит за рамки поддерживаемых операций'); return; }
          var res2 = MFComplex.solveComplexEquationPoly(coeffs2, vars3[0]);
          if (!res2) { showError('уравнения степени 3 и выше с комплексными коэффициентами пока не решаются'); return; }
          setBadge('Уравнение (ℂ)', 'eq');
          if (res2.kind === 'identity') { el('div', 'alg-answer-big', answerWrap, 'Верно при любом ' + vars3[0]); return; }
          if (res2.kind === 'contradiction') { el('div', 'alg-answer-big', answerWrap, 'Решений нет'); return; }
          el('div', 'alg-answer-label', answerWrap, res2.roots.length > 1 ? 'Корни' : 'Ответ');
          res2.roots.forEach(function (r) {
            el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(vars3[0] + ' = ' + MFComplex.complexToTex(r));
          });
          return;
        }
        showError('уравнение с несколькими неизвестными — только как часть системы (через клавишу «{ }»)');
      }

      /* ======================================================================
         ВЕКТОРЫ — включается клавишей «□⃗» (accent vec). Сериализуется в
         линейную запись как вызов «vec(x,y,z)» (см. rowToExpr в mathfield.js
         и FUNCS.vec в mf-math.js — там только безопасная вещественная
         заглушка, настоящая арифметика вся здесь, по дереву). Поддерживает:
         сложение/вычитание векторов, умножение на число, модуль |·|/‖·‖, и —
         для пары векторов — сразу оба произведения (скалярное и, для 3D,
         векторное) с углом между ними, как раньше отдельный инструмент
         «Векторное/скалярное произведение (3D)» в «Ещё» (теперь без ограничения
         в 3 компоненты для скалярного и без отдельной формы под каждое поле).
         ====================================================================== */
      function vecComponents(node) {
        if (!node || node.t !== 'fn' || node.name !== 'vec') return null;
        var body = node.a;
        var items = body && body.t === 'tuple' ? body.items : [body];
        var out = [];
        for (var i = 0; i < items.length; i++) {
          var v;
          try { v = MFMath.evalAst(items[i], {}); } catch (e) { return null; }
          if (!isFinite(v)) return null;
          out.push(v);
        }
        return out;
      }
      function vecTex(comp) {
        return '(' + comp.map(function (x) { return MFMath.fmtNum(x); }).join(';\\ ') + ')';
      }
      // Возвращает {vec:[...]} (результат — вектор), {dotcross:[a,b]} (два
      // вектора перемножены — неоднозначно скалярное/векторное, показываем
      // оба), либо null (не векторное выражение / вне поддерживаемого).
      function evalVecNode(node) {
        if (!node) return null;
        if (node.t === 'fn' && node.name === 'vec') {
          var comp = vecComponents(node);
          return comp ? { vec: comp } : null;
        }
        if (node.t === '+' || node.t === '-') {
          var A = evalVecNode(node.a), B = evalVecNode(node.b);
          if (!A || !B || !A.vec || !B.vec || A.vec.length !== B.vec.length) return null;
          return { vec: A.vec.map(function (x, i) { return node.t === '+' ? x + B.vec[i] : x - B.vec[i]; }) };
        }
        if (node.t === '*') {
          var A2 = evalVecNode(node.a), B2 = evalVecNode(node.b);
          if (A2 && A2.vec && B2 && B2.vec) return { dotcross: [A2.vec, B2.vec] };
          if (A2 && A2.vec) {
            var s; try { s = MFMath.evalAst(node.b, {}); } catch (e) { return null; }
            return isFinite(s) ? { vec: A2.vec.map(function (x) { return x * s; }) } : null;
          }
          if (B2 && B2.vec) {
            var s2; try { s2 = MFMath.evalAst(node.a, {}); } catch (e) { return null; }
            return isFinite(s2) ? { vec: B2.vec.map(function (x) { return x * s2; }) } : null;
          }
          return null;
        }
        if (node.t === 'neg') {
          var A3 = evalVecNode(node.a);
          return (A3 && A3.vec) ? { vec: A3.vec.map(function (x) { return -x; }) } : null;
        }
        return null;
      }
      function analyzeVector(linear) {
        var ast;
        try { ast = MFMath.parse(linear); } catch (e) { showError('не удалось разобрать выражение'); return; }

        // |вектор| / ‖вектор‖ — оба сериализуются как abs(vec(...))
        if (ast.t === 'fn' && ast.name === 'abs' && ast.a && ast.a.t === 'fn' && ast.a.name === 'vec') {
          var comp0 = vecComponents(ast.a);
          if (!comp0) { showError('не удалось вычислить компоненты вектора'); return; }
          setBadge('Модуль вектора', 'calc');
          var mag = Math.sqrt(comp0.reduce(function (s, x) { return s + x * x; }, 0));
          answerWrap.innerHTML = '';
          el('div', 'alg-answer-label', answerWrap, 'Ответ');
          el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml('|\\vec v| = ' + MFMath.fmtNum(mag));
          return;
        }

        var r = evalVecNode(ast);
        if (!r) {
          showError('это векторное выражение пока не поддерживается — доступны: сложение/вычитание векторов, ' +
            'умножение на число, скалярное и (для 3D) векторное произведение двух векторов, модуль |·|');
          return;
        }

        if (r.dotcross) {
          var a = r.dotcross[0], b = r.dotcross[1];
          setBadge('Скалярное и векторное произведение', 'calc');
          answerWrap.innerHTML = '';
          var dot = a.length === b.length ? a.reduce(function (s, x, i) { return s + x * b[i]; }, 0) : null;
          el('div', 'alg-answer-label', answerWrap, 'Скалярное произведение u·v');
          el('div', 'alg-answer-big', answerWrap, dot === null ? 'размерности векторов не совпадают' : MFMath.fmtNum(dot));
          if (a.length === 3 && b.length === 3) {
            var cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
            el('div', 'alg-answer-label', answerWrap, 'Векторное произведение u×v');
            el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml(vecTex(cross));
            var magA = Math.sqrt(a.reduce(function (s, x) { return s + x * x; }, 0));
            var magB = Math.sqrt(b.reduce(function (s, x) { return s + x * x; }, 0));
            if (magA > 1e-12 && magB > 1e-12 && dot !== null) {
              var cosA = Math.max(-1, Math.min(1, dot / (magA * magB)));
              el('div', 'alg-answer-approx', answerWrap, 'угол между u и v: ' + MFMath.fmtNum(Math.acos(cosA) * 180 / Math.PI, 6) + '°');
            }
          }
          return;
        }

        setBadge('Векторная арифметика', 'calc');
        answerWrap.innerHTML = '';
        el('div', 'alg-answer-label', answerWrap, 'Ответ');
        el('div', 'alg-answer-big', answerWrap).innerHTML = texToHtml('\\vec v = ' + vecTex(r.vec));
      }

      recompute();
    }
  };

  /* ======================================================================
     2. ГРАФИК ФУНКЦИИ
     Canvas + жесты: перетаскивание, колесо, щипок двумя пальцами.
     ====================================================================== */
  /* ======================================================================
     ГЕОМЕТРИЯ НЕЯВНЫХ КРИВЫХ (для построителя графиков: уравнения, системы)
     Маршевый квадрат для трассировки F(x,y)=0 облаком точек + 2D метод
     Ньютона для точного поиска пересечений двух таких кривых. Проверено на
     классических случаях: прямая-прямая, прямая-окружность,
     окружность-окружность, парабола-прямая, непересекающиеся окружности.
     ====================================================================== */
  function traceImplicitPoints(F, x0, x1, y0, y1, nx, ny) {
    var dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    var grid = [];
    for (var i = 0; i <= nx; i++) {
      grid.push(new Array(ny + 1));
      for (var j = 0; j <= ny; j++) {
        var v; try { v = F(x0 + i * dx, y0 + j * dy); } catch (e) { v = NaN; }
        grid[i][j] = isFinite(v) ? v : NaN;
      }
    }
    var pts = [];
    function edge(v0, v1, xa, ya, xb, yb) {
      if (isNaN(v0) || isNaN(v1)) return;
      if (v0 === 0) { pts.push({ x: xa, y: ya }); return; }
      if ((v0 < 0) === (v1 < 0)) return;
      var t = v0 / (v0 - v1);
      pts.push({ x: xa + (xb - xa) * t, y: ya + (yb - ya) * t });
    }
    for (var i = 0; i <= nx; i++) {
      for (var j = 0; j <= ny; j++) {
        var x = x0 + i * dx, y = y0 + j * dy;
        if (i < nx) edge(grid[i][j], grid[i + 1][j], x, y, x + dx, y);
        if (j < ny) edge(grid[i][j], grid[i][j + 1], x, y, x, y + dy);
      }
    }
    return pts;
  }
  function grad2(F, x, y, h) {
    h = h || 1e-5;
    return [(F(x + h, y) - F(x - h, y)) / (2 * h), (F(x, y + h) - F(x, y - h)) / (2 * h)];
  }
  function newton2D(F1, F2, x0, y0, iters) {
    iters = iters || 25;
    var x = x0, y = y0;
    for (var k = 0; k < iters; k++) {
      var f1 = F1(x, y), f2 = F2(x, y);
      if (!isFinite(f1) || !isFinite(f2)) return null;
      if (Math.abs(f1) < 1e-12 && Math.abs(f2) < 1e-12) break;
      var g1 = grad2(F1, x, y), g2 = grad2(F2, x, y);
      var a = g1[0], b = g1[1], c = g2[0], d = g2[1];
      var det = a * d - b * c;
      if (Math.abs(det) < 1e-14) return null;
      var dx = (f1 * d - f2 * b) / det, dy = (f2 * a - f1 * c) / det;
      x -= dx; y -= dy;
      if (!isFinite(x) || !isFinite(y)) return null;
    }
    if (Math.abs(F1(x, y)) > 1e-6 || Math.abs(F2(x, y)) > 1e-6) return null;
    return { x: x, y: y };
  }
  // Нужен решателю (mf-solver.js) для нелинейных систем, которые не сводятся к одному уравнению.
  window.MFSolverNumeric2D = function (F1, F2) { return findIntersections2D(F1, F2, -200, 200, -200, 200, 90); };
  function findIntersections2D(F1, F2, x0, x1, y0, y1, gridN) {
    gridN = gridN || 60;
    var pts1 = traceImplicitPoints(F1, x0, x1, y0, y1, gridN, gridN);
    var cellR = Math.max((x1 - x0) / gridN, (y1 - y0) / gridN) * 1.5;
    var seeds = [];
    pts1.forEach(function (pt) {
      var f2; try { f2 = F2(pt.x, pt.y); } catch (e) { f2 = NaN; }
      if (isFinite(f2) && Math.abs(f2) < cellR * 5) seeds.push(pt);
    });
    var results = [];
    seeds.forEach(function (s) {
      var r = newton2D(F1, F2, s.x, s.y, 30);
      if (!r) return;
      var dup = results.some(function (q) { return Math.hypot(q.x - r.x, q.y - r.y) < 1e-4; });
      if (!dup) results.push(r);
    });
    return results;
  }

  var svcPlot = {
    id: 'plot', glyph: 'f', title: 'График функции',
    sub: 'Функции, уравнения и системы — графическим методом',
    mount: function (host) {
      var p = panel(host, 'Функция, уравнение или система', 'Enter — построить · «{ }» на клавиатуре — система');
      var mf = makeField(p, { initial: 'x^2-2', onChange: onFunctionChange });
      if (mf.kb) mf.kb.allowSystem = true;   // здесь система как раз нужна, в отличие от других калькуляторов

      var badge = el('div', 'alg-badge', p);   // переиспользуем стиль «типа ввода» из алгебраического калькулятора

      var wrap = el('div', 'plot-wrap', p);
      wrap.style.marginTop = '.6rem';
      var cv = el('canvas', null, wrap); cv.id = 'plot';
      replay(wrap, 'mf-plot-in');

      var bar = el('div', 'plot-bar', p);
      [['−', zoomOut], ['+', zoomIn], ['сброс', reset]].forEach(function (b) {
        var btn = el('button', 'mini', bar, b[0]);
        btn.type = 'button';
        btn.addEventListener('click', function () { replay(btn, 'mf-zoom-tap'); b[1](); });
      });
      var info = el('div', 'out', p);

      // видимая область в математических координатах
      var view = { cx: 0, cy: 0, scale: 60 };  // пикселей на единицу
      function reset() { animateView({ cx: 0, cy: 0, scale: 60 }); }
      function zoomIn() { animateView({ cx: view.cx, cy: view.cy, scale: Math.min(4000, view.scale * 1.35) }); }
      function zoomOut() { animateView({ cx: view.cx, cy: view.cy, scale: Math.max(2, view.scale / 1.35) }); }

      /* ---------------------------------------------------------- анимация
         Всё движение графика — внутри canvas, одним rAF-циклом, который
         крутится только пока есть что анимировать:
           • intro   — при открытии оси «вырастают» из начала координат,
                       сетка проявляется;
           • sweep   — кривые прорисовываются слева направо (клип по x) с
                       мягким «сканером» на фронте; точки (корни, экстремумы,
                       пересечения) «выпрыгивают» и пульсируют кольцом в тот
                       момент, когда фронт до них доходит;
           • viewAnim — плавный зум/сброс кнопками (масштаб — в лог-шкале).
         Перетаскивание/колесо — мгновенные, как и раньше. */
      var mountT = performance.now();
      var introOn = motionOK();
      var sweep = { start: 0, dur: 0 };
      var viewAnim = null;
      var rafId = 0;
      function kick() {
        if (rafId) return;
        rafId = requestAnimationFrame(function tick(now) {
          rafId = 0;
          if (!cv.isConnected) return;
          if (viewAnim) {
            var k = Math.min(1, (now - viewAnim.t0) / viewAnim.dur), e = easeOut3(k);
            view.cx = viewAnim.a.cx + (viewAnim.b.cx - viewAnim.a.cx) * e;
            view.cy = viewAnim.a.cy + (viewAnim.b.cy - viewAnim.a.cy) * e;
            view.scale = Math.exp(Math.log(viewAnim.a.scale) + (Math.log(viewAnim.b.scale) - Math.log(viewAnim.a.scale)) * e);
            if (k >= 1) viewAnim = null;
          }
          redraw(now);
          var busy = viewAnim || (introOn && now - mountT < 700) || (sweep.dur && now < sweep.start + sweep.dur + 1000);
          if (busy) rafId = requestAnimationFrame(tick);
        });
      }
      function animateView(target) {
        if (!motionOK()) { view = { cx: target.cx, cy: target.cy, scale: target.scale }; redraw(); return; }
        viewAnim = { t0: performance.now(), dur: 360, a: { cx: view.cx, cy: view.cy, scale: view.scale }, b: target };
        kick();
      }
      // Прорисовка кривых слева направо за dur мс (0 — только «пульс» точек).
      function startSweep(dur) {
        if (!motionOK()) { sweep.dur = 0; introOn = false; requestAnimationFrame(function () { redraw(); }); return; }
        sweep.start = performance.now(); sweep.dur = Math.max(1, dur);
        kick();
      }
      function sweepFrac(now) {
        if (!sweep.dur) return 1;
        return Math.max(0, Math.min(1, (now - sweep.start) / sweep.dur));
      }
      // Эффект точки по её экранному x: масштаб «выпрыгивания» и кольцо-пульс.
      function markFx(px, now) {
        if (!sweep.dur) return { s: 1, ring: 0 };
        var cross = sweep.start + sweep.dur * Math.max(0, Math.min(1, px / Math.max(1, cv.width)));
        var age = now - cross;
        if (age < 0) return { s: 0, ring: 0 };
        var k = Math.min(1, age / 340);
        var back = 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);   // easeOutBack
        return { s: back, ring: age < 900 ? age / 900 : 0 };
      }
      function drawMark(ctx, x, y, r, color, now, hollow) {
        var fx = markFx(x, now);
        if (fx.s <= 0) return;
        var rr = r * fx.s;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, rr), 0, 6.2832);
        if (hollow) {
          ctx.fillStyle = css('--bg-sunken', '#111'); ctx.fill();
          ctx.lineWidth = 2 * dpr; ctx.strokeStyle = color; ctx.stroke();
        } else { ctx.fillStyle = color; ctx.fill(); }
        if (fx.ring > 0) {
          ctx.save();
          ctx.globalAlpha = (1 - fx.ring) * 0.85;
          ctx.strokeStyle = color; ctx.lineWidth = 1.6 * dpr;
          ctx.beginPath(); ctx.arc(x, y, r + fx.ring * 14 * dpr, 0, 6.2832); ctx.stroke();
          ctx.restore();
        }
      }

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      function sizeCanvas() {
        var w = Math.max(1, Math.floor(cv.clientWidth * dpr));
        var h = Math.max(1, Math.floor(cv.clientHeight * dpr));
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      }
      function X(x) { return cv.width / 2 + (x - view.cx) * view.scale * dpr; }
      function Y(y) { return cv.height / 2 - (y - view.cy) * view.scale * dpr; }
      function invX(px) { return view.cx + (px - cv.width / 2) / (view.scale * dpr); }
      function invY(py) { return view.cy - (py - cv.height / 2) / (view.scale * dpr); }

      // Токены читаем с самого canvas, а не с <html>: --accent страницы
      // (цвет раздела --page-color-services) задан на body[data-page].
      function css(name, fb) {
        try { return getComputedStyle(cv).getPropertyValue(name).trim() || fb; }
        catch (e) { return fb; }
      }

      /* ------------------------------------------------ распознавание ввода
         Строитель сам решает, что перед ним:
           «функция»        — обычное выражение без «=» → y = f(x), как раньше;
           «уравнение f(x)=g(x)», одна переменная  → рисуем ОБЕ стороны и
                              отмечаем точки пересечения — это и есть
                              графический метод решения уравнения;
           «неявная кривая», ровно две переменные  → уравнение вида F(x,y)=0
                              (окружность, эллипс и т.п.), которое не всегда
                              разрешимо относительно y — рисуем как облако
                              точек нулевого уровня, без символьного решения;
           «система» (через «{ }»), 2 уравнения    → обе кривые + численный
                              поиск точек пересечения (2D Ньютон от затравок).
         ====================================================================== */
      function analyze() {
        var sysRows = mf.field.systemRows();
        if (sysRows !== null) {
          if (sysRows.length < 2) return { mode: 'error', msg: 'в системе для графика нужно 2 уравнения' };
          if (sysRows.length > 2) return { mode: 'error', msg: 'графически решаются системы из 2 уравнений (2 переменные) — здесь их ' + sysRows.length };
          return buildSystemSpec(sysRows[0], sysRows[1]);
        }
        var linear = mf.field.expr();
        if (!linear.trim()) return null;
        var rel;
        try { rel = MFAlgebra.splitRelation(linear); } catch (e) { rel = null; }
        if (!rel) return { mode: 'function', expr: linear };
        if (rel.op !== '=') return { mode: 'error', msg: 'графически решаются уравнения (=) и их системы; неравенства — в алгебраическом калькуляторе' };
        return buildEquationSpec(rel.lhs, rel.rhs);
      }
      function collectVars(asts) {
        var set = {};
        asts.forEach(function (a) { MFMath.varsIn(a).forEach(function (v) { if (MFMath.CONSTS[v] === undefined) set[v] = true; }); });
        return Object.keys(set);
      }
      function buildEquationSpec(lhsStr, rhsStr) {
        var lhsAst, rhsAst;
        try { lhsAst = MFMath.parse(lhsStr); rhsAst = MFMath.parse(rhsStr); }
        catch (e) { return { mode: 'error', msg: 'не удалось разобрать уравнение' }; }
        var vars = collectVars([lhsAst, rhsAst]);
        if (vars.length <= 1) return { mode: 'equation1d', v: vars[0] || 'x', lhsAst: lhsAst, rhsAst: rhsAst, lhsStr: lhsStr, rhsStr: rhsStr };
        if (vars.length === 2) {
          var axes = pickAxes(vars);
          return { mode: 'implicit', hVar: axes[0], vVar: axes[1], lhsAst: lhsAst, rhsAst: rhsAst, lhsStr: lhsStr, rhsStr: rhsStr };
        }
        return { mode: 'error', msg: 'больше двух переменных (' + vars.join(', ') + ') графически не решаем' };
      }
      function buildSystemSpec(row1, row2) {
        var rel1 = MFAlgebra.splitRelation(row1), rel2 = MFAlgebra.splitRelation(row2);
        if (!rel1 || !rel2 || rel1.op !== '=' || rel2.op !== '=') return { mode: 'error', msg: 'для графика оба уравнения системы должны содержать «=»' };
        var a1, b1, a2, b2;
        try { a1 = MFMath.parse(rel1.lhs); b1 = MFMath.parse(rel1.rhs); a2 = MFMath.parse(rel2.lhs); b2 = MFMath.parse(rel2.rhs); }
        catch (e) { return { mode: 'error', msg: 'не удалось разобрать систему' }; }
        var vars = collectVars([a1, b1, a2, b2]);
        if (vars.length !== 2) return { mode: 'error', msg: 'графический метод для систем — ровно 2 переменные (сейчас: ' + (vars.join(', ') || 'нет') + ')' };
        var axes = pickAxes(vars);
        return { mode: 'system', hVar: axes[0], vVar: axes[1], eq1: { lhsAst: a1, rhsAst: b1 }, eq2: { lhsAst: a2, rhsAst: b2 } };
      }
      // 'x' всегда горизонтальная ось, если присутствует; иначе — по алфавиту
      function pickAxes(vars) {
        var s = vars.slice().sort();
        if (vars.indexOf('x') >= 0) {
          var other = vars.filter(function (v) { return v !== 'x'; })[0];
          return ['x', other];
        }
        return s;
      }
      function makeF(lhsAst, rhsAst, hVar, vVar) {
        return function (hVal, vVal) {
          var vars = {}; vars[hVar] = hVal; vars[vVar] = vVal;
          try { return MFMath.evalAst(lhsAst, vars) - MFMath.evalAst(rhsAst, vars); }
          catch (e) { return NaN; }
        };
      }

      var CURVE1 = function () { return css('--accent', '#5b8cff'); };
      var CURVE2 = function () { return css('--accent-2', '#3ec2a4'); };
      var MARK = function () { return css('--accent-3', '#f2b45c'); };

      /* -------------------------------------------------------- информация
         Как и для обычных функций: список решений/пересечений всегда виден
         в панели, независимо от текущего масштаба/панорамирования — считаем
         на широком фиксированном диапазоне, пересчитываем только при смене
         ввода (не на каждый кадр перетаскивания). */
      var INFO_RANGE = 1000, IMPLICIT_RANGE = 30;
      var spec = null;

      function updateInfo() {
        info.innerHTML = '';
        spec = analyze();
        if (!spec) { badge.textContent = ''; return; }

        if (spec.mode === 'error') { badge.textContent = ''; el('div', 'err', info, spec.msg); return; }

        if (spec.mode === 'function') {
          badge.textContent = ''; badge.className = 'alg-badge';
          var c = MFMath.compile(spec.expr, 'x');
          if (!c) { el('div', 'err', info, 'не удалось разобрать'); return; }
          var rs = MFMath.roots(function (x) { return c.at(x); }, -INFO_RANGE, INFO_RANGE, 20000);
          var dl = el('dl', 'kv', info);
          el('dt', null, dl, 'корни');
          el('dd', null, dl, rs.length ? rs.slice(0, 8).map(function (r) { return fmt(r, 6); }).join(',  ') + (rs.length > 8 ? ' …' : '') : 'не найдены на [−' + INFO_RANGE + '; ' + INFO_RANGE + ']');
          var dd = MFMath.d(c.ast, 'x');
          if (dd) {
            var dfn = { at: function (x) { return MFMath.evalAst(dd, { x: x }); } };
            var ex = MFMath.roots(function (x) { return dfn.at(x); }, -INFO_RANGE, INFO_RANGE, 20000);
            el('dt', null, dl, 'экстремумы');
            el('dd', null, dl, ex.length ? ex.slice(0, 6).map(function (r) { return '(' + fmt(r, 5) + '; ' + fmt(c.at(r), 5) + ')'; }).join('  ') + (ex.length > 6 ? ' …' : '') : 'не найдены на [−' + INFO_RANGE + '; ' + INFO_RANGE + ']');
          }
          return;
        }

        if (spec.mode === 'equation1d') {
          badge.textContent = 'Уравнение f(' + spec.v + ') = g(' + spec.v + ') — графический метод'; badge.className = 'alg-badge alg-badge-eq';
          var vars1 = {}; vars1[spec.v] = 0;
          var f = function (t) { vars1[spec.v] = t; try { return MFMath.evalAst(spec.lhsAst, vars1) - MFMath.evalAst(spec.rhsAst, vars1); } catch (e) { return NaN; } };
          var roots1 = MFMath.roots(f, -INFO_RANGE, INFO_RANGE, 20000);
          if (!roots1.length) {
            el('div', 'alg-answer-label', info, 'Ответ');
            el('div', 'alg-answer-big', info, 'решений не найдено на [−' + INFO_RANGE + '; ' + INFO_RANGE + ']');
            return;
          }
          // Сам ответ — крупно, как в алгебраическом калькуляторе (x = ...),
          // а не только координаты точек пересечения ниже.
          el('div', 'alg-answer-label', info, 'Ответ');
          roots1.slice(0, 8).forEach(function (r) {
            el('div', 'alg-answer-big', info, spec.v + ' = ' + fmt(r, 8));
          });
          var dl2 = el('dl', 'kv', info);
          el('dt', null, dl2, 'точки пересечения');
          roots1.slice(0, 8).forEach(function (r) {
            vars1[spec.v] = r;
            var yv; try { yv = MFMath.evalAst(spec.lhsAst, vars1); } catch (e) { yv = NaN; }
            el('dd', null, dl2, '(' + fmt(r, 6) + '; ' + fmt(yv, 6) + ')');
          });
          return;
        }

        if (spec.mode === 'implicit') {
          badge.textContent = 'Уравнение с двумя переменными (' + spec.hVar + ', ' + spec.vVar + ') — неявная кривая'; badge.className = 'alg-badge alg-badge-eq';
          el('div', 'sub', info, 'F(' + spec.hVar + ', ' + spec.vVar + ') = 0 — точного решения в общем виде не строим, кривая ниже показывает все точки, где равенство выполняется');
          return;
        }

        if (spec.mode === 'system') {
          badge.textContent = 'Система двух уравнений (' + spec.hVar + ', ' + spec.vVar + ') — графический метод'; badge.className = 'alg-badge alg-badge-eq';
          var F1 = makeF(spec.eq1.lhsAst, spec.eq1.rhsAst, spec.hVar, spec.vVar);
          var F2 = makeF(spec.eq2.lhsAst, spec.eq2.rhsAst, spec.hVar, spec.vVar);
          var pts = findIntersections2D(F1, F2, -IMPLICIT_RANGE, IMPLICIT_RANGE, -IMPLICIT_RANGE, IMPLICIT_RANGE, 70);
          if (!pts.length) {
            el('div', 'alg-answer-label', info, 'Ответ');
            el('div', 'alg-answer-big', info, 'решений не найдено на [−' + IMPLICIT_RANGE + '; ' + IMPLICIT_RANGE + '] по каждой оси');
            return;
          }
          el('div', 'alg-answer-label', info, pts.length > 1 ? 'Решения' : 'Ответ');
          pts.slice(0, 10).forEach(function (pt) {
            el('div', 'alg-answer-big', info, spec.hVar + ' = ' + fmt(pt.x, 6) + ',  ' + spec.vVar + ' = ' + fmt(pt.y, 6));
          });
          var dl3 = el('dl', 'kv', info);
          el('dt', null, dl3, 'точки на графике');
          pts.slice(0, 10).forEach(function (pt) {
            el('dd', null, dl3, '(' + fmt(pt.x, 6) + '; ' + fmt(pt.y, 6) + ')');
          });
          return;
        }
      }

      function redraw(now) {
        if (typeof now !== 'number') now = performance.now();
        sizeCanvas();
        var ctx = cv.getContext('2d');
        var W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);
        // intro: сетка проявляется, оси «вырастают» из начала координат
        var intro = introOn ? easeOut3(Math.min(1, (now - mountT) / 650)) : 1;
        if (introOn && intro >= 1) introOn = false;

        var cGrid = css('--mf-grid-minor', 'rgba(120,150,210,.06)');
        var cAxis = css('--border-strong', '#888');
        var cTxt = css('--text-tertiary', '#888');

        var raw = 70 / view.scale;
        var mag = Math.pow(10, Math.floor(Math.log10(raw)));
        var norm = raw / mag;
        var step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;

        var x0 = invX(0), x1 = invX(W);
        var yTop = invY(0), yBot = invY(H);

        ctx.lineWidth = 1;
        ctx.strokeStyle = cGrid;
        ctx.globalAlpha = intro;
        ctx.beginPath();
        for (var gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step) { ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), H); }
        for (var gy = Math.ceil(yBot / step) * step; gy <= yTop; gy += step) { ctx.moveTo(0, Y(gy)); ctx.lineTo(W, Y(gy)); }
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = cAxis; ctx.lineWidth = 1.4 * dpr;
        ctx.beginPath();
        var ox = X(0), oy = Y(0), ax = Math.max(W, H) * intro;
        ctx.moveTo(Math.max(0, ox - ax), oy); ctx.lineTo(Math.min(W, ox + ax), oy);
        ctx.moveTo(ox, Math.max(0, oy - ax)); ctx.lineTo(ox, Math.min(H, oy + ax));
        ctx.stroke();

        ctx.fillStyle = cTxt;
        ctx.globalAlpha = intro;
        ctx.font = (11 * dpr) + 'px ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (var tx = Math.ceil(x0 / step) * step; tx <= x1; tx += step) {
          if (Math.abs(tx) < step / 2) continue;
          ctx.fillText(fmt(tx, 4), X(tx), Y(0) + 4 * dpr);
        }
        ctx.globalAlpha = 1;

        if (!spec || spec.mode === 'error') return;

        // Прорисовка слева направо: кривые клипуются по фронту sweepPx,
        // точки появляются в момент, когда фронт до них доходит (markFx).
        var sf = sweepFrac(now), sweepPx = W * sf;
        ctx.save();
        if (sf < 1) { ctx.beginPath(); ctx.rect(0, 0, sweepPx, H); ctx.clip(); }

        if (spec.mode === 'function') { drawFunctionCurve(ctx, spec.expr, CURVE1(), x0, x1, W, H, now); }
        else if (spec.mode === 'equation1d') {
          drawAstCurve(ctx, spec.lhsAst, spec.v, CURVE1(), x0, x1, W, H);
          drawAstCurve(ctx, spec.rhsAst, spec.v, CURVE2(), x0, x1, W, H);
          drawEq1DMarks(ctx, spec, x0, x1, now);
        }
        else if (spec.mode === 'implicit') {
          var F = makeF(spec.lhsAst, spec.rhsAst, spec.hVar, spec.vVar);
          drawImplicitCurve(ctx, F, CURVE1(), x0, x1, yBot, yTop);
        }
        else if (spec.mode === 'system') {
          var G1 = makeF(spec.eq1.lhsAst, spec.eq1.rhsAst, spec.hVar, spec.vVar);
          var G2 = makeF(spec.eq2.lhsAst, spec.eq2.rhsAst, spec.hVar, spec.vVar);
          drawImplicitCurve(ctx, G1, CURVE1(), x0, x1, yBot, yTop);
          drawImplicitCurve(ctx, G2, CURVE2(), x0, x1, yBot, yTop);
          drawSystemMarks(ctx, G1, G2, x0, x1, yBot, yTop, now);
        }
        ctx.restore();

        // «сканер» на фронте прорисовки — мягкая вертикальная полоса цвета раздела
        if (sf > 0 && sf < 1) {
          var bw = 36 * dpr, g = ctx.createLinearGradient(sweepPx - bw, 0, sweepPx, 0);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, CURVE1());
          ctx.save();
          ctx.globalAlpha = 0.1 * Math.sin(sf * Math.PI);
          ctx.fillStyle = g; ctx.fillRect(sweepPx - bw, 0, bw, H);
          ctx.globalAlpha = 0.55 * Math.sin(sf * Math.PI);
          ctx.fillStyle = CURVE1(); ctx.fillRect(sweepPx - dpr, 0, 1.5 * dpr, H);
          ctx.restore();
        }
      }

      // Кэш компиляции функции и её производной: redraw зовётся на каждый
      // кадр анимации/перетаскивания — не пересобираем AST каждый раз.
      var fnCache = { expr: null, c: null, d: null };
      function compiledFn(exprStr) {
        if (fnCache.expr !== exprStr) {
          var c = MFMath.compile(exprStr, 'x'), dAst = null;
          try { dAst = c ? MFMath.d(c.ast, 'x') : null; } catch (e) { dAst = null; }
          fnCache = { expr: exprStr, c: c, d: dAst };
        }
        return fnCache;
      }

      function drawFunctionCurve(ctx, exprStr, color, x0, x1, W, H, now) {
        var cc = compiledFn(exprStr), c = cc.c;
        if (!c) return;
        ctx.strokeStyle = color; ctx.lineWidth = 2.2 * dpr; ctx.beginPath();
        var pen = false, prevY = null;
        for (var px = 0; px <= W; px += Math.max(1, dpr)) {
          var xv = invX(px), yv = c.at(xv);
          if (!isFinite(yv)) { pen = false; prevY = null; continue; }
          var py = Y(yv);
          if (prevY !== null && Math.abs(py - prevY) > H * 1.4) pen = false;
          if (!pen) { ctx.moveTo(px, py); pen = true; } else { ctx.lineTo(px, py); }
          prevY = py;
        }
        ctx.stroke();
        var rsVisible = MFMath.roots(function (x) { return c.at(x); }, x0, x1, 1200);
        rsVisible.slice(0, 40).forEach(function (r) { drawMark(ctx, X(r), Y(0), 3.5 * dpr, color, now); });
        // Экстремумы — полые точки акцентного цвета (те же, что в списке ниже).
        if (cc.d) {
          var dAst = cc.d, dv = { x: 0 };
          var ex = MFMath.roots(function (x) { dv.x = x; try { return MFMath.evalAst(dAst, dv); } catch (e) { return NaN; } }, x0, x1, 600);
          ex.slice(0, 30).forEach(function (r) {
            var yv = c.at(r);
            if (isFinite(yv)) drawMark(ctx, X(r), Y(yv), 4 * dpr, MARK(), now, true);
          });
        }
      }

      function drawAstCurve(ctx, ast, varName, color, x0, x1, W, H) {
        ctx.strokeStyle = color; ctx.lineWidth = 2.2 * dpr; ctx.beginPath();
        var pen = false, prevY = null, vars = {};
        for (var px = 0; px <= W; px += Math.max(1, dpr)) {
          var xv = invX(px);
          vars[varName] = xv;
          var yv; try { yv = MFMath.evalAst(ast, vars); } catch (e) { yv = NaN; }
          if (!isFinite(yv)) { pen = false; prevY = null; continue; }
          var py = Y(yv);
          if (prevY !== null && Math.abs(py - prevY) > H * 1.4) pen = false;
          if (!pen) { ctx.moveTo(px, py); pen = true; } else { ctx.lineTo(px, py); }
          prevY = py;
        }
        ctx.stroke();
      }

      function drawEq1DMarks(ctx, spec, x0, x1, now) {
        var vars = {};
        var f = function (t) { vars[spec.v] = t; try { return MFMath.evalAst(spec.lhsAst, vars) - MFMath.evalAst(spec.rhsAst, vars); } catch (e) { return NaN; } };
        var rs = MFMath.roots(f, x0, x1, 1200);
        var mc = MARK();
        rs.forEach(function (r) {
          vars[spec.v] = r;
          var yv; try { yv = MFMath.evalAst(spec.lhsAst, vars); } catch (e) { yv = NaN; }
          if (!isFinite(yv)) return;
          drawMark(ctx, X(r), Y(yv), 4 * dpr, mc, now);
        });
      }

      // Неявная кривая — облако точек нулевого уровня (маршевый квадрат),
      // размер сетки подстраивается под масштаб для разумной плотности.
      function drawImplicitCurve(ctx, F, color, x0, x1, y0, y1) {
        var gridN = 130;
        var pts = traceImplicitPoints(F, x0, x1, y0, y1, gridN, gridN);
        ctx.fillStyle = color;
        var r = Math.max(1, 1.6 * dpr);
        pts.forEach(function (pt) {
          ctx.beginPath(); ctx.arc(X(pt.x), Y(pt.y), r, 0, 6.2832); ctx.fill();
        });
      }

      function drawSystemMarks(ctx, F1, F2, x0, x1, y0, y1, now) {
        var pts = findIntersections2D(F1, F2, x0, x1, y0, y1, 70);
        var mc = MARK();
        pts.forEach(function (pt) {
          drawMark(ctx, X(pt.x), Y(pt.y), 4.5 * dpr, mc, now);
        });
      }

      // Набор символов — кривая перерисовывается сразу (без «сканера», чтобы
      // не мигать на каждый символ), только точки коротко пульсируют. Enter —
      // полная прорисовка слева направо + проявление ответа.
      function onFunctionChange(fld, isEnter) {
        updateInfo();
        var errNode = info.querySelector('.err');
        fieldFeedback(mf.field, !!errNode, isEnter === true, errNode);
        if (isEnter === true) {
          startSweep(900);
          revealAnswer(info, 250);
        } else {
          startSweep(1);
        }
      }

      /* --- жесты: одним пальцем тянем, двумя щипаем, колесом масштабируем --- */
      var drag = null, pts = {}, pinch = null;
      cv.addEventListener('pointerdown', function (e) {
        cv.setPointerCapture(e.pointerId); viewAnim = null;
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
      });
      function up(e) {
        delete pts[e.pointerId];
        if (Object.keys(pts).length < 2) pinch = null;
        if (!Object.keys(pts).length) drag = null;
      }
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', function (e) {
        e.preventDefault(); viewAnim = null;
        view.scale = Math.max(2, Math.min(4000, view.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        redraw();
      }, { passive: false });

      window.addEventListener('resize', redraw);
      new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      updateInfo();
      startSweep(1000);
    }
  };

  /* ======================================================================
     3. РЕШЕНИЕ ТРЕУГОЛЬНИКА
     Заполните любые три элемента (хотя бы одну сторону) — найдётся остальное.
     ====================================================================== */
  /* ======================================================================
     ГЕОМЕТРИЧЕСКИЙ КАЛЬКУЛЯТОР
     Шесть разделов вкладками (та же механика чипов, что в конверторе):
     треугольник, четырёхугольники, окружность, правильный n-угольник,
     стереометрия, координатная геометрия. Более редкие/сложные разделы
     (аналитическая геометрия прямых и плоскостей, конические сечения и т.п.)
     сознательно оставлены для раздела «Ещё» — здесь только самое частое.
     ====================================================================== */
  var D2R = Math.PI / 180;
  function fmtGeo(v) {
    if (!isFinite(v)) return '—';
    var s = Number(v.toPrecision(8));
    return String(s);
  }
  function geoField(container, label, val) {
    var l = el('label', 'f', container);
    el('span', null, l, label);
    var i = el('input', null, l);
    i.type = 'text'; i.inputMode = 'decimal'; if (val !== undefined) i.value = val;
    return i;
  }
  function geoNum(input) {
    var v = parseFloat(String(input.value).replace(',', '.'));
    return isFinite(v) ? v : null;
  }
  function geoResults(container, pairs) {
    container.innerHTML = '';
    var dl = el('dl', 'kv', container);
    pairs.forEach(function (p) {
      el('dt', null, dl, p[0]);
      el('dd', null, dl, fmtGeo(p[1]));
    });
  }

  /* ---- треугольник (та же проверенная итеративная схема — синусы+косинусы) ---- */
  function buildTriangleUI(container) {
    var g = el('div', 'grid2', container);
    var F = {};
    [['a', 'сторона a'], ['b', 'сторона b'], ['c', 'сторона c'],
     ['A', 'угол A, °'], ['B', 'угол B, °'], ['C', 'угол C, °']].forEach(function (d) {
      F[d[0]] = geoField(g, d[1]);
      F[d[0]].addEventListener('input', solve);
    });
    var out = el('div', 'out', container);
    function num(k) { var v = geoNum(F[k]); return v !== null && v > 0 ? v : null; }
    function solve() {
      var a = num('a'), b = num('b'), c = num('c'), A = num('A'), B = num('B'), C = num('C');
      out.innerHTML = '';
      var given = [a, b, c, A, B, C].filter(function (v) { return v !== null; }).length;
      if (given < 3) { el('div', 'sub', out, 'заполните любые три поля (нужно ещё ' + (3 - given) + ')'); return; }
      if (a === null && b === null && c === null) {
        el('div', 'err', out, 'нужна хотя бы одна сторона — по трём углам треугольник определён только с точностью до подобия');
        return;
      }
      if (A && B && !C) C = 180 - A - B;
      if (A && C && !B) B = 180 - A - C;
      if (B && C && !A) A = 180 - B - C;
      for (var iter = 0; iter < 6; iter++) {
        var k = (a && A) ? a / Math.sin(A * D2R) : (b && B) ? b / Math.sin(B * D2R) : (c && C) ? c / Math.sin(C * D2R) : null;
        if (k) {
          if (!a && A) a = k * Math.sin(A * D2R);
          if (!b && B) b = k * Math.sin(B * D2R);
          if (!c && C) c = k * Math.sin(C * D2R);
          if (!A && a) A = Math.asin(Math.min(1, a / k)) / D2R;
          if (!B && b) B = Math.asin(Math.min(1, b / k)) / D2R;
          if (!C && c) C = Math.asin(Math.min(1, c / k)) / D2R;
        }
        if (a && b && C && !c) c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * D2R));
        if (a && c && B && !b) b = Math.sqrt(a * a + c * c - 2 * a * c * Math.cos(B * D2R));
        if (b && c && A && !a) a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A * D2R));
        if (a && b && c) {
          if (!A) A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) / D2R;
          if (!B) B = Math.acos((a * a + c * c - b * b) / (2 * a * c)) / D2R;
          if (!C) C = Math.acos((a * a + b * b - c * c) / (2 * a * b)) / D2R;
        }
        if (A && B && !C) C = 180 - A - B;
        if (A && C && !B) B = 180 - A - C;
        if (B && C && !A) A = 180 - B - C;
      }
      if (!(a && b && c && A && B && C)) { el('div', 'err', out, 'этих данных не хватает'); return; }
      if (a + b <= c || a + c <= b || b + c <= a) { el('div', 'err', out, 'такого треугольника не существует: нарушено неравенство треугольника'); return; }
      var s = (a + b + c) / 2;
      var S = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
      geoResults(out, [['a', a], ['b', b], ['c', c], ['A°', A], ['B°', B], ['C°', C],
        ['периметр', a + b + c], ['площадь', S], ['R описанной', a / (2 * Math.sin(A * D2R))], ['r вписанной', S / s]]);
    }
    solve();
  }

  /* ---- четырёхугольники: выбор формы + свои поля ---- */
  var QUAD_SHAPES = [
    { id: 'square', label: 'Квадрат' }, { id: 'rect', label: 'Прямоугольник' },
    { id: 'para', label: 'Параллелограмм' }, { id: 'rhomb', label: 'Ромб' }, { id: 'trap', label: 'Трапеция' }
  ];
  function buildQuadUI(container) {
    var chipRow = el('div', 'geo-subchips', container);
    var body = el('div', null, container);
    var shape = 'square';
    function render() {
      chipRow.querySelectorAll('.geo-subchip').forEach(function (b) { b.classList.toggle('on', b.dataset.id === shape); });
      body.innerHTML = '';
      var g = el('div', 'grid2', body), out = el('div', 'out', body);
      if (shape === 'square') {
        var iS = geoField(g, 'сторона', '5');
        function calc() { var s = geoNum(iS); if (s === null) return; geoResults(out, [['площадь', s*s], ['периметр', 4*s], ['диагональ', s*Math.SQRT2]]); }
        iS.addEventListener('input', calc); calc();
      } else if (shape === 'rect') {
        var iW = geoField(g, 'ширина', '4'), iH = geoField(g, 'высота', '3');
        function calc2() { var w=geoNum(iW), h=geoNum(iH); if (w===null||h===null) return; geoResults(out, [['площадь', w*h], ['периметр', 2*(w+h)], ['диагональ', Math.sqrt(w*w+h*h)]]); }
        [iW, iH].forEach(function (i) { i.addEventListener('input', calc2); }); calc2();
      } else if (shape === 'para') {
        var pa = geoField(g, 'сторона a', '5'), pb = geoField(g, 'сторона b', '7'), pt = geoField(g, 'угол между ними, °', '60');
        function calc3() {
          var a=geoNum(pa), b=geoNum(pb), t=geoNum(pt); if (a===null||b===null||t===null) return;
          var rad = t*D2R;
          geoResults(out, [['площадь', a*b*Math.sin(rad)], ['периметр', 2*(a+b)],
            ['диагональ 1', Math.sqrt(a*a+b*b+2*a*b*Math.cos(rad))], ['диагональ 2', Math.sqrt(a*a+b*b-2*a*b*Math.cos(rad))]]);
        }
        [pa, pb, pt].forEach(function (i) { i.addEventListener('input', calc3); }); calc3();
      } else if (shape === 'rhomb') {
        var rs = geoField(g, 'сторона', '5'), rt = geoField(g, 'угол, °', '60');
        function calc4() {
          var s=geoNum(rs), t=geoNum(rt); if (s===null||t===null) return;
          var rad=t*D2R;
          geoResults(out, [['площадь', s*s*Math.sin(rad)], ['периметр', 4*s],
            ['диагональ 1', 2*s*Math.cos(rad/2)], ['диагональ 2', 2*s*Math.sin(rad/2)]]);
        }
        [rs, rt].forEach(function (i) { i.addEventListener('input', calc4); }); calc4();
      } else if (shape === 'trap') {
        var ta = geoField(g, 'основание a', '6'), tb = geoField(g, 'основание b', '10'),
            th = geoField(g, 'высота', '4'), tc = geoField(g, 'боковая c'), td = geoField(g, 'боковая d');
        function calc5() {
          var a=geoNum(ta), b=geoNum(tb), h=geoNum(th); if (a===null||b===null||h===null) return;
          var res = [['площадь', (a+b)/2*h]];
          var c=geoNum(tc), d=geoNum(td);
          if (c!==null && d!==null) res.push(['периметр', a+b+c+d]);
          geoResults(out, res);
        }
        [ta, tb, th, tc, td].forEach(function (i) { i.addEventListener('input', calc5); }); calc5();
      }
    }
    QUAD_SHAPES.forEach(function (s) {
      var b = el('button', 'geo-subchip', chipRow, s.label); b.type = 'button'; b.dataset.id = s.id;
      b.addEventListener('click', function () { shape = s.id; render(); });
    });
    render();
  }

  /* ---- окружность: вводим ЛЮБУЮ одну величину — остальные выводятся ---- */
  function buildCircleUI(container) {
    var g = el('div', 'grid2', container);
    var kindSel = el('select', 'conv-select', g);
    [['r', 'радиус'], ['d', 'диаметр'], ['C', 'длина окружности'], ['A', 'площадь']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; kindSel.appendChild(opt);
    });
    var iV = geoField(g, 'значение', '7');
    var out = el('div', 'out', container);
    function calc() {
      var v = geoNum(iV); if (v === null || v <= 0) return;
      var kind = kindSel.value, r;
      if (kind === 'r') r = v; else if (kind === 'd') r = v/2; else if (kind === 'C') r = v/(2*Math.PI); else r = Math.sqrt(v/Math.PI);
      geoResults(out, [['радиус', r], ['диаметр', 2*r], ['длина окружности', 2*Math.PI*r], ['площадь', Math.PI*r*r]]);
    }
    kindSel.addEventListener('change', calc); iV.addEventListener('input', calc);
    calc();
  }

  /* ---- правильный n-угольник ---- */
  function buildRegularPolyUI(container) {
    var g = el('div', 'grid2', container);
    var iN = geoField(g, 'число сторон n', '6'), iA = geoField(g, 'сторона a', '1');
    var out = el('div', 'out', container);
    function calc() {
      var n = Math.round(geoNum(iN)), a = geoNum(iA);
      if (!n || n < 3 || a === null || a <= 0) { out.innerHTML = ''; el('div','err',out,'n должно быть ≥ 3'); return; }
      var t = Math.PI / n;
      geoResults(out, [
        ['периметр', n * a], ['площадь', (n * a * a) / (4 * Math.tan(t))],
        ['апофема (r вписанной)', a / (2 * Math.tan(t))], ['R описанной', a / (2 * Math.sin(t))],
        ['внутренний угол, °', (n - 2) * 180 / n], ['сумма углов, °', (n - 2) * 180]
      ]);
    }
    [iN, iA].forEach(function (i) { i.addEventListener('input', calc); });
    calc();
  }

  /* ---- стереометрия: выбор тела + свои поля ---- */
  var SOLID_SHAPES = [
    { id: 'cube', label: 'Куб' }, { id: 'box', label: 'Параллелепипед' }, { id: 'sphere', label: 'Шар' },
    { id: 'cylinder', label: 'Цилиндр' }, { id: 'cone', label: 'Конус' }, { id: 'pyramid', label: 'Пирамида' }
  ];
  function buildSolidUI(container) {
    var chipRow = el('div', 'geo-subchips', container);
    var body = el('div', null, container);
    var shape = 'cube';
    function render() {
      chipRow.querySelectorAll('.geo-subchip').forEach(function (b) { b.classList.toggle('on', b.dataset.id === shape); });
      body.innerHTML = '';
      var g = el('div', 'grid2', body), out = el('div', 'out', body);
      if (shape === 'cube') {
        var iA = geoField(g, 'сторона', '3');
        function c() { var a=geoNum(iA); if(a===null) return; geoResults(out,[['объём',a*a*a],['площадь пов-ти',6*a*a],['диагональ',a*Math.sqrt(3)]]); }
        iA.addEventListener('input', c); c();
      } else if (shape === 'box') {
        var bA=geoField(g,'сторона a','2'), bB=geoField(g,'сторона b','3'), bC=geoField(g,'сторона c','4');
        function c2(){ var a=geoNum(bA),b=geoNum(bB),cc=geoNum(bC); if(a===null||b===null||cc===null) return;
          geoResults(out,[['объём',a*b*cc],['площадь пов-ти',2*(a*b+b*cc+cc*a)],['диагональ',Math.sqrt(a*a+b*b+cc*cc)]]); }
        [bA,bB,bC].forEach(function(i){i.addEventListener('input',c2);}); c2();
      } else if (shape === 'sphere') {
        var sR = geoField(g, 'радиус', '3');
        function c3(){ var r=geoNum(sR); if(r===null) return; geoResults(out,[['объём',4/3*Math.PI*r*r*r],['площадь пов-ти',4*Math.PI*r*r]]); }
        sR.addEventListener('input', c3); c3();
      } else if (shape === 'cylinder') {
        var cR=geoField(g,'радиус','2'), cH=geoField(g,'высота','5');
        function c4(){ var r=geoNum(cR),h=geoNum(cH); if(r===null||h===null) return;
          geoResults(out,[['объём',Math.PI*r*r*h],['боковая пов-ть',2*Math.PI*r*h],['полная пов-ть',2*Math.PI*r*(r+h)]]); }
        [cR,cH].forEach(function(i){i.addEventListener('input',c4);}); c4();
      } else if (shape === 'cone') {
        var knR=geoField(g,'радиус','3'), knH=geoField(g,'высота','4');
        function c5(){ var r=geoNum(knR),h=geoNum(knH); if(r===null||h===null) return;
          var l=Math.sqrt(r*r+h*h);
          geoResults(out,[['объём',1/3*Math.PI*r*r*h],['образующая',l],['боковая пов-ть',Math.PI*r*l],['полная пов-ть',Math.PI*r*(r+l)]]); }
        [knR,knH].forEach(function(i){i.addEventListener('input',c5);}); c5();
      } else if (shape === 'pyramid') {
        var pA=geoField(g,'сторона основания','6'), pH=geoField(g,'высота','4');
        function c6(){ var a=geoNum(pA),h=geoNum(pH); if(a===null||h===null) return;
          var l=Math.sqrt(h*h+(a/2)*(a/2));
          geoResults(out,[['объём',1/3*a*a*h],['апофема (образующая)',l],['боковая пов-ть',2*a*l],['полная пов-ть',a*a+2*a*l]]); }
        [pA,pH].forEach(function(i){i.addEventListener('input',c6);}); c6();
      }
    }
    SOLID_SHAPES.forEach(function (s) {
      var b = el('button', 'geo-subchip', chipRow, s.label); b.type = 'button'; b.dataset.id = s.id;
      b.addEventListener('click', function () { shape = s.id; render(); });
    });
    render();
  }

  /* ---- координатная геометрия: точки и векторы ---- */
  function buildCoordUI(container) {
    var box1 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box1, 'Две точки: расстояние и середина');
    var g1 = el('div', 'grid2', box1);
    var x1=geoField(g1,'x₁','0'), y1=geoField(g1,'y₁','0'), x2=geoField(g1,'x₂','3'), y2=geoField(g1,'y₂','4');
    var out1 = el('div', 'out', box1);
    function calc1() {
      var a=geoNum(x1),b=geoNum(y1),c=geoNum(x2),d=geoNum(y2); if([a,b,c,d].some(function(v){return v===null;})) return;
      geoResults(out1, [['расстояние', Math.sqrt((c-a)*(c-a)+(d-b)*(d-b))], ['середина x', (a+c)/2], ['середина y', (b+d)/2]]);
    }
    [x1,y1,x2,y2].forEach(function(i){i.addEventListener('input',calc1);}); calc1();

    var box2 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box2, 'Два вектора: длина, скалярное произведение, угол');
    var g2 = el('div', 'grid2', box2);
    var ux=geoField(g2,'u, x','1'), uy=geoField(g2,'u, y','0'), vx=geoField(g2,'v, x','0'), vy=geoField(g2,'v, y','1');
    var out2 = el('div', 'out', box2);
    function calc2() {
      var a=geoNum(ux),b=geoNum(uy),c=geoNum(vx),d=geoNum(vy); if([a,b,c,d].some(function(v){return v===null;})) return;
      var mag1=Math.sqrt(a*a+b*b), mag2=Math.sqrt(c*c+d*d), dot=a*c+b*d;
      var cosA = Math.max(-1,Math.min(1, dot/(mag1*mag2)));
      var res = [['|u|', mag1], ['|v|', mag2], ['u·v', dot], ['угол между ними, °', Math.acos(cosA)/D2R]];
      if (Math.abs(dot) < 1e-9) res.push(['⊥', 'перпендикулярны']);
      geoResults(out2, res);
    }
    [ux,uy,vx,vy].forEach(function(i){i.addEventListener('input',calc2);}); calc2();
  }

  var GEO_TABS = [
    { id: 'triangle', label: 'Треугольник', build: buildTriangleUI },
    { id: 'quad', label: 'Четырёхугольники', build: buildQuadUI },
    { id: 'circle', label: 'Окружность', build: buildCircleUI },
    { id: 'poly', label: 'Многоугольник', build: buildRegularPolyUI },
    { id: 'solid', label: 'Стереометрия', build: buildSolidUI },
    { id: 'coord', label: 'Координаты', build: buildCoordUI }
  ];
  var svcGeo = {
    id: 'geo', glyph: '△', title: 'Геометрический калькулятор',
    sub: 'Планиметрия, стереометрия, координаты',
    mount: function (host) {
      var p = panel(host, 'Геометрия');
      var chipRow = el('div', 'conv-chips', p);
      var body = el('div', 'conv-body', p);
      var activeTab = 'triangle';
      function renderTab() {
        chipRow.querySelectorAll('.conv-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.id === activeTab); });
        body.innerHTML = '';
        var tab = GEO_TABS.filter(function (t) { return t.id === activeTab; })[0];
        if (tab) tab.build(body);
      }
      GEO_TABS.forEach(function (t) {
        var b = el('button', 'conv-chip', chipRow, t.label); b.type = 'button'; b.dataset.id = t.id;
        b.addEventListener('click', function () { activeTab = t.id; renderTab(); });
      });
      renderTab();
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
  /* ======================================================================
     КОНВЕРТОР
     Единая карточка «из / в» для всех линейных (мультипликативных)
     категорий (длина, масса, площадь, объём, время, скорость, данные,
     энергия) — конверсия через базовую единицу: value*factor[from]/factor[to].
     Температура, валюта, системы счисления, дата, скидка и финансы —
     отдельные вкладки со своей логикой (не сводятся к простому множителю).
     ====================================================================== */
  var CONV_CATS = {
    length: { label: 'Длина', base: 'm', units: {
      mm: { label: 'мм', f: 0.001 }, cm: { label: 'см', f: 0.01 }, m: { label: 'м', f: 1 }, km: { label: 'км', f: 1000 },
      in: { label: 'дюйм', f: 0.0254 }, ft: { label: 'фут', f: 0.3048 }, yd: { label: 'ярд', f: 0.9144 },
      mi: { label: 'миля', f: 1609.344 }, nmi: { label: 'морск. миля', f: 1852 }
    }, def: ['km', 'mi'] },
    mass: { label: 'Масса', base: 'kg', units: {
      mg: { label: 'мг', f: 0.000001 }, g: { label: 'г', f: 0.001 }, kg: { label: 'кг', f: 1 }, t: { label: 'т', f: 1000 },
      lb: { label: 'фунт', f: 0.45359237 }, oz: { label: 'унция', f: 0.028349523125 }, ct: { label: 'карат', f: 0.0002 }
    }, def: ['kg', 'lb'] },
    area: { label: 'Площадь', base: 'm2', units: {
      mm2: { label: 'мм²', f: 0.000001 }, cm2: { label: 'см²', f: 0.0001 }, m2: { label: 'м²', f: 1 },
      sotka: { label: 'сотка', f: 100 }, ha: { label: 'га', f: 10000 }, km2: { label: 'км²', f: 1000000 },
      acre: { label: 'акр', f: 4046.8564224 }, sqft: { label: 'фут²', f: 0.09290304 }, sqmi: { label: 'миля²', f: 2589988.110336 }
    }, def: ['m2', 'sotka'] },
    volume: { label: 'Объём', base: 'l', units: {
      ml: { label: 'мл', f: 0.001 }, l: { label: 'л', f: 1 }, m3: { label: 'м³', f: 1000 },
      galUS: { label: 'галлон (US)', f: 3.785411784 }, galUK: { label: 'галлон (UK)', f: 4.54609 },
      qtUS: { label: 'кварта', f: 0.946352946 }, ptUS: { label: 'пинта', f: 0.473176473 },
      cupUS: { label: 'чашка', f: 0.2365882365 }, flozUS: { label: 'жидк. унция', f: 0.0295735295625 },
      bbl: { label: 'баррель (нефт.)', f: 158.987294928 }
    }, def: ['l', 'galUS'] },
    time: { label: 'Время', base: 's', units: {
      ms: { label: 'мс', f: 0.001 }, s: { label: 'с', f: 1 }, min: { label: 'мин', f: 60 }, h: { label: 'ч', f: 3600 },
      day: { label: 'сут', f: 86400 }, week: { label: 'нед', f: 604800 },
      month: { label: 'мес (сред.)', f: 2629746 }, year: { label: 'год', f: 31557600 }
    }, def: ['h', 'day'] },
    speed: { label: 'Скорость', base: 'mps', units: {
      mps: { label: 'м/с', f: 1 }, kmh: { label: 'км/ч', f: 1 / 3.6 }, mph: { label: 'миль/ч', f: 0.44704 },
      knot: { label: 'узел', f: 0.514444444 }, fps: { label: 'фут/с', f: 0.3048 }, mach: { label: 'Мах (≈ур. моря)', f: 340.29 }
    }, def: ['kmh', 'mph'] },
    data: { label: 'Данные', base: 'byte', units: {
      bit: { label: 'бит', f: 0.125 }, byte: { label: 'байт', f: 1 },
      KB: { label: 'КБ (1000)', f: 1e3 }, KiB: { label: 'КиБ (1024)', f: 1024 },
      MB: { label: 'МБ (1000²)', f: 1e6 }, MiB: { label: 'МиБ (1024²)', f: 1048576 },
      GB: { label: 'ГБ (1000³)', f: 1e9 }, GiB: { label: 'ГиБ (1024³)', f: 1073741824 },
      TB: { label: 'ТБ (1000⁴)', f: 1e12 }, TiB: { label: 'ТиБ (1024⁴)', f: 1099511627776 },
      PB: { label: 'ПБ (1000⁵)', f: 1e15 }, PiB: { label: 'ПиБ (1024⁵)', f: 1125899906842624 }
    }, def: ['MiB', 'MB'] },
    energy: { label: 'Энергия/работа', base: 'J', units: {
      J: { label: 'Дж', f: 1 }, kJ: { label: 'кДж', f: 1000 }, cal: { label: 'кал', f: 4.184 }, kcal: { label: 'ккал', f: 4184 },
      Wh: { label: 'Вт·ч', f: 3600 }, kWh: { label: 'кВт·ч', f: 3600000 }, eV: { label: 'эВ', f: 1.602176634e-19 },
      BTU: { label: 'БТЕ', f: 1055.05585262 }, ftlb: { label: 'фунт-сила·фут', f: 1.3558179483314004 }
    }, def: ['kcal', 'kJ'] }
  };
  function convertLinear(cat, value, from, to) {
    var u = CONV_CATS[cat].units;
    return value * u[from].f / u[to].f;
  }
  function fmtConv(v) {
    if (!isFinite(v)) return '—';
    if (v !== 0 && (Math.abs(v) < 1e-6 || Math.abs(v) >= 1e15)) return v.toExponential(6);
    var s = Number(v.toPrecision(10));
    return String(s);
  }

  function buildLinearCategoryUI(container, catKey) {
    var cat = CONV_CATS[catKey];
    var row = el('div', 'conv-row', container);
    var fromSel = el('select', 'conv-select', row);
    var swapBtn = el('button', 'conv-swap', row, '⇄'); swapBtn.type = 'button'; swapBtn.title = 'Поменять местами';
    var toSel = el('select', 'conv-select', row);
    Object.keys(cat.units).forEach(function (k) {
      var o1 = document.createElement('option'); o1.value = k; o1.textContent = cat.units[k].label; fromSel.appendChild(o1);
      var o2 = document.createElement('option'); o2.value = k; o2.textContent = cat.units[k].label; toSel.appendChild(o2);
    });
    fromSel.value = cat.def[0]; toSel.value = cat.def[1];

    var ioRow = el('div', 'conv-io', container);
    var inp = el('input', 'conv-input', ioRow); inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = '1';
    el('span', 'conv-eq', ioRow, '=');
    var outBox = el('div', 'conv-output', ioRow);

    function recalc() {
      var v = parseFloat(String(inp.value).replace(',', '.'));
      if (!isFinite(v)) { outBox.textContent = '—'; return; }
      outBox.textContent = fmtConv(convertLinear(catKey, v, fromSel.value, toSel.value));
    }
    inp.addEventListener('input', recalc);
    fromSel.addEventListener('change', recalc);
    toSel.addEventListener('change', recalc);
    swapBtn.addEventListener('click', function () { replay(swapBtn, 'mf-swap-spin');
      var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recalc();
    });
    recalc();
  }

  /* ---- температура: аффинная шкала, не сводится к простому множителю ---- */
  function toCelsius(v, unit) { return unit === 'C' ? v : unit === 'F' ? (v - 32) * 5 / 9 : v - 273.15; }
  function fromCelsius(c, unit) { return unit === 'C' ? c : unit === 'F' ? c * 9 / 5 + 32 : c + 273.15; }
  function buildTempUI(container) {
    var TEMPS = { C: 'Цельсий (°C)', F: 'Фаренгейт (°F)', K: 'Кельвин (K)' };
    var row = el('div', 'conv-row', container);
    var fromSel = el('select', 'conv-select', row);
    var swapBtn = el('button', 'conv-swap', row, '⇄'); swapBtn.type = 'button';
    var toSel = el('select', 'conv-select', row);
    Object.keys(TEMPS).forEach(function (k) {
      var o1 = document.createElement('option'); o1.value = k; o1.textContent = TEMPS[k]; fromSel.appendChild(o1);
      var o2 = document.createElement('option'); o2.value = k; o2.textContent = TEMPS[k]; toSel.appendChild(o2);
    });
    fromSel.value = 'C'; toSel.value = 'F';
    var ioRow = el('div', 'conv-io', container);
    var inp = el('input', 'conv-input', ioRow); inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = '0';
    el('span', 'conv-eq', ioRow, '=');
    var outBox = el('div', 'conv-output', ioRow);
    function recalc() {
      var v = parseFloat(String(inp.value).replace(',', '.'));
      if (!isFinite(v)) { outBox.textContent = '—'; return; }
      outBox.textContent = fmtConv(fromCelsius(toCelsius(v, fromSel.value), toSel.value));
    }
    inp.addEventListener('input', recalc);
    fromSel.addEventListener('change', recalc);
    toSel.addEventListener('change', recalc);
    swapBtn.addEventListener('click', function () { replay(swapBtn, 'mf-swap-spin'); var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recalc(); });
    recalc();
  }

  /* ---- валюта: живое обновление курсов с честным откатом на снимок ----
     Снимок приблизителен (конец июля 2026) и служит ТОЛЬКО запасным
     вариантом — на реальном сайте сначала пробуем получить текущие курсы
     с публичного API; при неудаче (нет сети/CORS) используем снимок и
     явно об этом пишем, с датой снимка. */
  var CURRENCY_SNAPSHOT = {
    date: '2026-07-31 (приблизительно)',
    // курс = сколько единиц валюты за 1 USD
    rates: {
      USD: 1, EUR: 0.8666, GBP: 0.7463, JPY: 159.7, CNY: 6.75, RUB: 79.7,
      CHF: 0.80, AUD: 1.4225, CAD: 1.399, INR: 95.67, TRY: 47.49,
      SGD: 1.2814, HKD: 7.8428, MXN: 17.34, KRW: 1350, BRL: 5.4
    }
  };
  var CURRENCY_LABELS = {
    USD: 'USD — доллар США', EUR: 'EUR — евро', GBP: 'GBP — фунт стерлингов',
    JPY: 'JPY — японская иена', CNY: 'CNY — китайский юань', RUB: 'RUB — российский рубль',
    CHF: 'CHF — швейцарский франк', AUD: 'AUD — австралийский доллар', CAD: 'CAD — канадский доллар',
    INR: 'INR — индийская рупия', TRY: 'TRY — турецкая лира', SGD: 'SGD — сингапурский доллар',
    HKD: 'HKD — гонконгский доллар', MXN: 'MXN — мексиканское песо', KRW: 'KRW — южнокорейская вона',
    BRL: 'BRL — бразильский реал'
  };
  var currencyState = { rates: CURRENCY_SNAPSHOT.rates, date: CURRENCY_SNAPSHOT.date, live: false, loading: false };

  function fetchLiveCurrency(onDone) {
    if (typeof fetch === 'undefined') { onDone(); return; }
    if (currencyState.loading) return;
    currencyState.loading = true;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);
    fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: ctrl && ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        clearTimeout(timer);
        currencyState.loading = false;
        if (data && data.rates) {
          var merged = {};
          Object.keys(CURRENCY_SNAPSHOT.rates).forEach(function (c) {
            merged[c] = data.rates[c] !== undefined ? data.rates[c] : CURRENCY_SNAPSHOT.rates[c];
          });
          currencyState = { rates: merged, date: data.date || 'сейчас', live: true, loading: false };
        }
        onDone();
      })
      .catch(function () {
        clearTimeout(timer);
        currencyState.loading = false;
        onDone();   // остаёмся на снимке — это не ошибка пользователя
      });
  }

  function buildCurrencyUI(container) {
    var statusEl = el('div', 'conv-status', container);
    var row = el('div', 'conv-row', container);
    var fromSel = el('select', 'conv-select', row);
    var swapBtn = el('button', 'conv-swap', row, '⇄'); swapBtn.type = 'button';
    var toSel = el('select', 'conv-select', row);
    function fillSelects() {
      fromSel.innerHTML = ''; toSel.innerHTML = '';
      Object.keys(currencyState.rates).forEach(function (k) {
        var lbl = CURRENCY_LABELS[k] || k;
        var o1 = document.createElement('option'); o1.value = k; o1.textContent = lbl; fromSel.appendChild(o1);
        var o2 = document.createElement('option'); o2.value = k; o2.textContent = lbl; toSel.appendChild(o2);
      });
      fromSel.value = 'USD'; toSel.value = 'RUB';
    }
    fillSelects();

    var ioRow = el('div', 'conv-io', container);
    var inp = el('input', 'conv-input', ioRow); inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = '100';
    el('span', 'conv-eq', ioRow, '=');
    var outBox = el('div', 'conv-output', ioRow);

    function recalc() {
      var v = parseFloat(String(inp.value).replace(',', '.'));
      if (!isFinite(v)) { outBox.textContent = '—'; return; }
      var r = currencyState.rates;
      outBox.textContent = fmtConv(v / r[fromSel.value] * r[toSel.value]);
    }
    function renderStatus() {
      statusEl.innerHTML = '';
      var dot = el('span', 'conv-status-dot' + (currencyState.live ? ' live' : ''), statusEl);
      el('span', null, statusEl, currencyState.live
        ? 'Курсы получены на сайте ЦБ/рынка · ' + currencyState.date
        : 'Приблизительный снимок · ' + currencyState.date + ' — курсы меняются, для важных расчётов сверьтесь с банком');
      var refreshBtn = el('button', 'mini conv-refresh', statusEl, currencyState.loading ? 'Обновляем…' : 'Обновить курсы');
      refreshBtn.type = 'button';
      refreshBtn.disabled = currencyState.loading;
      refreshBtn.addEventListener('click', function () {
        renderStatus();
        fetchLiveCurrency(function () { fillSelects(); recalc(); renderStatus(); });
      });
    }

    inp.addEventListener('input', recalc);
    fromSel.addEventListener('change', recalc);
    toSel.addEventListener('change', recalc);
    swapBtn.addEventListener('click', function () { replay(swapBtn, 'mf-swap-spin'); var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; recalc(); });

    renderStatus();
    recalc();
    // при первом открытии сами пробуем обновить курсы один раз (тихо, без спама запросами)
    if (!currencyState.live && !currencyState._triedOnce) {
      currencyState._triedOnce = true;
      fetchLiveCurrency(function () { fillSelects(); recalc(); renderStatus(); });
    }
  }

  /* ---- системы счисления ---- */
  function buildBaseUI(container) {
    var g = el('div', 'grid2', container);
    function mk(txt, val) {
      var l = el('label', 'f', g); el('span', null, l, txt);
      var i = el('input', null, l); i.type = 'text'; i.value = val || '';
      i.addEventListener('input', conv);
      return i;
    }
    var iVal = mk('число', '255');
    var iFrom = mk('из основания', '10');
    var iTo = mk('в основание', '16');
    var out = el('div', 'out', container);
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

  /* ---- дата: разница между датами + добавление/вычитание дней ---- */
  function daysBetween(d1, d2) {
    var a = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    var b = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.round((b - a) / 86400000);
  }
  function buildDateUI(container) {
    var box1 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box1, 'Разница между датами');
    var g1 = el('div', 'grid2', box1);
    var l1 = el('label', 'f', g1); el('span', null, l1, 'от'); var d1 = el('input', null, l1); d1.type = 'date';
    var l2 = el('label', 'f', g1); el('span', null, l2, 'до'); var d2 = el('input', null, l2); d2.type = 'date';
    var out1 = el('div', 'out', box1);
    var today = new Date();
    d1.valueAsDate = today;
    d2.valueAsDate = new Date(today.getTime() + 30 * 86400000);
    function recalc1() {
      out1.innerHTML = '';
      if (!d1.valueAsDate || !d2.valueAsDate) return;
      var n = daysBetween(d1.valueAsDate, d2.valueAsDate);
      el('div', 'big', out1, Math.abs(n) + ' дн.' + (n < 0 ? ' (в прошлом)' : ''));
      var dl = el('dl', 'kv', out1);
      el('dt', null, dl, 'недель'); el('dd', null, dl, (n / 7).toFixed(1));
      el('dt', null, dl, 'месяцев (≈)'); el('dd', null, dl, (n / 30.4369).toFixed(1));
      el('dt', null, dl, 'лет (≈)'); el('dd', null, dl, (n / 365.25).toFixed(2));
    }
    d1.addEventListener('input', recalc1); d2.addEventListener('input', recalc1);
    recalc1();

    var box2 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box2, 'Прибавить / вычесть дни');
    var g2 = el('div', 'grid2', box2);
    var l3 = el('label', 'f', g2); el('span', null, l3, 'дата'); var d3 = el('input', null, l3); d3.type = 'date'; d3.valueAsDate = today;
    var l4 = el('label', 'f', g2); el('span', null, l4, 'дней (можно отрицательно)'); var iN = el('input', null, l4); iN.type = 'text'; iN.inputMode = 'numeric'; iN.value = '30';
    var out2 = el('div', 'out', box2);
    function recalc2() {
      out2.innerHTML = '';
      var n = parseInt(iN.value, 10);
      if (!d3.valueAsDate || isNaN(n)) return;
      var res = new Date(d3.valueAsDate.getTime());
      res.setDate(res.getDate() + n);
      var WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
      el('div', 'big', out2, res.toLocaleDateString('ru-RU') + ' (' + WD[res.getDay()] + ')');
    }
    d3.addEventListener('input', recalc2); iN.addEventListener('input', recalc2);
    recalc2();
  }

  /* ---- скидка ---- */
  function buildDiscountUI(container) {
    var g = el('div', 'grid2', container);
    var l1 = el('label', 'f', g); el('span', null, l1, 'исходная цена'); var iP = el('input', null, l1); iP.type = 'text'; iP.inputMode = 'decimal'; iP.value = '1000';
    var l2 = el('label', 'f', g); el('span', null, l2, 'скидка, %'); var iD = el('input', null, l2); iD.type = 'text'; iD.inputMode = 'decimal'; iD.value = '20';
    var out = el('div', 'out', container);
    function recalc() {
      out.innerHTML = '';
      var price = parseFloat(String(iP.value).replace(',', '.'));
      var pct = parseFloat(String(iD.value).replace(',', '.'));
      if (!isFinite(price) || !isFinite(pct)) return;
      var final = price * (1 - pct / 100);
      el('div', 'big', out, fmtConv(final));
      var dl = el('dl', 'kv', out);
      el('dt', null, dl, 'вы экономите'); el('dd', null, dl, fmtConv(price - final));
    }
    iP.addEventListener('input', recalc); iD.addEventListener('input', recalc);
    recalc();
  }

  /* ---- финансы: НДС + проценты ---- */
  function buildFinanceUI(container) {
    var box1 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box1, 'НДС');
    var g1 = el('div', 'grid2', box1);
    var l1 = el('label', 'f', g1); el('span', null, l1, 'сумма без НДС'); var iNet = el('input', null, l1); iNet.type = 'text'; iNet.inputMode = 'decimal'; iNet.value = '1000';
    var l2 = el('label', 'f', g1); el('span', null, l2, 'ставка НДС, %'); var iRate = el('input', null, l2); iRate.type = 'text'; iRate.inputMode = 'decimal'; iRate.value = '20';
    var out1 = el('div', 'out', box1);
    function recalc1() {
      out1.innerHTML = '';
      var net = parseFloat(String(iNet.value).replace(',', '.')), rate = parseFloat(String(iRate.value).replace(',', '.'));
      if (!isFinite(net) || !isFinite(rate)) return;
      var vat = net * rate / 100;
      el('div', 'big', out1, fmtConv(net + vat) + ' с НДС');
      var dl = el('dl', 'kv', out1);
      el('dt', null, dl, 'сумма НДС'); el('dd', null, dl, fmtConv(vat));
      el('dt', null, dl, 'без НДС'); el('dd', null, dl, fmtConv(net));
    }
    iNet.addEventListener('input', recalc1); iRate.addEventListener('input', recalc1);
    recalc1();

    var box2 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box2, 'Проценты по вкладу/кредиту');
    var g2 = el('div', 'grid2', box2);
    var l3 = el('label', 'f', g2); el('span', null, l3, 'сумма'); var iP = el('input', null, l3); iP.type = 'text'; iP.inputMode = 'decimal'; iP.value = '100000';
    var l4 = el('label', 'f', g2); el('span', null, l4, 'ставка, % годовых'); var iR = el('input', null, l4); iR.type = 'text'; iR.inputMode = 'decimal'; iR.value = '10';
    var l5 = el('label', 'f', g2); el('span', null, l5, 'срок, лет'); var iY = el('input', null, l5); iY.type = 'text'; iY.inputMode = 'decimal'; iY.value = '2';
    var l6 = el('label', 'f', g2); el('span', null, l6, 'капитализация раз/год'); var iN = el('input', null, l6); iN.type = 'text'; iN.inputMode = 'numeric'; iN.value = '1';
    var out2 = el('div', 'out', box2);
    function recalc2() {
      out2.innerHTML = '';
      var p = parseFloat(String(iP.value).replace(',', '.')), r = parseFloat(String(iR.value).replace(',', '.'));
      var y = parseFloat(String(iY.value).replace(',', '.')), n = parseInt(iN.value, 10) || 1;
      if (!isFinite(p) || !isFinite(r) || !isFinite(y)) return;
      var simple = p * r / 100 * y;
      var compound = p * Math.pow(1 + (r / 100) / n, n * y) - p;
      var dl = el('dl', 'kv', out2);
      el('dt', null, dl, 'простые проценты'); el('dd', null, dl, '+' + fmtConv(simple));
      el('dt', null, dl, 'сложные проценты'); el('dd', null, dl, '+' + fmtConv(compound));
      el('dt', null, dl, 'итого (сложные)'); el('dd', null, dl, fmtConv(p + compound));
    }
    [iP, iR, iY, iN].forEach(function (i) { i.addEventListener('input', recalc2); });
    recalc2();

    var box3 = el('div', 'conv-block', container);
    el('div', 'conv-block-h', box3, 'Чаевые и счёт на компанию');
    var g3 = el('div', 'grid2', box3);
    var l7 = el('label', 'f', g3); el('span', null, l7, 'счёт'); var iBill = el('input', null, l7); iBill.type = 'text'; iBill.inputMode = 'decimal'; iBill.value = '2000';
    var l8 = el('label', 'f', g3); el('span', null, l8, 'чаевые, %'); var iTip = el('input', null, l8); iTip.type = 'text'; iTip.inputMode = 'decimal'; iTip.value = '10';
    var l9 = el('label', 'f', g3); el('span', null, l9, 'человек'); var iPpl = el('input', null, l9); iPpl.type = 'text'; iPpl.inputMode = 'numeric'; iPpl.value = '1';
    var out3 = el('div', 'out', box3);
    function recalc3() {
      out3.innerHTML = '';
      var bill = parseFloat(String(iBill.value).replace(',', '.')), tip = parseFloat(String(iTip.value).replace(',', '.'));
      var ppl = parseInt(iPpl.value, 10) || 1;
      if (!isFinite(bill) || !isFinite(tip)) return;
      var tipSum = bill * tip / 100, total = bill + tipSum;
      el('div', 'big', out3, fmtConv(total));
      var dl = el('dl', 'kv', out3);
      el('dt', null, dl, 'чаевые'); el('dd', null, dl, fmtConv(tipSum));
      if (ppl > 1) { el('dt', null, dl, 'с человека'); el('dd', null, dl, fmtConv(total / ppl)); }
    }
    [iBill, iTip, iPpl].forEach(function (i) { i.addEventListener('input', recalc3); });
    recalc3();
  }

  var CONV_TABS = [
    { id: 'length', label: 'Длина', build: function (c) { buildLinearCategoryUI(c, 'length'); } },
    { id: 'mass', label: 'Масса', build: function (c) { buildLinearCategoryUI(c, 'mass'); } },
    { id: 'area', label: 'Площадь', build: function (c) { buildLinearCategoryUI(c, 'area'); } },
    { id: 'volume', label: 'Объём', build: function (c) { buildLinearCategoryUI(c, 'volume'); } },
    { id: 'temp', label: 'Температура', build: buildTempUI },
    { id: 'time', label: 'Время', build: function (c) { buildLinearCategoryUI(c, 'time'); } },
    { id: 'speed', label: 'Скорость', build: function (c) { buildLinearCategoryUI(c, 'speed'); } },
    { id: 'data', label: 'Данные', build: function (c) { buildLinearCategoryUI(c, 'data'); } },
    { id: 'energy', label: 'Энергия', build: function (c) { buildLinearCategoryUI(c, 'energy'); } },
    { id: 'currency', label: 'Валюта', build: buildCurrencyUI },
    { id: 'base', label: 'Системы счисления', build: buildBaseUI },
    { id: 'date', label: 'Дата', build: buildDateUI },
    { id: 'discount', label: 'Скидка', build: buildDiscountUI },
    { id: 'finance', label: 'Финансы', build: buildFinanceUI }
  ];

  var svcConverter = {
    id: 'conv', glyph: '⇄', title: 'Конвертор',
    sub: 'Единицы, валюта, дата, финансы',
    mount: function (host) {
      var p = panel(host, 'Конвертор');
      var chipRow = el('div', 'conv-chips', p);
      var body = el('div', 'conv-body', p);
      var activeTab = 'length';

      function renderTab() {
        chipRow.querySelectorAll('.conv-chip').forEach(function (b) {
          b.classList.toggle('on', b.dataset.id === activeTab);
        });
        body.innerHTML = '';
        var tab = CONV_TABS.filter(function (t) { return t.id === activeTab; })[0];
        if (tab) tab.build(body);
      }
      CONV_TABS.forEach(function (t) {
        var b = el('button', 'conv-chip', chipRow, t.label);
        b.type = 'button';
        b.dataset.id = t.id;
        b.addEventListener('click', function () { activeTab = t.id; renderTab(); });
      });
      renderTab();
    }
  };

  /* ======================================================================
     «ЕЩЁ» — 35+ специализированных инструментов
     Двухуровневая навигация: категория (10 штук) -> конкретный инструмент
     внутри неё. Расчитано на пользователя, который уже знает, что ищет —
     поэтому меньше подсказок и более компактная вёрстка, чем в пяти
     основных калькуляторах.
     ====================================================================== */
  function moreField(container, label, val) { return geoField(container, label, val); }
  function moreNum(input) { return geoNum(input); }
  function moreResults(container, pairs) { return geoResults(container, pairs); }
  function moreFmt(v) { return fmtGeo(v); }

  /* Компилятор GMS — тяжёлый файл (полтора мегабайта), поэтому грузится лениво,
     только когда реально понадобится (первое открытие инструмента, который его
     использует), и один раз кешируется для повторных вызовов. */
  var gmsCompilerPromise = null;
  function loadGmsCompiler() {
    if (!gmsCompilerPromise) gmsCompilerPromise = import('/assets/js/gms-compiler.js');
    return gmsCompilerPromise;
  }

  /* ---------------------------------------------------- 1. Математический анализ */
  function buildLimitUI(c) {
    var g = el('div', 'grid2', c);
    var mf = makeField(g, { initial: '(x^2-1)/(x-1)', onChange: calc });
    var iA = moreField(g, 'x →', '1');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var a = moreNum(iA); if (a === null) return;
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var comp = MFMath.compile(lin, 'x'); if (!comp) return;
      var lim = (function () {
        var h0 = 0.1, steps = 6;
        function side(sign) { var v, h = h0; for (var i = 0; i < steps; i++) { v = comp.at(a + sign * h); h /= 10; } return v; }
        var L = side(-1), R = side(1);
        var exists = isFinite(L) && isFinite(R) && Math.abs(L - R) < 1e-4 * Math.max(1, Math.abs(L));
        return { left: L, right: R, exists: exists, value: exists ? (L + R) / 2 : null };
      })();
      if (lim.exists) moreResults(out, [['предел', lim.value]]);
      else { out.innerHTML=''; el('div','err',out,'предел не существует (слева ' + moreFmt(lim.left) + ', справа ' + moreFmt(lim.right) + ')'); }
    }
    calc();
  }
  function buildNthDerivUI(c) {
    var g = el('div', 'grid2', c);
    var mf = makeField(g, { initial: 'x^4', onChange: calc });
    var iN = moreField(g, 'порядок производной', '2');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var n = Math.round(moreNum(iN)); if (!n || n < 1 || n > 8) return;
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var ast; try { ast = MFMath.parse(lin); } catch (e) { return; }
      var vars = MFMath.varsIn(ast).filter(function(v){ return MFMath.CONSTS[v]===undefined; });
      var v = vars[0] || 'x';
      var cur = ast;
      for (var i = 0; i < n; i++) { var next = MFMath.d(cur, v); if (!next) { el('div','err',out,'не удалось продифференцировать'); return; } cur = MFMath.simplify(next); }
      el('div', 'big', out).innerHTML = texToHtml(MFMath.tex(cur));
    }
    calc();
  }
  function buildIntegralUI(c) {
    var g = el('div', 'grid2', c);
    var mf = makeField(g, { initial: 'x^2', onChange: calc });
    var iA = moreField(g, 'от', '0'), iB = moreField(g, 'до', '1');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var a = moreNum(iA), b = moreNum(iB); if (a===null||b===null) return;
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var comp = MFMath.compile(lin, 'x'); if (!comp) return;
      var val = MFMath.integrate(function (x) { return comp.at(x); }, a, b);
      moreResults(out, [['интеграл (численно, Симпсон)', val]]);
    }
    calc();
  }
  function buildSeriesUI(c) {
    var g = el('div', 'grid2', c);
    var mf = makeField(g, { initial: '1/n^2', onChange: calc });
    var iFrom = moreField(g, 'от n =', '1');
    var iTo = moreField(g, 'до n = (inf — для ∞)', 'inf');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var from = Math.round(moreNum(iFrom)); if (from === null) return;
      var toRaw = String(iTo.value).trim().toLowerCase();
      var to = (toRaw === 'inf' || toRaw === '∞') ? Infinity : Math.round(parseFloat(toRaw));
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var comp = MFMath.compile(lin, 'n'); if (!comp) return;
      var maxIter = 200000, sum = 0, n = from, count = 0, converged = false;
      var infinite = to === Infinity;
      while (infinite ? count < maxIter : n <= to) {
        var v = comp.at(n);
        if (!isFinite(v)) { el('div','err',out,'ряд расходится'); return; }
        sum += v;
        if (infinite && Math.abs(v) < 1e-13 && count > 10) { converged = true; count++; break; }
        n++; count++;
      }
      moreResults(out, [['сумма (≈' + count + ' членов)', sum]]);
      if (infinite && !converged) el('div', 'sub', out, 'похоже, ряд сходится медленно или расходится — результат приближённый');
    }
    calc();
  }
  function buildTaylorUI(c) {
    var g = el('div', 'grid2', c);
    var mf = makeField(g, { initial: 'sin(x)', onChange: calc });
    var iX0 = moreField(g, 'в точке x₀ =', '0'), iN = moreField(g, 'степень N', '5');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var x0 = moreNum(iX0), N = Math.round(moreNum(iN)); if (x0===null || !N || N<0 || N>12) return;
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var ast; try { ast = MFMath.parse(lin); } catch (e) { return; }
      var coeffs = [], cur = ast, fact = 1;
      for (var k = 0; k <= N; k++) {
        var val; try { val = MFMath.evalAst(cur, { x: x0 }); } catch (e) { val = NaN; }
        coeffs.push(val / fact);
        var next = MFMath.d(cur, 'x'); if (!next) break;
        cur = MFMath.simplify(next); fact *= (k + 1);
      }
      var terms = coeffs.map(function (co, i) {
        if (Math.abs(co) < 1e-12) return null;
        var xpart = i === 0 ? '' : (x0 === 0 ? 'x' : '(x-' + x0 + ')') + (i > 1 ? '^{' + i + '}' : '');
        return moreFmt(co) + (xpart ? '\\cdot ' + xpart : '');
      }).filter(Boolean).join(' + ');
      el('div', 'big', out).innerHTML = texToHtml(terms || '0');
      el('div', 'sub', out, 'многочлен Тейлора степени ' + N + ' в окрестности x₀=' + x0);
    }
    calc();
  }

  /* ---------------------------------------------------- 2. Линейная алгебра */
  function matrixInputGrid(container, rows, cols, prefix) {
    var wrap = el('div', 'matrix-grid', container);
    wrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    var inputs = [];
    for (var i = 0; i < rows; i++) {
      inputs.push([]);
      for (var j = 0; j < cols; j++) {
        var inp = document.createElement('input');
        inp.type = 'text'; inp.inputMode = 'decimal'; inp.className = 'matrix-cell';
        inp.value = (i === j) ? '1' : '0';
        wrap.appendChild(inp);
        inputs[i].push(inp);
      }
    }
    return inputs;
  }
  function readMatrix(inputs) {
    return inputs.map(function (row) { return row.map(function (i) { var v = moreNum(i); return v === null ? 0 : v; }); });
  }
  function matDetGeneric(A) {
    var n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0]*A[1][1]-A[0][1]*A[1][0];
    var det = 0;
    for (var j = 0; j < n; j++) {
      var minor = A.slice(1).map(function(row){ return row.filter(function(_,k){ return k!==j; }); });
      det += (j%2===0?1:-1)*A[0][j]*matDetGeneric(minor);
    }
    return det;
  }
  function matInverseGeneric(A) {
    var n = A.length, det = matDetGeneric(A);
    if (Math.abs(det) < 1e-12) return null;
    var M = A.map(function(row,i){ return row.concat(row.map(function(_,j){ return i===j?1:0; })); });
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (var i = col+1; i < n; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i;
      var tmp = M[piv]; M[piv]=M[col]; M[col]=tmp;
      var pv = M[col][col];
      M[col] = M[col].map(function(x){ return x/pv; });
      for (var r = 0; r < n; r++) { if (r===col) continue; var f=M[r][col]; M[r]=M[r].map(function(x,j){ return x-f*M[col][j]; }); }
    }
    return M.map(function(row){ return row.slice(n); });
  }
  function renderMatrix(container, M) {
    var wrap = el('div', 'matrix-grid matrix-out', container);
    wrap.style.gridTemplateColumns = 'repeat(' + M[0].length + ', 1fr)';
    M.forEach(function (row) { row.forEach(function (v) { el('div', 'matrix-out-cell', wrap, moreFmt(v)); }); });
  }
  function buildMatrixOpsUI(c) {
    var sizeRow = el('div', 'row', c);
    var iSize = document.createElement('select'); iSize.className = 'conv-select';
    [2,3,4].forEach(function (n) { var o=document.createElement('option'); o.value=n; o.textContent=n+'×'+n; iSize.appendChild(o); });
    sizeRow.appendChild(iSize);
    var opSel = document.createElement('select'); opSel.className = 'conv-select';
    [['add','A + B'],['sub','A − B'],['mul','A × B'],['detA','det(A)'],['invA','A⁻¹'],['trA','Aᵀ']].forEach(function(o){
      var op=document.createElement('option'); op.value=o[0]; op.textContent=o[1]; opSel.appendChild(op);
    });
    sizeRow.appendChild(opSel);
    var gridsWrap = el('div', 'row', c);
    var boxA = el('div', null, gridsWrap); el('div','conv-block-h',boxA,'Матрица A');
    var boxB = el('div', null, gridsWrap); el('div','conv-block-h',boxB,'Матрица B');
    var out = el('div', 'out', c);
    var Ainputs, Binputs;
    function rebuild() {
      var n = parseInt(iSize.value, 10);
      boxA.querySelectorAll('.matrix-grid').forEach(function(x){x.remove();});
      boxB.querySelectorAll('.matrix-grid').forEach(function(x){x.remove();});
      Ainputs = matrixInputGrid(boxA, n, n);
      Binputs = matrixInputGrid(boxB, n, n);
      [].concat.apply([], Ainputs).concat.apply([], Binputs);
      Ainputs.forEach(function(r){r.forEach(function(i){i.addEventListener('input',calc);});});
      Binputs.forEach(function(r){r.forEach(function(i){i.addEventListener('input',calc);});});
      boxB.style.display = (opSel.value==='detA'||opSel.value==='invA'||opSel.value==='trA') ? 'none' : '';
      calc();
    }
    function calc() {
      out.innerHTML = '';
      var A = readMatrix(Ainputs), B = readMatrix(Binputs);
      var op = opSel.value;
      if (op === 'add') renderMatrix(out, A.map(function(row,i){return row.map(function(v,j){return v+B[i][j];});}));
      else if (op === 'sub') renderMatrix(out, A.map(function(row,i){return row.map(function(v,j){return v-B[i][j];});}));
      else if (op === 'mul') {
        var n=A.length, R=Array.from({length:n},function(){return new Array(n).fill(0);});
        for (var i=0;i<n;i++) for (var j=0;j<n;j++) { var s=0; for (var t=0;t<n;t++) s+=A[i][t]*B[t][j]; R[i][j]=s; }
        renderMatrix(out, R);
      }
      else if (op === 'detA') el('div','big',out, moreFmt(matDetGeneric(A)));
      else if (op === 'invA') { var inv = matInverseGeneric(A); if (!inv) el('div','err',out,'матрица вырождена (det=0), обратной не существует'); else renderMatrix(out, inv); }
      else if (op === 'trA') renderMatrix(out, A[0].map(function(_,j){ return A.map(function(row){return row[j];}); }));
    }
    iSize.addEventListener('change', rebuild);
    opSel.addEventListener('change', rebuild);
    rebuild();
  }
  function buildEigenUI(c) {
    var g = el('div', null, c);
    var inputs = matrixInputGrid(g, 2, 2);
    inputs[0][0].value='2'; inputs[0][1].value='0'; inputs[1][0].value='0'; inputs[1][1].value='3';
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML = '';
      var A = readMatrix(inputs);
      var tr = A[0][0]+A[1][1], det = A[0][0]*A[1][1]-A[0][1]*A[1][0];
      var D = tr*tr-4*det;
      if (D < 0) { el('div','err',out,'нет действительных собственных значений (D=' + moreFmt(D) + ' < 0)'); return; }
      var s = Math.sqrt(D);
      moreResults(out, [['λ₁', (tr+s)/2], ['λ₂', (tr-s)/2], ['след', tr], ['det', det]]);
    }
    inputs.forEach(function(r){r.forEach(function(i){i.addEventListener('input',calc);});});
    calc();
  }

  /* ---------------------------------------------------- 3. Теория чисел */
  function buildGcdLcmUI(c) {
    var g = el('div', 'grid2', c);
    var iA = moreField(g, 'a', '48'), iB = moreField(g, 'b', '18');
    var out = el('div', 'out', c);
    function gcdF(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=a%b; a=b; b=t; } return a; }
    function calc() { out.innerHTML=''; var a=Math.round(moreNum(iA)), b=Math.round(moreNum(iB)); if(!a||!b) return;
      var g2 = gcdF(a,b); moreResults(out, [['НОД', g2], ['НОК', Math.abs(a*b)/g2]]); }
    [iA,iB].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildFactorizeUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число', '360');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var n=Math.round(moreNum(iN)); if(!n) return;
      var orig=n, factors=[], d=2;
      while (d*d<=n) { while(n%d===0){factors.push(d);n/=d;} d++; }
      if (n>1) factors.push(n);
      el('div','big',out, orig + ' = ' + factors.join(' × '));
      var counts={}; factors.forEach(function(f){counts[f]=(counts[f]||0)+1;});
      el('div','sub',out, Object.keys(counts).map(function(k){return counts[k]>1?k+'^'+counts[k]:k;}).join(' · '));
    }
    iN.addEventListener('input', calc); calc();
  }
  function buildPrimeUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число N (проверка) или предел (список)', '997');
    var out = el('div', 'out', c);
    function isPrimeF(n){ n=Math.round(n); if(n<2) return false; if(n<4) return true; if(n%2===0) return false; for(var i=3;i*i<=n;i+=2) if(n%i===0) return false; return true; }
    function calc() {
      out.innerHTML=''; var n=Math.round(moreNum(iN)); if(!n) return;
      el('div','big',out, n + (isPrimeF(n) ? ' — простое' : ' — составное'));
      if (n <= 1000) {
        var primes=[]; for (var i=2;i<=n;i++) if(isPrimeF(i)) primes.push(i);
        el('div','sub',out, 'простых до ' + n + ': ' + primes.length + (primes.length<=30 ? ' → ' + primes.join(', ') : ''));
      }
    }
    iN.addEventListener('input', calc); calc();
  }
  function buildModArithUI(c) {
    var g = el('div', 'grid2', c);
    var iA = moreField(g, 'a', '7'), iB = moreField(g, 'b (степень)', '128'), iM = moreField(g, 'mod m', '13');
    var out = el('div', 'out', c);
    function modPowF(base,exp,mod){ base=((base%mod)+mod)%mod; var r=1; while(exp>0){ if(exp&1) r=(r*base)%mod; exp=Math.floor(exp/2); base=(base*base)%mod; } return r; }
    function extGCD(a,b){ if(b===0) return [a,1,0]; var r=extGCD(b,a%b); return [r[0], r[2], r[1]-Math.floor(a/b)*r[2]]; }
    function calc() {
      out.innerHTML=''; var a=Math.round(moreNum(iA)), b=Math.round(moreNum(iB)), m=Math.round(moreNum(iM)); if(!a||!m||b===null) return;
      var res = [['a mod m', ((a%m)+m)%m], ['a^b mod m', modPowF(a,b,m)]];
      var g2 = extGCD(((a%m)+m)%m, m);
      if (g2[0]===1) res.push(['a⁻¹ mod m', ((g2[1]%m)+m)%m]);
      else res.push(['a⁻¹ mod m', 'не существует (не взаимно просты)']);
      moreResults(out, res);
    }
    [iA,iB,iM].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildCrtUI(c) {
    var g = el('div', null, c);
    el('div', 'sub', g, 'x ≡ r₁ (mod m₁), x ≡ r₂ (mod m₂), x ≡ r₃ (mod m₃) — модули должны быть попарно взаимно просты');
    var g2 = el('div', 'grid2', g);
    var r1=moreField(g2,'r₁','2'), m1=moreField(g2,'m₁','3');
    var r2=moreField(g2,'r₂','3'), m2=moreField(g2,'m₂','5');
    var r3=moreField(g2,'r₃ (можно 0, если не нужно)','2'), m3=moreField(g2,'m₃ (можно 1)','7');
    var out = el('div', 'out', c);
    function extGCD(a,b){ if(b===0) return [a,1,0]; var r=extGCD(b,a%b); return [r[0], r[2], r[1]-Math.floor(a/b)*r[2]]; }
    function modInv(a,m){ var r=extGCD(((a%m)+m)%m,m); return r[0]!==1 ? null : ((r[1]%m)+m)%m; }
    function calc() {
      out.innerHTML='';
      var rs=[moreNum(r1),moreNum(r2),moreNum(r3)].map(Math.round), ms=[moreNum(m1),moreNum(m2),moreNum(m3)].map(Math.round);
      if (rs.some(function(v){return v===null;}) || ms.some(function(v){return !v;})) return;
      var M2 = ms.reduce(function(a,b){return a*b;},1);
      var x = 0;
      for (var i=0;i<ms.length;i++) {
        var Mi = M2/ms[i], inv = modInv(Mi, ms[i]);
        if (inv===null) { el('div','err',out,'модули не взаимно просты — решения по CRT нет'); return; }
        x += rs[i]*Mi*inv;
      }
      el('div','big',out, 'x ≡ ' + (((x%M2)+M2)%M2) + ' (mod ' + M2 + ')');
    }
    [r1,m1,r2,m2,r3,m3].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }

  /* ---------------------------------------------------- 4. Комбинаторика/вероятность */
  function factorialF(n){ var r=1; for(var i=2;i<=n;i++) r*=i; return r; }
  function buildCombinUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'n', '10'), iK = moreField(g, 'k', '3');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var n=Math.round(moreNum(iN)), k=Math.round(moreNum(iK)); if(n===null||k===null||k>n||n>170) return;
      moreResults(out, [['P(n) — перестановки n', factorialF(n)], ['A(n,k) — размещения', factorialF(n)/factorialF(n-k)], ['C(n,k) — сочетания', factorialF(n)/(factorialF(k)*factorialF(n-k))]]);
    }
    [iN,iK].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildBinomProbUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'испытаний n', '10'), iK = moreField(g, 'успехов k', '5'), iP = moreField(g, 'p успеха', '0.5');
    var out = el('div', 'out', c);
    function C(n,k){ return factorialF(n)/(factorialF(k)*factorialF(n-k)); }
    function calc() {
      out.innerHTML=''; var n=Math.round(moreNum(iN)), k=Math.round(moreNum(iK)), p=moreNum(iP); if(n===null||k===null||p===null||n>170) return;
      moreResults(out, [['P(X=k)', C(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k)]]);
    }
    [iN,iK,iP].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildBayesUI(c) {
    var g = el('div', 'grid2', c);
    var iPA = moreField(g, 'P(A) — априорная', '0.01');
    var iPBA = moreField(g, 'P(B|A)', '0.9');
    var iPBnA = moreField(g, 'P(B|¬A)', '0.05');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var pA=moreNum(iPA), pBA=moreNum(iPBA), pBnA=moreNum(iPBnA); if([pA,pBA,pBnA].some(function(v){return v===null;})) return;
      var pB = pBA*pA + pBnA*(1-pA);
      if (pB===0) return;
      moreResults(out, [['P(A|B)', pBA*pA/pB], ['P(B) — полная вероятность', pB]]);
    }
    [iPA,iPBA,iPBnA].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }

  /* ---------------------------------------------------- 5. Статистика */
  function parseNumList(str) { return str.split(/[,;\s]+/).map(function(s){return parseFloat(s.replace(',','.'));}).filter(function(v){return isFinite(v);}); }
  function buildDescStatsUI(c) {
    var g = el('div', null, c);
    var iData = document.createElement('textarea'); iData.className = 'more-textarea';
    iData.value = '2, 4, 4, 4, 5, 5, 7, 9'; iData.rows = 2;
    g.appendChild(iData);
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var arr = parseNumList(iData.value); if (arr.length < 2) return;
      var m = arr.reduce(function(a,b){return a+b;},0)/arr.length;
      var sorted = arr.slice().sort(function(a,b){return a-b;});
      var med = sorted.length%2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
      var variance = arr.reduce(function(a,b){return a+(b-m)*(b-m);},0)/arr.length;
      moreResults(out, [['n', arr.length], ['среднее', m], ['медиана', med], ['мин', Math.min.apply(null,arr)], ['макс', Math.max.apply(null,arr)],
        ['дисперсия (ген.)', variance], ['стандартное откл. (ген.)', Math.sqrt(variance)]]);
    }
    iData.addEventListener('input', calc); calc();
  }
  function buildRegressionUI(c) {
    var g = el('div', null, c);
    var iX = document.createElement('textarea'); iX.className='more-textarea'; iX.rows=2; iX.value='1,2,3,4,5'; el('div','conv-block-h',g,'x'); g.appendChild(iX);
    var iY = document.createElement('textarea'); iY.className='more-textarea'; iY.rows=2; iY.value='2.1,3.9,6.2,7.8,10.1'; el('div','conv-block-h',g,'y'); g.appendChild(iY);
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var xs=parseNumList(iX.value), ys=parseNumList(iY.value);
      if (xs.length<2 || xs.length!==ys.length) { el('div','err',out,'нужно поровну значений x и y (минимум 2)'); return; }
      var n=xs.length, mx=xs.reduce(function(a,b){return a+b;},0)/n, my=ys.reduce(function(a,b){return a+b;},0)/n;
      var sxy=0, sxx=0, syy=0;
      for (var i=0;i<n;i++) { sxy+=(xs[i]-mx)*(ys[i]-my); sxx+=(xs[i]-mx)*(xs[i]-mx); syy+=(ys[i]-my)*(ys[i]-my); }
      var b = sxy/sxx, a = my-b*mx, r = sxy/Math.sqrt(sxx*syy);
      el('div','big',out).innerHTML = 'y = ' + moreFmt(a) + ' + ' + moreFmt(b) + 'x';
      el('div','sub',out, 'r = ' + moreFmt(r) + '  (r² = ' + moreFmt(r*r) + ')');
    }
    [iX,iY].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildNormalDistUI(c) {
    var g = el('div', 'grid2', c);
    var iMu = moreField(g,'среднее μ','0'), iSigma = moreField(g,'σ','1'), iX = moreField(g,'x','1.96');
    var out = el('div', 'out', c);
    function erf(x){ var sign=x<0?-1:1; x=Math.abs(x); var a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
      var t=1/(1+p*x); var y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x); return sign*y; }
    function calc() {
      out.innerHTML=''; var mu=moreNum(iMu), sigma=moreNum(iSigma), x=moreNum(iX); if([mu,sigma,x].some(function(v){return v===null;})||sigma<=0) return;
      var z = (x-mu)/sigma;
      var cdf = 0.5*(1+erf(z/Math.SQRT2));
      moreResults(out, [['z-оценка', z], ['P(X ≤ x)', cdf], ['P(X > x)', 1-cdf]]);
    }
    [iMu,iSigma,iX].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }

  /* ---------------------------------------------------- 7. Последовательности */
  function buildArithSeqUI(c) {
    var g = el('div', 'grid2', c);
    var iA1=moreField(g,'a₁','2'), iD=moreField(g,'d (разность)','3'), iN=moreField(g,'n','10');
    var out = el('div', 'out', c);
    function calc() { out.innerHTML=''; var a1=moreNum(iA1),d=moreNum(iD),n=Math.round(moreNum(iN)); if([a1,d].some(function(v){return v===null;})||!n) return;
      moreResults(out, [['aₙ', a1+(n-1)*d], ['сумма первых n', n/2*(2*a1+(n-1)*d)]]); }
    [iA1,iD,iN].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildGeomSeqUI(c) {
    var g = el('div', 'grid2', c);
    var iA1=moreField(g,'a₁','1'), iQ=moreField(g,'q (знаменатель)','0.5'), iN=moreField(g,'n','10');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var a1=moreNum(iA1),q=moreNum(iQ),n=Math.round(moreNum(iN)); if([a1,q].some(function(v){return v===null;})||!n) return;
      var res = [['aₙ', a1*Math.pow(q,n-1)], ['сумма первых n', Math.abs(q-1)<1e-12 ? a1*n : a1*(1-Math.pow(q,n))/(1-q)]];
      if (Math.abs(q) < 1) res.push(['сумма при n→∞', a1/(1-q)]);
      moreResults(out, res);
    }
    [iA1,iQ,iN].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }
  function buildFibUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'n (индекс, F₀=0, F₁=1)', '10');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var n=Math.round(moreNum(iN)); if(n===null||n<0||n>1000) return;
      var a=0,b=1; for (var i=0;i<n;i++){ var t=a+b; a=b; b=t; }
      el('div','big',out, 'F' + n + ' = ' + (n>75 ? a.toExponential(6) : a));
    }
    iN.addEventListener('input', calc); calc();
  }

  /* ---------------------------------------------------- 8. Тригонометрия */
  function buildTrigEqUI(c) {
    var g = el('div', 'grid2', c);
    var fnSel = document.createElement('select'); fnSel.className='conv-select';
    [['sin','sin x = a'],['cos','cos x = a'],['tan','tan x = a']].forEach(function(o){ var op=document.createElement('option'); op.value=o[0]; op.textContent=o[1]; fnSel.appendChild(op); });
    g.appendChild(fnSel);
    var iA = moreField(g, 'a', '0.5');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var a=moreNum(iA); if (a===null) return;
      var fn = fnSel.value;
      if ((fn==='sin'||fn==='cos') && Math.abs(a)>1) { el('div','err',out,'|a| должно быть ≤ 1'); return; }
      var base, formula;
      if (fn==='sin') { base=Math.asin(a); formula='x = (−1)ⁿ·arcsin(a) + πn'; }
      else if (fn==='cos') { base=Math.acos(a); formula='x = ±arccos(a) + 2πn'; }
      else { base=Math.atan(a); formula='x = arctan(a) + πn'; }
      moreResults(out, [['частное решение, рад', base], ['частное решение, °', base/D2R]]);
      el('div','sub',out, 'общее решение: ' + formula + ', n ∈ ℤ');
    }
    [iA].forEach(function(i){i.addEventListener('input',calc);}); fnSel.addEventListener('change',calc); calc();
  }

  /* ---------------------------------------------------- 10. ОДУ */
  function buildOdeUI(c) {
    var g = el('div', null, c);
    var mf = makeField(g, { initial: 'y', onChange: calc });
    el('div', 'sub', g, 'функция f(x,y) — правая часть y′ = f(x,y); используйте x и y как переменные');
    var g2 = el('div', 'grid2', c);
    var iX0=moreField(g2,'x₀','0'), iY0=moreField(g2,'y₀','1'), iXt=moreField(g2,'найти y при x =','1'), iH=moreField(g2,'шаг h','0.01');
    var out = el('div', 'out', c);

    // Поле направлений + траектория — визуализация через сам движок GMS (draw
    // Field/draw Trajectory уже умеют именно это), а не самодельный canvas.
    var vizWrap = el('div', 'conv-block', c);
    el('div', 'conv-block-h', vizWrap, 'Поле направлений (наведите/потяните зелёную точку)');
    var vizHost = el('div', 'ode-viz', vizWrap);
    var vizStatus = el('div', 'sub', vizWrap, '');
    var probeReadout = el('div', 'ode-probe', vizWrap);

    var probeState = {};
    var msgHandler = function (e) {
      var d = e && e.data;
      if (!d || d.type !== 'gms-var') return;
      if (d.name === 'slope' || d.name === 'probeX' || d.name === 'probeY') {
        probeState[d.name] = d.value;
        renderProbe();
      }
    };
    function renderProbe() {
      if (probeState.probeX === undefined) { probeReadout.textContent = ''; return; }
      probeReadout.innerHTML = 'в точке (' + moreFmt(probeState.probeX) + '; ' + moreFmt(probeState.probeY) +
        ') &nbsp; f(x,y) = <b>' + moreFmt(probeState.slope) + '</b>';
    }
    window.addEventListener('message', msgHandler);
    c.__mfCleanup = function () { window.removeEventListener('message', msgHandler); };

    function buildScene(fExpr, x0, y0, xt, ymin, ymax) {
      // ± паддинг вокруг фактического диапазона, чтобы поле не обрезало траекторию впритык
      var xPad = Math.max(1, Math.abs(xt - x0) * 0.25);
      var xmin = Math.min(x0, xt) - xPad, xmax = Math.max(x0, xt) + xPad;
      var yPad = Math.max(1, (ymax - ymin) * 0.3);
      var y0b = ymin - yPad, y1b = ymax + yPad;
      var steps = Math.min(2000, Math.max(50, Math.round(Math.abs(xt - x0) / 0.02)));
      var dt = (xt - x0) / steps || 0.02;
      // slope, вычисленный В ТОЧКЕ ЗОНДА: подставляем probe.pos.x/probe.pos.y вместо x/y
      // в пользовательское выражение (простая замена по границе слова — переменных,
      // кроме x и y, в этом выражении по смыслу инструмента быть не должно).
      var slopeExpr = fExpr.replace(/\bx\b/g, 'probe.pos.x').replace(/\by\b/g, 'probe.pos.y');
      return '[\n' +
        '  theme = dark\n' +
        '  show axes = true\n' +
        '  field width = ' + moreFmt(xmax - xmin) + '\n' +
        '  draw Field { name = "field1" P = "1" Q = "' + fExpr + '" xmin = ' + moreFmt(xmin) + ' xmax = ' + moreFmt(xmax) +
          ' ymin = ' + moreFmt(y0b) + ' ymax = ' + moreFmt(y1b) + ' grid = 17 color = "#5b8cff" }\n' +
        '  draw Trajectory { name = "traj1" P = "1" Q = "' + fExpr + '" start = (' + moreFmt(x0) + ', ' + moreFmt(y0) +
          ') steps = ' + steps + ' dt = ' + moreFmt(dt) + ' color = "#f2b45c" thickness = 3 }\n' +
        '  new Point { name = "probe" pos = (' + moreFmt(x0) + ', ' + moreFmt(y0) + ') interact = true color = "#22c55e" size = 1.3 }\n' +
        '  new Publish { name = "slope" value = ' + slopeExpr + ' }\n' +
        '  new Publish { name = "probeX" value = probe.pos.x }\n' +
        '  new Publish { name = "probeY" value = probe.pos.y }\n' +
        ']\n';
    }

    var vizToken = 0;
    function updateViz(fExpr, x0, y0, xt, ymin, ymax) {
      var myToken = ++vizToken;
      vizStatus.textContent = 'строим сцену…';
      probeState = {};
      loadGmsCompiler().then(function (mod) {
        if (myToken !== vizToken) return;   // пользователь уже успел изменить ввод — не показываем устаревший результат
        var src = buildScene(fExpr, x0, y0, xt, ymin, ymax);
        var result;
        try { result = mod.compile(src); } catch (e) { result = { success: false, errors: [String(e.message || e)] }; }
        if (myToken !== vizToken) return;
        vizHost.innerHTML = '';
        if (!result.success) { vizStatus.textContent = 'визуализация недоступна для этой функции'; return; }
        vizStatus.textContent = '';
        var frame = document.createElement('iframe');
        frame.className = 'ode-frame';
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        vizHost.appendChild(frame);
        frame.srcdoc = result.html;
      }).catch(function () {
        if (myToken !== vizToken) return;
        vizStatus.textContent = 'не удалось загрузить движок визуализации';
      });
    }

    function calc() {
      out.innerHTML='';
      var x0=moreNum(iX0), y0=moreNum(iY0), xt=moreNum(iXt), h=moreNum(iH);
      if ([x0,y0,xt,h].some(function(v){return v===null;}) || h<=0) return;
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var ast; try { ast = MFMath.parse(lin); } catch(e) { return; }
      var steps = Math.round(Math.abs(xt-x0)/h);
      if (steps > 500000) { el('div','err',out,'слишком много шагов — увеличьте h'); return; }
      var dir = xt >= x0 ? 1 : -1;
      var x=x0, y=y0, yMin=y0, yMax=y0;
      for (var i=0;i<steps;i++) {
        var f = MFMath.evalAst(ast, {x:x,y:y});
        y = y + dir*h*f; x = x + dir*h;
        if (y < yMin) yMin = y; if (y > yMax) yMax = y;
      }
      moreResults(out, [['y(' + xt + ') ≈', y], ['шагов', steps]]);
      el('div','sub',out, 'метод Эйлера — приближённое численное решение, точность растёт при уменьшении h');
      updateViz(lin, x0, y0, xt, yMin, yMax);
    }
    [iX0,iY0,iXt,iH].forEach(function(i){i.addEventListener('input',calc);}); calc();
  }

  /* ---------------------------------------------------- 9. Графики: полярные/параметрические */
  function buildPolarPlotUI(c) {
    var g = el('div', null, c);
    var mf = makeField(g, { initial: '2+2*cos(θ)'.replace('θ','t'), label: 'r(t), t — угол в радианах', onChange: redraw });
    var cv = document.createElement('canvas'); cv.className = 'more-canvas'; c.appendChild(cv);
    function redraw() {
      var ctx = cv.getContext('2d'); var W = cv.width = cv.clientWidth * 2, H = cv.height = 320 * 2;
      ctx.clearRect(0,0,W,H);
      var lin = mf.field.expr(); if (!lin.trim()) return;
      var comp = MFMath.compile(lin, 't'); if (!comp) return;
      var cx=W/2, cy=H/2, scale = Math.min(W,H)/2/6;
      ctx.strokeStyle = 'rgba(120,150,210,.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
      ctx.strokeStyle = '#5b8cff'; ctx.lineWidth = 2.4; ctx.beginPath();
      var first = true;
      for (var t = 0; t <= Math.PI*2*3; t += 0.01) {
        var r = comp.at(t); if (!isFinite(r)) { first = true; continue; }
        var x = cx + r*Math.cos(t)*scale, y = cy - r*Math.sin(t)*scale;
        if (first) { ctx.moveTo(x,y); first = false; } else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    window.addEventListener('resize', redraw);
    setTimeout(redraw, 0);
  }
  function buildParamPlotUI(c) {
    var g = el('div', null, c);
    el('div', 'conv-block-h', g, 'x(t)');
    var mfx = makeField(g, { initial: 'cos(t)*3', onChange: redraw });
    el('div', 'conv-block-h', g, 'y(t)');
    var mfy = makeField(g, { initial: 'sin(t)*2', onChange: redraw });
    var g2 = el('div', 'grid2', c);
    var iT0 = moreField(g2, 't от', '0'), iT1 = moreField(g2, 't до', String((2*Math.PI).toFixed(4)));
    var cv = document.createElement('canvas'); cv.className = 'more-canvas'; c.appendChild(cv);
    function redraw() {
      var ctx = cv.getContext('2d'); var W = cv.width = cv.clientWidth * 2, H = cv.height = 320 * 2;
      ctx.clearRect(0,0,W,H);
      var t0=moreNum(iT0), t1=moreNum(iT1); if (t0===null||t1===null) return;
      var cx0 = MFMath.compile(mfx.field.expr(),'t'), cy0 = MFMath.compile(mfy.field.expr(),'t');
      if (!cx0 || !cy0) return;
      var cx=W/2, cy=H/2, scale = Math.min(W,H)/2/6;
      ctx.strokeStyle = 'rgba(120,150,210,.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
      ctx.strokeStyle = '#3ec2a4'; ctx.lineWidth = 2.4; ctx.beginPath();
      var first = true, N = 2000;
      for (var i = 0; i <= N; i++) {
        var t = t0 + (t1-t0)*i/N;
        var x = cx0.at(t), y = cy0.at(t);
        if (!isFinite(x) || !isFinite(y)) { first = true; continue; }
        var X = cx + x*scale, Y = cy - y*scale;
        if (first) { ctx.moveTo(X,Y); first = false; } else ctx.lineTo(X,Y);
      }
      ctx.stroke();
    }
    [iT0, iT1].forEach(function(i){ i.addEventListener('input', redraw); });
    window.addEventListener('resize', redraw);
    setTimeout(redraw, 0);
  }


  /* ---- доп. треугольник Паскаля ---- */
  function buildPascalUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число строк', '8');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var n = Math.round(moreNum(iN)); if (!n || n<1 || n>20) return;
      var wrap = el('div', 'pascal-wrap', out);
      var row = [1];
      for (var i = 0; i < n; i++) {
        var r = el('div', 'pascal-row', wrap);
        row.forEach(function (v) { el('span', 'pascal-cell', r, String(v)); });
        var next = [1];
        for (var j = 0; j < row.length - 1; j++) next.push(row[j] + row[j+1]);
        next.push(1);   // каждая строка треугольника Паскаля заканчивается на 1 —
                         // раньше это добавлялось только при row.length>1, из-за
                         // чего генерация зависала на самой первой строке [1]
        row = next;
      }
    }
    iN.addEventListener('input', calc); calc();
  }

  /* ---- доп. делители числа ---- */
  function buildDivisorsUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число', '28');
    var out = el('div', 'out', c);
    function calc() {
      out.innerHTML=''; var n = Math.round(moreNum(iN)); if (!n || n<1) return;
      var divs = [];
      for (var i = 1; i*i <= n; i++) if (n % i === 0) { divs.push(i); if (i !== n/i) divs.push(n/i); }
      divs.sort(function(a,b){return a-b;});
      var sum = divs.reduce(function(a,b){return a+b;}, 0);
      el('div','big',out, divs.join(', '));
      var isPerfect = (sum - n) === n;
      el('div','sub',out, 'сумма делителей (с самим числом): ' + sum + ' · сумма собственных делителей: ' + (sum-n) +
        (isPerfect ? '  →  число совершенное!' : ''));
    }
    iN.addEventListener('input', calc); calc();
  }

  /* ---- доп. генераторы случайных чисел ---- */
  function buildRandomRangeUI(c) {
    var g = el('div', 'grid2', c);
    var iA = moreField(g, 'от', '1'), iB = moreField(g, 'до', '100');
    var typeSel = document.createElement('select'); typeSel.className = 'conv-select';
    [['int', 'целое'], ['float', 'вещественное']].forEach(function (o) {
      var opt = document.createElement('option'); opt.value = o[0]; opt.textContent = o[1]; typeSel.appendChild(opt);
    });
    g.appendChild(typeSel);
    var out = el('div', 'out', c);
    var genBtn = el('button', 'mini', c, 'Сгенерировать ещё раз'); genBtn.type = 'button';
    function gen() {
      out.innerHTML = '';
      var a = moreNum(iA), b = moreNum(iB);
      if (a === null || b === null) return;
      var lo = Math.min(a, b), hi = Math.max(a, b);
      var val = typeSel.value === 'int'
        ? Math.floor(Math.random() * (Math.floor(hi) - Math.ceil(lo) + 1)) + Math.ceil(lo)
        : lo + Math.random() * (hi - lo);
      el('div', 'big', out, typeSel.value === 'int' ? String(val) : moreFmt(val));
    }
    [iA, iB].forEach(function (i) { i.addEventListener('input', gen); });
    typeSel.addEventListener('change', gen);
    // «Ещё раз» — число прокручивается «барабаном» и приземляется на итог.
    genBtn.addEventListener('click', function () {
      gen();
      var big = out.querySelector('.big'), a = moreNum(iA), b = moreNum(iB);
      if (!big || a === null || b === null) return;
      var lo = Math.min(a, b), hi = Math.max(a, b), isInt = typeSel.value === 'int';
      rollText(big, function () {
        var v = isInt ? Math.floor(Math.random() * (Math.floor(hi) - Math.ceil(lo) + 1)) + Math.ceil(lo) : lo + Math.random() * (hi - lo);
        return isInt ? String(v) : moreFmt(v);
      }, big.textContent, 560);
    });
    gen();
  }
  function buildDiceUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число кубиков', '2'), iSides = moreField(g, 'граней у кубика', '6');
    var out = el('div', 'out', c);
    var genBtn = el('button', 'mini', c, 'Бросить снова'); genBtn.type = 'button';
    function gen() {
      out.innerHTML = '';
      var n = Math.round(moreNum(iN)), sides = Math.round(moreNum(iSides));
      if (!n || n < 1) return;
      if (n > 100) { el('div', 'err', out, 'не больше 100 кубиков за раз'); return; }
      if (!sides || sides < 2) { el('div', 'err', out, 'граней должно быть хотя бы 2'); return; }
      var rolls = []; for (var i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * sides));
      var sum = rolls.reduce(function (a, b) { return a + b; }, 0);
      el('div', 'big', out, rolls.join('  +  ') + (rolls.length > 1 ? '  =  ' + sum : ''));
    }
    [iN, iSides].forEach(function (i) { i.addEventListener('input', gen); });
    // «Бросить снова» — кубики «катятся»: грани мелькают и замирают на итоге.
    genBtn.addEventListener('click', function () {
      gen();
      var big = out.querySelector('.big');
      var n = Math.round(moreNum(iN)), sides = Math.round(moreNum(iSides));
      if (!big || !n || !sides) return;
      rollText(big, function () {
        var r = []; for (var i = 0; i < n; i++) r.push(1 + Math.floor(Math.random() * sides));
        return r.join('  +  ') + (n > 1 ? '  =  ' + r.reduce(function (a, b) { return a + b; }, 0) : '');
      }, big.textContent, 620);
    });
    gen();
  }
  function buildCoinUI(c) {
    var g = el('div', 'grid2', c);
    var iN = moreField(g, 'число подбрасываний', '1');
    var out = el('div', 'out', c);
    var genBtn = el('button', 'mini', c, 'Подбросить снова'); genBtn.type = 'button';
    function gen() {
      out.innerHTML = '';
      var n = Math.round(moreNum(iN));
      if (!n || n < 1) return;
      if (n > 5000) { el('div', 'err', out, 'не больше 5000 за раз'); return; }
      var results = []; var heads = 0;
      for (var i = 0; i < n; i++) { var r = Math.random() < 0.5; results.push(r ? 'орёл' : 'решка'); if (r) heads++; }
      if (n === 1) el('div', 'big', out, results[0]);
      else { moreResults(out, [['орёл', heads], ['решка', n - heads]]); }
    }
    iN.addEventListener('input', gen);
    // Одна монетка — честно «подбрасывается» (3D-вращение по оси X).
    genBtn.addEventListener('click', function () {
      gen();
      var big = out.querySelector('.big');
      if (big) replay(big, 'mf-coin-flip');
    });
    gen();
  }
  function buildShuffleUI(c) {
    var g = el('div', null, c);
    el('div', 'conv-block-h', g, 'список (через запятую)');
    var iList = document.createElement('textarea'); iList.className = 'more-textarea'; iList.rows = 2;
    iList.value = 'Аня, Борис, Вера, Гриша, Даша'; g.appendChild(iList);
    var g2 = el('div', 'grid2', c);
    var iK = moreField(g2, 'выбрать штук (пусто = все, перемешать)', '');
    var out = el('div', 'out', c);
    var genBtn = el('button', 'mini', c, 'Перемешать снова'); genBtn.type = 'button';
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function gen() {
      out.innerHTML = '';
      var items = iList.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!items.length) return;
      var shuffled = shuffle(items);
      var kRaw = String(iK.value).trim();
      var k = kRaw ? Math.min(items.length, Math.max(1, Math.round(parseFloat(kRaw)))) : items.length;
      el('div', 'big', out, shuffled.slice(0, k).join(', '));
    }
    iList.addEventListener('input', gen);
    iK.addEventListener('input', gen);
    genBtn.addEventListener('click', function () {
      gen();
      var big = out.querySelector('.big');
      var items = iList.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!big || !items.length) return;
      var k = big.textContent.split(', ').length;
      rollText(big, function () { return shuffle(items).slice(0, k).join(', '); }, big.textContent, 520);
    });
    gen();
  }

  var MORE_CATEGORIES = [
    { id: 'calc2', label: 'Матанализ', tools: [
      { id: 'limit', label: 'Предел функции', build: buildLimitUI },
      { id: 'nthderiv', label: 'Производная n-го порядка', build: buildNthDerivUI },
      { id: 'integral', label: 'Определённый интеграл', build: buildIntegralUI },
      { id: 'series', label: 'Сумма ряда', build: buildSeriesUI },
      { id: 'taylor', label: 'Ряд Тейлора', build: buildTaylorUI }
    ]},
    // Векторное/скалярное произведение и вся арифметика с векторами убраны
    // отсюда — клавиша «□⃗» теперь прямо работает в алгебраическом
    // калькуляторе (см. analyzeVector в svcCalc), матрицы/собственные значения
    // остаются здесь: для них на клавиатуре формулы нет отдельной клавиши.
    { id: 'linalg', label: 'Линейная алгебра', tools: [
      { id: 'matops', label: 'Операции с матрицами', build: buildMatrixOpsUI },
      { id: 'eigen', label: 'Собственные значения (2×2)', build: buildEigenUI }
    ]},
    // Корни n-й степени и весь раздел «Комплексные числа» убраны отсюда:
    // клавиша «i» и xʸ/(/÷/) теперь прямо работают в алгебраическом
    // калькуляторе (см. analyzeComplex* в svcCalc) — включая произвольную
    // комплексную степень/корень (x^(1/n) с комплексным n).
    { id: 'numtheory', label: 'Теория чисел', tools: [
      { id: 'gcdlcm', label: 'НОД и НОК', build: buildGcdLcmUI },
      { id: 'factorize', label: 'Разложение на множители', build: buildFactorizeUI },
      { id: 'prime', label: 'Проверка на простоту', build: buildPrimeUI },
      { id: 'modarith', label: 'Модулярная арифметика', build: buildModArithUI },
      { id: 'crt', label: 'Китайская теорема об остатках', build: buildCrtUI },
      { id: 'divisors', label: 'Делители числа', build: buildDivisorsUI },
      { id: 'exact', label: 'Точное значение (из десятичного)', build: function (c) { svcExact.mount(c); } }
    ]},
    { id: 'combin', label: 'Комбинаторика/вероятность', tools: [
      { id: 'combinatorics', label: 'Перестановки/размещения/сочетания', build: buildCombinUI },
      { id: 'binomprob', label: 'Биномиальная вероятность', build: buildBinomProbUI },
      { id: 'bayes', label: 'Формула Байеса', build: buildBayesUI },
      { id: 'pascal', label: 'Треугольник Паскаля', build: buildPascalUI }
    ]},
    { id: 'stats', label: 'Статистика', tools: [
      { id: 'descstats', label: 'Описательная статистика', build: buildDescStatsUI },
      { id: 'regression', label: 'Линейная регрессия', build: buildRegressionUI },
      { id: 'normaldist', label: 'Нормальное распределение', build: buildNormalDistUI }
    ]},
    { id: 'random', label: 'Случайность', tools: [
      { id: 'randrange', label: 'Случайное число в диапазоне', build: buildRandomRangeUI },
      { id: 'dice', label: 'Бросок кубиков', build: buildDiceUI },
      { id: 'coin', label: 'Монетка', build: buildCoinUI },
      { id: 'shuffle', label: 'Перемешать / выбрать из списка', build: buildShuffleUI }
    ]},
    { id: 'sequences', label: 'Последовательности', tools: [
      { id: 'arithseq', label: 'Арифметическая прогрессия', build: buildArithSeqUI },
      { id: 'geomseq', label: 'Геометрическая прогрессия', build: buildGeomSeqUI },
      { id: 'fib', label: 'Числа Фибоначчи', build: buildFibUI }
    ]},
    { id: 'trig', label: 'Тригонометрия', tools: [
      { id: 'trigeq', label: 'Простейшие тригонометрические уравнения', build: buildTrigEqUI }
    ]},
    { id: 'ode', label: 'Диффуравнения', tools: [
      { id: 'euler', label: 'Численное решение ОДУ (метод Эйлера)', build: buildOdeUI }
    ]},
    { id: 'plots2', label: 'Графики', tools: [
      { id: 'polar', label: 'Полярный график r(θ)', build: buildPolarPlotUI },
      { id: 'param', label: 'Параметрический график', build: buildParamPlotUI }
    ]}
  ];

  var svcMore = {
    id: 'more', glyph: '⋯', title: 'Ещё',
    sub: '35+ специализированных инструментов',
    mount: function (host) {
      var p = panel(host, 'Ещё инструменты');
      var catRow = el('div', 'conv-chips', p);
      var toolRow = el('div', 'geo-subchips more-toolrow', p);
      var body = el('div', null, p);
      var activeCat = MORE_CATEGORIES[0].id, activeTool = MORE_CATEGORIES[0].tools[0].id;
      host.__mfCleanup = function () { if (typeof body.__mfCleanup === 'function') { try { body.__mfCleanup(); } catch (e) {} } };

      function renderTools() {
        var cat = MORE_CATEGORIES.filter(function (c) { return c.id === activeCat; })[0];
        toolRow.innerHTML = '';
        cat.tools.forEach(function (t) {
          var b = el('button', 'geo-subchip', toolRow, t.label); b.type = 'button'; b.dataset.id = t.id;
          b.classList.toggle('on', t.id === activeTool);
          b.addEventListener('click', function () { activeTool = t.id; renderTools(); renderBody(); });
        });
      }
      function renderBody() {
        var cat = MORE_CATEGORIES.filter(function (c) { return c.id === activeCat; })[0];
        var tool = cat.tools.filter(function (t) { return t.id === activeTool; })[0] || cat.tools[0];
        activeTool = tool.id;
        if (typeof body.__mfCleanup === 'function') { try { body.__mfCleanup(); } catch (e) {} }
        body.innerHTML = '';
        body.__mfCleanup = null;
        tool.build(body);
      }
      MORE_CATEGORIES.forEach(function (cat) {
        var b = el('button', 'conv-chip', catRow, cat.label); b.type = 'button'; b.dataset.id = cat.id;
        b.addEventListener('click', function () {
          activeCat = cat.id; activeTool = cat.tools[0].id;
          catRow.querySelectorAll('.conv-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.id === activeCat); });
          renderTools(); renderBody();
        });
      });
      catRow.querySelectorAll('.conv-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.id === activeCat); });
      renderTools();
      renderBody();
    }
  };

  var SERVICES = [svcBasic, svcCalc, svcConverter, svcGeo, svcPlot, svcMore];

  /* --------------------------------------------------------- оболочка */
  function boot() {
    var grid = $('#svcGrid'), work = $('#work');
    if (!grid || !work) return;
    var current = null;

    SERVICES.forEach(function (s) {
      var b = el('button', 'svc', grid);
      b.type = 'button';
      b.dataset.id = s.id;
      b.setAttribute('data-mf-reveal', '');
      var t = el('div', 'svc-ttl', b);
      el('span', 'gl', t, s.glyph);
      el('span', null, t, s.title);
      el('div', 'svc-sub', b, s.sub);
      el('span', 'svc-bar', b).setAttribute('aria-hidden', 'true');   // полоска активной карточки
      b.addEventListener('click', function () { open(s.id, true, b); });
    });

    // Морф «карточка → рабочая панель»: полупрозрачный «призрак» карточки
    // перелетает (translate+scale, только transform/opacity) на место новой
    // панели и растворяется, пока сама панель въезжает.
    function morphCardToPanel(card, target) {
      if (!card || !target || !motionOK() || !card.animate) return;
      var a = card.getBoundingClientRect(), bRect = target.getBoundingClientRect();
      if (!a.width || !bRect.width) return;
      // панель далеко за пределами экрана — лететь некуда, не мешаем
      if (bRect.top > window.innerHeight + 40) return;
      var ghost = el('div', 'mf-svc-morph', document.body);
      ghost.style.width = a.width + 'px';
      ghost.style.height = a.height + 'px';
      var sx = bRect.width / a.width, sy = Math.min(bRect.height, window.innerHeight * 0.8) / a.height;
      var anim = ghost.animate([
        { transform: 'translate(' + a.left + 'px,' + a.top + 'px) scale(1,1)', opacity: 0.95 },
        { transform: 'translate(' + bRect.left + 'px,' + bRect.top + 'px) scale(' + sx + ',' + sy + ')', opacity: 0 }
      ], { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
      anim.onfinish = anim.oncancel = function () { ghost.remove(); };
      setTimeout(function () { if (ghost.parentNode) ghost.remove(); }, 900);
    }

    function open(id, push, srcCard) {
      var s = SERVICES.filter(function (x) { return x.id === id; })[0];
      if (!s) s = SERVICES[0];
      if (current === s.id) return;
      var prevIdx = SERVICES.map(function (x) { return x.id; }).indexOf(current);
      var nextIdx = SERVICES.indexOf(s);
      work.style.setProperty('--mf-dir', prevIdx < 0 ? 0 : (nextIdx > prevIdx ? 1 : -1));
      current = s.id;
      grid.querySelectorAll('.svc').forEach(function (b) {
        b.classList.toggle('on', b.dataset.id === s.id);
      });
      if (typeof work.__mfCleanup === 'function') { try { work.__mfCleanup(); } catch (e) {} }
      work.innerHTML = '';
      work.__mfCleanup = null;
      // Плавный переход между инструментами вместо резкой подмены содержимого —
      // короткий, ненавязчивый (~240мс), уважает prefers-reduced-motion через CSS.
      work.classList.remove('mf-panel-enter');
      try { s.mount(work); }
      catch (e) {
        work.innerHTML = '';
        el('div', 'panel', work, '<div class="err">Сервис не запустился: ' + e.message + '</div>');
      }
      void work.offsetWidth;   // форсируем reflow, чтобы анимация запустилась заново
      work.classList.add('mf-panel-enter');
      // Содержимое панели собирается лесенкой (CSS: .mf-svc-stagger). Класс
      // снимаем после въезда — дальше работают обычные попы результатов.
      clearTimeout(work.__mfStaggerT);
      work.classList.remove('mf-svc-stagger');
      if (motionOK()) {
        work.classList.add('mf-svc-stagger');
        work.__mfStaggerT = setTimeout(function () { work.classList.remove('mf-svc-stagger'); }, 1000);
        var activeCard = grid.querySelector('.svc.on');
        if (activeCard) {
          replay(activeCard, 'mf-svc-activate');
          clearTimeout(activeCard.__mfT);
          activeCard.__mfT = setTimeout(function () { activeCard.classList.remove('mf-svc-activate'); }, 700);
        }
        if (srcCard) morphCardToPanel(srcCard, work.querySelector('.panel') || work);
      }
      // history.replaceState может кинуть SecurityError, если страница открыта
      // внутри iframe с несовпадающим origin/about:srcdoc (например, просмотр
      // standalone-файла в песочнице предпросмотра) — синхронизация адресной
      // строки тут «приятный бонус», а не необходимость, поэтому не должна
      // ронять остальной скрипт.
      if (push && location.hash !== '#' + s.id) { try { history.replaceState(null, '', '#' + s.id); } catch (e) {} }
      if (window.MathFrameUI) window.MathFrameUI.reveal();
    }

    window.addEventListener('hashchange', function () { open(location.hash.slice(1)); });
    open(location.hash.slice(1) || SERVICES[0].id);

    /* ------------------------------------------------------------------
       ЕДИНЫЙ механизм анимации результатов — вместо правки каждой из ~30
       функций-калькуляторов. Отслеживает изменения внутри #work и
       проигрывает короткий, ненавязчивый «pop» на ближайшем контейнере
       результата (.out, .kv, .alg-answer и т.п.), когда его содержимое
       обновилось. Работает одинаково для Обычного калькулятора, алгебры,
       геометрии, конвертора и всех 30+ инструментов «Ещё» — они уже
       рендерят результат в один из этих контейнеров. */
    var reducedMotion = false;
    try { reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!reducedMotion) {
      var POP_SELECTOR = '.out, .alg-answer, .alg-steps, .alg-badge, .kv, .matrix-out, .calc-display, .pascal-wrap, .conv-output, .geo-subchips';
      var popQueue = new Set();
      var popScheduled = false;
      function flushPop() {
        popScheduled = false;
        if (!motionOK()) { popQueue.clear(); return; }
        popQueue.forEach(function (node) {
          var cls = node.classList.contains('alg-badge') ? 'mf-badge-pop' : 'mf-pop';
          node.classList.remove(cls);
          void node.offsetWidth;
          node.classList.add(cls);
        });
        popQueue.clear();
      }
      var resultObserver = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var node = mutations[i].target;
          while (node && node !== work) {
            // «живые» узлы (счётчик/барабан) меняются каждый кадр — их не попаем
            if (node.nodeType === 1 && (node.__mfCount || node.__mfRoll && node.classList.contains('mf-rolling'))) break;
            if (node.nodeType === 1 && node.matches && node.matches(POP_SELECTOR)) { popQueue.add(node); break; }
            node = node.parentNode;
          }
        }
        if (popQueue.size && !popScheduled) { popScheduled = true; requestAnimationFrame(flushPop); }
      });
      resultObserver.observe(work, { childList: true, subtree: true, characterData: true });

      // Отдельно — «включение» чипа (активная вкладка/категория) получает
      // маленький упругий поп при появлении класса .on, а не только смену цвета.
      var chipQueue = new Set();
      var chipScheduled = false;
      function flushChipPop() {
        chipScheduled = false;
        chipQueue.forEach(function (node) {
          node.classList.remove('mf-chip-pop');
          void node.offsetWidth;
          node.classList.add('mf-chip-pop');
        });
        chipQueue.clear();
      }
      var chipObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          var el2 = m.target;
          if (el2.nodeType === 1 && el2.classList && el2.classList.contains('on') &&
              (el2.classList.contains('conv-chip') || el2.classList.contains('geo-subchip'))) {
            chipQueue.add(el2);
          }
        });
        if (chipQueue.size && !chipScheduled) { chipScheduled = true; requestAnimationFrame(flushChipPop); }
      });
      chipObserver.observe(work, { attributes: true, attributeFilter: ['class'], subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();