// assets/js/gms-embed.js
// Единая точка, через которую страницы сайта работают с движком GMS: справочник,
// мини-сервисы, решатель задач по геометрии, редактор иерархии. Раньше каждая
// страница сама грузила компилятор, создавала iframe, синхронизировала тему и
// подгоняла высоту — пять копий одного и того же кода с разными ошибками.
//
//   loadCompiler()                 — ленивый import компилятора (кэшируется)
//   compileScene(src)              — { success, html, errors }
//   mountHtml(host, html, opts)    — iframe со сценой: тема сайта, авто-высота,
//                                    канал переменных new Publish (opts.onVar)
//   mountScene(host, src, opts)    — compileScene + mountHtml
//   attachFrame(frame, opts)       — то же для уже созданного iframe (справочник)
//   exprToGms(ast, rename)         — дерево MFMath → выражение GMS
//   plotScene(spec)                — сцена «график»: функции, неявные кривые,
//                                    параметрические/полярные кривые, отметки
//
// Подключается и как модуль (import), и через window.MFGms для обычных скриптов.

// Относительно самого модуля — работает и при размещении сайта не в корне домена.
const COMPILER_URL = new URL('./gms-compiler.js', import.meta.url).href;
let compilerPromise = null;

export function loadCompiler() {
  if (!compilerPromise) {
    compilerPromise = import(COMPILER_URL).catch((e) => { compilerPromise = null; throw e; });
  }
  return compilerPromise;
}

export async function compileScene(src) {
  const mod = await loadCompiler();
  try { return mod.compile(src); }
  catch (e) { return { success: false, errors: [String((e && e.message) || e)] }; }
}

export function siteTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function sendTheme(frame) {
  try { frame.contentWindow.postMessage({ type: 'geocompiler-set-theme', theme: siteTheme() }, '*'); } catch (e) {}
}

// Высота содержимого сцены: у <body> внутри iframe min-height:100vh, поэтому
// documentElement никогда не становится ниже самой рамки — меряем .container.
function contentHeight(doc) {
  const box = doc.querySelector('.container') || doc.body;
  if (!box) return 0;
  const cs = doc.defaultView.getComputedStyle(doc.body);
  const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  return Math.ceil(box.getBoundingClientRect().height + pad);
}

/* Подключает к iframe со сценой общие механизмы сайта.
   opts.fit       — элемент, высоту которого подгонять (по умолчанию сам iframe;
                    false — не подгонять);
   opts.onVar     — (name, value) для значений new Publish;
   opts.onLoad    — после загрузки сцены;
   opts.theme     — 'auto' (по умолчанию: следовать теме сайта) или 'light'/'dark';
   opts.flush     — убрать внутренний отступ документа сцены.
   Возвращает функцию отключения. */
export function attachFrame(frame, opts = {}) {
  const fitEl = opts.fit === false ? null : (opts.fit || frame);
  const cleanups = [];
  const applyTheme = () => {
    if (opts.theme && opts.theme !== 'auto') {
      try { frame.contentWindow.postMessage({ type: 'geocompiler-set-theme', theme: opts.theme }, '*'); } catch (e) {}
    } else sendTheme(frame);
  };
  const fit = () => {
    if (!fitEl) return;
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      const h = contentHeight(doc);
      if (!(h > 0)) return;
      // Высота задаётся контейнеру (у справочника — рамке с border): прибавляем его
      // собственные рамки, иначе iframe внутри выходит на пару пикселей ниже содержимого
      // и в нём появляется полоса прокрутки.
      const extra = fitEl === frame ? 0 : Math.max(0, fitEl.offsetHeight - fitEl.clientHeight);
      const target = h + extra;
      if (Math.abs(target - (parseFloat(fitEl.style.height) || 0)) > 0.5) fitEl.style.height = target + 'px';
    } catch (e) {}
  };
  const onLoad = () => {
    // flush — сцена вплотную к краям рамки (без внутреннего отступа документа сцены)
    if (opts.flush) { try { frame.contentDocument.body.style.padding = '2px'; } catch (e) {} }
    // Окно подгоняется под содержимое, поэтому прокрутки внутри сцены не бывает:
    // ни полосы, ни случайного сдвига колесом мыши (колесо прокручивает страницу).
    if (fitEl) {
      try {
        const d = frame.contentDocument;
        d.documentElement.style.overflow = 'hidden';
        d.body.style.overflow = 'hidden';
      } catch (e) {}
    }
    applyTheme();
    fit();
    try {
      const ro = new ResizeObserver(fit);
      const d = frame.contentDocument;
      // .container — само содержимое: у body min-height:100vh, и рост описания или
      // панели UI внутри него не меняет размер body, пока не превысит окно.
      ro.observe(d.querySelector('.container') || d.body);
      ro.observe(d.body);
      ro.observe(frame);
      cleanups.push(() => ro.disconnect());
    } catch (e) {}
    if (opts.onLoad) opts.onLoad(frame);
  };
  frame.addEventListener('load', onLoad);
  cleanups.push(() => frame.removeEventListener('load', onLoad));

  if (!opts.theme || opts.theme === 'auto') {
    const mo = new MutationObserver(applyTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    cleanups.push(() => mo.disconnect());
  }
  if (opts.onVar) {
    const onMsg = (e) => {
      const d = e && e.data;
      if (!d || d.type !== 'gms-var' || e.source !== frame.contentWindow) return;
      opts.onVar(d.name, d.value);
    };
    window.addEventListener('message', onMsg);
    cleanups.push(() => window.removeEventListener('message', onMsg));
  }
  return () => cleanups.splice(0).forEach((f) => f());
}

