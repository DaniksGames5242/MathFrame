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

// ---- Первая точка Брокара и три равных угла наклона к сторонам ----
new Point { name = "F"; pos = (0, 0); dynamic = false; collision = false; text = true("Ω") }
new Line { name = "af"; pos = (A, F); interact = false }
new Line { name = "bf"; pos = (B, F); interact = false }
new Line { name = "cf"; pos = (C, F); interact = false }
new Angle { name = "wA"; lines = (af, ab) }
new Angle { name = "wB"; lines = (bf, bc) }
new Angle { name = "wC"; lines = (cf, ca) }
draw Angle { name = "arcA"; angle = "wA"; measure = false; color = #f59e0b }
draw Angle { name = "arcB"; angle = "wB"; measure = false; color = #f59e0b }
draw Angle { name = "arcC"; angle = "wC"; measure = false; color = #f59e0b }

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

  // Первая точка Брокара: барицентрические веса (ac/b : ab/c : bc/a).
  float u = a * c / b; float v = b * a / c; float w = c * b / a; float sw = u + v + w;
  F.pos.x = (u * A.pos.x + v * B.pos.x + w * C.pos.x) / sw;
  F.pos.y = (u * A.pos.y + v * B.pos.y + w * C.pos.y) / sw;

  // Угол Брокара по формуле cot ω = cot A + cot B + cot C.
  float cosA = (b ^ 2 + c ^ 2 - a ^ 2) / (2 * b * c); float sinA = sqrt(1 - cosA ^ 2);
  float cosB = (a ^ 2 + c ^ 2 - b ^ 2) / (2 * a * c); float sinB = sqrt(1 - cosB ^ 2);
  float cosC = (a ^ 2 + b ^ 2 - c ^ 2) / (2 * a * b); float sinC = sqrt(1 - cosC ^ 2);
  float cotSum = cosA / sinA + cosB / sinB + cosC / sinC;
  float omega = atan(1 / cotSum) * 180 / pi;

  info = "**Угол Брокара ω** — общая величина трёх равных углов наклона отрезков от точки Ω к вершинам к прилежащим сторонам: ∠ΩAB = ∠ΩBC = ∠ΩCA = " + format(wA.measure, 1) + "° ≈ " + format(wB.measure, 1) + "° ≈ " + format(wC.measure, 1) + "°.\n\n**По формуле** ctg ω = ctg A + ctg B + ctg C = " + format(cotSum, 3) + " получаем ω ≈ " + format(omega, 1) + "° — угол всегда строго меньше 30°, приближаясь к этому пределу лишь у равностороннего треугольника.";
}
]
