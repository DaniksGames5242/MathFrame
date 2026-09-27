[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;
show axes = true;
show grid = true;

// ---- Матрица M: её столбцы — образы базисных векторов, концы Me₁ и Me₂ перетаскиваются
// (масштаб: 2 клетки = 1). Вектор v единичной длины ходит по окружности, Mv — его образ ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6 }
new Point { name = "E1"; pos = (3, 1); text = true("Me₁"); pauseOnDrag = false; size = 0.8 }
new Point { name = "E2"; pos = (1, 2); text = true("Me₂"); pauseOnDrag = false; size = 0.8 }
new Line { name = "oe1"; pos = (O, E1); interact = false; thickness = 1.5 }
new Line { name = "oe2"; pos = (O, E2); interact = false; thickness = 1.5 }
new Point { name = "RR"; pos = (2, 0); dynamic = false; collision = false; active = false }
new Circle { name = "unit"; center = O; radius = RR; thickness = 1 }
new Point { name = "V"; circle = "unit"; t = 0.2; text = true("v"); pauseOnDrag = false; color = #22c55e; collideWithPoints = false }
new Point { name = "MV"; pos = (0, 0); dynamic = false; collision = false; text = true("Mv"); color = #f59e0b }
new Line { name = "ov"; pos = (O, V); color = #22c55e; thickness = 3; interact = false; layer = 12 }
new Line { name = "omv"; pos = (O, MV); color = #f59e0b; thickness = 3; interact = false; layer = 12 }
draw Vector { name = "vv"; edge = "ov"; pos = 1; color = #22c55e; thickness = 3 }
draw Vector { name = "vmv"; edge = "omv"; pos = 1; color = #f59e0b; thickness = 3 }

// ---- Собственные направления (если собственные значения вещественные) ----
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Q1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "Q2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "eg1"; pos = (P1, Q1); active = false }
new Line { name = "eg2"; pos = (P2, Q2); active = false }
draw Punctir { name = "pe1"; edge = "eg1"; color = #3b82f6; thickness = 2; layer = 2 }
draw Punctir { name = "pe2"; edge = "eg2"; color = #3b82f6; thickness = 2; layer = 2 }
new Claster { name = "eig"; elements = (pe1, pe2); active = true }

// ---- Логика ----
string info = "";
float a = 1.5; float b = 0.5; float c = 0.5; float d = 1;
float l1 = 0; float l2 = 0;

Function num(v) { if (v < -0.005) { return "−" + format(abs(v), 2); } return format(abs(v), 2); }
// Прямая через начало координат в направлении (x, y) — концы P, Q
Function dirLine(x, y, P, Q) {
  float l = sqrt(x * x + y * y) + 0.000001;
  P.pos.x = -20 * x / l; P.pos.y = -20 * y / l; Q.pos.x = 20 * x / l; Q.pos.y = 20 * y / l;
  return 0;
}

Function snapTo(ux, uy) {
  float l = sqrt(ux * ux + uy * uy) + 0.000001; ux = ux / l; uy = uy / l;
  float vx = V.pos.x / 2; float vy = V.pos.y / 2;
  if (abs(vx * uy - vy * ux) < 0.05) {
    if (vx * ux + vy * uy < 0) { ux = -ux; uy = -uy; }
    float t = atan2(uy, ux) / (2 * pi); if (t < 0) { t = t + 1; }
    V.t = t; V.pos.x = 2 * ux; V.pos.y = 2 * uy;
  }
  return 0;
}

Update {
  // Элементы матрицы: столбцы M — координаты Me₁ и Me₂ в масштабе 2 клетки = 1
  a = E1.pos.x / 2; c = E1.pos.y / 2; b = E2.pos.x / 2; d = E2.pos.y / 2;

  // Собственные значения — корни λ² − (a + d)λ + (ad − bc) = 0
  float tr = a + d; float det = a * d - b * c; float disc = tr * tr - 4 * det;
  if (disc >= 0) {
    eig.active = true;
    l1 = (tr + sqrt(disc)) / 2; l2 = (tr - sqrt(disc)) / 2;
    // Собственный вектор для λ: (b, λ − a) или (λ − d, c)
    if (abs(b) > 0.001 || abs(l1 - a) > 0.001) { dirLine(b, l1 - a, P1, Q1); } else { dirLine(l1 - d, c, P1, Q1); }
    if (abs(b) > 0.001 || abs(l2 - a) > 0.001) { dirLine(b, l2 - a, P2, Q2); } else { dirLine(l2 - d, c, P2, Q2); }
    if (abs(b) < 0.001 && abs(c) < 0.001) { dirLine(1, 0, P1, Q1); dirLine(0, 1, P2, Q2); }
    // Рядом с собственным направлением v «примагничивается» к нему (иначе мышью не попасть)
    snapTo(Q1.pos.x, Q1.pos.y); snapTo(Q2.pos.x, Q2.pos.y);
  } else { eig.active = false; }
  float vx = V.pos.x / 2; float vy = V.pos.y / 2;
  MV.pos.x = 2 * (a * vx + b * vy); MV.pos.y = 2 * (c * vx + d * vy);
  float cr = vx * (MV.pos.y / 2) - vy * (MV.pos.x / 2);

  info = "**Собственный вектор** матрицы M — ненулевой вектор v, который M лишь растягивает (или сжимает, переворачивает): Mv = λv; число λ — собственное значение.\n\nM = [[" + num(a) + ", " + num(b) + "], [" + num(c) + ", " + num(d) + "]]. ";
  if (disc >= 0) { info = info + "Собственные значения λ₁ = " + num(l1) + ", λ₂ = " + num(l2) + "; собственные направления — синий пунктир."; }
  else { info = info + "Вещественных собственных значений нет (дискриминант " + num(disc) + " < 0) — M поворачивает каждый вектор, ни одно направление не сохраняется."; }
  if (abs(cr) < 0.02 && abs(MV.pos.x) + abs(MV.pos.y) > 0.01) { info = info + "\n\n**Сейчас v — собственный:** Mv ∥ v, Mv = " + num((MV.pos.x * V.pos.x + MV.pos.y * V.pos.y) / 4) + "·v."; }
  else { info = info + "\n\nПоведите v по окружности: на собственных направлениях Mv ложится на ту же прямую, что и v."; }
}
]
