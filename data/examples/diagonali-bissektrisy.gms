[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Ромб ABCD: диагонали AC и BD делятся общей точкой O пополам и перпендикулярны —
// это ровно параллелограмм с равными сторонами. Вершины A, C лежат на одной диагонали
// (полудлина p), B, D — на перпендикулярной (полудлина q). Все четыре вершины
// перетаскиваются: у сдвинутой вершины пара к ней симметрична относительно O, а другая
// диагональ поворачивается, оставаясь перпендикулярной, и сохраняет длину. ----
new Point { name = "A"; pos = (-4.443, -1.190); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (0.751, -2.801); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4.443, 1.190); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-0.751, 2.801); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }
new Point { name = "O"; dynamic = false; collision = false; interact = false; active = false }

new Point { name = "O1"; dynamic = false; collision = false; interact = false; text = true("O") }
new Line { name = "diagAC1"; pos = (A, C); interact = false }
new Line { name = "diagBD1"; pos = (B, D); interact = false }
new Angle { name = "angBAC1"; lines = (ab, diagAC1) }
new Angle { name = "angCAD1"; lines = (diagAC1, da) }
draw Angle { name = "arcBAC1"; angle = "angBAC1"; measure = false }
draw Angle { name = "arcCAD1"; angle = "angCAD1"; measure = false }
new Angle { name = "angABD1"; lines = (ab, diagBD1) }
new Angle { name = "angDBC1"; lines = (diagBD1, bc) }
draw Angle { name = "arcABD1"; angle = "angABD1"; measure = false; count = 2 }
draw Angle { name = "arcDBC1"; angle = "angDBC1"; measure = false; count = 2 }
new Angle { name = "angBCA"; lines = (bc, diagAC1) }
new Angle { name = "angACD"; lines = (diagAC1, cd) }
draw Angle { name = "arcBCA"; angle = "angBCA"; measure = false }
draw Angle { name = "arcACD"; angle = "angACD"; measure = false }
new Angle { name = "angCDB"; lines = (cd, diagBD1) }
new Angle { name = "angBDA"; lines = (diagBD1, da) }
draw Angle { name = "arcCDB"; angle = "angCDB"; measure = false; count = 2 }
draw Angle { name = "arcBDA"; angle = "angBDA"; measure = false; count = 2 }
new Point { name = "O2"; dynamic = false; collision = false; interact = false; text = true("O") }
draw EquallySing { name = "eqSides3"; edges = (ab, bc, cd, da); type = 3 }
new Line { name = "ao"; pos = (A, O2); interact = false }
new Line { name = "oc"; pos = (O2, C); interact = false }
new Line { name = "bo"; pos = (B, O2); interact = false }
new Line { name = "od"; pos = (O2, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }
new Line { name = "oa"; pos = (O2, A); interact = false; color = "transparent" }
new Line { name = "ob"; pos = (O2, B); interact = false; color = "transparent" }
new Angle { name = "angO"; lines = (oa, ob) }
draw Angle { name = "arcO"; angle = "angO" }
new Point { name = "O3"; dynamic = false; collision = false; interact = false; text = true("O") }
new Line { name = "diagAC3"; pos = (A, C); interact = false }
new Line { name = "diagBD3"; pos = (B, D); interact = false }
new Angle { name = "angBAC3"; lines = (ab, diagAC3) }
new Angle { name = "angCAD3"; lines = (diagAC3, da) }
draw Angle { name = "arcBAC3"; angle = "angBAC3"; measure = false }
draw Angle { name = "arcCAD3"; angle = "angCAD3"; measure = false }
new Angle { name = "angABD3"; lines = (ab, diagBD3) }
new Angle { name = "angDBC3"; lines = (diagBD3, bc) }
draw Angle { name = "arcABD3"; angle = "angABD3"; measure = false; count = 2 }
draw Angle { name = "arcDBC3"; angle = "angDBC3"; measure = false; count = 2 }

new Claster { name = "tab1"; elements = (diagAC1, diagBD1, O1, arcBAC1, arcCAD1, arcABD1, arcDBC1, arcBCA, arcACD, arcCDB, arcBDA); active = true }
new Claster { name = "tab2"; elements = (ao, oc, bo, od, O2, arcO, eqAoOc, eqBoOd, eqSides3); active = false }
new Claster { name = "tab3"; elements = (diagAC3, diagBD3, O3, arcBAC3, arcABD3); active = false }

new UI { name = "btn1"; type = button; label = "Биссектрисы"; action = "tab = 1; tab1.active = true; tab2.active = false; tab3.active = false" }
new UI { name = "btn2"; type = button; label = "Четыре треугольника"; action = "tab = 2; tab1.active = false; tab2.active = true; tab3.active = false" }
new UI { name = "btn3"; type = button; label = "Формулы"; action = "tab = 3; tab1.active = false; tab2.active = false; tab3.active = true" }

float tab = 1;
string info = "";
float inr = 1;
float ox = 0; float oy = 0; float pox = 0; float poy = 0;
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли положение (x, y) вершины при центре (ox, oy). len — полудлина другой
// диагонали (она остаётся перпендикулярной и сохраняет длину), s = 1 для вершин A, C
// (тогда другая диагональ получается поворотом на +90°) и s = −1 для B, D. Полудиагонали
// не короче 0.9 и различаются не более чем в 5 раз (углы ромба не вырождаются), все
// четыре вершины остаются в поле.
Function ok(x, y, ox, oy, len, s) {
  float wx = x - ox; float wy = y - oy;
  float r = sqrt(wx * wx + wy * wy);
  if (r < 0.9 || len < 0.9 || r < 0.2 * len || len < 0.2 * r) { return false; }
  if (!inField(x, y) || !inField(2 * ox - x, 2 * oy - y)) { return false; }
  float qx = ox - s * wy / r * len; float qy = oy + s * wx / r * len;
  return inField(qx, qy) && inField(2 * ox - qx, 2 * oy - qy);
}

Function reach(x0, y0, dx, dy, ox, oy, len, s) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ox, oy, len, s)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ox, oy, len, s)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавное ограничение хода вершины: проходим допустимую часть хода, остаток — по осям.
Function slide(px, py, nx, ny, ox, oy, len, s) {
  float t = reach(px, py, nx - px, ny - py, ox, oy, len, s);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ox, oy, len, s);
    cy = cy + ry * reach(cx, cy, 0, ry, ox, oy, len, s);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001) {
  } else if (shift < 0.000001) {
    // Перетаскивание фигуры целиком: центр O сдвигается вместе со всеми вершинами.
    ox = ox + (A.pos.x - pax); oy = oy + (A.pos.y - pay);
  } else if (mA == m || mC == m) {
    // Двигают A или C: ход ограничиваем (slide), пара симметрична относительно O,
    // диагональ BD поворачивается перпендикулярно новой AC с прежней длиной.
    float tax = A.pos.x; float tay = A.pos.y;
    if (mC == m && mA < m) { tax = 2 * ox - C.pos.x; tay = 2 * oy - C.pos.y; }
    float lb = sqrt((pbx - ox) * (pbx - ox) + (pby - oy) * (pby - oy));
    slide(pax, pay, tax, tay, ox, oy, lb, 1);
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    A.pos.x = sx; A.pos.y = sy; C.pos.x = 2 * ox - sx; C.pos.y = 2 * oy - sy;
    B.pos.x = ox - (sy - oy) / r * lb; B.pos.y = oy + (sx - ox) / r * lb;
    D.pos.x = 2 * ox - B.pos.x; D.pos.y = 2 * oy - B.pos.y;
  } else {
    float tbx = B.pos.x; float tby = B.pos.y;
    if (mD == m && mB < m) { tbx = 2 * ox - D.pos.x; tby = 2 * oy - D.pos.y; }
    float la = sqrt((pax - ox) * (pax - ox) + (pay - oy) * (pay - oy));
    slide(pbx, pby, tbx, tby, ox, oy, la, -1);
    float r = sqrt((sx - ox) * (sx - ox) + (sy - oy) * (sy - oy));
    B.pos.x = sx; B.pos.y = sy; D.pos.x = 2 * ox - sx; D.pos.y = 2 * oy - sy;
    A.pos.x = ox + (sy - oy) / r * la; A.pos.y = oy - (sx - ox) / r * la;
    C.pos.x = 2 * ox - A.pos.x; C.pos.y = 2 * oy - A.pos.y;
  }
  // Страховка: диагонали делятся точкой O пополам, перпендикулярны, все вершины в поле.
  if (abs(A.pos.x + C.pos.x - 2 * ox) + abs(A.pos.y + C.pos.y - 2 * oy) > 0.001
      || abs(B.pos.x + D.pos.x - 2 * ox) + abs(B.pos.y + D.pos.y - 2 * oy) > 0.001
      || abs((A.pos.x - ox) * (B.pos.x - ox) + (A.pos.y - oy) * (B.pos.y - oy)) > 0.001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    ox = pox; oy = poy;
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  O.pos.x = ox; O.pos.y = oy;
  O1.pos.x = ox; O1.pos.y = oy;
  O2.pos.x = ox; O2.pos.y = oy;
  O3.pos.x = ox; O3.pos.y = oy;
  pox = ox; poy = oy;
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  // Величины ромба: p = AO, q = BO, сторона a, углы α = ∠A, β = ∠B.
  float pp = sqrt((pax - ox) * (pax - ox) + (pay - oy) * (pay - oy));
  float qq = sqrt((pbx - ox) * (pbx - ox) + (pby - oy) * (pby - oy));
  float aa = sqrt(pp * pp + qq * qq);
  float half = atan2(qq, pp) * 180 / pi;
  float alpha = 2 * half;
  float halfB = 90 - half;
  float d1 = 2 * pp; float d2 = 2 * qq;
  inr = pp * qq / aa;
  if (tab == 1) {
    info = "**Каждая диагональ делит углы при своих концах пополам.** Диагональ AC: ∠BAC = ∠CAD = " + format(half, 0) + "° (половина ∠A = " + format(alpha, 0) + "°) и ∠BCA = ∠ACD = " + format(half, 0) + "° (половина ∠C). Диагональ BD: ∠ABD = ∠DBC = ∠CDB = ∠BDA = " + format(halfB, 0) + "° (половина ∠B = ∠D = " + format(180 - alpha, 0) + "°).\n\n**Диагональ образует с каждой прилежащей стороной угол α/2** и перпендикулярна другой диагонали: ∠AOB = 90°.";
  } else if (tab == 2) {
    info = "**Четыре прямоугольных треугольника равны:** катеты AO = OC = " + format(pp, 2) + " и BO = OD = " + format(qq, 2) + ", гипотенуза — сторона " + format(aa, 2) + ". Площадь каждого ½ · " + format(pp, 2) + " · " + format(qq, 2) + " = " + format(pp * qq / 2, 2) + ", вместе S = ½ d₁ d₂ = " + format(d1 * d2 / 2, 2) + ".\n\n**Точка O равноудалена от всех сторон:** расстояние от O до каждой стороны — высота прямоугольного треугольника, r = " + format(inr, 2) + " (центр вписанной окружности).";
  } else {
    info = "**Диагонали через сторону и угол:** AC = 2a · cos(α/2) = 2 · " + format(aa, 2) + " · " + format(cos(half * pi / 180), 2) + " = " + format(d1, 2) + ", BD = 2a · sin(α/2) = 2 · " + format(aa, 2) + " · " + format(sin(half * pi / 180), 2) + " = " + format(d2, 2) + ".\n\n**Отношение диагоналей** BD / AC = tg(α/2) = " + format(tan(half * pi / 180), 2) + " (α = ∠A = " + format(alpha, 0) + "°) определяется только углом, а не размером.";
  }
}
]
