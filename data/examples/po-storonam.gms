[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Три вершины свободны (ограничены только полем и невырожденностью). Вершина, которую
// двигают, слегка «примагничивается» к положениям, где стороны равны (равнобедренный,
// равносторонний), поэтому равенство точное, а не «на глаз». Тип определяется в Update. ----
new Point { name = "A"; pos = (-1.5, 4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-5, -2.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4.5, -3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }
new Angle { name = "angA"; lines = (ab, ca) }
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }

// Засечки равных сторон: у draw EquallySing нет поля active, поэтому каждый вариант — в своём
// кластере, а кластеры включаются в Update по типу треугольника.
draw EquallySing { name = "eqA"; edges = (ab, ca); type = 1 }
draw EquallySing { name = "eqB"; edges = (ab, bc); type = 1 }
draw EquallySing { name = "eqC"; edges = (bc, ca); type = 1 }
draw EquallySing { name = "eqAll"; edges = (ab, bc, ca); type = 1 }
new Claster { name = "kA"; elements = (eqA); active = false }
new Claster { name = "kB"; elements = (eqB); active = false }
new Claster { name = "kC"; elements = (eqC); active = false }
new Claster { name = "kAll"; elements = (eqAll); active = false }

// ---- Логика ----
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float isoAB = 0; float isoBC = 0; float isoCA = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }

// Допустимо ли положение (x, y) двигаемой вершины при двух других фиксированных: в поле,
// и площадь треугольника не вырождается (стороны не схлопываются и не выстраиваются в линию).
Function ok(x, y, ox1, oy1, ox2, oy2) {
  if (!inField(x, y)) { return false; }
  float d1 = sqrt((x - ox1) * (x - ox1) + (y - oy1) * (y - oy1));
  float d2 = sqrt((x - ox2) * (x - ox2) + (y - oy2) * (y - oy2));
  if (d1 < 0.35 || d2 < 0.35) { return false; }
  float area2 = abs((ox2 - ox1) * (y - oy1) - (oy2 - oy1) * (x - ox1));
  return area2 > 0.5;
}

Function reach(x0, y0, dx, dy, ox1, oy1, ox2, oy2) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ox1, oy1, ox2, oy2)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (ok(x0 + dx * mid, y0 + dy * mid, ox1, oy1, ox2, oy2)) { good = mid; } else { bad = mid; }
  }
  return good;
}

float sx = 0; float sy = 0;
Function slide(px, py, nx, ny, ox1, oy1, ox2, oy2) {
  float t = reach(px, py, nx - px, ny - py, ox1, oy1, ox2, oy2);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  float rx = nx - cx; float ry = ny - cy;
  if (t < 1) {
    cx = cx + rx * reach(cx, cy, rx, 0, ox1, oy1, ox2, oy2);
    cy = cy + ry * reach(cx, cy, 0, ry, ox1, oy1, ox2, oy2);
  }
  sx = cx; sy = cy;
  return 0;
}

