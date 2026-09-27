[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Пространство элементарных исходов Ω — квадрат, точка выбирается наудачу, вероятность
// события — доля площади. События A и B — круги (центр и точка на окружности перетаскиваются).
// Справа — вероятности столбиками. ----
new Point { name = "W0"; pos = (-7.6, -4.3); dynamic = false; collision = false; active = false }
new Point { name = "W1"; pos = (1, -4.3); dynamic = false; collision = false; active = false }
new Point { name = "W2"; pos = (1, 4.3); dynamic = false; collision = false; active = false }
new Point { name = "W3"; pos = (-7.6, 4.3); dynamic = false; collision = false; active = false }
new Line { name = "w01"; pos = (W0, W1); thickness = 2; interact = false }
new Line { name = "w12"; pos = (W1, W2); thickness = 2; interact = false }
new Line { name = "w23"; pos = (W2, W3); thickness = 2; interact = false }
new Line { name = "w30"; pos = (W3, W0); thickness = 2; interact = false }
draw Text { name = "tO"; pos = (-7.3, 3.8); text = "Ω"; size = 1.5; align = left }
draw Region { name = "rA"; f = "fa"; op = "<"; level = 0; color = #3b82f6; opacity = 0.35; quality = 3 }
draw Region { name = "rB"; f = "fb"; op = "<"; level = 0; color = #f59e0b; opacity = 0.35; quality = 3 }
new Point { name = "A"; pos = (-4.6, 0.8); text = true("A"); pauseOnDrag = false; color = #3b82f6; layer = 60 }
new Point { name = "AR"; pos = (-2.2, 0.8); pauseOnDrag = false; color = #3b82f6; size = 0.7; layer = 60 }
new Point { name = "B"; pos = (-2.4, -1); text = true("B"); pauseOnDrag = false; color = #f59e0b; layer = 60 }
new Point { name = "BR"; pos = (-0.4, -1); pauseOnDrag = false; color = #f59e0b; size = 0.7; layer = 60 }
new Circle { name = "cA"; center = A; radius = AR; color = #3b82f6; thickness = 2 }
new Circle { name = "cB"; center = B; radius = BR; color = #f59e0b; thickness = 2 }
// столбики
draw Graph { name = "gBar"; graph = "gb"; edgeWidth = 18; nodeRadius = 0; labels = false; interactive = false; showWeights = false; layer = 10 }
draw Text { name = "b1"; pos = (2.2, 3.2); text = "P(A) = " + format(pa, 3); size = 1; align = left }
draw Text { name = "b2"; pos = (2.2, 1.9); text = "P(B) = " + format(pb, 3); size = 1; align = left }
draw Text { name = "b3"; pos = (2.2, 0.6); text = "P(A ∩ B) = " + format(pab, 3); size = 1; align = left }
draw Text { name = "b4"; pos = (2.2, -0.7); text = "P(A ∪ B) = " + format(pa + pb - pab, 3); size = 1; align = left }
draw Text { name = "b5"; pos = (2.2, -2.0); text = "P(Ā) = 1 − P(A) = " + format(1 - pa, 3); size = 1; align = left }
draw Text { name = "b6"; pos = (2.2, -3.3); text = "P(Ω) = 1"; size = 1; align = left }

// ---- Логика ----
float pa = 0; float pb = 0; float pab = 0;
float S = 8.6 * 8.6;
string info = "";

Function fa(x, y) { if (x < -7.6 || x > 1 || abs(y) > 4.3) { return 1; } return (x - A.pos.x) ^ 2 + (y - A.pos.y) ^ 2 - ra * ra; }
Function fb(x, y) { if (x < -7.6 || x > 1 || abs(y) > 4.3) { return 1; } return (x - B.pos.x) ^ 2 + (y - B.pos.y) ^ 2 - rb * rb; }
float ra = 2.4; float rb = 2;
// Круг целиком внутри Ω
Function keep(C, Rp) {
  float r0 = sqrt((Rp.pos.x - C.pos.x) ^ 2 + (Rp.pos.y - C.pos.y) ^ 2);
  float r = max(0.4, min(3.6, r0));
  // правим положения только при нарушении — иначе сцена каждый кадр «меняется» и перерисовывается
  if (C.pos.x < -7.6 + r) { C.pos.x = -7.6 + r; } if (C.pos.x > 1 - r) { C.pos.x = 1 - r; }
  if (C.pos.y < -4.3 + r) { C.pos.y = -4.3 + r; } if (C.pos.y > 4.3 - r) { C.pos.y = 4.3 - r; }
  float dx = Rp.pos.x - C.pos.x; float dy = Rp.pos.y - C.pos.y; float d = sqrt(dx * dx + dy * dy) + 0.000001;
  if (abs(d - r) > 0.001) { Rp.pos.x = C.pos.x + r * dx / d; Rp.pos.y = C.pos.y + r * dy / d; }
  return r;
}
// Площадь пересечения двух кругов (линза)
Function lens(r1, r2, d) {
  if (d >= r1 + r2) { return 0; }
  if (d <= abs(r1 - r2)) { return pi * min(r1, r2) ^ 2; }
  float a1 = acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)); float a2 = acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  return r1 * r1 * (a1 - sin(2 * a1) / 2) + r2 * r2 * (a2 - sin(2 * a2) / 2);
}
Function bar(k, y, v, c) { addNode(gb, "a" + k, [2.2, y]); addNode(gb, "b" + k, [2.2 + 5.6 * v, y]); addEdge(gb, "a" + k, "b" + k, 1, c); return 0; }

Update {
  ra = keep(A, AR); rb = keep(B, BR);
  float d = sqrt((A.pos.x - B.pos.x) ^ 2 + (A.pos.y - B.pos.y) ^ 2);
  pa = pi * ra * ra / S; pb = pi * rb * rb / S; pab = lens(ra, rb, d) / S;
  gb = newGraph();
  bar("1", 2.75, pa, "#3b82f6"); bar("2", 1.45, pb, "#f59e0b"); bar("3", 0.15, pab, "#22c55e"); bar("4", -1.15, pa + pb - pab, "#8b5cf6"); bar("5", -2.45, 1 - pa, "#6b7280"); bar("6", -3.75, 1, "#6b7280");

  info = "**Аксиомы Колмогорова** (1933) задают вероятность как функцию P на событиях — подмножествах пространства исходов Ω: (1) P(A) ≥ 0; (2) P(Ω) = 1; (3) счётная аддитивность: для попарно несовместных A₁, A₂, … P(A₁ ∪ A₂ ∪ …) = P(A₁) + P(A₂) + … Всё остальное — теоремы. Например, P(Ā) = 1 − P(A) (так как A и Ā несовместны и дают Ω) и P(A ∪ B) = P(A) + P(B) − P(A ∩ B).\n\nЗдесь P — доля площади квадрата Ω (геометрическая вероятность).  ";
  if (pab < 0.00001) { info = info + "**A и B несовместны:** P(A ∪ B) = P(A) + P(B) = " + format(pa + pb, 3) + " — это в точности третья аксиома."; }
  else { info = info + "A и B пересекаются: P(A) + P(B) = " + format(pa + pb, 3) + " больше P(A ∪ B) = " + format(pa + pb - pab, 3) + " на P(A ∩ B) — общую часть мы посчитали дважды."; }
}
]
