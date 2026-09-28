[
description = "{info}"

field width = 16;
field height = 10;
camera type = fixed;

// ---- Треугольник ABC: все вершины перетаскиваются, форма всегда невырождена ----
new Point { name = "A"; pos = (-5, -3.2); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (4.5, -3.2); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.2, 3.6); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Центр I, биссектрисы из вершин к I, точки касания на сторонах ----
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("I") }
new Point { name = "Ta"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #f59e0b }
new Point { name = "Tb"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #f59e0b }
new Point { name = "Tc"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #f59e0b }
new Line { name = "ai"; pos = (A, I); interact = false }
new Line { name = "bi"; pos = (B, I); interact = false }
new Line { name = "ci"; pos = (C, I); interact = false }
new Line { name = "ita"; pos = (I, Ta); interact = false; active = false }
new Circle { name = "w"; center = I; radius = Ta; color = #22c55e; thickness = 2 }
// Отрезки от вершин до точек касания — равные касательные, отмеченные дугами: у A — цвет 1, у B — 2, у C — 3
new Line { name = "aTc"; pos = (A, Tc); active = false; interact = false }
new Line { name = "aTb"; pos = (A, Tb); active = false; interact = false }
new Line { name = "bTa"; pos = (B, Ta); active = false; interact = false }
new Line { name = "bTc"; pos = (B, Tc); active = false; interact = false }
new Line { name = "cTb"; pos = (C, Tb); active = false; interact = false }
new Line { name = "cTa"; pos = (C, Ta); active = false; interact = false }
draw EquallySing { name = "eqA"; edges = (aTc, aTb); type = 1 }
draw EquallySing { name = "eqB"; edges = (bTa, bTc); type = 2 }
draw EquallySing { name = "eqC"; edges = (cTb, cTa); type = 3 }

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
float fx = 0; float fy = 0;
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

  float a = bc.length; float b = ca.length; float c = ab.length;
  float per = a + b + c; float p = per / 2;
  I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / per;
  I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / per;
  foot(I.pos.x, I.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); Tc.pos.x = fx; Tc.pos.y = fy;
  foot(I.pos.x, I.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y); Ta.pos.x = fx; Ta.pos.y = fy;
  foot(I.pos.x, I.pos.y, C.pos.x, C.pos.y, A.pos.x, A.pos.y); Tb.pos.x = fx; Tb.pos.y = fy;

  float r = sqrt((I.pos.x - Ta.pos.x) ^ 2 + (I.pos.y - Ta.pos.y) ^ 2);
  float ta = p - a; // отрезок от A до точки касания = p − a (стандартное тождество)

  info = "**Инцентр I** — точка пересечения биссектрис углов A, B, C, равноудалённая от всех трёх сторон; это расстояние — радиус вписанной окружности r = " + format(r, 2) + ".\n\n**Отрезки от каждой вершины до точек касания равны** (оранжевые дуги одного цвета — равные касательные из одной вершины): от A — " + format(p - a, 2) + ", от B — " + format(p - b, 2) + ", от C — " + format(p - c, 2) + ".\n\nПолупериметр p = " + format(p, 2) + ".";
}
]
