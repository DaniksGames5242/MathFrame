[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-5, -3.2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4.5, -3.2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.2, 3.6); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Девять точек: середины сторон (оранжевые), основания высот (зелёные),
// середины отрезков от вершин до ортоцентра H (синие) ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #f59e0b }
new Point { name = "Ha"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #22c55e }
new Point { name = "Hb"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #22c55e }
new Point { name = "Hc"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #22c55e }
new Point { name = "Ea"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Point { name = "Eb"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Point { name = "Ec"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("H") }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("N") }
new Circle { name = "nine"; center = N; radius = Ma; color = #3b82f6; thickness = 2 }

// Высоты — пунктиром до оснований; продолжения сторон до оснований — пунктиром под сторонами
new Line { name = "aha"; pos = (A, Ha); active = false }
new Line { name = "bhb"; pos = (B, Hb); active = false }
new Line { name = "chc"; pos = (C, Hc); active = false }
draw Punctir { name = "p1"; edge = "aha" }
draw Punctir { name = "p2"; edge = "bhb" }
draw Punctir { name = "p3"; edge = "chc" }
new Line { name = "ah"; pos = (A, H); active = false }
new Line { name = "bh"; pos = (B, H); active = false }
new Line { name = "ch"; pos = (C, H); active = false }
draw Punctir { name = "p4"; edge = "ah" }
draw Punctir { name = "p5"; edge = "bh" }
draw Punctir { name = "p6"; edge = "ch" }
new Line { name = "xa"; pos = (B, Ha); active = false }
new Line { name = "xb"; pos = (C, Hb); active = false }
new Line { name = "xc"; pos = (A, Hc); active = false }
draw Punctir { name = "p7"; edge = "xa"; layer = 1 }
draw Punctir { name = "p8"; edge = "xb"; layer = 1 }
draw Punctir { name = "p9"; edge = "xc"; layer = 1 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float fx = 0; float fy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
// Треугольник (x, y), (ax, ay), (bx, by) невырожденный: стороны не короче 0.35 (точки
// вплотную), все углы от 8° до 172°
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  if (sqrt((x - ax) ^ 2 + (y - ay) ^ 2) < 0.35 || sqrt((x - bx) ^ 2 + (y - by) ^ 2) < 0.35) { return false; }
  return sinAt(x, y, ax, ay, bx, by) >= 0.14 && sinAt(ax, ay, x, y, bx, by) >= 0.14 && sinAt(bx, by, x, y, ax, ay) >= 0.14;
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

// Основание перпендикуляра из (px, py) на прямую (ax, ay)–(bx, by) → (fx, fy)
Function foot(px, py, ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay;
  float k = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy + 0.000000001);
  fx = ax + k * dx; fy = ay + k * dy;
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

  Ma.pos.x = (B.pos.x + C.pos.x) / 2; Ma.pos.y = (B.pos.y + C.pos.y) / 2;
  Mb.pos.x = (C.pos.x + A.pos.x) / 2; Mb.pos.y = (C.pos.y + A.pos.y) / 2;
  Mc.pos.x = (A.pos.x + B.pos.x) / 2; Mc.pos.y = (A.pos.y + B.pos.y) / 2;
  foot(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); Ha.pos.x = fx; Ha.pos.y = fy;
  foot(B.pos.x, B.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); Hb.pos.x = fx; Hb.pos.y = fy;
  foot(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); Hc.pos.x = fx; Hc.pos.y = fy;
  // Ортоцентр — пересечение высот из A и B
  float d1x = Ha.pos.x - A.pos.x; float d1y = Ha.pos.y - A.pos.y; float d2x = Hb.pos.x - B.pos.x; float d2y = Hb.pos.y - B.pos.y;
  float k = ((B.pos.x - A.pos.x) * d2y - (B.pos.y - A.pos.y) * d2x) / (d1x * d2y - d1y * d2x);
  H.pos.x = A.pos.x + k * d1x; H.pos.y = A.pos.y + k * d1y;
  Ea.pos.x = (A.pos.x + H.pos.x) / 2; Ea.pos.y = (A.pos.y + H.pos.y) / 2;
  Eb.pos.x = (B.pos.x + H.pos.x) / 2; Eb.pos.y = (B.pos.y + H.pos.y) / 2;
  Ec.pos.x = (C.pos.x + H.pos.x) / 2; Ec.pos.y = (C.pos.y + H.pos.y) / 2;
  // Центр — центр окружности через середины сторон
  float ax = Ma.pos.x; float ay = Ma.pos.y; float bx = Mb.pos.x; float by = Mb.pos.y; float cx = Mc.pos.x; float cy = Mc.pos.y;
  float dd = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  N.pos.x = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / dd;
  N.pos.y = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / dd;
  float r = sqrt((ax - N.pos.x) ^ 2 + (ay - N.pos.y) ^ 2);

  info = "**Окружность девяти точек:** в любом треугольнике на одной окружности лежат девять точек — середины сторон (оранжевые), основания высот (зелёные) и середины отрезков, соединяющих вершины с ортоцентром H (синие).\n\nРадиус окружности r = " + format(r, 2) + " — ровно половина радиуса описанной окружности R = " + format(ab.length / (2 * sinAt(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y)), 2) + ".";
}
]
