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

   ⇧ влияет не только на регистр буквы, но и на ДЕЙСТВИЕ клавиши:
     • на вкладке «∞≠∈» часть клавиш имеют альтернативную тройку (kd[4]) —
       например sin ⇄ sin⁻¹, → ⇄ ⇒, ∈ ⇄ ∀ — это и есть переключение
       действия, а не просто заглавная буква;
     • на ВСЕХ вкладках ⇧ подменяет ⌫ (стереть один символ) на 🗑 (очистить
       всё поле) — тоже смена действия, а не отображения;
     • ⇧ теперь удерживается (не гаснет после одного символа), потому что
       управляет сразу несколькими вещами сразу — повторное нажатие возвращает
       обычный режим.

   ÷ и черта дроби — РАЗНЫЕ клавиши с разным смыслом: ÷ вставляет обычный
   символ-разделитель внутри строки (2÷3), а «□/□» строит настоящую дробь
   с числителем и знаменателем в отдельных полях. Нужны оба варианта.

   «{ }» — знак системы (уравнений/неравенств): создаёт фигурную скобку с
   двумя строками, Enter внутри неё добавляет ещё одну. В калькуляторах, где
   система не имеет смысла (график функции и т.п.), эта клавиша передаётся
   отключённой через опцию allowSystem: false — конструктора MFKeyboard.

   На ПК клавиатура сворачивается стрелкой и не нужна вовсе: всё вводится
   с физической клавиатуры (см. MFKeyboard.SHORTCUTS и окно справки). В
   свёрнутом виде вкладки тоже скрыты — остаются только «?» и стрелка.
   ========================================================================== */
