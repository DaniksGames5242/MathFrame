[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Признаки параллелограмма: произвольный выпуклый четырёхугольник ABCD. Вкладки — четыре
// признака (стороны, углы, диагонали, пара сторон); отметки загораются, когда условие
// выполнено, и тогда ABCD — параллелограмм. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3.5, 2.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Line { name = "ac"; pos = (A, C); interact = false }
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }
new Angle { name = "angBAC"; lines = (ab, ac) }
new Angle { name = "angDCA"; lines = (cd, ac) }
new Angle { name = "angCAD"; lines = (ac, da) }
new Angle { name = "angACB"; lines = (ac, bc) }
draw Angle { name = "arcBAC"; angle = "angBAC"; measure = false }
draw Angle { name = "arcDCA"; angle = "angDCA"; measure = false }
draw Angle { name = "arcCAD"; angle = "angCAD"; measure = false; count = 2 }
draw Angle { name = "arcACB"; angle = "angACB"; measure = false; count = 2 }
new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA0"; angle = "angA" }
draw Angle { name = "arcC0"; angle = "angC" }
draw Angle { name = "arcB0"; angle = "angB" }
draw Angle { name = "arcD0"; angle = "angD" }
draw Angle { name = "arcA1"; angle = "angA"; arccolor = #22c55e }
draw Angle { name = "arcC1"; angle = "angC"; arccolor = #22c55e }
draw Angle { name = "arcB1"; angle = "angB"; count = 2; arccolor = #22c55e }
draw Angle { name = "arcD1"; angle = "angD"; count = 2; arccolor = #22c55e }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }
draw EquallySing { name = "eqPrAbCd"; edges = (ab, cd); type = 1 }
draw Angle { name = "arcPrBAC"; angle = "angBAC" }
draw Angle { name = "arcPrDCA"; angle = "angDCA" }

// Вкладки — кластеры с постоянными объектами; отметки «условие выполнено» (кластеры cl…) включает Update.
new Claster { name = "tabSd"; elements = (ac); active = true }
new Claster { name = "tabDg"; elements = (O, ao, oc, bo, od); active = false }
new Claster { name = "tabPr"; elements = (ac, arcPrBAC, arcPrDCA); active = false }
new Claster { name = "clSd1"; elements = (eqAbCd, arcBAC, arcDCA); active = false }
new Claster { name = "clSd2"; elements = (eqBcDa, arcCAD, arcACB); active = false }
new Claster { name = "clAn0"; elements = (arcA0, arcC0); active = false }
new Claster { name = "clAn1"; elements = (arcA1, arcC1); active = false }
new Claster { name = "clBn0"; elements = (arcB0, arcD0); active = false }
new Claster { name = "clBn1"; elements = (arcB1, arcD1); active = false }
new Claster { name = "clDg1"; elements = (eqAoOc); active = false }
new Claster { name = "clDg2"; elements = (eqBoOd); active = false }
new Claster { name = "clPr1"; elements = (eqPrAbCd); active = false }

new UI { name = "btnSd"; type = button; label = "Стороны"; action = "tab = 1; tabSd.active = false; tabDg.active = false; tabPr.active = false; tabSd.active = true" }
new UI { name = "btnAn"; type = button; label = "Углы"; action = "tab = 2; tabSd.active = false; tabDg.active = false; tabPr.active = false" }
new UI { name = "btnDg"; type = button; label = "Диагонали"; action = "tab = 3; tabSd.active = false; tabDg.active = false; tabPr.active = false; tabDg.active = true" }
new UI { name = "btnPr"; type = button; label = "Параллельность и равенство"; action = "tab = 4; tabSd.active = false; tabDg.active = false; tabPr.active = false; tabPr.active = true" }

float tab = 1;
float e1 = 0; float e2 = 0;
float sAB = 0; float sBC = 0; float sCD = 0; float sDA = 0;
float iA = 0; float iB = 0; float iC = 0; float iD = 0;
float ox = 0; float oy = 0; float lAO = 0; float lOC = 0; float lBO = 0; float lOD = 0;
float aBAC = 0; float aDCA = 0; 

// ---- Логика. Четырёхугольник ABCD произвольный, но выпуклый и невырожденный: ход вершины,
// нарушающий это (или выводящий её за поле), обрезается и вершина скользит вдоль границы
// допустимого (схема parallelogram.gms). Когда условие признака выполнено почти точно,
// перетаскиваемая вершина «прилипает» к точному положению (B + D − C и т. п.) — иначе
// поймать равенство мышью было бы почти невозможно. ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

Function dst(x1, y1, x2, y2) { return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)); }

// Внутренний угол (в градусах) при вершине (vx, vy) между лучами на (px, py) и (nx, ny).
Function ang(px, py, vx, vy, nx, ny) {
  float ux = px - vx; float uy = py - vy;
  float wx = nx - vx; float wy = ny - vy;
  return acos((ux * wx + uy * wy) / (sqrt(ux * ux + uy * uy) * sqrt(wx * wx + wy * wy))) * 180 / pi;
}

// Поворот обхода a → b → c выпуклый (против часовой), стороны не короче 0.45,
// внутренний угол при b от 15° до 165°.
Function corner(ax, ay, bx, by, cx, cy) {
  float ux = bx - ax; float uy = by - ay;
  float vx = cx - bx; float vy = cy - by;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.45 || lv < 0.45) { return false; }
  return (ux * vy - uy * vx) / (lu * lv) >= 0.26;
}

// Допустимо ли положение (x, y) вершины при остальных трёх, идущих следом по обходу.
Function ok(x, y, bx, by, cx, cy, dx, dy) {
  if (!inField(x, y)) { return false; }
  return corner(dx, dy, x, y, bx, by) && corner(x, y, bx, by, cx, cy) && corner(bx, by, cx, cy, dx, dy) && corner(cx, cy, dx, dy, x, y);
}

// Наибольшая доля хода (dx, dy) из (x0, y0), до которой весь путь допустим: 16 промежуточных
// точек (быстрый рывок не перепрыгнет запрещённую зону), затем деление пополам.
Function reach(x0, y0, dx, dy, bx, by, cx, cy, ex, ey) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, bx, by, cx, cy, ex, ey)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, bx, by, cx, cy, ex, ey)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Ход вершины из (px, py) в (nx, ny): допустимая часть хода, остаток — отдельно по осям
// (скольжение вдоль границы). Результат — в (sx, sy).
Function slide(px, py, nx, ny, bx, by, cx, cy, ex, ey) {
  float t = reach(px, py, nx - px, ny - py, bx, by, cx, cy, ex, ey);
  float cx0 = px + (nx - px) * t; float cy0 = py + (ny - py) * t;
  float rx = nx - cx0; float ry = ny - cy0;
  if (t < 1) {
    cx0 = cx0 + rx * reach(cx0, cy0, rx, 0, bx, by, cx, cy, ex, ey);
    cy0 = cy0 + ry * reach(cx0, cy0, 0, ry, bx, by, cx, cy, ex, ey);
  }
  sx = cx0; sy = cy0;
  return 0;
}

