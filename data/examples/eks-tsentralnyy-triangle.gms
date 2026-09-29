[
description = "{info}"

field width = 30;
field height = 20;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-3.5, -2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.5, -2.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0.5, 3.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Эксцентры и экс-центральный треугольник IaIbIc ----
new Point { name = "Ia"; pos = (0, 0); dynamic = false; collision = false; text = true("I_a") }
new Point { name = "Ib"; pos = (0, 0); dynamic = false; collision = false; text = true("I_b") }
new Point { name = "Ic"; pos = (0, 0); dynamic = false; collision = false; text = true("I_c") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I") }
new Line { name = "iab"; pos = (Ia, Ib); interact = false }
new Line { name = "ibc"; pos = (Ib, Ic); interact = false }
new Line { name = "ica"; pos = (Ic, Ia); interact = false }
new Figure { name = "exc"; elements = (iab, ibc, ica); interact = false }
// Высоты экс-центрального треугольника: IaA, IbB, IcC пересекаются в I
new Line { name = "ha"; pos = (Ia, A); active = false }
new Line { name = "hb"; pos = (Ib, B); active = false }
new Line { name = "hc"; pos = (Ic, C); active = false }
draw Punctir { name = "pa"; edge = "ha" }
draw Punctir { name = "pb"; edge = "hb" }
draw Punctir { name = "pc"; edge = "hc" }
// Описанная окружность ABC = окружность девяти точек экс-центрального треугольника
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Circle { name = "circ"; center = O; radius = A; color = #3b82f6; thickness = 2 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function dist(ax, ay, bx, by) { return sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
// Центр описанной окружности → (qx, qy)
Function cc(ax, ay, bx, by, cx, cy) {
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  qx = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  qy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return 0;
}
// Треугольник невырожденный: вершина в поле, стороны не короче 0.35, все углы от 8° до 172°
Function okBase(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  if (dist(x, y, ax, ay) < 0.35 || dist(x, y, bx, by) < 0.35) { return false; }
  return sinAt(x, y, ax, ay, bx, by) >= 0.14 && sinAt(ax, ay, x, y, bx, by) >= 0.14 && sinAt(bx, by, x, y, ax, ay) >= 0.14;
}

float e1x = 0; float e1y = 0; float e2x = 0; float e2y = 0; float e3x = 0; float e3y = 0;
// Эксцентры треугольника PQR: e1 — против P, e2 — против Q, e3 — против R
Function exc(px, py, qx0, qy0, rx, ry) {
  float p = dist(qx0, qy0, rx, ry); float q = dist(rx, ry, px, py); float r = dist(px, py, qx0, qy0);
  e1x = (-p * px + q * qx0 + r * rx) / (-p + q + r); e1y = (-p * py + q * qy0 + r * ry) / (-p + q + r);
  e2x = (p * px - q * qx0 + r * rx) / (p - q + r); e2y = (p * py - q * qy0 + r * ry) / (p - q + r);
  e3x = (p * px + q * qx0 - r * rx) / (p + q - r); e3y = (p * py + q * qy0 - r * ry) / (p + q - r);
  return 0;
}
// Допустимо, если сам треугольник, все три эксцентра и описанная окружность целиком в поле
Function ok(x, y, ax, ay, bx, by) {
  if (!okBase(x, y, ax, ay, bx, by)) { return false; }
  exc(x, y, ax, ay, bx, by);
  if (!inField(e1x, e1y) || !inField(e2x, e2y) || !inField(e3x, e3y)) { return false; }
  cc(x, y, ax, ay, bx, by);
  float rr = dist(qx, qy, x, y);
  return abs(qx) + rr <= fieldMaxX + 0.3 && abs(qy) + rr <= fieldMaxY + 0.3;
}

Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; } }
  return good;
}
// Плавный ход вершины: допустимая часть хода, остаток — по осям. Результат в (sx, sy)
Function slide(px, py, nx, ny, ax, ay, bx, by) {
  float t = reach(px, py, nx - px, ny - py, ax, ay, bx, by);
  float cx = px + (nx - px) * t; float cy = py + (ny - py) * t;
  if (t < 1) {
    cx = cx + (nx - cx) * reach(cx, cy, nx - cx, 0, ax, ay, bx, by);
    cy = cy + (ny - cy) * reach(cx, cy, 0, ny - cy, ax, ay, bx, by);
  }
  sx = cx; sy = cy;
  return 0;
}