(function (global) {
  'use strict';

  /* Описание клавиши:
       [подпись, действие, вариант?, подсказка?, alt?]
     Действие:
       'ch:x'    — вставить символ
       'cmd:frac'— команда поля (дробь, корень, степень…)
       'fn:sin'  — функция с автоскобкой
       'act:left'— служебное действие
     Вариант оформления: 'tpl' (шаблон-конструкция), 'sys' (служебная).
     alt = [подпись, действие, вариант?] — что показывает та же клавиша при
     включённом ⇧. Это и есть «Shift влияет на действия, а не только на
     регистр буквы»: например sin ⇄ sin⁻¹ на той же клавише. */

  var NUM_TAB = {
    id: 'num', label: '123', title: 'Цифры и основные операции',
    // три зоны в строке: переменные/скобки | цифровой блок | шаблоны
    rows: [
      [['x','ch:x'], ['n','ch:n'],  null, ['7','ch:7'],['8','ch:8'],['9','ch:9'],['÷','ch:÷'],  null, ['e','ch:e'],['i','ch:i'],['π','ch:π']],
      [['<','ch:<'], ['>','ch:>'],  null, ['4','ch:4'],['5','ch:5'],['6','ch:6'],['×','ch:*'],  null, ['□²','cmd:sq','tpl'],['□^□','cmd:sup','tpl'],['√□','cmd:sqrt','tpl']],
      [['(','cmd:paren'], [')','act:out'], null, ['1','ch:1'],['2','ch:2'],['3','ch:3'],['−','ch:-'], null, ['ⁿ√□','cmd:nroot','tpl'],['□/□','cmd:frac','tpl'],['{ }','cmd:cases','tpl','Система']],
      [['⇧','act:shift','sys'], null, null, ['0','ch:0'],['.','ch:.'],['=','ch:='],['+','ch:+'], null, ['‹','act:left','sys'],['›','act:right','sys'],['⌫','act:back','sys']]
    ]
  };

  // ∞≠∈: базовый слой — то, что нужно чаще всего; ⇧ переключает на «глубокий»
  // слой той же клавиши (обратные функции, кванторы вместо принадлежности
  // и т.д.) — вот это и есть настоящее влияние Shift на ДЕЙСТВИЕ клавиши,
  // а не просто регистр буквы.
  var FN_TAB = {
    id: 'fn', label: '∞≠∈', title: 'Функции, знаки и конструкции',
    rows: [
      [['sin','fn:sin', null, null, ['sin⁻¹','fn:asin']],
       ['ln','fn:ln'],
       ['abs','cmd:abs','tpl'],
       ['→','ch:→', null, null, ['⇒','ch:⇒']],
       ['≠','ch:≠'],
       ['∈','ch:∈', null, null, ['∀','ch:∀']],
       ['∪','ch:∪'],
       ['∫','cmd:int','tpl'],
       ['lim','cmd:lim','tpl'],
       ['e','ch:e']],
      [['cos','fn:cos', null, null, ['cos⁻¹','fn:acos']],
       ['log','fn:log'],
       ['|□|','cmd:abs','tpl'],
       ['≤','ch:≤'],
       ['∉','ch:∉', null, null, ['∃','ch:∃']],
       ['∋','ch:∋'],
       ['∩','ch:∩'],
       ['∑','cmd:sum','tpl'],
       ['∏','cmd:prod','tpl'],
       ['π','ch:π']],
      [['tan','fn:tan', null, null, ['tan⁻¹','fn:atan']],
       ['exp','fn:exp'],
       ['‖□‖','cmd:norm','tpl'],
       ['≥','ch:≥'],
       ['⊂','ch:⊂', null, null, ['⊆','ch:⊆']],
       ['≈','ch:≈'],
       ['□̄','cmd:bar','tpl'],
       ['□⃗','cmd:vec','tpl'],
       ['□′','ch:′'],
       ['∞','ch:∞']],
      [['⇧','act:shift','sys'],[',','ch:,'],[':','ch::'],['·','ch:*'],
       ['{ }','cmd:cases','tpl','Система'],
       null,null,
       ['‹','act:left','sys'],['›','act:right','sys'],['⌫','act:back','sys'],['↵','act:enter','sys']]
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

  // «Сжатый» режим: одна фиксированная сетка вместо вкладок — только то, что
  // нужно почти всегда (цифры, четыре действия, скобки, «=», навигация).
  // Никакого Shift здесь нет — сжимать нечего (букв не показываем вовсе).
  var COMPACT_ROWS = [
    [['7', 'ch:7'], ['8', 'ch:8'], ['9', 'ch:9'], ['÷', 'ch:÷']],
    [['4', 'ch:4'], ['5', 'ch:5'], ['6', 'ch:6'], ['×', 'ch:*']],
    [['1', 'ch:1'], ['2', 'ch:2'], ['3', 'ch:3'], ['−', 'ch:-']],
    [['(', 'cmd:paren'], ['0', 'ch:0'], ['.', 'ch:.'], ['+', 'ch:+']],
    [[')', 'act:out'], ['=', 'ch:='], ['⌫', 'act:back', 'sys'], ['↵', 'act:enter', 'sys']]
  ];

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
    ['Ctrl+{',       'система уравнений/неравенств'],
    ['← →',          'курсор; на границе заходит внутрь дроби/корня'],
    ['↑ ↓',          'между числителем и знаменателем, показателем и корнем; между строками системы'],
    ['Shift+← →',    'выделение символов'],
    ['Ctrl+A',       'выделить всю строку'],
    ['Ctrl+C / X / V', 'копировать / вырезать / вставить'],
    ['Tab',          'следующее ПУСТОЕ поле — быстро заполнять шаблоны'],
    ['Shift+Tab',    'предыдущее поле'],
    ['Enter (в системе)', 'добавить ещё одну строку-уравнение'],
    ['Backspace',    'удалить символ; на дроби/корне/степени и т.п. сначала заходит внутрь — сносит структуру, только когда все её поля уже пусты'],
    ['Delete',       'удалить символ справа от курсора'],
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
    // «Сжатая» клавиатура — ОТДЕЛЬНО от collapsed (то прячет клавиатуру
    // целиком). Здесь клавиатура остаётся видимой, но показывает только
    // горстку самых частых символов вместо всех вкладок — аналог
    // сворачивания поля ввода в Обычном калькуляторе, только для клавиатуры.
    this.compact = !!opts.compact;
    this.onEnter = opts.onEnter || function () {};
    // Знак системы «{ }» нужен не везде: в построителе графиков, конверторе
    // и т.п. он бессмыслен. По умолчанию доступен; можно отключить точечно.
    this.allowSystem = opts.allowSystem !== false;
    // Мнимая единица — противоположная логика по умолчанию (allowSystem
    // включён везде, кроме явных исключений; allowComplex выключен везде,
    // кроме явного включения) — большинство калькуляторов вообще не умеют
    // считать с i, поэтому кнопка должна быть скрыта по умолчанию, а не
    // просто задизейблена «на всякий случай».
    this.allowComplex = !!opts.allowComplex;
    host.classList.add('mfkb');
    this._build();
    this._bindPhysical();
    // Ввод может идти и с физической клавиатуры (не только с этих кнопок) —
    // подцепляемся к onChange самого поля, чтобы кнопка системы гасла/включалась
    // в реальном времени независимо от того, откуда пришёл символ.
    var self = this, origOnChange = field.onChange;
    field.onChange = function () {
      self._refreshCasesState();
      return origOnChange.apply(field, arguments);
    };
  }

  MFKeyboard.prototype._build = function () {
    var self = this;
    this.host.innerHTML = '';

    // ---- полоса вкладок + служебные кнопки справа
    var bar = document.createElement('div');
    bar.className = 'mfkb-bar';

    var tabs = document.createElement('div');
    tabs.className = 'mfkb-tabs';
    if (!this.compact) {
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
    }
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

    var compactBtn = document.createElement('button');
    compactBtn.type = 'button';
    compactBtn.className = 'mfkb-icon mfkb-compact' + (this.compact ? ' on' : '');
    compactBtn.title = this.compact ? 'Показать все символы' : 'Оставить только частые символы';
    compactBtn.setAttribute('aria-pressed', String(this.compact));
    // Тот же язык иконки, что у сворачивания поля ввода в Обычном калькуляторе
    // (стрелки внутрь/наружу) — визуально узнаваемая пара «сжать/развернуть».
    compactBtn.innerHTML = this.compact
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    compactBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    compactBtn.addEventListener('click', function () { self.compact = !self.compact; self.shift = false; self._build(); });
    side.appendChild(compactBtn);

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
    var rows;
    if (this.compact) {
      pad.dataset.tab = 'compact';
      rows = COMPACT_ROWS;
    } else {
      var t = TABS[this.tab];
      pad.dataset.tab = t.id;
      rows = t.rows;
    }

    rows.forEach(function (rowDef) {
      var r = document.createElement('div');
      r.className = 'mfkb-row';
      rowDef.forEach(function (kd) {
        if (!kd) {                      // null = распорка между зонами
          var sp = document.createElement('span');
          sp.className = 'mfkb-spacer';
          r.appendChild(sp);
          return;
        }
        var keyEl = self._key(kd);
        if (keyEl) r.appendChild(keyEl);
      });
      pad.appendChild(r);
    });

    this.host.appendChild(pad);
    this.host.classList.toggle('mfkb-collapsed', this.collapsed);
    this.host.classList.toggle('mfkb-compact', this.compact);
  };

  MFKeyboard.prototype._key = function (kd) {
    var self = this;
    // Если Shift активен и у клавиши есть alt-тройка [label, action, variant] —
    // используем её целиком: это и есть «Shift меняет действие», а не только
    // регистр буквы (см. sin ⇄ sin⁻¹, → ⇄ ⇒ и т.д.).
    var alt = kd[4];
    var useAlt = this.shift && alt;
    var label = useAlt ? alt[0] : kd[0];
    var action = useAlt ? alt[1] : kd[1];
    var variant = useAlt ? (alt[2] || kd[2]) : kd[2];
    var hint = kd[3];

    // Глобальный свап ⌫ ↔ 🗑 «очистить всё» при активном Shift — это тоже
    // изменение ДЕЙСТВИЯ клавиши, применяется на всех вкладках одинаково.
    if (!useAlt && action === 'act:back' && this.shift) {
      label = '🗑'; action = 'act:clear';
    }

    var fieldNotEmpty = this.field && this.field.root && this.field.root.k.length > 0;
    // «Просто не должны отображаться» — не приглушённая недоступная кнопка,
    // а полное отсутствие в раскладке. Два случая: мнимая единица в
    // калькуляторе, который её не считает (статично, на весь калькулятор),
    // и знак системы, когда в поле уже что-то введено (динамично, меняется
    // по ходу набора — см. _refreshDynamicKeys ниже, перестраивающую панель
    // целиком при каждом изменении содержимого поля).
    if (action === 'ch:i' && !this.allowComplex) return null;
    if (action === 'cmd:cases' && (!this.allowSystem || fieldNotEmpty)) return null;

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mfkb-key' + (variant ? ' mfkb-' + variant : '') + (action === 'act:clear' ? ' mfkb-danger' : '');
    if (action === 'act:shift' && this.shift) b.classList.add('on');
    if (action === 'cmd:cases') b.setAttribute('data-cases-key', '');

    // с ⇧ показываем заглавный вариант букв (там, где alt не переопределил всё целиком)
    var shown = label;
    if (this.shift && !useAlt && action.indexOf('ch:') === 0) {
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

    {
      // pointerdown вместо click: поле не теряет фокус и курсор не «прыгает»
      var repeatTimer = null, repeatInterval = null;
      var isBackspace = action === 'act:back';
      function stopRepeat() {
        if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null; }
        if (repeatInterval) { clearInterval(repeatInterval); repeatInterval = null; }
      }
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        b.classList.add('press');
        self._fire(action, label);
        setTimeout(function () { b.classList.remove('press'); }, 130);
        // Долгое нажатие на ⌫ — быстрое многократное стирание (привычно на
        // телефонах, где повторно тапать по кнопке неудобно). Только для
        // самого backspace — остальные клавиши от повтора смысла не выигрывают.
        if (isBackspace) {
          repeatTimer = setTimeout(function () {
            repeatInterval = setInterval(function () { self._fire(action, label); }, 55);
          }, 420);
        }
      });
      if (isBackspace) {
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
          b.addEventListener(evt, stopRepeat);
        });
      }
    }
    return b;
  };

  MFKeyboard.prototype._fire = function (action, label) {
    var f = this.field;
    if (!f) return;
    var kind = action.slice(0, action.indexOf(':'));
    var arg = action.slice(action.indexOf(':') + 1);

    if (kind === 'ch') {
      var c = arg;
      // ⇧ теперь удерживается (не гаснет после одного символа): раз она ещё
      // отвечает за альтернативные действия и за 🗑, автосброс после первой
      // же буквы был бы неожиданным (набирая «SIN» заглавными, S дал бы
      // заглавную, а I и N — снова строчные). Возврат к обычному регистру —
      // повторным нажатием на ⇧.
      if (this.shift && SHIFT_MAP[c]) { c = SHIFT_MAP[c]; }
      if (f.sel) f._deleteSelection();
      f.insertChars(c);
    } else if (kind === 'fn') {
      if (f.sel) f._deleteSelection();
      f.insertFunc(arg);
    } else if (kind === 'cmd') {
      if (f.sel) f._deleteSelection();
      if (arg === 'sq') { f.cmd('sup'); f.insertChars('2'); }   // готовый квадрат
      else f.cmd(arg);
    } else if (kind === 'act') {
      switch (arg) {
        case 'back':  f.backspace(); break;
        case 'clear': f.clear(); break;                          // 🗑 очистить всё поле
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
    this._refreshCasesState();
  };

  // Знак системы теперь либо есть в раскладке, либо его нет (не просто
  // серый/активный) — проверяем, совпадает ли текущее присутствие кнопки с
  // тем, что должно быть при нынешнем содержимом поля, и перестраиваем
  // клавиатуру ТОЛЬКО если это реально изменилось (не на каждое нажатие —
  // печатать второй символ в уже непустое поле не должно ничего трогать).
  MFKeyboard.prototype._refreshCasesState = function () {
    var f = this.field;
    if (!f || !this.allowSystem) return;   // allowSystem-блокировка не меняется на лету — её обновлять не нужно
    var shouldShow = !(f.root && f.root.k.length > 0);
    var isShown = !!this.host.querySelector('[data-cases-key]');
    if (shouldShow !== isShown) this._build();
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
        '4': 'int',
        '{': 'cases'
      };
      if (map[k] === 'cases' && !self.allowSystem) return;
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
      '<li><kbd>⇧</kbd> на экранной клавиатуре — не только заглавные буквы: на вкладке ' +
      '«∞≠∈» она открывает второй слой той же клавиши (sin ⇄ sin⁻¹), а на любой ' +
      'вкладке подменяет <kbd>⌫</kbd> на 🗑 — очистить всё поле одним нажатием.</li>' +
      '<li><b>÷</b> и <b>дробь</b> — разные клавиши: ÷ вставляет знак деления в строку ' +
      '(как в примере 2÷3), а «□/□» строит настоящую дробь с числителем и знаменателем.</li>' +
      '<li>«{ }» строит систему уравнений/неравенств: две строки сразу, ещё одну добавляет ' +
      '<kbd>Enter</kbd> внутри неё. В калькуляторах, где система не нужна (например, ' +
      'построитель графиков), эта клавиша выключена.</li>' +
      '<li>Значок со стрелками рядом со знаком вопроса сворачивает клавиатуру до самых ' +
      'частых символов (цифры, четыре действия, скобки) — удобно, когда редкие ' +
      'символы только мешают. Полный набор возвращается тем же значком.</li>' +
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