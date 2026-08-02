/* ============================================================================
   MFMath — разбор и вычисление выражений
   ----------------------------------------------------------------------------
   Вход — линейная запись, которую отдаёт MathField.expr().
   Даёт: числовое значение, точную дробь (где возможно), производную,
   упрощение и обратный перевод в LaTeX.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ============================ 1. ТОЧНАЯ РАЦИОНАЛЬНАЯ АРИФМЕТИКА ========= */
  function gcd(a, b) { a = a < 0 ? -a : a; b = b < 0 ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; }
  function Frac(n, d) {
    if (d === undefined) d = 1;
    if (d === 0) return null;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  var R = {
    add:  function (a, b) { return Frac(a.n * b.d + b.n * a.d, a.d * b.d); },
    sub:  function (a, b) { return Frac(a.n * b.d - b.n * a.d, a.d * b.d); },
    mul:  function (a, b) { return Frac(a.n * b.n, a.d * b.d); },
    div:  function (a, b) { return b.n === 0 ? null : Frac(a.n * b.d, a.d * b.n); },
    num:  function (a) { return a.n / a.d; },
    isInt: function (a) { return a.d === 1; },
    str:  function (a) { return a.d === 1 ? String(a.n) : a.n + '/' + a.d; }
  };
  // Десятичное -> точная дробь (цепные дроби). Ловит 0.333… -> 1/3.
  // Разложение в цепную дробь. ВАЖНО: на каждом шаге запоминаем последний
  // convergent, который ЕЩЁ укладывается в maxDen, и используем именно его —
  // а не только финальный после выхода из цикла. Раньше алгоритм мог найти
  // отличное приближение (скажем, 1/3 на втором шаге), но продолжал искать
  // ещё точнее; следующий шаг «взрывал» знаменатель за maxDen, цикл
  // останавливался, и функция возвращала null — выбрасывая уже найденный
  // хороший ответ. Типичные жертвы бага: 0.3333333333→null (вместо 1/3),
  // 0.6666666667→null (вместо 2/3), 3.14159265→null (вместо приближения π).
  function toFraction(x, maxDen, tol) {
    maxDen = maxDen || 10000;
    tol = tol === undefined ? 1e-9 : tol;
    if (!isFinite(x)) return null;
    var sign = x < 0 ? -1 : 1; x = Math.abs(x);
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    var bestH = null, bestK = null;
    for (var iter = 0; iter < 64; iter++) {
      var a = Math.floor(b);
      var h2 = a * h1 + h0; h0 = h1; h1 = h2;
      var k2 = a * k1 + k0; k0 = k1; k1 = k2;
      if (k1 > maxDen) break;           // дальше только хуже по maxDen — останавливаемся, храня лучший найденный
      bestH = h1; bestK = k1;
      if (Math.abs(x - h1 / k1) < 1e-12) break;   // упёрлись в точность double — точнее не станет
      if (b === a) break;
      b = 1 / (b - a);
    }
    if (bestK === null) return null;
    if (Math.abs(x - bestH / bestK) > tol) return null;
    return Frac(sign * bestH, bestK);
  }

  /* ================================= 2. ЛЕКСЕР =========================== */
  var FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    ln: Math.log, lg: function (x) { return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10; },
    log: function (x) { return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10; },
    sqrt: Math.sqrt, abs: Math.abs,
    exp: Math.exp, sign: Math.sign,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    ctg: function (x) { return 1 / Math.tan(x); },
    cot: function (x) { return 1 / Math.tan(x); },
    // Регистрируем здесь (а не только в комплексном модуле), иначе парсер не
    // узнаёт «conj(...)» как вызов функции вообще — примет «conj» за имя
    // переменной, а «(3+4i)» просто домножится рядом. Вещественные заглушки
    // математически осмысленны сами по себе (вещественное число — это же
    // комплексное с нулевой мнимой частью): conj(x)=x, re(x)=x, im(x)=0,
    // arg(x) = 0 или π. Комплексный калькулятор считает их по-настоящему
    // через evalComplex — эти определения только для того, чтобы в обычных,
    // вещественных калькуляторах вызов не давал NaN/мусор.
    conj: function (x) { return x; },
    re: function (x) { return x; },
    im: function (x) { return 0; },
    arg: function (x) { return x >= 0 ? 0 : Math.PI; }
  };
  var CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };

  function lex(s) {
    var out = [], i = 0;
    s = String(s).replace(/\s+/g, '');
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        out.push({ t: 'num', v: parseFloat(s.slice(i, j)) }); i = j; continue;
      }
      if (/[a-zA-Zα-ωΑ-Ωπ]/.test(c)) {
        var k = i; while (k < s.length && /[a-zA-Zα-ωΑ-Ωπ]/.test(s[k])) k++;
        var word = s.slice(i, k);
        // «xsin(y)» -> x, sin(y): отделяем известное имя функции с конца
        if (!FUNCS[word] && CONSTS[word] === undefined && word.length > 1) {
          var matched = false;
          for (var L = word.length; L >= 2; L--) {
            var tail = word.slice(word.length - L);
            if (FUNCS[tail]) {
              word.slice(0, word.length - L).split('').forEach(function (ch) { out.push({ t: 'id', v: ch }); });
              out.push({ t: 'id', v: tail });
              matched = true; break;
            }
          }
          if (!matched) word.split('').forEach(function (ch) { out.push({ t: 'id', v: ch }); });
        } else {
          out.push({ t: 'id', v: word });
        }
        i = k; continue;
      }
      if ('+-*/^(),!'.indexOf(c) >= 0) { out.push({ t: c }); i++; continue; }
      if (c === '−') { out.push({ t: '-' }); i++; continue; }
      if (c === '·' || c === '×') { out.push({ t: '*' }); i++; continue; }
      if (c === '÷') { out.push({ t: '/' }); i++; continue; }
      i++; // неизвестный символ пропускаем
    }
    return out;
  }

  /* =============================== 3. ПАРСЕР =============================
     Рекурсивный спуск. Поддерживает неявное умножение (2x, xy, 2(x+1)),
     правоассоциативную степень и унарный минус. */
  function parse(src) {
    var T = lex(src), p = 0;
    function peek() { return T[p]; }
    function eat(t) { if (T[p] && T[p].t === t) { p++; return true; } return false; }

    function expr() { return addsub(); }

    function addsub() {
      var a = muldiv();
      for (;;) {
        if (eat('+')) a = { t: '+', a: a, b: muldiv() };
        else if (eat('-')) a = { t: '-', a: a, b: muldiv() };
        else return a;
      }
    }
    function muldiv() {
      var a = unary();
      for (;;) {
        if (eat('*')) a = { t: '*', a: a, b: unary() };
        else if (eat('/')) a = { t: '/', a: a, b: unary() };
        else if (startsOperand()) a = { t: '*', a: a, b: unary() }; // неявное умножение
        else return a;
      }
    }
    function startsOperand() {
      var t = peek();
      if (!t) return false;
      return t.t === 'num' || t.t === 'id' || t.t === '(';
    }
    function unary() {
      if (eat('-')) return { t: 'neg', a: unary() };
      if (eat('+')) return unary();
      return power();
    }
    function power() {
      var base = postfix();
      if (eat('^')) return { t: '^', a: base, b: unary() };  // право-ассоциативна
      return base;
    }
    function postfix() {
      var a = atom();
      while (eat('!')) a = { t: 'fact', a: a };
      return a;
    }
    function atom() {
      var t = peek();
      if (!t) return { t: 'num', v: 0 };
      if (t.t === 'num') { p++; return { t: 'num', v: t.v }; }
      if (t.t === '(') {
        p++;
        var e = expr();
        eat(')');
        return e;
      }
      if (t.t === 'id') {
        p++;
        var name = t.v;
        if (FUNCS[name]) {
          var arg;
          if (eat('(')) { arg = expr(); eat(')'); }
          else arg = power();               // sin x
          return { t: 'fn', name: name, a: arg };
        }
        if (CONSTS[name] !== undefined) return { t: 'num', v: CONSTS[name], sym: name };
        return { t: 'var', name: name };
      }
      p++;
      return { t: 'num', v: 0 };
    }

    var ast = expr();
    return ast;
  }

  /* ============================= 4. ВЫЧИСЛЕНИЕ =========================== */
  function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    var r = 1; for (var i = 2; i <= n; i++) r *= i;
    return r;
  }
  function evalAst(node, vars) {
    vars = vars || {};
    switch (node.t) {
      case 'num': return node.v;
      case 'var': {
        if (node.name in vars) return vars[node.name];
        if (CONSTS[node.name] !== undefined) return CONSTS[node.name];
        return NaN;
      }
      case '+': return evalAst(node.a, vars) + evalAst(node.b, vars);
      case '-': return evalAst(node.a, vars) - evalAst(node.b, vars);
      case '*': return evalAst(node.a, vars) * evalAst(node.b, vars);
      case '/': return evalAst(node.a, vars) / evalAst(node.b, vars);
      case '^': return Math.pow(evalAst(node.a, vars), evalAst(node.b, vars));
      case 'neg': return -evalAst(node.a, vars);
      case 'fact': return factorial(evalAst(node.a, vars));
      case 'fn': {
        var f = FUNCS[node.name];
        return f ? f(evalAst(node.a, vars)) : NaN;
      }
    }
    return NaN;
  }

  function varsIn(node, set) {
    set = set || {};
    if (!node) return set;
    if (node.t === 'var') set[node.name] = true;
    ['a', 'b'].forEach(function (k) { if (node[k]) varsIn(node[k], set); });
    return set;
  }

  /* ====================== 5. СИМВОЛЬНОЕ ДИФФЕРЕНЦИРОВАНИЕ ================ */
  function num(v) { return { t: 'num', v: v }; }
  function isNum(n, v) { return n.t === 'num' && (v === undefined || n.v === v); }

  function d(node, x) {
    switch (node.t) {
      case 'num': return num(0);
      case 'var': return num(node.name === x ? 1 : 0);
      case '+': return { t: '+', a: d(node.a, x), b: d(node.b, x) };
      case '-': return { t: '-', a: d(node.a, x), b: d(node.b, x) };
      case 'neg': return { t: 'neg', a: d(node.a, x) };
      case '*': return { t: '+',
        a: { t: '*', a: d(node.a, x), b: node.b },
        b: { t: '*', a: node.a, b: d(node.b, x) } };
      case '/': return { t: '/',
        a: { t: '-', a: { t: '*', a: d(node.a, x), b: node.b },
                     b: { t: '*', a: node.a, b: d(node.b, x) } },
        b: { t: '^', a: node.b, b: num(2) } };
      case '^': {
        // Показатель без переменной — обычное правило степени
        if (!varsIn(node.b)[x]) {
          return { t: '*',
            a: { t: '*', a: node.b, b: { t: '^', a: node.a, b: { t: '-', a: node.b, b: num(1) } } },
            b: d(node.a, x) };
        }
        // Общий случай: (f^g)' = f^g · (g'·ln f + g·f'/f)
        return { t: '*', a: node,
          b: { t: '+',
               a: { t: '*', a: d(node.b, x), b: { t: 'fn', name: 'ln', a: node.a } },
               b: { t: '/', a: { t: '*', a: node.b, b: d(node.a, x) }, b: node.a } } };
      }
      case 'fn': {
        var u = node.a, du = d(u, x), inner;
        switch (node.name) {
          case 'sin': inner = { t: 'fn', name: 'cos', a: u }; break;
          case 'cos': inner = { t: 'neg', a: { t: 'fn', name: 'sin', a: u } }; break;
          case 'tan': inner = { t: '/', a: num(1), b: { t: '^', a: { t: 'fn', name: 'cos', a: u }, b: num(2) } }; break;
          case 'ln':  inner = { t: '/', a: num(1), b: u }; break;
          case 'exp': inner = node; break;
          case 'sqrt': inner = { t: '/', a: num(1), b: { t: '*', a: num(2), b: { t: 'fn', name: 'sqrt', a: u } } }; break;
          case 'asin': inner = { t: '/', a: num(1), b: { t: 'fn', name: 'sqrt', a: { t: '-', a: num(1), b: { t: '^', a: u, b: num(2) } } } }; break;
          case 'acos': inner = { t: 'neg', a: { t: '/', a: num(1), b: { t: 'fn', name: 'sqrt', a: { t: '-', a: num(1), b: { t: '^', a: u, b: num(2) } } } } }; break;
          case 'atan': inner = { t: '/', a: num(1), b: { t: '+', a: num(1), b: { t: '^', a: u, b: num(2) } } }; break;
          default: return null;
        }
        return { t: '*', a: inner, b: du };
      }
    }
    return null;
  }

  /* ============================ 6. УПРОЩЕНИЕ ============================= */
  function simp(n) {
    if (!n) return n;
    if (n.a) n.a = simp(n.a);
    if (n.b) n.b = simp(n.b);

    switch (n.t) {
      case '+':
        if (isNum(n.a, 0)) return n.b;
        if (isNum(n.b, 0)) return n.a;
        if (isNum(n.a) && isNum(n.b)) return num(n.a.v + n.b.v);
        break;
      case '-':
        if (isNum(n.b, 0)) return n.a;
        if (isNum(n.a, 0)) return simp({ t: 'neg', a: n.b });
        if (isNum(n.a) && isNum(n.b)) return num(n.a.v - n.b.v);
        break;
      case '*':
        if (isNum(n.a, 0) || isNum(n.b, 0)) return num(0);
        if (isNum(n.a, 1)) return n.b;
        if (isNum(n.b, 1)) return n.a;
        if (isNum(n.a) && isNum(n.b)) return num(n.a.v * n.b.v);
        break;
      case '/':
        if (isNum(n.a, 0)) return num(0);
        if (isNum(n.b, 1)) return n.a;
        if (isNum(n.a) && isNum(n.b) && n.b.v !== 0) {
          var f = Frac(n.a.v, n.b.v);
          if (f && Number.isInteger(n.a.v) && Number.isInteger(n.b.v) && f.d === 1) return num(f.n);
        }
        break;
      case '^':
        if (isNum(n.b, 1)) return n.a;
        if (isNum(n.b, 0)) return num(1);
        if (isNum(n.a, 1)) return num(1);
        if (isNum(n.a) && isNum(n.b)) return num(Math.pow(n.a.v, n.b.v));
        break;
      case 'neg':
        if (isNum(n.a)) return num(-n.a.v);
        if (n.a.t === 'neg') return n.a.a;
        break;
    }
    return n;
  }
  function simplify(n, rounds) {
    rounds = rounds || 4;
    for (var i = 0; i < rounds; i++) n = simp(n);
    return n;
  }

  /* ============================ 7. ВЫВОД В LaTeX ========================= */
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4, 'neg': 3, 'fn': 5, 'fact': 5 };
  function prec(n) { return PREC[n.t] !== undefined ? PREC[n.t] : 9; }

  function tex(n, parentPrec) {
    parentPrec = parentPrec || 0;
    var s, p = prec(n);
    switch (n.t) {
      case 'num':
        if (n.sym === 'pi' || n.sym === 'π') { s = '\\pi'; break; }
        if (n.sym === 'e') { s = 'e'; break; }
        s = fmtNum(n.v); break;
      case 'var': s = n.name.length > 1 ? '\\mathrm{' + n.name + '}' : n.name; break;
      case '+': s = tex(n.a, p) + ' + ' + tex(n.b, p); break;
      case '-': s = tex(n.a, p) + ' - ' + tex(n.b, p + 1); break;
      case '*': {
        var A = tex(n.a, p), B = tex(n.b, p);
        // Отрицательный множитель (например, после сворачивания (3-5) в -2 при
        // пошаговой трассировке) без скобок читается как вычитание: "2 -2"
        // выглядит как "2 минус 2", а не «2, умножить на -2». Оборачиваем в
        // скобки и всегда ставим точку умножения, если это произошло.
        var Awrap = /^-/.test(A) ? '\\left(' + A + '\\right)' : A;
        var Bwrap = /^-/.test(B) ? '\\left(' + B + '\\right)' : B;
        var wrapped = (Awrap !== A) || (Bwrap !== B);
        // между числом и буквой знак умножения не нужен
        var needDot = wrapped || (/[0-9]$/.test(A) && /^[0-9]/.test(B));
        s = Awrap + (needDot ? ' \\cdot ' : ' ') + Bwrap;
        break;
      }
      case '/': return '\\frac{' + tex(n.a, 0) + '}{' + tex(n.b, 0) + '}';
      case '^': s = tex(n.a, p + 1) + '^{' + tex(n.b, 0) + '}'; break;
      case 'neg': s = '-' + tex(n.a, p); break;
      case 'fact': s = tex(n.a, p) + '!'; break;
      case 'fn': {
        if (n.name === 'sqrt') return '\\sqrt{' + tex(n.a, 0) + '}';
        if (n.name === 'abs') return '\\left|' + tex(n.a, 0) + '\\right|';
        var known = ['sin','cos','tan','ln','log','exp','sinh','cosh','tanh','min','max'];
        var nm = known.indexOf(n.name) >= 0 ? '\\' + n.name : '\\mathrm{' + n.name + '}';
        return nm + '\\left(' + tex(n.a, 0) + '\\right)';
      }
      default: s = '?';
    }
    return p < parentPrec ? '\\left(' + s + '\\right)' : s;
  }

  function fmtNum(v, digits) {
    if (!isFinite(v)) return v > 0 ? '\\infty' : '-\\infty';
    if (Number.isInteger(v)) return String(v);
    var r = Number(v.toPrecision(digits || 12));
    return String(r);
  }

  /* ============================ 8. ЧИСЛЕННЫЕ МЕТОДЫ ====================== */
  // Корни на отрезке: сканируем смену знака, добиваем бисекцией.
  // Отдельно ловим ТОЧНОЕ попадание в узел сетки: там prev*cur == 0, а не < 0,
  // и обычная проверка на смену знака такой корень пропускает (например,
  // x² − 4 на [−5, 5] при шаге 0.005 даёт ровно 0 в точках ±2).
  function roots(f, a, b, steps) {
    steps = steps || 2000;
    var out = [], h = (b - a) / steps, prev = f(a), px = a;
    function push(r) {
      if (!isFinite(r)) return;
      for (var i = 0; i < out.length; i++) {
        if (Math.abs(out[i] - r) < Math.max(1e-7, Math.abs(h) * 0.5)) return;
      }
      out.push(r);
    }
    if (prev === 0) push(a);
    for (var i = 1; i <= steps; i++) {
      var x = a + i * h, cur = f(x);
      if (cur === 0) {
        push(x);
      } else if (isFinite(prev) && isFinite(cur) && prev * cur < 0) {
        var lo = px, hi = x;
        for (var k = 0; k < 80; k++) {
          var m = (lo + hi) / 2;
          if (f(lo) * f(m) <= 0) hi = m; else lo = m;
        }
        push((lo + hi) / 2);
      }
      prev = cur; px = x;
    }
    out.sort(function (p, q) { return p - q; });
    return out;
  }
  // Определённый интеграл — Симпсон
  function integrate(f, a, b, n) {
    n = n || 2000; if (n % 2) n++;
    var h = (b - a) / n, s = f(a) + f(b);
    for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }

  /* ------------------------------------------------------- удобная обёртка */
  function compile(src, varName) {
    var ast;
    try { ast = parse(src); } catch (e) { return null; }
    if (!ast) return null;
    var vn = varName || 'x';
    return {
      ast: ast,
      vars: Object.keys(varsIn(ast)),
      at: function (x, extra) {
        var v = extra ? Object.assign({}, extra) : {};
        v[vn] = x;
        return evalAst(ast, v);
      },
      value: function (vars) { return evalAst(ast, vars || {}); },
      tex: function () { return tex(ast, 0); }
    };
  }

  /* ============================================================================
     9. АЛГЕБРАИЧЕСКИЙ МОДУЛЬ
     ----------------------------------------------------------------------------
     Всё, что нужно алгебраическому калькулятору сверх «просто вычислить»:
       • многочлены от одной переменной как массивы коэффициентов [c0,c1,c2,…];
       • линейная форма от НЕСКОЛЬКИХ переменных (для систем);
       • разбор отношения A = B / A < B / A ≤ B и т.д. по строке (не по AST —
         эти знаки не часть арифметической грамматики parse());
       • решение линейных и квадратных уравнений и неравенств с точным ответом;
       • решение линейных систем произвольного размера методом Гаусса, с
         пошаговым протоколом преобразований;
       • пошаговый след вычисления арифметического выражения «по действиям».
     ========================================================================== */

  var EPS = 1e-9;

  /* ---------------------------------------------------- многочлены (1 переменная) */
  function trimPoly(c) {
    c = c.slice();
    while (c.length > 1 && Math.abs(c[c.length - 1]) < EPS) c.pop();
    return c;
  }
  function addPoly(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) r.push((a[i] || 0) + (b[i] || 0));
    return trimPoly(r);
  }
  function subPoly(a, b) { return addPoly(a, b.map(function (c) { return -c; })); }
  function mulPoly(a, b) {
    var r = new Array(a.length + b.length - 1).fill(0);
    for (var i = 0; i < a.length; i++)
      for (var j = 0; j < b.length; j++) r[i + j] += a[i] * b[j];
    return trimPoly(r);
  }
  function hasVar(node, name) {
    if (!node) return false;
    if (node.t === 'var' && node.name === name) return true;
    return hasVar(node.a, name) || hasVar(node.b, name);
  }
  // Пытается представить node как многочлен от переменной v: [c0,c1,c2,...].
  // Возвращает null, если это не многочлен (переменная в показателе степени,
  // под знаком функции, в знаменателе и т.п.) — тогда вызывающий код обязан
  // переключиться на численный путь, а не притворяться, что решил точно.
  function polyOf(node, v) {
    switch (node.t) {
      case 'num': return [node.v];
      case 'var':
        if (node.name === v) return [0, 1];
        return null;   // другая свободная переменная — вне однопеременного случая
      case '+': {
        var a = polyOf(node.a, v), b = polyOf(node.b, v);
        return (a && b) ? addPoly(a, b) : null;
      }
      case '-': {
        var a2 = polyOf(node.a, v), b2 = polyOf(node.b, v);
        return (a2 && b2) ? subPoly(a2, b2) : null;
      }
      case 'neg': {
        var a3 = polyOf(node.a, v);
        return a3 ? a3.map(function (c) { return -c; }) : null;
      }
      case '*': {
        var a4 = polyOf(node.a, v), b4 = polyOf(node.b, v);
        return (a4 && b4) ? mulPoly(a4, b4) : null;
      }
      case '/': {
        if (hasVar(node.b, v)) return null;   // деление на выражение с переменной — не многочлен
        var a5 = polyOf(node.a, v);
        if (!a5) return null;
        var d5;
        try { d5 = evalAst(node.b, {}); } catch (e) { return null; }
        if (!isFinite(d5) || d5 === 0) return null;
        return a5.map(function (c) { return c / d5; });
      }
      case '^': {
        if (!hasVar(node.a, v) && !hasVar(node.b, v)) {
          try { return [evalAst(node, {})]; } catch (e) { return null; }
        }
        if (hasVar(node.b, v)) return null;         // переменная в показателе
        var base = polyOf(node.a, v);
        if (!base) return null;
        var n;
        try { n = evalAst(node.b, {}); } catch (e) { return null; }
        if (!Number.isInteger(n) || n < 0 || n > 12) return null;   // разумный потолок степени
        var result = [1];
        for (var i = 0; i < n; i++) result = mulPoly(result, base);
        return result;
      }
      case 'fn': case 'fact':
        if (hasVar(node.a, v)) return null;
        try { return [evalAst(node, {})]; } catch (e) { return null; }
    }
    return null;
  }
  // Многочлен -> LaTeX в стандартном убывающем виде: 3x^{2} - 2x + 5
  function polyToTex(c, v) {
    var deg = c.length - 1, parts = [];
    for (var p = deg; p >= 0; p--) {
      var coef = c[p];
      if (Math.abs(coef) < EPS) continue;
      var sign = coef < 0 ? '-' : (parts.length ? '+' : '');
      var a = Math.abs(coef);
      var term;
      if (p === 0) term = fmtNum(a);
      else {
        var coefPart = (Math.abs(a - 1) < EPS) ? '' : fmtNum(a) + (Number.isInteger(a) ? '\\cdot ' : '\\cdot ');
        term = coefPart + v + (p > 1 ? '^{' + p + '}' : '');
      }
      parts.push((sign ? sign + ' ' : '') + term);
    }
    return parts.length ? parts.join(' ') : '0';
  }
  function evalPolyAt(c, x) {
    var s = 0;
    for (var i = c.length - 1; i >= 0; i--) s = s * x + c[i];
    return s;
  }

  /* ------------------------------------------- линейная форма от НЕСКОЛЬКИХ переменных
     Для систем: возвращает {const:C, coeffs:{x:.., y:..}} если node — линейное
     (аффинное) выражение по всем именам из varNames; иначе null. */
  function affineOf(node, varNames) {
    switch (node.t) {
      case 'num': return { const: node.v, coeffs: {} };
      case 'var': {
        if (varNames.indexOf(node.name) >= 0) {
          var c = {}; c[node.name] = 1;
          return { const: 0, coeffs: c };
        }
        if (CONSTS[node.name] !== undefined) return { const: CONSTS[node.name], coeffs: {} };
        return null;
      }
      case '+': case '-': {
        var a = affineOf(node.a, varNames), b = affineOf(node.b, varNames);
        if (!a || !b) return null;
        var sign = node.t === '-' ? -1 : 1;
        var coeffs = Object.assign({}, a.coeffs);
        Object.keys(b.coeffs).forEach(function (k) { coeffs[k] = (coeffs[k] || 0) + sign * b.coeffs[k]; });
        return { const: a.const + sign * b.const, coeffs: coeffs };
      }
      case 'neg': {
        var a2 = affineOf(node.a, varNames);
        if (!a2) return null;
        var c2 = {};
        Object.keys(a2.coeffs).forEach(function (k) { c2[k] = -a2.coeffs[k]; });
        return { const: -a2.const, coeffs: c2 };
      }
      case '*': {
        var a3 = affineOf(node.a, varNames), b3 = affineOf(node.b, varNames);
        if (!a3 || !b3) return null;
        var aVars = Object.keys(a3.coeffs).some(function (k) { return Math.abs(a3.coeffs[k]) > EPS; });
        var bVars = Object.keys(b3.coeffs).some(function (k) { return Math.abs(b3.coeffs[k]) > EPS; });
        if (aVars && bVars) return null;   // произведение переменных — не линейно
        var scalar = aVars ? b3.const : a3.const;
        var lin = aVars ? a3 : b3;
        var c3 = {};
        Object.keys(lin.coeffs).forEach(function (k) { c3[k] = lin.coeffs[k] * scalar; });
        return { const: lin.const * scalar, coeffs: c3 };
      }
      case '/': {
        var b4 = affineOf(node.b, varNames);
        if (!b4 || Object.keys(b4.coeffs).some(function (k) { return Math.abs(b4.coeffs[k]) > EPS; })) return null;
        var a4 = affineOf(node.a, varNames);
        if (!a4 || Math.abs(b4.const) < EPS) return null;
        var c4 = {};
        Object.keys(a4.coeffs).forEach(function (k) { c4[k] = a4.coeffs[k] / b4.const; });
        return { const: a4.const / b4.const, coeffs: c4 };
      }
      case '^': {
        var base = affineOf(node.a, varNames), exp = affineOf(node.b, varNames);
        if (!base || !exp) return null;
        var baseHasVar = Object.keys(base.coeffs).some(function (k) { return Math.abs(base.coeffs[k]) > EPS; });
        var expHasVar = Object.keys(exp.coeffs).some(function (k) { return Math.abs(exp.coeffs[k]) > EPS; });
        if (expHasVar) return null;
        if (!baseHasVar) { try { return { const: evalAst(node, {}), coeffs: {} }; } catch (e) { return null; } }
        if (Math.abs(exp.const - 1) < EPS) return base;   // ^1 — не меняет линейность
        return null;   // любая другая степень над переменной — нелинейно
      }
      case 'fn': case 'fact': {
        if (hasVarAny(node.a, varNames)) return null;
        try { return { const: evalAst(node, {}), coeffs: {} }; } catch (e) { return null; }
      }
    }
    return null;
  }
  function hasVarAny(node, names) {
    if (!node) return false;
    if (node.t === 'var' && names.indexOf(node.name) >= 0) return true;
    return hasVarAny(node.a, names) || hasVarAny(node.b, names);
  }

  /* --------------------------------------------- разбор отношения (=, <, >, ≤, ≥, ≠)
     Работает по СТРОКЕ (а не AST), потому что эти знаки не входят в
     арифметическую грамматику parse(). Ищет знак на глубине скобок 0. */
  var REL_OPS = ['≤', '≥', '≠', '<=', '>=', '!=', '=', '<', '>'];
  function splitRelation(str) {
    var depth = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (depth === 0) {
        for (var k = 0; k < REL_OPS.length; k++) {
          var op = REL_OPS[k];
          if (str.substr(i, op.length) === op) {
            var norm = { '<=': '≤', '>=': '≥', '!=': '≠' }[op] || op;
            return { op: norm, lhs: str.slice(0, i), rhs: str.slice(i + op.length) };
          }
        }
      }
    }
    return null;
  }

  /* --------------------------------------------------- решение уравнений/неравенств
     Всегда возвращает {kind, steps:[{tex}], ...}. kind ∈
       'identity' | 'contradiction' | 'linear' | 'quadratic' | 'numeric' */
  function solveEquationPoly(c, v) {
    c = trimPoly(c);
    var deg = c.length - 1;
    var steps = [];
    if (deg <= 0) {
      var isZero = Math.abs(c[0] || 0) < EPS;
      return { kind: isZero ? 'identity' : 'contradiction', steps: steps };
    }
    if (deg === 1) {
      var c0 = c[0], c1 = c[1];
      steps.push({ tex: polyToTex(c, v) + ' = 0' });
      steps.push({ tex: c1 < 0
        ? fmtNum(-c1) + v + ' = ' + fmtNum(c0)
        : fmtNum(c1) + v + ' = ' + fmtNum(-c0) });
      var xVal = -c0 / c1;
      var fr = toFraction(xVal, 100000);
      steps.push({ tex: v + ' = ' + (fr ? R.str(fr) : fmtNum(xVal)) });
      return { kind: 'linear', steps: steps, roots: [xVal], exact: fr ? [fr] : null };
    }
    if (deg === 2) {
      var a = c[2], b = c[1], cc = c[0];
      steps.push({ tex: polyToTex(c, v) + ' = 0' });
      var D = b * b - 4 * a * cc;
      var bTex = b < 0 ? '(' + fmtNum(b) + ')' : fmtNum(b);
      steps.push({ tex: 'D = ' + bTex + '^2 - 4\\cdot ' + fmtNum(a) + '\\cdot ' + fmtNum(cc) + ' = ' + fmtNum(D) });
      if (D < -EPS) {
        steps.push({ tex: 'D < 0 \\Rightarrow' + ' \\text{нет действительных корней}' });
        return { kind: 'quadratic', steps: steps, roots: [], discriminant: D };
      }
      var sqrtD = Math.sqrt(Math.max(0, D));
      var r1 = (-b + sqrtD) / (2 * a), r2 = (-b - sqrtD) / (2 * a);
      var sqrtFrac = toFraction(D, 100000);
      var isPerfectSquare = sqrtFrac && Number.isInteger(Math.sqrt(Math.abs(D))) && D >= 0;
      if (Math.abs(D) < EPS) {
        steps.push({ tex: v + ' = \\frac{-(' + fmtNum(b) + ')}{2\\cdot ' + fmtNum(a) + '} = ' + fmtNum(r1) });
        return { kind: 'quadratic', steps: steps, roots: [r1], discriminant: D };
      }
      steps.push({ tex: v + '_{1,2} = \\frac{-(' + fmtNum(b) + ') \\pm \\sqrt{' + fmtNum(D) + '}}{2\\cdot ' + fmtNum(a) + '}' });
      steps.push({ tex: v + '_1 = ' + fmtNum(r1) + ',\\quad ' + v + '_2 = ' + fmtNum(r2) });
      return {
        kind: 'quadratic', steps: steps, roots: [r1, r2], discriminant: D,
        exactRadical: isPerfectSquare ? null : { b: b, D: D, a2: 2 * a }
      };
    }
    // degree >= 3 — общей формулы не строим; переходим на численный поиск корней
    var rs = roots(function (x) { return evalPolyAt(c, x); }, -1e4, 1e4, 20000);
    steps.push({ tex: polyToTex(c, v) + ' = 0' });
    steps.push({ tex: '\\text{многочлен степени ' + deg + ' — корни найдены численно}' });
    return { kind: 'numeric', steps: steps, roots: rs };
  }

  /* -------------------------------------------- альтернативные способы решения
     квадратного уравнения — тот же принцип «дать выбор метода», что и для
     линейных систем: несколько общеизвестных путей к тому же ответу. */

  // Выделение полного квадрата — работает всегда (в отличие от Виета), даёт
  // ТОТ ЖЕ ответ, что и формула дискриминанта, но другим, тоже стандартным
  // способом вывода — полезно как альтернативная демонстрация метода.
  function solveQuadraticCompleteSquare(c, v) {
    var a = c[2], b = c[1], cc = c[0];
    var steps = [];
    steps.push({ tex: polyToTex(c, v) + ' = 0' });
    var p = b / a, q = cc / a;
    steps.push({ tex: v + '^2' + (p >= 0 ? '+' : '') + fmtNum(p) + v + (q >= 0 ? '+' : '') + fmtNum(q) + '=0' });
    var half = p / 2;
    steps.push({ tex: v + '^2' + (p >= 0 ? '+' : '') + fmtNum(p) + v + '=' + fmtNum(-q) });
    var rhs = -q + half * half;
    steps.push({ tex: '(' + v + (half >= 0 ? '+' : '') + fmtNum(half) + ')^2=' + fmtNum(-q) + '+' + fmtNum(half * half) + '=' + fmtNum(rhs) });
    if (rhs < -1e-9) {
      steps.push({ tex: '\\text{правая часть отрицательна — действительных корней нет}' });
      return { kind: 'quadratic', steps: steps, roots: [], discriminant: rhs * (4 * a * a) };
    }
    var sq = Math.sqrt(Math.max(0, rhs));
    var r1 = -half + sq, r2 = -half - sq;
    if (sq < 1e-9) {
      steps.push({ tex: v + '=' + fmtNum(-half) });
      return { kind: 'quadratic', steps: steps, roots: [r1] };
    }
    steps.push({ tex: v + (half >= 0 ? '+' : '') + fmtNum(half) + '=\\pm' + fmtNum(sq) });
    steps.push({ tex: v + '_1=' + fmtNum(r1) + ',\\quad ' + v + '_2=' + fmtNum(r2) });
    return { kind: 'quadratic', steps: steps, roots: [r1, r2] };
  }

  // Теорема Виета — только для ПРИВЕДЁННОГО уравнения (a=1) с целыми корнями,
  // угадываемыми подбором (ровно то, чему учат под этим названием в школе;
  // для a≠1 или нецелых корней это уже не тот метод — честно не предлагаем).
  function solveQuadraticVieta(c, v) {
    var a = c[2], b = c[1], cc = c[0];
    if (Math.abs(a - 1) > 1e-9) return null;
    var p = b, q = cc, sum = -p, prod = q;
    var found = null;
    for (var x1 = -50; x1 <= 50; x1++) {
      var x2 = sum - x1;
      if (Math.abs(x2 - Math.round(x2)) > 1e-9) continue;
      x2 = Math.round(x2);
      if (Math.abs(x1 * x2 - prod) < 1e-6) { found = [x1, x2]; break; }
    }
    if (!found) return null;
    var steps = [
      { tex: polyToTex(c, v) + ' = 0' },
      { tex: v + '_1+' + v + '_2=' + fmtNum(-p) + ',\\quad ' + v + '_1\\cdot ' + v + '_2=' + fmtNum(q) },
      { tex: v + '_1=' + fmtNum(found[0]) + ',\\quad ' + v + '_2=' + fmtNum(found[1]) }
    ];
    return { kind: 'quadratic', steps: steps, roots: found.slice().sort(function (x, y) { return y - x; }) };
  }

  // Линейное неравенство c1*v + c0 REL 0 — учитывает разворот знака при делении
  // на отрицательное число (частая ошибка школьников и частая проверка).
  function solveInequalityLinear(c, v, op) {
    var c0 = c[0] || 0, c1 = c[1] || 0;
    var steps = [{ tex: polyToTex(c, v) + (op === '≤' ? '\\le' : op === '≥' ? '\\ge' : op) + ' 0' }];
    if (Math.abs(c1) < EPS) {
      var holds = (op === '<' && c0 < 0) || (op === '>' && c0 > 0) ||
                  (op === '≤' && c0 <= EPS) || (op === '≥' && c0 >= -EPS) ||
                  (op === '≠' && Math.abs(c0) > EPS);
      return { kind: holds ? 'identity' : 'contradiction', steps: steps };
    }
    var bound = -c0 / c1;
    var finalOp = op;
    if (c1 < 0) {
      finalOp = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '≠': '≠' }[op];
      steps.push({ tex: '\\text{делим на отрицательное (' + fmtNum(c1) + ') — знак меняется на противоположный}' });
    }
    var fr = toFraction(bound, 100000);
    var boundTex = fr ? R.str(fr) : fmtNum(bound);
    steps.push({ tex: v + (finalOp === '≤' ? '\\le' : finalOp === '≥' ? '\\ge' : finalOp) + ' ' + boundTex });
    return { kind: 'linear', steps: steps, bound: bound, op: finalOp, exact: fr };
  }

  function intervalToTex(op, bound, boundTex) {
    switch (op) {
      case '<': return 'x \\in (-\\infty;\\ ' + boundTex + ')';
      case '≤': return 'x \\in (-\\infty;\\ ' + boundTex + ']';
      case '>': return 'x \\in (' + boundTex + ';\\ +\\infty)';
      case '≥': return 'x \\in [' + boundTex + ';\\ +\\infty)';
      case '≠': return 'x \\ne ' + boundTex;
    }
    return '';
  }

  /* ---------------------------------------- квадратичное неравенство (полная
     разборка по знаку параболы) — с численной самопроверкой на выборочных
     точках, потому что логика разворота знака легко ошибается молча. */
  function solveInequalityQuadratic(c, v, op) {
    var a = c[2], b = c[1], c0 = c[0];
    var steps = [{ tex: polyToTex(c, v) + relTex(op) + ' 0' }];
    var D = b * b - 4 * a * c0;
    steps.push({ tex: 'D = ' + fmtNum(D) });

    if (D < -EPS) {
      // ни одного действительного корня — знак постоянен и равен знаку a
      var always = a > 0 ? 'positive' : 'negative';
      steps.push({ tex: '\\text{корней нет, знак выражения всегда ' + (always === 'positive' ? '«+»' : '«−»') + '}' });
      var wantPos = (op === '>' || op === '≥');
      var wantNeg = (op === '<' || op === '≤');
      var holds = (always === 'positive' && (wantPos || op === '≠')) || (always === 'negative' && (wantNeg || op === '≠'));
      return { kind: 'quadratic', steps: steps, region: holds ? 'all' : 'none', roots: [], discriminant: D };
    }

    var r1, r2;
    if (D < EPS) {
      r1 = r2 = -b / (2 * a);
      steps.push({ tex: v + ' = ' + fmtNum(r1) + ' \\text{(двойной корень)}' });
    } else {
      var sq = Math.sqrt(D);
      r1 = Math.min((-b + sq) / (2 * a), (-b - sq) / (2 * a));
      r2 = Math.max((-b + sq) / (2 * a), (-b - sq) / (2 * a));
      steps.push({ tex: v + '_1 = ' + fmtNum(r1) + ',\\quad ' + v + '_2 = ' + fmtNum(r2) });
    }
    steps.push({ tex: '\\text{знак: ' + (a > 0 ? '«+» вне корней, «−» между ними' : '«−» вне корней, «+» между ними') + '}' });

    var outsidePositive = a > 0;   // при a>0 снаружи «+», внутри «−»; при a<0 наоборот
    var result;
    if (r1 === r2) {
      // касание оси: знак = sign(a) везде, кроме самой точки, где 0
      if (op === '>') result = outsidePositive ? { lo: -Infinity, loInc: false, hi: r1, hiInc: false, hole: r1 } : 'none';
      else if (op === '≥') result = outsidePositive ? 'all' : { lo: r1, loInc: true, hi: r1, hiInc: true };
      else if (op === '<') result = outsidePositive ? 'none' : { lo: -Infinity, loInc: false, hi: r1, hiInc: false, hole: r1 };
      else if (op === '≤') result = outsidePositive ? { lo: r1, loInc: true, hi: r1, hiInc: true } : 'all';
      else result = { neq: [r1] };
    } else if (op === '≠') {
      result = { neq: [r1, r2] };
    } else {
      var wantOutside = (op === '>' || op === '≥') === outsidePositive;
      var inc = (op === '≥' || op === '≤');
      result = wantOutside
        ? [{ lo: -Infinity, loInc: false, hi: r1, hiInc: inc }, { lo: r2, loInc: inc, hi: Infinity, hiInc: false }]
        : { lo: r1, loInc: inc, hi: r2, hiInc: inc };
    }

    return { kind: 'quadratic', steps: steps, region: result, roots: [r1, r2], discriminant: D };
  }
  function relTex(op) { return op === '≤' ? '\\le' : op === '≥' ? '\\ge' : op === '≠' ? '\\ne' : op; }

  /* --------------------------------- общий численный путь: степень ≥3 и
     любые неполиномиальные неравенства (например sin(x)>0). Находим все
     точки смены знака в разумном диапазоне и классифицируем интервалы между
     ними прямой выборкой — без претензии на «красивый» символьный ответ. */
  function solveInequalityNumeric(evalFn, op, lo, hi) {
    lo = lo === undefined ? -1000 : lo; hi = hi === undefined ? 1000 : hi;
    var breakpoints = roots(evalFn, lo, hi, 20000).sort(function (a, b) { return a - b; });
    var bounds = [lo].concat(breakpoints, [hi]);
    var holds = function (v) {
      return op === '>' ? v > EPS : op === '≥' ? v > -EPS : op === '<' ? v < -EPS : op === '≤' ? v < EPS : Math.abs(v) > EPS;
    };
    var segs = [];
    for (var i = 0; i < bounds.length - 1; i++) {
      var mid = (bounds[i] + bounds[i + 1]) / 2;
      if (holds(evalFn(mid))) segs.push({ lo: i === 0 ? -Infinity : bounds[i], hi: i === bounds.length - 2 ? Infinity : bounds[i + 1] });
    }
    // склеиваем соседние интервалы (граница между ними — сам корень, где f=0, обычно не входит)
    var merged = [];
    segs.forEach(function (s) {
      if (merged.length && Math.abs(merged[merged.length - 1].hi - s.lo) < 1e-6) merged[merged.length - 1].hi = s.hi;
      else merged.push(s);
    });
    return { kind: 'numeric', breakpoints: breakpoints, segments: merged };
  }

  /* ---------------------------------------------------- линейные системы (метод Гаусса)
     rows: массив строк affine-объектов {const, coeffs}; varNames: порядок переменных.
     Возвращает {kind:'unique'|'infinite'|'none', values:{var:val}, steps:[{tex}]}. */
  // Одна строка расширенной матрицы -> «2x + 3y = 13» (без слов, только формула)
  function rowToEqTex(row, varNames) {
    var parts = [];
    varNames.forEach(function (vn, j) {
      var coef = row[j];
      if (Math.abs(coef) < 1e-9) return;
      var sign = coef < 0 ? '-' : (parts.length ? '+' : '');
      var a = Math.abs(coef);
      var coefStr = Math.abs(a - 1) < 1e-9 ? '' : fmtNum(a) + '\\cdot ';
      parts.push((sign ? sign + ' ' : '') + coefStr + vn);
    });
    return (parts.length ? parts.join(' ') : '0') + ' = ' + fmtNum(row[row.length - 1]);
  }
  function systemStateTex(M, varNames) {
    return M.map(function (row) { return rowToEqTex(row, varNames); }).join(',\\quad ');
  }
  function solveLinearSystem(affineRows, varNames) {
    var n = affineRows.length, m = varNames.length;
    // расширенная матрица: строка = [coef.. , constant справа]
    var M = affineRows.map(function (r) {
      var row = varNames.map(function (v) { return r.coeffs[v] || 0; });
      row.push(-r.const);   // r.const — это (LHS-RHS) на нулевой правой части, переносим
      return row;
    });
    var steps = [{ tex: systemStateTex(M, varNames) }];
    var row = 0;
    for (var col = 0; col < m && row < n; col++) {
      // выбираем ведущий элемент по модулю (частичный выбор — устойчивее численно);
      // сама перестановка строк местами не меняет систему как таковую, поэтому
      // отдельным шагом не показывается — только реальные преобразования ниже.
      var piv = row;
      for (var i = row + 1; i < n; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i;
      if (Math.abs(M[piv][col]) < 1e-8) continue;   // столбец уже нулевой — свободная переменная
      if (piv !== row) { var tmp = M[piv]; M[piv] = M[row]; M[row] = tmp; }
      var pv = M[row][col];
      if (Math.abs(pv - 1) > 1e-9) {
        M[row] = M[row].map(function (x) { return x / pv; });
        steps.push({ tex: systemStateTex(M, varNames) });
      }
      var eliminated = false;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === row) continue;
        var f = M[r2][col];
        if (Math.abs(f) < 1e-12) continue;
        M[r2] = M[r2].map(function (x, j) { return x - f * M[row][j]; });
        eliminated = true;
      }
      if (eliminated) steps.push({ tex: systemStateTex(M, varNames) });
      row++;
    }
    // анализ ранга: строки вида [0,0,...,0 | c] c≠0 -> противоречие
    for (var i2 = 0; i2 < n; i2++) {
      var allZero = M[i2].slice(0, m).every(function (x) { return Math.abs(x) < 1e-8; });
      if (allZero && Math.abs(M[i2][m]) > 1e-7) return { kind: 'none', steps: steps };
    }
    if (row < m) return { kind: 'infinite', steps: steps };
    var values = {};
    varNames.forEach(function (v, j) { values[v] = M[j][m]; });
    return { kind: 'unique', values: values, steps: steps };
  }

  /* ---------------------------------------------------- метод подстановки
     Только для 2 уравнений/2 переменных — это тот случай, где его вообще
     имеет смысл предлагать как отдельный, узнаваемый школьный метод (для
     большего числа переменных он вырождается в то же самое, что и метод
     Гаусса, просто более многословно). */
  function solveLinearSystemSubstitution(affineRows, varNames) {
    if (affineRows.length !== 2 || varNames.length !== 2) return null;
    var v1 = varNames[0], v2 = varNames[1];
    var r1 = affineRows[0], r2 = affineRows[1];
    var a1 = r1.coeffs[v1] || 0, b1 = r1.coeffs[v2] || 0, c1 = -r1.const;
    var a2 = r2.coeffs[v1] || 0, b2 = r2.coeffs[v2] || 0, c2 = -r2.const;
    // Выражаем ИЗ ПЕРВОГО уравнения ту переменную, у которой там ненулевой
    // коэффициент (обычно v1; если его коэффициент нулевой — берём v2).
    var exprVar, otherVar, kExpr, kOther, cst, useEq2ForRest;
    if (Math.abs(a1) > 1e-9) { exprVar = v1; otherVar = v2; kExpr = a1; kOther = b1; cst = c1; }
    else if (Math.abs(b1) > 1e-9) { exprVar = v2; otherVar = v1; kExpr = b1; kOther = a1; cst = c1; }
    else return null;   // первое уравнение вырождено (0=const) — методу подстановки взяться не за что
    var steps = [];
    // exprVar = (cst - kOther*otherVar) / kExpr
    steps.push({ tex: exprVar + ' = \\frac{' + fmtNum(cst) + (kOther >= 0 ? ' - ' : ' + ') + fmtNum(Math.abs(kOther)) + otherVar + '}{' + fmtNum(kExpr) + '}' });
    // подставляем в ВТОРОЕ уравнение: коэффициент при otherVar там,
    // коэффициент при exprVar там, и константа
    var otherCoefInEq2 = otherVar === v1 ? a2 : b2;
    var exprCoefInEq2 = exprVar === v1 ? a2 : b2;
    // exprCoefInEq2 * ((cst - kOther*otherVar)/kExpr) + otherCoefInEq2*otherVar = c2
    // => (otherCoefInEq2 - exprCoefInEq2*kOther/kExpr) * otherVar = c2 - exprCoefInEq2*cst/kExpr
    var newCoef = otherCoefInEq2 - (exprCoefInEq2 * kOther) / kExpr;
    var newConst = c2 - (exprCoefInEq2 * cst) / kExpr;
    steps.push({ tex: fmtNum(exprCoefInEq2) + '\\cdot \\frac{' + fmtNum(cst) + (kOther >= 0 ? ' - ' : ' + ') + fmtNum(Math.abs(kOther)) + otherVar + '}{' + fmtNum(kExpr) + '}'
      + (otherCoefInEq2 >= 0 ? ' + ' : ' - ') + fmtNum(Math.abs(otherCoefInEq2)) + otherVar + ' = ' + fmtNum(c2) });
    steps.push({ tex: fmtNum(newCoef) + otherVar + ' = ' + fmtNum(newConst) });
    if (Math.abs(newCoef) < 1e-9) {
      return Math.abs(newConst) < 1e-7 ? { kind: 'infinite', steps: steps } : { kind: 'none', steps: steps };
    }
    var otherVal = newConst / newCoef;
    steps.push({ tex: otherVar + ' = ' + fmtNum(otherVal) });
    var exprVal = (cst - kOther * otherVal) / kExpr;
    steps.push({ tex: exprVar + ' = ' + fmtNum(exprVal) });
    var values = {}; values[exprVar] = exprVal; values[otherVar] = otherVal;
    return { kind: 'unique', values: values, steps: steps };
  }

  /* ---------------------------------------------------- метод сложения
     (алгебраическое сложение / метод исключения) — тоже только для 2×2:
     домножаем уравнения так, чтобы коэффициенты при одной из переменных
     стали противоположными, и складываем, чтобы её исключить. */
  function solveLinearSystemElimination(affineRows, varNames) {
    if (affineRows.length !== 2 || varNames.length !== 2) return null;
    var v1 = varNames[0], v2 = varNames[1];
    var r1 = affineRows[0], r2 = affineRows[1];
    var a1 = r1.coeffs[v1] || 0, b1 = r1.coeffs[v2] || 0, c1 = -r1.const;
    var a2 = r2.coeffs[v1] || 0, b2 = r2.coeffs[v2] || 0, c2 = -r2.const;
    // "a·v1 (+/-) |b|·v2" — без этого при отрицательном b получалось бы
    // визуально спутанное "+ -2y" вместо привычного "- 2y".
    function twoTermTex(a, va, b, vb) {
      return fmtNum(a) + va + (b >= 0 ? ' + ' : ' - ') + fmtNum(Math.abs(b)) + vb;
    }
    var steps = [];
    // Домножаем первое уравнение на a2, второе — на a1; вычитаем, чтобы
    // исключить v1. (Общий, всегда работающий приём — не гонимся за красивым
    // НОК коэффициентов, честная арифметика важнее.)
    steps.push({ tex: '(' + fmtNum(a2) + ')\\cdot(' + twoTermTex(a1, v1, b1, v2) + ') - (' + fmtNum(a1) + ')\\cdot(' + twoTermTex(a2, v1, b2, v2) + ')' +
      ' = ' + fmtNum(a2) + '\\cdot ' + fmtNum(c1) + ' - ' + fmtNum(a1) + '\\cdot ' + fmtNum(c2) });
    var newCoef = b1 * a2 - b2 * a1;
    var newConst = c1 * a2 - c2 * a1;
    steps.push({ tex: fmtNum(newCoef) + v2 + ' = ' + fmtNum(newConst) });
    if (Math.abs(newCoef) < 1e-9) {
      return Math.abs(newConst) < 1e-7 ? { kind: 'infinite', steps: steps } : { kind: 'none', steps: steps };
    }
    var v2val = newConst / newCoef;
    steps.push({ tex: v2 + ' = ' + fmtNum(v2val) });
    // подставляем в первое исходное уравнение, чтобы найти v1
    if (Math.abs(a1) < 1e-9) return null;   // вырождено — не наш случай (методу подстановки/Гаусса решать)
    var v1val = (c1 - b1 * v2val) / a1;
    steps.push({ tex: fmtNum(a1) + v1 + ' = ' + fmtNum(c1) + (b1 >= 0 ? ' - ' : ' + ') + fmtNum(Math.abs(b1)) + '\\cdot(' + fmtNum(v2val) + ')' });
    steps.push({ tex: v1 + ' = ' + fmtNum(v1val) });
    var values = {}; values[v1] = v1val; values[v2] = v2val;
    return { kind: 'unique', values: values, steps: steps };
  }

  /* ---------------------------------------------------- метод Крамера
     Общий для любого N×N (квадратная система): xᵢ = det(Mᵢ)/det(M), где Mᵢ —
     матрица коэффициентов с i-м столбцом, заменённым на столбец констант. */
  function detGeneric(A) {
    var n = A.length;
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    var det = 0;
    for (var j = 0; j < n; j++) {
      var minor = A.slice(1).map(function (row) { return row.filter(function (_, k) { return k !== j; }); });
      det += (j % 2 === 0 ? 1 : -1) * A[0][j] * detGeneric(minor);
    }
    return det;
  }
  function solveLinearSystemCramer(affineRows, varNames) {
    var n = affineRows.length, m = varNames.length;
    if (n !== m) return null;   // метод Крамера — только для квадратных систем
    var A = affineRows.map(function (r) { return varNames.map(function (v) { return r.coeffs[v] || 0; }); });
    var b = affineRows.map(function (r) { return -r.const; });
    var D = detGeneric(A);
    var steps = [{ tex: 'D = ' + fmtNum(D) }];
    if (Math.abs(D) < 1e-9) {
      // при D=0 метод Крамера сам по себе не различает «нет решений» и
      // «бесконечно много» — этот случай честно оставляем методу Гаусса
      return null;
    }
    var values = {};
    for (var i = 0; i < m; i++) {
      var Ai = A.map(function (row, r) { var copy = row.slice(); copy[i] = b[r]; return copy; });
      var Di = detGeneric(Ai);
      steps.push({ tex: 'D_{' + varNames[i] + '} = ' + fmtNum(Di) });
      values[varNames[i]] = Di / D;
      steps.push({ tex: varNames[i] + ' = \\frac{D_{' + varNames[i] + '}}{D} = ' + fmtNum(values[varNames[i]]) });
    }
    return { kind: 'unique', values: values, steps: steps };
  }

  /* ---------------------------------------------------- матричный метод
     X = A⁻¹B — тоже общий для любого N×N квадратной системы, как и Крамер
     (собственно, для 2×2 это ровно та же формула, только по-другому
     оформленная). Саму A⁻¹ поэлементно не расписываем — для N>2 это разрослось
     бы в длинную выкладку по каждому элементу; показываем определяющую
     формулу метода и прямые числовые результаты, как и «Полный квадрат». */
  function invGeneric(A) {
    var n = A.length;
    if (Math.abs(detGeneric(A)) < 1e-10) return null;
    var M = A.map(function (row, i) { return row.concat(row.map(function (_, j) { return i === j ? 1 : 0; })); });
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (var i = col + 1; i < n; i++) if (Math.abs(M[i][col]) > Math.abs(M[piv][col])) piv = i;
      var tmp = M[piv]; M[piv] = M[col]; M[col] = tmp;
      var pv = M[col][col];
      M[col] = M[col].map(function (x) { return x / pv; });
      for (var r = 0; r < n; r++) { if (r === col) continue; var f = M[r][col]; M[r] = M[r].map(function (x, j) { return x - f * M[col][j]; }); }
    }
    return M.map(function (row) { return row.slice(n); });
  }
  function solveLinearSystemMatrix(affineRows, varNames) {
    var n = affineRows.length, m = varNames.length;
    if (n !== m) return null;   // матричный метод — тоже только для квадратных систем
    var A = affineRows.map(function (r) { return varNames.map(function (v) { return r.coeffs[v] || 0; }); });
    var b = affineRows.map(function (r) { return -r.const; });
    var D = detGeneric(A);
    var steps = [{ tex: 'X = A^{-1}B' }, { tex: '\\det(A) = ' + fmtNum(D) }];
    if (Math.abs(D) < 1e-9) return null;   // вырожденная матрица — как и Крамер, честно отдаём методу Гаусса
    var inv = invGeneric(A);
    var values = {};
    varNames.forEach(function (v, i) {
      var xi = 0;
      for (var j = 0; j < n; j++) xi += inv[i][j] * b[j];
      values[v] = xi;
      steps.push({ tex: v + ' = ' + fmtNum(xi) });
    });
    return { kind: 'unique', values: values, steps: steps };
  }

  /* ------------------------------------------------- пошаговый след вычисления
     «По действиям»: на каждом шаге сворачиваем ОДНО готовое (все листья —
     числа) поддерево к его значению, в порядке обычного приоритета операций
     (сначала функции/степени/скобки, затем * и /, затем + и −), и фиксируем
     TeX всего выражения целиком после этой замены — как в тетради. */
  function traceEvalSteps(ast, maxSteps) {
    maxSteps = maxSteps || 25;
    var steps = [{ tex: tex(ast, 0) }];
    var cur = JSON.parse(JSON.stringify(ast));   // рабочая копия, чтобы не портить исходник

    function isPureNum(n) { return n.t === 'num'; }
    function rank(n) {   // приоритет «готовности к сворачиванию» — меньше = раньше
      if (n.t === 'fn' || n.t === 'fact' || n.t === '^' || n.t === 'neg') return 0;
      if (n.t === '*' || n.t === '/') return 1;
      return 2;   // + -
    }
    // находит узел с обоими детьми-числами (готовый к вычислению), с наилучшим rank
    function findReducible(n) {
      if (!n || n.t === 'num' || n.t === 'var') return null;
      var kids = ['a', 'b'].map(function (k) { return n[k]; }).filter(Boolean);
      for (var i = 0; i < kids.length; i++) {
        var found = findReducible(kids[i]);
        if (found) return found;
      }
      var ready = (n.t === 'fn' || n.t === 'fact' || n.t === 'neg')
        ? isPureNum(n.a)
        : (n.a && n.b) ? (isPureNum(n.a) && isPureNum(n.b)) : false;
      return ready ? n : null;
    }
    for (var iter = 0; iter < maxSteps; iter++) {
      var target = findReducible(cur);
      if (!target) break;
      var val;
      try { val = evalAst(target, {}); } catch (e) { break; }
      target.t = 'num'; target.v = val; delete target.a; delete target.b; delete target.name;
      steps.push({ tex: tex(cur, 0) });
      if (cur.t === 'num') break;
    }
    return steps;
  }

  /* -------------------------------------------------- итог: точная дробь/корень */
  function decimalTerminates(fr) {
    // конечная десятичная запись <=> знаменатель несократимой дроби раскладывается
    // только на 2 и 5 (десятичная система = основание 2·5)
    var d = Math.abs(Math.round(fr.d));
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }
  function exactAnswerTex(value) {
    if (!isFinite(value)) return null;
    // Метод Гаусса и другие численные пути иногда дают вместо целого что-то
    // вроде 3.0000000000000004 — Number.isInteger() такое не ловит, а показывать
    // это как «дробь» или длинное приближение не нужно: аккуратно снимаем шум
    // плавающей точки, если значение и так на волосок от целого.
    var rounded = Math.round(value);
    if (Math.abs(value - rounded) < 1e-9) value = rounded;
    if (Number.isInteger(value)) return { exact: String(value), approx: null, isExactDecimal: true };
    // Значения здесь — ВСЕГДА результат вычисления (не то, что пользователь
    // напечатал вручную с ограниченной точностью), поэтому допуск на «похоже на
    // дробь» берём строгим (иначе, скажем, √50 при знаменателе до 100000
    // случайно находит какую-то близкую дробь и вместо 5√2 выдаёт мусор).
    var fr = toFraction(value, 100000, 1e-11);
    if (fr && fr.d !== 1) return { exact: '\\frac{' + fr.n + '}{' + fr.d + '}', approx: fmtNum(value, 10), isExactDecimal: decimalTerminates(fr) };
    // корень из рационального числа — с вынесением точного квадратного множителя
    // (√50 -> 5√2, а не необлегчённый √50), тем же приёмом, что и для корней
    // квадратного уравнения.
    var sq = value * value, sqFr = toFraction(sq, 100000, 1e-11);
    if (sqFr && Number.isInteger(sqFr.n) && Number.isInteger(sqFr.d) && sqFr.d === 1) {
      var rad = simplifyRadical(sqFr.n);
      if (rad) {
        var tex = rad.inner === 1 ? fmtNum(rad.coef)
          : (rad.coef === 1 ? '' : fmtNum(rad.coef)) + '\\sqrt{' + fmtNum(rad.inner) + '}';
        return { exact: tex, approx: fmtNum(value, 10), isExactDecimal: false };
      }
    }
    if (sqFr && Number.isInteger(sqFr.n) && Number.isInteger(sqFr.d)) {
      var underRoot = sqFr.n / sqFr.d;
      return { exact: '\\sqrt{' + fmtNum(underRoot) + '}', approx: fmtNum(value, 10), isExactDecimal: false };
    }
    return { exact: fmtNum(value, 10), approx: null, isExactDecimal: true };
  }

  /* ---------------------------------- радикал: вынос точного квадратного
     множителя из-под корня. √n = coef·√inner, inner — свободно от квадратов.
     Нужен отдельно от exactAnswerTex, потому что корни квадратного уравнения
     (-b±√D)/2a — это не «чистый» √rational, а линейное преобразование корня,
     и просто глядя на десятичное значение такую форму не восстановить: нужны
     сами b, D, 2a символьно. */
  function simplifyRadical(n) {
    n = Math.round(n);
    if (n < 0 || !isFinite(n)) return null;
    if (n === 0) return { coef: 0, inner: 0 };
    var coef = 1, inner = n;
    for (var p = 2; p * p <= inner; p++) {
      while (inner % (p * p) === 0) { inner /= (p * p); coef *= p; }
    }
    return { coef: coef, inner: inner };
  }

  /* ============================ 1б. ТОЧНАЯ АРИФМЕТИКА НАД КВАДРАТИЧНЫМИ
     ИРРАЦИОНАЛЬНОСТЯМИ (SurdNum)
     ----------------------------------------------------------------------------
     «Символьный» калькулятор до этой правки был символьным только по названию:
     любое число без переменных считалось как plain double, а точная форма
     ответа восстанавливалась ПОСЛЕ, простым угадыванием по десятичному
     значению (дробь? корень?). Для сумм и произведений корней (типичный
     случай — избавление от иррациональности в знаменателе, «1/(√5−2)») такое
     угадывание в принципе не работает: результат «2+√5» и его квадрат
     ОБА иррациональны, под шаблон «одна дробь» или «один корень» не подходят.

     SurdNum — число вида Σ cᵢ·√nᵢ (сумма рациональных кратных квадратных
     корней, nᵢ — целые ≥0, n=1 означает «просто рациональное слагаемое»,
     эти слагаемые схлопываются в него автоматически). Арифметика:
       + , − , отрицание — тривиально, складываем коэффициенты при ОДИНАКОВОМ n;
       × — раскрываем произведение сумм, √a·√b=√(ab), затем выносим точный
           квадрат из-под корня (переиспользуем simplifyRadical);
       ÷ — если делитель рационален, просто делим коэффициенты; если у
           делителя РОВНО ОДИН иррациональный член (форма p ± q√n) —
           домножаем числитель и знаменатель на сопряжённое (p ∓ q√n), что
           убирает корень из знаменателя (та самая методика «избавления от
           иррациональности»); если иррациональных членов несколько разных
           (√2+√3 и т.п.) — рационализация специальным сопряжённым уже не
           тривиальна, честно возвращаем null и вызывающий код откатывается
           на приближённое число.
     Вычисляется целиком РЕКУРСИВНО ПО AST (evalSurd), а не восстанавливается
     из готового double — поэтому и работает именно там, где угадывание
     по значению не может: составные выражения с несколькими корнями.
     ========================================================================== */
  function surdTrim(terms) {
    var byRad = {};
    terms.forEach(function (t) {
      if (t.coef.n === 0) return;
      var key = String(t.rad);
      byRad[key] = byRad[key] ? R.add(byRad[key], t.coef) : t.coef;
    });
    var out = [];
    Object.keys(byRad).forEach(function (k) {
      if (byRad[k].n !== 0) out.push({ coef: byRad[k], rad: Number(k) });
    });
    out.sort(function (a, b) { return a.rad - b.rad; });
    return out;
  }
  function surdRat(fr) { return fr.n === 0 ? [] : [{ coef: fr, rad: 1 }]; }
  function surdInt(n) { return surdRat(Frac(n, 1)); }
  function surdSqrtInt(n) {
    if (n < 0) return null;   // мнимость — вне этой системы
    var rad = simplifyRadical(n);
    if (!rad) return null;
    if (rad.inner === 1) return surdRat(Frac(rad.coef, 1));   // точный квадрат — рационально
    return [{ coef: Frac(rad.coef, 1), rad: rad.inner }];
  }
  function surdAdd(a, b) { return surdTrim(a.concat(b)); }
  function surdNeg(a) { return a.map(function (t) { return { coef: Frac(-t.coef.n, t.coef.d), rad: t.rad }; }); }
  function surdSub(a, b) { return surdAdd(a, surdNeg(b)); }
  function surdMulRat(a, fr) {
    if (fr.n === 0) return [];
    return surdTrim(a.map(function (t) { return { coef: R.mul(t.coef, fr), rad: t.rad }; }));
  }
  function surdMul(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) {
      for (var j = 0; j < b.length; j++) {
        var radProd = a[i].rad * b[j].rad;
        var simp = simplifyRadical(radProd);
        if (!simp) return null;
        var coef = R.mul(a[i].coef, R.mul(b[j].coef, Frac(simp.coef, 1)));
        out.push({ coef: coef, rad: simp.inner });
      }
    }
    return surdTrim(out);
  }
  function surdIsRational(a) { return a.length === 0 || (a.length === 1 && a[0].rad === 1); }
  function surdDiv(a, b) {
    if (surdIsRational(b)) {
      if (!b.length) return null;   // деление на 0
      return surdMulRat(a, R.div(Frac(1, 1), b[0].coef));
    }
    // ровно один иррациональный член (плюс, может быть, рациональный) —
    // домножаем на сопряжённое, чтобы вынести корень из знаменателя
    var irr = b.filter(function (t) { return t.rad !== 1; });
    if (irr.length !== 1) return null;   // несколько разных корней — не тривиальная рационализация
    var conj = b.map(function (t) { return t.rad === irr[0].rad ? { coef: Frac(-t.coef.n, t.coef.d), rad: t.rad } : t; });
    var num2 = surdMul(a, conj);
    var den2 = surdMul(b, conj);
    if (!num2 || !den2 || !surdIsRational(den2)) return null;
    return surdDiv(num2, den2);
  }
  function surdToNumber(a) {
    var s = 0;
    a.forEach(function (t) { s += R.num(t.coef) * Math.sqrt(t.rad); });
    return s;
  }
  function surdToTex(a) {
    if (!a.length) return '0';
    var parts = a.map(function (t, i) {
      var neg = t.coef.n < 0;
      var mag = { n: Math.abs(t.coef.n), d: t.coef.d };
      var magTex = mag.d === 1 ? String(mag.n) : '\\frac{' + mag.n + '}{' + mag.d + '}';
      var body;
      if (t.rad === 1) body = magTex;
      else {
        var coefTex = (mag.n === 1 && mag.d === 1) ? '' : magTex + '\\cdot ';
        body = coefTex + '\\sqrt{' + t.rad + '}';
      }
      // Первый член: минус лепится вплотную к числу ("-1", не "- 1"); каждый
      // следующий член — обычное "a + b" / "a - b" с пробелами вокруг знака.
      return i === 0 ? (neg ? '-' : '') + body : (neg ? ' - ' : ' + ') + body;
    });
    return parts.join('');
  }
  // Рекурсивно вычисляет узел AST в системе SurdNum; null — если где-то в
  // выражении встретилось что-то за пределами системы (переменная, sin/log,
  // π/e, отрицательное подкоренное, несколько разных корней в знаменателе
  // дроби и т.п.) — тогда вызывающий код просто использует обычное double.
  function evalSurd(node) {
    switch (node.t) {
      case 'num': {
        if (node.sym) return null;
        if (Number.isInteger(node.v)) return surdInt(node.v);
        var fr = toFraction(node.v, 1000000, 1e-13);
        return fr ? surdRat(fr) : null;
      }
      case '+': { var A = evalSurd(node.a), B = evalSurd(node.b); return (A && B) ? surdAdd(A, B) : null; }
      case '-': { var A2 = evalSurd(node.a), B2 = evalSurd(node.b); return (A2 && B2) ? surdSub(A2, B2) : null; }
      case 'neg': { var A3 = evalSurd(node.a); return A3 ? surdNeg(A3) : null; }
      case '*': { var A4 = evalSurd(node.a), B4 = evalSurd(node.b); return (A4 && B4) ? surdMul(A4, B4) : null; }
      case '/': { var A5 = evalSurd(node.a), B5 = evalSurd(node.b); return (A5 && B5) ? surdDiv(A5, B5) : null; }
      case '^': {
        var base = evalSurd(node.a);
        if (!base) return null;
        var expVal;
        try { expVal = evalAst(node.b, {}); } catch (e) { return null; }
        if (!Number.isInteger(expVal) || expVal < 0 || expVal > 8) return null;
        var res = surdInt(1);
        for (var i = 0; i < expVal; i++) { res = surdMul(res, base); if (!res) return null; }
        return res;
      }
      case 'fn': {
        if (node.name !== 'sqrt') return null;
        var inner = evalSurd(node.a);
        if (!inner || !surdIsRational(inner)) return null;   // корень из уже иррационального — вне системы
        if (!inner.length) return [];   // sqrt(0)
        var fr2 = inner[0].coef;
        if (fr2.n < 0) return null;
        if (fr2.d === 1) return surdSqrtInt(fr2.n);
        var scaled = surdSqrtInt(fr2.n * fr2.d);   // sqrt(p/q) = sqrt(pq)/q
        return scaled ? surdMulRat(scaled, Frac(1, fr2.d)) : null;
      }
      default: return null;
    }
  }

  // Один корень квадратного уравнения x = (-b ± √D) / a2 в точном виде.
  // Если D — точный квадрат, корень рационален — сокращаем обычную дробь.
  // Иначе выносим квадратный множитель из-под корня и сокращаем НОД между
  // (−b), коэффициентом при корне и знаменателем — тогда "2±2√2)/2" честно
  // упрощается до "1±√2", а не остаётся неприведённым.
  function quadraticRootTex(b, D, a2, sign) {
    var negB = -b;
    if (Number.isInteger(D) && Number.isInteger(Math.sqrt(D))) {
      var sq = Math.round(Math.sqrt(D));
      var numer = negB + sign * sq;
      if (Math.abs(numer) < EPS) return '0';
      var g = gcd(Math.round(Math.abs(numer)), Math.round(Math.abs(a2))) || 1;
      var n2 = numer / g, d2 = a2 / g;
      if (d2 < 0) { n2 = -n2; d2 = -d2; }
      return d2 === 1 ? fmtNum(n2) : ('\\frac{' + fmtNum(n2) + '}{' + fmtNum(d2) + '}');
    }
    var rad = simplifyRadical(D);
    if (!rad) return fmtNum((negB + sign * Math.sqrt(D)) / a2, 10);   // защитный откат
    // сокращаем общий множитель между |negB|, rad.coef и |a2| — чтобы
    // "(2 + 2√2)/2" стало "1 + √2", а не осталось громоздким.
    var g2 = gcd(gcd(Math.round(Math.abs(negB)) || 0, rad.coef) || 1, Math.round(Math.abs(a2)) || 1) || 1;
    var bb = negB / g2, cc = rad.coef / g2, dd = a2 / g2;
    if (dd < 0) { bb = -bb; cc = -cc; dd = -dd; }
    var sqrtTex = (cc === 1 ? '' : fmtNum(cc)) + '\\sqrt{' + fmtNum(rad.inner) + '}';
    var numerTex = (bb === 0 ? '' : fmtNum(bb) + ' ') + (sign > 0 ? '+' : '-') + ' ' + sqrtTex;
    return dd === 1 ? numerTex : ('\\frac{' + numerTex + '}{' + fmtNum(dd) + '}');
  }

  // Универсальный рендер результата неравенства (интервал/объединение/особые случаи) в TeX
  function boundTex(v) {
    if (v === Infinity) return '+\\infty';
    if (v === -Infinity) return '-\\infty';
    var fr = toFraction(v, 100000);
    return fr ? R.str(fr) : fmtNum(v);
  }
  function oneIntervalTex(iv) {
    var L = iv.loInc ? '[' : '(', R2 = iv.hiInc ? ']' : ')';
    return L + boundTex(iv.lo) + ';\\ ' + boundTex(iv.hi) + R2;
  }
  function regionToTex(region) {
    if (region === 'all') return 'x \\in \\mathbb{R}';
    if (region === 'none') return '\\text{нет решений}';
    if (region && region.neq) {
      return region.neq.length === 1
        ? 'x \\ne ' + boundTex(region.neq[0])
        : 'x \\ne ' + boundTex(region.neq[0]) + '\\ \\text{и}\\ x \\ne ' + boundTex(region.neq[1]);
    }
    // "x ∈" пишется ОДИН раз для всего региона, а не перед каждым интервалом
    // объединения — иначе для "вне корней" получалось бы «x∈(...) ∪ x∈(...)».
    if (Array.isArray(region)) return 'x \\in ' + region.map(oneIntervalTex).join('\\ \\cup\\ ');
    if (region && region.lo !== undefined) return 'x \\in ' + oneIntervalTex(region);
    return '';
  }

  /* ============================ 9. КОМПЛЕКСНЫЕ ЧИСЛА =====================
     Параллельный «движок» — как и SurdNum, отдельный слой поверх того же
     AST, а не переделка evalAst под комплексные значения (это сломало бы
     все существующие вещественные калькуляторы). Комплексное число — плоский
     {re, im} (обычные double, без точной символьной части — в отличие от
     SurdNum, точная арифметика ещё и с мнимой компонентой была бы отдельным
     большим проектом; double с разумным округлением на выводе достаточно для
     калькулятора комплексных чисел).
     ========================================================================== */
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cDiv(a, b) { var d = b.re * b.re + b.im * b.im; if (d === 0) return null; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; }
  function cNeg(a) { return { re: a.re === 0 ? 0 : -a.re, im: a.im === 0 ? 0 : -a.im }; }
  function cAbs(a) { return Math.sqrt(a.re * a.re + a.im * a.im); }
  function cArg(a) {
    // Math.atan2 различает +0 и -0 (разные ветви на отрицательной вещественной
    // оси) — но «минус ноль» здесь обычно всего лишь шум от -1*0 где-то по
    // цепочке вычислений, а не осмысленный отдельный случай. Нормализуем,
    // иначе sqrt(-1) и подобные молча получают корень с неверным знаком.
    return Math.atan2(a.im === 0 ? 0 : a.im, a.re === 0 ? 0 : a.re);
  }
  function cConj(a) { return { re: a.re, im: -a.im }; }
  function cFromPolar(r, theta) { return { re: r * Math.cos(theta), im: r * Math.sin(theta) }; }
  function cIsZero(a, eps) { eps = eps || 1e-9; return Math.abs(a.re) < eps && Math.abs(a.im) < eps; }
  function cPowInt(a, n) {
    if (n === 0) return { re: 1, im: 0 };
    if (n < 0) { var inv = cDiv({ re: 1, im: 0 }, a); return inv ? cPowInt(inv, -n) : null; }
    var r = { re: 1, im: 0 };
    for (var i = 0; i < n; i++) r = cMul(r, a);
    return r;
  }
  function cSqrt(a) { var r = cAbs(a), theta = cArg(a); var sr = Math.sqrt(r); return cFromPolar(sr, theta / 2); }
  function cRoots(a, n) {
    var r = cAbs(a), theta = cArg(a), rr = Math.pow(r, 1 / n), out = [];
    for (var k = 0; k < n; k++) out.push(cFromPolar(rr, (theta + 2 * Math.PI * k) / n));
    return out;
  }
  function complexToTex(c, eps) {
    eps = eps || 1e-9;
    var re = Math.abs(c.re) < eps ? 0 : c.re, im = Math.abs(c.im) < eps ? 0 : c.im;
    if (im === 0) return fmtNum(re);
    if (re === 0) return (im === 1 ? '' : (im === -1 ? '-' : fmtNum(im))) + 'i';
    var imPart = (Math.abs(im) === 1 ? 'i' : fmtNum(Math.abs(im)) + 'i');
    return fmtNum(re) + (im > 0 ? ' + ' : ' - ') + imPart;
  }
  // Рекурсивный вычислитель по AST в комплексных числах. 'i' — не переменная
  // и не CONST (в общей таблице констант её нет намеренно, чтобы не задеть
  // вещественные калькуляторы) — распознаётся здесь явно. null — если где-то
  // встретилось нечто за пределами системы (переменная кроме 'i' без
  // подстановки, нецелая/непонятная степень и т.п.).
  function evalComplex(node, vars) {
    vars = vars || {};
    switch (node.t) {
      case 'num': return { re: node.v, im: 0 };
      case 'var': {
        if (node.name === 'i') return { re: 0, im: 1 };
        if (node.name in vars) { var v = vars[node.name]; return (typeof v === 'object') ? v : { re: v, im: 0 }; }
        if (CONSTS[node.name] !== undefined) return { re: CONSTS[node.name], im: 0 };
        return null;
      }
      case '+': { var A = evalComplex(node.a, vars), B = evalComplex(node.b, vars); return (A && B) ? cAdd(A, B) : null; }
      case '-': { var A2 = evalComplex(node.a, vars), B2 = evalComplex(node.b, vars); return (A2 && B2) ? cSub(A2, B2) : null; }
      case '*': { var A3 = evalComplex(node.a, vars), B3 = evalComplex(node.b, vars); return (A3 && B3) ? cMul(A3, B3) : null; }
      case '/': { var A4 = evalComplex(node.a, vars), B4 = evalComplex(node.b, vars); return (A4 && B4) ? cDiv(A4, B4) : null; }
      case 'neg': { var A5 = evalComplex(node.a, vars); return A5 ? cNeg(A5) : null; }
      case 'fact': return null;   // факториал от комплексного — вне системы
      case '^': {
        var base = evalComplex(node.a, vars);
        if (!base) return null;
        var expVal;
        try { expVal = evalAst(node.b, {}); } catch (e) { return null; }
        if (Number.isInteger(expVal)) return cPowInt(base, expVal);
        if (Math.abs(expVal - 0.5) < 1e-12) return cSqrt(base);
        return null;   // общая нецелая комплексная степень (через логарифм) — вне системы
      }
      case 'fn': {
        var arg = evalComplex(node.a, vars);
        if (!arg) return null;
        switch (node.name) {
          case 'sqrt': return cSqrt(arg);
          case 'conj': return cConj(arg);
          case 'abs': return { re: cAbs(arg), im: 0 };
          case 'arg': return { re: cArg(arg), im: 0 };
          case 're': return { re: arg.re, im: 0 };
          case 'im': return { re: arg.im, im: 0 };
          default: return null;   // sin/cos/log и т.п. от комплексного — вне этой системы
        }
      }
      default: return null;
    }
  }
  // Есть ли в дереве 'i' — используется для автоопределения формата ответа
  // (стоит ли вообще пробовать комплексную ветку) в вызывающем коде.
  function hasImaginary(node) {
    if (!node) return false;
    if (node.t === 'var' && node.name === 'i') return true;
    return hasImaginary(node.a) || hasImaginary(node.b);
  }

  /* ---- многочлен от ОДНОЙ переменной (не 'i'!) с комплексными
     коэффициентами — 'i' сворачивается как обычная комплексная константа,
     ровно как polyOf сворачивает числа. Структура один в один с polyOf. */
  function cPolyAdd(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) r.push(cAdd(a[i] || { re: 0, im: 0 }, b[i] || { re: 0, im: 0 }));
    return r;
  }
  function cPolySub(a, b) {
    var n = Math.max(a.length, b.length), r = [];
    for (var i = 0; i < n; i++) r.push(cSub(a[i] || { re: 0, im: 0 }, b[i] || { re: 0, im: 0 }));
    return r;
  }
  function cPolyMul(a, b) {
    var r = new Array(a.length + b.length - 1).fill(null).map(function () { return { re: 0, im: 0 }; });
    for (var i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] = cAdd(r[i + j], cMul(a[i], b[j]));
    return r;
  }
  function complexPolyOf(node, v) {
    switch (node.t) {
      case 'num': return [{ re: node.v, im: 0 }];
      case 'var':
        if (node.name === v) return [{ re: 0, im: 0 }, { re: 1, im: 0 }];
        if (node.name === 'i') return [{ re: 0, im: 1 }];
        if (CONSTS[node.name] !== undefined) return [{ re: CONSTS[node.name], im: 0 }];
        return null;
      case '+': { var A = complexPolyOf(node.a, v), B = complexPolyOf(node.b, v); return (A && B) ? cPolyAdd(A, B) : null; }
      case '-': { var A2 = complexPolyOf(node.a, v), B2 = complexPolyOf(node.b, v); return (A2 && B2) ? cPolySub(A2, B2) : null; }
      case 'neg': { var A3 = complexPolyOf(node.a, v); return A3 ? A3.map(cNeg) : null; }
      case '*': { var A4 = complexPolyOf(node.a, v), B4 = complexPolyOf(node.b, v); return (A4 && B4) ? cPolyMul(A4, B4) : null; }
      case '/': {
        if (hasVar(node.b, v)) return null;
        var A5 = complexPolyOf(node.a, v);
        if (!A5) return null;
        var d5 = evalComplex(node.b, {});
        if (!d5 || cIsZero(d5)) return null;
        return A5.map(function (c) { return cDiv(c, d5); });
      }
      case '^': {
        if (!hasVar(node.a, v) && !hasVar(node.b, v)) { var cv = evalComplex(node, {}); return cv ? [cv] : null; }
        if (hasVar(node.b, v)) return null;
        var base = complexPolyOf(node.a, v);
        if (!base) return null;
        var n2;
        try { n2 = evalAst(node.b, {}); } catch (e) { return null; }
        if (!Number.isInteger(n2) || n2 < 0 || n2 > 12) return null;
        var result = [{ re: 1, im: 0 }];
        for (var i = 0; i < n2; i++) result = cPolyMul(result, base);
        return result;
      }
      case 'fn': case 'fact':
        if (hasVar(node, v)) return null;
        var cv2 = evalComplex(node, {});
        return cv2 ? [cv2] : null;
      default: return null;
    }
  }
  function complexPolyToTex(coeffs, v) {
    var terms = [];
    for (var p = coeffs.length - 1; p >= 0; p--) {
      var c = coeffs[p];
      if (cIsZero(c)) continue;
      var coefStr = complexToTex(c);
      var isPureReal = Math.abs(c.im) < 1e-9;
      var needParens = !isPureReal && p > 0;   // (2+i)x, не 2+ix
      var vPart = p === 0 ? '' : v + (p > 1 ? '^{' + p + '}' : '');
      var body = p === 0 ? coefStr : (isPureReal && Math.abs(c.re - 1) < 1e-9 ? '' : (isPureReal && Math.abs(c.re + 1) < 1e-9 ? '-' : (needParens ? '(' + coefStr + ')' : coefStr) + '\\cdot ')) + vPart;
      terms.push((terms.length ? ' + ' : '') + body);
    }
    return terms.length ? terms.join('') : '0';
  }
  // Линейное выражение от НЕСКОЛЬКИХ переменных с комплексными
  // коэффициентами — аналог affineOf, для систем (не только одна переменная,
  // как у complexPolyOf выше).
  function complexAffineOf(node, varNames) {
    switch (node.t) {
      case 'num': return { const: { re: node.v, im: 0 }, coeffs: {} };
      case 'var': {
        if (node.name === 'i') return { const: { re: 0, im: 1 }, coeffs: {} };
        if (varNames.indexOf(node.name) >= 0) {
          var c = {}; c[node.name] = { re: 1, im: 0 };
          return { const: { re: 0, im: 0 }, coeffs: c };
        }
        if (CONSTS[node.name] !== undefined) return { const: { re: CONSTS[node.name], im: 0 }, coeffs: {} };
        return null;
      }
      case '+': case '-': {
        var a = complexAffineOf(node.a, varNames), b = complexAffineOf(node.b, varNames);
        if (!a || !b) return null;
        var op = node.t === '-' ? cSub : cAdd;
        var coeffs = Object.assign({}, a.coeffs);
        Object.keys(b.coeffs).forEach(function (k) { coeffs[k] = op(coeffs[k] || { re: 0, im: 0 }, b.coeffs[k]); });
        return { const: op(a.const, b.const), coeffs: coeffs };
      }
      case 'neg': {
        var a2 = complexAffineOf(node.a, varNames);
        if (!a2) return null;
        var c2 = {};
        Object.keys(a2.coeffs).forEach(function (k) { c2[k] = cNeg(a2.coeffs[k]); });
        return { const: cNeg(a2.const), coeffs: c2 };
      }
      case '*': {
        var a3 = complexAffineOf(node.a, varNames), b3 = complexAffineOf(node.b, varNames);
        if (!a3 || !b3) return null;
        var aHasVar = Object.keys(a3.coeffs).some(function (k) { return !cIsZero(a3.coeffs[k]); });
        var bHasVar = Object.keys(b3.coeffs).some(function (k) { return !cIsZero(b3.coeffs[k]); });
        if (aHasVar && bHasVar) return null;   // произведение двух переменных — не линейно
        var scalar = aHasVar ? b3.const : a3.const, lin = aHasVar ? a3 : b3;
        var c3 = {};
        Object.keys(lin.coeffs).forEach(function (k) { c3[k] = cMul(lin.coeffs[k], scalar); });
        return { const: cMul(lin.const, scalar), coeffs: c3 };
      }
      case '/': {
        if (hasVar(node.b, varNames[0]) || varNames.some(function (v) { return hasVar(node.b, v); })) return null;
        var a4 = complexAffineOf(node.a, varNames);
        if (!a4) return null;
        var d4 = evalComplex(node.b, {});
        if (!d4 || cIsZero(d4)) return null;
        var c4 = {};
        Object.keys(a4.coeffs).forEach(function (k) { c4[k] = cDiv(a4.coeffs[k], d4); });
        return { const: cDiv(a4.const, d4), coeffs: c4 };
      }
      default: {
        if (varNames.some(function (v) { return hasVar(node, v); })) return null;
        var cv = evalComplex(node, {});
        return cv ? { const: cv, coeffs: {} } : null;
      }
    }
  }


  // от вещественного случая здесь ВСЕГДА есть решение (алгебраическая
  // замкнутость ℂ): для квадратного не бывает «действительных корней нет».
  function solveComplexEquationPoly(coeffs, v) {
    var deg = coeffs.length - 1;
    while (deg > 0 && cIsZero(coeffs[deg])) deg--;
    if (deg === 0) {
      return cIsZero(coeffs[0]) ? { kind: 'identity', steps: [] } : { kind: 'contradiction', steps: [] };
    }
    if (deg === 1) {
      var a = coeffs[1], b = coeffs[0];
      var steps = [{ tex: complexPolyToTex(coeffs, v) + ' = 0' }];
      var root = cDiv(cNeg(b), a);
      steps.push({ tex: v + ' = ' + complexToTex(root) });
      return { kind: 'linear', steps: steps, roots: [root] };
    }
    if (deg === 2) {
      var a2 = coeffs[2], b2 = coeffs[1], c2 = coeffs[0];
      var steps2 = [{ tex: complexPolyToTex(coeffs, v) + ' = 0' }];
      var D = cSub(cMul(b2, b2), cMul({ re: 4, im: 0 }, cMul(a2, c2)));
      steps2.push({ tex: 'D = ' + complexToTex(D) });
      var sqrtD = cSqrt(D);
      var twoA = cMul({ re: 2, im: 0 }, a2);
      var r1 = cDiv(cAdd(cNeg(b2), sqrtD), twoA);
      var r2 = cDiv(cSub(cNeg(b2), sqrtD), twoA);
      steps2.push({ tex: v + '_{1,2} = \\frac{-(' + complexToTex(b2) + ') \\pm \\sqrt{D}}{2\\cdot(' + complexToTex(a2) + ')}' });
      steps2.push({ tex: v + '_1 = ' + complexToTex(r1) + ',\\quad ' + v + '_2 = ' + complexToTex(r2) });
      return { kind: 'quadratic', steps: steps2, roots: cEqApprox(r1, r2) ? [r1] : [r1, r2] };
    }
    return null;   // степень 3+ с комплексными коэффициентами — вне системы
  }
  function cEqApprox(a, b) { return Math.abs(a.re - b.re) < 1e-9 && Math.abs(a.im - b.im) < 1e-9; }

  // Система линейных уравнений с комплексными коэффициентами — метод Гаусса,
  // структурно тот же алгоритм, что и вещественный solveLinearSystem, только
  // арифметика комплексная.
  function cRowToEqTex(row, varNames) {
    var parts = [];
    varNames.forEach(function (vn, j) {
      var coef = row[j];
      if (cIsZero(coef)) return;
      parts.push((parts.length ? ' + ' : '') + '(' + complexToTex(coef) + ')\\cdot ' + vn);
    });
    return (parts.length ? parts.join('') : '0') + ' = ' + complexToTex(row[row.length - 1]);
  }
  function solveComplexLinearSystem(affineRows, varNames) {
    var n = affineRows.length, m = varNames.length;
    var M = affineRows.map(function (r) {
      var row = varNames.map(function (v) { return r.coeffs[v] || { re: 0, im: 0 }; });
      row.push(cNeg(r.const));
      return row;
    });
    var steps = [{ tex: M.map(function (row) { return cRowToEqTex(row, varNames); }).join(',\\quad ') }];
    var row = 0;
    for (var col = 0; col < m && row < n; col++) {
      var piv = row;
      for (var i = row + 1; i < n; i++) if (cAbs(M[i][col]) > cAbs(M[piv][col])) piv = i;
      if (cAbs(M[piv][col]) < 1e-9) continue;
      if (piv !== row) { var tmp = M[piv]; M[piv] = M[row]; M[row] = tmp; }
      var pv = M[row][col];
      if (cAbs(cSub(pv, { re: 1, im: 0 })) > 1e-9) {
        M[row] = M[row].map(function (x) { return cDiv(x, pv); });
      }
      var eliminated = false;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === row) continue;
        var f = M[r2][col];
        if (cIsZero(f)) continue;
        M[r2] = M[r2].map(function (x, j) { return cSub(x, cMul(f, M[row][j])); });
        eliminated = true;
      }
      if (eliminated) steps.push({ tex: M.map(function (r3) { return cRowToEqTex(r3, varNames); }).join(',\\quad ') });
      row++;
    }
    for (var i2 = 0; i2 < n; i2++) {
      var allZero = M[i2].slice(0, m).every(function (x) { return cIsZero(x); });
      if (allZero && !cIsZero(M[i2][m])) return { kind: 'none', steps: steps };
    }
    if (row < m) return { kind: 'infinite', steps: steps };
    var values = {};
    varNames.forEach(function (v, j) { values[v] = M[j][m]; });
    return { kind: 'unique', values: values, steps: steps };
  }

  global.MFAlgebra = {
    polyOf: polyOf, trimPoly: trimPoly, polyToTex: polyToTex, evalPolyAt: evalPolyAt,
    addPoly: addPoly, subPoly: subPoly, mulPoly: mulPoly,
    affineOf: affineOf, splitRelation: splitRelation,
    solveEquationPoly: solveEquationPoly, solveInequalityLinear: solveInequalityLinear,
    solveInequalityQuadratic: solveInequalityQuadratic, solveInequalityNumeric: solveInequalityNumeric,
    intervalToTex: intervalToTex, regionToTex: regionToTex, solveLinearSystem: solveLinearSystem,
    solveLinearSystemSubstitution: solveLinearSystemSubstitution,
    solveLinearSystemElimination: solveLinearSystemElimination,
    solveLinearSystemCramer: solveLinearSystemCramer, solveLinearSystemMatrix: solveLinearSystemMatrix,
    solveQuadraticCompleteSquare: solveQuadraticCompleteSquare, solveQuadraticVieta: solveQuadraticVieta,
    traceEvalSteps: traceEvalSteps, exactAnswerTex: exactAnswerTex,
    simplifyRadical: simplifyRadical, quadraticRootTex: quadraticRootTex, decimalTerminates: decimalTerminates,
    evalSurd: evalSurd, surdToTex: surdToTex, surdToNumber: surdToNumber, surdIsRational: surdIsRational,
    hasVar: hasVar
  };

  global.MFComplex = {
    cAdd: cAdd, cSub: cSub, cMul: cMul, cDiv: cDiv, cNeg: cNeg,
    cAbs: cAbs, cArg: cArg, cConj: cConj, cFromPolar: cFromPolar,
    cPowInt: cPowInt, cSqrt: cSqrt, cRoots: cRoots, cIsZero: cIsZero,
    complexToTex: complexToTex, evalComplex: evalComplex, hasImaginary: hasImaginary,
    complexPolyOf: complexPolyOf, complexPolyToTex: complexPolyToTex, complexAffineOf: complexAffineOf,
    solveComplexEquationPoly: solveComplexEquationPoly,
    solveComplexLinearSystem: solveComplexLinearSystem
  };

  global.MFMath = {
    parse: parse, evalAst: evalAst, compile: compile,
    d: d, simplify: simplify, tex: tex, fmtNum: fmtNum,
    varsIn: function (n) { return Object.keys(varsIn(n)); },
    Frac: Frac, R: R, toFraction: toFraction, gcd: gcd,
    roots: roots, integrate: integrate,
    FUNCS: FUNCS, CONSTS: CONSTS
  };
})(window);