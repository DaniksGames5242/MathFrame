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

// ---- Центр описанной окружности O, точка Лемуана K, центр окружности Тукера Z ----
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; text = true("K") }
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O") }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; text = true("Z"); color = #3b82f6 }
// Шестиугольник Тукера T1…T6: T1T2 ∥ BC, T3T4 ∥ CA, T5T6 ∥ AB (жёлтые стороны),
// T2T3, T4T5, T6T1 — антипараллельные стороны
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T3"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T4"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T5"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Point { name = "T6"; pos = (0, 0); dynamic = false; collision = false; color = #f59e0b }
new Line { name = "s12"; pos = (T1, T2); interact = false; color = #f59e0b }
new Line { name = "s23"; pos = (T2, T3); interact = false }
new Line { name = "s34"; pos = (T3, T4); interact = false; color = #f59e0b }
new Line { name = "s45"; pos = (T4, T5); interact = false }
new Line { name = "s56"; pos = (T5, T6); interact = false; color = #f59e0b }
new Line { name = "s61"; pos = (T6, T1); interact = false }
float rz = 1;
new Circle { name = "tuck"; center = Z; radius = rz; color = #3b82f6; thickness = 2 }
float k = 0.6;
new UI { type = slider; label = "параметр k"; variable = k; min = 0; max = 1; step = 0.01; default = 0.6 }

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

// Допустимо: треугольник невырожденный, центр описанной окружности O в поле
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
  float kx = (a2 * ax + b2 * bx + c2 * cx) / (a2 + b2 + c2);
  float ky = (a2 * ay + b2 * by + c2 * cy) / (a2 + b2 + c2);
  K.pos.x = kx; K.pos.y = ky;
  cc(ax, ay, bx, by, cx, cy);
  float ox = qx; float oy = qy;
  O.pos.x = ox; O.pos.y = oy;
  // Шестиугольник Тукера: T1 на AB (AT1 = k·AB), T1T2 ∥ BC, T2T3 антипараллельна AB,
  // T3T4 ∥ CA, T4T5 антипараллельна BC, T5T6 ∥ AB, T6T1 антипараллельна CA
  float f3 = (1 - k) * b * b / (a * a);
  float f4 = 1 - f3;
  float f5 = c * c * (1 - f4) / (b * b);
  float f6 = 1 - f5;
  float t1x = ax + k * (bx - ax); float t1y = ay + k * (by - ay);
  float t2x = ax + k * (cx - ax); float t2y = ay + k * (cy - ay);
  float t3x = cx + f3 * (bx - cx); float t3y = cy + f3 * (by - cy);
  float t4x = bx + f4 * (ax - bx); float t4y = by + f4 * (ay - by);
  float t5x = ax + f5 * (cx - ax); float t5y = ay + f5 * (cy - ay);
  float t6x = cx + f6 * (bx - cx); float t6y = cy + f6 * (by - cy);
  T1.pos.x = t1x; T1.pos.y = t1y; T2.pos.x = t2x; T2.pos.y = t2y; T3.pos.x = t3x; T3.pos.y = t3y;
  T4.pos.x = t4x; T4.pos.y = t4y; T5.pos.x = t5x; T5.pos.y = t5y; T6.pos.x = t6x; T6.pos.y = t6y;
  // Окружность Тукера — через T1, T3, T5; остальные три точки проверяются
  cc(t1x, t1y, t3x, t3y, t5x, t5y);
  float zx = qx; float zy = qy;
  Z.pos.x = zx; Z.pos.y = zy;
  rz = dist(zx, zy, t1x, t1y);
  float dev = max(abs(dist(zx, zy, t2x, t2y) - rz), abs(dist(zx, zy, t4x, t4y) - rz), abs(dist(zx, zy, t6x, t6y) - rz));
  float dok = dist(ox, oy, kx, ky);
  string line = "";
  if (dok > 0.05) {
    float cross = ((zx - kx) * (oy - ky) - (zy - ky) * (ox - kx)) / dok;
    if (abs(cross) < 0.0005) { cross = 0; }
    line = "Центр Z лежит на прямой OK (оси Брокара): KZ / KO = " + format(((zx - kx) * (ox - kx) + (zy - ky) * (oy - ky)) / (dok * dok), 3) + ", расстояние от Z до прямой OK равно " + num(cross, 3) + ".";
  } else {
    line = "Здесь O и K совпали (треугольник почти равносторонний), и центры всех окружностей Тукера — та же точка.";
  }
  string kind = "";
  if (k > 0.995) { kind = " При k = 1 шесть точек сливаются с вершинами — это описанная окружность."; }
  info = "**Окружность Тукера** проходит через шесть точек на сторонах треугольника — вершины шестиугольника T₁…T₆, у которого стороны T₁T₂, T₃T₄, T₅T₆ параллельны сторонам BC, CA, AB, а остальные три им антипараллельны. Здесь AT₁ = k · AB, k = " + format(k, 2) + "." + kind + "\n\n**Радиус** окружности (синяя) r = " + format(rz, 2) + "; описанная окружность имеет R = " + format(dist(ox, oy, ax, ay), 2) + ". Отклонение расстояний от Z до точек T₂, T₄, T₆ от r: " + format(dev, 4) + ".\n\n" + line;
}
]
