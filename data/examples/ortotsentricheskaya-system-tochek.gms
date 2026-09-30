[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-5, -3); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5.5, -2.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Ортоцентр H и отрезки HA, HB, HC: вместе с вершинами — четыре точки системы ----
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; text = true("H"); color = #f59e0b }
new Line { name = "ha"; pos = (H, A); interact = false; color = #f59e0b }
new Line { name = "hb"; pos = (H, B); interact = false; color = #f59e0b }
new Line { name = "hc"; pos = (H, C); interact = false; color = #f59e0b }
// Описанная окружность одного из четырёх треугольников (выбор ползунком): радиусы равны
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; active = false }
float rz = 1;
new Circle { name = "cir"; center = Z; radius = rz; color = #3b82f6; thickness = 2 }
float w = 4;
new UI { type = slider; label = "окружность: 1 — HBC, 2 — AHC, 3 — ABH, 4 — ABC"; variable = w; min = 1; max = 4; step = 1; default = 4 }

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

// Допустимо: треугольник невырожденный, ортоцентр H в поле
Function ok(x, y, ax, ay, bx, by) {
  if (!okBase(x, y, ax, ay, bx, by)) { return false; }
  cc(x, y, ax, ay, bx, by);
  return inField(x + ax + bx - 2 * qx, y + ay + by - 2 * qy);
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
  cc(ax, ay, bx, by, cx, cy);
  float ox = qx; float oy = qy;
  float hx = ax + bx + cx - 2 * ox; float hy = ay + by + cy - 2 * oy;
  H.pos.x = hx; H.pos.y = hy;
  // Центры описанных окружностей четырёх треугольников: O, B + C − O, A + C − O, A + B − O
  float zx = ox; float zy = oy;
  if (w < 1.5) { zx = bx + cx - ox; zy = by + cy - oy; }
  else if (w < 2.5) { zx = ax + cx - ox; zy = ay + cy - oy; }
  else if (w < 3.5) { zx = ax + bx - ox; zy = ay + by - oy; }
  Z.pos.x = zx; Z.pos.y = zy;
  float R = dist(ox, oy, ax, ay);
  rz = R;
  // Каждая из шести прямых, соединяющих точки системы, перпендикулярна противоположной
  float p1 = abs((hx - ax) * (cx - bx) + (hy - ay) * (cy - by));
  float p2 = abs((hx - bx) * (cx - ax) + (hy - by) * (cy - ay));
  float p3 = abs((hx - cx) * (bx - ax) + (hy - cy) * (by - ay));
  float pm = max(p1, p2, p3) / (a + b + c);
  // Радиусы описанных окружностей четырёх треугольников
  cc(hx, hy, bx, by, cx, cy); float r1 = dist(qx, qy, hx, hy);
  cc(ax, ay, hx, hy, cx, cy); float r2 = dist(qx, qy, hx, hy);
  cc(ax, ay, bx, by, hx, hy); float r3 = dist(qx, qy, hx, hy);
  float mind = min(dist(hx, hy, ax, ay), dist(hx, hy, bx, by), dist(hx, hy, cx, cy));
  string kind = "";
  if (mind < 0.12) { kind = " Сейчас треугольник прямоугольный: H совпал с вершиной, и различных точек системы три."; }
  info = "**Ортоцентрическая система:** четвёрка точек A, B, C, H, в которой каждая точка — ортоцентр треугольника из трёх остальных. Здесь H — ортоцентр ABC; тогда A — ортоцентр HBC, B — ортоцентр AHC, C — ортоцентр ABH. Всего четыре треугольника: ABC, HBC, AHC, ABH." + kind + "\n\n**Перпендикулярность:** AH ⊥ BC, BH ⊥ CA, CH ⊥ AB — скалярные произведения " + format(p1, 3) + ", " + format(p2, 3) + ", " + format(p3, 3) + " (нули с точностью вычислений).\n\n**Радиусы описанных окружностей** одинаковы: R(ABC) = " + format(R, 2) + ", R(HBC) = " + format(r1, 2) + ", R(AHC) = " + format(r2, 2) + ", R(ABH) = " + format(r3, 2) + "; сами окружности различны (ползунок выбирает, какую показать).";
}
]
