/* ============================================================================
   MFKeyboard — экранная математическая клавиатура
   ----------------------------------------------------------------------------
   Четыре вкладки, как в Math Editor: 123 · ∞≠∈ · abc · αβγ.

   Главный принцип раскладки — НЕ надо переучиваться:
     • буквы стоят по QWERTY;
     • греческие буквы — на позициях СВОИХ латинских двойников
       (q→φ, w→ς, e→ε, r→ρ, t→τ, y→υ, u→θ, i→ι, o→ο, p→π,
        a→α, s→σ, d→δ, f→φ, g→γ, h→η, j→ξ, k→κ, l→λ,
        z→ζ, x→χ, c→ψ, v→ω, b→β, n→ν, m→μ) — это стандартная греческая
       раскладка, поэтому мышечная память с латиницы переносится целиком;
     • цифры — блоком калькулятора 789 / 456 / 123 / 0 (а не рядом, как на
       телефоне), потому что вводят их здесь именно как на калькуляторе;
     • служебные клавиши (⌫, ‹, ›, ↵, ⇧) всегда на одних и тех же местах во
       всех вкладках — рука к ним привыкает один раз.

   На ПК клавиатура сворачивается стрелкой и не нужна вовсе: всё вводится
   с физической клавиатуры (см. MFKeyboard.SHORTCUTS и окно справки).
   ========================================================================== */
