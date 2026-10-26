/* ============================================================================
   MFSolver — пошаговый решатель алгебраического калькулятора
   ----------------------------------------------------------------------------
   Надстройка над MFMath/MFAlgebra (mf-math.js). Получает линейную запись из
   поля ввода (или строки системы) и возвращает не только ответ, а полное
   решение: последовательность шагов, у каждого — формула, пояснение словами
   и «уровень подробности»:
     lvl 0 — ключевые преобразования (видны даже в краткой записи);
     lvl 1 — обычное решение;
     lvl 2 — только в подробном режиме (промежуточная арифметика и т.п.).
   Что показывать при каком режиме — забота services.js; здесь только
   содержимое. Поэтому модуль чистый (без DOM) и тестируется в Node.

   Формат шага:
     { tex, text, textFull?, lvl, briefTex?, cols?:[столбик…] }
     { group: 'заголовок', steps: [...], lvl }      — вложенное подрешение
   В text/textFull формулы пишутся внутри $…$.
   ========================================================================== */
(function (global) {
  'use strict';
  var MF = global.MFMath, AL = global.MFAlgebra;
  var EPS = 1e-9;
  var OPTS = { dec: false };   // формат чисел текущего решения (см. solve)

  function SolveError(msg) { this.message = msg; this.solver = true; }
  function fail(msg) { throw new SolveError(msg); }

  /* ================================ 1. ЧИСЛА ==============================
     Точная рациональная арифметика {n, d}; если что-то не представимо точно
     (иррациональность, переполнение) — «плавающее» значение {f}. Операции
     принимают оба вида, результат {f} заразен: точность честно теряется,
     а не подменяется угаданной дробью. */
  var MAXSAFE = 9007199254740991;
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a && b ? Math.abs(a / gcd(a, b) * b) : 0; }
  function F(x) { return { f: x }; }
  function isF(q) { return q.f !== undefined; }
  function Q(n, d) {
    if (d === undefined) d = 1;
    if (d === 0 || !isFinite(n) || !isFinite(d)) return null;
    if (!Number.isInteger(n) || !Number.isInteger(d) || Math.abs(n) > MAXSAFE || Math.abs(d) > MAXSAFE) return F(n / d);
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    return { n: n === 0 ? 0 : n, d: d };
  }
  var Q0 = { n: 0, d: 1 }, Q1 = { n: 1, d: 1 };
  function qi(k) { return Q(k, 1); }
  function qv(q) { return isF(q) ? q.f : q.n / q.d; }
  // Число из ЗАПИСИ пользователя (литерал 0.125) — это всегда точная дробь.
  function qLit(x) {
    if (!isFinite(x)) return F(x);
    if (Number.isInteger(x) && Math.abs(x) <= MAXSAFE) return Q(x, 1);
    var fr = MF.toFraction(x, 10000000, 1e-13 * Math.max(1, Math.abs(x)));
    return fr ? Q(fr.n, fr.d) : F(x);
  }
  // Результат ВЫЧИСЛЕНИЯ (double) -> дробь, только если это заведомо дробь с
  // небольшим знаменателем (sin(π/6)=0.49999999999999994 -> 1/2); иначе null.
  function recoverQ(x, maxDen) {
    if (!isFinite(x)) return null;
    var r = Math.round(x);
    if (Math.abs(x - r) < Math.max(1e-10, 4e-15 * Math.abs(x))) return Q(r, 1);
    // знаменатель ограничен и допуском: у большого числа погрешность больше,
    // и «случайная» дробь нашлась бы почти всегда (2·10⁶ ≈ 10782521197/4919)
    var tol = 1e-11 * Math.max(1, Math.abs(x)), md = Math.min(maxDen || 10000, Math.floor(Math.sqrt(1e-4 / tol)));
    if (md < 2) return null;
    var fr = MF.toFraction(x, md, tol);
    return fr ? Q(fr.n, fr.d) : null;
  }
  function qAdd(a, b) { return (isF(a) || isF(b)) ? F(qv(a) + qv(b)) : Q(a.n * b.d + b.n * a.d, a.d * b.d); }
  function qSub(a, b) { return (isF(a) || isF(b)) ? F(qv(a) - qv(b)) : Q(a.n * b.d - b.n * a.d, a.d * b.d); }
  function qMul(a, b) { return (isF(a) || isF(b)) ? F(qv(a) * qv(b)) : Q(a.n * b.n, a.d * b.d); }
  function qDiv(a, b) { if (qZero(b)) return null; return (isF(a) || isF(b)) ? F(qv(a) / qv(b)) : Q(a.n * b.d, a.d * b.n); }
  function qNeg(a) { return isF(a) ? F(-a.f) : Q(-a.n, a.d); }
  function qZero(a) { return isF(a) ? Math.abs(a.f) < EPS : a.n === 0; }
  function qOne(a) { return isF(a) ? Math.abs(a.f - 1) < EPS : (a.n === 1 && a.d === 1); }
  function qSign(a) { if (isF(a)) return Math.abs(a.f) < EPS ? 0 : (a.f > 0 ? 1 : -1); return a.n > 0 ? 1 : a.n < 0 ? -1 : 0; }
  function qAbs(a) { return qSign(a) < 0 ? qNeg(a) : a; }
  function qIsInt(a) { return !isF(a) && a.d === 1; }
  function qEq(a, b) { return qZero(qSub(a, b)); }
  function qPow(a, k) {
    var b = k < 0 ? qDiv(Q1, a) : a, r = Q1;
    if (!b) return null;
    for (var i = 0; i < Math.abs(k); i++) r = qMul(r, b);
    return r;
  }
  function terminates(q) {
    if (isF(q)) return false;
    var d = q.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
    return d === 1;
  }
  // Точная конечная десятичная запись (только для terminates(q)).
  function decStr(q) {
    var n = Math.abs(q.n), d = q.d, k2 = 0, k5 = 0, t = d;
    while (t % 2 === 0) { t /= 2; k2++; } while (t % 5 === 0) { t /= 5; k5++; }
    var k = Math.max(k2, k5), scaled = n * (Math.pow(10, k) / d);
    if (!Number.isInteger(scaled) || scaled > MAXSAFE) return (q.n < 0 ? '-' : '') + String(Number((n / d).toPrecision(15)));
    var s = String(scaled);
    if (k > 0) {
      while (s.length <= k) s = '0' + s;
      s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
    }
    return (q.n < 0 ? '-' : '') + s;
  }
  // Очень большие/маленькие double — в виде a·10^k, а не «1.2e+30».
  function fTex(x, digits) {
    if (!isFinite(x)) return x > 0 ? '+\\infty' : '-\\infty';
    var ax = Math.abs(x);
    if (ax !== 0 && (ax >= 1e15 || ax < 1e-6)) {
      var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e);
      return MF.fmtNum(Number(m.toPrecision(digits || 8))) + ' \\cdot 10^{' + e + '}';
    }
    return MF.fmtNum(x, digits || 10);
  }
  function qTex(q, dec) {
    if (!q) return '?';
    if (isF(q)) return fTex(q.f);
    if (q.d === 1) return String(q.n);
    if ((dec || OPTS.dec) && terminates(q)) return decStr(q);
    return (q.n < 0 ? '-' : '') + '\\frac{' + Math.abs(q.n) + '}{' + q.d + '}';
  }
  // Отрицательное — в скобках: для подстановки в формулы «4·(−3)».
  function qTexP(q) { var s = qTex(q); return s.charAt(0) === '-' ? '\\left(' + s + '\\right)' : s; }

  // «Точная» запись вычисленного double: дробь, k·π, корень, иначе приближение.
  function numTex(x) {
    if (!isFinite(x)) return { tex: fTex(x), exact: false };
    var q = recoverQ(x, 10000);
    if (q) return { tex: qTex(q), exact: true };
    var qp = recoverQ(x / Math.PI, 1000);
    if (qp && Math.abs(qp.n) <= 1000) return { tex: piTex(qp), exact: true };
    if (x > 0) { var ke = recoverQ(Math.log(x), 12); if (ke && !qZero(ke)) return { tex: qOne(ke) ? 'e' : 'e^{' + qTex(ke) + '}', exact: true }; }
    var rv = recoverVal(x);
    if (rv && rv.s) return { tex: AL.surdToTex(rv.s), exact: true };
    return { tex: fTex(x, 8), exact: false };
  }
  function piTex(q) {   // q·π
    if (qZero(q)) return '0';
    var neg = qSign(q) < 0, a = qAbs(q), num = isF(a) ? fTex(a.f) : a.n, den = isF(a) ? 1 : a.d;
    var top = (num === 1 ? '' : num) + '\\pi';
    return (neg ? '-' : '') + (den === 1 ? top : '\\frac{' + top + '}{' + den + '}');
  }

  /* ============================ 2. ЗАПИСЬ В TeX ==========================
     Своя версия MFMath.tex: понимает «готовые» числовые листья (n.tx —
     точная запись посчитанного значения), основание логарифма, степень
     функции (sin²x), корень n-й степени, и ставит скобки вокруг
     отрицательных чисел там, где без них запись читается неверно. */
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, 'neg': 3, '^': 4, 'fn': 5, 'fact': 5 };
  var FN_TEX = {
    sin: '\\sin', cos: '\\cos', tan: '\\operatorname{tg}', tg: '\\operatorname{tg}',
    cot: '\\operatorname{ctg}', ctg: '\\operatorname{ctg}',
    asin: '\\arcsin', arcsin: '\\arcsin', acos: '\\arccos', arccos: '\\arccos',
    atan: '\\operatorname{arctg}', arctg: '\\operatorname{arctg}', arctan: '\\operatorname{arctg}',
    arcctg: '\\operatorname{arcctg}', ln: '\\ln', lg: '\\lg', log: '\\log', exp: '\\exp',
    sinh: '\\operatorname{sh}', cosh: '\\operatorname{ch}', tanh: '\\operatorname{th}'
  };
  var TRIG = { sin: 1, cos: 1, tan: 1, tg: 1, cot: 1, ctg: 1 };
  function leafTex(n) {
    if (n.tx !== undefined) return n.tx;
    if (n.sym === 'pi' || n.sym === 'π') return '\\pi';
    if (n.sym === 'e') return 'e';
    if (n.sym === 'phi') return '\\varphi';
    if (n.sym === 'tau') return '\\tau';
    return fTex(n.v, 12);
  }
  function wrapNeg(s) { return s.charAt(0) === '-' ? '\\left(' + s + '\\right)' : s; }
  function fnHead(n) {
    if (n.base) return '\\log_{' + T(n.base, 0) + '}';
    return FN_TEX[n.name] || '\\operatorname{' + n.name + '}';
  }
  function fnArg(a) {
    var t = T(a, 0);
    var simple = a.t === 'var' || (a.t === 'num' && t.charAt(0) !== '-' && t.indexOf('\\frac') < 0 && t.indexOf('\\cdot') < 0);
    return simple ? ' ' + t : '\\left(' + t + '\\right)';
  }
  function rootIndex(e) {   // показатель 1/k -> k (для записи корнем)
    if (e.t === '/' && e.a.t === 'num' && e.a.v === 1 && e.b.t === 'num' && Number.isInteger(e.b.v) && e.b.v >= 2) return e.b.v;
    if (e.t === 'num' && Math.abs(e.v - 0.5) < 1e-15) return 2;
    if (e.t === 'num' && e.val && e.val.s && e.val.s.length === 1 && e.val.s[0].rad === 1 && e.val.s[0].coef.n === 1 && e.val.s[0].coef.d >= 2 && e.val.s[0].coef.d <= 20) return e.val.s[0].coef.d;
    return 0;
  }
  function T(n, pp) {
    pp = pp || 0;
    var p = PREC[n.t] !== undefined ? PREC[n.t] : 9, s;
    switch (n.t) {
      case 'num': s = leafTex(n); return (s.charAt(0) === '-' && pp >= 2) ? '\\left(' + s + '\\right)' : s;
      case 'var': return n.name.length > 1 && n.name !== 'π' ? '\\mathrm{' + n.name + '}' : n.name;
      case '+': s = n.b.t === 'neg' ? T(n.a, p) + ' - ' + wrapNeg(T(n.b.a, p + 1)) : T(n.a, p) + ' + ' + wrapNeg(T(n.b, p)); break;
      case '-': s = T(n.a, p) + ' - ' + wrapNeg(T(n.b, p + 1)); break;
      case '*': {
        var A = T(n.a, p), B = wrapNeg(T(n.b, p));
        var dot = /^([0-9.]|\\frac|\\left\(-|\\left\(\\frac)/.test(B) || (/\}$/.test(A) && /^\\frac/.test(B));
        s = A + (dot ? ' \\cdot ' : ' ') + B; break;
      }
      case '/': s = '\\frac{' + T(n.a, 0) + '}{' + T(n.b, 0) + '}'; return s;
      case '^': {
        var k = rootIndex(n.b);
        if (k) return k === 2 ? '\\sqrt{' + T(n.a, 0) + '}' : '\\sqrt[' + k + ']{' + T(n.a, 0) + '}';
        if (n.a.t === 'fn' && TRIG[n.a.name] && n.b.t === 'num' && Number.isInteger(n.b.v) && n.b.v > 0)
          return fnHead(n.a) + '^{' + n.b.v + '}' + fnArg(n.a.a);
        var base = T(n.a, p + 1);
        if (n.a.t === '/' || base.charAt(0) === '-' || (n.a.t === 'fn' && n.a.name !== 'sqrt' && n.a.name !== 'abs'))
          base = '\\left(' + base + '\\right)';
        s = base + '^{' + T(n.b, 0) + '}'; break;
      }
      case 'neg': s = '-' + wrapNeg(T(n.a, p)); break;
      case 'fact': s = T(n.a, p) + '!'; break;
      case 'fn':
        if (n.name === 'sqrt') return '\\sqrt{' + T(n.a, 0) + '}';
        if (n.name === 'abs') return '\\left|' + T(n.a, 0) + '\\right|';
        if (n.name === 'vec') return '\\vec{' + T(n.a, 0) + '}';
        return fnHead(n) + fnArg(n.a);
      case 'tuple': return n.items.map(function (x) { return T(x, 0); }).join(',\\ ');
      default: s = '?';
    }
    return p < pp ? '\\left(' + s + '\\right)' : s;
  }
  function relTex(op) { return op === '≤' ? '\\le' : op === '≥' ? '\\ge' : op === '≠' ? '\\ne' : op; }

  /* ============================ 3. ДЕРЕВО ВЫРАЖЕНИЯ ====================== */
  function Nn(v) { return { t: 'num', v: v }; }
  function NQ(q) { return { t: 'num', v: qv(q), q: q, tx: qTex(q) }; }
  function Vr(name) { return { t: 'var', name: name }; }
  function add(a, b) { return { t: '+', a: a, b: b }; }
  function sub(a, b) { return { t: '-', a: a, b: b }; }
  function mul(a, b) { return { t: '*', a: a, b: b }; }
  function dvd(a, b) { return { t: '/', a: a, b: b }; }
  function pw(a, b) { return { t: '^', a: a, b: b }; }
  function neg(a) { return { t: 'neg', a: a }; }
  function clone(n) { return n ? JSON.parse(JSON.stringify(n)) : n; }
  function kids(n) {
    if (!n) return [];
    if (n.t === 'tuple') return n.items;
    var k = [];
    if (n.a) k.push(n.a); if (n.b) k.push(n.b); if (n.base) k.push(n.base);
    return k;
  }
  function anyNode(n, pred) { if (!n) return false; if (pred(n)) return true; return kids(n).some(function (c) { return anyNode(c, pred); }); }
  function hasV(n, v) { return anyNode(n, function (x) { return x.t === 'var' && x.name === v; }); }
  function freeVars(n) {
    var set = {};
    (function walk(x) {
      if (!x) return;
      if (x.t === 'var' && MF.CONSTS[x.name] === undefined) set[x.name] = true;
      kids(x).forEach(walk);
    })(n);
    return Object.keys(set).sort();
  }
  function subst(n, v, rep) {
    if (!n) return n;
    if (n.t === 'var' && n.name === v) return clone(rep);
    var c = {}; for (var k in n) c[k] = n[k];
    if (n.t === 'tuple') { c.items = n.items.map(function (x) { return subst(x, v, rep); }); return c; }
    if (n.a) c.a = subst(n.a, v, rep);
    if (n.b) c.b = subst(n.b, v, rep);
    if (n.base) c.base = subst(n.base, v, rep);
    return c;
  }
  function evalN(n, vars) {
    try { var r = MF.evalAst(n, vars || {}); return typeof r === 'number' ? r : NaN; } catch (e) { return NaN; }
  }
  function at(n, v, x) { var o = {}; o[v] = x; return evalN(n, o); }
  // Постоянное (без переменных) поддерево -> точное значение, если оно
  // рационально (в т.ч. sqrt(4), 2^(-1), sin(π/6)); иначе {f}.
  function constQ(n) {
    if (freeVars(n).length) return null;
    if (n.t === 'num') return n.q || (n.sym ? F(n.v) : qLit(n.v));
    var s = null;
    try { s = AL.evalSurd(n); } catch (e) { s = null; }
    if (s && AL.surdIsRational(s)) return s.length ? Q(s[0].coef.n, s[0].coef.d) : Q0;
    var x = evalN(n);
    if (!isFinite(x)) return null;
    return recoverQ(x) || F(x);
  }

  /* ================== 4. МНОГОЧЛЕНЫ ОТ НЕСКОЛЬКИХ ПЕРЕМЕННЫХ ============
     { t: { ключ_одночлена: {c, m} } }, m = {x:2, y:1}. Коэффициенты — Q. */
  function cleanM(m) { var r = {}; Object.keys(m).forEach(function (k) { if (m[k]) r[k] = m[k]; }); return r; }
  function mKey(m) { return Object.keys(m).filter(function (k) { return m[k]; }).sort().map(function (k) { return m[k] === 1 ? k : k + '^' + m[k]; }).join('*'); }
  function mMul(a, b) { var r = {}; var k; for (k in a) r[k] = a[k]; for (k in b) r[k] = (r[k] || 0) + b[k]; return cleanM(r); }
  function mDeg(m) { var s = 0; for (var k in m) s += m[k]; return s; }
  function pNew() { return { t: {} }; }
  function pAddTerm(p, c, m) {
    if (!c) return p;
    var k = mKey(m), cur = p.t[k], nc = cur ? qAdd(cur.c, c) : c;
    if (qZero(nc)) delete p.t[k]; else p.t[k] = { c: nc, m: cleanM(m) };
    return p;
  }
  function pConst(q) { return pAddTerm(pNew(), q, {}); }
  function pVar(v) { var m = {}; m[v] = 1; return pAddTerm(pNew(), Q1, m); }
  function pList(p) { return Object.keys(p.t).map(function (k) { return p.t[k]; }); }
  function pAdd(a, b) { var r = pNew(); pList(a).concat(pList(b)).forEach(function (t) { pAddTerm(r, t.c, t.m); }); return r; }
  function pScale(a, q) { var r = pNew(); pList(a).forEach(function (t) { pAddTerm(r, qMul(t.c, q), t.m); }); return r; }
  function pNeg(a) { return pScale(a, qi(-1)); }
  function pSub(a, b) { return pAdd(a, pNeg(b)); }
  function pMul(a, b) {
    var r = pNew();
    pList(a).forEach(function (x) { pList(b).forEach(function (y) { pAddTerm(r, qMul(x.c, y.c), mMul(x.m, y.m)); }); });
    return r;
  }
  function pPow(a, k) { var r = pConst(Q1); for (var i = 0; i < k; i++) r = pMul(r, a); return r; }
  function pIsZero(p) { return !Object.keys(p.t).length; }
  function pIsConst(p) { var l = pList(p); return !l.length || (l.length === 1 && !Object.keys(l[0].m).length); }
  function pConstVal(p) { var t = p.t['']; return t ? t.c : Q0; }
  function pDeg(p, v) { var d = -1; pList(p).forEach(function (t) { d = Math.max(d, t.m[v] || 0); }); return d; }
  function pTotalDeg(p) { var d = -1; pList(p).forEach(function (t) { d = Math.max(d, mDeg(t.m)); }); return d; }
  function pVars(p) { var s = {}; pList(p).forEach(function (t) { for (var k in t.m) s[k] = 1; }); return Object.keys(s).sort(); }
  function pEval(p, vals) {
    var s = 0;
    pList(p).forEach(function (t) { var x = qv(t.c); for (var k in t.m) x *= Math.pow(vals[k], t.m[k]); s += x; });
    return s;
  }
  // Коэффициенты по степеням v: массив многочленов от остальных переменных.
  function pCoeffs(p, v) {
    var d = Math.max(0, pDeg(p, v)), out = [];
    for (var i = 0; i <= d; i++) out.push(pNew());
    pList(p).forEach(function (t) {
      var m = {}; for (var k in t.m) if (k !== v) m[k] = t.m[k];
      pAddTerm(out[t.m[v] || 0], t.c, m);
    });
    return out;
  }
  function pToUni(p, v) {
    var d = Math.max(0, pDeg(p, v)), c = [];
    for (var i = 0; i <= d; i++) c.push(Q0);
    var ok = true;
    pList(p).forEach(function (t) {
      for (var k in t.m) if (k !== v) ok = false;
      c[t.m[v] || 0] = t.c;
    });
    return ok ? c : null;
  }
  function pSorted(p) {
    return pList(p).sort(function (a, b) {
      var da = mDeg(a.m), db = mDeg(b.m);
      if (da !== db) return db - da;
      var ks = Object.keys(a.m).concat(Object.keys(b.m)).sort();
      for (var i = 0; i < ks.length; i++) { var d = (b.m[ks[i]] || 0) - (a.m[ks[i]] || 0); if (d) return d; }
      return 0;
    });
  }
  function monoTex(m) {
    return Object.keys(m).sort().map(function (k) {
      var nm = k.charAt(0) === '√' ? '\\sqrt{' + k.slice(1) + '}' : k.length > 1 && k !== 'π' ? '\\mathrm{' + k + '}' : k;
      return m[k] === 1 ? nm : (k.charAt(0) === '√' ? '\\left(' + nm + '\\right)' : nm) + '^{' + m[k] + '}';
    }).join(' ');
  }
  // Список слагаемых [{c, m}] -> «3x^{2} - 2x + 5» (НЕ сливая подобные).
  function termsTex(list) {
    if (!list.length) return '0';
    return list.map(function (t, i) {
      var sgn = qSign(t.c) < 0, a = qAbs(t.c), mono = monoTex(t.m), body;
      if (!mono) body = qTex(a);
      else if (qOne(a)) body = mono;
      else { var ct = qTex(a); body = ct + (/\}$/.test(ct) || /^[0-9.]+$/.test(ct) ? ' ' : ' \\cdot ') + mono; }
      if (i === 0) return (sgn ? '-' : '') + body;
      return (sgn ? ' - ' : ' + ') + body;
    }).join('');
  }
  function pTex(p) { return termsTex(pSorted(p)); }

  function pFromAst(n) {
    switch (n.t) {
      case 'num': return pConst(n.q || (n.sym ? F(n.v) : qLit(n.v)));
      case 'var': return MF.CONSTS[n.name] !== undefined ? pConst(F(MF.CONSTS[n.name])) : pVar(n.name);
      case '+': case '-': {
        var a = pFromAst(n.a), b = a && pFromAst(n.b);
        return b ? (n.t === '+' ? pAdd(a, b) : pSub(a, b)) : null;
      }
      case 'neg': { var a2 = pFromAst(n.a); return a2 && pNeg(a2); }
      case '*': { var a3 = pFromAst(n.a), b3 = a3 && pFromAst(n.b); return b3 ? pMul(a3, b3) : null; }
      case '/': {
        var b4 = pFromAst(n.b);
        if (!b4 || !pIsConst(b4) || qZero(pConstVal(b4))) return null;
        var a4 = pFromAst(n.a);
        return a4 && pScale(a4, qDiv(Q1, pConstVal(b4)));
      }
      case '^': {
        if (!freeVars(n).length) { var cq = constQ(n); return cq ? pConst(cq) : null; }
        var e = constQ(n.b);
        if (!e || !qIsInt(e) || e.n < 0 || e.n > 30) return null;
        var b5 = pFromAst(n.a);
        if (!b5 || pTotalDeg(b5) * e.n > 30) return null;
        return pPow(b5, e.n);
      }
      default: {
        if (freeVars(n).length) return null;
        var c = constQ(n);
        return c ? pConst(c) : null;
      }
    }
  }
  function pToAst(p) {
    var ts = pSorted(p);
    if (!ts.length) return Nn(0);
    var out = null;
    ts.forEach(function (t) {
      var a = qAbs(t.c), node = null;
      Object.keys(t.m).sort().forEach(function (k) {
        var f = t.m[k] === 1 ? Vr(k) : pw(Vr(k), Nn(t.m[k]));
        node = node ? mul(node, f) : f;
      });
      if (!node) node = NQ(a);
      else if (!qOne(a)) node = mul(NQ(a), node);
      if (!out) out = qSign(t.c) < 0 ? neg(node) : node;
      else out = qSign(t.c) < 0 ? sub(out, node) : add(out, node);
    });
    return out;
  }

  /* ------------- многочлены от нескольких переменных: точное деление и НОД
     (сокращение дробей вроде (a² − 2ab + b²)/(a − b) = a − b). */
  function PolyAbort() {}
  function pChk(p) { pList(p).forEach(function (t) { if (isF(t.c)) throw new PolyAbort(); }); if (pList(p).length > 300) throw new PolyAbort(); return p; }
  function lexCmp(a, b, vs) { for (var i = 0; i < vs.length; i++) { var d = (a[vs[i]] || 0) - (b[vs[i]] || 0); if (d) return d; } return 0; }
  function pLT(p, vs) { var best = null; pList(p).forEach(function (t) { if (!best || lexCmp(t.m, best.m, vs) > 0) best = t; }); return best; }
  function pDivExact(a, b) {
    if (pIsZero(b)) return null;
    var vs = pVars(pAdd(a, b)), q = pNew(), r = a, lb = pLT(b, vs);
    for (var g = 0; g < 600 && !pIsZero(r); g++) {
      var lr = pLT(r, vs), m = {};
      for (var k in lr.m) m[k] = lr.m[k];
      for (var k2 in lb.m) { m[k2] = (m[k2] || 0) - lb.m[k2]; if (m[k2] < 0) return null; }
      var t = pAddTerm(pNew(), qDiv(lr.c, lb.c), cleanM(m));
      q = pAdd(q, t); r = pChk(pSub(r, pMul(t, b)));
    }
    return pIsZero(r) ? q : null;
  }
  function pLc(p, v) { var cs = pCoeffs(p, v); return cs[cs.length - 1]; }
  function pContent(p, v) { var g = null; pCoeffs(p, v).forEach(function (c) { if (!pIsZero(c)) g = g ? pGcd(g, c) : c; }); return g || pConst(Q1); }
  function pPrem(a, b, v) {
    var r = a, db = pDeg(b, v), lcb = pLc(b, v);
    for (var g = 0; g < 60 && !pIsZero(r) && pDeg(r, v) >= db; g++) {
      var dr = pDeg(r, v), m = {}; if (dr - db) m[v] = dr - db;
      r = pChk(pSub(pMul(lcb, r), pMul(pMul(pLc(r, v), pAddTerm(pNew(), Q1, m)), b)));
    }
    return r;
  }
  function pPrim(p, v) { var c = pContent(p, v); return pDivExact(p, c) || p; }
  function pGcd(a, b) {
    if (pIsZero(a)) return b; if (pIsZero(b)) return a;
    if (pIsConst(a) || pIsConst(b)) return pConst(Q1);
    var vs = pVars(pAdd(a, b)), v = vs[0];
    for (var i = 0; i < vs.length; i++) if (pDeg(a, vs[i]) > 0 && pDeg(b, vs[i]) > 0) { v = vs[i]; break; }
    var ca = pContent(a, v), cb = pContent(b, v), c = pGcd(ca, cb);
    var pa = pDivExact(a, ca), pb = pDivExact(b, cb);
    if (!pa || !pb) throw new PolyAbort();
    var g;
    if (pDeg(pa, v) <= 0 || pDeg(pb, v) <= 0) g = pConst(Q1);
    else {
      if (pDeg(pa, v) < pDeg(pb, v)) { var t = pa; pa = pb; pb = t; }
      for (var k = 0; k < 40 && !pIsZero(pb) && pDeg(pb, v) > 0; k++) {
        var r = pPrem(pa, pb, v);
        pa = pb; pb = pIsZero(r) ? r : pPrim(r, v);
      }
      g = pIsZero(pb) ? pPrim(pa, v) : pConst(Q1);
    }
    return pMul(c, g);
  }
  // общий числовой множитель: целые взаимно простые коэффициенты
  function pIntNorm(N, D) {
    var L = 1, G = 0;
    pList(N).concat(pList(D)).forEach(function (t) { L = lcm(L, t.c.d); });
    N = pScale(N, qi(L)); D = pScale(D, qi(L));
    pList(N).concat(pList(D)).forEach(function (t) { G = gcd(G, t.c.n); });
    if (G > 1) { N = pScale(N, Q(1, G)); D = pScale(D, Q(1, G)); }
    var ld = pLT(D, pVars(D));
    if (ld && qSign(ld.c) < 0) { N = pNeg(N); D = pNeg(D); }
    return { n: N, d: D };
  }
  // дробь из многочленов от нескольких переменных: { n, d } (без сокращения)
  function rmFromAst(n) {
    switch (n.t) {
      case '+': case '-': {
        var a = rmFromAst(n.a), b = a && rmFromAst(n.b); if (!b) return null;
        if (pIsConst(a.d) && pIsConst(b.d) || pTex(a.d) === pTex(b.d)) { var nn = n.t === '+' ? pAdd(pMul(a.n, b.d), pMul(b.n, a.d)) : pSub(pMul(a.n, b.d), pMul(b.n, a.d)); return pTex(a.d) === pTex(b.d) && !pIsConst(a.d) ? { n: n.t === '+' ? pAdd(a.n, b.n) : pSub(a.n, b.n), d: a.d } : { n: nn, d: pMul(a.d, b.d) }; }
        // общий знаменатель — НОК знаменателей
        var g = pGcd(a.d, b.d), ka = pDivExact(b.d, g), kb = pDivExact(a.d, g);
        if (!ka || !kb) return null;
        var num = n.t === '+' ? pAdd(pMul(a.n, ka), pMul(b.n, kb)) : pSub(pMul(a.n, ka), pMul(b.n, kb));
        return { n: pChk(num), d: pChk(pMul(a.d, ka)) };
      }
      case 'neg': { var a2 = rmFromAst(n.a); return a2 && { n: pNeg(a2.n), d: a2.d }; }
      case '*': { var a3 = rmFromAst(n.a), b3 = a3 && rmFromAst(n.b); return b3 && { n: pChk(pMul(a3.n, b3.n)), d: pChk(pMul(a3.d, b3.d)) }; }
      case '/': { var a4 = rmFromAst(n.a), b4 = a4 && rmFromAst(n.b); if (!b4 || pIsZero(b4.n)) return null; return { n: pChk(pMul(a4.n, b4.d)), d: pChk(pMul(a4.d, b4.n)) }; }
      case '^': {
        var e = freeVars(n.b).length ? null : constQ(n.b);
        if (freeVars(n.a).length && e && qIsInt(e) && Math.abs(e.n) <= 12) {
          var b5 = rmFromAst(n.a); if (!b5) return null;
          var pn = pPow(b5.n, Math.abs(e.n)), pd = pPow(b5.d, Math.abs(e.n));
          return e.n >= 0 ? { n: pChk(pn), d: pChk(pd) } : { n: pChk(pd), d: pChk(pn) };
        }
        var p5 = pFromAst(n); return p5 && { n: p5, d: pConst(Q1) };
      }
      default: { var p6 = pFromAst(n); return p6 && { n: p6, d: pConst(Q1) }; }
    }
  }
  // √a → переменная «√a», а сама a → (√a)²: корни из переменных упрощаются как многочлены
  function sqrtAtoms(ast) {
    var names = {};
    anyNode(ast, function (x) { if (x.t === 'fn' && x.name === 'sqrt' && x.a.t === 'var' && MF.CONSTS[x.a.name] === undefined) names[x.a.name] = 1; return false; });
    var list = Object.keys(names);
    if (!list.length) return null;
    function rw(x) {
      if (!x) return x;
      if (x.t === 'fn' && x.name === 'sqrt' && x.a.t === 'var' && names[x.a.name]) return Vr('√' + x.a.name);
      if (x.t === 'var' && names[x.name]) return pw(Vr('√' + x.name), Nn(2));
      var c = {}; for (var k in x) c[k] = x[k];
      if (x.a) c.a = rw(x.a); if (x.b) c.b = rw(x.b);
      return c;
    }
    var out = rw(ast);
    return anyNode(out, function (x) { return x.t === 'fn' && x.name === 'sqrt'; }) ? null : { ast: out, names: list };
  }
  // обратно: (√a)^{2k+1} → a^k·√a
  function sqrtBack(p) {
    var r = pNew();
    pList(p).forEach(function (t) {
      var m = {};
      for (var k in t.m) {
        if (k.charAt(0) === '√') { var base = k.slice(1), e = t.m[k]; if (e >= 2) m[base] = (m[base] || 0) + Math.floor(e / 2); if (e % 2) m[k] = 1; }
        else m[k] = (m[k] || 0) + t.m[k];
      }
      pAddTerm(r, t.c, m);
    });
    return r;
  }
  function simplifyMulti(ast, vars, S) {
    var sa = sqrtAtoms(ast), work = sa ? sa.ast : ast;
    var rm;
    try { rm = rmFromAst(work); } catch (e) { if (e instanceof PolyAbort) return null; throw e; }
    if (!rm) return null;
    var N0 = rm.n, D0 = rm.d, g, N, D;
    try { g = pGcd(N0, D0); N = pDivExact(N0, g); D = pDivExact(D0, g); } catch (e2) { if (e2 instanceof PolyAbort) return null; throw e2; }
    if (!N || !D) return null;
    var nz = pIntNorm(N, D); N = nz.n; D = nz.d;
    var back = sa ? sqrtBack : function (x) { return x; };
    var texOf = function (n, d) { return pIsConst(d) ? pTex(back(pScale(n, qDiv(Q1, pConstVal(d))))) : '\\frac{' + pTex(back(n)) + '}{' + pTex(back(d)) + '}'; };
    if (sa) S.add(null, 'Считаем все переменные под корнем неотрицательными: тогда $' + sa.names.map(function (v) { return v + ' = \\left(\\sqrt{' + v + '}\\right)^{2}'; }).join(',\\ ') + '$ — так корни упрощаются по формулам сокращённого умножения.', 1);
    var t0 = texOf(N0, D0), t1 = texOf(N, D), gc = !pIsConst(g);
    if (!pIsConst(D0) && t0 !== T(ast)) S.add(t0, 'Приводим к общему знаменателю.', 1);
    var fac = function (P) {
      var a = pTex(back(P)), gg = pTex(back(g));
      var one = pIsConst(P) && qOne(pConstVal(P)), wrapG = pList(g).length > 1 ? '\\left(' + gg + '\\right)' : gg;
      if (one) return gg;
      if (a === gg) return wrapG + '^{2}';
      return (pList(P).length > 1 ? '\\left(' + a + '\\right)' : a) + ' \\cdot ' + wrapG;
    };
    if (gc) S.add('\\frac{' + fac(N) + '}{' + fac(D) + '} = ' + t1, 'Раскладываем числитель и знаменатель на множители и сокращаем общий множитель $' + pTex(back(g)) + '$.', 1);
    else if (pIsConst(D0) && !pIsConst(N0) && t1 !== T(ast)) S.add(t1, 'Раскрываем скобки и приводим подобные слагаемые.', 1);
    S.add(T(ast) + ' = ' + t1, 'Итог упрощения.', 0);
    var extra = [];
    var cond = []; if (!pIsConst(D)) cond.push(pTex(back(D)) + ' \\ne 0'); if (gc) cond.push(pTex(back(g)) + ' \\ne 0');
    if (cond.length) extra.push('при $' + cond.join(',\\ ') + '$ (там, где исходное выражение определено)');
    return { label: 'Упрощённый вид', items: [{ tex: t1 }], extra: extra };
  }

  /* ---------------- раскрытие скобок «как в тетради» (без слияния подобных)
     Возвращает список слагаемых и в notes — какие приёмы понадобились
     (формулы сокращённого умножения, минус перед скобкой и т.п.). */
  function tlNeg(l) { return l.map(function (t) { return { c: qNeg(t.c), m: t.m }; }); }
  function tlMerge(l) { var p = pNew(); l.forEach(function (t) { pAddTerm(p, t.c, t.m); }); return pSorted(p); }
  function noteOnce(notes, s) { if (notes.indexOf(s) < 0) notes.push(s); }
  function tlFromAst(n, notes) {
    switch (n.t) {
      case 'num': case 'var': {
        var p = pFromAst(n);
        return p ? (pList(p).length ? pList(p) : [{ c: Q0, m: {} }]) : null;
      }
      case '+': { var a = tlFromAst(n.a, notes), b = a && tlFromAst(n.b, notes); return b ? a.concat(b) : null; }
      case '-': {
        var a1 = tlFromAst(n.a, notes), b1 = a1 && tlFromAst(n.b, notes);
        if (!b1) return null;
        if (b1.length > 1) noteOnce(notes, 'минус перед скобкой меняет знак каждого слагаемого в ней');
        return a1.concat(tlNeg(b1));
      }
      case 'neg': {
        var a2 = tlFromAst(n.a, notes);
        if (!a2) return null;
        if (a2.length > 1) noteOnce(notes, 'минус перед скобкой меняет знак каждого слагаемого в ней');
        return tlNeg(a2);
      }
      case '*': {
        var A = tlFromAst(n.a, notes), B = A && tlFromAst(n.b, notes);
        if (!B) return null;
        if (A.length === 2 && B.length === 2 && mKey(A[0].m) === mKey(B[0].m) && mKey(A[1].m) === mKey(B[1].m) &&
            qEq(A[0].c, B[0].c) && qEq(A[1].c, qNeg(B[1].c))) {
          noteOnce(notes, 'формула разности квадратов $(a - b)(a + b) = a^2 - b^2$');
          return [{ c: qMul(A[0].c, A[0].c), m: mMul(A[0].m, A[0].m) }, { c: qNeg(qMul(A[1].c, A[1].c)), m: mMul(A[1].m, A[1].m) }];
        }
        if (A.length > 1 && B.length > 1) noteOnce(notes, 'каждое слагаемое первой скобки умножаем на каждое слагаемое второй');
        else if (A.length > 1 || B.length > 1) noteOnce(notes, 'умножаем множитель перед скобкой на каждое слагаемое в скобке');
        if (A.length * B.length > 60) { var pa = pFromAst(n.a), pb = pFromAst(n.b); return pa && pb ? pSorted(pMul(pa, pb)) : null; }
        var out = [];
        A.forEach(function (x) { B.forEach(function (y) { out.push({ c: qMul(x.c, y.c), m: mMul(x.m, y.m) }); }); });
        return out;
      }
      case '/': {
        var d = pFromAst(n.b);
        if (!d || !pIsConst(d) || qZero(pConstVal(d))) return null;
        var A2 = tlFromAst(n.a, notes);
        if (!A2) return null;
        if (A2.length > 1) noteOnce(notes, 'почленно делим числитель на знаменатель');
        var inv = qDiv(Q1, pConstVal(d));
        return A2.map(function (t) { return { c: qMul(t.c, inv), m: t.m }; });
      }
      case '^': {
        if (!freeVars(n).length) { var cq = constQ(n); return cq ? [{ c: cq, m: {} }] : null; }
        var e = constQ(n.b);
        if (!e || !qIsInt(e) || e.n < 0 || e.n > 30) return null;
        var L = tlFromAst(n.a, notes);
        if (!L) return null;
        L = tlMerge(L);
        var k = e.n;
        if (k === 0) return [{ c: Q1, m: {} }];
        if (L.length === 1) {
          var m = {}; for (var key in L[0].m) m[key] = L[0].m[key] * k;
          return [{ c: qPow(L[0].c, k), m: m }];
        }
        if (L.length === 2 && k === 2) {
          noteOnce(notes, qSign(L[1].c) < 0 ? 'квадрат разности $(a - b)^2 = a^2 - 2ab + b^2$' : 'квадрат суммы $(a + b)^2 = a^2 + 2ab + b^2$');
          var x = L[0], y = L[1];
          return [{ c: qMul(x.c, x.c), m: mMul(x.m, x.m) }, { c: qMul(qi(2), qMul(x.c, y.c)), m: mMul(x.m, y.m) }, { c: qMul(y.c, y.c), m: mMul(y.m, y.m) }];
        }
        if (L.length === 2 && k === 3) {
          noteOnce(notes, qSign(L[1].c) < 0 ? 'куб разности $(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$' : 'куб суммы $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$');
          var x3 = L[0], y3 = L[1];
          return [
            { c: qPow(x3.c, 3), m: mMul(mMul(x3.m, x3.m), x3.m) },
            { c: qMul(qi(3), qMul(qPow(x3.c, 2), y3.c)), m: mMul(mMul(x3.m, x3.m), y3.m) },
            { c: qMul(qi(3), qMul(x3.c, qPow(y3.c, 2))), m: mMul(mMul(y3.m, y3.m), x3.m) },
            { c: qPow(y3.c, 3), m: mMul(mMul(y3.m, y3.m), y3.m) }
          ];
        }
        noteOnce(notes, 'возводим скобку в степень, последовательно перемножая');
        var P = pNew(); L.forEach(function (t) { pAddTerm(P, t.c, t.m); });
        if (pTotalDeg(P) * k > 30) return null;
        return pSorted(pPow(P, k));
      }
      default: {
        if (freeVars(n).length) return null;
        var c = constQ(n);
        return c ? [{ c: c, m: {} }] : null;
      }
    }
  }
  function tlToPoly(l) { var p = pNew(); l.forEach(function (t) { pAddTerm(p, t.c, t.m); }); return p; }
  // «$2x + 3x = 5x$; $-6 + 5 = -1$» — какие именно подобные слагаемые сложили.
  function likeTermsNote(l) {
    var groups = {}, order = [];
    l.forEach(function (t) { var k = mKey(t.m); if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(t); });
    var parts = [];
    order.forEach(function (k) {
      var g = groups[k];
      if (g.length < 2) return;
      var sum = tlMerge(g);
      parts.push('$' + termsTex(g) + ' = ' + (sum.length ? termsTex(sum) : '0') + '$');
    });
    return parts.join('; ');
  }
  function hasLikeTerms(l) { var s = {}; for (var i = 0; i < l.length; i++) { var k = mKey(l[i].m); if (s[k]) return true; s[k] = 1; } return false; }

  /* ================ 5. МНОГОЧЛЕНЫ ОТ ОДНОЙ ПЕРЕМЕННОЙ (массивы Q) ========= */
  function uTrim(c) { c = c.slice(); while (c.length > 1 && qZero(c[c.length - 1])) c.pop(); return c.length ? c : [Q0]; }
  function uDeg(c) { c = uTrim(c); return (c.length === 1 && qZero(c[0])) ? -1 : c.length - 1; }
  function uAdd(a, b) { var r = []; for (var i = 0; i < Math.max(a.length, b.length); i++) r.push(qAdd(a[i] || Q0, b[i] || Q0)); return uTrim(r); }
  function uNeg(a) { return a.map(qNeg); }
  function uSub(a, b) { return uAdd(a, uNeg(b)); }
  function uScale(a, q) { return uTrim(a.map(function (x) { return qMul(x, q); })); }
  function uMul(a, b) {
    var r = []; for (var i = 0; i < a.length + b.length - 1; i++) r.push(Q0);
    for (var i2 = 0; i2 < a.length; i2++) for (var j = 0; j < b.length; j++) r[i2 + j] = qAdd(r[i2 + j], qMul(a[i2], b[j]));
    return uTrim(r);
  }
  function uPow(a, k) { var r = [Q1]; for (var i = 0; i < k; i++) r = uMul(r, a); return r; }
  function uEval(c, x) { var s = 0; for (var i = c.length - 1; i >= 0; i--) s = s * x + qv(c[i]); return s; }
  function uEvalQ(c, q) { var s = Q0; for (var i = c.length - 1; i >= 0; i--) s = qAdd(qMul(s, q), c[i]); return s; }
  function uDivmod(a, b) {
    a = uTrim(a); b = uTrim(b);
    var db = uDeg(b), qt = [], r = a.slice();
    if (db < 0) return null;
    for (var i = 0; i <= Math.max(0, uDeg(a) - db); i++) qt.push(Q0);
    while (uDeg(r) >= db && uDeg(r) >= 0) {
      var dr = uDeg(r), k = qDiv(r[dr], b[db]);
      qt[dr - db] = k;
      for (var j = 0; j <= db; j++) r[dr - db + j] = qSub(r[dr - db + j], qMul(k, b[j]));
      r[dr] = Q0;
      r = uTrim(r);
      if (dr === 0) break;
    }
    return { q: uTrim(qt), r: uTrim(r) };
  }
  function uExact(c) { return c.every(function (x) { return !isF(x); }); }
  function uMonic(c) { c = uTrim(c); var d = uDeg(c); return d < 0 ? c : uScale(c, qDiv(Q1, c[d])); }
  function uGcd(a, b) {
    if (!uExact(a) || !uExact(b)) return [Q1];
    a = uTrim(a); b = uTrim(b);
    var guard = 0;
    while (uDeg(b) >= 0 && guard++ < 60) { var r = uDivmod(a, b).r; a = b; b = r; }
    return uDeg(a) < 0 ? [Q1] : uMonic(a);
  }
  function uToPoly(c, v) { var p = pNew(); c.forEach(function (q, i) { var m = {}; if (i) m[v] = i; pAddTerm(p, q, m); }); return p; }
  function uTex(c, v) { return pTex(uToPoly(c, v)); }
  function uToAst(c, v) { return pToAst(uToPoly(c, v)); }
  // Приведение к целым взаимно простым коэффициентам: множитель k и результат.
  function uIntScale(c) {
    if (!uExact(c)) return null;
    var L = 1; c.forEach(function (q) { L = lcm(L, q.d); });
    var G = 0; c.forEach(function (q) { G = gcd(G, q.n * (L / q.d)); });
    if (!G) return null;
    var k = Q(L, G);
    return { k: k, c: c.map(function (q) { return qMul(q, k); }) };
  }

  /* ================================ 6. КОРНИ =============================
     {val, tex, exact, mult} — значение, точная запись (если есть), кратность. */
  function Rt(val, tex, exact) { return { val: val, tex: tex, exact: exact !== false, mult: 1 }; }
  function rootQ(q) { return isF(q) ? rootNum(q.f) : Rt(qv(q), qTex(q), true); }
  function rootNum(x) { var e = numTex(x); return Rt(x, e.tex, e.exact); }
  function sameVal(a, b) { return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a)); }
  function uniqRoots(list) {
    var out = [];
    list.slice().sort(function (a, b) { return a.val - b.val; }).forEach(function (r) {
      var prev = out[out.length - 1];
      if (prev && sameVal(prev.val, r.val)) { prev.mult += r.mult; if (!prev.exact && r.exact) { prev.tex = r.tex; prev.exact = true; } }
      else out.push({ val: r.val, tex: r.tex, exact: r.exact, mult: r.mult });
    });
    return out;
  }
  function rootsTex(v, roots) {
    if (roots.length === 1) return v + ' = ' + roots[0].tex;
    return roots.map(function (r, i) { return v + '_{' + (i + 1) + '} = ' + r.tex; }).join(',\\quad ');
  }

  /* ============================= 7. ШАГИ =================================*/
  function Steps() { this.list = []; }
  // Одна и та же формула два раза подряд (преобразование ничего не
  // изменило) не показывается — повтор сливается с предыдущим шагом.
  var LAST = { tex: null, step: null };
  Steps.prototype.add = function (tex, text, lvl, extra) {
    if (tex && tex === LAST.tex && LAST.step) { if (lvl !== undefined && lvl < LAST.step.lvl) LAST.step.lvl = lvl; return LAST.step; }
    var s = { tex: tex || null, text: text || '', lvl: lvl === undefined ? 1 : lvl };
    if (extra) for (var k in extra) s[k] = extra[k];
    this.list.push(s);
    if (tex) { LAST.tex = tex; LAST.step = s; }
    return s;
  };
  Steps.prototype.note = function (text, lvl, extra) { return this.add(null, text, lvl === undefined ? 1 : lvl, extra); };
  Steps.prototype.group = function (title, lvl) {
    var g = new Steps();
    this.list.push({ group: title, steps: g.list, lvl: lvl === undefined ? 1 : lvl });
    return g;
  };
  Steps.prototype.last = function () { return this.list[this.list.length - 1]; };
  var QUIET = { add: function () { return {}; }, note: function () { return {}; }, group: function () { return QUIET; }, last: function () { return {}; }, list: [] };

  /* ======================= 8. ВЫЧИСЛЕНИЯ «В СТОЛБИК» =====================
     Строятся только для целых и конечных десятичных дробей — ровно тех
     чисел, которые в школе считают столбиком. Результат — сетка клеток:
       { kind:'grid', rows:[{cells:[…], u:[from,to]|null, cls}], side? }
     Клетка '.' — узкая «запятая»; side — делитель и частное для деления
     уголком (рисуются справа от первых двух строк). */
  function decParts(q) {
    if (!q || isF(q) || !terminates(q)) return null;
    var s = decStr(qAbs(q)).split('.');
    return { i: s[0], f: s[1] || '' };
  }
  function digitsCount(q) { var p = decParts(q); return p ? (p.i.replace(/^0+/, '') + p.f).length : 0; }
  function sigDigits(q) { var p = decParts(q); return p ? (p.i + p.f).replace(/^0+/, '').replace(/0+$/, '').length : 0; }
  function worthColumn(op, a, b) {
    if (!decParts(a) || !decParts(b)) return false;
    var sa = sigDigits(a), sb = sigDigits(b), la = digitsCount(a), lb = digitsCount(b);
    if (op === '+' || op === '-') return Math.min(sa, sb) >= 2 && Math.max(la, lb) >= 3;
    if (op === '*') return (sa >= 2 && sb >= 2) || (Math.max(sa, sb) >= 3 && Math.min(sa, sb) >= 1 && !qZero(a) && !qZero(b));
    if (op === '/') {
      if (qZero(b) || qZero(a) || sb === 0) return false;
      if (sb === 1 && decParts(b).i.replace(/^0+/, '') + decParts(b).f === '1') return false;   // деление на 1, 10, 0.1…
      return sb >= 2 || sa >= 3;
    }
    return false;
  }
  function padL(s, w) { while (s.length < w) s = ' ' + s; return s; }
  function padR(s, w) { while (s.length < w) s = s + ' '; return s; }
  function rowCells(str) { return str.split(''); }
  // Сложение/вычитание: выравнивание по запятой, переносы/заёмы над цифрами.
  function colAddSub(a, b, op) {
    var A = decParts(a), B = decParts(b);
    var I = Math.max(A.i.length, B.i.length) + (op === '+' ? 1 : 0), Fr = Math.max(A.f.length, B.f.length);
    function lay(p, zeros) {
      var f = zeros ? padR(p.f, Fr).replace(/ /g, '0') : padR(p.f, Fr);
      return padL(p.i, I) + (Fr ? (p.f.length || zeros ? '.' : ' ') + f : '');
    }
    var az = lay(A, true).replace(/ /g, '0'), bz = lay(B, true).replace(/ /g, '0');
    var marks = new Array(az.length + 1).join(' ').split(''), carry = 0;
    for (var i = az.length - 1; i >= 0; i--) {
      if (az[i] === '.') continue;
      var da = +az[i], db = +bz[i];
      if (op === '+') {
        var s = da + db + carry; carry = s >= 10 ? 1 : 0;
        if (carry) { var j = i - 1; if (az[j] === '.') j--; if (j >= 0) marks[j] = '1'; }
      } else {
        var d = da - db - carry; carry = d < 0 ? 1 : 0;
        if (carry) { var j2 = i - 1; if (az[j2] === '.') j2--; if (j2 >= 0) marks[j2] = '•'; }
      }
    }
    var r = op === '+' ? qAdd(a, b) : qSub(a, b), Rp = decParts(r);
    var rows = [];
    if (marks.join('').trim()) rows.push({ cells: marks, cls: 'carry' });
    rows.push({ cells: rowCells(lay(A)), sign: '' });
    rows.push({ cells: rowCells(lay(B)), sign: op === '+' ? '+' : '−' });
    rows[rows.length - 1].u = [0, az.length - 1];
    rows.push({ cells: rowCells(lay(Rp, Fr > 0)), sign: '' });
    return { kind: 'grid', rows: rows };
  }
  // Умножение: неполные произведения со сдвигом. Запятая — по сумме знаков.
  function colMul(a, b) {
    var A = decParts(a), B = decParts(b);
    var ad = (A.i + A.f).replace(/^0+(?=\d)/, ''), bd = (B.i + B.f).replace(/^0+(?=\d)/, '');
    if (+ad * +bd > MAXSAFE) return null;
    var aStr = A.f ? A.i + '.' + A.f : A.i, bStr = B.f ? B.i + '.' + B.f : B.i;
    var partials = [];
    for (var i = bd.length - 1, sh = 0; i >= 0; i--, sh++) {
      if (bd[i] === '0' && bd.length > 1) continue;
      partials.push({ s: String(+ad * +bd[i]), sh: sh });
    }
    var res = qMul(qAbs(a), qAbs(b)), Rp = decParts(res), rStr = Rp.f ? Rp.i + '.' + Rp.f : Rp.i;
    var W = Math.max(aStr.length, bStr.length + 1, rStr.length);
    partials.forEach(function (p) { W = Math.max(W, p.s.length + p.sh); });
    var rows = [
      { cells: rowCells(padL(aStr, W)), sign: '' },
      { cells: rowCells(padL(bStr, W)), sign: '×', u: [W - Math.max(aStr.length, bStr.length), W - 1] }
    ];
    if (partials.length > 1) {
      partials.forEach(function (p, k) {
        var row = { cells: rowCells(padL(p.s + new Array(p.sh + 1).join(' '), W)), sign: k === partials.length - 1 ? '+' : '' };
        if (k === partials.length - 1) row.u = [W - Math.max(p.s.length + p.sh, rStr.length), W - 1];
        rows.push(row);
      });
    }
    rows.push({ cells: rowCells(padL(rStr, W)), sign: '' });
    return { kind: 'grid', rows: rows, note: (A.f.length + B.f.length) ? 'умножаем, не обращая внимания на запятые, и отделяем в ответе ' + (A.f.length + B.f.length) + ' ' + plural(A.f.length + B.f.length, 'знак', 'знака', 'знаков') + ' после запятой' : '' };
  }
  // Деление уголком. Делитель с запятой переносим в целое (сдвиг запятой).
  function colDiv(a, b) {
    var A = decParts(qAbs(a)), B = decParts(qAbs(b));
    var shift = B.f.length, note = '';
    if (shift) note = 'переносим запятую в делимом и делителе на ' + shift + ' ' + plural(shift, 'знак', 'знака', 'знаков') + ' вправо, чтобы делитель стал целым';
    var D = +(B.i + B.f);
    if (!D || D > 1e9) return null;
    var intDigits = (A.i + A.f.slice(0, shift) + new Array(Math.max(0, shift - A.f.length) + 1).join('0')).replace(/^0+(?=\d)/, '');
    var fracDigits = A.f.slice(shift);
    var digits = (intDigits + fracDigits).split('').map(Number);
    var pointAfter = intDigits.length - 1;   // запятая после этой цифры
    var r = 0, started = false, qInt = '', qFrac = '', steps = [], seen = {}, period = null, lastIdx = -1;
    var MAXF = 8;
    for (var idx = 0; ; idx++) {
      if (idx >= digits.length) {
        if (r === 0 || qFrac.length >= MAXF) break;
        digits.push(0);
      }
      var inFrac = idx > pointAfter;
      if (inFrac && idx >= intDigits.length + fracDigits.length) {
        var key = String(r);
        if (seen[key] !== undefined) { period = { from: seen[key], to: qFrac.length }; digits.pop(); break; }
        seen[key] = qFrac.length;
      }
      r = r * 10 + digits[idx];
      var qd = Math.floor(r / D);
      if (inFrac) qFrac += qd;
      else if (started || qd > 0) { qInt += qd; }
      if (qd > 0 || started) started = true;
      if (qd > 0) steps.push({ end: idx, cur: r, sub: qd * D });
      r -= qd * D;
      lastIdx = idx;
    }
    if (!qInt) qInt = '0';
    var qStr = qInt + (qFrac ? '.' + qFrac : '');
    if (period) qStr = qInt + '.' + qFrac.slice(0, period.from) + '(' + qFrac.slice(period.from, period.to) + ')';
    if (qFrac.length >= MAXF && !period && r !== 0) qStr += '…';
    // сетка: 1 клетка под минус + цифры делимого (+ узкая клетка запятой)
    var ndig = Math.max(digits.length, lastIdx + 1);
    var hasPt = pointAfter < ndig - 1;
    function colOf(i) { return 1 + i + (hasPt && i > pointAfter ? 1 : 0); }
    var W = colOf(ndig - 1) + 1;
    function blank() { var c = []; for (var i = 0; i < W; i++) c.push(hasPt && i === colOf(pointAfter) + 1 ? '' : ' '); return c; }
    function place(cells, numStr, endIdx) {
      var s = String(numStr);
      for (var k = 0; k < s.length; k++) { var di = endIdx - (s.length - 1 - k); if (di >= 0) cells[colOf(di)] = s[k]; }
      return [colOf(endIdx - s.length + 1), colOf(endIdx)];
    }
    var rows = [];
    var top = blank();
    for (var i = 0; i < ndig; i++) top[colOf(i)] = String(digits[i]);
    if (hasPt) top[colOf(pointAfter) + 1] = '.';
    rows.push({ cells: top });
    steps.forEach(function (st, k) {
      var c1 = blank(), span = place(c1, st.sub, st.end);
      c1[span[0] - 1] = '−';
      rows.push({ cells: c1, u: span });
      var c2 = blank(), nxt = steps[k + 1];
      if (nxt) place(c2, nxt.cur, nxt.end);
      else place(c2, r === 0 ? 0 : r, lastIdx);
      rows.push({ cells: c2 });
    });
    return { kind: 'grid', rows: rows, side: [String(D), qStr], note: note + (period ? (note ? '; ' : '') + 'остатки начали повторяться — дробь периодическая, период записан в скобках' : '') };
  }
  function column(op, a, b) {
    if (!worthColumn(op, a, b)) return null;
    try {
      if (op === '+' || op === '-') {
        // Столбиком складывают/вычитают модули; знак результата — по правилам
        // действий с отрицательными числами (это объясняется в тексте шага).
        var A = qAbs(a), B = qAbs(b);
        var sameSign = (qSign(a) >= 0) === (qSign(b) >= 0);
        if ((op === '+') === sameSign) return colAddSub(A, B, '+');
        return qSign(qSub(A, B)) >= 0 ? colAddSub(A, B, '-') : colAddSub(B, A, '-');
      }
      if (op === '*') return colMul(qAbs(a), qAbs(b));
      if (op === '/') return colDiv(a, b);
    } catch (e) { return null; }
    return null;
  }
  function plural(n, one, few, many) {
    n = Math.abs(n) % 100; var n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  /* =================== 9. ВЫЧИСЛЕНИЕ ПРИМЕРА «ПО ДЕЙСТВИЯМ» ==============
     Значение: { s: SurdNum (точная сумма рациональных кратных корней) | null,
                 x: число, dec: пришло из десятичной записи, big: строка
                 цифр для огромных целых (2^100, 30!) }. */
  function surdQ(q) { return isF(q) ? null : AL.surdRat({ n: q.n, d: q.d }); }
  function valQ(q, dec) { return { s: surdQ(q), x: qv(q), dec: !!dec }; }
  function valRat(v) {
    if (!v.s || !AL.surdIsRational(v.s)) return null;
    return v.s.length ? Q(v.s[0].coef.n, v.s[0].coef.d) : Q0;
  }
  function bigTex(str) {
    var neg = str.charAt(0) === '-'; if (neg) str = str.slice(1);
    var out = ''; for (var i = 0; i < str.length; i++) { if (i && (str.length - i) % 3 === 0) out += '\\,'; out += str[i]; }
    return (neg ? '-' : '') + out;
  }
  function valTex(v) {
    if (v.tx) return v.tx;
    if (v.big) return bigTex(v.big);
    var q = valRat(v);
    if (q) return qTex(q, v.dec);
    if (v.s) return AL.surdToTex(v.s);
    return numTex(v.x).tex;
  }
  function valExact(v) { return !!(v.big || v.s); }
  function leafOf(v) { return { t: 'num', v: v.x, val: v, tx: valTex(v) }; }
  function prepLeaves(n) {
    if (!n) return n;
    if (n.t === 'num') {
      if (n.val) return n;
      if (n.sym) return { t: 'num', v: n.v, sym: n.sym, val: { s: null, x: n.v, sym: n.sym } };
      var q = qLit(n.v);
      return leafOf(valQ(q, n.dec || !Number.isInteger(n.v)));
    }
    var c = {}; for (var k in n) c[k] = n[k];
    if (n.a) c.a = prepLeaves(n.a);
    if (n.b) c.b = prepLeaves(n.b);
    if (n.base) c.base = prepLeaves(n.base);
    return c;
  }
  // точное значение вычисленного double: дробь с небольшим знаменателем или
  // ±√(дробь) — так «табличные» sin(π/3) = √3/2, lg 1000 = 3 остаются точными
  function recoverVal(x) {
    var q = recoverQ(x, 1000);
    if (q) return valQ(q);
    var q2 = recoverQ(x * x, 1000);
    if (q2 && !isF(q2) && q2.n > 0 && Math.abs(Math.sqrt(qv(q2)) - Math.abs(x)) < 1e-13 * Math.max(1, Math.abs(x))) {
      var s = AL.surdSqrtInt(q2.n * q2.d);
      if (s) { s = AL.surdMulRat(s, { n: x < 0 ? -1 : 1, d: q2.d }); return { s: s, x: x, dec: false }; }
    }
    return null;
  }
  function isLeaf(n) { return n.t === 'num' && n.val; }
  function bigPow(base, k) {
    if (typeof BigInt === 'undefined') return null;
    try { var r = BigInt(base) ** BigInt(k); return r.toString(); } catch (e) { return null; }
  }
  function bigFact(k) {
    if (typeof BigInt === 'undefined') return null;
    var r = BigInt(1); for (var i = 2; i <= k; i++) r *= BigInt(i);
    return r.toString();
  }
  function signRuleText(op, qa, qb) {
    var na = qSign(qa) < 0, nb = qSign(qb) < 0;
    if (op === '*' || op === '/') {
      if (na && nb) return 'минус на минус даёт плюс';
      if (na || nb) return 'при ' + (op === '*' ? 'умножении' : 'делении') + ' чисел с разными знаками получается отрицательное число';
      return '';
    }
    if (!na && !nb) return '';          // обычные положительные числа — правило знаков не нужно
    var parts = [];
    if (op === '-' && nb) parts.push('вычитание отрицательного числа — это сложение: $a - (-b) = a + b$');
    var bNeg = op === '+' ? nb : !nb;   // знак второго слагаемого после перехода к сложению
    if (na && bNeg) parts.push('оба слагаемых отрицательные: модули складываем, знак «минус» сохраняем');
    else if (na !== bNeg) parts.push('у чисел разные знаки: из большего модуля вычитаем меньший и ставим знак числа с большим модулем');
    return parts.join('; ');
  }
  function fracOpText(op, qa, qb, r) {
    if (isF(qa) || isF(qb) || (qa.d === 1 && qb.d === 1)) return '';
    if (op === '+' || op === '-') {
      if (qa.d === qb.d) return 'знаменатели одинаковые — ' + (op === '+' ? 'складываем' : 'вычитаем') + ' числители';
      var L = lcm(qa.d, qb.d), na = qa.n * (L / qa.d), nb = qb.n * (L / qb.d);
      var raw = op === '+' ? na + nb : na - nb, g = gcd(raw, L);
      return 'приводим к общему знаменателю $' + L + '$ (НОК знаменателей): $' + qTex(qa) + ' = \\frac{' + na + '}{' + L + '}$, $' +
        qTex(qb) + ' = \\frac{' + nb + '}{' + L + '}$; ' + (op === '+' ? 'складываем' : 'вычитаем') + ' числители: $\\frac{' + raw + '}{' + L + '}' +
        (g > 1 ? ' = ' + qTex(r) + '$ (сократили на $' + g + '$)' : '$');
    }
    if (op === '*') {
      var rn = qa.n * qb.n, rd = qa.d * qb.d, g2 = gcd(rn, rd);
      return 'перемножаем числители и знаменатели: $\\frac{' + qa.n + ' \\cdot ' + qTexP(qi(qb.n)) + '}{' + qa.d + ' \\cdot ' + qb.d + '} = \\frac{' + rn + '}{' + rd + '}' + (g2 > 1 ? ' = ' + qTex(r) + '$ (сократили на $' + g2 + '$)' : '$');
    }
    if (op === '/') {
      var inv = qDiv(Q1, qb);
      return 'делить на дробь — значит умножать на перевёрнутую: $' + qTex(qa) + ' \\cdot ' + qTexP(inv) + ' = ' + qTex(r) + '$';
    }
    return '';
  }
  // объяснение избавления от иррациональности в знаменателе
  function rationalizeText(A, B, res) {
    var a = valTex(A), b = valTex(B), r = valTex(res);
    var sq = B.s.every(function (t) { return t.rad === 1 || (t.ex.length && t.ex.every(function (e) { return e[2] === 2; })); });
    var aP = A.s && A.s.length > 1 ? '\\left(' + a + '\\right)' : a;
    if (B.s.length === 1) {
      var t = B.s[0], L = 1; t.ex.forEach(function (e) { L = lcm(L, e[2]); });
      var R = 1; t.ex.forEach(function (e) { R *= Math.pow(e[0], e[1] * L / e[2]); });
      var mulTex = L === 2 ? '\\sqrt{' + R + '}' : '\\sqrt[' + L + ']{' + R + '^{' + (L - 1) + '}}';
      var txt = 'Деление на корень: чтобы в знаменателе не было корня, домножаем числитель и знаменатель на $' + mulTex + '$: $\\frac{' + a + '}{' + b + '} = ' + r + '$';
      return { text: txt };
    }
    if (sq && B.s.length === 2) {
      var t1 = B.s[0], t2 = B.s[1];
      var pos = function (t) { return B.tx ? B.tx.indexOf(AL.surdToTex([{ coef: { n: 1, d: 1 }, rad: t.rad, ex: t.ex }]).replace(/^1$/, String(Math.abs(t.coef.n)))) : 0; };
      if (B.tx ? pos(t1) > pos(t2) : (t1.coef.n < 0 && t2.coef.n > 0)) { var tt = t1; t1 = t2; t2 = tt; }   // как в записи: «√3 − 1»
      var conj = [t1, { coef: { n: -t2.coef.n, d: t2.coef.d }, rad: t2.rad, ex: t2.ex }];
      var cTex = AL.surdToTex(conj), den = AL.surdMul(B.s, conj), num = AL.surdMul(A.s, conj);
      if (!den || !num) return null;
      var txt2 = 'Избавляемся от иррациональности в знаменателе: домножаем числитель и знаменатель на сопряжённое выражение $' + cTex + '$ и пользуемся формулой $(a+b)(a-b) = a^{2} - b^{2}$: ' +
        '$\\frac{' + (a === '1' ? cTex : aP + ' \\cdot \\left(' + cTex + '\\right)') + '}{\\left(' + b + '\\right)\\left(' + cTex + '\\right)} = ' + (function () { var f = AL.surdIsRational(den) && den.length && den[0].coef.n === 1 && den[0].coef.d === 1 ? AL.surdToTex(num) : '\\frac{' + AL.surdToTex(num) + '}{' + AL.surdToTex(den) + '}'; return f === r ? r : f + ' = ' + r; })() + '$';
      return { text: txt2 };
    }
    return { text: 'Избавляемся от иррациональности в знаменателе ' + (sq ? '(домножаем на сопряжённые выражения, пока корни в знаменателе не исчезнут)' : '(домножаем на неполный квадрат суммы или разности, чтобы получить сумму или разность кубов: $a^{3} \\pm b^{3} = (a \\pm b)(a^{2} \\mp ab + b^{2})$)') + ': $\\frac{' + a + '}{' + b + '} = ' + r + '$' };
  }
  var OP_NAME = { '+': 'Сложение', '-': 'Вычитание', '*': 'Умножение', '/': 'Деление' };
  var OP_SIGN = { '+': ' + ', '-': ' - ', '*': ' \\cdot ', '/': ' : ' };
  // Выполнить одно действие над узлом, у которого все дети — готовые числа.
  function doOp(n) {
    var A = n.a && n.a.val, B = n.b && n.b.val, res = null, text = '', full = '', cols = null;
    var opTex = function (r) { return T(n) + ' = ' + valTex(r); };
    switch (n.t) {
      case '+': case '-': case '*': case '/': {
        if (n.t === '/' && Math.abs(B.x) < 1e-300 && (!B.s || !B.s.length)) fail('деление на ноль: в примере получилось $' + T(n) + '$, а на ноль делить нельзя');
        var s = null;
        if (A.s && B.s) {
          s = n.t === '+' ? AL.surdAdd(A.s, B.s) : n.t === '-' ? AL.surdSub(A.s, B.s) : n.t === '*' ? AL.surdMul(A.s, B.s) : AL.surdDiv(A.s, B.s);
        }
        var x = n.t === '+' ? A.x + B.x : n.t === '-' ? A.x - B.x : n.t === '*' ? A.x * B.x : A.x / B.x;
        res = s ? { s: s, x: AL.surdToNumber(s), dec: A.dec || B.dec } : (recoverVal(x) || { s: null, x: x });
        if (res.s && res.dec && valRat(res) && !terminates(valRat(res))) res.dec = false;
        var qa = valRat(A), qb = valRat(B), qr = valRat(res);
        text = OP_NAME[n.t] + ': $' + opTex(res) + '$';
        // «√5 + √2» — несоизмеримые корни не складываются: это не действие, оставляем запись как есть
        if ((n.t === '+' || n.t === '-') && res.s && A.s && B.s && A.s.length && B.s.length && res.s.length === A.s.length + B.s.length && !valRat(res)) {
          res.tx = T(n); return { val: res, silent: true };
        }
        // 3/4 — уже несократимая дробь, а не «действие деления»
        if (n.t === '/' && qa && qb && qIsInt(qa) && qIsInt(qb) && qb.n > 0 && !A.dec && !B.dec && qr && !qIsInt(qr) && gcd(qa.n, qb.n) === 1) return { val: res, silent: true };
        if (n.t === '/' && qa && qb && qIsInt(qa) && qIsInt(qb) && qr && !qIsInt(qr) && !A.dec && !B.dec) {
          var g0 = gcd(qa.n, qb.n);
          text = 'Сокращаем дробь на $' + g0 + '$: $' + opTex(res) + '$';
          return { val: res, text: text, full: text + ' — числитель и знаменатель делятся на $' + g0 + '$' };
        }
        if (n.t === '/' && B.s && !valRat(B) && res.s) {
          var ir = rationalizeText(A, B, res);
          if (ir) { text = ir.text; full = ir.full || ''; break; }
        }
        if (qa && qb && qr) {
          var extra = [fracOpText(n.t, qa, qb, qr), (qa.d === 1 && qb.d === 1) || A.dec || B.dec ? signRuleText(n.t, qa, qb) : ''].filter(Boolean);
          if (extra.length) full = text + ' — ' + extra.join('; ');
          if (n.t !== '/' || terminates(qr) || A.dec || B.dec) cols = column(n.t, qa, qb);
        }
        if (n.t === '/' && qa && qb && qr && qa.d === 1 && qb.d === 1 && qr.d !== 1 && !A.dec && !B.dec)
          full = (full || text) + ' — нацело не делится, записываем результат несократимой дробью';
        break;
      }
      case '^': {
        var k = valRat(B);
        if (A.x === 0 && B.x === 0) fail('выражение $0^{0}$ не определено');
        if (A.x === 0 && B.x < 0) fail('ноль в отрицательной степени — это деление на ноль: $' + T(n) + '$');
        var qA = valRat(A);
        if (k && qIsInt(k) && k.n > 0 && qA && qIsInt(qA) && Math.abs(Math.pow(qA.n, k.n)) > 1e15) {
          // огромное целое — считаем точно (BigInt), а не «1.2676506e+30»
          var bs = Math.abs(qA.n) > 1 && k.n * Math.log10(Math.abs(qA.n)) < 400 ? bigPow(qA.n, k.n) : null;
          res = bs ? { s: null, x: Math.pow(qA.n, k.n), big: bs } : { s: null, x: Math.pow(qA.n, k.n) };
          text = 'Возведение в степень: $' + opTex(res) + '$';
        } else if (k && A.s && !isF(k)) {
          if (A.x < 0 && k.d % 2 === 0) fail('корень чётной степени из отрицательного числа не существует среди действительных чисел: $' + T(n) + '$ (для комплексных ответов добавьте в пример $i$)');
          var sp = AL.surdPowQ(A.s, { n: k.n, d: k.d });
          if (sp) res = { s: sp, x: AL.surdToNumber(sp), dec: A.dec && !!valRat({ s: sp }) };
          var resTex = res ? valTex(res) : null;
          if (k.d > 1 && k.n === 1 && rootIndex(n.b) && res) {
            var qAb = valRat(A), rr = res.s;
            if (qAb && qIsInt(qAb) && qAb.n > 0 && rr.length === 1 && rr[0].rad !== 1 && qIsInt(Q(rr[0].coef.n, rr[0].coef.d)) && rr[0].coef.n > 1) {
              var cc = rr[0].coef.n, ck = Math.pow(cc, k.d);
              text = 'Выносим множитель из-под корня: $' + T(n) + ' = ' + (k.d === 2 ? '\\sqrt{' : '\\sqrt[' + k.d + ']{') + ck + ' \\cdot ' + (qAb.n / ck) + '} = ' + valTex(res) + '$' + ' (так как $' + ck + ' = ' + cc + '^{' + k.d + '}$)';
            } else if (valRat(res) && qIsInt(valRat(res)) && qAb) {
              text = 'Извлекаем корень: $' + T(n) + ' = ' + valTex(res) + '$, так как $' + wrapNeg(valTex(res)) + '^{' + k.d + '} = ' + valTex(A) + '$';
            } else text = 'Извлекаем корень: $' + opTex(res) + '$';
          } else if (k.d > 1) {
            var rootT = (k.d === 2 ? '\\sqrt{' : '\\sqrt[' + k.d + ']{') + (Math.abs(k.n) === 1 ? valTex(A) : wrapNeg(valTex(A)) + '^{' + Math.abs(k.n) + '}') + '}';
            text = 'Степень с дробным показателем — это корень: $a^{\\frac{p}{q}} = \\sqrt[q]{a^{p}}$, $' + T(n) + ' = ' + (k.n < 0 ? '\\frac{1}{' + rootT + '}' : rootT) + ' = ' + (resTex || fTex(Math.pow(A.x, B.x), 10)) + '$';
            if (!res) res = { s: null, x: Math.pow(Math.abs(A.x), qv(k)) * (A.x < 0 && Math.abs(k.n) % 2 ? -1 : 1) };
          } else {
            text = 'Возведение в степень: $' + opTex(res || { s: null, x: Math.pow(A.x, B.x) }) + '$';
            if (res && k.n === 0) full = text + ' — любое ненулевое число в нулевой степени равно $1$';
            else if (res && k.n < 0) full = 'Возведение в степень: $' + T(n) + ' = \\frac{1}{' + wrapNeg(valTex(A)) + '^{' + (-k.n) + '}} = ' + valTex(res) + '$ — отрицательная степень: $a^{-n} = \\frac{1}{a^{n}}$';
            else if (res && k.n >= 2 && k.n <= 5) {
              var f = []; for (var j = 0; j < k.n; j++) f.push(wrapNeg(valTex(A)));
              full = 'Возведение в степень: $' + T(n) + ' = ' + f.join(' \\cdot ') + ' = ' + valTex(res) + '$';
              if (valRat(A) && qSign(valRat(A)) < 0) full += ' — отрицательное число в ' + (k.n % 2 ? 'нечётной степени остаётся отрицательным' : 'чётной степени становится положительным');
            }
          }
        } else {
          var xv = Math.pow(A.x, B.x);
          if (!isFinite(xv) || isNaN(xv)) fail('не удаётся вычислить $' + T(n) + '$ среди действительных чисел');
          res = recoverVal(xv) || { s: null, x: xv };
          text = 'Возведение в степень: $' + opTex(res) + '$';
        }
        if (!res) { var xv2 = Math.pow(A.x, B.x); res = { s: null, x: xv2 }; text = 'Возведение в степень: $' + opTex(res) + '$'; }
        break;
      }
      case 'neg': {
        res = A.big ? { s: null, x: -A.x, big: A.big.charAt(0) === '-' ? A.big.slice(1) : '-' + A.big }
                    : { s: A.s ? AL.surdNeg(A.s) : null, x: -A.x, dec: A.dec };
        text = 'Меняем знак: $' + opTex(res) + '$';
        break;
      }
      case 'fact': {
        var kf = valRat(A);
        if (!kf || !qIsInt(kf) || kf.n < 0) fail('факториал определён только для целых неотрицательных чисел, а здесь $' + valTex(A) + '!$');
        if (kf.n > 170) fail('$' + kf.n + '!$ слишком велико для вычисления');
        var fx = MF.evalAst({ t: 'fact', a: Nn(kf.n) });
        res = kf.n <= 18 ? valQ(qi(fx)) : { s: null, x: fx, big: bigFact(kf.n) };
        text = 'Факториал: $' + opTex(res) + '$';
        if (kf.n >= 2 && kf.n <= 7) { var fs = []; for (var fi = 1; fi <= kf.n; fi++) fs.push(fi); full = 'Факториал — произведение всех натуральных чисел до $' + kf.n + '$: $' + kf.n + '! = ' + fs.join(' \\cdot ') + ' = ' + valTex(res) + '$'; }
        break;
      }
      case 'fn': {
        var arg = A;
        if (n.name === 'sqrt' || n.name === 'abs') {
          if (n.name === 'abs') {
            res = arg.x < 0 ? (arg.s ? { s: AL.surdNeg(arg.s), x: -arg.x, dec: arg.dec } : { s: null, x: -arg.x, big: arg.big && arg.big.replace(/^-/, '') }) : arg;
            text = 'Модуль: $' + opTex(res) + '$' + (arg.x < 0 ? ' — модуль отрицательного числа равен противоположному числу' : '');
            break;
          }
          if (arg.x < 0) fail('квадратный корень из отрицательного числа $' + valTex(arg) + '$ среди действительных чисел не существует (для комплексного ответа добавьте в пример $i$)');
          var qs = valRat(arg);
          if (!qs && arg.s) {
            var srs = AL.surdRoot(arg.s, 2);
            if (srs) {
              res = { s: srs, x: AL.surdToNumber(srs) };
              text = 'Извлекаем корень: $' + opTex(res) + '$';
              full = text + ' — подкоренное выражение — полный квадрат: $' + valTex(arg) + ' = \\left(' + valTex(res) + '\\right)^{2}$';
              break;
            }
          }
          if (qs && !isF(qs)) {
            var sr = AL.surdSqrtInt(qs.n * qs.d);
            if (sr) {
              sr = AL.surdMulRat(sr, { n: 1, d: qs.d });
              res = { s: sr, x: Math.sqrt(qv(qs)), dec: arg.dec && !!valRat({ s: sr }) };
              text = 'Извлекаем корень: $' + opTex(res) + '$';
              var rad = qs.d === 1 ? AL.simplifyRadical(qs.n) : null;
              if (rad && rad.coef > 1 && rad.inner > 1) full = 'Выносим множитель из-под корня: $\\sqrt{' + qs.n + '} = \\sqrt{' + (rad.coef * rad.coef) + ' \\cdot ' + rad.inner + '} = ' + valTex(res) + '$';
              else if (qs.d > 1 && !valRat(res)) full = text + ' — корень из дроби: $\\sqrt{\\frac{a}{b}} = \\frac{\\sqrt{ab}}{b}$, чтобы в знаменателе не было корня';
              break;
            }
          }
          var sx = Math.sqrt(arg.x);
          res = recoverVal(sx) || { s: null, x: sx };
          text = 'Извлекаем корень: $' + opTex(res) + '$';
          break;
        }
        var fnv = evalN({ t: 'fn', name: n.name, a: Nn(arg.x), base: n.base ? Nn(n.base.val.x) : undefined });
        var nm = n.base ? 'log' : n.name;
        if (!isFinite(fnv) || isNaN(fnv)) {
          if (nm === 'ln' || nm === 'log' || nm === 'lg') fail('логарифм определён только для положительных чисел, а здесь аргумент $' + valTex(arg) + '$');
          if (nm === 'asin' || nm === 'acos' || nm === 'arcsin' || nm === 'arccos') fail('$' + FN_TEX[nm] + '$ определён только для чисел от $-1$ до $1$, а здесь $' + valTex(arg) + '$');
          fail('$' + T(n) + '$ не определено');
        }
        if ((nm === 'tan' || nm === 'tg') && Math.abs(Math.cos(arg.x)) < 1e-12) fail('$\\operatorname{tg}$ не определён там, где $\\cos = 0$: $' + T(n) + '$');
        if ((nm === 'cot' || nm === 'ctg') && Math.abs(Math.sin(arg.x)) < 1e-12) fail('$\\operatorname{ctg}$ не определён там, где $\\sin = 0$: $' + T(n) + '$');
        if (n.base && (n.base.val.x <= 0 || Math.abs(n.base.val.x - 1) < 1e-15)) fail('основание логарифма должно быть положительным и не равным $1$');
        var rec = recoverVal(fnv);
        res = rec || { s: null, x: fnv };
        text = 'Вычисляем $' + opTex(res) + '$' + (rec ? (TRIG[nm] || /^a|^arc/.test(nm) ? ' (табличное значение)' : '') : ' (приближённо)');
        break;
      }
      default: fail('не удаётся вычислить $' + T(n) + '$');
    }
    return { val: res, text: text, full: full, cols: cols };
  }
  function rankOf(n, parent) {
    var inBrackets = parent && (PREC[parent.t] || 9) > (PREC[n.t] || 9) && parent.t !== '/';
    if (parent && parent.t === 'fn') inBrackets = true;
    if (inBrackets) return -1;
    if (n.t === 'fn' || n.t === 'fact' || n.t === '^') return 0;
    if (n.t === '*' || n.t === '/') return 1;
    return 2;
  }
  function findNext(root) {
    var best = null;
    (function walk(n, parent) {
      if (!n || isLeaf(n)) return;
      var ks = kids(n);
      ks.forEach(function (c) { walk(c, n); });
      if (ks.length && ks.every(isLeaf)) {
        var r = rankOf(n, parent);
        if (!best || r < best.r) best = { n: n, r: r };
      }
    })(root, null);
    return best && best.n;
  }
  function replaceNode(target, val) {
    Object.keys(target).forEach(function (k) { delete target[k]; });
    var l = leafOf(val);
    for (var k in l) target[k] = l[k];
  }
  function traceEval(ast, S) {
    var cur = prepLeaves(clone(ast));
    var first = S.add(T(ast), 'Выполняем действия по порядку: сначала скобки, затем степени и функции, потом умножение и деление, в конце — сложение и вычитание.', 0);
    for (var guard = 0; guard < 200; guard++) {
      // знак «минус» перед готовым числом — не отдельное действие
      (function foldNeg(n) {
        if (!n || isLeaf(n)) return;
        kids(n).forEach(foldNeg);
        if (n.t === 'neg' && isLeaf(n.a)) replaceNode(n, doOp(n).val);
      })(cur);
      if (isLeaf(cur)) break;
      var target = findNext(cur);
      if (!target) fail('не удаётся вычислить выражение');
      var r = doOp(target);
      replaceNode(target, r.val);
      if (!r.silent) S.add(T(cur), r.text, 1, { textFull: r.full || undefined, cols: r.cols ? [r.cols] : undefined });
    }
    var v = cur.val;
    if (!v || !isFinite(v.x)) fail('результат не является конечным числом');
    first.briefTex = T(ast) + ' = ' + valTex(v);
    return v;
  }
  function valAnswer(v) {
    var tex = valTex(v), items = [], extra = [];
    var q = valRat(v);
    var approx = null, approxExact = false;
    if (v.big) approx = null;
    else if (q && !qIsInt(q)) {
      if (terminates(q) && !v.dec) { approx = decStr(q); approxExact = true; }
      else if (!terminates(q)) approx = MF.fmtNum(qv(q), 10);
      if (Math.abs(q.n) > q.d && !isF(q)) {
        var whole = Math.trunc(q.n / q.d), rest = Math.abs(q.n % q.d);
        extra.push('смешанное число: $' + whole + '\\frac{' + rest + '}{' + q.d + '}$');
      }
    } else if (!q && v.s) approx = MF.fmtNum(v.x, 10);
    else if (!q && !v.s && !v.big) { var nt = numTex(v.x); if (nt.exact) approx = MF.fmtNum(v.x, 10); else { tex = '\\approx ' + fTex(v.x, 10); } }
    items.push({ tex: tex, approx: approx, approxExact: approxExact });
    return { label: 'Ответ', items: items, extra: extra };
  }

  /* ================= 10. УРАВНЕНИЯ С ОДНОЙ ПЕРЕМЕННОЙ ===================
     Решение (Sol): { roots:[Rt], all, allCond, intervals, series, numeric,
                      periodic, none } */
  function sol(roots, extra) {
    var s = { roots: uniqRoots(roots || []), all: false, series: null, numeric: false, intervals: null };
    if (extra) for (var k in extra) s[k] = extra[k];
    return s;
  }
  var DEG_NAME = ['нулевой', 'первой', 'второй', 'третьей', 'четвёртой', 'пятой', 'шестой', 'седьмой', 'восьмой', 'девятой', 'десятой'];
  function degName(d) { return (DEG_NAME[d] || d + '-й') + ' степени'; }
  function mv(v) { var m = {}; m[v] = 1; return m; }
  function coefIn(p, v, k) { var m = {}; if (k) m[v] = k; var t = p.t[mKey(m)]; return t ? t.c : Q0; }

  // Что именно в уравнении зависит от переменной: знаменатель, корень,
  // модуль, показатель, логарифм, тригонометрия… и есть ли «голая» v.
  function features(n, v) {
    var f = { den: false, rad: false, abs: false, exp: false, log: false, trig: false, other: false, free: false, trigArgs: {} };
    (function walk(x, inside) {
      if (!x || !hasV(x, v)) return;
      switch (x.t) {
        case 'var': if (!inside) f.free = true; return;
        case '/': walk(x.a, inside); if (hasV(x.b, v)) f.den = true; walk(x.b, inside); return;
        case '^': {
          if (hasV(x.b, v)) { f.exp = true; walk(x.a, true); walk(x.b, true); return; }
          var e = constQ(x.b);
          if (!e || isF(e)) { f.other = true; walk(x.a, true); return; }
          if (!qIsInt(e)) { f.rad = true; walk(x.a, true); return; }
          if (e.n < 0) f.den = true;
          walk(x.a, inside); return;
        }
        case 'fn': {
          var nm = x.name;
          if (nm === 'sqrt') f.rad = true;
          else if (nm === 'abs') f.abs = true;
          else if (nm === 'exp') f.exp = true;
          else if (nm === 'ln' || nm === 'log' || nm === 'lg') f.log = true;
          else if (TRIG[nm]) { f.trig = true; f.trigArgs[T(x.a)] = 1; }
          else f.other = true;
          walk(x.a, true); return;
        }
        case 'fact': f.other = true; return;
        default: kids(x).forEach(function (c) { walk(c, inside); });
      }
    })(n, false);
    return f;
  }

  // Главный вход: L = R относительно v. Шаги пишутся в S.
  function solveEq(L, Rr, v, S, cx) {
    var diff = sub(L, Rr), f = features(diff, v), r = null;
    if (!hasV(diff, v)) {
      var lv = evalN(L), rv = evalN(Rr);
      if (isFinite(lv) && isFinite(rv) && Math.abs(lv - rv) < 1e-9 * Math.max(1, Math.abs(lv))) { S.add(null, 'Переменная сократилась, получилось верное числовое равенство — подходит любое $' + v + '$.', 0); return sol([], { all: true }); }
      S.add(null, 'Переменная сократилась, получилось неверное числовое равенство — решений нет.', 0);
      return sol([]);
    }
    if (f.abs) r = absEq(L, Rr, v, S, cx);
    else if (!f.den && !f.rad && !f.exp && !f.log && !f.trig && !f.other) r = polyEq(L, Rr, v, S, cx);
    else if (f.den && !f.rad && !f.exp && !f.log && !f.trig && !f.other) r = rationalEq(L, Rr, v, S, cx);
    else if (f.rad && !f.exp && !f.log && !f.trig && !f.other) r = radicalEq(L, Rr, v, S, cx);
    else if (f.exp && !f.log && !f.trig && !f.other && !f.rad) r = expEq(L, Rr, v, S, cx);
    else if (f.log && !f.exp && !f.trig && !f.other && !f.rad) r = logEq(L, Rr, v, S, cx);
    else if (f.trig && !f.exp && !f.log && !f.other && !f.rad && !f.den) r = trigEq(L, Rr, v, S, cx);
    if (r) return r;
    return numericEq(L, Rr, v, S, cx, whyNumeric(f, v));
  }
  // Честное, конкретное объяснение, почему нет точной формулы.
  function whyNumeric(f, v) {
    var what = [];
    if (f.exp) what.push('в показателе степени');
    if (f.log) what.push('под знаком логарифма');
    if (f.trig) what.push('под знаком тригонометрической функции');
    if (f.rad) what.push('под корнем');
    if (f.den) what.push('в знаменателе');
    if (f.other) what.push('под знаком функции, для которой нет обратной в элементарном виде');
    var s;
    if (what.length && f.free) s = 'Переменная $' + v + '$ стоит одновременно ' + what.join(', ') + ' и вне ' + (what.length > 1 ? 'их' : 'него') + ' — такое уравнение (трансцендентное) не сводится к алгебраическому и в общем виде точно не решается.';
    else if (what.length > 1) s = 'Переменная $' + v + '$ стоит сразу ' + what.join(' и ') + ' — стандартные приёмы (замена, логарифмирование, возведение в степень) здесь не приводят к уравнению известного вида.';
    else if (f.trig && Object.keys(f.trigArgs).length > 1) s = 'Под тригонометрическими функциями стоят разные аргументы, которые не сводятся друг к другу формулами двойного угла.';
    else s = 'Уравнение не приводится к виду, который решается по формуле.';
    return s + ' Поэтому корни находим численно: ищем смены знака и уточняем их.';
  }

  /* ------------------------------------------------------- многочлены */
  function expandSides(L, Rr, rel, S) {
    var notes = [], tl = tlFromAst(L, notes), tr = tl && tlFromAst(Rr, notes);
    if (!tr) return null;
    var orig = T(L) + ' ' + rel + ' ' + T(Rr), exp = termsTex(tl) + ' ' + rel + ' ' + termsTex(tr);
    if (notes.length && exp !== orig) S.add(exp, 'Раскрываем скобки: ' + notes.join('; ') + '.', 1);
    if (hasLikeTerms(tl) || hasLikeTerms(tr)) {
      var l2 = pTex(tlToPoly(tl)) + ' ' + rel + ' ' + pTex(tlToPoly(tr));
      var ln = [likeTermsNote(tl), likeTermsNote(tr)].filter(Boolean).join('; ');
      S.add(l2, 'Приводим подобные слагаемые в каждой части.', 1, { textFull: 'Приводим подобные слагаемые (складываем коэффициенты при одинаковых буквенных частях): ' + ln + '.' });
    }
    return { l: tlToPoly(tl), r: tlToPoly(tr) };
  }
  function polyEq(L, Rr, v, S, cx) {
    var sides = expandSides(L, Rr, '=', S);
    if (!sides) return null;
    var c = pToUni(pSub(sides.l, sides.r), v);
    if (!c) return null;
    var d = uDeg(c);
    if (d <= 1) return linearEq(sides.l, sides.r, v, S, cx);
    S.add(uTex(c, v) + ' = 0', 'Переносим все слагаемые в левую часть (перенесённые меняют знак) и приводим подобные — получаем уравнение ' + degName(d) + '.', 0);
    return solveUni(c, v, S, cx);
  }
  function linearEq(pl, pr, v, S, cx) {
    var all = pList(pl).concat(pList(pr)), L = 1, exact = true;
    all.forEach(function (t) { if (isF(t.c)) exact = false; else L = lcm(L, t.c.d); });
    if (exact && L > 1) {
      var k = qi(L); pl = pScale(pl, k); pr = pScale(pr, k);
      S.add(pTex(pl) + ' = ' + pTex(pr), 'Умножаем обе части на $' + L + '$ — наименьший общий знаменатель дробей, чтобы избавиться от них.', 1);
    }
    var a1 = coefIn(pl, v, 1), b1 = coefIn(pl, v, 0), a2 = coefIn(pr, v, 1), b2 = coefIn(pr, v, 0);
    var A = qSub(a1, a2), B = qSub(b2, b1);
    if (!qZero(a2) || !qZero(b1)) {
      var lt = [], rt = [], moved = [];
      if (!qZero(a1)) lt.push({ c: a1, m: mv(v) });
      if (!qZero(a2)) { lt.push({ c: qNeg(a2), m: mv(v) }); moved.push('$' + termsTex([{ c: a2, m: mv(v) }]) + '$ — влево со знаком «' + (qSign(a2) > 0 ? '−' : '+') + '»'); }
      if (!qZero(b2)) rt.push({ c: b2, m: {} });
      if (!qZero(b1)) { rt.push({ c: qNeg(b1), m: {} }); moved.push('$' + qTex(b1) + '$ — вправо со знаком «' + (qSign(b1) > 0 ? '−' : '+') + '»'); }
      S.add(termsTex(lt) + ' = ' + termsTex(rt), 'Переносим слагаемые с $' + v + '$ в левую часть, а числа — в правую; при переносе через знак «=» слагаемое меняет знак на противоположный.', 1,
        { textFull: 'Переносим слагаемые с $' + v + '$ влево, числа — вправо, меняя знак у перенесённых: ' + moved.join(', ') + '.' });
      var cA = (lt.length > 1 ? column('+', lt[0].c, lt[1].c) : null), cB = (rt.length > 1 ? column('+', rt[0].c, rt[1].c) : null);
      S.add(termsTex(qZero(A) ? [{ c: Q0, m: {} }] : [{ c: A, m: mv(v) }]).replace(/^0$/, '0 \\cdot ' + v) + ' = ' + qTex(B), 'Приводим подобные слагаемые.', 0, { cols: [cA, cB].filter(Boolean) });
    }
    if (qZero(A)) {
      if (qZero(B)) { S.add(null, 'Получили $0 \\cdot ' + v + ' = 0$ — равенство верно при любом значении $' + v + '$.', 0); return sol([], { all: true }); }
      S.add(null, 'Получили $0 \\cdot ' + v + ' = ' + qTex(B) + '$: при любом $' + v + '$ слева будет $0$, а не $' + qTex(B) + '$, — решений нет.', 0);
      return sol([], { none: true });
    }
    if (qOne(A)) return sol([rootQ(B)]);
    var x = qDiv(B, A);
    if (qEq(A, qi(-1))) { S.add(v + ' = ' + qTex(x), 'Умножаем обе части на $-1$.', 0); return sol([rootQ(x)]); }
    var t = v + ' = ' + qTex(B) + ' : ' + qTexP(A) + ' = ' + qTex(x);
    var txt = 'Делим обе части на коэффициент при $' + v + '$, то есть на $' + qTex(A) + '$.';
    if (!isF(x) && x.d !== 1 && qIsInt(A) && qIsInt(B)) txt += ' Нацело не делится — ответ записываем несократимой дробью' + (terminates(x) ? ' (или десятичной: $' + decStr(x) + '$)' : '') + '.';
    S.add(t, txt, 0, { briefTex: v + ' = ' + qTex(x), cols: [column('/', B, A)].filter(Boolean) });
    return sol([rootQ(x)]);
  }

  // P(v) = 0 для многочлена c (массив коэффициентов), любой степени.
  function solveUni(c, v, S, cx) {
    c = uTrim(c);
    var d = uDeg(c);
    if (d < 0) { S.add(null, 'Все коэффициенты сократились: $0 = 0$ — подходит любое $' + v + '$.', 0); return sol([], { all: true }); }
    if (d === 0) { S.add(null, 'Получилось $' + qTex(c[0]) + ' = 0$ — неверно, решений нет.', 0); return sol([], { none: true }); }
    if (d === 1) {
      var x = qDiv(qNeg(c[0]), c[1]);
      if (!qOne(c[1]) || !qZero(c[0])) S.add(v + ' = ' + qTex(x), 'Линейное уравнение: переносим свободный член и делим на коэффициент при $' + v + '$.', 0);
      return sol([rootQ(x)]);
    }
    if (d === 2) return quadEq(c, v, S, cx);
    return higherEq(c, v, S, cx);
  }
  // Целые взаимно простые коэффициенты и положительный старший — как в тетради.
  function normalizeUni(c, v, S) {
    var sc = uIntScale(c);
    if (!sc) return c;
    var k = sc.k, lead = sc.c[sc.c.length - 1];
    if (qSign(lead) < 0) k = qNeg(k);
    if (qOne(k)) return c;
    var nc = uScale(c, k), why = [];
    if (!qIsInt(k) || Math.abs(qv(k)) < 1) why.push('делим на общий множитель коэффициентов');
    else if (c.some(function (q) { return !qIsInt(q); })) why.push('избавляемся от дробей');
    if (qSign(k) < 0) why.push('делаем старший коэффициент положительным');
    S.add(uTex(nc, v) + ' = 0', 'Умножаем обе части на $' + qTex(k) + '$' + (why.length ? ': ' + why.join(' и ') : '') + '.', 1);
    return nc;
  }
  function sqrtQ(q) {   // точный квадратный корень из рационального, иначе null
    if (isF(q) || q.n < 0) return null;
    var a = Math.round(Math.sqrt(q.n)), b = Math.round(Math.sqrt(q.d));
    return (a * a === q.n && b * b === q.d) ? Q(a, b) : null;
  }
  // √q для рационального q в виде SurdNum-записи: √(n/d) = √(nd)/d.
  function sqrtTexQ(q) {
    var s = sqrtQ(q);
    if (s) return { tex: qTex(s), val: qv(s), rational: s };
    if (isF(q)) return { tex: '\\sqrt{' + qTex(q) + '}', val: Math.sqrt(qv(q)) };
    var sr = AL.surdSqrtInt(q.n * q.d);
    if (!sr) return { tex: '\\sqrt{' + qTex(q) + '}', val: Math.sqrt(qv(q)) };
    sr = AL.surdMulRat(sr, { n: 1, d: q.d });
    return { tex: AL.surdToTex(sr), val: Math.sqrt(qv(q)), surd: sr };
  }
  // x = (P ± √Dv) / Den для целых P, Dv, Den — с сокращением и выносом множителя.
  function rootsForm(P, Dv, Den) {
    var rad = AL.simplifyRadical(Dv), g = gcd(gcd(Math.abs(P), rad.coef), Math.abs(Den)) || 1;
    var p = P / g, k = rad.coef / g, dd = Den / g;
    if (dd < 0) { p = -p; dd = -dd; }
    var sq = (k === 1 ? '' : k) + '\\sqrt{' + rad.inner + '}';
    function one(sign) { var core = (p ? p + (sign > 0 ? ' + ' : ' - ') : (sign > 0 ? '' : '-')) + sq; return dd === 1 ? core : '\\frac{' + core + '}{' + dd + '}'; }
    var pm = (p ? p + ' \\pm ' : '\\pm ') + sq;
    return { pm: dd === 1 ? pm : '\\frac{' + pm + '}{' + dd + '}', plus: one(1), minus: one(-1),
             vPlus: (P + Math.sqrt(Dv)) / Den, vMinus: (P - Math.sqrt(Dv)) / Den,
             simplified: rad.coef > 1 ? '\\sqrt{' + Dv + '} = \\sqrt{' + (rad.coef * rad.coef) + ' \\cdot ' + rad.inner + '} = ' + sq.replace(/^1\\/, '\\') : '' };
  }
  function offerMethods(cx, key, list, def) {
    if (cx.quiet || cx.methods) return (cx.pref && cx.pref[key] && list.some(function (m) { return m.id === cx.pref[key]; })) ? cx.pref[key] : def;
    var cur = (cx.pref && cx.pref[key] && list.some(function (m) { return m.id === cx.pref[key]; })) ? cx.pref[key] : def;
    if (list.length > 1) cx.methods = { key: key, list: list, current: cur };
    return cur;
  }

  /* ------------------------------------------------ квадратное уравнение */
  function quadEq(c, v, S, cx) {
    c = normalizeUni(c, v, S);
    var a = c[2], b = c[1], cc = c[0];
    var exact = !isF(a) && !isF(b) && !isF(cc);
    var D = qSub(qMul(b, b), qMul(qi(4), qMul(a, cc)));
    var sD = sqrtQ(D), rationalRoots = exact && sD && qSign(D) >= 0;
    var list = [];
    if (qZero(b) || qZero(cc)) list.push({ id: 'incomplete', label: 'Неполное уравнение' });
    list.push({ id: 'discriminant', label: 'Дискриминант' });
    if (exact && qIsInt(b) && b.n % 2 === 0 && !qZero(b)) list.push({ id: 'd4', label: 'Через D/4' });
    if (!qZero(b)) list.push({ id: 'square', label: 'Полный квадрат' });
    if (rationalRoots && !qZero(cc)) list.push({ id: 'vieta', label: 'Теорема Виета' });
    if (rationalRoots && !qZero(cc) && !qZero(b) && qSign(D) > 0 && qIsInt(a) && qIsInt(b) && qIsInt(cc)) list.push({ id: 'factor', label: 'Разложение на множители' });
    var m = offerMethods(cx, 'quad', list, list[0].id);
    if (m === 'incomplete') return quadIncomplete(a, b, cc, v, S);
    if (m === 'd4') return quadD(a, b, cc, v, S, true);
    if (m === 'square') return quadSquare(a, b, cc, v, S);
    if (m === 'vieta') return quadVieta(a, b, cc, v, S);
    if (m === 'factor') return quadFactor(a, b, cc, v, S) || quadD(a, b, cc, v, S, false);
    return quadD(a, b, cc, v, S, false);
  }
  function complexRootsTex(a, b, D, v) {   // для D < 0: x = p ± q·i
    var re = qDiv(qNeg(b), qMul(qi(2), a)), negD = qNeg(D), s = sqrtTexQ(negD);
    var im;
    if (s.rational) im = qTex(qAbs(qDiv(s.rational, qMul(qi(2), a))));
    else if (s.surd) { var t = AL.surdToTex(AL.surdMulRat(s.surd, isF(a) ? { n: 1, d: 1 } : { n: 1 * (a.d), d: 2 * Math.abs(a.n) })); im = t; }
    else im = fTex(Math.sqrt(qv(negD)) / Math.abs(2 * qv(a)), 6);
    if (im === '1') im = '';
    return v + '_{1,2} = ' + (qZero(re) ? '' : qTex(re) + ' ') + '\\pm ' + im + (im && /[0-9}]$/.test(im) ? ' ' : '') + 'i';
  }
  function quadD(a, b, cc, v, S, half) {
    S.add('a = ' + qTex(a) + ',\\quad b = ' + qTex(b) + ',\\quad c = ' + qTex(cc), 'Выписываем коэффициенты уравнения вида $ax^2 + bx + c = 0$.', 1);
    var D, tex, cols, k = half ? qDiv(b, qi(2)) : null;
    if (half) {
      var k2 = qMul(k, k), ac = qMul(a, cc);
      D = qSub(k2, ac);
      tex = 'D_1 = k^2 - ac = ' + qTexP(k) + '^2 - ' + qTexP(a) + ' \\cdot ' + qTexP(cc) + ' = ' + qTex(k2) + (qSign(ac) < 0 ? ' + ' + qTex(qNeg(ac)) : ' - ' + qTex(ac)) + ' = ' + qTex(D);
      cols = [column('*', k, k), column('*', a, cc), qSign(ac) < 0 ? column('+', k2, qNeg(ac)) : column('-', k2, ac)];
      S.add('k = \\frac{b}{2} = ' + qTex(k), 'Коэффициент $b$ чётный, поэтому удобнее считать «четверть дискриминанта» $D_1 = \\frac{D}{4}$ через $k = \\frac{b}{2}$ — числа получаются меньше.', 1);
    } else {
      var b2 = qMul(b, b), ac4 = qMul(qi(4), qMul(a, cc));
      D = qSub(b2, ac4);
      tex = 'D = b^2 - 4ac = ' + qTexP(b) + '^2 - 4 \\cdot ' + qTexP(a) + ' \\cdot ' + qTexP(cc) + ' = ' + qTex(b2) + (qSign(ac4) < 0 ? ' + ' + qTex(qNeg(ac4)) : ' - ' + qTex(ac4)) + ' = ' + qTex(D);
      cols = [column('*', b, b), column('*', qMul(qi(4), a), cc), qSign(ac4) < 0 ? column('+', b2, qNeg(ac4)) : column('-', b2, ac4)];
    }
    var Dn = half ? 'D_1' : 'D', sg = qSign(D);
    var dText = sg > 0 ? 'Дискриминант положительный — у уравнения два различных корня.' : sg === 0 ? 'Дискриминант равен нулю — корень один (два совпавших).' : 'Дискриминант отрицательный — действительных корней нет.';
    S.add(tex, 'Считаем дискриминант. ' + dText, 0, { briefTex: Dn + ' = ' + qTex(D), cols: cols.filter(Boolean) });
    if (sg < 0) {
      S.add(complexRootsTex(a, b, half ? qMul(D, qi(4)) : D, v), 'Для сведения: в комплексных числах корни есть — $\\sqrt{' + Dn + '}$ заменяется на $i\\sqrt{|' + Dn + '|}$. Но среди действительных чисел решений нет.', 1);
      return sol([], { none: true, noneWhy: Dn + ' < 0' });
    }
    var P = half ? qNeg(k) : qNeg(b), Den = half ? a : qMul(qi(2), a);
    var formula = half ? v + '_{1,2} = \\frac{-k \\pm \\sqrt{D_1}}{a}' : v + '_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}';
    if (sg === 0) {
      var x0 = qDiv(P, Den);
      S.add(v + ' = ' + (half ? '\\frac{-k}{a}' : '-\\frac{b}{2a}') + ' = \\frac{' + qTex(P) + '}{' + qTex(Den) + '} = ' + qTex(x0), 'При нулевом дискриминанте корень один.', 0, { briefTex: v + ' = ' + qTex(x0) });
      var r0 = rootQ(x0); r0.mult = 2;
      return sol([r0]);
    }
    var s = sqrtQ(D);
    if (s) {
      var x1 = qDiv(qAdd(P, s), Den), x2 = qDiv(qSub(P, s), Den);
      S.add(formula + ' = \\frac{' + qTex(P) + ' \\pm ' + qTex(s) + '}{' + qTex(Den) + '}', 'Подставляем в формулу корней; $\\sqrt{' + qTex(D) + '} = ' + qTex(s) + '$.', 1);
      S.add(v + '_1 = \\frac{' + qTex(P) + ' + ' + qTex(s) + '}{' + qTex(Den) + '} = ' + qTex(x1) + ',\\quad ' + v + '_2 = \\frac{' + qTex(P) + ' - ' + qTex(s) + '}{' + qTex(Den) + '} = ' + qTex(x2),
        'Считаем каждый корень отдельно: со знаком «+» и со знаком «−».', 0, { briefTex: v + '_1 = ' + qTex(x1) + ',\\quad ' + v + '_2 = ' + qTex(x2) });
      return sol([rootQ(x1), rootQ(x2)]);
    }
    if (qIsInt(P) && qIsInt(Den) && qIsInt(D)) {
      var rf = rootsForm(P.n, D.n, Den.n);
      if (rf.simplified) S.add(rf.simplified, 'Корень из дискриминанта не извлекается нацело — выносим множитель из-под корня.', 1);
      var raw = '\\frac{' + qTex(P) + ' \\pm \\sqrt{' + qTex(D) + '}}{' + qTex(Den) + '}';
      S.add(formula + ' = ' + raw + (raw === rf.pm ? '' : ' = ' + rf.pm), 'Подставляем в формулу корней и сокращаем.', 0, { briefTex: v + '_{1,2} = ' + rf.pm });
      return sol([Rt(rf.vPlus, rf.plus), Rt(rf.vMinus, rf.minus)]);
    }
    var sd = Math.sqrt(qv(D)), y1 = (qv(P) + sd) / qv(Den), y2 = (qv(P) - sd) / qv(Den);
    S.add(formula + ' \\approx ' + fTex(y1, 8) + ',\\ ' + fTex(y2, 8), 'Коэффициенты нецелые — считаем корни приближённо.', 0);
    return sol([rootNum(y1), rootNum(y2)]);
  }
  function quadIncomplete(a, b, cc, v, S) {
    if (qZero(cc)) {
      var bx = termsTex([{ c: a, m: mv(v) }, { c: b, m: {} }]);
      if (qZero(b)) { S.add(v + '^2 = 0', (qOne(a) ? '' : 'Делим на $' + qTex(a) + '$. ') + 'Квадрат равен нулю только у нуля, значит $' + v + ' = 0$.', 0); var z = rootQ(Q0); z.mult = 2; return sol([z]); }
      S.add(v + '\\left(' + bx + '\\right) = 0', 'Неполное уравнение без свободного члена: выносим $' + v + '$ за скобку.', 0);
      var x2 = qDiv(qNeg(b), a);
      S.add(v + ' = 0 \\quad \\text{или} \\quad ' + bx + ' = 0', 'Произведение равно нулю, когда хотя бы один из множителей равен нулю.', 1);
      S.add(v + '_1 = 0,\\quad ' + v + '_2 = ' + qTex(x2), 'Из второго уравнения: $' + v + ' = ' + qTex(qNeg(b)) + ' : ' + qTexP(a) + ' = ' + qTex(x2) + '$.', 0);
      return sol([rootQ(Q0), rootQ(x2)]);
    }
    var rhs = qDiv(qNeg(cc), a);
    S.add(termsTex([{ c: a, m: (function () { var m = {}; m[v] = 2; return m; })() }]) + ' = ' + qTex(qNeg(cc)), 'Неполное уравнение без слагаемого с $' + v + '$: переносим свободный член вправо.', 1);
    S.add(v + '^2 = ' + qTex(rhs), 'Делим обе части на $' + qTex(a) + '$.', 0);
    if (qSign(rhs) < 0) { S.add(null, 'Квадрат числа не может быть отрицательным — действительных корней нет.', 0); return sol([], { none: true }); }
    var s = sqrtTexQ(rhs);
    S.add(v + ' = \\pm ' + s.tex, 'Число, квадрат которого равен $' + qTex(rhs) + '$, — это $' + s.tex + '$ или $-' + s.tex + '$.', 0);
    return sol([Rt(s.val, s.tex, true), Rt(-s.val, '-' + s.tex, true)]);
  }
  function quadSquare(a, b, cc, v, S) {
    var p = qDiv(b, a), q = qDiv(cc, a), h = qDiv(p, qi(2));
    var sq = function (m) { var o = {}; o[v] = 2; return o; };
    if (!qOne(a)) S.add(termsTex([{ c: Q1, m: sq() }, { c: p, m: mv(v) }, { c: q, m: {} }]) + ' = 0', 'Делим обе части на $' + qTex(a) + '$, чтобы коэффициент при $' + v + '^2$ стал равен $1$.', 1);
    S.add(termsTex([{ c: Q1, m: sq() }, { c: p, m: mv(v) }]) + ' = ' + qTex(qNeg(q)), 'Переносим свободный член в правую часть.', 1);
    var h2 = qMul(h, h), R = qAdd(qNeg(q), h2);
    S.add(termsTex([{ c: Q1, m: sq() }, { c: p, m: mv(v) }, { c: h2, m: {} }]) + ' = ' + qTex(qNeg(q)) + ' + ' + qTexP(h2), 'Прибавляем к обеим частям $\\left(\\frac{' + qTex(p) + '}{2}\\right)^2 = ' + qTex(h2) + '$ — квадрат половины коэффициента при $' + v + '$, чтобы слева получился полный квадрат.', 1);
    var inner = termsTex([{ c: Q1, m: mv(v) }, { c: h, m: {} }]);
    S.add('\\left(' + inner + '\\right)^2 = ' + qTex(R), 'Сворачиваем левую часть по формуле квадрата ' + (qSign(h) < 0 ? 'разности' : 'суммы') + '.', 0);
    if (qSign(R) < 0) { S.add(null, 'Квадрат не может быть отрицательным — действительных корней нет.', 0); return sol([], { none: true }); }
    var mh = qNeg(h);
    if (qZero(R)) { S.add(v + ' = ' + qTex(mh), 'Квадрат равен нулю, значит $' + inner + ' = 0$.', 0); var r0 = rootQ(mh); r0.mult = 2; return sol([r0]); }
    var s = sqrtTexQ(R);
    S.add(inner + ' = \\pm ' + s.tex, 'Извлекаем корень из обеих частей (не забываем про оба знака).', 1);
    if (s.rational) {
      var x1 = qAdd(mh, s.rational), x2 = qSub(mh, s.rational);
      S.add(v + '_1 = ' + qTex(x1) + ',\\quad ' + v + '_2 = ' + qTex(x2), 'Переносим $' + qTex(h) + '$ вправо.', 0);
      return sol([rootQ(x1), rootQ(x2)]);
    }
    var base = qZero(mh) ? '' : qTex(mh) + ' ';
    S.add(v + '_{1,2} = ' + base + '\\pm ' + s.tex, 'Переносим $' + qTex(h) + '$ вправо.', 0);
    return sol([Rt(qv(mh) + s.val, base + (base ? '+ ' : '') + s.tex), Rt(qv(mh) - s.val, base + '- ' + s.tex)]);
  }
  function quadVieta(a, b, cc, v, S) {
    var sum = qDiv(qNeg(b), a), prod = qDiv(cc, a), D = qSub(qMul(b, b), qMul(qi(4), qMul(a, cc))), s = sqrtQ(D);
    var x1 = qDiv(qAdd(qNeg(b), s), qMul(qi(2), a)), x2 = qDiv(qSub(qNeg(b), s), qMul(qi(2), a));
    S.add('\\begin{cases} ' + v + '_1 + ' + v + '_2 = ' + (qOne(a) ? '-b' : '-\\frac{b}{a}') + ' = ' + qTex(sum) + ' \\\\ ' + v + '_1 \\cdot ' + v + '_2 = ' + (qOne(a) ? 'c' : '\\frac{c}{a}') + ' = ' + qTex(prod) + ' \\end{cases}',
      'По теореме Виета сумма корней равна $' + (qOne(a) ? '-b' : '-\\frac{b}{a}') + '$, а произведение — $' + (qOne(a) ? 'c' : '\\frac{c}{a}') + '$.', 0);
    S.add(null, 'Подбираем числа с такой суммой и произведением: $' + qTex(x1) + ' + ' + qTexP(x2) + ' = ' + qTex(sum) + '$, $' + qTex(x1) + ' \\cdot ' + qTexP(x2) + ' = ' + qTex(prod) + '$.', 1);
    S.add(v + '_1 = ' + qTex(x1) + ',\\quad ' + v + '_2 = ' + qTex(x2), 'Оба условия выполнены — это и есть корни.', 0);
    return sol([rootQ(x1), rootQ(x2)]);
  }
  function quadFactor(a, b, cc, v, S) {
    var A = a.n, B = b.n, C = cc.n, AC = A * C, m = null, n = null;
    for (var i = 1; i * i <= Math.abs(AC) && i < 1e6; i++) {
      if (AC % i) continue;
      var pairs = [[i, AC / i], [-i, -AC / i]];
      for (var j = 0; j < 2; j++) if (pairs[j][0] + pairs[j][1] === B) { m = pairs[j][0]; n = pairs[j][1]; }
      if (m !== null) break;
    }
    if (m === null) return null;
    var x2m = (function () { var o = {}; o[v] = 2; return o; })();
    S.add(null, 'Ищем два числа, произведение которых равно $a \\cdot c = ' + AC + '$, а сумма — $b = ' + B + '$: это $' + m + '$ и $' + n + '$.', 1);
    S.add(termsTex([{ c: a, m: x2m }, { c: qi(m), m: mv(v) }, { c: qi(n), m: mv(v) }, { c: cc, m: {} }]) + ' = 0', 'Раскладываем средний член: $' + termsTex([{ c: b, m: mv(v) }]) + ' = ' + termsTex([{ c: qi(m), m: mv(v) }, { c: qi(n), m: mv(v) }]) + '$.', 1);
    var g1 = gcd(A, m) * (A < 0 ? -1 : 1), p1 = A / g1, q1 = m / g1;
    var g2 = n / p1; if (!Number.isInteger(g2) || C / g2 !== q1) return null;
    var br = termsTex([{ c: qi(p1), m: mv(v) }, { c: qi(q1), m: {} }]);
    var f1 = termsTex([{ c: qi(g1), m: mv(v) }]);
    S.add(f1 + '\\left(' + br + '\\right) ' + (g2 < 0 ? '- ' : '+ ') + (Math.abs(g2) === 1 ? '' : Math.abs(g2)) + '\\left(' + br + '\\right) = 0', 'Группируем по два слагаемых и из каждой группы выносим общий множитель.', 1);
    var other = termsTex([{ c: qi(g1), m: mv(v) }, { c: qi(g2), m: {} }]);
    S.add('\\left(' + br + '\\right)\\left(' + other + '\\right) = 0', 'Выносим общую скобку $\\left(' + br + '\\right)$.', 0);
    var r1 = Q(-q1, p1), r2 = Q(-g2, g1);
    S.add(br + ' = 0 \\;\\Rightarrow\\; ' + v + ' = ' + qTex(r1) + ',\\qquad ' + other + ' = 0 \\;\\Rightarrow\\; ' + v + ' = ' + qTex(r2), 'Произведение равно нулю, когда хотя бы один из множителей равен нулю.', 0, { briefTex: v + '_1 = ' + qTex(r1) + ',\\quad ' + v + '_2 = ' + qTex(r2) });
    return sol([rootQ(r1), rootQ(r2)]);
  }

  /* ---------------------------------------- уравнения степени 3 и выше */
  function divisors(n) {
    n = Math.abs(n); var out = [];
    if (!n || n > 1e12) return out;
    for (var i = 1; i * i <= n; i++) if (n % i === 0) { out.push(i); if (i * i !== n) out.push(n / i); }
    return out.sort(function (a, b) { return a - b; });
  }
  function hornerTex(c, r, qt) {
    var top = c.slice().reverse().map(function (q) { return qTex(q); });
    var bot = qt.slice().reverse().map(function (q) { return qTex(q); }).concat(['0']);
    return '\\begin{array}{c|' + top.map(function () { return 'c'; }).join('') + '} & ' + top.join(' & ') + ' \\\\ \\hline ' + qTex(r) + ' & ' + bot.join(' & ') + ' \\end{array}';
  }
  function higherEq(c, v, S, cx) {
    c = normalizeUni(c, v, S);
    var d = uDeg(c), roots = [];
    // 1) общий множитель v^k
    var k = 0; while (qZero(c[k])) k++;
    if (k > 0) {
      var rest = c.slice(k), vk = k === 1 ? v : v + '^{' + k + '}';
      S.add(vk + '\\left(' + uTex(rest, v) + '\\right) = 0', 'Выносим общий множитель $' + vk + '$ за скобку.', 0);
      S.add(v + ' = 0 \\quad \\text{или} \\quad ' + uTex(rest, v) + ' = 0', 'Произведение равно нулю, когда хотя бы один из множителей равен нулю.', 1);
      var z = rootQ(Q0); z.mult = k;
      var g = S.group('Решаем $' + uTex(rest, v) + ' = 0$', 1);
      var sr = solveUni(rest, v, g, cx);
      return sol([z].concat(sr.roots), { numeric: sr.numeric });
    }
    // 2) двучлен a·v^n + b = 0
    var nz = c.map(function (q, i) { return qZero(q) ? -1 : i; }).filter(function (i) { return i >= 0; });
    if (nz.length === 2 && nz[0] === 0) {
      var rhs = qDiv(qNeg(c[0]), c[d]);
      S.add(v + '^{' + d + '} = ' + qTex(rhs), 'Двучленное уравнение: переносим свободный член и делим на старший коэффициент.', 0);
      return binomialRoots(rhs, d, v, S);
    }
    // 3) замена t = v^g, если все степени кратны g
    var gg = 0; nz.forEach(function (i) { gg = gcd(gg, i); });
    if (gg >= 2) {
      var tc = []; for (var i = 0; i <= d / gg; i++) tc.push(c[i * gg]);
      var what = gg === 2 && d === 4 ? 'Биквадратное уравнение' : 'Все степени $' + v + '$ кратны ' + gg;
      S.add(uTex(tc, 't') + ' = 0', what + ' — делаем замену $t = ' + v + '^{' + gg + '}$' + (gg % 2 === 0 ? ' (при этом $t \\ge 0$)' : '') + '.', 0);
      var gt = S.group('Решаем уравнение относительно $t$', 1);
      var st = solveUni(tc, 't', gt, cx), all = [];
      st.roots.forEach(function (tr) {
        var gs = S.group('Обратная замена: $' + v + '^{' + gg + '} = ' + tr.tex + '$', 1);
        var q = recoverQ(tr.val);
        var br = binomialRoots(q && tr.exact ? q : F(tr.val), gg, v, gs, tr.tex);
        all = all.concat(br.roots);
      });
      if (!st.roots.length) S.add(null, 'Уравнение для $t$ не имеет корней — значит, и исходное тоже.', 0);
      return sol(all, { numeric: st.numeric });
    }
    // 4) рациональные корни + схема Горнера
    var sc = uIntScale(c);
    if (sc) {
      var ic = sc.c, a0 = ic[0].n, an = ic[d].n;
      var ps = divisors(a0), qs = divisors(an), cands = [];
      if (ps.length && qs.length && ps.length * qs.length < 4000) {
        ps.forEach(function (p) { qs.forEach(function (q) { [Q(p, q), Q(-p, q)].forEach(function (x) { if (!cands.some(function (y) { return qEq(x, y); })) cands.push(x); }); }); });
        cands.sort(function (x, y) { return Math.abs(qv(x)) - Math.abs(qv(y)) || qv(y) - qv(x); });
        var found = null, tried = [];
        for (var ci = 0; ci < cands.length; ci++) {
          var val = uEvalQ(ic, cands[ci]);
          if (qZero(val)) { found = cands[ci]; break; }
          if (tried.length < 4) tried.push('$P\\left(' + qTex(cands[ci]) + '\\right) = ' + qTex(val) + ' \\ne 0$');
        }
        var candTex = cands.slice(0, 16).map(function (x) { return qTex(x); }).join(',\\ ') + (cands.length > 16 ? ',\\ \\ldots' : '');
        if (found) {
          S.add(null, 'Ищем рациональный корень. Если он есть, то имеет вид $\\pm\\frac{p}{q}$, где $p$ — делитель свободного члена ($' + a0 + '$), а $q$ — делитель старшего коэффициента ($' + an + '$).', 1,
            { textFull: 'Ищем рациональный корень: по теореме о рациональных корнях он имеет вид $\\pm\\frac{p}{q}$, где $p$ — делитель свободного члена ($' + a0 + '$), $q$ — делитель старшего коэффициента ($' + an + '$). Кандидаты: $' + candTex + '$.' + (tried.length ? ' Проверяем по очереди: ' + tried.join(', ') + '.' : '') });
          var dm = uDivmod(ic, [qNeg(found), Q1]);
          S.add('P\\left(' + qTex(found) + '\\right) = 0', 'Подстановкой находим корень $' + v + ' = ' + qTex(found) + '$.', 1);
          S.add(hornerTex(ic, found, dm.q), 'Делим многочлен на $\\left(' + termsTex([{ c: Q1, m: mv(v) }, { c: qNeg(found), m: {} }]) + '\\right)$ по схеме Горнера: в верхней строке коэффициенты, каждое следующее число нижней строки = предыдущее число · ' + qTex(found) + ' + число сверху. Последнее число — остаток, он равен $0$.', 1);
          var fac = '\\left(' + termsTex([{ c: Q1, m: mv(v) }, { c: qNeg(found), m: {} }]) + '\\right)\\left(' + uTex(dm.q, v) + '\\right) = 0';
          S.add(fac, 'Раскладываем левую часть на множители.', 0);
          var gq = S.group('Решаем $' + uTex(dm.q, v) + ' = 0$', 1);
          var sq = solveUni(dm.q, v, gq, cx);
          return sol([rootQ(found)].concat(sq.roots), { numeric: sq.numeric });
        }
        S.add(null, 'Рациональных корней нет: проверили все кандидаты вида $\\pm\\frac{p}{q}$ ($' + candTex + '$) — ни один не обращает многочлен в ноль.', 1);
      }
    }
    // 5) численно
    var rs = polyRealRoots(c);
    var why = d >= 5 ? 'Для уравнений степени 5 и выше общей формулы в радикалах не существует (теорема Абеля — Руффини)' : (d === 3 ? 'Формула Кардано для такого уравнения дала бы громоздкие вложенные радикалы' : 'Формула Феррари для уравнения четвёртой степени слишком громоздка');
    S.add(null, why + ', поэтому корни находим численно (метод Дюрана — Кернера с уточнением по Ньютону), с точностью до $10^{-10}$.', 0);
    if (!rs.length) S.add(null, 'Действительных корней у многочлена нет — все его корни комплексные.', 0);
    return sol(rs.map(rootNum), { numeric: true });
  }
  function binomialRoots(rhs, n, v, S, rhsTex) {
    var t = rhsTex || qTex(rhs), x = qv(rhs);
    if (n % 2 === 0) {
      if (x < -1e-12) { S.add(null, 'Чётная степень числа не может быть отрицательной — корней нет.', 0); return sol([]); }
      if (Math.abs(x) < 1e-12) { S.add(v + ' = 0', '', 0); var z = rootQ(Q0); z.mult = n; return sol([z]); }
      var r = Math.pow(x, 1 / n), rt = rootNTex(rhs, n, t);
      S.add(v + ' = \\pm ' + rt, 'Чётная степень: подходят оба числа — положительное и противоположное ему.', 0);
      return sol([Rt(r, rt), Rt(-r, '-' + rt)]);
    }
    var r3 = x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n), rt3 = rootNTex(rhs, n, t);
    S.add(v + ' = ' + rt3, 'Нечётная степень: корень единственный' + (x < 0 ? ' и отрицательный' : '') + '.', 0);
    return sol([Rt(r3, rt3)]);
  }
  function rootNTex(q, n, t) {
    var x = qv(q), r = Math.pow(Math.abs(x), 1 / n) * (x < 0 ? -1 : 1);
    var e = recoverQ(r);
    if (e && !isF(q) && qEq(qPow(e, n), q)) return qTex(e);
    if (n === 2 && !isF(q)) return sqrtTexQ(q).tex;
    if (isF(q)) return fTex(Math.pow(Math.abs(x), 1 / n), 8);
    return '\\sqrt[' + n + ']{' + t + '}';
  }
  // Все действительные корни многочлена: Дюран — Кернер + полировка Ньютоном.
  function polyRealRoots(c) {
    var a = uTrim(c).map(qv), n = a.length - 1;
    if (n < 1) return [];
    var lead = a[n]; a = a.map(function (x) { return x / lead; });
    var R = 1; for (var i = 0; i < n; i++) R = Math.max(R, 1 + Math.abs(a[i]));
    var zr = [], zi = [];
    for (var k = 0; k < n; k++) { var ang = 2 * Math.PI * k / n + 0.4; zr.push(R * Math.cos(ang)); zi.push(R * Math.sin(ang)); }
    function pv(xr, xi) { var sr = 1, si = 0; for (var j = n - 1; j >= 0; j--) { var tr = sr * xr - si * xi + a[j], ti = sr * xi + si * xr; sr = tr; si = ti; } return [sr, si]; }
    for (var it = 0; it < 800; it++) {
      var delta = 0;
      for (var k2 = 0; k2 < n; k2++) {
        var p = pv(zr[k2], zi[k2]), dr = 1, di = 0;
        for (var j = 0; j < n; j++) if (j !== k2) { var ur = zr[k2] - zr[j], ui = zi[k2] - zi[j], nr = dr * ur - di * ui, ni = dr * ui + di * ur; dr = nr; di = ni; }
        var den = dr * dr + di * di; if (den === 0) { zr[k2] += 1e-6; continue; }
        var qr = (p[0] * dr + p[1] * di) / den, qi2 = (p[1] * dr - p[0] * di) / den;
        zr[k2] -= qr; zi[k2] -= qi2; delta = Math.max(delta, Math.abs(qr) + Math.abs(qi2));
      }
      if (delta < 1e-14) break;
    }
    var out = [];
    for (var k3 = 0; k3 < n; k3++) {
      if (Math.abs(zi[k3]) > 1e-6 * Math.max(1, Math.abs(zr[k3]))) continue;
      var x = zr[k3];
      for (var t = 0; t < 30; t++) {
        var f = 0, df = 0; for (var j2 = n; j2 >= 0; j2--) { df = df * x + f; f = f * x + a[j2]; }
        if (!df) break; var nx = x - f / df; if (Math.abs(nx - x) < 1e-15 * Math.max(1, Math.abs(x))) { x = nx; break; } x = nx;
      }
      if (!out.some(function (y) { return Math.abs(y - x) < 1e-7 * Math.max(1, Math.abs(x)); })) out.push(x);
    }
    return out.sort(function (p1, p2) { return p1 - p2; });
  }

  var CXQ = { quiet: true };
  // Корни без показа шагов (для ОДЗ, точек разбиения и т.п.).
  function quietRoots(L, Rr, v) {
    try { var s = solveEq(L, Rr, v, QUIET, CXQ); return s.all ? null : s.roots; } catch (e) { return []; }
  }
  // Проверка кандидатов подстановкой в исходное уравнение.
  function checkRoots(roots, L, Rr, v, S, reason) {
    var good = [];
    roots.forEach(function (r) {
      var lv = at(L, v, r.val), rv = at(Rr, v, r.val);
      var ok = isFinite(lv) && isFinite(rv) && Math.abs(lv - rv) < 1e-7 * Math.max(1, Math.abs(lv), Math.abs(rv));
      if (ok) { good.push(r); S.add(null, 'Проверка $' + v + ' = ' + r.tex + '$: левая часть $' + numTex(lv).tex + '$, правая $' + numTex(rv).tex + '$ — верно.', 1); }
      else S.add(null, 'Проверка $' + v + ' = ' + r.tex + '$: ' + (isFinite(lv) && isFinite(rv) ? 'левая часть $' + numTex(lv).tex + '$, правая $' + numTex(rv).tex + '$ — не совпадают' : 'выражение не определено') + ' — посторонний корень' + (reason ? ' (' + reason + ')' : '') + ', отбрасываем.', 0);
    });
    return good;
  }

  /* ---------------------------------------------- дробно-рациональные */
  function rfReduce(r) {
    var g = uGcd(r.n, r.d);
    if (uDeg(g) > 0) r = { n: uDivmod(r.n, g).q, d: uDivmod(r.d, g).q };
    var sc = uIntScale(r.d);
    if (sc) { var k = sc.k; if (qSign(sc.c[sc.c.length - 1]) < 0) k = qNeg(k); r = { n: uScale(r.n, k), d: uScale(r.d, k) }; }
    return r;
  }
  function rfFromAst(n, v) {
    switch (n.t) {
      case '+': case '-': case '*': case '/': {
        var A = rfFromAst(n.a, v), B = A && rfFromAst(n.b, v);
        if (!B) return null;
        if (n.t === '*') return rfReduce({ n: uMul(A.n, B.n), d: uMul(A.d, B.d) });
        if (n.t === '/') { if (uDeg(B.n) < 0) return null; return rfReduce({ n: uMul(A.n, B.d), d: uMul(A.d, B.n) }); }
        var an = uMul(A.n, B.d), bn = uMul(B.n, A.d);
        return rfReduce({ n: n.t === '+' ? uAdd(an, bn) : uSub(an, bn), d: uMul(A.d, B.d) });
      }
      case 'neg': { var N = rfFromAst(n.a, v); return N && { n: uNeg(N.n), d: N.d }; }
      case '^': {
        var e = constQ(n.b);
        if (hasV(n.a, v) && e && qIsInt(e) && Math.abs(e.n) <= 20) {
          var b = rfFromAst(n.a, v); if (!b) return null;
          return e.n >= 0 ? { n: uPow(b.n, e.n), d: uPow(b.d, e.n) } : rfReduce({ n: uPow(b.d, -e.n), d: uPow(b.n, -e.n) });
        }
      }
      /* fallthrough */
      default: {
        var p = pFromAst(n); if (!p) return null;
        var c = pToUni(p, v); return c ? { n: c, d: [Q1] } : null;
      }
    }
  }
  function denominators(n, v, out) {
    out = out || [];
    (function walk(x) {
      if (!x) return;
      if (x.t === '/' && hasV(x.b, v)) out.push(x.b);
      if (x.t === '^' && hasV(x.a, v)) { var e = constQ(x.b); if (e && qIsInt(e) && e.n < 0) out.push(x.a); }
      kids(x).forEach(walk);
    })(n);
    return out;
  }
  function rationalEq(L, Rr, v, S, cx) {
    var diff = sub(L, Rr), dens = denominators(diff, v), excl = [], seen = {};
    dens.forEach(function (d) {
      var tx = T(d); if (seen[tx]) return; seen[tx] = 1;
      (quietRoots(d, Nn(0), v) || []).forEach(function (r) { if (!excl.some(function (e) { return sameVal(e.val, r.val); })) excl.push(r); });
    });
    S.add(Object.keys(seen).map(function (t) { return t + ' \\ne 0'; }).join(',\\quad '), 'ОДЗ: знаменатели не должны обращаться в ноль' + (excl.length ? ', то есть $' + excl.map(function (r) { return v + ' \\ne ' + r.tex; }).join(',\\ ') + '$.' : '.'), 1, { briefTex: excl.length ? excl.map(function (r) { return v + ' \\ne ' + r.tex; }).join(',\\ ') : undefined });
    var res;
    var simpleSide = function (x) { return x.t === '/' || !denominators(x, v).length; };
    if ((L.t === '/' || Rr.t === '/') && simpleSide(L) && simpleSide(Rr)) {
      var ln = L.t === '/' ? L.a : L, ld = L.t === '/' ? L.b : null, rn = Rr.t === '/' ? Rr.a : Rr, rd = Rr.t === '/' ? Rr.b : null;
      var nl = rd ? mul(ln, rd) : ln, nr = ld ? mul(rn, ld) : rn;
      S.add(T(nl) + ' = ' + T(nr), ld && rd ? 'По основному свойству пропорции: произведение крайних членов равно произведению средних.' : 'Умножаем обе части на знаменатель $' + T(ld || rd) + '$ (по ОДЗ он не равен нулю).', 0);
      res = solveEq(nl, nr, v, S, cx);
    } else {
      var rf = rfFromAst(diff, v);
      if (!rf) return null;
      S.add('\\frac{' + uTex(rf.n, v) + '}{' + uTex(rf.d, v) + '} = 0', 'Переносим всё в левую часть и приводим дроби к общему знаменателю.', 1);
      S.add(uTex(rf.n, v) + ' = 0', 'Дробь равна нулю, когда числитель равен нулю, а знаменатель — нет.', 0);
      res = solveUni(rf.n, v, S, cx);
    }
    if (res.all) return sol([], { all: true, allCond: excl.map(function (r) { return v + ' \\ne ' + r.tex; }).join(',\\ ') });
    var good = [];
    res.roots.forEach(function (r) {
      if (excl.some(function (e) { return sameVal(e.val, r.val); }) || !isFinite(at(diff, v, r.val))) S.add(null, '$' + v + ' = ' + r.tex + '$ не входит в ОДЗ (знаменатель обращается в ноль) — посторонний корень, отбрасываем.', 0);
      else good.push(r);
    });
    return sol(good, { numeric: res.numeric, series: res.series });
  }

  /* ---------------------------------------------- иррациональные
     Выражение — сумма слагаемых «многочлен · произведение радикалов». */
  function reKey(e) { return Object.keys(e).filter(function (k) { return e[k]; }).sort().map(function (k) { return k + ':' + e[k]; }).join(','); }
  function reNorm(terms) {
    var map = {};
    terms.forEach(function (t) { var k = reKey(t.e); map[k] = map[k] ? { c: uAdd(map[k].c, t.c), e: t.e } : { c: t.c, e: t.e }; });
    return Object.keys(map).map(function (k) { return map[k]; }).filter(function (t) { return uDeg(t.c) >= 0; });
  }
  function reMul(A, B, atoms) {
    var out = [];
    A.forEach(function (x) {
      B.forEach(function (y) {
        var e = {}, c = uMul(x.c, y.c), k;
        for (k in x.e) e[k] = (e[k] || 0) + x.e[k];
        for (k in y.e) e[k] = (e[k] || 0) + y.e[k];
        for (k in e) while (e[k] >= atoms[k].k) { e[k] -= atoms[k].k; c = uMul(c, atoms[k].inner); }
        out.push({ c: c, e: e });
      });
    });
    return reNorm(out);
  }
  function reFromAst(n, v, atoms) {
    function atom(inner, k) {
      for (var i = 0; i < atoms.length; i++) if (atoms[i].k === k && uTex(atoms[i].inner, v) === uTex(inner, v)) return i;
      atoms.push({ inner: inner, k: k, tex: k === 2 ? '\\sqrt{' + uTex(inner, v) + '}' : '\\sqrt[' + k + ']{' + uTex(inner, v) + '}' });
      return atoms.length - 1;
    }
    function one(i) { var e = {}; e[i] = 1; return [{ c: [Q1], e: e }]; }
    switch (n.t) {
      case '+': case '-': { var A = reFromAst(n.a, v, atoms), B = A && reFromAst(n.b, v, atoms); if (!B) return null; return reNorm(A.concat(n.t === '-' ? B.map(function (t) { return { c: uNeg(t.c), e: t.e }; }) : B)); }
      case 'neg': { var A2 = reFromAst(n.a, v, atoms); return A2 && A2.map(function (t) { return { c: uNeg(t.c), e: t.e }; }); }
      case '*': { var A3 = reFromAst(n.a, v, atoms), B3 = A3 && reFromAst(n.b, v, atoms); return B3 ? reMul(A3, B3, atoms) : null; }
      case '/': { if (hasV(n.b, v)) return null; var q = constQ(n.b), A4 = reFromAst(n.a, v, atoms); if (!q || qZero(q) || !A4) return null; return A4.map(function (t) { return { c: uScale(t.c, qDiv(Q1, q)), e: t.e }; }); }
      case 'fn': if (n.name === 'sqrt' && hasV(n.a, v)) { var p = pFromAst(n.a), c = p && pToUni(p, v); return c ? one(atom(c, 2)) : null; } break;
      case '^': {
        if (!hasV(n.a, v)) break;
        var k = rootIndex(n.b), e = constQ(n.b);
        if (k) { var p2 = pFromAst(n.a), c2 = p2 && pToUni(p2, v); return c2 ? one(atom(c2, k)) : null; }
        if (e && qIsInt(e) && e.n >= 0 && e.n <= 8) { var base = reFromAst(n.a, v, atoms); if (!base) return null; var r = [{ c: [Q1], e: {} }]; for (var i = 0; i < e.n; i++) r = reMul(r, base, atoms); return r; }
        return null;
      }
    }
    var pp = pFromAst(n), cc = pp && pToUni(pp, v);
    return cc ? [{ c: cc, e: {} }] : null;
  }
  function reTex(R, v, atoms) {
    if (!R.length) return '0';
    return R.map(function (t, i) {
      var at2 = Object.keys(t.e).filter(function (k) { return t.e[k]; }).map(function (k) { return atoms[k].tex + (t.e[k] > 1 ? '^{' + t.e[k] + '}' : ''); }).join(' \\cdot ');
      var ct = uTex(t.c, v), multi = uTrim(t.c).filter(function (q) { return !qZero(q); }).length > 1;
      var s;
      if (!at2) s = multi && i ? '\\left(' + ct + '\\right)' : ct;
      else if (ct === '1') s = at2; else if (ct === '-1') s = '-' + at2;
      else s = (multi ? '\\left(' + ct + '\\right)' : ct) + ' \\cdot ' + at2;
      return i === 0 ? s : (s.charAt(0) === '-' ? ' - ' + s.slice(1) : ' + ' + s);
    }).join('');
  }
  function radicalEq(L, Rr, v, S, cx) {
    var atoms = [], E = reFromAst(sub(L, Rr), v, atoms);
    if (!E) return null;
    var even = atoms.filter(function (a) { return a.k % 2 === 0; });
    if (even.length) S.add(even.map(function (a) { return uTex(a.inner, v) + ' \\ge 0'; }).join(',\\quad '), 'ОДЗ: под корнем чётной степени не может стоять отрицательное число. Выполнение ОДЗ проверим подстановкой найденных корней.', 1);
    for (var guard = 0; guard < 5; guard++) {
      var idx = -1;
      E.forEach(function (t) { for (var k in t.e) if (t.e[k] && idx < 0) idx = +k; });
      if (idx < 0) break;
      var a = atoms[idx], P1 = [], P0 = [], bad = false;
      E.forEach(function (t) {
        var e = {}; for (var k in t.e) if (+k !== idx) e[k] = t.e[k];
        if (!t.e[idx]) P0.push({ c: t.c, e: e }); else if (t.e[idx] === 1) P1.push({ c: t.c, e: e }); else bad = true;
      });
      if (bad) return null;
      var rhs = P0.map(function (t) { return { c: uNeg(t.c), e: t.e }; });
      var lhsTex = (P1.length === 1 && reKey(P1[0].e) === '' && uTex(P1[0].c, v) === '1') ? a.tex : '\\left(' + reTex(P1, v, atoms) + '\\right) \\cdot ' + a.tex;
      S.add(lhsTex + ' = ' + reTex(rhs, v, atoms), 'Уединяем радикал: оставляем $' + a.tex + '$ в одной части, всё остальное переносим в другую.', 1);
      var pl = [{ c: [Q1], e: {} }], pr = [{ c: [Q1], e: {} }];
      for (var i = 0; i < a.k; i++) { pl = reMul(pl, P1, atoms); pr = reMul(pr, rhs, atoms); }
      pl = pl.map(function (t) { return { c: uMul(t.c, a.inner), e: t.e }; });
      var deg = a.k === 2 ? 'квадрат' : a.k === 3 ? 'куб' : a.k + '-ю степень';
      S.add(reTex(pl, v, atoms) + ' = ' + reTex(pr, v, atoms), 'Возводим обе части в ' + deg + (a.k % 2 === 0 ? '. Так могут появиться посторонние корни — в конце обязательна проверка.' : '.'), 0);
      E = reNorm(pl.concat(pr.map(function (t) { return { c: uNeg(t.c), e: t.e }; })));
    }
    if (E.some(function (t) { return reKey(t.e); })) return null;
    var c = E.length ? E[0].c : [Q0];
    if (uDeg(c) < 0) return null;
    S.add(uTex(c, v) + ' = 0', 'Раскрываем скобки и переносим всё в одну часть.', 1);
    var g = S.group('Решаем $' + uTex(c, v) + ' = 0$', 1);
    var res = solveUni(c, v, g, cx);
    if (res.all) return null;
    var cs = S.group('Проверка подстановкой в исходное уравнение', 0);
    return sol(checkRoots(res.roots, L, Rr, v, cs, even.length ? 'появился при возведении в степень' : ''), { numeric: res.numeric });
  }

  /* ---------------------------------------------- модуль */
  function absNodes(n, v) {
    var out = [];
    (function walk(x) {
      if (!x) return;
      if (x.t === 'fn' && x.name === 'abs' && hasV(x.a, v) && !anyNode(x.a, function (y) { return y.t === 'fn' && y.name === 'abs'; })) out.push(x);
      kids(x).forEach(walk);
    })(n);
    return out;
  }
  function replaceNodes(n, map) {
    if (!n) return n;
    if (map.has(n)) return map.get(n);
    var c = {}; for (var k in n) c[k] = n[k];
    if (n.a) c.a = replaceNodes(n.a, map); if (n.b) c.b = replaceNodes(n.b, map); if (n.base) c.base = replaceNodes(n.base, map);
    return c;
  }
  function isAbs(n) { return n.t === 'fn' && n.name === 'abs'; }
  function hasAbs(n) { return anyNode(n, isAbs); }
  function absEq(L, Rr, v, S, cx) {
    var A = null, B = null;
    if (isAbs(L) && !hasAbs(Rr) && !hasAbs(L.a)) { A = L.a; B = Rr; } else if (isAbs(Rr) && !hasAbs(L) && !hasAbs(Rr.a)) { A = Rr.a; B = L; }
    if (A && !hasV(B, v)) {
      var bq = constQ(B), bv = evalN(B);
      if (bv < -1e-12) { S.add(null, 'Модуль не может быть отрицательным, а справа $' + T(B) + '$ — решений нет.', 0); return sol([], { none: true }); }
      if (Math.abs(bv) < 1e-12) { S.add(T(A) + ' = 0', 'Модуль равен нулю только тогда, когда выражение под ним равно нулю.', 0); return solveEq(A, Nn(0), v, S, cx); }
      var nb = bq ? NQ(qNeg(bq)) : neg(B);
      S.add(T(A) + ' = ' + T(B) + ' \\quad \\text{или} \\quad ' + T(A) + ' = ' + T(nb), 'Модуль равен положительному числу, когда выражение под ним равно этому числу или противоположному.', 0);
      var s1 = solveEq(A, B, v, S.group('Случай 1: $' + T(A) + ' = ' + T(B) + '$', 1), cx);
      var s2 = solveEq(A, nb, v, S.group('Случай 2: $' + T(A) + ' = ' + T(nb) + '$', 1), cx);
      return sol(s1.roots.concat(s2.roots), { numeric: s1.numeric || s2.numeric });
    }
    if (A) {
      S.add(T(B) + ' \\ge 0', 'Модуль неотрицателен, значит и правая часть должна быть неотрицательной — это условие проверим для найденных корней.', 1);
      S.add(T(A) + ' = ' + T(B) + ' \\quad \\text{или} \\quad ' + T(A) + ' = -\\left(' + T(B) + '\\right)', 'Раскрываем модуль: выражение под ним равно правой части или противоположному ей.', 0);
      var t1 = solveEq(A, B, v, S.group('Случай 1: $' + T(A) + ' = ' + T(B) + '$', 1), cx);
      var t2 = solveEq(A, neg(B), v, S.group('Случай 2: $' + T(A) + ' = -\\left(' + T(B) + '\\right)$', 1), cx);
      var good = [];
      t1.roots.concat(t2.roots).forEach(function (r) {
        var bv2 = at(B, v, r.val);
        if (bv2 >= -1e-9) good.push(r); else S.add(null, 'При $' + v + ' = ' + r.tex + '$ правая часть равна $' + numTex(bv2).tex + ' < 0$ — корень не подходит.', 0);
      });
      return sol(good);
    }
    // общий случай — метод интервалов
    var diff = sub(L, Rr), nodes = absNodes(diff, v);
    if (!nodes.length) return null;
    var pts = [];
    nodes.forEach(function (nd) { (quietRoots(nd.a, Nn(0), v) || []).forEach(function (r) { if (!pts.some(function (p) { return sameVal(p.val, r.val); })) pts.push(r); }); });
    pts.sort(function (a, b) { return a.val - b.val; });
    S.add(pts.map(function (p) { return v + ' = ' + p.tex; }).join(',\\quad '), 'Находим нули выражений под модулями — они делят числовую прямую на промежутки, на каждом из которых модули раскрываются однозначно.', 1);
    var roots = [], intervals = [];
    for (var i = 0; i <= pts.length; i++) {
      var lo = i ? pts[i - 1] : null, hi = i < pts.length ? pts[i] : null;
      var tp = lo && hi ? (lo.val + hi.val) / 2 : lo ? lo.val + 1 : hi ? hi.val - 1 : 0;
      var map = new Map(), expl = [];
      nodes.forEach(function (nd) {
        var s = at(nd.a, v, tp) >= 0;
        map.set(nd, s ? nd.a : neg(nd.a));
        expl.push('$\\left|' + T(nd.a) + '\\right| = ' + T(s ? nd.a : neg(nd.a)) + '$');
      });
      var title = (lo ? (lo.tex + ' \\le ') : '') + v + (hi ? ' < ' + hi.tex : '');
      if (!lo && hi) title = v + ' < ' + hi.tex; if (lo && !hi) title = v + ' \\ge ' + lo.tex; if (!lo && !hi) title = v + ' \\in \\mathbb{R}';
      var g = S.group('Промежуток $' + title + '$', 1);
      g.add(null, 'Здесь ' + expl.join(', ') + '.', 1);
      var nl = replaceNodes(L, map), nr = replaceNodes(Rr, map);
      g.add(T(nl) + ' = ' + T(nr), '', 1);
      var s = solveEq(nl, nr, v, g, cx);
      var inI = function (x) { return (!lo || x >= lo.val - 1e-9) && (!hi || x < hi.val - 1e-9); };
      if (s.all) { intervals.push({ lo: lo, hi: hi, loInc: !!lo, hiInc: false }); g.add(null, 'Равенство верно на всём промежутке.', 0); }
      s.roots.forEach(function (r) {
        if (inI(r.val)) { roots.push(r); g.add(null, '$' + v + ' = ' + r.tex + '$ лежит в промежутке — подходит.', 1); }
        else g.add(null, '$' + v + ' = ' + r.tex + '$ не лежит в промежутке — не подходит.', 1);
      });
    }
    if (intervals.length) {
      // склеиваем соседние промежутки и поглощаем точечные корни
      var merged = [];
      intervals.forEach(function (iv) { var p = merged[merged.length - 1]; if (p && p.hi && iv.lo && sameVal(p.hi.val, iv.lo.val)) { p.hi = iv.hi; } else merged.push(iv); });
      merged.forEach(function (iv) { if (iv.hi && roots.some(function (r) { return sameVal(r.val, iv.hi.val); })) iv.hiInc = true; });
      roots = roots.filter(function (r) { return !merged.some(function (iv) { return (!iv.lo || r.val >= iv.lo.val - 1e-9) && (!iv.hi || r.val <= iv.hi.val + 1e-9); }); });
      return sol(roots, { intervals: merged });
    }
    return sol(roots);
  }

  /* ---------------------------------------------- показательные */
  function logTex(g, gTex, xTex) {
    if (Math.abs(g - Math.E) < 1e-12) return '\\ln ' + xTex;
    if (g === 10) return '\\lg ' + xTex;
    return '\\log_{' + gTex + '} ' + xTex;
  }
  function wrapArg(t) { return /^[0-9a-z.]+$/i.test(t) ? t : '\\left(' + t + '\\right)'; }
  // Представить положительное число как степень g: k = log_g x, если k рационально.
  function asPowerOf(x, g) { var k = recoverQ(Math.log(x) / Math.log(g), 12); return k && Math.abs(Math.pow(g, qv(k)) - x) < 1e-9 * Math.max(1, x) ? k : null; }
  function commonBase(bases) {
    var cands = [];
    bases.forEach(function (b) {
      var bb = b < 1 ? 1 / b : b;
      cands.push(bb);
      for (var k = 6; k >= 2; k--) { var r = Math.round(Math.pow(bb, 1 / k)); if (r > 1 && Math.abs(Math.pow(r, k) - bb) < 1e-9 * bb) cands.push(r); }
    });
    cands.sort(function (a, b) { return a - b; });
    for (var i = 0; i < cands.length; i++) {
      var g = cands[i];
      if (bases.every(function (b) { return asPowerOf(b, g); })) return g;
    }
    return null;
  }
  function expAtoms(n, v) {
    var out = [];
    (function walk(x) {
      if (!x) return;
      if (x.t === '^' && hasV(x.b, v) && !hasV(x.a, v)) { out.push({ node: x, base: evalN(x.a), expo: x.b }); walk(x.b); return; }
      if (x.t === 'fn' && x.name === 'exp' && hasV(x.a, v)) { out.push({ node: x, base: Math.E, expo: x.a }); walk(x.a); return; }
      kids(x).forEach(walk);
    })(n);
    return out;
  }
  function gTexOf(g) { return Math.abs(g - Math.E) < 1e-12 ? 'e' : fTex(g); }
  function expEq(L, Rr, v, S, cx) {
    var diff = sub(L, Rr), atoms = expAtoms(diff, v);
    if (!atoms.length || atoms.some(function (a) { return !(a.base > 0) || Math.abs(a.base - 1) < 1e-12; })) return null;
    var g = commonBase(atoms.map(function (a) { return a.base; }));
    if (!g) return null;
    var gT = gTexOf(g);
    // показатель каждого атома в основании g, как многочлен от v
    var info = atoms.map(function (a) {
      var r = asPowerOf(a.base, g), p = pFromAst(a.expo), c = p && pToUni(p, v);
      return c ? { a: a, r: r, c: uScale(c, r) } : null;
    });
    if (info.some(function (x) { return !x; })) return null;
    var rewrite = new Map();
    info.forEach(function (x) { rewrite.set(x.a.node, pw(Vr('§g'), uToAst(x.c, v))); });
    var changed = info.some(function (x) { return !qOne(x.r) || x.a.node.t === 'fn'; });
    var gNode = { t: 'num', v: g, tx: gT, q: F(g) };
    function show(n) { return T(subst(replaceNodes(n, rewrite), '§g', gNode)); }
    if (changed) S.add(show(L) + ' = ' + show(Rr), 'Приводим все степени к одному основанию $' + gT + '$.', 1);
    // Случай: c·g^E = K (одна степень)
    function sidePow(n) {   // n = const·атом → {k: Q, x}
      if (n.t === '*' && !hasV(n.a, v)) { var s = sidePow(n.b); return s && { coef: evalN(n.a) * s.coef, info: s.info }; }
      var inf = info.filter(function (x) { return x.a.node === n; })[0];
      return inf ? { coef: 1, info: inf } : null;
    }
    var sl = sidePow(L), sr = sidePow(Rr);
    if ((sl && (sr || !hasV(Rr, v))) || (sr && !hasV(L, v))) {
      if (!sl) { var t = sl; sl = sr; sr = t; var tt = L; L = Rr; Rr = tt; }
      var E1 = sl.info.c, E2;
      if (sr) {
        var off = asPowerOf(sr.coef / sl.coef, g);
        if (off) { E2 = uAdd(sr.info.c, [off]); }
        else return expLogBoth(sl, sr, v, S, g, gT);
      } else {
        var K = evalN(Rr) / sl.coef;
        if (!(K > 0)) { S.add(null, 'Показательная функция принимает только положительные значения, а справа $' + numTex(K).tex + '$ — решений нет.', 0); return sol([], { none: true }); }
        var kq = asPowerOf(K, g);
        if (kq) E2 = [kq];
        else {
          var lt = logTex(g, gT, wrapArg(numTex(K).tex));
          S.add(uTex(E1, v) + ' = ' + lt, 'Число $' + numTex(K).tex + '$ не является «круглой» степенью $' + gT + '$, поэтому логарифмируем по основанию $' + gT + '$ (по определению логарифма).', 0);
          var lv = Math.log(K) / Math.log(g);
          if (uDeg(E1) === 1) {
            var kk = E1[1], mm = E1[0], xv = (lv - qv(mm)) / qv(kk);
            var tex = qZero(mm) && qOne(kk) ? lt : (qOne(kk) ? lt + ' - ' + qTexP(mm) : '\\frac{' + lt + (qZero(mm) ? '' : (qSign(mm) > 0 ? ' - ' + qTex(mm) : ' + ' + qTex(qNeg(mm)))) + '}{' + qTex(kk) + '}');
            S.add(v + ' = ' + tex, 'Выражаем $' + v + '$.', 0);
            return sol([Rt(xv, tex, true)]);
          }
          var rs = solveUni(uSub(E1, [F(lv)]), v, S.group('Решаем уравнение для показателя', 1), cx);
          return sol(rs.roots, { numeric: true });
        }
      }
      S.add(gT + '^{' + uTex(E1, v) + '} = ' + gT + '^{' + uTex(E2, v) + '}', 'Записываем обе части как степени с основанием $' + gT + '$.', 0);
      S.add(uTex(E1, v) + ' = ' + uTex(E2, v), 'Основания равны (и не равны $1$) — значит, равны и показатели.', 0);
      return polyEq(uToAst(E1, v), uToAst(E2, v), v, S, cx) || numericEq(L, Rr, v, S, cx, '');
    }
    // Замена t = g^{αv}: все показатели линейны
    if (info.some(function (x) { return uDeg(x.c) > 1; })) return null;
    var alphas = info.map(function (x) { return x.c[1] || Q0; });
    if (alphas.some(isF)) return null;
    var num = 0, den = 1;
    alphas.forEach(function (a) { if (!qZero(a)) { num = gcd(num, a.n); den = lcm(den, a.d); } });
    if (!num) return null;
    var alpha = Q(num, den);
    var tMap = new Map();
    info.forEach(function (x) {
      var pwr = qDiv(x.c[1] || Q0, alpha), beta = x.c[0] || Q0;
      var coef = { t: 'num', v: Math.pow(g, qv(beta)), q: qIsInt(beta) && Number.isInteger(g) ? qPow(qi(g), beta.n) : (recoverQ(Math.pow(g, qv(beta))) || F(Math.pow(g, qv(beta)))) };
      coef.tx = qTex(coef.q);
      var tp = qOne(pwr) ? Vr('t') : pw(Vr('t'), NQ(pwr));
      tMap.set(x.a.node, qZero(beta) ? tp : mul(coef, tp));
    });
    var tAst = replaceNodes(diff, tMap);
    if (hasV(tAst, v)) return null;
    var tp2 = pFromAst(tAst), tc = tp2 && pToUni(tp2, 't');
    if (!tc) return null;
    var tDef = gT + '^{' + termsTex([{ c: alpha, m: mv(v) }]) + '}';
    S.add(uTex(tc, 't') + ' = 0', 'Делаем замену $t = ' + tDef + '$, где $t > 0$: каждая степень выражается через $t$.', 0);
    var st = solveUni(tc, 't', S.group('Решаем уравнение для $t$', 1), cx), out = [];
    st.roots.forEach(function (tr) {
      if (tr.val <= 1e-12) { S.add(null, '$t = ' + tr.tex + '$ не подходит: $t = ' + tDef + '$ всегда положительно.', 0); return; }
      var k = asPowerOf(tr.val, g), lv = Math.log(tr.val) / Math.log(g), xv = lv / qv(alpha);
      var lt = k ? qTex(k) : logTex(g, gT, wrapArg(tr.tex));
      var tex = qOne(alpha) ? lt : (k ? qTex(qDiv(k, alpha)) : '\\frac{' + lt + '}{' + qTex(alpha) + '}');
      S.add(tDef + ' = ' + tr.tex + ' \\;\\Rightarrow\\; ' + v + ' = ' + tex, 'Обратная замена.', 0);
      out.push(Rt(xv, tex, true));
    });
    return sol(out, { numeric: st.numeric });
  }
  function expLogBoth(sl, sr, v, S, g, gT) {
    // a·g^{E1} = b·g^{E2}, b/a не степень g: логарифмируем обе части
    var K = sr.coef / sl.coef;
    if (!(K > 0)) { S.add(null, 'Левая и правая части имеют разные знаки при любом $' + v + '$ — решений нет.', 0); return sol([], { none: true }); }
    var lk = Math.log(K) / Math.log(g), c = uSub(sl.info.c, uAdd(sr.info.c, [F(lk)]));
    S.add(uTex(sl.info.c, v) + ' = ' + uTex(sr.info.c, v) + ' + ' + logTex(g, gT, wrapArg(numTex(K).tex)), 'Логарифмируем обе части по основанию $' + gT + '$.', 0);
    return solveUni(c, v, S, CXQ.quiet ? { pref: {} } : {});
  }

  /* ---------------------------------------------- логарифмические */
  function logAtoms(n, v) {
    var out = [];
    (function walk(x) {
      if (!x) return;
      if (x.t === 'fn' && (x.name === 'ln' || x.name === 'log' || x.name === 'lg') && hasV(x.a, v)) {
        var b = x.base ? evalN(x.base) : (x.name === 'ln' ? Math.E : 10);
        out.push({ node: x, base: b, bTex: x.base ? T(x.base) : (x.name === 'ln' ? 'e' : '10') }); return;
      }
      kids(x).forEach(walk);
    })(n);
    return out;
  }
  function logEq(L, Rr, v, S, cx) {
    var diff = sub(L, Rr), atoms = logAtoms(diff, v);
    if (!atoms.length || atoms.some(function (a) { return !(a.base > 0) || Math.abs(a.base - 1) < 1e-12 || hasV(a.node.base, v); })) return null;
    var g = commonBase(atoms.map(function (a) { return a.base; }));
    if (!g) return null;
    var gT = gTexOf(g);
    if (atoms.some(function (a) { return a.node.name === 'log' && !a.node.base; })) S.add(null, 'Запись $\\log$ без основания понимаем как десятичный логарифм $\\lg$ (основание $10$).', 1);
    var args = [], ids = new Map(), dom = [];
    atoms.forEach(function (a) {
      var key = T(a.node.a), i = args.indexOf(key);
      if (i < 0) { args.push(key); i = args.length - 1; dom.push(a.node.a); }
      var r = asPowerOf(a.base, g);   // log_{g^r} A = (1/r)·log_g A
      ids.set(a.node, qOne(r) ? Vr('§' + i) : mul(NQ(qDiv(Q1, r)), Vr('§' + i)));
    });
    S.add(dom.map(function (d) { return T(d) + ' > 0'; }).join(',\\quad '), 'ОДЗ: под знаком логарифма может стоять только положительное число. Проверим это для найденных корней.', 1);
    var P = pFromAst(replaceNodes(diff, ids));
    if (!P || hasV(pToAst(P), v)) return null;
    var vars = pVars(P), cand = [];
    function argEq(A, val, valTex, grp) {
      var q = recoverQ(val);
      var rhs = q ? NQ(q) : { t: 'num', v: val, q: F(val), tx: valTex };
      grp.add(T(A) + ' = ' + (q ? qTex(q) : valTex), 'По определению логарифма: $\\log_{a} b = c \\iff b = a^{c}$.', 0);
      return solveEq(A, rhs, v, grp, cx).roots;
    }
    if (vars.length === 1 && pTotalDeg(P) === 1) {
      var k = coefIn(P, vars[0], 1), c0 = coefIn(P, vars[0], 0), val = qNeg(qDiv(c0, k));
      var A = dom[+vars[0].slice(1)];
      S.add(logTex(g, gT, wrapArg(T(A))) + ' = ' + qTex(val), 'Приводим к простейшему виду.', 0);
      cand = argEq(A, Math.pow(g, qv(val)), gT + '^{' + qTex(val) + '}', S);
    } else if (vars.length === 1) {
      var tc = pToUni(P, vars[0]), A2 = dom[+vars[0].slice(1)];
      S.add(uTex(tc, 't') + ' = 0', 'Замена $t = ' + logTex(g, gT, wrapArg(T(A2))) + '$.', 0);
      var st = solveUni(tc, 't', S.group('Решаем уравнение для $t$', 1), cx);
      st.roots.forEach(function (tr) { cand = cand.concat(argEq(A2, Math.pow(g, tr.val), gT + '^{' + tr.tex + '}', S.group('Обратная замена: $' + logTex(g, gT, wrapArg(T(A2))) + ' = ' + tr.tex + '$', 1))); });
    } else if (pTotalDeg(P) === 1 && vars.every(function (x) { var q = coefIn(P, x, 1); return qIsInt(q); })) {
      var numN = null, denN = null;
      vars.forEach(function (x) {
        var q = coefIn(P, x, 1), A3 = dom[+x.slice(1)], f = Math.abs(q.n) === 1 ? A3 : pw(A3, Nn(Math.abs(q.n)));
        if (q.n > 0) numN = numN ? mul(numN, f) : f; else denN = denN ? mul(denN, f) : f;
      });
      var c1 = qNeg(pConstVal(P)), left = denN ? dvd(numN || Nn(1), denN) : numN;
      S.add(logTex(g, gT, '\\left(' + T(left) + '\\right)') + ' = ' + qTex(c1), 'Используем свойства логарифмов: $\\log a + \\log b = \\log(ab)$, $\\log a - \\log b = \\log\\frac{a}{b}$, $k\\log a = \\log a^{k}$.', 0);
      if (qZero(c1) && numN && denN) { S.add(T(numN) + ' = ' + T(denN), 'Логарифмы с одинаковым основанием равны — равны и аргументы.', 0); cand = solveEq(numN, denN, v, S, cx).roots; }
      else cand = argEq(left, Math.pow(g, qv(c1)), gT + '^{' + qTex(c1) + '}', S);
    } else return null;
    var good = [];
    uniqRoots(cand).forEach(function (r) {
      var okd = dom.every(function (d) { return at(d, v, r.val) > 0; });
      if (okd && isFinite(at(diff, v, r.val)) && Math.abs(at(diff, v, r.val)) < 1e-7) good.push(r);
      else S.add(null, '$' + v + ' = ' + r.tex + '$ не входит в ОДЗ (аргумент логарифма не положителен) — отбрасываем.', 0);
    });
    return sol(good);
  }

  /* ---------------------------------------------- тригонометрические */
  var PI = Math.PI;
  // Табличные значения: t -> угол (в долях π) для arcsin/arccos/arctg.
  function tableAngle(fn, t) {
    var tab = fn === 'tan' ? [[0, Q0], [1 / Math.sqrt(3), Q(1, 6)], [1, Q(1, 4)], [Math.sqrt(3), Q(1, 3)]]
                          : [[0, Q0], [0.5, Q(1, 6)], [Math.SQRT1_2, Q(1, 4)], [Math.sqrt(3) / 2, Q(1, 3)], [1, Q(1, 2)]];
    for (var i = 0; i < tab.length; i++) {
      if (Math.abs(Math.abs(t) - tab[i][0]) < 1e-10) {
        var a = tab[i][1];
        if (t < 0) a = fn === 'cos' ? qAdd(Q(1, 2), a) : qNeg(a);
        else if (fn === 'cos') a = qSub(Q(1, 2), a);
        return a;
      }
    }
    return null;
  }
  // Угол = {pi: Q, arc: tex|null, arcVal} ; значение = pi·π + arcVal
  function angTex(a) {
    if (a.arc) return (a.k && !qOne(a.k) ? (qEq(a.k, qi(-1)) ? '-' : qTex(a.k) + ' ') : '') + a.arc;
    return piTex(a.pi);
  }
  function angVal(a) { return a.arc ? qv(a.k || Q1) * a.arcVal : qv(a.pi) * PI; }
  function angScale(a, q) { return a.arc ? { arc: a.arc, arcVal: a.arcVal, k: qMul(a.k || Q1, q) } : { pi: qMul(a.pi, q) }; }
  function trigBasic(fn, t, tTex) {   // серии решений для u: fn(u) = t
    var nm = fn === 'tg' ? 'tan' : fn === 'ctg' ? 'cot' : fn;
    if ((nm === 'sin' || nm === 'cos') && Math.abs(t) > 1 + 1e-12) return null;
    if (nm === 'cot') { var a0 = tableAngle('tan', t === 0 ? Infinity : 1 / t); if (Math.abs(t) < 1e-12) return [{ base: { pi: Q(1, 2) }, per: Q1 }]; return [{ base: a0 ? { pi: t > 0 ? a0 : qAdd(Q1, a0) } : { arc: '\\operatorname{arcctg}' + wrapArg(tTex), arcVal: PI / 2 - Math.atan(t) }, per: Q1 }]; }
    var ta = tableAngle(nm, t);
    var arc = ta ? { pi: ta } : { arc: (nm === 'sin' ? '\\arcsin' : nm === 'cos' ? '\\arccos' : '\\operatorname{arctg}') + wrapArg(tTex), arcVal: nm === 'sin' ? Math.asin(t) : nm === 'cos' ? Math.acos(t) : Math.atan(t) };
    if (nm === 'tan') return [{ base: arc, per: Q1 }];
    if (nm === 'sin') {
      if (Math.abs(t) < 1e-12) return [{ base: { pi: Q0 }, per: Q1 }];
      if (Math.abs(Math.abs(t) - 1) < 1e-12) return [{ base: { pi: Q(t > 0 ? 1 : -1, 2) }, per: qi(2) }];
      return [{ base: arc, per: Q1, alt: true }];
    }
    if (Math.abs(t) < 1e-12) return [{ base: { pi: Q(1, 2) }, per: Q1 }];
    if (Math.abs(t - 1) < 1e-12) return [{ base: { pi: Q0 }, per: qi(2) }];
    if (Math.abs(t + 1) < 1e-12) return [{ base: { pi: Q1 }, per: qi(2) }];
    return [{ base: arc, per: qi(2), pm: true }];
  }
  function seriesTex(v, s) {
    var b = angTex(s.base), pre = s.alt ? (b.charAt(0) === '-' ? '(-1)^{n+1}' + b.slice(1) : '(-1)^{n}' + b) : s.pm ? '\\pm ' + b : b;
    if (!s.alt && !s.pm && b === '0') pre = '';
    var per = piTex(s.per) + ' n';
    var off = s.off ? angTex(s.off) : '';
    var body = pre + (off ? (off.charAt(0) === '-' ? ' - ' + off.slice(1) : ' + ' + off) : '');
    return v + ' = ' + (body ? body + ' + ' : '') + per + ',\\ n \\in \\mathbb{Z}';
  }
  function seriesVals(s, nmax) {
    var out = [];
    for (var n = -nmax; n <= nmax; n++) {
      var b = angVal(s.base), off = s.off ? angVal(s.off) : 0, sign = s.alt ? (n % 2 ? -1 : 1) : 1;
      var vs = s.pm ? [b, -b] : [sign * b];
      vs.forEach(function (x) { out.push(x * (s.scale || 1) + off + qv(s.per) * PI * n); });
    }
    return out;
  }
  // sin 2u и cos 2u рядом с функциями от u — раскрываем формулами двойного угла.
  function doubleAngle(L, Rr, v, S) {
    var args = {};
    [L, Rr].forEach(function (n) { (function walk(x) { if (!x) return; if (x.t === 'fn' && TRIG[x.name] && hasV(x.a, v)) { var p = pFromAst(x.a), c = p && pToUni(p, v); if (c && uDeg(c) === 1) args[qv(c[1]) + '|' + qv(c[0])] = c; } kids(x).forEach(walk); })(n); });
    var ks = Object.values(args);
    if (ks.length !== 2) return null;
    var a = ks[0], b = ks[1];
    if (!qZero(a[0]) || !qZero(b[0])) return null;
    var small = qEq(qMul(qi(2), a[1]), b[1]) ? a : qEq(qMul(qi(2), b[1]), a[1]) ? b : null;
    if (!small) return null;
    var big = small === a ? b : a, u = uToAst(small, v), onlySin = true;
    [L, Rr].forEach(function (n) { anyNode(n, function (x) { if (x.t === 'fn' && x.name === 'cos' && T(x.a) === T(u)) onlySin = false; return false; }); });
    function rw(x) {
      if (!x) return x;
      if (x.t === 'fn' && TRIG[x.name] && hasV(x.a, v)) {
        var p = pFromAst(x.a), c = p && pToUni(p, v);
        if (c && uDeg(c) === 1 && qEq(c[1], big[1])) {
          if (x.name === 'sin') return mul(Nn(2), mul({ t: 'fn', name: 'sin', a: u }, { t: 'fn', name: 'cos', a: u }));
          if (x.name === 'cos') return onlySin ? sub(Nn(1), mul(Nn(2), pw({ t: 'fn', name: 'sin', a: u }, Nn(2)))) : sub(mul(Nn(2), pw({ t: 'fn', name: 'cos', a: u }, Nn(2))), Nn(1));
          return null;
        }
      }
      var c2 = {}; for (var k in x) c2[k] = x[k];
      if (x.a) c2.a = rw(x.a); if (x.b) c2.b = rw(x.b);
      return c2;
    }
    var nl = rw(L), nr = rw(Rr);
    S.add(T(nl) + ' = ' + T(nr), 'Применяем формулы двойного угла: $\\sin 2u = 2\\sin u\\cos u$, $\\cos 2u = ' + (onlySin ? '1 - 2\\sin^2 u' : '2\\cos^2 u - 1') + '$.', 1);
    return { L: nl, R: nr };
  }
  function trigEq(L, Rr, v, S, cx) {
    var da = doubleAngle(L, Rr, v, S);
    if (da) { L = da.L; Rr = da.R; }
    var diff = sub(L, Rr), atoms = [];
    (function walk(x) { if (!x) return; if (x.t === 'fn' && TRIG[x.name] && hasV(x.a, v)) { atoms.push(x); return; } kids(x).forEach(walk); })(diff);
    var argP = null, k = null, m = null, ok = true;
    atoms.forEach(function (a) {
      var p = pFromAst(a.a), c = p && pToUni(p, v);
      if (!c || uDeg(c) !== 1) { ok = false; return; }
      if (!k) { k = c[1]; m = c[0]; argP = a.a; } else if (!qEq(k, c[1]) || !qEq(m, c[0])) ok = false;
    });
    if (!ok || !atoms.length) return null;
    var map = new Map(), NAMES = { sin: 's', cos: 'c', tan: 'tg', tg: 'tg', cot: 'ct', ctg: 'ct' };
    atoms.forEach(function (a) { map.set(a, Vr(NAMES[a.name])); });
    var P = pFromAst(replaceNodes(diff, map));
    if (!P || freeVars(pToAst(P)).some(function (x) { return x === v; })) return null;
    var fv = pVars(P), uT = T(argP), fnT = { s: '\\sin', c: '\\cos', tg: '\\operatorname{tg}', ct: '\\operatorname{ctg}' };
    var FN = { s: 'sin', c: 'cos', tg: 'tan', ct: 'cot' };
    function full(x) { return fnT[x] + wrapArg(uT); }
    var pre = [];
    if (fv.length === 2) ['s', 'c'].forEach(function (f0) {
      if (fv.length === 2 && pList(P).every(function (t) { return t.m[f0]; })) {
        var rest = pNew(); pList(P).forEach(function (t) { var m2 = {}; for (var kk in t.m) m2[kk] = t.m[kk]; m2[f0]--; pAddTerm(rest, t.c, m2); });
        S.add(full(f0) + ' \\cdot \\left(' + pTex(rest).replace(/\bs\b/g, full('s')).replace(/\bc\b/g, full('c')) + '\\right) = 0', 'Выносим общий множитель $' + full(f0) + '$: произведение равно нулю, когда один из множителей равен нулю.', 0);
        S.add(full(f0) + ' = 0', 'Первый случай.', 1);
        pre = pre.concat(trigBasic(FN[f0], 0, '0'));
        P = rest; fv = pVars(P);
      }
    });
    if (!fv.length) return trigFinish(pre, k, m, v, S, diff);
    if (fv.length === 2 && fv.indexOf('s') >= 0 && fv.indexOf('c') >= 0) {
      var evenS = pList(P).every(function (t) { return !((t.m.s || 0) % 2); }), evenC = pList(P).every(function (t) { return !((t.m.c || 0) % 2); });
      var degs = pList(P).map(function (t) { return (t.m.s || 0) + (t.m.c || 0); });
      if (evenS || evenC) {
        var from = evenS ? 's' : 'c', to = evenS ? 'c' : 's';
        var rep = pNew(); pList(P).forEach(function (t) { var e = (t.m[from] || 0) / 2, m2 = {}; if (t.m[to]) m2[to] = t.m[to]; var q = pMul(pConst(t.c), pPow(pSub(pConst(Q1), pMul(pVar(to), pVar(to))), e)); rep = pAdd(rep, pMul(q, pAddTerm(pNew(), Q1, m2))); });
        S.add(null, 'Используем основное тригонометрическое тождество: $' + fnT[from] + '^2 ' + wrapArg(uT) + ' = 1 - ' + fnT[to] + '^2 ' + wrapArg(uT) + '$.', 1);
        P = rep; fv = [to];
      } else if (degs.every(function (d) { return d === degs[0]; }) && degs[0] > 0) {
        var dd = degs[0], cc0 = coefIn(P, 's', dd);
        S.add(null, 'Однородное уравнение степени ' + dd + ': делим на $' + full('c') + '^{' + dd + '}$. ' + (qZero(cc0) ? 'Но при $' + full('c') + ' = 0$ уравнение тоже выполняется — эти корни учтём отдельно.' : 'При $' + full('c') + ' = 0$ было бы $' + full('s') + ' = \\pm 1$, и уравнение не выполнялось бы, поэтому делить можно.'), 1);
        var rep2 = pNew(); pList(P).forEach(function (t) { var m3 = {}; if (t.m.s) m3.tg = t.m.s; pAddTerm(rep2, t.c, m3); });
        if (qZero(cc0)) { P = rep2; }
        P = rep2; fv = ['tg'];
        if (qZero(cc0)) cx._extraCos = true;
      } else if (degs.every(function (d) { return d <= 1; })) {
        var a = coefIn(P, 's', 1), b = coefIn(P, 'c', 1), c = qNeg(pConstVal(P));
        var Rv = Math.sqrt(qv(a) * qv(a) + qv(b) * qv(b)), phi = Math.atan2(qv(b), qv(a)), ratio = qv(c) / Rv;
        var phiQ = recoverQ(phi / PI, 24);
        S.add(null, 'Метод вспомогательного угла: $a\\sin u + b\\cos u = R\\sin(u + \\varphi)$, где $R = \\sqrt{a^2 + b^2} = ' + numTex(Rv).tex + '$' + (phiQ ? ', $\\varphi = ' + piTex(phiQ) + '$' : '') + '.', 1);
        S.add('\\sin\\left(' + uT + (phiQ ? ' + ' + piTex(phiQ) : ' + \\varphi') + '\\right) = ' + numTex(ratio).tex, 'Делим обе части на $R$.', 0);
        var ser = trigBasic('sin', ratio, numTex(ratio).tex);
        if (!ser) { S.add(null, 'Синус не может быть больше $1$ по модулю — решений нет.', 0); return sol([], { none: true }); }
        return trigFinish(ser.map(function (s) { s.shift = phiQ ? { pi: qNeg(phiQ) } : { arc: '\\varphi', arcVal: -phi, k: qi(-1) }; return s; }), k, m, v, S, diff);
      } else return null;
    }
    if (fv.length !== 1) return null;
    var f = fv[0], tc = pToUni(P, f);
    var series = [];
    if (uDeg(tc) === 1) {
      var tv = qDiv(qNeg(tc[0]), tc[1]);
      S.add(full(f) + ' = ' + qTex(tv), 'Простейшее тригонометрическое уравнение.', 0);
      series = trigBasic(FN[f], qv(tv), qTex(tv));
      if (!series) { S.add(null, 'Значения ' + (f === 's' ? 'синуса' : 'косинуса') + ' лежат на отрезке $[-1; 1]$ — решений нет.', 0); series = []; }
    } else {
      S.add(uTex(tc, 't') + ' = 0', 'Замена $t = ' + full(f) + '$' + (f === 's' || f === 'c' ? ', причём $-1 \\le t \\le 1$' : '') + '.', 0);
      var st = solveUni(tc, 't', S.group('Решаем уравнение для $t$', 1), cx);
      st.roots.forEach(function (tr) {
        var b = trigBasic(FN[f], tr.val, tr.tex);
        if (!b) { S.add(null, '$t = ' + tr.tex + '$ не подходит: $|t| > 1$.', 0); return; }
        S.add(full(f) + ' = ' + tr.tex, 'Обратная замена.', 1);
        series = series.concat(b);
      });
    }
    series = pre.concat(series);
    if (cx._extraCos) { series = series.concat([{ base: { pi: Q(1, 2) }, per: Q1 }]); cx._extraCos = false; }
    return trigFinish(series, k, m, v, S, diff);
  }
  function trigFinish(series, k, m, v, S, diff) {
    if (!series.length) return sol([], { none: true });
    var mv2 = qv(m), mpi = recoverQ(mv2 / PI, 24);
    var out = series.map(function (s) {
      var r = { base: s.base, per: qDiv(s.per, qAbs(k)), alt: s.alt, pm: s.pm };
      r.base = angScale(s.base, qDiv(Q1, k));
      var offs = [];
      if (s.shift) offs.push(angScale(s.shift, qDiv(Q1, k)));
      if (!qZero(m)) offs.push(mpi ? { pi: qNeg(qDiv(mpi, k)) } : { arc: qTex(qAbs(m)), arcVal: Math.abs(mv2), k: qDiv(qi(mv2 > 0 ? -1 : 1), k) });
      if (offs.length === 1) r.off = offs[0];
      else if (offs.length === 2 && !offs[0].arc && !offs[1].arc) r.off = { pi: qAdd(offs[0].pi, offs[1].pi) };
      else if (offs.length === 2) { r.off = offs[1].arc ? offs[1] : offs[0]; r.off2 = offs[1].arc ? offs[0] : offs[1]; }
      if (r.base.arc === undefined && r.off && r.off.pi && !s.pm && !s.alt) { r.base = { pi: qAdd(r.base.pi, r.off.pi) }; r.off = null; }
      if (r.off2) { r.off = r.off.arc ? { arc: angTex(r.off) + ' + ' + angTex(r.off2), arcVal: angVal(r.off) + angVal(r.off2) } : r.off; }
      return r;
    });
    if (!qOne(k) || !qZero(m)) S.add(null, 'Выражаем $' + v + '$ из аргумента $' + termsTex([{ c: k, m: mv(v) }, { c: m.f !== undefined ? m : m, m: {} }]) + '$.', 1);
    var texs = out.map(function (s) { return seriesTex(v, s); });
    S.add(texs.join(';\\quad '), 'Общее решение (серии корней).', 0);
    var bad = out.some(function (s) { return seriesVals(s, 1).some(function (x) { var y = at(diff, v, x); return isFinite(y) && Math.abs(y) > 1e-6; }); });
    if (bad) return null;
    return sol([], { series: texs, seriesSample: out.map(function (s) { return seriesVals(s, 0)[0]; }) });
  }

  /* ---------------------------------------------- численно */
  function numericEq(L, Rr, v, S, cx, why) {
    var f = function (x) { return at(sub(L, Rr), v, x); };
    if (why) S.add(null, why, 0);
    var roots = numericRoots(f);
    var per = detectPeriod(f, roots.inner);
    if (per) {
      var base = roots.inner.filter(function (x) { return x >= -1e-9 && x < per.T - 1e-9; });
      var Tt = per.tex;
      var texs = base.map(function (x) { return v + ' \\approx ' + fTex(x, 8) + ' + ' + Tt + ' n'; });
      S.add(texs.join(';\\quad ') + ',\\ n \\in \\mathbb{Z}', 'Левая часть периодична с периодом $' + Tt + '$: корни повторяются через каждый период. Выписываем корни на $[0; ' + Tt + ')$.', 0);
      return sol([], { series: base.map(function (x) { return v + ' \\approx ' + fTex(x, 8) + ' + ' + Tt + ' n,\\ n \\in \\mathbb{Z}'; }), numeric: true });
    }
    var rs = roots.all.map(rootNum);
    if (!rs.length) S.add(null, 'На промежутке $[-10^4; 10^4]$ функция нигде не обращается в ноль — корней не найдено.', 0);
    else S.add(rootsTex(v, rs.slice(0, 12)), 'Найденные корни (с точностью около $10^{-10}$).', 0);
    return sol(rs.slice(0, 40), { numeric: true });
  }
  function numericRoots(f) {
    var found = [];
    function push(x) {
      var y = f(x), h = 1e-4 * Math.max(1, Math.abs(x));
      var scale = Math.max(1, Math.abs(f(x - h)), Math.abs(f(x + h)));
      if (!isFinite(y) || Math.abs(y) > 1e-6 * scale || Math.abs(f(x - h)) > 1e6 && Math.abs(f(x + h)) > 1e6) return;
      if (!found.some(function (z) { return Math.abs(z - x) < 1e-7 * Math.max(1, Math.abs(x)); })) found.push(x);
    }
    function scan(a, b, n) {
      var h = (b - a) / n, px = a, pf = f(a), pa = Math.abs(pf), ppa = Infinity;
      for (var i = 1; i <= n; i++) {
        var x = a + i * h, fx = f(x);
        if (fx === 0) push(x);
        else if (isFinite(pf) && isFinite(fx) && pf * fx < 0) {
          var lo = px, hi = x, flo = pf;
          for (var k = 0; k < 100; k++) { var mdl = (lo + hi) / 2, fm = f(mdl); if (flo * fm <= 0) hi = mdl; else { lo = mdl; flo = fm; } }
          push((lo + hi) / 2);
        } else if (isFinite(pa) && pa < ppa && pa < Math.abs(fx) && pa < 1e-3) {
          // касание оси без смены знака — минимизируем |f|
          var l2 = px - h, r2 = x;
          for (var g = 0; g < 100; g++) { var m1 = l2 + (r2 - l2) / 3, m2 = r2 - (r2 - l2) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) r2 = m2; else l2 = m1; }
          if (Math.abs(f((l2 + r2) / 2)) < 1e-12) push((l2 + r2) / 2);
        }
        ppa = pa; pa = Math.abs(fx); pf = fx; px = x;
      }
    }
    scan(-12, 12, 24000);
    var inner = found.slice().sort(function (a, b) { return a - b; });
    scan(-120, 120, 24000); scan(-1e4, 1e4, 40000);
    return { inner: inner, all: found.sort(function (a, b) { return a - b; }) };
  }
  function detectPeriod(f, roots) {
    if (roots.length < 8) return null;
    var cands = [PI, 2 * PI, PI / 2, 2 * PI / 3, PI / 3, 4 * PI];
    for (var i = 0; i < cands.length; i++) {
      var T0 = cands[i], ok = true;
      for (var j = 0; j < 15 && ok; j++) { var x = -5 + j * 0.713; var a = f(x), b = f(x + T0); if (isFinite(a) && isFinite(b) && Math.abs(a - b) > 1e-8 * Math.max(1, Math.abs(a))) ok = false; }
      if (ok) return { T: T0, tex: piTex(recoverQ(T0 / PI)) };
    }
    return null;
  }

  /* ============================ 11. НЕРАВЕНСТВА ==========================
     Область — список промежутков {lo, hi (Rt|null = бесконечность), loInc, hiInc}. */
  var FLIP = { '<': '>', '>': '<', '≤': '≥', '≥': '≤', '≠': '≠' };
  function holdsOp(y, op) { return op === '>' ? y > 1e-12 : op === '≥' ? y > -1e-12 : op === '<' ? y < -1e-12 : op === '≤' ? y < 1e-12 : Math.abs(y) > 1e-12; }
  function ivTex(iv) {
    if (iv.lo && iv.hi && sameVal(iv.lo.val, iv.hi.val)) return '\\{' + iv.lo.tex + '\\}';
    return (iv.lo && iv.loInc ? '[' : '(') + (iv.lo ? iv.lo.tex : '-\\infty') + ';\\ ' + (iv.hi ? iv.hi.tex : '+\\infty') + (iv.hi && iv.hiInc ? ']' : ')');
  }
  function regionTex(reg, v) {
    if (!reg.length) return '\\text{решений нет}';
    if (reg.length === 1 && !reg[0].lo && !reg[0].hi) return v + ' \\in \\mathbb{R}';
    return v + ' \\in ' + reg.map(ivTex).join(' \\cup ');
  }
  function solveIneq(L, Rr, op, v, S, cx) {
    var diff = sub(L, Rr), f = features(diff, v);
    var pl = pFromAst(L), pr = pFromAst(Rr), c = pl && pr && pToUni(pSub(pl, pr), v);
    if (c && uDeg(c) <= 1) return linearIneq(L, Rr, op, v, S);
    var fn = function (x) { return at(diff, v, x); };
    // критические точки: нули выражения и точки, где оно не определено
    var crit = [], dom = [];
    var zr = quietRoots(L, Rr, v);
    if (zr === null) zr = [];
    denominators(diff, v).forEach(function (d) { (quietRoots(d, Nn(0), v) || []).forEach(function (r) { dom.push(r); }); });
    (function walk(x) {
      if (!x) return;
      if ((x.t === 'fn' && (x.name === 'sqrt' || x.name === 'ln' || x.name === 'log' || x.name === 'lg')) && hasV(x.a, v)) (quietRoots(x.a, Nn(0), v) || []).forEach(function (r) { dom.push(r); });
      if (x.t === 'fn' && x.name === 'abs' && hasV(x.a, v)) (quietRoots(x.a, Nn(0), v) || []).forEach(function (r) { dom.push(r); });
      kids(x).forEach(walk);
    })(diff);
    if (f.trig) return periodicIneq(diff, op, v, S);
    crit = uniqRoots(zr.concat(dom));
    if (c) {
      S.add(uTex(c, v) + ' ' + relTex(op) + ' 0', 'Переносим всё в левую часть.', 1);
      S.add(null, 'Решаем методом интервалов: находим нули левой части и определяем её знак на каждом промежутке.', 1);
    } else if (f.den && !f.rad && !f.log && !f.exp) {
      var rf = rfFromAst(diff, v);
      if (rf) S.add('\\frac{' + uTex(rf.n, v) + '}{' + uTex(rf.d, v) + '} ' + relTex(op) + ' 0', 'Переносим всё влево и приводим к общему знаменателю. Дальше — метод интервалов: знак дроби меняется только в нулях числителя и знаменателя.', 1);
    } else S.add(null, 'Находим точки, где выражение $' + T(diff) + '$ обращается в ноль или теряет смысл, и проверяем знак на промежутках между ними.', 1);
    if (zr.length) S.add(zr.map(function (r) { return v + ' = ' + r.tex; }).join(',\\ '), 'Нули выражения (решаем уравнение $' + T(L) + ' = ' + T(Rr) + '$).', 1);
    var excluded = dom.filter(function (d) { return !isFinite(fn(d.val)); });
    if (excluded.length) S.add(excluded.map(function (r) { return v + ' \\ne ' + r.tex; }).join(',\\ '), 'В этих точках выражение не определено — они «выколоты».', 1);
    // знаки
    var pts = crit, reg = [], cells = [], signs = [];
    for (var i = 0; i <= pts.length; i++) {
      var lo = i ? pts[i - 1] : null, hi = i < pts.length ? pts[i] : null;
      var tp = lo && hi ? (lo.val + hi.val) / 2 : lo ? lo.val + Math.max(1, Math.abs(lo.val)) : hi ? hi.val - Math.max(1, Math.abs(hi.val)) : 0;
      var y = fn(tp), ok = isFinite(y) && holdsOp(y, op);
      cells.push(ivTex({ lo: lo, hi: hi }));
      signs.push(!isFinite(y) ? '\\times' : y > 0 ? '+' : y < 0 ? '-' : '0');
      if (ok) reg.push({ lo: lo, hi: hi, loInc: false, hiInc: false });
    }
    if (pts.length && pts.length <= 8) S.add('\\begin{array}{c|' + cells.map(function () { return 'c'; }).join('') + '} ' + v + ' & ' + cells.join(' & ') + ' \\\\ \\hline \\text{знак} & ' + signs.join(' & ') + ' \\end{array}', 'Знак на каждом промежутке определяем подстановкой любой его точки ($\\times$ — выражение там не определено).', 1);
    // сами точки
    pts.forEach(function (p) {
      var y = fn(p.val);
      if (isFinite(y) && holdsOp(y, op)) reg.push({ lo: p, hi: p, loInc: true, hiInc: true });
    });
    reg = mergeRegion(reg);
    S.add(regionTex(reg, v), (op === '≥' || op === '≤') ? 'Неравенство нестрогое — нули выражения входят в ответ, выколотые точки — нет.' : 'Неравенство строгое — концы промежутков не входят.', 0);
    return reg;
  }
  function mergeRegion(reg) {
    reg.sort(function (a, b) { return (a.lo ? a.lo.val : -Infinity) - (b.lo ? b.lo.val : -Infinity) || (a.hi ? a.hi.val : Infinity) - (b.hi ? b.hi.val : Infinity); });
    var out = [];
    reg.forEach(function (r) {
      var p = out[out.length - 1];
      if (p && p.hi && r.lo && sameVal(p.hi.val, r.lo.val) && (p.hiInc || r.loInc)) { if (!r.hi || !p.hi || r.hi.val >= p.hi.val) { p.hi = r.hi; p.hiInc = r.hiInc; } return; }
      if (p && (!p.hi || (r.lo && r.lo.val < p.hi.val - 1e-12))) { if (p.hi && (!r.hi || r.hi.val > p.hi.val)) { p.hi = r.hi; p.hiInc = r.hiInc; } return; }
      out.push({ lo: r.lo, hi: r.hi, loInc: r.loInc, hiInc: r.hiInc });
    });
    return out;
  }
  function linearIneq(L, Rr, op, v, S) {
    var sides = expandSides(L, Rr, relTex(op), S);
    var a = qSub(coefIn(sides.l, v, 1), coefIn(sides.r, v, 1)), b = qSub(coefIn(sides.r, v, 0), coefIn(sides.l, v, 0));
    S.add(termsTex(qZero(a) ? [{ c: Q0, m: {} }] : [{ c: a, m: mv(v) }]) + ' ' + relTex(op) + ' ' + qTex(b), 'Переносим слагаемые с $' + v + '$ влево, числа — вправо (с противоположным знаком) и приводим подобные.', 1);
    if (qZero(a)) {
      var ok = holdsOp(-qv(b), op);
      S.add(null, 'Получили $0 ' + relTex(op) + ' ' + qTex(b) + '$ — ' + (ok ? 'верно при любом $' + v + '$.' : 'неверно ни при каком $' + v + '$.'), 0);
      return ok ? [{ lo: null, hi: null }] : [];
    }
    var x = qDiv(b, a), op2 = qSign(a) < 0 ? FLIP[op] : op;
    if (!qOne(a)) S.add(v + ' ' + relTex(op2) + ' ' + qTex(x), 'Делим обе части на $' + qTex(a) + '$' + (qSign(a) < 0 ? '. Число отрицательное — знак неравенства меняется на противоположный!' : '; число положительное, знак неравенства сохраняется.'), 0);
    var r = rootQ(x);
    if (op2 === '≠') return [{ lo: null, hi: r }, { lo: r, hi: null }];
    var inc = op2 === '≥' || op2 === '≤';
    return op2 === '<' || op2 === '≤' ? [{ lo: null, hi: r, hiInc: inc }] : [{ lo: r, hi: null, loInc: inc }];
  }
  function periodicIneq(diff, op, v, S) {
    var fn = function (x) { return at(diff, v, x); }, per = detectPeriod(fn, [1, 2, 3, 4, 5, 6, 7, 8]);
    if (!per) fail('это тригонометрическое неравенство пока не решается: не удалось определить период');
    var T0 = per.T, pts = [], h = T0 / 4000, prev = fn(0);
    for (var i = 1; i <= 4000; i++) { var x = i * h, y = fn(x); if (isFinite(prev) && isFinite(y) && prev * y <= 0 && prev !== 0) { var lo = x - h, hi = x; for (var k = 0; k < 80; k++) { var m = (lo + hi) / 2; if (fn(lo) * fn(m) <= 0) hi = m; else lo = m; } pts.push((lo + hi) / 2); } prev = y; }
    S.add(null, 'Выражение периодично с периодом $' + per.tex + '$, поэтому решаем неравенство на одном периоде $[0; ' + per.tex + ')$ и добавляем $' + per.tex + ' n$.', 1);
    var b = [0].concat(pts, [T0]), parts = [];
    for (var j = 0; j < b.length - 1; j++) if (holdsOp(fn((b[j] + b[j + 1]) / 2), op)) parts.push([b[j], b[j + 1]]);
    var inc = op === '≥' || op === '≤';
    var texs = parts.map(function (p) { var a = rootNum(p[0]).tex, c = rootNum(p[1]).tex; return a + ' + ' + per.tex + ' n ' + (inc ? '\\le' : '<') + ' ' + v + ' ' + (inc ? '\\le' : '<') + ' ' + c + ' + ' + per.tex + ' n'; });
    S.add(texs.join(';\\quad ') + ',\\ n \\in \\mathbb{Z}', 'Промежутки, где неравенство выполняется.', 0);
    return { periodic: texs };
  }

  /* ============================== 12. СИСТЕМЫ ============================ */
  function casesTex(rows) { return '\\begin{cases} ' + rows.join(' \\\\ ') + ' \\end{cases}'; }
  function rowTex(row, vars) {
    var t = []; vars.forEach(function (x, j) { if (!qZero(row[j])) t.push({ c: row[j], m: mv(x) }); });
    return (t.length ? termsTex(t) : '0') + ' = ' + qTex(row[vars.length]);
  }
  function gaussSolve(M, vars, S) {
    var n = M.length, m = vars.length, r = 0, piv = [];
    S.add(casesTex(M.map(function (row) { return rowTex(row, vars); })), 'Записываем систему так, чтобы переменные были слева, числа — справа.', 1);
    for (var col = 0; col < m && r < n; col++) {
      var p = -1; for (var i = r; i < n; i++) if (!qZero(M[i][col]) && (p < 0 || qOne(qAbs(M[i][col])))) p = i;
      if (p < 0) continue;
      if (p !== r) { var tmp = M[p]; M[p] = M[r]; M[r] = tmp; }
      var ops = [];
      for (var i2 = r + 1; i2 < n; i2++) {
        if (qZero(M[i2][col])) continue;
        var f = qDiv(M[i2][col], M[r][col]);
        M[i2] = M[i2].map(function (x, j) { return qSub(x, qMul(f, M[r][j])); });
        ops.push('из уравнения ' + (i2 + 1) + ' вычитаем уравнение ' + (r + 1) + ', умноженное на $' + qTex(f) + '$');
      }
      if (ops.length) S.add(casesTex(M.map(function (row) { return rowTex(row, vars); })), 'Исключаем $' + vars[col] + '$: ' + ops.join('; ') + '.', 1);
      piv.push(col); r++;
    }
    for (var i3 = 0; i3 < n; i3++) if (M[i3].slice(0, m).every(qZero) && !qZero(M[i3][m])) { S.add('0 = ' + qTex(M[i3][m]), 'Получилось неверное равенство — система несовместна, решений нет.', 0); return { kind: 'none' }; }
    var free = vars.filter(function (_, j) { return piv.indexOf(j) < 0; });
    var vals = {};
    free.forEach(function (x, i) { vals[x] = { free: true, p: pVar(free.length === 1 ? 't' : 't_' + (i + 1)) }; });
    for (var k = piv.length - 1; k >= 0; k--) {
      var c = piv[k], row = M[k], rhs = pConst(row[m]);
      for (var j = c + 1; j < m; j++) if (!qZero(row[j])) rhs = pSub(rhs, pScale(vals[vars[j]].p, row[j]));
      rhs = pScale(rhs, qDiv(Q1, row[c]));
      vals[vars[c]] = { p: rhs };
      S.add(vars[c] + ' = ' + pTex(rhs), 'Из уравнения ' + (k + 1) + ' выражаем $' + vars[c] + '$' + (k < piv.length - 1 ? ' (подставляем уже найденное)' : '') + '.', 1);
    }
    if (free.length) S.add(null, 'Переменных больше, чем независимых уравнений: $' + free.join(', ') + '$ — свободн' + (free.length > 1 ? 'ые' : 'ая') + ', решений бесконечно много.', 0);
    return { kind: free.length ? 'infinite' : 'unique', vals: vals, free: free };
  }
  function det(A) {
    if (A.length === 1) return A[0][0];
    var s = Q0;
    for (var j = 0; j < A.length; j++) {
      var minor = A.slice(1).map(function (r) { return r.filter(function (_, k) { return k !== j; }); });
      s = qAdd(s, qMul(qMul(qi(j % 2 ? -1 : 1), A[0][j]), det(minor)));
    }
    return s;
  }
  function matTex(A) { return '\\begin{vmatrix} ' + A.map(function (r) { return r.map(function (q) { return qTex(q); }).join(' & '); }).join(' \\\\ ') + ' \\end{vmatrix}'; }
  function cramer(M, vars, S) {
    var A = M.map(function (r) { return r.slice(0, vars.length); }), b = M.map(function (r) { return r[vars.length]; });
    var D = det(A);
    if (qZero(D)) return null;
    S.add('\\Delta = ' + matTex(A) + ' = ' + qTex(D), 'Главный определитель из коэффициентов при переменных. Он не равен нулю — решение единственное.', 0);
    var vals = {};
    vars.forEach(function (x, i) {
      var Ai = A.map(function (r, k) { var c = r.slice(); c[i] = b[k]; return c; }), Di = det(Ai);
      vals[x] = { p: pConst(qDiv(Di, D)) };
      S.add('\\Delta_{' + x + '} = ' + matTex(Ai) + ' = ' + qTex(Di) + ',\\quad ' + x + ' = \\frac{\\Delta_{' + x + '}}{\\Delta} = ' + qTex(qDiv(Di, D)), 'Заменяем столбец коэффициентов при $' + x + '$ столбцом свободных членов.', 1, { briefTex: x + ' = ' + qTex(qDiv(Di, D)) });
    });
    return { kind: 'unique', vals: vals, free: [] };
  }
  function substitution2(M, vars, S) {
    if (M.length !== 2 || vars.length !== 2) return null;
    var bi = -1, bj = -1;
    for (var i = 0; i < 2 && bi < 0; i++) for (var j = 0; j < 2; j++) if (qOne(qAbs(M[i][j]))) { bi = i; bj = j; break; }
    if (bi < 0) for (var i2 = 0; i2 < 2 && bi < 0; i2++) for (var j2 = 0; j2 < 2; j2++) if (!qZero(M[i2][j2])) { bi = i2; bj = j2; break; }
    if (bi < 0) return null;
    var x = vars[bj], y = vars[1 - bj], r = M[bi], oi = 1 - bi, o = M[oi];
    var expr = pScale(pSub(pConst(r[2]), pScale(pVar(y), r[1 - bj])), qDiv(Q1, r[bj]));
    S.add(x + ' = ' + pTex(expr), 'Из уравнения ' + (bi + 1) + ' выражаем $' + x + '$' + (qOne(qAbs(r[bj])) ? ' (коэффициент при нём $\\pm 1$ — так проще).' : '.'), 0);
    var subP = pAdd(pScale(expr, o[bj]), pScale(pVar(y), o[1 - bj]));
    S.add(pTex(subP) + ' = ' + qTex(o[2]), 'Подставляем в уравнение ' + (oi + 1) + '.', 1);
    var a = coefIn(subP, y, 1), b = qSub(o[2], pConstVal(subP));
    if (qZero(a)) { S.add('0 = ' + qTex(b), qZero(b) ? 'Верное равенство — решений бесконечно много.' : 'Неверное равенство — решений нет.', 0); return qZero(b) ? null : { kind: 'none' }; }
    var yv = qDiv(b, a);
    S.add(termsTex([{ c: a, m: mv(y) }]) + ' = ' + qTex(b) + ' \\;\\Rightarrow\\; ' + y + ' = ' + qTex(yv), 'Решаем линейное уравнение с одной переменной.', 0);
    var xv = qDiv(qSub(r[2], qMul(r[1 - bj], yv)), r[bj]);
    S.add(x + ' = ' + qTex(xv), 'Подставляем найденное $' + y + '$ в выражение для $' + x + '$.', 0);
    var vals = {}; vals[x] = { p: pConst(xv) }; vals[y] = { p: pConst(yv) };
    return { kind: 'unique', vals: vals, free: [] };
  }
  function addition2(M, vars, S) {
    if (M.length !== 2 || vars.length !== 2) return null;
    var best = null;
    [0, 1].forEach(function (j) { if (qZero(M[0][j]) || qZero(M[1][j]) || isF(M[0][j]) || isF(M[1][j])) return; var L2 = lcm(M[0][j].n * M[1][j].d, M[1][j].n * M[0][j].d); if (!best || L2 < best.L) best = { j: j, L: L2 }; });
    if (!best) return null;
    var j = best.j, k1 = qDiv(qi(best.L), M[0][j]), k2 = qNeg(qDiv(qi(best.L), M[1][j]));
    var R1 = M[0].map(function (q) { return qMul(q, k1); }), R2 = M[1].map(function (q) { return qMul(q, k2); });
    S.add(casesTex([rowTex(R1, vars), rowTex(R2, vars)]), 'Домножаем уравнения на $' + qTex(k1) + '$ и $' + qTex(k2) + '$, чтобы коэффициенты при $' + vars[j] + '$ стали противоположными.', 1);
    var sum = R1.map(function (q, i) { return qAdd(q, R2[i]); }), y = vars[1 - j];
    S.add(rowTex(sum, vars), 'Складываем уравнения почленно — $' + vars[j] + '$ исчезает.', 0);
    if (qZero(sum[1 - j])) { S.add(null, qZero(sum[2]) ? 'Получилось $0 = 0$ — уравнения равносильны, решений бесконечно много.' : 'Получилось неверное равенство — решений нет.', 0); return qZero(sum[2]) ? null : { kind: 'none' }; }
    var yv = qDiv(sum[2], sum[1 - j]);
    S.add(y + ' = ' + qTex(yv), 'Находим $' + y + '$.', 0);
    var xv = qDiv(qSub(M[0][2], qMul(M[0][1 - j], yv)), M[0][j]);
    S.add(vars[j] + ' = ' + qTex(xv), 'Подставляем в первое уравнение и находим $' + vars[j] + '$.', 0);
    var vals = {}; vals[vars[j]] = { p: pConst(xv) }; vals[y] = { p: pConst(yv) };
    return { kind: 'unique', vals: vals, free: [] };
  }
  function linearSystem(polys, vars, S, cx) {
    var M = polys.map(function (p) { var row = vars.map(function (x) { return coefIn(p, x, 1); }); row.push(qNeg(pConstVal(p))); return row; });
    var list = [{ id: 'gauss', label: 'Метод Гаусса' }];
    var sq = M.length === vars.length && !qZero(det(M.map(function (r) { return r.slice(0, vars.length); })));
    if (M.length === 2 && vars.length === 2) { list.unshift({ id: 'addition', label: 'Сложение' }); list.unshift({ id: 'substitution', label: 'Подстановка' }); }
    if (sq && vars.length <= 4) list.push({ id: 'cramer', label: 'Метод Крамера' });
    var m = offerMethods(cx, 'sys', list, list[0].id);
    var copy = M.map(function (r) { return r.slice(); });
    var tmp = new Steps();
    var res = m === 'cramer' ? cramer(copy, vars, tmp) : m === 'substitution' ? substitution2(copy, vars, tmp) : m === 'addition' ? addition2(copy, vars, tmp) : null;
    if (res) { tmp.list.forEach(function (x) { S.list.push(x); }); return res; }
    if (m !== 'gauss') S.add(null, 'Выбранный способ здесь не доводит решение до конца (уравнения зависимы), поэтому решаем методом Гаусса.', 1);
    return gaussSolve(M, vars, S);
  }
  // Нелинейная система: ищем уравнение, линейное по одной переменной с
  // постоянным коэффициентом, выражаем и подставляем в остальные.
  function nonlinearSystem(eqs, vars, S, cx, depth) {
    depth = depth || 0;
    var polys = eqs.map(function (e) { return pFromAst(e); });
    // вычитание: если нелинейные части двух уравнений пропорциональны
    if (eqs.length === 2 && polys[0] && polys[1]) {
      var nl = function (p) { var r = pNew(); pList(p).forEach(function (t) { if (mDeg(t.m) > 1) pAddTerm(r, t.c, t.m); }); return r; };
      var n0 = nl(polys[0]), n1 = nl(polys[1]);
      if (!pIsZero(n0) && !pIsZero(n1)) {
        var t0 = pSorted(n0)[0], t1 = n1.t[mKey(t0.m)];
        if (t1) {
          var k = qDiv(t0.c, t1.c), rest = pSub(n0, pScale(n1, k));
          if (pIsZero(rest)) {
            var lin = pSub(polys[0], pScale(polys[1], k));
            S.add(pTex(lin) + ' = 0', 'Вычитаем из первого уравнения второе' + (qOne(k) ? '' : ', умноженное на $' + qTex(k) + '$') + ': слагаемые второй степени взаимно уничтожаются, остаётся линейное уравнение.', 0);
            eqs = [pToAst(lin), eqs[0]]; polys = [lin, polys[0]];
          }
        }
      }
    }
    var mono = monoSystem(polys, vars, S, cx);
    if (mono) return mono;
    for (var i = 0; i < eqs.length; i++) {
      if (!polys[i]) continue;
      for (var j = 0; j < vars.length; j++) {
        var w = vars[j], cs = pCoeffs(polys[i], w);
        if (cs.length !== 2 || !pIsConst(cs[1]) || qZero(pConstVal(cs[1]))) continue;
        var expr = pScale(pNeg(cs[0]), qDiv(Q1, pConstVal(cs[1])));
        var eAst = pToAst(expr);
        S.add(w + ' = ' + pTex(expr), 'Из уравнения ' + (i + 1) + ' выражаем $' + w + '$.', 0);
        var others = eqs.filter(function (_, k) { return k !== i; }).map(function (e) { return subst(e, w, eAst); });
        var rv = vars.filter(function (x) { return x !== w; });
        var partial;
        if (others.length === 1 && rv.length === 1) {
          S.add(T(others[0]) + ' = 0', 'Подставляем в ' + (eqs.length === 2 ? 'другое уравнение' : 'остальные уравнения') + ' — получаем уравнение с одной переменной.', 0);
          var s = solveEq(others[0], Nn(0), rv[0], S.group('Решаем уравнение относительно $' + rv[0] + '$', 1), cx);
          if (s.all || s.series) return null;
          partial = s.roots.map(function (r) { var o = {}; o[rv[0]] = r; return o; });
        } else if (others.length && rv.length) {
          var sub2 = S.group('Подставляем и решаем систему для $' + rv.join(', ') + '$', 1);
          var ps = others.map(function (e) { return pFromAst(e); });
          var r2 = ps.every(function (p) { return p && pTotalDeg(p) <= 1; }) ? linearSystem(ps, rv, sub2, { quiet: true }) : null;
          if (r2 && r2.kind === 'unique') { var o2 = {}; rv.forEach(function (x) { o2[x] = rootQ(pConstVal(r2.vals[x].p)); }); partial = [o2]; }
          else partial = depth < 2 ? nonlinearSystem(others, rv, sub2, cx, depth + 1) : null;
          if (!partial) return null;
        } else return null;
        var out = [];
        partial.forEach(function (sl) {
          var env = {}; rv.forEach(function (x) { env[x] = sl[x].val; });
          var wv = pEval(expr, env), rec = {};
          for (var k in sl) rec[k] = sl[k];
          var e2 = subst(eAst, rv[0], NQ(qLit(0)));
          var qx = rv.every(function (x) { return sl[x].exact && recoverQ(sl[x].val); }) ? recoverQ(wv) : null;
          rec[w] = qx ? rootQ(qx) : rootNum(wv);
          out.push(rec);
          S.add(w + ' = ' + rec[w].tex, 'При $' + rv.map(function (x) { return x + ' = ' + sl[x].tex; }).join(',\\ ') + '$.', 1);
        });
        return out;
      }
    }
    return null;
  }

  // Замена «степеней как новых неизвестных»: x²+y²=25, x²−y²=7 -> u=x², w=y².
  function monoSystem(polys, vars, S, cx) {
    if (polys.some(function (p) { return !p; })) return null;
    var keys = {}, list = [];
    polys.forEach(function (p) { pList(p).forEach(function (t) { var k = mKey(t.m); if (k && !keys[k]) { keys[k] = 1; list.push(t.m); } }); });
    if (list.length !== polys.length || list.length !== vars.length) return null;
    if (!list.every(function (m) { var ks = Object.keys(m); return ks.length === 1 && m[ks[0]] >= 2; })) return null;
    var names = list.map(function (_, i) { return ['u', 'w', 'p', 'q'][i] || 'u' + i; });
    S.add(list.map(function (m, i) { return names[i] + ' = ' + monoTex(m); }).join(',\\quad '), 'Переменные входят только в виде этих степеней — обозначим их новыми буквами: система станет линейной.', 0);
    var lin = polys.map(function (p) { var r = pNew(); pList(p).forEach(function (t) { var k = mKey(t.m); var i = list.findIndex(function (m) { return mKey(m) === k; }); pAddTerm(r, t.c, i < 0 ? {} : mv(names[i])); }); return r; });
    var res = linearSystem(lin, names, S.group('Решаем линейную систему', 1), { quiet: true });
    if (res.kind !== 'unique') return null;
    var opts = list.map(function (m, i) {
      var v = Object.keys(m)[0], val = pConstVal(res.vals[names[i]].p);
      return { v: v, roots: binomialRoots(val, m[v], v, S.group('Обратная замена: $' + monoTex(m) + ' = ' + qTex(val) + '$', 1)).roots };
    });
    var out = [{}];
    opts.forEach(function (o) { var nx = []; out.forEach(function (sl) { o.roots.forEach(function (r) { var c = {}; for (var k in sl) c[k] = sl[k]; c[o.v] = r; nx.push(c); }); }); out = nx; });
    return out;
  }

  /* ========================= 13. УПРОЩЕНИЕ ВЫРАЖЕНИЙ ===================== */
  function factorUniTex(c, v) {
    var sc = uIntScale(c); if (!sc || uDeg(c) < 2) return null;
    var k = qDiv(Q1, sc.k), ic = sc.c, parts = [], d = uDeg(ic);
    var z = 0; while (qZero(ic[z])) z++;
    if (z) { parts.push(z === 1 ? v : v + '^{' + z + '}'); ic = ic.slice(z); }
    for (var guard = 0; guard < 10 && uDeg(ic) >= 1; guard++) {
      var a0 = ic[0].n, an = ic[uDeg(ic)].n, found = null;
      divisors(a0).some(function (p) { return divisors(an).some(function (q) { return [Q(p, q), Q(-p, q)].some(function (x) { if (qZero(uEvalQ(ic, x))) { found = x; return true; } return false; }); }); });
      if (!found) break;
      var lin = [qNeg(Q(found.n, 1)), qi(found.d)];
      ic = uDivmod(ic, lin).q; parts.push('\\left(' + uTex(lin, v) + '\\right)');
      if (uDeg(ic) === 0) { k = qMul(k, ic[0]); ic = [Q1]; }
    }
    if (parts.length < (z ? 1 : 2) && !(parts.length && uDeg(ic) >= 1)) return null;
    if (uDeg(ic) >= 1) parts.push('\\left(' + uTex(ic, v) + '\\right)');
    else k = qMul(k, ic[0]);
    var pre = qOne(k) ? '' : qEq(k, qi(-1)) ? '-' : qTex(k) + ' ';
    var counts = {}; parts.forEach(function (p) { counts[p] = (counts[p] || 0) + 1; });
    var body = Object.keys(counts).map(function (p) { return counts[p] > 1 ? p + '^{' + counts[p] + '}' : p; }).join('');
    return parts.length >= 2 || pre ? pre + body : null;
  }
  function simplifyExpr(ast, vars, S) {
    var notes = [], tl = tlFromAst(ast, notes);
    if (tl) {
      if (notes.length) S.add(termsTex(tl), 'Раскрываем скобки: ' + notes.join('; ') + '.', 1);
      var P = tlToPoly(tl);
      if (hasLikeTerms(tl)) S.add(pTex(P), 'Приводим подобные слагаемые.', 1, { textFull: 'Приводим подобные: ' + likeTermsNote(tl) + '.' });
      else if (!notes.length) S.add(pTex(P), 'Записываем многочлен в стандартном виде (по убыванию степеней).', 1);
      var extra = [];
      if (vars.length === 1) {
        var ft = factorUniTex(pToUni(P, vars[0]), vars[0]);
        if (ft && pList(P).length > 1) { S.add(pTex(P) + ' = ' + ft, 'Раскладываем на множители (ищем корни многочлена среди делителей).', 1); extra.push('в виде произведения: $' + ft + '$'); }
      }
      return { label: 'Упрощённый вид', items: [{ tex: pTex(P) }], extra: extra };
    }
    if (vars.length === 1) {
      var rf = rfFromAst(ast, vars[0]);
      if (rf) {
        var v = vars[0], dens = denominators(ast, v), excl = [];
        dens.forEach(function (d) { (quietRoots(d, Nn(0), v) || []).forEach(function (r) { if (!excl.some(function (e) { return sameVal(e.val, r.val); })) excl.push(r); }); });
        var tex = uDeg(rf.d) === 0 ? uTex(uScale(rf.n, qDiv(Q1, rf.d[0])), v) : '\\frac{' + uTex(rf.n, v) + '}{' + uTex(rf.d, v) + '}';
        S.add(tex, 'Приводим к общему знаменателю и сокращаем общие множители числителя и знаменателя.', 0);
        var ex2 = excl.length ? ['при $' + excl.map(function (r) { return v + ' \\ne ' + r.tex; }).join(',\\ ') + '$ (в этих точках исходное выражение не определено)'] : [];
        return { label: 'Упрощённый вид', items: [{ tex: tex }], extra: ex2 };
      }
    }
    var sm = simplifyMulti(ast, vars, S);
    if (sm) return sm;
    // тождественная константа? проверяем в случайных (независимых по переменным) точках
    var vals = [], okc = true;
    for (var i = 0; i < 6; i++) { var env = {}; vars.forEach(function (x, k) { env[x] = 0.37 + ((i + 1) * (k + 2) * 0.6180339887 + k * 0.414) % 2.7; }); vals.push(evalN(ast, env)); }
    if (vals.every(function (y) { return isFinite(y) && Math.abs(y - vals[0]) < 1e-9 * Math.max(1, Math.abs(y)); })) {
      var nt = numTex(vals[0]);
      S.add(T(ast) + ' = ' + nt.tex, 'Выражение при любых значениях переменных равно одному и тому же числу — оно тождественно постоянно (например, $\\sin^2 x + \\cos^2 x = 1$).', 0);
      return { label: 'Тождественно равно', items: [{ tex: nt.tex }], extra: [] };
    }
    var s = MF.simplify(clone(ast));
    S.add(T(s), 'Выражение не многочлен и не дробь из многочленов — делаем только базовые упрощения (убираем умножение на 1, сложение с 0 и т.п.).', 0);
    return { label: 'Упрощено', items: [{ tex: T(s) }], extra: [] };
  }

  /* ============================== 14. ВХОД =============================== */
  function parseSide(s, what) {
    if (!String(s).trim()) fail(what + ' пустая');
    try { return MF.parse(s, true); } catch (e) { fail((what ? what + ': ' : '') + e.message); }
  }
  function answerFromSol(s, v) {
    if (s.series) return { label: 'Ответ', items: s.series.map(function (t) { return { tex: t }; }), note: s.numeric ? 'найдено численно' : '' };
    if (s.all) return { label: 'Ответ', items: [{ tex: v + ' \\in \\mathbb{R}' + (s.allCond ? ',\\ ' + s.allCond : '') }], note: 'подходит любое допустимое значение' };
    var items = [];
    if (s.intervals) s.intervals.forEach(function (iv) { items.push({ tex: v + ' \\in ' + ivTex(iv) }); });
    s.roots.forEach(function (r) { items.push({ tex: v + ' = ' + r.tex, approx: r.exact && !/^-?\d+$/.test(r.tex) ? MF.fmtNum(r.val, 10) : null, approxExact: false }); });
    if (!items.length) return { label: 'Ответ', items: [{ tex: '\\text{решений нет}' }], note: s.noneWhy ? '' : '' };
    return { label: items.length > 1 ? 'Ответ (' + items.length + ' ' + plural(items.length, 'решение', 'решения', 'решений') + ')' : 'Ответ', items: items, note: s.numeric ? 'найдено численно' : '' };
  }
  function pickVar(vars) { return vars.indexOf('x') >= 0 ? 'x' : vars[0]; }
  function solveSingle(linear, cx) {
    var S = new Steps(), res = { steps: S.list };
    var rel = AL.splitRelation(linear);
    if (!rel) {
      var ast = parseSide(linear, '');
      var vars = freeVars(ast);
      if (!vars.length) { res.badge = 'Вычисление'; res.kind = 'calc'; res.answer = valAnswer(traceEval(ast, S)); return res; }
      res.badge = 'Упрощение выражения'; res.kind = 'simplify';
      S.add(T(ast), 'Исходное выражение.', 0);
      res.answer = simplifyExpr(ast, vars, S);
      return res;
    }
    if (/[=<>≤≥≠]/.test(rel.rhs.replace(/^[=]/, ''))) fail('в строке несколько знаков сравнения — для двойного неравенства или нескольких условий используйте систему «{ }»');
    var L = parseSide(rel.lhs, 'левая часть'), Rr = parseSide(rel.rhs, 'правая часть');
    var vs = freeVars(sub(L, Rr)), op = rel.op;
    S.add(T(L) + ' ' + relTex(op) + ' ' + T(Rr), op === '=' ? 'Исходное уравнение.' : 'Исходное неравенство.', 0);
    if (!vs.length) {
      res.badge = 'Проверка числового ' + (op === '=' ? 'равенства' : 'неравенства'); res.kind = 'calc';
      var g1 = S.group('Левая часть', 1), lv = traceEval(L, g1), g2 = S.group('Правая часть', 1), rv = traceEval(Rr, g2);
      var d = valExact(lv) && valExact(rv) && lv.s && rv.s ? AL.surdToNumber(AL.surdSub(lv.s, rv.s)) : lv.x - rv.x;
      var ok = op === '=' ? Math.abs(d) < 1e-12 * Math.max(1, Math.abs(lv.x)) : holdsOp(d, op);
      S.add(valTex(lv) + ' ' + relTex(op) + ' ' + valTex(rv), ok ? 'Утверждение верно.' : 'Утверждение неверно.', 0);
      res.answer = { label: 'Ответ', items: [{ tex: ok ? '\\text{Верно}' : '\\text{Неверно}' }] };
      return res;
    }
    if (op === '=' && vs.length === 1) {
      res.kind = 'eq'; res.badge = 'Уравнение';
      var s = solveEq(L, Rr, vs[0], S, cx);
      res.answer = answerFromSol(s, vs[0]);
      if (!s.numeric && !s.series && s.roots.length) res.check = s.roots.slice(0, 4).map(function (r) { return { v: vs[0], r: r, l: at(L, vs[0], r.val), rr: at(Rr, vs[0], r.val) }; });
      return res;
    }
    if (op !== '=' && vs.length === 1) {
      res.kind = 'ineq'; res.badge = 'Неравенство';
      var reg = solveIneq(L, Rr, op, vs[0], S, cx);
      res.answer = { label: 'Ответ', items: reg.periodic ? reg.periodic.map(function (t) { return { tex: t + ',\\ n \\in \\mathbb{Z}' }; }) : [{ tex: regionTex(reg, vs[0]) }] };
      return res;
    }
    if (op === '=') {
      // одно уравнение с несколькими переменными — выражаем одну через другие
      res.kind = 'eq'; res.badge = 'Уравнение с ' + vs.length + ' переменными';
      var P = pFromAst(sub(L, Rr)), w = null;
      var order = ['y', 'z'].concat(vs);
      if (P) for (var i = 0; i < order.length && !w; i++) { var x = order[i]; if (vs.indexOf(x) < 0) continue; var cs = pCoeffs(P, x); if (cs.length === 2) w = x; else if (cs.length === 3 && pIsZero(cs[1])) w = x; }
      if (!w) fail('одно уравнение с переменными $' + vs.join(', ') + '$ задаёт целое множество решений; выразить одну переменную через другие здесь не удаётся — добавьте ещё уравнения через «{ }»');
      var cs2 = pCoeffs(P, w), tex;
      S.add(null, 'Одно уравнение с несколькими переменными имеет бесконечно много решений. Выразим $' + w + '$ через ' + (vs.length === 2 ? '$' + vs.filter(function (z) { return z !== w; })[0] + '$' : 'остальные переменные') + '.', 0);
      if (cs2.length === 2) {
        var cst = cs2[1], num = pNeg(cs2[0]);
        tex = w + ' = ' + (pIsConst(cst) ? pTex(pScale(num, qDiv(Q1, pConstVal(cst)))) : '\\frac{' + pTex(num) + '}{' + pTex(cst) + '}');
        S.add(tex, 'Переносим слагаемые без $' + w + '$ вправо и делим на коэффициент при $' + w + '$' + (pIsConst(cst) ? '.' : ' (при условии $' + pTex(cst) + ' \\ne 0$).'), 0);
      } else {
        var rhs = pScale(pNeg(cs2[0]), pIsConst(cs2[2]) ? qDiv(Q1, pConstVal(cs2[2])) : Q1);
        tex = w + ' = \\pm\\sqrt{' + (pIsConst(cs2[2]) ? pTex(rhs) : '\\frac{' + pTex(pNeg(cs2[0])) + '}{' + pTex(cs2[2]) + '}') + '}';
        S.add(w + '^2 = ' + pTex(rhs), 'Выражаем $' + w + '^2$.', 1);
        S.add(tex, 'Извлекаем корень (при неотрицательном подкоренном выражении).', 0);
      }
      res.answer = { label: 'Выразили ' + w, items: [{ tex: tex }] };
      return res;
    }
    fail('неравенство с несколькими переменными задаёт область на плоскости — её удобнее посмотреть в «Построителе графиков»');
  }
  function solveSystem(rows, cx) {
    var S = new Steps(), res = { steps: S.list };
    if (!rows.length || rows.every(function (r) { return !r.trim(); })) fail('система пустая');
    var rels = rows.map(function (r, i) {
      var rel = AL.splitRelation(r);
      if (!rel) fail('строка ' + (i + 1) + ' системы — не уравнение и не неравенство (нет знака =, <, >)');
      return { op: rel.op, L: parseSide(rel.lhs, 'строка ' + (i + 1) + ', левая часть'), R: parseSide(rel.rhs, 'строка ' + (i + 1) + ', правая часть') };
    });
    S.add(casesTex(rels.map(function (r) { return T(r.L) + ' ' + relTex(r.op) + ' ' + T(r.R); })), 'Исходная система.', 0);
    var vars = []; rels.forEach(function (r) { freeVars(sub(r.L, r.R)).forEach(function (x) { if (vars.indexOf(x) < 0) vars.push(x); }); });
    vars.sort();
    var eqs = rels.filter(function (r) { return r.op === '='; }), ineqs = rels.filter(function (r) { return r.op !== '='; });
    if (!eqs.length) {
      if (vars.length !== 1) fail('система неравенств с несколькими переменными задаёт область на плоскости — её удобнее посмотреть в «Построителе графиков»');
      res.kind = 'ineq'; res.badge = 'Система неравенств';
      var v = vars[0], acc = null;
      ineqs.forEach(function (r, i) {
        var g = S.group('Неравенство ' + (i + 1) + ': $' + T(r.L) + ' ' + relTex(r.op) + ' ' + T(r.R) + '$', 1);
        var reg = solveIneq(r.L, r.R, r.op, v, g, cx);
        if (reg.periodic) fail('системы из периодических неравенств пока не поддерживаются');
        acc = acc === null ? reg : intersectRegions(acc, reg);
      });
      S.add(regionTex(acc, v), 'Пересекаем решения всех неравенств (подходят значения, удовлетворяющие каждому).', 0);
      res.answer = { label: 'Ответ', items: [{ tex: regionTex(acc, v) }] };
      return res;
    }
    res.kind = 'eq'; res.badge = ineqs.length ? 'Система уравнений с условиями' : 'Система уравнений';
    var sols;
    if (vars.length === 1) {
      var v1 = vars[0], cur = null;
      eqs.forEach(function (r, i) {
        var s = solveEq(r.L, r.R, v1, S.group('Уравнение ' + (i + 1), 1), cx);
        var rs = s.all ? null : s.roots;
        cur = cur === null ? rs : rs === null ? cur : cur.filter(function (a) { return rs.some(function (b) { return sameVal(a.val, b.val); }); });
      });
      if (cur === null) fail('все уравнения системы — тождества; добавьте условие, которое задаёт переменную');
      sols = cur.map(function (r) { var o = {}; o[v1] = r; return o; });
      if (eqs.length > 1) S.add(null, 'Оставляем только общие корни всех уравнений.', 1);
    } else {
      var polys = eqs.map(function (r) { return pFromAst(sub(r.L, r.R)); });
      if (polys.every(function (p) { return p && pTotalDeg(p) <= 1; })) {
        res.badge = (ineqs.length ? 'Система с условиями' : 'Система линейных уравнений');
        var lr = linearSystem(polys, vars, S, cx);
        if (lr.kind === 'none') { res.answer = { label: 'Ответ', items: [{ tex: '\\text{решений нет}' }], note: 'система несовместна' }; return res; }
        if (lr.kind === 'infinite') {
          res.answer = { label: 'Общее решение', items: [{ tex: '\\left(' + vars.map(function (x) { return pTex(lr.vals[x].p); }).join(';\\ ') + '\\right),\\ ' + lr.free.map(function (_, i) { return lr.free.length === 1 ? 't' : 't_' + (i + 1); }).join(', ') + ' \\in \\mathbb{R}' }], note: 'бесконечно много решений' };
          return res;
        }
        var o3 = {}; vars.forEach(function (x) { o3[x] = rootQ(pConstVal(lr.vals[x].p)); }); sols = [o3];
      } else {
        res.badge = 'Нелинейная система';
        sols = nonlinearSystem(eqs.map(function (r) { return sub(r.L, r.R); }), vars, S, cx);
        if (!sols) {
          if (eqs.length !== 2 || vars.length !== 2) fail('нелинейную систему не удалось свести к одному уравнению подстановкой, а численный поиск реализован только для 2 уравнений с 2 переменными');
          S.add(null, 'Ни одно уравнение не удаётся выразить через одну переменную в явном виде, и вычитание не убирает нелинейные слагаемые. Поэтому ищем точки пересечения двух кривых численно (сетка + метод Ньютона).', 0);
          var e1 = sub(eqs[0].L, eqs[0].R), e2 = sub(eqs[1].L, eqs[1].R), a = vars[0], b = vars[1];
          var F1 = function (x, y) { var o = {}; o[a] = x; o[b] = y; return evalN(e1, o); }, F2 = function (x, y) { var o = {}; o[a] = x; o[b] = y; return evalN(e2, o); };
          sols = (global.MFSolverNumeric2D ? global.MFSolverNumeric2D(F1, F2) : []).map(function (p) { var o = {}; o[a] = rootNum(p.x); o[b] = rootNum(p.y); return o; });
          res.numeric = true;
        }
      }
    }
    // проверка/фильтр по всем строкам
    var good = sols.filter(function (s) {
      var env = {}; for (var k in s) env[k] = s[k].val;
      var okEq = eqs.every(function (r) { var d = evalN(sub(r.L, r.R), env); return isFinite(d) && Math.abs(d) < 1e-6; });
      var okIn = ineqs.every(function (r) { return holdsOp(evalN(sub(r.L, r.R), env), r.op); });
      if (okEq && !okIn) S.add(null, 'Решение $' + vars.map(function (x) { return x + ' = ' + s[x].tex; }).join(',\\ ') + '$ не удовлетворяет условию-неравенству — отбрасываем.', 0);
      return okEq && okIn;
    });
    res.answer = { label: good.length > 1 ? 'Ответ (' + good.length + ' ' + plural(good.length, 'решение', 'решения', 'решений') + ')' : 'Ответ',
      items: good.length ? good.map(function (s) { return { tex: vars.length === 1 ? vars[0] + ' = ' + s[vars[0]].tex : '\\left(' + vars.map(function (x) { return s[x].tex; }).join(';\\ ') + '\\right)' }; }) : [{ tex: '\\text{решений нет}' }],
      note: (vars.length > 1 && good.length ? 'пары записаны в порядке $(' + vars.join(';\\ ') + ')$' : '') + (res.numeric ? (vars.length > 1 && good.length ? '; ' : '') + 'найдено численно' : '') };
    return res;
  }
  function intersectRegions(A, B) {
    var out = [];
    A.forEach(function (a) {
      B.forEach(function (b) {
        var lo = a.lo, loInc = a.loInc;
        if (b.lo && (!lo || b.lo.val > lo.val + 1e-12 || (sameVal(b.lo.val, lo.val) && !b.loInc))) { lo = b.lo; loInc = b.loInc; }
        var hi = a.hi, hiInc = a.hiInc;
        if (b.hi && (!hi || b.hi.val < hi.val - 1e-12 || (sameVal(b.hi.val, hi.val) && !b.hiInc))) { hi = b.hi; hiInc = b.hiInc; }
        if (!lo || !hi || lo.val < hi.val - 1e-12 || (sameVal(lo.val, hi.val) && loInc && hiInc)) out.push({ lo: lo, hi: hi, loInc: loInc, hiInc: hiInc });
      });
    });
    return out;
  }

  // Публичный вход. input: { linear } или { rows }; opts: { pref:{quad,sys}, dec }.
  function solve(input, opts) {
    opts = opts || {};
    OPTS.dec = !!opts.dec; LAST.tex = null; LAST.step = null; LAST.tex = null; LAST.step = null;
    var cx = { pref: opts.pref || {} };
    try {
      var norm = MF.normalizeLinear || function (x) { return x; };
      var res = input.rows ? solveSystem(input.rows.map(function (r) { return typeof r === 'string' ? norm(r) : r; }), cx) : solveSingle(norm(input.linear), cx);
      res.methods = cx.methods || null;
      return res;
    } catch (e) {
      if (e && e.solver) return { error: e.message, steps: [] };
      return { error: 'внутренняя ошибка решателя: ' + (e && e.message), steps: [], internal: true };
    }
  }

  global.MFSolver = { solve: solve, _t: { T: T, numTex: numTex, column: column, Q: Q } };
})(typeof window !== 'undefined' ? window : this);
