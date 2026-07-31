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
  function toFraction(x, maxDen) {
    maxDen = maxDen || 10000;
    if (!isFinite(x)) return null;
    var sign = x < 0 ? -1 : 1; x = Math.abs(x);
    var h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    do {
      var a = Math.floor(b);
      var h2 = a * h1 + h0; h0 = h1; h1 = h2;
      var k2 = a * k1 + k0; k0 = k1; k1 = k2;
      if (b === a) break;
      b = 1 / (b - a);
    } while (k1 <= maxDen && Math.abs(x - h1 / k1) > 1e-12);
    if (k1 > maxDen) return null;
    if (Math.abs(x - h1 / k1) > 1e-9) return null;
    return Frac(sign * h1, k1);
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
    cot: function (x) { return 1 / Math.tan(x); }
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
        // между числом и буквой знак умножения не нужен
        var needDot = /[0-9]$/.test(A) && /^[0-9]/.test(B);
        s = A + (needDot ? ' \\cdot ' : ' ') + B;
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

  global.MFMath = {
    parse: parse, evalAst: evalAst, compile: compile,
    d: d, simplify: simplify, tex: tex, fmtNum: fmtNum,
    varsIn: function (n) { return Object.keys(varsIn(n)); },
    Frac: Frac, R: R, toFraction: toFraction, gcd: gcd,
    roots: roots, integrate: integrate,
    FUNCS: FUNCS, CONSTS: CONSTS
  };
})(window);