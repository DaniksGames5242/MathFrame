[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается ----
new Point { name = "A"; pos = (-6, -4); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -4); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 4.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Высоты и их основания. Основания — вычисляемые точки (могут лежать на продолжении
// стороны для тупоугольного треугольника), поэтому пунктир продолжения стороны рисуется
// по отдельной скрытой линии, тема которой следует основной ----
new Point { name = "Ha"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Hb"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Point { name = "Hc"; pos = (0, 0); dynamic = false; collision = false; size = 0.5 }
new Line { name = "ha"; pos = (A, Ha); interact = false }
new Line { name = "hb"; pos = (B, Hb); interact = false }
new Line { name = "hc"; pos = (C, Hc); interact = false }
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H"); color = #f59e0b }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0;

Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
Function sinAt(x, y, ax, ay, bx, by) {
  float ux = ax - x; float uy = ay - y; float vx = bx - x; float vy = by - y;
  return abs(ux * vy - uy * vx) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000001);
}
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
// Проекция точки (px, py) на прямую через (ax, ay), (bx, by): основание перпендикуляра
Function foot(px, py, ax, ay, bx, by) {
  float ux = bx - ax; float uy = by - ay;
  float t = ((px - ax) * ux + (py - ay) * uy) / (ux * ux + uy * uy);
  sx = ax + ux * t; sy = ay + uy * t;
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

  foot(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); Ha.pos.x = sx; Ha.pos.y = sy;
  foot(B.pos.x, B.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); Hb.pos.x = sx; Hb.pos.y = sy;
  foot(C.pos.x, C.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); Hc.pos.x = sx; Hc.pos.y = sy;

  // Ортоцентр — пересечение высот AHa и BHb (решение системы двух уравнений прямых).
  float d1x = Ha.pos.x - A.pos.x; float d1y = Ha.pos.y - A.pos.y;
  float d2x = Hb.pos.x - B.pos.x; float d2y = Hb.pos.y - B.pos.y;
  float den = d1x * d2y - d1y * d2x;
  float t = ((B.pos.x - A.pos.x) * d2y - (B.pos.y - A.pos.y) * d2x) / den;
  H.pos.x = A.pos.x + d1x * t; H.pos.y = A.pos.y + d1y * t;

  string place = "внутри треугольника (он остроугольный)";
  float sgnAB = (B.pos.x - A.pos.x) * (H.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (H.pos.x - A.pos.x);
  float sgnC = (B.pos.x - A.pos.x) * (C.pos.y - A.pos.y) - (B.pos.y - A.pos.y) * (C.pos.x - A.pos.x);
  float sgnBC = (C.pos.x - B.pos.x) * (H.pos.y - B.pos.y) - (C.pos.y - B.pos.y) * (H.pos.x - B.pos.x);
  float sgnA = (C.pos.x - B.pos.x) * (A.pos.y - B.pos.y) - (C.pos.y - B.pos.y) * (A.pos.x - B.pos.x);
  float sgnCA = (A.pos.x - C.pos.x) * (H.pos.y - C.pos.y) - (A.pos.y - C.pos.y) * (H.pos.x - C.pos.x);
  float sgnB = (A.pos.x - C.pos.x) * (B.pos.y - C.pos.y) - (A.pos.y - C.pos.y) * (B.pos.x - C.pos.x);
  if (sgnAB * sgnC < 0 || sgnBC * sgnA < 0 || sgnCA * sgnB < 0) { place = "вне треугольника (он тупоугольный) — на продолжениях двух высот"; }

  info = "**Ортоцентр H** — точка пересечения трёх высот треугольника, опущенных из вершин на противоположные стороны (или их продолжения). Сейчас он лежит " + place + ".\n\n**Длины высот:** из A — " + format(sqrt((A.pos.x - Ha.pos.x) ^ 2 + (A.pos.y - Ha.pos.y) ^ 2), 2) + ", из B — " + format(sqrt((B.pos.x - Hb.pos.x) ^ 2 + (B.pos.y - Hb.pos.y) ^ 2), 2) + ", из C — " + format(sqrt((C.pos.x - Hc.pos.x) ^ 2 + (C.pos.y - Hc.pos.y) ^ 2), 2) + ".";
}
]
