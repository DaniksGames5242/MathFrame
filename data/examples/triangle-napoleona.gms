[
description = "{info}"

field width = 20;
field height = 12;
camera type = fixed;

// ---- Треугольник ABC: все вершины, стороны и фигура целиком перетаскиваются ----
new Point { name = "A"; pos = (-3.5, -1.5); text = true("A"); pauseOnDrag = false }
new Point { name = "B"; pos = (3.5, -1.5); text = true("B"); pauseOnDrag = false }
new Point { name = "C"; pos = (-0.5, 3); text = true("C"); pauseOnDrag = false }
new Line { name = "ab"; pos = (A, B) }
new Line { name = "bc"; pos = (B, C) }
new Line { name = "ca"; pos = (C, A) }
new Figure { name = "tri"; elements = (ab, bc, ca) }
// Треугольник Наполеона: центры равносторонних треугольников, построенных на сторонах. Внешние или внутренние.
new Point { name = "G"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("G"); color = #f59e0b }
new Point { name = "N1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("A₁") }
new Point { name = "N2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("B₁") }
new Point { name = "N3"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("C₁") }
new Point { name = "T1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; active = false }
new Point { name = "T2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; active = false }
new Point { name = "T3"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; active = false }
new Line { name = "e1"; pos = (B, T1); interact = false; thickness = 1 }
new Line { name = "e2"; pos = (C, T1); interact = false; thickness = 1 }
new Line { name = "e3"; pos = (C, T2); interact = false; thickness = 1 }
new Line { name = "e4"; pos = (A, T2); interact = false; thickness = 1 }
new Line { name = "e5"; pos = (A, T3); interact = false; thickness = 1 }
new Line { name = "e6"; pos = (B, T3); interact = false; thickness = 1 }
new Line { name = "t1"; pos = (N1, N2); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t2"; pos = (N2, N3); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t3"; pos = (N3, N1); interact = false; thickness = 2; color = #3b82f6 }
new UI { name = "bOut"; type = button; label = "Внешние"; action = "mode = 1" }
new UI { name = "bIn"; type = button; label = "Внутренние"; action = "mode = -1" }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0; float fx = 0; float fy = 0;
float snap = 0; float mode = 1;
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
  float sg = 1;
  if ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax) < 0) { sg = -1; }
  float k3 = sqrt(3);
  float m1x = (bx + cx) / 2; float m1y = (by + cy) / 2; float n1x = sg * (cy - by) / a; float n1y = -sg * (cx - bx) / a;
  float m2x = (cx + ax) / 2; float m2y = (cy + ay) / 2; float n2x = sg * (ay - cy) / b; float n2y = -sg * (ax - cx) / b;
  float m3x = (ax + bx) / 2; float m3y = (ay + by) / 2; float n3x = sg * (by - ay) / c; float n3y = -sg * (bx - ax) / c;
  N1.pos.x = m1x + mode * n1x * a / (2 * k3); N1.pos.y = m1y + mode * n1y * a / (2 * k3);
  N2.pos.x = m2x + mode * n2x * b / (2 * k3); N2.pos.y = m2y + mode * n2y * b / (2 * k3);
  N3.pos.x = m3x + mode * n3x * c / (2 * k3); N3.pos.y = m3y + mode * n3y * c / (2 * k3);
  T1.pos.x = m1x + mode * n1x * a * k3 / 2; T1.pos.y = m1y + mode * n1y * a * k3 / 2;
  T2.pos.x = m2x + mode * n2x * b * k3 / 2; T2.pos.y = m2y + mode * n2y * b * k3 / 2;
  T3.pos.x = m3x + mode * n3x * c * k3 / 2; T3.pos.y = m3y + mode * n3y * c * k3 / 2;
  G.pos.x = gx; G.pos.y = gy;
  float l1 = t1.length; float l2 = t2.length; float l3 = t3.length;
  float q2s = a * a + b * b + c * c;
  float sOut = k3 / 24 * q2s + S / 2; float sIn = max(0, k3 / 24 * q2s - S / 2);
  float ss = q2s / 6 + mode * 2 * S / k3;
  float cxn = (N1.pos.x + N2.pos.x + N3.pos.x) / 3; float cyn = (N1.pos.y + N2.pos.y + N3.pos.y) / 3;
  string nm = "внешний";
  if (mode < 0) { nm = "внутренний"; }
  string sgn = "+";
  if (mode < 0) { sgn = "−"; }
  info = "**" + nm + " треугольник Наполеона равносторонний** при любом треугольнике ABC: A₁B₁ = " + format(l3, 3) + ", B₁C₁ = " + format(l1, 3) + ", C₁A₁ = " + format(l2, 3) + ".\n\n**Его центр совпадает с центроидом G** исходного треугольника: расстояние от G до центра " + format(sqrt((cxn - gx) ^ 2 + (cyn - gy) ^ 2), 3) + ".\n\n**Сторона:** s² = (a² + b² + c²)/6 " + sgn + " 2S/√3 = " + format(ss, 2) + ", измеренная s² = " + format(l1 * l1, 2) + ".\n\n**Площади:** внешний " + format(sOut, 2) + ", внутренний " + format(sIn, 2) + ", разность " + format(sOut - sIn, 2) + " равна площади S = " + format(S, 2) + " исходного треугольника.";

}
]
