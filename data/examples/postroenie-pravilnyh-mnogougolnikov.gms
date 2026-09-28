[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Основной метод построения: окружность делится на n равных дуг центральными углами
// 360°/n, точки соединяются по порядку. Точка A перетаскивается по окружности (задаёт
// поворот построения), n — ползунком. Первый центральный угол отмечен дугой. ----
new Point { name = "O"; pos = (0, 0); text = true("O"); dynamic = false; collision = false }
new Circle { name = "w"; center = "O"; radius = 4.5 }
new Point { name = "A"; circle = "w"; t = 0.1; text = true("A") }

new Point { name = "P1"; pos = (4.5, 0); dynamic = false; collision = false; active = false }
new Line { name = "oa"; pos = (O, A); interact = false }
new Line { name = "op1"; pos = (O, P1); interact = false }
new Angle { name = "angC"; lines = (oa, op1) }
draw Angle { name = "arcC"; angle = "angC" }

draw Graph { name = "poly"; graph = "g"; nodeRadius = 0; labels = false; interactive = false; showWeights = false }

new UI { name = "sN"; type = slider; label = "число сторон n"; variable = n; min = 3; max = 17; step = 1; default = 6 }

// ---- Логика ----
float n = 6;
float key = -1;
string info = "";

// Проверка критерия Гаусса — Ванцеля для n от 3 до 17: n построим, если после деления
// на все степени двойки остаётся 1 либо произведение различных простых чисел Ферма
// (в этом диапазоне — 3, 5, 17 и их произведение 15).
Function oddOk(v) { return v == 1 || v == 3 || v == 5 || v == 15 || v == 17; }
Function constructible(m) {
  float v = m;
  repeat (6) { if (v > 1 && v - 2 * floor(v / 2) == 0) { v = v / 2; } }
  return oddOk(v);
}

Update {
  float ang0 = atan2(A.pos.y, A.pos.x);
  if (key != n * 1000 + round(ang0 * 500)) {
    g = newGraph();
    repeat (n) {
      float a1 = ang0 + 2 * pi * i / n;
      addNode(g, "p" + format(i, 0), [4.5 * cos(a1), 4.5 * sin(a1)]);
    }
    repeat (n) {
      float j = i + 1; if (j >= n) { j = 0; }
      addEdge(g, "p" + format(i, 0), "p" + format(j, 0));
    }
    float a1 = ang0 + 2 * pi / n;
    P1.pos.x = 4.5 * cos(a1); P1.pos.y = 4.5 * sin(a1);
    key = n * 1000 + round(ang0 * 500);
  }

  float centralDeg = 360 / n;
  info = "**Основной метод.** Окружность делится на n равных дуг центральными углами 360°/n; соединяя полученные точки по порядку, получаем правильный n-угольник. Здесь n = " + format(n, 0) + ", центральный угол = " + format(centralDeg, 1) + "° (отмечен дугой между OA и следующей вершиной).\n\n";
  if (constructible(n)) { info = info + "**Строится циркулем и линейкой** — по критерию Гаусса — Ванцеля n = " + format(n, 0) + " раскладывается в произведение степени двойки и различных простых чисел Ферма (3, 5, 17, …)."; }
  else { info = info + "**Не строится циркулем и линейкой** — n = " + format(n, 0) + " не имеет вид 2ᵐ·p₁·p₂·…, где pᵢ — различные простые числа Ферма; требуются приближённые методы."; }
}
]
