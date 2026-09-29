[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Трапеция ABCD: вершины A, B, D перетаскиваются свободно, а C лежит на
// вспомогательной прямой через D в направлении вектора AB, поэтому DC ∥ AB держится
// всегда; C двигают вдоль этой прямой (t = DC : AB, t ≠ 1 — иначе это параллелограмм). ----
new Point { name = "A"; pos = (-6, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "D"; pos = (-4.5, 3); text = true("D"); pauseOnDrag = false }
new Point { name = "Du"; dynamic = false; collision = false; interact = false; active = false }
new Line { name = "topLine"; pos = (D, Du); active = false; interact = false }
new Point { name = "C"; line = "topLine"; extend = true; t = 0.55; text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
draw Angle { name = "arcA"; angle = "angA"; measure = false }
draw Angle { name = "arcB"; angle = "angB"; measure = false }

new UI { name = "btnIso"; type = button; label = "Равнобедренная"; action = "req = 1" }
new UI { name = "btnRight"; type = button; label = "Прямоугольная"; action = "req = 2" }

string info = "";

float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pdx = 0; float pdy = 0;
float ptc = 0.55; float req = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Допустима ли точка C при параметре t на прямой D + t·(Du − D) (в поле).
Function tOk(t) {
  return inField(D.pos.x + t * (Du.pos.x - D.pos.x), D.pos.y + t * (Du.pos.y - D.pos.y));
}

// Допустимо ли положение вершин A, B, D: основание AB и боковая сторона AD не короче 0.4,
// высота не меньше 0.4 (иначе трапеция вырождается), у верхнего основания есть место в поле.
Function shapeOk(ax, ay, bx, by, dx, dy) {
  if (!inField(ax, ay) || !inField(bx, by) || !inField(dx, dy)) { return false; }
  float ux = bx - ax; float uy = by - ay;
  float lab = sqrt(ux * ux + uy * uy);
  if (lab < 0.4) { return false; }
  float lad = sqrt((dx - ax) * (dx - ax) + (dy - ay) * (dy - ay));
  if (lad < 0.4) { return false; }
  float h = abs(ux * (dy - ay) - uy * (dx - ax)) / lab;
  if (h < 0.4) { return false; }
  float tmin = 0.3 / lab; if (tmin < 0.12) { tmin = 0.12; }
  return inField(dx + tmin * ux, dy + tmin * uy);
}

// То же для хода одной вершины (режим 1 — A, 2 — B, 3 — D) в точку (x, y) при остальных
// на прежних местах.
Function okV(mode, x, y) {
  if (mode == 1) { return shapeOk(x, y, pbx, pby, pdx, pdy); }
  if (mode == 2) { return shapeOk(pax, pay, x, y, pdx, pdy); }
  return shapeOk(pax, pay, pbx, pby, x, y);
}

// Наибольшая доля хода, до которой весь путь допустим: 16 промежуточных точек (резкий
// рывок не «перепрыгнет» вырожденное положение), затем деление пополам.
Function reach(mode, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okV(mode, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okV(mode, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавное ограничение: допустимая часть хода, остаток — отдельно по x и по y (вершина
// скользит вдоль границы поля и вдоль ограничений формы). Результат — в (sx, sy).
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

Start { pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y; ptc = C.t; }

Update {
  // Кнопки-«прицелы» (req): 1 — сделать боковые стороны равными (D переносится так,
  // чтобы фигура стала симметричной), 2 — сделать угол A прямым (D — на перпендикуляр к AB).
  if (req > 0) {
    float ux = B.pos.x - A.pos.x; float uy = B.pos.y - A.pos.y;
    float lab = sqrt(ux * ux + uy * uy);
    ux = ux / lab; uy = uy / lab;
    float hh = (D.pos.x - A.pos.x) * (0 - uy) + (D.pos.y - A.pos.y) * ux;
    float ndx = A.pos.x + hh * (0 - uy); float ndy = A.pos.y + hh * ux;
    if (req == 1) {
      float tw = C.t * lab;
      ndx = (A.pos.x + B.pos.x) / 2 + hh * (0 - uy) - tw / 2 * ux;
      ndy = (A.pos.y + B.pos.y) / 2 + hh * ux - tw / 2 * uy;
    }
    if (shapeOk(A.pos.x, A.pos.y, B.pos.x, B.pos.y, ndx, ndy)) {
      D.pos.x = ndx; D.pos.y = ndy; pdx = ndx; pdy = ndy;
    }
    req = 0;
  }
  float dax = A.pos.x - pax; float day = A.pos.y - pay;
  float dbx = B.pos.x - pbx; float dby = B.pos.y - pby;
  float ddx = D.pos.x - pdx; float ddy = D.pos.y - pdy;
  float mA = abs(dax) + abs(day); float mB = abs(dbx) + abs(dby); float mD = abs(ddx) + abs(ddy);
  float m = max(mA, mB, mD);
  float shift = abs(dax - dbx) + abs(day - dby) + abs(dax - ddx) + abs(day - ddy);
  if (m < 0.000001 || shift < 0.000001) {
  } else {
    // Двигают одну вершину (с наибольшим смещением); остальные стоят на месте.
    float mode = 3; float x0 = pdx; float y0 = pdy; float nx = D.pos.x; float ny = D.pos.y;
    if (mA == m) { mode = 1; x0 = pax; y0 = pay; nx = A.pos.x; ny = A.pos.y; }
    else if (mB == m) { mode = 2; x0 = pbx; y0 = pby; nx = B.pos.x; ny = B.pos.y; }
    slide(mode, x0, y0, nx, ny);
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    if (mode == 1) { A.pos.x = sx; A.pos.y = sy; }
    if (mode == 2) { B.pos.x = sx; B.pos.y = sy; }
    if (mode == 3) { D.pos.x = sx; D.pos.y = sy; }
  }
  // Страховка.
  if (!shapeOk(A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  // Вспомогательная прямая topLine = D + t·(B − A): по ней двигается C, что и держит
  // DC ∥ AB. Границы t: верхнее основание не короче 0.3, не длиннее 3·AB, и t ≠ 1
  // (в окрестности 1 фигура была бы почти параллелограммом — C перескакивает через неё).
  Du.pos.x = D.pos.x + (B.pos.x - A.pos.x); Du.pos.y = D.pos.y + (B.pos.y - A.pos.y);
  float tmin = 0.3 / ab.length; if (tmin < 0.12) { tmin = 0.12; }
  float ct = C.t;
  if (ct < tmin) { ct = tmin; }
  if (ct > 3) { ct = 3; }
  if (abs(ct - 1) < 0.1) { if (ct < 1) { ct = 0.9; } else { ct = 1.1; } }
  if (!tOk(ct)) {
    float lo = 0; float hi = ct;
    repeat (20) { float mid = (lo + hi) / 2; if (tOk(mid)) { lo = mid; } else { hi = mid; } }
    ct = lo;
    if (abs(ct - 1) < 0.1) { ct = 0.9; }
    if (ct < tmin) { ct = tmin; }
  }
  if (ct != C.t) { C.t = ct; }
  ptc = ct;
  float legDiff = abs(da.length - bc.length);
  float isIso = 0; float isRight = 0;
  if (legDiff < 0.01) { isIso = 1; }
  if (abs(angA.measure - 90) < 1.5 || abs(angB.measure - 90) < 1.5) { isRight = 1; }
  info = "**Боковые стороны:** AD = " + format(da.length, 2) + ", BC = " + format(bc.length, 2) + ".\n\n**Углы при основании AB:** ∠A = " + format(angA.measure, 1) + "°, ∠B = " + format(angB.measure, 1) + "°.\n\n";
  if (isIso > 0.5) { info = info + "**Равнобедренная:** боковые стороны равны, углы при каждом основании попарно равны, диагонали равны."; }
  else if (isRight > 0.5) { info = info + "**Прямоугольная:** один из углов при боковой стороне прямой — эта боковая сторона является высотой."; }
  else { info = info + "**Общий случай:** боковые стороны не равны и ни один угол при основании не прямой."; }
}
]
