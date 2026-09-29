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
// Ортотреугольник: вершины — основания высот A₁, B₁, C₁. H — ортоцентр.
new Point { name = "H"; pos = (0, 0); dynamic = false; collision = false; size = 0.7; text = true("H"); color = #f59e0b }
new Point { name = "N"; pos = (0, 0); dynamic = false; collision = false; size = 0.1; active = false }
new Point { name = "U1"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("A₁") }
new Point { name = "U2"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("B₁") }
new Point { name = "U3"; pos = (0, 0); dynamic = false; collision = false; size = 0.6; text = true("C₁") }
new Line { name = "ha"; pos = (A, U1); interact = false; thickness = 1 }
new Line { name = "hb"; pos = (B, U2); interact = false; thickness = 1 }
new Line { name = "hc"; pos = (C, U3); interact = false; thickness = 1 }
new Line { name = "t1"; pos = (U1, U2); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t2"; pos = (U2, U3); interact = false; thickness = 2; color = #3b82f6 }
new Line { name = "t3"; pos = (U3, U1); interact = false; thickness = 2; color = #3b82f6 }
new Circle { name = "nc"; center = N; radius = U1; thickness = 1 }
new UI { name = "bAc"; type = button; label = "Остроугольный"; action = "snap = 1" }
new UI { name = "bRt"; type = button; label = "Прямоугольный"; action = "snap = 2" }
new UI { name = "bOb"; type = button; label = "Тупоугольный"; action = "snap = 3" }

// ---- Логика ----
string info = "";
float pAx = 0; float pAy = 0; float pBx = 0; float pBy = 0; float pCx = 0; float pCy = 0;
float sx = 0; float sy = 0; float qx = 0; float qy = 0; float fx = 0; float fy = 0;
float snap = 0;
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
  if (snap > 0) {
    if (snap == 1) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 5; B.pos.y = -3; C.pos.x = -1; C.pos.y = 4; }
    if (snap == 2) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 5; B.pos.y = -3; C.pos.x = -1.4; C.pos.y = 1.8; }
    if (snap == 3) { A.pos.x = -5; A.pos.y = -3; B.pos.x = 3; B.pos.y = -3; C.pos.x = 5.5; C.pos.y = 3; }
    pAx = A.pos.x; pAy = A.pos.y; pBx = B.pos.x; pBy = B.pos.y; pCx = C.pos.x; pCy = C.pos.y;
    snap = 0;
  }

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
  foot(ax, ay, bx, by, cx, cy); float haX = fx; float haY = fy;
  foot(bx, by, cx, cy, ax, ay); float hbX = fx; float hbY = fy;
  foot(cx, cy, ax, ay, bx, by); float hcX = fx; float hcY = fy;
  H.pos.x = hx; H.pos.y = hy;
  N.pos.x = nx; N.pos.y = ny;
  U1.pos.x = haX; U1.pos.y = haY;
  U2.pos.x = hbX; U2.pos.y = hbY;
  U3.pos.x = hcX; U3.pos.y = hcY;
  float cosA = (b * b + c * c - a * a) / (2 * b * c);
  float cosB = (a * a + c * c - b * b) / (2 * a * c);
  float cosC = (a * a + b * b - c * c) / (2 * a * b);
  float s1 = sqrt((hbX - hcX) ^ 2 + (hbY - hcY) ^ 2); float s2 = sqrt((hcX - haX) ^ 2 + (hcY - haY) ^ 2); float s3 = sqrt((haX - hbX) ^ 2 + (haY - hbY) ^ 2);
  float so = abs((hbX - haX) * (hcY - haY) - (hbY - haY) * (hcX - haX)) / 2;
  float acuteF = 0;
  if (cosA > 0.001 && cosB > 0.001 && cosC > 0.001) { acuteF = 1; }
  if (abs(cosA) < 0.01 || abs(cosB) < 0.01 || abs(cosC) < 0.01) {
    info = "**Треугольник прямоугольный:** высоты из вершин острых углов совпадают с катетами, основания всех трёх высот лежат в вершине прямого угла, ортотреугольник вырождается в отрезок (площадь " + format(so, 2) + ").";
  } else {
    info = "**Стороны ортотреугольника** равны a·|cos A|, b·|cos B|, c·|cos C|: B₁C₁ = " + format(s1, 2) + " = " + format(a * abs(cosA), 2) + ", C₁A₁ = " + format(s2, 2) + " = " + format(b * abs(cosB), 2) + ", A₁B₁ = " + format(s3, 2) + " = " + format(c * abs(cosC), 2) + ".\n\n**Площадь** 2S·|cos A · cos B · cos C| = " + format(2 * S * abs(cosA * cosB * cosC), 2) + ", у треугольника A₁B₁C₁ она равна " + format(so, 2) + ".\n\n**Вершины лежат на окружности девяти точек** (центр N, радиус R/2 = " + format(R / 2, 2) + ").";
    if (acuteF > 0.5) {
      info = info + "\n\n**Треугольник остроугольный:** ортотреугольник вписан в него, его углы 180° − 2A = " + format(180 - 2 * ang(ax, ay, bx, by, cx, cy), 1) + "°, 180° − 2B = " + format(180 - 2 * ang(bx, by, cx, cy, ax, ay), 1) + "°, 180° − 2C = " + format(180 - 2 * ang(cx, cy, ax, ay, bx, by), 1) + "°; периметр 2S/R = " + format(2 * S / R, 2) + " = " + format(s1 + s2 + s3, 2) + ".";
    } else {
      info = info + "\n\n**Треугольник тупоугольный:** два основания высот лежат на продолжениях сторон, ортотреугольник частично выходит за пределы треугольника, ортоцентр H — вне его.";
    }
  }

}
]
