[
description = "{info}"

field width = 20;
field height = 13;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 3.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Внешние равносторонние треугольники на сторонах и линии Ферма (вершина — до
// противоположной вершины построенного треугольника) ----
new Point { name = "Pa"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Pb"; pos = (0, 0); dynamic = false; collision = false }
new Point { name = "Pc"; pos = (0, 0); dynamic = false; collision = false }
new Line { name = "bpa"; pos = (B, Pa); interact = false }
new Line { name = "cpa"; pos = (C, Pa); interact = false }
new Line { name = "cpb"; pos = (C, Pb); interact = false }
new Line { name = "apb"; pos = (A, Pb); interact = false }
new Line { name = "apc"; pos = (A, Pc); interact = false }
new Line { name = "bpc"; pos = (B, Pc); interact = false }
new Line { name = "fa"; pos = (A, Pa); color = #3b82f6; interact = false }
new Line { name = "fb"; pos = (B, Pb); color = #3b82f6; interact = false }
new Line { name = "fc"; pos = (C, Pc); color = #3b82f6; interact = false }
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; text = true("F"); color = #f59e0b; active = valid > 0.5 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0;
float valid = 1;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
Function ok(x, y, ax, ay, bx, by) {
  if (!inField(x, y)) { return false; }
  if (sqrt((x - ax) ^ 2 + (y - ay) ^ 2) < 0.35 || sqrt((x - bx) ^ 2 + (y - by) ^ 2) < 0.35) { return false; }
  return sinAt(x, y, ax, ay, bx, by) >= 0.1 && sinAt(ax, ay, x, y, bx, by) >= 0.1 && sinAt(bx, by, x, y, ax, ay) >= 0.1;
}
Function reach(x0, y0, dx, dy, ax, ay, bx, by) {
  float good = 0; float bad = 2;
  repeat (16) { if (bad > 1) { if (ok(x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16, ax, ay, bx, by)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; } } }
  if (bad > 1) { return 1; }
  repeat (12) { float mid = (good + bad) / 2; if (ok(x0 + dx * mid, y0 + dy * mid, ax, ay, bx, by)) { good = mid; } else { bad = mid; } }
  return good;
}
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
// Вершина равностороннего треугольника, построенного на стороне PQ наружу (в сторону,
// противоположную третьей вершине R исходного треугольника).
Function apex(px, py, qx, qy, rx, ry) {
  float mx = (px + qx) / 2; float my = (py + qy) / 2;
  float dx = qx - px; float dy = qy - py;
  float len = sqrt(dx * dx + dy * dy);
  float nx = -dy / len; float ny = dx / len;
  float sgn = 1;
  if (nx * (rx - px) + ny * (ry - py) > 0) { sgn = -1; }
  sx = mx + sgn * nx * len * 0.8660254; sy = my + sgn * ny * len * 0.8660254;
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

  apex(B.pos.x, B.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); Pa.pos.x = sx; Pa.pos.y = sy;
  apex(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); Pb.pos.x = sx; Pb.pos.y = sy;
  apex(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); Pc.pos.x = sx; Pc.pos.y = sy;

  float la = sqrt((A.pos.x - Pa.pos.x) ^ 2 + (A.pos.y - Pa.pos.y) ^ 2);
  float lb = sqrt((B.pos.x - Pb.pos.x) ^ 2 + (B.pos.y - Pb.pos.y) ^ 2);
  float lc = sqrt((C.pos.x - Pc.pos.x) ^ 2 + (C.pos.y - Pc.pos.y) ^ 2);

  // Пересечение линий Ферма AF (A-Pa) и BF (B-Pb)
  float d1x = Pa.pos.x - A.pos.x; float d1y = Pa.pos.y - A.pos.y;
  float d2x = Pb.pos.x - B.pos.x; float d2y = Pb.pos.y - B.pos.y;
  float den = d1x * d2y - d1y * d2x;
  float t = ((B.pos.x - A.pos.x) * d2y - (B.pos.y - A.pos.y) * d2x) / den;
  F.pos.x = A.pos.x + d1x * t; F.pos.y = A.pos.y + d1y * t;

  float angA = acos((ab.length ^ 2 + ca.length ^ 2 - bc.length ^ 2) / (2 * ab.length * ca.length)) * 180 / pi;
  float angB = acos((ab.length ^ 2 + bc.length ^ 2 - ca.length ^ 2) / (2 * ab.length * bc.length)) * 180 / pi;
  float angC = acos((bc.length ^ 2 + ca.length ^ 2 - ab.length ^ 2) / (2 * bc.length * ca.length)) * 180 / pi;
  float maxAng = max(angA, angB, angC);
  valid = 1; if (maxAng >= 120) { valid = 0; }

  if (valid > 0.5) {
    info = "**Точка Ферма F** — точка внутри треугольника, для которой сумма расстояний до вершин AF + BF + CF минимальна. Отрезки FA, FB, FC видны из неё под углами 120°.\n\n**Три линии Ферма** (от вершины до противоположной вершины внешнего равностороннего треугольника) равны и совпадают с этой минимальной суммой: A-Pa = " + format(la, 2) + ", B-Pb = " + format(lb, 2) + ", C-Pc = " + format(lc, 2) + ".";
  } else {
    string v = "A"; if (angB == maxAng) { v = "B"; } if (angC == maxAng) { v = "C"; }
    info = "**Угол при вершине " + v + " не меньше 120°** (" + format(maxAng, 0) + "°): точка Ферма совпадает с этой вершиной — именно она даёт наименьшую сумму расстояний до вершин, а внутренняя точка с углами 120° не существует.\n\n**Линии Ферма всё ещё равны между собой:** A-Pa = " + format(la, 2) + ", B-Pb = " + format(lb, 2) + ", C-Pc = " + format(lc, 2) + ".";
  }
}
]