(function (global) {
  'use strict';

  /* Описание клавиши:
       [подпись, действие, вариант?]
     Действие:
       'ch:x'    — вставить символ
       'cmd:frac'— команда поля (дробь, корень, степень…)
       'fn:sin'  — функция с автоскобкой
       'act:left'— служебное действие
     Вариант оформления: 'tpl' (шаблон-конструкция), 'sys' (служебная). */

  var NUM_TAB = {
    id: 'num', label: '123', title: 'Цифры и основные операции',
    // три зоны в строке: переменные/скобки | цифровой блок | шаблоны
    rows: [
      [['x','ch:x'], ['n','ch:n'],  null, ['7','ch:7'],['8','ch:8'],['9','ch:9'],['÷','ch:/'],  null, ['e','ch:e'],['i','ch:i'],['π','ch:π']],
      [['<','ch:<'], ['>','ch:>'],  null, ['4','ch:4'],['5','ch:5'],['6','ch:6'],['×','ch:*'],  null, ['□²','cmd:sq','tpl'],['□^□','cmd:sup','tpl'],['√□','cmd:sqrt','tpl']],
      [['(','cmd:paren'], [')','act:out'], null, ['1','ch:1'],['2','ch:2'],['3','ch:3'],['−','ch:-'], null, ['ⁿ√□','cmd:nroot','tpl'],['□/□','cmd:frac','tpl'],['⌫','act:back','sys']],
      [['⇧','act:shift','sys'], null, null, ['0','ch:0'],['.','ch:.'],['=','ch:='],['+','ch:+'], null, ['‹','act:left','sys'],['›','act:right','sys'],['↵','act:enter','sys']]
    ]
  };

  var FN_TAB = {
    id: 'fn', label: '∞≠∈', title: 'Функции, знаки и конструкции',
    rows: [
      [['sin','fn:sin'],['ln','fn:ln'],['abs','cmd:abs','tpl'],['→','ch:→'],['≠','ch:≠'],['∈','ch:∈'],['∪','ch:∪'],['∫','cmd:int','tpl'],['lim','cmd:lim','tpl'],['e','ch:e']],
      [['cos','fn:cos'],['log','fn:log'],['|□|','cmd:abs','tpl'],['≤','ch:≤'],['∀','ch:∀'],['∋','ch:∋'],['∩','ch:∩'],['∑','cmd:sum','tpl'],['∏','cmd:prod','tpl'],['π','ch:π']],
      [['tan','fn:tan'],['exp','fn:exp'],['‖□‖','cmd:norm','tpl'],['≥','ch:≥'],['∃','ch:∃'],['⊂','ch:⊂'],['□̄','cmd:bar','tpl'],['□⃗','cmd:vec','tpl'],['□′','ch:′'],['∞','ch:∞']],
      [['⇧','act:shift','sys'],[',','ch:,'],[':','ch::'],['·','ch:*'],null,null,null,['‹','act:left','sys'],['›','act:right','sys'],['⌫','act:back','sys'],['↵','act:enter','sys']]
    ]
  };

  // QWERTY — ровно как на обычной клавиатуре
  var Q1 = 'qwertyuiop'.split(''), Q2 = 'asdfghjkl'.split(''), Q3 = 'zxcvbnm'.split('');
  var ABC_TAB = {
    id: 'abc', label: 'abc', title: 'Латинские буквы',
    rows: [
      Q1.map(function (c) { return [c, 'ch:' + c]; }),
      Q2.map(function (c) { return [c, 'ch:' + c]; }),
      [['⇧','act:shift','sys']].concat(Q3.map(function (c) { return [c, 'ch:' + c]; }), [['⌫','act:back','sys']]),
      [['−','ch:-'],['+','ch:+'],['=','ch:='],['␣','ch: '],[',','ch:,'],['.','ch:.'],['‹','act:left','sys'],['›','act:right','sys'],['↵','act:enter','sys']]
    ]
  };

  // Греческая раскладка на позициях латинских двойников
  var G1 = ['φ','ς','ε','ρ','τ','υ','θ','ι','ο','π'];
  var G2 = ['α','σ','δ','φ','γ','η','ξ','κ','λ'];
  var G3 = ['ζ','χ','ψ','ω','β','ν','μ'];
  var GREEK_TAB = {
    id: 'greek', label: 'αβγ', title: 'Греческие буквы (на местах латинских)',
    rows: [
      G1.map(function (c, i) { return [c, 'ch:' + c, null, Q1[i]]; }),
      G2.map(function (c, i) { return [c, 'ch:' + c, null, Q2[i]]; }),
      [['⇧','act:shift','sys']].concat(
        G3.map(function (c, i) { return [c, 'ch:' + c, null, Q3[i]]; }),
        [['⌫','act:back','sys']]),
      [['ε','ch:ϵ'],['ϑ','ch:ϑ'],['ϰ','ch:ϰ'],['␣','ch: '],['ϖ','ch:ϖ'],['ϱ','ch:ϱ'],['‹','act:left','sys'],['›','act:right','sys'],['↵','act:enter','sys']]
    ]
  };

  // Заглавные для ⇧
  var SHIFT_MAP = {};
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (c) { SHIFT_MAP[c] = c.toUpperCase(); });
  var GREEK_UPPER = { 'α':'Α','β':'Β','γ':'Γ','δ':'Δ','ε':'Ε','ζ':'Ζ','η':'Η','θ':'Θ','ι':'Ι',
    'κ':'Κ','λ':'Λ','μ':'Μ','ν':'Ν','ξ':'Ξ','ο':'Ο','π':'Π','ρ':'Ρ','σ':'Σ','ς':'Σ','τ':'Τ',
    'υ':'Υ','φ':'Φ','χ':'Χ','ψ':'Ψ','ω':'Ω' };
  Object.keys(GREEK_UPPER).forEach(function (k) { SHIFT_MAP[k] = GREEK_UPPER[k]; });

  var TABS = [NUM_TAB, FN_TAB, ABC_TAB, GREEK_TAB];

  /* Сочетания физической клавиатуры — показываются в окне справки. */
  var SHORTCUTS = [
    ['/',            'дробь; то, что слева, уходит в числитель'],
    ['^',            'степень'],
    ['_',            'нижний индекс'],
    ['(',            'скобки'],
    [')',            'выйти из скобок'],
    ['\\sqrt  или  Ctrl+R', 'квадратный корень'],
    ['Ctrl+Shift+R', 'корень n-й степени (появится поле показателя)'],
    ['Ctrl+8',       'сумма ∑'],
    ['Ctrl+4',       'интеграл ∫'],
    ['Ctrl+L',       'предел lim'],
    ['Ctrl+M',       'модуль |x|'],
    ['← →',          'курсор; на границе заходит внутрь дроби/корня'],
    ['↑ ↓',          'между числителем и знаменателем, показателем и корнем'],
    ['Tab',          'следующее ПУСТОЕ поле — быстро заполнять шаблоны'],
    ['Shift+Tab',    'предыдущее поле'],
    ['Backspace',    'удалить; пустую конструкцию — целиком'],
    ['Home / End',   'в начало / конец строки'],
    ['Enter',        'вычислить'],
    ['Esc',          'свернуть экранную клавиатуру']
  ];

  /* ---------------------------------------------------------------- виджет */
  function MFKeyboard(host, field, opts) {
    opts = opts || {};
    this.host = host;
    this.field = field;
    this.tab = 0;
    this.shift = false;
    this.collapsed = !!opts.collapsed;
    this.onEnter = opts.onEnter || function () {};
    host.classList.add('mfkb');
    this._build();
    this._bindPhysical();
  }

  MFKeyboard.prototype._build = function () {
    var self = this;
    this.host.innerHTML = '';

    // ---- полоса вкладок + служебные кнопки справа
    var bar = document.createElement('div');
    bar.className = 'mfkb-bar';

    var tabs = document.createElement('div');
    tabs.className = 'mfkb-tabs';
    TABS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mfkb-tab' + (i === self.tab ? ' on' : '');
      b.textContent = t.label;
      b.title = t.title;
      b.setAttribute('aria-label', t.title);
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { self.tab = i; self.shift = false; self._build(); });
      tabs.appendChild(b);
    });
    bar.appendChild(tabs);

    var side = document.createElement('div');
    side.className = 'mfkb-bar-side';

    var help = document.createElement('button');
    help.type = 'button';
    help.className = 'mfkb-icon';
    help.title = 'Как вводить формулы';
    help.setAttribute('aria-label', 'Справка по вводу');
    help.textContent = '?';
    help.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    help.addEventListener('click', function () { MFKeyboard.openHelp(); });
    side.appendChild(help);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mfkb-icon mfkb-collapse';
    toggle.title = this.collapsed ? 'Показать клавиатуру' : 'Свернуть клавиатуру (Esc)';
    toggle.setAttribute('aria-expanded', String(!this.collapsed));
    toggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
      'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="6 9 12 15 18 9"/></svg>';
    toggle.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    toggle.addEventListener('click', function () { self.setCollapsed(!self.collapsed); });
    side.appendChild(toggle);

    bar.appendChild(side);
    this.host.appendChild(bar);

    // ---- сами клавиши
    var pad = document.createElement('div');
    pad.className = 'mfkb-pad';
    var t = TABS[this.tab];
    pad.dataset.tab = t.id;

    t.rows.forEach(function (rowDef) {
      var r = document.createElement('div');
      r.className = 'mfkb-row';
      rowDef.forEach(function (kd) {
        if (!kd) {                      // null = распорка между зонами
          var sp = document.createElement('span');
          sp.className = 'mfkb-spacer';
          r.appendChild(sp);
          return;
        }
        r.appendChild(self._key(kd));
      });
      pad.appendChild(r);
    });

    this.host.appendChild(pad);
    this.host.classList.toggle('mfkb-collapsed', this.collapsed);
  };

  MFKeyboard.prototype._key = function (kd) {
    var self = this;
    var label = kd[0], action = kd[1], variant = kd[2], hint = kd[3];

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mfkb-key' + (variant ? ' mfkb-' + variant : '');
    if (action === 'act:shift' && this.shift) b.classList.add('on');

    // с ⇧ показываем заглавный вариант
    var shown = label;
    if (this.shift && action.indexOf('ch:') === 0) {
      var c = action.slice(3);
      if (SHIFT_MAP[c]) shown = SHIFT_MAP[c];
    }
    b.textContent = shown;
    if (hint) {
      var h = document.createElement('span');
      h.className = 'mfkb-hint';
      h.textContent = hint;
      b.appendChild(h);
    }

    // pointerdown вместо click: поле не теряет фокус и курсор не «прыгает»
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      b.classList.add('press');
      self._fire(action, label);
      setTimeout(function () { b.classList.remove('press'); }, 130);
    });
    return b;
  };

  MFKeyboard.prototype._fire = function (action, label) {
    var f = this.field;
    if (!f) return;
    var kind = action.slice(0, action.indexOf(':'));
    var arg = action.slice(action.indexOf(':') + 1);

    if (kind === 'ch') {
      var c = arg;
      if (this.shift && SHIFT_MAP[c]) { c = SHIFT_MAP[c]; this.shift = false; this._build(); }
      f.insertChars(c);
    } else if (kind === 'fn') {
      f.insertFunc(arg);
    } else if (kind === 'cmd') {
      if (arg === 'sq') { f.cmd('sup'); f.insertChars('2'); }   // готовый квадрат
      else f.cmd(arg);
    } else if (kind === 'act') {
      switch (arg) {
        case 'back':  f.backspace(); break;
        case 'left':  f.left();  f.render(); break;
        case 'right': f.right(); f.render(); break;
        case 'out': {                       // «)» — выйти наружу из скобок
          var owner = f.cur.row.p;
          if (owner && (owner.t === 'paren' || owner.t === 'abs' || owner.t === 'norm')) {
            var pr = owner.p;
            f.cur = { row: pr, i: pr.k.indexOf(owner) + 1 };
            f.render();
          } else { f.right(); f.render(); }
          break;
        }
        case 'shift': this.shift = !this.shift; this._build(); break;
        case 'enter': this.onEnter(f); break;
      }
    }
    try { f.host.focus({ preventScroll: true }); } catch (e) { }
  };

  MFKeyboard.prototype.setCollapsed = function (v) {
    this.collapsed = !!v;
    this._build();
  };

  /* --------------------------------------- сочетания на физической клавиатуре
     Экранная клавиатура НЕ обязательна: всё то же самое доступно с клавиатуры.
     Простые символы обрабатывает сам MathField; здесь — только конструкции,
     которым нужен модификатор. */
  MFKeyboard.prototype._bindPhysical = function () {
    var self = this, f = this.field;
    if (!f || !f.host) return;
    f.host.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { self.setCollapsed(true); e.preventDefault(); return; }
      if (!(e.ctrlKey || e.metaKey)) return;
      var k = e.key.toLowerCase();
      var map = {
        'r': e.shiftKey ? 'nroot' : 'sqrt',
        'm': 'abs',
        'l': 'lim',
        '8': 'sum',
        '4': 'int'
      };
      if (map[k]) { f.cmd(map[k]); e.preventDefault(); }
    });
  };

  /* ------------------------------------------------------- окно обучения */
  MFKeyboard.openHelp = function () {
    var id = 'mfkb-help';
    var old = document.getElementById(id);
    if (old) { old.classList.add('active'); return; }

    var ov = document.createElement('div');
    ov.className = 'overlay active';
    ov.id = id + '-ov';

    var m = document.createElement('div');
    m.className = 'modal active mfkb-help-modal';
    m.id = id;

    var rows = SHORTCUTS.map(function (s) {
      return '<tr><td><kbd>' + s[0].replace(/ /g, '&nbsp;') + '</kbd></td><td>' + s[1] + '</td></tr>';
    }).join('');

    m.innerHTML =
      '<div class="modal-header"><h2>Как вводить формулы</h2>' +
      '<button class="modal-close" aria-label="Закрыть">&times;</button></div>' +
      '<p class="mfkb-help-lead">Поле формулы — <b>двумерное</b>: у дроби свои числитель и знаменатель, ' +
      'у корня — своё поле показателя, у степени — своё. Курсор ходит между ними стрелками, ' +
      'а на телефоне достаточно ткнуть пальцем в нужное место.</p>' +
      '<h3 class="mfkb-help-h">Сочетания клавиш</h3>' +
      '<table class="mfkb-help-table"><tbody>' + rows + '</tbody></table>' +
      '<h3 class="mfkb-help-h">Приёмы</h3>' +
      '<ul class="mfkb-help-list">' +
      '<li>Наберите <code>2x</code> и нажмите <kbd>/</kbd> — <code>2x</code> само уедет в числитель.</li>' +
      '<li><kbd>Tab</kbd> прыгает по пустым полям: удобно заполнять большие конструкции.</li>' +
      '<li>Умножение можно не писать: <code>2x</code>, <code>xy</code>, <code>2(x+1)</code> понимаются сами.</li>' +
      '<li>Греческие буквы стоят на местах латинских: <kbd>a</kbd>→α, <kbd>b</kbd>→β, <kbd>p</kbd>→π.</li>' +
      '</ul>';

    document.body.appendChild(ov);
    document.body.appendChild(m);

    function close() {
      m.classList.remove('active');
      ov.classList.remove('active');
      setTimeout(function () {
        if (m.parentNode) m.parentNode.removeChild(m);
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }, 260);
    }
    m.querySelector('.modal-close').addEventListener('click', close);
    ov.addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  };

  MFKeyboard.TABS = TABS;
  MFKeyboard.SHORTCUTS = SHORTCUTS;
  global.MFKeyboard = MFKeyboard;
})(window);