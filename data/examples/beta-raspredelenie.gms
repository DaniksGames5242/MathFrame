[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// Плотность Beta(a; b) на [0; 1] (x от 0 до 1 занимает всю ширину поля). Зелёная точка на оси — среднее,
// зелёный отрезок под осью — среднее ± σ. Точка A задаёт x, синие столбики — P(X ≤ x).
float a = 2; float b = 5; float y0 = -4.5; float ky = 6;
float key = -99; float xv = 0.4; float pc = 0; float mn = 0; float sg = 0;
string info = "";

Function fb(x) { return pow(x, a - 1) * pow(1 - x, b - 1) * gamma(a + b) / (gamma(a) * gamma(b)); }
func dens(X) = y0 + min(ky * fb((X + 10) / 20), 10.4);
draw Function { name = "gd"; f = "dens"; xmin = -10; xmax = 10; thickness = 3; layer = 30 }
draw Graph { name = "gB"; graph = "gb"; nodeRadius = 0; edgeWidth = 4.2; edgeCap = butt; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Graph { name = "gA"; graph = "ga"; nodeRadius = 0; edgeWidth = 1; edgeColor = #3b82f677; labels = false; interactive = false; showWeights = false; layer = 5 }
draw Graph { name = "gM"; graph = "gm"; nodeRadius = 0; edgeWidth = 2; labels = false; interactive = false; showWeights = false; layer = 40 }
new Point { name = "A"; pos = (-2, -4.5); pauseOnDrag = false; collideWithPoints = false; color = #3b82f6 }
new Point { name = "M"; pos = (-3.7, -4.5); dynamic = false; collision = false; color = #22c55e }
draw Text { name = "tX"; pos = (A.pos.x, y0 - 0.6); text = "x"; size = 0.95; color = #3b82f6 }
draw Text { name = "x0"; pos = (-9.6, y0 - 1.1); text = "0"; size = 0.7 }
draw Text { name = "x1"; pos = (0, y0 - 1.1); text = "0.5"; size = 0.7 }
draw Text { name = "x2"; pos = (9.6, y0 - 1.1); text = "1"; size = 0.7 }

new UI { type = slider; label = "a (форма)"; variable = a; min = 0.5; max = 8; step = 0.5; default = 2 }
new UI { type = slider; label = "b (форма)"; variable = b; min = 0.5; max = 8; step = 0.5; default = 5 }

// I_x(a; b) = P(X ≤ x): ряд x^a(1 − x)^b / (a·B(a; b)) · Σ (a + b)ₙ/(a + 1)ₙ · xⁿ, для x > ½ — по симметрии
Function ib0(x, p, q) {
  float term = 1; float s = 1;
  repeat (150) { term = term * (p + q + i) / (p + 1 + i) * x; s = s + term; }
  return pow(x, p) * pow(1 - x, q) * gamma(p + q) / (gamma(p) * gamma(q) * p) * s;
}
Function ib(x) { if (x <= 0.5) { return ib0(x, a, b); } return 1 - ib0(1 - x, b, a); }
Function pkv() {
  if (a > 1 && b > 1) { return fb((a - 1) / (a + b - 2)); }
  return max(fb(0.5), max(fb(0.15), fb(0.85)));
}
Update {
  if (abs(A.pos.y - y0) > 0.0001) { A.pos.y = y0; }
  if (A.pos.x < -9.6) { A.pos.x = -9.6; }
  if (A.pos.x > 9.6) { A.pos.x = 9.6; }
  xv = (A.pos.x + 10) / 20;
  mn = a / (a + b); sg = sqrt(a * b / ((a + b) * (a + b) * (a + b + 1)));
  ky = 6.5 / pkv();
  if (key != A.pos.x * 100 + a * 0.1 + b * 0.001) {
    gb = newGraph(); ga = newGraph(); gm = newGraph();
    addNode(ga, "l", [-10, y0]); addNode(ga, "r", [10, y0]); addEdge(ga, "l", "r");
    repeat (5) { float tx = -10 + 5 * i; addNode(ga, "t" + format(i, 0), [tx, y0 - 0.15]); addNode(ga, "u" + format(i, 0), [tx, y0 + 0.15]); addEdge(ga, "t" + format(i, 0), "u" + format(i, 0)); }
    repeat (200) {
      float x = -9.95 + 0.1 * i; string id = format(i, 0);
      if (x < A.pos.x) {
        addNode(gb, "a" + id, [x, y0]); addNode(gb, "b" + id, [x, y0 + min(10.4, ky * fb((x + 10) / 20))]); addEdge(gb, "a" + id, "b" + id, 1, "#3b82f6");
      }
    }
    addNode(gm, "s1", [-10 + 20 * max(0, mn - sg), y0 - 0.5]); addNode(gm, "s2", [-10 + 20 * min(1, mn + sg), y0 - 0.5]); addEdge(gm, "s1", "s2", 1, "#22c55e");
    if (abs(M.pos.x - (-10 + 20 * mn)) > 0.0001) { M.pos.x = -10 + 20 * mn; }
    pc = ib(xv);
    key = A.pos.x * 100 + a * 0.1 + b * 0.001;
  }
  string sh = "симметрична относительно ½"; if (a > b) { sh = "смещена вправо (a > b)"; } if (a < b) { sh = "смещена влево (a < b)"; }
  string md = "мода " + format((a - 1) / (a + b - 2), 3);
  if (a <= 1 && b > 1) { md = "мода 0 (плотность убывает)"; }
  if (a > 1 && b <= 1) { md = "мода 1 (плотность растёт)"; }
  if (a < 1 && b < 1) { md = "моды нет: U-образная, пики на границах"; }
  if (a == 1 && b == 1) { md = "плотность постоянна — равномерное распределение"; }
  info = "**Бета-распределение** Beta(a; b) с a = **" + format(a, 1) + "**, b = **" + format(b, 1) + "** живёт на отрезке [0; 1]: плотность ∝ xᵃ⁻¹(1 − x)ᵇ⁻¹ при 0 < x < 1, вне отрезка равна 0. Форма " + sh + ", " + md + ".\n\n";
  info = info + "**Среднее** a/(a + b) = **" + format(mn, 3) + "** (зелёная точка), **дисперсия** ab/((a + b)²(a + b + 1)) = **" + format(sg * sg, 4) + "**, σ = " + format(sg, 3) + ". При том же отношении a : b и растущей сумме a + b кривая сжимается к среднему.\n\n";
  info = info + "При x = **" + format(xv, 3) + "** вероятность P(X ≤ x) = **" + format(pc, 4) + "** (синие столбики).";
}
]
