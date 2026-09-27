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
    if (/[+\-*/=<>±·×÷≤≥≠≈⇒⇐⇔→←↔]/.test(v)) return 'op';
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
    lim:  ['to', 'body'],      // lim_{x→a} body
    cases: ['rows']            // система { … : произвольное число строк-полей
  };
  // cases хранит строки в массиве node.rows (каждая — row); в FIELDS он объявлен
  // как одно «поле» rows, но fieldsOf/навигация обрабатывают его особо (см. ниже).
  // поля, которые реально существуют у конкретного узла (idx может быть null)
  function fieldsOf(n) {
    if (n.t === 'cases') return [];   // строки системы обходятся отдельно
    var f = FIELDS[n.t] || [];
    return f.filter(function (name) { return n[name]; });
  }
  // все дочерние row данного узла в порядке навигации (включая строки системы)
  function childRows(n) {
    if (n.t === 'cases') return n.rows.slice();
    return fieldsOf(n).map(function (name) { return n[name]; });
  }

  /* ------------------------------------------------- связывание родителей */
  function link(node, parent, field) {
    node.p = parent || null;
    node.pf = field || null;
    if (node.t === 'row') {
      node.k.forEach(function (c) { link(c, node, 'k'); });
    } else if (node.t === 'cases') {
      node.rows.forEach(function (r) { link(r, node, 'rows'); });
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

    // Тап ставит курсор; протаскивание выделяет диапазон в пределах одной строки.
    // На ПК (мышь) всплывающее меню «Копировать/Вырезать/…» НЕ должно вылезать
    // само по себе после протаскивания — там для этого есть ПКМ (contextmenu,
    // см. ниже). Показываем его автоматически только для touch/pen — там
    // ПКМ-жеста физически нет, а «прилипающая» плашка над выделением — это
    // и есть привычный системный способ.
    var dragging = false, anchor = null, lastPointerType = 'mouse';
    this.host.addEventListener('pointerdown', function (e) {
      self.host.focus();
      lastPointerType = e.pointerType || 'mouse';
      // ПКМ (button===2) только переставляет курсор — не запускает протаскивание
      // выделения (у него своя роль: contextmenu откроет меню на этом месте).
      var isPrimary = e.button === 0 || e.pointerType !== 'mouse';
      var hit = self._hitTest(e.clientX, e.clientY);
      if (hit) {
        self.cur = hit;
        if (isPrimary) {
          anchor = hit;
          self.sel = null;
          dragging = true;
          try { self.host.setPointerCapture(e.pointerId); } catch (err) {}
        }
        self.render();
      }
      self._hideCtxMenu();
      if (isPrimary) e.preventDefault();
    });
    this.host.addEventListener('pointermove', function (e) {
      if (!dragging || !anchor) return;
      var hit = self._hitTest(e.clientX, e.clientY);
      if (hit && hit.row === anchor.row && hit.i !== anchor.i) {
        self.sel = { row: anchor.row, a: anchor.i, b: hit.i };
        self.cur = { row: hit.row, i: hit.i };
        self.render();
      }
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      try { self.host.releasePointerCapture(e.pointerId); } catch (err) {}
      // Плашка сама всплывает только на тач/пере — на мыши выделение остаётся
      // видимым, а меню доступно через ПКМ.
      if (self.sel && lastPointerType !== 'mouse') self._showCtxMenu();
    }
    this.host.addEventListener('pointerup', endDrag);
    this.host.addEventListener('pointercancel', endDrag);

    // ПКМ на ПК (и долгое нажатие пальцем, которое браузер тоже репортит как
    // contextmenu) — единственный способ открыть меню на мыши. Открываем
    // ровно там, где кликнули (как обычное системное меню), а не «прилипшим»
    // к выделению — так оно и выглядит как десктопное контекстное меню, а не
    // как мобильная плашка.
    this.host.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      self._showCtxMenu({ x: e.clientX, y: e.clientY });
    });

    this.host.addEventListener('focus', function () { self.host.classList.add('mfld-focus'); self.render(); });
    this.host.addEventListener('blur', function () { self.host.classList.remove('mfld-focus'); self._hideCtxMenu(); self.render(); });
  };

  /* ------------------------------------------------------------ навигация */
  // Все строки документа в порядке обхода — нужно для Tab и «умных» стрелок.
  function collectRows(node, out) {
    out = out || [];
    if (node.t === 'row') {
      out.push(node);
      node.k.forEach(function (c) { collectRows(c, out); });
    } else {
      childRows(node).forEach(function (r) { collectRows(r, out); });
    }
    return out;
  }
  // индекс строки внутри владельца (для cases — позиция в rows, иначе — среди полей)
  function rowIndexIn(owner, r) {
    var rs = childRows(owner);
    return rs.indexOf(r);
  }
  function ownerRows(owner) { return childRows(owner); }

  MathField.prototype.left = function () {
    var c = this.cur;
    if (c.i > 0) {
      var prev = c.row.k[c.i - 1];
      var rs = childRows(prev);
      if (rs.length) {                      // входим в последнее поле узла
        var target = rs[rs.length - 1];
        this.cur = { row: target, i: target.k.length };
        return;
      }
      c.i--;
      return;
    }
    // выходим из поля наружу
    var owner = c.row.p;
    if (!owner) return;
    var parentRow = owner.p;
    if (!parentRow) return;
    var fs = ownerRows(owner);
    var idx = fs.indexOf(c.row);
    if (idx > 0) {                           // есть поле левее внутри того же узла
      var t = fs[idx - 1];
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
      var rs = childRows(next);
      if (rs.length) {
        var target = rs[0];
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
    var fs = ownerRows(owner);
    var idx = fs.indexOf(c.row);
    if (idx >= 0 && idx < fs.length - 1) {
      var t = fs[idx + 1];
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
      if (owner.t === 'cases') {             // между строками системы
        var idx = owner.rows.indexOf(r);
        if (idx >= 0) {
          var tgt = idx + dir;
          if (tgt >= 0 && tgt < owner.rows.length) {
            var tr = owner.rows[tgt];
            this.cur = { row: tr, i: Math.min(this.cur.i, tr.k.length) };
            return true;
          }
        }
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
    var rs = childRows(node);
    if (rs.length) {
      this.cur = { row: rs[0], i: 0 };
    }
    this._changed();
  };

  // Буквы, цифры, точка и греческие — «остаются» в показателе/индексе (x^2,
  // x^n, x^π — всё это осмысленные короткие показатели). Любой другой символ
  // (оператор, знак отношения) означает, что показатель закончился, и курсор
  // сначала выходит наружу — иначе «x^2-5x+6=0» целиком уезжало бы в показатель
  // степени, что противоречит обычной математической записи (степень связывает
  // сильнее, чем следующие за ней операции).
  function staysInScript(ch) {
    return /^[0-9a-zA-Zа-яА-Я.]$/.test(ch) || /^[α-ωΑ-Ωπθ]$/.test(ch);
  }
  MathField.prototype._exitScript = function () {
    var owner = this.cur.row.p;
    if (owner && (owner.t === 'sup' || owner.t === 'sub')) {
      var parentRow = owner.p;
      if (parentRow) {
        var pos = parentRow.k.indexOf(owner);
        this.cur = { row: parentRow, i: pos + 1 };
      }
    }
  };
  MathField.prototype.insertChars = function (str) {
    var self = this;
    var chars = String(str).split('');
    if (chars.length && !staysInScript(chars[0])) this._exitScript();
    chars.forEach(function (v) {
      var c = self.cur;
      var node = link(ch(v), c.row, 'k');
      c.row.k.splice(c.i, 0, node);
      c.i++;
    });
    this._changed();
  };

  // Если курсор сейчас стоит в начале ПУСТОГО поля, принадлежащего структуре
  // с несколькими полями (дробь, система…), и у структуры есть поле РАНЬШЕ
  // текущего — прыгаем в его конец, оставаясь внутри структуры. Иначе (это
  // первое поле, или структура не имеет соседей) — ничего не делаем, вызывающий
  // код сам решит, выходить ли наружу/сносить структуру.
  // Возвращает true, если прыжок произошёл.
  MathField.prototype._maybeJumpToSiblingField = function () {
    var c = this.cur;
    if (c.i !== 0 || c.row.k.length !== 0) return false;
    var owner = c.row.p;
    if (!owner || !owner.p) return false;
    var siblings = childRows(owner);
    var idx = siblings.indexOf(c.row);
    if (idx > 0) {
      var prevField = siblings[idx - 1];
      this.cur = { row: prevField, i: prevField.k.length };
      return true;
    }
    return false;
  };

  MathField.prototype.backspace = function () {
    // Если есть выделение — Backspace удаляет его целиком, как в любом редакторе.
    if (this.sel && this._deleteSelection()) { this._changed(); return; }

    var c = this.cur;
    if (c.i > 0) {
      var prev = c.row.k[c.i - 1];
      var rs = childRows(prev);
      if (rs.length) {
        // Составной узел (дробь, корень, степень, ∫, |·|, система …) СРАЗУ
        // ПЕРЕД курсором — сносим его целиком одним нажатием, независимо от
        // того, есть ли внутри содержимое. Заходить внутрь для редактирования
        // нужно СТРЕЛКОЙ ВЛЕВО (или тапом), а не Backspace — так «стереть»
        // однозначно значит «стереть», а не «сначала войти».
        c.row.k.splice(c.i - 1, 1);
        c.i--;
        // Само удаление составного узла могло опустошить и ТЕКУЩУЮ строку
        // (если это был единственный её элемент) — например, дробь целиком
        // внутри знаменателя другой дроби. Тогда сразу пробуем прыгнуть на
        // соседнее поле ВНЕШНЕЙ структуры, тем же нажатием.
        this._maybeJumpToSiblingField();
      } else {
        c.row.k.splice(c.i - 1, 1);
        c.i--;
        // Удалили последний символ поля — если оно теперь пусто и у структуры
        // есть соседнее поле раньше него, прыгаем туда СРАЗУ, тем же нажатием
        // Backspace, а не только при следующем отдельном нажатии из пустого поля.
        this._maybeJumpToSiblingField();
      }
      this._changed();
      return;
    }
    // Курсор в начале поля, принадлежащего составному узлу (owner). Если у
    // owner'а есть поле РАНЬШЕ текущего (например, мы в знаменателе дроби,
    // а числитель ещё существует) — прыгаем в его конец и остаёмся ВНУТРИ
    // структуры; выходить наружу/сносить всю структуру имеет смысл только
    // когда мы уже в САМОМ ПЕРВОМ её поле.
    if (this._maybeJumpToSiblingField()) { this._changed(); return; }
    var owner = c.row.p;
    if (!owner || !owner.p) return;
    var siblings = childRows(owner);
    var parentRow = owner.p;
    var allEmpty = siblings.every(function (r) { return r.k.length === 0; });
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
    this.sel = null;   // старое выделение указывало бы на уже отсоединённый root
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
    if (n.t === 'paren' || n.t === 'abs' || n.t === 'frac' || n.t === 'sqrt') {
      start--;
      // «sin(x)/» должно забрать sin(x) целиком в числитель, а не только (x) —
      // имя функции перед скобкой такая же неотъемлемая часть операнда.
      if (start > 0 && r.k[start - 1].t === 'fnname') start--;
    }
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
      case 'cases':
        // Система имеет смысл только как ЕДИНСТВЕННОЕ содержимое поля — если
        // уже что-то написано (хоть до, хоть после, хоть мы сейчас внутри
        // другой структуры), «{ }» молча ничего не делает.
        if (this.root.k.length > 0) return;
        node = { t: 'cases', rows: [row([]), row([])] };
        break;
      default: return;
    }
    this.insert(node);
  };

  // Функция вида sin( … ): имя обычными буквами + скобка с курсором внутри
  MathField.prototype.insertFunc = function (fname) {
    var c = this.cur;
    // Раньше "sin" вставлялось как ТРИ отдельных символа (s,i,n), и Backspace
    // стирал их по одной букве. Теперь это ОДИН атомарный узел fnname —
    // ровно как обычный символ, только текст длиннее; удаляется целиком за
    // одно нажатие, как и любая другая структура.
    var n = link({ t: 'fnname', name: fname, c: 'fn' }, c.row, 'k');
    c.row.k.splice(c.i, 0, n); c.i++;
    this.insert({ t: 'paren', body: row([]), l: '(', r: ')' });
  };

  // Внутри системы: добавить новую строку под текущей и перейти в неё.
  // Возвращает true, если курсор действительно был внутри cases.
  MathField.prototype.addCaseRow = function () {
    var r = this.cur.row, owner = r.p;
    while (owner && owner.t !== 'cases') { r = owner.p; owner = r ? r.p : null; }
    if (!owner || owner.t !== 'cases') return false;
    var idx = owner.rows.indexOf(r);
    var nr = link(row([]), owner, 'rows');
    owner.rows.splice(idx + 1, 0, nr);
    this.cur = { row: nr, i: 0 };
    this._changed();
    return true;
  };

  /* ============================================================ ВЫДЕЛЕНИЕ
     Модель проста и покрывает практический случай: выделение — это диапазон
     [a, b] позиций ВНУТРИ ОДНОЙ строки (this.sel = {row, a, b}, a<=b). Между
     разными полями (числитель/знаменатель и т.п.) выделение не тянется — это
     сознательное ограничение: так поведение предсказуемо, а копирование/вставка
     работают как в обычном поле. Shift+стрелки расширяют, Ctrl/Cmd+A выделяет
     всю текущую строку, тап-протаскивание — мышью/пальцем. */
  MathField.prototype._clearSel = function () { this.sel = null; };

  MathField.prototype._selNorm = function () {
    if (!this.sel) return null;
    var a = Math.min(this.sel.a, this.sel.b), b = Math.max(this.sel.a, this.sel.b);
    return { row: this.sel.row, a: a, b: b };
  };

  MathField.prototype.extendSel = function (dir) {
    // Shift+Left/Right: двигаем «плавающий» конец выделения в пределах строки.
    var c = this.cur;
    if (!this.sel || this.sel.row !== c.row) this.sel = { row: c.row, a: c.i, b: c.i };
    var nb = this.sel.b + dir;
    nb = Math.max(0, Math.min(c.row.k.length, nb));
    this.sel.b = nb;
    this.cur = { row: c.row, i: nb };
    if (this.sel.a === this.sel.b) this.sel = null;   // схлопнулось — снимаем
  };

  MathField.prototype.selectAllRow = function () {
    var r = this.cur.row;
    if (!r.k.length) { this.sel = null; return; }
    this.sel = { row: r, a: 0, b: r.k.length };
    this.cur = { row: r, i: r.k.length };
  };

  MathField.prototype._deleteSelection = function () {
    var s = this._selNorm();
    if (!s || s.a === s.b) { this.sel = null; return false; }
    s.row.k.splice(s.a, s.b - s.a);
    this.cur = { row: s.row, i: s.a };
    this.sel = null;
    return true;
  };

  // Глубокая копия поддерева (для копирования/вставки), без ссылок на родителя.
  function cloneNode(n) {
    if (n.t === 'ch') return { t: 'ch', v: n.v, c: n.c };
    if (n.t === 'fnname') return { t: 'fnname', name: n.name, c: n.c };
    var out = { t: n.t };
    ['l', 'r', 'kind', 'op'].forEach(function (k) { if (n[k] !== undefined) out[k] = n[k]; });
    if (n.t === 'cases') { out.rows = n.rows.map(function (r) { return cloneRow(r); }); return out; }
    (FIELDS[n.t] || []).forEach(function (f) { if (n[f]) out[f] = cloneRow(n[f]); });
    if (n.t === 'sqrt' && !n.idx) out.idx = null;
    return out;
  }
  function cloneRow(r) { return { t: 'row', k: r.k.map(cloneNode) }; }

  MathField.prototype.copySelection = function () {
    var s = this._selNorm();
    if (!s || s.a === s.b) return null;
    var nodes = s.row.k.slice(s.a, s.b).map(cloneNode);
    MathField._clipboard = { t: 'row', k: nodes };
    // Пытаемся положить и в системный буфер как линейный текст —
    // тогда вставка сработает и в другие приложения.
    try {
      var txt = rowToExpr({ t: 'row', k: nodes });
      if (navigator.clipboard && txt) navigator.clipboard.writeText(txt).catch(function () {});
    } catch (e) {}
    return MathField._clipboard;
  };

  MathField.prototype.cutSelection = function () {
    var clip = this.copySelection();
    if (clip) { this._deleteSelection(); this._changed(); }
    return clip;
  };

  MathField.prototype.pasteClipboard = function () {
    var clip = MathField._clipboard;
    if (!clip || !clip.k || !clip.k.length) return false;
    if (this.sel) this._deleteSelection();
    var c = this.cur;
    var nodes = clip.k.map(cloneNode);
    nodes.forEach(function (nd) { link(nd, c.row, 'k'); });
    Array.prototype.splice.apply(c.row.k, [c.i, 0].concat(nodes));
    c.i += nodes.length;
    this._changed();
    return true;
  };

  /* ---------------------------------------------------------- клавиатура */
  MathField.prototype._key = function (e) {
    var k = e.key;

    // --- Ctrl/Cmd: буфер обмена и выделение всего ---
    if (e.ctrlKey || e.metaKey) {
      var lk = k.toLowerCase();
      if (lk === 'a') { this.selectAllRow(); this.render(); e.preventDefault(); return; }
      if (lk === 'c') { this.copySelection(); this.render(); e.preventDefault(); return; }
      if (lk === 'x') { this.cutSelection(); e.preventDefault(); return; }
      if (lk === 'v') { this.pasteClipboard(); e.preventDefault(); return; }
      return;   // прочие сочетания (Ctrl+R и т.п.) обрабатывает клавиатура-виджет
    }

    // --- Shift+стрелки: выделение ---
    if (e.shiftKey && k === 'ArrowLeft')  { this.extendSel(-1); this.render(); e.preventDefault(); return; }
    if (e.shiftKey && k === 'ArrowRight') { this.extendSel(1);  this.render(); e.preventDefault(); return; }

    var hadSel = !!this.sel;

    if (k === 'ArrowLeft')  { if (hadSel) this._collapseSelTo('a'); else this.left();  this.render(); e.preventDefault(); return; }
    if (k === 'ArrowRight') { if (hadSel) this._collapseSelTo('b'); else this.right(); this.render(); e.preventDefault(); return; }
    if (k === 'ArrowUp')    { this._clearSel(); if (this.vert(-1)) this.render(); e.preventDefault(); return; }
    if (k === 'ArrowDown')  { this._clearSel(); if (this.vert(1))  this.render(); e.preventDefault(); return; }
    if (k === 'Tab')        { this._clearSel(); this.tabField(e.shiftKey); this.render(); e.preventDefault(); return; }
    if (k === 'Backspace')  { this.backspace(); e.preventDefault(); return; }
    if (k === 'Delete')     { if (this.sel) { this._deleteSelection(); this._changed(); } else { this._deleteForward(); } e.preventDefault(); return; }
    if (k === 'Home')       { this._clearSel(); this.cur.i = 0; this.render(); e.preventDefault(); return; }
    if (k === 'End')        { this._clearSel(); this.cur.i = this.cur.row.k.length; this.render(); e.preventDefault(); return; }
    if (k === 'Enter')      {
      e.preventDefault();
      if (this.addCaseRow && this.addCaseRow()) return;
      try { this.onChange(this, true); } catch (err) {}
      return;
    }

    // Ввод символа/шаблона поверх выделения сначала стирает выделенное.
    function eatSel(self) { if (self.sel) { self._deleteSelection(); } }

    if (k === '/') { eatSel(this); this.cmd('frac');  e.preventDefault(); return; }
    if (k === '^') { eatSel(this); this.cmd('sup');   e.preventDefault(); return; }
    if (k === '_') { eatSel(this); this.cmd('sub');   e.preventDefault(); return; }
    if (k === '(') { eatSel(this); this.cmd('paren'); e.preventDefault(); return; }
    if (k === ')') {
      var owner = this.cur.row.p;
      if (owner && owner.t === 'paren') {
        var pr = owner.p;
        this.cur = { row: pr, i: pr.k.indexOf(owner) + 1 };
        this._clearSel(); this.render(); e.preventDefault();
      }
      return;
    }
    if (k.length === 1 && /[0-9a-zA-Zа-яА-Я.,+\-*=<>!πθ]/.test(k)) {
      eatSel(this);
      this.insertChars(k === ',' ? '.' : k);
      e.preventDefault();
    }
  };

  // при обычной стрелке влево/вправо схлопываем выделение к его краю
  MathField.prototype._collapseSelTo = function (edge) {
    var s = this._selNorm();
    if (!s) return;
    this.cur = { row: s.row, i: edge === 'a' ? s.a : s.b };
    this.sel = null;
  };

  // Delete: удалить символ СПРАВА от курсора (симметрично Backspace).
  MathField.prototype._deleteForward = function () {
    var c = this.cur;
    if (c.i < c.row.k.length) {
      c.row.k.splice(c.i, 1);
      this._changed();
    }
  };

  /* ------------------------------------------------------------- отрисовка */
  MathField.prototype.render = function () {
    var frag = document.createDocumentFragment();
    this._gaps = [];   // для попадания пальцем: {el, row, i}
    // Узлы, которых не было в прошлой отрисовке, получают класс .mfld-new —
    // страница может анимировать «появление» символа (см. mini-services.css).
    // На самой первой отрисовке ничего не помечаем. WeakSet — не держим
    // удалённые узлы в памяти.
    this._seenNext = typeof WeakSet === 'function' ? new WeakSet() : null;
    this._newCount = 0;
    frag.appendChild(this._renderRow(this.root, true));
    this._seenPrev = this._seenNext;
    this.host.innerHTML = '';
    this.host.appendChild(frag);
    this.host.classList.toggle('mfld-has-sel', !!(this.sel && this.sel.a !== this.sel.b));
    this._sizeCasesBraces();
    // Раньше по переполненному полю можно было прокрутить пальцем; теперь
    // touch-action:none отдан под выделение (см. mathfield.css), поэтому
    // курсор обязан сам заезжать в видимую область — иначе после ввода
    // длинного выражения конец было бы просто не увидеть на телефоне.
    var cur = this.host.querySelector('.mfld-cursor');
    if (cur && cur.scrollIntoView) {
      try { cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    }
  };

  // Скобка системы должна визуально закрывать всю стопку строк — сколько бы
  // их ни было. Меряем РЕАЛЬНУЮ высоту stack ПОСЛЕ прикрепления к DOM (до
  // этого момента у элементов нет layout — offsetHeight был бы нулевым) и
  // растягиваем скобку под неё, а не гадаем формулой по числу строк.
  MathField.prototype._sizeCasesBraces = function () {
    var groups = this.host.querySelectorAll('.mfld-cases');
    for (var i = 0; i < groups.length; i++) {
      var brace = groups[i].querySelector('.mfld-cases-brace');
      var stack = groups[i].querySelector('.mfld-cases-rows');
      if (!brace || !stack) continue;
      var braceH = brace.offsetHeight, stackH = stack.offsetHeight;
      if (braceH > 0 && stackH > 0) {
        brace.style.transform = 'scaleY(' + Math.max(1, stackH / braceH).toFixed(3) + ')';
      }
    }
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

    var selRange = null;
    if (this.sel && this.sel.row === r) {
      selRange = { a: Math.min(this.sel.a, this.sel.b), b: Math.max(this.sel.a, this.sel.b) };
    }

    box.appendChild(gap(0));
    r.k.forEach(function (node, i) {
      var el = self._renderNode(node);
      if (self._seenNext) {
        if (self._seenPrev && !self._seenPrev.has(node)) {
          el.classList.add('mfld-new');
          if (self._newCount) el.style.setProperty('--mfn', self._newCount);
          self._newCount++;
        }
        self._seenNext.add(node);
      }
      if (selRange && i >= selRange.a && i < selRange.b) el.classList.add('mfld-sel');
      box.appendChild(el);
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
      case 'fnname': {
        e = document.createElement('span');
        e.className = 'mfld-ch mfld-' + n.c;
        e.textContent = n.name;
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
      case 'cases': {
        e = document.createElement('span'); e.className = 'mfld-cases';
        var brace = document.createElement('span'); brace.className = 'mfld-cases-brace'; brace.textContent = '{';
        var stack = document.createElement('span'); stack.className = 'mfld-cases-rows';
        n.rows.forEach(function (rr) {
          var line = document.createElement('span'); line.className = 'mfld-cases-row';
          line.appendChild(self._renderRow(rr));
          stack.appendChild(line);
        });
        // Высота скобки — по фактическому числу строк, а не фиксированная:
        // на двух строках она скромнее, на четырёх — заметно выше. Растягиваем
        // только по вертикали (transform), не через font-size — так толщина
        // штриха остаётся такой же, как у обычных символов, не увеличиваясь
        // вместе с размером (это и был один из отмеченных недостатков).
        var rowCount = n.rows.length;
        brace.style.transform = 'scaleY(' + (1 + (rowCount - 1) * 1.5).toFixed(2) + ')';
        e.appendChild(brace); e.appendChild(stack);
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

  /* -------------------------------------- всплывающее меню (копировать и т.д.)
     Два разных вида одной и той же плашки:
       • без pos (вызывает endDrag на touch/pen) — мобильная горизонтальная
         плашка над выделением, как в системных полях ввода на телефоне;
       • с pos={x,y} (вызывает contextmenu, т.е. ПКМ) — вертикальный список,
         открывается ровно там, где кликнули, как обычное десктопное
         контекстное меню. */
  MathField.prototype._showCtxMenu = function (pos) {
    var self = this;
    this._hideCtxMenu();
    var menu = document.createElement('div');
    menu.className = pos ? 'mfld-ctx mfld-ctx-desktop' : 'mfld-ctx';
    var items = [];
    if (this.sel) { items.push(['Копировать', function () { self.copySelection(); self._clearSel(); self.render(); }]); }
    if (this.sel) { items.push(['Вырезать', function () { self.cutSelection(); }]); }
    if (MathField._clipboard) { items.push(['Вставить', function () { self.pasteClipboard(); }]); }
    items.push(['Выделить всё', function () { self.selectAllRow(); self.render(); self._showCtxMenu(pos); }]);

    items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mfld-ctx-btn'; b.textContent = it[0];
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation();
        it[1](); self._hideCtxMenu();
        try { self.host.focus({ preventScroll: true }); } catch (err) {}
      });
      menu.appendChild(b);
    });

    document.body.appendChild(menu);
    var mw = menu.offsetWidth, mh = menu.offsetHeight;
    var left, top;
    if (pos) {
      // Ровно в точке клика, как системное меню (с поправкой, чтобы не вылезти за край).
      left = pos.x + window.scrollX;
      top = pos.y + window.scrollY;
    } else {
      // Над выделением (или над курсором) — центрируем по горизонтали.
      var rect = this._selectionRect() || this.host.getBoundingClientRect();
      left = rect.left + rect.width / 2 - mw / 2 + window.scrollX;
      top = rect.top - mh - 8 + window.scrollY;
      if (top < window.scrollY + 4) top = rect.bottom + 8 + window.scrollY; // не влезло сверху — снизу
    }
    left = Math.max(6 + window.scrollX, Math.min(left, window.scrollX + document.documentElement.clientWidth - mw - 6));
    top = Math.max(6 + window.scrollY, Math.min(top, window.scrollY + document.documentElement.clientHeight - mh - 6));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    requestAnimationFrame(function () { menu.classList.add('mfld-ctx-in'); });
    this._ctxMenu = menu;

    // Клик вне меню — закрыть.
    this._ctxDismiss = function (ev) {
      if (self._ctxMenu && !self._ctxMenu.contains(ev.target) && ev.target !== self.host) self._hideCtxMenu();
    };
    setTimeout(function () { document.addEventListener('pointerdown', self._ctxDismiss, true); }, 0);
  };
  MathField.prototype._hideCtxMenu = function () {
    if (this._ctxMenu) { this._ctxMenu.remove(); this._ctxMenu = null; }
    if (this._ctxDismiss) { document.removeEventListener('pointerdown', this._ctxDismiss, true); this._ctxDismiss = null; }
  };
  MathField.prototype._selectionRect = function () {
    // объединяющий прямоугольник выделенных атомов
    var els = this.host.querySelectorAll('.mfld-sel');
    if (!els.length) return null;
    var L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      L = Math.min(L, r.left); T = Math.min(T, r.top);
      R = Math.max(R, r.right); B = Math.max(B, r.bottom);
    });
    return { left: L, top: T, width: R - L, height: B - T, right: R, bottom: B };
  };

  /* -------------------------------------------------------------- экспорт */
  function rowToLatex(r) { return r.k.map(nodeToLatex).join(''); }
  function nodeToLatex(n) {
    switch (n.t) {
      case 'ch': return n.v === '*' ? '\\cdot ' : n.v;
      case 'fnname': return '\\operatorname{' + n.name + '}';
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
      case 'cases':
        return '\\begin{cases}' +
          n.rows.map(function (r) { return rowToLatex(r); }).join(' \\\\ ') +
          '\\end{cases}';
    }
    return '';
  }
  MathField.prototype.latex = function () { return rowToLatex(this.root); };

  MathField.prototype.isEmpty = function () { return this.root.k.length === 0; };

  // Обходит ВСЁ дерево поля (все узлы во всех вложенных строках) в поисках
  // узла, для которого predicate вернёт true. Нужно клавиатуре — гасить
  // клавиши, конфликтующие с уже введённым (см. MFKeyboard.conflictRules
  // в mf-keyboard.js: «i» ⇄ знаки неравенства, вектор ⇄ lim и т.п.).
  MathField.prototype.hasNode = function (predicate) {
    function walk(node) {
      if (!node) return false;
      if (predicate(node)) return true;
      if (node.t === 'row') return node.k.some(walk);
      if (node.t === 'cases') return node.rows.some(walk);
      return fieldsOf(node).some(function (name) { return walk(node[name]); });
    }
    return walk(this.root);
  };

  /* Дерево -> линейная запись (для парсера выражений). Структурные узлы
     разворачиваются в явные вызовы, чтобы приоритет операций не терялся. */
  function rowToExpr(r) {
    var out = '', k = r.k;
    for (var i = 0; i < k.length; i++) {
      var n = k[i];
      switch (n.t) {
        case 'ch': out += (n.v === '·' ? '*' : n.v); break;
        case 'fnname': out += n.name; break;
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
        // vec: сериализуется как вызов функции «vec(...)», а не просто
        // скобки — иначе после сборки в линейную строку было бы никак не
        // отличить вектор от обычной скобочной группы (bar/hat такой
        // проблемы не имеют — там и не нужно ничего вычислять по-особому).
        // См. FUNCS.vec (mf-math.js) и analyzeVector (services.js).
        case 'accent': out += (n.kind === 'vec' ? 'vec(' : '(') + rowToExpr(n.body) + ')'; break;
        case 'bigop': {
          // integral(low, high, body, var) / sum(low, high, body, var)
          var fn = n.op === 'int' ? 'integral' : (n.op === 'sum' ? 'sum' : 'prod');
          var v = n.dv ? rowToExpr(n.dv) : 'k';
          out += fn + '(' + rowToExpr(n.lo) + ',' + rowToExpr(n.hi) + ',' +
                 rowToExpr(n.body) + ',' + (v || 'x') + ')';
          break;
        }
        case 'lim': out += 'lim(' + rowToExpr(n.to) + ',' + rowToExpr(n.body) + ')'; break;
        case 'cases':
          out += 'system(' + n.rows.map(function (r) { return rowToExpr(r); }).join(';') + ')';
          break;
      }
    }
    return out;
  }
  MathField.prototype.expr = function () { return rowToExpr(this.root); };

  // Если ввод — единственная система, вернуть её строки как массив линейных
  // выражений; иначе null. Удобно алгебраическому калькулятору.
  MathField.prototype.systemRows = function () {
    var k = this.root.k;
    var casesNode = null, others = 0;
    k.forEach(function (n) { if (n.t === 'cases') casesNode = n; else if (!(n.t === 'ch' && !n.v.trim())) others++; });
    if (casesNode && others === 0) return casesNode.rows.map(function (r) { return rowToExpr(r); });
    return null;
  };

  /* --------------------------------------------------------------- импорт
     Обратная сборка из линейной записи — нужна для примеров и истории. */
  MathField.prototype.setExpr = function (src) {
    this.root = link(parseToTree(String(src || '')));
    this.cur = { row: this.root, i: this.root.k.length };
    this.sel = null;
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