// Длины сторон и углы по текущим положениям вершин.
Function lAB() { return dst(A.pos.x, A.pos.y, B.pos.x, B.pos.y); }
Function lBC() { return dst(B.pos.x, B.pos.y, C.pos.x, C.pos.y); }
Function lCD() { return dst(C.pos.x, C.pos.y, D.pos.x, D.pos.y); }
Function lDA() { return dst(D.pos.x, D.pos.y, A.pos.x, A.pos.y); }
Function gA() { return ang(D.pos.x, D.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); }
Function gB() { return ang(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); }
Function gC() { return ang(B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y); }
Function gD() { return ang(C.pos.x, C.pos.y, D.pos.x, D.pos.y, A.pos.x, A.pos.y); }
Function gBAC() { return ang(B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y); }
Function gDCA() { return ang(D.pos.x, D.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); }

// Точка пересечения диагоналей AC и BD: A + s·(C − A).
Function crossO() {
  float s = ((B.pos.x - A.pos.x) * (D.pos.y - B.pos.y) - (B.pos.y - A.pos.y) * (D.pos.x - B.pos.x))
          / ((C.pos.x - A.pos.x) * (D.pos.y - B.pos.y) - (C.pos.y - A.pos.y) * (D.pos.x - B.pos.x));
  ox = A.pos.x + s * (C.pos.x - A.pos.x); oy = A.pos.y + s * (C.pos.y - A.pos.y);
  return 0;
}

// Выполнено ли условие признака с допуском t (длины — в единицах поля, углы — 15·t градусов).
Function nearSd(t) { return abs(lAB() - lCD()) < t && abs(lBC() - lDA()) < t; }
Function nearAn(t) { return abs(gA() - gC()) < 15 * t && abs(gB() - gD()) < 15 * t; }
Function nearDg(t) {
  crossO();
  return abs(dst(A.pos.x, A.pos.y, ox, oy) - dst(ox, oy, C.pos.x, C.pos.y)) < t && abs(dst(B.pos.x, B.pos.y, ox, oy) - dst(ox, oy, D.pos.x, D.pos.y)) < t;
}
Function nearPr(t) { return abs(gBAC() - gDCA()) < 15 * t && abs(lAB() - lCD()) < t; }
Function near(t) {
  if (tab == 1) { return nearSd(t); }
  if (tab == 2) { return nearAn(t); }
  if (tab == 3) { return nearDg(t); }
  return nearPr(t);
}