export function mountHtml(host, html, opts = {}) {
  const frame = document.createElement('iframe');
  frame.className = 'gms-frame' + (opts.className ? ' ' + opts.className : '');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  frame.setAttribute('title', opts.title || 'Интерактивный чертёж');
  frame.style.cssText = 'display:block;width:100%;border:0;background:transparent;' + (opts.minHeight ? 'min-height:' + opts.minHeight + 'px;' : '');
  host.appendChild(frame);
  const detach = attachFrame(frame, opts);
  frame.srcdoc = html;
  return {
    frame,
    destroy() { detach(); if (frame.parentNode) frame.parentNode.removeChild(frame); },
  };
}

export async function mountScene(host, src, opts = {}) {
  const r = await compileScene(src);
  if (!r.success) {
    const err = new Error(r.errors.join('\n'));
    err.errors = r.errors;
    throw err;
  }
  return mountHtml(host, r.html, opts);
}

/* ---------------- Выражения: дерево MFMath → язык выражений GMS ----------------
   Узлы MFMath: num, var, + - * / ^, neg, fact, fn (с base у log по основанию).
   rename — замена имён переменных (уравнение по t рисуется как функция от x). */
const FN_SAME = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'sqrt', 'abs', 'exp', 'sign', 'floor', 'ceil', 'round', 'cbrt']);
const FN_ALIAS = { tg: 'tan', arcsin: 'asin', arccos: 'acos', arctg: 'atan', arctan: 'atan', ln: 'log' };
const CONST_GMS = { pi: 'pi', 'π': 'pi', e: 'E', tau: '(2*pi)', phi: '((1+sqrt(5))/2)' };

function numGms(v) {
  if (!isFinite(v)) throw new Error('число ' + v);
  let s = String(v);
  if (/e/i.test(s)) s = v.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  return v < 0 ? '(' + s + ')' : s;
}

export function exprToGms(node, rename = {}, consts) {
  const C = consts || (window.MFMath && window.MFMath.CONSTS) || {};
  const r = (n) => exprToGms(n, rename, C);
  switch (node.t) {
    case 'num': return numGms(node.v);
    case 'var': {
      if (rename[node.name]) return rename[node.name];
      if (CONST_GMS[node.name] !== undefined && C[node.name] !== undefined) return CONST_GMS[node.name];
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(node.name)) throw new Error('имя ' + node.name);
      return node.name;
    }
    case '^': {
      // x^(1/3), x^(2/3): корень нечётной степени определён и при x < 0
      const M = window.MFMath;
      let E = NaN;
      try { if (M && !M.varsIn(node.b).length) E = M.evalAst(node.b, {}); } catch (e) { E = NaN; }
      if (isFinite(E) && !Number.isInteger(E)) {
        for (let q = 3; q <= 15; q += 2) {
          const p = Math.round(E * q);
          if (Math.abs(E * q - p) < 1e-9) {
            const B = r(node.a);
            return '((abs(' + B + '))^(' + numGms(E) + ')' + (p % 2 ? '*((' + B + ')/abs(' + B + '))' : '') + ')';
          }
        }
      }
      return '(' + r(node.a) + ')^(' + r(node.b) + ')';
    }
    case '+': case '-': case '*': case '/':
      return '(' + r(node.a) + ')' + node.t + '(' + r(node.b) + ')';
    case 'neg': return '(-(' + r(node.a) + '))';
    case 'fact': return 'factorial(' + r(node.a) + ')';
    case 'fn': {
      const u = r(node.a);
      if (node.base) return '(log(' + u + ')/log(' + r(node.base) + '))';
      const name = FN_ALIAS[node.name] || node.name;
      if (FN_SAME.has(name) || name === 'log' && node.name === 'ln') return name + '(' + u + ')';
      switch (name) {
        case 'lg': case 'log': return '(log(' + u + ')/log(10))';
        case 'ctg': case 'cot': return '(1/tan(' + u + '))';
        case 'arcctg': return '(pi/2-atan(' + u + '))';
        case 're': case 'conj': return '(' + u + ')';
      }
      throw new Error('функция ' + node.name);
    }
  }
  throw new Error('узел ' + node.t);
}