Start { pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y; }

Update {
  float mA = abs(A.pos.x - pAx) + abs(A.pos.y - pAy);
  float mB = abs(B.pos.x - pBx) + abs(B.pos.y - pBy);
  float mC = abs(C.pos.x - pCx) + abs(C.pos.y - pCy);
  float m = max(mA, mB, mC);
  float shift = abs((B.pos.x - pBx) - (A.pos.x - pAx)) + abs((B.pos.y - pBy) - (A.pos.y - pAy)) + abs((C.pos.x - pCx) - (A.pos.x - pAx)) + abs((C.pos.y - pCy) - (A.pos.y - pAy));
  if (m > 0.000001 && shift > 0.000001) {
    if (mA == m) { slide(pAx, pAy, A.pos.x, A.pos.y, pBx, pBy, pCx, pCy); A.pos.x = sx; A.pos.y = sy; B.pos.x = pBx; B.pos.y = pBy; C.pos.x = pCx; C.pos.y = pCy; }
    else if (mB == m) { slide(pBx, pBy, B.pos.x, B.pos.y, pAx, pAy, pCx, pCy); B.pos.x = sx; B.pos.y = sy; A.pos.x = pAx; A.pos.y = pAy; C.pos.x = pCx; C.pos.y = pCy; }
    else { slide(pCx, pCy, C.pos.x, C.pos.y, pAx, pAy, pBx, pBy); C.pos.x = sx; C.pos.y = sy; A.pos.x = pAx; A.pos.y = pAy; B.pos.x = pBx; B.pos.y = pBy; }
  }
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = dist(bx, by, cx, cy); float b = dist(cx, cy, ax, ay); float c = dist(ax, ay, bx, by);
  exc(ax, ay, bx, by, cx, cy);
  Ia.pos.x = e1x; Ia.pos.y = e1y; Ib.pos.x = e2x; Ib.pos.y = e2y; Ic.pos.x = e3x; Ic.pos.y = e3y;
  float p = a + b + c;
  I.pos.x = (a * ax + b * bx + c * cx) / p; I.pos.y = (a * ay + b * by + c * cy) / p;
  cc(ax, ay, bx, by, cx, cy);
  O.pos.x = qx; O.pos.y = qy;
  float R = dist(qx, qy, ax, ay);
  float s = p / 2;
  float ea = 4 * R * sqrt(s * (s - a) / (b * c));
  float eb = 4 * R * sqrt(s * (s - b) / (c * a));
  float ec = 4 * R * sqrt(s * (s - c) / (a * b));
  float se = abs((e2x - e1x) * (e3y - e1y) - (e2y - e1y) * (e3x - e1x)) / 2;
  info = "**Экс-центральный треугольник** IaIbIc — его вершины центры вневписанных окружностей ABC. Стороны проходят через вершины ABC: IbIc через A, IcIa через B, IaIb через C (внешние биссектрисы).\n\n**Стороны:** IbIc = " + format(dist(e2x, e2y, e3x, e3y), 2) + " = 4R cos(A/2) = " + format(ea, 2) + ", IcIa = " + format(dist(e3x, e3y, e1x, e1y), 2) + " = 4R cos(B/2) = " + format(eb, 2) + ", IaIb = " + format(dist(e1x, e1y, e2x, e2y), 2) + " = 4R cos(C/2) = " + format(ec, 2) + " (R = " + format(R, 2) + ").\n\n**Ортоцентр — инцентр I:** IaA, IbB, IcC — высоты экс-центрального треугольника, A, B, C — их основания, поэтому описанная окружность ABC (синяя) — его окружность девяти точек. Площадь S′ = " + format(se, 2) + " = 2sR = " + format(2 * s * R, 2) + ".";
}
]