// Магнит: если условие почти выполнено, сдвинутая вершина k (0..3 = A..D) встаёт в точное
// положение, достраивающее параллелограмм.
Function snap(k) {
  if (!near(0.12)) { return 0; }
  float qx = 0; float qy = 0;
  if (k == 0) {
    qx = B.pos.x + D.pos.x - C.pos.x; qy = B.pos.y + D.pos.y - C.pos.y;
    if (dst(qx, qy, A.pos.x, A.pos.y) < 1 && ok(qx, qy, B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y)) { A.pos.x = qx; A.pos.y = qy; }
  } else if (k == 1) {
    qx = A.pos.x + C.pos.x - D.pos.x; qy = A.pos.y + C.pos.y - D.pos.y;
    if (dst(qx, qy, B.pos.x, B.pos.y) < 1 && ok(qx, qy, C.pos.x, C.pos.y, D.pos.x, D.pos.y, A.pos.x, A.pos.y)) { B.pos.x = qx; B.pos.y = qy; }
  } else if (k == 2) {
    qx = B.pos.x + D.pos.x - A.pos.x; qy = B.pos.y + D.pos.y - A.pos.y;
    if (dst(qx, qy, C.pos.x, C.pos.y) < 1 && ok(qx, qy, D.pos.x, D.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y)) { C.pos.x = qx; C.pos.y = qy; }
  } else {
    qx = A.pos.x + C.pos.x - B.pos.x; qy = A.pos.y + C.pos.y - B.pos.y;
    if (dst(qx, qy, D.pos.x, D.pos.y) < 1 && ok(qx, qy, A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) { D.pos.x = qx; D.pos.y = qy; }
  }
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  // Смещения вершин за кадр; двигаемая — с наибольшим смещением.
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  // Фигура перенесена целиком (все вершины сдвинуты на один вектор) — форма не меняется.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  float k = -1;
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy, pdx, pdy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
    k = 0;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pcx, pcy, pdx, pdy, pax, pay);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
    k = 1;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, pdx, pdy, pax, pay, pbx, pby);
    C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    k = 2;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, pax, pay, pbx, pby, pcx, pcy);
    D.pos.x = sx; D.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    k = 3;
  }
  if (k >= 0) { snap(k); }
  // Страховка: некорректный кадр (не выпуклый, вне поля) — возврат к последнему корректному.
  if (!ok(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y, D.pos.x, D.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  if (tab == 1) {
  sAB = lAB(); sBC = lBC(); sCD = lCD(); sDA = lDA();
  e1 = 0; if (abs(sAB - sCD) < 0.001) { e1 = 1; }
  e2 = 0; if (abs(sBC - sDA) < 0.001) { e2 = 1; }
  } else if (tab == 2) {
  iA = gA(); iB = gB(); iC = gC(); iD = gD();
  e1 = 0; if (abs(iA - iC) < 0.015) { e1 = 1; }
  e2 = 0; if (abs(iB - iD) < 0.015) { e2 = 1; }
  } else if (tab == 3) {
  crossO();
  if (abs(O.pos.x - ox) + abs(O.pos.y - oy) > 0.000001) { O.pos.x = ox; O.pos.y = oy; }
  lAO = dst(A.pos.x, A.pos.y, ox, oy); lOC = dst(ox, oy, C.pos.x, C.pos.y); lBO = dst(B.pos.x, B.pos.y, ox, oy); lOD = dst(ox, oy, D.pos.x, D.pos.y);
  e1 = 0; if (abs(lAO - lOC) < 0.001) { e1 = 1; }
  e2 = 0; if (abs(lBO - lOD) < 0.001) { e2 = 1; }
  } else if (tab == 4) {
  aBAC = gBAC(); aDCA = gDCA(); sAB = lAB(); sCD = lCD();
  e1 = 0; if (abs(aBAC - aDCA) < 0.015) { e1 = 1; }
  e2 = 0; if (abs(sAB - sCD) < 0.001) { e2 = 1; }
  }
  clSd1.active = tab == 1 && e1 > 0.5;
  clSd2.active = tab == 1 && e2 > 0.5;
  clAn1.active = tab == 2 && e1 > 0.5;
  clAn0.active = tab == 2 && e1 < 0.5;
  clBn1.active = tab == 2 && e2 > 0.5;
  clBn0.active = tab == 2 && e2 < 0.5;
  clDg1.active = tab == 3 && e1 > 0.5;
  clDg2.active = tab == 3 && e2 > 0.5;
  clPr1.active = tab == 4 && e2 > 0.5;
  if (tab == 1) {
    info = "**Противоположные стороны:** AB = " + format(sAB, 2) + ", CD = " + format(sCD, 2) + "; BC = " + format(sBC, 2) + ", DA = " + format(sDA, 2) + ".\n\n";
    if (e1 > 0.5 && e2 > 0.5) {
      info = info + "**Обе пары противоположных сторон равны.** Диагональ AC делит ABCD на два треугольника с тремя парами равных сторон (AB = CD, BC = DA, AC общая), значит они равны по третьему признаку. Отсюда ∠BAC = ∠DCA — накрест лежащие при секущей AC, то есть AB ∥ CD; так же ∠CAD = ∠ACB, то есть BC ∥ DA (равные углы отмечены дугами).\n\n**ABCD — параллелограмм.**";
    } else if (e1 > 0.5 || e2 > 0.5) {
      info = info + "Равна только одна пара противоположных сторон — этого недостаточно: для признака нужно равенство обеих пар, иначе ABCD может быть не параллелограммом.";
    } else {
      info = info + "Ни одна пара противоположных сторон не равна, признак не выполнен — ABCD не обязан быть параллелограммом.";
    }
  } else if (tab == 2) {
    info = "**Противоположные углы:** ∠A = " + format(iA, 1) + "°, ∠C = " + format(iC, 1) + "°; ∠B = " + format(iB, 1) + "°, ∠D = " + format(iD, 1) + "°. Сумма углов выпуклого четырёхугольника равна 360°.\n\n";
    if (e1 > 0.5 && e2 > 0.5) {
      info = info + "**Противоположные углы равны попарно:** ∠A = ∠C, ∠B = ∠D. Тогда 2·∠A + 2·∠B = 360°, то есть ∠A + ∠B = " + format(iA + iB, 1) + "° — соседние углы дополняют друг друга до развёрнутого. Они внутренние односторонние при секущей AB, поэтому AD ∥ BC; так же ∠B + ∠C = 180° даёт AB ∥ CD.\n\n**ABCD — параллелограмм.**";
    } else if (e1 > 0.5 || e2 > 0.5) {
      info = info + "Равна только одна пара противоположных углов — этого недостаточно: для признака нужно равенство обеих пар.";
    } else {
      info = info + "Противоположные углы не равны, признак не выполнен — ABCD не обязан быть параллелограммом.";
    }
  } else if (tab == 3) {
    info = "**Диагонали пересекаются в точке O:** AO = " + format(lAO, 2) + ", OC = " + format(lOC, 2) + "; BO = " + format(lBO, 2) + ", OD = " + format(lOD, 2) + ".\n\n";
    if (e1 > 0.5 && e2 > 0.5) {
      info = info + "**Обе диагонали делятся точкой O пополам.** Поворот на 180° вокруг O переводит каждую вершину в противоположную, а треугольники AOB и COD равны по двум сторонам и углу между ними (вертикальные углы при O равны). Отсюда ∠OAB = ∠OCD — накрест лежащие при секущей AC, то есть AB ∥ CD; так же BC ∥ DA.\n\n**ABCD — параллелограмм.**";
    } else if (e1 > 0.5 || e2 > 0.5) {
      info = info + "Пополам делится только одна диагональ — этого недостаточно: для признака нужно, чтобы точка пересечения делила пополам обе.";
    } else {
      info = info + "Ни одна диагональ не делится точкой пересечения пополам, признак не выполнен — ABCD не обязан быть параллелограммом.";
    }
  } else if (tab == 4) {
    string pw = "стороны не параллельны"; if (e1 > 0.5) { pw = "стороны параллельны"; }
    info = "**Пара сторон AB и CD.** Параллельность: ∠BAC = " + format(aBAC, 1) + "°, ∠DCA = " + format(aDCA, 1) + "° — накрест лежащие при секущей AC, " + pw + ". Равенство: AB = " + format(sAB, 2) + ", CD = " + format(sCD, 2) + ".\n\n";
    if (e1 > 0.5 && e2 > 0.5) {
      info = info + "**AB ∥ CD и AB = CD одновременно.** Треугольники ABC и CDA равны по двум сторонам и углу между ними (AB = CD, ∠BAC = ∠DCA, AC общая), значит ∠BCA = ∠DAC — накрест лежащие при секущей AC для BC и DA, то есть BC ∥ DA.\n\n**ABCD — параллелограмм.**";
    } else if (e1 > 0.5) {
      info = info + "Стороны AB и CD параллельны, но не равны — это трапеция, а не параллелограмм: параллельности одной без другого мало.";
    } else if (e2 > 0.5) {
      info = info + "Стороны AB и CD равны, но не параллельны — параллелограмма нет: равенства одного без параллельности мало.";
    } else {
      info = info + "Не выполнено ни одно из двух требований — ни параллельность, ни равенство пары AB и CD.";
    }
  }
}
]
