[
description = "{info}"

field width = 20;
field height = 8;
camera type = fixed;
show axis x = true;

// ---- Координатная прямая: невидимая направляющая, по которой ходят точки ----
new Point { name = "L1"; pos = (-9.5, 0); dynamic = false; active = false }
new Point { name = "L2"; pos = (9.5, 0); dynamic = false; active = false }
new Line { name = "axisLine"; pos = (L1, L2); active = false; interact = false }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("0") }

// Числа a и b — две перетаскиваемые точки (общие для всех вкладок)
new Point { name = "A"; line = "axisLine"; t = 0.2895; text = true("a"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "B"; line = "axisLine"; t = 0.8; text = true("b"); pauseOnDrag = false; collideWithPoints = false }

// ---- Вкладка 1: модуль — расстояние до нуля; у противоположных чисел модули равны ----
new Point { name = "A2"; pos = (4, 0); dynamic = false; collision = false; text = true("−a") }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; thickness = 4; interact = false; layer = 12; active = la > 0.02 }
new Line { name = "oa2"; pos = (O, A2); color = #3b82f6; thickness = 4; interact = false; layer = 12; active = la > 0.02 }
draw EquallySing { name = "eqA"; edges = (oa, oa2); type = 1; active = la > 0.02 }
new Claster { name = "tabDef"; elements = (A2, oa, oa2, eqA); active = true }

// ---- Вкладка 2: |a + b| ≤ |a| + |b|; |a·b| = |a|·|b| ----
// Сверху: отрезок длины |a|, к нему приставлен отрезок длины |b|; снизу — отрезок длины |a + b|.
new Point { name = "P1"; pos = (-9.5, 2.8); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (0, 2.8); dynamic = false; collision = false; active = false }
new Point { name = "P3"; pos = (0, 2.8); dynamic = false; collision = false; active = false }
new Point { name = "Q1"; pos = (-9.5, 1.4); dynamic = false; collision = false; active = false }
new Point { name = "Q2"; pos = (0, 1.4); dynamic = false; collision = false; active = false }
new Line { name = "bA"; pos = (P1, P2); color = #3b82f6; thickness = 6; interact = false; layer = 12; active = la > 0.02 }
new Line { name = "bB"; pos = (P2, P3); color = #f59e0b; thickness = 6; interact = false; layer = 12; active = lb > 0.02 }
new Line { name = "bS"; pos = (Q1, Q2); color = #22c55e; thickness = 6; interact = false; layer = 12; active = ls > 0.02 }
draw Text { name = "tA"; pos = (-9.5 + la / 2, 3.5); text = "|a|"; active = la > 0.6 }
draw Text { name = "tB"; pos = (-9.5 + la + lb / 2, 3.5); text = "|b|"; active = lb > 0.6 }
draw Text { name = "tS"; pos = (-9.5 + ls / 2, 2.1); text = "|a + b|"; active = ls > 1.4 }
new Claster { name = "tabSum"; elements = (P1, P2, P3, Q1, Q2, bA, bB, bS, tA, tB, tS); active = false }

// ---- Вкладка 3: |a − b| — расстояние между точками ----
new Line { name = "ab"; pos = (A, B); color = #f59e0b; thickness = 4; interact = false; layer = 12; active = lab > 0.02 }
new Claster { name = "tabDist"; elements = (ab); active = false }

new UI { name = "btnDef"; type = button; label = "Определение"; action = "tab = 1; tabDef.active = true; tabSum.active = false; tabDist.active = false" }
new UI { name = "btnSum"; type = button; label = "Сумма и произведение"; action = "tab = 2; tabDef.active = false; tabSum.active = true; tabDist.active = false" }
new UI { name = "btnDist"; type = button; label = "Расстояние |a − b|"; action = "tab = 3; tabDef.active = false; tabSum.active = false; tabDist.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float la = 0; float lb = 0; float ls = 0; float lab = 0;

Function num(v) {
  float r = round(v * 10) / 10;
  if (r < 0) { return "−" + format(abs(r), 1); }
  return format(abs(r), 1);
}
Function numP(v) {
  if (round(v * 10) / 10 < 0) { return "(" + num(v) + ")"; }
  return num(v);
}

Update {
  float a = A.pos.x;
  float b = B.pos.x;
  la = abs(a); lb = abs(b); ls = abs(a + b); lab = abs(a - b);
  A2.pos.x = -a;
  // Три отрезка вкладки 2 укладываются в поле: |a| + |b| ≤ 19
  P2.pos.x = -9.5 + la; P3.pos.x = -9.5 + la + lb; Q2.pos.x = -9.5 + ls;

  if (tab == 1) {
    string br = "a ≥ 0, поэтому \\(|a| = a\\)";
    if (a < 0) { br = "a < 0, поэтому \\(|a| = -a\\)"; }
    info = "**Модуль числа** — расстояние от нуля до его точки на координатной прямой. Здесь a = " + num(a) + ": " + br + ", \\(|a| = " + num(la) + "\\).\n\n**Неотрицательность:** модуль никогда не меньше нуля и равен нулю только при a = 0. **Симметричность:** у противоположных чисел a и −a модули равны, \\(|" + num(a) + "| = |" + num(-a) + "| = " + num(la) + "\\).\n\nМодуль не меньше самого числа, \\(|a| \\ge a\\), и связан с квадратом: \\(|a| = \\sqrt{a^{2}} = \\sqrt{" + num(a * a) + "} = " + num(la) + "\\).";
  } else if (tab == 2) {
    string eq = "знаки a и b различны, часть величины взаимно уничтожается, поэтому модуль суммы строго меньше";
    if (a * b >= 0) { eq = "знаки a и b одинаковы (или одно из чисел равно нулю), поэтому достигается равенство"; }
    info = "**Модуль суммы:** \\(|a + b| = |" + num(a) + " + " + numP(b) + "| = " + num(ls) + "\\), а \\(|a| + |b| = " + num(la) + " + " + num(lb) + " = " + num(la + lb) + "\\). Здесь " + eq + ": \\(|a + b| \\le |a| + |b|\\).\n\n**Модуль произведения и частного:** \\(|a \\cdot b| = |a| \\cdot |b| = " + num(la) + " \\cdot " + num(lb) + " = " + num(la * lb) + "\\)";
    if (lb > 0.05) { info = info + ", \\(\\left|\\dfrac{a}{b}\\right| = \\dfrac{|a|}{|b|} = " + num(la / lb) + "\\)"; }
    info = info + ".";
  } else {
    info = "**Расстояние между точками** с координатами a и b равно \\(|a - b|\\) и не зависит от порядка вычитания: \\(|a - b| = |" + num(a) + " - " + numP(b) + "| = " + num(lab) + "\\), а \\(|b - a| = " + num(abs(b - a)) + "\\).\n\nМодуль устраняет знак разности: расстояние не должно меняться при перестановке точек.";
  }
}
]
