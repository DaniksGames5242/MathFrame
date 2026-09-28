[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все три вершины перетаскиваются, треугольник не вырождается ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Точки касания вневписанных окружностей с противоположными сторонами ----
new Point { name = "Na"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Point { name = "Nb"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }
new Point { name = "Nc"; pos = (0, 0); dynamic = false; collision = false; size = 0.4 }

// ---- Цевианы к точкам касания и точка Нагеля ----
new Line { name = "ana"; pos = (A, Na); color = #3b82f6; interact = false }
new Line { name = "bnb"; pos = (B, Nb); color = #3b82f6; interact = false }
new Line { name = "cnc"; pos = (C, Nc); color = #3b82f6; interact = false }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; text = true("N"); color = #f59e0b }

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
  float per = a + b + c; float s = per / 2;

  // Точки касания вневписанных окружностей делят стороны в отношении, обратном
  // точкам касания вписанной: от B до Na — (s−c), от C до Na — (s−b), и т. д.
  float ta = (s - c) / a; Na.pos.x = B.pos.x + ta * (C.pos.x - B.pos.x); Na.pos.y = B.pos.y + ta * (C.pos.y - B.pos.y);
  float tb = (s - a) / b; Nb.pos.x = C.pos.x + tb * (A.pos.x - C.pos.x); Nb.pos.y = C.pos.y + tb * (A.pos.y - C.pos.y);
  float tc = (s - b) / c; Nc.pos.x = A.pos.x + tc * (B.pos.x - A.pos.x); Nc.pos.y = A.pos.y + tc * (B.pos.y - A.pos.y);

  // Точка Нагеля — пересечение цевиан A-Na и B-Nb.
  float d1x = Na.pos.x - A.pos.x; float d1y = Na.pos.y - A.pos.y;
  float d2x = Nb.pos.x - B.pos.x; float d2y = Nb.pos.y - B.pos.y;
  float den = d1x * d2y - d1y * d2x;
  float t = ((B.pos.x - A.pos.x) * d2y - (B.pos.y - A.pos.y) * d2x) / den;
  N.pos.x = A.pos.x + d1x * t; N.pos.y = A.pos.y + d1y * t;

  float ratioA = (b + c) / a; float ratioB = (a + c) / b; float ratioC = (a + b) / c;

  info = "**Точка Нагеля N** — пересечение трёх отрезков, каждый из которых соединяет вершину с точкой касания противоположной стороны и соответствующей вневписанной окружности: A-Na, B-Nb, C-Nc.\n\n**Каждый отрезок делится точкой N** в отношении суммы прилегающих сторон к противолежащей: A-Na в отношении (b+c)/a = " + format(ratioA, 2) + ", B-Nb — (a+c)/b = " + format(ratioB, 2) + ", C-Nc — (a+b)/c = " + format(ratioC, 2) + ".\n\n**Барицентрические координаты** (s−a : s−b : s−c) = (" + format(s - a, 2) + " : " + format(s - b, 2) + " : " + format(s - c, 2) + "), где s = " + format(s, 2) + " — полупериметр.";
}
]
