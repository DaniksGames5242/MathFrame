/* ============================================================================
   MathField — полноценный двумерный ввод формул
   ----------------------------------------------------------------------------
   Не «строка с подсветкой», а настоящее структурное поле: дробь имеет отдельные
   числитель и знаменатель, корень — отдельное поле показателя и подкоренного,
   степень — своё поле. Курсор ходит МЕЖДУ полями (стрелками, Tab и просто
   пальцем по нужному месту), поэтому на телефоне ввод такой же полный, как на
   ПК.

   Модель данных — дерево:
     {t:'row',   k:[...]}                  последовательность
     {t:'ch',    v:'x', c:'var'|'num'|'op'|'fn'}
     {t:'frac',  num:row, den:row}
     {t:'sqrt',  rad:row, idx:row|null}    idx — показатель корня (n-я степень)
     {t:'sup',   exp:row}                  степень предыдущего атома
     {t:'sub',   sub:row}                  индекс
     {t:'paren', body:row, l:'(', r:')'}
     {t:'abs',   body:row}

   Степень и индекс — ОТДЕЛЬНЫЕ узлы в строке (как в MathQuill), а не поля
   предыдущего узла: так модель курсора остаётся простой и однородной.

   Курсор — пара {row, i}, где i — позиция МЕЖДУ детьми (0..k.length).
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- фабрики */
  function row(children) { return { t: 'row', k: children || [] }; }
  function ch(v, c) { return { t: 'ch', v: v, c: c || classOf(v) }; }
  function classOf(v) {
    if (/[0-9.]/.test(v)) return 'num';
    if (/[+\-*/=<>±·×÷]/.test(v)) return 'op';
    return 'var';
  }
  var FIELDS = {
    row: ['k'],
    frac: ['num', 'den'],
    sqrt: ['idx', 'rad'],
    sup: ['exp'],
    sub: ['sub'],
    paren: ['body'],
    abs: ['body'],
    norm: ['body'],
    accent: ['body'],          // черта / вектор / шляпка сверху
    bigop: ['lo', 'hi', 'body', 'dv'],  // ∫ ∑ ∏ — пределы, тело, d-переменная
    lim:  ['to', 'body']       // lim_{x→a} body
  };
  // поля, которые реально существуют у конкретного узла (idx может быть null)
  function fieldsOf(n) {
    var f = FIELDS[n.t] || [];
    return f.filter(function (name) { return n[name]; });
  }

  /* ------------------------------------------------- связывание родителей */
  function link(node, parent, field) {
    node.p = parent || null;
    node.pf = field || null;
    if (node.t === 'row') {
      node.k.forEach(function (c) { link(c, node, 'k'); });
    } else {
      fieldsOf(node).forEach(function (name) { link(node[name], node, name); });
    }
    return node;
  }

  /* ================================================================ MathField */
  function MathField(host, opts) {
    opts = opts || {};
    this.host = host;
    this.root = link(row([]));
    this.cur = { row: this.root, i: 0 };
    this.onChange = opts.onChange || function () {};
    this.readOnly = !!opts.readOnly;

    host.classList.add('mfld');
    host.setAttribute('role', 'textbox');
    host.setAttribute('aria-label', opts.label || 'Поле ввода формулы');
    if (!this.readOnly) host.tabIndex = 0;

    this._bind();
    this.render();
  }

  MathField.prototype._bind = function () {
    var self = this;
    if (this.readOnly) return;

    this.host.addEventListener('keydown', function (e) { self._key(e); });

    // Тап/клик — ставим курсор в ближайший «зазор» между атомами.
    this.host.addEventListener('pointerdown', function (e) {
      self.host.focus();
      var hit = self._hitTest(e.clientX, e.clientY);
      if (hit) { self.cur = hit; self.render(); }
      e.preventDefault();
    });

    this.host.addEventListener('focus', function () { self.host.classList.add('mfld-focus'); self.render(); });
    this.host.addEventListener('blur', function () { self.host.classList.remove('mfld-focus'); self.render(); });
  };

  /* ------------------------------------------------------------ навигация */
  // Все строки документа в порядке обхода — нужно для Tab и «умных» стрелок.
  function collectRows(node, out) {
    out = out || [];
    if (node.t === 'row') {
      out.push(node);
      node.k.forEach(function (c) { collectRows(c, out); });
    } else {
      fieldsOf(node).forEach(function (f) { collectRows(node[f], out); });
    }
    return out;
  }

  MathField.prototype.left = function () {
    var c = this.cur;
    if (c.i > 0) {
      var prev = c.row.k[c.i - 1];
      var f = fieldsOf(prev);
      if (f.length) {                       // входим в последнее поле узла
        var target = prev[f[f.length - 1]];
        this.cur = { row: target, i: target.k.length };
        return;
      }
      c.i--;
      return;
    }
    // выходим из поля наружу
    var host = c.row.p;
    if (!host) return;
    var owner = host;                        // узел, которому принадлежит строка
    var parentRow = owner.p;
    if (!parentRow) return;
    var fs = fieldsOf(owner);
    var idx = fs.indexOf(c.row.pf);
    if (idx > 0) {                           // есть поле левее внутри того же узла
      var t = owner[fs[idx - 1]];
      this.cur = { row: t, i: t.k.length };
      return;
    }
    var pos = parentRow.k.indexOf(owner);
    this.cur = { row: parentRow, i: Math.max(0, pos) };
  };

  MathField.prototype.right = function () {
    var c = this.cur;
    if (c.i < c.row.k.length) {
      var next = c.row.k[c.i];
      var f = fieldsOf(next);
      if (f.length) {
        var target = next[f[0]];
        this.cur = { row: target, i: 0 };
        return;
      }
      c.i++;
      return;
    }
    var owner = c.row.p;
    if (!owner) return;
    var parentRow = owner.p;
    if (!parentRow) return;
    var fs = fieldsOf(owner);
    var idx = fs.indexOf(c.row.pf);
    if (idx >= 0 && idx < fs.length - 1) {
      var t = owner[fs[idx + 1]];
      this.cur = { row: t, i: 0 };
      return;
    }
    var pos = parentRow.k.indexOf(owner);
    this.cur = { row: parentRow, i: pos + 1 };
  };

  // Вверх/вниз: осмысленно внутри дроби (числитель ↔ знаменатель), корня
  // (показатель ↔ подкоренное) и для выхода из степени.
  MathField.prototype.vert = function (dir) {
    var r = this.cur.row, owner = r.p;
    while (owner) {
      if (owner.t === 'frac') {
        if (dir < 0 && r.pf === 'den') { this.cur = { row: owner.num, i: owner.num.k.length }; return true; }
        if (dir > 0 && r.pf === 'num') { this.cur = { row: owner.den, i: 0 }; return true; }
      }
      if (owner.t === 'sqrt' && owner.idx) {
        if (dir < 0 && r.pf === 'rad') { this.cur = { row: owner.idx, i: owner.idx.k.length }; return true; }
        if (dir > 0 && r.pf === 'idx') { this.cur = { row: owner.rad, i: 0 }; return true; }
      }
      if (owner.t === 'sup' && dir > 0) {   // из степени вниз — на базовую строку
        var pr = owner.p;
        if (pr) { this.cur = { row: pr, i: pr.k.indexOf(owner) + 1 }; return true; }
      }
      if (owner.t === 'sub' && dir < 0) {
        var pr2 = owner.p;
        if (pr2) { this.cur = { row: pr2, i: pr2.k.indexOf(owner) + 1 }; return true; }
      }
      r = owner.p ? owner.p : null;
      owner = r ? r.p : null;
    }
    return false;
  };

  // Tab — следующее ПУСТОЕ поле (быстрое заполнение шаблонов вроде дроби).
  MathField.prototype.tabField = function (back) {
    var rows = collectRows(this.root);
    var cur = rows.indexOf(this.cur.row);
    var n = rows.length;
    for (var s = 1; s <= n; s++) {
      var j = ((cur + (back ? -s : s)) % n + n) % n;
      if (rows[j] !== this.root && rows[j].k.length === 0) {
        this.cur = { row: rows[j], i: 0 };
        return true;
      }
    }
    // пустых нет — просто идём в следующую строку
    if (n > 1) {
      var k = ((cur + (back ? -1 : 1)) % n + n) % n;
      this.cur = { row: rows[k], i: rows[k].k.length };
      return true;
    }
    return false;
  };

  /* -------------------------------------------------------------- вставка */
  MathField.prototype.insert = function (node) {
    var c = this.cur;
    link(node, c.row, 'k');
    c.row.k.splice(c.i, 0, node);
    c.i++;
    // курсор — в первое поле нового узла, если оно есть
    var f = fieldsOf(node);
    if (f.length) {
      var t = node[f[0]];
      this.cur = { row: t, i: 0 };
    }
    this._changed();
  };

  MathField.prototype.insertChars = function (str) {
    var self = this;
    String(str).split('').forEach(function (v) {
      var c = self.cur;
      var node = link(ch(v), c.row, 'k');
      c.row.k.splice(c.i, 0, node);
      c.i++;
    });
    this._changed();
  };

  MathField.prototype.backspace = function () {
    var c = this.cur;
    if (c.i > 0) {
      var prev = c.row.k[c.i - 1];
      var f = fieldsOf(prev);
      if (f.length) {
        // Первое нажатие — заходим внутрь; удаляем узел, только если он пуст.
        var empty = f.every(function (name) { return prev[name].k.length === 0; });
        if (empty) { c.row.k.splice(c.i - 1, 1); c.i--; }
        else { var t = prev[f[f.length - 1]]; this.cur = { row: t, i: t.k.length }; }
      } else {
        c.row.k.splice(c.i - 1, 1); c.i--;
      }
      this._changed();
      return;
    }
    // курсор в начале поля — «разворачиваем» пустой контейнер наружу
    var owner = c.row.p;
    if (!owner || !owner.p) return;
    var parentRow = owner.p;
    var allEmpty = fieldsOf(owner).every(function (n) { return owner[n].k.length === 0; });
    var pos = parentRow.k.indexOf(owner);
    if (allEmpty) {
      parentRow.k.splice(pos, 1);
      this.cur = { row: parentRow, i: pos };
    } else {
      this.cur = { row: parentRow, i: pos };
    }
    this._changed();
  };

  MathField.prototype.clear = function () {
    this.root = link(row([]));
    this.cur = { row: this.root, i: 0 };
    this._changed();
  };

  MathField.prototype._changed = function () {
    this.render();
    try { this.onChange(this); } catch (e) {}
  };

  /* ------------------------------------------------------- готовые шаблоны
     Ключевой момент для «полноценного ввода»: команда знает, надо ли ЗАХВАТИТЬ
     то, что уже слева от курсора. Например, дробь после «2x» делает 2x
     числителем — как в настоящих редакторах формул. */
  function takeLeftOperand(r, i) {
    // забираем последний «операнд»: число/переменную с индексами и степенями,
    // либо скобочную группу
    if (i === 0) return null;
    var end = i, start = i;
    var n = r.k[start - 1];
    // степени/индексы прилипают к базе
    while (start > 0 && (r.k[start - 1].t === 'sup' || r.k[start - 1].t === 'sub')) start--;
    if (start === 0) return null;
    n = r.k[start - 1];
    if (n.t === 'paren' || n.t === 'abs' || n.t === 'frac' || n.t === 'sqrt') { start--; }
    else if (n.t === 'ch' && /[0-9.]/.test(n.v)) {
      while (start > 0 && r.k[start - 1].t === 'ch' && /[0-9.]/.test(r.k[start - 1].v)) start--;
    } else if (n.t === 'ch' && n.c !== 'op') { start--; }
    else return null;
    var taken = r.k.splice(start, end - start);
    return taken;
  }

  MathField.prototype.cmd = function (name) {
    var c = this.cur, node;
    switch (name) {
      case 'frac': {
        var left = takeLeftOperand(c.row, c.i);
        if (left) c.i -= left.length;
        node = { t: 'frac', num: row(left || []), den: row([]) };
        link(node, c.row, 'k');
        c.row.k.splice(c.i, 0, node); c.i++;
        var target = left ? node.den : node.num;
        this.cur = { row: target, i: 0 };
        this._changed();
        return;
      }
      case 'sqrt':  node = { t: 'sqrt', rad: row([]), idx: null }; break;
      case 'nroot': node = { t: 'sqrt', rad: row([]), idx: row([]) }; break;
      case 'sup':   node = { t: 'sup', exp: row([]) }; break;
      case 'sub':   node = { t: 'sub', sub: row([]) }; break;
      case 'paren': node = { t: 'paren', body: row([]), l: '(', r: ')' }; break;
      case 'abs':   node = { t: 'abs', body: row([]) }; break;
      case 'norm':  node = { t: 'norm', body: row([]) }; break;
      case 'bar':   node = { t: 'accent', kind: 'bar', body: row([]) }; break;
      case 'vec':   node = { t: 'accent', kind: 'vec', body: row([]) }; break;
      case 'hat':   node = { t: 'accent', kind: 'hat', body: row([]) }; break;
      case 'int':   node = { t: 'bigop', op: 'int',  lo: row([]), hi: row([]), body: row([]), dv: row([ch('x')]) }; break;
      case 'sum':   node = { t: 'bigop', op: 'sum',  lo: row([]), hi: row([]), body: row([]), dv: null }; break;
      case 'prod':  node = { t: 'bigop', op: 'prod', lo: row([]), hi: row([]), body: row([]), dv: null }; break;
      case 'lim':   node = { t: 'lim', to: row([]), body: row([]) }; break;
      default: return;
    }
    this.insert(node);
  };

  // Функция вида sin( … ): имя обычными буквами + скобка с курсором внутри
  MathField.prototype.insertFunc = function (fname) {
    var self = this;
    fname.split('').forEach(function (letter) {
      var c = self.cur;
      var n = link(ch(letter, 'fn'), c.row, 'k');
      c.row.k.splice(c.i, 0, n); c.i++;
    });
    this.insert({ t: 'paren', body: row([]), l: '(', r: ')' });
  };

  /* ---------------------------------------------------------- клавиатура */
  MathField.prototype._key = function (e) {
    var k = e.key;
    if (e.ctrlKey || e.metaKey) return;

    if (k === 'ArrowLeft')  { this.left();  this.render(); e.preventDefault(); return; }
    if (k === 'ArrowRight') { this.right(); this.render(); e.preventDefault(); return; }
    if (k === 'ArrowUp')    { if (this.vert(-1)) this.render(); e.preventDefault(); return; }
    if (k === 'ArrowDown')  { if (this.vert(1))  this.render(); e.preventDefault(); return; }
    if (k === 'Tab')        { this.tabField(e.shiftKey); this.render(); e.preventDefault(); return; }
    if (k === 'Backspace')  { this.backspace(); e.preventDefault(); return; }
    if (k === 'Home')       { this.cur.i = 0; this.render(); e.preventDefault(); return; }
    if (k === 'End')        { this.cur.i = this.cur.row.k.length; this.render(); e.preventDefault(); return; }
    if (k === 'Enter')      { e.preventDefault(); try { this.onChange(this, true); } catch (err) {} return; }

    // Быстрые команды прямо с клавиатуры — как в TeX
    if (k === '/') { this.cmd('frac');  e.preventDefault(); return; }
    if (k === '^') { this.cmd('sup');   e.preventDefault(); return; }
    if (k === '_') { this.cmd('sub');   e.preventDefault(); return; }
    if (k === '(') { this.cmd('paren'); e.preventDefault(); return; }
    if (k === ')') {                       // выходим из скобки
      var owner = this.cur.row.p;
      if (owner && owner.t === 'paren') {
        var pr = owner.p;
        this.cur = { row: pr, i: pr.k.indexOf(owner) + 1 };
        this.render(); e.preventDefault();
      }
      return;
    }
    if (k.length === 1 && /[0-9a-zA-Zа-яА-Я.,+\-*=<>!πθ]/.test(k)) {
      this.insertChars(k === ',' ? '.' : k);
      e.preventDefault();
    }
  };

  /* ------------------------------------------------------------- отрисовка */
  MathField.prototype.render = function () {
    var frag = document.createDocumentFragment();
    this._gaps = [];   // для попадания пальцем: {el, row, i}
    frag.appendChild(this._renderRow(this.root, true));
    this.host.innerHTML = '';
    this.host.appendChild(frag);
  };

  MathField.prototype._renderRow = function (r, isRoot) {
    var self = this;
    var box = document.createElement('span');
    box.className = 'mfld-row' + (isRoot ? ' mfld-root' : '');
    if (!r.k.length && !isRoot) box.classList.add('mfld-empty');

    function gap(i) {
      var g = document.createElement('span');
      g.className = 'mfld-gap';
      if (self.cur.row === r && self.cur.i === i &&
          document.activeElement === self.host) {
        g.classList.add('mfld-cursor');
      }
      self._gaps.push({ el: g, row: r, i: i });
      return g;
    }

    box.appendChild(gap(0));
    r.k.forEach(function (node, i) {
      box.appendChild(self._renderNode(node));
      box.appendChild(gap(i + 1));
    });
    // пустое поле показывает «дырку», чтобы было видно, куда вводить
    if (!r.k.length && !isRoot) {
      var ph = document.createElement('span');
      ph.className = 'mfld-ph';
      box.insertBefore(ph, box.firstChild.nextSibling);
    }
    return box;
  };

  MathField.prototype._renderNode = function (n) {
    var self = this, e;
    switch (n.t) {
      case 'ch': {
        e = document.createElement('span');
        e.className = 'mfld-ch mfld-' + n.c;
        e.textContent = n.v === '*' ? '·' : (n.v === '-' ? '−' : n.v);
        return e;
      }
      case 'frac': {
        e = document.createElement('span');
        e.className = 'mfld-frac';
        var nu = document.createElement('span'); nu.className = 'mfld-frac-n';
        nu.appendChild(this._renderRow(n.num));
        var bar = document.createElement('span'); bar.className = 'mfld-frac-bar';
        var de = document.createElement('span'); de.className = 'mfld-frac-d';
        de.appendChild(this._renderRow(n.den));
        e.appendChild(nu); e.appendChild(bar); e.appendChild(de);
        return e;
      }
      case 'sqrt': {
        e = document.createElement('span');
        e.className = 'mfld-sqrt';
        if (n.idx) {
          var ix = document.createElement('span'); ix.className = 'mfld-sqrt-idx';
          ix.appendChild(this._renderRow(n.idx));
          e.appendChild(ix);
        }
        var sign = document.createElement('span');
        sign.className = 'mfld-sqrt-sign';
        sign.innerHTML = '<svg viewBox="0 0 12 24" preserveAspectRatio="none" aria-hidden="true">' +
          '<path d="M0.5 14 L3 14 L6 23 L11.5 1" fill="none" stroke="currentColor" ' +
          'stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        var rad = document.createElement('span'); rad.className = 'mfld-sqrt-rad';
        rad.appendChild(this._renderRow(n.rad));
        e.appendChild(sign); e.appendChild(rad);
        return e;
      }
      case 'sup': {
        e = document.createElement('span'); e.className = 'mfld-sup';
        e.appendChild(this._renderRow(n.exp));
        return e;
      }
      case 'sub': {
        e = document.createElement('span'); e.className = 'mfld-sub';
        e.appendChild(this._renderRow(n.sub));
        return e;
      }
      case 'norm': {
        e = document.createElement('span'); e.className = 'mfld-abs mfld-norm';
        var NL = document.createElement('span'); NL.className = 'mfld-delim'; NL.textContent = '\u2016';
        var NB = document.createElement('span'); NB.className = 'mfld-delim-body';
        NB.appendChild(this._renderRow(n.body));
        var NR = document.createElement('span'); NR.className = 'mfld-delim'; NR.textContent = '\u2016';
        e.appendChild(NL); e.appendChild(NB); e.appendChild(NR);
        return e;
      }
      case 'accent': {
        e = document.createElement('span');
        e.className = 'mfld-accent mfld-accent-' + n.kind;
        var mark = document.createElement('span');
        mark.className = 'mfld-accent-mark';
        mark.textContent = n.kind === 'vec' ? '\u2192' : (n.kind === 'hat' ? '\u02C6' : '');
        var ab = document.createElement('span'); ab.className = 'mfld-accent-body';
        ab.appendChild(this._renderRow(n.body));
        e.appendChild(mark); e.appendChild(ab);
        return e;
      }
      case 'bigop': {
        e = document.createElement('span'); e.className = 'mfld-bigop';
        var stack = document.createElement('span'); stack.className = 'mfld-bigop-stack';
        var hi = document.createElement('span'); hi.className = 'mfld-bigop-lim';
        hi.appendChild(this._renderRow(n.hi));
        var sg = document.createElement('span'); sg.className = 'mfld-bigop-sign';
        sg.textContent = n.op === 'int' ? '\u222B' : (n.op === 'sum' ? '\u2211' : '\u220F');
        var lo = document.createElement('span'); lo.className = 'mfld-bigop-lim';
        lo.appendChild(this._renderRow(n.lo));
        stack.appendChild(hi); stack.appendChild(sg); stack.appendChild(lo);
        var bd = document.createElement('span'); bd.className = 'mfld-bigop-body';
        bd.appendChild(this._renderRow(n.body));
        e.appendChild(stack); e.appendChild(bd);
        if (n.dv) {
          var dd = document.createElement('span'); dd.className = 'mfld-ch mfld-fn'; dd.textContent = 'd';
          var dv = document.createElement('span'); dv.className = 'mfld-bigop-dv';
          dv.appendChild(this._renderRow(n.dv));
          e.appendChild(dd); e.appendChild(dv);
        }
        return e;
      }
      case 'lim': {
        e = document.createElement('span'); e.className = 'mfld-lim';
        var ls = document.createElement('span'); ls.className = 'mfld-lim-stack';
        var lw = document.createElement('span'); lw.className = 'mfld-lim-word'; lw.textContent = 'lim';
        var lt = document.createElement('span'); lt.className = 'mfld-lim-to';
        lt.appendChild(this._renderRow(n.to));
        ls.appendChild(lw); ls.appendChild(lt);
        var lb = document.createElement('span'); lb.className = 'mfld-lim-body';
        lb.appendChild(this._renderRow(n.body));
        e.appendChild(ls); e.appendChild(lb);
        return e;
      }
      case 'paren':
      case 'abs': {
        var isAbs = n.t === 'abs';
        e = document.createElement('span');
        e.className = isAbs ? 'mfld-abs' : 'mfld-paren';
        var L = document.createElement('span'); L.className = 'mfld-delim';
        L.textContent = isAbs ? '|' : (n.l || '(');
        var B = document.createElement('span'); B.className = 'mfld-delim-body';
        B.appendChild(this._renderRow(n.body));
        var R = document.createElement('span'); R.className = 'mfld-delim';
        R.textContent = isAbs ? '|' : (n.r || ')');
        e.appendChild(L); e.appendChild(B); e.appendChild(R);
        return e;
      }
    }
    e = document.createElement('span');
    return e;
  };

  /* ------------------------------------------------ попадание пальцем/мышью
     Берём ближайший «зазор» по евклидовой метрике, но с сильным приоритетом
     вертикали — иначе в дроби палец постоянно попадал бы не в ту строку. */
  MathField.prototype._hitTest = function (x, y) {
    var best = null, bestD = Infinity;
    (this._gaps || []).forEach(function (g) {
      var r = g.el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = x - cx, dy = y - cy;
      var d = dx * dx + dy * dy * 9;
      if (d < bestD) { bestD = d; best = g; }
    });
    return best ? { row: best.row, i: best.i } : null;
  };

  /* -------------------------------------------------------------- экспорт */
  function rowToLatex(r) { return r.k.map(nodeToLatex).join(''); }
  function nodeToLatex(n) {
    switch (n.t) {
      case 'ch': return n.v === '*' ? '\\cdot ' : n.v;
      case 'frac': return '\\frac{' + rowToLatex(n.num) + '}{' + rowToLatex(n.den) + '}';
      case 'sqrt': return n.idx ? '\\sqrt[' + rowToLatex(n.idx) + ']{' + rowToLatex(n.rad) + '}'
                                : '\\sqrt{' + rowToLatex(n.rad) + '}';
      case 'sup': return '^{' + rowToLatex(n.exp) + '}';
      case 'sub': return '_{' + rowToLatex(n.sub) + '}';
      case 'paren': return '\\left(' + rowToLatex(n.body) + '\\right)';
      case 'abs': return '\\left|' + rowToLatex(n.body) + '\\right|';
      case 'norm': return '\\left\\|' + rowToLatex(n.body) + '\\right\\|';
      case 'accent': {
        var cmdName = n.kind === 'vec' ? '\\vec' : (n.kind === 'hat' ? '\\hat' : '\\overline');
        return cmdName + '{' + rowToLatex(n.body) + '}';
      }
      case 'bigop': {
        var sign = n.op === 'int' ? '\\int' : (n.op === 'sum' ? '\\sum' : '\\prod');
        var out = sign;
        if (n.lo && n.lo.k.length) out += '_{' + rowToLatex(n.lo) + '}';
        if (n.hi && n.hi.k.length) out += '^{' + rowToLatex(n.hi) + '}';
        out += ' ' + rowToLatex(n.body);
        if (n.dv) out += '\\,d' + rowToLatex(n.dv);
        return out;
      }
      case 'lim':
        return '\\lim_{' + rowToLatex(n.to) + '} ' + rowToLatex(n.body);
    }
    return '';
  }
  MathField.prototype.latex = function () { return rowToLatex(this.root); };

  MathField.prototype.isEmpty = function () { return this.root.k.length === 0; };

  /* Дерево -> линейная запись (для парсера выражений). Структурные узлы
     разворачиваются в явные вызовы, чтобы приоритет операций не терялся. */
  function rowToExpr(r) {
    var out = '', k = r.k;
    for (var i = 0; i < k.length; i++) {
      var n = k[i];
      switch (n.t) {
        case 'ch': out += (n.v === '·' ? '*' : n.v); break;
        case 'frac': out += '((' + rowToExpr(n.num) + ')/(' + rowToExpr(n.den) + '))'; break;
        case 'sqrt':
          out += n.idx ? '((' + rowToExpr(n.rad) + ')^(1/(' + rowToExpr(n.idx) + ')))'
                       : 'sqrt(' + rowToExpr(n.rad) + ')';
          break;
        case 'sup': out += '^(' + rowToExpr(n.exp) + ')'; break;
        case 'sub': out += '_' + '(' + rowToExpr(n.sub) + ')'; break;
        case 'paren': out += '(' + rowToExpr(n.body) + ')'; break;
        case 'abs': out += 'abs(' + rowToExpr(n.body) + ')'; break;
        case 'norm': out += 'abs(' + rowToExpr(n.body) + ')'; break;
        case 'accent': out += '(' + rowToExpr(n.body) + ')'; break;
        case 'bigop': {
          // integral(low, high, body, var) / sum(low, high, body, var)
          var fn = n.op === 'int' ? 'integral' : (n.op === 'sum' ? 'sum' : 'prod');
          var v = n.dv ? rowToExpr(n.dv) : 'k';
          out += fn + '(' + rowToExpr(n.lo) + ',' + rowToExpr(n.hi) + ',' +
                 rowToExpr(n.body) + ',' + (v || 'x') + ')';
          break;
        }
        case 'lim': out += 'lim(' + rowToExpr(n.to) + ',' + rowToExpr(n.body) + ')'; break;
      }
    }
    return out;
  }
  MathField.prototype.expr = function () { return rowToExpr(this.root); };

  /* --------------------------------------------------------------- импорт
     Обратная сборка из линейной записи — нужна для примеров и истории. */
  MathField.prototype.setExpr = function (src) {
    this.root = link(parseToTree(String(src || '')));
    this.cur = { row: this.root, i: this.root.k.length };
    this._changed();
  };

  // Небольшой разборщик: понимает ^, /, sqrt(), скобки и обычные символы.
  function parseToTree(s) {
    var i = 0;
    function parseRow(stopAt) {
      var r = row([]);
      while (i < s.length) {
        var c = s[i];
        if (stopAt && c === stopAt) break;
        if (c === ')') break;
        if (c === '(') {
          i++;
          var body = parseRow();
          if (s[i] === ')') i++;
          r.k.push({ t: 'paren', body: body, l: '(', r: ')' });
          continue;
        }
        if (c === '^') {
          i++;
          var ex;
          if (s[i] === '(') { i++; ex = parseRow(); if (s[i] === ')') i++; }
          else { ex = row([ch(s[i] || '')]); i++; }
          r.k.push({ t: 'sup', exp: ex });
          continue;
        }
        if (c === '/') {
          i++;
          var den;
          if (s[i] === '(') { i++; den = parseRow(); if (s[i] === ')') i++; }
          else {
            den = row([]);
            while (i < s.length && /[0-9a-zA-Z.]/.test(s[i])) { den.k.push(ch(s[i])); i++; }
          }
          var num = row(r.k.splice(0));       // всё, что было слева — числитель
          r.k.push({ t: 'frac', num: num, den: den });
          continue;
        }
        if (s.substr(i, 5) === 'sqrt(') {
          i += 5;
          var rad = parseRow();
          if (s[i] === ')') i++;
          r.k.push({ t: 'sqrt', rad: rad, idx: null });
          continue;
        }
        r.k.push(ch(c));
        i++;
      }
      return r;
    }
    return parseRow();
  }

  /* --------------------------------------------------------------- наружу */
  MathField.row = row;
  MathField.ch = ch;
  global.MathField = MathField;
})(window);