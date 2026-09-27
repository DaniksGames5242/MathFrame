[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-5.5, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-0.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Трисектрисы и треугольник Морли PQR ----
// P — у стороны BC (пересечение трисектрис B и C, прилежащих к BC), Q — у CA, R — у AB
new Point { name = "P"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("P") }
new Point { name = "Q"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("Q") }
new Point { name = "R"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("R") }
new Line { name = "tbp"; pos = (B, P); active = false }
new Line { name = "tcp"; pos = (C, P); active = false }
new Line { name = "tcq"; pos = (C, Q); active = false }
new Line { name = "taq"; pos = (A, Q); active = false }
new Line { name = "tar"; pos = (A, R); active = false }
new Line { name = "tbr"; pos = (B, R); active = false }
draw Punctir { name = "p1"; edge = "tbp" }
draw Punctir { name = "p2"; edge = "tcp" }
draw Punctir { name = "p3"; edge = "tcq" }
draw Punctir { name = "p4"; edge = "taq" }
draw Punctir { name = "p5"; edge = "tar" }
draw Punctir { name = "p6"; edge = "tbr" }
new Line { name = "pq"; pos = (P, Q); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "qr"; pos = (Q, R); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "rp"; pos = (R, P); color = #3b82f6; thickness = 3; interact = false }
new Figure { name = "morley"; elements = (pq, qr, rp); interact = false }
draw Filling { name = "mFill"; figure = "morley"; color = #3b82f6; opacity = 0.2 }
draw EquallySing { name = "eqM"; edges = (pq, qr, rp); type = 1 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float ix = 0; float iy = 0;
float PI = 3.141592653589793;

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

// Направление трисектрисы в вершине V: от стороны VP к стороне VQ на треть угла
Function triDir(vx, vy, px, py, qx, qy) {
  float a1 = atan2(py - vy, px - vx); float a2 = atan2(qy - vy, qx - vx);
  float d = a2 - a1;
  if (d > PI) { d = d - 2 * PI; } if (d < -PI) { d = d + 2 * PI; }
  return a1 + d / 3;
}
// Пересечение лучей (x1, y1) под углом t1 и (x2, y2) под углом t2 → (ix, iy)
Function meet(x1, y1, t1, x2, y2, t2) {
  float d1x = cos(t1); float d1y = sin(t1); float d2x = cos(t2); float d2y = sin(t2);
  float den = d1x * d2y - d1y * d2x;
  float k = ((x2 - x1) * d2y - (y2 - y1) * d2x) / den;
  ix = x1 + k * d1x; iy = y1 + k * d1y;
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

  meet(B.pos.x, B.pos.y, triDir(B.pos.x, B.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y), C.pos.x, C.pos.y, triDir(C.pos.x, C.pos.y, B.pos.x, B.pos.y, A.pos.x, A.pos.y));
  P.pos.x = ix; P.pos.y = iy;
  meet(C.pos.x, C.pos.y, triDir(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y), A.pos.x, A.pos.y, triDir(A.pos.x, A.pos.y, C.pos.x, C.pos.y, B.pos.x, B.pos.y));
  Q.pos.x = ix; Q.pos.y = iy;
  meet(A.pos.x, A.pos.y, triDir(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y), B.pos.x, B.pos.y, triDir(B.pos.x, B.pos.y, A.pos.x, A.pos.y, C.pos.x, C.pos.y));
  R.pos.x = ix; R.pos.y = iy;

  float al = degrees(acos(((B.pos.x - A.pos.x) * (C.pos.x - A.pos.x) + (B.pos.y - A.pos.y) * (C.pos.y - A.pos.y)) / (ab.length * ca.length)));
  float be = degrees(acos(((A.pos.x - B.pos.x) * (C.pos.x - B.pos.x) + (A.pos.y - B.pos.y) * (C.pos.y - B.pos.y)) / (ab.length * bc.length)));
  info = "**Теорема Морли:** точки пересечения соседних трисектрис углов любого треугольника — трисектрис, прилежащих к одной стороне, — образуют равносторонний треугольник.\n\n∠A = " + format(al, 0) + "°, ∠B = " + format(be, 0) + "°, ∠C = " + format(180 - al - be, 0) + "°;   PQ = " + format(pq.length, 2) + ", QR = " + format(qr.length, 2) + ", RP = " + format(rp.length, 2) + ".";
}
]
