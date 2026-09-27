[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Функция f — парабола через три перетаскиваемые точки P1, P2, P3 ----
new Point { name = "P1"; pos = (-5, 1); text = true("P₁"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "P2"; pos = (0, 3.5); text = true("P₂"); pauseOnDrag = false; color = #3b82f6 }
new Point { name = "P3"; pos = (5, 2); text = true("P₃"); pauseOnDrag = false; color = #3b82f6 }
func f(x) = P1.pos.y * (x - P2.pos.x) * (x - P3.pos.x) / ((P1.pos.x - P2.pos.x) * (P1.pos.x - P3.pos.x)) + P2.pos.y * (x - P1.pos.x) * (x - P3.pos.x) / ((P2.pos.x - P1.pos.x) * (P2.pos.x - P3.pos.x)) + P3.pos.y * (x - P1.pos.x) * (x - P2.pos.x) / ((P3.pos.x - P1.pos.x) * (P3.pos.x - P2.pos.x));
draw Function { name = "gf"; f = "f"; xmin = -8; xmax = 8; segments = 400; color = #3b82f6; thickness = 3 }

// ---- Отрезок [a; b] на оси x ----
new Point { name = "X1"; pos = (-9.5, 0); dynamic = false; active = false; collision = false }
new Point { name = "X2"; pos = (9.5, 0); dynamic = false; active = false; collision = false }
new Line { name = "axisLine"; pos = (X1, X2); active = false; interact = false }
new Point { name = "Pa"; line = "axisLine"; t = 0.316; text = true("a"); pauseOnDrag = false; collideWithPoints = false }
new Point { name = "Pb"; line = "axisLine"; t = 0.763; text = true("b"); pauseOnDrag = false; collideWithPoints = false }

// ---- Прямоугольники интегральной суммы (ступенчатая функция) и точная площадь ----
func step(x) = stepVal(x);
func under(x) = underVal(x);
draw Function { name = "gStep"; f = "step"; xmin = -8; xmax = 8; segments = 1600; color = #f59e0b; thickness = 2; layer = 15 }
draw Function { name = "gUnder"; f = "under"; xmin = -8; xmax = 8; segments = 400; active = false }
draw Filling { name = "fStep"; func = "gStep"; xmin = -8; xmax = 8; segments = 1600; color = #f59e0b; opacity = 0.3 }
draw Filling { name = "fExact"; func = "gUnder"; xmin = -8; xmax = 8; segments = 400; color = #3b82f6; opacity = 0.12 }

new UI { name = "sN"; type = slider; label = "n"; variable = n; min = 1; max = 40; step = 1; default = 6 }
new UI { name = "sM"; type = select; label = "точка ξ"; variable = mode; options = ("left", "mid", "right"); labels = ("левый конец", "середина", "правый конец"); default = "left" }

// ---- Логика ----
float n = 6;
string mode = "left";
float ga = -3; float gb = 5.5;
float sum = 0; float exact = 0;
string info = "";

Function stepVal(x) {
  if (x < ga || x > gb) { return 0; }
  float h = (gb - ga) / n;
  float k = min(floor((x - ga) / h), n - 1);
  float s = 0;
  if (mode == "mid") { s = 0.5; }
  if (mode == "right") { s = 1; }
  return f(ga + (k + s) * h);
}
Function underVal(x) {
  if (x < ga || x > gb) { return 0; }
  return f(x);
}

Update {
  // P1 < P2 < P3 по x (иначе через них не провести функцию), зазор — касание точек
  if (P2.pos.x < P1.pos.x + 0.35) { P2.pos.x = P1.pos.x + 0.35; }
  if (P3.pos.x < P2.pos.x + 0.35) { P3.pos.x = P2.pos.x + 0.35; }
  if (P3.pos.x > fieldMaxX) { P3.pos.x = fieldMaxX; if (P2.pos.x > P3.pos.x - 0.35) { P2.pos.x = P3.pos.x - 0.35; } if (P1.pos.x > P2.pos.x - 0.35) { P1.pos.x = P2.pos.x - 0.35; } }
  // a < b
  if (Pb.pos.x < Pa.pos.x + 0.3) { if (Pb.t > 0.98) { Pa.t = Pb.t - 0.3 / 19; } else { Pb.t = Pa.t + 0.3 / 19; } }
  ga = -9.5 + 19 * Pa.t; gb = -9.5 + 19 * Pb.t;

  float h = (gb - ga) / n;
  float s = 0;
  if (mode == "mid") { s = 0.5; }
  if (mode == "right") { s = 1; }
  sum = 0;
  repeat (n) { sum = sum + f(ga + (i + s) * h) * h; }
  // Точный интеграл параболы — формула Симпсона (для многочленов степени ≤ 3 она точна)
  exact = (gb - ga) / 6 * (f(ga) + 4 * f((ga + gb) / 2) + f(gb));

  info = "**Интегральная сумма Римана:** отрезок [a; b] делится на n частей длины Δx, в каждой выбирается точка ξᵢ, и площади прямоугольников f(ξᵢ)·Δx складываются: σ = Σ f(ξᵢ)·Δx. При n → ∞ суммы стремятся к определённому интегралу ∫ₐᵇ f(x) dx.\n\na = " + format(ga, 2) + ", b = " + format(gb, 2) + ", n = " + format(n, 0) + ", Δx = " + format(h, 3) + ":   σ = " + format(sum, 3) + ",   ∫ₐᵇ f(x) dx = " + format(exact, 3) + ",   погрешность " + format(abs(sum - exact), 3) + ".\n\nПлощадь под осью x входит в сумму со знаком минус.";
}
]
