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
    if (Math.abs(x - r) < 1e-10 * Math.max(1, Math.abs(x))) return Q(r, 1);
    var fr = MF.toFraction(x, maxDen || 10000, 1e-11 * Math.max(1, Math.abs(x)));
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
    var e = AL.exactAnswerTex(x);
    if (e && e.approx) return { tex: e.exact, exact: true };
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
    return 0;
  }
  function T(n, pp) {
    pp = pp || 0;
    var p = PREC[n.t] !== undefined ? PREC[n.t] : 9, s;
    switch (n.t) {
      case 'num': s = leafTex(n); return (s.charAt(0) === '-' && pp >= 2) ? '\\left(' + s + '\\right)' : s;
      case 'var': return n.name.length > 1 && n.name !== 'π' ? '\\mathrm{' + n.name + '}' : n.name;
      case '+': s = T(n.a, p) + ' + ' + wrapNeg(T(n.b, p)); break;
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
      var nm = k.length > 1 && k !== 'π' ? '\\mathrm{' + k + '}' : k;
      return m[k] === 1 ? nm : nm + '^{' + m[k] + '}';
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
  function rootQ(q) { return Rt(qv(q), qTex(q), !isF(q)); }
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
  Steps.prototype.add = function (tex, text, lvl, extra) {
    var s = { tex: tex || null, text: text || '', lvl: lvl === undefined ? 1 : lvl };
    if (extra) for (var k in extra) s[k] = extra[k];
    this.list.push(s);
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
    if (q2 && !isF(q2) && q2.n > 0) {
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
        } else if (k && qIsInt(k) && Math.abs(k.n) <= 64 && A.s) {
          var r = AL.surdRat({ n: 1, d: 1 });
          for (var i = 0; i < Math.abs(k.n); i++) { r = AL.surdMul(r, A.s); if (!r || Math.abs(AL.surdToNumber(r)) > 1e15) { r = null; break; } }
          if (r && k.n < 0) r = AL.surdDiv(AL.surdRat({ n: 1, d: 1 }), r);
          if (r) res = { s: r, x: AL.surdToNumber(r), dec: A.dec };
          text = 'Возведение в степень: $' + opTex(res || { s: null, x: Math.pow(A.x, B.x) }) + '$';
          if (res && k.n === 0) full = text + ' — любое ненулевое число в нулевой степени равно $1$';
          else if (res && k.n < 0) full = text + ' — отрицательная степень: $a^{-n} = \\frac{1}{a^{n}}$';
          else if (res && k.n >= 2 && k.n <= 5 && valRat(A) && !res.big) {
            var f = []; for (var j = 0; j < k.n; j++) f.push(wrapNeg(valTex(A)));
            full = 'Возведение в степень: $' + T(n) + ' = ' + f.join(' \\cdot ') + ' = ' + valTex(res) + '$';
            if (qSign(valRat(A)) < 0) full += ' — отрицательное число в ' + (k.n % 2 ? 'нечётной степени остаётся отрицательным' : 'чётной степени становится положительным');
          }
        } else if (k && !isF(k) && k.d > 1 && valRat(A)) {
          var base = valRat(A);
          if (qSign(base) < 0 && k.d % 2 === 0) fail('корень чётной степени из отрицательного числа не существует среди действительных чисел: $' + T(n) + '$ (для комплексных ответов добавьте в пример $i$)');
          var mag = Math.pow(Math.abs(qv(base)), qv(k));
          var val = qSign(base) < 0 ? (Math.abs(k.n) % 2 ? -mag : mag) : mag;
          var exact = recoverVal(val);
          if (exact && valRat(exact)) {
            var chk = qPow(valRat(exact), k.d), want = qPow(base, k.n);
            if (!chk || !want || !qEq(chk, want)) exact = null;
          }
          res = exact || { s: null, x: val };
          text = 'Степень с дробным показателем: $a^{\\frac{p}{q}} = \\sqrt[q]{a^{p}}$, $' + opTex(res) + '$';
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
      S.add(T(cur), r.text, 1, { textFull: r.full || undefined, cols: r.cols ? [r.cols] : undefined });
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
      S.add(formula + ' = \\frac{' + qTex(P) + ' \\pm \\sqrt{' + qTex(D) + '}}{' + qTex(Den) + '} = ' + rf.pm, 'Подставляем в формулу корней и сокращаем.', 0, { briefTex: v + '_{1,2} = ' + rf.pm });
      return sol([Rt(rf.vPlus, rf.plus), Rt(rf.vMinus, rf.minus)]);
    }
    var sd = Math.sqrt(qv(D)), y1 = (qv(P) + sd) / qv(Den), y2 = (qv(P) - sd) / qv(Den);
    S.add(formula + ' \\approx ' + fTex(y1, 8) + ',\\ ' + fTex(y2, 8), 'Коэффициенты нецелые — считаем корни приближённо.', 0);
    return sol([rootNum(y1), rootNum(y2)]);
  }
  function quadIncomplete(a, b, cc, v, S) {
    if (qZero(cc)) {
      var bx = termsTex([{ c: a, m: mv(v) }, { c: b, m: {} }]);
      if (qZero(b)) { S.add(v + '^2 = 0', 'Делим на $' + qTex(a) + '$: квадрат равен нулю только у нуля.', 0); var z = rootQ(Q0); z.mult = 2; return sol([z]); }
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

  /*__PART3B__*/
})(typeof window !== 'undefined' ? window : this);
