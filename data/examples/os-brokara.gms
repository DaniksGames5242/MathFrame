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

// ---- Центр описанной окружности O, точка Лемуана K, точки Брокара ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; text = true("K") }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; text = true("Ω₁"); color = #f59e0b }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; text = true("Ω₂"); color = #f59e0b }
// Ось Брокара — прямая OK, продолженная до краёв поля (концы невидимы)
new Point { name = "E1"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Point { name = "E2"; pos = (0, 0); dynamic = false; collision = false; active = false }
new Line { name = "axis"; pos = (E1, E2); interact = false; color = #3b82f6; thickness = 2 }
// Отрезок между точками Брокара и окружность Брокара (диаметр OK)
new Line { name = "pp"; pos = (P1, P2); interact = false; color = #f59e0b }
new Point { name = "M"; pos = (0, 0); dynamic = false; collision = false; active = false }
float rb = 1;
float showAxis = 1;
new Circle { name = "brc"; center = M; radius = rb; color = #f59e0b; active = rb > 0.05 }

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

// Допустимо: треугольник невырожденный, а O и K лежат в поле
Function ok(x, y, ax, ay, bx, by) {
  if (!okBase(x, y, ax, ay, bx, by)) { return false; }
  cc(x, y, ax, ay, bx, by);
  return inField(qx, qy);
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
  float a2 = a * a; float b2 = b * b; float c2 = c * c;
  cc(ax, ay, bx, by, cx, cy);
  float ox = qx; float oy = qy;
  O.pos.x = ox; O.pos.y = oy;
  float kx = (a2 * ax + b2 * bx + c2 * cx) / (a2 + b2 + c2);
  float ky = (a2 * ay + b2 * by + c2 * cy) / (a2 + b2 + c2);
  K.pos.x = kx; K.pos.y = ky;
  // Точки Брокара: барицентрические координаты (1/b² : 1/c² : 1/a²) и (1/c² : 1/a² : 1/b²)
  float w1 = 1 / b2; float w2 = 1 / c2; float w3 = 1 / a2;
  float ws = w1 + w2 + w3;
  float p1x = (w1 * ax + w2 * bx + w3 * cx) / ws; float p1y = (w1 * ay + w2 * by + w3 * cy) / ws;
  w1 = 1 / c2; w2 = 1 / a2; w3 = 1 / b2; ws = w1 + w2 + w3;
  float p2x = (w1 * ax + w2 * bx + w3 * cx) / ws; float p2y = (w1 * ay + w2 * by + w3 * cy) / ws;
  P1.pos.x = p1x; P1.pos.y = p1y; P2.pos.x = p2x; P2.pos.y = p2y;
  // Окружность Брокара: диаметр OK
  M.pos.x = (ox + kx) / 2; M.pos.y = (oy + ky) / 2;
  float dok = dist(ox, oy, kx, ky);
  rb = dok / 2;
  // Ось Брокара до краёв поля
  if (dok > 0.05) {
    float ux = (kx - ox) / dok; float uy = (ky - oy) / dok;
    E1.pos.x = ox - ux * 60; E1.pos.y = oy - uy * 60; E2.pos.x = ox + ux * 60; E2.pos.y = oy + uy * 60;
  } else {
    E1.pos.x = ox; E1.pos.y = oy; E2.pos.x = ox; E2.pos.y = oy;
  }
  float area = abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  float tw = 4 * area / (a2 + b2 + c2);
  float om = atan(tw) * 180 / pi;
  // Углы ∠Ω₁AB, ∠Ω₁BC, ∠Ω₁CA — проверка равенства
  float g1 = acos(((p1x - ax) * (bx - ax) + (p1y - ay) * (by - ay)) / (dist(p1x, p1y, ax, ay) * c)) * 180 / pi;
  float g2 = acos(((p1x - bx) * (cx - bx) + (p1y - by) * (cy - by)) / (dist(p1x, p1y, bx, by) * a)) * 180 / pi;
  float g3 = acos(((p1x - cx) * (ax - cx) + (p1y - cy) * (ay - cy)) / (dist(p1x, p1y, cx, cy) * b)) * 180 / pi;
  float perp = (p2x - p1x) * (kx - ox) + (p2y - p1y) * (ky - oy);
  if (abs(perp) < 0.0005) { perp = 0; }
  info = "**Ось Брокара** (синяя) — прямая через центр описанной окружности O и точку Лемуана K (пересечение симедиан). Здесь OK = " + format(dok, 2) + ".\n\n**Точки Брокара** Ω₁ и Ω₂: для Ω₁ равны углы ∠Ω₁AB = " + format(g1, 2) + "°, ∠Ω₁BC = " + format(g2, 2) + "°, ∠Ω₁CA = " + format(g3, 2) + "°. Этот общий угол — угол Брокара ω, tg ω = 4S / (a² + b² + c²) = 4 · " + format(area, 2) + " / " + format(a2 + b2 + c2, 2) + " = " + format(tw, 3) + ", ω = " + format(om, 2) + "°.\n\n**Окружность Брокара** (жёлтая) построена на диаметре OK и проходит через обе точки Брокара. Отрезок Ω₁Ω₂ перпендикулярен оси: (Ω₁Ω₂) · (OK) = " + num(perp, 3) + ".";
}
]
