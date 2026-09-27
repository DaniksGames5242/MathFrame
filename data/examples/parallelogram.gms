[
description = "{info}"

field width = 20;
field height = 12;
show boundary = true;

// ---- Вершины: все четыре перетаскиваются. Условие «ABCD — параллелограмм»
// поддерживается в Update: у перетаскиваемой вершины соседние остаются на месте,
// а противоположная пересчитывается (например, C = B + D − A). ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 3.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }

new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

// ---- Вкладка 1: стороны и углы ----
draw EquallySing { name = "eqAbCd"; edges = (ab, cd); type = 1 }
draw EquallySing { name = "eqBcDa"; edges = (bc, da); type = 2 }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD"; count = 2 }

new Claster { name = "tabSides"; elements = (eqAbCd, eqBcDa, arcA, arcB, arcC, arcD); active = true }

// ---- Вкладка 2: диагонали делятся точкой пересечения пополам ----
new Line { name = "diagAC"; pos = (A, C); active = false; interact = false }
new Point { name = "O"; construct = median; vertex = B; base = "diagAC"; dynamic = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }

new Claster { name = "tabDiag"; elements = (O, ao, oc, bo, od, eqAoOc, eqBoOd); active = false }

// ---- Вкладка 3: площадь = основание × высота ----
new Point { name = "H"; construct = altitude; vertex = D; base = "ab"; dynamic = false; text = true("H") }
new Line { name = "dh"; pos = (D, H); interact = false }
// Прямой угол при H отмечается между DH и невидимой (transparent) вспомогательной HA.
// Пунктир продолжения стороны AB рисуется по отдельной скрытой линии haExt — у неё цвет
// не задан, поэтому пунктир следует теме. Слой 1 — под стороной AB: пунктир заметен,
// только когда основание высоты H выходит за отрезок AB.
new Line { name = "ha"; pos = (H, A); color = "transparent"; interact = false; layer = 1 }
new Line { name = "haExt"; pos = (H, A); active = false; interact = false }
draw Punctir { name = "extAB"; edge = "haExt"; layer = 1 }
new Angle { name = "angH"; lines = (dh, ha) }
draw Angle { name = "arcH"; angle = "angH"; measure = false }

new Claster { name = "tabArea"; elements = (H, dh, ha, arcH, extAB); active = false }

// ---- Кнопки вкладок ----
new UI { name = "btnSides"; type = button; label = "Стороны и углы"; action = "tab = 1; tabSides.active = true; tabDiag.active = false; tabArea.active = false" }
new UI { name = "btnDiag"; type = button; label = "Диагонали"; action = "tab = 2; tabSides.active = false; tabDiag.active = true; tabArea.active = false" }
new UI { name = "btnArea"; type = button; label = "Площадь"; action = "tab = 3; tabSides.active = false; tabDiag.active = false; tabArea.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

// Лежит ли точка (x, y) внутри поля
Function inField(x, y) {
  return abs(x) <= 10 && abs(y) <= 6;
}

// Допустимо ли положение (x, y) перетаскиваемой вершины при соседях (ax, ay), (bx, by):
// противоположная вершина остаётся в поле, стороны не короче 1.5,
// угол при вершине от 15° до 165° (sin ≥ 0.26).
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y) || !inField(ax + bx - x, ay + by - y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 1.5 || lv < 1.5) { return false; }
  return abs(ux * vy - uy * vx) / (lu * lv) >= 0.26;
}

// Наибольшая доля t ∈ [0, 1] хода из (x0, y0) на вектор (dx, dy), до которой весь путь
// допустим. Путь проверяется по 16 промежуточным точкам (иначе быстрый ход «перепрыгнул»
// бы узкую запрещённую зону и фигура вывернулась бы через вырожденное положение), затем
// граница уточняется делением пополам.
Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; }
  }
  return good;
}

// Плавное ограничение хода вершины из (px, py) в (nx, ny): проходим допустимую часть
// хода, а остаток движения — отдельно по x и по y. Так вершина скользит вдоль границы
// поля и вдоль ограничений формы, а не застревает. Результат — в (sx, sy).
Function slide(px, py, nx, ny, ax, ay, bx, by) {
  float t = reach(px, py, nx - px, ny - py, ax, ay, bx, by);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ax, ay, bx, by);
    cy = cy + ry * reach(cx, cy, 0, ry, ax, ay, bx, by);
  }
  sx = cx; sy = cy;
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  // Сдвинувшуюся вершину (с наибольшим смещением — пересчёты дают погрешность ~1e-15
  // у остальных) ограничиваем (slide) и пересчитываем противоположную, соседние стоят. При перетаскивании фигуры целиком сдвигаются все
  // вершины на один вектор — это тоже корректно обрабатывается первой ветвью.
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  if (m < 0.000001) {
  } else if (mA == m) {
    slide(pax, pay, A.pos.x, A.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y);
    A.pos.x = sx; A.pos.y = sy;
    C.pos.x = B.pos.x + D.pos.x - sx; C.pos.y = B.pos.y + D.pos.y - sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y);
    B.pos.x = sx; B.pos.y = sy;
    D.pos.x = A.pos.x + C.pos.x - sx; D.pos.y = A.pos.y + C.pos.y - sy;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, B.pos.x, B.pos.y, D.pos.x, D.pos.y);
    C.pos.x = sx; C.pos.y = sy;
    A.pos.x = B.pos.x + D.pos.x - sx; A.pos.y = B.pos.y + D.pos.y - sy;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y);
    D.pos.x = sx; D.pos.y = sy;
    B.pos.x = A.pos.x + C.pos.x - sx; B.pos.y = A.pos.y + C.pos.y - sy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  if (tab == 1) {
    info = "**Противоположные стороны равны:** AB = CD = " + format(ab.length, 2) + ", BC = DA = " + format(bc.length, 2) + ".\n\n**Противоположные углы равны, соседние в сумме дают 180°:** ∠A = ∠C = " + format(angA.measure, 0) + "°, ∠B = ∠D = " + format(angB.measure, 0) + "°, ∠A + ∠B = " + format(angA.measure + angB.measure, 0) + "°.";
  } else if (tab == 2) {
    info = "**Диагонали точкой пересечения делятся пополам:** AO = OC = " + format(ao.length, 2) + ", BO = OD = " + format(bo.length, 2) + ".";
  } else {
    info = "**Площадь равна произведению основания на высоту:** S = AB · DH = " + format(ab.length, 2) + " · " + format(dh.length, 2) + " = " + format(ab.length * dh.length, 2) + ".";
  }
}
]
