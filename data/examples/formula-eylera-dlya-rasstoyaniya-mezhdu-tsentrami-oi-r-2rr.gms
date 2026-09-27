[
description = "{info}"

field width = 18;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины и фигура целиком перетаскиваются; ход, который
// вырождает треугольник (стороны короче касания точек, угол меньше 8°) или выводит
// вершину за поле, обрезается со скольжением ----
new Point { name = "A"; pos = (-4, -2.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.5, -2.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 2.5); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }

// ---- Описанная окружность (центр O, радиус R) и вписанная (центр I, радиус r) ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; text = true("O"); color = #3b82f6 }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; text = true("I"); color = #f59e0b }
new Circle { name = "circ"; center = O; radius = A; color = #3b82f6; thickness = 2 }
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; size = 0.5; color = #f59e0b }
new Circle { name = "inc"; center = I; radius = T; color = #f59e0b; thickness = 2 }
new Line { name = "oi"; pos = (O, I); thickness = 3; interact = false }
new Line { name = "oa"; pos = (O, A); color = #3b82f6; interact = false }
new Line { name = "it"; pos = (I, T); color = #f59e0b; interact = false }

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

float fx = 0; float fy = 0;


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
  // Центр вписанной окружности: I = (aA + bB + cC) / (a + b + c)
  I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / (a + b + c); I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / (a + b + c);
  // Центр описанной окружности
  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float dd = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  O.pos.x = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / dd;
  O.pos.y = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / dd;
  // Точка касания вписанной окружности со стороной AB — основание перпендикуляра из I
  float ux = bx - ax; float uy = by - ay; float k = ((I.pos.x - ax) * ux + (I.pos.y - ay) * uy) / (ux * ux + uy * uy);
  T.pos.x = ax + k * ux; T.pos.y = ay + k * uy;
  float R = sqrt((ax - O.pos.x) ^ 2 + (ay - O.pos.y) ^ 2);
  float r = sqrt((T.pos.x - I.pos.x) ^ 2 + (T.pos.y - I.pos.y) ^ 2);
  float d = oi.length;
  info = "**Формула Эйлера:** расстояние d между центрами описанной (O) и вписанной (I) окружностей треугольника связано с их радиусами: d² = R² − 2Rr. Отсюда неравенство Эйлера R ≥ 2r (равенство — только у равностороннего треугольника).\n\nR = " + format(R, 2) + ", r = " + format(r, 2) + ":   d² = " + format(d * d, 3) + ",   R² − 2Rr = " + format(R * R - 2 * R * r, 3) + ".";
}
]
