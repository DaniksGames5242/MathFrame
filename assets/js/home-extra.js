/* Главная: живой график, задача дня, факты, появление разделов */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- живой график ---------- */
  var FN = {
    parab: { f: 'y = a·(x − b)² + c', p: [['a', -2, 2, .01, 1], ['b', -4, 4, .01, 0], ['c', -4, 4, .01, -1]],
      y: function (x, a, b, c) { return a * (x - b) * (x - b) + c; },
      vx: function (v) { return v[1]; },
      note: 'a — «ширина» и направление ветвей, b и c сдвигают вершину.' },
    sin: { f: 'y = a·sin(b·x + c)', p: [['a', -3, 3, .01, 2], ['b', .2, 4, .01, 1], ['c', -3.14, 3.14, .01, 0]],
      y: function (x, a, b, c) { return a * Math.sin(b * x + c); },
      note: 'a — амплитуда, b меняет период 2π/b, c — фазовый сдвиг.' },
    lin: { f: 'y = a·x + b', p: [['a', -4, 4, .01, .5], ['b', -4, 4, .01, 1]],
      y: function (x, a, b) { return a * x + b; },
      note: 'a — угловой коэффициент (тангенс угла наклона), b — точка на оси y.' },
    exp: { f: 'y = a · bˣ', p: [['a', -3, 3, .01, 1], ['b', .1, 3, .01, 1.5]],
      y: function (x, a, b) { return a * Math.pow(b, x); },
      note: 'При b > 1 функция растёт, при 0 < b < 1 — убывает, при b = 1 — постоянна.' }
  };
  var plot = $('#hxPlot');
  if (plot) {
    var svg = $('svg', plot), path = $('.fn', svg), sl = $('#hxSliders'), fx = $('#hxFormula'), note = $('#hxNote');
    var W = 400, H = 260, S = 25, cur = '';
    var g = '';
    for (var i = 0; i <= W; i += S) g += '<line class="gr" x1="' + i + '" y1="0" x2="' + i + '" y2="' + H + '"/>';
    for (var j = 5; j <= H; j += S) g += '<line class="gr" x1="0" y1="' + j + '" x2="' + W + '" y2="' + j + '"/>';
    g += '<line class="ax" x1="0" y1="' + H / 2 + '" x2="' + W + '" y2="' + H / 2 + '"/><line class="ax" x1="' + W / 2 + '" y1="0" x2="' + W / 2 + '" y2="' + H + '"/>';
    svg.insertAdjacentHTML('afterbegin', g);
    /* Значения плавно догоняют ползунки (rAF), график строится по каждому пикселю. */
    var shown = null, raf = 0, dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'dot'); dot.setAttribute('r', 4.5); svg.appendChild(dot);
    var target = function () { return [].map.call(sl.querySelectorAll('input'), function (n) { return +n.value; }); };
    var render = function (v) {
      var d = FN[cur], pts = [], pen = false;
      for (var px = 0; px <= W; px += 1) {
        var x = (px - W / 2) / S, py = H / 2 - d.y.apply(null, [x].concat(v)) * S;
        if (!isFinite(py) || py < -H || py > 2 * H) { pen = false; continue; }
        pts.push((pen ? 'L' : 'M') + px + ' ' + py.toFixed(2)); pen = true;
      }
      path.setAttribute('d', pts.join(''));
      var vy = H / 2 - d.y.apply(null, [d.vx ? d.vx(v) : 0].concat(v)) * S;
      dot.setAttribute('cx', W / 2 + (d.vx ? d.vx(v) : 0) * S); dot.setAttribute('cy', vy);
      dot.style.opacity = vy > 0 && vy < H ? 1 : 0;
      [].forEach.call(sl.querySelectorAll('output'), function (o, k) { o.textContent = (+target()[k].toFixed(2)).toString().replace('.', ','); });
    };
    var tick = function () {
      var t = target(), done = true;
      shown = shown && shown.length === t.length ? shown : t.slice();
      for (var k = 0; k < t.length; k++) {
        var diff = t[k] - shown[k];
        if (Math.abs(diff) > 1e-4) { shown[k] += diff * .22; done = false; } else shown[k] = t[k];
      }
      render(shown);
      raf = done ? 0 : requestAnimationFrame(tick);
    };
    var draw = function () { if (!raf) raf = requestAnimationFrame(tick); };
    var pick = function (k) {
      var first = !cur || cur === k && !sl.children.length; cur = k; var d = FN[k];
      fx.classList.add('sw'); setTimeout(function () { fx.textContent = d.f; fx.classList.remove('sw'); }, first ? 0 : 200);
      note.textContent = d.note; shown = null;
      sl.innerHTML = d.p.map(function (p) {
        return '<div class="hx-sl"><label for="hx-' + p[0] + '">' + p[0] + '</label><input id="hx-' + p[0] + '" type="range" min="' + p[1] + '" max="' + p[2] + '" step="' + p[3] + '" value="' + p[4] + '"><output></output></div>';
      }).join('');
      [].forEach.call(plot.querySelectorAll('.hx-tab'), function (b) { b.setAttribute('aria-pressed', b.dataset.fn === k); });
      draw();
    };
    sl.addEventListener('input', draw);
    plot.addEventListener('click', function (e) { var b = e.target.closest('.hx-tab'); if (b) pick(b.dataset.fn); });
    pick('parab');
  }

  /* ---------- задача дня ---------- */
  var TASKS = [
    ['Сумма всех натуральных чисел от 1 до 100?', ['5050', '5000', '10100', '4950'], 0, 'Гаусс: пары 1+100, 2+99, … — 50 пар по 101.'],
    ['Сколько диагоналей у шестиугольника?', ['6', '9', '12', '15'], 1, 'n(n − 3)/2 = 6·3/2 = 9.'],
    ['Чему равно 0,999… (девять в периоде)?', ['меньше 1', 'ровно 1', 'не определено', '0,99'], 1, 'x = 0,999…, 10x − x = 9, значит x = 1.'],
    ['Последняя цифра числа 2¹⁰⁰?', ['2', '4', '6', '8'], 2, 'Последние цифры степеней двойки повторяются: 2, 4, 8, 6. 100 делится на 4 → 6.'],
    ['Сумма углов выпуклого пятиугольника?', ['360°', '480°', '540°', '720°'], 2, '(n − 2)·180° = 3·180° = 540°.'],
    ['Сколько способов рассадить 4 человек в ряд?', ['8', '16', '24', '12'], 2, '4! = 4·3·2·1 = 24.'],
    ['Площадь круга радиуса 2?', ['2π', '4π', '8π', 'π'], 1, 'S = πr² = 4π.'],
    ['Корни уравнения x² − 5x + 6 = 0?', ['1 и 6', '2 и 3', '−2 и −3', '−1 и 6'], 1, 'По Виету: сумма 5, произведение 6 → 2 и 3.'],
    ['Чему равно log₂ 64?', ['5', '6', '8', '32'], 1, '2⁶ = 64.'],
    ['Сколько граней у куба?', ['4', '6', '8', '12'], 1, 'Шесть квадратных граней, 8 вершин и 12 рёбер: 8 − 12 + 6 = 2 (формула Эйлера).']
  ];
  var task = $('#hxTask');
  if (task) {
    var day = Math.floor(Date.now() / 864e5), idx = day % TASKS.length;
    var show = function (i) {
      var t = TASKS[i];
      $('.q', task).textContent = t[0];
      $('.hx-expl', task).hidden = true;
      $('.hx-opts', task).innerHTML = t[1].map(function (o, k) { return '<button type="button" class="hx-opt" data-k="' + k + '">' + o + '</button>'; }).join('');
      $('#hxTaskNum', task).textContent = i === day % TASKS.length ? 'задача дня' : 'задача ' + (i + 1) + ' из ' + TASKS.length;
    };
    task.addEventListener('click', function (e) {
      var b = e.target.closest('.hx-opt');
      if (b) {
        var t = TASKS[idx], k = +b.dataset.k;
        if (k === t[2]) {
          b.classList.add('ok'); var ex = $('.hx-expl', task); ex.textContent = 'Верно! ' + t[3]; ex.hidden = false;
          [].forEach.call(task.querySelectorAll('.hx-opt'), function (x) { x.disabled = true; });
        } else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); }
      }
      if (e.target.closest('#hxNext') && !task.classList.contains('out')) {
        /* старая задача уезжает влево, новая въезжает справа */
        idx = (idx + 1) % TASKS.length;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return show(idx);
        task.classList.add('out');
        setTimeout(function () { show(idx); task.classList.remove('out'); task.classList.add('enter');
          setTimeout(function () { task.classList.remove('enter'); }, 600); }, 260);
      }
    });
    show(idx);
  }

  /* ---------- факты ---------- */
  var FACTS = [
    ['e<sup>iπ</sup> + 1 = 0', 'Тождество Эйлера связывает пять главных констант математики.'],
    ['π ≈ 3,14159…', 'Знаки π никогда не повторяются периодически: число иррационально.'],
    ['23', 'Уже в группе из 23 человек вероятность совпадения дней рождения больше 50 %.'],
    ['∞ ≠ ∞', 'Действительных чисел «больше», чем натуральных — доказал Кантор диагональным методом.'],
    ['φ ≈ 1,618', 'Золотое сечение — предел отношения соседних чисел Фибоначчи.'],
    ['4 цвета', 'Любую карту можно раскрасить в 4 цвета так, чтобы соседи различались.'],
    ['1 + 2 + 3 + …', 'Ряд расходится, но в физике ему иногда приписывают значение −1/12.'],
    ['V − E + F = 2', 'Для любого выпуклого многогранника: вершины − рёбра + грани = 2.'],
    ['√2', 'Первое известное иррациональное число — диагональ единичного квадрата.']
  ];
  var facts = document.querySelectorAll('.hx-fact');
  if (facts.length) {
    var fi = Math.floor(Math.random() * FACTS.length);
    var put = function (el) {
      var f = FACTS[fi++ % FACTS.length];
      $('.big', el).innerHTML = f[0]; $('p', el).textContent = f[1];
      el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
    };
    [].forEach.call(facts, function (el) {
      put(el);
      el.addEventListener('click', function () { put(el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); put(el); } });
    });
  }

  /* ---------- появление при прокрутке ---------- */
  var rv = document.querySelectorAll('.hx-reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    [].forEach.call(rv, function (n) { io.observe(n); });
  } else [].forEach.call(rv, function (n) { n.classList.add('in'); });

  /* кнопка регистрации в финальном блоке повторяет верхнюю */
  /* и прячется вместе с ней, когда пользователь вошёл */
  var cr = $('#hxRegister'), rb = $('#registerBtn');
  if (cr && rb) {
    cr.addEventListener('click', function (e) { e.preventDefault(); rb.click(); });
    var sync = function () { cr.style.display = rb.style.display === 'none' ? 'none' : ''; };
    sync(); new MutationObserver(sync).observe(rb, { attributes: true, attributeFilter: ['style'] });
  }
  /* порядковые задержки появления карточек */
  [].forEach.call(document.querySelectorAll('.hx-reveal'), function (sec) {
    [].forEach.call(sec.querySelectorAll('.hx-card'), function (c, i) { if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); });
  });
})();