// Магнит: если двигаемая вершина (x, y) (две другие — P и Q) в пределах 0.35 от положения
// с равными сторонами, она переносится точно туда. Сначала равносторонний, затем ближайшее
// из равнобедренных (на серединном перпендикуляре PQ или на окружностях радиуса PQ вокруг P, Q).
// Результат — в (sx, sy); если сдвиг сделал бы положение недопустимым, вершина остаётся как есть.
Function snap(x, y, px, py, qx, qy) {
  float dx = qx - px; float dy = qy - py;
  float L = sqrt(dx * dx + dy * dy);
  float ux = dx / L; float uy = dy / L;
  float mx = (px + qx) / 2; float my = (py + qy) / 2;
  float bestD = 0.35; float bx = x; float by = y;
  float h = L * 0.8660254;
  float e1x = mx - uy * h; float e1y = my + ux * h;
  float e2x = mx + uy * h; float e2y = my - ux * h;
  float d1 = sqrt((x - e1x) * (x - e1x) + (y - e1y) * (y - e1y));
  float d2 = sqrt((x - e2x) * (x - e2x) + (y - e2y) * (y - e2y));
  if (d1 <= d2 && d1 < bestD) { bestD = d1; bx = e1x; by = e1y; }
  else if (d2 < d1 && d2 < bestD) { bestD = d2; bx = e2x; by = e2y; }
  if (bestD >= 0.35) {
    float t = (x - mx) * ux + (y - my) * uy;
    float dl = abs((x - mx) * (-uy) + (y - my) * ux);
    float dp = sqrt((x - px) * (x - px) + (y - py) * (y - py));
    float dq = sqrt((x - qx) * (x - qx) + (y - qy) * (y - qy));
    float c1 = abs(dp - L); float c2 = abs(dq - L);
    if (abs(t) < 0.35 && abs(t) <= c1 && abs(t) <= c2) { bestD = abs(t); bx = x - t * ux; by = y - t * uy; }
    else if (c1 < 0.35 && c1 <= c2 && dp > 0.0001) { bestD = c1; bx = px + (x - px) * L / dp; by = py + (y - py) * L / dp; }
    else if (c2 < 0.35 && dq > 0.0001) { bestD = c2; bx = qx + (x - qx) * L / dq; by = qy + (y - qy) * L / dq; }
  }
  if (bestD < 0.35 && ok(bx, by, px, py, qx, qy)) { sx = bx; sy = by; } else { sx = x; sy = y; }
  return 0;
}

Start {
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  // Перенос фигуры целиком (все вершины на один вектор) — форма не меняется, не трогаем.
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (m >= 0.000001 && shift >= 0.000001) {
    if (mA == m) {
      slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); snap(sx, sy, pbx, pby, pcx, pcy);
      A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    } else if (mB == m) {
      slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); snap(sx, sy, pax, pay, pcx, pcy);
      B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    } else {
      slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); snap(sx, sy, pax, pay, pbx, pby);
      C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    }
  }
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float a = bc.length; float b = ca.length; float c = ab.length;
  float eps = 0.002;
  float eAB = 0; if (abs(c - b) < eps) { eAB = 1; }
  float eBC = 0; if (abs(a - c) < eps) { eBC = 1; }
  float eCA = 0; if (abs(b - a) < eps) { eCA = 1; }
  float nEq = eAB + eBC + eCA;
  kAll.active = nEq > 2.5;
  kA.active = nEq > 0.5 && nEq < 2.5 && eAB > 0.5;
  kB.active = nEq > 0.5 && nEq < 2.5 && eBC > 0.5;
  kC.active = nEq > 0.5 && nEq < 2.5 && eCA > 0.5;

  string angs = "∠A = " + format(angA.measure, 0) + "°, ∠B = " + format(angB.measure, 0) + "°, ∠C = " + format(angC.measure, 0) + "°";
  if (nEq > 2.5) {
    info = "**Равносторонний:** AB = BC = CA = " + format(c, 2) + ". Равенство выполнено для всех трёх пар сторон — это частный случай равнобедренного.\n\nВсе углы равны: " + angs + ".";
  } else if (nEq > 0.5) {
    string legs = "BC"; string base = "AB"; string eqa = "∠B = ∠C = " + format(angB.measure, 0) + "°"; float lv = a; float bv = c;
    if (eAB > 0.5) { legs = "AB = CA"; base = "BC"; lv = c; bv = a; eqa = "∠B = ∠C = " + format(angB.measure, 0) + "°"; }
    else if (eBC > 0.5) { legs = "AB = BC"; base = "CA"; lv = c; bv = b; eqa = "∠A = ∠C = " + format(angA.measure, 0) + "°"; }
    else { legs = "BC = CA"; base = "AB"; lv = a; bv = c; eqa = "∠A = ∠B = " + format(angA.measure, 0) + "°"; }
    info = "**Равнобедренный:** боковые стороны " + legs + " = " + format(lv, 2) + ", основание " + base + " = " + format(bv, 2) + ".\n\nУглы при основании равны: " + eqa + " (" + angs + ").";
  } else {
    info = "**Разносторонний:** AB = " + format(c, 2) + ", BC = " + format(a, 2) + ", CA = " + format(b, 2) + " — все три стороны различны.\n\nУглы тоже различны: " + angs + ". Осей симметрии нет.";
  }
}
]
