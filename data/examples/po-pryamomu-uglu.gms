[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Произвольный параллелограмм ABCD: все вершины перетаскиваются, при сдвиге одной
// пересчитывается противоположная (C = B + D − A и т. п.). ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (6.5, 3.5); text = true("C"); pauseOnDrag = false }
new Point { name = "D"; pos = (-2.5, 3.5); text = true("D"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "cd"; pos = (C, D) }
new Line { name = "da"; pos = (D, A) }
new Figure { name = "abcd"; elements = (ab, bc, cd, da) }

new Angle { name = "angA"; lines = (ab, da) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, cd) }
new Angle { name = "angD"; lines = (cd, da) }
draw Angle { name = "arcA"; angle = "angA" }
draw Angle { name = "arcB"; angle = "angB"; count = 2 }
draw Angle { name = "arcC"; angle = "angC" }
draw Angle { name = "arcD"; angle = "angD"; count = 2 }

float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0;
float pcx = 0; float pcy = 0; float pdx = 0; float pdy = 0;
float sx = 0; float sy = 0;

// Лежит ли точка (x, y) внутри поля. fieldMaxX / fieldMaxY — граница для центров точек
// с отступом в радиус точки (та же, что у движка), чтобы вершина у стенки была видна
// целиком и её можно было схватить.
Function inField(x, y) {
  return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001;
}

// Допустимо ли положение (x, y) перетаскиваемой вершины при соседях (ax, ay), (bx, by):
// противоположная вершина остаётся в поле, стороны не короче 0.35 (вершины вплотную),
// угол при вершине от 15° до 165° (sin ≥ 0.26).
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y) || !inField(ax + bx - x, ay + by - y)) { return false; }
  float ux = ax - x; float uy = ay - y;
  float vx = bx - x; float vy = by - y;
  float lu = sqrt(ux * ux + uy * uy);
  float lv = sqrt(vx * vx + vy * vy);
  if (lu < 0.35 || lv < 0.35) { return false; }
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

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;
}

Update {
  // Смещения вершин за кадр.
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float mD = abs(D.pos.x - pdx) + abs(D.pos.y - pdy);
  float m = max(mA, mB, mC, mD);
  // Перетаскивание фигуры целиком: все вершины сдвинуты на один и тот же вектор —
  // форма не меняется, границу поля уже соблюдает сам движок.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay))
              + abs((D.pos.x - pdx) - (A.pos.x - pax)) + abs((D.pos.y - pdy) - (A.pos.y - pay));
  if (m < 0.000001 || shift < 0.000001) {
  } else if (mA == m) {
    // Двигают одну вершину (с наибольшим смещением — у остальных пересчёты дают
    // погрешность ~1e-15): ограничиваем её ход (slide) и пересчитываем противоположную,
    // соседние стоят на месте.
    slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pdx, pdy);
    A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    C.pos.x = pbx + pdx - sx; C.pos.y = pby + pdy - sy;
  } else if (mB == m) {
    slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy);
    B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    D.pos.x = pax + pcx - sx; D.pos.y = pay + pcy - sy;
  } else if (mC == m) {
    slide(pcx, pcy, C.pos.x, C.pos.y, pbx, pby, pdx, pdy);
    C.pos.x = sx; C.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; D.pos.x = pdx; D.pos.y = pdy;
    A.pos.x = pbx + pdx - sx; A.pos.y = pby + pdy - sy;
  } else {
    slide(pdx, pdy, D.pos.x, D.pos.y, pax, pay, pcx, pcy);
    D.pos.x = sx; D.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    B.pos.x = pax + pcx - sx; B.pos.y = pay + pcy - sy;
  }
  // Магнит к прямому углу при A: если угол DAB отличается от 90° меньше чем на 2°,
  // D поворачивается вокруг A ровно до 90° (длина AD сохраняется), C пересчитывается.
  float mex = B.pos.x - A.pos.x; float mey = B.pos.y - A.pos.y;
  float mdx = D.pos.x - A.pos.x; float mdy = D.pos.y - A.pos.y;
  float mla = sqrt(mex * mex + mey * mey); float mld = sqrt(mdx * mdx + mdy * mdy);
  float mco = (mex * mdx + mey * mdy) / (mla * mld);
  float msg = 1;
  if (mex * mdy - mey * mdx < 0) { msg = -1; }
  if (abs(mco) < 0.035 && abs(mco) > 0.0000001) {
    float ndx = A.pos.x - msg * mey / mla * mld; float ndy = A.pos.y + msg * mex / mla * mld;
    float ncx = B.pos.x + ndx - A.pos.x; float ncy = B.pos.y + ndy - A.pos.y;
    if (inField(ndx, ndy) && inField(ncx, ncy)) {
      D.pos.x = ndx; D.pos.y = ndy; C.pos.x = ncx; C.pos.y = ncy;
    }
  }
  // Страховка: если по какой-то причине кадр дал не параллелограмм или вершину вне поля,
  // возвращаем последнее корректное положение целиком.
  if (abs(A.pos.x + C.pos.x - B.pos.x - D.pos.x) + abs(A.pos.y + C.pos.y - B.pos.y - D.pos.y) > 0.0001
      || !inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y) || !inField(D.pos.x, D.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    C.pos.x = pcx; C.pos.y = pcy; D.pos.x = pdx; D.pos.y = pdy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y;
  pcx = C.pos.x; pcy = C.pos.y; pdx = D.pos.x; pdy = D.pos.y;

  string angs = "∠A = ∠B = ∠C = ∠D = 90°.";
  if (abs(mco) < 0.0000001) {
    info = "**Один угол прямой:** ∠A = 90°.\n\nПротиволежащий угол равен ему: ∠C = ∠A = 90°. Смежные углы дополняют друг друга до 180°: ∠B = ∠D = 180° − 90° = 90°.\n\n**Все четыре угла прямые — параллелограмм оказался прямоугольником.** " + angs;
  } else {
    info = "**Пока ∠A = " + format(angA.measure, 0) + "° — не прямой:** ∠C = ∠A = " + format(angA.measure, 0) + "°, а смежные углы дополняют до 180°: ∠B = ∠D = 180° − " + format(angA.measure, 0) + "° = " + format(180 - round(angA.measure), 0) + "°.\n\nЭто общий параллелограмм. Стоит сделать один угол прямым, как остальные три станут прямыми автоматически. Угол ∠A притягивается к 90°.";
  }
}
]