/* ---------------- Сцена «график» ----------------
   spec = {
     curves: [
       { kind: 'function', expr: <GMS-выражение от x>, color? },
       { kind: 'implicit', expr: <GMS-выражение от x, y; кривая expr = 0>, color? },
       { kind: 'param',    x: <от t>, y: <от t>, t0, t1, color? },
       { kind: 'polar',    r: <от t>, t0, t1, color? },
     ],
     marks: [{ x, y, label?, color?, size? }],
     view: { width, height, cx?, cy? }, // видимая область
     zoom: [min, max],
     extra: '…'                         // дополнительные строки GMS
   } */
const PALETTE = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'];
const q = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const fmtN = (v) => (Math.abs(v) < 1e-12 ? '0' : String(Number(v.toPrecision(10))));

export function plotScene(spec) {
  const view = Object.assign({ width: 16, height: 10, cx: 0, cy: 0 }, spec.view || {});
  const zoom = spec.zoom || [0.02, 60];
  const L = [
    '[',
    'show axes = true; show grid = true;',
    'field width = ' + fmtN(view.width) + '; field height = ' + fmtN(view.height) + ';',
    'camera zoom limits = (' + zoom[0] + ', ' + zoom[1] + ');',
  ];
  if (view.cx || view.cy) L.push('camera start offset = (' + fmtN(view.cx) + ', ' + fmtN(view.cy) + ');');
  (spec.curves || []).forEach((c, i) => {
    // первая кривая без цвета — цвет кривой темы сцены (свой для светлой и тёмной)
    const col = c.color || (i === 0 ? '' : PALETTE[i % PALETTE.length]);
    const colF = col ? '; color = ' + col : '';
    const id = 'c' + i;
    if (c.kind === 'function') {
      L.push('func ' + id + '(x) = ' + c.expr + ';');
      L.push('draw Function { name = "g' + id + '"; f = "' + id + '"; mode = auto' + colF + ' }');
    } else if (c.kind === 'implicit') {
      L.push('func ' + id + '(x, y) = ' + c.expr + ';');
      L.push('draw Region { name = "g' + id + '"; f = "' + id + '"; op = "="' + colF + ' }');
    } else if (c.kind === 'param' || c.kind === 'polar') {
      // new Curve: параметр t ∈ [0; 1] — переводим в [t0; t1] подстановкой
      const t = '(' + fmtN(c.t0) + '+(' + fmtN(c.t1 - c.t0) + ')*t)';
      const sub = (e) => e.replace(/\bt\b/g, t);
      const xs = c.kind === 'polar' ? '(' + sub(c.r) + ')*cos(' + t + ')' : sub(c.x);
      const ys = c.kind === 'polar' ? '(' + sub(c.r) + ')*sin(' + t + ')' : sub(c.y);
      L.push('new Curve { name = "g' + id + '"; type = parametric; x = ' + q(xs) + '; y = ' + q(ys) +
        '; segments = ' + (c.segments || 1200) + colF + '; thickness = 2.5 }');
    }
  });
  (spec.marks || []).forEach((m, i) => {
    L.push('new Point { name = "m' + i + '"; pos = (' + fmtN(m.x) + ', ' + fmtN(m.y) + '); dynamic = false; collision = false; size = ' +
      (m.size || 0.85) + (m.color ? '; color = ' + m.color : '') + (m.label ? '; text = true(' + q(m.label) + ')' : '') + ' }');
  });
  if (spec.extra) L.push(spec.extra);
  L.push(']');
  return L.join('\n');
}

if (typeof window !== 'undefined') {
  window.MFGms = { loadCompiler, compileScene, siteTheme, attachFrame, mountHtml, mountScene, exprToGms, plotScene };
}
