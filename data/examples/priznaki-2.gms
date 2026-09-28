[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Произвольный треугольник ABC, все вершины перетаскиваются свободно.
// Вкладка «По медиане» — медиана к стороне AB и её сравнение с половиной AB.
// Вкладка «По описанной окружности» — центр описанной окружности O и сравнение
// радиуса с половиной стороны AB. В обоих случаях равенство означает, что угол
// при вершине C, лежащей против AB, — прямой. ----
new Point { name = "A"; pos = (-5.5, -3.2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3.2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (1, 4.2); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcC"; angle = "angC"; color = markC }

// ---- Вкладка 1: медиана к AB ----
new Point { name = "M"; construct = median; vertex = C; base = "ab"; dynamic = false; text = true("M") }
new Line { name = "cm"; pos = (C, M); interact = false }
new Claster { name = "tabMed"; elements = (M, cm); active = true }

// ---- Вкладка 2: центр описанной окружности ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Line { name = "oc"; pos = (O, C); interact = false }
new Line { name = "oa"; pos = (O, A); interact = false }
new Line { name = "ob"; pos = (O, B); interact = false }
new Claster { name = "tabRad"; elements = (O, oc, oa, ob); active = false }

new UI { name = "btnMed"; type = button; label = "По медиане"; action = "tab = 1; tabMed.active = true; tabRad.active = false" }
new UI { name = "btnRad"; type = button; label = "По описанной окружности"; action = "tab = 2; tabMed.active = false; tabRad.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
string markC = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;

Function area2(x, y, ax, ay, bx, by) { return abs((ax - x) * (by - y) - (bx - x) * (ay - y)); }
Function ok(x, y, ax, ay, bx, by) {
  if (area2(x, y, ax, ay, bx, by) < 3) { return false; }
  float dx1 = ax - x; float dy1 = ay - y; float dx2 = bx - x; float dy2 = by - y;
  if (sqrt(dx1 * dx1 + dy1 * dy1) < 0.6 || sqrt(dx2 * dx2 + dy2 * dy2) < 0.6) { return false; }
  return true;
}
float sx = 0; float sy = 0;
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
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;
}

Update {
  float mA = abs(A.pos.x - pax) + abs(A.pos.y - pay);
  float mB = abs(B.pos.x - pbx) + abs(B.pos.y - pby);
  float mC = abs(C.pos.x - pcx) + abs(C.pos.y - pcy);
  float m = max(mA, mB, mC);
  if (m >= 0.000001) {
    if (mA == m) { slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); A.pos.x = sx; A.pos.y = sy; }
    else if (mB == m) { slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); B.pos.x = sx; B.pos.y = sy; }
    else { slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); C.pos.x = sx; C.pos.y = sy; }
  }
  if (area2(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y) < 2.5) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  // Центр описанной окружности — пересечение серединных перпендикуляров.
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx2 = C.pos.x; float cy2 = C.pos.y;
  float dd = 2 * (ax * (by - cy2) + bx * (cy2 - ay) + cx2 * (ay - by));
  O.pos.x = ((ax * ax + ay * ay) * (by - cy2) + (bx * bx + by * by) * (cy2 - ay) + (cx2 * cx2 + cy2 * cy2) * (ay - by)) / dd;
  O.pos.y = ((ax * ax + ay * ay) * (cx2 - bx) + (bx * bx + by * by) * (ax - cx2) + (cx2 * cx2 + cy2 * cy2) * (bx - ax)) / dd;

  float half = ab.length / 2;
  markC = ""; if (abs(angC.measure - 90) < 0.15) { markC = "#22c55e"; }

  if (tab == 1) {
    info = "**Медиана CM** к стороне AB = " + format(cm.length, 2) + ", половина AB = " + format(half, 2) + ".\n\n";
    if (abs(cm.length - half) < 0.03) { info = info + "**Равны — угол C прямой** (" + format(angC.measure, 0) + "°): вершина C лежит на окружности с диаметром AB."; }
    else { info = info + "Не равны — угол C = " + format(angC.measure, 0) + "° не прямой."; }
  } else {
    float R = sqrt((O.pos.x - ax) * (O.pos.x - ax) + (O.pos.y - ay) * (O.pos.y - ay));
    info = "**Радиус описанной окружности R** = " + format(R, 2) + ", половина AB = " + format(half, 2) + ".\n\n";
    if (abs(R - half) < 0.03) { info = info + "**Равны — угол C прямой** (" + format(angC.measure, 0) + "°): центр O — середина гипотенузы AB."; }
    else { info = info + "Не равны — угол C = " + format(angC.measure, 0) + "° не прямой."; }
  }
}
]
