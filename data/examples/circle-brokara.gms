[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины, стороны и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-6, -3.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (5, -3.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-1.5, 4); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
// Окружность Брокара: точка O — центр описанной окружности, K — симедианная точка, Ω₁ и Ω₂ — точки Брокара.
new Point { name = "O"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("O") }
new Point { name = "K"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("K"); color = #f59e0b }
new Point { name = "P1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("Ω₁") }
new Point { name = "P2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("Ω₂") }
new Point { name = "Z"; pos = (0, 0); dynamic = false; collision = false; size = 0.1; active = false }
new Point { name = "E1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; active = false }
new Point { name = "E2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; active = false }
new Circle { name = "cc"; center = O; radius = A; thickness = 1 }
new Circle { name = "brc"; center = Z; radius = P1; thickness = 2; color = #3b82f6 }
new Line { name = "axl"; pos = (E1, E2); interact = false; thickness = 1; active = axOn > 0.5 }
new Line { name = "l1"; pos = (A, P1); interact = false; thickness = 1 }
new Line { name = "l2"; pos = (B, P1); interact = false; thickness = 1 }
new Line { name = "l3"; pos = (C, P1); interact = false; thickness = 1 }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0; float fx = 0; float fy = 0;
float axOn = 1; float snap = 0;
Function num(x, d) { if (x < 0) { return "−" + format(-x, d); } return format(x, d); }
Function inField(x, y) { return abs(x) <= fieldMaxX + 0.000001 && abs(y) <= fieldMaxY + 0.000001; }
// Треугольник допустим: вершины в поле, стороны не короче касания точек, все углы от 14° до 166°
Function okNow(x1, y1, x2, y2, x3, y3) {
  if (!inField(x1, y1) || !inField(x2, y2) || !inField(x3, y3)) { return false; }
  float a = sqrt((x2 - x3) ^ 2 + (y2 - y3) ^ 2);
  float b = sqrt((x3 - x1) ^ 2 + (y3 - y1) ^ 2);
  float c = sqrt((x1 - x2) ^ 2 + (y1 - y2) ^ 2);
  if (a < 0.35 || b < 0.35 || c < 0.35) { return false; }
  float k = abs((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));
  return k / (b * c) >= 0.25 && k / (a * c) >= 0.25 && k / (a * b) >= 0.25;
}
// Допустим ли сдвиг вершин с флагами fa, fb, fc на вектор (ux, uy) от прежнего положения
Function okT(fa, fb, fc, ux, uy) {
  return okNow(pAx + fa * ux, pAy + fa * uy, pBx + fb * ux, pBy + fb * uy, pCx + fc * ux, pCy + fc * uy);
}
// Наибольшая доля t хода (dx, dy) от смещения (x0, y0), до которой весь путь допустим
// (16 промежуточных точек, чтобы быстрый ход не перепрыгнул запрещённую зону, затем деление пополам)
Function reach(fa, fb, fc, x0, y0, dx, dy) {
  float good = 0; float bad = 2;
  repeat (16) {
    if (bad > 1) {
      if (okT(fa, fb, fc, x0 + dx * (i + 1) / 16, y0 + dy * (i + 1) / 16)) { good = (i + 1) / 16; } else { bad = (i + 1) / 16; }
    }
  }
  if (bad > 1) { return 1; }
  repeat (12) {
    float mid = (good + bad) / 2;
    if (okT(fa, fb, fc, x0 + dx * mid, y0 + dy * mid)) { good = mid; } else { bad = mid; }
  }
  return good;
}
// Плавный ход: допустимая часть сдвига, остаток — отдельно по x и по y. Результат в (sx, sy)
Function slide(fa, fb, fc, ux, uy) {
  float t = reach(fa, fb, fc, 0, 0, ux, uy);
  float cx = ux * t; float cy = uy * t;
  if (t < 1) {
    float rx = ux - cx; float ry = uy - cy;
    cx = cx + rx * reach(fa, fb, fc, cx, cy, rx, 0);
    cy = cy + ry * reach(fa, fb, fc, cx, cy, 0, ry);
  }
  sx = cx; sy = cy;
  return 0;
}
// Центр окружности через три точки → (qx, qy)
Function circ(ax, ay, bx, by, cx, cy) {
  float d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  qx = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  qy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return 0;
}
// Основание перпендикуляра из (px, py) на прямую (ax, ay)–(bx, by) → (fx, fy)
Function foot(px, py, ax, ay, bx, by) {
  float dx = bx - ax; float dy = by - ay;
  float k = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy + 0.000000001);
  fx = ax + k * dx; fy = ay + k * dy;
  return 0;
}
// Угол при вершине (px, py) между лучами к (qx1, qy1) и (rx, ry), градусы
Function ang(px, py, x1, y1, x2, y2) {
  float ux = x1 - px; float uy = y1 - py; float vx = x2 - px; float vy = y2 - py;
  float c = (ux * vx + uy * vy) / (sqrt(ux * ux + uy * uy) * sqrt(vx * vx + vy * vy) + 0.000000001);
  return acos(max(-1, min(1, c))) * 180 / pi;
}

Start { pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;  }

Update {

  // Ход вершин: одна вершина — сама по себе, две (сторона) — сдвиг на общий вектор, три —
  // перенос фигуры целиком (границу поля держит движок). Недопустимый ход обрезается со скольжением.
  float dAx = A.pos.x - pAx; float dAy = A.pos.y - pAy;
  float dBx = B.pos.x - pBx; float dBy = B.pos.y - pBy;
  float dCx = C.pos.x - pCx; float dCy = C.pos.y - pCy;
  float fa = 0; float fb = 0; float fc = 0;
  if (abs(dAx) + abs(dAy) > 0.000001) { fa = 1; }
  if (abs(dBx) + abs(dBy) > 0.000001) { fb = 1; }
  if (abs(dCx) + abs(dCy) > 0.000001) { fc = 1; }
  float nm = fa + fb + fc;
  if (nm == 1 || nm == 2) {
    float ux = dCx; float uy = dCy;
    if (fb == 1) { ux = dBx; uy = dBy; }
    if (fa == 1) { ux = dAx; uy = dAy; }
    slide(fa, fb, fc, ux, uy);
    A.pos.x = pAx + fa * sx; A.pos.y = pAy + fa * sy;
    B.pos.x = pBx + fb * sx; B.pos.y = pBy + fb * sy;
    C.pos.x = pCx + fc * sx; C.pos.y = pCy + fc * sy;
  }
  // Страховка: недопустимый кадр — возврат к последнему корректному положению
  if (!okNow(A.pos.x, A.pos.y, B.pos.x, B.pos.y, C.pos.x, C.pos.y)) {
    A.pos.x = pAx; A.pos.y = pAy; B.pos.x = pBx; B.pos.y = pBy; C.pos.x = pCx; C.pos.y = pCy;
  }
  pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;

  float ax = A.pos.x; float ay = A.pos.y; float bx = B.pos.x; float by = B.pos.y; float cx = C.pos.x; float cy = C.pos.y;
  float a = bc.length; float b = ca.length; float c = ab.length;
  float S = abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  circ(ax, ay, bx, by, cx, cy);
  float ox = qx; float oy = qy;
  float R = sqrt((ax - ox) ^ 2 + (ay - oy) ^ 2);
  float gx = (ax + bx + cx) / 3; float gy = (ay + by + cy) / 3;
  float hx = ax + bx + cx - 2 * ox; float hy = ay + by + cy - 2 * oy;
  float nx = (ox + hx) / 2; float ny = (oy + hy) / 2;
  float a2 = a * a; float b2 = b * b; float c2 = c * c; float sm = a2 + b2 + c2;
  float kx = (a2 * ax + b2 * bx + c2 * cx) / sm; float ky = (a2 * ay + b2 * by + c2 * cy) / sm;
  float w1 = a2 * c2; float w2 = a2 * b2; float w3 = b2 * c2; float ws = w1 + w2 + w3;
  float p1x = (w1 * ax + w2 * bx + w3 * cx) / ws; float p1y = (w1 * ay + w2 * by + w3 * cy) / ws;
  float p2x = (w2 * ax + w3 * bx + w1 * cx) / ws; float p2y = (w2 * ay + w3 * by + w1 * cy) / ws;
  float zx = (ox + kx) / 2; float zy = (oy + ky) / 2;
  O.pos.x = ox; O.pos.y = oy;
  K.pos.x = kx; K.pos.y = ky;
  P1.pos.x = p1x; P1.pos.y = p1y;
  P2.pos.x = p2x; P2.pos.y = p2y;
  Z.pos.x = zx; Z.pos.y = zy;
  float d = sqrt((kx - ox) ^ 2 + (ky - oy) ^ 2);
  axOn = 0;
  if (d > 0.05) {
    axOn = 1;
    float ex = (kx - ox) / d; float ey = (ky - oy) / d;
    E1.pos.x = ox - 40 * ex; E1.pos.y = oy - 40 * ey; E2.pos.x = ox + 40 * ex; E2.pos.y = oy + 40 * ey;
  }
  float w = atan(4 * S / sm) * 180 / pi;
  float u1 = ang(ax, ay, p1x, p1y, bx, by); float u2 = ang(bx, by, p1x, p1y, cx, cy); float u3 = ang(cx, cy, p1x, p1y, ax, ay);
  float rb = d / 2;
  float rb1 = sqrt((p1x - zx) ^ 2 + (p1y - zy) ^ 2); float rb2 = sqrt((p2x - zx) ^ 2 + (p2y - zy) ^ 2);
  info = "**Угол Брокара** ω одинаков для всех вершин: ∠Ω₁AB = " + format(u1, 2) + "°, ∠Ω₁BC = " + format(u2, 2) + "°, ∠Ω₁CA = " + format(u3, 2) + "°. Он определяется сторонами: ctg ω = (a² + b² + c²)/(4S) = " + format(sm / (4 * S), 2) + ", откуда ω = " + format(w, 2) + "°.\n\n**Окружность Брокара** проходит через обе точки Брокара Ω₁, Ω₂, центр описанной окружности O и симедианную точку K; отрезок OK — её диаметр. Радиус OK/2 = " + format(rb, 2) + ", расстояния от центра до Ω₁ и Ω₂ — " + format(rb1, 2) + " и " + format(rb2, 2) + ".";
  if (d <= 0.05) { info = info + "\n\nТреугольник почти равносторонний: O и K совпадают, окружность Брокара стягивается в точку, ось Брокара OK не определена."; }

}
]
