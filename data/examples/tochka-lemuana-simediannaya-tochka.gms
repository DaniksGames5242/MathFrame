[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются; ход, который
// вырождает треугольник (стороны короче касания точек, угол меньше 8°) или выводит
// вершину за поле, обрезается со скольжением ----
new Point { name = "A"; pos = (-5.5, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Медианы (пунктир) и симедианы (синие) — отражения медиан относительно биссектрис ----
new Point { name = "Ma"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Mb"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Mc"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Line { name = "ma"; pos = (A, Ma); color = "transparent"; interact = false }
new Line { name = "ma2"; pos = (A, Ma); active = false }
new Line { name = "mb"; pos = (B, Mb); active = false }
new Line { name = "mc"; pos = (C, Mc); active = false }
draw Punctir { name = "pma"; edge = "ma2" }
draw Punctir { name = "pmb"; edge = "mb" }
draw Punctir { name = "pmc"; edge = "mc" }
new Point { name = "Sa"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "Sb"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Point { name = "Sc"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; color = #3b82f6 }
new Line { name = "sa"; pos = (A, Sa); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "sb"; pos = (B, Sb); color = #3b82f6; thickness = 3; interact = false }
new Line { name = "sc"; pos = (C, Sc); color = #3b82f6; thickness = 3; interact = false }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; text = true("K"); color = #f59e0b }
// Равные углы при вершине A: между AB и медианой — и между AC и симедианой
new Angle { name = "g1"; lines = (ab, ma) }
new Angle { name = "g2"; lines = (ca, sa) }
draw Angle { name = "dg1"; angle = "g1"; measure = false; radius = 1.6; count = 2 }
draw Angle { name = "dg2"; angle = "g2"; measure = false; radius = 1.6; count = 2 }

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

  float a2 = bc.length ^ 2; float b2 = ca.length ^ 2; float c2 = ab.length ^ 2;
  Ma.pos.x = (B.pos.x + C.pos.x) / 2; Ma.pos.y = (B.pos.y + C.pos.y) / 2;
  Mb.pos.x = (C.pos.x + A.pos.x) / 2; Mb.pos.y = (C.pos.y + A.pos.y) / 2;
  Mc.pos.x = (A.pos.x + B.pos.x) / 2; Mc.pos.y = (A.pos.y + B.pos.y) / 2;
  // Основание симедианы из A делит BC в отношении BSa : SaC = c² : b²
  Sa.pos.x = (b2 * B.pos.x + c2 * C.pos.x) / (b2 + c2); Sa.pos.y = (b2 * B.pos.y + c2 * C.pos.y) / (b2 + c2);
  Sb.pos.x = (c2 * C.pos.x + a2 * A.pos.x) / (c2 + a2); Sb.pos.y = (c2 * C.pos.y + a2 * A.pos.y) / (c2 + a2);
  Sc.pos.x = (a2 * A.pos.x + b2 * B.pos.x) / (a2 + b2); Sc.pos.y = (a2 * A.pos.y + b2 * B.pos.y) / (a2 + b2);
  float s = a2 + b2 + c2;
  K.pos.x = (a2 * A.pos.x + b2 * B.pos.x + c2 * C.pos.x) / s; K.pos.y = (a2 * A.pos.y + b2 * B.pos.y + c2 * C.pos.y) / s;
  float bs = sqrt((Sa.pos.x - B.pos.x) ^ 2 + (Sa.pos.y - B.pos.y) ^ 2); float sc2 = sqrt((Sa.pos.x - C.pos.x) ^ 2 + (Sa.pos.y - C.pos.y) ^ 2);
  info = "**Точка Лемуана K** — точка пересечения симедиан. Симедиана — прямая, симметричная медиане относительно биссектрисы того же угла: отмеченные углы при вершине A равны.\n\nОснование симедианы делит противоположную сторону в отношении квадратов прилежащих сторон: BSₐ : SₐC = " + format(bs / sc2, 3) + " = AB² : AC² = " + format(c2 / b2, 3) + ".";
}
]
