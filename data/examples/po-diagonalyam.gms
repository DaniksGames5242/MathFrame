[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Признак «по диагоналям»: произвольный выпуклый четырёхугольник ABCD; O — точка
// пересечения диагоналей. Если она делит пополам обе, ABCD — параллелограмм. ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-3.5, 2.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Line { name = "ao"; pos = (A, O); interact = false }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "bo"; pos = (B, O); interact = false }
new Line { name = "od"; pos = (O, D); interact = false }
draw EquallySing { name = "eqAoOc"; edges = (ao, oc); type = 1 }
draw EquallySing { name = "eqBoOd"; edges = (bo, od); type = 2 }

new Claster { name = "clDg1"; elements = (eqAoOc); active = false }
new Claster { name = "clDg2"; elements = (eqBoOd); active = false }

float e1 = 0; float e2 = 0;
float ox = 0; float oy = 0; float lAO = 0; float lOC = 0; float lBO = 0; float lOD = 0;

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

// Точка пересечения диагоналей AC и BD: A + s·(C − A).
Function crossO() {
  float s = ((B.pos.x - A.pos.x) * (D.pos.y - B.pos.y) - (B.pos.y - A.pos.y) * (D.pos.x - B.pos.x))
          / ((C.pos.x - A.pos.x) * (D.pos.y - B.pos.y) - (C.pos.y - A.pos.y) * (D.pos.x - B.pos.x));
  ox = A.pos.x + s * (C.pos.x - A.pos.x); oy = A.pos.y + s * (C.pos.y - A.pos.y);
  return 0;
}

// Выполнено ли условие признака с допуском t (длины — в единицах поля, углы — 15·t градусов).
Function near(t) {
  crossO();
  return abs(dst(A.pos.x, A.pos.y, ox, oy) - dst(ox, oy, C.pos.x, C.pos.y)) < t && abs(dst(B.pos.x, B.pos.y, ox, oy) - dst(ox, oy, D.pos.x, D.pos.y)) < t;
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

  crossO();
  if (abs(O.pos.x - ox) + abs(O.pos.y - oy) > 0.000001) { O.pos.x = ox; O.pos.y = oy; }
  lAO = dst(A.pos.x, A.pos.y, ox, oy); lOC = dst(ox, oy, C.pos.x, C.pos.y); lBO = dst(B.pos.x, B.pos.y, ox, oy); lOD = dst(ox, oy, D.pos.x, D.pos.y);
  e1 = 0; if (abs(lAO - lOC) < 0.001) { e1 = 1; }
  e2 = 0; if (abs(lBO - lOD) < 0.001) { e2 = 1; }
  clDg1.active = true && e1 > 0.5;
  clDg2.active = true && e2 > 0.5;
    info = "**Диагонали пересекаются в точке O:** AO = " + format(lAO, 2) + ", OC = " + format(lOC, 2) + "; BO = " + format(lBO, 2) + ", OD = " + format(lOD, 2) + ".\n\n";
    if (e1 > 0.5 && e2 > 0.5) {
      info = info + "**Обе диагонали делятся точкой O пополам.** Поворот на 180° вокруг O переводит каждую вершину в противоположную, а треугольники AOB и COD равны по двум сторонам и углу между ними (вертикальные углы при O равны). Отсюда ∠OAB = ∠OCD — накрест лежащие при секущей AC, то есть AB ∥ CD; так же BC ∥ DA.\n\n**ABCD — параллелограмм.**";
    } else if (e1 > 0.5 || e2 > 0.5) {
      info = info + "Пополам делится только одна диагональ — этого недостаточно: для признака нужно, чтобы точка пересечения делила пополам обе.";
    } else {
      info = info + "Ни одна диагональ не делится точкой пересечения пополам, признак не выполнен — ABCD не обязан быть параллелограммом.";
    }
}
]
