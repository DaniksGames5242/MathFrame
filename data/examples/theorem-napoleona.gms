[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются; ход, который
// вырождает треугольник (стороны короче касания точек, угол меньше 8°) или выводит
// вершину за поле, обрезается со скольжением ----
new Point { name = "A"; pos = (-2.4, -1.4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (2.6, -1.8); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (0.3, 2); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Равносторонние треугольники на сторонах (вершины Xa, Xb, Xc вычисляются) и их
// центры Na, Nb, Nc — вершины треугольника Наполеона ----
new Point { name = "Xa"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Xb"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Xc"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Line { name = "bxa"; pos = (B, Xa); interact = false; color = #f59e0b }
new Line { name = "xac"; pos = (Xa, C); interact = false; color = #f59e0b }
new Line { name = "cxb"; pos = (C, Xb); interact = false; color = #f59e0b }
new Line { name = "xba"; pos = (Xb, A); interact = false; color = #f59e0b }
new Line { name = "axc"; pos = (A, Xc); interact = false; color = #f59e0b }
new Line { name = "xcb"; pos = (Xc, B); interact = false; color = #f59e0b }
new Point { name = "Na"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Point { name = "Nb"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Point { name = "Nc"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; color = #3b82f6 }
new Line { name = "n1"; pos = (Na, Nb); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "n2"; pos = (Nb, Nc); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "n3"; pos = (Nc, Na); color = #3b82f6; thickness = 3; interact = false }
new Figure { name = "nap"; elements = (n1, n2, n3); interact = false }
draw Filling { name = "napFill"; figure = "nap"; color = #3b82f6; opacity = 0.18 }
draw EquallySing { name = "eqN"; edges = (n1, n2, n3); type = 1 }

new UI { name = "bOut"; type = button; label = "Наружу"; action = "side = 1" }
new UI { name = "bIn"; type = button; label = "Внутрь"; action = "side = -1" }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float ix = 0; float iy = 0;

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

float side = 1;

// Третья вершина равностороннего треугольника на стороне PQ — по другую сторону от R
// (наружу, s = 1) или по ту же (внутрь, s = −1); результат в (ix, iy)
Function apex(px, py, qx, qy, rx, ry, s) {
  float mx = (px + qx) / 2; float my = (py + qy) / 2;
  float nx = -(qy - py) * 0.8660254; float ny = (qx - px) * 0.8660254;
  float toR = (rx - mx) * nx + (ry - my) * ny;
  if (toR * s > 0) { nx = -nx; ny = -ny; }
  ix = mx + nx; iy = my + ny;
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

  apex(B.pos.x, B.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y, side); Xa.pos.x = ix; Xa.pos.y = iy;
  apex(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y, side); Xb.pos.x = ix; Xb.pos.y = iy;
  apex(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y, side); Xc.pos.x = ix; Xc.pos.y = iy;
  Na.pos.x = (B.pos.x + C.pos.x + Xa.pos.x) / 3; Na.pos.y = (B.pos.y + C.pos.y + Xa.pos.y) / 3;
  Nb.pos.x = (C.pos.x + A.pos.x + Xb.pos.x) / 3; Nb.pos.y = (C.pos.y + A.pos.y + Xb.pos.y) / 3;
  Nc.pos.x = (A.pos.x + B.pos.x + Xc.pos.x) / 3; Nc.pos.y = (A.pos.y + B.pos.y + Xc.pos.y) / 3;
  string where = "во внешнюю сторону";
  if (side < 0) { where = "внутрь"; }
  info = "**Теорема Наполеона:** если на сторонах любого треугольника построить равносторонние треугольники (здесь — " + where + "), то их центры образуют равносторонний треугольник.\n\nСтороны треугольника Наполеона: " + format(n1.length, 2) + ", " + format(n2.length, 2) + ", " + format(n3.length, 2) + ".";
}
]
