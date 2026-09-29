[
description = "{info}"

field width = 16;
field height = 12;
camera type = fixed;

// ---- Произвольный треугольник ABC: все вершины свободны. Вершина, которую двигают, слегка
// «примагничивается» к положению, где AB = CA (A — на серединном перпендикуляре BC, B и C — на
// окружности с центром A), поэтому равнобедренность точная. Вкладки — три признака: равные
// углы при основании; совпадение высоты и медианы; совпадение биссектрисы и высоты. ----
new Point { name = "A"; pos = (-1.5, 4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (-5, -2.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (4.5, -3); text = true("C"); pauseOnDrag = false }

new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "abc"; elements = (ab, bc, ca) }

// Засечки равных боковых сторон — только когда AB = CA (кластер включается в Update).
draw EquallySing { name = "eqLegs"; edges = (ab, ca); type = 1 }
new Claster { name = "kEq"; elements = (eqLegs); active = false }

// ---- Вкладка 1: два равных угла ----
new Angle { name = "angB"; lines = (ab, bc) }
new Angle { name = "angC"; lines = (bc, ca) }
draw Angle { name = "arcB"; angle = "angB"; count = 1 }
draw Angle { name = "arcC"; angle = "angC"; count = 1 }
new Claster { name = "tab1"; elements = (arcB, arcC); active = true }

// ---- Вкладка 2: высота AH и медиана AM ----
new Point { name = "H"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("H") }
new Point { name = "M"; construct = median; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("M") }
new Line { name = "ah"; pos = (A, H); interact = false; color = #3b82f6 }
new Line { name = "am"; pos = (A, M); interact = false; color = #f59e0b; layer = 30 }
new Claster { name = "tab2"; elements = (H, M, ah, am); active = false }

// ---- Вкладка 3: биссектриса AD и высота AH2 ----
new Point { name = "D"; construct = bisector; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("D") }
new Point { name = "H2"; construct = altitude; vertex = A; base = "bc"; dynamic = false; collision = false; text = true("H") }
new Line { name = "ad"; pos = (A, D); interact = false; color = #22c55e }
new Line { name = "ah2"; pos = (A, H2); interact = false; color = #3b82f6; layer = 30 }
new Claster { name = "tab3"; elements = (D, H2, ad, ah2); active = false }

new UI { name = "btn1"; type = button; label = "Равные углы"; action = "tab = 1; tab1.active = true; tab2.active = false; tab3.active = false" }
new UI { name = "btn2"; type = button; label = "Высота и медиана"; action = "tab = 2; tab1.active = false; tab2.active = true; tab3.active = false" }
new UI { name = "btn3"; type = button; label = "Биссектриса и высота"; action = "tab = 3; tab1.active = false; tab2.active = false; tab3.active = true" }

// ---- Логика ----
float tab = 1;
string info = "";
float pax = 0; float pay = 0; float pbx = 0; float pby = 0; float pcx = 0; float pcy = 0;
float sx = 0; float sy = 0;

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

// Магнит: двигаемая вершина (x, y) в пределах 0.35 от положения с AB = CA переносится точно
// туда. Для A — на серединный перпендикуляр отрезка PQ = BC, для B и C — на окружность
// с центром A (P) радиуса AQ, где Q — вторая вершина основания. Если сдвиг недопустим — не трогаем.
Function snapApex(x, y, px, py, qx, qy) {
  float dx = qx - px; float dy = qy - py;
  float L = sqrt(dx * dx + dy * dy);
  float ux = dx / L; float uy = dy / L;
  float t = (x - (px + qx) / 2) * ux + (y - (py + qy) / 2) * uy;
  sx = x; sy = y;
  if (abs(t) < 0.35 && ok(x - t * ux, y - t * uy, px, py, qx, qy)) { sx = x - t * ux; sy = y - t * uy; }
  return 0;
}
Function snapBase(x, y, ax, ay, qx, qy) {
  float r = sqrt((qx - ax) * (qx - ax) + (qy - ay) * (qy - ay));
  float d = sqrt((x - ax) * (x - ax) + (y - ay) * (y - ay));
  sx = x; sy = y;
  if (d > 0.0001 && abs(d - r) < 0.35) {
    float nx = ax + (x - ax) * r / d; float ny = ay + (y - ay) * r / d;
    if (ok(nx, ny, ax, ay, qx, qy)) { sx = nx; sy = ny; }
  }
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
  float shift = abs((B.pos.x - pbx) - (A.pos.x - pax)) + abs((B.pos.y - pby) - (A.pos.y - pay))
              + abs((C.pos.x - pcx) - (A.pos.x - pax)) + abs((C.pos.y - pcy) - (A.pos.y - pay));
  if (m >= 0.000001 && shift >= 0.000001) {
    if (mA == m) {
      slide(pax, pay, A.pos.x, A.pos.y, pbx, pby, pcx, pcy); snapApex(sx, sy, pbx, pby, pcx, pcy);
      A.pos.x = sx; A.pos.y = sy; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
    } else if (mB == m) {
      slide(pbx, pby, B.pos.x, B.pos.y, pax, pay, pcx, pcy); snapBase(sx, sy, pax, pay, pcx, pcy);
      B.pos.x = sx; B.pos.y = sy; A.pos.x = pax; A.pos.y = pay; C.pos.x = pcx; C.pos.y = pcy;
    } else {
      slide(pcx, pcy, C.pos.x, C.pos.y, pax, pay, pbx, pby); snapBase(sx, sy, pax, pay, pbx, pby);
      C.pos.x = sx; C.pos.y = sy; A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby;
    }
  }
  if (!inField(A.pos.x, A.pos.y) || !inField(B.pos.x, B.pos.y) || !inField(C.pos.x, C.pos.y)) {
    A.pos.x = pax; A.pos.y = pay; B.pos.x = pbx; B.pos.y = pby; C.pos.x = pcx; C.pos.y = pcy;
  }
  pax = A.pos.x; pay = A.pos.y; pbx = B.pos.x; pby = B.pos.y; pcx = C.pos.x; pcy = C.pos.y;

  float c = ab.length; float b = ca.length;
  float iso = 0; if (abs(c - b) < 0.002) { iso = 1; }
  kEq.active = iso > 0.5;
  string sides = "AB = " + format(c, 2) + ", CA = " + format(b, 2);
  if (tab == 1) {
    if (iso > 0.5) {
      info = "**Два угла равны — равны и противолежащие им стороны:** ∠B = ∠C = " + format(angB.measure, 0) + "°, поэтому CA = AB = " + format(c, 2) + ". Треугольник равнобедренный, BC — основание.";
    } else {
      info = "**Углы не равны:** ∠B = " + format(angB.measure, 0) + "°, ∠C = " + format(angC.measure, 0) + "°. Против большего угла лежит большая сторона: CA (против ∠B) = " + format(b, 2) + ", AB (против ∠C) = " + format(c, 2) + " — стороны различны, признак не выполнен.";
    }
  } else if (tab == 2) {
    if (iso > 0.5) {
      info = "**Высота и медиана из вершины A совпали** (H = M, HM = " + format(sqrt((H.pos.x - M.pos.x) * (H.pos.x - M.pos.x) + (H.pos.y - M.pos.y) * (H.pos.y - M.pos.y)), 2) + "): эта линия — серединный перпендикуляр к BC, поэтому AB = CA = " + format(c, 2) + ".";
    } else {
      info = "**Высота AH и медиана AM не совпадают:** HM = " + format(sqrt((H.pos.x - M.pos.x) * (H.pos.x - M.pos.x) + (H.pos.y - M.pos.y) * (H.pos.y - M.pos.y)), 2) + ". Стороны различны: " + sides + ".";
    }
  } else {
    if (iso > 0.5) {
      info = "**Биссектриса и высота из вершины A совпали** (D = H, DH = " + format(sqrt((D.pos.x - H2.pos.x) * (D.pos.x - H2.pos.x) + (D.pos.y - H2.pos.y) * (D.pos.y - H2.pos.y)), 2) + "): треугольники ABH и ACH равны по общей стороне и двум углам, поэтому AB = CA = " + format(c, 2) + ".";
    } else {
      info = "**Биссектриса AD и высота AH не совпадают:** DH = " + format(sqrt((D.pos.x - H2.pos.x) * (D.pos.x - H2.pos.x) + (D.pos.y - H2.pos.y) * (D.pos.y - H2.pos.y)), 2) + ". Стороны различны: " + sides + ".";
    }
  }
}
]
