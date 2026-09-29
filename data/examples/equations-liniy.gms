[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;
show grid = true;
show axes = true;

// ---- Прямая Ax + By + C = 0 — общее уравнение линии первой степени. Точка L0 —
// ближайшая к началу координат точка прямой (её координаты пересчитываются в Update
// по формуле проекции), L1, L2 — концы отрезка, которым прямая рисуется через всё
// поле в направлении вектора (−B, A), перпендикулярного нормали (A, B). ----
new Point { name = "L1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "L2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ln"; pos = (L1, L2); interact = false }

// ---- Пробная точка M: перетаскивается свободно, проверяется, лежит ли она на прямой.
// Зелёная отметка R появляется поверх M, когда M лежит на прямой (расстояние ~0). ----
new Point { name = "M"; pos = (4, 3); text = true("M"); pauseOnDrag = false }
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; color = #22c55e; active = false }

new UI { name = "sA"; type = slider; label = "A"; variable = A; min = -3; max = 3; step = 0.1; default = 1 }
new UI { name = "sB"; type = slider; label = "B"; variable = B; min = -3; max = 3; step = 0.1; default = 1 }
new UI { name = "sC"; type = slider; label = "C"; variable = C; min = -6; max = 6; step = 0.2; default = -3 }

// ---- Логика ----
float A = 1; float B = 1; float C = -3;
string info = "";

Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }

Update {
  // Нормаль (A, B) не должна вырождаться в нулевой вектор — уравнение перестаёт
  // задавать линию.
  if (abs(A) < 0.05 && abs(B) < 0.05) { A = 0.1; }
  float n2 = A * A + B * B;
  float px = -A * C / n2; float py = -B * C / n2;
  float dx = -B; float dy = A; float dl = sqrt(dx * dx + dy * dy);
  dx = dx / dl; dy = dy / dl;
  float k = fieldMaxX + fieldMaxY + 4;
  L1.pos.x = px - dx * k; L1.pos.y = py - dy * k;
  L2.pos.x = px + dx * k; L2.pos.y = py + dy * k;

  float v = A * M.pos.x + B * M.pos.y + C;
  float dist = abs(v) / sqrt(n2);
  R.pos.x = M.pos.x; R.pos.y = M.pos.y; R.active = dist <= 0.15;

  string eqA = num(A, 1) + "x";
  string eqB = " + " + num(B, 1) + "y"; if (B < 0) { eqB = " − " + num(-B, 1) + "y"; }
  string eqC = " + " + num(C, 1); if (C < 0) { eqC = " − " + num(-C, 1); }

  info = "**Общее уравнение прямой:** " + eqA + eqB + eqC + " = 0 — линейное соотношение между координатами x и y с коэффициентами A = " + num(A, 1) + ", B = " + num(B, 1) + ", C = " + num(C, 1) + " (A и B не равны нулю одновременно).\n\n**Точка M** удовлетворяет уравнению, если подстановка её координат обращает левую часть в нуль: A·xₘ + B·yₘ + C = " + num(v, 2) + (dist <= 0.15 ? " ≈ 0 — точка лежит на прямой." : ", расстояние от M до прямой ≈ " + format(dist, 2) + " — точка не лежит на прямой.");
}
]
