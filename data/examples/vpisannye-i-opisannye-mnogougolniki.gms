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

// ---- Описанная окружность (центр O, синяя) и вписанная (центр I, зелёная) — одновременно ----
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.55; text = true("O") }
new Point { name = "I"; pos = (0, 0); dynamic = false; collision = false; size = 0.55; text = true("I") }
new Point { name = "T"; pos = (0, 0); dynamic = false; collision = false; size = 0; color = "transparent" }
new Circle { name = "wO"; center = O; radius = A; color = #3b82f6; thickness = 2 }
new Circle { name = "wI"; center = I; radius = T; color = #22c55e; thickness = 2 }
new Line { name = "oi"; pos = (O, I); interact = false; active = false }
draw Punctir { name = "eoi"; edge = "oi" }

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

  // Описанная окружность — пересечение серединных перпендикуляров
  float mabx = (A.pos.x + B.pos.x) / 2; float maby = (A.pos.y + B.pos.y) / 2;
  float mbcx = (B.pos.x + C.pos.x) / 2; float mbcy = (B.pos.y + C.pos.y) / 2;
  float d1x = -(B.pos.y - A.pos.y); float d1y = B.pos.x - A.pos.x;
  float d2x = -(C.pos.y - B.pos.y); float d2y = C.pos.x - B.pos.x;
  float k = ((mbcx - mabx) * d2y - (mbcy - maby) * d2x) / (d1x * d2y - d1y * d2x + 0.0000000001);
  O.pos.x = mabx + k * d1x; O.pos.y = maby + k * d1y;
  float R = sqrt((A.pos.x - O.pos.x) ^ 2 + (A.pos.y - O.pos.y) ^ 2);

  // Вписанная окружность — точка пересечения биссектрис, взвешенная по длинам сторон
  float a = bc.length; float b = ca.length; float c = ab.length;
  float per = a + b + c; float p = per / 2;
  I.pos.x = (a * A.pos.x + b * B.pos.x + c * C.pos.x) / per;
  I.pos.y = (a * A.pos.y + b * B.pos.y + c * C.pos.y) / per;
  foot(I.pos.x, I.pos.y, A.pos.x, A.pos.y, B.pos.x, B.pos.y); T.pos.x = fx; T.pos.y = fy;
  float r = sqrt((I.pos.x - T.pos.x) ^ 2 + (I.pos.y - T.pos.y) ^ 2);

  float OI2 = (O.pos.x - I.pos.x) ^ 2 + (O.pos.y - I.pos.y) ^ 2;

  info = "**Для треугольника обе окружности существуют всегда и единственны.** Синяя — описанная (центр O, проходит через вершины), зелёная — вписанная (центр I, касается сторон). В общем случае O ≠ I; они совпадают только в равностороннем треугольнике.\n\n**Формула Эйлера:** OI² = R² − 2Rr: " + format(OI2, 2) + " ≈ " + format(R * R - 2 * R * r, 2) + " (R = " + format(R, 2) + ", r = " + format(r, 2) + "). Отсюда всегда R ≥ 2r.";
}
]
