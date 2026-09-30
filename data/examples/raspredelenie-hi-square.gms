[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Синяя кривая — плотность χ²(n); жёлтая — нормальная N(n; 2n) с теми же средним и дисперсией.
// Ось x: 1 единица = 2/3 поля (x от 0 до 30). Точка A задаёт c, столбики — P(X ≤ c).
float n = 3; float sx = 0.6667; float y0 = -4.5; float ky = 10;
float key = -99; float cv = 5; float pc = 0;
string info = "";

func dens(X) = y0 + min(ky * pow((X + 10) / sx, n / 2 - 1) * exp(-(X + 10) / sx / 2) / (pow(2, n / 2) * gamma(n / 2)), 10.2);
func nrm(X) = y0 + ky * exp(-((X + 10) / sx - n) * ((X + 10) / sx - n) / (4 * n)) / sqrt(4 * pi * n);
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Function { name = "gn"; f = "nrm"; xmin = -10; xmax = 10; thickness = 2; color = #f59e0b; layer = 25 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; nodeRadius = 0; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (-6.7, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
draw Text { name = "tC"; pos = (A.pos.x, y0 - 0.55); text = "c"; size = 0.95; color = #3b82f6 }
draw Text { name = "tN"; pos = (-10 + sx * n, y0 - 1.5); text = "n"; size = 0.9; color = #22c55e }
draw Text { name = "x0"; pos = (-9.6, y0 - 0.3); text = "0"; size = 0.7 }
draw Text { name = "x1"; pos = (-10 + 10 * sx, y0 - 0.3); text = "10"; size = 0.7 }
draw Text { name = "x2"; pos = (-10 + 20 * sx, y0 - 0.3); text = "20"; size = 0.7 }
draw Text { name = "x3"; pos = (9.5, y0 - 0.3); text = "30"; size = 0.7 }

new UI { type = slider; label = "n (степени свободы)"; variable = n; min = 1; max = 12; step = 1; default = 3 }

// P(X ≤ c) для χ²(n): регулярная неполная гамма P(n/2; c/2), ряд Σ z^k / Γ(a + k + 1)
Function rgam(a, z) { float term = 1 / gamma(a + 1); float s = term; repeat (150) { term = term * z / (a + i + 1); s = s + term; } return pow(z, a) * exp(-z) * s; }
Function fchi(x) { return pow(x, n / 2 - 1) * exp(-x / 2) / (pow(2, n / 2) * gamma(n / 2)); }
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < -9.5) { A.pos.x = -9.5; }
  if (A.pos.x > 9.2) { A.pos.x = 9.2; }
  cv = (A.pos.x + 10) / sx;
  float pk = 0.5; if (n > 2) { pk = fchi(n - 2); }
  ky = 6.5 / pk;
  if (key != A.pos.x * 100 + n) {
    gb = newGraph(); ga = newGraph(); gm = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (7) { float tx = -10 + 5 * sx * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (x < A.pos.x) {
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + min(10.2, ky * fchi((x + 10) / sx))]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6");
      }
    }
    // среднее n и отрезок n ± σ, σ = √(2n)
    float sg = sqrt(2 * n);
    addNode(gm, "m1", [-10 + sx * n, y0 - 0.35]); addNode(gm, "m2", [-10 + sx * n, y0 + 0.35]); addEdge(gm, "m1", "m2", 1, "#22c55e");
    addNode(gm, "s1", [-10 + sx * max(0, n - sg), y0 - 1]); addNode(gm, "s2", [-10 + sx * min(29.9, n + sg), y0 - 1]); addEdge(gm, "s1", "s2", 1, "#22c55e");
    pc = rgam(n / 2, cv / 2);
    key = A.pos.x * 100 + n;
  }
  float sk = sqrt(8 / n);
  info = "**Распределение хи-квадрат** с n = **" + format(n, 0) + "** степенями свободы — закон суммы квадратов n независимых стандартных нормальных величин. Плотность ∝ x^(n/2 − 1)·e^(−x/2) при x > 0.\n\n";
  info = info + "**Связь с гамма-распределением:** это гамма-распределение с параметром формы n/2 = **" + format(n / 2, 1) + "** и интенсивностью ½. Отсюда математическое ожидание n = **" + format(n, 0) + "**, дисперсия 2n = **" + format(2 * n, 0) + "** (зелёный отрезок n ± √(2n) под осью); асимметрия √(8/n) = **" + format(sk, 2) + "** > 0 убывает с ростом n.\n\n";
  info = info + "При c = **" + format(cv, 2) + "** вероятность P(X ≤ c) = **" + format(pc, 4) + "** (синие столбики). С ростом n кривая всё ближе к жёлтой нормальной N(n; 2n) — центральная предельная теорема. Сумма независимых χ²(n₁) и χ²(n₂) есть χ²(n₁ + n₂).";
}
]
