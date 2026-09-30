[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-5, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 4.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Круги Мальфатти: центры на биссектрисах, радиусы r₁, r₂, r₃ ----
new Point { name = "O1"; pos = (0, 0); dynamic = false; collision = false; text = true("O₁") }
new Point { name = "O2"; pos = (0, 0); dynamic = false; collision = false; text = true("O₂") }
new Point { name = "O3"; pos = (0, 0); dynamic = false; collision = false; text = true("O₃") }
float r1 = 1; float r2 = 1; float r3 = 1;
new Circle { name = "m1"; center = O1; radius = r1; color = #3b82f6; thickness = 2 }
new Circle { name = "m2"; center = O2; radius = r2; color = #f59e0b; thickness = 2 }
new Circle { name = "m3"; center = O3; radius = r3; color = #22c55e; thickness = 2 }
// Центры лежат на биссектрисах углов A, B, C (пунктир) и делят их через инцентр I
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "ia"; pos = (A, I); active = false }
new Line { name = "ib"; pos = (B, I); active = false }
new Line { name = "ic"; pos = (C, I); active = false }
draw Punctir { name = "pa"; edge = "ia" }
draw Punctir { name = "pb"; edge = "ib" }
draw Punctir { name = "pc"; edge = "ic" }
// Точки касания кругов друг с другом
new Point { name = "X12"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "X23"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "X31"; pos = (0, 0); dynamic = false; collision = false }

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

// Допустимо: треугольник невырожденный
Function ok(x, y, ax, ay, bx, by) { return okBase(x, y, ax, ay, bx, by); }

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
  float p = a + b + c; float s = p / 2;
  float area = abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  float r = area / s;
  float ix = (a * ax + b * bx + c * cx) / p; float iy = (a * ay + b * by + c * cy) / p;
  I.pos.x = ix; I.pos.y = iy;
  float d = dist(ix, iy, ax, ay); float e = dist(ix, iy, bx, by); float f = dist(ix, iy, cx, cy);
  // Радиус круга у вершины A: r₁ = r (s − r + d − e − f) / (2 (s − a)); у B и C — циклически
  r1 = r * (s - r + d - e - f) / (2 * (s - a));
  r2 = r * (s - r + e - f - d) / (2 * (s - b));
  r3 = r * (s - r + f - d - e) / (2 * (s - c));
  float o1x = ax + (ix - ax) * r1 / r; float o1y = ay + (iy - ay) * r1 / r;
  float o2x = bx + (ix - bx) * r2 / r; float o2y = by + (iy - by) * r2 / r;
  float o3x = cx + (ix - cx) * r3 / r; float o3y = cy + (iy - cy) * r3 / r;
  O1.pos.x = o1x; O1.pos.y = o1y; O2.pos.x = o2x; O2.pos.y = o2y; O3.pos.x = o3x; O3.pos.y = o3y;
  X12.pos.x = o1x + (o2x - o1x) * r1 / (r1 + r2); X12.pos.y = o1y + (o2y - o1y) * r1 / (r1 + r2);
  X23.pos.x = o2x + (o3x - o2x) * r2 / (r2 + r3); X23.pos.y = o2y + (o3y - o2y) * r2 / (r2 + r3);
  X31.pos.x = o3x + (o1x - o3x) * r3 / (r3 + r1); X31.pos.y = o3y + (o1y - o3y) * r3 / (r3 + r1);
  float t12 = dist(o1x, o1y, o2x, o2y) - r1 - r2;
  float t23 = dist(o2x, o2y, o3x, o3y) - r2 - r3;
  float t31 = dist(o3x, o3y, o1x, o1y) - r3 - r1;
  float tm = max(abs(t12), abs(t23), abs(t31));
  float sc = pi * (r1 * r1 + r2 * r2 + r3 * r3);
  info = "**Круги Мальфатти** — три круга, каждый касается двух сторон треугольника (O₁ у вершины A, O₂ у B, O₃ у C) и двух других кругов. Радиусы: r₁ = " + format(r1, 3) + ", r₂ = " + format(r2, 3) + ", r₃ = " + format(r3, 3) + ".\n\n**Центры лежат на биссектрисах** углов A, B, C (пунктир). Радиус круга у вершины A: r₁ = r (s − r + IA − IB − IC) / (2 (s − a)), где r = " + format(r, 3) + " — радиус вписанной окружности, s = " + format(s, 2) + ", IA = " + format(d, 2) + ", IB = " + format(e, 2) + ", IC = " + format(f, 2) + ".\n\n**Попарное касание:** O₁O₂ − (r₁ + r₂) = " + num(t12, 4) + ", O₂O₃ − (r₂ + r₃) = " + num(t23, 4) + ", O₃O₁ − (r₃ + r₁) = " + num(t31, 4) + ". Суммарная площадь кругов " + format(sc, 2) + " составляет " + format(100 * sc / area, 1) + "% площади треугольника.";
}
]
