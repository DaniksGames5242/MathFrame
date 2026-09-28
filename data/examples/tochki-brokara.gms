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

// ---- Точки Брокара и лучи к вершинам (обход по часовой — F1, против — F2) ----
new Point { name = "F1"; pos = (0, 0); dynamic = false; collision = false; text = true("Ω₁"); color = #3b82f6 }
new Point { name = "F2"; pos = (0, 0); dynamic = false; collision = false; text = true("Ω₂"); color = #f59e0b }
new Line { name = "af1"; pos = (A, F1); interact = false }
new Line { name = "bf1"; pos = (B, F1); interact = false }
new Line { name = "cf1"; pos = (C, F1); interact = false }
new Line { name = "af2"; pos = (A, F2); interact = false }
new Line { name = "bf2"; pos = (B, F2); interact = false }
new Line { name = "cf2"; pos = (C, F2); interact = false }

new Claster { name = "tab1"; elements = (af1, bf1, cf1); active = true }
new Claster { name = "tab2"; elements = (af2, bf2, cf2); active = false }

new UI { name = "btn1"; type = button; label = "Первая точка"; action = "tab = 1; tab1.active = true; tab2.active = false" }
new UI { name = "btn2"; type = button; label = "Вторая точка"; action = "tab = 2; tab1.active = false; tab2.active = true" }

// ---- Логика ----
float tab = 1;
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

  // Барицентрические (= трилинейные × сторону) веса точек Брокара:
  // первая — трилинейно (c/b : a/c : b/a), вторая — (b/c : c/a : a/b).
  float u1 = a * c / b; float v1 = b * a / c; float w1 = c * b / a; float s1 = u1 + v1 + w1;
  F1.pos.x = (u1 * A.pos.x + v1 * B.pos.x + w1 * C.pos.x) / s1;
  F1.pos.y = (u1 * A.pos.y + v1 * B.pos.y + w1 * C.pos.y) / s1;

  float u2 = a * b / c; float v2 = b * c / a; float w2 = c * a / b; float s2 = u2 + v2 + w2;
  F2.pos.x = (u2 * A.pos.x + v2 * B.pos.x + w2 * C.pos.x) / s2;
  F2.pos.y = (u2 * A.pos.y + v2 * B.pos.y + w2 * C.pos.y) / s2;

  // Угол Брокара из cot ω = cot A + cot B + cot C.
  float cosA = (b ^ 2 + c ^ 2 - a ^ 2) / (2 * b * c); float sinA = sqrt(1 - cosA ^ 2);
  float cosB = (a ^ 2 + c ^ 2 - b ^ 2) / (2 * a * c); float sinB = sqrt(1 - cosB ^ 2);
  float cosC = (a ^ 2 + b ^ 2 - c ^ 2) / (2 * a * b); float sinC = sqrt(1 - cosC ^ 2);
  float cotSum = cosA / sinA + cosB / sinB + cosC / sinC;
  float omega = atan(1 / cotSum) * 180 / pi;

  if (tab == 1) {
    info = "**Первая точка Брокара Ω₁** — точка, из которой отрезки к вершинам образуют с прилежащими сторонами равные углы ∠Ω₁AB = ∠Ω₁BC = ∠Ω₁CA = ω ≈ " + format(omega, 1) + "° (обход по часовой стрелке).\n\n**Барицентрические координаты** (ac/b : ab/c : bc/a) = (" + format(u1, 2) + " : " + format(v1, 2) + " : " + format(w1, 2) + ").";
  } else {
    info = "**Вторая точка Брокара Ω₂** — та же величина угла ω ≈ " + format(omega, 1) + "°, но обход вершин против часовой стрелки: ∠Ω₂BA = ∠Ω₂CB = ∠Ω₂AC = ω. Обе точки — изогонально сопряжённые друг другу.\n\n**Барицентрические координаты** (ab/c : bc/a : ac/b) = (" + format(u2, 2) + " : " + format(v2, 2) + " : " + format(w2, 2) + ").";
  }
}
]
