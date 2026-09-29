[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Равнобедренная трапеция: все четыре вершины перетаскиваются. Форма задаётся
// параметрами: середина нижнего основания, направление AB, полуоснования a > c и
// высота h; вершины A, B, C, D строятся симметрично относительно оси, перпендикулярной
// основаниям. Ход вершины пересчитывается в параметры (см. build), остальное — как в
// parallelogram.gms: плавные ограничения (reach/slide) и страховка в конце Update. ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (2.5, 2.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 2.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// ---- Вкладка 1: боковые стороны и углы при основаниях ----
draw EquallySing { name = "eqLegs"; edges = (da, bc); type = 1 }
new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
draw Angle { name = "arcB"; angle = "angB"; measure = false }
draw Angle { name = "arcC"; angle = "angC"; count = 2; measure = false }
draw Angle { name = "arcD"; angle = "angD"; count = 2; measure = false }
new Claster { name = "tabSides"; elements = (eqLegs, arcA, arcB, arcC, arcD); active = true }

// ---- Вкладка 2: диагонали и ось симметрии (через середины оснований) ----
new Point { name = "M"; dynamic = false; collision = false; interact = false; text = true("M") }
new Point { name = "N"; dynamic = false; collision = false; interact = false; text = true("N") }
new Point { name = "O"; dynamic = false; collision = false; interact = false; text = true("O") }
new Line { name = "mn"; pos = (M, N); active = false; interact = false }
draw Punctir { name = "axis"; edge = "mn" }
new Line { name = "ac"; pos = (A, C); interact = false }
new Line { name = "bd"; pos = (B, D); interact = false }
draw EquallySing { name = "eqDiag"; edges = (ac, bd); type = 1 }
new Claster { name = "tabDiag"; elements = (M, N, O, axis, ac, bd, eqDiag); active = false }

new UI { name = "btnSides"; type = button; label = "Стороны и углы"; action = "tab = 1; tabSides.active = true; tabDiag.active = false" }
new UI { name = "btnDiag"; type = button; label = "Диагонали и ось"; action = "tab = 2; tabSides.active = false; tabDiag.active = true" }

float tab = 1;
string info = "";

float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float qax = 0; float qay = 0; float qbx = 0; float qby = 0;
float qcx = 0; float qcy = 0; float qdx = 0; float qdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// По режиму хода (1..4 — вершина A, B, C, D сдвинута в (tx, ty)) строит трапецию
// из прежней формы (pa..pd): у двигаемой вершины парная по основанию стоит на месте,
// от них пересчитываются направление, длина основания, а вторая пара вершин
// достраивается симметрично. Результат — в q-переменных; 1 — трапеция допустима
// (верхнее основание не короче 0.4, короче нижнего хотя бы на 0.4, высота не меньше 0.5,
// все вершины в поле), иначе 0.
Function build(mode, tx, ty) {
  float ux = pbx - pax; float uy = pby - pay;
  float l0 = sqrt(ux * ux + uy * uy);
  ux = ux / l0; uy = uy / l0;
  float a = l0 / 2;
  float c = sqrt((pcx - pdx) * (pcx - pdx) + (pcy - pdy) * (pcy - pdy)) / 2;
  float h = (pdx - pax) * (0 - uy) + (pdy - pay) * ux;
  float mx = (pax + pbx) / 2; float my = (pay + pby) / 2;
  float vx = 0; float vy = 0; float l = 0;
  if (mode == 1) {
    vx = pbx - tx; vy = pby - ty; l = sqrt(vx * vx + vy * vy);
    if (l < 0.000001) { return 0; }
    ux = vx / l; uy = vy / l; a = l / 2; mx = (tx + pbx) / 2; my = (ty + pby) / 2;
  }
  if (mode == 2) {
    vx = tx - pax; vy = ty - pay; l = sqrt(vx * vx + vy * vy);
    if (l < 0.000001) { return 0; }
    ux = vx / l; uy = vy / l; a = l / 2; mx = (tx + pax) / 2; my = (ty + pay) / 2;
  }
  if (mode == 3) {
    vx = tx - pdx; vy = ty - pdy; l = sqrt(vx * vx + vy * vy);
    if (l < 0.000001) { return 0; }
    ux = vx / l; uy = vy / l; c = l / 2;
    mx = (tx + pdx) / 2 - h * (0 - uy); my = (ty + pdy) / 2 - h * ux;
  }
  if (mode == 4) {
    vx = pcx - tx; vy = pcy - ty; l = sqrt(vx * vx + vy * vy);
    if (l < 0.000001) { return 0; }
    ux = vx / l; uy = vy / l; c = l / 2;
    mx = (tx + pcx) / 2 - h * (0 - uy); my = (ty + pcy) / 2 - h * ux;
  }
  if (c < 0.2 || a < c + 0.2 || h < 0.5) { return 0; }
  float nx = 0 - uy; float ny = ux;
  qax = mx - a * ux; qay = my - a * uy; qbx = mx + a * ux; qby = my + a * uy;
  qcx = mx + c * ux + h * nx; qcy = my + c * uy + h * ny;
  qdx = mx - c * ux + h * nx; qdy = my - c * uy + h * ny;
  return inField(qax, qay) && inField(qbx, qby) && inField(qcx, qcy) && inField(qdx, qdy);
}

// Наибольшая доля хода (0..1), до которой весь путь допустим: 16 промежуточных точек
// (быстрый рывок не «перепрыгнет» вырожденное положение), затем деление пополам.
Function reach(mode, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (build(mode, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (build(mode, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавное ограничение: допустимая часть хода, остаток — отдельно по x и по y.
Function slide(mode, px, py, nx, ny) {
  float t = reach(mode, px, py, nx - px, ny - py);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(mode, cx, cy, rx, 0);
    cy = cy + ry * reach(mode, cx, cy, 0, ry);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

// Общая часть Update: обработка хода вершин и страховка.
Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else {
    float mode = 4; float x0 = pdx; float y0 = pdy; float nx = D.pos.x; float ny = D.pos.y;
    if (mA == m) { mode = 1; x0 = pax; y0 = pay; nx = A.pos.x; ny = A.pos.y; }
    else if (mB == m) { mode = 2; x0 = pbx; y0 = pby; nx = B.pos.x; ny = B.pos.y; }
    else if (mC == m) { mode = 3; x0 = pcx; y0 = pcy; nx = C.pos.x; ny = C.pos.y; }
    slide(mode, x0, y0, nx, ny);
    if (build(mode, sx, sy)) {
      A.pos.x = qax; A.pos.y = qay; B.pos.x = qbx; B.pos.y = qby;
      C.pos.x = qcx; C.pos.y = qcy; D.pos.x = qdx; D.pos.y = qdy;
    } else {
      A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
      C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
    }
  }
  // Страховка: не равнобедренная трапеция или вершина вне поля — откат целиком.
  float par = abs((B.pos.x - A.pos.x) * (C.pos.y - D.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - D.pos.x));
  float legs = abs(sqrt((D.pos.x - A.pos.x) * (D.pos.x - A.pos.x) + (D.pos.y - A.pos.y) * (D.pos.y - A.pos.y)) - sqrt((C.pos.x - B.pos.x) * (C.pos.x - B.pos.x) + (C.pos.y - B.pos.y) * (C.pos.y - B.pos.y)));
  if (par > 0.001 || legs > 0.001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
  float al = angA.measure;
  if (tab == 1) {
    info = "**Боковые стороны равны:** AD = BC = " + format(da.length, 2) + ".\n\n**Углы при каждом основании попарно равны:** острые при большем основании ∠A = ∠B = " + format(al, 1) + "°, тупые при меньшем ∠C = ∠D = " + format(180 - al, 1) + "°.";
  } else {
    float k = ab.length / (ab.length + cd.length);
    O.pos.x = A.pos.x + k * (C.pos.x - A.pos.x); O.pos.y = A.pos.y + k * (C.pos.y - A.pos.y);
    M.pos.x = (A.pos.x + B.pos.x) / 2; M.pos.y = (A.pos.y + B.pos.y) / 2;
    N.pos.x = (C.pos.x + D.pos.x) / 2; N.pos.y = (C.pos.y + D.pos.y) / 2;
    info = "**Диагонали равны:** AC = BD = " + format(ac.length, 2) + ".\n\n**Ось симметрии MN** проходит через середины оснований (AB = " + format(ab.length, 2) + ", DC = " + format(cd.length, 2) + ") перпендикулярно им; точка O пересечения диагоналей лежит на этой оси.";
  }
}
]
